/**
 * @file: index.ts
 * @description: 测试Mock基础设施 - 统一导出所有测试工具和Mock
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-15
 * @status: dev
 * @license: MIT
 */

export {
  MockIndexedDBFactory,
  MockIDBDatabase,
  MockIDBTransaction,
  MockIDBObjectStoreInstance,
  createEnhancedLocalStorage,
  setupTestCrypto,
  createMockFetchResponse,
  mockIndexedDB,
} from './browser-apis';

export {
  MockLLMService,
  mockResponses,
  createMockLLMService,
  createSuccessResponse,
  createErrorResponse,
  globalMockLLM,
} from './ai-services';

export {
  waitFor,
  wait,
  flushPromises,
  createElement,
  querySelector,
  querySelectorAll,
  generateRandomString,
  generateUUID,
  generateTestData,
  generateFileData,
  createSpyTracker,
  expectToBeCalledTimes,
  expectToBeCalledWith,
  expectToHaveBeenCalled,
  expectError,
  suppressConsoleWarnings,
  advanceTimersByTime,
  runAllTimersAsync,
  useFakeTimers,
} from './test-helpers';
