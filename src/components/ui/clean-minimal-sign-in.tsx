"use client" 

import * as React from "react"
 
import { useState } from "react";

import { Lock, Mail, Loader2, ArrowLeft } from "lucide-react";
import moniLogo from "@/assets/moni-auth-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SignIn2Props {
  onSignIn: (email: string, password: string, fullName?: string) => Promise<void>;
  onSocialLogin: (provider: 'google' | 'facebook' | 'apple') => Promise<void>;
  loading: boolean;
  isLogin: boolean;
  setIsLogin: (value: boolean) => void;
}
 
const SignIn2 = ({ onSignIn, onSocialLogin, loading, isLogin, setIsLogin }: SignIn2Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const { toast } = useToast();
 
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Por favor ingresa email y contraseña.");
      return;
    }
    if (!isLogin && !fullName) {
      setError("Por favor ingresa tu nombre completo.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Por favor ingresa un email válido.");
      return;
    }
    setError("");
    try {
      await onSignIn(email, password, fullName);
    } catch (err) {
      setError(isLogin ? "Error al iniciar sesión. Intenta de nuevo." : "Error al crear cuenta. Intenta de nuevo.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu correo electrónico",
        variant: "destructive",
      });
      return;
    }
    
    if (!validateEmail(resetEmail)) {
      toast({
        title: "Error",
        description: "Por favor ingresa un correo válido",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Correo enviado!",
          description: "Revisa tu bandeja de entrada para restablecer tu contraseña",
        });
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Ocurrió un error. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };
 
  // Si está en modo "olvidé mi contraseña"
  if (showForgotPassword) {
    return (
      <div className="w-full flex flex-col items-center justify-center z-10">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-8 flex flex-col items-center">
          <div className="w-full mb-6">
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          </div>
          
          <div className="flex items-center justify-center w-48 h-16 mb-6">
            <img src={moniLogo} alt="Moni AI" className="w-full h-full object-contain" />
          </div>

          <div className="w-full text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">¿Olvidaste tu contraseña?</h2>
            <p className="text-sm text-gray-600">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="w-full flex flex-col gap-4 mb-4">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
                <Mail className="w-5 h-5" />
              </span>
              <input
                placeholder="Correo electrónico"
                type="email"
                value={resetEmail}
                disabled={resetLoading}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-transparent focus:border-gray-200 shadow-sm outline-none text-gray-900 text-sm placeholder:text-gray-400 transition-all disabled:opacity-50"
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full h-14 rounded-2xl bg-gray-900 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {resetLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </span>
              ) : (
                "Enviar enlace de recuperación"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center z-10 px-4">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-5 sm:p-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="flex items-center justify-center w-48 sm:w-72 h-20 sm:h-32 mb-4 sm:mb-8">
          <img src={moniLogo} alt="Moni AI" className="w-full h-full object-contain" />
        </div>
        
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
          {isLogin ? '¡Hola de nuevo!' : 'Crear Cuenta'}
        </h2>

        <div className="w-full flex flex-col gap-3 sm:gap-4 mb-2">
          <form onSubmit={handleSubmit} className="contents">
            {!isLogin && (
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  placeholder="Nombre Completo"
                  type="text"
                  value={fullName}
                  disabled={loading}
                  className="w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-4 rounded-xl sm:rounded-2xl bg-white border-2 border-transparent focus:border-gray-200 shadow-sm outline-none text-gray-900 text-sm placeholder:text-gray-400 transition-all disabled:opacity-50"
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
                <Mail className="w-5 h-5" />
              </span>
              <input
                placeholder="Email"
                type="email"
                value={email}
                disabled={loading}
                className="w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-4 rounded-xl sm:rounded-2xl bg-white border-2 border-transparent focus:border-gray-200 shadow-sm outline-none text-gray-900 text-sm placeholder:text-gray-400 transition-all disabled:opacity-50"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">
                <Lock className="w-5 h-5" />
              </span>
              <input
                placeholder="Contraseña"
                type="password"
                value={password}
                disabled={loading}
                className="w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-4 rounded-xl sm:rounded-2xl bg-white border-2 border-transparent focus:border-gray-200 shadow-sm outline-none text-gray-900 text-sm placeholder:text-gray-400 transition-all disabled:opacity-50"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="w-full flex justify-between items-center -mt-1">
              {error && (
                <div className="text-sm text-red-500 text-left font-medium">{error}</div>
              )}
              {isLogin && (
                <button 
                  type="button" 
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-semibold text-gray-700 hover:text-gray-900 hover:underline ml-auto"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
          </form>
        </div>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 sm:h-14 mt-2 rounded-xl sm:rounded-2xl bg-[#5D4037] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:bg-[#4E342E] hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {isLogin ? "Iniciando sesión..." : "Creando cuenta..."}
            </span>
          ) : (
            isLogin ? "Iniciar Sesión" : "Crear Cuenta"
          )}
        </button>
        
        <div className="relative my-4 sm:my-6 w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-transparent text-gray-400 font-medium">
              {isLogin ? "O inicia sesión con" : "O regístrate con"}
            </span>
          </div>
        </div>

        <div className="flex gap-3 sm:gap-4 w-full justify-center">
          <button 
            onClick={() => onSocialLogin('google')}
            disabled={loading}
            className="w-14 h-12 sm:w-16 sm:h-14 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center hover:scale-105 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-6 h-6"
            />
          </button>
          <button 
            onClick={() => onSocialLogin('facebook')}
            disabled={loading}
            className="w-14 h-12 sm:w-16 sm:h-14 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center hover:scale-105 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.svgrepo.com/show/448224/facebook.svg"
              alt="Facebook"
              className="w-6 h-6"
            />
          </button>
          <button 
            onClick={() => onSocialLogin('apple')}
            disabled={loading}
            className="w-14 h-12 sm:w-16 sm:h-14 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center hover:scale-105 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.svgrepo.com/show/511330/apple-173.svg"
              alt="Apple"
              className="w-6 h-6"
            />
          </button>
        </div>

        <div className="mt-5 sm:mt-8 text-center">
          <p className="text-gray-500 text-sm font-medium">
            {isLogin ? (
              <>
                ¿No tienes cuenta? 
                <button 
                  onClick={() => setIsLogin(false)}
                  className="ml-1 text-gray-900 font-bold hover:underline focus:outline-none underline decoration-2 decoration-gray-200"
                >
                  Crear cuenta
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta? 
                <button 
                  onClick={() => setIsLogin(true)}
                  className="ml-1 text-gray-900 font-bold hover:underline focus:outline-none underline decoration-2 decoration-gray-200"
                >
                  Iniciar sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
 
export { SignIn2 };