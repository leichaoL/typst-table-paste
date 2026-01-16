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

      // 提取文本内容 - 简化的方法
      let cellContent = '';

      // 首先尝试提取所有可见文本（在字体标记之后）
      // 匹配模式: \hich\af0\dbch\af31505\loch\f0 TEXT 或 \loch\f0 TEXT
      const textPattern = /(?:\\hich\\af\d+)?(?:\\dbch\\af\d+)?\\loch\\f\d+\s+([^\\\{]+?)(?=\\|$|\{)/g;
      let textMatch;
      const textParts: string[] = [];

      while ((textMatch = textPattern.exec(cellBlock)) !== null) {
        let text = textMatch[1].trim();
        // 移除尾部的 } 字符
        text = text.replace(/\}+$/g, '').trim();
        if (text && text.length > 0) {
          textParts.push(text);
        }
      }

      // 额外检查：查找可能被遗漏的数字（特别是 -0.00 这样的数字）
      // 匹配模式: \insrsid\d+ 后面跟数字（包括负号和小数点），然后是 }
      const numberPattern = /\\insrsid\d+\s+(-?\d+\.?\d*)\}/g;
      let numberMatch;
      while ((numberMatch = numberPattern.exec(cellBlock)) !== null) {
        const num = numberMatch[1].trim();
        if (num && !textParts.some(t => t.includes(num))) {
          // 将数字插入到开头（因为它通常在星号之前）
          textParts.unshift(num);
        }
      }

      // 如果只有星号，尝试更激进的数字搜索
      if (textParts.length === 1 && /^\*+$/.test(textParts[0])) {
        // 尝试查找任何数字模式
        const aggressiveNumberPattern = /(-?\d+\.?\d*)/g;
        const foundNumbers: string[] = [];
        let aggressiveMatch;
        while ((aggressiveMatch = aggressiveNumberPattern.exec(cellBlock)) !== null) {
          const num = aggressiveMatch[1];
          // 过滤掉明显是 RTF 控制代码的数字（如字体编号、ID等）
          if (num && num !== '0' && num !== '1' && !foundNumbers.includes(num)) {
            foundNumbers.push(num);
          }
        }
        if (foundNumbers.length > 0) {
          // 添加第一个找到的数字（通常是实际的数据）
          textParts.unshift(foundNumbers[0]);
        }
      }

      // 如果没有找到文本，检查是否是空单元格
      if (textParts.length === 0) {
        // 尝试查找纯文本数字（没有任何 RTF 标记的数字）
        // 这种情况出现在某些 Word RTF 文件中
        const plainTextPattern = /\s+(-?\d+\.?\d*)\s*$/;
        const plainMatch = cellBlock.match(plainTextPattern);
        if (plainMatch && plainMatch[1]) {
          const num = plainMatch[1];
          // 过滤掉明显是 RTF 控制代码的数字
          if (num !== '0' && num !== '1' && num.length <= 10) {
            textParts.push(num);
          }
        }
      }

      // 如果还是没有找到文本，标记为空单元格
      if (textParts.length === 0) {
        console.log(`[RTF Parser] Cell ${i}: Empty`);
        cells.push('');
        lastEnd = cellPos + 5;
        continue;
      }

      // 合并所有文本部分
      cellContent = textParts.join('').trim();

      // 清理文本（移除多余的空格和RTF控制字符）
      cellContent = cellContent.replace(/\s+/g, ' ').trim();

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
  const hasIrow = blocks.some(block => /\\irow\s*\d+/.test(block[0]));

  if (hasIrow) {
    // Word 格式：处理每个块，跳过没有单元格的块
    console.log('[RTF Parser] Detected Word format (with irow markers)');

    for (const block of blocks) {
      const blockContent = block[0];

      // 检查这个块是否包含实际的单元格标记（不是 \cellx）
      const hasCellMarkers = /\\cell(?!x)/.test(blockContent);

      if (!hasCellMarkers) {
        // 这是一个只包含表格定义的块，跳过
        console.log('[RTF Parser] Skipping block without cell markers');
        continue;
      }

      const cellTexts = extractCells(blockContent);

      if (cellTexts.length > 0 && cellTexts.some(c => c.trim() !== '')) {
        // 检测边框标记
        const hasTopBorder = /\\clbrdrt\\brdrs/.test(blockContent) || /\\brdrt\\brdrs/.test(blockContent);
        const hasBottomBorder = /\\clbrdrb\\brdrs/.test(blockContent) || /\\brdrb\\brdrs/.test(blockContent);

        const cells: TableCell[] = cellTexts.map(text => ({
          content: text,
          alignment: 'center' as const,
          hasTopBorder: hasTopBorder,
          hasBottomBorder: hasBottomBorder,
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
