import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Trophy, MessageCircle, Target, Sparkles } from 'lucide-react';

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
    { path: '/goals', icon: Target, label: 'Metas' },
    { path: '/analysis', icon: BarChart3, label: 'Análisis' },
    { path: '/retos', icon: Trophy, label: 'Retos' },
    { path: '/financial-journey', icon: Sparkles, label: 'Journey' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
  ];

  return (
    <>
      {/* Mobile: Bottom navigation (screens < 1024px) */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
        <div className="
          bg-white/10
          backdrop-blur-3xl
          backdrop-saturate-200
          rounded-[32px]
          shadow-[0_8px_40px_rgba(0,0,0,0.04),inset_0_0_0_0.5px_rgba(255,255,255,0.5),inset_0_1px_2px_rgba(255,255,255,0.3)]
          px-8 py-4
          flex items-center gap-8
          border border-white/20
          relative overflow-hidden
        ">
          {/* Glass highlight overlay */}
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/20 via-transparent to-white/5 pointer-events-none" />
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          
          {navItems.map(({ path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`relative z-10 transition-all duration-300 ${isActive(path)
                  ? 'text-gray-800 scale-110'
                  : 'text-gray-500/80 hover:text-gray-700 hover:scale-105 active:scale-95'
                }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive(path) ? 2.5 : 1.8} />
              {isActive(path) && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-800" />
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
