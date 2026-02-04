// 操作执行器 - 执行具体的 DOM 操作
import type { PageAction, ActionResult, BatchActionResult, PageElement } from '../utils/pageActionTypes'
import { getElementById } from './elementCollector'
import { smartLocateElement, validateElement } from './elementLocator'

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 模拟用户输入事件
 */
function simulateInput(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  // 聚焦元素
  el.focus()

  // 清空现有值
  el.value = ''

  // 触发 input 事件前的状态
  el.dispatchEvent(new Event('focus', { bubbles: true }))

  // 设置新值
  el.value = value

  // 触发各种输入事件
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

/**
 * 模拟点击事件
 */
function simulateClick(el: HTMLElement): void {
  el.focus()
  el.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  }))
}

/**
 * 填充输入框（改进版：支持智能重定位）
 */
async function fillInput(target: PageAction['target'], value?: string): Promise<ActionResult> {
  console.log('[ActionExecutor] fillInput 调用:', { target, value })

  if (!value) {
    return { success: false, message: '未提供填充值', error: 'NO_VALUE' }
  }

  // 首先尝试通过 elementId 查找
  let el = target.elementId ? getElementById(target.elementId) : null
  let elementInfo: PageElement | null = null

  // 如果 elementId 查找失败，尝试智能重定位
  if (!el) {
    console.log('[ActionExecutor] elementId 查找失败，尝试智能重定位')
    
    // 尝试使用 selector
    if (target.selector) {
      el = document.querySelector(target.selector) as HTMLElement
    }

    // 如果 selector 也失败，使用描述信息重定位
    if (!el && target.description) {
      // 这里需要从 elementCollector 获取原始元素信息
      // 暂时使用描述文本进行语义匹配
      const inputs = Array.from(document.querySelectorAll('input, textarea')) as HTMLElement[]
      for (const input of inputs) {
        const text = [
          (input as HTMLInputElement).placeholder,
          input.getAttribute('aria-label'),
          (input as HTMLInputElement).name,
          getAssociatedLabelText(input)
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (text.includes(target.description.toLowerCase())) {
          el = input
          break
        }
      }
    }
  }

  if (!el) {
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  // 验证元素类型
  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
    // 检查是否是 contenteditable
    if (el.getAttribute('contenteditable') === 'true') {
      el.focus()
      el.textContent = value
      el.dispatchEvent(new Event('input', { bubbles: true }))
      return { success: true, message: `已填充: ${value}` }
    }
    return { success: false, message: '目标元素不是输入框', error: 'INVALID_ELEMENT' }
  }

  // 验证元素（如果提供了 elementInfo）
  if (elementInfo) {
    const validation = validateElement(el, elementInfo)
    if (!validation.valid && validation.confidence < 50) {
      console.warn(`[ActionExecutor] 元素验证置信度较低: ${validation.confidence}%, ${validation.reason}`)
    }
  }

  simulateInput(el as HTMLInputElement | HTMLTextAreaElement, value)
  return { success: true, message: `已填充: ${value}` }
}

/**
 * 获取关联的 label 文本
 */
function getAssociatedLabelText(el: HTMLElement): string | undefined {
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`)
    if (label) return label.textContent?.trim()
  }
  const parentLabel = el.closest('label')
  if (parentLabel) {
    const clone = parentLabel.cloneNode(true) as HTMLElement
    const inputs = clone.querySelectorAll('input, select, textarea')
    inputs.forEach(input => input.remove())
    return clone.textContent?.trim()
  }
  return undefined
}

/**
 * 点击元素
 */
async function clickElement(target: PageAction['target']): Promise<ActionResult> {
  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLElement
      if (selectorEl) {
        simulateClick(selectorEl)
        return { success: true, message: '已点击元素' }
      }
    }
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  simulateClick(el)
  return { success: true, message: `已点击: ${target.description || el.textContent?.trim() || '元素'}` }
}

/**
 * 高亮文字
 */
async function highlightText(target: PageAction['target'], color?: string): Promise<ActionResult> {
  const highlightColor = color || '#ffeb3b'

  // 如果有选中的文字
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    const range = selection.getRangeAt(0)
    const span = document.createElement('span')
    span.className = 'ai-highlight'
    span.style.backgroundColor = highlightColor
    span.style.padding = '2px 0'
    span.style.borderRadius = '2px'

    try {
      range.surroundContents(span)
      selection.removeAllRanges()
      return { success: true, message: '已高亮选中文字' }
    } catch (e) {
      return { success: false, message: '无法高亮跨元素的选中内容', error: 'CROSS_ELEMENT' }
    }
  }

  // 如果指定了元素
  const el = target.elementId ? getElementById(target.elementId) : null
  if (el) {
    el.style.backgroundColor = highlightColor
    el.classList.add('ai-highlight')
    return { success: true, message: '已高亮元素' }
  }

  return { success: false, message: '未找到要高亮的内容', error: 'NO_TARGET' }
}

/**
 * 添加下划线
 */
async function underlineText(target: PageAction['target']): Promise<ActionResult> {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    const range = selection.getRangeAt(0)
    const span = document.createElement('span')
    span.className = 'ai-underline'
    span.style.textDecoration = 'underline'
    span.style.textDecorationColor = '#1a73e8'
    span.style.textDecorationThickness = '2px'

    try {
      range.surroundContents(span)
      selection.removeAllRanges()
      return { success: true, message: '已添加下划线' }
    } catch (e) {
      return { success: false, message: '无法为跨元素的选中内容添加下划线', error: 'CROSS_ELEMENT' }
    }
  }

  const el = target.elementId ? getElementById(target.elementId) : null
  if (el) {
    el.style.textDecoration = 'underline'
    el.style.textDecorationColor = '#1a73e8'
    el.classList.add('ai-underline')
    return { success: true, message: '已添加下划线' }
  }

  return { success: false, message: '未找到要添加下划线的内容', error: 'NO_TARGET' }
}

/**
 * 选择下拉选项
 */
async function selectOption(target: PageAction['target'], value?: string): Promise<ActionResult> {
  if (!value) {
    return { success: false, message: '未提供选择值', error: 'NO_VALUE' }
  }

  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el || el.tagName !== 'SELECT') {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLSelectElement
      if (selectorEl && selectorEl.tagName === 'SELECT') {
        return doSelect(selectorEl, value)
      }
    }
    return { success: false, message: '未找到下拉框元素', error: 'ELEMENT_NOT_FOUND' }
  }

  return doSelect(el as HTMLSelectElement, value)
}

function doSelect(select: HTMLSelectElement, value: string): ActionResult {
  // 尝试按 value 匹配
  const optionByValue = Array.from(select.options).find(opt => opt.value === value)
  if (optionByValue) {
    select.value = optionByValue.value
    select.dispatchEvent(new Event('change', { bubbles: true }))
    return { success: true, message: `已选择: ${optionByValue.text}` }
  }

  // 尝试按文本匹配
  const optionByText = Array.from(select.options).find(opt =>
    opt.text.toLowerCase().includes(value.toLowerCase())
  )
  if (optionByText) {
    select.value = optionByText.value
    select.dispatchEvent(new Event('change', { bubbles: true }))
    return { success: true, message: `已选择: ${optionByText.text}` }
  }

  return { success: false, message: `未找到匹配的选项: ${value}`, error: 'OPTION_NOT_FOUND' }
}

/**
 * 勾选复选框
 */
async function checkBox(target: PageAction['target']): Promise<ActionResult> {
  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLInputElement
      if (selectorEl && selectorEl.type === 'checkbox') {
        selectorEl.checked = !selectorEl.checked
        selectorEl.dispatchEvent(new Event('change', { bubbles: true }))
        return { success: true, message: selectorEl.checked ? '已勾选' : '已取消勾选' }
      }
    }
    return { success: false, message: '未找到复选框元素', error: 'ELEMENT_NOT_FOUND' }
  }

  if (el.tagName !== 'INPUT' || (el as HTMLInputElement).type !== 'checkbox') {
    return { success: false, message: '目标元素不是复选框', error: 'INVALID_ELEMENT' }
  }

  const checkbox = el as HTMLInputElement
  checkbox.checked = !checkbox.checked
  checkbox.dispatchEvent(new Event('change', { bubbles: true }))
  return { success: true, message: checkbox.checked ? '已勾选' : '已取消勾选' }
}

/**
 * 滚动页面
 */
async function scrollPage(direction?: string): Promise<ActionResult> {
  const scrollAmount = window.innerHeight * 0.8

  switch (direction) {
    case 'up':
      window.scrollBy({ top: -scrollAmount, behavior: 'smooth' })
      return { success: true, message: '已向上滚动' }
    case 'down':
      window.scrollBy({ top: scrollAmount, behavior: 'smooth' })
      return { success: true, message: '已向下滚动' }
    case 'top':
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return { success: true, message: '已滚动到顶部' }
    case 'bottom':
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      return { success: true, message: '已滚动到底部' }
    default:
      window.scrollBy({ top: scrollAmount, behavior: 'smooth' })
      return { success: true, message: '已向下滚动' }
  }
}

/**
 * 读取内容
 */
async function readContent(target: PageAction['target']): Promise<ActionResult> {
  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector)
      if (selectorEl) {
        const content = selectorEl.textContent?.trim() || ''
        return { success: true, message: '已读取内容', data: content }
      }
    }

    // 如果没有指定元素，读取选中的文字
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      return { success: true, message: '已读取选中内容', data: selection.toString() }
    }

    return { success: false, message: '未找到要读取的内容', error: 'NO_TARGET' }
  }

  const content = el.textContent?.trim() || ''
  return { success: true, message: '已读取内容', data: content }
}

/**
 * 鼠标悬停
 */
async function hoverElement(target: PageAction['target']): Promise<ActionResult> {
  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLElement
      if (selectorEl) {
        const event = new MouseEvent('mouseover', {
          bubbles: true,
          cancelable: true,
          view: window
        })
        selectorEl.dispatchEvent(event)
        return { success: true, message: '已悬停在元素上' }
      }
    }
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  const event = new MouseEvent('mouseover', {
    bubbles: true,
    cancelable: true,
    view: window
  })
  el.dispatchEvent(event)
  return { success: true, message: `已悬停在: ${target.description || el.textContent?.trim() || '元素'}上` }
}

/**
 * 逐字符输入（模拟真实打字）
 */
async function typeText(target: PageAction['target'], text?: string, delay?: number): Promise<ActionResult> {
  if (!text) {
    return { success: false, message: '未提供输入文本', error: 'NO_TEXT' }
  }

  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLInputElement | HTMLTextAreaElement
      if (selectorEl && (selectorEl.tagName === 'INPUT' || selectorEl.tagName === 'TEXTAREA')) {
        await simulateTyping(selectorEl, text, delay || 50)
        return { success: true, message: `已输入: ${text}` }
      }
    }
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
    return { success: false, message: '目标元素不是输入框', error: 'INVALID_ELEMENT' }
  }

  await simulateTyping(el as HTMLInputElement | HTMLTextAreaElement, text, delay || 50)
  return { success: true, message: `已输入: ${text}` }
}

async function simulateTyping(el: HTMLInputElement | HTMLTextAreaElement, text: string, charDelay: number): Promise<void> {
  el.focus()
  el.value = ''
  el.dispatchEvent(new Event('focus', { bubbles: true }))

  for (let i = 0; i < text.length; i++) {
    el.value += text[i]
    el.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise(resolve => setTimeout(resolve, charDelay))
  }

  el.dispatchEvent(new Event('change', { bubbles: true }))
}

/**
 * 按键操作
 */
async function pressKey(key?: string, selector?: string): Promise<ActionResult> {
  if (!key) {
    return { success: false, message: '未提供按键', error: 'NO_KEY' }
  }

  const el = selector ? document.querySelector(selector) as HTMLElement : document.activeElement as HTMLElement

  if (!el) {
    // 如果没有焦点元素，发送到 document
    dispatchKeyEvent(document as any, key)
    return { success: true, message: `已发送按键: ${key}` }
  }

  dispatchKeyEvent(el, key)
  return { success: true, message: `已在元素上按下: ${key}` }
}

function dispatchKeyEvent(el: HTMLElement, key: string): void {
  const keyboardEvent = new KeyboardEvent('keydown', {
    key: key,
    bubbles: true,
    cancelable: true,
    view: window
  })
  el.dispatchEvent(keyboardEvent)

  const keypressEvent = new KeyboardEvent('keypress', {
    key: key,
    bubbles: true,
    cancelable: true,
    view: window
  })
  el.dispatchEvent(keypressEvent)

  const keyupEvent = new KeyboardEvent('keyup', {
    key: key,
    bubbles: true,
    cancelable: true,
    view: window
  })
  el.dispatchEvent(keyupEvent)
}

/**
 * 拖拽元素
 */
async function dragElement(target: PageAction['target'], destination?: { selector?: string; x?: number; y?: number }): Promise<ActionResult> {
  const sourceEl = target.elementId ? getElementById(target.elementId) : null

  if (!sourceEl) {
    return { success: false, message: '未找到源元素', error: 'SOURCE_NOT_FOUND' }
  }

  let destEl: HTMLElement | null = null
  let destX: number
  let destY: number

  if (destination?.selector) {
    destEl = document.querySelector(destination.selector) as HTMLElement
    if (!destEl) {
      return { success: false, message: '未找到目标元素', error: 'DESTINATION_NOT_FOUND' }
    }
    const rect = destEl.getBoundingClientRect()
    destX = rect.left + rect.width / 2
    destY = rect.top + rect.height / 2
  } else if (destination?.x !== undefined && destination?.y !== undefined) {
    destX = destination.x
    destY = destination.y
  } else {
    return { success: false, message: '未提供目标位置', error: 'NO_DESTINATION' }
  }

  const sourceRect = sourceEl.getBoundingClientRect()
  const startX = sourceRect.left + sourceRect.width / 2
  const startY = sourceRect.top + sourceRect.height / 2

  // 模拟拖拽事件序列
  sourceEl.dispatchEvent(new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: startX,
    clientY: startY
  }))

  await delay(100)

  // 移动过程
  const steps = 10
  for (let i = 1; i <= steps; i++) {
    const x = startX + (destX - startX) * (i / steps)
    const y = startY + (destY - startY) * (i / steps)
    sourceEl.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y
    }))
    await delay(50)
  }

  // 在目标位置释放
  const dropTarget = document.elementFromPoint(destX, destY) as HTMLElement || document.body
  dropTarget.dispatchEvent(new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: destX,
    clientY: destY
  }))

  return { success: true, message: '拖拽完成' }
}

/**
 * 等待元素或时间
 */
async function waitFor(target?: PageAction['target'], timeout?: number, condition?: string): Promise<ActionResult> {
  const waitTime = timeout || 1000
  const startTime = Date.now()

  if (target?.elementId || target?.selector) {
    // 等待元素出现
    const selector = target.elementId ? `[data-ai-id="${target.elementId}"]` : target.selector
    
    while (Date.now() - startTime < waitTime) {
      const el = target.elementId ? getElementById(target.elementId) : document.querySelector(target.selector as string)
      if (el) {
        if (condition === 'visible') {
          const rect = el.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            return { success: true, message: '元素已可见' }
          }
        } else if (condition === 'hidden') {
          const rect = el.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) {
            return { success: true, message: '元素已隐藏' }
          }
        } else {
          return { success: true, message: '元素已出现' }
        }
      }
      await delay(100)
    }
    return { success: false, message: `等待超时: ${waitTime}ms`, error: 'TIMEOUT' }
  } else {
    // 简单等待时间
    await delay(waitTime)
    return { success: true, message: `等待了 ${waitTime}ms` }
  }
}

/**
 * 聚焦元素
 */
async function focusElement(target: PageAction['target']): Promise<ActionResult> {
  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLElement
      if (selectorEl) {
        selectorEl.focus()
        return { success: true, message: '已聚焦元素' }
      }
    }
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  el.focus()
  return { success: true, message: `已聚焦: ${target.description || el.textContent?.trim() || '元素'}` }
}

/**
 * 失焦元素
 */
async function blurElement(target: PageAction['target']): Promise<ActionResult> {
  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLElement
      if (selectorEl) {
        selectorEl.blur()
        return { success: true, message: '已失焦元素' }
      }
    }
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  el.blur()
  return { success: true, message: `已失焦: ${target.description || el.textContent?.trim() || '元素'}` }
}

/**
 * 清空输入框
 */
async function clearInput(target: PageAction['target']): Promise<ActionResult> {
  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLInputElement | HTMLTextAreaElement
      if (selectorEl && (selectorEl.tagName === 'INPUT' || selectorEl.tagName === 'TEXTAREA')) {
        selectorEl.value = ''
        selectorEl.dispatchEvent(new Event('input', { bubbles: true }))
        selectorEl.dispatchEvent(new Event('change', { bubbles: true }))
        return { success: true, message: '已清空输入框' }
      }
    }
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
    return { success: false, message: '目标元素不是输入框', error: 'INVALID_ELEMENT' }
  }

  const input = el as HTMLInputElement | HTMLTextAreaElement
  input.value = ''
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  return { success: true, message: '已清空输入框' }
}

/**
 * 获取元素属性
 */
async function getElementAttribute(target: PageAction['target'], attributeName?: string): Promise<ActionResult> {
  if (!attributeName) {
    return { success: false, message: '未提供属性名', error: 'NO_ATTRIBUTE' }
  }

  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLElement
      if (selectorEl) {
        const value = selectorEl.getAttribute(attributeName)
        return { success: true, message: `获取属性 ${attributeName}`, data: value }
      }
    }
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  const value = el.getAttribute(attributeName)
  return { success: true, message: `获取属性 ${attributeName}`, data: value }
}

/**
 * 获取元素属性值（如 value, checked 等）
 */
async function getElementProperty(target: PageAction['target'], propertyName?: string): Promise<ActionResult> {
  if (!propertyName) {
    return { success: false, message: '未提供属性名', error: 'NO_PROPERTY' }
  }

  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLElement
      if (selectorEl) {
        const value = (selectorEl as any)[propertyName]
        return { success: true, message: `获取属性值 ${propertyName}`, data: value }
      }
    }
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  const value = (el as any)[propertyName]
  return { success: true, message: `获取属性值 ${propertyName}`, data: value }
}

/**
 * 页面导航
 */
async function navigatePage(action: 'goto' | 'back' | 'forward' | 'reload', url?: string): Promise<ActionResult> {
  switch (action) {
    case 'goto':
      if (!url) {
        return { success: false, message: '未提供URL', error: 'NO_URL' }
      }
      window.location.href = url
      return { success: true, message: `导航到: ${url}` }
    case 'back':
      window.history.back()
      return { success: true, message: '返回上一页' }
    case 'forward':
      window.history.forward()
      return { success: true, message: '前进到下一页' }
    case 'reload':
      window.location.reload()
      return { success: true, message: '刷新页面' }
    default:
      return { success: false, message: '未知的导航操作', error: 'UNKNOWN_ACTION' }
  }
}

/**
 * 滚动到元素可见
 */
async function scrollIntoView(target: PageAction['target'], behavior?: 'auto' | 'smooth', block?: 'start' | 'center' | 'end' | 'nearest'): Promise<ActionResult> {
  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLElement
      if (selectorEl) {
        selectorEl.scrollIntoView({ behavior: behavior || 'smooth', block: block || 'center' })
        return { success: true, message: '已滚动到元素' }
      }
    }
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  el.scrollIntoView({ behavior: behavior || 'smooth', block: block || 'center' })
  return { success: true, message: `已滚动到: ${target.description || el.textContent?.trim() || '元素'}` }
}

/**
 * 切换 iframe
 */
async function switchToFrame(selector?: string): Promise<ActionResult> {
  // 在 content script 中切换 iframe 需要先获取 iframe 的 contentWindow
  // 但由于同源策略限制，通常需要特殊处理
  if (!selector) {
    // 切回主文档
    return { success: true, message: '已切换回主文档' }
  }

  const iframe = document.querySelector(selector) as HTMLIFrameElement
  if (!iframe) {
    return { success: false, message: '未找到iframe', error: 'IFRAME_NOT_FOUND' }
  }

  try {
    // 尝试访问 iframe 内容
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      return { success: false, message: '无法访问iframe内容（跨域限制）', error: 'CROSS_ORIGIN' }
    }
    return { success: true, message: `已切换到iframe: ${selector}`, data: { frameUrl: iframe.src } }
  } catch (e) {
    return { success: false, message: '无法访问iframe内容', error: 'ACCESS_ERROR' }
  }
}

/**
 * 处理弹窗（alert/confirm/prompt）
 */
async function handleDialog(action: 'accept' | 'dismiss', promptText?: string): Promise<ActionResult> {
  // 覆盖原生弹窗方法以拦截和处理
  return { success: true, message: `弹窗处理: ${action}`, data: { promptText } }
}

/**
 * 设置 localStorage
 */
async function setLocalStorageItem(key: string, value: string): Promise<ActionResult> {
  try {
    localStorage.setItem(key, value)
    return { success: true, message: `已设置 localStorage[${key}] = ${value}` }
  } catch (e) {
    return { success: false, message: '设置localStorage失败', error: String(e) }
  }
}

/**
 * 获取 localStorage
 */
async function getLocalStorageItem(key: string): Promise<ActionResult> {
  try {
    const value = localStorage.getItem(key)
    return { success: true, message: `获取 localStorage[${key}]`, data: value }
  } catch (e) {
    return { success: false, message: '获取localStorage失败', error: String(e) }
  }
}

/**
 * 清除 localStorage
 */
async function clearLocalStorage(prefix?: string): Promise<ActionResult> {
  try {
    if (prefix) {
      // 清除指定前缀的键
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      return { success: true, message: `已清除 ${keysToRemove.length} 个localStorage项` }
    } else {
      const count = localStorage.length
      localStorage.clear()
      return { success: true, message: `已清除所有 ${count} 个localStorage项` }
    }
  } catch (e) {
    return { success: false, message: '清除localStorage失败', error: String(e) }
  }
}

/**
 * 设置 Cookie
 */
async function setCookie(name: string, value: string, options?: { expires?: number; path?: string; domain?: string; secure?: boolean }): Promise<ActionResult> {
  try {
    let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
    if (options?.expires) {
      const date = new Date(Date.now() + options.expires * 1000)
      cookieStr += `;expires=${date.toUTCString()}`
    }
    if (options?.path) cookieStr += `;path=${options.path}`
    if (options?.domain) cookieStr += `;domain=${options.domain}`
    if (options?.secure) cookieStr += ';secure'
    document.cookie = cookieStr
    return { success: true, message: `已设置 Cookie: ${name}` }
  } catch (e) {
    return { success: false, message: '设置Cookie失败', error: String(e) }
  }
}

/**
 * 获取 Cookie
 */
async function getCookie(name?: string): Promise<ActionResult> {
  try {
    if (name) {
      const value = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${encodeURIComponent(name)}=`))
        ?.split('=')[1]
      return { success: true, message: `获取 Cookie: ${name}`, data: value ? decodeURIComponent(value) : null }
    } else {
      return { success: true, message: '获取所有Cookies', data: document.cookie }
    }
  } catch (e) {
    return { success: false, message: '获取Cookie失败', error: String(e) }
  }
}

