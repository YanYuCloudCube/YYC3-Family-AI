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
    
    // Force set crypto on globalThis before any environment loads
    (globalThis as any).crypto = webcrypto;
    
    console.log('[GlobalSetup] Web Crypto API initialized successfully');
  } catch (error) {
    console.warn('[GlobalSetup] Failed to initialize Web Crypto API:', error);
  }
}
