import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Save, Copy, Share2, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { GeneratedContent } from '@/services/ai-service';
import { cn } from '@/lib/utils';

interface ContentDisplayProps {
  content: GeneratedContent;
  onSave?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
  className?: string;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({
  content,
  onSave,
  onCopy,
  onShare,
  className
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // 获取所有可用的图片
  const allImages = content.relatedImages && content.relatedImages.length > 0 
    ? content.relatedImages.filter(url => typeof url === 'string' && url.trim() !== '')
    : [content.imageUrl];
    
  // 添加调试日志
  console.log('ContentDisplay 轮播图片数组:', allImages);

  // 5秒轮播效果
  useEffect(() => {
    if (!isPlaying || allImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, allImages.length]);

  // 手动切换到下一张图片
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  // 手动切换到上一张图片
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // 格式化描述文本，支持Markdown样式和思维导图
  const formatDescription = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // 处理标题
        if (line.startsWith('🧠 **') || line.startsWith('📖 **') || line.startsWith('💡 **')) {
          const title = line.replace(/\*\*/g, '');
          return (
            <div key={index} className="font-bold text-lg text-[#1D1D1F] dark:text-white mb-3 mt-6 first:mt-0 flex items-center">
              {title}
            </div>
          );
        }
        
        // 处理思维导图部分
        if (line.includes('┌─') || line.includes('├─') || line.includes('└─')) {
          return (
            <div key={index} className="font-mono text-sm bg-[#F8F5FF] dark:bg-gray-800 p-3 rounded-lg text-[#8A2BE2] dark:text-purple-400 leading-relaxed my-2 border-l-4 border-[#8A2BE2]">
              {line}
            </div>
          );
        }
        
        // 处理分隔线
        if (line.trim() === '---') {
          return <hr key={index} className="my-6 border-[#D2D2D7] dark:border-gray-600" />;
        }
        
        // 处理空行
        if (line.trim() === '') {
          return <div key={index} className="h-3" />;
        }
        
        // 处理普通文本
        return (
          <p key={index} className="text-[#424245] dark:text-gray-300 leading-relaxed mb-3">
            {line}
          </p>
        );
      });
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 固定图片区域 */}
      <div className="relative h-60 sm:h-80 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4 sm:mb-6 flex-shrink-0">
        <img 
          src={allImages[currentImageIndex]} 
          alt={content.title}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        
        {/* 图片覆盖层 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* 图片控制按钮 */}
        {allImages.length > 1 && (
          <>
            {/* 左右切换按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
              onClick={prevImage}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
              onClick={nextImage}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            
            {/* 播放/暂停按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-4 right-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            {/* 图片指示器 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    currentImageIndex === index 
                      ? "bg-white scale-125" 
                      : "bg-white/50 hover:bg-white/70"
                  )}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </>
        )}
        
        {/* 标题覆盖 */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{content.title}</h2>
          <div className="flex flex-wrap gap-2">
            {content.tags.slice(0, 4).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-white/20 text-white border-white/30"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* 可滚动内容区域 */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="pr-4">
            {/* 操作按钮 */}
            <div className="flex flex-wrap justify-end gap-2 mb-4">
              {onShare && (
                <Button variant="outline" size="sm" onClick={onShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  分享
                </Button>
              )}
              {onCopy && (
                <Button variant="outline" size="sm" onClick={onCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  复制
                </Button>
              )}
              {onSave && (
                <Button size="sm" onClick={onSave} className="bg-[#8A2BE2] hover:bg-[#7B1FA2] text-white">
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </Button>
              )}
            </div>
            
            {/* 格式化的内容 */}
            <div className="space-y-1">
              {formatDescription(content.description)}
            </div>
            
            {/* 创建时间 */}
            <div className="mt-6 pt-4 border-t border-[#D2D2D7] dark:border-gray-600 text-sm text-[#86868B] dark:text-gray-400">
              创建时间：{new Date(content.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ContentDisplay;