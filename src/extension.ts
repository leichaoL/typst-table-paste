import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { detectFormat, isTableFormat, extractTables } from './parsers/formatDetector';
import { parseCSV } from './parsers/csvParser';
import { parseRTF } from './parsers/rtfParser';
import { parseExcel, getExcelSheetNames, isExcelFile } from './parsers/excelParser';
import { quickConvert } from './converters/typstConverter';
import { Paste2TypConfig } from './utils/types';
import {
  ensureTypTablesFolder,
  generateTableFileName,
  saveTableFile,
  generateIncludeStatement,
} from './utils/fileManager';

/**
 * 插件激活函数
 * @param context 扩展上下文
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Typst Table Paste extension activated');
  // vscode.window.showInformationMessage('Typst Table Paste extension activated');

  // 注册手动转换命令
  const convertCommand = vscode.commands.registerCommand(
    'typst-table-paste.convertTable',
    async () => {
      await convertTableCommand();
    }
  );

  // 注册从文件转换命令
  const convertFromFileCmd = vscode.commands.registerCommand(
    'typst-table-paste.convertFromFile',
    async () => {
      await convertFromFileCommand();
    }
  );

  // 注册粘贴拦截器
  const pasteHandler = vscode.commands.registerTextEditorCommand(
    'typst-table-paste.paste',
    async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
      console.log('typst-table-paste.paste 命令被调用');
      await handlePaste(textEditor, edit);
    }
  );

  context.subscriptions.push(convertCommand, convertFromFileCmd, pasteHandler);

  // 覆盖默认粘贴行为（如果启用自动转换）
  setupPasteInterceptor(context);
}

/**
 * 设置粘贴拦截器
 * @param context 扩展上下文
 */
function setupPasteInterceptor(context: vscode.ExtensionContext) {
  // 监听粘贴事件
  // 注意：VSCode 没有直接的粘贴事件，我们需要通过键盘快捷键来实现
  // 在 package.json 中配置 keybindings
}

/**
 * 处理粘贴操作
 * @param textEditor 文本编辑器
 * @param edit 编辑对象
 */
