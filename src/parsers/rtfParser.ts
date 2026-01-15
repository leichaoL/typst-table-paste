import { ParsedTable, TableCell, TableRow } from '../utils/types';

/**
 * 清理单元格文本，移除 RTF 格式化代码
 * @param text 原始文本
 * @returns 清理后的文本
 */
function cleanCellText(text: string): string {
  // 1. 处理上标（显著性星号和其他上标内容）
  // 保留星号和内容，移除 RTF 上标标记
  text = text.replace(/\{\\super\s+([*]+)\}/g, '$1');
  text = text.replace(/\\super\s+([*]+)/g, '$1');
  text = text.replace(/\{\\super\s+(.*?)\}/g, '$1');  // 其他上标内容

  // 2. 处理下标
  text = text.replace(/\{\\sub\s+(.*?)\}/g, '$1');
  text = text.replace(/\\sub\s+(.*?)\s/g, '$1 ');

  // 3. 处理加粗、斜体、下划线（保留内容，移除格式标记）
  text = text.replace(/\{\\b\s+(.*?)\}/g, '$1');
  text = text.replace(/\{\\i\s+(.*?)\}/g, '$1');
  text = text.replace(/\{\\ul\s+(.*?)\}/g, '$1');

  // 4. 处理 RTF 特殊字符转义
  text = text.replace(/\\-/g, '-');      // 软连字符
  text = text.replace(/\\_/g, '_');      // 下划线
  text = text.replace(/\\~/g, ' ');      // 非断空格
  text = text.replace(/\\\\/g, '\\');    // 反斜杠
  text = text.replace(/\\\{/g, '{');     // 左花括号
  text = text.replace(/\\\}/g, '}');     // 右花括号

  // 5. 处理括号和方括号
  text = text.replace(/\\\(/g, '(');
  text = text.replace(/\\\)/g, ')');
  text = text.replace(/\\\[/g, '[');
  text = text.replace(/\\\]/g, ']');

  // 6. 移除其他 RTF 命令（但保留其后的内容）
  text = text.replace(/\\[a-z]+\d*\s?/gi, '');

  // 7. 移除花括号
  text = text.replace(/[{}]/g, '');

  return text.trim();
}

/**
 * 从行内容中提取单元格
 * @param rowContent RTF 行内容
 * @returns 单元格内容数组
 */