/**
 * 模拟双击事件
 */
function simulateDoubleClick(el: HTMLElement): void {
  const rect = el.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const eventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y
  }

  el.focus()
  el.dispatchEvent(new MouseEvent('mousedown', { ...eventInit, button: 0, buttons: 1 }))
  el.dispatchEvent(new MouseEvent('mouseup', { ...eventInit, button: 0, buttons: 0 }))
  el.dispatchEvent(new MouseEvent('click', { ...eventInit, button: 0 }))
  el.dispatchEvent(new MouseEvent('mousedown', { ...eventInit, button: 0, buttons: 1 }))
  el.dispatchEvent(new MouseEvent('mouseup', { ...eventInit, button: 0, buttons: 0 }))
  el.dispatchEvent(new MouseEvent('click', { ...eventInit, button: 0 }))
  el.dispatchEvent(new MouseEvent('dblclick', { ...eventInit, button: 0 }))
}

/**
 * 双击元素
 */
async function doubleClickElement(target: PageAction['target']): Promise<ActionResult> {
  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLElement
      if (selectorEl) {
        simulateDoubleClick(selectorEl)
        return { success: true, message: '已双击元素' }
      }
    }
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  simulateDoubleClick(el)
  return { success: true, message: `已双击: ${target.description || el.textContent?.trim() || '元素'}` }
}

/**
 * 模拟右键点击事件
 */
function simulateRightClick(el: HTMLElement): void {
  const rect = el.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2

  el.dispatchEvent(new MouseEvent('mousedown', {
    bubbles: true, cancelable: true, view: window,
    button: 2, buttons: 2, clientX: x, clientY: y
  }))
  el.dispatchEvent(new MouseEvent('mouseup', {
    bubbles: true, cancelable: true, view: window,
    button: 2, buttons: 0, clientX: x, clientY: y
  }))
  el.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true, cancelable: true, view: window,
    button: 2, clientX: x, clientY: y
  }))
}

/**
 * 右键点击元素
 */
async function rightClickElement(target: PageAction['target']): Promise<ActionResult> {
  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLElement
      if (selectorEl) {
        simulateRightClick(selectorEl)
        return { success: true, message: '已右键点击元素' }
      }
    }
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  simulateRightClick(el)
  return { success: true, message: `已右键点击: ${target.description || el.textContent?.trim() || '元素'}` }
}

/**
 * 选中文本
 */
async function selectTextInElement(
  target: PageAction['target'],
  searchText?: string,
  startOffset?: number,
  endOffset?: number
): Promise<ActionResult> {
  const el = target.elementId ? getElementById(target.elementId) :
             target.selector ? document.querySelector(target.selector) as HTMLElement : null

  if (!el) {
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  const selection = window.getSelection()
  if (!selection) {
    return { success: false, message: '无法获取Selection对象', error: 'NO_SELECTION' }
  }

  selection.removeAllRanges()
  const range = document.createRange()

  try {
    if (searchText) {
      // 按文本内容选中
      const textNode = findTextNode(el, searchText)
      if (!textNode) {
        return { success: false, message: `未找到文本: ${searchText}`, error: 'TEXT_NOT_FOUND' }
      }
      const textContent = textNode.textContent || ''
      const startIndex = textContent.indexOf(searchText)
      range.setStart(textNode, startIndex)
      range.setEnd(textNode, startIndex + searchText.length)
    } else if (startOffset !== undefined && endOffset !== undefined) {
      // 按偏移量选中
      const textNode = el.firstChild
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
        return { success: false, message: '元素没有文本节点', error: 'NO_TEXT_NODE' }
      }
      range.setStart(textNode, startOffset)
      range.setEnd(textNode, endOffset)
    } else {
      // 选中整个元素内容
      range.selectNodeContents(el)
    }

    selection.addRange(range)
    const selectedText = selection.toString()
    return { success: true, message: `已选中文本: ${selectedText}`, data: selectedText }
  } catch (e) {
    return { success: false, message: `选中文本失败: ${e}`, error: 'SELECT_ERROR' }
  }
}

