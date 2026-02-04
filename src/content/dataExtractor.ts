// 数据提取器 - 从页面提取结构化数据

export interface ExtractedData {
  type: 'table' | 'list' | 'cards' | 'form' | 'mixed'
  data: any[]
  fields?: string[]
  count: number
}

/**
 * 提取页面数据
 */
export function extractData(params: {
  selector?: string
  dataType?: 'table' | 'list' | 'cards' | 'form' | 'all'
  fields?: string[]
}): ExtractedData {
  const { selector, dataType = 'all', fields } = params

  // 如果指定了选择器，只在该区域内提取
  const rootElement = selector ? document.querySelector(selector) : document.body
  if (!rootElement) {
    return { type: 'mixed', data: [], count: 0 }
  }

  const results: ExtractedData[] = []

  // 提取表格数据
  if (dataType === 'all' || dataType === 'table') {
    const tableData = extractTableData(rootElement, fields)
    if (tableData.count > 0) {
      results.push(tableData)
    }
  }

  // 提取列表数据
  if (dataType === 'all' || dataType === 'list') {
    const listData = extractListData(rootElement)
    if (listData.count > 0) {
      results.push(listData)
    }
  }

  // 提取卡片数据
  if (dataType === 'all' || dataType === 'cards') {
    const cardsData = extractCardsData(rootElement)
    if (cardsData.count > 0) {
      results.push(cardsData)
    }
  }

  // 提取表单数据
  if (dataType === 'all' || dataType === 'form') {
    const formData = extractFormData(rootElement)
    if (formData.count > 0) {
      results.push(formData)
    }
  }

  // 合并结果
  if (results.length === 0) {
    return { type: 'mixed', data: [], count: 0 }
  }

  if (results.length === 1) {
    return results[0]
  }

  // 多个类型，合并
  return {
    type: 'mixed',
    data: results.flatMap(r => r.data),
    count: results.reduce((sum, r) => sum + r.count, 0)
  }
}

/**
 * 提取表格数据
 */
function extractTableData(root: Element, fields?: string[]): ExtractedData {
  const tables = root.querySelectorAll('table')
  const allData: any[] = []

  tables.forEach(table => {
    const rows = Array.from(table.querySelectorAll('tr'))
    if (rows.length === 0) return

    // 提取表头
    const headerRow = table.querySelector('thead tr') || rows[0]
    const headers = Array.from(headerRow.querySelectorAll('th, td')).map(
      th => th.textContent?.trim() || ''
    )

    if (headers.length === 0) return

    // 确定要提取的字段
    const targetFields = fields || headers

    // 提取数据行
    const dataRows = table.querySelector('thead') 
      ? rows.slice(1) 
      : rows.slice(1)

    dataRows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td, th'))
      if (cells.length === 0) return

      const rowData: Record<string, any> = {}
      headers.forEach((header, index) => {
        if (targetFields.includes(header) && cells[index]) {
          rowData[header] = cells[index].textContent?.trim() || ''
          
          // 提取链接
          const link = cells[index].querySelector('a')
          if (link) {
            rowData[`${header}_link`] = link.href
          }
          
          // 提取图片
          const img = cells[index].querySelector('img')
          if (img) {
            rowData[`${header}_image`] = img.src
          }
        }
      })

      if (Object.keys(rowData).length > 0) {
        allData.push(rowData)
      }
    })
  })

  return {
    type: 'table',
    data: allData,
    fields: fields || Array.from(new Set(allData.flatMap(d => Object.keys(d)))),
    count: allData.length
  }
}

/**
 * 提取列表数据
 */
function extractListData(root: Element): ExtractedData {
  const lists = root.querySelectorAll('ul, ol, [role="list"]')
  const allData: any[] = []

  lists.forEach(list => {
    const items = Array.from(list.querySelectorAll(':scope > li, :scope > [role="listitem"]'))
    
    items.forEach((item, index) => {
      const itemData: Record<string, any> = {
        index: index + 1,
        text: item.textContent?.trim() || ''
      }

      // 提取链接
      const link = item.querySelector('a')
      if (link) {
        itemData.link = link.href
        itemData.linkText = link.textContent?.trim()
      }

      // 提取图片
      const img = item.querySelector('img')
      if (img) {
        itemData.image = img.src
        itemData.imageAlt = img.alt
      }

      // 提取嵌套列表
      const nestedList = item.querySelector('ul, ol')
      if (nestedList) {
        itemData.children = extractListData(nestedList).data
      }

      allData.push(itemData)
    })
  })

  return {
    type: 'list',
    data: allData,
    count: allData.length
  }
}

/**
 * 提取卡片数据（常见于商品列表、文章列表等）
 */
