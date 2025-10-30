import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Fingerprint } from "lucide-react";
import heroAuth from "@/assets/moni-ai-logo.png";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { SignIn2 } from "@/components/ui/clean-minimal-sign-in";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAvailable: biometricAvailable, biometryType, authenticate } = useBiometricAuth();
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  useEffect(() => {
    // Solo escuchar cambios de auth, no verificar sesión inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Redirigir según el evento
      if (session && event === 'SIGNED_IN') {
        // Usuario que ya existía - ir al dashboard
        navigate("/dashboard");
      } else if (session && event === 'USER_UPDATED') {
        // Nuevo usuario - ir a configuración bancaria
        navigate("/bank-connection");
      } else if (session && event === 'INITIAL_SESSION') {
        // Sesión existente - ir al dashboard
        navigate("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Cargar email guardado para autenticación biométrica
  useEffect(() => {
    const loadSavedEmail = async () => {
      const stored = localStorage.getItem('biometric_email');
      if (stored && biometricAvailable) {
        setSavedEmail(stored);
      }
    };
    loadSavedEmail();
  }, [biometricAvailable]);

  // Solicitar Face ID automáticamente al abrir la app
  useEffect(() => {
    const autoAuthenticate = async () => {
      // Solo solicitar si hay credenciales guardadas y biometría disponible
      if (savedEmail && biometricAvailable && isLogin && !loading) {
        await handleBiometricAuth();
      }
    };
    
    // Pequeño delay para asegurar que la UI esté lista
    const timer = setTimeout(() => {
      autoAuthenticate();
    }, 500);

    return () => clearTimeout(timer);
  }, [savedEmail, biometricAvailable, isLogin]);

  const handleBiometricAuth = async () => {
    if (!savedEmail) {
      toast({
        title: "Error",
        description: "No hay credenciales guardadas",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await authenticate('Iniciar sesión en Moni');
      
      if (success) {
        // Obtener la contraseña guardada del almacenamiento seguro
        const savedPassword = localStorage.getItem('biometric_password');
        
        if (!savedPassword) {
          toast({
            title: "Error",
            description: "No se encontraron credenciales guardadas",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: savedEmail,
          password: savedPassword,
        });

        if (error) {
          toast({
            title: "Error",
            description: "Error al iniciar sesión",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Autenticación biométrica fallida",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          // Guardar credenciales para autenticación biométrica si está disponible
          if (biometricAvailable) {
            localStorage.setItem('biometric_email', email);
            localStorage.setItem('biometric_password', password);
          }
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

        // Validate password strength
        if (password.length < 12) {
          toast({
            title: "Error",
            description: "La contraseña debe tener al menos 12 caracteres",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
          toast({
            title: "Error",
            description: "La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/bank-connection`,
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
        } else if (data.user) {
          toast({
            title: "¡Cuenta creada!",
            description: "Tu cuenta ha sido creada exitosamente. Redirigiendo...",
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div 
        className="flex-1 flex items-center justify-center py-8 md:py-12 px-2 md:px-4 relative z-10"
      >
        <SignIn2 
          onSignIn={async (email, password, fullName) => {
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
                  // Guardar credenciales para autenticación biométrica si está disponible
                  if (biometricAvailable) {
                    localStorage.setItem('biometric_email', email);
                    localStorage.setItem('biometric_password', password);
                  }
                }
              } else {
                // Modo signup
                if (!fullName) {
                  toast({
                    title: "Error",
                    description: "Por favor ingresa tu nombre completo",
                    variant: "destructive",
                  });
                  setLoading(false);
                  return;
                }

                // Validación de contraseña
                if (password.length < 12) {
                  toast({
                    title: "Error",
                    description: "La contraseña debe tener al menos 12 caracteres",
                    variant: "destructive",
                  });
                  setLoading(false);
                  return;
                }
                
                const hasUpperCase = /[A-Z]/.test(password);
                const hasLowerCase = /[a-z]/.test(password);
                const hasNumber = /[0-9]/.test(password);
                const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
                
                if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
                  toast({
                    title: "Error",
                    description: "La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales",
                    variant: "destructive",
                  });
                  setLoading(false);
                  return;
                }

                const { data, error } = await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                    emailRedirectTo: `${window.location.origin}/bank-connection`,
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
                } else if (data.user) {
                  toast({
                    title: "¡Cuenta creada!",
                    description: "Tu cuenta ha sido creada exitosamente. Redirigiendo...",
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
          }}
          onSocialLogin={handleSocialLogin}
          loading={loading}
          isLogin={isLogin}
          setIsLogin={setIsLogin}
        />
      </div>

      {/* Footer fijo en la parte inferior - oculto en móvil */}
      <footer className="hidden md:block w-full border-t border-gray-700 py-2 md:py-4 bg-black/50 backdrop-blur-sm relative z-10">
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
