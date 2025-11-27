import React from 'react';
import { Bell, Wallet, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import moniLogo from '/moni-logo.png';

interface DashboardHeaderProps {
    userName?: string;
    unreadNotifications?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName = "Usuario", unreadNotifications = 0 }) => {
    const navigate = useNavigate();

    return (
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between px-6 py-4 pt-8 gap-4">
            <div className="flex items-center gap-3">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#F5F0EE] flex items-center justify-center border-2 border-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.15)] overflow-hidden p-1.5">
                    <img src={moniLogo} alt="Moni AI" className="h-full w-full object-contain" />
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-400 text-xs sm:text-sm font-medium">Buenos días,</span>
                    <span className="text-gray-800 font-bold text-lg sm:text-xl leading-tight">{userName}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* Cuentas y Tarjetas */}
                <button
                    onClick={() => navigate("/accounts-cards")}
                    className="inline-flex items-center justify-center bg-white rounded-full text-gray-600 h-9 w-9 sm:h-10 sm:w-10 shadow-sm hover:shadow-md transition-all border border-gray-100"
                >
                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Botón de notificaciones */}
                <div className="relative">
                    <button
                        onClick={() => navigate("/notifications")}
                        className="inline-flex items-center justify-center bg-white rounded-full text-gray-600 h-9 w-9 sm:h-10 sm:w-10 shadow-sm hover:shadow-md transition-all border border-gray-100"
                    >
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    {unreadNotifications > 0 && (
                        <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-pulse"></div>
                    )}
                </div>

                {/* Perfil */}
                <button
                    onClick={() => navigate("/profile")}
                    className="inline-flex items-center justify-center bg-white rounded-full text-gray-600 h-9 w-9 sm:h-10 sm:w-10 shadow-sm hover:shadow-md transition-all border border-gray-100"
                >
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
            </div>
        </header>
    );
};

export default DashboardHeader;
