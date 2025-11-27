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
      <div className="bg-[#f5f5f4]/90 backdrop-blur-sm rounded-full shadow-lg px-8 py-4 flex items-center gap-8 border border-gray-200/50">
        <button 
          onClick={() => navigate('/dashboard')}
          className={`transition-all duration-200 flex flex-col items-center gap-1 ${
            isActive('/dashboard') 
              ? 'text-[#5D4037]' 
              : 'text-[#A1887F] hover:text-[#8D6E63] hover:-translate-y-0.5'
          }`}
        >
          <Home className="w-6 h-6" strokeWidth={isActive('/dashboard') ? 2.5 : 2} />
        </button>
        
        <button 
          onClick={() => navigate('/analysis')}
          className={`transition-all duration-200 flex flex-col items-center gap-1 ${
            isActive('/analysis') 
              ? 'text-[#5D4037]' 
              : 'text-[#A1887F] hover:text-[#8D6E63] hover:-translate-y-0.5'
          }`}
        >
          <BarChart3 className="w-6 h-6" strokeWidth={isActive('/analysis') ? 2.5 : 2} />
        </button>
        
        <button 
          onClick={() => navigate('/social')}
          className={`transition-all duration-200 relative flex flex-col items-center gap-1 ${
            isActive('/social') 
              ? 'text-[#5D4037]' 
              : 'text-[#A1887F] hover:text-[#8D6E63] hover:-translate-y-0.5'
          }`}
        >
          <div className="relative">
            <Users className="w-6 h-6" strokeWidth={isActive('/social') ? 2.5 : 2} />
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
        </button>
        
        <button 
          onClick={() => navigate('/chat')}
          className={`transition-all duration-200 flex flex-col items-center gap-1 ${
            isActive('/chat') 
              ? 'text-[#5D4037]' 
              : 'text-[#A1887F] hover:text-[#8D6E63] hover:-translate-y-0.5'
          }`}
        >
          <MessageCircle className="w-6 h-6" strokeWidth={isActive('/chat') ? 2.5 : 2} />
        </button>

        <button 
          onClick={() => navigate('/accounts-cards')}
          className={`transition-all duration-200 flex flex-col items-center gap-1 ${
            isActive('/accounts-cards') 
              ? 'text-[#5D4037]' 
              : 'text-[#A1887F] hover:text-[#8D6E63] hover:-translate-y-0.5'
          }`}
        >
          <Wallet className="w-6 h-6" strokeWidth={isActive('/accounts-cards') ? 2.5 : 2} />
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
