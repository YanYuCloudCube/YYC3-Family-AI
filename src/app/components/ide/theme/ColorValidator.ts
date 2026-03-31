/**
 * @file ColorValidator.ts
 * @description 颜色验证器 - 验证颜色值的格式、有效性、对比度等
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-31
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags theme,color,validator,accessibility
 */

// ================================================================
// ColorValidator - Color value validation and contrast calculation
// ================================================================

/**
 * 颜色格式类型
 */
export type ColorFormat =
  | "hex" // #RRGGBB, #RGB, #RRGGBBAA, #RGBA
  | "rgb" // rgb(r, g, b), rgba(r, g, b, a)
  | "hsl" // hsl(h, s, l), hsla(h, s, l, a)
  | "named"; // color names

/**
 * 颜色验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 颜色格式 */
  format?: ColorFormat;
  /** 标准化的颜色值 */
  normalized?: string;
  /** 错误信息 */
  error?: string;
  /** 颜色值（RGBA格式） */
  rgba?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

/**
 * 颜色对比度结果
 */
export interface ContrastResult {
  /** 对比度比值 (1-21) */
  ratio: number;
  /** WCAG AA等级 */
  wcagAA: boolean;
  /** WCAG AAA等级 */
  wcagAAA: boolean;
  /** 建议 */
  suggestion: string;
}

/**
 * 颜色验证器配置
 */
export interface ColorValidatorConfig {
  /** 是否允许透明色 */
  allowTransparent?: boolean;
  /** 最小对比度阈值 */
  minContrastRatio?: number;
  /** 自定义默认颜色 */
  defaultColor?: string;
}

/**
 * 颜色验证器
 *
 * 提供颜色格式验证、标准化、对比度计算等功能
 */
export class ColorValidator {
  private config: ColorValidatorConfig;

  // 颜色名称映射表（常用颜色）
  private static readonly COLOR_NAMES: Record<string, string> = {
    transparent: "rgba(0, 0, 0, 0)",
    black: "rgba(0, 0, 0, 1)",
    white: "rgba(255, 255, 255, 1)",
    red: "rgba(255, 0, 0, 1)",
    green: "rgba(0, 255, 0, 1)",
    blue: "rgba(0, 0, 255, 1)",
    yellow: "rgba(255, 255, 0, 1)",
    cyan: "rgba(0, 255, 255, 1)",
    magenta: "rgba(255, 0, 255, 1)",
    gray: "rgba(128, 128, 128, 1)",
    grey: "rgba(128, 128, 128, 1)",
  };

  constructor(config?: ColorValidatorConfig) {
    this.config = {
      allowTransparent: true,
      minContrastRatio: 4.5, // WCAG AA标准
      defaultColor: "#000000",
      ...config,
    };
  }

  /**
   * 验证颜色值
   */
  validateColor(color: string): ValidationResult {
    // 处理空值
    if (!color || color.trim() === "") {
      return this.handleEmptyColor();
    }

    // 移除空格
    const normalizedInput = color.trim();

    // 尝试识别格式
    if (normalizedInput.startsWith("#")) {
      return this.validateHex(normalizedInput);
    } else if (
      normalizedInput.startsWith("rgb") ||
      normalizedInput.startsWith("rgba")
    ) {
      return this.validateRgb(normalizedInput);
    } else if (
      normalizedInput.startsWith("hsl") ||
      normalizedInput.startsWith("hsla")
    ) {
      return this.validateHsl(normalizedInput);
    } else {
      return this.validateNamedColor(normalizedInput);
    }
  }

  /**
   * 处理空颜色值
   */
  handleEmptyColor(): ValidationResult {
    return {
      valid: false,
      error: "Color value cannot be empty",
    };
  }

