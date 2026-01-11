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

/**
 * 验证表格文件名
 * @param fileName 文件名
 * @returns 验证结果和错误消息
 */
export function validateTableFileName(fileName: string): { valid: boolean; error?: string } {
  // 检查空文件名
  if (!fileName || fileName.trim() === '') {
    return { valid: false, error: '文件名不能为空' };
  }

  // 检查长度限制（255 字符是大多数文件系统的限制）
  if (fileName.length > 255) {
    return { valid: false, error: '文件名过长（最多 255 个字符）' };
  }

  // 检查 .typ 扩展名
  if (!fileName.endsWith('.typ')) {
    return { valid: false, error: '文件名必须以 .typ 结尾' };
  }

  // 检查非法字符
  const illegalChars = /[<>:"|?*\/\\]/;
  if (illegalChars.test(fileName)) {
    return { valid: false, error: '文件名包含非法字符：< > : " / \\ | ? *' };
  }

  // 检查 Windows 保留名称
  const baseName = fileName.replace('.typ', '');
  const reservedNames = [
    'CON', 'PRE', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];
  if (reservedNames.includes(baseName.toUpperCase())) {
    return { valid: false, error: '文件名是系统保留名称' };
  }

  // 检查是否以点开头
  if (baseName.startsWith('.')) {
    return { valid: false, error: '文件名不能以点开头' };
  }

  return { valid: true };
}

/**
 * 检查文件名是否已存在
 * @param folder 文件夹路径
 * @param fileName 文件名
 * @returns 是否存在
 */
export function fileNameExists(folder: string, fileName: string): boolean {
  const filePath = path.join(folder, fileName);
  return fs.existsSync(filePath);
}

/**
 * 从源文件路径生成建议的文件名
 * @param sourcePath 源文件路径
 * @param existingName 现有名称（用于剪贴板场景）
 * @returns 建议的文件名
 */
export function suggestFileNameFromSource(sourcePath?: string, existingName?: string): string {
  // 如果没有源路径，返回现有名称
  if (!sourcePath) {
    return existingName || '';
  }

  // 提取文件名（去掉路径和扩展名）
  const baseName = path.basename(sourcePath, path.extname(sourcePath));

  // 清理文件名：替换非法字符为下划线
  let cleanName = baseName
    .replace(/[<>:"|?*\/\\]/g, '_')  // 替换非法字符
    .replace(/\s+/g, '_')             // 替换空格
    .replace(/_{2,}/g, '_')           // 合并多个下划线
    .replace(/^_+|_+$/g, '')          // 去掉首尾下划线
    .replace(/^\.+/, '');             // 移除前导点（Windows 隐藏文件）

  // 如果清理后为空或只有点，使用默认名称
  if (!cleanName || cleanName === '.') {
    cleanName = 'table';
  }

  // 限制长度以防止文件系统问题（最大 255 字符，为 .typ 和 _NNN 预留空间）
  const maxLength = 240;
  if (cleanName.length > maxLength) {
    cleanName = cleanName.substring(0, maxLength);
  }

  return cleanName + '.typ';
}

/**
 * 提示用户输入文件名
 * @param folder 文件夹路径
 * @param suggestedName 建议的文件名
 * @param operation 操作类型
 * @returns 用户输入的文件名或 undefined（取消）
 */
export async function promptForFileName(
  folder: string,
  suggestedName: string,
  operation: 'create' | 'rename'
): Promise<string | undefined> {
  const operationText = operation === 'create' ? '创建' : '重命名';

  // 如果是创建操作且建议名称已存在，自动生成替代名称
  let initialValue = suggestedName;
  if (operation === 'create' && fileNameExists(folder, suggestedName)) {
    const baseName = suggestedName.replace('.typ', '');
    let counter = 1;
    let newFileName = `${baseName}_${counter}.typ`;
    while (fileNameExists(folder, newFileName)) {
      counter++;
      newFileName = `${baseName}_${counter}.typ`;
    }
    initialValue = newFileName;
  }

  const result = await vscode.window.showInputBox({
    value: initialValue,
    prompt: `输入表格文件名（${operationText}），无需输入 .typ 扩展名`,
    placeHolder: '例如: regression_results（将自动添加 .typ）',
    validateInput: (value: string) => {
      // 自动补全 .typ 扩展名用于验证
      const valueWithExtension = value.endsWith('.typ') ? value : value + '.typ';

      // 验证文件名格式
      const validation = validateTableFileName(valueWithExtension);
      if (!validation.valid) {
        return validation.error;
      }

      // 对于重命名操作，如果文件名与建议名称相同，允许通过
      if (operation === 'rename' && valueWithExtension === suggestedName) {
        return undefined;
      }

      // 检查文件是否已存在
      if (fileNameExists(folder, valueWithExtension)) {
        return '文件已存在，请选择其他名称';
      }

      return undefined;
    }
  });

  // 如果用户取消，返回 undefined
  if (result === undefined) {
    return undefined;
  }

  // 自动补全 .typ 扩展名
  const finalResult = result.endsWith('.typ') ? result : result + '.typ';

  return finalResult;
}

/**
 * 查找工作区中所有引用指定表格的位置
 * @param workspaceFolder 工作区文件夹路径
 * @param tableFolder 表格文件夹名称（如 typ_tables）
 * @param fileName 表格文件名
 * @returns 引用列表
 */
export async function findTableReferences(
  workspaceFolder: string,
  tableFolder: string,
  fileName: string
): Promise<Array<{ uri: vscode.Uri; line: number; text: string }>> {
  const references: Array<{ uri: vscode.Uri; line: number; text: string }> = [];

  // 搜索工作区中的所有 .typ 文件
  const files = await vscode.workspace.findFiles('**/*.typ', '**/node_modules/**');

  for (const fileUri of files) {
    try {
      // 读取文件内容
      const document = await vscode.workspace.openTextDocument(fileUri);
      const content = document.getText();
      const lines = content.split('\n');

      // 逐行搜索 include 语句
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 匹配 include 语句：include "path"
        const includeRegex = /include\s+"([^"]+)"/g;
        let match;

        while ((match = includeRegex.exec(line)) !== null) {
          const includePath = match[1];

          // 规范化路径分隔符（支持 / 和 \）
          const normalizedPath = includePath.replace(/\\/g, '/');
          const normalizedTableFolder = tableFolder.replace(/\\/g, '/');
          const targetPath = `${normalizedTableFolder}/${fileName}`;

          // 检查是否匹配目标文件
          if (normalizedPath === targetPath || normalizedPath.endsWith(targetPath)) {
            references.push({
              uri: fileUri,
              line: i,
              text: line
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error reading file ${fileUri.fsPath}:`, error);
    }
  }

  return references;
}

/**
 * 更新所有引用中的表格文件名
 * @param references 引用列表
 * @param tableFolder 表格文件夹名称
 * @param oldFileName 旧文件名
 * @param newFileName 新文件名
 * @returns 更新结果
 */
export async function updateTableReferences(
  references: Array<{ uri: vscode.Uri; line: number; text: string }>,
  tableFolder: string,
  oldFileName: string,
  newFileName: string
): Promise<{ updated: number; failed: number }> {
  const edit = new vscode.WorkspaceEdit();
  let successCount = 0;
  let failCount = 0;

  for (const ref of references) {
    try {
      // 打开文档以获取行范围
      const document = await vscode.workspace.openTextDocument(ref.uri);
      const line = document.lineAt(ref.line);

      // 替换文件名（保持路径分隔符风格）
      const oldText = line.text;
      let newText = oldText;

      // 支持两种路径分隔符
      const oldPathForward = `${tableFolder}/${oldFileName}`;
      const oldPathBackward = `${tableFolder}\\${oldFileName}`;
      const newPathForward = `${tableFolder}/${newFileName}`;
      const newPathBackward = `${tableFolder}\\${newFileName}`;

      if (oldText.includes(oldPathForward)) {
        newText = oldText.replace(oldPathForward, newPathForward);
      } else if (oldText.includes(oldPathBackward)) {
        newText = oldText.replace(oldPathBackward, newPathBackward);
      }

      // 添加到编辑操作
      edit.replace(ref.uri, line.range, newText);
      successCount++;
    } catch (error) {
      console.error(`Error updating reference in ${ref.uri.fsPath}:`, error);
      failCount++;
    }
  }

  // 批量应用所有编辑
  try {
    const applied = await vscode.workspace.applyEdit(edit);
    if (!applied) {
      failCount = successCount;
      successCount = 0;
    }
  } catch (error) {
    console.error('Error applying workspace edit:', error);
    failCount = successCount;
    successCount = 0;
  }

  return { updated: successCount, failed: failCount };
}

/**
 * 重命名表格文件
 * @param folder 文件夹路径
 * @param oldFileName 旧文件名
 * @param newFileName 新文件名
 */
export async function renameTableFile(
  folder: string,
  oldFileName: string,
  newFileName: string
): Promise<void> {
  const oldPath = path.join(folder, oldFileName);
  const newPath = path.join(folder, newFileName);

  // 验证旧文件存在
  if (!fs.existsSync(oldPath)) {
    throw new Error('文件不存在');
  }

  // 验证新文件名
  const validation = validateTableFileName(newFileName);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 检查新文件名是否已存在
  if (fs.existsSync(newPath) && oldPath !== newPath) {
    throw new Error('目标文件名已存在');
  }

  // 执行重命名
  try {
    fs.renameSync(oldPath, newPath);
  } catch (error: any) {
    if (error.code === 'EACCES') {
      throw new Error('权限不足，请关闭文件后重试');
    } else if (error.code === 'EBUSY') {
      throw new Error('文件正在使用中');
    } else {
      throw new Error(`重命名失败: ${error.message}`);
    }
  }
}
