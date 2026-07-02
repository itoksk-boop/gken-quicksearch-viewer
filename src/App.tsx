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
  deleteProblemSet,
  getAllStoredProblemSets,
  saveProblemSet,
} from './utils/problemSetStorage'

const CSV_FILE_NAMES = [
  'G検定_最強捻り3000問_Rebuild_Set01_100問.csv',
  'G検定_最強捻り3000問_Rebuild_Set02_100問.csv',
  'G検定_最強捻り3000問_Rebuild_Set03_100問.csv',
  'G検定_最強捻り3000問_Rebuild_Set04_100問.csv',
  'G検定_最強捻り3000問_Rebuild_Set05_100問.csv',
  'G検定_最強捻り3000問_Rebuild_Set06_100問.csv',
  'G検定_最強捻り3000問_Rebuild_Set07_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set08_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set09_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set10_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set11_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set12_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set13_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set14_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set15_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set16_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set17_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set18_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set19_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set20_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set21_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set22_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set23_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set24_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set25_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set26_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set27_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set28_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set29_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set30_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set31_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set32_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set33_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set34_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set35_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set36_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set37_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set38_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set39_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set40_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set41_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set42_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set43_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set44_50問.csv',
  'G検定_最強捻り3000問_Rebuild_Set45_50問.csv',
  'G検定_FinalBoost_Set01_200問_穴埋め_作り直し.csv',
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
    q.metadata?.searchKeywords ?? '',
    q.metadata?.trapPoint ?? '',
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
  searchKeywords: 3,
  trapPoint: 2,
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
  if (includesToken(q.metadata?.searchKeywords ?? '', token)) {
    score += SCORE_WEIGHTS.searchKeywords
  }
  if (includesToken(q.metadata?.trapPoint ?? '', token)) {
    score += SCORE_WEIGHTS.trapPoint
  }

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

function formatRegisteredAt(set: ProblemSet): string {
  if (set.sourceType === 'built-in') return '初期収録'

  const date = new Date(set.createdAt)
  if (Number.isNaN(date.getTime())) return set.createdAt

  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function splitSearchKeywords(value: string): string[] {
  const terms = value
    .split(/[,、;；\s]+/)
    .map((term) => term.trim())
    .filter(Boolean)
  return Array.from(new Set(terms))
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function getSelectedImportedProblemSets(
  importedProblemSets: ProblemSet[],
  selectedIds: Set<string>,
): ProblemSet[] {
  return importedProblemSets.filter((set) => selectedIds.has(set.id))
}

function hasDetailContent(q: GQuestion): boolean {
  const metadata = q.metadata
  if (!metadata) return false
  const hasWrongReasons = ANSWER_KEYS.some(
    (key) => metadata.wrongReasons?.[key],
  )
  return Boolean(metadata.trapPoint || metadata.storyHint || hasWrongReasons)
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
  const [csvStatus, setCsvStatus] = useState('標準データ未読み込み')
  const [csvValidation, setCsvValidation] = useState<CsvValidationResult>({
    status: 'idle',
  })
  const [importedProblemSets, setImportedProblemSets] = useState<
    ProblemSet[]
  >([])
  const [importedQuestionsBySetId, setImportedQuestionsBySetId] = useState<
    Record<string, GQuestion[]>
  >({})
  const [savedImportedIds, setSavedImportedIds] = useState<Set<string>>(
    new Set(),
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [openDetailKeys, setOpenDetailKeys] = useState<Set<string>>(new Set())
  const [isDataPanelOpen, setIsDataPanelOpen] = useState(false)
  const [selectedForMergeIds, setSelectedForMergeIds] = useState<Set<string>>(
    new Set(),
  )
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCsvStatus('標準データ読み込み中')

    loadAllQuestions(CSV_FILES)
      .then((loaded) => {
        setQuestions(loaded)
        setCsvStatus(
          `標準データ読み込み成功：${CSV_FILES.length}ファイル / ${loaded.length}問`,
        )
      })
      .catch((err: Error) => {
        setCsvStatus(`標準データ読み込み失敗：${err.message}`)
      })
  }, [])

  useEffect(() => {
    getAllStoredProblemSets()
      .then((stored) => {
        if (stored.length === 0) return

        const restoredSets = stored.map((entry) => ({
          ...entry.problemSet,
          enabled: entry.problemSet.enabled ?? true,
        }))

        setImportedProblemSets(restoredSets)
        setImportedQuestionsBySetId(
          Object.fromEntries(
            stored.map((entry) => [entry.problemSet.id, entry.questions]),
          ),
        )
        setSavedImportedIds(new Set(restoredSets.map((set) => set.id)))
      })
      .catch((err: Error) => {
        setRestoreError(err.message)
      })
  }, [])

  const enabledImportedQuestions = importedProblemSets
    .filter((set) => set.enabled)
    .flatMap((set) => importedQuestionsBySetId[set.id] ?? [])

  const allSearchQuestions = [...questions, ...enabledImportedQuestions]

  const vocabulary = useMemo(() => {
    const categories = allSearchQuestions.map((q) => q.category)
    const keywordTerms = allSearchQuestions.flatMap((q) =>
      q.metadata?.searchKeywords
        ? splitSearchKeywords(q.metadata.searchKeywords)
        : [],
    )
    return Array.from(new Set([...categories, ...keywordTerms, ...KNOWN_TERMS]))
  }, [questions, importedProblemSets, importedQuestionsBySetId])

  const builtInProblemSet: ProblemSet = {
    id: 'built-in-gkentei-rebuild',
    name: `G検定 新盤${questions.length}問`,
    sourceType: 'built-in',
    enabled: true,
    questionCount: questions.length,
    createdAt: 'built-in',
  }

  const allDisplayedSets: ProblemSet[] = [
    builtInProblemSet,
    ...importedProblemSets,
  ]

  const searchPoolSummary = `検索対象：標準${questions.length}問＋追加${enabledImportedQuestions.length}問＝${allSearchQuestions.length}問`

  const latestUnsavedSet = importedProblemSets.find(
    (set) => !savedImportedIds.has(set.id),
  )

  const handleImportFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const csvText = await file.text()
      const parsedQuestions = parseQuestionsCsvText(csvText, file.name)
      const newSet: ProblemSet = {
        id: `imported-${file.name}-${Date.now()}`,
        name: file.name,
        sourceType: 'imported',
        enabled: true,
        questionCount: parsedQuestions.length,
        createdAt: new Date().toISOString(),
      }

      setCsvValidation({
        status: 'success',
        fileName: file.name,
        count: parsedQuestions.length,
      })
      setImportedProblemSets((prev) => [
        ...prev.filter((set) => savedImportedIds.has(set.id)),
        newSet,
      ])
      setImportedQuestionsBySetId((prev) => {
        const kept: Record<string, GQuestion[]> = {}
        for (const id of Object.keys(prev)) {
          if (savedImportedIds.has(id)) kept[id] = prev[id]
        }
        kept[newSet.id] = parsedQuestions
        return kept
      })
      setSaveError(null)
    } catch (err) {
      const message = toErrorMessage(err)
      setCsvValidation({ status: 'error', fileName: file.name, message })
    }
  }

  const handleSaveImported = async (set: ProblemSet) => {
    setSaveError(null)
    try {
      const setQuestions = importedQuestionsBySetId[set.id] ?? []
      await saveProblemSet(set, setQuestions)
      setSavedImportedIds((prev) => new Set(prev).add(set.id))
    } catch (err) {
      const message = toErrorMessage(err)
      setSaveError(message)
    }
  }

  const handleToggleEnabled = async (set: ProblemSet) => {
    const updatedSet: ProblemSet = { ...set, enabled: !set.enabled }

    setImportedProblemSets((prev) =>
      prev.map((s) => (s.id === set.id ? updatedSet : s)),
    )

    if (savedImportedIds.has(set.id)) {
      try {
        const setQuestions = importedQuestionsBySetId[set.id] ?? []
        await saveProblemSet(updatedSet, setQuestions)
      } catch (err) {
        const message = toErrorMessage(err)
        setSaveError(message)
      }
    }
  }

  const handleDeleteSelected = async () => {
    const selectedSets = getSelectedImportedProblemSets(
      importedProblemSets,
      selectedForMergeIds,
    )
    if (selectedSets.length === 0) return

    const confirmed = window.confirm(
      `選択した${selectedSets.length}件のデータを削除します。保存済みの場合、このブラウザ内の保存データも削除されます。よろしいですか？`,
    )
    if (!confirmed) return

    setDeleteError(null)
    const succeededIds: string[] = []
    let lastErrorMessage: string | null = null

    for (const set of selectedSets) {
      if (savedImportedIds.has(set.id)) {
        try {
          await deleteProblemSet(set.id)
        } catch (err) {
          lastErrorMessage = toErrorMessage(err)
          continue
        }
      }
      succeededIds.push(set.id)
    }

    if (lastErrorMessage) setDeleteError(lastErrorMessage)

    const succeededIdSet = new Set(succeededIds)
    setImportedProblemSets((prev) =>
      prev.filter((s) => !succeededIdSet.has(s.id)),
    )
    setImportedQuestionsBySetId((prev) => {
      const next = { ...prev }
      for (const id of succeededIds) delete next[id]
      return next
    })
    setSavedImportedIds((prev) => {
      const next = new Set(prev)
      for (const id of succeededIds) next.delete(id)
      return next
    })
    setSelectedForMergeIds((prev) => {
      const next = new Set(prev)
      for (const id of succeededIds) next.delete(id)
      return next
    })
  }

  const handleToggleSelectForMerge = (setId: string) => {
    setSelectedForMergeIds((prev) => {
      const next = new Set(prev)
      if (next.has(setId)) {
        next.delete(setId)
      } else {
        next.add(setId)
      }
      return next
    })
  }

  const handleMergeSelected = async () => {
    const selectedSets = getSelectedImportedProblemSets(
      importedProblemSets,
      selectedForMergeIds,
    )
    if (selectedSets.length < 2) return

    const confirmed = window.confirm(
      `選択した${selectedSets.length}件のデータを統合します。よろしいですか？`,
    )
    if (!confirmed) return

    const defaultName = selectedSets.map((set) => set.name).join('+')
    const name = window.prompt('統合後のデータ名を入力してください', defaultName)
    if (!name || !name.trim()) return

    const mergedQuestions = selectedSets.flatMap(
      (set) => importedQuestionsBySetId[set.id] ?? [],
    )
    const mergedSet: ProblemSet = {
      id: `imported-merged-${Date.now()}`,
      name: name.trim(),
      sourceType: 'imported',
      enabled: true,
      questionCount: mergedQuestions.length,
      createdAt: new Date().toISOString(),
    }

    try {
      await saveProblemSet(mergedSet, mergedQuestions)
      setImportedProblemSets((prev) => [...prev, mergedSet])
      setImportedQuestionsBySetId((prev) => ({
        ...prev,
        [mergedSet.id]: mergedQuestions,
      }))
      setSavedImportedIds((prev) => new Set(prev).add(mergedSet.id))
      setSelectedForMergeIds(new Set())
    } catch (err) {
      const message = toErrorMessage(err)
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

  const handleToggleDetail = (cardKey: string) => {
    setOpenDetailKeys((prev) => {
      const next = new Set(prev)
      if (next.has(cardKey)) {
        next.delete(cardKey)
      } else {
        next.add(cardKey)
      }
      return next
    })
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

  const headerResultCount = (
    isSearchActive ? filtered.length : allSearchQuestions.length
  ).toLocaleString('ja-JP')

  const showCsvStatus =
    csvStatus.includes('読み込み中') || csvStatus.includes('失敗')

  return (
    <div className="app-shell">
      <header className="search-header">
        <div className="header-row">
          <div className="header-info-block">
            <h1 className="app-title">G検定クイック検索ビューアー</h1>
            <div className="header-meta">
              <button
                type="button"
                className="settings-toggle"
                aria-label={
                  isDataPanelOpen ? 'データ管理を閉じる' : 'データ管理を開く'
                }
                onClick={() => setIsDataPanelOpen((prev) => !prev)}
              >
                ⚙️
              </button>
              <span className="header-result-count">
                検索結果
                <span className="header-result-count-value">
                  {headerResultCount}
                </span>
                件
              </span>
            </div>
          </div>

          <div className="header-search-block">
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
          </div>
        </div>

        {showCsvStatus && <p className="csv-status">{csvStatus}</p>}
      </header>

      {isDataPanelOpen && (
        <section className="data-management-panel">
          <div className="data-management-panel-header">
            <div className="data-management-panel-heading-group">
              <p className="data-management-heading-main">データ管理</p>
              <p className="data-management-search-pool">
                {searchPoolSummary}
              </p>
            </div>
            <button
              type="button"
              className="data-management-button"
              onClick={() => setIsDataPanelOpen(false)}
            >
              閉じる
            </button>
          </div>
          <div className="data-management-body">
            {restoreError && (
              <p className="data-management-error">
                復元エラー：{restoreError}
              </p>
            )}

            <div className="data-management-load-row">
              <span className="data-management-load-label">データ読み込み</span>
              <label className="data-management-button data-management-add-button data-management-file-label">
                新たなデータを追加
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="data-management-file-input"
                  onChange={handleImportFileChange}
                />
              </label>
              <span className="data-management-save-note">
                保存先：このブラウザ内　※別端末とは同期されません。
              </span>
            </div>

            {csvValidation.status === 'success' && (
              <p className="data-management-csv-result">
                検証OK：{csvValidation.fileName}（{csvValidation.count}問）
                {latestUnsavedSet && (
                  <button
                    type="button"
                    className="data-management-button"
                    onClick={() => handleSaveImported(latestUnsavedSet)}
                  >
                    保存
                  </button>
                )}
              </p>
            )}
            {csvValidation.status === 'error' && (
              <p className="data-management-csv-result data-management-error">
                検証エラー：{csvValidation.fileName}（{csvValidation.message}）
              </p>
            )}

            <div className="data-management-selection-bar">
              <span className="data-management-selection-label">
                選択したデータ
                <span className="data-management-selection-count-value">
                  {selectedForMergeIds.size}
                </span>
                件選択中
              </span>
              <div className="data-management-selection-actions">
                <button
                  type="button"
                  className="data-management-button"
                  disabled={selectedForMergeIds.size < 2}
                  onClick={handleMergeSelected}
                >
                  統合
                </button>
                <button
                  type="button"
                  className="data-management-button data-management-button-danger"
                  disabled={selectedForMergeIds.size < 1}
                  onClick={handleDeleteSelected}
                >
                  削除
                </button>
              </div>
            </div>

            {saveError && (
              <p className="data-management-error">保存エラー：{saveError}</p>
            )}
            {deleteError && (
              <p className="data-management-error">
                削除エラー：{deleteError}
              </p>
            )}

            <div className="data-table-wrapper">
              <table className="data-table">
                <tbody>
                  <tr>
                    <th>名称</th>
                    {allDisplayedSets.map((set) => (
                      <td key={set.id}>
                        {set.sourceType === 'imported' && (
                          <input
                            type="checkbox"
                            className="data-table-checkbox"
                            checked={selectedForMergeIds.has(set.id)}
                            onChange={() =>
                              handleToggleSelectForMerge(set.id)
                            }
                            aria-label={`${set.name}を選択`}
                          />
                        )}
                        {set.name}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>登録日時</th>
                    {allDisplayedSets.map((set) => (
                      <td key={set.id}>{formatRegisteredAt(set)}</td>
                    ))}
                  </tr>
                  <tr>
                    <th>件数</th>
                    {allDisplayedSets.map((set) => (
                      <td key={set.id}>{set.questionCount}問</td>
                    ))}
                  </tr>
                  <tr>
                    <th>読み込み元</th>
                    {allDisplayedSets.map((set) => (
                      <td key={set.id}>
                        {set.sourceType === 'built-in' ? '内蔵CSV' : 'CSV追加'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>状態</th>
                    {allDisplayedSets.map((set) => (
                      <td key={set.id}>
                        {set.sourceType === 'built-in' ? (
                          <span className="status-badge">有効</span>
                        ) : (
                          <div className="status-toggle" role="group">
                            <button
                              type="button"
                              className={
                                set.enabled
                                  ? 'status-toggle-button is-active'
                                  : 'status-toggle-button'
                              }
                              onClick={() =>
                                !set.enabled && handleToggleEnabled(set)
                              }
                            >
                              有効
                            </button>
                            <button
                              type="button"
                              className={
                                !set.enabled
                                  ? 'status-toggle-button is-active'
                                  : 'status-toggle-button'
                              }
                              onClick={() =>
                                set.enabled && handleToggleEnabled(set)
                              }
                            >
                              無効
                            </button>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {importedProblemSets.length === 0 && (
              <p className="data-management-empty">
                追加データはまだありません
              </p>
            )}
          </div>
        </section>
      )}

      <main className="main-content">
        {isSearchActive && filtered.length === 0 ? (
          <p className="no-result">該当なし</p>
        ) : (
          <>
            <section className="top-cards" aria-label="上位6件">
              {topResults.map((q) => {
                const cardKey = `${q.sourceFile}-${q.id}`
                const isDetailOpen = openDetailKeys.has(cardKey)
                const wrongReasons = q.metadata?.wrongReasons

                return (
                  <article
                    className={`question-card ${getCardLengthClass(q)}`.trim()}
                    key={cardKey}
                  >
                    <div className="card-meta">
                      <span className="card-category">
                        分野：{highlightText(q.category, searchTokens)}
                      </span>
                      <span className="card-difficulty">
                        捻り度：{highlightText(q.difficulty, searchTokens)}
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
                    <button
                      type="button"
                      className="card-detail-toggle"
                      onClick={() => handleToggleDetail(cardKey)}
                    >
                      {isDetailOpen ? '詳細を閉じる' : '詳細'}
                    </button>
                    {isDetailOpen && (
                      <div className="card-detail">
                        {hasDetailContent(q) ? (
                          <>
                            {q.metadata?.trapPoint && (
                              <p className="card-detail-row">
                                <span className="card-detail-label">
                                  ひっかけポイント：
                                </span>
                                {highlightText(
                                  q.metadata.trapPoint,
                                  searchTokens,
                                )}
                              </p>
                            )}
                            {wrongReasons &&
                              ANSWER_KEYS.some((key) => wrongReasons[key]) && (
                                <div className="card-detail-row">
                                  <span className="card-detail-label">
                                    誤答理由：
                                  </span>
                                  <ul className="card-detail-wrong-list">
                                    {ANSWER_KEYS.filter(
                                      (key) => wrongReasons[key],
                                    ).map((key) => (
                                      <li key={key}>
                                        {key}：
                                        {highlightText(
                                          wrongReasons[key] ?? '',
                                          searchTokens,
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            {q.metadata?.storyHint && (
                              <p className="card-detail-row">
                                <span className="card-detail-label">
                                  記憶ヒント：
                                </span>
                                {highlightText(
                                  q.metadata.storyHint,
                                  searchTokens,
                                )}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="card-detail-empty">追加詳細なし</p>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
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
                      捻り度：{highlightText(q.difficulty, searchTokens)}
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
