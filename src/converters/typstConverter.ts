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
  // Three-line tables use table.hline() and need stroke: none to remove grid lines
  if (config.threeLineTable) {
    return '\n  stroke: none,';
  }

  // If not using three-line table, check preserveBorders
  if (!config.preserveBorders) {
    return '';
  }

  // Generate stroke function for non-three-line tables
  const strokeFunc = `
  stroke: (x, y) => (
    top: if y == 0 { 1pt } else { 0pt },
    bottom: if y == ${table.rows.length - 1} { 1pt } else { 0pt },
  ),`;

  return strokeFunc;
}

/**
 * 检测表头行位置
 * @param table 表格
 * @returns 表头行索引
 */
function detectHeaderRow(table: ParsedTable): number {
  if (table.rows.length === 0) {
    return 0;
  }

  // 检测第一行是否包含列标识，如 (1), (2), (3) 等
  if (table.rows.length > 1) {
    const firstRowText = table.rows[0].cells.map(c => c.content).join(' ');
    // 匹配 (1), (2), (I), (II), [1], [2] 等模式
    if (/\([\dIVXivx]+\)|\[[\dIVXivx]+\]/.test(firstRowText)) {
      return 1; // 第二行是表头
    }
  }

  return 0; // 第一行是表头
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

  // Add top line for three-line table
  if (config.threeLineTable) {
    cellLines.push('  table.hline(),');
    cellLines.push('');
  }

  // Detect header row for three-line table
  const headerRow = config.threeLineTable ? detectHeaderRow(table) : -1;

  for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
    const row = table.rows[rowIndex];
    const cellContents: string[] = [];

    for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
      const cell = row.cells[cellIndex];
      const content = formatCellContent(
        cell.content,
        config.preserveSuperscript,
        rowIndex,
        cellIndex,
        table,
        config
      );
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

    // Add header bottom line for three-line table
    if (config.threeLineTable && rowIndex === headerRow) {
      cellLines.push('');
      cellLines.push('  table.hline(),');
      cellLines.push('');
    }
  }

  // Add bottom line for three-line table
  if (config.threeLineTable) {
    cellLines.push('');
    cellLines.push('  table.hline(),');
  }

  return cellLines.join('\n');
}

/**
 * 快速转换（使用默认配置）
 * @param table 解析后的表格
 * @param config 可选的配置对象
 * @returns Typst 表格代码
 */
export function quickConvert(table: ParsedTable, config?: Paste2TypConfig): string {
  const defaultConfig: Paste2TypConfig = {
    autoConvert: true,
    preserveSuperscript: true,
    preserveBorders: true,
    preserveAlignment: true,
    threeLineTable: false,
    autoMathMode: false,
    mathModeExclusions: [
      'Constant', 'Controls', 'Observations', 'N',
      'Fixed Effects', 'Year FE', 'Firm FE', 'Industry FE', 'Country FE'
    ],
  };

  // Merge provided config with defaults
  const finalConfig = config ? { ...defaultConfig, ...config } : defaultConfig;

  return convertToTypst(table, finalConfig);
}
