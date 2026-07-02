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
