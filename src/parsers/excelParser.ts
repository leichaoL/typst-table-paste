import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { ParsedTable, TableRow, TableCell } from '../utils/types';

/**
 * 读取 Excel 文件（带重试机制和文件锁处理）
 * @param filePath Excel 文件路径
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试延迟（毫秒）
 * @returns XLSX Workbook
 */
function readExcelWithRetry(
  filePath: string,
  maxRetries: number = 3,
  retryDelay: number = 500
): XLSX.WorkBook {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 使用 buffer 读取而非直接文件访问，对文件锁更有韧性
      const buffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      return workbook;
    } catch (error: any) {
      lastError = error;

      // 检查是否是文件访问错误
      const isAccessError =
        error.code === 'EBUSY' ||   // 文件正在使用
        error.code === 'EPERM' ||   // 权限被拒绝
        error.code === 'EACCES';    // 访问被拒绝

      // 如果是访问错误且还有重试次数，等待后重试
      if (isAccessError && attempt < maxRetries) {
        // 同步等待（对文件 I/O 场景可接受）
        const start = Date.now();
        while (Date.now() - start < retryDelay) {
          // 忙等待
        }
        continue;
      }

      // 如果不是访问错误，或重试次数用完，退出循环
      break;
    }
  }

  // 增强错误消息
  if (lastError) {
    const errorCode = (lastError as any).code;
    if (errorCode === 'EBUSY' || errorCode === 'EPERM') {
      throw new Error(
        `文件正在被其他程序使用（如 Excel）。请关闭文件后重试。已尝试 ${maxRetries} 次。`
      );
    } else if (errorCode === 'EACCES') {
      throw new Error('权限不足，无法访问文件。请检查文件权限。');
    } else if (errorCode === 'ENOENT') {
      throw new Error('文件未找到: ' + filePath);
    } else {
      throw new Error('读取 Excel 文件失败: ' + lastError.message);
    }
  }

  throw new Error('读取 Excel 文件失败（未知错误）');
}

/**
 * 解析 Excel 文件
 * @param filePath Excel 文件路径
 * @param sheetName 工作表名称（可选，默认第一个工作表）
 * @returns 解析后的表格
 */
export function parseExcel(filePath: string, sheetName?: string): ParsedTable {
  // 使用重试逻辑读取文件
  const workbook = readExcelWithRetry(filePath);

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
  // 使用重试逻辑读取文件
  const workbook = readExcelWithRetry(filePath);
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
