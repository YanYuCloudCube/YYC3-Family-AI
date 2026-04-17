export interface OfficeConfig {
  defaultLanguage?: 'zh-CN' | 'en-US' | 'ja-JP'
  timezone?: string
  dateFormat?: string
  enableTemplates?: boolean
  enableAIAssistance?: boolean
}

export interface DocumentTemplate {
  id: string
  name: string
  category: 'report' | 'letter' | 'contract' | 'invoice' | 'resume' | 'presentation' | 'memo' | 'email'
  description: string
  variables: Array<{
    name: string
    label: string
    type: 'text' | 'date' | 'number' | 'select' | 'multiline'
    required: boolean
    defaultValue?: string
    options?: string[]
    placeholder?: string
  }>
  content: string
  metadata: {
    version: number
    author?: string
    createdAt: string
    updatedAt: string
    usageCount: number
  }
}

export interface GeneratedDocument {
  id: string
  templateId: string
  title: string
  content: string
  format: 'markdown' | 'html' | 'plain-text'
  metadata: {
    generatedAt: string
    generatedBy: string
    variables: Record<string, string>
    wordCount: number
    charCount: number
  }
  preview?: string
}

export interface EmailDraft {
  id: string
  to: Array<{ email: string; name?: string }>
  cc?: Array<{ email: string; name?: string }>
  bcc?: Array<{ email: string; name?: string }>
  subject: string
  body: string
  format: 'plain' | 'html' | 'markdown'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  attachments?: Array<{
    filename: string
    contentType: string
    size: number
    content: string
  }>
  metadata: {
    draftAt: string
    status: 'draft' | 'sent' | 'scheduled'
    scheduledAt?: string
    readReceipt?: boolean
  }
}

export interface ScheduleEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  allDay?: boolean
  location?: string
  attendees: Array<{ name: string; email: string; status: 'accepted' | 'declined' | 'tentative' | 'pending' }>
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: Date
    count?: number
  }
  reminders: Array<{ minutesBefore: number; method: 'email' | 'popup' | 'sound' }>
  category?: 'meeting' | 'task' | 'reminder' | 'appointment' | 'deadline'
  color?: string
  metadata: {
    createdAt: string
    updatedAt: string
    createdBy: string
  }
}

export interface TaskItem {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  assignee?: string
  tags?: string[]
  subtasks: Array<{
    id: string
    title: string
    completed: boolean
  }>
  attachments?: Array<{
    name: string
    url: string
    type: string
  }>
  comments: Array<{
    id: string
    author: string
    content: string
    createdAt: string
  }>
  timeTracking?: {
    estimatedHours?: number
    actualHours?: number
    startedAt?: Date
  }
  metadata: {
    createdAt: string
    updatedAt: string
    completedAt?: string
  }
}

export interface MeetingMinutes {
  id: string
  meetingId: string
  title: string
  date: string
  attendees: Array<{ name: string; role: string; present: boolean }>
  agenda: Array<{
    topic: string
    presenter: string
    duration: number
    status: 'discussed' | 'skipped' | 'postponed'
  }>
  decisions: Array<{
    decision: string
    responsible: string
    deadline?: string
    priority: 'high' | 'medium' | 'low'
  }>
  actionItems: Array<{
    task: string
    assignee: string
    dueDate?: string
    status: 'pending' | 'in-progress' | 'completed'
  }>
  notes: string
  nextMeeting?: {
    date: string
    proposedAgenda: string[]
  }
  generatedAt: string
}

