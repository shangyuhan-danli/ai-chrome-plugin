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
    direction?: 'up' | 'down' | 'top' | 'bottom'
  }
}

/**
 * 支持的操作类型
 */
export type PageActionType =
  | 'fill'       // 填充输入框
  | 'click'      // 点击按钮/链接
  | 'highlight'  // 高亮文字
  | 'underline'  // 添加下划线
  | 'select'     // 选择下拉选项
  | 'check'      // 勾选复选框
  | 'scroll'     // 滚动页面
  | 'read'       // 读取内容

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
