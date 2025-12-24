import * as XLSX from 'xlsx';
import { ParsedTable, TableRow, TableCell } from '../utils/types';

/**
 * 解析 Excel 文件
 * @param filePath Excel 文件路径
 * @param sheetName 工作表名称（可选，默认第一个工作表）
 * @returns 解析后的表格
 */
export function parseExcel(filePath: string, sheetName?: string): ParsedTable {
  // 读取 Excel 文件
  const workbook = XLSX.readFile(filePath);

  // 获取工作表名称
  const targetSheetName = sheetName || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheetName];

  if (!worksheet) {
    throw new Error(`Sheet "${targetSheetName}" not found`);
  }

  // 将工作表转换为二维数组
  // 使用 raw: false 来获取格式化后的值（而不是原始值）
  // 使用 defval: '' 来处理空单元格
  const data: string[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: false,
    defval: ''
  }) as string[][];

  // 过滤掉完全空的行
  const filteredData = data.filter(row =>
    row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '')
  );

  if (filteredData.length === 0) {
    throw new Error('No data found in Excel file');
  }

  // 转换为 ParsedTable 格式
  const rows: TableRow[] = filteredData.map((row, rowIndex) => {
    const cells: TableCell[] = row.map((cellContent, colIndex) => {
      // 确保 cellContent 是字符串
      const content = cellContent !== null && cellContent !== undefined
        ? cellContent.toString().trim()
        : '';

      // 第一列默认左对齐，其他列居中
      const alignment = colIndex === 0 ? 'left' : 'center';

      return {
        content,
        alignment,
        hasTopBorder: rowIndex === 0, // 第一行有顶部边框
        hasBottomBorder: rowIndex === filteredData.length - 1, // 最后一行有底部边框
        hasSuperscript: /\*+$/.test(content), // 检测是否以星号结尾
      };
    });

    return { cells };
  });

  // 计算列数（取最大列数）
  const columnCount = Math.max(...filteredData.map(row => row.length));

  return {
    rows,
    columnCount,
    topBorderRows: [0], // 第一行有顶部边框
    bottomBorderRows: [filteredData.length - 1], // 最后一行有底部边框
  };
}

/**
 * 获取 Excel 文件中的所有工作表名称
 * @param filePath Excel 文件路径
 * @returns 工作表名称数组
 */
export function getExcelSheetNames(filePath: string): string[] {
  const workbook = XLSX.readFile(filePath);
  return workbook.SheetNames;
}

/**
 * 检测文件是否为 Excel 格式
 * @param filePath 文件路径
 * @returns 是否为 Excel 文件
 */
export function isExcelFile(filePath: string): boolean {
  const ext = filePath.toLowerCase();
  return ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.xlsm');
}
