import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Users, MessageCircle, User } from 'lucide-react';
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
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-card/95 backdrop-blur-sm border-t border-white/10 z-50">
      <div className="flex justify-around items-center py-3 px-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/dashboard') ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">Inicio</span>
        </button>
        
        <button 
          onClick={() => navigate('/analysis')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/analysis') ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-xs">Análisis</span>
        </button>
        
        <button 
          onClick={() => navigate('/social')}
          className={`flex flex-col items-center gap-1 transition-colors relative ${
            isActive('/social') ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
          <span className="text-xs">Social</span>
        </button>
        
        <button 
          onClick={() => navigate('/chat')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/chat') ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs">Chat IA</span>
        </button>
        
        <button 
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('/profile') ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs">Perfil</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
