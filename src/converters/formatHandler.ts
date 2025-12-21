import { ParsedTable, Paste2TypConfig } from '../utils/types';

/**
 * 处理显著性标记（星号）转换为 Typst 上标语法
 * @param text 原始文本
 * @returns 处理后的文本
 */
export function handleSuperscript(text: string): string {
  // 匹配数字或括号后的星号
  // 例如：-0.06*** → -0.06#super[***]
  //      (14.40) → (14.40) (无变化)
  //      0.22*** → 0.22#super[***]
  return text.replace(/(-?\d+\.?\d*|\))(\*+)/g, (match, prefix, stars) => {
    return `${prefix}#super[${stars}]`;
  });
}

/**
 * 转义 Typst 特殊字符
 * @param text 原始文本
 * @returns 转义后的文本
 */
export function escapeTypstSpecialChars(text: string): string {
  // 在 Typst 的 [] 内容块中，某些字符需要转义
  // 但星号在 #super[] 中不需要转义
  // 需要转义的字符：# $ [ ] < > @ \ *
  return text
    .replace(/\\/g, '\\\\')  // 反斜杠
    .replace(/\*/g, '\\*')   // 星号（新增）
    .replace(/#/g, '\\#')    // 井号（除非是函数调用）
    .replace(/\$/g, '\\$')   // 美元符号
    .replace(/</g, '\\<')    // 小于号
    .replace(/>/g, '\\>')    // 大于号
    .replace(/@/g, '\\@');   // at 符号
}

/**
 * 处理单元格内容
 * @param content 原始内容
 * @param preserveSuperscript 是否保留上标
 * @param rowIndex 行索引
 * @param colIndex 列索引
 * @param table 表格对象
 * @param config 配置对象
 * @returns 处理后的内容
 */
export function formatCellContent(
  content: string,
  preserveSuperscript: boolean = true,
  rowIndex?: number,
  colIndex?: number,
  table?: ParsedTable,
  config?: Paste2TypConfig
): string {
  if (!content || content.trim() === '') {
    return '';
  }

  let formatted = content.trim();

  // Special handling for R^2 patterns with prefixes (Adj., Pseudo, etc.)
  // Convert "Adj.R^2" to "Adj. $R^2$", "Pseudo R2" to "Pseudo $R^2$", etc.
  const r2WithPrefixMatch = formatted.match(/^(Adj\.|Adjusted|Pseudo)\s*(R2|R²|R\^2)$/i);
  if (r2WithPrefixMatch) {
    const prefix = r2WithPrefixMatch[1];
    // Always convert R^2 part to $R^2$
    return `${prefix} $R^2$`;
  }

  // Special handling for standalone R^2
  if (/^R2$|^R²$|^R\^2$/i.test(formatted)) {
    return '$R^2$';
  }

  // 如果启用自动数学模式，先进行数学模式转换
  if (config?.autoMathMode && rowIndex !== undefined && colIndex !== undefined && table) {
    const exclusions = config.mathModeExclusions || [];
    if (shouldConvertToMathMode(formatted, rowIndex, colIndex, table, exclusions)) {
      formatted = convertToMathMode(formatted);
      // 如果已经转换为数学模式，直接返回（数学模式内部不需要转义）
      return formatted;
    }
  }

  // 如果需要保留上标，先处理上标
  if (preserveSuperscript) {
    formatted = handleSuperscript(formatted);
  }

  // 注意：不要对已经处理过的 #super[] 部分进行转义
  // 简单处理：先标记 #super[] 部分，转义其他内容，再还原
  const superscriptPattern = /#super\[[^\]]+\]/g;
  const superscripts: string[] = [];
  let index = 0;

  // 提取所有 #super[] 部分
  formatted = formatted.replace(superscriptPattern, (match) => {
    superscripts.push(match);
    return `__SUPER_${index++}__`;
  });

  // 转义特殊字符（但不包括已提取的 #super[] 部分）
  formatted = escapeTypstSpecialChars(formatted);

  // 还原 #super[] 部分，并转义其中的星号
  superscripts.forEach((sup, i) => {
    // 转义 #super[] 中的星号
    // #super[***] → #super[\*\*\*]
    const escapedSup = sup.replace(/\*/g, '\\*');
    formatted = formatted.replace(`__SUPER_${i}__`, escapedSup);
  });

  return formatted;
}

/**
 * 获取对齐方式的 Typst 表示
 * @param alignment 对齐方式
 * @returns Typst 对齐方式
 */
export function getTypstAlignment(alignment: 'left' | 'center' | 'right'): string {
  switch (alignment) {
    case 'left':
      return 'left';
    case 'center':
      return 'center';
    case 'right':
      return 'right';
    default:
      return 'center';
  }
}

/**
 * 检测是否应该转换为数学模式
 * @param content 单元格内容
 * @param rowIndex 行索引
 * @param colIndex 列索引
 * @param table 表格对象
 * @param exclusions 排除列表
 * @returns 是否应该转换
 */
function shouldConvertToMathMode(
  content: string,
  rowIndex: number,
  colIndex: number,
  table: ParsedTable,
  exclusions: string[]
): boolean {
  // 空内容不转换
  if (!content || content.trim() === '') {
    return false;
  }

  // 排除列表中的项不转换
  if (exclusions.some(ex => content.includes(ex))) {
    return false;
  }

  // 排除纯数字或以数字开头的内容（这些是统计值）
  // 例如：0.05, -0.06, (0.01), [0.02], 123
  // 但不排除 log(Min_invest) 这样的函数形式
  if (/^[-+]?\d/.test(content.trim()) && !/^log\(|^ln\(|^exp\(/i.test(content.trim())) {
    return false;
  }

  // 排除只包含括号或星号的内容（这些是统计值或显著性标记）
  // 但不排除 PJ_H * Post 或 log(Min_invest) 这样的表达式
  if (/^\([-+]?\d/.test(content.trim()) || /^\*+$/.test(content.trim())) {
    return false;
  }

  // 表头行（前两行）的变量名转换
  if (rowIndex <= 1) {
    return true;
  }

  // 第一列的变量名转换逻辑
  if (colIndex === 0) {
    // 查找分界线：Constant, Controls, Fixed Effects, Observations 等
    // 这些关键词标志着变量部分的结束
    const boundaryKeywords = [
      'constant', 'controls', 'fixed effect', 'observations',
      'n =', 'n=',
      'year fe', 'firm fe', 'industry fe', 'country fe', 'time fe', 'individual fe',
      'institution fe'
    ];

    // 找到第一个出现分界关键词的行
    let boundaryIndex = -1;
    for (let i = 0; i < table.rows.length; i++) {
      const firstCellContent = table.rows[i].cells[0]?.content.toLowerCase() || '';
      if (boundaryKeywords.some(keyword => firstCellContent.includes(keyword))) {
        boundaryIndex = i;
        break;
      }
    }

    // 如果找到了分界线，只转换分界线之前的行
    if (boundaryIndex !== -1) {
      return rowIndex < boundaryIndex;
    }

    // 如果没有找到分界线，转换所有第一列的内容（除了前两行已经处理过的）
    return true;
  }

  return false;
}

/**
 * 转换为数学模式
 * @param content 原始内容
 * @returns 转换后的内容
 */
function convertToMathMode(content: string): string {
  // 特殊处理包含 * 的交互项，如 PJ_H * Post
  if (/\*/.test(content) && !/^\*+$/.test(content)) {
    // 将 * 替换为 times，并包裹在 italic 中
    const parts = content.split('*').map(p => p.trim());
    const formattedParts = parts.map(p => `italic("${p}")`).join(' times ');
    return `$${formattedParts}$`;
  }

  // 特殊处理函数形式，如 log(Min_invest), ln(X), exp(Y)
  const funcMatch = content.match(/^(log|ln|exp)\((.+)\)$/i);
  if (funcMatch) {
    const funcName = funcMatch[1].toLowerCase();
    const varName = funcMatch[2];
    return `$${funcName}(italic("${varName}"))$`;
  }

  // 如果内容是变量名（字母、数字、下划线、空格组合）
  // 匹配：VarA, var_b, Var A, GDP growth, X1, alpha_1 等
  // 不匹配：纯数字、包含特殊符号的内容
  if (/^[a-zA-Z_][a-zA-Z0-9_\s]*$/.test(content)) {
    // 检查是否是单个字母（不含数字、下划线、空格）
    if (/^[a-zA-Z]$/.test(content)) {
      // 单个字母直接使用数学模式
      return `$${content}$`;
    }

    // 多字母或包含数字/空格/下划线的变量名，使用 italic() 包裹
    // 这样可以正确渲染为一个变量名，而不是多个变量相乘
    return `$italic("${content}")$`;
  }

  // 如果包含常见的希腊字母名称，也转换
  const greekLetters = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu', 'sigma', 'phi', 'psi', 'omega'];
  if (greekLetters.some(letter => content.toLowerCase().includes(letter))) {
    return `$italic("${content}")$`;
  }

  return content;
}
