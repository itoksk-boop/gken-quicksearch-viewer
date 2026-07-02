import type { GQuestion, ProblemSet, StoredProblemSet } from '../types/question'

const DB_NAME = 'gkentei-quicksearch-db'
const DB_VERSION = 1
const STORE_NAME = 'problemSets'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'problemSet.id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDBを開けませんでした'))
    }
  })
}

export async function saveProblemSet(
  problemSet: ProblemSet,
  questions: GQuestion[],
): Promise<void> {
  const db = await openDatabase()

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const record: StoredProblemSet = { problemSet, questions }

      store.put(record)

      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('保存に失敗しました'))
      tx.onabort = () => reject(tx.error ?? new Error('保存が中断されました'))
    })
  } finally {
    db.close()
  }
}
