// 页面总结器 - 提取页面主要内容
// 使用 Mozilla Readability 算法提取页面主要内容

import { Readability } from '@mozilla/readability'

export interface PageSummary {
  title: string
  content: string
  excerpt: string
  byline?: string
  length: number
  siteName?: string
}

/**
 * 提取页面主要内容
 */
export function summarizePage(): PageSummary | null {
  try {
    // 如果 Readability 可用，使用它
    if (Readability) {
      // 克隆文档以避免修改原始 DOM
      const documentClone = document.cloneNode(true) as Document
      
      // 使用 Readability 提取内容
      const reader = new Readability(documentClone, {
        debug: false,
        maxElemsToDivideToDivs: 5,
        nbTopCandidates: 5,
        charThreshold: 500,
        classesToPreserve: ['ai-chat-container', 'ai-highlight', 'ai-underline']
      })

      const article = reader.parse()

      if (article) {
        return {
          title: article.title || document.title,
          content: article.textContent || article.content || '',
          excerpt: article.excerpt || '',
          byline: article.byline || undefined,
          length: article.length || 0,
          siteName: article.siteName || undefined
        }
      }
    }
    
    // 使用 fallback 方法
    return fallbackSummarize()
  } catch (error) {
    console.error('页面总结失败:', error)
    return fallbackSummarize()
  }
}

/**
 * Fallback 总结方法（当 Readability 失败时使用）
 */
function fallbackSummarize(): PageSummary {
  // 提取主要内容区域
  const mainContent = document.querySelector('main, article, [role="main"], .content, #content') || document.body
  
  // 提取文本内容
  const textContent = extractTextContent(mainContent)
  
  // 提取标题
  const title = document.querySelector('h1')?.textContent?.trim() || document.title
  
  // 生成摘要（前500字符）
  const excerpt = textContent.substring(0, 500).replace(/\s+/g, ' ').trim()

  return {
    title,
    content: textContent,
    excerpt,
    length: textContent.length
  }
}

/**
 * 提取文本内容（移除脚本、样式等）
 */
function extractTextContent(element: Element): string {
  const clone = element.cloneNode(true) as Element
  
  // 移除脚本和样式
  clone.querySelectorAll('script, style, noscript, iframe, embed, object').forEach(el => el.remove())
  
  // 移除隐藏元素
  clone.querySelectorAll('[hidden], [style*="display: none"], [style*="visibility: hidden"]').forEach(el => el.remove())
  
  return clone.textContent?.replace(/\s+/g, ' ').trim() || ''
}

/**
 * 提取结构化数据（JSON-LD, Microdata, RDFa）
 */
export function extractStructuredData(): Record<string, any>[] {
  const data: Record<string, any>[] = []

  // 提取 JSON-LD
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')
  jsonLdScripts.forEach(script => {
    try {
      const json = JSON.parse(script.textContent || '{}')
      if (Array.isArray(json)) {
        data.push(...json)
      } else {
        data.push(json)
      }
    } catch (e) {
      console.warn('解析 JSON-LD 失败:', e)
    }
  })

  // 提取 Microdata
  const microdata = extractMicrodata()
  if (microdata.length > 0) {
    data.push(...microdata)
  }

  return data
}

/**
 * 提取 Microdata
 */
function extractMicrodata(): Record<string, any>[] {
  const items: Record<string, any>[] = []
  const itemElements = document.querySelectorAll('[itemscope]')

  itemElements.forEach(item => {
    const itemType = item.getAttribute('itemtype')
    const itemData: Record<string, any> = {}

    if (itemType) {
      itemData['@type'] = itemType
    }

    // 提取属性
    item.querySelectorAll('[itemprop]').forEach(prop => {
      const propName = prop.getAttribute('itemprop')
      if (!propName) return

      let propValue: any
      if (prop.hasAttribute('itemscope')) {
        // 嵌套对象
        propValue = extractMicrodataItem(prop)
      } else if (prop.tagName === 'META') {
        propValue = prop.getAttribute('content')
      } else if (prop.tagName === 'IMG') {
        propValue = (prop as HTMLImageElement).src
      } else if (prop.tagName === 'A') {
        propValue = (prop as HTMLAnchorElement).href
      } else {
        propValue = prop.textContent?.trim()
      }

      if (propValue) {
        if (itemData[propName]) {
          // 多个值，转为数组
          if (!Array.isArray(itemData[propName])) {
            itemData[propName] = [itemData[propName]]
          }
          itemData[propName].push(propValue)
        } else {
          itemData[propName] = propValue
        }
      }
    })

    if (Object.keys(itemData).length > 0) {
      items.push(itemData)
    }
  })

  return items
}

/**
 * 提取单个 Microdata 项
 */
function extractMicrodataItem(element: Element): Record<string, any> {
  const item: Record<string, any> = {}
  const itemType = element.getAttribute('itemtype')
  if (itemType) {
    item['@type'] = itemType
  }

  element.querySelectorAll('[itemprop]').forEach(prop => {
    const propName = prop.getAttribute('itemprop')
    if (propName) {
      item[propName] = prop.textContent?.trim() || prop.getAttribute('content')
    }
  })

  return item
}

/**
 * 提取页面元数据
 */
export function extractMetadata(): Record<string, any> {
  const metadata: Record<string, any> = {
    title: document.title,
    url: window.location.href,
    description: '',
    keywords: [],
    author: '',
    og: {},
    twitter: {}
  }

  // 提取 meta 标签
  const metaTags = document.querySelectorAll('meta')
  metaTags.forEach(meta => {
    const name = meta.getAttribute('name') || meta.getAttribute('property')
    const content = meta.getAttribute('content')

    if (!name || !content) return

    if (name === 'description') {
      metadata.description = content
    } else if (name === 'keywords') {
      metadata.keywords = content.split(',').map(k => k.trim())
    } else if (name === 'author') {
      metadata.author = content
    } else if (name.startsWith('og:')) {
      metadata.og[name.replace('og:', '')] = content
    } else if (name.startsWith('twitter:')) {
      metadata.twitter[name.replace('twitter:', '')] = content
    }
  })

  return metadata
}
