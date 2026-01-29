/**
 * 数字四舍五入工具
 * 支持多种数字格式的四舍五入处理
 */

/**
 * 正则表达式模式
 */
const PATTERNS = {
  // 匹配 #super[***] 格式（Typst 上标语法）
  superPattern: /#super\[(\*+)\]/,

  // 匹配科学计数法：1.23e-5, 1.23E+10
  scientificPattern: /^(-?\d+\.?\d*)([eE][+-]?\d+)$/,

  // 匹配百分比：12.34%
  percentagePattern: /^(-?\d+\.?\d*)%$/,

  // 匹配括号中的数字：(0.123) 或 (-0.123)
  parenthesesPattern: /^\((-?\d+\.?\d*)\)$/,

  // 匹配普通数字（可能带星号）：0.123*** 或 -0.123*
  normalPattern: /^(-?\d+\.?\d*)(\**)$/,

  // 检测是否包含数字
  containsNumberPattern: /\d/
};

/**
 * 预处理 Typst 特殊语法
 * 提取 #super[***] 中的星号，并返回清理后的字符串
 */
function preprocessTypstSyntax(value: string): { cleaned: string; superStars: string } {
  const superMatch = value.match(PATTERNS.superPattern);
  if (superMatch) {
    // 提取 #super[***] 中的星号
    const stars = superMatch[1];
    // 移除 #super[***] 部分
    const cleaned = value.replace(PATTERNS.superPattern, '').trim();
    return { cleaned, superStars: stars };
  }
  return { cleaned: value, superStars: '' };
}

/**
 * 检测字符串是否包含数字
 */
function containsNumber(value: string): boolean {
  return PATTERNS.containsNumberPattern.test(value);
}

/**
 * 四舍五入数字到指定小数位数
 * @param value 数字字符串
 * @param decimalPlaces 小数位数
 * @returns 四舍五入后的字符串
 */
export function roundNumber(value: string, decimalPlaces: number): string {
  // 跳过空字符串
  if (!value || value.trim().length === 0) {
    return value;
  }

  // 检测是否包含数字
  if (!containsNumber(value)) {
    return value;
  }

  // 预处理：提取 Typst 语法
  const { cleaned, superStars } = preprocessTypstSyntax(value);

  // 检测科学计数法
  const scientificMatch = cleaned.match(PATTERNS.scientificPattern);
  if (scientificMatch) {
    const [, mantissa, exponent] = scientificMatch;
    const rounded = Number(mantissa).toFixed(decimalPlaces);
    return `${rounded}${exponent}${superStars ? `#super[${superStars}]` : ''}`;
  }

  // 检测百分比
  const percentMatch = cleaned.match(PATTERNS.percentagePattern);
  if (percentMatch) {
    const [, number] = percentMatch;
    const rounded = Number(number).toFixed(decimalPlaces);
    return `${rounded}%${superStars ? `#super[${superStars}]` : ''}`;
  }

  // 检测括号
  const parenMatch = cleaned.match(PATTERNS.parenthesesPattern);
  if (parenMatch) {
    const [, number] = parenMatch;
    const rounded = Number(number).toFixed(decimalPlaces);
    return `(${rounded})${superStars ? `#super[${superStars}]` : ''}`;
  }

  // 检测普通数字（可能带星号）
  const normalMatch = cleaned.match(PATTERNS.normalPattern);
  if (normalMatch) {
    const [, number, stars] = normalMatch;

    // 检查是否为有效数字
    if (isNaN(Number(number))) {
      return value;
    }

    const rounded = Number(number).toFixed(decimalPlaces);

    // 如果有 superStars，使用 #super 语法；否则使用直接星号
    if (superStars) {
      return `${rounded}#super[${superStars}]`;
    } else if (stars) {
      return `${rounded}${stars}`;
    } else {
      return rounded;
    }
  }

  // 不是数字，返回原值
  return value;
}

/**
 * 批量处理数字数组
 * @param values 数字字符串数组
 * @param decimalPlaces 小数位数
 * @returns 处理后的数组和处理计数
 */
export function roundNumbers(
  values: string[],
  decimalPlaces: number
): { rounded: string[]; count: number } {
  let count = 0;
  const rounded = values.map(value => {
    const result = roundNumber(value, decimalPlaces);
    if (result !== value) {
      count++;
    }
    return result;
  });

  return { rounded, count };
}

/**
 * 检测字符串是否为数字（用于测试）
 */
export function isNumeric(value: string): boolean {
  const { cleaned } = preprocessTypstSyntax(value);

  // 尝试所有模式
  return (
    PATTERNS.scientificPattern.test(cleaned) ||
    PATTERNS.percentagePattern.test(cleaned) ||
    PATTERNS.parenthesesPattern.test(cleaned) ||
    PATTERNS.normalPattern.test(cleaned)
  );
}
