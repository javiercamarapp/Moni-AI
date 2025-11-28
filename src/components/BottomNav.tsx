import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Users, MessageCircle, Wallet } from 'lucide-react';

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
    { path: '/social', icon: Users, label: 'Social' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/accounts-cards', icon: Wallet, label: 'Cuentas' },
  ];

  return (
    <>
      {/* Mobile: Bottom navigation (screens < 1024px) */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 flex justify-center lg:hidden">
        <div className="bg-[#f5f5f4]/90 backdrop-blur-sm rounded-full shadow-lg px-8 py-4 flex items-center gap-8 border border-gray-200/50">
          {navItems.map(({ path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`transition-all duration-200 ${
                isActive(path)
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
      <nav className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
        <div className="bg-[#f5f5f4]/90 backdrop-blur-sm rounded-2xl shadow-lg px-3 py-6 flex flex-col items-center gap-6 border border-gray-200/50">
          {navItems.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`transition-all duration-200 flex flex-col items-center gap-1.5 group ${
                isActive(path)
                  ? 'text-[#5D4037]'
                  : 'text-[#A1887F] hover:text-[#8D6E63] hover:-translate-x-0.5'
              }`}
              title={label}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive(path) ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive(path) ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
