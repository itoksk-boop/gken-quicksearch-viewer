import Papa from 'papaparse'
import type { AnswerKey, GQuestion, QuestionMetadata } from '../types/question'

const LEGACY_REQUIRED_COLUMNS = [
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

const REBUILD_REQUIRED_COLUMNS = [
  'id',
  'question',
  'A',
  'B',
  'C',
  'D',
  'answer',
  'explanation',
] as const

const ANSWER_KEYS: AnswerKey[] = ['A', 'B', 'C', 'D']

type CsvRow = Record<string, string>
type CsvFormat = 'legacy' | 'rebuild'

function stripBom(header: string): string {
  return header.replace(/^﻿/, '')
}

function isAnswerKey(value: string): value is AnswerKey {
  return (ANSWER_KEYS as string[]).includes(value)
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function firstNonEmpty(...values: (string | undefined)[]): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

function detectCsvFormat(headers: string[]): CsvFormat {
  if (headers.includes('question')) return 'rebuild'
  if (headers.includes('問題')) return 'legacy'
  throw new Error(
    'CSV形式を判別できません（question または 問題 列が見つかりません）',
  )
}

function mapLegacyRow(
  row: CsvRow,
  sourceFile: string,
  rowNumber: number,
): GQuestion {
  for (const column of LEGACY_REQUIRED_COLUMNS) {
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

function mapRebuildRow(
  row: CsvRow,
  sourceFile: string,
  rowNumber: number,
): GQuestion {
  for (const column of REBUILD_REQUIRED_COLUMNS) {
    const value = row[column]
    if (value === undefined || value.trim() === '') {
      throw new Error(`${rowNumber}行目: 必須列「${column}」が空です`)
    }
  }

  const answer = row['answer'].trim()
  if (!isAnswerKey(answer)) {
    throw new Error(`${rowNumber}行目: answerの値が不正です（${answer}）`)
  }

  const metadata: QuestionMetadata = {
    questionType: emptyToUndefined(row['question_type']),
    set: emptyToUndefined(row['set']),
    phase: emptyToUndefined(row['phase']),
    sourceArea: emptyToUndefined(row['source_area']),
    cognitionAxis: emptyToUndefined(row['cognition_axis']),
    formatAxis: emptyToUndefined(row['format_axis']),
    recencyAxis: emptyToUndefined(row['recency_axis']),
    trickinessAxis: emptyToUndefined(row['trickiness_axis']),
    searchKeywords: emptyToUndefined(row['search_keywords']),
    trapPoint: emptyToUndefined(row['trap_point']),
    storyHint: emptyToUndefined(row['story_hint']),
    wrongReasons: {
      A: emptyToUndefined(row['wrong_A']),
      B: emptyToUndefined(row['wrong_B']),
      C: emptyToUndefined(row['wrong_C']),
      D: emptyToUndefined(row['wrong_D']),
    },
  }

  return {
    id: row['id'],
    category: firstNonEmpty(row['topic'], row['source_area']),
    difficulty: firstNonEmpty(row['trickiness_axis']),
    question: row['question'],
    choices: {
      A: row['A'],
      B: row['B'],
      C: row['C'],
      D: row['D'],
    },
    answer,
    explanation: row['explanation'],
    sourceFile,
    usedStatus: '',
    metadata,
  }
}

export function parseQuestionsCsvText(
  csvText: string,
  sourceFile: string,
): GQuestion[] {
  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: stripBom,
  })

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0].message)
  }

  const format = detectCsvFormat(parsed.meta.fields ?? [])
  const mapRow = format === 'rebuild' ? mapRebuildRow : mapLegacyRow

  const questions = parsed.data.map((row, index) =>
    mapRow(row, sourceFile, index + 2),
  )

  const seenIds = new Set<string>()
  for (const question of questions) {
    if (seenIds.has(question.id)) {
      throw new Error(`id「${question.id}」が重複しています`)
    }
    seenIds.add(question.id)
  }

  return questions
}

export async function loadQuestionsFromCsv(
  url: string,
  sourceFile: string,
): Promise<GQuestion[]> {
  const res = await fetch(url)
  const csvText = await res.text()
  return parseQuestionsCsvText(csvText, sourceFile)
}

export type CsvFileConfig = {
  url: string
  sourceFile: string
}

export async function loadAllQuestions(
  files: CsvFileConfig[],
): Promise<GQuestion[]> {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        return await loadQuestionsFromCsv(file.url, file.sourceFile)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        throw new Error(`${file.sourceFile}: ${message}`)
      }
    }),
  )

  return results.flat()
}
