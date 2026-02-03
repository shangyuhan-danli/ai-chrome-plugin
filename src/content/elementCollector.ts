// 元素采集器 - 扫描页面，提取可交互元素
import type { PageElement, CompactElement, PageContext, FilterStrategy } from '../utils/pageActionTypes'

// 元素 ID 到 DOM 元素的映射
const elementMap = new Map<string, HTMLElement>()

// 默认筛选策略
const defaultStrategy: FilterStrategy = {
  priorities: {
    form: 10,
    button: 8,
    link: 3,
    text: 1,
    tab: 7,        // Tab页签优先级
    menu: 6,       // 菜单项优先级
    list: 4        // 列表项优先级
  },
  viewport: {
    visible: 5,
    nearViewport: 2,
    hidden: 0
  },
  maxElements: 30
}

/**
 * 生成唯一元素 ID
 */
function generateElementId(): string {
  return `e_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
}

/**
 * 检查元素是否在视口内
 */
function isInViewport(rect: DOMRect): boolean {
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  )
}

/**
 * 检查元素是否在视口附近
 */
function isNearViewport(rect: DOMRect): boolean {
  const margin = 200
  return (
    rect.top >= -margin &&
    rect.left >= -margin &&
    rect.bottom <= window.innerHeight + margin &&
    rect.right <= window.innerWidth + margin
  )
}

/**
 * 检查元素是否可见
 */
function isElementVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false
  }

  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    return false
  }

  return true
}

/**
 * 获取元素的关联 label 文本
 */
function getAssociatedLabel(el: HTMLElement): string | undefined {
  // 通过 id 查找关联的 label
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`)
    if (label) {
      return label.textContent?.trim()
    }
  }

  // 查找父级 label
  const parentLabel = el.closest('label')
  if (parentLabel) {
    // 排除元素自身的文本
    const clone = parentLabel.cloneNode(true) as HTMLElement
    const inputs = clone.querySelectorAll('input, select, textarea')
    inputs.forEach(input => input.remove())
    return clone.textContent?.trim()
  }

  return undefined
}

/**
 * 获取元素的可见文本
 */
function getElementText(el: HTMLElement): string | undefined {
  // 对于按钮和链接，获取内部文本
  if (el.tagName === 'BUTTON' || el.tagName === 'A') {
    return el.textContent?.trim()
  }

  // 对于 input[type=submit] 或 input[type=button]
  if (el.tagName === 'INPUT') {
    const input = el as HTMLInputElement
    if (input.type === 'submit' || input.type === 'button') {
      return input.value
    }
  }

  return undefined
}

/**
 * 采集单个元素信息
 */
function collectElementInfo(el: HTMLElement): PageElement | null {
  if (!isElementVisible(el)) {
    return null
  }

  const rect = el.getBoundingClientRect()
  const id = generateElementId()

  // 保存映射
  elementMap.set(id, el)

  const element: PageElement = {
    id,
    tag: el.tagName.toLowerCase(),
    rect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    },
    visible: isInViewport(rect),
    disabled: (el as HTMLInputElement).disabled || el.getAttribute('aria-disabled') === 'true'
  }

  // 收集额外属性
  if (el.tagName === 'INPUT') {
    const input = el as HTMLInputElement
    element.type = input.type
    element.name = input.name || undefined
    element.placeholder = input.placeholder || undefined
    // 密码框不传值
    if (input.type !== 'password') {
      element.value = input.value || undefined
    }
  }

  if (el.tagName === 'TEXTAREA') {
    const textarea = el as HTMLTextAreaElement
    element.name = textarea.name || undefined
    element.placeholder = textarea.placeholder || undefined
    element.value = textarea.value || undefined
  }

  if (el.tagName === 'SELECT') {
    const select = el as HTMLSelectElement
    element.name = select.name || undefined
    element.value = select.value || undefined
  }

  element.text = getElementText(el)
  element.label = getAssociatedLabel(el)
  element.ariaLabel = el.getAttribute('aria-label') || undefined

  return element
}

/**
 * 采集所有可交互元素
 */
