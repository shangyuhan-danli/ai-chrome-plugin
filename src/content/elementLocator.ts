// 改进的元素定位器 - 使用更稳定的定位策略
// 参考 Playwright 最佳实践：优先使用 role、label、text 等用户可见属性

import type { PageElement } from '../utils/pageActionTypes'

/**
 * 元素定位策略 - 按优先级排序
 */
export interface LocatorStrategy {
  // 优先级：role > label > text > placeholder > aria-label > name > selector
  priority: number
  type: 'role' | 'label' | 'text' | 'placeholder' | 'aria-label' | 'name' | 'selector'
  value: string
}

/**
 * 生成元素的稳定定位器（不依赖elementId）
 * 这些定位器可以在页面刷新后仍然有效
 */
export function generateStableLocators(element: PageElement, originalEl: HTMLElement): LocatorStrategy[] {
  const locators: LocatorStrategy[] = []

  // 1. Role-based locator (最高优先级)
  const role = originalEl.getAttribute('role')
  if (role) {
    locators.push({
      priority: 10,
      type: 'role',
      value: role
    })
  }

  // 2. Label-based locator (表单元素)
  if (element.label) {
    locators.push({
      priority: 9,
      type: 'label',
      value: element.label
    })
  }

  // 3. Text-based locator (按钮、链接等)
  if (element.text && element.text.length < 100) {
    locators.push({
      priority: 8,
      type: 'text',
      value: element.text
    })
  }

  // 4. Placeholder locator (输入框)
  if (element.placeholder) {
    locators.push({
      priority: 7,
      type: 'placeholder',
      value: element.placeholder
    })
  }

  // 5. Aria-label locator
  if (element.ariaLabel) {
    locators.push({
      priority: 6,
      type: 'aria-label',
      value: element.ariaLabel
    })
  }

  // 6. Name attribute locator
  if (element.name) {
    locators.push({
      priority: 5,
      type: 'name',
      value: element.name
    })
  }

  // 7. 生成稳定的CSS选择器（基于语义属性，而非类名）
  const stableSelector = generateStableSelector(originalEl)
  if (stableSelector) {
    locators.push({
      priority: 4,
      type: 'selector',
      value: stableSelector
    })
  }

  return locators.sort((a, b) => b.priority - a.priority)
}

/**
 * 生成稳定的CSS选择器（避免使用类名等易变属性）
 */
function generateStableSelector(el: HTMLElement): string | null {
  const parts: string[] = []

  // 优先使用语义属性
  if (el.id && !el.id.match(/^(id|uid|uuid|random|temp|tmp)/i)) {
    return `#${el.id}`
  }

  // 使用标签名 + 属性组合
  const tag = el.tagName.toLowerCase()
  
  // 如果有 name 属性
  if (el.getAttribute('name')) {
    parts.push(`${tag}[name="${el.getAttribute('name')}"]`)
  }

  // 如果有 type 属性（input）
  if (el.getAttribute('type')) {
    parts.push(`${tag}[type="${el.getAttribute('type')}"]`)
  }

  // 如果有 data-testid 或 data-id（测试友好的属性）
  if (el.getAttribute('data-testid')) {
    return `${tag}[data-testid="${el.getAttribute('data-testid')}"]`
  }
  if (el.getAttribute('data-id')) {
    return `${tag}[data-id="${el.getAttribute('data-id')}"]`
  }

  // 如果有 role
  if (el.getAttribute('role')) {
    parts.push(`${tag}[role="${el.getAttribute('role')}"]`)
  }

  // 如果有 aria-label
  if (el.getAttribute('aria-label')) {
    parts.push(`${tag}[aria-label="${el.getAttribute('aria-label')}"]`)
  }

  // 组合选择器
  if (parts.length > 0) {
    return parts.join('')
  }

  // 最后尝试：使用父级上下文 + 标签
  const parent = el.parentElement
  if (parent) {
    const parentTag = parent.tagName.toLowerCase()
    if (parentTag === 'form' && parent.id) {
      return `form#${parent.id} > ${tag}`
    }
    if (parentTag === 'fieldset' && parent.querySelector('legend')) {
      const legend = parent.querySelector('legend')?.textContent?.trim()
      if (legend) {
        return `fieldset:has(legend:contains("${legend}")) > ${tag}`
      }
    }
  }

  return null
}

