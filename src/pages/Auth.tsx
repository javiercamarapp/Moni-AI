import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import heroAuth from "@/assets/hero-auth.jpg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Solo escuchar cambios de auth, no verificar sesión inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Solo navegar al dashboard en SIGNED_IN o INITIAL_SESSION con sesión válida
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        navigate("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Error",
              description: "Correo o contraseña incorrectos",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "¡Bienvenido de vuelta!",
            description: "Inicio de sesión exitoso",
          });
        }
      } else {
        if (!fullName) {
          toast({
            title: "Error",
            description: "Por favor ingresa tu nombre completo",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Error",
              description: "Este correo ya está registrado. Intenta iniciar sesión.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "¡Cuenta creada!",
            description: "Tu cuenta ha sido creada exitosamente",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Algo salió mal. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión con este proveedor",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      <div 
        className="flex-1 flex items-center justify-center py-8 md:py-12 px-2 md:px-4 relative bg-black"
      >
        <div className="w-full max-w-[280px] md:max-w-sm space-y-3 md:space-y-8 relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="text-center p-2 md:p-6 flex flex-col justify-center">
              <h1 className="text-xl md:text-4xl font-bold text-primary mb-1 md:mb-2">Moni</h1>
              <p className="text-xs md:text-base text-muted-foreground mb-1 md:mb-3">
                {isLogin ? "Inicia sesión en tu cuenta" : "Crea tu cuenta gratis"}
              </p>
              <p className="text-center text-[10px] md:text-sm text-muted-foreground">
                Primer mes gratis · Después $150 MXN/mes
              </p>
            </div>
            <div className="h-32 md:h-auto">
              <img 
                src={heroAuth} 
                alt="Moni Dashboard" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="bg-card p-4 md:p-8 rounded-2xl border border-border shadow-xl backdrop-blur-sm bg-white/95">
          <form onSubmit={handleAuth} className="space-y-3 md:space-y-6">
            {!isLogin && (
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="fullName" className="text-xs md:text-sm">Nombre Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="email" className="text-xs md:text-sm">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-sm md:text-base h-9 md:h-10"
              />
            </div>

            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="password" className="text-xs md:text-sm">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="text-sm md:text-base h-9 md:h-10"
              />
              {!isLogin && (
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  Mínimo 6 caracteres
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-9 md:h-10 text-sm md:text-base"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />}
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </Button>
          </form>

          <div className="relative my-3 md:my-6">
            <div className="flex items-center gap-4">
              <span className="flex-1 border-t border-border" />
              <span className="text-[10px] md:text-xs uppercase text-muted-foreground">O continúa con</span>
              <span className="flex-1 border-t border-border" />
            </div>
          </div>

          {/* Botones de inicio de sesión social */}
          <div className="space-y-2 md:space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-9 md:h-10 text-xs md:text-sm"
              onClick={() => handleSocialLogin('google')}
            >
              <svg className="mr-2 h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-9 md:h-10 text-xs md:text-sm"
              onClick={() => handleSocialLogin('facebook')}
            >
              <svg className="mr-2 h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continuar con Facebook
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-9 md:h-10 text-xs md:text-sm"
              onClick={() => handleSocialLogin('apple')}
            >
              <svg className="mr-2 h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continuar con Apple
            </Button>
          </div>

          <div className="mt-3 md:mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs md:text-sm text-primary hover:underline"
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>

        </div>
      </div>

      {/* Footer fijo en la parte inferior */}
      <footer className="w-full border-t border-gray-700 py-2 md:py-4 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 text-[10px] md:text-xs">
            {/* Producto */}
            <div>
              <h4 className="font-semibold text-white mb-2">Producto</h4>
              <ul className="space-y-1">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Características</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Precios</a></li>
              </ul>
            </div>

            {/* Recursos */}
            <div>
              <h4 className="font-semibold text-white mb-2">Recursos</h4>
              <ul className="space-y-1">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Ayuda</a></li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="font-semibold text-white mb-2">Empresa</h4>
              <ul className="space-y-1">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Nosotros</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Impacto Social</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-2">Legal</h4>
              <ul className="space-y-1">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Términos</a></li>
              </ul>
            </div>

            {/* Síguenos */}
            <div>
              <h4 className="font-semibold text-white mb-2">Síguenos</h4>
              <ul className="space-y-1">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-gray-700 text-center">
            <p className="text-[10px] md:text-xs text-gray-400">
              © 2025 Moni. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