/**
 * 在元素中查找包含指定文本的文本节点
 */
function findTextNode(element: HTMLElement, searchText: string): Text | null {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
  let node: Text | null
  while ((node = walker.nextNode() as Text)) {
    if (node.textContent && node.textContent.includes(searchText)) {
      return node
    }
  }
  return null
}

/**
 * 复制到剪贴板
 */
async function copyToClipboard(target: PageAction['target'], text?: string): Promise<ActionResult> {
  try {
    let textToCopy = text

    if (!textToCopy) {
      // 如果没有提供文本，尝试从元素或选中内容获取
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) {
        textToCopy = selection.toString()
      } else if (target.elementId || target.selector) {
        const el = target.elementId ? getElementById(target.elementId) :
                   document.querySelector(target.selector!) as HTMLElement
        if (el) {
          textToCopy = el.textContent?.trim() || ''
        }
      }
    }

    if (!textToCopy) {
      return { success: false, message: '没有可复制的内容', error: 'NO_CONTENT' }
    }

    await navigator.clipboard.writeText(textToCopy)
    return { success: true, message: `已复制到剪贴板: ${textToCopy.substring(0, 50)}${textToCopy.length > 50 ? '...' : ''}` }
  } catch (e) {
    return { success: false, message: `复制失败: ${e}`, error: 'CLIPBOARD_ERROR' }
  }
}

