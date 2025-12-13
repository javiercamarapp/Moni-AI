import { useState, useRef } from 'react';
import { ShoppingCart, Landmark, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  id: string;
  description: string;
  transaction_date: string;
  amount: number;
  payment_method: string;
  categories?: { name: string; color: string };
}

interface TransactionRowProps {
  tx: Transaction;
  txDate: Date;
  index: number;
  onDelete: (id: string) => void;
  type: 'gasto' | 'ingreso';
}

const TransactionRow = ({ tx, txDate, index, onDelete, type }: TransactionRowProps) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const rowRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = startX.current - currentX;
    // Only allow left swipe (negative direction)
    if (diff > 0) {
      setSwipeX(Math.min(diff, 80));
    } else {
      setSwipeX(0);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeX > 60) {
      // Trigger delete
      onDelete(tx.id);
    }
    setSwipeX(0);
  };

  const Icon = type === 'gasto' ? ShoppingCart : Landmark;
  const amountColor = type === 'gasto' ? 'text-[#5D4037]' : 'text-[#A1887F]';
  const amountPrefix = type === 'gasto' ? '-' : '+';

  return (
    <div className="relative overflow-hidden rounded-2xl shrink-0">
      {/* Delete background */}
      <div 
        className="absolute inset-y-0 right-0 w-20 bg-[#8D6E63] flex items-center justify-center rounded-r-2xl"
        style={{ opacity: swipeX / 80 }}
      >
        <Trash2 className="w-5 h-5 text-white" />
      </div>
      
      {/* Main row */}
      <div
        ref={rowRef}
        className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 group cursor-pointer hover:shadow-md transition-all animate-in slide-in-from-bottom-2 duration-500 relative"
        style={{ 
          animationDelay: `${index * 50}ms`,
          transform: `translateX(-${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-9 h-9 rounded-xl bg-[#EFEBE9] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#5D4037]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm truncate">{tx.description}</h4>
          <p className="text-[10px] text-gray-500 font-medium">
            {txDate.toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {tx.categories && (
              <Badge className="text-[9px] font-medium px-1.5 py-0 rounded bg-[#EFEBE9] text-[#5D4037] border-0">
                {tx.categories.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()}
              </Badge>
            )}
            {tx.payment_method && (
              <Badge className="text-[9px] font-medium px-1.5 py-0 rounded bg-gray-100 text-gray-600 border-0 capitalize">
                {tx.payment_method}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0 flex items-center gap-2">
          <span className={`block font-bold ${amountColor} text-sm`}>
            {amountPrefix}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tx.id);
            }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#EFEBE9] transition-all"
            aria-label="Eliminar transacción"
          >
            <Trash2 className="w-4 h-4 text-[#8D6E63] hover:text-[#5D4037]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionRow;