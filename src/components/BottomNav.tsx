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
    { path: '/analysis', icon: BarChart3, label: 'Análisis' },
    { path: '/retos', icon: Trophy, label: 'Retos' },
    { path: '/financial-journey', icon: Sparkles, label: 'Journey' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
  ];

  return (
    <>
      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe">
        <div className="
          w-full lg:w-auto lg:min-w-[400px]
          bg-white
          rounded-t-[32px]
          shadow-[0_-8px_40px_rgba(0,0,0,0.08)]
          px-8 py-4
          flex items-center justify-around lg:justify-center lg:gap-12
          relative overflow-hidden
        ">
          {navItems.map(({ path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`relative z-10 transition-all duration-300 ${isActive(path)
                  ? 'text-[#5D4037] scale-110'
                  : 'text-gray-400 hover:text-gray-600 hover:scale-105 active:scale-95'
                }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive(path) ? 2.5 : 1.8} />
              {isActive(path) && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#5D4037]" />
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
