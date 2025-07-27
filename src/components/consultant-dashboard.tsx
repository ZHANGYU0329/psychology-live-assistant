import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Copy, 
  RefreshCw, 
  Download, 
  Share2, 
  BookmarkPlus,
  MessageSquare
} from 'lucide-react';
import Header from './header';
import ContentCard from './content-card';
import ContentDetailView from './content-detail-view';
import ContentDisplay from './content-display';
import ResponsiveContainer from './responsive-container';
import { useMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { generatePsychologyContent, getRelatedImages, GeneratedContent } from '@/services/ai-service';
import { useHistoryActions } from '../contexts/history-context';

// 本地存储键名
const GENERATED_CONTENT_KEY = 'psychology_generated_content';
const LAST_COMMENT_KEY = 'psychology_last_comment';

const ConsultantDashboard: React.FC = () => {
  const { isMobile, isTablet, isDesktop } = useMobile();
  const { addPsychologyConsultRecord, addContentViewRecord } = useHistoryActions();
  const [comment, setComment] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState('cards'); // 添加标签页状态

  // 组件挂载时从本地存储恢复数据
  useEffect(() => {
    try {
      // 恢复生成的内容
      const savedContent = localStorage.getItem(GENERATED_CONTENT_KEY);
      if (savedContent) {
        const parsedContent = JSON.parse(savedContent);
        
        // 确保所有必要的字段都存在
        const validContent = parsedContent.map((item: any) => {
          // 确保 relatedImages 字段存在
          if (!item.relatedImages && item.imageUrl) {
            item.relatedImages = [item.imageUrl];
          }
          
          // 确保 createdAt 字段存在
          if (!item.createdAt) {
            item.createdAt = Date.now();
          }
          
          return item;
        });
        
        setGeneratedContent(validContent);
        console.log('已从本地存储恢复内容:', validContent.length, '条记录');
      }

      // 恢复最后输入的评论
      const savedComment = localStorage.getItem(LAST_COMMENT_KEY);
      if (savedComment) {
        setComment(savedComment);
      }
    } catch (error) {
      console.error('恢复本地数据失败:', error);
    }
  }, []);

  // 保存生成内容到本地存储
  const saveContentToLocal = (content: GeneratedContent[]) => {
    try {
      // 确保所有内容都有必要的字段
      const contentToSave = content.map(item => {
        // 确保 relatedImages 字段存在
        if (!item.relatedImages && item.imageUrl) {
          return {
            ...item,
            relatedImages: [item.imageUrl]
          };
        }
        return item;
      });
      
      localStorage.setItem(GENERATED_CONTENT_KEY, JSON.stringify(contentToSave));
      console.log('已保存内容到本地存储:', contentToSave.length, '条记录');
    } catch (error) {
      console.error('保存内容到本地存储失败:', error);
    }
  };

  // 保存评论到本地存储
  const saveCommentToLocal = (commentText: string) => {
    try {
      localStorage.setItem(LAST_COMMENT_KEY, commentText);
    } catch (error) {
      console.error('保存评论到本地存储失败:', error);
    }
  };

  // 处理评论提交
  const handleSubmit = async () => {
    if (!comment.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // 调用AI服务生成内容
      const content = await generatePsychologyContent(comment);
      
      // 先使用默认图片，然后异步加载实际图片，不阻塞界面展示
      const loadImagesAsync = async () => {
        // 使用 Promise.all 并行加载所有图片
        const imagePromises = content.map(async (item) => {
          try {
            // 使用 setTimeout 延迟加载图片，让界面先渲染出来
            await new Promise(resolve => setTimeout(resolve, 100));
            const images = await getRelatedImages(item.title);
            if (images.length > 0) {
              return { id: item.id, imageUrl: images[0] };
            }
          } catch (imageError) {
            console.error(`获取图片失败 (${item.title}):`, imageError);
          }
          return null;
        });
        
        // 等待所有图片加载完成
        const loadedImages = await Promise.all(imagePromises);
        
        // 批量更新状态，减少重渲染次数
        const validImages = loadedImages.filter(img => img !== null);
        if (validImages.length > 0) {
          setGeneratedContent(prevContent => {
            const updatedContent = [...prevContent];
            validImages.forEach(img => {
              if (img) {
                const index = updatedContent.findIndex(item => item.id === img.id);
                if (index !== -1) {
                  updatedContent[index] = { ...updatedContent[index], imageUrl: img.imageUrl };
                }
              }
            });
            // 保存到本地存储
            saveContentToLocal(updatedContent);
            return updatedContent;
          });
        }
      };
      
      // 只添加创建时间，不添加创建者信息
      const contentWithCreator = content.map(item => ({
        ...item,
        createdAt: Date.now()
      }));
      
      // 将新内容添加到现有内容前面，而不是替换
      const newContent = [...contentWithCreator, ...generatedContent];
      setGeneratedContent(newContent);
      
      // 保存到本地存储
      saveContentToLocal(newContent);
      
      // 保存到历史记录
      addPsychologyConsultRecord(comment, {
        contentCount: content.length,
        titles: content.map(item => item.title),
        timestamp: Date.now()
      });

      // 异步加载图片
      loadImagesAsync();
      
    } catch (error) {
      console.error('生成内容失败:', error);
      alert('生成内容失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 保存为文本
  const handleSaveText = (id: number) => {
    const content = generatedContent.find(item => item.id === id);
    if (content) {
      try {
        // 创建Blob对象
        const blob = new Blob([`${content.title}\n\n${content.description}\n\n标签: ${content.tags.join(', ')}`], { type: 'text/plain;charset=utf-8' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `心理咨询-${content.title}.txt`;
        link.click();
        
        // 释放URL对象
        URL.revokeObjectURL(url);
        
        alert('文本已保存！');
      } catch (error) {
        console.error('保存文本失败:', error);
        alert('保存文本失败，请重试');
      }
    }
  };

  // 复制文本
  const handleCopyText = (id: number) => {
    const content = generatedContent.find(item => item.id === id);
    if (content) {
      navigator.clipboard.writeText(`${content.title}\n\n${content.description}\n\n标签: ${content.tags.join(', ')}`);
      alert('文本已复制到剪贴板！');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F5FF] dark:bg-[#1C1C1E]">
      <Header />
      
      <main className="flex-1 container mx-auto px-2 py-4 sm:px-4 sm:py-8">
        <ResponsiveContainer
          mobileClassName="max-w-full px-1"
          tabletClassName="max-w-4xl mx-auto"
          desktopClassName="max-w-6xl mx-auto"
        >
          {/* 输入区块 */}
          <Card className="mb-8 shadow-sm border-0 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-[#1D1D1F] dark:text-white">输入心理咨询问题</h2>
              <Textarea
                placeholder="请输入观众的问题或心理困扰..."
                className="min-h-[120px] mb-4 border-[#D2D2D7] focus:border-[#8A2BE2] focus:ring-[#8A2BE2] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  const newComment = e.target.value;
                  setComment(newComment);
                  // 实时保存评论到本地存储
                  saveCommentToLocal(newComment);
                }}
              />
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:justify-between">
                <div className="text-sm text-[#86868B] dark:text-gray-400">
                  {comment.length} 个字符
                </div>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isGenerating || !comment.trim()}
                  className="w-full sm:w-auto bg-[#8A2BE2] hover:bg-[#7B1FA2] text-white"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      生成解析
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 内容展示区 */}
          {generatedContent.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">生成的内容</h2>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-[#86868B] dark:text-gray-400">
                    共 {generatedContent.length} 条内容
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setGeneratedContent([]);
                      saveContentToLocal([]);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    清空显示
                  </Button>
                </div>
              </div>
              <Tabs value={activeTab} className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger 
                    value="cards" 
                    onClick={() => setActiveTab('cards')}
                    data-state={activeTab === 'cards' ? 'active' : ''}
                  >
                    卡片视图
                  </TabsTrigger>
                  <TabsTrigger 
                    value="list" 
                    onClick={() => setActiveTab('list')}
                    data-state={activeTab === 'list' ? 'active' : ''}
                  >
                    列表视图
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent 
                  value="cards" 
                  className="space-y-6"
                  style={{ display: activeTab === 'cards' ? 'block' : 'none' }}
                >
                  <div className={cn(
                    "grid gap-6",
                    isMobile ? "grid-cols-1" : 
                    isTablet ? "grid-cols-2" : 
                    "grid-cols-2 lg:grid-cols-3"
                  )}>
                    {generatedContent.map((content) => (
                      <ContentCard 
                        key={content.id}
                        content={content}
                        onSave={() => handleSaveText(content.id)}
                        onCopy={() => handleCopyText(content.id)}
                        onClick={() => {
                          setSelectedContent(content);
                          addContentViewRecord(content.title, {
                            description: content.description,
                            tags: content.tags,
                            imageUrl: content.imageUrl
                          });
                        }}
                      />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent 
                  value="list"
                  style={{ display: activeTab === 'list' ? 'block' : 'none' }}
                >
                  <div className="space-y-4">
                    {generatedContent.map((content) => (
                      <Card 
                        key={content.id} 
                        className="overflow-hidden shadow-sm border-0 cursor-pointer hover:shadow-md transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700"
                        onClick={() => {
                          setSelectedContent(content);
                          addContentViewRecord(content.title, {
                            description: content.description,
                            tags: content.tags,
                            imageUrl: content.imageUrl
                          });
                        }}
                      >
                        <div className="p-4 flex items-center">
                          <div 
                            className="w-16 h-16 rounded-md bg-cover bg-center mr-4" 
                            style={{ backgroundImage: `url(${content.imageUrl})` }}
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#1D1D1F] dark:text-white">{content.title}</h3>
                            <p className="text-sm text-[#86868B] dark:text-gray-400 line-clamp-2">{content.description}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleCopyText(content.id);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleSaveText(content.id);
                              }}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* 空状态 */}
          {generatedContent.length === 0 && !isGenerating && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F5F5F7] dark:bg-gray-800 mb-4">
                <MessageSquare className="h-8 w-8 text-[#86868B] dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-[#1D1D1F] dark:text-white mb-2">还没有生成内容</h3>
              <p className="text-[#86868B] dark:text-gray-400 max-w-md mx-auto">
                输入观众的心理困扰或问题，点击"生成解析"按钮，系统将为您生成相关的心理学解析和建议。
              </p>
            </div>
          )}
          
          {/* 生成中状态 */}
          {isGenerating && generatedContent.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F5F5F7] dark:bg-gray-800 mb-4">
                <RefreshCw className="h-8 w-8 text-[#8A2BE2] animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-[#1D1D1F] dark:text-white mb-2">正在生成内容</h3>
              <p className="text-[#86868B] dark:text-gray-400 max-w-md mx-auto">
                系统正在分析您输入的问题，并生成相关的心理学解析和建议，请稍候...
              </p>
            </div>
          )}
          
          {/* 内容详情视图 */}
          {selectedContent && (
            <ContentDetailView 
              content={selectedContent}
              onClose={() => setSelectedContent(null)}
              onSave={() => handleSaveText(selectedContent.id)}
              onCopy={() => handleCopyText(selectedContent.id)}
            />
          )}
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ConsultantDashboard;