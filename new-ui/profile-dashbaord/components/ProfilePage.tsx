import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UserTier } from '../types';
import SubscriptionBanner from './SubscriptionBanner';
import MenuSection from './MenuOptions';
import { 
    IconWallet, 
    IconTicket, 
    IconHelp, 
    IconSettings, 
    IconPin,
    IconHeart,
    IconHeartFilled,
    IconLogout,
    IconArrowLeft,
    IconPencil,
    IconUser,
    IconBank,
    IconFileText,
    IconPhone,
    IconCreditCard,
    IconDownload,
    IconShield,
    IconFaceId,
    IconLock,
    IconDevice,
    IconShieldCheck,
    IconTrash,
    IconSmartphone,
    IconMonitor,
    IconMapPin,
    IconBell,
    IconTranslate,
    IconMoney,
    IconCheck,
    IconZap,
    IconGraph,
    IconTag,
    IconBellRing,
    IconBellOff,
    IconTrendingUp,
    IconSparkles,
    IconPiggyBank,
    IconChartPie
} from './Icons';

// Initial Data
const initialUser: UserProfile = {
  id: 'u1',
  name: 'Javier Cámara',
  email: 'javier@moni.app',
  phone: '+52 55 1234 5678',
  address: 'Av. Paseo de la Reforma 483, Cuauhtémoc, 06500 Ciudad de México, CDMX',
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
  tier: UserTier.FREE,
  points: 1240
};