export function collectInteractiveElements(): PageElement[] {
  // 清空旧的映射
  elementMap.clear()

  const elements: PageElement[] = []

  // 可交互元素选择器 - 全面覆盖各种UI组件
  const selectors = [
    // 基础表单元素
    'input:not([type="hidden"])',
    'textarea',
    'select',
    'button',
    'a[href]',
    
    // ARIA角色 - 交互组件
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',        // 开关/切换按钮
    '[role="tab"]',           // Tab页签
    '[role="tabpanel"]',      // Tab内容面板
    '[role="listitem"]',      // 列表项
    '[role="option"]',        // 下拉选项
    '[role="menuitem"]',      // 菜单项
    '[role="treeitem"]',      // 树形节点
    '[role="gridcell"]',      // 表格单元格
    '[role="cell"]',          // 单元格
    
    // 常用类名模式 - Tab页签
    '[class*="tab"]',
    '[class*="Tab"]',
    '[data-tab]',
    '[data-role="tab"]',
    '.nav-tabs > li',
    '.tab-list > *',
    '.tab-item',
    '[role="presentation"]',   // Bootstrap tabs
    
    // 列表项 - 各种可点击的li
    'li[onclick]',
    'li[data-clickable]',
    'li.clickable',
    'li[role="button"]',
    'li[role="tab"]',
    'li[role="menuitem"]',
    'ul[data-list] > li',
    'ol[data-list] > li',
    '.list-group-item',        // Bootstrap
    '.menu-item',              // 菜单项
    '.dropdown-item',          // 下拉项
    
    // 可编辑内容
    '[contenteditable="true"]',
    
    // 点击事件
    '[onclick]',
    
    // TabIndex可聚焦
    '[tabindex]:not([tabindex="-1"])',
    
    // 日期/时间选择器
    'input[type="date"]',
    'input[type="datetime-local"]',
    'input[type="time"]',
    'input[type="month"]',
    'input[type="week"]',
    
    // 文件上传
    'input[type="file"]',
    
    // 颜色选择器
    'input[type="color"]',
    
    // 范围滑块
    'input[type="range"]',
    
    // 特殊交互元素
    'details',
    'summary',
    'label[for]'               // 关联的标签
  ]

  const allElements = document.querySelectorAll(selectors.join(', '))

  allElements.forEach(el => {
    const info = collectElementInfo(el as HTMLElement)
    if (info) {
      elements.push(info)
    }
  })

  return elements
}

/**
 * 根据 ID 获取实际 DOM 元素
 */
export function getElementById(id: string): HTMLElement | null {
  return elementMap.get(id) || null
}

/**
 * 从用户消息中提取关键词
 */
function extractKeywords(message: string): string[] {
  // 移除常见的动词和助词
  const stopWords = ['帮我', '请', '把', '将', '给', '在', '到', '的', '和', '然后', '并且', '接着']
  let text = message

  stopWords.forEach(word => {
    text = text.replace(new RegExp(word, 'g'), ' ')
  })

  // 分词（简单按空格和标点分割）
  const words = text.split(/[\s,，。.!！?？、]+/).filter(w => w.length > 0)

  return words
}

/**
 * 计算元素与关键词的相关性得分
 */
function calculateScore(el: PageElement, keywords: string[], strategy: FilterStrategy): number {
  let score = 0

  // 关键词匹配
  const text = [el.text, el.placeholder, el.label, el.ariaLabel, el.name].filter(Boolean).join(' ')
  for (const kw of keywords) {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      score += 10
    }
  }

  // 元素类型权重
  if (el.tag === 'input' || el.tag === 'textarea') {
    score += strategy.priorities.form
  } else if (el.tag === 'button' || (el.tag === 'input' && (el.type === 'submit' || el.type === 'button'))) {
    score += strategy.priorities.button
  } else if (el.tag === 'select') {
    score += strategy.priorities.form
  } else if (el.tag === 'a') {
    score += strategy.priorities.link
  } else if (el.tag === 'li' || el.tag === 'details' || el.tag === 'summary') {
    score += strategy.priorities.list
  }
  
  // Tab页签特殊权重
  const originalEl = elementMap.get(el.id)
  if (originalEl && isTabElement(el, originalEl)) {
    score += strategy.priorities.tab
  }

  // 视口权重
  if (el.visible) {
    score += strategy.viewport.visible
  } else if (isNearViewport(new DOMRect(el.rect.x, el.rect.y, el.rect.width, el.rect.height))) {
    score += strategy.viewport.nearViewport
  }

  // 禁用元素降权
  if (el.disabled) {
    score -= 5
  }

  return score
}

/**
 * 智能筛选元素
 */
export function filterElements(
  elements: PageElement[],
  userMessage: string,
  strategy: FilterStrategy = defaultStrategy
): PageElement[] {
  const keywords = extractKeywords(userMessage)

  const scored = elements.map(el => ({
    element: el,
    score: calculateScore(el, keywords, strategy)
  }))

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, strategy.maxElements)
    .map(s => s.element)
}

/**
 * 检查元素是否是Tab页签
 */