async function handlePaste(
  textEditor: vscode.TextEditor,
  edit: vscode.TextEditorEdit
) {
  console.log('handlePaste 函数开始执行');
  const config = getConfig();
  console.log('配置:', config);

  if (!config.autoConvert) {
    // 如果未启用自动转换，执行默认粘贴
    console.log('自动转换未启用，执行默认粘贴');
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
    return;
  }

  try {
    // 读取剪贴板内容
    const clipboardText = await vscode.env.clipboard.readText();
    console.log('剪贴板文本长度:', clipboardText ? clipboardText.length : 0);

    // 如果剪贴板文本为空或很短，可能是图片
    // 让其他插件（如 typst-figure-pastetools）处理
    if (!clipboardText || clipboardText.trim().length < 10) {
      console.log('剪贴板为空或很短，执行默认粘贴');
      await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
      return;
    }

    // 调试：输出剪贴板内容的前200个字符
    console.log('剪贴板内容预览:', clipboardText.substring(0, Math.min(200, clipboardText.length)));

    // 检测是否包含文件路径
    const filePaths = detectFilePaths(clipboardText);
    console.log('检测到的文件路径:', filePaths);
    if (filePaths.length > 0) {
      console.log(`检测到 ${filePaths.length} 个文件路径，开始处理...`);
      await handleFileCopy(filePaths, textEditor, config);
      console.log('文件复制处理完成');
      return;
    }

    // 检测格式
    const format = detectFormat(clipboardText);
    console.log('检测到的格式:', format);

    if (format === 'unknown') {
      // 不是表格格式，尝试提取表格
      console.log('不是明确的表格格式，尝试提取表格...');
      const extractedTables = extractTables(clipboardText);

      if (extractedTables.length > 0) {
        console.log(`提取到 ${extractedTables.length} 个表格`);

        if (extractedTables.length === 1) {
          // 只有一个表格，直接转换
          const table = extractedTables[0];
          if (table.format !== 'unknown') {
            const typstCode = await convertClipboardToTypst(table.content, table.format, config);

            if (typstCode) {
              // 保存并插入表格
              await saveAndInsertTable(typstCode, textEditor, config);
              return;
            }
          }
        } else {
          // 多个表格，提示用户选择
          const choice = await vscode.window.showQuickPick(
            [
              { label: '转换所有表格', value: 'all' },
              { label: '只转换第一个表格', value: 'first' },
              { label: '取消', value: 'cancel' }
            ],
            {
              placeHolder: `检测到 ${extractedTables.length} 个表格，请选择操作`
            }
          );

          if (choice?.value === 'all') {
            // 转换所有表格
            const includeStatements: string[] = [];

            for (const table of extractedTables) {
              if (table.format !== 'unknown') {
                const typstCode = await convertClipboardToTypst(table.content, table.format, config);
                if (typstCode) {
                  const statement = await saveTableAndGetInclude(typstCode, textEditor, config);
                  if (statement) {
                    includeStatements.push(statement);
                  }
                }
              }
            }

            // 插入所有引用
            if (includeStatements.length > 0) {
              const position = textEditor.selection.active;
              await textEditor.edit((editBuilder) => {
                editBuilder.insert(position, includeStatements.join('\n\n'));
              });

              vscode.window.showInformationMessage(`已转换并保存 ${includeStatements.length} 个表格`);
            }
            return;
          } else if (choice?.value === 'first') {
            // 只转换第一个表格
            const table = extractedTables[0];
            if (table.format !== 'unknown') {
              const typstCode = await convertClipboardToTypst(table.content, table.format, config);

              if (typstCode) {
                await saveAndInsertTable(typstCode, textEditor, config);
                return;
              }
            }
          }
        }
      }

      // 没有提取到表格，执行默认粘贴
      console.log('未提取到表格，执行默认粘贴');
      await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
      return;
    }

    console.log('开始转换表格...');
    // 转换表格
    const typstCode = await convertClipboardToTypst(clipboardText, format, config);

    if (!typstCode) {
      // 转换失败，执行默认粘贴
      console.log('转换失败，执行默认粘贴');
      await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
      return;
    }

    console.log('转换成功，生成的代码长度:', typstCode.length);

    // 保存并插入表格
    await saveAndInsertTable(typstCode, textEditor, config);
    console.log('handlePaste 函数执行完成');
  } catch (error) {
    console.error('粘贴处理错误:', error);
    vscode.window.showErrorMessage(`转换失败: ${error}`);
    // 执行默认粘贴
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
  }
}

/**
 * 检测剪贴板内容是否包含文件路径
 * @param text 剪贴板文本
 * @returns 文件路径数组
 */
