import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Copy, Share2, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { GeneratedContent } from '@/services/ai-service';
import { cn } from '@/lib/utils';

// 图片轮播组件 - 作为Banner展示
interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // 确保至少有一张图片，并且所有图片都是有效的URL
  const allImages = images && images.length > 0 
    ? images.filter(url => typeof url === 'string' && url.trim() !== '')
    : ['https://images.unsplash.com/photo-1527525443983-6e60c75fff46'];
  
  // 切换到下一张图片
  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);
  
  // 切换到上一张图片
  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);
  
  // 自动轮播效果 - 5秒切换一次
  useEffect(() => {
    if (!isPlaying || allImages.length <= 1) return;
    
    const interval = setInterval(() => {
      nextImage();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPlaying, allImages.length, nextImage]);
  
  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevImage, nextImage]);
  
  // 处理按钮点击事件，阻止冒泡
  const handlePrevClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    prevImage();
  };
  
  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    nextImage();
  };
  
  const handlePlayPauseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsPlaying(!isPlaying);
  };
  
  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex(index);
  };
  
  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      {allImages.map((image, index) => (
        <img 
          key={index}
          src={image} 
          alt={`图片 ${index + 1}`}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            currentIndex === index ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
      
      {/* 图片覆盖层 - 渐变效果 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      
      {/* 只有多张图片时才显示控制按钮 */}
      {allImages.length > 1 && (
        <>
          {/* 左右切换按钮 - 更大更明显 */}
          <button
            type="button"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 rounded-full bg-white/30 backdrop-blur-sm hover:bg-white/50 text-white w-10 h-10 flex items-center justify-center z-10"
            onClick={handlePrevClick}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            type="button"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full bg-white/30 backdrop-blur-sm hover:bg-white/50 text-white w-10 h-10 flex items-center justify-center z-10"
            onClick={handleNextClick}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          
          {/* 播放/暂停按钮 */}
          <button
            type="button"
            className="absolute bottom-4 right-4 rounded-full bg-white/30 backdrop-blur-sm hover:bg-white/50 text-white w-8 h-8 flex items-center justify-center z-10"
            onClick={handlePlayPauseClick}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          
          {/* 图片指示器 - 更明显 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
            {allImages.map((_, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  currentIndex === index 
                    ? "bg-white scale-125" 
                    : "bg-white/50 hover:bg-white/70"
                )}
                onClick={(e) => handleDotClick(e, index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface ContentDetailViewProps {
  content: GeneratedContent;
  onClose: () => void;
  onSave?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
}

const ContentDetailView: React.FC<ContentDetailViewProps> = ({
  content,
  onClose,
  onSave,
  onCopy,
  onShare
}) => {
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
            <div key={index} className="font-mono text-sm bg-[#F8F5FF] dark:bg-gray-800 p-2 rounded text-[#8A2BE2] dark:text-purple-400 leading-relaxed my-1">
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

  // 使用一个完全不同的布局方式
  return (
    <Dialog defaultOpen={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 dark:bg-gray-900 grid grid-rows-[auto_auto_1fr] h-[90vh]">
        {/* 标题和操作按钮 */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-[#1D1D1F] dark:text-white mb-2">
                {content.title}
              </DialogTitle>
              
              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {content.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="bg-[#F8F5FF] text-[#8A2BE2] dark:bg-gray-700 dark:text-purple-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex space-x-2 ml-4">
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
          </div>
        </DialogHeader>

        {/* 图片轮播区域 - 固定高度 */}
        <div className="w-full h-[180px] sm:h-[220px] md:h-[250px]">
          <ImageCarousel 
            images={content.relatedImages && content.relatedImages.length > 0 
              ? content.relatedImages 
              : [content.imageUrl]} 
          />
        </div>

        {/* 内容区域 - 使用剩余空间并允许滚动 */}
        <div className="overflow-auto p-6 pt-4">
          {formatDescription(content.description)}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentDetailView;