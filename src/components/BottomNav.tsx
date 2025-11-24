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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-border shadow-elegant z-50">
      <div className="flex justify-around items-center py-3 px-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            isActive('/dashboard') 
              ? 'text-primary -translate-y-0.5' 
              : 'text-foreground/70 hover:text-foreground hover:-translate-y-0.5'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">Inicio</span>
        </button>
        
        <button 
          onClick={() => navigate('/analysis')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            isActive('/analysis') 
              ? 'text-primary -translate-y-0.5' 
              : 'text-foreground/70 hover:text-foreground hover:-translate-y-0.5'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-xs font-medium">Análisis</span>
        </button>
        
        <button 
          onClick={() => navigate('/social')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${
            isActive('/social') 
              ? 'text-primary -translate-y-0.5' 
              : 'text-foreground/70 hover:text-foreground hover:-translate-y-0.5'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse shadow-lg">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">Social</span>
        </button>
        
        <button 
          onClick={() => navigate('/chat')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            isActive('/chat') 
              ? 'text-primary -translate-y-0.5' 
              : 'text-foreground/70 hover:text-foreground hover:-translate-y-0.5'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs font-medium">Chat IA</span>
        </button>
        
        <button 
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            isActive('/profile') 
              ? 'text-primary -translate-y-0.5' 
              : 'text-foreground/70 hover:text-foreground hover:-translate-y-0.5'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs font-medium">Perfil</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
