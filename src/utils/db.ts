// IndexedDB 工具类
export class ChatDB {
  private dbName = 'ai-chat-db'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建聊天会话表
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true })
          sessionStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // 创建消息表
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true })
          messageStore.createIndex('sessionId', 'sessionId', { unique: false })
          messageStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // 创建设置表
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })
  }

  async addSession(title: string): Promise<number> {
    const session = {
      title,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    return this.add('sessions', session)
  }

  async addMessage(sessionId: number, role: 'user' | 'assistant', content: string): Promise<number> {
    const message = {
      sessionId,
      role,
      content,
      createdAt: Date.now()
    }
    return this.add('messages', message)
  }

  async getMessages(sessionId: number): Promise<any[]> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly')
      const store = transaction.objectStore('messages')
      const index = store.index('sessionId')
      const request = index.getAll(sessionId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getSessions(): Promise<any[]> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly')
      const store = transaction.objectStore('sessions')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async saveSetting(key: string, value: any): Promise<void> {
    await this.put('settings', { key, value })
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly')
      const store = transaction.objectStore('settings')
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result?.value)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteSession(sessionId: number): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions', 'messages'], 'readwrite')

      // 删除会话
      const sessionStore = transaction.objectStore('sessions')
      sessionStore.delete(sessionId)

      // 删除该会话的所有消息
      const messageStore = transaction.objectStore('messages')
      const index = messageStore.index('sessionId')
      const request = index.openCursor(IDBKeyRange.only(sessionId))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  private async add(storeName: string, data: any): Promise<number> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onsuccess = () => resolve(request.result as number)
      request.onerror = () => reject(request.error)
    })
  }

  private async put(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const chatDB = new ChatDB()
