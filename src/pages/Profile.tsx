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
          className="text-foreground hover:bg-primary/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Perfil</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-4 space-y-6">
        {/* User Profile Section */}
        <Card className="bg-card/80 backdrop-blur border-border/50 p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{getInitials(userName)}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{userName}</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground p-0 h-auto hover:bg-transparent hover:text-foreground"
              >
                Editar perfil <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Plan Section */}
          <Card className="bg-primary/10 border-primary/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tu plan</p>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="text-lg font-bold text-foreground">Pro Black</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </Card>


        {/* Preferencias */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground px-2">Preferencias</h3>
          <Card className="bg-card/80 backdrop-blur border-border/50 divide-y divide-border">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-muted-foreground">Divisa</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground">Peso mexicano</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-muted-foreground">Ubicación</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground">México</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
              onClick={() => navigate('/categorias')}
            >
              <span className="text-muted-foreground">Mis tarjetas/cuentas</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-muted-foreground">Centro de facturación automática</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>

            <div className="flex items-center justify-between py-4 px-4">
              <span className="text-muted-foreground">Alertas de audio</span>
              <Switch checked={audioAlerts} onCheckedChange={setAudioAlerts} />
            </div>
          </Card>
        </div>

        {/* Descargas */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground px-2">Descargas</h3>
          <Card className="bg-card/80 backdrop-blur border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-muted-foreground">Historial de gastos e ingresos</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
          </Card>
        </div>

        {/* Ayuda */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground px-2">Ayuda</h3>
          <Card className="bg-card/80 backdrop-blur border-border/50 divide-y divide-border">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-muted-foreground">Centro de ayuda</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-muted-foreground">Preguntas Frecuentes</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
          </Card>
        </div>

        {/* Legal */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground px-2">Legal</h3>
          <Card className="bg-card/80 backdrop-blur border-border/50 divide-y divide-border">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-muted-foreground">Términos y condiciones</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
            >
              <span className="text-muted-foreground">Aviso de privacidad</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
          </Card>
        </div>

        {/* Cuenta */}
        <div className="space-y-2 pb-4">
          <h3 className="text-lg font-bold text-foreground px-2">Cuenta</h3>
          <Card className="bg-card/80 backdrop-blur border-border/50 divide-y divide-border">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 px-4 hover:bg-primary/10"
              onClick={handleLogout}
            >
              <span className="text-muted-foreground">Cerrar sesión</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
