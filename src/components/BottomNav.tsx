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
        <div className="bg-[#f5f5f4]/90 backdrop-blur-sm rounded-full shadow-lg px-8 py-4 flex items-center gap-8 border border-gray-200/50">
          {navItems.map(({ path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`transition-all duration-200 ${isActive(path)
                  ? 'text-[#5D4037]'
                  : 'text-[#A1887F] hover:text-[#8D6E63] hover:-translate-y-0.5'
                }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive(path) ? 2.5 : 2} />
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop: Left sidebar navigation (screens >= 1024px) */}

    </>
  );
};

export default BottomNav;
