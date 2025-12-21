import * as rtfParser from 'rtf-parser';
import { ParsedTable, TableRow, TableCell } from '../utils/types';

/**
 * 解析 RTF 表格
 * @param content RTF 内容
 * @returns 解析后的表格
 */
export async function parseRTF(content: string): Promise<ParsedTable> {
  try {
    // 使用 rtf-parser 解析 RTF 文档
    const doc = await rtfParser.string(content);

    // 提取表格数据
    const table = extractTableFromRTF(doc);

    return table;
  } catch (error) {
    console.error('RTF 解析错误:', error);
    throw new Error('无法解析 RTF 格式');
  }
}

/**
 * 从 RTF 文档中提取表格
 * @param doc RTF 文档对象
 * @returns 解析后的表格
 */
function extractTableFromRTF(doc: any): ParsedTable {
  const rows: TableRow[] = [];
  let columnCount = 0;
  const topBorderRows: number[] = [];
  const bottomBorderRows: number[] = [];

  // 遍历文档内容，查找表格行
  if (doc.content && Array.isArray(doc.content)) {
    let rowIndex = 0;

    for (const item of doc.content) {
      if (item.type === 'table-row') {
        const row = parseTableRow(item, rowIndex);
        rows.push(row);

        // 更新列数
        if (row.cells.length > columnCount) {
          columnCount = row.cells.length;
        }

        // 检查边框
        if (row.cells.some(cell => cell.hasTopBorder)) {
          topBorderRows.push(rowIndex);
        }
        if (row.cells.some(cell => cell.hasBottomBorder)) {
          bottomBorderRows.push(rowIndex);
        }

        rowIndex++;
      }
    }
  }

  return {
    rows,
    columnCount,
    topBorderRows,
    bottomBorderRows,
  };
}

/**
 * 解析表格行
 * @param rowItem RTF 行对象
 * @param rowIndex 行索引
 * @returns 表格行
 */
function parseTableRow(rowItem: any, rowIndex: number): TableRow {
  const cells: TableCell[] = [];

  if (rowItem.content && Array.isArray(rowItem.content)) {
    for (const cellItem of rowItem.content) {
      if (cellItem.type === 'table-cell') {
        const cell = parseTableCell(cellItem, rowIndex);
        cells.push(cell);
      }
    }
  }

  return { cells };
}

/**
 * 解析表格单元格
 * @param cellItem RTF 单元格对象
 * @param rowIndex 行索引
 * @returns 表格单元格
 */
function parseTableCell(cellItem: any, rowIndex: number): TableCell {
  // 提取单元格内容
  const content = extractCellContent(cellItem);

  // 提取对齐方式
  const alignment = extractAlignment(cellItem);

  // 检查边框
  const hasTopBorder = hasBorder(cellItem, 'top');
  const hasBottomBorder = hasBorder(cellItem, 'bottom');

  // 检查是否包含上标
  const hasSuperscript = content.includes('***') || content.includes('**') || content.includes('*');

  return {
    content,
    alignment,
    hasTopBorder,
    hasBottomBorder,
    hasSuperscript,
  };
}

/**
 * 提取单元格内容
 * @param cellItem RTF 单元格对象
 * @returns 单元格内容
 */
function extractCellContent(cellItem: any): string {
  let content = '';

  if (cellItem.content && Array.isArray(cellItem.content)) {
    for (const item of cellItem.content) {
      if (item.type === 'paragraph' && item.content) {
        content += extractTextFromParagraph(item);
      } else if (item.type === 'text') {
        content += item.value || '';
      }
    }
  }

  return content.trim();
}

/**
 * 从段落中提取文本
 * @param paragraph 段落对象
 * @returns 文本内容
 */
function extractTextFromParagraph(paragraph: any): string {
  let text = '';

  if (paragraph.content && Array.isArray(paragraph.content)) {
    for (const item of paragraph.content) {
      if (item.type === 'text') {
        text += item.value || '';
      } else if (item.type === 'span' && item.content) {
        // 处理样式文本（如上标）
        for (const spanItem of item.content) {
          if (spanItem.type === 'text') {
            text += spanItem.value || '';
          }
        }
      }
    }
  }

  return text;
}

/**
 * 提取对齐方式
 * @param cellItem RTF 单元格对象
 * @returns 对齐方式
 */
function extractAlignment(cellItem: any): 'left' | 'center' | 'right' {
  // 检查单元格或段落的对齐属性
  if (cellItem.style && cellItem.style.align) {
    const align = cellItem.style.align.toLowerCase();
    if (align === 'center' || align === 'c') {
      return 'center';
    } else if (align === 'right' || align === 'r') {
      return 'right';
    }
  }

  // 检查段落对齐
  if (cellItem.content && Array.isArray(cellItem.content)) {
    for (const item of cellItem.content) {
      if (item.type === 'paragraph' && item.style && item.style.align) {
        const align = item.style.align.toLowerCase();
        if (align === 'center' || align === 'c') {
          return 'center';
        } else if (align === 'right' || align === 'r') {
          return 'right';
        }
      }
    }
  }

  return 'left';
}

/**
 * 检查是否有边框
 * @param cellItem RTF 单元格对象
 * @param position 边框位置
 * @returns 是否有边框
 */
function hasBorder(cellItem: any, position: 'top' | 'bottom'): boolean {
  if (cellItem.style && cellItem.style.borders) {
    const borders = cellItem.style.borders;
    return borders[position] !== undefined && borders[position] !== null;
  }
  return false;
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
