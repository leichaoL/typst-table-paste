import { ParsedTable, TableRow, TableCell } from '../utils/types';

/**
 * Stata 表格类型
 */
type StataTableType = 'descriptive' | 'correlation' | 'regression';

/**
 * 检测内容是否为 Stata 表格
 * @param content 内容
 * @returns 是否为 Stata 表格
 */
export function isStataTable(content: string): boolean {
  const lines = content.trim().split(/\r?\n/).filter(l => l.length > 0);

  // 必须至少有 3 行（表头 + 分隔线 + 数据）
  if (lines.length < 3) {
    return false;
  }

  // 检测分隔线（10+ 个连续的短横线）
  const separatorLines = lines.filter(line => isSeparatorLine(line));
  if (separatorLines.length === 0) {
    return false;
  }

  // 检测是否有管道符分隔线（描述性/相关系数表格）或纯短横线（回归表格）
  const hasPipeSeparator = separatorLines.some(line => line.includes('+'));
  const hasAllDashSeparator = separatorLines.some(line => /^-+$/.test(line.trim()));

  if (!hasPipeSeparator && !hasAllDashSeparator) {
    return false;
  }

  // 验证表格结构：分隔线之间应该有内容行
  let hasContentBetweenSeparators = false;
  let lastSeparatorIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (isSeparatorLine(lines[i])) {
      if (lastSeparatorIndex !== -1 && i - lastSeparatorIndex > 1) {
        hasContentBetweenSeparators = true;
        break;
      }
      lastSeparatorIndex = i;
    }
  }

  // 如果有分隔线但没有内容在分隔线之间，检查分隔线后是否有内容
  if (!hasContentBetweenSeparators && lastSeparatorIndex !== -1) {
    hasContentBetweenSeparators = lastSeparatorIndex < lines.length - 1;
  }

  return hasContentBetweenSeparators;
}

/**
 * 检测是否为分隔线
 * @param line 行内容
 * @returns 是否为分隔线
 */
function isSeparatorLine(line: string): boolean {
  const trimmed = line.trim();

  // 至少包含 10 个连续的短横线或加号
  const dashPattern = /[-+]{10,}/;
  if (!dashPattern.test(trimmed)) {
    return false;
  }

  // 计算短横线和加号的比例
  const dashCount = (trimmed.match(/[-+]/g) || []).length;
  const ratio = dashCount / trimmed.length;

  // 如果超过 70% 是短横线或加号，认为是分隔线
  return ratio > 0.7;
}

/**
 * 检测列的位置（基于空白间隙）
 * @param text 文本内容
 * @returns 列的起始位置数组
 */
function detectColumnPositions(text: string): number[] {
  const positions: number[] = [0];
  let inGap = false;

  for (let i = 0; i < text.length; i++) {
    if (i < text.length - 1 && text[i] === ' ' && text[i + 1] === ' ') {
      if (!inGap) {
        // 找到间隙的开始
        inGap = true;
      }
    } else if (inGap && text[i] !== ' ') {
      // 找到间隙的结束 - 这是一个新列的开始
      positions.push(i);
      inGap = false;
    }
  }

  return positions;
}

/**
 * 根据位置提取列内容
 * @param text 文本内容
 * @param positions 列的起始位置数组
 * @returns 提取的列内容数组
 */
function extractColumnsByPosition(text: string, positions: number[]): string[] {
  const columns: string[] = [];

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i];
    const end = i < positions.length - 1 ? positions[i + 1] : text.length;
    const columnText = text.substring(start, end).trim();
    columns.push(columnText);
  }

  return columns;
}

/**
 * 检测回归表格的列位置（基于模型编号）
 * @param headerLine 包含模型编号的表头行
 * @returns 包含变量名列宽度和列边界的信息
 */
function detectRegressionColumnPositions(headerLine: string): { varNameWidth: number; boundaries: number[] } {
  const regex = /\(\s*\d+\s*\)/g;
  const matches = [];
  let match;

  while ((match = regex.exec(headerLine)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      center: match.index + Math.floor(match[0].length / 2)
    });
  }

  if (matches.length === 0) {
    return { varNameWidth: 20, boundaries: [] };
  }

  // 变量名列的宽度：从0到第一个模型编号的起始位置
  const varNameWidth = matches[0].start;

  // 计算数据列的边界（相对于数据区域起点，即varNameWidth之后）
  const boundaries: number[] = [];

  // 第一个数据列从0开始（相对于数据区域）
  boundaries.push(0);

  // 后续边界是相邻模型编号中心的中点
  for (let i = 0; i < matches.length - 1; i++) {
    const midpoint = Math.floor((matches[i].center + matches[i + 1].center) / 2) - varNameWidth;
    boundaries.push(midpoint);
  }

  return { varNameWidth, boundaries };
}

/**
 * 检测 Stata 表格类型
 * @param lines 行列表
 * @returns 表格类型
 */
function detectStataTableType(lines: string[]): StataTableType {
  const content = lines.join('\n');

  // 检测是否有管道符（描述性统计和相关系数表格的特征）
  const hasPipe = lines.some(line => line.includes('|'));

  if (hasPipe) {
    // 检测是否为相关系数表格（对角线为 1.0000）
    if (/\b1\.0000\b/.test(content)) {
      return 'correlation';
    }
    // 否则为描述性统计表格
    return 'descriptive';
  }

  // 没有管道符，检测回归表格特征
  return 'regression';
}

/**
 * 解析 Stata 表格
 * @param content Stata 表格内容
 * @returns 解析后的表格
 */
export function parseStataTable(content: string): ParsedTable {
  const lines = content.trim().split(/\r?\n/);
  const tableType = detectStataTableType(lines);

  switch (tableType) {
    case 'descriptive':
      return parseDescriptiveTable(lines);
    case 'correlation':
      return parseCorrelationTable(lines);
    case 'regression':
      return parseRegressionTable(lines);
  }
}

/**
 * 解析描述性统计表格
 * @param lines 行列表
 * @returns 解析后的表格
 */
function parseDescriptiveTable(lines: string[]): ParsedTable {
  const rows: TableRow[] = [];
  const topBorderRows: number[] = [];
  const bottomBorderRows: number[] = [];

  let currentRowIndex = 0;
  let headerParsed = false;
  let columnCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 跳过分隔线
    if (isSeparatorLine(line)) {
      // 第一个分隔线后的行有顶部边框
      if (!headerParsed) {
        topBorderRows.push(currentRowIndex);
      }
      continue;
    }

    // 跳过空行
    if (!line.trim()) {
      continue;
    }

    // 按管道符分割
    const parts = line.split('|').map(p => p.trim());

    if (parts.length < 2) {
      continue;
    }

    const rowLabel = parts[0];
    const dataStr = parts[1];

    // 使用正则表达式分割：至少2个连续空格作为列分隔符
    // 这样可以保留 "Std. dev." 这样的多词列名（中间只有1个空格）
    const dataCells = dataStr.split(/\s{2,}/).filter(cell => cell.length > 0);

    // 构建单元格数组（第一列是行标签，后面是数据）
    const cells: TableCell[] = [
      {
        content: rowLabel,
        alignment: 'left',
        hasTopBorder: topBorderRows.includes(currentRowIndex),
        hasBottomBorder: false,
        hasSuperscript: false,
      },
      ...dataCells.map(cell => ({
        content: cell,
        alignment: 'center' as const,
        hasTopBorder: topBorderRows.includes(currentRowIndex),
        hasBottomBorder: false,
        hasSuperscript: /\*+$/.test(cell),
      })),
    ];

    rows.push({ cells });
    columnCount = Math.max(columnCount, cells.length);

    if (!headerParsed) {
      headerParsed = true;
    }

    currentRowIndex++;
  }

  // 最后一行有底部边框
  if (rows.length > 0) {
    bottomBorderRows.push(rows.length - 1);
    rows[rows.length - 1].cells.forEach(cell => {
      cell.hasBottomBorder = true;
    });
  }

  // 第一行（表头）有顶部边框
  if (rows.length > 0 && !topBorderRows.includes(0)) {
    topBorderRows.unshift(0);
    rows[0].cells.forEach(cell => {
      cell.hasTopBorder = true;
    });
  }

  return {
    rows,
    columnCount,
    topBorderRows,
    bottomBorderRows,
  };
}

/**
 * 解析相关系数表格
 * @param lines 行列表
 * @returns 解析后的表格
 */
function parseCorrelationTable(lines: string[]): ParsedTable {
  const rows: TableRow[] = [];
  const topBorderRows: number[] = [0];
  const bottomBorderRows: number[] = [];

  let currentRowIndex = 0;
  let headerLine = '';
  let columnNames: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 跳过分隔线
    if (isSeparatorLine(line)) {
      continue;
    }

    // 跳过空行
    if (!line.trim()) {
      continue;
    }

    // 按管道符分割
    const parts = line.split('|').map(p => p.trim());

    if (parts.length < 2) {
      continue;
    }

    const rowLabel = parts[0];
    const dataStr = parts[1];

    // 第一行是表头
    if (currentRowIndex === 0) {
      headerLine = dataStr;
      columnNames = [''].concat(dataStr.split(/\s+/).filter(name => name.length > 0));

      // 构建表头行
      const cells: TableCell[] = columnNames.map((name, idx) => ({
        content: name,
        alignment: idx === 0 ? 'left' : 'center',
        hasTopBorder: true,
        hasBottomBorder: false,
        hasSuperscript: false,
      }));

      rows.push({ cells });
      currentRowIndex++;
      continue;
    }

    // 解析数据行
    const dataCells = dataStr.split(/\s+/).filter(cell => cell.length > 0);

    // 构建单元格数组
    const cells: TableCell[] = [
      {
        content: rowLabel,
        alignment: 'left',
        hasTopBorder: false,
        hasBottomBorder: false,
        hasSuperscript: false,
      },
      ...dataCells.map(cell => ({
        content: cell,
        alignment: 'center' as const,
        hasTopBorder: false,
        hasBottomBorder: false,
        hasSuperscript: /\*+$/.test(cell),
      })),
    ];

    // 填充空单元格以对齐列数
    while (cells.length < columnNames.length) {
      cells.push({
        content: '',
        alignment: 'center',
        hasTopBorder: false,
        hasBottomBorder: false,
        hasSuperscript: false,
      });
    }

    rows.push({ cells });
    currentRowIndex++;
  }

  // 最后一行有底部边框
  if (rows.length > 0) {
    bottomBorderRows.push(rows.length - 1);
    rows[rows.length - 1].cells.forEach(cell => {
      cell.hasBottomBorder = true;
    });
  }

  return {
    rows,
    columnCount: columnNames.length,
    topBorderRows,
    bottomBorderRows,
  };
}

/**
 * 解析回归表格
 * @param lines 行列表
 * @returns 解析后的表格
 */
function parseRegressionTable(lines: string[]): ParsedTable {
  const rows: TableRow[] = [];
  const topBorderRows: number[] = [];
  const bottomBorderRows: number[] = [];

  let currentRowIndex = 0;
  let columnCount = 0;
  let varNameWidth = 20;
  let columnBoundaries: number[] = [];

  // 过滤掉分隔线和空行，但记录分隔线位置
  const contentLines: Array<{ line: string; isSeparator: boolean; originalIndex: number }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isSeparatorLine(line)) {
      contentLines.push({ line, isSeparator: true, originalIndex: i });
    } else if (line.trim()) {
      contentLines.push({ line, isSeparator: false, originalIndex: i });
    }
  }

  // 第一个分隔线之后、第二个分隔线之前的是表头
  let firstSepIndex = contentLines.findIndex(l => l.isSeparator);
  let secondSepIndex = contentLines.findIndex((l, idx) => l.isSeparator && idx > firstSepIndex);

  if (firstSepIndex === -1) {
    firstSepIndex = 0;
  }
  if (secondSepIndex === -1) {
    secondSepIndex = contentLines.length;
  }

  // 解析表头（模型编号和因变量名）
  const headerRows: string[] = [];
  for (let i = firstSepIndex + 1; i < secondSepIndex; i++) {
    if (!contentLines[i].isSeparator) {
      headerRows.push(contentLines[i].line);
    }
  }

  // 从第一个表头行检测列位置（通常是模型编号）
  if (headerRows.length > 0) {
    const firstHeaderLine = headerRows[0];

    // 检测列位置：寻找模型编号 (1), (2), (3)...
    const positionInfo = detectRegressionColumnPositions(firstHeaderLine);
    varNameWidth = positionInfo.varNameWidth;
    columnBoundaries = positionInfo.boundaries;

    // 如果没有找到模型编号，使用默认值
    if (columnBoundaries.length === 0) {
      const fallbackPositions = detectColumnPositions(firstHeaderLine);
      if (fallbackPositions.length > 0) {
        varNameWidth = fallbackPositions[0];
        columnBoundaries = fallbackPositions.slice(1).map(p => p - varNameWidth);
      }
    }

    columnCount = columnBoundaries.length + 1; // +1 for variable name column

    // 构建表头行
    headerRows.forEach((headerLine, headerIdx) => {
      const varName = headerLine.substring(0, varNameWidth).trim();

      // 提取表头数据列
      const headerDataStr = headerLine.substring(varNameWidth);
      const headerCells = extractColumnsByPosition(headerDataStr, columnBoundaries);

      const cells: TableCell[] = [
        {
          content: varName,
          alignment: 'left',
          hasTopBorder: headerIdx === 0,
          hasBottomBorder: false,
          hasSuperscript: false,
        },
        ...headerCells.map(cell => ({
          content: cell,
          alignment: 'center' as const,
          hasTopBorder: headerIdx === 0,
          hasBottomBorder: false,
          hasSuperscript: false,
        })),
      ];

      rows.push({ cells });
      if (headerIdx === 0) {
        topBorderRows.push(currentRowIndex);
      }
      currentRowIndex++;
    });
  }

  // 解析数据行（第二个分隔线之后）
  // 使用位置来提取值，以保留空单元格
  let i = secondSepIndex + 1;
  while (i < contentLines.length) {
    if (contentLines[i].isSeparator) {
      // 遇到分隔线，跳过
      i++;
      continue;
    }

    const line = contentLines[i].line;

    // 提取变量名（左对齐，在第一个列位置之前）
    const varName = line.substring(0, varNameWidth).trim();

    // 提取数据部分
    const dataStr = line.substring(varNameWidth);

    // 使用位置提取值（保留空单元格）
    const values = extractColumnsByPosition(dataStr, columnBoundaries);

    // 检查下一行是否是 t-statistics（括号开头）
    let hasTStats = false;
    let tStatValues: string[] = [];

    if (i + 1 < contentLines.length && !contentLines[i + 1].isSeparator) {
      const nextLine = contentLines[i + 1].line.trim();
      if (nextLine.startsWith('(')) {
        hasTStats = true;
        // 提取 t-statistics，同样使用位置
        const tStatDataStr = contentLines[i + 1].line.substring(varNameWidth);
        tStatValues = extractColumnsByPosition(tStatDataStr, columnBoundaries);
        i++; // 跳过 t-stat 行
      }
    }

    // 构建系数行
    const coeffCells: TableCell[] = [
      {
        content: varName,
        alignment: 'left',
        hasTopBorder: false,
        hasBottomBorder: false,
        hasSuperscript: false,
      },
      ...values.map(val => ({
        content: val,
        alignment: 'center' as const,
        hasTopBorder: false,
        hasBottomBorder: false,
        hasSuperscript: /\*+$/.test(val),
      })),
    ];

    rows.push({ cells: coeffCells });
    currentRowIndex++;

    // 如果有 t-statistics，添加 t-stat 行
    if (hasTStats) {
      const tStatCells: TableCell[] = [
        {
          content: '',
          alignment: 'left',
          hasTopBorder: false,
          hasBottomBorder: false,
          hasSuperscript: false,
        },
        ...tStatValues.map(val => ({
          content: val,
          alignment: 'center' as const,
          hasTopBorder: false,
          hasBottomBorder: false,
          hasSuperscript: false,
        })),
      ];

      rows.push({ cells: tStatCells });
      currentRowIndex++;
    }

    i++;
  }

  // 最后一行有底部边框
  if (rows.length > 0) {
    bottomBorderRows.push(rows.length - 1);
    rows[rows.length - 1].cells.forEach(cell => {
      cell.hasBottomBorder = true;
    });
  }

  // 如果列数未设置，计算最大列数
  if (columnCount === 0) {
    columnCount = Math.max(...rows.map(r => r.cells.length));
  }

  return {
    rows,
    columnCount,
    topBorderRows,
    bottomBorderRows,
  };
}
