import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import './App.css'
import type { AnswerKey, GQuestion, ProblemSet } from './types/question'
import {
  loadAllQuestions,
  parseQuestionsCsvText,
  type CsvFileConfig,
} from './utils/loadQuestionsFromCsv'
import {
  getAllStoredProblemSets,
  saveProblemSet,
} from './utils/problemSetStorage'

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

const SCORE_WEIGHTS = {
  question: 10,
  answerChoiceText: 8,
  explanation: 5,
  anyChoice: 4,
  category: 3,
  difficulty: 1,
  answer: 1,
}

function includesToken(text: string, token: string): boolean {
  return text.toLowerCase().includes(token)
}

function scoreQuestionForToken(q: GQuestion, token: string): number {
  let score = 0

  if (includesToken(q.question, token)) score += SCORE_WEIGHTS.question
  if (includesToken(q.choices[q.answer], token)) {
    score += SCORE_WEIGHTS.answerChoiceText
  }
  if (includesToken(q.explanation, token)) score += SCORE_WEIGHTS.explanation
  if (ANSWER_KEYS.some((key) => includesToken(q.choices[key], token))) {
    score += SCORE_WEIGHTS.anyChoice
  }
  if (includesToken(q.category, token)) score += SCORE_WEIGHTS.category
  if (includesToken(q.difficulty, token)) score += SCORE_WEIGHTS.difficulty
  if (includesToken(q.answer, token)) score += SCORE_WEIGHTS.answer

  return score
}

