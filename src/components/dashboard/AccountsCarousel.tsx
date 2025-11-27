import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Plus, CreditCard } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";

import banamexLogo from '@/assets/BankIcons/banamex.png';
import bbvaLogo from '@/assets/BankIcons/bbva.png';
import hsbcLogo from '@/assets/BankIcons/hsbc.png';
import inbursaLogo from '@/assets/BankIcons/inbursa.png';
import nuLogo from '@/assets/BankIcons/nu.png';
import santanderLogo from '@/assets/BankIcons/santander.png';
import scotiabankLogo from '@/assets/BankIcons/scotiabank.webp';
import mastercardLogo from '@/assets/BankIcons/mastercard.png';
import visaLogo from '@/assets/BankIcons/visa.png';
import amexLogo from '@/assets/BankIcons/amex.png';

interface Account {
    id: string;
    bank_name: string;
    account_id: string;
    plaid_item_id?: string;
    last_sync?: string;
    balance?: number;
}

interface AccountsCarouselProps {
    accounts: Account[];
}

const getCardType = (plaidItemId?: string) => {
    if (plaidItemId === 'banamex_conquista') return 'Crédito';
    if (plaidItemId === 'bbva_platinum') return 'Crédito';
    if (plaidItemId === 'bbva_debito') return 'Débito';
    return 'Cuenta';
};

const getMockBalance = (plaidItemId?: string) => {
    if (plaidItemId === 'banamex_conquista') return 25000.00;
    if (plaidItemId === 'bbva_platinum') return 15000.00;
    if (plaidItemId === 'bbva_debito') return 8500.00;
    return 0;
};

const getBankLogo = (bankName: string) => {
    const name = bankName.toLowerCase();
    if (name.includes('bbva')) return bbvaLogo;
    if (name.includes('banamex') || name.includes('citibanamex')) return banamexLogo;
    if (name.includes('santander')) return santanderLogo;
    if (name.includes('hsbc')) return hsbcLogo;
    if (name.includes('scotiabank')) return scotiabankLogo;
    if (name.includes('inbursa')) return inbursaLogo;
    if (name.includes('nu')) return nuLogo;
    return null;
};

const getNetworkLogo = (plaidItemId: string | undefined, accountId: string) => {
    // Check plaid_item_id first for explicit identification
    if (plaidItemId === 'banamex_conquista') return mastercardLogo;
    if (plaidItemId === 'bbva_platinum') return visaLogo;
    if (plaidItemId === 'bbva_debito') return visaLogo;
    
    // Fallback to account_id patterns
    const id = accountId.toLowerCase();
    if (id.includes('amex') || id.includes('american')) return amexLogo;
    if (id.includes('visa')) return visaLogo;
    if (id.includes('mastercard') || id.includes('master')) return mastercardLogo;
    
    // Smart detection by card number patterns (first 2 digits)
    const firstTwo = accountId.substring(0, 2);
    if (['51', '52', '53', '54', '55'].includes(firstTwo)) return mastercardLogo;
    if (firstTwo === '4') return visaLogo;
    if (['34', '37'].includes(firstTwo)) return amexLogo;
    
    return null;
};

const getCardName = (plaidItemId?: string, bankName?: string) => {
    // For these specific cards, use the bank name as the display name
    if (plaidItemId === 'banamex_conquista') return 'Conquista';
    if (plaidItemId === 'bbva_platinum') return 'Platinum';
    if (plaidItemId === 'bbva_debito') return 'Débito';
    
    // Extract card type from bank name if it includes it
    if (bankName?.includes('Conquista')) return 'Conquista';
    if (bankName?.includes('Platinum')) return 'Platinum';
    if (bankName?.includes('Débito')) return 'Débito';
    
    // Fallback to bank name
    return bankName || 'Tarjeta';
};

const getSolidColor = (bankName: string, plaidItemId?: string) => {
    // Special case for Banamex Conquista - matte dark grey
    if (plaidItemId === 'banamex_conquista') {
        return 'bg-gray-900';
    }
    
    // Special case for BBVA Platinum - silver
    if (plaidItemId === 'bbva_platinum') {
        return 'bg-[#adaeb0]';
    }

    const name = bankName.toLowerCase();
    if (name.includes('bbva')) return 'bg-blue-500';
    if (name.includes('banamex') || name.includes('citibanamex')) return 'bg-gray-900';
    if (name.includes('santander')) return 'bg-red-600';
    if (name.includes('hsbc')) return 'bg-red-700';
    if (name.includes('scotiabank')) return 'bg-red-800';
    if (name.includes('inbursa')) return 'bg-green-700';
    if (name.includes('nu')) return 'bg-purple-600';
    return 'bg-slate-800';
};

