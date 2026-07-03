import type { ChangeEvent } from 'react'
import type { ProblemSet } from '../types/question'

export type CsvValidationResult =
  | { status: 'idle' }
  | { status: 'success'; fileName: string; count: number }
  | { status: 'error'; fileName: string; message: string }

export type QuestionTypeSummary = {
  label: string
  count: number
  enabled: boolean
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

type DataManagementPanelProps = {
  searchPoolSummary: string
  onClose: () => void
  restoreError: string | null
  onImportFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  csvValidation: CsvValidationResult
  latestUnsavedSet: ProblemSet | undefined
  onSaveImported: (set: ProblemSet) => void
  selectedForMergeIds: Set<string>
  onMergeSelected: () => void
  onDeleteSelected: () => void
  saveError: string | null
  deleteError: string | null
  builtInProblemSet: ProblemSet
  importedProblemSets: ProblemSet[]
  onToggleSelected: (setId: string) => void
  onToggleEnabled: (set: ProblemSet) => void
  questionTypeSummaries: QuestionTypeSummary[]
  onToggleQuestionType: (label: string) => void
  onEnableAllQuestionTypes: () => void
  onDisableAllQuestionTypes: () => void
}

function DataManagementPanel({
  searchPoolSummary,
  onClose,
  restoreError,
  onImportFileChange,
  csvValidation,
  latestUnsavedSet,
  onSaveImported,
  selectedForMergeIds,
  onMergeSelected,
  onDeleteSelected,
  saveError,
  deleteError,
  builtInProblemSet,
  importedProblemSets,
  onToggleSelected,
  onToggleEnabled,
  questionTypeSummaries,
  onToggleQuestionType,
  onEnableAllQuestionTypes,
  onDisableAllQuestionTypes,
}: DataManagementPanelProps) {
  const allDisplayedSets: ProblemSet[] = [
    builtInProblemSet,
    ...importedProblemSets,
  ]

  return (
    <section className="data-management-panel">
      <div className="data-management-panel-header">
        <div className="data-management-panel-heading-group">
          <p className="data-management-heading-main">データ管理</p>
          <p className="data-management-search-pool">{searchPoolSummary}</p>
        </div>
        <button
          type="button"
          className="data-management-button"
          onClick={onClose}
        >
          閉じる
        </button>
      </div>
      <div className="data-management-body">
        {restoreError && (
          <p className="data-management-error">復元エラー：{restoreError}</p>
        )}

        <div className="data-management-load-row">
          <span className="data-management-load-label">データ読み込み</span>
          <label className="data-management-button data-management-add-button data-management-file-label">
            新たなデータを追加
            <input
              type="file"
              accept=".csv,text/csv"
              className="data-management-file-input"
              onChange={onImportFileChange}
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
                onClick={() => onSaveImported(latestUnsavedSet)}
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
              onClick={onMergeSelected}
            >
              統合
            </button>
            <button
              type="button"
              className="data-management-button data-management-button-danger"
              disabled={selectedForMergeIds.size < 1}
              onClick={onDeleteSelected}
            >
              削除
            </button>
          </div>
        </div>

        {saveError && (
          <p className="data-management-error">保存エラー：{saveError}</p>
        )}
        {deleteError && (
          <p className="data-management-error">削除エラー：{deleteError}</p>
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
                        onChange={() => onToggleSelected(set.id)}
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
                          onClick={() => !set.enabled && onToggleEnabled(set)}
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
                          onClick={() => set.enabled && onToggleEnabled(set)}
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
          <p className="data-management-empty">追加データはまだありません</p>
        )}

        <div className="question-type-section">
          <div className="question-type-header">
            <span className="question-type-heading">問題タイプ</span>
            <div className="question-type-bulk-actions">
              <button
                type="button"
                className="data-management-button"
                onClick={onEnableAllQuestionTypes}
              >
                すべて有効
              </button>
              <button
                type="button"
                className="data-management-button"
                onClick={onDisableAllQuestionTypes}
              >
                すべて無効
              </button>
            </div>
          </div>
          {questionTypeSummaries.length === 0 ? (
            <p className="data-management-empty">問題タイプ情報がありません</p>
          ) : (
            <ul className="question-type-list">
              {questionTypeSummaries.map((type) => (
                <li className="question-type-row" key={type.label}>
                  <span className="question-type-label">{type.label}</span>
                  <span className="question-type-count">
                    {type.count.toLocaleString('ja-JP')}問
                  </span>
                  <div className="status-toggle" role="group">
                    <button
                      type="button"
                      className={
                        type.enabled
                          ? 'status-toggle-button is-active'
                          : 'status-toggle-button'
                      }
                      onClick={() =>
                        !type.enabled && onToggleQuestionType(type.label)
                      }
                    >
                      有効
                    </button>
                    <button
                      type="button"
                      className={
                        !type.enabled
                          ? 'status-toggle-button is-active'
                          : 'status-toggle-button'
                      }
                      onClick={() =>
                        type.enabled && onToggleQuestionType(type.label)
                      }
                    >
                      無効
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

export default DataManagementPanel
