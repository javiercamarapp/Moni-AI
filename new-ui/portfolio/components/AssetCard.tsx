import React from 'react';
import { Asset, AssetType } from '../types';
import { TrendingUp, TrendingDown, Bitcoin, DollarSign, Activity, Gem } from 'lucide-react';

interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick }) => {
  const totalValue = asset.currentPrice * asset.quantity;
  const totalCost = asset.purchasePrice * asset.quantity;
  const profit = totalValue - totalCost;
  const profitPercent = totalCost === 0 ? 0 : ((profit / totalCost) * 100);
  const isPositive = profit >= 0;

  const getIcon = () => {
    switch (asset.type) {
      case AssetType.CRYPTO: return <Bitcoin className="w-5 h-5 text-white" />;
      case AssetType.STOCK: return <DollarSign className="w-5 h-5 text-white" />;
      case AssetType.DIGITAL: return <Gem className="w-5 h-5 text-white" />;
      default: return <Activity className="w-5 h-5 text-white" />;
    }
  };

  const getIconBg = () => {
     switch (asset.type) {
      case AssetType.CRYPTO: return 'bg-orange-400';
      case AssetType.STOCK: return 'bg-[#8D6E63]'; // Secondary brown
      case AssetType.DIGITAL: return 'bg-purple-400'; // Digital/NFT accent
      default: return 'bg-blue-400';
    }
  }

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 shadow-sm mb-3 flex items-center justify-between transition-transform active:scale-[0.98] ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${getIconBg()} flex items-center justify-center shadow-sm`}>
          {getIcon()}
        </div>
        <div>
          <h3 className="font-bold text-gray-800">{asset.symbol}</h3>
          <p className="text-xs text-gray-500">{asset.quantity} {asset.quantity === 1 ? 'Unit' : 'Units'}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-bold text-gray-800">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <div className={`flex items-center justify-end gap-1 text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{isPositive ? '+' : ''}{profitPercent.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
};

export default AssetCard;