function isTabElement(el: PageElement, originalEl: HTMLElement): boolean {
  // 通过role判断
  if (originalEl.getAttribute('role') === 'tab') return true
  
  // 通过类名判断
  const className = originalEl.className || ''
  if (className.includes('tab') || className.includes('Tab')) return true
  
  // 通过data属性判断
  if (originalEl.hasAttribute('data-tab')) return true
  if (originalEl.getAttribute('data-role') === 'tab') return true
  
  // 通过父容器判断（Bootstrap风格的tabs）
  const parent = originalEl.parentElement
  if (parent && (parent.className.includes('nav-tabs') || parent.className.includes('tab-list'))) {
    return true
  }
  
  return false
}

/**
 * 生成元素描述
 */
function generateElementDescription(el: PageElement, originalEl?: HTMLElement): string {
  const parts: string[] = []

  // 元素类型
  const typeMap: Record<string, string> = {
    input: '输入框',
    textarea: '文本框',
    button: '按钮',
    a: '链接',
    select: '下拉框',
    li: '列表项',
    details: '详情展开',
    summary: '摘要标题'
  }

  let typeName = typeMap[el.tag] || el.tag
  
  // 检查是否是Tab页签
  if (originalEl && isTabElement(el, originalEl)) {
    typeName = 'Tab页签'
  }
  
  // 通过role识别特殊组件
  if (originalEl) {
    const role = originalEl.getAttribute('role')
    if (role) {
      const roleMap: Record<string, string> = {
        'tab': 'Tab页签',
        'tabpanel': 'Tab面板',
        'switch': '开关按钮',
        'menuitem': '菜单项',
        'option': '下拉选项',
        'listitem': '列表项',
        'treeitem': '树节点',
        'gridcell': '表格单元',
        'radio': '单选按钮',
        'checkbox': '复选框',
        'button': '按钮',
        'link': '链接'
      }
      if (roleMap[role]) {
        typeName = roleMap[role]
      }
    }
  }
  
  if (el.tag === 'input' && el.type) {
    const inputTypeMap: Record<string, string> = {
      'password': '密码框',
      'submit': '提交按钮',
      'button': '按钮',
      'checkbox': '复选框',
      'radio': '单选框',
      'search': '搜索框',
      'email': '邮箱输入框',
      'tel': '电话输入框',
      'number': '数字输入框',
      'url': 'URL输入框',
      'date': '日期选择器',
      'datetime-local': '日期时间选择器',
      'time': '时间选择器',
      'month': '月份选择器',
      'week': '周选择器',
      'file': '文件上传',
      'color': '颜色选择器',
      'range': '滑块',
      'hidden': '隐藏字段'
    }
    if (inputTypeMap[el.type]) {
      typeName = inputTypeMap[el.type]
    }
  }

  parts.push(typeName)

  // 标识信息（优先级：label > text > placeholder > ariaLabel > name > title）
  let identifier = el.label || el.text || el.placeholder || el.ariaLabel || el.name
  
  // 如果没有标识，尝试获取title属性
  if (!identifier && originalEl) {
    identifier = originalEl.getAttribute('title') || undefined
  }
  
  // 对于Tab页签，特殊处理获取文本
  if (!identifier && originalEl && typeName === 'Tab页签') {
    // 获取子元素的文本
    const childText = originalEl.textContent?.trim()
    if (childText && childText.length < 50) {  // 限制长度
      identifier = childText
    }
  }
  
  if (identifier) {
    parts.push(identifier)
  }

  // 额外信息
  const extras: string[] = []
  if (el.placeholder && el.placeholder !== identifier) {
    extras.push(`placeholder:${el.placeholder}`)
  }
  if (el.type && !['text', 'submit', 'button'].includes(el.type)) {
    extras.push(`type:${el.type}`)
  }
  if (el.disabled) {
    extras.push('禁用')
  }
  
  // Tab页签显示激活状态
  if (typeName === 'Tab页签' && originalEl) {
    const isActive = originalEl.classList.contains('active') || 
                    originalEl.getAttribute('aria-selected') === 'true'
    if (isActive) {
      extras.push('当前激活')
    }
  }
  
  // 对于单选/复选框，显示选中状态
  if ((el.type === 'radio' || el.type === 'checkbox') && originalEl) {
    const isChecked = (originalEl as HTMLInputElement).checked
    if (isChecked) {
      extras.push('已选中')
    }
  }

  let desc = parts.join(':')
  if (extras.length > 0) {
    desc += `(${extras.join(',')})`
  }

  return desc
}

/**
 * 转换为精简格式
 */
export function toCompactFormat(elements: PageElement[]): CompactElement[] {
  return elements.map(el => {
    // 从 elementMap 获取原始 DOM 元素，以便生成更准确的描述
    const originalEl = elementMap.get(el.id)
    return {
      id: el.id,
      desc: generateElementDescription(el, originalEl)
    }
  })
}

/**
 * 获取页面上下文
 */
export function getPageContext(userMessage: string = ''): PageContext {
  const allElements = collectInteractiveElements()
  const filteredElements = filterElements(allElements, userMessage)
  const compactElements = toCompactFormat(filteredElements)

  return {
    url: window.location.href,
    title: document.title,
    elements: compactElements,
    selectedText: window.getSelection()?.toString() || undefined
  }
}

/**
 * 根据条件请求更多元素
 */
export function requestMoreElements(params: {
  region?: string
  elementType?: string
  keyword?: string
}): CompactElement[] {
  let elements = collectInteractiveElements()

  // 按区域筛选
  if (params.region) {
    elements = elements.filter(el => {
      const rect = el.rect
      switch (params.region) {
        case 'header':
          return rect.y < 150
        case 'footer':
          return rect.y > window.innerHeight - 200
        case 'sidebar':
          return rect.x < 250 || rect.x > window.innerWidth - 250
        case 'below_viewport':
          return rect.y > window.innerHeight
        case 'form':
          // 查找表单区域内的元素
          const formElements = document.querySelectorAll('form')
          return Array.from(formElements).some(form => {
            const formRect = form.getBoundingClientRect()
            return (
              rect.x >= formRect.left &&
              rect.x <= formRect.right &&
              rect.y >= formRect.top &&
              rect.y <= formRect.bottom
            )
          })
        case 'tab_panel':
          // Tab面板区域内的元素
          const tabPanels = document.querySelectorAll('[role="tabpanel"], .tab-content, .tab-pane')
          return Array.from(tabPanels).some(panel => {
            const panelRect = panel.getBoundingClientRect()
            return (
              rect.x >= panelRect.left &&
              rect.x <= panelRect.right &&
              rect.y >= panelRect.top &&
              rect.y <= panelRect.bottom
            )
          })
        case 'modal':
          // 弹窗/模态框内的元素
          const modals = document.querySelectorAll('[role="dialog"], .modal, .dialog, [class*="modal"], [class*="dialog"]')
          return Array.from(modals).some(modal => {
            const modalRect = modal.getBoundingClientRect()
            return (
              rect.x >= modalRect.left &&
              rect.x <= modalRect.right &&
              rect.y >= modalRect.top &&
              rect.y <= modalRect.bottom
            )
          })
        case 'menu':
          // 菜单区域内的元素
          const menus = document.querySelectorAll('[role="menu"], [role="menubar"], .menu, .dropdown-menu, .context-menu')
          return Array.from(menus).some(menu => {
            const menuRect = menu.getBoundingClientRect()
            return (
              rect.x >= menuRect.left &&
              rect.x <= menuRect.right &&
              rect.y >= menuRect.top &&
              rect.y <= menuRect.bottom
            )
          })
        default:
          return true
      }
    })
  }

  // 按元素类型筛选
  if (params.elementType && params.elementType !== 'all') {
    elements = elements.filter(el => {
      const originalEl = elementMap.get(el.id)
      
      switch (params.elementType) {
        case 'input':
          return el.tag === 'input' || el.tag === 'textarea'
        case 'button':
          return el.tag === 'button' || (el.tag === 'input' && (el.type === 'submit' || el.type === 'button'))
        case 'link':
          return el.tag === 'a'
        case 'select':
          return el.tag === 'select'
        case 'tab':
          // Tab页签
          return originalEl ? isTabElement(el, originalEl) : false
        case 'menu':
          // 菜单项
          if (!originalEl) return false
          return originalEl.getAttribute('role') === 'menuitem' ||
                 originalEl.classList.contains('menu-item') ||
                 originalEl.classList.contains('dropdown-item')
        case 'list':
          // 列表项
          return el.tag === 'li' || 
                 (originalEl?.getAttribute('role') === 'listitem') ||
                 originalEl?.classList.contains('list-group-item')
        case 'radio':
          // 单选框
          return el.type === 'radio' || originalEl?.getAttribute('role') === 'radio'
        case 'checkbox':
          // 复选框
          return el.type === 'checkbox' || originalEl?.getAttribute('role') === 'checkbox'
        default:
          return true
      }
    })
  }

  // 按关键词筛选
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase()
    elements = elements.filter(el => {
      const text = [el.text, el.placeholder, el.label, el.ariaLabel, el.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return text.includes(keyword)
    })
  }

  return toCompactFormat(elements)
}
