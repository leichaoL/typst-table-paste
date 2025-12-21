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
 * @returns 处理后的内容
 */
export function formatCellContent(content: string, preserveSuperscript: boolean = true): string {
  if (!content || content.trim() === '') {
    return '';
  }

  let formatted = content.trim();

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
