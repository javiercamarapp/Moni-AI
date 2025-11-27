import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Users, MessageCircle, Wallet } from 'lucide-react';
import { usePendingFriendRequests } from '@/hooks/usePendingFriendRequests';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount } = usePendingFriendRequests();

  const isActive = (path: string) => {
    // Para dashboard, también considerar la ruta raíz
    if (path === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
      <div className="bg-card rounded-full shadow-lg px-8 py-4 flex items-center gap-8">
        <button 
          onClick={() => navigate('/dashboard')}
          className={`transition-all flex flex-col items-center gap-1 ${
            isActive('/dashboard') 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home className="w-6 h-6" strokeWidth={2} />
          {isActive('/dashboard') && (
            <div className="h-0.5 w-6 bg-primary rounded-full" />
          )}
        </button>
        
        <button 
          onClick={() => navigate('/analysis')}
          className={`transition-all flex flex-col items-center gap-1 ${
            isActive('/analysis') 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-6 h-6" strokeWidth={2} />
          {isActive('/analysis') && (
            <div className="h-0.5 w-6 bg-primary rounded-full" />
          )}
        </button>
        
        <button 
          onClick={() => navigate('/social')}
          className={`transition-all relative flex flex-col items-center gap-1 ${
            isActive('/social') 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="relative">
            <Users className="w-6 h-6" strokeWidth={2} />
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
          {isActive('/social') && (
            <div className="h-0.5 w-6 bg-primary rounded-full" />
          )}
        </button>
        
        <button 
          onClick={() => navigate('/chat')}
          className={`transition-all flex flex-col items-center gap-1 ${
            isActive('/chat') 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageCircle className="w-6 h-6" strokeWidth={2} />
          {isActive('/chat') && (
            <div className="h-0.5 w-6 bg-primary rounded-full" />
          )}
        </button>

        <button 
          onClick={() => navigate('/accounts-cards')}
          className={`transition-all flex flex-col items-center gap-1 ${
            isActive('/accounts-cards') 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wallet className="w-6 h-6" strokeWidth={2} />
          {isActive('/accounts-cards') && (
            <div className="h-0.5 w-6 bg-primary rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
