/**
 * Typst 文件处理器
 * 用于处理 .typ 文件中的表格数字四舍五入
 */

import * as fs from 'fs';
import { roundNumber } from './numberRounder';

/**
 * 处理结果
 */
export interface ProcessResult {
  /** 处理后的内容 */
  content: string;
  /** 处理的数字数量 */
  processedCount: number;
}

/**
 * 处理 Typst 文件中的表格数字
 * @param filePath 文件路径
 * @param decimalPlaces 小数位数
 * @returns 处理结果
 */
export async function processTypstFile(
  filePath: string,
  decimalPlaces: number
): Promise<ProcessResult> {
  // 1. 读取文件
  const content = fs.readFileSync(filePath, 'utf-8');

  // 2. 检查是否包含表格
  if (!containsTable(content)) {
    throw new Error('文件中未找到表格结构');
  }

  // 3. 处理表格单元格
  let processedCount = 0;

  // 匹配 [content] 格式的单元格
  // 使用更复杂的正则表达式来处理嵌套的 #super[***]
  const processed = content.replace(
    /\[([^\[\]]*(?:#super\[[^\]]*\])?[^\[\]]*)\]/g,
    (match, cellContent) => {
      // 跳过空单元格
      if (!cellContent || cellContent.trim().length === 0) {
        return match;
      }

      // 处理单元格内容
      const roundedContent = processCellContent(cellContent, decimalPlaces);

      // 如果内容改变了，计数
      if (roundedContent !== cellContent) {
        processedCount++;
      }

      return `[${roundedContent}]`;
    }
  );

  return { content: processed, processedCount };
}

/**
 * 处理单元格内容
 * 单元格可能包含多个数字，例如：0.123#super[***] (0.045)
 * @param cellContent 单元格内容
 * @param decimalPlaces 小数位数
 * @returns 处理后的内容
 */
function processCellContent(cellContent: string, decimalPlaces: number): string {
  // 如果单元格内容包含空格，可能是混合内容（数字 + 括号等）
  // 例如：0.123#super[***] (0.045)

  // 策略：分割单元格内容，对每个部分尝试四舍五入
  const parts = cellContent.split(/(\s+)/); // 保留空格

  const processedParts = parts.map(part => {
    // 跳过空格
    if (/^\s+$/.test(part)) {
      return part;
    }

    // 尝试四舍五入
    return roundNumber(part, decimalPlaces);
  });

  return processedParts.join('');
}

/**
 * 检测文件是否包含表格
 * @param content 文件内容
 * @returns 是否包含表格
 */
export function containsTable(content: string): boolean {
  return /#table\s*\(/.test(content);
}

/**
 * 提取所有表格单元格内容（用于预览或调试）
 * @param content 文件内容
 * @returns 单元格内容数组
 */
export function extractCellContents(content: string): string[] {
  const cells: string[] = [];
  const regex = /\[([^\[\]]*(?:#super\[[^\]]*\])?[^\[\]]*)\]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    cells.push(match[1]);
  }

  return cells;
}

/**
 * 验证文件是否为 .typ 文件
 * @param filePath 文件路径
 * @returns 是否为 .typ 文件
 */
export function isTypstFile(filePath: string): boolean {
  return filePath.endsWith('.typ');
}

/**
 * 检查文件是否存在
 * @param filePath 文件路径
 * @returns 文件是否存在
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}
