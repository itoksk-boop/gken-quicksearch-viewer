export type AnswerKey = 'A' | 'B' | 'C' | 'D'

export type QuestionMetadata = {
  questionType?: string
  set?: string
  phase?: string
  sourceArea?: string
  cognitionAxis?: string
  formatAxis?: string
  recencyAxis?: string
  trickinessAxis?: string
  searchKeywords?: string
  trapPoint?: string
  storyHint?: string
  wrongReasons?: Partial<Record<AnswerKey, string>>
}

export type GQuestion = {
  id: string
  category: string
  difficulty: string
  question: string
  choices: Record<AnswerKey, string>
  answer: AnswerKey
  explanation: string
  sourceFile: string
  usedStatus: string
  metadata?: QuestionMetadata
}

export type ProblemSetSourceType = 'built-in' | 'imported'

export type ProblemSet = {
  id: string
  name: string
  sourceType: ProblemSetSourceType
  enabled: boolean
  questionCount: number
  createdAt: string
}

export type StoredProblemSet = {
  problemSet: ProblemSet
  questions: GQuestion[]
}