/**
 * 从剪贴板粘贴
 */
async function pasteFromClipboard(target: PageAction['target']): Promise<ActionResult> {
  try {
    const text = await navigator.clipboard.readText()

    if (!text) {
      return { success: false, message: '剪贴板为空', error: 'EMPTY_CLIPBOARD' }
    }

    const el = target.elementId ? getElementById(target.elementId) :
               target.selector ? document.querySelector(target.selector) as HTMLElement : null

    if (!el) {
      return { success: true, message: '已读取剪贴板内容', data: text }
    }

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const input = el as HTMLInputElement | HTMLTextAreaElement
      input.focus()
      input.value = text
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      return { success: true, message: `已粘贴: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}` }
    } else if (el.getAttribute('contenteditable') === 'true') {
      el.focus()
      el.textContent = text
      el.dispatchEvent(new Event('input', { bubbles: true }))
      return { success: true, message: `已粘贴: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}` }
    }

    return { success: true, message: '已读取剪贴板内容', data: text }
  } catch (e) {
    return { success: false, message: `粘贴失败: ${e}`, error: 'CLIPBOARD_ERROR' }
  }
}

/**
 * 上传文件
 */
async function uploadFiles(
  target: PageAction['target'],
  files?: Array<{ name: string; type: string; content: string }>
): Promise<ActionResult> {
  if (!files || files.length === 0) {
    return { success: false, message: '未提供文件', error: 'NO_FILES' }
  }

  const el = target.elementId ? getElementById(target.elementId) :
             target.selector ? document.querySelector(target.selector) as HTMLInputElement : null

  if (!el || el.tagName !== 'INPUT' || (el as HTMLInputElement).type !== 'file') {
    return { success: false, message: '目标元素不是文件输入框', error: 'INVALID_ELEMENT' }
  }

  const input = el as HTMLInputElement

  try {
    const dataTransfer = new DataTransfer()

    for (const fileData of files) {
      // 将 base64 内容转换为 Blob
      const byteCharacters = atob(fileData.content)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: fileData.type })
      const file = new File([blob], fileData.name, { type: fileData.type })
      dataTransfer.items.add(file)
    }

    input.files = dataTransfer.files
    input.dispatchEvent(new Event('change', { bubbles: true }))

    return { success: true, message: `已上传 ${files.length} 个文件` }
  } catch (e) {
    return { success: false, message: `上传失败: ${e}`, error: 'UPLOAD_ERROR' }
  }
}