const AccountsCarousel: React.FC<AccountsCarouselProps> = ({ accounts }) => {
    const navigate = useNavigate();
    const [api, setApi] = useState<CarouselApi>();

    const gradients = [
        "from-slate-700 to-slate-900",
        "from-blue-400 to-blue-600",
        "from-purple-500 to-purple-700",
        "from-green-500 to-green-700",
    ];

    // Enable trackpad scrolling (two-finger scroll)
    useEffect(() => {
        if (!api) return;

        const onWheel = (e: WheelEvent) => {
            // Check if horizontal scroll is dominant
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault();
                if (e.deltaX > 0) {
                    api.scrollNext();
                } else {
                    api.scrollPrev();
                }
            }
        };

        // Add passive: false to allow preventDefault
        api.containerNode().addEventListener("wheel", onWheel, { passive: false });

        return () => {
            api.containerNode().removeEventListener("wheel", onWheel);
        };
    }, [api]);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between px-2 mb-3">
                <h3 className="text-gray-800 font-bold text-lg">Mis cuentas y tarjetas</h3>
                <button
                    onClick={() => navigate('/accounts-cards')}
                    className="text-[#8D6E63] text-xs font-bold hover:underline"
                >
                    Ver todas
                </button>
            </div>

            <Carousel
                setApi={setApi}
                className="w-full"
                opts={{
                    align: "start",
                    loop: false,
                    dragFree: true,
                }}
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {/* Accounts List */}
                    {accounts.map((account, index) => {
                        const logoUrl = getBankLogo(account.bank_name);
                        const last4 = account.account_id.slice(-4);
                        const displayTitle = getCardName(account.plaid_item_id, account.bank_name);
                        // Extract just the bank name (first word before space)
                        const bankNameOnly = account.bank_name.split(' ')[0];
                        const displaySubtitle = `${bankNameOnly} - •${last4}`;
                        const networkLogo = getNetworkLogo(account.plaid_item_id, account.account_id);
                        const solidColor = getSolidColor(account.bank_name, account.plaid_item_id);
                        const cardType = getCardType(account.plaid_item_id);
                        const balance = account.balance ?? getMockBalance(account.plaid_item_id);

                        return (
                            <CarouselItem key={account.id} className="pl-2 md:pl-4 basis-[75%] sm:basis-[45%] lg:basis-[30%]">
                                <div
                                    onClick={() => navigate('/accounts-cards')}
                                    className={`h-32 rounded-3xl ${solidColor} p-4 flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] transition-transform relative`}
                                >
                                    {/* Card Type Label and Network Logo - Upper Right */}
                                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                                        <span className="text-white/80 text-[10px] font-semibold px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                                            {cardType}
                                        </span>
                                        {networkLogo && (
                                            <img src={networkLogo} alt="Network" className="w-10 h-7 object-contain" />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <div className="w-7 sm:w-8 h-7 sm:h-8 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                                                    {logoUrl ? (
                                                        <img 
                                                            src={logoUrl} 
                                                            alt={account.bank_name} 
                                                            className="w-10 sm:w-11 h-10 sm:h-11 object-contain"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <span className={`text-slate-700 font-bold text-xs ${logoUrl ? 'hidden' : ''}`}>
                                                        {account.bank_name.charAt(0)}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Title and Subtitle */}
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-white font-bold text-sm truncate max-w-[120px]">
                                                    {displayTitle}
                                                </span>
                                                <span className="text-white/70 text-[10px] truncate">
                                                    {displaySubtitle}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-white/70 text-[10px] font-medium mb-0.5">Balance actual</p>
                                            <p className="text-white text-xl font-bold">
                                                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        );
                    })}

                    {/* Add New Card Button */}
                    <CarouselItem className="pl-2 md:pl-4 basis-[40%] sm:basis-[30%] lg:basis-[20%]">
                        <div
                            onClick={() => navigate("/bank-connection")}
                            className="h-32 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <Plus className="text-gray-400" size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400">Agregar</span>
                        </div>
                    </CarouselItem>
                </CarouselContent>
                
                <CarouselPrevious className="left-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg" />
                <CarouselNext className="right-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg" />
            </Carousel>
        </div>
    );
};

export default AccountsCarousel;
