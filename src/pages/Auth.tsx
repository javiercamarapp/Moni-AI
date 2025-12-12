import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Fingerprint } from "lucide-react";
import heroAuth from "@/assets/moni-ai-logo.png";
import resetPasswordLogo from "@/assets/moni-reset-password-logo.png";
import authBackground from "@/assets/auth-abstract-bg.png";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { SignIn2 } from "@/components/ui/clean-minimal-sign-in";
import { cleanUserDataOnLogin } from "@/lib/securityAudit";

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
  const [isProcessingRecovery, setIsProcessingRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsProcessingRecovery(true);
      // Pequeño delay para asegurar que Supabase procese el token
      setTimeout(() => {
        setIsResetPassword(true);
        setIsProcessingRecovery(false);
        toast({
          title: "Recuperación de contraseña",
          description: "Ingresa tu nueva contraseña",
        });
      }, 500);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, "isResetPassword:", isResetPassword);
      
      if (isResetPassword) {
        console.log("Modo reset password activo, bloqueando redirección");
        return;
      }
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log("PASSWORD_RECOVERY detectado");
        setIsResetPassword(true);
        return;
      }
      
      // Para SIGNED_IN, pedir Face ID si está disponible antes de redirigir
      if (session && event === 'SIGNED_IN') {
        const savedEmail = localStorage.getItem('biometric_email');
        
        // Si hay biometría disponible y credenciales guardadas, pedir autenticación
        if (biometricAvailable && savedEmail) {
          const success = await authenticate('Autenticarse con Face ID para continuar');
          if (!success) {
            // Limpiar datos del usuario antes de cerrar sesión
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id) {
              localStorage.removeItem(`cachedSubscriptions_${user.id}`);
              localStorage.removeItem(`subscriptionsLastUpdate_${user.id}`);
              localStorage.removeItem(`scoreMoni`);
            }
            
            // Si falla la autenticación, cerrar sesión
            await supabase.auth.signOut();
            toast({
              title: "Autenticación cancelada",
              description: "Debes autenticarte con Face ID para acceder",
              variant: "destructive",
            });
            return;
          }
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('level_quiz_completed')
          .eq('id', session.user.id)
          .single();
        
        // SEGURIDAD: Limpiar localStorage de datos de otros usuarios antes de navegar
        cleanUserDataOnLogin(session.user.id);
        
        if (profile && !profile.level_quiz_completed) {
          navigate("/level-quiz");
        } else {
          navigate("/dashboard");
        }
      } else if (session && event === 'USER_UPDATED') {
        navigate("/level-quiz");
      } else if (session && event === 'INITIAL_SESSION') {
        const currentHash = window.location.hash;
        if (currentHash && currentHash.includes('type=recovery')) {
          console.log("Hash de recovery detectado, no redirigir");
          setIsResetPassword(true);
          return;
        }

        // Para sesión existente, pedir Face ID si está habilitado
        const savedEmail = localStorage.getItem('biometric_email');
        
        if (biometricAvailable && savedEmail) {
          const success = await authenticate('Autenticarse con Face ID para acceder');
          if (!success) {
            // Si falla, mantener en la pantalla de auth pero no cerrar sesión
            toast({
              title: "Autenticación requerida",
              description: "Debes autenticarte con Face ID para acceder",
              variant: "destructive",
            });
            return;
          }
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('level_quiz_completed')
          .eq('id', session.user.id)
          .single();
        
        if (profile && !profile.level_quiz_completed) {
          navigate("/level-quiz");
        } else {
          navigate("/dashboard");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast, isResetPassword, biometricAvailable, authenticate]);

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

  // Eliminar auto-autenticación ya que ahora se maneja en onAuthStateChange

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
                    emailRedirectTo: `${window.location.origin}/level-quiz`,
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
          // Check if there's a referral code in the URL
          const urlParams = new URLSearchParams(window.location.search);
          const refCode = urlParams.get('ref');
          
          if (refCode) {
            // Process the referral after successful signup
            try {
              const { error: refError } = await supabase.rpc('process_app_referral', {
                p_invite_code: refCode,
                p_invited_user_id: data.user.id
              });
              
              if (!refError) {
                toast({
                  title: "¡Cuenta creada!",
                  description: "Tu cuenta ha sido creada exitosamente y se otorgó el bono de invitación. Redirigiendo...",
                });
              } else {
                toast({
                  title: "¡Cuenta creada!",
                  description: "Tu cuenta ha sido creada exitosamente. Redirigiendo...",
                });
              }
            } catch (error) {
              console.error('Error processing referral:', error);
              toast({
                title: "¡Cuenta creada!",
                description: "Tu cuenta ha sido creada exitosamente. Redirigiendo...",
              });
            }
          } else {
            toast({
              title: "¡Cuenta creada!",
              description: "Tu cuenta ha sido creada exitosamente. Redirigiendo...",
            });
          }
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-[#F5F0EB] via-[#FAF8F5] to-[#EDE8E3]">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#5D4037]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#A1887F]/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>
      
      <div 
        className="flex-1 flex items-center justify-center py-8 md:py-12 px-2 md:px-4 relative z-10"
      >
        {isProcessingRecovery ? (
          null
        ) : isResetPassword ? (
          <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 flex flex-col items-center">
            <div className="flex items-center justify-center w-96 h-40 mb-8">
              <img src={resetPasswordLogo} alt="Moni AI" className="w-full h-full object-contain" />
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
                  className="w-full h-14 px-4 rounded-2xl border-gray-200 focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black disabled:opacity-50"
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
                  className="w-full h-14 px-4 rounded-2xl border-gray-200 focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black disabled:opacity-50"
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
                className="w-full h-14 rounded-2xl bg-gray-900 text-white font-bold text-base shadow-lg hover:brightness-105 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                    emailRedirectTo: `${window.location.origin}/level-quiz`,
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
    </div>
  );
};

export default Auth;