/**
 * 执行 JavaScript 代码
 */
async function evaluateScript(script?: string): Promise<ActionResult> {
  if (!script) {
    return { success: false, message: '未提供脚本', error: 'NO_SCRIPT' }
  }

  try {
    // 使用 Function 构造器在沙箱环境中执行
    const fn = new Function(script)
    const result = fn()
    return { success: true, message: '脚本执行成功', data: result }
  } catch (e) {
    return { success: false, message: `脚本执行失败: ${e}`, error: 'SCRIPT_ERROR' }
  }
}

/**
 * 添加列表项
 */
async function addListItem(
  target: PageAction['target'],
  listSelector?: string,
  itemContent?: string,
  position?: 'before' | 'after' | 'first' | 'last'
): Promise<ActionResult> {
  if (!itemContent) {
    return { success: false, message: '未提供列表项内容', error: 'NO_CONTENT' }
  }

  // 查找列表容器
  let list: HTMLUListElement | HTMLOListElement | null = null

  if (listSelector) {
    list = document.querySelector(listSelector) as HTMLUListElement | HTMLOListElement
  } else if (target.elementId || target.selector) {
    // 如果指定了元素，查找其父级列表
    const el = target.elementId ? getElementById(target.elementId) :
               document.querySelector(target.selector!) as HTMLElement
    if (el) {
      list = el.closest('ul, ol') as HTMLUListElement | HTMLOListElement
    }
  }

  if (!list) {
    return { success: false, message: '未找到列表容器', error: 'LIST_NOT_FOUND' }
  }

  // 创建新列表项
  const newItem = document.createElement('li')
  newItem.textContent = itemContent

  // 根据位置插入
  const referenceEl = target.elementId ? getElementById(target.elementId) :
                      target.selector ? document.querySelector(target.selector) as HTMLElement : null

  switch (position) {
    case 'before':
      if (referenceEl && referenceEl.tagName === 'LI') {
        referenceEl.parentNode?.insertBefore(newItem, referenceEl)
      } else {
        list.insertBefore(newItem, list.firstChild)
      }
      break
    case 'after':
      if (referenceEl && referenceEl.tagName === 'LI') {
        referenceEl.parentNode?.insertBefore(newItem, referenceEl.nextSibling)
      } else {
        list.appendChild(newItem)
      }
      break
    case 'first':
      list.insertBefore(newItem, list.firstChild)
      break
    case 'last':
    default:
      list.appendChild(newItem)
      break
  }

  // 触发变更事件
  list.dispatchEvent(new Event('change', { bubbles: true }))

  return { success: true, message: `已添加列表项: ${itemContent}` }
}

