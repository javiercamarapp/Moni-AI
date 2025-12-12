import React from 'react';
import { TrendingUp, TrendingDown, Bitcoin, DollarSign, Activity, Gem } from 'lucide-react';

export enum AssetType {
    STOCK = 'STOCK',
    CRYPTO = 'CRYPTO',
    ETF = 'ETF',
    DIGITAL = 'DIGITAL'
}

export interface Asset {
    id: string;
    symbol: string;
    name: string;
    type: AssetType;
    quantity: number;
    purchasePrice: number;
    purchaseDate: string;
    currentPrice: number;
}

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
            case AssetType.ETF: return <Activity className="w-5 h-5 text-white" />;
            case AssetType.DIGITAL: return <Gem className="w-5 h-5 text-white" />;
            default: return <Activity className="w-5 h-5 text-white" />;
        }
    };

    const getIconBg = () => {
        switch (asset.type) {
            case AssetType.CRYPTO: return 'bg-orange-400';
            case AssetType.STOCK: return 'bg-[#8D6E63]';
            case AssetType.ETF: return 'bg-blue-400';
            case AssetType.DIGITAL: return 'bg-purple-400';
            default: return 'bg-gray-400';
        }
    }

    return (
        <div
            onClick={() => {
                console.log('AssetCard clicked:', asset.symbol, asset.id);
                if (onClick) onClick();
            }}
            className={`bg-white rounded-2xl p-4 shadow-sm mb-3 flex items-center justify-between transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''}`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${getIconBg()} flex items-center justify-center shadow-sm`}>
                    {getIcon()}
                </div>
                <div>
                    <div className="flex items-baseline gap-1.5">
                        <h3 className="font-bold text-gray-800 text-base">{asset.symbol}</h3>
                        <span className="text-xs text-gray-500">·</span>
                        <span className="text-xs text-gray-500">{asset.quantity} {asset.quantity === 1 ? 'Unit' : 'Units'}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{asset.name}</p>
                </div>
            </div>

            <div className="text-right">
                <p className="font-bold text-gray-800 text-base">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <div className={`flex items-center justify-end gap-1 text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span>{isPositive ? '+' : ''}{profitPercent.toFixed(2)}%</span>
                </div>
            </div>
        </div>
    );
};

export default AssetCard;