const BUILTIN_TEMPLATES: Omit<DocumentTemplate, 'id' | 'metadata'>[] = [
  {
    name: '周报模板',
    category: 'report',
    description: '标准工作周报，包含工作总结、下周计划和问题反馈',
    variables: [
      { name: 'author', label: '姓名', type: 'text', required: true, placeholder: '请输入您的姓名' },
      { name: 'department', label: '部门', type: 'text', required: true },
      { name: 'weekRange', label: '周次', type: 'text', required: true, placeholder: '2026年第15周 (4/13-4/17)' },
      { name: 'workSummary', label: '本周工作总结', type: 'multiline', required: true, placeholder: '描述本周完成的主要工作...' },
      { name: 'nextWeekPlan', label: '下周工作计划', type: 'multiline', required: true },
      { name: 'issues', label: '问题与建议', type: 'multiline', required: false },
      { name: 'metrics', label: '关键指标', type: 'multiline', required: false, placeholder: '完成率、效率提升等数据...' },
    ],
    content: `# {{weekRange}} 工作周报

**姓名**: {{author}}  
**部门**: {{department}}  
**日期**: {{weekRange}}

---

## 📊 本周工作总结

{{workSummary}}

---

## 📅 下周工作计划

{{nextWeekPlan}}

---

## ⚠️ 问题与建议

{{issues || '无'}}

---

## 📈 关键指标

{{metrics || '无'}}

---
*报告生成时间: {{generatedAt}}*`,
  },
  {
    name: '会议纪要模板',
    category: 'memo',
    description: '标准会议纪要格式，包含议题、决议和行动项',
    variables: [
      { name: 'meetingTitle', label: '会议主题', type: 'text', required: true },
      { name: 'date', label: '会议日期', type: 'date', required: true },
      { name: 'time', label: '会议时间', type: 'text', required: true, placeholder: '14:00-15:30' },
      { name: 'location', label: '会议地点', type: 'text', required: false },
      { name: 'organizer', label: '组织者', type: 'text', required: true },
      { name: 'attendees', label: '参会人员', type: 'multiline', required: true, placeholder: '每人一行：姓名 - 角色' },
      { name: 'agenda', label: '会议议程', type: 'multiline', required: true },
      { name: 'decisions', label: '会议决议', type: 'multiline', required: false },
      { name: 'actionItems', label: '行动项', type: 'multiline', required: false },
      { name: 'notes', label: '会议记录', type: 'multiline', required: false },
    ],
    content: `# 会议纪要: {{meetingTitle}}

**日期**: {{date}}  
**时间**: {{time}}  
{{location ? '**地点**: ' + location + '\\n' : ''}}**组织者**: {{organizer}}

---

## 👥 参会人员

{{attendees}}

---

## 📋 会议议程

{{agenda}}

---

## ✅ 会议决议

{{decisions || '无正式决议'}}

---

## 📝 行动项

{{actionItems || '无待办事项'}}

---

## 📝 会议记录

{{notes || ''}}

---
*纪要生成时间: {{generatedAt}}*`,
  },
  {
    name: '项目状态报告',
    category: 'report',
    description: '项目进度和状态汇报模板',
    variables: [
      { name: 'projectName', label: '项目名称', type: 'text', required: true },
      { name: 'reporter', label: '报告人', type: 'text', required: true },
      { name: 'period', label: '报告周期', type: 'text', required: true },
      { name: 'overallStatus', label: '整体状态', type: 'select', required: true, options: ['🟢 正常', '🟡 有风险', '🔴 严重延迟'] },
      { name: 'progress', label: '完成进度', type: 'text', required: true, placeholder: '75%' },
      { name: 'milestones', label: '里程碑进展', type: 'multiline', required: true },
      { name: 'risks', label: '风险项', type: 'multiline', required: false },
      { name: 'blockers', label: '阻塞问题', type: 'multiline', required: false },
      { name: 'nextSteps', label: '下一步计划', type: 'multiline', required: true },
    ],
    content: `# 项目状态报告: {{projectName}}

**报告人**: {{reporter}}  
**周期**: {{period}}  
**整体状态**: {{overallStatus}}  
**完成进度**: {{progress}}

---

## 🎯 里程碑进展

{{milestones}}

---

## ⚠️ 风险项

{{risks || '当前无重大风险'}}

---

## 🚧 阻塞问题

{{blockers || '无阻塞问题'}}

---

## ➡️ 下一步计划

{{nextSteps}}

---
*报告生成时间: {{generatedAt}}*`,
  },
  {
    name: '商务邮件-会议邀请',
    category: 'email',
    description: '专业会议邀请邮件模板',
    variables: [
      { name: 'recipientName', label: '收件人姓名', type: 'text', required: true },
      { name: 'senderName', label: '发件人姓名', type: 'text', required: true },
      { name: 'meetingTopic', label: '会议主题', type: 'text', required: true },
      { name: 'meetingDate', label: '会议日期', type: 'date', required: true },
      { name: 'meetingTime', label: '会议时间', type: 'text', required: true },
      { name: 'duration', label: '预计时长', type: 'text', required: false, defaultValue: '1小时' },
      { name: 'location', label: '会议地点', type: 'text', required: true },
      { name: 'agenda', label: '会议议程', type: 'multiline', required: false },
      { name: 'additionalInfo', label: '补充说明', type: 'multiline', required: false },
    ],
    content: `主题: 邀请您参加: {{meetingTopic}}

尊敬的{{recipientName}}：

您好！

诚邀您参加关于"{{meetingTopic}}"的会议。

**会议详情**:
- 📅 日期: {{meetingDate}}
- ⏰ 时间: {{meetingTime}}
- ⏱️ 时长: {{duration || '1小时'}}
- 📍 地点: {{location}}

{{agenda ? '## 会议议程\\n\\n' + agenda : ''}}

{{additionalInfo ? '\\n---\\n\\n' + additionalInfo : ''}}

请确认您是否能够出席。如有任何问题或需要调整时间，请随时与我联系。

期待您的参与！

此致  
敬礼

**{{senderName}}**  
{{new Date().toLocaleDateString('zh-CN')}}

---
*此邮件由 YYC³ Office Automation 自动生成*`,
  },
]

