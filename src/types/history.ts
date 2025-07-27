// 历史记录相关类型定义

// 操作类型枚举
export enum HistoryActionType {
  SEARCH = 'search',           // 搜索操作
  PSYCHOLOGY_CONSULT = 'psychology_consult', // 心理咨询
  CONTENT_VIEW = 'content_view', // 内容浏览
  API_TEST = 'api_test'        // API测试
}

// 历史记录项接口
export interface HistoryItem {
  id: string;                  // 唯一标识符
  type: HistoryActionType;     // 操作类型
  title: string;               // 记录标题
  description?: string;        // 记录描述
  query?: string;              // 搜索查询内容
  result?: any;                // 操作结果数据
  timestamp: number;           // 时间戳
  metadata?: {                 // 元数据
    [key: string]: any;
  };
}

// 历史记录筛选条件
export interface HistoryFilter {
  type?: HistoryActionType;    // 按类型筛选
  dateRange?: {                // 按时间范围筛选
    start: Date;
    end: Date;
  };
  keyword?: string;            // 按关键词筛选
}

// 历史记录管理器接口
export interface HistoryManager {
  items: HistoryItem[];        // 历史记录列表
  filteredItems: HistoryItem[]; // 筛选后的记录列表
  addItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void; // 添加记录
  removeItem: (id: string) => void; // 删除单条记录
  clearAll: () => void;        // 清空所有记录
  clearByType: (type: HistoryActionType) => void; // 按类型清空
  getItemById: (id: string) => HistoryItem | undefined; // 获取指定记录
  filterItems: (filter: HistoryFilter) => void; // 筛选记录
  resetFilter: () => void;     // 重置筛选
}

// 历史记录存储配置
export interface HistoryStorageConfig {
  maxItems: number;            // 最大存储条数
  storageKey: string;          // 本地存储键名
  autoCleanup: boolean;        // 是否自动清理过期记录
  retentionDays: number;       // 记录保留天数
}

// 操作类型显示配置
export interface ActionTypeConfig {
  type: HistoryActionType;
  label: string;               // 显示标签
  icon: string;                // 图标名称
  color: string;               // 主题色
  description: string;         // 描述
}

// 默认操作类型配置
export const ACTION_TYPE_CONFIGS: ActionTypeConfig[] = [
  {
    type: HistoryActionType.SEARCH,
    label: '搜索记录',
    icon: 'Search',
    color: '#3B82F6',
    description: '搜索查询操作记录'
  },
  {
    type: HistoryActionType.PSYCHOLOGY_CONSULT,
    label: '心理咨询',
    icon: 'Heart',
    color: '#10B981',
    description: '心理咨询记录'
  },
  {
    type: HistoryActionType.CONTENT_VIEW,
    label: '内容浏览',
    icon: 'Eye',
    color: '#8B5CF6',
    description: '内容查看记录'
  },
  {
    type: HistoryActionType.API_TEST,
    label: 'API测试',
    icon: 'Code',
    color: '#F59E0B',
    description: 'API接口测试记录'
  }
];

// 默认存储配置
export const DEFAULT_STORAGE_CONFIG: HistoryStorageConfig = {
  maxItems: 1000,
  storageKey: 'psychology_assistant_history',
  autoCleanup: true,
  retentionDays: 30
};