function extractCells(rowContent: string): string[] {
  const cells: string[] = [];

  // 方法1: Stata 格式 - \pard\intbl...{content}\cell
  const stataPattern = /\\pard\\intbl[^{]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\\cell/g;
  let match;

  while ((match = stataPattern.exec(rowContent)) !== null) {
    const cellContent = match[1];
    const cleaned = cleanCellText(cellContent);
    cells.push(cleaned);
  }

  // 如果 Stata 格式没有找到单元格，尝试 Word 格式
  if (cells.length === 0) {
    console.log('[RTF Parser] Using Word format parsing, row length:', rowContent.length);

    // 方法2: Word 格式
    // Word RTF 中，多个单元格可能在同一个段落中，格式如：
    // \pard...{\loch\f0 content1\cell \loch\f0 content2\cell ...}

    // 先找到所有 \cell 的位置（但排除 \cellx）
    const cellPositions: number[] = [];
    let pos = 0;
    while ((pos = rowContent.indexOf('\\cell', pos)) !== -1) {
      // 检查是否是 \cellx（列宽定义）而不是 \cell（单元格标记）
      const nextChar = rowContent.charAt(pos + 5); // 5 = '\cell'.length
      if (nextChar === 'x') {
        // 这是 \cellx，跳过
        pos += 6;
        continue;
      }
      cellPositions.push(pos);
      pos += 5; // length of '\cell'
    }

    console.log('[RTF Parser] Found', cellPositions.length, 'cell markers');

    // 对于每个 \cell，向前查找对应的文本内容
    let lastEnd = 0;
    for (let i = 0; i < cellPositions.length; i++) {
      const cellPos = cellPositions[i];
      const cellBlock = rowContent.substring(lastEnd, cellPos);

      // 跳过只包含表格定义的块（没有实际文本）
      if (!cellBlock.includes('\\loch\\f') && !cellBlock.includes('\\hich\\af')) {
        console.log(`[RTF Parser] Cell ${i}: Empty (no text markers)`);
        cells.push(''); // 空单元格
        lastEnd = cellPos + 5;
        continue;
      }

      // 提取文本内容
      const textParts: string[] = [];

      // 匹配 \loch\fN 后面的文本
      const lochPattern = /\\loch\\f\d+\s+([^\\\{]+?)(?=\\cell|\\loch|\\hich|\{|$)/g;
      let textMatch;

      while ((textMatch = lochPattern.exec(cellBlock)) !== null) {
        let text = textMatch[1].trim();
        // 移除可能的右花括号
        text = text.replace(/\}+$/, '').trim();
        if (text) {
          textParts.push(text);
        }
      }

      // 检查是否有上标内容（星号）
      const superPattern = /\\super[^\\]*\\loch\\f\d+\s+([*]+)/g;
      let superMatch;
      while ((superMatch = superPattern.exec(cellBlock)) !== null) {
        textParts.push(superMatch[1]);
      }

      const cellContent = textParts.join('').trim();
      console.log(`[RTF Parser] Cell ${i}: "${cellContent}"`);
      cells.push(cellContent);
      lastEnd = cellPos + 5;
    }
  } else {
    console.log('[RTF Parser] Using Stata format parsing');
  }

  console.log('[RTF Parser] Total cells extracted:', cells.length);
  return cells;
}

/**
 * 解析 RTF 表格
 * 支持 Stata 导出的 RTF 回归表格
 *
 * @param content RTF 内容
 * @returns 解析后的表格
 */
export async function parseRTF(content: string): Promise<ParsedTable> {
  const rows: TableRow[] = [];

  // RTF 表格有两种格式：
  // 1. Word 格式：每个逻辑行由多个 \trowd...\row 块组成，按 \irowN 编号
  // 2. Stata 格式：每个 \trowd...\row 块就是一行，没有 \irow 编号

  // 匹配所有 \trowd 块（到下一个 \trowd 或文件结束）
  const blockPattern = /\\trowd[\s\S]*?(?=\\trowd|\\par\\par|$)/g;
  const blocks = Array.from(content.matchAll(blockPattern));

  console.log(`[RTF Parser] Found ${blocks.length} table blocks`);

  // 检查是否有 irow 标记（Word 格式）
  const hasIrow = blocks.some(block => /\\irow\d+/.test(block[0]));

  if (hasIrow) {
    // Word 格式：按 irow 编号分组
    console.log('[RTF Parser] Detected Word format (with irow markers)');
    const rowGroups = new Map<number, string[]>();

    for (const block of blocks) {
      const blockContent = block[0];
      const irowMatch = blockContent.match(/\\irow(\d+)/);
      if (irowMatch) {
        const irowNum = parseInt(irowMatch[1]);
        if (!rowGroups.has(irowNum)) {
          rowGroups.set(irowNum, []);
        }
        rowGroups.get(irowNum)!.push(blockContent);
      }
    }

    // 按 irow 编号排序并处理每组
    const sortedRows = Array.from(rowGroups.entries()).sort((a, b) => a[0] - b[0]);

    for (const [irowNum, blockContents] of sortedRows) {
      // Word RTF: 每个逻辑行由多个块组成
      // 尝试从每个块中提取单元格，直到找到有内容的块
      let cellTexts: string[] = [];

      for (const block of blockContents) {
        cellTexts = extractCells(block);
        if (cellTexts.length > 0) {
          break; // 找到有内容的块，停止搜索
        }
      }

      if (cellTexts.length > 0) {
        const cells: TableCell[] = cellTexts.map(text => ({
          content: text,
          alignment: 'center' as const,
          hasTopBorder: false,
          hasBottomBorder: false,
          hasSuperscript: /\*+/.test(text)
        }));

        if (cells.length > 0) {
          cells[0].alignment = 'left';
        }

        rows.push({ cells });
      }
    }
  } else {
    // Stata 格式：每个块就是一行
    console.log('[RTF Parser] Detected Stata format (without irow markers)');

    for (let i = 0; i < blocks.length; i++) {
      const blockContent = blocks[i][0];
      const cellTexts = extractCells(blockContent);

      if (cellTexts.length > 0) {
        const cells: TableCell[] = cellTexts.map(text => ({
          content: text,
          alignment: 'center' as const,
          hasTopBorder: false,
          hasBottomBorder: false,
          hasSuperscript: /\*+/.test(text)
        }));

        if (cells.length > 0) {
          cells[0].alignment = 'left';
        }

        rows.push({ cells });
      }
    }
  }

  console.log(`[RTF Parser] Total rows parsed: ${rows.length}`);

  if (rows.length === 0) {
    throw new Error('No table found in RTF content. Please ensure the file contains a valid RTF table.');
  }

  const columnCount = Math.max(...rows.map(r => r.cells.length));

  return {
    rows,
    columnCount
  };
}

/**
 * 检测内容是否为 RTF 格式
 * @param content 内容
 * @returns 是否为 RTF
 */
export function isRTF(content: string): boolean {
  // RTF 文档以 {\rtf 开头
  return content.trim().startsWith('{\\rtf');
}

/**
 * 检测文件是否为 RTF 格式
 * @param filePath 文件路径
 * @returns 是否为 RTF 文件
 */
export function isRTFFile(filePath: string): boolean {
  const ext = filePath.toLowerCase();
  return ext.endsWith('.rtf');
}
