import React from 'react';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  mobileClassName,
  tabletClassName,
  desktopClassName,
}) => {
  const { isMobile, isTablet, isDesktop } = useMobile();

  return (
    <div
      className={cn(
        className,
        isMobile && mobileClassName,
        isTablet && tabletClassName,
        isDesktop && desktopClassName
      )}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;