  /**
   * 验证十六进制颜色
   */
  private validateHex(hex: string): ValidationResult {
    // 检查格式
    const hexRegex = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    if (!hexRegex.test(hex)) {
      return {
        valid: false,
        error: `Invalid hex color format: ${hex}. Expected format: #RGB, #RGBA, #RRGGBB, or #RRGGBBAA`,
      };
    }

    // 解析并标准化
    const rgba = this.parseHexToRgba(hex);
    if (!rgba) {
      return {
        valid: false,
        error: `Failed to parse hex color: ${hex}`,
      };
    }

    // 检查透明色（如果不允许）
    if (!this.config.allowTransparent && rgba.a === 0) {
      return {
        valid: false,
        error: "Transparent colors are not allowed",
      };
    }

    // 标准化为6位hex
    const normalized = this.rgbaToHex(rgba);

    return {
      valid: true,
      format: "hex",
      normalized,
      rgba,
    };
  }

  /**
   * 验证RGB颜色
   */
  private validateRgb(rgb: string): ValidationResult {
    // 检查格式
    const rgbRegex =
      /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(\s*,\s*(0?\.\d+|1|0))?\s*\)$/;
    const match = rgb.match(rgbRegex);

    if (!match) {
      return {
        valid: false,
        error: `Invalid RGB color format: ${rgb}. Expected format: rgb(r, g, b) or rgba(r, g, b, a)`,
      };
    }

    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const a = match[5] ? parseFloat(match[5]) : 1;

    // 检查数值范围
    if (
      r < 0 ||
      r > 255 ||
      g < 0 ||
      g > 255 ||
      b < 0 ||
      b > 255 ||
      a < 0 ||
      a > 1
    ) {
      return {
        valid: false,
        error: `RGB values must be in range 0-255, alpha must be in range 0-1. Got: rgb(${r}, ${g}, ${b}, ${a})`,
      };
    }

    const rgba = { r, g, b, a };

    // 检查透明色
    if (!this.config.allowTransparent && a === 0) {
      return {
        valid: false,
        error: "Transparent colors are not allowed",
      };
    }

    // 标准化为hex
    const normalized = this.rgbaToHex(rgba);

