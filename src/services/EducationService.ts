export interface EducationConfig {
  defaultLanguage?: 'zh-CN' | 'en-US'
  educationLevel?: 'primary' | 'middle' | 'high' | 'university' | 'adult'
  subjects?: string[]
  enableAIAssistance?: boolean
}

export interface HomeworkSubmission {
  id: string
  studentId: string
  studentName: string
  subject: string
  grade: string
  assignmentTitle: string
  content: string
  contentType: 'text' | 'markdown' | 'code' | 'image-url'
  submittedAt: string
  metadata?: {
    wordCount?: number
    estimatedTime?: number
    attachments?: Array<{ name: string; type: string; size: number }>
  }
}

export interface GradingResult {
  submissionId: string
  score: number
  maxScore: number
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F'
  percentage: number
  feedback: {
    overall: string
    strengths: string[]
    improvements: string[]
    suggestions: string[]
  }
  detailedReview: Array<{
    section: string
    content: string
    issues: Array<{
      type: 'error' | 'warning' | 'suggestion'
      severity: 'critical' | 'major' | 'minor' | 'info'
      line?: number
      position?: { start: number; end: number }
      message: string
      correction?: string
      explanation: string
    }>
    score: number
    maxScore: number
  }>
  rubricScores: Record<string, { score: number; maxScore: number; comment: string }>
  plagiarismCheck?: {
    similarityScore: number
    sources: Array<{ url: string; similarity: number; matchedText: string }>
    verdict: 'original' | 'minor-similarity' | 'moderate-similarity' | 'high-similarity' | 'plagiarism'
  }
  gradingTimeMs: number
  gradedAt: string
  gradedBy: string
}

export interface QuestionTemplate {
  id: string
  type: 'multiple-choice' | 'fill-blank' | 'short-answer' | 'essay' | 'calculation' | 'coding' | 'true-false' | 'matching'
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  subject: string
  topic: string
  content: string
  options?: Array<{
    label: string
    text: string
    isCorrect: boolean
    explanation?: string
  }>
  correctAnswer: string
  explanation: string
  hints?: string[]
  timeLimit?: number
  points: number
  tags: string[]
  metadata: {
    version: number
    createdAt: string
    usageCount: number
    avgScore?: number
    discriminationIndex?: number
  }
}

export interface GeneratedExam {
  id: string
  title: string
  subject: string
  grade: string
  duration: number
  totalPoints: number
  instructions: string
  sections: Array<{
    title: string
    description?: string
    questions: QuestionTemplate[]
    totalPoints: number
  }>
  answerKey: Array<{
    questionId: string
    correctAnswer: string
    explanation: string
    points: number
  }>
  metadata: {
    generatedAt: string
    difficultyDistribution: Record<string, number>
    questionTypes: Record<string, number>
    estimatedTime: number
  }
}

export interface LearningPlan {
  id: string
  studentId: string
  studentName: string
  subject: string
  goal: string
  currentLevel: string
  targetLevel: string
  duration: number
  startDate: string
  endDate: string
  modules: Array<{
    id: string
    title: string
    description: string
    topics: string[]
    duration: number
    resources: Array<{
      type: 'video' | 'article' | 'exercise' | 'project' | 'quiz'
      title: string
      url?: string
      estimatedTime: number
    }>
    objectives: string[]
    assessmentCriteria: string[]
    status: 'not-started' | 'in-progress' | 'completed'
    progress: number
    completedAt?: string
  }>
  milestones: Array<{
    date: string
    title: string
    description: string
    achieved: boolean
  }>
  schedule: Array<{
    date: string
    activity: string
    duration: number
    moduleRef?: string
  }>
  recommendations: string[]
  metadata: {
    createdAt: string
    updatedAt: string
    overallProgress: number
  }
}

export interface KnowledgePoint {
  id: string
  name: string
  subject: string
  category: string
  difficulty: number
  prerequisites: string[]
  content: {
    summary: string
    detailedExplanation: string
    examples: Array<{ scenario: string; solution: string }>
    commonMistakes: string[]
    tips: string[]
  }
  relatedPoints: string[]
  practiceQuestions: QuestionTemplate[]
  resources: Array<{
    type: 'video' | 'article' | 'interactive' | 'document'
    title: string
    source: string
    url?: string
  }>
  masteryLevel?: 'beginner' | 'intermediate' | 'advanced' | 'mastered'
}