function scoreQuestion(q: GQuestion, tokens: string[]): number {
  return tokens.reduce((total, token) => total + scoreQuestionForToken(q, token), 0)
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

const KNOWN_TERMS = [
  '教師あり学習',
  '教師なし学習',
  '強化学習',
  '正解ラベル',
  '過学習',
  '汎化性能',
  'CNN',
  'RNN',
  'LSTM',
  'Transformer',
  'Attention',
  'RAG',
  'ファインチューニング',
  'プロンプト',
  'ハルシネーション',
  '著作権',
  '個人情報',
  '生成AI',
  '生成モデル',
  'GAN',
  'VAE',
  'ReLU',
  'シグモイド関数',
  'ソフトマックス関数',
  '勾配降下法',
  '誤差逆伝播法',
]

const SUGGESTION_LIMIT = 8

function getLastToken(rawQuery: string): string {
  const match = rawQuery.match(/(\S+)$/)
  return match ? match[1] : ''
}

function getSuggestions(token: string, vocabulary: string[]): string[] {
  const lowerToken = token.toLowerCase()
  return vocabulary
    .filter((term) => term.toLowerCase().startsWith(lowerToken))
    .slice(0, SUGGESTION_LIMIT)
}

function applySuggestion(rawQuery: string, suggestion: string): string {
  const match = rawQuery.match(/^(.*\s)?\S*$/)
  const prefix = match?.[1] ?? ''
  return prefix + suggestion
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

type CsvValidationResult =
  | { status: 'idle' }
  | { status: 'success'; fileName: string; count: number }
  | { status: 'error'; fileName: string; message: string }

function App() {
  const [query, setQuery] = useState('')
  const [questions, setQuestions] = useState<GQuestion[]>([])
  const [csvStatus, setCsvStatus] = useState('CSV未読み込み')
  const [csvValidation, setCsvValidation] = useState<CsvValidationResult>({
    status: 'idle',
  })
  const [importedQuestions, setImportedQuestions] = useState<GQuestion[]>([])
  const [importedProblemSets, setImportedProblemSets] = useState<
    ProblemSet[]
  >([])
  const [savedImportedIds, setSavedImportedIds] = useState<Set<string>>(
    new Set(),
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    getAllStoredProblemSets()
      .then((stored) => {
        if (stored.length === 0) return

        setImportedQuestions(stored.flatMap((entry) => entry.questions))
        setImportedProblemSets(stored.map((entry) => entry.problemSet))
        setSavedImportedIds(
          new Set(stored.map((entry) => entry.problemSet.id)),
        )
      })
      .catch((err: Error) => {
        setRestoreError(err.message)
      })
  }, [])

  const allSearchQuestions = [...questions, ...importedQuestions]

  const vocabulary = useMemo(() => {
    const categories = allSearchQuestions.map((q) => q.category)
    return Array.from(new Set([...categories, ...KNOWN_TERMS]))
  }, [questions, importedQuestions])

  const builtInProblemSet: ProblemSet = {
    id: 'built-in-gkentei-1000',
    name: 'G検定 標準1000問',
    sourceType: 'built-in',
    enabled: true,
    questionCount: questions.length,
    createdAt: 'built-in',
  }

  const searchPoolSummary =
    importedQuestions.length > 0
      ? `検索対象：標準${questions.length}問 + 追加${importedQuestions.length}問 = ${allSearchQuestions.length}問`
      : `検索対象：標準${questions.length}問`

  const handleImportFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const csvText = await file.text()
      const parsedQuestions = parseQuestionsCsvText(csvText, file.name)
      setCsvValidation({
        status: 'success',
        fileName: file.name,
        count: parsedQuestions.length,
      })
      setImportedQuestions(parsedQuestions)
      setImportedProblemSets([
        {
          id: `imported-${file.name}-${Date.now()}`,
          name: file.name,
          sourceType: 'imported',
          enabled: true,
          questionCount: parsedQuestions.length,
          createdAt: new Date().toISOString(),
        },
      ])
      setSavedImportedIds(new Set())
      setSaveError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setCsvValidation({ status: 'error', fileName: file.name, message })
    }
  }

  const handleClearImported = () => {
    setImportedQuestions([])
    setImportedProblemSets([])
    setCsvValidation({ status: 'idle' })
    setSavedImportedIds(new Set())
    setSaveError(null)
  }

  const handleSaveImported = async (set: ProblemSet) => {
    setSaveError(null)
    try {
      await saveProblemSet(set, importedQuestions)
      setSavedImportedIds((prev) => new Set(prev).add(set.id))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setSaveError(message)
    }
  }

  const trimmedQuery = query.trim()
  const isSearchActive = trimmedQuery.length >= 2
  const searchTokens = isSearchActive ? getSearchTokens(trimmedQuery) : []

  const lastToken = getLastToken(query)
  const suggestions =
    lastToken.length > 0 ? getSuggestions(lastToken, vocabulary) : []

  const handleSuggestionClick = (suggestion: string) => {
    setQuery((prev) => applySuggestion(prev, suggestion))
    searchInputRef.current?.focus()
  }

  const filtered = isSearchActive
    ? searchTokens.length === 0
      ? []
      : allSearchQuestions
          .filter((q) =>
            searchTokens.every((token) => matchesQuery(q, token)),
          )
          .map((q, index) => ({ q, index, score: scoreQuestion(q, searchTokens) }))
          .sort((a, b) => b.score - a.score || a.index - b.index)
          .map((entry) => entry.q)
    : allSearchQuestions

  const topResults = filtered.slice(0, TOP_RESULT_COUNT)
  const rest = filtered.slice(TOP_RESULT_COUNT)

  const statusText = !isSearchActive
    ? '検索対象データ表示中 / 2文字以上で検索'
    : filtered.length === 0
      ? '該当なし'
      : `検索結果 ${filtered.length}件`

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
            ref={searchInputRef}
          />
          {suggestions.length > 0 && (
            <div className="suggestion-chips" role="list">
              {suggestions.map((term) => (
                <button
                  type="button"
                  className="suggestion-chip"
                  key={term}
                  role="listitem"
                  onClick={() => handleSuggestionClick(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          )}
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
                  key={`${q.sourceFile}-${q.id}`}
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
                  <li
                    className="result-list-item"
                    key={`${q.sourceFile}-${q.id}`}
                  >
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

      <details className="data-management">
        <summary className="data-management-summary">データ管理</summary>
        <div className="data-management-body">
          <p className="data-management-search-pool">{searchPoolSummary}</p>

          <p className="data-management-heading">問題セット</p>
          <dl className="data-management-list">
            <div className="data-management-row">
              <dt>名称</dt>
              <dd>{builtInProblemSet.name}</dd>
            </div>
            <div className="data-management-row">
              <dt>種別</dt>
              <dd>
                {builtInProblemSet.sourceType === 'built-in'
                  ? '標準データ'
                  : '追加データ'}
              </dd>
            </div>
            <div className="data-management-row">
              <dt>状態</dt>
              <dd>{builtInProblemSet.enabled ? '有効' : '無効'}</dd>
            </div>
            <div className="data-management-row">
              <dt>件数</dt>
              <dd>{builtInProblemSet.questionCount}問</dd>
            </div>
            <div className="data-management-row">
              <dt>読み込み元</dt>
              <dd>標準CSV {CSV_FILES.length}ファイル</dd>
            </div>
          </dl>

          <p className="data-management-heading">追加データ</p>
          {restoreError && (
            <p className="data-management-error">復元エラー：{restoreError}</p>
          )}
          {importedProblemSets.length === 0 ? (
            <p className="data-management-empty">まだありません</p>
          ) : (
            importedProblemSets.map((set) => {
              const isSaved = savedImportedIds.has(set.id)
              return (
                <div className="data-management-set" key={set.id}>
                  <dl className="data-management-list">
                    <div className="data-management-row">
                      <dt>名称</dt>
                      <dd>{set.name}</dd>
                    </div>
                    <div className="data-management-row">
                      <dt>種別</dt>
                      <dd>{isSaved ? '保存済み追加' : '一時追加'}</dd>
                    </div>
                    <div className="data-management-row">
                      <dt>状態</dt>
                      <dd>{set.enabled ? '有効' : '無効'}</dd>
                    </div>
                    <div className="data-management-row">
                      <dt>件数</dt>
                      <dd>{set.questionCount}問</dd>
                    </div>
                    <div className="data-management-row">
                      <dt>保存状態</dt>
                      <dd>{isSaved ? '保存済み' : '未保存'}</dd>
                    </div>
                    {isSaved && (
                      <div className="data-management-row">
                        <dt>保存先</dt>
                        <dd>このブラウザ内</dd>
                      </div>
                    )}
                    <div className="data-management-row">
                      <dt>検索反映</dt>
                      <dd>反映中</dd>
                    </div>
                  </dl>
                  {!isSaved && (
                    <button
                      type="button"
                      className="data-management-button"
                      onClick={() => handleSaveImported(set)}
                    >
                      このCSVを保存
                    </button>
                  )}
                </div>
              )
            })
          )}
          {saveError && (
            <p className="data-management-error">保存エラー：{saveError}</p>
          )}
          {importedProblemSets.length > 0 && (
            <button
              type="button"
              className="data-management-button"
              onClick={handleClearImported}
            >
              一時追加を解除
            </button>
          )}
          {importedProblemSets.some((set) => savedImportedIds.has(set.id)) && (
            <p className="data-management-note">
              保存先：このブラウザ内
              <br />
              ※ 別端末とは同期されません。次フェーズで、再読み込み後の復元に対応します。
            </p>
          )}

          <p className="data-management-heading">直近のCSV検証結果</p>
          {csvValidation.status === 'idle' && (
            <p className="data-management-empty">まだ検証していません</p>
          )}
          {csvValidation.status === 'success' && (
            <dl className="data-management-list">
              <div className="data-management-row">
                <dt>ファイル名</dt>
                <dd>{csvValidation.fileName}</dd>
              </div>
              <div className="data-management-row">
                <dt>結果</dt>
                <dd>検証OK</dd>
              </div>
              <div className="data-management-row">
                <dt>読み込み可能件数</dt>
                <dd>{csvValidation.count}問</dd>
              </div>
              <div className="data-management-row">
                <dt>保存状態</dt>
                <dd>未保存</dd>
              </div>
              <div className="data-management-row">
                <dt>検索反映</dt>
                <dd>反映中</dd>
              </div>
            </dl>
          )}
          {csvValidation.status === 'error' && (
            <dl className="data-management-list">
              <div className="data-management-row">
                <dt>ファイル名</dt>
                <dd>{csvValidation.fileName}</dd>
              </div>
              <div className="data-management-row">
                <dt>結果</dt>
                <dd>検証エラー</dd>
              </div>
              <div className="data-management-row">
                <dt>内容</dt>
                <dd>{csvValidation.message}</dd>
              </div>
            </dl>
          )}
          <p className="data-management-note">
            ※
            追加したCSVは保存されません。ページを再読み込みすると一時追加は消えます。
          </p>

          <div className="data-management-actions">
            <label className="data-management-button data-management-file-label">
              CSVを追加
              <input
                type="file"
                accept=".csv,text/csv"
                className="data-management-file-input"
                onChange={handleImportFileChange}
              />
            </label>
            <button type="button" className="data-management-button" disabled>
              データセット管理
            </button>
          </div>
        </div>
      </details>
    </div>
  )
}

export default App
