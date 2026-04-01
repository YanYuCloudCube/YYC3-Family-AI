// @ts-nocheck
/**
 * @file CryptoService.test.ts
 * @description 加密服务测试 - 覆盖 AES-GCM 加解密、PBKDF2 密钥派生、数据脱敏等核心功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,crypto,encryption,security
 */

import { describe, it, expect } from "vitest";
import {
  generateRandomBytes,
  deriveKey,
  encrypt,
  decrypt,
  maskApiKey,
} from "../app/components/ide/CryptoService";

// ── Helper Functions ──

function generateRandomPassword(length: number = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  const randomValues = generateRandomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  return password;
}

// ================================================================
// 1. 随机数生成测试
// ================================================================

describe("CryptoService - 随机数生成", () => {
  it("生成指定长度的随机字节", () => {
    const bytes = generateRandomBytes(16);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(16);
  });

  it("生成不同长度的随机字节", () => {
    const lengths = [8, 16, 32, 64];
    
    lengths.forEach((length) => {
      const bytes = generateRandomBytes(length);
      expect(bytes.length).toBe(length);
    });
  });

  it("生成的随机字节不重复", () => {
    const bytes1 = generateRandomBytes(32);
    const bytes2 = generateRandomBytes(32);
    
    // 转换为字符串比较
    const str1 = Array.from(bytes1).join(",");
    const str2 = Array.from(bytes2).join(",");
    
    expect(str1).not.toBe(str2);
  });

  it("生成的随机字节在有效范围内", () => {
    const bytes = generateRandomBytes(100);
    
    bytes.forEach((byte) => {
      expect(byte).toBeGreaterThanOrEqual(0);
      expect(byte).toBeLessThanOrEqual(255);
    });
  });
});

// ================================================================
// 2. 密钥派生测试 (PBKDF2)
// ================================================================

describe("CryptoService - 密钥派生", () => {
  it("从密码派生 AES 密钥", async () => {
    const password = "test-password-123";
    const salt = generateRandomBytes(16);
    
    const key = await deriveKey(password, salt);
    
    expect(key).toBeDefined();
    expect(key.algorithm.name).toBe("AES-GCM");
  });

  it("使用自定义迭代次数", async () => {
    const password = "test-password-123";
    const salt = generateRandomBytes(16);
    const iterations = 100000;
    
    const key = await deriveKey(password, salt, iterations);
    
    expect(key).toBeDefined();
  });

  it("密钥可用于加密", async () => {
    const password = generateRandomPassword();
    const salt = generateRandomBytes(16);
    
    const key = await deriveKey(password, salt);
    
    expect(key).toBeDefined();
    expect(key.algorithm.name).toBe("AES-GCM");
  });
});

// ================================================================
// 3. 加密解密测试 (AES-GCM)
// ================================================================

describe("CryptoService - 加密解密", () => {
  it("加密并解密字符串", async () => {
    const password = generateRandomPassword();
    const data = "Sensitive data to encrypt";
    
    const encrypted = await encrypt(data, password);
    const decrypted = await decrypt(encrypted, password);
    
    expect(decrypted).toBe(data);
  });

  it("加密并解密长字符串", async () => {
    const password = generateRandomPassword();
    const data = "x".repeat(10000);
    
    const encrypted = await encrypt(data, password);
    const decrypted = await decrypt(encrypted, password);
    
    expect(decrypted).toBe(data);
    expect(decrypted.length).toBe(10000);
  });

  it("加密并解密特殊字符", async () => {
    const password = generateRandomPassword();
    const data = "特殊字符：中文、日本語、한글 !@#$%^&*()_+-=[]{}|;':\",./<>?";
    
    const encrypted = await encrypt(data, password);
    const decrypted = await decrypt(encrypted, password);
    
    expect(decrypted).toBe(data);
  });

  it("加密并解密空字符串", async () => {
    const password = generateRandomPassword();
    const data = "";
    
    const encrypted = await encrypt(data, password);
    const decrypted = await decrypt(encrypted, password);
    
    expect(decrypted).toBe(data);
  });

  it("不同密码无法解密", async () => {
    const password1 = generateRandomPassword();
    const password2 = generateRandomPassword();
    const data = "Sensitive data";
    
    const encrypted = await encrypt(data, password1);
    
    await expect(decrypt(encrypted, password2)).rejects.toThrow();
  });

  it("加密数据包含必要字段", async () => {
    const password = generateRandomPassword();
    const data = "Test data";
    
    const encrypted = await encrypt(data, password);
    
    expect(encrypted).toHaveProperty("ciphertext");
    expect(encrypted).toHaveProperty("iv");
    expect(encrypted).toHaveProperty("salt");
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.salt).toBeDefined();
  });
});

