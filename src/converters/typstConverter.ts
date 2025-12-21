import { ParsedTable, Paste2TypConfig } from '../utils/types';
import { formatCellContent, getTypstAlignment } from './formatHandler';

/**
 * 将解析后的表格转换为 Typst 语法
 * @param table 解析后的表格
 * @param config 插件配置
 * @returns Typst 表格代码
 */
export function convertToTypst(table: ParsedTable, config: Paste2TypConfig): string {
  const { rows, columnCount } = table;

  if (rows.length === 0 || columnCount === 0) {
    return '';
  }

  // 生成列宽定义
  const columns = generateColumns(columnCount);

  // 生成对齐方式
  const alignment = generateAlignment(table, config);

  // 生成边框样式
  const stroke = generateStroke(table, config);

  // 生成单元格内容
  const cells = generateCells(table, config);

  // 组装 Typst 表格代码
  const typstCode = `#table(
  columns: ${columns},
  align: ${alignment},${stroke}

${cells}
)`;

  return typstCode;
}

/**
 * 生成列宽定义
 * @param columnCount 列数
 * @returns 列宽定义字符串
 */
function generateColumns(columnCount: number): string {
  // 第一列使用 auto（自动宽度），其他列使用 1fr（平均分配）
  const cols = ['auto', ...Array(columnCount - 1).fill('1fr')];
  return `(${cols.join(', ')})`;
}

/**
 * 生成对齐方式
 * @param table 表格
 * @param config 配置
 * @returns 对齐方式字符串
 */
function generateAlignment(table: ParsedTable, config: Paste2TypConfig): string {
  if (!config.preserveAlignment) {
    // 不保留对齐方式，使用默认：第一列左对齐，其他列居中
    const alignments = ['left', ...Array(table.columnCount - 1).fill('center')];
    return `(${alignments.join(', ')})`;
  }

  // 从第一行获取对齐方式
  if (table.rows.length > 0) {
    const alignments = table.rows[0].cells.map(cell =>
      getTypstAlignment(cell.alignment)
    );
    // 补齐列数（如果第一行列数不足）
    while (alignments.length < table.columnCount) {
      alignments.push('center');
    }
    return `(${alignments.join(', ')})`;
  }

  // 默认对齐
  const alignments = ['left', ...Array(table.columnCount - 1).fill('center')];
  return `(${alignments.join(', ')})`;
}

/**
 * 生成边框样式
 * @param table 表格
 * @param config 配置
 * @returns 边框样式字符串
 */
function generateStroke(table: ParsedTable, config: Paste2TypConfig): string {
  if (!config.preserveBorders) {
    return '';
  }

  // 检测哪些行有边框
  const topBorderRows = table.topBorderRows || [0];
  const bottomBorderRows = table.bottomBorderRows || [table.rows.length - 1];

  // 生成边框函数
  const strokeFunc = `
  stroke: (x, y) => (
    top: if y == 0 { 1pt } else { 0pt },
    bottom: if y == ${table.rows.length - 1} { 1pt } else { 0pt },
  ),`;

  return strokeFunc;
}

/**
 * 生成单元格内容
 * @param table 表格
 * @param config 配置
 * @returns 单元格内容字符串
 */
function generateCells(table: ParsedTable, config: Paste2TypConfig): string {
  const cellLines: string[] = [];
  const columnCount = table.columnCount;

  // 判断是否需要每个单元格单独一行
  const cellPerLine = columnCount > 5;

  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
    const row = table.rows[rowIndex];
    const cellContents: string[] = [];

    for (const cell of row.cells) {
      const content = formatCellContent(cell.content, config.preserveSuperscript);
      cellContents.push(`[${content}]`);
    }

    // 补齐列数（如果某行列数不足）
    while (cellContents.length < columnCount) {
      cellContents.push('[]');
    }

    if (cellPerLine) {
      // 每个单元格单独一行
      cellContents.forEach(cell => {
        cellLines.push(`  ${cell},`);
      });

      // 行间空两行
      if (rowIndex < table.rows.length - 1) {
        cellLines.push('');
        cellLines.push('');
      }
    } else {
      // 每行的所有单元格在一行
      cellLines.push('  ' + cellContents.join(', ') + ',');

      // 行间空一行
      if (rowIndex < table.rows.length - 1) {
        cellLines.push('');
      }
    }
  }

  return cellLines.join('\n');
}

/**
 * 快速转换（使用默认配置）
 * @param table 解析后的表格
 * @returns Typst 表格代码
 */
export function quickConvert(table: ParsedTable): string {
  const defaultConfig: Paste2TypConfig = {
    autoConvert: true,
    preserveSuperscript: true,
    preserveBorders: true,
    preserveAlignment: true,
  };

  return convertToTypst(table, defaultConfig);
}
