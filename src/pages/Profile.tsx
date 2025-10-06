import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ChevronRight, Crown, LogOut, Trash2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('MXN');
  const [selectedCountry, setSelectedCountry] = useState('México');

  const currencies = [
    // Top 3 principales
    { code: 'USD', name: 'Dólar estadounidense' },
    { code: 'EUR', name: 'Euro' },
    { code: 'MXN', name: 'Peso mexicano' },
    // Resto en orden alfabético
    { code: 'AED', name: 'Dirham de los Emiratos Árabes Unidos' },
    { code: 'AFN', name: 'Afgani afgano' },
    { code: 'ALL', name: 'Lek albanés' },
    { code: 'AMD', name: 'Dram armenio' },
    { code: 'ANG', name: 'Florín antillano neerlandés' },
    { code: 'AOA', name: 'Kwanza angoleño' },
    { code: 'ARS', name: 'Peso argentino' },
    { code: 'AUD', name: 'Dólar australiano' },
    { code: 'AWG', name: 'Florín arubeño' },
    { code: 'AZN', name: 'Manat azerbaiyano' },
    { code: 'BAM', name: 'Marco convertible de Bosnia-Herzegovina' },
    { code: 'BBD', name: 'Dólar de Barbados' },
    { code: 'BDT', name: 'Taka bangladesí' },
    { code: 'BGN', name: 'Lev búlgaro' },
    { code: 'BHD', name: 'Dinar bahreiní' },
    { code: 'BIF', name: 'Franco burundés' },
    { code: 'BMD', name: 'Dólar de Bermudas' },
    { code: 'BND', name: 'Dólar de Brunéi' },
    { code: 'BOB', name: 'Boliviano' },
    { code: 'BRL', name: 'Real brasileño' },
    { code: 'BSD', name: 'Dólar bahameño' },
    { code: 'BTN', name: 'Ngultrum butanés' },
    { code: 'BWP', name: 'Pula botsuano' },
    { code: 'BYN', name: 'Rublo bielorruso' },
    { code: 'BZD', name: 'Dólar beliceño' },
    { code: 'CAD', name: 'Dólar canadiense' },
    { code: 'CDF', name: 'Franco congoleño' },
    { code: 'CHF', name: 'Franco suizo' },
    { code: 'CLP', name: 'Peso chileno' },
    { code: 'CNY', name: 'Yuan chino' },
    { code: 'COP', name: 'Peso colombiano' },
    { code: 'CRC', name: 'Colón costarricense' },
    { code: 'CUP', name: 'Peso cubano' },
    { code: 'CVE', name: 'Escudo caboverdiano' },
    { code: 'CZK', name: 'Corona checa' },
    { code: 'DJF', name: 'Franco yibutiano' },
    { code: 'DKK', name: 'Corona danesa' },
    { code: 'DOP', name: 'Peso dominicano' },
    { code: 'DZD', name: 'Dinar argelino' },
    { code: 'EGP', name: 'Libra egipcia' },
    { code: 'ERN', name: 'Nakfa eritreo' },
    { code: 'ETB', name: 'Birr etíope' },
    { code: 'FJD', name: 'Dólar fiyiano' },
    { code: 'FKP', name: 'Libra malvinense' },
    { code: 'GBP', name: 'Libra esterlina' },
    { code: 'GEL', name: 'Lari georgiano' },
    { code: 'GGP', name: 'Libra de Guernsey' },
    { code: 'GHS', name: 'Cedi ghanés' },
    { code: 'GIP', name: 'Libra gibraltareña' },
    { code: 'GMD', name: 'Dalasi gambiano' },
    { code: 'GNF', name: 'Franco guineano' },
    { code: 'GTQ', name: 'Quetzal guatemalteco' },
    { code: 'GYD', name: 'Dólar guyanés' },
    { code: 'HKD', name: 'Dólar de Hong Kong' },
    { code: 'HNL', name: 'Lempira hondureño' },
    { code: 'HRK', name: 'Kuna croata' },
    { code: 'HTG', name: 'Gourde haitiano' },
    { code: 'HUF', name: 'Forinto húngaro' },
    { code: 'IDR', name: 'Rupia indonesia' },
    { code: 'ILS', name: 'Nuevo séquel israelí' },
    { code: 'IMP', name: 'Libra manesa' },
    { code: 'INR', name: 'Rupia india' },
    { code: 'IQD', name: 'Dinar iraquí' },
    { code: 'IRR', name: 'Rial iraní' },
    { code: 'ISK', name: 'Corona islandesa' },
    { code: 'JEP', name: 'Libra de Jersey' },
    { code: 'JMD', name: 'Dólar jamaicano' },
    { code: 'JOD', name: 'Dinar jordano' },
    { code: 'JPY', name: 'Yen japonés' },
    { code: 'KES', name: 'Chelín keniano' },
    { code: 'KGS', name: 'Som kirguís' },
    { code: 'KHR', name: 'Riel camboyano' },
    { code: 'KMF', name: 'Franco comorense' },
    { code: 'KPW', name: 'Won norcoreano' },
    { code: 'KRW', name: 'Won surcoreano' },
    { code: 'KWD', name: 'Dinar kuwaití' },
    { code: 'KYD', name: 'Dólar de las Islas Caimán' },
    { code: 'KZT', name: 'Tenge kazajo' },
    { code: 'LAK', name: 'Kip laosiano' },
    { code: 'LBP', name: 'Libra libanesa' },
    { code: 'LKR', name: 'Rupia de Sri Lanka' },
    { code: 'LRD', name: 'Dólar liberiano' },
    { code: 'LSL', name: 'Loti lesotense' },
    { code: 'LYD', name: 'Dinar libio' },
    { code: 'MAD', name: 'Dirham marroquí' },
    { code: 'MDL', name: 'Leu moldavo' },
    { code: 'MGA', name: 'Ariary malgache' },
    { code: 'MKD', name: 'Dinar macedonio' },
    { code: 'MMK', name: 'Kyat birmano' },
    { code: 'MNT', name: 'Tugrik mongol' },
    { code: 'MOP', name: 'Pataca de Macao' },
    { code: 'MRU', name: 'Ouguiya mauritano' },
    { code: 'MUR', name: 'Rupia mauriciana' },
    { code: 'MVR', name: 'Rufiyaa maldiva' },
    { code: 'MWK', name: 'Kwacha malauí' },
    { code: 'MYR', name: 'Ringgit malayo' },
    { code: 'MZN', name: 'Metical mozambiqueño' },
    { code: 'NAD', name: 'Dólar namibio' },
    { code: 'NGN', name: 'Naira nigeriano' },
    { code: 'NIO', name: 'Córdoba nicaragüense' },
    { code: 'NOK', name: 'Corona noruega' },
    { code: 'NPR', name: 'Rupia nepalí' },
    { code: 'NZD', name: 'Dólar neozelandés' },
    { code: 'OMR', name: 'Rial omaní' },
    { code: 'PAB', name: 'Balboa panameño' },
    { code: 'PEN', name: 'Sol peruano' },
    { code: 'PGK', name: 'Kina papú' },
    { code: 'PHP', name: 'Peso filipino' },
    { code: 'PKR', name: 'Rupia pakistaní' },
    { code: 'PLN', name: 'Esloti polaco' },
    { code: 'PYG', name: 'Guaraní paraguayo' },
    { code: 'QAR', name: 'Riyal catarí' },
    { code: 'RON', name: 'Leu rumano' },
    { code: 'RSD', name: 'Dinar serbio' },
    { code: 'RUB', name: 'Rublo ruso' },
    { code: 'RWF', name: 'Franco ruandés' },
    { code: 'SAR', name: 'Riyal saudí' },
    { code: 'SBD', name: 'Dólar de las Islas Salomón' },
    { code: 'SCR', name: 'Rupia seychellense' },
    { code: 'SDG', name: 'Libra sudanesa' },
    { code: 'SEK', name: 'Corona sueca' },
    { code: 'SGD', name: 'Dólar de Singapur' },
    { code: 'SHP', name: 'Libra de Santa Elena' },
    { code: 'SLL', name: 'León sierraleonés' },
    { code: 'SOS', name: 'Chelín somalí' },
    { code: 'SRD', name: 'Dólar surinamés' },
    { code: 'SSP', name: 'Libra sursudanesa' },
    { code: 'STN', name: 'Dobra santotomense' },
    { code: 'SYP', name: 'Libra siria' },
    { code: 'SZL', name: 'Lilangeni suazi' },
    { code: 'THB', name: 'Baht tailandés' },
    { code: 'TJS', name: 'Somoni tayiko' },
    { code: 'TMT', name: 'Manat turcomano' },
    { code: 'TND', name: 'Dinar tunecino' },
    { code: 'TOP', name: 'Paʻanga tongano' },
    { code: 'TRY', name: 'Lira turca' },
    { code: 'TTD', name: 'Dólar de Trinidad y Tobago' },
    { code: 'TWD', name: 'Nuevo dólar taiwanés' },
    { code: 'TZS', name: 'Chelín tanzano' },
    { code: 'UAH', name: 'Grivna ucraniana' },
    { code: 'UGX', name: 'Chelín ugandés' },
    { code: 'UYU', name: 'Peso uruguayo' },
    { code: 'UZS', name: 'Som uzbeko' },
    { code: 'VES', name: 'Bolívar venezolano' },
    { code: 'VND', name: 'Dong vietnamita' },
    { code: 'VUV', name: 'Vatu vanuatuense' },
    { code: 'WST', name: 'Tala samoano' },
    { code: 'XAF', name: 'Franco CFA de África Central' },
    { code: 'XCD', name: 'Dólar del Caribe Oriental' },
    { code: 'XOF', name: 'Franco CFA de África Occidental' },
    { code: 'XPF', name: 'Franco CFP' },
    { code: 'YER', name: 'Rial yemení' },
    { code: 'ZAR', name: 'Rand sudafricano' },
    { code: 'ZMW', name: 'Kwacha zambiano' },
    { code: 'ZWL', name: 'Dólar zimbabuense' },
  ];

  const countries = [
    'Afganistán',
    'Albania',
    'Alemania',
    'Andorra',
    'Angola',
    'Antigua y Barbuda',
    'Arabia Saudita',
    'Argelia',
    'Argentina',
    'Armenia',
    'Australia',
    'Austria',
    'Azerbaiyán',
    'Bahamas',
    'Bangladés',
    'Barbados',
    'Baréin',
    'Bélgica',
    'Belice',
    'Benín',
    'Bielorrusia',
    'Birmania',
    'Bolivia',
    'Bosnia y Herzegovina',
    'Botsuana',
    'Brasil',
    'Brunéi',
    'Bulgaria',
    'Burkina Faso',
    'Burundi',
    'Bután',
    'Cabo Verde',
    'Camboya',
    'Camerún',
    'Canadá',
    'Catar',
    'Chad',
    'Chile',
    'China',
    'Chipre',
    'Colombia',
    'Comoras',
    'Corea del Norte',
    'Corea del Sur',
    'Costa de Marfil',
    'Costa Rica',
    'Croacia',
    'Cuba',
    'Dinamarca',
    'Dominica',
    'Ecuador',
    'Egipto',
    'El Salvador',
    'Emiratos Árabes Unidos',
    'Eritrea',
    'Eslovaquia',
    'Eslovenia',
    'España',
    'Estados Unidos',
    'Estonia',
    'Etiopía',
    'Filipinas',
    'Finlandia',
    'Fiyi',
    'Francia',
    'Gabón',
    'Gambia',
    'Georgia',
    'Ghana',
    'Granada',
    'Grecia',
    'Guatemala',
    'Guinea',
    'Guinea-Bisáu',
    'Guinea Ecuatorial',
    'Guyana',
    'Haití',
    'Honduras',
    'Hungría',
    'India',
    'Indonesia',
    'Irak',
    'Irán',
    'Irlanda',
    'Islandia',
    'Islas Marshall',
    'Islas Salomón',
    'Israel',
    'Italia',
    'Jamaica',
    'Japón',
    'Jordania',
    'Kazajistán',
    'Kenia',
    'Kirguistán',
    'Kiribati',
    'Kuwait',
    'Laos',
    'Lesoto',
    'Letonia',
    'Líbano',
    'Liberia',
    'Libia',
    'Liechtenstein',
    'Lituania',
    'Luxemburgo',
    'Macedonia del Norte',
    'Madagascar',
    'Malasia',
    'Malaui',
    'Maldivas',
    'Malí',
    'Malta',
    'Marruecos',
    'Mauricio',
    'Mauritania',
    'México',
    'Micronesia',
    'Moldavia',
    'Mónaco',
    'Mongolia',
    'Montenegro',
    'Mozambique',
    'Namibia',
    'Nauru',
    'Nepal',
    'Nicaragua',
    'Níger',
    'Nigeria',
    'Noruega',
    'Nueva Zelanda',
    'Omán',
    'Países Bajos',
    'Pakistán',
    'Palaos',
    'Panamá',
    'Papúa Nueva Guinea',
    'Paraguay',
    'Perú',
    'Polonia',
    'Portugal',
    'Reino Unido',
    'República Centroafricana',
    'República Checa',
    'República del Congo',
    'República Democrática del Congo',
    'República Dominicana',
    'Ruanda',
    'Rumania',
    'Rusia',
    'Samoa',
    'San Cristóbal y Nieves',
    'San Marino',
    'San Vicente y las Granadinas',
    'Santa Lucía',
    'Santo Tomé y Príncipe',
    'Senegal',
    'Serbia',
    'Seychelles',
    'Sierra Leona',
    'Singapur',
    'Siria',
    'Somalia',
    'Sri Lanka',
    'Suazilandia',
    'Sudáfrica',
    'Sudán',
    'Sudán del Sur',
    'Suecia',
    'Suiza',
    'Surinam',
    'Tailandia',
    'Tanzania',
    'Tayikistán',
    'Timor Oriental',
    'Togo',
    'Tonga',
    'Trinidad y Tobago',
    'Túnez',
    'Turkmenistán',
    'Turquía',
    'Tuvalu',
    'Ucrania',
    'Uganda',
    'Uruguay',
    'Uzbekistán',
    'Vanuatu',
    'Vaticano',
    'Venezuela',
    'Vietnam',
    'Yemen',
    'Yibuti',
    'Zambia',
    'Zimbabue',
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('sb-gfojxewccmjwdzdmdfxv-auth-token');
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Hasta pronto!"
      });
      navigate("/auth");
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      navigate("/auth");
    }
  };

  const handleDeleteAccount = async () => {
    toast({
      title: "Funcionalidad próximamente",
      description: "La eliminación de cuenta estará disponible pronto",
      variant: "destructive",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return 'US';
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-white">Perfil</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-4 space-y-6">
        {/* User Profile Section */}
        <Card className="bg-card/80 backdrop-blur border-border/50 p-6 animate-fade-in" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{getInitials(userName)}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{userName}</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 p-0 h-auto hover:bg-transparent hover:text-white"
              >
                Editar perfil <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Plan Section */}
          <Card className="bg-primary/10 border-primary/30 p-4 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70 mb-1">Tu plan</p>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-white" />
                  <span className="text-lg font-bold text-white">Pro Black</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </div>
          </Card>
        </Card>


        {/* Preferencias */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white px-2">Preferencias</h3>
          <Card className="bg-card/80 backdrop-blur border-border/50 divide-y divide-border animate-fade-in" style={{ animationDelay: '100ms' }}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
                >
                  <span className="text-white/70">Divisa</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">{currencies.find(c => c.code === selectedCurrency)?.name}</span>
                    <ChevronRight className="h-5 w-5 text-white/70" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-card border-border p-0" align="end">
                <ScrollArea className="h-64">
                  <div className="p-1">
                    {currencies.map((currency) => (
                      <Button
                        key={currency.code}
                        variant="ghost"
                        className="w-full justify-start text-white hover:bg-primary/10"
                        onClick={() => setSelectedCurrency(currency.code)}
                      >
                        {currency.name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
                >
                  <span className="text-white/70">Ubicación</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">{selectedCountry}</span>
                    <ChevronRight className="h-5 w-5 text-white/70" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-card border-border p-0" align="end">
                <ScrollArea className="h-64">
                  <div className="p-1">
                    {countries.map((country) => (
                      <Button
                        key={country}
                        variant="ghost"
                        className="w-full justify-start text-white hover:bg-primary/10"
                        onClick={() => setSelectedCountry(country)}
                      >
                        {country}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
              onClick={() => navigate('/categorias')}
            >
              <span className="text-white/70">Mis tarjetas/cuentas</span>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-white/70">Centro de facturación automática</span>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </Button>

            <div className="flex items-center justify-between py-4 px-4">
              <span className="text-white/70">Alertas de audio</span>
              <Switch checked={audioAlerts} onCheckedChange={setAudioAlerts} />
            </div>
          </Card>
        </div>

        {/* Descargas */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white px-2">Descargas</h3>
          <Card className="bg-card/80 backdrop-blur border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-white/70">Historial de gastos e ingresos</span>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </Button>
          </Card>
        </div>

        {/* Ayuda */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white px-2">Ayuda</h3>
          <Card className="bg-card/80 backdrop-blur border-border/50 divide-y divide-border">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-white/70">Centro de ayuda</span>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-white/70">Preguntas Frecuentes</span>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </Button>
          </Card>
        </div>

        {/* Legal */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white px-2">Legal</h3>
          <Card className="bg-card/80 backdrop-blur border-border/50 divide-y divide-border">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-white/70">Términos y condiciones</span>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-white/70">Aviso de privacidad</span>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </Button>
          </Card>
        </div>

        {/* Cuenta */}
        <div className="space-y-2 pb-4">
          <h3 className="text-lg font-bold text-white px-2">Cuenta</h3>
          <Card className="bg-card/80 backdrop-blur border-border/50 divide-y divide-border">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
              onClick={handleLogout}
            >
              <span className="text-white/70">Cerrar sesión</span>
              <ChevronRight className="h-5 w-5 text-white/70" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto py-4 px-4 hover:bg-destructive/10"
                >
                  <span className="text-destructive">Eliminar cuenta</span>
                  <ChevronRight className="h-5 w-5 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente tu cuenta
                    y todos tus datos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar cuenta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
