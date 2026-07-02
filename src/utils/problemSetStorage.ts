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

export async function deleteProblemSet(problemSetId: string): Promise<void> {
  const db = await openDatabase()

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)

      store.delete(problemSetId)

      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('削除に失敗しました'))
      tx.onabort = () => reject(tx.error ?? new Error('削除が中断されました'))
    })
  } finally {
    db.close()
  }
}

export async function getAllStoredProblemSets(): Promise<StoredProblemSet[]> {
  const db = await openDatabase()

  try {
    return await new Promise<StoredProblemSet[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result as StoredProblemSet[])
      }
      request.onerror = () => {
        reject(request.error ?? new Error('保存済みデータの読み出しに失敗しました'))
      }
    })
  } finally {
    db.close()
  }
}
