/**
 * Theme Manager - 主题管理工具
 * 用于切换亮色/暗色模式
 */

export type Theme = 'light' | 'dark' | 'auto'

export class ThemeManager {
  private static instance: ThemeManager
  private currentTheme: Theme = 'auto'
  private listeners: Set<(theme: 'light' | 'dark') => void> = new Set()
  private mediaQuery: MediaQueryList | null = null

  private constructor() {
    // 监听系统主题变化
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.mediaQuery.addEventListener('change', () => {
        if (this.currentTheme === 'auto') {
          this.notifyListeners()
        }
      })
    }
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  /**
   * 获取当前主题（light 或 dark）
   */
  getEffectiveTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'auto') {
      return this.mediaQuery?.matches ? 'dark' : 'light'
    }
    return this.currentTheme
  }

  /**
   * 获取当前设置的主题（light/dark/auto）
   */
  getTheme(): Theme {
    return this.currentTheme
  }

  /**
   * 设置主题
   */
  setTheme(theme: Theme): void {
    this.currentTheme = theme
    this.applyTheme()
    this.notifyListeners()
    
    // 保存到 localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ai-chat-theme', theme)
    }
  }

  /**
   * 应用主题到 document
   */
  applyTheme(): void {
    const effectiveTheme = this.getEffectiveTheme()
    
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', effectiveTheme)
    }
  }

  /**
   * 从 localStorage 加载主题设置
   */
  loadTheme(): void {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('ai-chat-theme') as Theme | null
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        this.currentTheme = savedTheme
        this.applyTheme()
        this.notifyListeners()
      }
    }
  }

  /**
   * 订阅主题变化
   */
  onThemeChange(callback: (theme: 'light' | 'dark') => void): () => void {
    this.listeners.add(callback)
    // 立即执行一次回调
    callback(this.getEffectiveTheme())
    
    // 返回取消订阅函数
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(): void {
    const effectiveTheme = this.getEffectiveTheme()
    this.listeners.forEach(callback => {
      try {
        callback(effectiveTheme)
      } catch (error) {
        console.error('Theme change callback error:', error)
      }
    })
  }
}

// 导出单例实例
export const themeManager = ThemeManager.getInstance()
