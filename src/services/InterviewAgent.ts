export interface InterviewConfig {
  apiKey?: string
  model?: string
  language?: 'zh' | 'en'
}

export interface InterviewSession {
  id: string
  role: string
  company?: string
  type: InterviewType
  difficulty: DifficultyLevel
  status: InterviewStatus
  questions: InterviewQuestion[]
  answers: InterviewAnswer[]
  currentQuestionIndex: number
  score?: InterviewScore
  feedback?: string
  startedAt: string
  endedAt?: string
}

export type InterviewType = 'behavioral' | 'technical' | 'case' | 'system-design' | 'hr' | 'comprehensive'
export type DifficultyLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'expert'
export type InterviewStatus = 'preparing' | 'in-progress' | 'paused' | 'completed' | 'evaluating'

export interface InterviewQuestion {
  id: number
  text: string
  category: string
  difficulty: DifficultyLevel
  hints?: string[]
  expectedPoints?: string[]
  timeLimitSeconds?: number
  followUpQuestions?: string[]
}

export interface InterviewAnswer {
  questionId: number
  content: string
  durationSeconds: number
  submittedAt: string
  score?: number
  feedback?: string
}

export interface InterviewScore {
  overall: number
  dimensions: {
    clarity: number
    depth: number
    structure: number
    relevance: number
    communication: number
  }
  breakdown: Array<{
    questionId: number
    score: number
    maxScore: number
    comment: string
  }>
}

export interface InterviewFeedback {
  strengths: string[]
  improvements: string[]
  specificSuggestions: string[]
  overallAssessment: string
  recommendedNextSteps: string[]
}

export class InterviewAgent {
  private config: InterviewConfig

  constructor(config: InterviewConfig = {}) {
    this.config = {
      model: 'glm-4-flash',
      language: 'zh',
      ...config,
    }
  }

  async createSession(options: {
    role: string
    company?: string
    type: InterviewType
    difficulty: DifficultyLevel
    questionCount?: number
  }): Promise<InterviewSession> {
    const { role, company, type, difficulty, questionCount = 5 } = options

    const questions = await this.generateQuestions(role, company, type, difficulty, questionCount)

    const session: InterviewSession = {
      id: `interview_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role,
      company,
      type,
      difficulty,
      status: 'preparing',
      questions,
      answers: [],
      currentQuestionIndex: 0,
      startedAt: new Date().toISOString(),
    }

    return session
  }

  async submitAnswer(session: InterviewSession, answerContent: string): Promise<{
    updatedSession: InterviewSession
    immediateFeedback?: string
  }> {
    const currentQuestion = session.questions[session.currentQuestionIndex]

    if (!currentQuestion) {
      throw new Error('没有当前问题')
    }

    const answer: InterviewAnswer = {
      questionId: currentQuestion.id,
      content: answerContent,
      durationSeconds: 0,
      submittedAt: new Date().toISOString(),
    }

    const immediateFeedback = await this.evaluateAnswerImmediate(currentQuestion, answerContent)

    answer.score = immediateFeedback.score
    answer.feedback = immediateFeedback.feedback

    const updatedAnswers = [...session.answers, answer]
    const nextIndex = session.currentQuestionIndex + 1
    const isComplete = nextIndex >= session.questions.length

    return {
      updatedSession: {
        ...session,
        answers: updatedAnswers,
        currentQuestionIndex: isComplete ? session.currentQuestionIndex : nextIndex,
        status: isComplete ? 'evaluating' : 'in-progress',
      },
      immediateFeedback: immediateFeedback.feedback,
    }
  }

  async evaluateSession(session: InterviewSession): Promise<InterviewSession> {
    if (session.answers.length === 0) {
      throw new Error('没有答案可以评估')
    }

    const score = await this.calculateOverallScore(session)
    const feedback = await this.generateComprehensiveFeedback(session)

    return {
      ...session,
      score,
      feedback: JSON.stringify(feedback, null, 2),
      status: 'completed',
      endedAt: new Date().toISOString(),
    }
  }

  async generateFollowUp(
    session: InterviewSession,
    lastAnswer: string
  ): Promise<string> {
    const currentQuestion = session.questions[session.currentQuestionIndex]

    if (!currentQuestion?.followUpQuestions || currentQuestion.followUpQuestions.length === 0) {
      const followUp = await this.callLLM(
        `Based on this interview context, generate ONE relevant follow-up question.\n\nRole: ${session.role}\nType: ${session.type}\nOriginal Question: ${currentQuestion.text}\nCandidate's Answer: ${lastAnswer.slice(0, 1000)}\n\nGenerate a follow-up question that probes deeper into their response. Output ONLY the question.`,
        'You are an expert interviewer. Generate insightful follow-up questions.'
      )

      return followUp.trim()
    }

