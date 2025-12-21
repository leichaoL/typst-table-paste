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

  // Normalize line endings for consistent detection
  const normalized = content.replace(/\r\n/g, '\n');

  // 先检测 RTF（RTF 有明确的标识）
  if (isRTF(normalized)) {
    return 'rtf';
  }

  // 再检测 CSV
  if (isCSV(normalized)) {
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

/**
 * 从大段文本中提取表格
 * @param content 内容
 * @returns 提取的表格数组，每个元素包含表格内容和格式类型
 */
export function extractTables(content: string): Array<{ content: string; format: FormatType }> {
  const tables: Array<{ content: string; format: FormatType }> = [];

  // 尝试提取 RTF 表格
  if (content.includes('\\trowd')) {
    const rtfTableRegex = /\\trowd[\s\S]*?(?=\\trowd|\\par\\par|$)/g;
    const rtfMatches = content.match(rtfTableRegex);
    if (rtfMatches) {
      rtfMatches.forEach(match => {
        // 确保提取的内容是完整的 RTF 文档
        let rtfContent = match;
        if (!rtfContent.startsWith('{\\rtf')) {
          // 添加 RTF 头部
          rtfContent = `{\\rtf1\\ansi\\deff0 ${rtfContent}}`;
        }
        tables.push({ content: rtfContent, format: 'rtf' });
      });
    }
  }

  // 尝试提取 CSV 表格（连续的多行，每行有相同数量的分隔符）
  const lines = content.split('\n');
  let currentTable: string[] = [];
  let lastDelimiterCount = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 跳过空行
    if (!line) {
      if (currentTable.length >= 3) {
        const tableContent = currentTable.join('\n');
        if (isCSV(tableContent)) {
          tables.push({ content: tableContent, format: 'csv' });
        }
      }
      currentTable = [];
      lastDelimiterCount = -1;
      continue;
    }

    // 计算分隔符数量（逗号或等号）
    const commaCount = (line.match(/,/g) || []).length;
    const equalsCount = (line.match(/="/g) || []).length;
    const delimiterCount = Math.max(commaCount, equalsCount);

    // 如果这行看起来像表格行（有足够的分隔符）
    if (delimiterCount >= 2) {
      if (lastDelimiterCount === -1 || Math.abs(delimiterCount - lastDelimiterCount) <= 2) {
        currentTable.push(line);
        lastDelimiterCount = delimiterCount;
      } else {
        // 分隔符数量差异太大，可能是新表格
        if (currentTable.length >= 3) {
          const tableContent = currentTable.join('\n');
          if (isCSV(tableContent)) {
            tables.push({ content: tableContent, format: 'csv' });
          }
        }
        currentTable = [line];
        lastDelimiterCount = delimiterCount;
      }
    } else {
      // 不是表格行
      if (currentTable.length >= 3) {
        const tableContent = currentTable.join('\n');
        if (isCSV(tableContent)) {
          tables.push({ content: tableContent, format: 'csv' });
        }
      }
      currentTable = [];
      lastDelimiterCount = -1;
    }
  }

  // 处理最后一个表格
  if (currentTable.length >= 3) {
    const tableContent = currentTable.join('\n');
    if (isCSV(tableContent)) {
      tables.push({ content: tableContent, format: 'csv' });
    }
  }

  return tables;
}
