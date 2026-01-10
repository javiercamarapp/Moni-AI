import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  className?: string;
  sticky?: boolean;
  rightElement?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  className,
  sticky = true,
  rightElement
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn(
      "w-full px-5 py-4 flex items-center gap-3",
      sticky && "sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100",
      className
    )}>
      <button 
        onClick={handleBack} 
        className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all text-gray-700 flex-shrink-0"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex flex-col flex-1 min-w-0">
        <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-gray-500 font-medium truncate">{subtitle}</p>
        )}
      </div>
      {rightElement && (
        <div className="flex-shrink-0">
          {rightElement}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
