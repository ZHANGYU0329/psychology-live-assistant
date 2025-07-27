import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  HistoryItem, 
  HistoryFilter, 
  HistoryManager, 
  HistoryActionType,
  HistoryStorageConfig,
  DEFAULT_STORAGE_CONFIG 
} from '../types/history';

// 生成唯一ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 本地存储工具函数
const storageUtils = {
  // 保存到本地存储
  save: (key: string, data: HistoryItem[]): void => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  },

  // 从本地存储读取
  load: (key: string): HistoryItem[] => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('读取历史记录失败:', error);
      return [];
    }
  },

  // 清空本地存储
  clear: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('清空历史记录失败:', error);
    }
  }
};

// 历史记录管理Hook
export const useHistoryManager = (
  config: Partial<HistoryStorageConfig> = {}
): HistoryManager => {
  const finalConfig = { ...DEFAULT_STORAGE_CONFIG, ...config };
  
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>({});

  // 初始化加载历史记录
  useEffect(() => {
    const loadedItems = storageUtils.load(finalConfig.storageKey);
    
    // 自动清理过期记录
    if (finalConfig.autoCleanup) {
      const cutoffTime = Date.now() - (finalConfig.retentionDays * 24 * 60 * 60 * 1000);
      const validItems = loadedItems.filter(item => item.timestamp > cutoffTime);
      
      if (validItems.length !== loadedItems.length) {
        storageUtils.save(finalConfig.storageKey, validItems);
      }
      
      setItems(validItems);
    } else {
      setItems(loadedItems);
    }
  }, [finalConfig.storageKey, finalConfig.autoCleanup, finalConfig.retentionDays]);

  // 保存到本地存储
  const saveToStorage = useCallback((newItems: HistoryItem[]) => {
    // 限制最大条数
    const limitedItems = newItems.slice(0, finalConfig.maxItems);
    storageUtils.save(finalConfig.storageKey, limitedItems);
    setItems(limitedItems);
  }, [finalConfig.storageKey, finalConfig.maxItems]);

  // 添加历史记录
  const addItem = useCallback((itemData: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...itemData,
      id: generateId(),
      timestamp: Date.now()
    };

    setItems(prevItems => {
      const newItems = [newItem, ...prevItems];
      saveToStorage(newItems);
      return newItems.slice(0, finalConfig.maxItems);
    });
  }, [saveToStorage, finalConfig.maxItems]);

  // 删除单条记录
  const removeItem = useCallback((id: string) => {
    setItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== id);
      saveToStorage(newItems);
      return newItems;
    });
  }, [saveToStorage]);

  // 清空所有记录
  const clearAll = useCallback(() => {
    storageUtils.clear(finalConfig.storageKey);
    setItems([]);
  }, [finalConfig.storageKey]);

  // 按类型清空记录
  const clearByType = useCallback((type: HistoryActionType) => {
    setItems(prevItems => {
      const newItems = prevItems.filter(item => item.type !== type);
      saveToStorage(newItems);
      return newItems;
    });
  }, [saveToStorage]);

  // 获取指定记录
  const getItemById = useCallback((id: string): HistoryItem | undefined => {
    return items.find(item => item.id === id);
  }, [items]);

  // 筛选记录
  const filterItems = useCallback((newFilter: HistoryFilter) => {
    setFilter(newFilter);
  }, []);

  // 重置筛选
  const resetFilter = useCallback(() => {
    setFilter({});
  }, []);

  // 计算筛选后的记录列表
  const filteredItems = useMemo(() => {
    let result = [...items];

    // 按类型筛选
    if (filter.type) {
      result = result.filter(item => item.type === filter.type);
    }

    // 按时间范围筛选
    if (filter.dateRange) {
      const { start, end } = filter.dateRange;
      result = result.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= start && itemDate <= end;
      });
    }

    // 按关键词筛选
    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(keyword) ||
        (item.description && item.description.toLowerCase().includes(keyword)) ||
        (item.query && item.query.toLowerCase().includes(keyword))
      );
    }

    return result;
  }, [items, filter]);

  return {
    items,
    filteredItems,
    addItem,
    removeItem,
    clearAll,
    clearByType,
    getItemById,
    filterItems,
    resetFilter
  };
};

// 历史记录统计Hook
export const useHistoryStats = (items: HistoryItem[]) => {
  return useMemo(() => {
    const stats = {
      total: items.length,
      byType: {} as Record<HistoryActionType, number>,
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    };

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;
    const oneMonthMs = 30 * oneDayMs;

    items.forEach(item => {
      // 按类型统计
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;

      // 按时间统计
      const timeDiff = now - item.timestamp;
      if (timeDiff < oneDayMs) stats.today++;
      if (timeDiff < oneWeekMs) stats.thisWeek++;
      if (timeDiff < oneMonthMs) stats.thisMonth++;
    });

    return stats;
  }, [items]);
};