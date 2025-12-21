/**
 * 表格单元格
 */
export interface TableCell {
  /** 单元格内容 */
  content: string;
  /** 对齐方式 */
  alignment: 'left' | 'center' | 'right';
  /** 是否有顶部边框 */
  hasTopBorder: boolean;
  /** 是否有底部边框 */
  hasBottomBorder: boolean;
  /** 是否包含上标 */
  hasSuperscript: boolean;
}

/**
 * 表格行
 */
export interface TableRow {
  /** 单元格列表 */
  cells: TableCell[];
}

/**
 * 解析后的表格
 */
export interface ParsedTable {
  /** 表格行列表 */
  rows: TableRow[];
  /** 列数 */
  columnCount: number;
  /** 是否有顶部边框行（用于标识哪些行有顶部边框） */
  topBorderRows?: number[];
  /** 是否有底部边框行（用于标识哪些行有底部边框） */
  bottomBorderRows?: number[];
}

/**
 * 格式类型
 */
export type FormatType = 'rtf' | 'csv' | 'unknown';

/**
 * CSV 格式类型
 */
export type CSVFormatType = 'equals' | 'standard';

/**
 * 插件配置
 */
export interface Paste2TypConfig {
  /** 是否自动转换 */
  autoConvert: boolean;
  /** 是否保留上标 */
  preserveSuperscript: boolean;
  /** 是否保留边框 */
  preserveBorders: boolean;
  /** 是否保留对齐方式 */
  preserveAlignment: boolean;
  /** 是否使用三线表格式 */
  threeLineTable?: boolean;
  /** 是否自动转换为数学模式 */
  autoMathMode?: boolean;
  /** 数学模式排除列表 */
  mathModeExclusions?: string[];
  /** 是否在 Constant 行后添加分割线 */
  addDividerAfterConstant?: boolean;
}
