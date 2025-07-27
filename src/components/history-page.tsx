import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  Heart, 
  Eye, 
  Code, 
  Clock, 
  Trash2, 
  RotateCcw,
  Filter,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { useHistory, useHistoryActions } from '../contexts/history-context';
import { HistoryItem, HistoryActionType, ACTION_TYPE_CONFIGS } from '../types/history';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 图标映射
const iconMap = {
  Search,
  Heart,
  Eye,
  Code
};

// 历史记录页面组件
export const HistoryPage: React.FC = () => {
  const { historyManager } = useHistory();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<HistoryActionType | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  // 筛选历史记录
  const filteredItems = useMemo(() => {
    let items = historyManager.filteredItems;

    // 按类型筛选
    if (selectedType !== 'all') {
      items = items.filter(item => item.type === selectedType);
    }

    // 按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(keyword) ||
        (item.description && item.description.toLowerCase().includes(keyword)) ||
        (item.query && item.query.toLowerCase().includes(keyword))
      );
    }

    return items;
  }, [historyManager.filteredItems, selectedType, searchKeyword]);

  // 获取操作类型配置
  const getTypeConfig = (type: HistoryActionType) => {
    return ACTION_TYPE_CONFIGS.find(config => config.type === type);
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return '刚刚';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}小时前`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}天前`;
    } else {
      return format(date, 'MM月dd日 HH:mm', { locale: zhCN });
    }
  };

  // 重新执行操作
  const handleReExecute = (item: HistoryItem) => {
    // 根据不同类型执行相应操作
    switch (item.type) {
      case HistoryActionType.SEARCH:
        if (item.query) {
          // 触发搜索操作
          console.log('重新搜索:', item.query);
        }
        break;
      case HistoryActionType.PSYCHOLOGY_CONSULT:
        if (item.query) {
          // 触发心理咨询
          console.log('重新咨询:', item.query);
        }
        break;
      default:
        console.log('重新执行操作:', item);
    }
  };

  // 删除记录
  const handleDelete = (id: string) => {
    historyManager.removeItem(id);
  };

  // 清空所有记录
  const handleClearAll = () => {
    if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
      historyManager.clearAll();
    }
  };

  // 按类型清空
  const handleClearByType = (type: HistoryActionType) => {
    const typeConfig = getTypeConfig(type);
    if (confirm(`确定要清空所有${typeConfig?.label}记录吗？此操作不可撤销。`)) {
      historyManager.clearByType(type);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航栏 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">历史记录</h1>
              <Badge variant="secondary" className="ml-2">
                {historyManager.items.length} 条记录
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              清空全部
            </Button>
          </div>
        </div>

        {/* 搜索和筛选栏 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索历史记录..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* 类型筛选 */}
            <div className="flex gap-2 overflow-x-auto">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
                className="whitespace-nowrap"
              >
                全部
              </Button>
              {ACTION_TYPE_CONFIGS.map(config => {
                const Icon = iconMap[config.icon as keyof typeof iconMap];
                return (
                  <Button
                    key={config.type}
                    variant={selectedType === config.type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(config.type)}
                    className="whitespace-nowrap"
                    style={{ 
                      backgroundColor: selectedType === config.type ? config.color : undefined,
                      borderColor: config.color 
                    }}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 历史记录列表 */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            // 空状态
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchKeyword || selectedType !== 'all' ? '没有找到相关记录' : '暂无历史记录'}
                    </h3>
                    <p className="text-gray-500">
                      {searchKeyword || selectedType !== 'all' 
                        ? '尝试调整搜索条件或筛选类型' 
                        : '开始使用应用功能，记录会自动保存在这里'
                      }
                    </p>
                  </div>
                  {(searchKeyword || selectedType !== 'all') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchKeyword('');
                        setSelectedType('all');
                      }}
                    >
                      <Filter className="w-4 h-4 mr-1" />
                      清除筛选
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            // 记录列表
            filteredItems.map(item => {
              const typeConfig = getTypeConfig(item.type);
              const Icon = typeConfig ? iconMap[typeConfig.icon as keyof typeof iconMap] : Clock;
              
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* 类型图标 */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${typeConfig?.color}20` }}
                      >
                        <Icon 
                          className="w-5 h-5" 
                          style={{ color: typeConfig?.color }}
                        />
                      </div>
                      
                      {/* 记录内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: `${typeConfig?.color}15`,
                                  color: typeConfig?.color 
                                }}
                              >
                                {typeConfig?.label}
                              </Badge>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatTime(item.timestamp)}
                              </span>
                            </div>
                          </div>
                          
                          {/* 操作按钮 */}
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReExecute(item)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* 底部统计信息 */}
        {historyManager.items.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {ACTION_TYPE_CONFIGS.map(config => {
                const count = historyManager.items.filter(item => item.type === config.type).length;
                const Icon = iconMap[config.icon as keyof typeof iconMap];
                
                return (
                  <div key={config.type} className="flex flex-col items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-500">{config.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;