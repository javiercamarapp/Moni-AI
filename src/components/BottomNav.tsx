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
          className={`transition-all ${
            isActive('/dashboard') 
              ? 'text-primary scale-110 -translate-y-1' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home className="w-6 h-6" strokeWidth={isActive('/dashboard') ? 2.5 : 2} />
        </button>
        
        <button 
          onClick={() => navigate('/analysis')}
          className={`transition-all ${
            isActive('/analysis') 
              ? 'text-primary scale-110 -translate-y-1' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-6 h-6" strokeWidth={isActive('/analysis') ? 2.5 : 2} />
        </button>
        
        <button 
          onClick={() => navigate('/social')}
          className={`transition-all relative ${
            isActive('/social') 
              ? 'text-primary scale-110 -translate-y-1' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-6 h-6" strokeWidth={isActive('/social') ? 2.5 : 2} />
          {pendingCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </button>
        
        <button 
          onClick={() => navigate('/chat')}
          className={`transition-all ${
            isActive('/chat') 
              ? 'text-primary scale-110 -translate-y-1' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageCircle className="w-6 h-6" strokeWidth={isActive('/chat') ? 2.5 : 2} />
        </button>

        <button 
          onClick={() => navigate('/accounts-cards')}
          className={`transition-all ${
            isActive('/accounts-cards') 
              ? 'text-primary scale-110 -translate-y-1' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wallet className="w-6 h-6" strokeWidth={isActive('/accounts-cards') ? 2.5 : 2} />
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
