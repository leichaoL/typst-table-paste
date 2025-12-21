import { FormatType } from '../utils/types';
import { isRTF } from './rtfParser';
import { isCSV } from './csvParser';

/**
 * 检测内容格式
 * @param content 内容
 * @returns 格式类型
 */
export function detectFormat(content: string): FormatType {
  if (!content || content.trim() === '') {
    return 'unknown';
  }

  // 先检测 RTF（RTF 有明确的标识）
  if (isRTF(content)) {
    return 'rtf';
  }

  // 再检测 CSV
  if (isCSV(content)) {
    return 'csv';
  }

  return 'unknown';
}

/**
 * 检测内容是否为表格格式（RTF 或 CSV）
 * @param content 内容
 * @returns 是否为表格格式
 */
export function isTableFormat(content: string): boolean {
  const format = detectFormat(content);
  return format === 'rtf' || format === 'csv';
}