/**
 * 使用定位器查找元素
 */
export function locateElementByStrategy(strategy: LocatorStrategy): HTMLElement | null {
  try {
    switch (strategy.type) {
      case 'role':
        // 查找具有指定 role 的元素
        const roleElements = Array.from(document.querySelectorAll(`[role="${strategy.value}"]`))
        if (roleElements.length === 1) {
          return roleElements[0] as HTMLElement
        }
        // 如果有多个，尝试结合其他属性
        break

      case 'label':
        // 通过 label 查找关联的 input/textarea/select
        const labels = Array.from(document.querySelectorAll('label'))
        for (const label of labels) {
          if (label.textContent?.trim() === strategy.value) {
            const forAttr = label.getAttribute('for')
            if (forAttr) {
              const el = document.getElementById(forAttr)
              if (el) return el as HTMLElement
            }
            // 如果没有 for，查找 label 内的元素
            const input = label.querySelector('input, textarea, select')
            if (input) return input as HTMLElement
          }
        }
        break

      case 'text':
        // 通过文本内容查找（按钮、链接等）
        const allElements = Array.from(document.querySelectorAll('button, a, [role="button"], [role="link"]'))
        for (const el of allElements) {
          const text = el.textContent?.trim()
          if (text === strategy.value || text?.includes(strategy.value)) {
            return el as HTMLElement
          }
        }
        break

      case 'placeholder':
        // 通过 placeholder 查找输入框
        const inputs = Array.from(document.querySelectorAll('input, textarea'))
        for (const input of inputs) {
          if ((input as HTMLInputElement).placeholder === strategy.value) {
            return input as HTMLElement
          }
        }
        break

      case 'aria-label':
        // 通过 aria-label 查找
        const ariaElements = Array.from(document.querySelectorAll(`[aria-label="${strategy.value}"]`))
        if (ariaElements.length === 1) {
          return ariaElements[0] as HTMLElement
        }
        break

      case 'name':
        // 通过 name 属性查找
        const nameElements = Array.from(document.querySelectorAll(`[name="${strategy.value}"]`))
        if (nameElements.length === 1) {
          return nameElements[0] as HTMLElement
        }
        break

      case 'selector':
        // 使用 CSS 选择器
        const el = document.querySelector(strategy.value)
        if (el) return el as HTMLElement
        break
    }
  } catch (e) {
    console.warn(`定位元素失败 (${strategy.type}):`, e)
  }

  return null
}

/**
 * 智能查找元素 - 尝试多种策略直到找到
 */
export function smartLocateElement(
  element: PageElement,
  originalEl: HTMLElement | null,
  userDescription?: string
): HTMLElement | null {
  // 如果 originalEl 仍然存在且有效，直接返回
  if (originalEl && document.contains(originalEl)) {
    return originalEl
  }

  // 生成定位策略列表
  const locators = originalEl
    ? generateStableLocators(element, originalEl)
    : []

  // 如果用户提供了描述，尝试基于描述查找
  if (userDescription) {
    const descLocator = locateByDescription(userDescription, element.tag)
    if (descLocator) {
      return descLocator
    }
  }

  // 按优先级尝试每个定位器
  for (const locator of locators) {
    const found = locateElementByStrategy(locator)
    if (found) {
      return found
    }
  }

  return null
}

/**
 * 基于用户描述查找元素（语义匹配）
 */
function locateByDescription(description: string, tag: string): HTMLElement | null {
  const keywords = extractKeywords(description)
  const candidates: Array<{ el: HTMLElement; score: number }> = []

  // 收集候选元素
  const selectors = tag === 'input' || tag === 'textarea'
    ? 'input, textarea'
    : tag === 'button'
    ? 'button, [role="button"], input[type="button"], input[type="submit"]'
    : tag === 'a'
    ? 'a, [role="link"]'
    : tag === 'select'
    ? 'select'
    : `${tag}, [role="${tag}"]`

  const elements = Array.from(document.querySelectorAll(selectors)) as HTMLElement[]

  for (const el of elements) {
    if (!isElementVisible(el)) continue

    let score = 0
    const text = [
      el.textContent?.trim(),
      (el as HTMLInputElement).placeholder,
      el.getAttribute('aria-label'),
      (el as HTMLInputElement).name,
      getAssociatedLabel(el)?.textContent?.trim()
    ].filter(Boolean).join(' ').toLowerCase()

    // 关键词匹配
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 10
      }
    }

    // 位置权重（视口内优先）
    const rect = el.getBoundingClientRect()
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
      score += 5
    }

    if (score > 0) {
      candidates.push({ el, score })
    }
  }

  // 返回得分最高的元素
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score)
    return candidates[0].el
  }

  return null
}

/**
 * 提取关键词
 */
function extractKeywords(text: string): string[] {
  // 移除常见停用词
  const stopWords = ['帮我', '请', '把', '将', '给', '在', '到', '的', '和', '然后', '并且', '点击', '输入', '填写']
  let cleaned = text
  stopWords.forEach(word => {
    cleaned = cleaned.replace(new RegExp(word, 'g'), ' ')
  })
  return cleaned.split(/[\s,，。.!！?？、]+/).filter(w => w.length > 1)
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
  return rect.width > 0 && rect.height > 0
}

/**
 * 获取关联的 label
 */
function getAssociatedLabel(el: HTMLElement): HTMLElement | null {
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`)
    if (label) return label as HTMLElement
  }
  const parentLabel = el.closest('label')
  return parentLabel as HTMLElement | null
}

/**
 * 验证元素是否匹配预期
 */
export function validateElement(
  el: HTMLElement,
  expectedElement: PageElement
): { valid: boolean; confidence: number; reason?: string } {
  let confidence = 0
  const checks: string[] = []

  // 检查标签名
  if (el.tagName.toLowerCase() === expectedElement.tag) {
    confidence += 20
    checks.push('标签匹配')
  }

  // 检查类型（input）
  if (expectedElement.type && (el as HTMLInputElement).type === expectedElement.type) {
    confidence += 15
    checks.push('类型匹配')
  }

  // 检查文本内容
  if (expectedElement.text && el.textContent?.trim().includes(expectedElement.text)) {
    confidence += 20
    checks.push('文本匹配')
  }

  // 检查 placeholder
  if (expectedElement.placeholder && (el as HTMLInputElement).placeholder === expectedElement.placeholder) {
    confidence += 15
    checks.push('占位符匹配')
  }

  // 检查 label
  if (expectedElement.label) {
    const label = getAssociatedLabel(el)
    if (label?.textContent?.trim().includes(expectedElement.label)) {
      confidence += 15
      checks.push('标签文本匹配')
    }
  }

  // 检查 aria-label
  if (expectedElement.ariaLabel && el.getAttribute('aria-label') === expectedElement.ariaLabel) {
    confidence += 10
    checks.push('无障碍标签匹配')
  }

  // 检查位置（如果位置接近，可能是同一个元素）
  const rect = el.getBoundingClientRect()
  const expectedRect = expectedElement.rect
  const distance = Math.sqrt(
    Math.pow(rect.x - expectedRect.x, 2) + Math.pow(rect.y - expectedRect.y, 2)
  )
  if (distance < 50) {
    confidence += 5
    checks.push('位置接近')
  }

  return {
    valid: confidence >= 50,
    confidence,
    reason: checks.join(', ')
  }
}
