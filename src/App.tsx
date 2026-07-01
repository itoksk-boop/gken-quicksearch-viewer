import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')

  const topCards = [1, 2, 3, 4]
  const listRows = [1, 2, 3]

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
            候補はここに表示
          </div>
        </div>

        <p className="status-line">CSV読み込み前</p>
      </header>

      <main className="main-content">
        <section className="top-cards" aria-label="上位4件">
          {topCards.map((n) => (
            <article className="question-card" key={n}>
              <div className="card-meta">
                <span className="card-category">分野：―</span>
                <span className="card-difficulty">難易度：―</span>
              </div>
              <p className="card-question">上位結果 {n}（問題文がここに入ります）</p>
              <ul className="card-choices">
                <li>A. ―</li>
                <li>B. ―</li>
                <li>C. ―</li>
                <li>D. ―</li>
              </ul>
              <p className="card-answer">正解：―</p>
              <p className="card-explanation">解説：ここに解説文が入ります。</p>
            </article>
          ))}
        </section>

        <section className="result-list" aria-label="5件目以降の結果">
          <ul>
            {listRows.map((n) => (
              <li className="result-list-item" key={n}>
                <span className="result-category">分野：―</span>
                <span className="result-difficulty">難易度：―</span>
                <span className="result-question">結果 {n + 4}（問題文の先頭）</span>
                <span className="result-answer">正解：―</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

export default App