type ViewState = 'profile' | 'personal_info' | 'reports' | 'security' | 'subscription_detail' | 'change_password' | 'change_pin' | 'two_factor' | 'devices' | 'login_history' | 'delete_account' | 'language' | 'currency' | 'notifications';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [currentView, setCurrentView] = useState<ViewState>('profile');
  
  // Edit State for Personal Info
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(initialUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Security State
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Preference State
  const [language, setLanguage] = useState('Español');
  const [currency, setCurrency] = useState('MXN');

  // Notification State
  const [notifSettings, setNotifSettings] = useState({
      level: 'medium', // 'high', 'medium', 'low'
      challenges: true,
      dailyLimit: true,
      transactions: true,
      promos: false,
      security: true,
      statements: true,
      coaching: true
  });

  // Password Change State
  const [passwordStep, setPasswordStep] = useState<'verify' | 'update'>('verify');
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string>('');

  // PIN Change State
  const [pinStep, setPinStep] = useState<'verify' | 'update'>('verify');
  const [pinForm, setPinForm] = useState({ current: '', new: '', confirm: '' });
  const [pinError, setPinError] = useState<string>('');

  // Animation state for graphs
  const [animateGraph, setAnimateGraph] = useState(false);
  // Counter state for numbers
  const [displaySavings, setDisplaySavings] = useState(0);

  useEffect(() => {
    if (currentView === 'subscription_detail') {
        // Trigger animation after mount
        setTimeout(() => setAnimateGraph(true), 100);
        
        // Counter animation logic
        const targetSavings = user.tier === UserTier.PREMIUM ? 950 : 2200;
        let start = 0;
        const duration = 1500; // ms
        const increment = targetSavings / (duration / 16); // 60fps
        
        const timer = setInterval(() => {
            start += increment;
            if (start >= targetSavings) {
                setDisplaySavings(targetSavings);
                clearInterval(timer);
            } else {
                setDisplaySavings(Math.floor(start));
            }
        }, 16);
        
        return () => clearInterval(timer);
    } else {
        setAnimateGraph(false);
        setDisplaySavings(0);
    }
  }, [currentView, user.tier]);

  // Mock Devices Data
  const [devices, setDevices] = useState([
    { id: 1, name: 'iPhone 13 Pro', type: 'mobile', location: 'Ciudad de México, MX', active: true },
    { id: 2, name: 'MacBook Pro', type: 'desktop', location: 'Ciudad de México, MX', active: false },
    { id: 3, name: 'iPad Air', type: 'tablet', location: 'Guadalajara, MX', active: false },
  ]);

  // Mock Login History Data
  const [loginHistory, setLoginHistory] = useState([
    { id: 1, device: 'iPhone 13 Pro', location: 'Ciudad de México', date: 'Hoy, 10:23 AM' },
    { id: 2, device: 'MacBook Pro', location: 'Ciudad de México', date: 'Ayer, 08:45 PM' },
    { id: 3, device: 'Chrome Web', location: 'Monterrey, MX', date: '20 Feb, 02:15 PM' },
  ]);

  // Mock Reports Data
  const reports = [
    { id: 1, month: 'Febrero 2024', size: '1.2 MB' },
    { id: 2, month: 'Enero 2024', size: '1.1 MB' },
    { id: 3, month: 'Diciembre 2023', size: '1.3 MB' },
    { id: 4, month: 'Noviembre 2023', size: '1.1 MB' },
    { id: 5, month: 'Octubre 2023', size: '1.0 MB' },
    { id: 6, month: 'Septiembre 2023', size: '1.2 MB' },
  ];

  const cycleTier = () => {
    setUser(prev => {
        let nextTier;
        if (prev.tier === UserTier.FREE) nextTier = UserTier.PREMIUM;
        else if (prev.tier === UserTier.PREMIUM) nextTier = UserTier.BLACK;
        else nextTier = UserTier.FREE;
        return { ...prev, tier: nextTier };
    });
  };

  const handleSave = () => {
    setUser(prev => ({...prev, ...editForm}));
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
        // Enable editing mode so the user can save the new image
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
      if(window.confirm("¿Estás seguro que deseas cerrar sesión?")) {
          alert("Sesión cerrada correctamente");
          // Here you would typically clear tokens and redirect to login
      }
  };

  const handleNotImplemented = (feature: string) => {
      alert(`La funcionalidad "${feature}" estará disponible próximamente.`);
  };

  const handleRemoveDevice = (id: number) => {
      if(window.confirm("¿Desvincular este dispositivo? Tendrás que iniciar sesión nuevamente en él.")) {
          setDevices(prev => prev.filter(d => d.id !== id));
      }
  };

  const handleNotifToggle = (key: keyof typeof notifSettings) => {
      setNotifSettings(prev => ({...prev, [key]: !prev[key]}));
  };

  // Password Logic
  const handleVerifyPassword = () => {
      // Simulate verification
      if (passwordForm.current.length > 0) {
          setPasswordError('');
          setPasswordStep('update');
      } else {
          setPasswordError('Por favor ingresa tu contraseña actual.');
      }
  };

  const handleVerifyFaceId = () => {
      // Simulate Face ID success
      setTimeout(() => {
          setPasswordStep('update');
      }, 800);
  };

  const handleUpdatePassword = () => {
      if (!passwordForm.new || !passwordForm.confirm) {
          setPasswordError('Por favor completa todos los campos.');
          return;
      }
      if (passwordForm.new !== passwordForm.confirm) {
          setPasswordError('Las contraseñas no coinciden.');
          return;
      }
      if (passwordForm.new.length < 6) {
          setPasswordError('La contraseña debe tener al menos 6 caracteres.');
          return;
      }

      alert('Contraseña actualizada correctamente');
      setPasswordForm({ current: '', new: '', confirm: '' });
      setPasswordError('');
      setCurrentView('security');
  };

  // PIN Logic
  const handleVerifyPin = () => {
      // Simulate PIN verification (any 4 digit pin works for demo)
      if (pinForm.current.length === 4) {
          setPinError('');
          setPinStep('update');
      } else {
          setPinError('Por favor ingresa tu PIN actual de 4 dígitos.');
      }
  };

  const handleVerifyPinFaceId = () => {
      setTimeout(() => {
          setPinStep('update');
      }, 800);
  };

  const handleUpdatePin = () => {
      if (pinForm.new.length !== 4 || pinForm.confirm.length !== 4) {
          setPinError('El PIN debe tener 4 dígitos.');
          return;
      }
      if (pinForm.new !== pinForm.confirm) {
          setPinError('Los PINs no coinciden.');
          return;
      }
      
      alert('PIN actualizado correctamente');
      setPinForm({ current: '', new: '', confirm: '' });
      setPinError('');
      setCurrentView('security');
  };

  // --- Reusable Header Component ---
  const Header = ({ title, subtitle, onBack, action }: { title: string, subtitle: string, onBack: () => void, action?: React.ReactNode }) => (
    <header className="px-6 pt-4 pb-0 mb-6">
        <div className="flex items-center gap-4">
            <button 
                className="w-10 h-10 bg-white rounded-full shadow-sm flex-none flex items-center justify-center text-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:shadow-sm active:translate-y-0" 
                onClick={onBack}
            >
                <IconArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
                <h1 className="text-xl font-bold text-[#5D4037] tracking-tight leading-none">{title}</h1>
                <p className="text-gray-400 text-sm mt-1 font-medium leading-none">{subtitle}</p>
            </div>
            {action}
        </div>
    </header>
  );

  // --- Views ---

  if (currentView === 'notifications') {
      return (
          <div className="min-h-screen bg-[#F3F4F6] font-sans">
              <Header title="Notificaciones" subtitle="Gestiona tus alertas" onBack={() => setCurrentView('profile')} />
              <main className="px-5 pb-10 space-y-6">
                  
                  {/* Intensity Level */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Nivel de Intensidad</h3>
                      <div className="grid grid-cols-3 gap-3">
                          <button 
                             onClick={() => setNotifSettings(prev => ({...prev, level: 'high'}))}
                             className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${notifSettings.level === 'high' ? 'bg-[#5D4037]/5 border-[#5D4037] text-[#5D4037]' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
                          >
                             <IconBellRing className="w-6 h-6" />
                             <span className="text-xs font-bold">Alto</span>
                          </button>
                          <button 
                             onClick={() => setNotifSettings(prev => ({...prev, level: 'medium'}))}
                             className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${notifSettings.level === 'medium' ? 'bg-[#5D4037]/5 border-[#5D4037] text-[#5D4037]' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
                          >
                             <IconBell className="w-6 h-6" />
                             <span className="text-xs font-bold">Medio</span>
                          </button>
                          <button 
                             onClick={() => setNotifSettings(prev => ({...prev, level: 'low'}))}
                             className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${notifSettings.level === 'low' ? 'bg-[#5D4037]/5 border-[#5D4037] text-[#5D4037]' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
                          >
                             <IconBellOff className="w-6 h-6" />
                             <span className="text-xs font-bold">Bajo</span>
                          </button>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-3 text-center">
                          {notifSettings.level === 'high' && "Recibirás todas las notificaciones en tiempo real."}
                          {notifSettings.level === 'medium' && "Solo alertas importantes y resumen diario."}
                          {notifSettings.level === 'low' && "Solo alertas de seguridad críticas."}
                      </p>
                  </div>

                  <MenuSection 
                      title="Finanzas"
                      items={[
                          { 
                              icon: <IconCreditCard className="w-5 h-5" />, 
                              label: 'Transacciones',
                              isToggle: true,
                              isToggled: notifSettings.transactions,
                              onToggle: () => handleNotifToggle('transactions')
                          },
                          { 
                              icon: <IconGraph className="w-5 h-5" />, 
                              label: 'Límite de Consumo Diario',
                              isToggle: true,
                              isToggled: notifSettings.dailyLimit,
                              onToggle: () => handleNotifToggle('dailyLimit')
                          },
                          { 
                              icon: <IconFileText className="w-5 h-5" />, 
                              label: 'Estado de Cuenta',
                              isToggle: true,
                              isToggled: notifSettings.statements,
                              onToggle: () => handleNotifToggle('statements')
                          },
                      ]}
                  />

                  <MenuSection 
                      title="Crecimiento"
                      items={[
                          { 
                              icon: <IconZap className="w-5 h-5" />, 
                              label: 'Retos y Logros',
                              isToggle: true,
                              isToggled: notifSettings.challenges,
                              onToggle: () => handleNotifToggle('challenges')
                          },
                          { 
                              icon: <IconUser className="w-5 h-5" />, 
                              label: 'Tips de Coacheo',
                              isToggle: true,
                              isToggled: notifSettings.coaching,
                              onToggle: () => handleNotifToggle('coaching')
                          },
                      ]}
                  />

                  <MenuSection 
                      title="Novedades"
                      items={[
                          { 
                              icon: <IconTag className="w-5 h-5" />, 
                              label: 'Promociones',
                              isToggle: true,
                              isToggled: notifSettings.promos,
                              onToggle: () => handleNotifToggle('promos')
                          },
                      ]}
                  />
              </main>
          </div>
      );
  }

  if (currentView === 'language') {
      const languages = ['Español', 'Inglés'];
      return (
          <div className="min-h-screen bg-[#F3F4F6] font-sans">
              <Header title="Idioma" subtitle="Selecciona tu preferencia" onBack={() => setCurrentView('profile')} />
              <main className="px-5">
                   <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                       {languages.map((lang, index) => (
                           <div key={lang}>
                               <button 
                                   onClick={() => {
                                       setLanguage(lang);
                                       setCurrentView('profile');
                                   }}
                                   className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                               >
                                   <span className={`font-medium ${language === lang ? 'text-[#5D4037]' : 'text-gray-600'}`}>{lang}</span>
                                   {language === lang && <IconCheck className="w-5 h-5 text-[#5D4037]" />}
                               </button>
                               {index < languages.length - 1 && <div className="h-[1px] bg-gray-100 mx-5" />}
                           </div>
                       ))}
                   </div>
              </main>
          </div>
      );
  }

  if (currentView === 'currency') {
    const currencies = [
        { code: 'MXN', label: 'Peso Mexicano' }, 
        { code: 'USD', label: 'Dólar Estadounidense' }
    ];
    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans">
            <Header title="Divisa" subtitle="Moneda de visualización" onBack={() => setCurrentView('profile')} />
            <main className="px-5">
                 <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                     {currencies.map((curr, index) => (
                         <div key={curr.code}>
                             <button 
                                 onClick={() => {
                                     setCurrency(curr.code);
                                     setCurrentView('profile');
                                 }}
                                 className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                             >
                                 <span className={`font-medium ${currency === curr.code ? 'text-[#5D4037]' : 'text-gray-600'}`}>
                                    {curr.label} ({curr.code})
                                 </span>
                                 {currency === curr.code && <IconCheck className="w-5 h-5 text-[#5D4037]" />}
                             </button>
                             {index < currencies.length - 1 && <div className="h-[1px] bg-gray-100 mx-5" />}
                         </div>
                     ))}
                 </div>
            </main>
        </div>
    );
}

  if (currentView === 'change_password') {
    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans">
             <Header title="Contraseña" subtitle="Actualiza tu clave de acceso" onBack={() => setCurrentView('security')} />
             <main className="px-5 space-y-4">
                {passwordStep === 'verify' ? (
                    // STEP 1: VERIFICATION
                    <div className="space-y-6 pt-4">
                         <div className="text-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Verifica tu identidad</h3>
                            <p className="text-sm text-gray-500 mt-2">Antes de continuar, por favor confirma que eres tú.</p>
                         </div>

                         {faceIdEnabled && (
                            <button 
                                onClick={handleVerifyFaceId}
                                className="w-full bg-white border-2 border-[#5D4037]/10 py-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm hover:border-[#5D4037]/30 transition-all active:scale-95 group"
                            >
                                <div className="p-3 bg-[#5D4037]/5 rounded-full group-hover:bg-[#5D4037]/10 transition-colors">
                                    <IconFaceId className="w-8 h-8 text-[#5D4037]" />
                                </div>
                                <span className="font-bold text-[#5D4037]">Usar Face ID</span>
                            </button>
                         )}

                         <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-2 bg-[#F3F4F6] text-xs text-gray-400 font-medium uppercase">O usa tu contraseña</span>
                            </div>
                         </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Contraseña Actual</label>
                                <input 
                                    type="password" 
                                    value={passwordForm.current}
                                    onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#5D4037]" 
                                    placeholder="••••••••" 
                                />
                            </div>
                            {passwordError && <p className="text-red-500 text-xs font-medium">{passwordError}</p>}
                        </div>
                        <button 
                            onClick={handleVerifyPassword} 
                            className="w-full bg-[#5D4037] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#3E2723] active:scale-[0.98] transition-all"
                        >
                            Continuar
                        </button>
                    </div>
                ) : (
                    // STEP 2: NEW PASSWORD
                    <div className="space-y-4 fade-in">
                         <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nueva Contraseña</label>
                                <input 
                                    type="password" 
                                    value={passwordForm.new}
                                    onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#5D4037]" 
                                    placeholder="Ingrese nueva contraseña" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Confirmar Contraseña</label>
                                <input 
                                    type="password" 
                                    value={passwordForm.confirm}
                                    onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none focus:border-[#5D4037] ${
                                        passwordForm.confirm && passwordForm.new !== passwordForm.confirm ? 'border-red-300 focus:border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="Repita la nueva contraseña" 
                                />
                                {passwordForm.confirm && passwordForm.new !== passwordForm.confirm && (
                                    <p className="text-red-500 text-[10px] mt-1 font-medium">Las contraseñas no coinciden</p>
                                )}
                            </div>
                            {passwordError && <p className="text-red-500 text-xs font-medium">{passwordError}</p>}
                        </div>
                        
                        <div className="pt-4">
                            <button 
                                onClick={handleUpdatePassword} 
                                className="w-full bg-[#5D4037] text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(93,64,55,0.39)] hover:shadow-[0_6px_20px_rgba(93,64,55,0.23)] hover:-translate-y-1 transform transition-all duration-300 active:translate-y-0"
                            >
                                Actualizar Contraseña
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-4">
                                Se cerrará la sesión en todos los demás dispositivos.
                            </p>
                        </div>
                    </div>
                )}
             </main>
        </div>
    )
  }

  if (currentView === 'change_pin') {
    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans">
             <Header title="PIN de Acceso" subtitle="Modifica tu código numérico" onBack={() => setCurrentView('security')} />
             <main className="px-5 space-y-4">
                {pinStep === 'verify' ? (
                     <div className="space-y-6 pt-4">
                         <div className="text-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Verifica tu identidad</h3>
                            <p className="text-sm text-gray-500 mt-2">Ingresa tu PIN actual para continuar.</p>
                         </div>

                         {faceIdEnabled && (
                            <button 
                                onClick={handleVerifyPinFaceId}
                                className="w-full bg-white border-2 border-[#5D4037]/10 py-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm hover:border-[#5D4037]/30 transition-all active:scale-95 group"
                            >
                                <div className="p-3 bg-[#5D4037]/5 rounded-full group-hover:bg-[#5D4037]/10 transition-colors">
                                    <IconFaceId className="w-8 h-8 text-[#5D4037]" />
                                </div>
                                <span className="font-bold text-[#5D4037]">Usar Face ID</span>
                            </button>
                         )}

                         <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-2 bg-[#F3F4F6] text-xs text-gray-400 font-medium uppercase">O ingresa PIN</span>
                            </div>
                         </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">PIN Actual</label>
                                <input 
                                    type="tel" 
                                    maxLength={4}
                                    value={pinForm.current}
                                    onChange={(e) => setPinForm({...pinForm, current: e.target.value.replace(/\D/g, '')})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#5D4037] text-center text-2xl tracking-[0.5em]" 
                                    placeholder="••••" 
                                />
                            </div>
                            {pinError && <p className="text-red-500 text-xs font-medium text-center">{pinError}</p>}
                        </div>
                        <button 
                            onClick={handleVerifyPin} 
                            className="w-full bg-[#5D4037] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#3E2723] active:scale-[0.98] transition-all"
                        >
                            Continuar
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 fade-in">
                        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nuevo PIN</label>
                                <input 
                                    type="tel" 
                                    maxLength={4}
                                    value={pinForm.new}
                                    onChange={(e) => setPinForm({...pinForm, new: e.target.value.replace(/\D/g, '')})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#5D4037] text-center text-2xl tracking-[0.5em]" 
                                    placeholder="••••" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Confirmar Nuevo PIN</label>
                                <input 
                                    type="tel" 
                                    maxLength={4} 
                                    value={pinForm.confirm}
                                    onChange={(e) => setPinForm({...pinForm, confirm: e.target.value.replace(/\D/g, '')})}
                                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none focus:border-[#5D4037] text-center text-2xl tracking-[0.5em] ${
                                        pinForm.confirm && pinForm.new !== pinForm.confirm ? 'border-red-300 focus:border-red-500' : 'border-gray-200'
                                    }`}
                                    placeholder="••••" 
                                />
                                {pinForm.confirm && pinForm.new !== pinForm.confirm && (
                                    <p className="text-red-500 text-[10px] mt-1 font-medium text-center">Los PINs no coinciden</p>
                                )}
                            </div>
                             {pinError && <p className="text-red-500 text-xs font-medium text-center">{pinError}</p>}
                        </div>
                        <button 
                            onClick={handleUpdatePin} 
                            className="w-full bg-[#5D4037] text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(93,64,55,0.39)] hover:shadow-[0_6px_20px_rgba(93,64,55,0.23)] hover:-translate-y-1 transform transition-all duration-300 active:translate-y-0"
                        >
                            Guardar Nuevo PIN
                        </button>
                    </div>
                )}
             </main>
        </div>
    )
  }

  if (currentView === 'two_factor') {
      return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans">
            <Header title="Verificación en 2 pasos" subtitle="Protección adicional" onBack={() => setCurrentView('security')} />
            <main className="px-5 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${twoFactorEnabled ? 'bg-[#5D4037]/10 text-[#5D4037]' : 'bg-gray-100 text-gray-400'}`}>
                        <IconShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                            {twoFactorEnabled ? 'Protección Activada' : 'Protección Desactivada'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                            Cuando está activado, te pediremos un código de verificación cada vez que inicies sesión en un dispositivo nuevo.
                        </p>
                    </div>
                    <button 
                        onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-colors ${twoFactorEnabled ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                        {twoFactorEnabled ? 'Desactivar' : 'Activar ahora'}
                    </button>
                </div>
            </main>
        </div>
      )
  }

  if (currentView === 'devices') {
    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans">
            <Header title="Dispositivos" subtitle="Gestión de sesiones activas" onBack={() => setCurrentView('security')} />
            <main className="px-5 space-y-4">
                {devices.map((device) => (
                    <div key={device.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                {device.type === 'mobile' ? <IconSmartphone className="w-5 h-5"/> : <IconMonitor className="w-5 h-5"/>}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">{device.name}</h4>
                                <p className="text-xs text-gray-500">{device.location} {device.active && <span className="text-green-500 font-bold">• Activo ahora</span>}</p>
                            </div>
                        </div>
                        <button onClick={() => handleRemoveDevice(device.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors">
                            <IconTrash className="w-5 h-5" />
                        </button>
                    </div>
                ))}
                {devices.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        <p>No hay dispositivos vinculados.</p>
                    </div>
                )}
            </main>
        </div>
    )
  }

  if (currentView === 'login_history') {
    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans">
            <Header title="Historial" subtitle="Inicios de sesión recientes" onBack={() => setCurrentView('security')} />
            <main className="px-5 space-y-4">
                 {loginHistory.map((log) => (
                    <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm flex items-start gap-4">
                         <div className="mt-1">
                            <IconMapPin className="w-5 h-5 text-gray-400" />
                         </div>
                         <div className="flex-1">
                             <div className="flex justify-between items-start">
                                 <h4 className="font-bold text-sm text-gray-900">{log.location}</h4>
                                 <span className="text-xs text-gray-400">{log.date}</span>
                             </div>
                             <p className="text-xs text-gray-500 mt-0.5">{log.device}</p>
                         </div>
                    </div>
                 ))}
            </main>
        </div>
    )
  }

  if (currentView === 'delete_account') {
    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans">
            <Header title="Eliminar Cuenta" subtitle="Acción irreversible" onBack={() => setCurrentView('security')} />
            <main className="px-5 space-y-6">
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
                    <h3 className="text-red-800 font-bold text-lg mb-2">¿Estás seguro?</h3>
                    <p className="text-red-700 text-sm leading-relaxed">
                        Al eliminar tu cuenta, perderás acceso a todos tus fondos, historial de transacciones, puntos y beneficios de membresía de forma permanente. Esta acción no se puede deshacer.
                    </p>
                </div>
                
                <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Escribe "ELIMINAR" para confirmar</label>
                     <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-500" placeholder="" />
                </div>

                <button onClick={() => alert('Solicitud enviada. Tu cuenta será eliminada en 30 días.')} className="w-full bg-white text-red-600 border border-red-200 font-bold py-4 rounded-xl shadow-sm hover:bg-red-50 transition-all">
                    Eliminar definitivamente
                </button>
            </main>
        </div>
    )
  }

  if (currentView === 'subscription_detail') {
      const isPremium = user.tier === UserTier.PREMIUM || user.tier === UserTier.BLACK;
      const cost = user.tier === UserTier.BLACK ? 99 : 69; 
      const savings = user.tier === UserTier.BLACK 
          ? { total: 2200, challenge: 800, coaching: 900, benefits: 500 }
          : { total: 950, challenge: 450, coaching: 300, benefits: 200 };
      const roi = Math.floor(savings.total / cost);
      
      // Breakdown Data
      const breakdownItems = [
          { icon: <IconZap className="w-4 h-4" />, label: 'Retos Financieros', amount: savings.challenge, color: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' },
          { icon: <IconUser className="w-4 h-4" />, label: 'Coaching Personal', amount: savings.coaching, color: 'bg-blue-400', text: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: <IconTag className="w-4 h-4" />, label: 'Beneficios Exclusivos', amount: savings.benefits, color: 'bg-green-400', text: 'text-green-600', bg: 'bg-green-50' }
      ];

      return (
          <div className="min-h-screen bg-[#F3F4F6] font-sans">
              <Header 
                  title="Balance de Valor" 
                  subtitle="Impacto financiero de tu membresía" 
                  onBack={() => setCurrentView('profile')} 
              />
              <main className="px-5 space-y-6 pb-10">
                  
                  {isPremium ? (
                      <>
                        {/* Compact Animated ROI Engine Card */}
                        <div className="relative w-full rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-[#3E2723] to-[#5D4037] text-white">
                             {/* Gloss effect */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                             
                             <div className="p-6 relative z-10">
                                 {/* Top Row: Title & ROI Badge */}
                                 <div className="flex justify-between items-start mb-8">
                                     <div>
                                         <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Tu Retorno Mensual</span>
                                         <div className="flex items-baseline gap-1 mt-1">
                                            <h2 className="text-5xl font-bold tracking-tighter drop-shadow-sm">
                                                ${displaySavings}
                                            </h2>
                                            <span className="text-lg font-medium text-white/80">mxn</span>
                                         </div>
                                     </div>
                                     <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 flex flex-col items-center animate-pulse-slow">
                                         <span className="text-xl font-bold text-[#FDE68A]">{roi}x</span>
                                         <span className="text-[8px] uppercase font-bold text-white/70 tracking-wider">Valor</span>
                                     </div>
                                 </div>

                                 {/* Animated Horizontal Bar Chart (Cost vs Value) */}
                                 <div className="space-y-2">
                                     <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/50">
                                         <span>Inversión ${cost}</span>
                                         <span>Valor Real</span>
                                     </div>
                                     <div className="h-4 bg-black/20 rounded-full overflow-hidden relative backdrop-blur-sm border border-white/5">
                                         {/* Cost Marker (Static) */}
                                         <div 
                                            className="absolute left-0 top-0 bottom-0 bg-white/30 z-20 border-r border-white/40" 
                                            style={{ width: `${(cost / savings.total) * 100}%` }}
                                         ></div>
                                         
                                         {/* Value Fill (Animated) */}
                                         <div 
                                            className={`absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#8D6E63] to-[#D7CCC8] transition-all duration-[1500ms] ease-out z-10 ${animateGraph ? 'w-full' : 'w-[5%]'}`}
                                         ></div>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        {/* Vertical Breakdown List */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider px-1">Desglose de Ahorro</h3>
                            {breakdownItems.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-4 transition-all duration-700 transform ${animateGraph ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                                    style={{ transitionDelay: `${idx * 150}ms` }}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.bg} ${item.text}`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-bold text-gray-800">{item.label}</span>
                                            <span className="text-sm font-bold text-[#5D4037]">+${item.amount}</span>
                                        </div>
                                        {/* Mini Progress Bar */}
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${item.color} transition-all duration-1000 ease-out`} 
                                                style={{ width: animateGraph ? `${(item.amount / savings.total) * 100}%` : '0%' }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </>
                  ) : (
                      // Free Tier Promo View
                      <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100 mt-4">
                          <div className="w-16 h-16 bg-[#5D4037]/5 rounded-full flex items-center justify-center mx-auto mb-5 text-[#5D4037]">
                              <IconSparkles className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 mb-3">Descubre tu potencial</h3>
                          <p className="text-gray-500 text-sm leading-relaxed mb-6">
                              Los miembros Moni Prime ahorran un promedio de <span className="font-bold text-[#5D4037]">$950 MXN</span> al mes gracias a beneficios exclusivos, retos financieros y coaching personalizado.
                          </p>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 inline-block w-full">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Retorno Estimado</p>
                                <p className="text-2xl font-bold text-[#5D4037]">13x <span className="text-sm font-medium text-gray-500">tu inversión</span></p>
                          </div>
                      </div>
                  )}

                  {/* Toggle Demo Button */}
                  <div className="pt-4">
                     <button 
                        onClick={cycleTier} 
                        className="w-full text-center text-xs text-gray-400 hover:text-[#5D4037] transition-colors"
                     >
                        Tap para simular cambio de plan ({user.tier})
                     </button>
                  </div>
              </main>
          </div>
      );
  }

  if (currentView === 'security') {
      return (
          <div className="min-h-screen bg-[#F3F4F6] font-sans">
              <Header title="Seguridad" subtitle="Protege tu cuenta" onBack={() => setCurrentView('profile')} />
              <main className="px-5 space-y-6 pb-8">
                  <MenuSection 
                      title="Acceso"
                      items={[
                          { 
                              icon: <IconLock className="w-5 h-5" />, 
                              label: 'Cambiar contraseña', 
                              onClick: () => {
                                  // Reset state when entering view
                                  setPasswordStep('verify');
                                  setPasswordForm({ current: '', new: '', confirm: '' });
                                  setPasswordError('');
                                  setCurrentView('change_password');
                              } 
                          },
                          { 
                              icon: <IconPin className="w-5 h-5" />, 
                              label: 'Cambiar PIN de acceso', 
                              onClick: () => {
                                  // Reset state when entering view
                                  setPinStep('verify');
                                  setPinForm({ current: '', new: '', confirm: '' });
                                  setPinError('');
                                  setCurrentView('change_pin');
                              }
                          },
                      ]}
                  />

                  <MenuSection 
                      title="Protección"
                      items={[
                          { 
                              icon: <IconShieldCheck className="w-5 h-5" />, 
                              label: 'Verificación en 2 pasos',
                              badge: twoFactorEnabled ? 'Activado' : 'Desactivado',
                              badgeColor: twoFactorEnabled ? 'bg-[#EFEBE9] text-[#5D4037]' : undefined,
                              onClick: () => setCurrentView('two_factor')
                          },
                      ]}
                  />
  
                  <MenuSection 
                      title="Actividad"
                      items={[
                          { icon: <IconDevice className="w-5 h-5" />, label: 'Dispositivos vinculados', onClick: () => setCurrentView('devices') },
                          { icon: <IconFileText className="w-5 h-5" />, label: 'Historial de inicio de sesión', onClick: () => setCurrentView('login_history') },
                      ]}
                  />

                  <MenuSection 
                      title="Datos"
                      items={[
                          { icon: <IconTrash className="w-5 h-5" />, label: 'Eliminar cuenta', isDestructive: true, onClick: () => setCurrentView('delete_account') },
                      ]}
                  />
              </main>
          </div>
      )
  }

  if (currentView === 'reports') {
    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans">
             <Header title="Reportes Mensuales" subtitle="Descarga tus estados de cuenta" onBack={() => setCurrentView('profile')} />
            <main className="px-5 pb-8 space-y-4">
                {reports.map((report) => (
                    <div key={report.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#5D4037]/5 flex items-center justify-center text-[#5D4037]">
                                <IconFileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">{report.month}</h3>
                                <p className="text-xs text-gray-400">{report.size} • PDF</p>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 bg-[#5D4037] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#3E2723] transition-colors active:scale-95">
                            <IconDownload className="w-4 h-4" />
                            Descargar
                        </button>
                    </div>
                ))}
            </main>
        </div>
    )
  }

  if (currentView === 'personal_info') {
    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans">
            <header className="px-6 pt-4 pb-0 mb-6">
                <div className="flex items-center gap-4">
                    <button 
                        className="w-10 h-10 bg-white rounded-full shadow-sm flex-none flex items-center justify-center text-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:shadow-sm active:translate-y-0" 
                        onClick={() => {
                            setIsEditing(false);
                            setCurrentView('profile');
                        }}
                    >
                        <IconArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-[#5D4037] tracking-tight leading-none">Información Personal</h1>
                        <p className="text-gray-400 text-sm mt-1 font-medium leading-none">Gestiona tus datos</p>
                    </div>
                     {!isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-[#5D4037] font-semibold text-sm hover:underline"
                        >
                            Editar
                        </button>
                    )}
                </div>
            </header>

            <main className="px-5 pb-8 space-y-5">
                <div className="flex flex-col items-center mb-6">
                     <div 
                         className="relative cursor-pointer group"
                         onClick={() => fileInputRef.current?.click()}
                     >
                        <img 
                            src={editForm.avatarUrl} 
                            alt="Profile" 
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm group-hover:opacity-90 transition-opacity"
                        />
                         <div className="absolute bottom-0 right-0 bg-[#5D4037] text-white p-1.5 rounded-full border-2 border-[#F3F4F6]">
                            <IconPencil className="w-3 h-3" />
                         </div>
                     </div>
                     <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="mt-3 text-xs text-gray-400 hover:text-[#5D4037] transition-colors"
                     >
                         Toca para actualizar tu foto
                     </button>
                     <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         accept="image/*"
                         onChange={handleImageUpload}
                     />
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-[#5D4037] mb-2 px-1">Nombre Completo</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <IconUser className="w-5 h-5" />
                            </div>
                            <input 
                                type="text"
                                value={editForm.name}
                                disabled={!isEditing}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={`w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-medium transition-colors outline-none
                                    ${isEditing 
                                        ? 'bg-white border-2 border-[#5D4037]/20 text-gray-900 focus:border-[#5D4037]' 
                                        : 'bg-white border border-transparent text-gray-600'
                                    } shadow-sm`}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-[#5D4037] mb-2 px-1">Correo Electrónico</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <IconTicket className="w-5 h-5" /> 
                            </div>
                            <input 
                                type="email"
                                value={editForm.email}
                                disabled={!isEditing}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={`w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-medium transition-colors outline-none
                                    ${isEditing 
                                        ? 'bg-white border-2 border-[#5D4037]/20 text-gray-900 focus:border-[#5D4037]' 
                                        : 'bg-white border border-transparent text-gray-600'
                                    } shadow-sm`}
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-[#5D4037] mb-2 px-1">Número de Teléfono</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <IconPhone className="w-5 h-5" />
                            </div>
                            <input 
                                type="tel"
                                value={editForm.phone || ''}
                                disabled={!isEditing}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className={`w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-medium transition-colors outline-none
                                    ${isEditing 
                                        ? 'bg-white border-2 border-[#5D4037]/20 text-gray-900 focus:border-[#5D4037]' 
                                        : 'bg-white border border-transparent text-gray-600'
                                    } shadow-sm`}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-[#5D4037] mb-2 px-1">Dirección</label>
                        <div className="relative">
                            <div className="absolute top-3.5 left-3 flex items-start pointer-events-none text-gray-400">
                                <IconPin className="w-5 h-5" />
                            </div>
                            <textarea 
                                rows={3}
                                value={editForm.address || ''}
                                disabled={!isEditing}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                className={`w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-medium transition-colors outline-none resize-none
                                    ${isEditing 
                                        ? 'bg-white border-2 border-[#5D4037]/20 text-gray-900 focus:border-[#5D4037]' 
                                        : 'bg-white border border-transparent text-gray-600'
                                    } shadow-sm`}
                            />
                        </div>
                    </div>
                </div>
            </main>
            
            {/* Save Button (Fixed or Bottom) */}
            {isEditing && (
                <div className="fixed bottom-6 left-0 w-full px-5">
                    <button 
                        onClick={handleSave}
                        className="w-full bg-[#5D4037] text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#3E2723] active:scale-[0.98] transition-all"
                    >
                        Guardar Cambios
                    </button>
                </div>
            )}
        </div>
    );
  }

  // --- Main Profile View ---
  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans">
      <header className="px-6 pt-4 pb-0 flex items-center gap-4">
         <button 
            className="w-10 h-10 bg-white rounded-full shadow-sm flex-none flex items-center justify-center text-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:shadow-sm active:translate-y-0" 
            onClick={() => alert('Back to Dashboard (Not Implemented)')}
         >
             <IconArrowLeft className="w-5 h-5" />
         </button>
         <div>
             <h1 className="text-xl font-bold text-[#5D4037] tracking-tight leading-none">Configuración</h1>
             <p className="text-gray-400 text-sm mt-1 font-medium leading-none">Preferencias y ajustes de cuenta</p>
         </div>
      </header>

      <div className="px-5 pb-0 pt-6">
          {/* Profile Card */}
          <div className="flex flex-col items-center mb-8">
               <div 
                  className="relative cursor-pointer group"
                  onClick={() => setCurrentView('personal_info')}
               >
                  <img 
                      src={user.avatarUrl} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute bottom-0 right-0 bg-[#5D4037] text-white p-1.5 rounded-full border-2 border-[#F3F4F6]">
                      <IconPencil className="w-3 h-3" />
                  </div>
               </div>
               <h2 className="mt-3 text-xl font-bold text-gray-900">{user.name}</h2>
               <p className="text-gray-500 text-sm font-medium">{user.email}</p>
          </div>

          {/* Subscription Status */}
          <div className="mb-8">
              <SubscriptionBanner 
                tier={user.tier} 
                points={user.points} 
                onCycleTier={() => setCurrentView('subscription_detail')} 
              />
          </div>

          {/* Menu Sections */}
          <MenuSection 
            title="Mi Cuenta"
            items={[
              { icon: <IconUser className="w-5 h-5" />, label: 'Información personal', onClick: () => setCurrentView('personal_info') },
              { icon: <IconBank className="w-5 h-5" />, label: 'Cuentas bancarias', onClick: () => handleNotImplemented('Cuentas bancarias') },
              { icon: <IconFileText className="w-5 h-5" />, label: 'Reportes mensuales', onClick: () => setCurrentView('reports') },
            ]}
          />

          <MenuSection 
             title="Seguridad"
             items={[
                 { icon: <IconShield className="w-5 h-5" />, label: 'Seguridad de la cuenta', onClick: () => setCurrentView('security') },
                 { 
                     icon: <IconFaceId className="w-5 h-5" />, 
                     label: 'Activación de Face ID',
                     isToggle: true,
                     isToggled: faceIdEnabled,
                     onToggle: setFaceIdEnabled 
                 },
             ]}
          />

          <MenuSection 
            title="Preferencias"
            items={[
              { icon: <IconBell className="w-5 h-5" />, label: 'Notificaciones', onClick: () => setCurrentView('notifications') },
              { icon: <IconTranslate className="w-5 h-5" />, label: 'Idioma', badge: language === 'Español' ? 'Español' : 'Inglés', badgeColor: 'bg-[#EFEBE9] text-[#5D4037]', onClick: () => setCurrentView('language') },
              { icon: <IconMoney className="w-5 h-5" />, label: 'Divisa', badge: currency === 'MXN' ? 'MXN' : 'USD', badgeColor: 'bg-[#EFEBE9] text-[#5D4037]', onClick: () => setCurrentView('currency') },
            ]}
          />

          <MenuSection 
            title="Ayuda"
            items={[
              { icon: <IconHelp className="w-5 h-5" />, label: 'Centro de ayuda', onClick: () => handleNotImplemented('Centro de ayuda') },
              { icon: <IconFileText className="w-5 h-5" />, label: 'Términos y condiciones', onClick: () => handleNotImplemented('Términos y condiciones') },
              { icon: <IconShield className="w-5 h-5" />, label: 'Aviso de privacidad', onClick: () => handleNotImplemented('Aviso de privacidad') },
            ]}
          />

          <div className="mt-8 mb-4">
             <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl text-red-500 font-bold text-sm shadow-sm active:bg-red-50 transition-colors"
             >
                 <div className="flex items-center gap-3">
                    <IconLogout className="w-5 h-5" />
                    <span>Cerrar sesión</span>
                 </div>
             </button>
             <button className="w-full py-4 text-center text-red-400 text-xs font-semibold mt-2 hover:text-red-600 transition-colors">
                 Eliminar cuenta
             </button>
          </div>
          
          {/* Footer Love */}
          <div className="relative mt-12 pb-20 w-full overflow-hidden">
              {/* Background Wave */}
              <div className="absolute bottom-0 w-full h-32 z-0">
                   <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                       <path fill="#5D4037" fillOpacity="0.05" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                   </svg>
               </div>
               
               <div className="absolute bottom-0 w-full h-24 z-0">
                   <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                       <path fill="#5D4037" fillOpacity="0.1" d="M0,128L48,144C96,160,192,192,288,197.3C384,203,480,181,576,165.3C672,149,768,139,864,154.7C960,171,1056,213,1152,218.7C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                   </svg>
               </div>

              <div className="px-6 relative z-10">
                  <div className="flex flex-col text-left mb-8 opacity-60">
                      <p className="text-[10px] text-gray-500 font-medium">Version 8.18.2 (127236)</p>
                      <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                          Hecho con <IconHeartFilled className="w-2.5 h-2.5 text-[#5D4037]" /> en LATAM
                      </p>
                  </div>
                  
                  <div className="text-center mt-12 mb-4 relative">
                      <h3 className="text-xl font-bold text-gray-800 leading-tight">Hecho con</h3>
                      <h1 className="text-5xl font-black text-[#5D4037] tracking-tighter my-1 drop-shadow-sm">amor</h1>
                      <h3 className="text-2xl font-bold text-gray-800 leading-tight">en Latinoamérica</h3>
                      
                      {/* Floating Hearts */}
                       <div className="flex justify-center items-end gap-0 mt-[-10px] relative z-20">
                           <IconHeartFilled className="w-12 h-12 text-[#8D6E63] transform -rotate-12 translate-y-2 drop-shadow-md" />
                           <IconHeartFilled className="w-16 h-16 text-[#5D4037] -mx-3 drop-shadow-xl z-10" />
                           <IconHeartFilled className="w-10 h-10 text-[#A1887F] transform rotate-12 translate-y-3 drop-shadow-md" />
                       </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ProfilePage;