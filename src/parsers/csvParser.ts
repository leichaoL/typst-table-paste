import * as Papa from 'papaparse';
import { ParsedTable, TableRow, TableCell, CSVFormatType } from '../utils/types';

/**
 * 检测 CSV 格式类型
 * @param content CSV 内容
 * @returns 格式类型
 */
export function detectCSVFormat(content: string): CSVFormatType {
  // 检测是否包含 =" 模式（等号分隔格式）
  if (/="[^"]*"/g.test(content)) {
    return 'equals';
  }
  return 'standard';
}

/**
 * 解析 CSV 表格
 * @param content CSV 内容
 * @returns 解析后的表格
 */
export function parseCSV(content: string): ParsedTable {
  const format = detectCSVFormat(content);

  let cleanedContent = content;
  if (format === 'equals') {
    // 移除 = 前缀，将 =" 替换为 "
    cleanedContent = content.replace(/="/g, '"');
  }

  // 自动检测分隔符（逗号或制表符）
  const delimiter = content.includes('\t') ? '\t' : ',';

  // 使用 papaparse 解析
  const result = Papa.parse(cleanedContent, {
    skipEmptyLines: false,
    delimiter: delimiter,
  });

  if (result.errors.length > 0) {
    console.error('CSV 解析错误:', result.errors);
  }

  const data = result.data as string[][];

  // 转换为 ParsedTable 格式
  const rows: TableRow[] = data.map((row, rowIndex) => {
    const cells: TableCell[] = row.map((cellContent, colIndex) => {
      // 第一列默认左对齐，其他列居中
      const alignment = colIndex === 0 ? 'left' : 'center';

      return {
        content: cellContent.trim(),
        alignment,
        hasTopBorder: rowIndex === 0, // 第一行有顶部边框
        hasBottomBorder: rowIndex === data.length - 1, // 最后一行有底部边框
        hasSuperscript: /\*+$/.test(cellContent), // 检测是否以星号结尾
      };
    });

    return { cells };
  });

  // 计算列数（取最大列数）
  const columnCount = Math.max(...data.map(row => row.length));

  return {
    rows,
    columnCount,
    topBorderRows: [0], // 第一行有顶部边框
    bottomBorderRows: [data.length - 1], // 最后一行有底部边框
  };
}

/**
 * 检测内容是否为 CSV 格式
 * @param content 内容
 * @returns 是否为 CSV
 */
export function isCSV(content: string): boolean {
  // Handle different line endings (CRLF and LF)
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return false;
  }

  // Check if has delimiters
  const hasCommas = lines.some(line => line.includes(','));
  const hasTabs = lines.some(line => line.includes('\t'));

  // More lenient: if has delimiters and multiple lines, it's likely CSV
  return (hasCommas || hasTabs) && lines.length >= 2;
}
