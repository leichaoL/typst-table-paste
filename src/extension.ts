import * as vscode from 'vscode';
import * as path from 'path';
import { detectFormat, isTableFormat, extractTables } from './parsers/formatDetector';
import { parseCSV } from './parsers/csvParser';
import { parseRTF } from './parsers/rtfParser';
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

  // 注册粘贴拦截器
  const pasteHandler = vscode.commands.registerTextEditorCommand(
    'typst-table-paste.paste',
    async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
      console.log('typst-table-paste.paste 命令被调用');
      await handlePaste(textEditor, edit);
    }
  );

  context.subscriptions.push(convertCommand, pasteHandler);

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
  };
}

/**
 * 插件停用函数
 */
export function deactivate() {
  console.log('Paste2Typ 插件已停用');
}