function detectFilePaths(text: string): string[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const filePaths: string[] = [];

  for (const line of lines) {
    let filePath = line;

    // Remove surrounding quotes (from "Copy as path" in Windows)
    if ((filePath.startsWith('"') && filePath.endsWith('"')) ||
        (filePath.startsWith("'") && filePath.endsWith("'"))) {
      filePath = filePath.slice(1, -1);
    }

    // Handle file:// URI format
    if (filePath.startsWith('file:///')) {
      // Convert file:///C:/path to C:\path (Windows)
      filePath = filePath.replace('file:///', '').replace(/\//g, '\\');
    } else if (filePath.startsWith('file://')) {
      // Convert file://path to /path (Unix)
      filePath = filePath.replace('file://', '');
    }

    // Check if line looks like a file path
    // Windows: C:\path\file.csv
    // Unix: /path/file.csv
    // Only CSV files are supported for file conversion
    const isWindowsPath = /^[a-zA-Z]:[\\\/].*\.csv$/i.test(filePath);
    const isUnixPath = /^\/.*\.csv$/i.test(filePath);

    if (isWindowsPath || isUnixPath) {
      // Normalize path separators for Windows
      if (isWindowsPath) {
        filePath = filePath.replace(/\//g, '\\');
      }

      // Verify file exists
      if (fs.existsSync(filePath)) {
        filePaths.push(filePath);
        console.log('检测到有效文件路径:', filePath);
      } else {
        console.log('文件不存在:', filePath);
      }
    }
  }

  return filePaths;
}

/**
 * 处理文件复制功能
 * 支持 CSV 和 Excel 文件
 * @param filePaths 文件路径数组
 * @param textEditor 文本编辑器
 * @param config 配置
 */
async function handleFileCopy(
  filePaths: string[],
  textEditor: vscode.TextEditor,
  config: Paste2TypConfig
): Promise<void> {
  try {
    const tables: Array<{content: string, format: 'csv' | 'excel', filename: string, filePath?: string, sheetName?: string}> = [];
    const errors: string[] = [];

    // Read each file
    for (const filePath of filePaths) {
      try {
        // Check if it's an Excel file
        if (isExcelFile(filePath)) {
          // Get sheet names
          const sheetNames = getExcelSheetNames(filePath);

          if (sheetNames.length === 0) {
            errors.push(`${path.basename(filePath)}: No sheets found`);
            continue;
          }

          // If multiple sheets, ask user which one to convert
          let selectedSheet: string;
          if (sheetNames.length > 1) {
            const selection = await vscode.window.showQuickPick(
              [...sheetNames, '--- Convert All Sheets ---'],
              {
                placeHolder: `Select sheet from ${path.basename(filePath)}`,
                title: 'Select Excel Sheet'
              }
            );

            if (!selection) {
              continue; // User cancelled
            }

            if (selection === '--- Convert All Sheets ---') {
              // Add all sheets as separate tables
              for (const sheetName of sheetNames) {
                tables.push({
                  content: '', // Will be parsed later
                  format: 'excel',
                  filename: `${path.basename(filePath, path.extname(filePath))}_${sheetName}`,
                  filePath,
                  sheetName
                });
              }
              continue;
            } else {
              selectedSheet = selection;
            }
          } else {
            selectedSheet = sheetNames[0];
          }

          tables.push({
            content: '', // Will be parsed later
            format: 'excel',
            filename: path.basename(filePath, path.extname(filePath)),
            filePath,
            sheetName: selectedSheet
          });
        } else {
          // CSV file
          const content = fs.readFileSync(filePath, 'utf-8');
          const format = detectFormat(content);

          if (format === 'unknown') {
            errors.push(`${path.basename(filePath)}: Unsupported format`);
            continue;
          }

          if (format === 'rtf') {
            errors.push(`${path.basename(filePath)}: RTF files are not supported. Please copy the table from Word and paste directly.`);
            continue;
          }

          tables.push({
            content,
            format: 'csv',
            filename: path.basename(filePath, path.extname(filePath))
          });
        }
      } catch (error: any) {
        errors.push(`${path.basename(filePath)}: ${error.message}`);
      }
    }

    // Show errors if any
    if (errors.length > 0) {
      vscode.window.showWarningMessage(
        `Some files could not be processed:\n${errors.join('\n')}`
      );
    }

    if (tables.length === 0) {
      vscode.window.showWarningMessage('No valid table files found');
      return;
    }

    // Process tables
    if (tables.length === 1) {
      // Single file: direct conversion (no panel)
      await processSingleFileTable(tables[0], textEditor, config);
    } else {
      // Multiple files: create panels
      await processMultipleFileTables(tables, textEditor, config);
    }
  } catch (error) {
    console.error('File copy error:', error);
    vscode.window.showErrorMessage(`Failed to process files: ${error}`);
  }
}

/**
 * 处理单个文件表格
 * 支持 CSV 和 Excel 文件
 * @param tableData 表格数据
 * @param textEditor 文本编辑器
 * @param config 配置
 */
async function processSingleFileTable(
  tableData: {content: string, format: 'csv' | 'excel', filename: string, filePath?: string, sheetName?: string},
  textEditor: vscode.TextEditor,
  config: Paste2TypConfig
): Promise<void> {
  let typstCode: string | null = null;

  if (tableData.format === 'excel' && tableData.filePath) {
    // Parse Excel file
    const parsedTable = parseExcel(tableData.filePath, tableData.sheetName);
    typstCode = quickConvert(parsedTable, config);
  } else if (tableData.format === 'csv') {
    // Convert CSV table using existing logic
    typstCode = await convertClipboardToTypst(tableData.content, 'csv', config);
  }

  if (typstCode) {
    // Save and insert using existing logic
    await saveAndInsertTable(typstCode, textEditor, config);
  }
}

/**
 * 处理多个文件表格（带Panel标题）
 * 支持 CSV 和 Excel 文件
 * @param tables 表格数据数组
 * @param textEditor 文本编辑器
 * @param config 配置
 */
async function processMultipleFileTables(
  tables: Array<{content: string, format: 'csv' | 'excel', filename: string, filePath?: string, sheetName?: string}>,
  textEditor: vscode.TextEditor,
  config: Paste2TypConfig
): Promise<void> {
  // Convert all tables first
  const convertedTables: Array<{typstCode: string, filename: string}> = [];

  for (const tableData of tables) {
    let typstCode: string | null = null;

    if (tableData.format === 'excel' && tableData.filePath) {
      // Parse Excel file
      const parsedTable = parseExcel(tableData.filePath, tableData.sheetName);
      typstCode = quickConvert(parsedTable, config);
    } else if (tableData.format === 'csv') {
      // Convert CSV table using existing logic
      typstCode = await convertClipboardToTypst(tableData.content, 'csv', config);
    }

    if (typstCode) {
      convertedTables.push({
        typstCode,
        filename: tableData.filename
      });
    }
  }

  if (convertedTables.length === 0) {
    vscode.window.showWarningMessage('No tables could be converted');
    return;
  }

  // Add panel titles to each table
  const tablesWithPanels: string[] = [];
  for (let i = 0; i < convertedTables.length; i++) {
    const table = convertedTables[i];
    const isFirstPanel = i === 0;
    const tableWithPanel = addPanelTitle(table.typstCode, table.filename, isFirstPanel);
    // Trim each table to remove trailing blank lines
    tablesWithPanels.push(tableWithPanel.trim());
  }

  // Combine all tables with blank lines between them
  const combinedContent = tablesWithPanels.join('\n\n');

  // Save and insert
  const currentFileUri = textEditor.document.uri;
  const currentFileDir = path.dirname(currentFileUri.fsPath);
  const tablesFolder = await ensureTypTablesFolder(currentFileDir);
  const fileName = await generateTableFileName(tablesFolder);

  await saveTableFile(tablesFolder, fileName, combinedContent);

  const folderName = vscode.workspace
    .getConfiguration('typstTablePaste')
    .get<string>('tableFolder', 'typ_tables');
  const relativePath = `${folderName}/${fileName}`;
  const template = vscode.workspace
    .getConfiguration('typstTablePaste')
    .get<string>('includeTemplate', '#figure(include "{path}")');
  const includeStatement = generateIncludeStatement(relativePath, template);

  const position = textEditor.selection.active;
  await textEditor.edit((editBuilder) => {
    editBuilder.insert(position, includeStatement);
  });

  vscode.window.showInformationMessage(`Combined ${convertedTables.length} tables into ${fileName}`);
}

/**
 * 为表格添加Panel标题
 * @param typstCode Typst代码
 * @param filename 文件名
 * @param isFirstPanel 是否是第一个panel
 * @returns 添加了Panel标题的Typst代码
 */
function addPanelTitle(typstCode: string, filename: string, isFirstPanel: boolean = false): string {
  // Extract column count from the typst code
  const columnMatch = typstCode.match(/columns:\s*\(([^)]+)\)/);
  const columnCount = columnMatch ? columnMatch[1].split(',').length : 3;

  // Find where to insert the panel title
  const lines = typstCode.split('\n');
  const resultLines: string[] = [];
  let insertedPanel = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // For first panel, insert after the first table.hline()
    // For subsequent panels, replace the first table.hline()
    if (!insertedPanel && line.trim() === 'table.hline(),') {
      if (isFirstPanel) {
        // Keep the top border for first panel
        resultLines.push(line);
        resultLines.push(`  table.cell(colspan: ${columnCount})[*Panel: ${filename}*],`);
        resultLines.push('  table.hline(),');
      } else {
        // Replace the top border for subsequent panels
        resultLines.push(`  table.cell(colspan: ${columnCount})[*Panel: ${filename}*],`);
        resultLines.push('  table.hline(),');
      }
      insertedPanel = true;
    } else {
      resultLines.push(line);
    }
  }

  return resultLines.join('\n');
}

