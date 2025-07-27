import React, { createContext, useContext, ReactNode } from 'react';
import { HistoryManager } from '../types/history';
import { useHistoryManager } from '../hooks/use-history-manager';

// 历史记录Context类型
interface HistoryContextType {
  historyManager: HistoryManager;
}

// 创建Context
const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

// Provider组件属性
interface HistoryProviderProps {
  children: ReactNode;
}

// 历史记录Provider组件
export const HistoryProvider: React.FC<HistoryProviderProps> = ({ children }) => {
  const historyManager = useHistoryManager();

  const value: HistoryContextType = {
    historyManager
  };

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
};

// 使用历史记录Context的Hook
export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  
  if (context === undefined) {
    throw new Error('useHistory必须在HistoryProvider内部使用');
  }
  
  return context;
};

// 便捷的历史记录管理Hook
export const useHistoryActions = () => {
  const { historyManager } = useHistory();
  
  return {
    addSearchRecord: (query: string, result?: any) => {
      historyManager.addItem({
        type: 'search' as const,
        title: `搜索: ${query}`,
        description: `搜索关键词: ${query}`,
        query,
        result
      });
    },
    
    addPsychologyConsultRecord: (question: string, answer?: any) => {
      historyManager.addItem({
        type: 'psychology_consult' as const,
        title: `心理咨询: ${question.slice(0, 30)}...`,
        description: question,
        query: question,
        result: answer
      });
    },
    
    addContentViewRecord: (title: string, content?: any) => {
      historyManager.addItem({
        type: 'content_view' as const,
        title: `查看内容: ${title}`,
        description: `浏览了内容: ${title}`,
        result: content
      });
    },
    
    addApiTestRecord: (endpoint: string, result?: any) => {
      historyManager.addItem({
        type: 'api_test' as const,
        title: `API测试: ${endpoint}`,
        description: `测试了API接口: ${endpoint}`,
        query: endpoint,
        result
      });
    }
  };
};