import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Plus, CreditCard } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

interface Account {
    id: string;
    bank_name: string;
    type?: string;
}

interface AccountsCarouselProps {
    accounts: Account[];
}

const AccountsCarousel: React.FC<AccountsCarouselProps> = ({ accounts }) => {
    const navigate = useNavigate();

    const gradients = [
        "from-slate-700 to-slate-900",
        "from-blue-400 to-blue-600",
        "from-purple-500 to-purple-700",
        "from-green-500 to-green-700",
    ];

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

                        return (
                            <CarouselItem key={account.id} className="pl-2 md:pl-4 basis-[75%] sm:basis-[45%] lg:basis-[30%]">
                                <div
                                    onClick={() => navigate('/accounts-cards')}
                                    className={`h-32 rounded-3xl bg-gradient-to-br ${gradients[index % gradients.length]} p-4 flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] transition-transform`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <span className="text-white font-bold text-xs">{account.bank_name.charAt(0)}</span>
                                            </div>
                                            <span className="text-white font-bold text-sm truncate max-w-[100px]">{account.bank_name}</span>
                                        </div>
                                        <CreditCard className="text-white/50" size={16} />
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