    return currentQuestion.followUpQuestions[
      Math.floor(Math.random() * currentQuestion.followUpQuestions.length)
    ]
  }

  private async generateQuestions(
    role: string,
    company: string | undefined,
    type: InterviewType,
    difficulty: DifficultyLevel,
    count: number
  ): Promise<InterviewQuestion[]> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return this.getMockQuestions(role, type, difficulty, count)
    }

    const prompt = `Generate ${count} interview questions for:
- Role: ${role}
${company ? `- Company: ${company}` : ''}
- Type: ${type}
- Difficulty: ${difficulty}
- Language: ${this.config.language || 'zh'}

Output format (STRICT JSON array):
[
  {
    "text": "question text",
    "category": "category name",
    "hints": ["hint1", "hint2"],
    "expectedPoints": ["point1", "point2"],
    "followUpQuestions": ["follow-up1"]
  }
]

Rules:
- Questions should be realistic and commonly asked.
- Include behavioral, technical, and situational questions as appropriate.
- Each question should have clear evaluation criteria.
- Output ONLY valid JSON array.`

    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'glm-4-flash',
          messages: [
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      })

      const data: any = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) throw new Error('Empty response')

      const jsonMatch = content.match(/\[[\s\S]*\]/)

      if (!jsonMatch) throw new Error('No JSON found')

      const parsed: any[] = JSON.parse(jsonMatch[0])

      return parsed.map((q, i) => ({
        id: i + 1,
        text: q.text || '',
        category: q.category || type,
        difficulty,
        hints: q.hints || [],
        expectedPoints: q.expectedPoints || [],
        timeLimitSeconds: this.getTimeLimit(type),
        followUpQuestions: q.followUpQuestions || [],
      }))
    } catch (error) {
      console.error('[Interview] Question generation failed:', error)
      return this.getMockQuestions(role, type, difficulty, count)
    }
  }

  private async evaluateAnswerImmediate(question: InterviewQuestion, answer: string): Promise<{
    score: number
    feedback: string
  }> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return {
        score: Math.floor(60 + Math.random() * 30),
        feedback: '[Mock] 请配置 ZHIPU_API_KEY 以获取详细反馈。',
      }
    }

    const prompt = `Evaluate this interview answer:

Question: ${question.text}
Expected Points: ${(question.expectedPoints || []).join(', ')}

Candidate's Answer:
${answer.slice(0, 2000)}

Output format (STRICT JSON):
{
  "score": 75,
  "feedback": "detailed feedback here"
}

Score: 0-100 based on:
- Clarity and structure (20%)
- Depth of knowledge (25%)
- Relevance to question (25%)
- Communication quality (20%)
- Examples provided (10%)

Output ONLY valid JSON.`

    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'glm-4-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      })

      const data: any = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) throw new Error('Empty response')

      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (!jsonMatch) throw new Error('No JSON found')

      const parsed = JSON.parse(jsonMatch[0])

      return {
        score: Math.max(0, Math.min(100, parsed.score || 70)),
        feedback: parsed.feedback || 'Evaluation completed.',
      }
    } catch {
      return {
        score: 65,
        feedback: 'Unable to evaluate. Please check API configuration.',
      }
    }
  }

  private async calculateOverallScore(session: InterviewSession): Promise<InterviewScore> {
    const dimensionScores = {
      clarity: 0,
      depth: 0,
      structure: 0,
      relevance: 0,
      communication: 0,
    }

    const breakdown: InterviewScore['breakdown'] = []

    for (let i = 0; i < session.answers.length; i++) {
      const answer = session.answers[i]
      const baseScore = answer.score ?? 70

      breakdown.push({
        questionId: answer.questionId,
        score: baseScore,
        maxScore: 100,
        comment: answer.feedback || 'Evaluated',
      })

      dimensionScores.clarity += baseScore * 0.2
      dimensionScores.depth += baseScore * 0.25
      dimensionScores.structure += baseScore * 0.15
      dimensionScores.relevance += baseScore * 0.25
      dimensionScores.communication += baseScore * 0.15
    }

    const count = Math.max(session.answers.length, 1)

    return {
      overall: Math.round(breakdown.reduce((sum, b) => sum + b.score, 0) / count),
      dimensions: {
        clarity: Math.round(dimensionScores.clarity / count),
        depth: Math.round(dimensionScores.depth / count),
        structure: Math.round(dimensionScores.structure / count),
        relevance: Math.round(dimensionScores.relevance / count),
        communication: Math.round(dimensionScores.communication / count),
      },
      breakdown,
    }
  }

  private async generateComprehensiveFeedback(session: InterviewSession): Promise<InterviewFeedback> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return {
        strengths: ['回答结构清晰', '表达流畅'],
        improvements: ['可增加更多具体案例', '建议更深入分析问题'],
        specificSuggestions: ['使用 STAR 方法组织行为面试回答'],
        overallAssessment: '整体表现良好，有提升空间。',
        recommendedNextSteps: ['复习核心概念', '练习更多模拟面试'],
      }
    }

    const summary = session.answers.map((a, i) => {
      const q = session.questions.find(q => q.id === a.questionId)
      return `Q${i + 1}: ${q?.text || '?'}\nA: ${a.content.slice(0, 200)}... (Score: ${a.score})`
    }).join('\n\n')

    const prompt = `Provide comprehensive interview feedback for this session:

Role: ${session.role}
Type: ${session.type}
Difficulty: ${session.difficulty}
Overall Score: ${session.score?.overall || 'N/A'}

Interview Summary:
${summary}

Output format (STRICT JSON):
{
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"],
  "specificSuggestions": ["suggestion1"],
  "overallAssessment": "overall assessment",
  "recommendedNextSteps": ["step1"]
}

Be constructive, specific, and actionable.`

    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'glm-4-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 2048,
        }),
      })

      const data: any = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) throw new Error('Empty response')

      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      throw new Error('No JSON found')
    } catch {
      return {
        strengths: ['完成面试流程'],
        improvements: ['继续练习'],
        specificSuggestions: ['多做模拟面试'],
        overallAssessment: '感谢参与面试！',
        recommendedNextSteps: ['总结经验教训'],
      }
    }
  }

  private getMockQuestions(role: string, type: InterviewType, _difficulty: DifficultyLevel, count: number): InterviewQuestion[] {
    const questionBank: Record<string, string[]> = {
      behavioral: [
        '请介绍一次你解决复杂问题的经历',
        '描述一次你与团队成员发生分歧的情况，你是如何处理的？',
        '请分享一个你领导项目的经验',
        '你如何处理工作压力和紧迫的截止日期？',
        '请举例说明你是如何学习新技能的',
      ],
      technical: [
        `请解释你在${role}领域最擅长的技术栈`,
        '描述一个你认为设计良好的系统架构',
        '你是如何处理技术债务的？',
        '请解释 RESTful API 设计原则',
        '你如何保证代码质量？',
      ],
      case: [
        '如果让你优化一个慢查询，你会怎么做？',
        '如何设计一个高可用的系统？',
        '请分析这个业务场景并提出解决方案',
      ],
      hr: [
        '你为什么想加入我们公司？',
        '你的职业规划是什么？',
        '你最大的优点和缺点是什么？',
        '你期望的薪资范围是多少？',
      ],
      comprehensive: [
        '请做一个自我介绍',
        '你为什么适合这个职位？',
        '你对未来有什么规划？',
      ],
    }

    const questions = questionBank[type] || questionBank.comprehensive || []

    return questions.slice(0, count).map((text, i) => ({
      id: i + 1,
      text,
      category: type,
      difficulty: _difficulty,
      hints: ['可以从具体经历入手', '使用 STAR 方法组织答案'],
      expectedPoints: ['清晰表达', '提供实例'],
      timeLimitSeconds: this.getTimeLimit(type),
      followUpQuestions: [],
    }))
  }

  private getTimeLimit(type: InterviewType): number {
    switch (type) {
      case 'technical': return 300
      case 'case': return 600
      case 'system-design': return 900
      default: return 180
    }
  }

  private async callLLM(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return `[Mock Response] Please configure ZHIPU_API_KEY for real responses.`
    }

    const messages: Array<{ role: string; content: string }> = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push({ role: 'user', content: prompt })

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'glm-4-flash',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    const data: any = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }
}