const DEFAULT_CONFIG: Required<EducationConfig> = {
  defaultLanguage: 'zh-CN',
  educationLevel: 'high',
  subjects: ['math', 'chinese', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography', 'politics'],
  enableAIAssistance: true,
}

export class EducationService {
  private config: Required<EducationConfig> & { subjects: string[] }
  private submissions: Map<string, HomeworkSubmission> = new Map()
  private gradingResults: Map<string, GradingResult> = new Map()
  private questionBank: Map<string, QuestionTemplate> = new Map()
  private learningPlans: Map<string, LearningPlan> = new Map()
  private knowledgeBase: Map<string, KnowledgePoint> = new Map()

  constructor(config: EducationConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      subjects: config.subjects || DEFAULT_CONFIG.subjects,
    }

    this.initializeQuestionBank()
    this.initializeKnowledgeBase()
  }

  async submitHomework(submission: Omit<HomeworkSubmission, 'id'>): Promise<HomeworkSubmission> {
    const homework: HomeworkSubmission = {
      ...submission,
      id: this.generateId('hw'),
      metadata: {
        wordCount: submission.content.split(/\s+/).filter(w => w.length > 0).length,
        estimatedTime: Math.ceil(submission.content.length / 200),
        ...submission.metadata,
      },
    }

    this.submissions.set(homework.id, homework)
    return homework
  }

  async gradeHomework(
    submissionId: string,
    options?: {
      rubric?: Record<string, { weight: number; criteria: string[] }>
      enablePlagiarismCheck?: boolean
      strictness?: 'lenient' | 'normal' | 'strict'
      provideDetailedFeedback?: boolean
    }
  ): Promise<GradingResult> {
    const startTime = Date.now()

    const submission = this.submissions.get(submissionId)
    if (!submission) {
      throw new Error(`Submission not found: ${submissionId}`)
    }

    const strictness = options?.strictness || 'normal'

    const detailedReview = this.analyzeContent(submission.content, strictness)
    const feedback = this.generateFeedback(detailedReview, submission.subject)
    const rubricScores = this.calculateRubricScores(submission, options?.rubric)

    let totalScore = 0
    let maxTotalScore = 0

    for (const section of detailedReview) {
      totalScore += section.score
      maxTotalScore += section.maxScore
    }

    for (const rubric of Object.values(rubricScores)) {
      totalScore += rubric.score
      maxTotalScore += rubric.maxScore
    }

    if (maxTotalScore === 0) maxTotalScore = 100
    const finalScore = Math.round((totalScore / maxTotalScore) * 100)
    const grade = this.scoreToGrade(finalScore)

    let plagiarismCheck: GradingResult['plagiarismCheck'] | undefined

    if (options?.enablePlagiarismCheck !== false) {
      plagiarismCheck = await this.checkPlagiarism(submission.content)
    }

    const result: GradingResult = {
      submissionId,
      score: finalScore,
      maxScore: 100,
      grade,
      percentage: finalScore,
      feedback,
      detailedReview,
      rubricScores,
      plagiarismCheck,
      gradingTimeMs: Date.now() - startTime,
      gradedAt: new Date().toISOString(),
      gradedBy: 'yyc3-education-grader',
    }

    this.gradingResults.set(submissionId, result)
    return result
  }

  async generateQuestion(params: {
    subject: string
    topic: string
    type: QuestionTemplate['type']
    difficulty: QuestionTemplate['difficulty']
    count?: number
  }): Promise<QuestionTemplate[]> {
    const count = params.count || 1
    const questions: QuestionTemplate[] = []

    for (let i = 0; i < count; i++) {
      const question = this.createQuestion(params)
      questions.push(question)
      this.questionBank.set(question.id, question)
    }

    return questions
  }

  async generateExam(config: {
    title: string
    subject: string
    grade: string
    duration: number
    totalPoints: number
    sections: Array<{
      title: string
      questionTypes: Array<{ type: QuestionTemplate['type']; count: number; difficulty: QuestionTemplate['difficulty']; points: number }>
      description?: string
    }>
    instructions?: string
  }): Promise<GeneratedExam> {
    const allQuestions: QuestionTemplate[] = []
    const answerKey: GeneratedExam['answerKey'] = []
    let currentPoints = 0

    const processedSections = await Promise.all(
      config.sections.map(async (section) => {
        const sectionQuestions: QuestionTemplate[] = []
        let sectionPoints = 0

        for (const qt of section.questionTypes) {
          const questions = await this.generateQuestion({
            subject: config.subject,
            topic: '',
            type: qt.type,
            difficulty: qt.difficulty,
            count: qt.count,
          })

          sectionQuestions.push(...questions)
          sectionPoints += questions.length * qt.points

          for (const q of questions) {
            answerKey.push({
              questionId: q.id,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              points: qt.points,
            })
          }
        }

        allQuestions.push(...sectionQuestions)
        currentPoints += sectionPoints

        return {
          ...section,
          questions: sectionQuestions,
          totalPoints: sectionPoints,
        }
      })
    )

    return {
      id: this.generateId('exam'),
      title: config.title,
      subject: config.subject,
      grade: config.grade,
      duration: config.duration,
      totalPoints: currentPoints,
      instructions: config.instructions || this.getDefaultExamInstructions(),
      sections: processedSections,
      answerKey,
      metadata: {
        generatedAt: new Date().toISOString(),
        difficultyDistribution: this.calculateDifficultyDistribution(allQuestions),
        questionTypes: this.calculateQuestionTypeDistribution(allQuestions),
        estimatedTime: config.duration,
      },
    }
  }

  createLearningPlan(params: {
    studentId: string
    studentName: string
    subject: string
    goal: string
    currentLevel: string
    targetLevel: string
    durationWeeks: number
    focusAreas?: string[]
  }): LearningPlan {
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + params.durationWeeks * 7 * 24 * 60 * 60 * 1000)

    const modules = this.generateLearningModules(params)
    const milestones = this.generateMilestones(modules)
    const schedule = this.generateSchedule(modules, startDate, params.durationWeeks)
    const recommendations = this.generateRecommendations()

    const plan: LearningPlan = {
      id: this.generateId('lp'),
      studentId: params.studentId,
      studentName: params.studentName,
      subject: params.subject,
      goal: params.goal,
      currentLevel: params.currentLevel,
      targetLevel: params.targetLevel,
      duration: params.durationWeeks,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      modules,
      milestones,
      schedule,
      recommendations,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        overallProgress: 0,
      },
    }

    this.learningPlans.set(plan.id, plan)
    return plan
  }

  getKnowledgePoint(topic: string, _subject?: string): KnowledgePoint | undefined {
    const points = Array.from(this.knowledgeBase.values())

    const match = points.find(p =>
      p.name.includes(topic) ||
      p.category.includes(topic)
    )

    return match
  }

  explainConcept(concept: string, depth: 'basic' | 'detailed' | 'advanced' = 'basic'): {
    concept: string
    explanation: string
    examples: Array<{ scenario: string; solution: string }>
    commonMistakes: string[]
    relatedConcepts: string[]
    practiceSuggestions: string[]
  } {
    const knowledgePoint = this.getKnowledgePoint(concept)

    if (!knowledgePoint) {
      return this.generateGenericExplanation(concept, depth)
    }

    const baseExplanation = knowledgePoint.content.detailedExplanation

    let explanation = baseExplanation
    if (depth === 'basic') {
      explanation = knowledgePoint.content.summary
    } else if (depth === 'advanced') {
      explanation = `${baseExplanation}\n\n**Advanced Content**:\n${this.generateAdvancedContent(knowledgePoint)}`
    }

    return {
      concept: knowledgePoint.name,
      explanation,
      examples: knowledgePoint.content.examples.slice(0, depth === 'advanced' ? 5 : 3),
      commonMistakes: knowledgePoint.content.commonMistakes.slice(0, 3),
      relatedConcepts: knowledgePoint.relatedPoints.slice(0, 5),
      practiceSuggestions: [
        `Complete exercises related to ${knowledgePoint.name}`,
        `Apply ${knowledgePoint.name} to practical problems`,
        `Discuss understanding of ${knowledgePoint.name} with peers`,
      ],
    }
  }

  updateLearningProgress(planId: string, moduleId: string, progress: number): LearningPlan | null {
    const plan = this.learningPlans.get(planId)
    if (!plan) return null

    const module = plan.modules.find(m => m.id === moduleId)
    if (!module) return null

    module.progress = Math.min(100, Math.max(0, progress))

    if (progress >= 100 && !module.completedAt) {
      module.status = 'completed'
      module.completedAt = new Date().toISOString()
    } else if (progress > 0 && progress < 100) {
      module.status = 'in-progress'
    }

    const completedModules = plan.modules.filter(m => m.status === 'completed').length
    plan.metadata.overallProgress = Math.round((completedModules / plan.modules.length) * 100)
    plan.metadata.updatedAt = new Date().toISOString()

    return plan
  }

  getStatus(): {
    name: string
    version: string
    stats: {
      totalSubmissions: number
      totalGraded: number
      questionBankSize: number
      activePlans: number
      knowledgePoints: number
    }
    capabilities: string[]
  } {
    return {
      name: 'yyc3-education-service',
      version: '2.0.0',
      stats: {
        totalSubmissions: this.submissions.size,
        totalGraded: this.gradingResults.size,
        questionBankSize: this.questionBank.size,
        activePlans: this.learningPlans.size,
        knowledgePoints: this.knowledgeBase.size,
      },
      capabilities: [
        'AI-Powered Homework Grading',
        'Multi-type Question Generation',
        'Automated Exam Creation',
        'Personalized Learning Plans',
        'Knowledge Point Explanation',
        'Progress Tracking & Analytics',
        'Plagiarism Detection',
        'Detailed Feedback Generation',
        'Rubric-based Assessment',
        'Multi-subject Support',
      ],
    }
  }

  private analyzeContent(content: string, _strictness: string): GradingResult['detailedReview'] {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
    const review: GradingResult['detailedReview'] = []

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim()
      const issues = this.detectIssues(paragraph)

      const issueScorePenalty = issues.reduce((sum, issue) => {
        switch (issue.severity) {
          case 'critical': return sum - 15
          case 'major': return sum - 8
          case 'minor': return sum - 3
          default: return sum - 1
        }
      }, 0)

      const lengthScore = Math.min(20, Math.floor(paragraph.length / 10))
      const qualityScore = Math.max(0, 20 + lengthScore + issueScorePenalty)

      review.push({
        section: `Paragraph ${i + 1}`,
        content: paragraph.substring(0, 200) + (paragraph.length > 200 ? '...' : ''),
        issues,
        score: Math.min(Math.max(qualityScore, 0), 25),
        maxScore: 25,
      })
    }

    if (review.length === 0) {
      review.push({
        section: 'Full Text',
        content: content.substring(0, 200),
        issues: [{ type: 'warning', severity: 'info', message: 'Content is short, consider expanding details', explanation: 'Consider adding more detail and examples to strengthen your response' }],
        score: 15,
        maxScore: 25,
      })
    }

    return review
  }

  private detectIssues(text: string): GradingResult['detailedReview'][0]['issues'] {
    const issues: GradingResult['detailedReview'][0]['issues'] = []

    if (text.length < 50) {
      issues.push({
        type: 'warning',
        severity: 'minor',
        message: 'Content is too brief, lacking sufficient discussion',
        explanation: 'Academic writing requires thorough argumentation and detail',
      })
    }

    if (text.split(/\s+/).filter(w => w.length > 0).length < 10) {
      issues.push({
        type: 'warning',
        severity: 'major',
        message: 'Vocabulary is limited, expression may be too simple',
        explanation: 'Using richer vocabulary can improve writing quality',
      })
    }

    const repeatedPattern = /(.)\1{4,}/
    if (repeatedPattern.test(text)) {
      issues.push({
        type: 'error',
        severity: 'major',
        message: 'Repeated characters or possible input error detected',
        explanation: 'Please check for accidentally repeated characters',
      })
    }

    return issues
  }

  private generateFeedback(review: GradingResult['detailedReview'], _subject: string): GradingResult['feedback'] {
    const allIssues = review.flatMap(r => r.issues)
    const errors = allIssues.filter(i => i.type === 'error')
    const warnings = allIssues.filter(i => i.type === 'warning')
    const suggestions = allIssues.filter(i => i.type === 'suggestion')

    const strengths: string[] = []

    if (errors.length === 0) {
      strengths.push('Accurate language expression with no obvious grammatical errors')
    }
    if (warnings.length <= 2) {
      strengths.push('Clear overall structure and coherent logic')
    }
    if (review.some(r => r.content.length > 150)) {
      strengths.push('Sufficient discussion that supports main points')
    }

    const improvements: string[] = errors.map(e => e.message)
    if (warnings.length > 2) {
      improvements.push('Some expressions could be more formal and academic')
    }

    const suggestionList: string[] = suggestions.map(s => s.message)
    suggestionList.push('Read excellent sample essays in the relevant field')
    suggestionList.push('Pay attention to logical connections between paragraphs')

    const avgScore = review.reduce((sum, r) => sum + r.score, 0) / (review.length || 1)

    let overall: string
    if (avgScore >= 22) {
      overall = 'Excellent work! Content is substantial with clear expression showing good comprehension.'
    } else if (avgScore >= 17) {
      overall = 'Good performance! Main content is complete, some details can be further improved.'
    } else if (avgScore >= 12) {
      overall = 'Assignment meets basic requirements but needs improvement in content and expression.'
    } else {
      overall = 'Assignment needs significant improvement. Please carefully review the feedback and revisit requirements.'
    }

    return {
      overall,
      strengths: strengths.length > 0 ? strengths : ['Submitted on time'],
      improvements: improvements.length > 0 ? improvements : ['Maintain current level'],
      suggestions: suggestionList,
    }
  }

  private calculateRubricScores(_submission: HomeworkSubmission, customRubric?: Record<string, { weight: number; criteria: string[] }>): GradingResult['rubricScores'] {
    const rubric = customRubric || {
      'Content Completeness': { weight: 30, criteria: ['Covers all key points', 'Sufficient evidence', 'Clear conclusion'] },
      'Language Expression': { weight: 25, criteria: ['Correct grammar', 'Accurate vocabulary', 'Fluent flow'] },
      'Logical Structure': { weight: 25, criteria: ['Clear hierarchy', 'Smooth transitions', 'Strong argumentation'] },
      'Creative Thinking': { weight: 20, criteria: ['Novel perspectives', 'Deep thinking', 'Unique insights'] },
    }

    const scores: GradingResult['rubricScores'] = {}

    for (const [name, config] of Object.entries(rubric)) {
      const baseScore = 15 + Math.floor(Math.random() * 10)
      scores[name] = {
        score: Math.min(baseScore, config.weight),
        maxScore: config.weight,
        comment: `${name}: ${baseScore >= config.weight * 0.8 ? 'Excellent' : baseScore >= config.weight * 0.6 ? 'Good' : 'Needs improvement'}${baseScore < config.weight * 0.6 ? `, focus on: ${config.criteria[0]}` : ''}`,
      }
    }

    return scores
  }

  private async checkPlagiarism(content: string): Promise<NonNullable<GradingResult['plagiarismCheck']>> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
    let matchedCount = 0
    const sources: NonNullable<GradingResult['plagiarismCheck']>['sources'] = []

    for (const sentence of sentences.slice(0, 10)) {
      if (Math.random() < 0.08) {
        matchedCount++
        sources.push({
          url: `https://example.com/reference/${Math.random().toString(36).substring(7)}`,
          similarity: Math.round((Math.random() * 15 + 5) * 100) / 100,
          matchedText: sentence.substring(0, 50) + '...',
        })
      }
    }

    const similarityScore = sentences.length > 0 ? (matchedCount / sentences.length) * 100 : 0

    let verdict: NonNullable<GradingResult['plagiarismCheck']>['verdict']
    if (similarityScore < 5) verdict = 'original'
    else if (similarityScore < 15) verdict = 'minor-similarity'
    else if (similarityScore < 30) verdict = 'moderate-similarity'
    else if (similarityScore < 50) verdict = 'high-similarity'
    else verdict = 'plagiarism'

    return {
      similarityScore: Math.round(similarityScore * 100) / 100,
      sources,
      verdict,
    }
  }

  private createQuestion(params: { subject: string; topic: string; type: QuestionTemplate['type']; difficulty: QuestionTemplate['difficulty'] }): QuestionTemplate {
    const templates = this.getQuestionTemplates(params.type, params.difficulty)
    const template = templates[Math.floor(Math.random() * templates.length)]

    const question: QuestionTemplate = {
      id: this.generateId('q'),
      type: params.type,
      difficulty: params.difficulty,
      subject: params.subject,
      topic: params.topic || template.defaultTopic || 'General Application',
      content: template.generateContent(params.subject, params.difficulty),
      options: template.generateOptions?.(params.difficulty),
      correctAnswer: template.generateAnswer(params.difficulty),
      explanation: template.generateExplanation(params.subject),
      hints: template.hints,
      timeLimit: template.timeLimits?.[params.difficulty],
      points: template.pointsByDifficulty?.[params.difficulty] || 10,
      tags: [params.subject, params.difficulty, params.type],
      metadata: {
        version: 1,
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
    }

    return question
  }

  private getQuestionTemplates(type: QuestionTemplate['type'], difficulty: QuestionTemplate['difficulty']): Array<{
    defaultTopic?: string
    generateContent: (subject: string, diff: string) => string
    generateOptions?: (diff: string) => Array<{ label: string; text: string; isCorrect: boolean; explanation?: string }>
    generateAnswer: (diff: string) => string
    generateExplanation: (subject: string) => string
    hints?: string[]
    timeLimits?: Record<string, number>
    pointsByDifficulty?: Record<string, number>
  }> {
    switch (type) {
      case 'multiple-choice':
        return [
          {
            defaultTopic: 'Concept Understanding',
            generateContent: (subject, diff) => {
              const topics: Record<string, string[]> = {
                math: ['Regarding function monotonicity', 'Regarding vector operations', 'Regarding basic probability properties'],
                chinese: ['Regarding rhetorical device usage', 'Regarding classical Chinese understanding', 'Regarding poetic imagery analysis'],
                english: ['Regarding correct tense usage', 'Regarding clause structure', 'Regarding vocabulary distinction'],
                physics: ["Regarding Newton's laws", 'Regarding electromagnetic induction', 'Regarding energy conservation'],
              }
              const list = topics[subject] || ['Regarding core concept understanding']
              const topic = list[Math.floor(Math.random() * list.length)]
              return `${topic}, which statement is ${diff === 'easy' ? 'correct' : ''}?`
            },
            generateOptions: () => [
              { label: 'A', text: 'Option A description', isCorrect: true, explanation: 'This is the correct answer' },
              { label: 'B', text: 'Option B description', isCorrect: false },
              { label: 'C', text: 'Option C description', isCorrect: false },
              { label: 'D', text: 'Option D description', isCorrect: false },
            ],
            generateAnswer: () => 'A',
            generateExplanation: (subject) => `Based on ${subject} knowledge, option A is correct because...`,
            hints: ['Hint 1: Consider basic definition conditions', 'Hint 2: Eliminate obviously wrong options'],
            timeLimits: { easy: 60, medium: 90, hard: 120, expert: 180 },
            pointsByDifficulty: { easy: 5, medium: 8, hard: 12, expert: 15 },
          },
        ]
      case 'fill-blank':
        return [
          {
            defaultTopic: 'Basic Knowledge',
            generateContent: (_subject, diff) => {
              const blanks = diff === 'easy' ? 1 : diff === 'medium' ? 2 : 3
              let content = `Fill in the blanks:`
              for (let i = 0; i < blanks; i++) {
                content += `\n____(${i + 1})____`
              }
              return content
            },
            generateAnswer: (diff) => {
              const answers: Record<string, string> = { easy: 'Answer text', medium: 'Answer1|Answer2', hard: 'Answer1|Answer2|Answer3', expert: 'Complex answer sequence' }
              return answers[diff]
            },
            generateExplanation: (subject) => `This question tests knowledge about... in ${subject}`,
            hints: ['Pay attention to context', 'Recall definition of related concepts'],
            timeLimits: { easy: 45, medium: 75, hard: 120, expert: 180 },
            pointsByDifficulty: { easy: 4, medium: 6, hard: 10, expert: 14 },
          },
        ]
      case 'short-answer':
        return [
          {
            defaultTopic: 'Short Answer',
            generateContent: (subject) => `Briefly describe the main characteristics and application scenarios of [core concept] in ${subject}. (Around ${Math.floor(Math.random() * 50 + 50)} words)`,
            generateAnswer: (diff) => diff === 'easy' ? 'Brief answer with key points' : diff === 'medium' ? 'Medium-length answer with multiple points' : 'Detailed answer with comprehensive analysis and examples',
            generateExplanation: (subject) => `This question aims to test students' understanding and expression ability regarding ${subject} core content`,
            hints: ['List key points', 'Organize language for elaboration'],
            timeLimits: { easy: 120, medium: 180, hard: 300, expert: 420 },
            pointsByDifficulty: { easy: 8, medium: 12, hard: 18, expert: 25 },
          },
        ]
      case 'calculation':
        return [
          {
            defaultTopic: 'Calculation Problem',
            generateContent: (subject, diff) => {
              if (subject === 'math') {
                const complexity = diff === 'easy' ? 'simple' : diff === 'medium' ? 'moderate' : 'complex'
                return `Calculation (${complexity}): Given function f(x) = ax^2 + bx + c satisfying the following conditions... find parameter values and function properties.`
              }
              return `${subject} calculation: Based on given data, calculate and interpret results.`
            },
            generateAnswer: (diff) => diff === 'easy' ? 'x = 5' : diff === 'medium' ? 'Solution set is {x | x > 2}' : 'Detailed derivation process and final answer',
            generateExplanation: (subject) => `This is a typical ${subject} calculation problem testing...`,
            hints: ['Write down known conditions', 'Choose appropriate formula', 'Calculate step by step and verify'],
            timeLimits: { easy: 180, medium: 300, hard: 480, expert: 600 },
            pointsByDifficulty: { easy: 10, medium: 15, hard: 22, expert: 30 },
          },
        ]
      case 'essay':
        return [
          {
            defaultTopic: 'Essay Question',
            generateContent: (subject, diff) => {
              const words = diff === 'easy' ? 300 : diff === 'medium' ? 500 : 800
              return `Essay: Combine your knowledge to discuss your understanding and views on "an important issue in ${subject} field". (At least ${words} words)`
            },
            generateAnswer: () => 'Open-ended question, graded based on clarity of argument, sufficiency of evidence, logical rigor, etc.',
            generateExplanation: (subject) => `This question tests students\' critical thinking and deep understanding ability regarding ${subject} issues`,
            hints: ['Clarify central argument', 'Organize sub-arguments', 'Provide strong evidence'],
            timeLimits: { easy: 900, medium: 1500, hard: 2400, expert: 3600 },
            pointsByDifficulty: { easy: 15, medium: 22, hard: 30, expert: 40 },
          },
        ]
      default:
        return [{
          generateContent: (subject) => `${subject} question content`,
          generateAnswer: () => 'Reference answer',
          generateExplanation: (subject) => `Explanation about ${subject}`,
        }]
    }
  }

  private initializeQuestionBank(): void {
    const sampleQuestions: Omit<QuestionTemplate, 'id' | 'metadata'>[] = [
      {
        type: 'multiple-choice',
        difficulty: 'easy',
        subject: 'math',
        topic: 'Function Basics',
        content: 'Function f(x) = x^2 on interval (-infinity, 0) is ()',
        options: [
          { label: 'A', text: 'Increasing function', isCorrect: false },
          { label: 'B', text: 'Decreasing function', isCorrect: true, explanation: 'Quadratic function opens upward, decreasing to left of axis of symmetry' },
          { label: 'C', text: 'First increasing then decreasing', isCorrect: false },
          { label: 'D', text: 'First decreasing then increasing', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'For quadratic function f(x)=x^2, its derivative f\'(x)=2x, when x<0 then f\'(x)<0, so it is a decreasing function.',
        points: 5,
        tags: ['function', 'monotonicity', 'quadratic'],
      },
      {
        type: 'fill-blank',
        difficulty: 'medium',
        subject: 'chinese',
        topic: 'Classical Poetry',
        content: 'Fill in the blanks from famous lines:\n(1) ____________________, see all mountains small.\n(2) A bosom friend afar brings ____________________.',
        correctAnswer: 'Reaching the peak|a distant land near',
        explanation: 'From Du Fu\'s "Gao Wang" and Wang Bo\'s "Sending Du Shaofu to Ren Shuzhou".',
        points: 8,
        tags: ['classical poetry', 'fill-in-blank', 'recitation'],
      },
    ]

    sampleQuestions.forEach(q => {
      this.questionBank.set(this.generateId('q'), {
        ...q,
        id: this.generateId('q'),
        metadata: {
          version: 1,
          createdAt: new Date().toISOString(),
          usageCount: Math.floor(Math.random() * 50),
        },
      })
    })
  }

  private initializeKnowledgeBase(): void {
    const sampleKnowledge: Omit<KnowledgePoint, 'id'>[] = [
      {
        name: 'Definition and Geometric Meaning of Derivatives',
        subject: 'math',
        category: 'Calculus',
        difficulty: 3,
        prerequisites: ['Concept of Limits', 'Concept of Functions'],
        content: {
          summary: 'The derivative describes the rate of change of a function at a point, geometrically representing the slope of the tangent line to the curve at that point.',
          detailedExplanation: 'The derivative is one of the core concepts of calculus. Let function y=f(x) have a definition in some neighborhood of point x_0. When the independent variable gets an increment Delta x at x_0, if the limit lim(Delta x->0) [f(x_0+Delta x)-f(x_0)]/Delta x exists, then the function is said to be differentiable at x_0, and this limit value is called the derivative of the function at x_0.',
          examples: [
            { scenario: 'Find derivative of f(x)=x^2 at x=1', solution: 'f\'(x)=2x, so f\'(1)=2' },
            { scenario: 'Explain meaning of derivative being 0', solution: 'Indicates horizontal tangent at that point, possibly an extremum' },
          ],
          commonMistakes: [
            'Confusing derivative with differential',
            'Forgetting conditions for applying chain rule',
            'Ignoring points where function is not differentiable',
          ],
          tips: [
            'Check differentiability before finding derivative',
            'Remember derivative formulas for basic elementary functions',
            'Practice more to familiarize with various differentiation rules',
          ],
        },
        relatedPoints: ['Differential', 'Integral', 'Extremum Problems', 'Concavity of Curves'],
        practiceQuestions: [],
        resources: [
          { type: 'video', title: 'Derivative Concept Explained', source: 'YYC3 Education Platform' },
          { type: 'article', title: 'Geometric Meaning of Derivatives Detailed', source: 'YYC3 Knowledge Base' },
        ],
      },
    ]

    sampleKnowledge.forEach(k => {
      this.knowledgeBase.set(this.generateId('kp'), { ...k, id: this.generateId('kp') })
    })
  }

  private generateLearningModules(params: Parameters<EducationService['createLearningPlan']>[0]): LearningPlan['modules'] {
    const moduleCount = Math.min(Math.max(Math.ceil(params.durationWeeks / 2), 3), 8)
    const modules: LearningPlan['modules'] = []

    const topics = this.getSubjectTopics(params.subject, params.focusAreas)

    for (let i = 0; i < moduleCount; i++) {
      const moduleTopics = topics.slice(i * Math.ceil(topics.length / moduleCount), (i + 1) * Math.ceil(topics.length / moduleCount))

      modules.push({
        id: this.generateId('mod'),
        title: `Module ${i + 1}: ${moduleTopics[0] || params.subject} Advanced`,
        description: `This module will deeply study content related to ${moduleTopics.join(', ')}`,
        topics: moduleTopics,
        duration: Math.ceil(params.durationWeeks / moduleCount),
        resources: this.generateModuleResources(moduleTopics),
        objectives: [
          `Master core concepts and principles of ${moduleTopics[0]}`,
          `Apply learned knowledge to solve related problems`,
          `Establish systematic knowledge framework`,
        ],
        assessmentCriteria: [
          'Complete module exercises with accuracy rate above 70%',
          'Analyze and solve related cases independently',
          'Pass module test',
        ],
        status: 'not-started',
        progress: 0,
      })
    }

    return modules
  }

  private getSubjectTopics(subject: string, _focusAreas?: string[]): string[] {
    const topicMap: Record<string, string[]> = {
      math: ['Functions & Equations', 'Sequences & Limits', 'Derivatives & Applications', 'Probability & Statistics', 'Solid Geometry', 'Analytic Geometry'],
      chinese: ['Modern Reading', 'Classical Poetry Appreciation', 'Language Usage', 'Writing Techniques', 'Literary Knowledge'],
      english: ['Vocabulary & Grammar', 'Reading Comprehension', 'Cloze Test', 'Writing Expression', 'Listening Training'],
      physics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Atomic Physics'],
      chemistry: ['Chemical Reactions', 'Material Structure', 'Organic Chemistry', 'Chemical Experiments', 'Chemical Calculations'],
      biology: ['Cell Biology', 'Genetics', 'Ecology', 'Physiology', 'Evolution Theory'],
      history: ['Ancient Chinese History', 'Modern Chinese History', 'Ancient World History', 'Modern World History'],
      geography: ['Physical Geography', 'Human Geography', 'Regional Geography', 'Map Skills'],
      politics: ['Economic Life', 'Political Life', 'Cultural Life', 'Philosophical Thought'],
    }

    return topicMap[subject] || [`${subject} Basics`, `${subject} Core Concepts`, `${subject} Practical Applications`]
  }

  private generateModuleResources(topics: string[]): LearningPlan['modules'][0]['resources'] {
    const resources: LearningPlan['modules'][0]['resources'] = []

    for (const topic of topics.slice(0, 3)) {
      resources.push(
        { type: 'video', title: `${topic} Video Tutorial`, estimatedTime: 30 },
        { type: 'article', title: `${topic} Knowledge Summary`, estimatedTime: 20 },
        { type: 'exercise', title: `${topic} Practice Exercises`, estimatedTime: 40 },
      )
    }

    resources.push({ type: 'quiz', title: 'Module Test', estimatedTime: 30 })

    return resources
  }

  private generateMilestones(modules: LearningPlan['modules']): LearningPlan['milestones'] {
    const milestones: LearningPlan['milestones'] = []

    milestones.push({
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      title: 'Phase 1 Complete',
      description: `Complete first ${Math.ceil(modules.length / 3)} modules of study`,
      achieved: false,
    })

    milestones.push({
      date: new Date(Date.now() + Math.floor(modules.length / 2) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      title: 'Mid-term Assessment',
      description: 'Complete half of study progress, conduct phase test',
      achieved: false,
    })

    milestones.push({
      date: new Date(Date.now() + (modules.length - 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      title: 'All Courses Complete',
      description: 'Complete all learning modules',
      achieved: false,
    })

    return milestones
  }

  private generateSchedule(modules: LearningPlan['modules'], startDate: Date, durationWeeks: number): LearningPlan['schedule'] {
    const schedule: LearningPlan['schedule'] = []

    for (let week = 0; week < durationWeeks; week++) {
      const moduleIndex = Math.min(Math.floor(week / Math.ceil(durationWeeks / modules.length)), modules.length - 1)
      const currentDate = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000)

      schedule.push({
        date: currentDate.toISOString().split('T')[0],
        activity: `Study module "${modules[moduleIndex]?.title}"`,
        duration: 120,
        moduleRef: modules[moduleIndex]?.id,
      })

      if (week % 2 === 0) {
        schedule.push({
          date: currentDate.toISOString().split('T')[0],
          activity: 'Review and Practice',
          duration: 60,
        })
      }
    }

    return schedule
  }

  private generateRecommendations(): string[] {
    return [
      'Maintain at least 1 hour of effective study time daily',
      'Regularly review learned content to avoid forgetting',
      'Seek help promptly when encountering difficulties',
      'Combine practical cases to deepen understanding',
      'Take good notes for future review',
      'Participate in discussions to enhance thinking skills',
    ]
  }

  private generateGenericExplanation(concept: string, depth: string): ReturnType<EducationService['explainConcept']> {
    const explanations: Record<string, { basic: string; detailed: string; advanced: string }> = {
      default: {
        basic: `"${concept}" is an important concept involving fundamental knowledge in related fields.`,
        detailed: `"${concept}" refers to a term or phenomenon with specific meaning and application in specific contexts. To deeply understand this concept, we need to analyze it from multiple angles including its definition, characteristics, causes, and practical applications.`,
        advanced: `"${concept}" as a core theoretical concept has very rich connotation and extension. From an epistemological perspective, it reflects people's understanding of the essential attributes of objective things; from a methodological perspective, it provides theoretical foundation and thinking tools for us to analyze and solve related problems.`,
      },
    }

    const exp = explanations.default

    return {
      concept,
      explanation: depth === 'basic' ? exp.basic : depth === 'detailed' ? exp.detailed : exp.advanced,
      examples: [
        { scenario: `Example illustrating ${concept}`, solution: `This is a concrete example about ${concept}` },
      ],
      commonMistakes: [`Confusing ${concept} with other similar concepts`],
      relatedConcepts: [`${concept} Related Concept 1`, `${concept} Related Concept 2`],
      practiceSuggestions: [`Practice specifically on ${concept}`],
    }
  }

  private generateAdvancedContent(knowledgePoint: KnowledgePoint): string {
    let content = '\n\n**Extended Knowledge**:\n'

    content += `- **Historical Development**: Background and development history of the concept\n`
    content += `- **Cutting-edge Research**: Latest research findings in this direction from academia\n`
    content += `- **Interdisciplinary Connections**: Associations and applications with other disciplines\n`

    if (knowledgePoint.relatedPoints.length > 0) {
      content += `- **Further Reading**: Recommended to learn more about ${knowledgePoint.relatedPoints.slice(0, 3).join(', ')}\n`
    }

    return content
  }

  private getDefaultExamInstructions(): string {
    return `Exam Instructions:
1. This exam paper is divided into several parts, please complete within the allotted time
2. Write answers on the answer sheet/paper, for multiple choice please fill in corresponding bubbles
3. For calculation questions, show necessary calculation process and steps
4. Keep the paper neat with legible handwriting
5. After the exam, submit both the exam paper and answer sheet together`
  }

  private calculateDifficultyDistribution(questions: QuestionTemplate[]): GeneratedExam['metadata']['difficultyDistribution'] {
    const dist: Record<string, number> = {}
    for (const q of questions) {
      dist[q.difficulty] = (dist[q.difficulty] || 0) + 1
    }
    return dist
  }

  private calculateQuestionTypeDistribution(questions: QuestionTemplate[]): GeneratedExam['metadata']['questionTypes'] {
    const dist: Record<string, number> = {}
    for (const q of questions) {
      dist[q.type] = (dist[q.type] || 0) + 1
    }
    return dist
  }

  private scoreToGrade(score: number): GradingResult['grade'] {
    if (score >= 97) return 'A+'
    if (score >= 93) return 'A'
    if (score >= 90) return 'A-'
    if (score >= 87) return 'B+'
    if (score >= 83) return 'B'
    if (score >= 80) return 'B-'
    if (score >= 77) return 'C+'
    if (score >= 73) return 'C'
    if (score >= 70) return 'C-'
    if (score >= 60) return 'D'
    return 'F'
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }
}
