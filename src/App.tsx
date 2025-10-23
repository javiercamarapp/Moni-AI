import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./components/Dashboard";
import ChatInterface from "./components/ChatInterface";
import NewGoal from "./pages/NewGoal";
import FinancialChat from "./pages/FinancialChat";
import Ingresos from "./pages/Ingresos";
import Gastos from "./pages/Gastos";
import GestionarCategorias from "./pages/GestionarCategorias";
import Profile from "./pages/Profile";
import Balance from "./pages/Balance";
import WhatsAppSetup from "./pages/WhatsAppSetup";
import FinancialAnalysis from "./pages/FinancialAnalysis";
import BankConnection from "./pages/BankConnection";
import NotificationSettings from "./pages/NotificationSettings";
import NetWorth from "./pages/NetWorth";
import ScoreMoni from "./pages/ScoreMoni";
import Assets from "./pages/Assets";
import Liabilities from "./pages/Liabilities";
import LevelQuiz from "./pages/LevelQuiz";
import LevelDetails from "./pages/LevelDetails";
import AspirationsAnalysis from "./pages/AspirationsAnalysis";
import FinancialJourney from "./pages/FinancialJourney";

import Subscriptions from "./pages/Subscriptions";
import DailyExpenses from './pages/DailyExpenses';
import Reports from './pages/Reports';

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/new-goal" element={<NewGoal />} />
            <Route path="/financial-chat" element={<FinancialChat />} />
            <Route path="/ingresos" element={<Ingresos />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/categorias" element={<GestionarCategorias />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/balance" element={<Balance />} />
            <Route path="/whatsapp" element={<WhatsAppSetup />} />
            <Route path="/analysis" element={<FinancialAnalysis />} />
            <Route path="/bank-connection" element={<BankConnection />} />
            <Route path="/notifications" element={<NotificationSettings />} />
            <Route path="/net-worth" element={<NetWorth />} />
            <Route path="/score-moni" element={<ScoreMoni />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/liabilities" element={<Liabilities />} />
            <Route path="/level-quiz" element={<LevelQuiz />} />
            <Route path="/level-details" element={<LevelDetails />} />
            <Route path="/aspirations-analysis" element={<AspirationsAnalysis />} />
            <Route path="/financial-journey" element={<FinancialJourney />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/daily-expenses" element={<DailyExpenses />} />
          <Route path="/reports" element={<Reports />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
