import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AssetType } from '../types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: any) => void;
}

const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<AssetType>(AssetType.STOCK);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      symbol: symbol.toUpperCase(),
      quantity: Number(quantity),
      purchasePrice: Number(price),
      type,
      purchaseDate: date,
      currentPrice: Number(price) // Initially same as purchase
    });
    // Reset form
    setSymbol('');
    setQuantity('');
    setPrice('');
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  const getTypeStyle = (t: AssetType) => {
    const isSelected = type === t;
    return `flex-1 py-2 rounded-xl text-xs font-bold transition-colors uppercase ${
      isSelected ? 'bg-[#5D4037] text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
    }`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#5D4037]">Agregar Activo</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2 ml-1 uppercase tracking-wider">Tipo de Activo</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setType(AssetType.STOCK)} className={getTypeStyle(AssetType.STOCK)}>
                Acciones
              </button>
              <button type="button" onClick={() => setType(AssetType.CRYPTO)} className={getTypeStyle(AssetType.CRYPTO)}>
                Cripto
              </button>
              <button type="button" onClick={() => setType(AssetType.DIGITAL)} className={getTypeStyle(AssetType.DIGITAL)}>
                Digital
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider">Símbolo (Ticker)</label>
            <input
              required
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Ej. AAPL, BTC, BAYC"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8D6E63] font-medium placeholder-gray-300"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider">Cantidad</label>
              <input
                required
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8D6E63] font-medium placeholder-gray-300"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider">Precio Compra</label>
              <input
                required
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="$0.00"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8D6E63] font-medium placeholder-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider">Fecha Valuación</label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8D6E63] font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#5D4037] text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-[#5D4037]/30 active:scale-[0.98] transition-transform hover:bg-[#4E342E]"
          >
            Guardar Inversión
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAssetModal;