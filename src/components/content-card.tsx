import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, Copy, Share2, BookmarkPlus, User } from 'lucide-react';
import { GeneratedContent } from '@/services/ai-service';
import { cn } from '@/lib/utils';

interface ContentCardProps {
  content: GeneratedContent;
  onSave?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onClick?: () => void;
  className?: string;
}

const ContentCard: React.FC<ContentCardProps> = ({
  content,
  onSave,
  onCopy,
  onShare,
  onBookmark,
  onClick,
  className
}) => {

  // 格式化描述文本，支持Markdown样式
  const formatDescription = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // 处理标题
        if (line.startsWith('**') && line.endsWith('**')) {
          const title = line.replace(/\*\*/g, '');
          return (
            <div key={index} className="font-semibold text-[#1D1D1F] dark:text-white mb-2 mt-3 first:mt-0">
              {title}
            </div>
          );
        }
        
        // 处理思维导图部分
        if (line.includes('┌─') || line.includes('├─') || line.includes('└─')) {
          return (
            <div key={index} className="font-mono text-sm text-[#8A2BE2] dark:text-purple-400 leading-relaxed">
              {line}
            </div>
          );
        }
        
        // 处理分隔线
        if (line.trim() === '---') {
          return <hr key={index} className="my-4 border-[#D2D2D7] dark:border-gray-600" />;
        }
        
        // 处理空行
        if (line.trim() === '') {
          return <div key={index} className="h-2" />;
        }
        
        // 处理普通文本
        return (
          <div key={index} className="text-[#86868B] dark:text-gray-300 leading-relaxed">
            {line}
          </div>
        );
      });
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden shadow-sm border-0 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700",
        className
      )}
      onClick={onClick}
    >
      {/* 图片区域 */}
      <div 
        className="h-36 sm:h-48 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${content.imageUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* 操作按钮 */}
        <div className="absolute top-3 right-3 flex space-x-1">
          {onBookmark && (
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-8 w-8 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onBookmark();
              }}
            >
              <BookmarkPlus className="h-4 w-4" />
            </Button>
          )}
          {onShare && (
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-8 w-8 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onShare();
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-3 sm:p-4">
        {/* 标题 */}
        <h3 className="font-semibold text-lg text-[#1D1D1F] dark:text-white mb-3 line-clamp-2">
          {content.title}
        </h3>

        {/* 描述内容 - 只显示简短摘要，不显示完整内容 */}
        <div className="text-sm text-[#86868B] dark:text-gray-400 mb-4 line-clamp-3">
          {content.summary || content.description.split('\n')[0] || '点击查看详情'}
        </div>

        {/* 标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {content.tags.slice(0, 3).map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs bg-[#F8F5FF] text-[#8A2BE2] dark:bg-gray-700 dark:text-purple-300"
            >
              {tag}
            </Badge>
          ))}
          {content.tags.length > 3 && (
            <Badge 
              variant="secondary" 
              className="text-xs bg-[#F8F5FF] text-[#8A2BE2] dark:bg-gray-700 dark:text-purple-300"
            >
              +{content.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* 底部操作按钮 */}
        <div className="flex justify-between items-center pt-2 border-t border-[#F5F5F7] dark:border-gray-700">
          <div className="text-xs text-[#86868B] dark:text-gray-400">
            点击查看详情
          </div>
          <div className="flex space-x-1">
            {onCopy && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-[#86868B] hover:text-[#8A2BE2] dark:text-gray-400 dark:hover:text-purple-400"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onCopy();
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {onSave && (
              <Button 
                size="icon" 
                variant="ghost"
                className="h-8 w-8 text-[#86868B] hover:text-[#8A2BE2] dark:text-gray-400 dark:hover:text-purple-400"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onSave();
                }}
              >
                <Save className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentCard;