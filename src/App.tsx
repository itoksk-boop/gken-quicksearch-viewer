import { useEffect, useState, type ReactNode } from 'react'
import './App.css'
import type { AnswerKey, GQuestion } from './types/question'
import {
  loadAllQuestions,
  type CsvFileConfig,
} from './utils/loadQuestionsFromCsv'

const CSV_FILE_NAMES = [
  'G検定_4択問題ファイル1_100問.csv',
  'G検定_4択問題ファイル2_100問.csv',
  'G検定_4択問題ファイル3_100問.csv',
  'G検定_4択問題ファイル4_100問.csv',
  'G検定_4択問題ファイル5_100問.csv',
  'G検定_4択問題ファイル6_100問.csv',
  'G検定_4択問題ファイル7_100問.csv',
  'G検定_4択問題ファイル8_100問.csv',
  'G検定_4択問題ファイル9_100問.csv',
  'G検定_4択問題ファイル10_100問.csv',
]

const CSV_FILES: CsvFileConfig[] = CSV_FILE_NAMES.map((sourceFile) => ({
  url: `/data/${sourceFile}`,
  sourceFile,
}))

const ANSWER_KEYS: AnswerKey[] = ['A', 'B', 'C', 'D']
const TOP_RESULT_COUNT = 6

function matchesQuery(q: GQuestion, needle: string): boolean {
  const haystacks = [
    q.category,
    q.difficulty,
    q.question,
    q.choices.A,
    q.choices.B,
    q.choices.C,
    q.choices.D,
    q.answer,
    q.explanation,
  ]
  return haystacks.some((text) => text.toLowerCase().includes(needle))
}

function getSearchTokens(rawQuery: string): string[] {
  return rawQuery
    .trim()
    .split(/\s+/)
    .filter((token) => token.length >= 2)
    .map((token) => token.toLowerCase())
}

const CARD_LONG_THRESHOLD = 350
const CARD_VERY_LONG_THRESHOLD = 600

function getCardLengthClass(q: GQuestion): string {
  const totalLength =
    q.question.length +
    q.choices.A.length +
    q.choices.B.length +
    q.choices.C.length +
    q.choices.D.length +
    q.explanation.length

  if (totalLength >= CARD_VERY_LONG_THRESHOLD) return 'card--very-long'
  if (totalLength >= CARD_LONG_THRESHOLD) return 'card--long'
  return ''
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text: string, tokens: string[]): ReactNode {
  if (tokens.length === 0) return text

  const pattern = tokens
    .map(escapeRegExp)
    .sort((a, b) => b.length - a.length)
    .join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark className="search-highlight" key={index}>
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [questions, setQuestions] = useState<GQuestion[]>([])
  const [csvStatus, setCsvStatus] = useState('CSV未読み込み')

  useEffect(() => {
    setCsvStatus('CSV読み込み中')

    loadAllQuestions(CSV_FILES)
      .then((loaded) => {
        setQuestions(loaded)
        setCsvStatus(
          `CSV読み込み成功：${CSV_FILES.length}ファイル / ${loaded.length}問`,
        )
      })
      .catch((err: Error) => {
        setCsvStatus(`CSV読み込み失敗：${err.message}`)
      })
  }, [])

  const trimmedQuery = query.trim()
  const isSearchActive = trimmedQuery.length >= 2
  const searchTokens = isSearchActive ? getSearchTokens(trimmedQuery) : []

  const filtered = isSearchActive
    ? searchTokens.length === 0
      ? []
      : questions.filter((q) =>
          searchTokens.every((token) => matchesQuery(q, token)),
        )
    : questions

  const topResults = filtered.slice(0, TOP_RESULT_COUNT)
  const rest = filtered.slice(TOP_RESULT_COUNT)

  const statusText = !isSearchActive
    ? '検索対象データ表示中 / 2文字以上で検索'
    : filtered.length === 0
      ? '該当なし'
      : `検索結果 ${filtered.length}件`

  const suggestionText = isSearchActive
    ? '候補表示は次フェーズで実装'
    : '候補はここに表示'

  return (
    <div className="app-shell">
      <header className="search-header">
        <div className="header-titles">
          <h1 className="app-title">G検定クイック検索ビューアー</h1>
          <p className="app-subtitle">
            2文字以上で即時検索。上位6件を同時比較。
          </p>
        </div>

        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="用語・問題文・解説を検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="search-suggestion" aria-hidden="true">
            {suggestionText}
          </div>
        </div>

        <p className="status-line">{statusText}</p>
        <p className="csv-status">{csvStatus}</p>
      </header>

      <main className="main-content">
        {isSearchActive && filtered.length === 0 ? (
          <p className="no-result">該当なし</p>
        ) : (
          <>
            <section className="top-cards" aria-label="上位6件">
              {topResults.map((q) => (
                <article
                  className={`question-card ${getCardLengthClass(q)}`.trim()}
                  key={q.id}
                >
                  <div className="card-meta">
                    <span className="card-category">
                      分野：{highlightText(q.category, searchTokens)}
                    </span>
                    <span className="card-difficulty">
                      難易度：{highlightText(q.difficulty, searchTokens)}
                    </span>
                  </div>
                  <p className="card-question">
                    {highlightText(q.question, searchTokens)}
                  </p>
                  <ul className="card-choices">
                    {ANSWER_KEYS.map((key) => (
                      <li
                        key={key}
                        className={
                          key === q.answer
                            ? 'card-choice is-answer'
                            : 'card-choice'
                        }
                      >
                        {key}. {highlightText(q.choices[key], searchTokens)}
                      </li>
                    ))}
                  </ul>
                  <p className="card-answer">正解：{q.answer}</p>
                  <p className="card-explanation">
                    解説：{highlightText(q.explanation, searchTokens)}
                  </p>
                </article>
              ))}
            </section>

            <section className="result-list" aria-label="7件目以降の結果">
              <ul>
                {rest.map((q) => (
                  <li className="result-list-item" key={q.id}>
                    <span className="result-category">
                      分野：{highlightText(q.category, searchTokens)}
                    </span>
                    <span className="result-difficulty">
                      難易度：{highlightText(q.difficulty, searchTokens)}
                    </span>
                    <span className="result-question">
                      {highlightText(q.question, searchTokens)}
                    </span>
                    <span className="result-answer">
                      正解{q.answer}：
                      {highlightText(q.choices[q.answer], searchTokens)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default App