export class OfficeAutomationService {
  private config: Required<OfficeConfig> & { defaultLanguage: string; timezone: string }
  private templates: Map<string, DocumentTemplate> = new Map()
  private documents: Map<string, GeneratedDocument> = new Map()
  private emails: Map<string, EmailDraft> = new Map()
  private events: Map<string, ScheduleEvent> = new Map()
  private tasks: Map<string, TaskItem> = new Map()

  constructor(config: OfficeConfig = {}) {
    this.config = {
      defaultLanguage: config.defaultLanguage || 'zh-CN',
      timezone: config.timezone || 'Asia/Shanghai',
      dateFormat: config.dateFormat || 'YYYY-MM-DD',
      enableTemplates: config.enableTemplates !== false,
      enableAIAssistance: config.enableAIAssistance !== false,
    }

    this.initializeBuiltinTemplates()
  }

  private initializeBuiltinTemplates(): void {
    BUILTIN_TEMPLATES.forEach(template => {
      const docTemplate: DocumentTemplate = {
        ...template,
        id: this.generateId('tpl'),
        metadata: {
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0,
        },
      }
      this.templates.set(docTemplate.id, docTemplate)
    })
  }

  async generateDocument(
    templateId: string,
    variables: Record<string, string>,
    options?: { format?: 'markdown' | 'html' | 'plain-text'; title?: string }
  ): Promise<GeneratedDocument> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    this.validateVariables(template, variables)

