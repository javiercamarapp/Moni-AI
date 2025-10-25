import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CategorySectionProps {
  title: string;
  total: number;
  count: number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  badgeColor: string;
  children: React.ReactNode;
  isEmpty?: boolean;
}

// Helper function to format large numbers
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 100000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
};

export function CategorySection({
  title,
  total,
  count,
  icon,
  iconBgColor,
  iconColor,
  badgeColor,
  children,
  isEmpty = false
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-[20px] shadow-xl border border-blue-100 overflow-hidden">
      <button
        onClick={() => !isEmpty && setIsExpanded(!isExpanded)}
        className={cn(
          "w-full p-4 flex items-center justify-between transition-all",
          !isEmpty && "hover:bg-primary/5 cursor-pointer"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", iconBgColor)}>
            {icon}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm leading-tight">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{count} {count === 1 ? 'cuenta' : 'cuentas'}</p>
              {isEmpty && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-muted-foreground/40 text-muted-foreground">
                  Sin datos
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-bold text-foreground text-sm">
            {formatCurrency(total)}
          </p>
          {!isEmpty && (
            isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )
          )}
        </div>
      </button>
      
      {isExpanded && !isEmpty && (
        <div className="border-t border-blue-100 p-3 space-y-2 bg-background/30">
          {children}
        </div>
      )}
    </div>
  );
}
