/**
 * @file: global-setup.ts
 * @description: Vitest 全局设置 - 在所有测试和环境初始化之前运行
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-14
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: test,vitest,global-setup
 */

export default async function setup() {
  // ── Ensure Web Crypto API is available before jsdom initializes ──
  try {
    const { webcrypto } = await import('node:crypto');
    
    // Try to set crypto, handling read-only property case in Node.js 20+
    try {
      (globalThis as any).crypto = webcrypto;
    } catch {
      // Property is read-only, use defineProperty to override
      Object.defineProperty(globalThis, 'crypto', {
        value: webcrypto,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
    
    console.log('[GlobalSetup] Web Crypto API initialized successfully');
  } catch (error) {
    console.warn('[GlobalSetup] Failed to initialize Web Crypto API:', error);
  }
}
