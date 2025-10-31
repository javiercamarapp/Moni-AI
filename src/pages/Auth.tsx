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
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Detectar si venimos de un enlace de recuperación de contraseña
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsResetPassword(true);
      toast({
        title: "Recuperación de contraseña",
        description: "Ingresa tu nueva contraseña",
      });
    }

    // Solo escuchar cambios de auth, no verificar sesión inicial
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event, "isResetPassword:", isResetPassword);
      
      // Si estamos en modo reset password, NUNCA redirigir
      if (isResetPassword) {
        console.log("Modo reset password activo, bloqueando redirección");
        return;
      }
      
      // Si es password recovery, activar modo reset y no redirigir
      if (event === 'PASSWORD_RECOVERY') {
        console.log("PASSWORD_RECOVERY detectado");
        setIsResetPassword(true);
        return;
      }
      
      // Redirigir según el evento SOLO si no estamos en reset password
      if (session && event === 'SIGNED_IN') {
        // Usuario que ya existía - ir al dashboard
        navigate("/dashboard");
      } else if (session && event === 'USER_UPDATED') {
        // Nuevo usuario - ir a configuración bancaria
        navigate("/bank-connection");
      } else if (session && event === 'INITIAL_SESSION') {
        // Si hay hash de recovery, no redirigir
        const currentHash = window.location.hash;
        if (currentHash && currentHash.includes('type=recovery')) {
          console.log("Hash de recovery detectado, no redirigir");
          setIsResetPassword(true);
          return;
        }
        // Sesión existente normal - ir al dashboard
        navigate("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast, isResetPassword]);

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
      // NO solicitar biometría si estamos en modo reset password
      if (isResetPassword) {
        return;
      }
      
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
  }, [savedEmail, biometricAvailable, isLogin, isResetPassword]);

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    // Validar fortaleza de contraseña
    if (newPassword.length < 12) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 12 caracteres",
        variant: "destructive",
      });
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      toast({
        title: "Error",
        description: "La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Contraseña actualizada!",
          description: "Tu contraseña ha sido cambiada exitosamente",
        });
        
        // Limpiar el hash y redirigir al dashboard
        window.location.hash = '';
        setIsResetPassword(false);
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la contraseña",
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
        {isResetPassword ? (
          <div className="w-full max-w-[320px] md:max-w-md bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl shadow-opacity-10 pt-6 md:pt-8 px-4 md:px-6 pb-6 md:pb-8 flex flex-col items-center border border-blue-100">
            <div className="flex items-center justify-center w-48 md:w-56 h-16 md:h-20 mb-4 md:mb-6">
              <img src={heroAuth} alt="Moni AI" className="w-full h-full object-contain" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Nueva contraseña</h2>
            <p className="text-sm text-gray-600 mb-6 text-center">Ingresa tu nueva contraseña</p>

            <form onSubmit={handleResetPassword} className="w-full space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-900">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Mínimo 12 caracteres"
                  className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Repite tu contraseña"
                  className="w-full rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black disabled:opacity-50"
                />
              </div>

              <div className="bg-blue-50 rounded-xl p-3 text-xs text-gray-600">
                <p className="font-semibold mb-1">La contraseña debe tener:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Al menos 12 caracteres</li>
                  <li>Mayúsculas y minúsculas</li>
                  <li>Números</li>
                  <li>Caracteres especiales (!@#$%^&*)</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2 rounded-xl shadow hover:brightness-105 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </span>
                ) : (
                  "Actualizar Contraseña"
                )}
              </Button>
            </form>
          </div>
        ) : (
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
        )}
      </div>

      {/* Footer fijo en la parte inferior - oculto en móvil */}
      <footer className="hidden md:block w-full border-t border-gray-200/20 py-2 md:py-4 bg-white/10 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 text-[10px] md:text-xs">
            {/* Producto */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Producto</h4>
              <ul className="space-y-1">
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Características</a></li>
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Precios</a></li>
              </ul>
            </div>

            {/* Recursos */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Recursos</h4>
              <ul className="space-y-1">
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Ayuda</a></li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Empresa</h4>
              <ul className="space-y-1">
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Nosotros</a></li>
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Impacto Social</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Legal</h4>
              <ul className="space-y-1">
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Privacidad</a></li>
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Términos</a></li>
              </ul>
            </div>

            {/* Síguenos */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Síguenos</h4>
              <ul className="space-y-1">
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Twitter</a></li>
                <li><a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-gray-300 text-center">
            <p className="text-[10px] md:text-xs text-gray-700">
              © 2025 Moni. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
