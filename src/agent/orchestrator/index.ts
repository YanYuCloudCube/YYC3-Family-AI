/**
 * @file: index.ts
 * @description: Multi-Agent 编排模块导出
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,orchestrator,exports
 */

export {
  AgentOrchestrator,
  createOrchestrator,
  type OrchestratorConfig,
  type OrchestratorState,
  type TaskSubmissionResult,
  type IAgentOrchestrator,
} from './AgentOrchestrator';
