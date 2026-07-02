export type AnswerKey = 'A' | 'B' | 'C' | 'D'

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
