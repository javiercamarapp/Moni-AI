import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Dashboard from "./components/Dashboard";
import NewGoal from "./pages/NewGoal";
import FinancialChat from "./pages/FinancialChat";
import Ingresos from "./pages/Ingresos";
import Gastos from "./pages/Gastos";
import GestionarCategorias from "./pages/GestionarCategorias";
import Settings from "./pages/Settings";
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
import Retos from './pages/Retos';
import FriendsList from './pages/FriendsList';
import FriendProfile from './pages/FriendProfile';
import AddFriend from './pages/AddFriend';
import Groups from './pages/Groups';
import FinancialEvents from './pages/FinancialEvents';
import SavingSimulation from './pages/SavingSimulation';
import Goals from './pages/Goals';
import GoalDetails from './pages/GoalDetails';
import GroupGoals from './pages/GroupGoals';
import GroupGoalDetails from './pages/GroupGoalDetails';
import GroupGoalChat from './pages/GroupGoalChat';
import Cartera from './pages/Cartera';
import FixedExpenses from './pages/FixedExpenses';
import VariableExpenses from './pages/VariableExpenses';
import AntExpenses from './pages/AntExpenses';
import ImpulsiveExpenses from './pages/ImpulsiveExpenses';
import CircleDetails from './pages/CircleDetails';
import CircleChat from './pages/CircleChat';
import CircleMembers from './pages/CircleMembers';
import CircleChallenges from './pages/CircleChallenges';
import CircleNews from './pages/CircleNews';
import JoinCircle from './pages/JoinCircle';
import Challenges from './pages/Challenges';
import FriendComparison from './pages/FriendComparison';
import FriendChallenges from './pages/FriendChallenges';
import FriendsListPage from './pages/FriendsListPage';
import StatsPage from './pages/StatsPage';
import ChallengesPage from './pages/ChallengesPage';
import Portfolio from './pages/Portfolio';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
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
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<FinancialChat />} />
          <Route path="/new-goal" element={<NewGoal />} />
          <Route path="/analysis" element={<FinancialAnalysis />} />
          <Route path="/bank-connection" element={<BankConnection />} />
          <Route path="/ingresos" element={<Ingresos />} />
          <Route path="/gastos" element={<Gastos />} />
          <Route path="/categorias" element={<GestionarCategorias />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/balance" element={<Balance />} />
          <Route path="/whatsapp" element={<WhatsAppSetup />} />
          <Route path="/notifications" element={<NotificationHistory />} />
          <Route path="/notification-settings" element={<NotificationSettings />} />
          <Route path="/net-worth" element={<NetWorth />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/score-moni" element={<ScoreMoni />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/liabilities" element={<Liabilities />} />
          <Route path="/level-quiz" element={<LevelQuiz />} />
          <Route path="/financial-journey" element={<FinancialJourney />} />
          <Route path="/cartera" element={<Cartera />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/goals/:id" element={<GoalDetails />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/aspirations-analysis" element={<AspirationsAnalysis />} />
          <Route path="/level-details" element={<LevelDetails />} />
          <Route path="/logros" element={<Logros />} />
          <Route path="/edit-aspirations" element={<EditAspirations />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/daily-expenses" element={<DailyExpenses />} />
          <Route path="/day-expenses" element={<DayExpenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/edit-budgets" element={<EditBudgets />} />
          <Route path="/budget-quiz" element={<BudgetQuiz />} />
          <Route path="/category-expenses" element={<CategoryExpenses />} />
          <Route path="/gestionar-categorias" element={<GestionarCategorias />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/proximos-movimientos" element={<ProximosMovimientos />} />
          <Route path="/edit-assets-liabilities" element={<EditNetWorth />} />
          <Route path="/initial-net-worth" element={<InitialNetWorth />} />
          <Route path="/retos" element={<Retos />} />
          <Route path="/friends-list" element={<FriendsList />} />
          <Route path="/friend/:id" element={<FriendProfile />} />
          <Route path="/friend/:id/compare" element={<FriendComparison />} />
          <Route path="/friend-challenges" element={<FriendChallenges />} />
          <Route path="/add-friend" element={<AddFriend />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/financial-events" element={<FinancialEvents />} />
          <Route path="/social-stats" element={<StatsPage />} />
          <Route path="/amigos" element={<FriendsListPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/saving-simulation" element={<SavingSimulation />} />
          <Route path="/group-goals" element={<GroupGoals />} />
          <Route path="/group-goals/:id" element={<GroupGoalDetails />} />
          <Route path="/group-goals/:id/chat" element={<GroupGoalChat />} />
          <Route path="/fixed-expenses" element={<FixedExpenses />} />
          <Route path="/variable-expenses" element={<VariableExpenses />} />
          <Route path="/ant-expenses" element={<AntExpenses />} />
          <Route path="/impulsive-expenses" element={<ImpulsiveExpenses />} />
          <Route path="/circle/:id" element={<CircleDetails />} />
          <Route path="/circle/:id/chat" element={<CircleChat />} />
          <Route path="/circle/:id/members" element={<CircleMembers />} />
          <Route path="/circle/:id/challenges" element={<CircleChallenges />} />
          <Route path="/circle/:id/news" element={<CircleNews />} />
          <Route path="/join-circle/:code" element={<JoinCircle />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;