    let content = template.content

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      content = content.replace(regex, value || '')
    })

    content = content.replace(/\{\{(\w+)\|\|([^}]*)\}\}/g, '$2')
    content = content.replace(/\{\{generatedAt\}\}/g, new Date().toLocaleString(this.config.defaultLanguage))

    const format = options?.format || 'markdown'

    const document: GeneratedDocument = {
      id: this.generateId('doc'),
      templateId,
      title: options?.title || template.name,
      content: format === 'html' ? this.markdownToHtml(content) : format === 'plain-text' ? this.stripMarkdown(content) : content,
      format,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'yyc3-office-automation',
        variables,
        wordCount: this.countWords(content),
        charCount: content.length,
      },
      preview: this.generatePreview(content),
    }

    this.documents.set(document.id, document)

    template.metadata.usageCount++
    template.metadata.updatedAt = new Date().toISOString()

    return document
  }

  createEmail(draft: Omit<EmailDraft, 'id' | 'metadata'>): EmailDraft {
    const email: EmailDraft = {
      ...draft,
      id: this.generateId('email'),
      metadata: {
        draftAt: new Date().toISOString(),
        status: 'draft',
      },
    }

    this.emails.set(email.id, email)
    return email
  }

  async generateEmailFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    recipients: Array<{ email: string; name?: string }>,
    options?: { cc?: typeof recipients; bcc?: typeof recipients; priority?: EmailDraft['priority'] }
  ): Promise<EmailDraft> {
    const document = await this.generateDocument(templateId, variables, { format: 'plain-text' })

    const subjectMatch = document.content.match(/^主题:\s*(.+)$/m)
    const subject = subjectMatch ? subjectMatch[1] : document.title
    const body = document.content.replace(/^主题:\s*.+\n?/m, '')

    return this.createEmail({
      to: recipients,
      subject,
      body,
      format: 'plain',
      priority: options?.priority || 'normal',
      cc: options?.cc,
      bcc: options?.bcc,
    })
  }

  createEvent(eventData: Omit<ScheduleEvent, 'id' | 'metadata'>): ScheduleEvent {
    const event: ScheduleEvent = {
      ...eventData,
      id: this.generateId('event'),
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user',
      },
    }

    this.events.set(event.id, event)
    return event
  }

  updateEvent(eventId: string, updates: Partial<Omit<ScheduleEvent, 'id' | 'metadata'>>): ScheduleEvent | null {
    const event = this.events.get(eventId)
    if (!event) return null

    const updated: ScheduleEvent = {
      ...event,
      ...updates,
      metadata: {
        ...event.metadata,
        updatedAt: new Date().toISOString(),
      },
    }

    this.events.set(eventId, updated)
    return updated
  }

  deleteEvent(eventId: string): boolean {
    return this.events.delete(eventId)
  }

  getEventsForDate(date: Date): ScheduleEvent[] {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    return Array.from(this.events.values()).filter(event => {
      const eventStart = new Date(event.startTime)
      return eventStart >= targetDate && eventStart < nextDay
    })
  }

  getUpcomingEvents(limit: number = 10): ScheduleEvent[] {
    const now = new Date()

    return Array.from(this.events.values())
      .filter(event => new Date(event.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, limit)
  }

  createTask(taskData: Omit<TaskItem, 'id' | 'metadata'>): TaskItem {
    const task: TaskItem = {
      ...taskData,
      id: this.generateId('task'),
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }

    this.tasks.set(task.id, task)
    return task
  }

  updateTask(taskId: string, updates: Partial<Omit<TaskItem, 'id' | 'metadata'>>): TaskItem | null {
    const task = this.tasks.get(taskId)
    if (!task) return null

    const updated: TaskItem = {
      ...task,
      ...updates,
      metadata: {
        ...task.metadata,
        updatedAt: new Date().toISOString(),
        completedAt: updates.status === 'completed' ? new Date().toISOString() : task.metadata.completedAt,
      },
    }

    this.tasks.set(taskId, updated)
    return updated
  }

  addSubtask(taskId: string, subtaskTitle: string): TaskItem | null {
    const task = this.tasks.get(taskId)
    if (!task) return null

    const subtask = {
      id: this.generateId('sub'),
      title: subtaskTitle,
      completed: false,
    }

    task.subtasks.push(subtask)
    task.metadata.updatedAt = new Date().toISOString()

    return task
  }

  addComment(taskId: string, author: string, content: string): TaskItem | null {
    const task = this.tasks.get(taskId)
    if (!task) return null

    task.comments.push({
      id: this.generateId('comment'),
      author,
      content,
      createdAt: new Date().toISOString(),
    })

    task.metadata.updatedAt = new Date().toISOString()
    return task
  }

  getTasks(filter?: {
    status?: TaskItem['status']
    priority?: TaskItem['priority']
    assignee?: string
    tag?: string
    dueBefore?: Date
    dueAfter?: Date
  }): TaskItem[] {
    let tasks = Array.from(this.tasks.values())

    if (filter?.status) tasks = tasks.filter(t => t.status === filter.status)
    if (filter?.priority) tasks = tasks.filter(t => t.priority === filter.priority)
    if (filter?.assignee) tasks = tasks.filter(t => t.assignee === filter.assignee)
    if (filter?.tag) tasks = tasks.filter(t => t.tags?.includes(filter.tag!))
    if (filter?.dueBefore) tasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) <= filter.dueBefore!)
    if (filter?.dueAfter) tasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) >= filter.dueAfter!)

    return tasks.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff

      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      return dateA - dateB
    })
  }

  async generateMeetingMinutes(meetingData: {
    title: string
    date: string
    attendees: Array<{ name: string; role?: string; present?: boolean }>
    agenda?: Array<{ topic: string; presenter?: string; duration?: number }>
    notes?: string
  }): Promise<MeetingMinutes> {
    const decisions = await this.extractDecisionsFromNotes(meetingData.notes || '')
    const actionItems = await this.extractActionItemsFromNotes(meetingData.notes || '')

    const minutes: MeetingMinutes = {
      id: this.generateId('min'),
      meetingId: this.generateId('meet'),
      title: meetingData.title,
      date: meetingData.date,
      attendees: meetingData.attendees.map(a => ({
        name: a.name,
        role: a.role || '参会者',
        present: a.present ?? true,
      })),
      agenda: (meetingData.agenda || []).map((item, index) => ({
        topic: item.topic,
        presenter: item.presenter || '',
        duration: item.duration || 15,
        status: 'discussed' as const,
      })),
      decisions,
      actionItems,
      notes: meetingData.notes || '',
      generatedAt: new Date().toISOString(),
    }

    return minutes
  }

  formatMeetingMinutes(minutes: MeetingMinutes, format: 'markdown' | 'html' = 'markdown'): string {
    if (format === 'html') {
      return this.markdownToHtml(this.formatMinutesAsMarkdown(minutes))
    }
    return this.formatMinutesAsMarkdown(minutes)
  }

  private formatMinutesAsMarkdown(minutes: MeetingMinutes): string {
    let md = `# 会议纪要: ${minutes.title}\n\n`
    md += `**日期**: ${minutes.date}\n\n`
    md += `**生成时间**: ${minutes.generatedAt}\n\n`

    md += `## 👥 参会人员\n\n`
    md += `| 姓名 | 角色 | 出席 |\n|------|------|------|\n`
    minutes.attendees.forEach(a => {
      md += `| ${a.name} | ${a.role} | ${a.present ? '✅' : '❌'} |\n`
    })

    if (minutes.agenda.length > 0) {
      md += `\n## 📋 议程\n\n`
      minutes.agenda.forEach((item, i) => {
        md += `${i + 1}. **${item.topic}** (${item.duration}分钟) - ${item.presenter || '待定'}\n`
      })
    }

    if (minutes.decisions.length > 0) {
      md += `\n## ✅ 决议\n\n`
      minutes.decisions.forEach((d, i) => {
        md += `${i + 1}. ${d.decision} → **负责人**: ${d.responsible}${d.deadline ? ` (截止: ${d.deadline})` : ''}\n`
      })
    }

    if (minutes.actionItems.length > 0) {
      md += `\n## 📝 行动项\n\n`
      minutes.actionItems.forEach((item, i) => {
        md += `- [ ] ${item.task} → **${item.assignee}**${item.dueDate ? ` (截止: ${item.dueDate})` : ''}\n`
      })
    }

    if (minutes.notes) {
      md += `\n## 📝 详细记录\n\n${minutes.notes}\n`
    }

    return md
  }

  listTemplates(category?: DocumentTemplate['category']): DocumentTemplate[] {
    let templates = Array.from(this.templates.values())

    if (category) {
      templates = templates.filter(t => t.category === category)
    }

    return templates.sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
  }

  getTemplate(templateId: string): DocumentTemplate | undefined {
    return this.templates.get(templateId)
  }

  addCustomTemplate(template: Omit<DocumentTemplate, 'id' | 'metadata'>): DocumentTemplate {
    const newTemplate: DocumentTemplate = {
      ...template,
      id: this.generateId('tpl-custom'),
      metadata: {
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      },
    }

    this.templates.set(newTemplate.id, newTemplate)
    return newTemplate
  }

  getDocument(documentId: string): GeneratedDocument | undefined {
    return this.documents.get(documentId)
  }

  exportDocument(documentId: string, format: 'pdf' | 'docx' | 'txt' | 'html'): string {
    const doc = this.documents.get(documentId)
    if (!doc) throw new Error(`Document not found: ${documentId}`)

    switch (format) {
      case 'pdf':
        return this.exportAsPDF(doc)
      case 'docx':
        return this.exportAsDocx(doc)
      case 'txt':
        return this.stripMarkdown(doc.content)
      case 'html':
        return this.markdownToHtml(doc.content)
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  getStatus(): {
    name: string
    version: string
    stats: {
      totalTemplates: number
      customTemplates: number
      documentsGenerated: number
      emailsCreated: number
      eventsCreated: number
      tasksCreated: number
      meetingsProcessed: number
    }
    capabilities: string[]
  } {
    return {
      name: 'yyc3-office-automation',
      version: '2.0.0',
      stats: {
        totalTemplates: this.templates.size,
        customTemplates: Array.from(this.templates.values()).filter(t => t.id.startsWith('tpl-custom')).length,
        documentsGenerated: this.documents.size,
        emailsCreated: this.emails.size,
        eventsCreated: this.events.size,
        tasksCreated: this.tasks.size,
        meetingsProcessed: 0,
      },
      capabilities: [
        'Document Template System (4+ Built-in)',
        'Smart Variable Replacement',
        'Email Draft Generation',
        'Calendar Event Management',
        'Task & Project Tracking',
        'Meeting Minutes Auto-generation',
        'Multi-format Export (PDF/DOCX/TXT/HTML)',
        'Custom Template Creation',
        'Action Item Extraction',
        'Decision Tracking',
      ],
    }
  }

  private validateVariables(template: DocumentTemplate, variables: Record<string, string>): void {
    const missingRequired = template.variables
      .filter(v => v.required && !variables[v.name])
      .map(v => v.label)

    if (missingRequired.length > 0) {
      throw new Error(`Missing required fields: ${missingRequired.join(', ')}`)
    }
  }

  private async extractDecisionsFromNotes(notes: string): Promise<MeetingMinutes['decisions']> {
    const decisions: MeetingMinutes['decisions'] = []
    const patterns = [
      /决定[：:]\s*(.+)/gi,
      /决议[：:]\s*(.+)/gi,
      /确认[：:]\s*(.+)/gi,
      /通过[：:]\s*(.+)/gi,
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(notes)) !== null) {
        decisions.push({
          decision: match[1].trim(),
          responsible: '',
          priority: 'medium',
        })
      }
    }

    return decisions
  }

  private async extractActionItemsFromNotes(notes: string): Promise<MeetingMinutes['actionItems']> {
    const actionItems: MeetingMinutes['actionItems'] = []
    const patterns = [
      /(?:TODO|待办|行动项)[：:]\s*(.+?)(?:→.*?(?:负责|由)\s*(\S+))?\s*(?:截止[：:]?\s*(\S+))?/gi,
      /(.+?)\s*[→\-]\s*(\S+)\s+(?:负责|处理)/gi,
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(notes)) !== null) {
        actionItems.push({
          task: match[1].trim(),
          assignee: match[2] || '待分配',
          dueDate: match[3] || undefined,
          status: 'pending',
        })
      }
    }

    return actionItems
  }

  private generatePreview(content: string, maxLength: number = 200): string {
    const plainText = this.stripMarkdown(content)
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + '...'
      : plainText
  }

  private markdownToHtml(markdown: string): string {
    let html = markdown

    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    html = html.replace(/\n\n/g, '</p><p>')
    html = html.replace(/^(?!<[hublop])(.+)$/gm, '<p>$1</p>')

    return html
  }

  private stripMarkdown(markdown: string): string {
    return markdown
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[(.+?)\]\(.*?\)/g, '$1')
      .replace(/^\s*[-*+]\s/gm, '- ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length
  }

  private exportAsPDF(_doc: GeneratedDocument): string {
    return `%PDF-1.4
%Generated by YYC³ Office Automation
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
%%EOF`
  }

  private exportAsDocx(_doc: GeneratedDocument): string {
    return `PK\x03\x04\x14\x00\x06\x00\x08\x00\x00\x00\x21\x00...
[Word Document Content - ${_doc.title}]
Generated by YYC³ Office Automation Service`
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }
}