// ================================================================
// 4. 数据脱敏测试
// ================================================================

describe("CryptoService - 数据脱敏", () => {
  it("脱敏短 API Key", () => {
    const apiKey = "sk-1234567890abcdef";
    const masked = maskApiKey(apiKey);
    
    expect(masked).toContain("sk-");
    expect(masked.length).toBeLessThanOrEqual(apiKey.length);
  });

  it("脱敏长 API Key", () => {
    const apiKey = "sk-very-long-api-key-that-should-be-masked-properly";
    const masked = maskApiKey(apiKey);
    
    expect(masked).toContain("sk-");
    expect(masked.length).toBeLessThan(apiKey.length);
  });

  it("脱敏 GitHub Token", () => {
    const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
    const masked = maskApiKey(token);
    
    expect(masked).toContain("ghp_");
    expect(masked.length).toBeLessThan(token.length);
  });

  it("脱敏空字符串", () => {
    const masked = maskApiKey("");
    expect(masked).toBe("");
  });

  it("脱敏非敏感数据", () => {
    const data = "not-a-secret";
    const masked = maskApiKey(data);
    
    // 非标准格式应该返回原数据或部分脱敏
    expect(masked).toBeDefined();
  });
});

// ================================================================
// 5. 边界情况测试
// ================================================================

describe("CryptoService - 边界情况", () => {
  it("处理超大密码", async () => {
    const password = "x".repeat(10000);
    const salt = generateRandomBytes(16);
    
    const key = await deriveKey(password, salt);
    expect(key).toBeDefined();
  });

  it("处理特殊字符密码", async () => {
    const password = "特殊字符!@#$%^&*()_+-=[]{}|;':\",./<>?";
    const salt = generateRandomBytes(16);
    
    const key = await deriveKey(password, salt);
    expect(key).toBeDefined();
  });

  it("处理空密码", async () => {
    const password = "";
    const salt = generateRandomBytes(16);
    
    const key = await deriveKey(password, salt);
    expect(key).toBeDefined();
  });

  it("处理 Unicode 密码", async () => {
    const password = "🔐🔑🔒 密码 パスワード 비밀번호";
    const salt = generateRandomBytes(16);
    
    const key = await deriveKey(password, salt);
    expect(key).toBeDefined();
  });

  it("加密解密 emoji 数据", async () => {
    const password = generateRandomPassword();
    const data = "🔐🔑🔒💻📱🌟✨🎉";
    
    const encrypted = await encrypt(data, password);
    const decrypted = await decrypt(encrypted, password);
    
    expect(decrypted).toBe(data);
  });
});

// ================================================================
// 6. 性能测试
// ================================================================

describe("CryptoService - 性能", () => {
  it("加密性能", async () => {
    const password = generateRandomPassword();
    const data = "x".repeat(1000);
    
    const startTime = performance.now();
    await encrypt(data, password);
    const elapsed = performance.now() - startTime;
    
    // 加密应该在 100ms 内完成
    expect(elapsed).toBeLessThan(100);
  });

  it("解密性能", async () => {
    const password = generateRandomPassword();
    const data = "x".repeat(1000);
    const encrypted = await encrypt(data, password);
    
    const startTime = performance.now();
    await decrypt(encrypted, password);
    const elapsed = performance.now() - startTime;
    
    // 解密应该在 100ms 内完成
    expect(elapsed).toBeLessThan(100);
  });

  it("密钥派生性能", async () => {
    const password = generateRandomPassword();
    const salt = generateRandomBytes(16);
    
    const startTime = performance.now();
    await deriveKey(password, salt);
    const elapsed = performance.now() - startTime;
    
    // 密钥派生应该在 500ms 内完成 (PBKDF2 需要时间)
    expect(elapsed).toBeLessThan(500);
  });

  it("批量加密性能", async () => {
    const password = generateRandomPassword();
    const items = Array.from({ length: 10 }, (_, i) => `Data ${i}`);
    
    const startTime = performance.now();
    
    await Promise.all(items.map((item) => encrypt(item, password)));
    
    const elapsed = performance.now() - startTime;
    
    // 10 个加密应该在 500ms 内完成
    expect(elapsed).toBeLessThan(500);
  });
});

// ================================================================
// 7. 安全测试
// ================================================================

describe("CryptoService - 安全", () => {
  it("使用 Web Crypto API", async () => {
    const password = generateRandomPassword();
    const salt = generateRandomBytes(16);
    
    const key = await deriveKey(password, salt);
    
    // 验证使用的是 Web Crypto API
    expect(key.algorithm.name).toBe("AES-GCM");
  });

  it("IV 随机生成", async () => {
    const password = generateRandomPassword();
    const data = "Test data";
    
    const encrypted1 = await encrypt(data, password);
    const encrypted2 = await encrypt(data, password);
    
    // IV 应该不同，导致密文不同
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
  });

  it("Salt 随机生成", async () => {
    const password = generateRandomPassword();
    const salt1 = generateRandomBytes(16);
    const salt2 = generateRandomBytes(16);
    
    expect(salt1).not.toEqual(salt2);
  });

  it("加密数据完整性", async () => {
    const password = generateRandomPassword();
    const data = "Test data";
    
    const encrypted = await encrypt(data, password);
    const decrypted = await decrypt(encrypted, password);
    
    expect(decrypted).toBe(data);
  });

  it("篡改密文导致解密失败", async () => {
    const password = generateRandomPassword();
    const data = "Test data";
    
    const encrypted = await encrypt(data, password);
    
    // 篡改密文
    const tamperedCiphertext = encrypted.ciphertext + "tampered";
    const tamperedEncrypted = {
      ...encrypted,
      ciphertext: tamperedCiphertext,
    };
    
    await expect(decrypt(tamperedEncrypted as any, password)).rejects.toThrow();
  });
});

// ================================================================
// 8. 集成场景测试
// ================================================================

describe("CryptoService - 集成场景", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("完整加密存储流程", async () => {
    const password = generateRandomPassword();
    const data = "sensitive-data";
    
    // 加密
    const encrypted = await encrypt(data, password);
    expect(encrypted).toBeDefined();
    
    // 解密
    const decrypted = await decrypt(encrypted, password);
    expect(decrypted).toBe(data);
  });

  it("多用户数据隔离", async () => {
    const password1 = generateRandomPassword();
    const password2 = generateRandomPassword();
    const data1 = "secret1";
    const data2 = "secret2";
    
    // 用户 1 加密
    const encrypted1 = await encrypt(data1, password1);
    
    // 用户 2 加密
    const encrypted2 = await encrypt(data2, password2);
    
    // 用户 1 只能解密自己的数据
    const decrypted1 = await decrypt(encrypted1, password1);
    expect(decrypted1).toBe(data1);
    
    // 用户 2 只能解密自己的数据
    const decrypted2 = await decrypt(encrypted2, password2);
    expect(decrypted2).toBe(data2);
    
    // 错误密码无法解密
    await expect(decrypt(encrypted1, password2)).rejects.toThrow();
  });

  it("密码更新流程", async () => {
    const oldPassword = generateRandomPassword();
    const newPassword = generateRandomPassword();
    const data = "sensitive-data";
    
    // 用旧密码加密
    const encryptedWithOld = await encrypt(data, oldPassword);
    
    // 用旧密码解密
    const decrypted = await decrypt(encryptedWithOld, oldPassword);
    expect(decrypted).toBe(data);
    
    // 用新密码重新加密
    const encryptedWithNew = await encrypt(data, newPassword);
    
    // 用新密码解密
    const newDecrypted = await decrypt(encryptedWithNew, newPassword);
    expect(newDecrypted).toBe(data);
    
    // 旧密码无法解密新密文
    await expect(decrypt(encryptedWithNew, oldPassword)).rejects.toThrow();
  });
});