    return {
      valid: true,
      format: "rgb",
      normalized,
      rgba,
    };
  }

  /**
   * 验证HSL颜色
   */
  private validateHsl(hsl: string): ValidationResult {
    // 检查格式
    const hslRegex =
      /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*(0?\.\d+|1|0))?\s*\)$/;
    const match = hsl.match(hslRegex);

    if (!match) {
      return {
        valid: false,
        error: `Invalid HSL color format: ${hsl}. Expected format: hsl(h, s%, l%) or hsla(h, s%, l%, a)`,
      };
    }

    const h = parseInt(match[1], 10);
    const s = parseInt(match[2], 10);
    const l = parseInt(match[3], 10);
    const a = match[4] ? parseFloat(match[4]) : 1;

    // 检查数值范围
    if (h < 0 || h > 360) {
      return {
        valid: false,
        error: `Hue must be in range 0-360. Got: ${h}`,
      };
    }

    if (s < 0 || s > 100) {
      return {
        valid: false,
        error: `Saturation must be in range 0-100%. Got: ${s}%`,
      };
    }

    if (l < 0 || l > 100) {
      return {
        valid: false,
        error: `Lightness must be in range 0-100%. Got: ${l}%`,
      };
    }

    if (a < 0 || a > 1) {
      return {
        valid: false,
        error: `Alpha must be in range 0-1. Got: ${a}`,
      };
    }

    // 转换为RGB
    const rgba = this.hslToRgba(h, s, l, a);

    // 检查透明色
    if (!this.config.allowTransparent && a === 0) {
      return {
        valid: false,
        error: "Transparent colors are not allowed",
      };
    }

    // 标准化为hex
    const normalized = this.rgbaToHex(rgba);

    return {
      valid: true,
      format: "hsl",
      normalized,
      rgba,
    };
  }

  /**
   * 验证命名颜色
   */
  private validateNamedColor(name: string): ValidationResult {
    const lowerName = name.toLowerCase();

    // 检查是否为有效颜色名称
    if (!ColorValidator.COLOR_NAMES.hasOwnProperty(lowerName)) {
      return {
        valid: false,
        error: `Unknown color name: ${name}`,
      };
    }

    // 获取RGBA值
    const rgbaString = ColorValidator.COLOR_NAMES[lowerName];
    const rgba = this.parseRgbaString(rgbaString);

    if (!rgba) {
      return {
        valid: false,
        error: `Failed to parse color name: ${name}`,
      };
    }

    // 检查透明色
    if (!this.config.allowTransparent && rgba.a === 0) {
      return {
        valid: false,
        error: "Transparent colors are not allowed",
      };
    }

    return {
      valid: true,
      format: "named",
      normalized: this.rgbaToHex(rgba),
      rgba,
    };
  }

  /**
   * 计算颜色对比度
   */
  calculateContrast(foreground: string, background: string): ContrastResult {
    const fgResult = this.validateColor(foreground);
    const bgResult = this.validateColor(background);

    if (!fgResult.valid || !fgResult.rgba) {
      return {
        ratio: 0,
        wcagAA: false,
        wcagAAA: false,
        suggestion: fgResult.error || "Invalid foreground color",
      };
    }

    if (!bgResult.valid || !bgResult.rgba) {
      return {
        ratio: 0,
        wcagAA: false,
        wcagAAA: false,
        suggestion: bgResult.error || "Invalid background color",
      };
    }

    // 计算相对亮度
    const fgLuminance = this.calculateLuminance(fgResult.rgba);
    const bgLuminance = this.calculateLuminance(bgResult.rgba);

    // 计算对比度
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    // WCAG标准
    const wcagAA = ratio >= 4.5; // 普通文本
    const wcagAAA = ratio >= 7; // 高对比度

    // 建议
    let suggestion = "";
    if (!wcagAA) {
      suggestion = `Contrast ratio ${ratio.toFixed(2)} does not meet WCAG AA (4.5:1)`;
    } else if (!wcagAAA) {
      suggestion = `Contrast ratio ${ratio.toFixed(2)} meets WCAG AA but not AAA (7:1)`;
    } else {
      suggestion = `Excellent contrast ratio ${ratio.toFixed(2)} meets WCAG AAA (7:1)`;
    }

    return {
      ratio,
      wcagAA,
      wcagAAA,
      suggestion,
    };
  }

  /**
   * 计算相对亮度
   */
  private calculateLuminance(rgba: { r: number; g: number; b: number; a: number }): number {
    // 如果有透明度，需要考虑背景（这里假设为白色背景）
    const a = rgba.a;
    const r = rgba.r / 255;
    const g = rgba.g / 255;
    const b = rgba.b / 255;

    // 考虑透明度（假设背景为白色 #FFFFFF）
    const blendedR = r * a + 1 * (1 - a);
    const blendedG = g * a + 1 * (1 - a);
    const blendedB = b * a + 1 * (1 - a);

    // 标准相对亮度计算
    const luminance =
      0.2126 * this.gammaEncode(blendedR) +
      0.7152 * this.gammaEncode(blendedG) +
      0.0722 * this.gammaEncode(blendedB);

    return luminance;
  }

  /**
   * Gamma编码
   */
  private gammaEncode(color: number): number {
    return color <= 0.03928 ? color / 12.92 : Math.pow((color + 0.055) / 1.055, 2.4);
  }

  /**
   * 解析十六进制颜色为RGBA
   */
  private parseHexToRgba(hex: string): { r: number; g: number; b: number; a: number } | null {
    // 移除#
    const hexValue = hex.slice(1);

    // 处理不同格式
    if (hexValue.length === 3) {
      // #RGB
      const r = parseInt(hexValue[0] + hexValue[0], 16);
      const g = parseInt(hexValue[1] + hexValue[1], 16);
      const b = parseInt(hexValue[2] + hexValue[2], 16);
      return { r, g, b, a: 1 };
    } else if (hexValue.length === 4) {
      // #RGBA
      const r = parseInt(hexValue[0] + hexValue[0], 16);
      const g = parseInt(hexValue[1] + hexValue[1], 16);
      const b = parseInt(hexValue[2] + hexValue[2], 16);
      const a = parseInt(hexValue[3] + hexValue[3], 16) / 255;
      return { r, g, b, a };
    } else if (hexValue.length === 6) {
      // #RRGGBB
      const r = parseInt(hexValue.slice(0, 2), 16);
      const g = parseInt(hexValue.slice(2, 4), 16);
      const b = parseInt(hexValue.slice(4, 6), 16);
      return { r, g, b, a: 1 };
    } else if (hexValue.length === 8) {
      // #RRGGBBAA
      const r = parseInt(hexValue.slice(0, 2), 16);
      const g = parseInt(hexValue.slice(2, 4), 16);
      const b = parseInt(hexValue.slice(4, 6), 16);
      const a = parseInt(hexValue.slice(6, 8), 16) / 255;
      return { r, g, b, a };
    }

    return null;
  }

  /**
   * 解析RGBA字符串
   */
  private parseRgbaString(rgba: string): { r: number; g: number; b: number; a: number } | null {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return null;

    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] ? parseFloat(match[4]) : 1,
    };
  }

  /**
   * RGBA转十六进制
   */
  private rgbaToHex(rgba: { r: number; g: number; b: number; a: number }): string {
    const r = Math.round(rgba.r).toString(16).padStart(2, "0");
    const g = Math.round(rgba.g).toString(16).padStart(2, "0");
    const b = Math.round(rgba.b).toString(16).padStart(2, "0");

    if (rgba.a === 1) {
      return `#${r}${g}${b}`;
    } else {
      const a = Math.round(rgba.a * 255).toString(16).padStart(2, "0");
      return `#${r}${g}${b}${a}`;
    }
  }

  /**
   * HSL转RGBA
   */
  private hslToRgba(
    h: number,
    s: number,
    l: number,
    a: number
  ): { r: number; g: number; b: number; a: number } {
    const sNormalized = s / 100;
    const lNormalized = l / 100;

    const chroma = (1 - Math.abs(2 * lNormalized - 1)) * sNormalized;
    const hPrime = h / 60;
    const x = chroma * (1 - Math.abs((hPrime % 2) - 1));

    let r1 = 0,
      g1 = 0,
      b1 = 0;

    if (hPrime >= 0 && hPrime < 1) {
      r1 = chroma;
      g1 = x;
      b1 = 0;
    } else if (hPrime >= 1 && hPrime < 2) {
      r1 = x;
      g1 = chroma;
      b1 = 0;
    } else if (hPrime >= 2 && hPrime < 3) {
      r1 = 0;
      g1 = chroma;
      b1 = x;
    } else if (hPrime >= 3 && hPrime < 4) {
      r1 = 0;
      g1 = x;
      b1 = chroma;
    } else if (hPrime >= 4 && hPrime < 5) {
      r1 = x;
      g1 = 0;
      b1 = chroma;
    } else if (hPrime >= 5 && hPrime < 6) {
      r1 = chroma;
      g1 = 0;
      b1 = x;
    }

    const m = lNormalized - chroma / 2;

    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);

    return { r, g, b, a };
  }

  /**
   * 获取默认颜色
   */
  getDefaultColor(): string {
    return this.config.defaultColor || "#000000";
  }

  /**
   * 验证并返回颜色（失败时返回默认值）
   */
  validateOrDefault(color: string): string {
    const result = this.validateColor(color);
    return result.valid ? result.normalized || color : this.getDefaultColor();
  }
}
