import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ChevronRight, Crown, LogOut, Trash2, Fingerprint, Camera, Upload } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('MXN');
  const [selectedCountry, setSelectedCountry] = useState('México');
  const { isAvailable: biometricAvailable, biometryType } = useBiometricAuth();
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);

  // Cargar el estado de Face ID al montar
  useEffect(() => {
    const savedEmail = localStorage.getItem('biometric_email');
    setFaceIdEnabled(!!savedEmail && biometricAvailable);
  }, [biometricAvailable]);

  const currencies = [
    { code: 'USD', name: 'Dólar estadounidense' },
    { code: 'EUR', name: 'Euro' },
    { code: 'MXN', name: 'Peso mexicano' },
    { code: 'GBP', name: 'Libra esterlina' },
    { code: 'CAD', name: 'Dólar canadiense' },
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
        
        // Load avatar from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
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

  const uploadAvatar = async (file: Blob, fileName: string) => {
    try {
      setUploadingAvatar(true);
      
      if (!user) return;

      const fileExt = fileName.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil ha sido actualizada correctamente",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la foto de perfil",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const photo = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (photo.webPath) {
        // Fetch the image and convert to blob
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        await uploadAvatar(blob, 'camera-photo.jpg');
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      if (error.message !== 'User cancelled photos app') {
        toast({
          title: "Error",
          description: "No se pudo tomar la foto",
          variant: "destructive",
        });
      }
    }
  };

  const handleUploadFromFiles = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          await uploadAvatar(file, file.name);
        }
      };
      input.click();
    } catch (error: any) {
      console.error('Error uploading from files:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la foto",
        variant: "destructive",
      });
    }
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen animated-wave-bg pb-4">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 hover:scale-105 transition-all border border-blue-100 h-12 w-12"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Perfil</h1>
            <div className="w-12"></div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* User Profile Section */}
        <Card className="bg-white backdrop-blur border-blue-100 shadow-xl p-6 animate-fade-in rounded-[20px]" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-blue-200">
                  <span className="text-2xl font-bold text-gray-600">{getInitials(userName)}</span>
                </div>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-lg transition-all hover:scale-110"
                    disabled={uploadingAvatar}
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-white border border-gray-200 shadow-lg z-50" align="end" sideOffset={5} alignOffset={-75}>
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={handleTakePhoto}
                      disabled={uploadingAvatar}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Tomar foto
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={handleUploadFromFiles}
                      disabled={uploadingAvatar}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Subir desde archivos
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{userName}</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground/70 p-0 h-auto hover:bg-transparent hover:text-foreground"
              >
                Editar perfil <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Plan Section */}
          <Card className="bg-white rounded-[20px] shadow-xl border border-blue-100 p-4 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/70 mb-1">Tu plan</p>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-foreground" />
                  <span className="text-lg font-bold text-foreground">Pro Black</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-foreground/70" />
            </div>
          </Card>
        </Card>


        {/* Preferencias */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground px-2">Preferencias</h3>
          <Card className="bg-white backdrop-blur border-blue-100 shadow-xl divide-y divide-border animate-fade-in rounded-[20px]" style={{ animationDelay: '100ms' }}>
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
              onClick={() => navigate('/notifications')}
            >
              <span className="text-foreground">Notificaciones</span>
              <ChevronRight className="h-5 w-5 text-foreground/70" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
                >
                  <span className="text-foreground">Divisa</span>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">{currencies.find(c => c.code === selectedCurrency)?.name}</span>
                    <ChevronRight className="h-5 w-5 text-foreground/70" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-white border-blue-100 p-0" align="end">
                <div className="max-h-60 overflow-y-auto p-1">
                  {currencies.map((currency) => (
                    <Button
                      key={currency.code}
                      variant="ghost"
                      className="w-full justify-start text-foreground hover:bg-primary/10"
                      onClick={() => setSelectedCurrency(currency.code)}
                    >
                      {currency.name}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
                >
                  <span className="text-foreground">Ubicación</span>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">{selectedCountry}</span>
                    <ChevronRight className="h-5 w-5 text-foreground/70" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-white border-blue-100 p-0" align="end">
                <div className="max-h-60 overflow-y-auto p-1">
                  {countries.map((country) => (
                    <Button
                      key={country}
                      variant="ghost"
                      className="w-full justify-start text-foreground hover:bg-primary/10"
                      onClick={() => setSelectedCountry(country)}
                    >
                      {country}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
              onClick={() => navigate('/categorias')}
            >
              <span className="text-foreground">Mis tarjetas/cuentas</span>
              <ChevronRight className="h-5 w-5 text-foreground/70" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-foreground">Centro de facturación automática</span>
              <ChevronRight className="h-5 w-5 text-foreground/70" />
            </Button>

            <div className="flex items-center justify-between py-4 px-4">
              <span className="text-foreground">Alertas de audio</span>
              <Switch checked={audioAlerts} onCheckedChange={setAudioAlerts} />
            </div>

            {biometricAvailable && (
              <div className="flex items-center justify-between py-4 px-4">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-foreground/70" />
                  <span className="text-foreground">{biometryType || 'Autenticación biométrica'}</span>
                </div>
                <Switch 
                  checked={faceIdEnabled} 
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      // Desactivar Face ID - limpiar credenciales guardadas
                      localStorage.removeItem('biometric_email');
                      localStorage.removeItem('biometric_password');
                      setFaceIdEnabled(false);
                      toast({
                        title: "Desactivado",
                        description: "La autenticación biométrica ha sido desactivada",
                      });
                    } else {
                      setFaceIdEnabled(true);
                      toast({
                        title: "Activado",
                        description: "La autenticación biométrica se activará en tu próximo inicio de sesión",
                      });
                    }
                  }} 
                />
              </div>
            )}
          </Card>
        </div>

        {/* Descargas */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground px-2">Descargas</h3>
          <Card className="bg-white backdrop-blur border-blue-100 shadow-xl rounded-[20px]">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-foreground">Historial de gastos e ingresos</span>
              <ChevronRight className="h-5 w-5 text-foreground/70" />
            </Button>
          </Card>
        </div>

        {/* Ayuda */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground px-2">Ayuda</h3>
          <Card className="bg-white backdrop-blur border-blue-100 shadow-xl divide-y divide-border rounded-[20px]">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-foreground">Centro de ayuda</span>
              <ChevronRight className="h-5 w-5 text-foreground/70" />
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-foreground">Preguntas Frecuentes</span>
              <ChevronRight className="h-5 w-5 text-foreground/70" />
            </Button>
          </Card>
        </div>

        {/* Legal */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground px-2">Legal</h3>
          <Card className="bg-white backdrop-blur border-blue-100 shadow-xl divide-y divide-border rounded-[20px]">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-foreground">Términos y condiciones</span>
              <ChevronRight className="h-5 w-5 text-foreground/70" />
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-foreground">Aviso de privacidad</span>
              <ChevronRight className="h-5 w-5 text-foreground/70" />
            </Button>
          </Card>
        </div>

        {/* Cuenta */}
        <div className="space-y-2 pb-4">
          <h3 className="text-lg font-bold text-foreground px-2">Cuenta</h3>
          <Card className="bg-white backdrop-blur border-blue-100 shadow-xl divide-y divide-border rounded-[20px]">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
              onClick={handleLogout}
            >
              <span className="text-foreground">Cerrar sesión</span>
              <ChevronRight className="h-5 w-5 text-foreground/70" />
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
              <AlertDialogContent className="bg-white">
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
