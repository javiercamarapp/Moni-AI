import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
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
import NotificationHistory from "./pages/NotificationHistory";
import NetWorth from "./pages/NetWorth";
import ScoreMoni from "./pages/ScoreMoni";
import Assets from "./pages/Assets";
import Liabilities from "./pages/Liabilities";
import LevelQuiz from "./pages/LevelQuiz";
import LevelDetails from "./pages/LevelDetails";
import AspirationsAnalysis from "./pages/AspirationsAnalysis";
import FinancialJourney from "./pages/FinancialJourney";
import Logros from "./pages/Logros";

import EditAspirations from "./pages/EditAspirations";
import Budgets from "./pages/Budgets";
import EditBudgets from "./pages/EditBudgets";
import BudgetQuiz from "./pages/BudgetQuiz";
import Movimientos from "./pages/Movimientos";
import ProximosMovimientos from "./pages/ProximosMovimientos";
import EditNetWorth from "./pages/EditNetWorth";
import InitialNetWorth from "./pages/InitialNetWorth";

import Subscriptions from "./pages/Subscriptions";
import DailyExpenses from './pages/DailyExpenses';
import DayExpenses from './pages/DayExpenses';
import Reports from './pages/Reports';
import CategoryExpenses from './pages/CategoryExpenses';
import Social from './pages/Social';
import FriendsList from './pages/FriendsList';
import SocialStats from './pages/SocialStats';
import Groups from './pages/Groups';
import SavingSimulation from './pages/SavingSimulation';
import Goals from './pages/Goals';
import AccountsCards from './pages/AccountsCards';
import FixedExpenses from './pages/FixedExpenses';
import VariableExpenses from './pages/VariableExpenses';
import AntExpenses from './pages/AntExpenses';
import ImpulsiveExpenses from './pages/ImpulsiveExpenses';

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
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Onboarding />} />
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
          <Route path="/notifications" element={<NotificationHistory />} />
          <Route path="/notification-settings" element={<NotificationSettings />} />
          <Route path="/net-worth" element={<NetWorth />} />
          <Route path="/score-moni" element={<ScoreMoni />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/liabilities" element={<Liabilities />} />
          <Route path="/level-quiz" element={<LevelQuiz />} />
          <Route path="/level-details" element={<LevelDetails />} />
          <Route path="/aspirations-analysis" element={<AspirationsAnalysis />} />
          <Route path="/financial-journey" element={<FinancialJourney />} />
          <Route path="/logros" element={<Logros />} />
          
          <Route path="/edit-aspirations" element={<EditAspirations />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/daily-expenses" element={<DailyExpenses />} />
          <Route path="/day-expenses" element={<DayExpenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/edit-budgets" element={<EditBudgets />} />
          <Route path="/budget-quiz" element={<BudgetQuiz />} />
          <Route path="/category-expenses" element={<CategoryExpenses />} />
          <Route path="/gestionar-categorias" element={<GestionarCategorias />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/proximos-movimientos" element={<ProximosMovimientos />} />
          <Route path="/edit-assets-liabilities" element={<EditNetWorth />} />
          <Route path="/initial-net-worth" element={<InitialNetWorth />} />
          <Route path="/social" element={<Social />} />
          <Route path="/friends-list" element={<FriendsList />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/social-stats" element={<SocialStats />} />
          <Route path="/saving-simulation" element={<SavingSimulation />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/accounts-cards" element={<AccountsCards />} />
          <Route path="/fixed-expenses" element={<FixedExpenses />} />
          <Route path="/variable-expenses" element={<VariableExpenses />} />
          <Route path="/ant-expenses" element={<AntExpenses />} />
          <Route path="/impulsive-expenses" element={<ImpulsiveExpenses />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
