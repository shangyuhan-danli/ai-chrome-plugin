// 操作执行器 - 执行具体的 DOM 操作
import type { PageAction, ActionResult, BatchActionResult } from '../utils/pageActionTypes'
import { getElementById } from './elementCollector'

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
 * 填充输入框
 */
async function fillInput(target: PageAction['target'], value?: string): Promise<ActionResult> {
  if (!value) {
    return { success: false, message: '未提供填充值', error: 'NO_VALUE' }
  }

  const el = target.elementId ? getElementById(target.elementId) : null

  if (!el) {
    // 尝试使用 selector
    if (target.selector) {
      const selectorEl = document.querySelector(target.selector) as HTMLElement
      if (selectorEl && (selectorEl.tagName === 'INPUT' || selectorEl.tagName === 'TEXTAREA')) {
        simulateInput(selectorEl as HTMLInputElement | HTMLTextAreaElement, value)
        return { success: true, message: `已填充: ${value}` }
      }
    }
    return { success: false, message: '未找到目标元素', error: 'ELEMENT_NOT_FOUND' }
  }

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

  simulateInput(el as HTMLInputElement | HTMLTextAreaElement, value)
  return { success: true, message: `已填充: ${value}` }
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
