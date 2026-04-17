import { describe, it, expect, beforeEach } from 'vitest'
import { EducationService } from '../EducationService'
import type { HomeworkSubmission } from '../EducationService'

describe('EducationService', () => {
  let service: EducationService

  beforeEach(() => {
    service = new EducationService()
  })

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const status = service.getStatus()
      expect(status.name).toBe('yyc3-education-service')
      expect(status.version).toBeDefined()
    })

    it('should accept custom config', () => {
      const s = new EducationService({ educationLevel: 'university', defaultLanguage: 'en-US' })
      const status = s.getStatus()
      expect(status).toBeDefined()
    })

    it('should initialize question bank', () => {
      const status = service.getStatus()
      expect(status.stats.questionBankSize).toBeGreaterThan(0)
    })
  })

  describe('submitHomework', () => {
    it('should accept a homework submission', async () => {
      const submission = await service.submitHomework({
        studentId: 'stu-001',
        studentName: '张三',
        subject: '数学',
        grade: '高一',
        assignmentTitle: '函数与导数',
        content: '这是一份关于函数与导数的作业，包含了基础概念和应用题。',
        contentType: 'text',
        submittedAt: new Date().toISOString(),
      })
      expect(submission.id).toMatch(/^hw-/)
      expect(submission.studentId).toBe('stu-001')
      expect(submission.metadata?.wordCount).toBeGreaterThan(0)
    })
  })

  describe('gradeHomework', () => {
    it('should grade a submitted homework', async () => {
      const submission = await service.submitHomework({
        studentId: 'stu-001',
        studentName: '李四',
        subject: '语文',
        grade: '高二',
        assignmentTitle: '古诗词鉴赏',
        content: '本诗通过描绘山水景色，表达了诗人对自然的热爱和对世俗的超脱。诗人运用了比喻和拟人等修辞手法，使诗歌意境深远。',
        contentType: 'text',
        submittedAt: new Date().toISOString(),
      })
      const result = await service.gradeHomework(submission.id)
      expect(result.submissionId).toBe(submission.id)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.grade).toBeDefined()
      expect(result.feedback).toBeDefined()
      expect(result.feedback.overall).toBeDefined()
      expect(result.detailedReview.length).toBeGreaterThan(0)
    })

    it('should throw for non-existent submission', async () => {
      await expect(service.gradeHomework('non-existent')).rejects.toThrow(/not found/)
    })

    it('should respect strictness option', async () => {
      const sub = await service.submitHomework({
        studentId: 'stu-002',
        studentName: '王五',
        subject: '英语',
        grade: '初三',
        assignmentTitle: 'Reading Comprehension',
        content: 'The article discusses the impact of technology on modern education and provides several examples.',
        contentType: 'text',
        submittedAt: new Date().toISOString(),
      })
      const lenient = await service.gradeHomework(sub.id, { strictness: 'lenient' })
      const strict = await service.gradeHomework(sub.id, { strictness: 'strict' })
      expect(typeof lenient.score).toBe('number')
      expect(typeof strict.score).toBe('number')
    })

    it('should include plagiarism check by default', async () => {
      const sub = await service.submitHomework({
        studentId: 'stu-003',
        studentName: '赵六',
        subject: '历史',
        grade: '高三',
        assignmentTitle: '近代史分析',
        content: '近代中国的变革始于鸦片战争，此后经历了洋务运动、戊戌变法等一系列改革。',
        contentType: 'text',
        submittedAt: new Date().toISOString(),
      })
      const result = await service.gradeHomework(sub.id)
      expect(result.plagiarismCheck).toBeDefined()
    })
  })

  describe('generateQuestion', () => {
    it('should generate a question', async () => {
      const questions = await service.generateQuestion({
        subject: '数学',
        topic: '微积分',
        type: 'multiple-choice',
        difficulty: 'medium',
      })
      expect(questions.length).toBe(1)
      expect(questions[0].type).toBe('multiple-choice')
      expect(questions[0].subject).toBe('数学')
    })

    it('should generate multiple questions', async () => {
      const questions = await service.generateQuestion({
        subject: '物理',
        topic: '力学',
        type: 'short-answer',
        difficulty: 'hard',
        count: 3,
      })
      expect(questions.length).toBe(3)
    })
  })

  describe('generateExam', () => {
    it('should generate a complete exam', async () => {
      const exam = await service.generateExam({
        title: '期中考试',
        subject: '数学',
        grade: '高一',
        duration: 90,
        totalPoints: 100,
        sections: [
          {
            title: '选择题',
            questionTypes: [{ type: 'multiple-choice', count: 2, difficulty: 'easy', points: 5 }],
          },
          {
            title: '解答题',
            questionTypes: [{ type: 'essay', count: 1, difficulty: 'medium', points: 20 }],
          },
        ],
      })
      expect(exam.id).toMatch(/^exam-/)
      expect(exam.title).toBe('期中考试')
      expect(exam.sections.length).toBe(2)
      expect(exam.answerKey.length).toBeGreaterThan(0)
    })
  })

  describe('createLearningPlan', () => {
    it('should create a learning plan', () => {
      const plan = service.createLearningPlan({
        studentId: 'stu-010',
        studentName: '测试学生',
        subject: '数学',
        goal: '提高代数能力',
        currentLevel: '中等',
        targetLevel: '优秀',
        durationWeeks: 8,
      })
      expect(plan.id).toMatch(/^lp-/)
      expect(plan.modules.length).toBeGreaterThan(0)
      expect(plan.milestones.length).toBeGreaterThan(0)
    })
  })

  describe('getKnowledgePoint', () => {
    it('should return undefined for unknown topic', () => {
      const point = service.getKnowledgePoint('unknown-topic-xyz')
      expect(point).toBeUndefined()
    })
  })

  describe('explainConcept', () => {
    it('should explain a concept at basic level', () => {
      const explanation = service.explainConcept('函数', 'basic')
      expect(explanation).toBeDefined()
      expect(explanation.concept).toBeDefined()
    })
  })

  describe('getStatus', () => {
    it('should return service status', () => {
      const status = service.getStatus()
      expect(status.name).toBe('yyc3-education-service')
      expect(status.version).toBeDefined()
      expect(status.stats).toBeDefined()
      expect(status.capabilities).toBeDefined()
    })
  })
})