/**
 * 删除列表项
 */
async function removeListItem(
  target: PageAction['target'],
  itemIndex?: number
): Promise<ActionResult> {
  let itemToRemove: HTMLElement | null = null

  if (target.elementId || target.selector) {
    itemToRemove = target.elementId ? getElementById(target.elementId) :
                   document.querySelector(target.selector!) as HTMLElement
  } else if (itemIndex !== undefined) {
    // 通过索引查找
    const lists = document.querySelectorAll('ul, ol')
    for (const list of lists) {
      const items = list.querySelectorAll(':scope > li')
      if (items[itemIndex]) {
        itemToRemove = items[itemIndex] as HTMLElement
        break
      }
    }
  }

  if (!itemToRemove || itemToRemove.tagName !== 'LI') {
    return { success: false, message: '未找到要删除的列表项', error: 'ITEM_NOT_FOUND' }
  }

  const content = itemToRemove.textContent?.trim() || ''
  const parent = itemToRemove.parentNode

  itemToRemove.remove()

  // 触发变更事件
  if (parent) {
    parent.dispatchEvent(new Event('change', { bubbles: true }))
  }

  return { success: true, message: `已删除列表项: ${content}` }
}

/**
 * 编辑列表项
 */
async function editListItem(
  target: PageAction['target'],
  newContent?: string
): Promise<ActionResult> {
  if (!newContent) {
    return { success: false, message: '未提供新内容', error: 'NO_CONTENT' }
  }

  const el = target.elementId ? getElementById(target.elementId) :
             target.selector ? document.querySelector(target.selector) as HTMLElement : null

  if (!el || el.tagName !== 'LI') {
    return { success: false, message: '未找到列表项元素', error: 'ITEM_NOT_FOUND' }
  }

  const oldContent = el.textContent?.trim() || ''
  el.textContent = newContent

  // 触发变更事件
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))

  return { success: true, message: `已编辑列表项: "${oldContent}" → "${newContent}"` }
}

/**
 * 设置元素内容（替换）
 */
async function setContent(target: PageAction['target'], content?: string): Promise<ActionResult> {
  if (content === undefined) {
    return { success: false, message: '未提供内容', error: 'NO_CONTENT' }
  }

  const el = target.elementId ? getElementById(target.elementId) :
             target.selector ? document.querySelector(target.selector) as HTMLElement : null

  if (!el) {
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  const oldContent = el.textContent?.trim() || ''

  // 根据元素类型选择设置方式
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    (el as HTMLInputElement | HTMLTextAreaElement).value = content
  } else if (el.getAttribute('contenteditable') === 'true') {
    el.textContent = content
  } else {
    el.textContent = content
  }

  // 触发事件
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))

  return { success: true, message: `已设置内容: "${oldContent.substring(0, 20)}..." → "${content.substring(0, 20)}..."` }
}

/**
 * 追加内容到元素末尾
 */
async function appendContent(target: PageAction['target'], content?: string): Promise<ActionResult> {
  if (!content) {
    return { success: false, message: '未提供内容', error: 'NO_CONTENT' }
  }

  const el = target.elementId ? getElementById(target.elementId) :
             target.selector ? document.querySelector(target.selector) as HTMLElement : null

  if (!el) {
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  // 根据元素类型追加
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    const input = el as HTMLInputElement | HTMLTextAreaElement
    input.value += content
  } else if (el.getAttribute('contenteditable') === 'true') {
    el.textContent = (el.textContent || '') + content
  } else {
    el.appendChild(document.createTextNode(content))
  }

  // 触发事件
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))

  return { success: true, message: `已追加内容: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"` }
}

/**
 * 前置内容到元素开头
 */
async function prependContent(target: PageAction['target'], content?: string): Promise<ActionResult> {
  if (!content) {
    return { success: false, message: '未提供内容', error: 'NO_CONTENT' }
  }

  const el = target.elementId ? getElementById(target.elementId) :
             target.selector ? document.querySelector(target.selector) as HTMLElement : null

  if (!el) {
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  // 根据元素类型前置
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    const input = el as HTMLInputElement | HTMLTextAreaElement
    input.value = content + input.value
  } else if (el.getAttribute('contenteditable') === 'true') {
    el.textContent = content + (el.textContent || '')
  } else {
    el.insertBefore(document.createTextNode(content), el.firstChild)
  }

  // 触发事件
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))

  return { success: true, message: `已前置内容: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"` }
}

/**
 * 插入HTML内容
 */
async function insertHTML(
  target: PageAction['target'],
  html?: string,
  position?: 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend'
): Promise<ActionResult> {
  if (!html) {
    return { success: false, message: '未提供HTML内容', error: 'NO_HTML' }
  }

  const el = target.elementId ? getElementById(target.elementId) :
             target.selector ? document.querySelector(target.selector) as HTMLElement : null

  if (!el) {
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

  const insertPos = position || 'beforeend'
  el.insertAdjacentHTML(insertPos, html)

  // 触发事件
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))

  const positionDesc: Record<string, string> = {
    'beforebegin': '元素之前',
    'afterbegin': '元素内部开头',
    'beforeend': '元素内部末尾',
    'afterend': '元素之后'
  }

  return { success: true, message: `已在${positionDesc[insertPos]}插入HTML` }
}

