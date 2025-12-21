import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * 确保 typ_tables 文件夹存在
 * @param currentFileDir 当前文件所在目录
 * @returns typ_tables 文件夹的完整路径
 */
export async function ensureTypTablesFolder(currentFileDir: string): Promise<string> {
  const config = vscode.workspace.getConfiguration('paste2typ');
  const folderName = config.get<string>('tableFolder', 'typ_tables');

  const tablesFolder = path.join(currentFileDir, folderName);

  // 检查文件夹是否存在
  if (!fs.existsSync(tablesFolder)) {
    // 创建文件夹
    fs.mkdirSync(tablesFolder, { recursive: true });
  }

  return tablesFolder;
}

/**
 * 生成唯一的表格文件名
 * @param folder typ_tables 文件夹路径
 * @returns 文件名（如 table_001.typ）
 */
export async function generateTableFileName(folder: string): Promise<string> {
  // 扫描文件夹，找到所有 table_*.typ 文件
  const files = fs.readdirSync(folder);
  const tableFiles = files.filter(f => /^table_\d+\.typ$/.test(f));

  // 提取编号
  const numbers = tableFiles.map(f => {
    const match = f.match(/^table_(\d+)\.typ$/);
    return match ? parseInt(match[1], 10) : 0;
  });

  // 找到最大编号
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

  // 生成下一个编号
  const nextNumber = maxNumber + 1;
  const fileName = `table_${nextNumber.toString().padStart(3, '0')}.typ`;

  return fileName;
}

/**
 * 保存表格文件
 * @param folder typ_tables 文件夹路径
 * @param fileName 文件名
 * @param content 表格内容
 * @returns 文件的完整路径
 */
export async function saveTableFile(
  folder: string,
  fileName: string,
  content: string
): Promise<string> {
  const filePath = path.join(folder, fileName);

  // 写入文件
  fs.writeFileSync(filePath, content, 'utf-8');

  return filePath;
}

/**
 * 生成引用代码
 * @param relativePath 相对路径（如 typ_tables/table_001.typ）
 * @param template 引用模板
 * @returns 引用代码
 */
export function generateIncludeStatement(
  relativePath: string,
  template: string
): string {
  // 替换模板中的 {path} 占位符
  return template.replace('{path}', relativePath);
}
