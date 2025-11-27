import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Plus, CreditCard } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

interface Account {
    id: string;
    bank_name: string;
    account_id: string;
    type?: string;
    plaid_item_id?: string;
}

interface AccountsCarouselProps {
    accounts: Account[];
}

const AccountsCarousel: React.FC<AccountsCarouselProps> = ({ accounts }) => {
    const navigate = useNavigate();

    // Map plaid_item_id to card details
    const getCardDetails = (account: Account) => {
        const itemId = account.plaid_item_id || '';
        if (itemId.includes('conquista') || account.bank_name === 'Banamex') {
            return { cardName: 'Conquista', cardType: 'credit' as const };
        } else if (itemId.includes('platinum')) {
            return { cardName: 'Platinum', cardType: 'credit' as const };
        } else if (itemId.includes('debito')) {
            return { cardName: 'Débito', cardType: 'debit' as const };
        }
        return { cardName: '', cardType: 'credit' as const };
    };

    const gradients = {
        'Banamex': "from-gray-700 to-gray-900",
        'BBVA': "from-blue-600 to-blue-800",
        'default': "from-slate-700 to-slate-900"
    };

    // Get gradient based on bank name
    const getGradient = (bankName: string, plaidItemId?: string) => {
        // Special case for Banamex Conquista - dark grey matte
        if (plaidItemId === 'banamex_conquista') {
            return 'from-gray-700 to-gray-900';
        }
        return gradients[bankName as keyof typeof gradients] || gradients.default;
    };

    // Function to get card network based on account_id and plaid_item_id
    const getCardNetwork = (accountId: string, plaidItemId?: string) => {
        // Explicit card type mapping for known cards
        if (plaidItemId === 'banamex_conquista') return 'Mastercard';
        if (plaidItemId === 'bbva_platinum') return 'Visa';
        if (plaidItemId === 'bbva_debito') return 'Visa';
        
        // Fallback to number-based detection
        if (accountId.startsWith('4')) {
            return 'Visa';
        } else if (accountId.startsWith('5')) {
            return 'Mastercard';
        } else if (accountId.startsWith('3')) {
            return 'Amex';
        }
        return 'Card';
    };

    // Get bank logo emoji
    const getBankLogo = (bankName: string) => {
        if (bankName === 'Banamex') return '🏦';
        if (bankName === 'BBVA') return '🏛️';
        return '🏦';
    };

    // Extract last 4 digits
    const getLastFourDigits = (accountId: string) => {
        const digits = accountId.replace(/\D/g, '');
        return digits.slice(-4);
    };

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
                className="w-full"
                opts={{
                    align: "start",
                    loop: false,
                }}
            >
                <CarouselContent className="-ml-2 md:-ml-4">
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

                    {/* Accounts List */}
                    {accounts.map((account, index) => {
                        // Simulated balance for display purposes as per original component
                        const simulatedBalance = 5000 + (index * 2500);
                        const cardNetwork = getCardNetwork(account.account_id, account.plaid_item_id);
                        const lastFour = getLastFourDigits(account.account_id);
                        const cardDetails = getCardDetails(account);
                        const bankLogo = getBankLogo(account.bank_name);
                        const gradient = getGradient(account.bank_name, account.plaid_item_id);

                        return (
                            <CarouselItem key={account.id} className="pl-2 md:pl-4 basis-[75%] sm:basis-[45%] lg:basis-[30%]">
                                <div
                                    onClick={() => navigate('/accounts-cards')}
                                    className={`h-32 rounded-3xl bg-gradient-to-br ${gradient} p-4 flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] transition-transform`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <span className="text-xl">{bankLogo}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-sm truncate max-w-[120px]">
                                                    {account.bank_name} {cardDetails.cardName}
                                                </span>
                                                <span className="text-white/60 text-[10px] font-medium">•••• {lastFour}</span>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-white text-[9px] font-bold ${
                                            cardNetwork === 'Visa' ? 'bg-blue-700' : 
                                            cardNetwork === 'Mastercard' ? 'bg-orange-600' : 
                                            'bg-gray-600'
                                        }`}>
                                            {cardNetwork.toUpperCase()}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-white/70 text-[10px] font-medium mb-0.5">Balance Total</p>
                                        <p className="text-white text-xl font-bold">
                                            ${simulatedBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                        </p>
                                    </div>
                                </div>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
            </Carousel>
        </div>
    );
};

export default AccountsCarousel;
