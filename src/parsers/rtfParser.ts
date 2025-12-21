import { ParsedTable } from '../utils/types';

/**
 * 解析 RTF 表格（仅支持剪贴板 RTF）
 * 注意：不支持直接从 RTF 文件解析
 *
 * 从 Excel/Word 复制表格时，剪贴板中的 RTF 格式可以被正确解析。
 * 但是直接从 RTF 文件读取的内容由于格式复杂，暂不支持。
 *
 * @param content RTF 内容
 * @returns 解析后的表格
 */
export async function parseRTF(content: string): Promise<ParsedTable> {
  throw new Error('Direct RTF file parsing is not supported. Please copy the table from Excel/Word and paste directly using Ctrl+Shift+V.');
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
