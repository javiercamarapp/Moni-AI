import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { headingPage } from "@/styles/typography";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBankConnections } from "@/hooks/useFinancialData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";

const BankCard = ({ 
  bank, 
  balance, 
  index, 
  isActive, 
  total, 
  onClick,
  cardName
}: { 
  bank: string; 
  balance: number; 
  index: number; 
  isActive: boolean;
  total: number;
  onClick: () => void;
  cardName: string;
}) => {
  const gradients = {
    'Banamex': "from-gray-700 to-gray-900",
    'BBVA': "from-blue-600 to-blue-800",
    'default': "from-slate-700 to-slate-900"
  };

  const getGradient = (bankName: string) => {
    return gradients[bankName as keyof typeof gradients] || gradients.default;
  };

  const getBankLogo = (bankName: string) => {
    if (bankName === 'Banamex') return '🏦';
    if (bankName === 'BBVA') return '🏛️';
    return '🏦';
  };

  // Calculate position in the stack
  const offset = isActive ? 0 : (index * 8);
  const scale = isActive ? 1 : 0.95 - (index * 0.02);
  const zIndex = total - index;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: 1, 
        y: offset,
        scale: scale,
        zIndex: zIndex
      }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      onClick={onClick}
      className="absolute top-0 left-0 right-0 cursor-pointer"
      style={{ 
        transformOrigin: "top center"
      }}
    >
      <Card className={`bg-gradient-to-br ${getGradient(bank)} p-6 border-0 shadow-xl rounded-3xl w-full mx-auto max-w-[340px]`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">{getBankLogo(bank)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold">{bank}</span>
              <span className="text-white/70 text-sm">{cardName}</span>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-full backdrop-blur-sm" />
        </div>
        <div>
          <p className="text-white/80 text-sm mb-1">Total Balance</p>
          <p className="text-white text-3xl font-bold">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default function AccountsCards() {
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState(0);
  
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: bankConnections = [] } = useBankConnections();

  // Calculate total balance (usando un balance simulado basado en el número de conexiones)
  const totalBalance = bankConnections.reduce((sum, conn, index) => {
    // Balance simulado entre 1000 y 10000
    const simulatedBalance = 5000 + (index * 2500);
    return sum + simulatedBalance;
  }, 0);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  // Get formatted date
  const getFormattedDate = () => {
    const date = new Date();
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Usuario';

  return (
    <div className="page-standard min-h-screen pb-20 overflow-y-auto">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#f5f0ee]/80 to-transparent backdrop-blur-sm">
        <div className="page-container py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className={headingPage}>Mis Cuentas y Tarjetas</h1>
              <p className="text-sm text-gray-500">Gestiona tus medios de pago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-container py-6 space-y-6">

        {/* Cards Stack */}
        <div className="relative h-[220px] mb-8">
          <div className="relative w-full max-w-[340px] mx-auto h-full">
            {bankConnections.length > 0 ? (
              <>
                {bankConnections.map((connection, index) => {
                  // Balance simulado para cada tarjeta
                  const simulatedBalance = 5000 + (index * 2500);
                  // Extract card name from plaid_item_id
                  const getCardName = (itemId: string) => {
                    if (itemId?.includes('conquista')) return 'Conquista';
                    if (itemId?.includes('platinum')) return 'Platinum';
                    if (itemId?.includes('debito')) return 'Débito';
                    return '';
                  };
                  return (
                    <BankCard
                      key={connection.id}
                      bank={connection.bank_name}
                      cardName={getCardName(connection.plaid_item_id || '')}
                      balance={simulatedBalance}
                      index={index}
                      isActive={index === selectedCard}
                      total={bankConnections.length}
                      onClick={() => setSelectedCard(index)}
                    />
                  );
                })}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                <Card className="bg-gradient-to-br from-slate-200 to-slate-300 p-6 border-0 shadow-xl rounded-3xl max-w-[340px] mx-auto">
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-gray-600 mb-2">No tienes tarjetas agregadas</p>
                    <p className="text-sm text-gray-500">Presiona + para agregar una</p>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Card indicator dots */}
          {bankConnections.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {bankConnections.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCard(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === selectedCard 
                      ? 'w-8 bg-primary' 
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Card Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate("/bank-connection")}
          className="w-full max-w-[340px] mx-auto block mb-6"
        >
          <Card className="bg-gradient-to-br from-[#f5f0ee] to-[#D0BCFF] p-4 border-0 shadow-lg rounded-2xl hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-gray-700 font-semibold">Agregar Nueva Cuenta</p>
            </div>
          </Card>
        </motion.button>

        {/* Total Balance Card */}
        {bankConnections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">Balance Total 💰</p>
                  <p className="text-white text-4xl font-bold">
                    ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-4xl">🎯</div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-4"
        >
          <Button
            variant="outline"
            className="h-14 rounded-2xl border-2 hover:bg-accent/50 transition-all group"
            onClick={() => navigate("/ingresos")}
          >
            <ArrowDownLeft className="h-5 w-5 mr-2 text-green-600 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Ingresos</span>
          </Button>
          <Button
            className="h-14 rounded-2xl bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg transition-all group"
            onClick={() => navigate("/gastos")}
          >
            <ArrowUpRight className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Gastos</span>
          </Button>
        </motion.div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-4 rounded-2xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/balance")}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Balance</p>
                  <p className="font-semibold text-gray-900">Ver detalles</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-4 rounded-2xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/movimientos")}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💳</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Movimientos</p>
                  <p className="font-semibold text-gray-900">Ver historial</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}