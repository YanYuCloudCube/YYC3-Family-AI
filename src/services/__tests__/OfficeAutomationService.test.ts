import { describe, it, expect, beforeEach } from 'vitest'
import { OfficeAutomationService } from '../OfficeAutomationService'

describe('OfficeAutomationService', () => {
  let service: OfficeAutomationService

  beforeEach(() => {
    service = new OfficeAutomationService()
  })

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const status = service.getStatus()
      expect(status.name).toBe('yyc3-office-automation')
      expect(status.version).toBe('2.0.0')
    })

    it('should initialize builtin templates', () => {
      const status = service.getStatus()
      expect(status.stats.totalTemplates).toBeGreaterThan(0)
    })

    it('should accept custom config', () => {
      const s = new OfficeAutomationService({ defaultLanguage: 'en-US', timezone: 'America/New_York' })
      const status = s.getStatus()
      expect(status).toBeDefined()
    })
  })

  describe('generateDocument', () => {
    it('should generate a document from template', async () => {
      const templates = service.listTemplates()
      expect(templates.length).toBeGreaterThan(0)

      const template = templates[0]
      const variables: Record<string, string> = {}
      template.variables.forEach(v => {
        variables[v.name] = v.defaultValue || '测试值'
      })

      const doc = await service.generateDocument(template.id, variables)
      expect(doc.id).toMatch(/^doc-/)
      expect(doc.templateId).toBe(template.id)
      expect(doc.content.length).toBeGreaterThan(0)
      expect(doc.metadata.wordCount).toBeGreaterThan(0)
    })

    it('should throw for non-existent template', async () => {
      await expect(
        service.generateDocument('non-existent', {})
      ).rejects.toThrow(/not found/)
    })

    it('should support different output formats', async () => {
      const templates = service.listTemplates()
      const template = templates[0]
      const variables: Record<string, string> = {}
      template.variables.forEach(v => {
        variables[v.name] = v.defaultValue || '值'
      })

      const md = await service.generateDocument(template.id, variables, { format: 'markdown' })
      expect(md.format).toBe('markdown')

      const html = await service.generateDocument(template.id, variables, { format: 'html' })
      expect(html.format).toBe('html')
    })
  })

  describe('createEmail', () => {
    it('should create an email draft', () => {
      const email = service.createEmail({
        to: [{ email: 'test@example.com', name: 'Test User' }],
        subject: '测试邮件',
        body: '这是一封测试邮件',
        format: 'plain',
        priority: 'normal',
      })
      expect(email.id).toMatch(/^email-/)
      expect(email.subject).toBe('测试邮件')
      expect(email.metadata.status).toBe('draft')
    })
  })

  describe('createEvent', () => {
    it('should create a schedule event', () => {
      const now = new Date()
      const later = new Date(now.getTime() + 3600000)
      const event = service.createEvent({
        title: '项目会议',
        startTime: now,
        endTime: later,
        attendees: [],
        reminders: [{ minutesBefore: 15, method: 'popup' }],
      })
      expect(event.id).toMatch(/^event-/)
      expect(event.title).toBe('项目会议')
    })
  })

  describe('updateEvent', () => {
    it('should update an existing event', () => {
      const now = new Date()
      const later = new Date(now.getTime() + 3600000)
      const event = service.createEvent({
        title: '原会议',
        startTime: now,
        endTime: later,
        attendees: [],
        reminders: [{ minutesBefore: 15, method: 'popup' }],
      })
      const updated = service.updateEvent(event.id, { title: '更新会议' })
      expect(updated).not.toBeNull()
      expect(updated!.title).toBe('更新会议')
    })

    it('should return null for non-existent event', () => {
      const result = service.updateEvent('non-existent', { title: 'x' })
      expect(result).toBeNull()
    })
  })

  describe('deleteEvent', () => {
    it('should delete an existing event', () => {
      const now = new Date()
      const later = new Date(now.getTime() + 3600000)
      const event = service.createEvent({
        title: '待删除',
        startTime: now,
        endTime: later,
        attendees: [],
        reminders: [{ minutesBefore: 15, method: 'popup' }],
      })
      expect(service.deleteEvent(event.id)).toBe(true)
    })

    it('should return false for non-existent event', () => {
      expect(service.deleteEvent('non-existent')).toBe(false)
    })
  })

  describe('createTask', () => {
    it('should create a task', () => {
      const task = service.createTask({
        title: '完成报告',
        status: 'todo',
        priority: 'high',
        subtasks: [],
        comments: [],
      })
      expect(task.id).toMatch(/^task-/)
      expect(task.title).toBe('完成报告')
    })
  })

  describe('updateTask', () => {
    it('should update an existing task', () => {
      const task = service.createTask({
        title: '待办事项',
        status: 'todo',
        priority: 'medium',
        subtasks: [],
        comments: [],
      })
      const updated = service.updateTask(task.id, { status: 'in-progress' })
      expect(updated).not.toBeNull()
      expect(updated!.status).toBe('in-progress')
    })

    it('should return null for non-existent task', () => {
      expect(service.updateTask('non-existent', { status: 'completed' })).toBeNull()
    })
  })

  describe('addSubtask', () => {
    it('should add a subtask to a task', () => {
      const task = service.createTask({
        title: '主任务',
        status: 'todo',
        priority: 'medium',
        subtasks: [],
        comments: [],
      })
      const updated = service.addSubtask(task.id, '子任务1')
      expect(updated).not.toBeNull()
      expect(updated!.subtasks.length).toBe(1)
      expect(updated!.subtasks[0].title).toBe('子任务1')
    })
  })

  describe('addComment', () => {
    it('should add a comment to a task', () => {
      const task = service.createTask({
        title: '评论任务',
        status: 'todo',
        priority: 'low',
        subtasks: [],
        comments: [],
      })
      const updated = service.addComment(task.id, '张三', '这个任务需要优先处理')
      expect(updated).not.toBeNull()
      expect(updated!.comments.length).toBe(1)
    })
  })

  describe('getTasks', () => {
    it('should return all tasks', () => {
      service.createTask({ title: 'T1', status: 'todo', priority: 'high', subtasks: [], comments: [] })
      service.createTask({ title: 'T2', status: 'in-progress', priority: 'low', subtasks: [], comments: [] })
      const tasks = service.getTasks()
      expect(tasks.length).toBe(2)
    })

    it('should filter by status', () => {
      service.createTask({ title: 'T1', status: 'todo', priority: 'high', subtasks: [], comments: [] })
      service.createTask({ title: 'T2', status: 'completed', priority: 'low', subtasks: [], comments: [] })
      const completed = service.getTasks({ status: 'completed' })
      expect(completed.length).toBe(1)
      expect(completed[0].status).toBe('completed')
    })
  })

  describe('generateMeetingMinutes', () => {
    it('should generate meeting minutes', async () => {
      const minutes = await service.generateMeetingMinutes({
        title: '周例会',
        date: new Date().toISOString(),
        attendees: [
          { name: '张三', role: '主持人', present: true },
          { name: '李四', present: true },
        ],
        notes: '讨论了项目进度，决定下周完成第一阶段。',
      })
      expect(minutes.id).toMatch(/^min-/)
      expect(minutes.title).toBe('周例会')
      expect(minutes.attendees.length).toBe(2)
    })
  })

  describe('listTemplates', () => {
    it('should list all templates', () => {
      const templates = service.listTemplates()
      expect(templates.length).toBeGreaterThan(0)
    })

    it('should filter by category', () => {
      const reports = service.listTemplates('report')
      expect(reports.every(t => t.category === 'report')).toBe(true)
    })
  })

  describe('addCustomTemplate', () => {
    it('should add a custom template', () => {
      const template = service.addCustomTemplate({
        name: '自定义模板',
        category: 'memo',
        description: '测试用自定义模板',
        variables: [{ name: 'content', label: '内容', type: 'multiline', required: true }],
        content: '{{content}}',
      })
      expect(template.id).toMatch(/^tpl-/)
      expect(template.name).toBe('自定义模板')
    })
  })

  describe('getStatus', () => {
    it('should return service status', () => {
      const status = service.getStatus()
      expect(status.name).toBe('yyc3-office-automation')
      expect(status.version).toBe('2.0.0')
      expect(status.stats).toBeDefined()
      expect(status.capabilities).toBeDefined()
    })
  })
})
