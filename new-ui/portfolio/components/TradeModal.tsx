import React, { useState, useEffect } from 'react';
import { X, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  type: 'BUY' | 'SELL';
  assetSymbol: string;
  currentPrice: number;
  onClose: () => void;
  onConfirm: (quantity: number, price: number) => void;
}

const TradeModal: React.FC<TradeModalProps> = ({ 
  isOpen, 
  type, 
  assetSymbol, 
  currentPrice, 
  onClose, 
  onConfirm 
}) => {
  const [step, setStep] = useState<'INPUT' | 'CONFIRM'>('INPUT');
  const [quantity, setQuantity] = useState('');
  const [manualPrice, setManualPrice] = useState('');

  // Reset/Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('INPUT');
      setQuantity('');
      setManualPrice(''); 
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmitInput = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('CONFIRM');
  };

  const handleFinalConfirm = () => {
    onConfirm(Number(quantity), Number(manualPrice));
    onClose();
  };

  const estimatedTotal = (Number(quantity) || 0) * (Number(manualPrice) || 0);
  const isBuy = type === 'BUY';

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up sm:animate-fade-in-up">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide ${isBuy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {step === 'INPUT' ? (isBuy ? 'Nueva Compra' : 'Nueva Venta') : 'Confirmación'}
            </span>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">{assetSymbol}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {step === 'INPUT' ? (
          <form onSubmit={handleSubmitInput} className="space-y-5">
            <div className="flex gap-4">
              {/* Quantity Input */}
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-gray-400 mb-2 ml-1 uppercase tracking-wider">
                  Cantidad
                </label>
                <input
                  autoFocus
                  type="number"
                  step="any"
                  required
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20 placeholder-gray-200 text-center"
                />
              </div>

              {/* Price Input */}
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-gray-400 mb-2 ml-1 uppercase tracking-wider">
                  {isBuy ? 'Precio de Compra' : 'Precio de Venta'}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  placeholder={currentPrice.toFixed(2)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5D4037]/20 placeholder-gray-300 text-center"
                />
              </div>
            </div>

            {/* Calculations */}
            <div className="bg-[#5D4037]/5 rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm font-medium text-[#5D4037]">Total Estimado</span>
              <span className="text-xl font-bold text-[#5D4037]">
                ${estimatedTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={!quantity || Number(quantity) <= 0 || !manualPrice}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-transform active:scale-[0.98] ${
                !quantity || Number(quantity) <= 0 || !manualPrice
                  ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                  : isBuy 
                    ? 'bg-[#5D4037] hover:bg-[#4E342E] shadow-[#5D4037]/30' 
                    : 'bg-gray-800 hover:bg-gray-900 shadow-gray-800/30'
              }`}
            >
              {isBuy ? 'Confirmar Compra' : 'Confirmar Venta'}
            </button>
          </form>
        ) : (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                <div className="text-center mb-4">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Resumen de la Orden</p>
                </div>
                
                {/* Details List */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span className="text-sm text-gray-500">Activo</span>
                        <span className="text-base font-bold text-gray-800">{assetSymbol}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span className="text-sm text-gray-500">Cantidad</span>
                        <span className="text-base font-bold text-gray-800">{Number(quantity)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span className="text-sm text-gray-500">Precio Unitario</span>
                        <span className="text-base font-bold text-gray-800">${Number(manualPrice).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                        <span className="text-sm font-bold text-[#5D4037]">Total</span>
                        <span className="text-xl font-bold text-[#5D4037]">${estimatedTotal.toLocaleString()}</span>
                    </div>
                </div>
             </div>

             <div className="flex flex-col gap-3">
               <button
                  onClick={handleFinalConfirm}
                  className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 ${
                    isBuy ? 'bg-[#5D4037] hover:bg-[#4E342E]' : 'bg-gray-800 hover:bg-gray-900'
                  }`}
               >
                  <CheckCircle2 size={20} />
                  Finalizar Orden
               </button>
               <button 
                  onClick={() => setStep('INPUT')}
                  className="w-full py-3 rounded-xl font-bold text-gray-400 hover:text-gray-600"
               >
                  Cancelar
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeModal;