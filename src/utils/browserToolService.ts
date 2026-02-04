// 浏览器工具服务 - 管理和执行浏览器端工具
import type { PageAction, ActionResult, BatchActionResult, PageContext, RequestMoreElementsParams } from './pageActionTypes'

/**
 * 工具参数 Schema 定义 (JSON Schema 格式)
 */
export interface ToolParameterSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array'
  properties?: Record<string, {
    type: string
    description?: string
    enum?: string[]
    items?: any
  }>
  required?: string[]
  description?: string
}

/**
 * 完整的工具定义 (用于发送给后端)
 */
export interface BrowserToolDefinition {
  name: string
  description: string
  parameters: ToolParameterSchema
}

/**
 * 工具执行器接口
 */
export interface ToolExecutor {
  name: string
  description: string
  parameters: ToolParameterSchema
  execute: (args: any, tabId: number) => Promise<any>
}

/**
 * 浏览器工具服务类
 */
class BrowserToolService {
  private tools: Map<string, ToolExecutor> = new Map()

  constructor() {
    // 注册内置工具
    this.registerBuiltinTools()
  }

  /**
   * 注册内置工具
   */
  private registerBuiltinTools() {
    // page_action - 执行页面操作
    this.register({
      name: 'page_action',
      description: '在用户当前浏览的网页上执行操作，如填充输入框、点击按钮、高亮文字等。可以批量执行多个操作。',
      parameters: {
        type: 'object',
        properties: {
          actions: {
            type: 'array',
            description: '要执行的操作列表',
            items: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['fill', 'click', 'doubleClick', 'rightClick', 'highlight', 'underline', 'select', 'selectText', 'check', 'scroll', 'read', 'hover', 'type', 'press', 'drag', 'wait', 'focus', 'blur', 'clear', 'getAttribute', 'getProperty', 'navigate', 'scrollIntoView', 'switchFrame', 'handleDialog', 'setLocalStorage', 'getLocalStorage', 'clearLocalStorage', 'setCookie', 'getCookie', 'clearCookies', 'copyToClipboard', 'pasteFromClipboard', 'upload', 'evaluate', 'addListItem', 'removeListItem', 'editListItem', 'setContent', 'appendContent', 'prependContent', 'insertHTML'],
                  description: '操作类型: fill(填充输入框), click(点击), doubleClick(双击), rightClick(右键), highlight(高亮), underline(下划线), select(选择), selectText(选中文本), check(勾选), scroll(滚动), read(读取), hover(悬停), type(打字), press(按键), drag(拖拽), wait(等待), focus(聚焦), blur(失焦), clear(清空), getAttribute(获取属性), getProperty(获取属性值), navigate(导航), scrollIntoView(滚动到元素), switchFrame(切换iframe), handleDialog(处理弹窗), setLocalStorage(设置存储), getLocalStorage(获取存储), clearLocalStorage(清除存储), setCookie(设置Cookie), getCookie(获取Cookie), clearCookies(清除Cookies), copyToClipboard(复制), pasteFromClipboard(粘贴), upload(上传文件), evaluate(执行JS), addListItem(添加列表项), removeListItem(删除列表项), editListItem(编辑列表项), setContent(设置内容), appendContent(追加内容), prependContent(前置内容), insertHTML(插入HTML)'
                },
                target: {
                  type: 'object',
                  description: '目标元素',
                  properties: {
                    elementId: { type: 'string', description: '元素ID (从页面上下文获取)' },
                    selector: { type: 'string', description: 'CSS选择器 (备用)' },
                    description: { type: 'string', description: '元素描述 (用于确认)' }
                  }
                },
                params: {
                  type: 'object',
                  description: '操作参数',
                  properties: {
                    value: { type: 'string', description: '填充的值、选择的选项、输入的文本或按键名' },
                    color: { type: 'string', description: '高亮颜色 (如 #ffeb3b)' },
                    direction: { type: 'string', enum: ['up', 'down', 'top', 'bottom'], description: '滚动方向' },
                    delay: { type: 'number', description: '输入延迟（毫秒），用于type操作' },
                    key: { type: 'string', description: '按键名（Enter, Tab, Escape等）' },
                    destination: { 
                      type: 'object', 
                      description: '拖拽目标位置',
                      properties: {
                        selector: { type: 'string', description: '目标元素CSS选择器' },
                        x: { type: 'number', description: '目标X坐标' },
                        y: { type: 'number', description: '目标Y坐标' }
                      }
                    },
                    timeout: { type: 'number', description: '等待超时时间（毫秒）' },
                    condition: { type: 'string', enum: ['visible', 'hidden', 'exists'], description: '等待条件' },
                    behavior: { type: 'string', enum: ['auto', 'smooth'], description: '滚动行为' },
                    block: { type: 'string', enum: ['start', 'center', 'end', 'nearest'], description: '滚动对齐方式' },
                    attribute: { type: 'string', description: '要获取的属性名' },
                    property: { type: 'string', description: '要获取的属性值名' },
                    navigateAction: { type: 'string', enum: ['goto', 'back', 'forward', 'reload'], description: '导航操作类型' },
                    url: { type: 'string', description: '导航URL（navigateAction=goto时使用）' },
                    frameSelector: { type: 'string', description: 'iframe选择器' },
                    dialogAction: { type: 'string', enum: ['accept', 'dismiss'], description: '弹窗处理方式' },
                    promptText: { type: 'string', description: 'prompt弹窗的输入值' },
                    prefix: { type: 'string', description: 'localStorage键名前缀（用于批量清除）' },
                    name: { type: 'string', description: 'Cookie名称' },
                    cookieOptions: {
                      type: 'object',
                      description: 'Cookie选项',
                      properties: {
                        expires: { type: 'number', description: '过期时间（秒）' },
                        path: { type: 'string', description: '路径' },
                        domain: { type: 'string', description: '域名' },
                        secure: { type: 'boolean', description: '是否仅HTTPS' }
                      }
                    },
                    text: { type: 'string', description: '要复制的文本（copyToClipboard使用）' },
                    searchText: { type: 'string', description: '要选中的文本内容（selectText使用）' },
                    startOffset: { type: 'number', description: '选择起始偏移（selectText使用）' },
                    endOffset: { type: 'number', description: '选择结束偏移（selectText使用）' },
                    script: { type: 'string', description: '要执行的JavaScript代码（evaluate使用）' },
                    files: {
                      type: 'array',
                      description: '要上传的文件列表（upload使用）',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', description: '文件名' },
                          type: { type: 'string', description: 'MIME类型' },
                          content: { type: 'string', description: 'base64编码的文件内容' }
                        }
                      }
                    },
                    listSelector: { type: 'string', description: '列表容器选择器（addListItem使用）' },
                    itemContent: { type: 'string', description: '列表项内容（addListItem/editListItem使用）' },
                    position: { type: 'string', enum: ['before', 'after', 'first', 'last'], description: '插入位置（addListItem使用）' },
                    itemIndex: { type: 'number', description: '列表项索引（removeListItem使用）' },
                    content: { type: 'string', description: '文本内容（setContent/appendContent/prependContent使用）' },
                    html: { type: 'string', description: 'HTML内容（insertHTML使用）' },
                    insertPosition: { type: 'string', enum: ['beforebegin', 'afterbegin', 'beforeend', 'afterend'], description: 'HTML插入位置: beforebegin(元素前), afterbegin(内部开头), beforeend(内部末尾), afterend(元素后)' }
                  }
                }
              },
              required: ['action', 'target']
            }
          }
        },
        required: ['actions']
      },
      execute: async (args: { actions: PageAction[] }, tabId: number) => {
        const actions = args.actions || [args]
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'EXECUTE_BATCH_ACTIONS',
          payload: actions
        })
        return response?.data || { success: false, error: '执行失败' }
      }
    })

    // screenshot - 页面截图
    this.register({
      name: 'screenshot',
      description: '截取当前页面的截图，支持可视区域截图或完整页面滚动截图，自动保存到剪贴板。用户可以直接粘贴使用。',
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['png', 'jpeg'],
            description: '图片格式，默认png'
          },
          quality: {
            type: 'number',
            description: 'JPEG质量(0-100)，仅format=jpeg时有效'
          },
          autoDownload: {
            type: 'boolean',
            description: '是否自动下载图片，默认false'
          },
          filename: {
            type: 'string',
            description: '下载文件名，默认screenshot_{timestamp}.png'
          },
          fullPage: {
            type: 'boolean',
            description: '是否截取完整页面（自动滚动截图），默认false（仅截取可视区域）'
          }
        }
      },
      execute: async (args: { format?: 'png' | 'jpeg'; quality?: number; autoDownload?: boolean; filename?: string; fullPage?: boolean }, tabId: number) => {
        try {
          const format = args.format || 'png'
          const isFullPage = args.fullPage || false
          
          let finalDataUrl: string
          
          if (isFullPage) {
            // 全页截图：通过 content script 实现滚动截图
            const response = await chrome.tabs.sendMessage(tabId, {
              type: 'CAPTURE_FULL_PAGE',
              payload: { format, quality: args.quality }
            })
            
            if (!response?.success) {
              return { success: false, error: response?.error || '全页截图失败' }
            }
            
            finalDataUrl = response.data
          } else {
            // 可视区域截图
            const options: chrome.tabs.CaptureVisibleTabOptions = { format }
            if (format === 'jpeg' && args.quality) {
              options.quality = args.quality
            }
            finalDataUrl = await chrome.tabs.captureVisibleTab(options)
          }
          
          // 转换为 Blob 并保存到剪贴板
          const response = await fetch(finalDataUrl)
          const blob = await response.blob()
          
          let clipboardSaved = false
          let clipboardError = null
          
          try {
            // 尝试使用 ClipboardItem API 写入剪贴板
            await navigator.clipboard.write([
              new ClipboardItem({
                [blob.type]: blob
              })
            ])
            clipboardSaved = true
          } catch (e1) {
            // 如果 ClipboardItem 失败，尝试通过 content script 写入
            try {
              await chrome.tabs.sendMessage(tabId, {
                type: 'COPY_IMAGE_TO_CLIPBOARD',
                payload: { dataUrl: finalDataUrl }
              })
              clipboardSaved = true
            } catch (e2) {
              clipboardError = String(e2)
              console.warn('保存到剪贴板失败:', e1, e2)
            }
          }
          
          // 如果需要自动下载
          if (args.autoDownload) {
            const filename = args.filename || `screenshot_${Date.now()}.${format}`
            await chrome.downloads.download({
              url: finalDataUrl,
              filename: filename,
              saveAs: false
            })
          }
          
          return { 
            success: true, 
            data: finalDataUrl,
            message: clipboardSaved 
              ? '截图已保存到剪贴板，你可以直接粘贴使用（Ctrl+V/Cmd+V）'
              : '截图已生成，但剪贴板保存失败，请手动保存图片',
            clipboardSaved: clipboardSaved,
            clipboardError: clipboardError,
            autoDownload: args.autoDownload || false,
            fullPage: isFullPage
          }
        } catch (e) {
          return { success: false, error: String(e) }
        }
      }
    })

    // download - 下载文件
    this.register({
      name: 'download',
      description: '下载指定URL的文件到本地。',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: '要下载的文件URL'
          },
          filename: {
            type: 'string',
            description: '保存的文件名（可选）'
          },
          saveAs: {
            type: 'boolean',
            description: '是否显示另存为对话框'
          }
        },
        required: ['url']
      },
      execute: async (args: { url: string; filename?: string; saveAs?: boolean }) => {
        try {
          const downloadOptions: chrome.downloads.DownloadOptions = {
            url: args.url
          }
          if (args.filename) {
            downloadOptions.filename = args.filename
          }
          if (args.saveAs !== undefined) {
            downloadOptions.saveAs = args.saveAs
          }
          const downloadId = await chrome.downloads.download(downloadOptions)
          return { success: true, downloadId }
        } catch (e) {
          return { success: false, error: String(e) }
        }
      }
    })

    // setViewport - 设置视口大小
    this.register({
      name: 'setViewport',
      description: '调整浏览器窗口大小以模拟不同设备的视口。',
      parameters: {
        type: 'object',
        properties: {
          width: {
            type: 'number',
            description: '视口宽度（像素）'
          },
          height: {
            type: 'number',
            description: '视口高度（像素）'
          }
        },
        required: ['width', 'height']
      },
      execute: async (args: { width: number; height: number }) => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
          if (!tab?.windowId) {
            return { success: false, error: '无法获取当前窗口' }
          }
          await chrome.windows.update(tab.windowId, {
            width: args.width,
            height: args.height
          })
          return { success: true, message: `视口已设置为 ${args.width}x${args.height}` }
        } catch (e) {
          return { success: false, error: String(e) }
        }
      }
    })

    // interceptRequest - 拦截网络请求
    this.register({
      name: 'interceptRequest',
      description: '拦截匹配指定模式的网络请求，可以阻止或重定向请求。',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['add', 'remove', 'list'],
            description: '操作类型: add(添加规则), remove(移除规则), list(列出规则)'
          },
          ruleId: {
            type: 'number',
            description: '规则ID（remove时必需）'
          },
          urlPattern: {
            type: 'string',
            description: 'URL匹配模式（add时必需）'
          },
          interceptAction: {
            type: 'string',
            enum: ['block', 'redirect'],
            description: '拦截操作: block(阻止), redirect(重定向)'
          },
          redirectUrl: {
            type: 'string',
            description: '重定向URL（interceptAction=redirect时必需）'
          },
          resourceTypes: {
            type: 'array',
            description: '要拦截的资源类型',
            items: {
              type: 'string',
              enum: ['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'media', 'websocket', 'other']
            }
          }
        },
        required: ['action']
      },
      execute: async (args: {
        action: 'add' | 'remove' | 'list'
        ruleId?: number
        urlPattern?: string
        interceptAction?: 'block' | 'redirect'
        redirectUrl?: string
        resourceTypes?: string[]
      }) => {
        try {
          if (args.action === 'list') {
            const rules = await chrome.declarativeNetRequest.getDynamicRules()
            return { success: true, rules }
          }

          if (args.action === 'remove') {
            if (!args.ruleId) {
              return { success: false, error: '移除规则需要提供ruleId' }
            }
            await chrome.declarativeNetRequest.updateDynamicRules({
              removeRuleIds: [args.ruleId]
            })
            return { success: true, message: `已移除规则 ${args.ruleId}` }
          }

          if (args.action === 'add') {
            if (!args.urlPattern) {
              return { success: false, error: '添加规则需要提供urlPattern' }
            }

            const ruleId = Date.now() % 1000000 // 生成唯一ID

            const rule: chrome.declarativeNetRequest.Rule = {
              id: ruleId,
              priority: 1,
              condition: {
                urlFilter: args.urlPattern,
                resourceTypes: (args.resourceTypes as chrome.declarativeNetRequest.ResourceType[]) || ['main_frame', 'sub_frame', 'script', 'xmlhttprequest']
              },
              action: args.interceptAction === 'redirect' && args.redirectUrl
                ? { type: 'redirect' as const, redirect: { url: args.redirectUrl } }
                : { type: 'block' as const }
            }

            await chrome.declarativeNetRequest.updateDynamicRules({
              addRules: [rule]
            })

            return { success: true, ruleId, message: `已添加拦截规则` }
          }

          return { success: false, error: '未知操作' }
        } catch (e) {
          return { success: false, error: String(e) }
        }
      }
    })

    // request_more_elements - 请求更多元素
    this.register({
      name: 'request_more_elements',
      description: '当前页面元素信息不足以完成用户请求时，请求特定区域或类型的更多元素。',
      parameters: {
        type: 'object',
        properties: {
          region: {
            type: 'string',
            enum: ['form', 'header', 'sidebar', 'footer', 'below_viewport', 'tab_panel', 'modal', 'menu'],
            description: '页面区域: form(表单区域), header(页头), sidebar(侧边栏), footer(页脚), below_viewport(视口下方), tab_panel(Tab面板内), modal(弹窗/模态框内), menu(菜单区域内)'
          },
          elementType: {
            type: 'string',
            enum: ['input', 'button', 'link', 'select', 'tab', 'menu', 'list', 'radio', 'checkbox', 'all'],
            description: '元素类型: input(输入框), button(按钮), link(链接), select(下拉框), tab(Tab页签), menu(菜单项), list(列表项), radio(单选框), checkbox(复选框), all(所有)'
          },
          keyword: {
            type: 'string',
            description: '关键词筛选，匹配元素的文本、placeholder、label等'
          }
        }
      },
      execute: async (args: RequestMoreElementsParams, tabId: number) => {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'REQUEST_MORE_ELEMENTS',
          payload: args
        })
        return { success: true, elements: response?.data || [] }
      }
    })

    // get_selected_text - 获取选中文字
    this.register({
      name: 'get_selected_text',
      description: '获取用户在页面上选中的文字，用于对选中内容进行操作。',
      parameters: {
        type: 'object',
        properties: {}
      },
      execute: async (_args: any, tabId: number) => {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'GET_SELECTED_TEXT'
        })
        return { success: true, text: response?.data || '' }
      }
    })

    // clear_ai_styles - 清除 AI 样式
    this.register({
      name: 'clear_ai_styles',
      description: '清除 AI 在页面上添加的所有高亮和下划线样式，恢复页面原始状态。',
      parameters: {
        type: 'object',
        properties: {}
      },
      execute: async (_args: any, tabId: number) => {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'CLEAR_AI_STYLES'
        })
        return { success: response?.success || false }
      }
    })

    // summarize_page - 页面总结
    this.register({
      name: 'summarize_page',
      description: '提取并总结当前页面的主要内容，包括标题、正文、摘要等。适用于需要理解页面整体内容的场景。',
      parameters: {
        type: 'object',
        properties: {
          includeStructuredData: {
            type: 'boolean',
            description: '是否包含结构化数据（JSON-LD, Microdata）'
          },
          includeMetadata: {
            type: 'boolean',
            description: '是否包含页面元数据（meta标签）'
          }
        }
      },
      execute: async (args: { includeStructuredData?: boolean; includeMetadata?: boolean }, tabId: number) => {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'SUMMARIZE_PAGE',
          payload: args
        })
        return response?.data || { success: false, error: '页面总结失败' }
      }
    })

    // extract_data - 数据提取
    this.register({
      name: 'extract_data',
      description: '从页面中提取结构化数据，支持表格、列表、卡片等多种格式。可以提取产品信息、文章列表、搜索结果等。',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS选择器，指定要提取的区域（可选）'
          },
          dataType: {
            type: 'string',
            enum: ['table', 'list', 'cards', 'form', 'all'],
            description: '数据类型: table(表格), list(列表), cards(卡片), form(表单), all(所有)'
          },
          fields: {
            type: 'array',
            description: '要提取的字段名列表（可选，用于表格）',
            items: { type: 'string' }
          }
        }
      },
      execute: async (args: { selector?: string; dataType?: string; fields?: string[] }, tabId: number) => {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'EXTRACT_DATA',
          payload: args
        })
        return response?.data || { success: false, error: '数据提取失败' }
      }
    })

    // ⚠️ PageScript 功能已禁用，等待安全方案重新设计
    // execute_page_script - 执行 PageScript
    // this.register({
    //   name: 'execute_page_script',
    //   description: '执行预定义的 PageScript（特定页面的自动化脚本）。PageScript 是经过验证的安全脚本，可以针对特定网站提供强大的自动化能力。',
    //   parameters: {
    //     type: 'object',
    //     properties: {
    //       scriptId: {
    //         type: 'string',
    //         description: 'PageScript ID'
    //       },
    //       context: {
    //         type: 'object',
    //         description: '传递给 PageScript 的上下文数据'
    //       }
    //     },
    //     required: ['scriptId']
    //   },
    //   execute: async (args: { scriptId: string; context?: Record<string, any> }, tabId: number) => {
    //     const response = await chrome.tabs.sendMessage(tabId, {
    //       type: 'EXECUTE_PAGE_SCRIPT',
    //       payload: args
    //     })
    //     return response?.data || { success: false, error: 'PageScript 执行失败' }
    //   }
    // })

    // list_page_scripts - 列出可用 PageScripts
    // this.register({
    //   name: 'list_page_scripts',
    //   description: '列出当前页面可用的 PageScripts。',
    //   parameters: {
    //     type: 'object',
    //     properties: {}
    //   },
    //   execute: async (_args: any, tabId: number) => {
    //     const response = await chrome.tabs.sendMessage(tabId, {
    //       type: 'LIST_PAGE_SCRIPTS'
    //     })
    //     return response?.data || { success: false, error: '获取 PageScripts 失败' }
    //   }
    // })
  }

  /**
   * 注册工具
   */
  register(tool: ToolExecutor) {
    this.tools.set(tool.name, tool)
  }

  /**
   * 注销工具
   */
  unregister(name: string) {
    this.tools.delete(name)
  }

  /**
   * 检查是否为浏览器工具
   */
  isBrowserTool(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * 获取所有工具名称
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys())
  }

  /**
   * 获取完整的工具定义列表（用于发送给后端）
   */
  getToolDefinitions(): BrowserToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }))
  }

  /**
   * 执行工具
   */
  async execute(name: string, argsJson: string): Promise<string> {
    const tool = this.tools.get(name)
    if (!tool) {
      return JSON.stringify({ success: false, error: `未知的浏览器工具: ${name}` })
    }

    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) {
        return JSON.stringify({ success: false, error: '无法获取当前标签页' })
      }

      // 解析参数
      let args: any
      try {
        args = JSON.parse(argsJson)
      } catch (e) {
        return JSON.stringify({ success: false, error: '无效的参数格式' })
      }

      // 执行工具
      const result = await tool.execute(args, tab.id)
      return JSON.stringify(result)
    } catch (error) {
      console.error(`执行工具 ${name} 失败:`, error)
      return JSON.stringify({ success: false, error: String(error) })
    }
  }
}

// 导出单例
export const browserToolService = new BrowserToolService()
