import { useEffect, useState } from 'react'
import './App.css'
import type { AnswerKey, GQuestion } from './types/question'
import { loadQuestionsFromCsv } from './utils/loadQuestionsFromCsv'

const CSV_SOURCE_FILE = 'G検定_4択問題ファイル1_100問.csv'
const CSV_URL = `/data/${CSV_SOURCE_FILE}`

const ANSWER_KEYS: AnswerKey[] = ['A', 'B', 'C', 'D']

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

function App() {
  const [query, setQuery] = useState('')
  const [questions, setQuestions] = useState<GQuestion[]>([])
  const [csvStatus, setCsvStatus] = useState('CSV未読み込み')

  useEffect(() => {
    setCsvStatus('CSV読み込み中')

    loadQuestionsFromCsv(CSV_URL, CSV_SOURCE_FILE)
      .then((loaded) => {
        setQuestions(loaded)
        setCsvStatus(`CSV読み込み成功：${loaded.length}問`)
      })
      .catch((err: Error) => {
        setCsvStatus(`CSV読み込み失敗：${err.message}`)
      })
  }, [])

  const trimmedQuery = query.trim()
  const isSearchActive = trimmedQuery.length >= 2

  const filtered = isSearchActive
    ? questions.filter((q) => matchesQuery(q, trimmedQuery.toLowerCase()))
    : questions

  const topFour = filtered.slice(0, 4)
  const rest = filtered.slice(4)

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
            2文字以上で即時検索。上位4件を同時比較。
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
            <section className="top-cards" aria-label="上位4件">
              {topFour.map((q) => (
                <article className="question-card" key={q.id}>
                  <div className="card-meta">
                    <span className="card-category">分野：{q.category}</span>
                    <span className="card-difficulty">
                      難易度：{q.difficulty}
                    </span>
                  </div>
                  <p className="card-question">{q.question}</p>
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
                        {key}. {q.choices[key]}
                      </li>
                    ))}
                  </ul>
                  <p className="card-answer">正解：{q.answer}</p>
                  <p className="card-explanation">解説：{q.explanation}</p>
                </article>
              ))}
            </section>

            <section className="result-list" aria-label="5件目以降の結果">
              <ul>
                {rest.map((q) => (
                  <li className="result-list-item" key={q.id}>
                    <span className="result-category">
                      分野：{q.category}
                    </span>
                    <span className="result-difficulty">
                      難易度：{q.difficulty}
                    </span>
                    <span className="result-question">{q.question}</span>
                    <span className="result-answer">正解：{q.answer}</span>
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
