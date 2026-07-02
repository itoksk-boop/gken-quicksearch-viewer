import Papa from 'papaparse'
import type { AnswerKey, GQuestion } from '../types/question'

const REQUIRED_COLUMNS = [
  'id',
  '分野',
  '難易度',
  '問題',
  'A',
  'B',
  'C',
  'D',
  '正解',
  '解説',
] as const

const ANSWER_KEYS: AnswerKey[] = ['A', 'B', 'C', 'D']

type CsvRow = Record<string, string>

function stripBom(header: string): string {
  return header.replace(/^\uFEFF/, '')
}

function isAnswerKey(value: string): value is AnswerKey {
  return (ANSWER_KEYS as string[]).includes(value)
}

function mapRow(row: CsvRow, sourceFile: string, rowNumber: number): GQuestion {
  for (const column of REQUIRED_COLUMNS) {
    const value = row[column]
    if (value === undefined || value.trim() === '') {
      throw new Error(`${rowNumber}行目: 必須列「${column}」が空です`)
    }
  }

  const answer = row['正解'].trim()
  if (!isAnswerKey(answer)) {
    throw new Error(`${rowNumber}行目: 正解の値が不正です（${answer}）`)
  }

  return {
    id: row['id'],
    category: row['分野'],
    difficulty: row['難易度'],
    question: row['問題'],
    choices: {
      A: row['A'],
      B: row['B'],
      C: row['C'],
      D: row['D'],
    },
    answer,
    explanation: row['解説'],
    sourceFile,
    usedStatus: row['出題済み'] ?? '',
  }
}

export async function loadQuestionsFromCsv(
  url: string,
  sourceFile: string,
): Promise<GQuestion[]> {
  const res = await fetch(url)
  const csvText = await res.text()

  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: stripBom,
  })

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0].message)
  }

  return parsed.data.map((row, index) => mapRow(row, sourceFile, index + 2))
}