/**
 * 保存表格并插入引用
 * @param typstCode Typst 代码
 * @param textEditor 文本编辑器
 * @param config 配置
 */
async function saveAndInsertTable(
  typstCode: string,
  textEditor: vscode.TextEditor,
  config: Paste2TypConfig
): Promise<void> {
  // 获取当前文件目录
  const currentFileUri = textEditor.document.uri;
  const currentFileDir = path.dirname(currentFileUri.fsPath);
  console.log('当前文件目录:', currentFileDir);

  // 创建 typ_tables 文件夹
  const tablesFolder = await ensureTypTablesFolder(currentFileDir);
  console.log('表格文件夹:', tablesFolder);

  // 生成文件名
  const fileName = await generateTableFileName(tablesFolder);
  console.log('生成的文件名:', fileName);

  // 保存表格文件
  await saveTableFile(tablesFolder, fileName, typstCode);
  console.log('表格文件已保存');

  // 获取配置的引用模板
  const template = vscode.workspace
    .getConfiguration('typstTablePaste')
    .get<string>('includeTemplate', '#figure(include "{path}")');

  // 生成引用代码
  const folderName = vscode.workspace
    .getConfiguration('typstTablePaste')
    .get<string>('tableFolder', 'typ_tables');
  const relativePath = `${folderName}/${fileName}`;
  const includeStatement = generateIncludeStatement(relativePath, template);
  console.log('引用代码:', includeStatement);

  // 插入引用
  const position = textEditor.selection.active;
  await textEditor.edit((editBuilder) => {
    editBuilder.insert(position, includeStatement);
  });

  vscode.window.showInformationMessage(`表格已保存到 ${fileName}`);
}

/**
 * 保存表格并返回引用代码
 * @param typstCode Typst 代码
 * @param textEditor 文本编辑器
 * @param config 配置
 * @returns 引用代码
 */
async function saveTableAndGetInclude(
  typstCode: string,
  textEditor: vscode.TextEditor,
  config: Paste2TypConfig
): Promise<string | null> {
  try {
    // 获取当前文件目录
    const currentFileUri = textEditor.document.uri;
    const currentFileDir = path.dirname(currentFileUri.fsPath);

    // 创建 typ_tables 文件夹
    const tablesFolder = await ensureTypTablesFolder(currentFileDir);

    // 生成文件名
    const fileName = await generateTableFileName(tablesFolder);

    // 保存表格文件
    await saveTableFile(tablesFolder, fileName, typstCode);

    // 获取配置的引用模板
    const template = vscode.workspace
      .getConfiguration('typstTablePaste')
      .get<string>('includeTemplate', '#figure(include "{path}")');

    // 生成引用代码
    const folderName = vscode.workspace
      .getConfiguration('typstTablePaste')
      .get<string>('tableFolder', 'typ_tables');
    const relativePath = `${folderName}/${fileName}`;
    const includeStatement = generateIncludeStatement(relativePath, template);

    return includeStatement;
  } catch (error) {
    console.error('保存表格错误:', error);
    return null;
  }
}

/**
 * 手动转换命令
 */
async function convertTableCommand() {
  const config = getConfig();

  try {
    // 读取剪贴板内容
    const clipboardText = await vscode.env.clipboard.readText();

    if (!clipboardText) {
      vscode.window.showWarningMessage('剪贴板为空');
      return;
    }

    // 检测格式
    const format = detectFormat(clipboardText);

    if (format === 'unknown') {
      vscode.window.showWarningMessage('剪贴板内容不是支持的表格格式');
      return;
    }

    // 转换表格
    const typstCode = await convertClipboardToTypst(clipboardText, format, config);

    if (typstCode) {
      // 获取当前编辑器
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        // 插入转换后的代码
        const position = editor.selection.active;
        await editor.edit((editBuilder) => {
          editBuilder.insert(position, typstCode);
        });

        vscode.window.showInformationMessage('表格已转换为 Typst 格式');
      } else {
        // 没有活动编辑器，复制到剪贴板
        await vscode.env.clipboard.writeText(typstCode);
        vscode.window.showInformationMessage('Typst 代码已复制到剪贴板');
      }
    }
  } catch (error) {
    console.error('转换错误:', error);
    vscode.window.showErrorMessage(`���换失败: ${error}`);
  }
}

/**
 * 从文件转换命令
 */
async function convertFromFileCommand() {
  const config = getConfig();

  try {
    // 打开文件选择对话框（支持 CSV 和 Excel 文件）
    const fileUris = await vscode.window.showOpenDialog({
      canSelectMany: true,
      filters: {
        'Table Files': ['csv', 'xlsx', 'xls', 'xlsm'],
        'CSV Files': ['csv'],
        'Excel Files': ['xlsx', 'xls', 'xlsm']
      },
      title: '选择要转换的表格文件'
    });

    if (!fileUris || fileUris.length === 0) {
      return;
    }

    // 获取当前编辑器
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('请先打开一个 Typst 文件');
      return;
    }

    // 读取文件路径
    const filePaths = fileUris.map(uri => uri.fsPath);
    console.log('选择的文件:', filePaths);

    // 使用现有的文件处理逻辑
    await handleFileCopy(filePaths, editor, config);
  } catch (error) {
    console.error('从文件转换错误:', error);
    vscode.window.showErrorMessage(`转换失败: ${error}`);
  }
}

/**
 * 将剪贴板内容转换为 Typst 格式
 * @param content 剪贴板内容
 * @param format 格式类型
 * @param config 配置
 * @returns Typst 代码
 */
async function convertClipboardToTypst(
  content: string,
  format: 'rtf' | 'csv',
  config: Paste2TypConfig
): Promise<string | null> {
  try {
    let table;

    if (format === 'csv') {
      // 解析 CSV
      table = parseCSV(content);
    } else if (format === 'rtf') {
      // 解析 RTF
      table = await parseRTF(content);
    } else {
      return null;
    }

    // 转换为 Typst
    const typstCode = quickConvert(table, config);
    return typstCode;
  } catch (error) {
    console.error('转换错误:', error);
    throw error;
  }
}

/**
 * 获取插件配置
 * @returns 配置对象
 */
function getConfig(): Paste2TypConfig {
  const config = vscode.workspace.getConfiguration('typstTablePaste');

  return {
    autoConvert: config.get<boolean>('autoConvert', true),
    preserveSuperscript: config.get<boolean>('preserveSuperscript', true),
    preserveBorders: config.get<boolean>('preserveBorders', true),
    preserveAlignment: config.get<boolean>('preserveAlignment', true),
    threeLineTable: config.get<boolean>('threeLineTable', false),
    autoMathMode: config.get<boolean>('autoMathMode', false),
    mathModeExclusions: config.get<string[]>('mathModeExclusions', [
      'Constant', 'Controls', 'Observations', 'N',
      'Fixed Effects', 'Year FE', 'Firm FE', 'Industry FE', 'Country FE'
    ]),
    addDividerAfterConstant: config.get<boolean>('addDividerAfterConstant', false),
  };
}

/**
 * 插件停用函数
 */
export function deactivate() {
  console.log('Paste2Typ 插件已停用');
}