function extractCardsData(root: Element): ExtractedData {
  // 识别卡片容器（常见的卡片类名模式）
  const cardSelectors = [
    '.card',
    '.product',
    '.item',
    '[class*="card"]',
    '[class*="Card"]',
    '[class*="product"]',
    '[class*="Product"]',
    '[class*="item"]',
    '[class*="Item"]'
  ]

  const allCards: Element[] = []
  
  cardSelectors.forEach(selector => {
    const cards = root.querySelectorAll(selector)
    cards.forEach(card => {
      // 避免重复
      if (!allCards.includes(card)) {
        allCards.push(card)
      }
    })
  })

  // 如果没有找到明确的卡片，尝试识别重复的结构
  if (allCards.length === 0) {
    const potentialCards = identifyCardStructures(root)
    allCards.push(...potentialCards)
  }

  const cardData = allCards.map(card => {
    const data: Record<string, any> = {}

    // 提取标题
    const title = card.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="Title"], .title')
    if (title) {
      data.title = title.textContent?.trim()
    }

    // 提取描述
    const description = card.querySelector('[class*="desc"], [class*="Desc"], .description, p')
    if (description) {
      data.description = description.textContent?.trim()
    }

    // 提取图片
    const img = card.querySelector('img')
    if (img) {
      data.image = img.src
      data.imageAlt = img.alt
    }

    // 提取链接
    const link = card.querySelector('a')
    if (link) {
      data.link = link.href
    }

    // 提取价格（常见模式）
    const price = card.textContent?.match(/[\$¥€£]\s*[\d,]+\.?\d*/)
    if (price) {
      data.price = price[0]
    }

    // 提取所有文本
    data.text = card.textContent?.trim()

    return data
  })

  return {
    type: 'cards',
    data: cardData,
    count: cardData.length
  }
}

/**
 * 识别卡片结构（通过分析DOM结构）
 */
function identifyCardStructures(root: Element): Element[] {
  const candidates: Element[] = []

  // 查找具有相似结构的兄弟元素
  const children = Array.from(root.children)
  
  // 如果多个子元素具有相似的结构，可能是卡片
  if (children.length >= 2) {
    const firstChild = children[0]
    const firstStructure = getElementStructure(firstChild)
    
    const similarChildren = children.filter(child => {
      const structure = getElementStructure(child)
      return structureSimilarity(firstStructure, structure) > 0.7
    })

    if (similarChildren.length >= 2) {
      candidates.push(...similarChildren)
    }
  }

  return candidates
}

/**
 * 获取元素结构签名（用于比较相似性）
 */
function getElementStructure(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const children = Array.from(el.children).map(c => c.tagName.toLowerCase()).join(',')
  return `${tag}[${children}]`
}

/**
 * 计算结构相似度
 */
function structureSimilarity(struct1: string, struct2: string): number {
  if (struct1 === struct2) return 1
  // 简单的相似度计算
  const parts1 = struct1.split(/[\[\],]/)
  const parts2 = struct2.split(/[\[\],]/)
  const common = parts1.filter(p => parts2.includes(p)).length
  return common / Math.max(parts1.length, parts2.length)
}

/**
 * 提取表单数据
 */
function extractFormData(root: Element): ExtractedData {
  const forms = root.querySelectorAll('form')
  const formData: any[] = []

  forms.forEach(form => {
    const data: Record<string, any> = {
      action: form.action || '',
      method: form.method || 'get'
    }

    // 提取表单字段
    const fields: Record<string, any> = {}
    
    // 输入框
    form.querySelectorAll('input, textarea, select').forEach(input => {
      const name = (input as HTMLInputElement).name
      const type = (input as HTMLInputElement).type || 'text'
      const value = (input as HTMLInputElement).value
      const placeholder = (input as HTMLInputElement).placeholder
      const label = getFieldLabel(input as HTMLElement)

      if (name) {
        fields[name] = {
          type,
          value: type === 'password' ? undefined : value,
          placeholder,
          label
        }
      } else if (label) {
        fields[label] = {
          type,
          value: type === 'password' ? undefined : value,
          placeholder
        }
      }
    })

    data.fields = fields
    formData.push(data)
  })

  return {
    type: 'form',
    data: formData,
    count: formData.length
  }
}

/**
 * 获取字段的标签文本
 */
function getFieldLabel(field: HTMLElement): string | undefined {
  // 通过 for 属性
  if (field.id) {
    const label = document.querySelector(`label[for="${field.id}"]`)
    if (label) return label.textContent?.trim()
  }

  // 查找父级 label
  const parentLabel = field.closest('label')
  if (parentLabel) {
    const clone = parentLabel.cloneNode(true) as HTMLElement
    clone.querySelectorAll('input, textarea, select').forEach(el => el.remove())
    return clone.textContent?.trim()
  }

  // 查找前面的 label
  let prev = field.previousElementSibling
  while (prev) {
    if (prev.tagName === 'LABEL') {
      return prev.textContent?.trim()
    }
    prev = prev.previousElementSibling
  }

  return undefined
}
