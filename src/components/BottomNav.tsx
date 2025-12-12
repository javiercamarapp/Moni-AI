import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Trophy, MessageCircle, Wallet } from 'lucide-react';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) {
      return true;
    }
    return location.pathname === path;
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Inicio' },
    { path: '/analysis', icon: BarChart3, label: 'Análisis' },
    { path: '/retos', icon: Trophy, label: 'Retos' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/cartera', icon: Wallet, label: 'Cartera' },
  ];

  return (
    <>
      {/* Mobile: Bottom navigation (screens < 1024px) */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
        <div className="
          bg-white/40 
          backdrop-blur-2xl 
          backdrop-saturate-150
          rounded-[28px] 
          shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.6)_inset,0_2px_4px_rgba(255,255,255,0.4)_inset]
          px-8 py-4 
          flex items-center gap-8 
          border border-white/60
          before:absolute before:inset-0 before:rounded-[28px] before:bg-gradient-to-b before:from-white/30 before:to-transparent before:pointer-events-none
          relative overflow-hidden
        ">
          {navItems.map(({ path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`relative z-10 transition-all duration-300 ${isActive(path)
                  ? 'text-gray-900 scale-110'
                  : 'text-gray-500 hover:text-gray-700 hover:scale-105 active:scale-95'
                }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive(path) ? 2.5 : 1.8} />
              {isActive(path) && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-900" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop: Left sidebar navigation (screens >= 1024px) */}

    </>
  );
};

export default BottomNav;
