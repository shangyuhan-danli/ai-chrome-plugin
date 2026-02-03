// 页面操作相关类型定义

/**
 * 页面元素描述 - 完整版本
 */
export interface PageElement {
  id: string              // 唯一标识 (生成的)
  tag: string             // 标签名: input, button, a, select...
  type?: string           // input 类型: text, password, submit...
  text?: string           // 可见文本
  placeholder?: string    // 占位符
  label?: string          // 关联的 label 文本
  ariaLabel?: string      // 无障碍标签
  name?: string           // name 属性
  value?: string          // 当前值 (密码框不传)
  rect: {                 // 位置信息
    x: number
    y: number
    width: number
    height: number
  }
  visible: boolean        // 是否可见
  disabled: boolean       // 是否禁用
}

/**
 * 精简元素格式 - 用于发送给 AI，节省 Token
 */
export interface CompactElement {
  id: string
  desc: string  // 合并的描述: "输入框:用户名" / "按钮:登录"
}

/**
 * 页面上下文 - 发送给后端的页面信息
 */
export interface PageContext {
  url: string
  title: string
  elements: CompactElement[]  // 精简的可交互元素列表
  selectedText?: string       // 用户选中的文字
}

/**
 * AI 返回的操作指令
 */
export interface PageAction {
  action: PageActionType
  target: {
    elementId?: string     // 元素ID
    selector?: string      // CSS选择器 (备用)
    description?: string   // 元素描述 (用于确认)
  }
  params?: {
    value?: string         // 填充的值
    color?: string         // 高亮颜色
    direction?: 'up' | 'down' | 'top' | 'bottom'  // 滚动方向
    delay?: number         // 输入延迟（毫秒）
    key?: string           // 按键名（Enter, Tab, Escape等）
    destination?: {         // 拖拽目标位置
      selector?: string
      x?: number
      y?: number
    }
    timeout?: number       // 等待超时时间
    condition?: 'visible' | 'hidden' | 'exists'  // 等待条件
    behavior?: 'auto' | 'smooth'  // 滚动行为
    block?: 'start' | 'center' | 'end' | 'nearest'  // 滚动对齐方式
    attribute?: string     // 属性名
    property?: string      // 属性值名
    navigateAction?: 'goto' | 'back' | 'forward' | 'reload'  // 导航操作
    url?: string           // 导航URL
    frameSelector?: string   // iframe选择器
    dialogAction?: 'accept' | 'dismiss'  // 弹窗操作
    promptText?: string    // prompt输入值
    prefix?: string        // localStorage键前缀
    name?: string          // Cookie名称
    cookieOptions?: {       // Cookie选项
      expires?: number
      path?: string
      domain?: string
      secure?: boolean
    }
    // 文本选择参数
    startOffset?: number   // 选择起始偏移
    endOffset?: number     // 选择结束偏移
    searchText?: string    // 要选择的文本内容
    // 剪贴板参数
    text?: string          // 要复制的文本
    // 文件上传参数
    files?: Array<{        // 要上传的文件
      name: string
      type: string
      content: string      // base64 编码的文件内容
    }>
    // JavaScript 执行参数
    script?: string        // 要执行的 JavaScript 代码
    // 视口参数
    width?: number         // 视口宽度
    height?: number        // 视口高度
    // 下载参数
    filename?: string      // 下载文件名
    // 请求拦截参数
    urlPattern?: string    // URL 匹配模式
    resourceTypes?: string[] // 资源类型
    interceptAction?: 'block' | 'redirect' | 'modify'  // 拦截操作
    redirectUrl?: string   // 重定向 URL
  }
}

/**
 * 支持的操作类型
 */
export type PageActionType =
  | 'fill'           // 填充输入框
  | 'click'          // 点击按钮/链接
  | 'doubleClick'    // 双击元素
  | 'rightClick'     // 右键点击元素
  | 'highlight'      // 高亮文字
  | 'underline'      // 添加下划线
  | 'select'         // 选择下拉选项
  | 'selectText'     // 选中文本
  | 'check'          // 勾选复选框
  | 'scroll'         // 滚动页面
  | 'read'           // 读取内容
  | 'hover'          // 鼠标悬停
  | 'type'           // 逐字符输入（模拟真实打字）
  | 'press'          // 按键操作（Enter, Tab等）
  | 'drag'           // 拖拽元素
  | 'wait'           // 等待元素或时间
  | 'focus'          // 聚焦元素
  | 'blur'           // 失焦元素
  | 'clear'          // 清空输入框
  | 'getAttribute'   // 获取元素属性
  | 'getProperty'    // 获取元素属性值
  | 'screenshot'     // 截图
  | 'evaluate'       // 执行JavaScript
  | 'upload'         // 上传文件
  | 'download'       // 下载文件
  | 'navigate'       // 页面导航（前进/后退/刷新）
  | 'setViewport'    // 设置视口大小
  | 'scrollIntoView' // 滚动到元素可见
  | 'switchFrame'    // 切换iframe
  | 'handleDialog'   // 处理弹窗（alert/confirm/prompt）
  | 'setLocalStorage'    // 设置localStorage
  | 'getLocalStorage'    // 获取localStorage
  | 'clearLocalStorage'  // 清除localStorage
  | 'setCookie'          // 设置Cookie
  | 'getCookie'          // 获取Cookie
  | 'clearCookies'       // 清除Cookie
  | 'copyToClipboard'    // 复制到剪贴板
  | 'pasteFromClipboard' // 从剪贴板粘贴
  | 'interceptRequest'   // 拦截网络请求

/**
 * 操作执行结果
 */
export interface ActionResult {
  success: boolean
  message: string
  data?: any      // 读取操作返回的数据
  error?: string
}

/**
 * 批量操作结果
 */
export interface BatchActionResult {
  success: boolean
  results: ActionResult[]
  summary: string
}

/**
 * 筛选策略配置
 */
export interface FilterStrategy {
  // 元素优先级权重
  priorities: {
    form: number
    button: number
    link: number
    text: number
  }
  // 位置权重
  viewport: {
    visible: number
    nearViewport: number
    hidden: number
  }
  // 最大元素数量
  maxElements: number
}

/**
 * 请求更多元素的参数
 */
export interface RequestMoreElementsParams {
  region?: 'form' | 'header' | 'sidebar' | 'footer' | 'below_viewport'
  elementType?: 'input' | 'button' | 'link' | 'select' | 'all'
  keyword?: string
}