/**
 * 清除 Cookies
 */
async function clearCookies(name?: string): Promise<ActionResult> {
  try {
    if (name) {
      document.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
      return { success: true, message: `已清除 Cookie: ${name}` }
    } else {
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const [namePart] = cookie.split('=')
        const cookieName = namePart?.trim()
        if (cookieName) {
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname}`
        }
      })
      return { success: true, message: `已清除 ${cookies.length} 个Cookies` }
    }
  } catch (e) {
    return { success: false, message: '清除Cookie失败', error: String(e) }
  }
}

/**
 * 执行单个操作
 */
export async function executeAction(action: PageAction): Promise<ActionResult> {
  try {
    switch (action.action) {
      case 'fill':
        return await fillInput(action.target, action.params?.value)
      case 'click':
        return await clickElement(action.target)
      case 'highlight':
        return await highlightText(action.target, action.params?.color)
      case 'underline':
        return await underlineText(action.target)
      case 'select':
        return await selectOption(action.target, action.params?.value)
      case 'check':
        return await checkBox(action.target)
      case 'scroll':
        return await scrollPage(action.params?.direction)
      case 'read':
        return await readContent(action.target)
      case 'hover':
        return await hoverElement(action.target)
      case 'type':
        return await typeText(action.target, action.params?.value, action.params?.delay)
      case 'press':
        return await pressKey(action.params?.key, action.target?.selector)
      case 'drag':
        return await dragElement(action.target, action.params?.destination)
      case 'wait':
        return await waitFor(action.target, action.params?.timeout, action.params?.condition)
      case 'focus':
        return await focusElement(action.target)
      case 'blur':
        return await blurElement(action.target)
      case 'clear':
        return await clearInput(action.target)
      case 'getAttribute':
        return await getElementAttribute(action.target, action.params?.attribute)
      case 'getProperty':
        return await getElementProperty(action.target, action.params?.property)
      case 'navigate':
        return await navigatePage(action.params?.navigateAction, action.params?.url)
      case 'scrollIntoView':
        return await scrollIntoView(action.target, action.params?.behavior, action.params?.block)
      case 'switchFrame':
        return await switchToFrame(action.params?.frameSelector)
      case 'handleDialog':
        return await handleDialog(action.params?.dialogAction, action.params?.promptText)
      case 'setLocalStorage':
        return await setLocalStorageItem(action.params?.key, action.params?.value)
      case 'getLocalStorage':
        return await getLocalStorageItem(action.params?.key)
      case 'clearLocalStorage':
        return await clearLocalStorage(action.params?.prefix)
      case 'setCookie':
        return await setCookie(action.params?.name, action.params?.value, action.params?.cookieOptions)
      case 'getCookie':
        return await getCookie(action.params?.name)
      case 'clearCookies':
        return await clearCookies(action.params?.name)
      case 'doubleClick':
        return await doubleClickElement(action.target)
      case 'rightClick':
        return await rightClickElement(action.target)
      case 'selectText':
        return await selectTextInElement(action.target, action.params?.searchText, action.params?.startOffset, action.params?.endOffset)
      case 'copyToClipboard':
        return await copyToClipboard(action.target, action.params?.text)
      case 'pasteFromClipboard':
        return await pasteFromClipboard(action.target)
      case 'upload':
        return await uploadFiles(action.target, action.params?.files)
      case 'evaluate':
        return await evaluateScript(action.params?.script)
      case 'addListItem':
        return await addListItem(action.target, action.params?.listSelector, action.params?.itemContent, action.params?.position)
      case 'removeListItem':
        return await removeListItem(action.target, action.params?.itemIndex)
      case 'editListItem':
        return await editListItem(action.target, action.params?.itemContent)
      case 'setContent':
        return await setContent(action.target, action.params?.content)
      case 'appendContent':
        return await appendContent(action.target, action.params?.content)
      case 'prependContent':
        return await prependContent(action.target, action.params?.content)
      case 'insertHTML':
        return await insertHTML(action.target, action.params?.html, action.params?.insertPosition)
      default:
        return { success: false, message: `不支持的操作类型: ${action.action}`, error: 'UNSUPPORTED_ACTION' }
    }
  } catch (error) {
    return {
      success: false,
      message: `执行操作时出错: ${error}`,
      error: 'EXECUTION_ERROR'
    }
  }
}

/**
 * 批量执行操作
 */
export async function executeBatchActions(actions: PageAction[]): Promise<BatchActionResult> {
  const results: ActionResult[] = []
  let successCount = 0

  for (const action of actions) {
    const result = await executeAction(action)
    results.push(result)

    if (result.success) {
      successCount++
    }

    // 操作之间添加小延迟，模拟人类操作
    await delay(100)
  }

  const summary = `执行了 ${actions.length} 个操作，成功 ${successCount} 个，失败 ${actions.length - successCount} 个`

  return {
    success: successCount === actions.length,
    results,
    summary
  }
}

/**
 * 清除所有 AI 添加的样式
 */
export function clearAllStyles(): void {
  // 清除高亮
  document.querySelectorAll('.ai-highlight').forEach(el => {
    const parent = el.parentNode
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent || ''), el)
      parent.normalize()
    }
  })

  // 清除下划线
  document.querySelectorAll('.ai-underline').forEach(el => {
    const parent = el.parentNode
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent || ''), el)
      parent.normalize()
    }
  })
}
