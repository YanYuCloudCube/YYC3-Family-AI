import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIAgentOrchestrator } from '../AIAgentOrchestrator'
import type { AgentConfig, TaskMessage } from '../AIAgentOrchestrator'

function makeMessage(content: string, role: TaskMessage['role'] = 'user'): TaskMessage {
  return { id: `msg-${Date.now()}-${Math.random()}`, role, content, timestamp: new Date().toISOString() }
}

describe('AIAgentOrchestrator', () => {
  let orchestrator: AIAgentOrchestrator

  const testAgentConfig: AgentConfig = {
    id: 'test-agent',
    name: 'Test Agent',
    type: 'chat',
    description: 'A test agent',
    capabilities: ['test'],
  }

  beforeEach(() => {
    orchestrator = new AIAgentOrchestrator({ enableLogging: false, enableCaching: false })
  })

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const stats = orchestrator.getStats()
      expect(stats.orchestrator.version).toBeDefined()
      expect(stats.agents.total).toBeGreaterThan(0)
    })

    it('should merge custom config with defaults', () => {
      const custom = new AIAgentOrchestrator({ maxConcurrentTasks: 3 })
      const stats = custom.getStats()
      expect(stats.orchestrator.config.maxConcurrentTasks).toBe(3)
    })

    it('should register 5 default agents on init', () => {
      const agents = orchestrator.getAgentStatus() as Array<{ id: string }>
      expect(Array.isArray(agents)).toBe(true)
      expect(agents.length).toBe(5)
    })
  })

  describe('registerAgent', () => {
    it('should register a new agent', () => {
      const instance = orchestrator.registerAgent(testAgentConfig)
      expect(instance.id).toBe('test-agent')
      expect(instance.config.name).toBe('Test Agent')
      expect(instance.status).toBe('idle')
    })

    it('should throw on duplicate agent id', () => {
      orchestrator.registerAgent(testAgentConfig)
      expect(() => orchestrator.registerAgent(testAgentConfig)).toThrow(/already registered/)
    })

    it('should emit agent:registered event', () => {
      const listener = vi.fn()
      orchestrator.on('agent:registered', listener)
      orchestrator.registerAgent(testAgentConfig)
      expect(listener).toHaveBeenCalledOnce()
    })

    it('should increment agent count', () => {
      const before = orchestrator.getStats().agents.total
      orchestrator.registerAgent(testAgentConfig)
      expect(orchestrator.getStats().agents.total).toBe(before + 1)
    })
  })

  describe('unregisterAgent', () => {
    it('should unregister an existing agent', () => {
      orchestrator.registerAgent(testAgentConfig)
      const result = orchestrator.unregisterAgent('test-agent')
      expect(result).toBe(true)
    })

    it('should return false for non-existent agent', () => {
      const result = orchestrator.unregisterAgent('non-existent')
      expect(result).toBe(false)
    })

    it('should emit agent:unregistered event', () => {
      const listener = vi.fn()
      orchestrator.registerAgent(testAgentConfig)
      orchestrator.on('agent:unregistered', listener)
      orchestrator.unregisterAgent('test-agent')
      expect(listener).toHaveBeenCalledOnce()
    })

    it('should decrement agent count', () => {
      orchestrator.registerAgent(testAgentConfig)
      const before = orchestrator.getStats().agents.total
      orchestrator.unregisterAgent('test-agent')
      expect(orchestrator.getStats().agents.total).toBe(before - 1)
    })
  })

  describe('submitTask', () => {
    it('should submit a single-agent task and return task id', async () => {
      const taskId = await orchestrator.submitTask({
        type: 'single-agent',
        input: [makeMessage('hello')],
        assignedAgents: ['general-assistant'],
        priority: 'normal',
        maxRetries: 0,
        timeout: 5000,
      })
      expect(taskId).toBeDefined()
      expect(taskId).toMatch(/^task-/)
    })

    it('should emit task:started event on execution', async () => {
      const listener = vi.fn()
      orchestrator.on('task:started', listener)
      await orchestrator.submitTask({
        type: 'single-agent',
        input: [makeMessage('test')],
        assignedAgents: ['general-assistant'],
        priority: 'low',
        maxRetries: 0,
        timeout: 5000,
      })
      expect(listener).toHaveBeenCalledOnce()
    })

    it('should track task in getTaskStatus', async () => {
      const taskId = await orchestrator.submitTask({
        type: 'single-agent',
        input: [makeMessage('check status')],
        assignedAgents: ['general-assistant'],
        priority: 'normal',
        maxRetries: 0,
        timeout: 5000,
      })
      const task = orchestrator.getTaskStatus(taskId)
      expect(task).toBeDefined()
      expect(task!.id).toBe(taskId)
    })
  })

  describe('getTaskStatus', () => {
    it('should return undefined for non-existent task', () => {
      const status = orchestrator.getTaskStatus('non-existent')
      expect(status).toBeUndefined()
    })
  })

  describe('cancelTask', () => {
    it('should return false for non-existent task', () => {
      const result = orchestrator.cancelTask('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('getAgentStatus', () => {
    it('should return all agents when no id given', () => {
      const agents = orchestrator.getAgentStatus() as unknown as Array<{ id: string }>
      expect(Array.isArray(agents)).toBe(true)
      expect(agents.length).toBe(5)
    })

    it('should return specific agent by id', () => {
      const agent = orchestrator.getAgentStatus('general-assistant') as { id: string } | undefined
      expect(agent).toBeDefined()
      if (agent && 'id' in agent) {
        expect(agent.id).toBe('general-assistant')
      }
    })

    it('should return undefined for non-existent agent id', () => {
      const agent = orchestrator.getAgentStatus('non-existent')
      expect(agent).toBeUndefined()
    })
  })

  describe('getStats', () => {
    it('should return comprehensive stats', () => {
      const stats = orchestrator.getStats()
      expect(stats.orchestrator).toBeDefined()
      expect(stats.orchestrator.version).toBeDefined()
      expect(stats.orchestrator.uptime).toBeGreaterThanOrEqual(0)
      expect(stats.agents).toBeDefined()
      expect(stats.agents.total).toBe(5)
      expect(stats.tasks).toBeDefined()
      expect(stats.performance).toBeDefined()
      expect(stats.capabilities).toBeDefined()
      expect(Array.isArray(stats.capabilities)).toBe(true)
    })
  })

  describe('events', () => {
    it('should support on/off event subscription', () => {
      const listener = vi.fn()
      const unsubscribe = orchestrator.on('test:event', listener)
      expect(typeof unsubscribe).toBe('function')
      unsubscribe()
    })

    it('should unsubscribe via returned function', () => {
      const listener = vi.fn()
      const unsubscribe = orchestrator.on('custom:event', listener)
      unsubscribe()
    })

    it('should emit events to subscribers', () => {
      const listener = vi.fn()
      orchestrator.on('agent:registered', listener)
      orchestrator.registerAgent(testAgentConfig)
      expect(listener).toHaveBeenCalledOnce()
    })
  })

  describe('cache', () => {
    it('should clear cache and return count', () => {
      const cached = new AIAgentOrchestrator({ enableCaching: true })
      const count = cached.clearCache()
      expect(typeof count).toBe('number')
    })
  })

  describe('selectAgent', () => {
    it('should select from candidate agents', () => {
      orchestrator.registerAgent({ ...testAgentConfig, id: 'agent-a' })
      orchestrator.registerAgent({ ...testAgentConfig, id: 'agent-b' })
      const selected = orchestrator.selectAgent(['agent-a', 'agent-b'])
      expect(selected).toBeDefined()
      expect(['agent-a', 'agent-b']).toContain(selected.id)
    })
  })
})
