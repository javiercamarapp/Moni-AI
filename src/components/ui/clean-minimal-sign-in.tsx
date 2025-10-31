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
      <div className="min-h-screen w-full flex flex-col items-center justify-end pb-8 rounded-xl z-1">
        <div className="w-full max-w-[320px] md:max-w-md bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl shadow-opacity-10 pt-2 md:pt-3 px-4 md:px-6 pb-3 md:pb-4 flex flex-col items-center border border-blue-100 text-black">
          <div className="flex items-center justify-center w-48 md:w-56 h-16 md:h-20 mb-2 md:mb-3">
            <img src={moniLogo} alt="Moni AI" className="w-full h-full object-contain" />
          </div>
          
          <div className="w-full mb-3">
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          </div>

          <div className="w-full text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">¿Olvidaste tu contraseña?</h2>
            <p className="text-sm text-gray-600">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="w-full flex flex-col gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                placeholder="Correo electrónico"
                type="email"
                value={resetEmail}
                disabled={resetLoading}
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm disabled:opacity-50"
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2 text-sm rounded-xl shadow hover:brightness-105 hover:scale-105 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {resetLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
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
    <div className="min-h-screen w-full flex flex-col items-center justify-end pb-8 rounded-xl z-1">
      <div className="w-full max-w-[320px] md:max-w-md bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl shadow-opacity-10 pt-2 md:pt-3 px-4 md:px-6 pb-3 md:pb-4 flex flex-col items-center border border-blue-100 text-black">
        <div className="flex items-center justify-center w-48 md:w-56 h-16 md:h-20 mb-2 md:mb-3">
          <img src={moniLogo} alt="Moni AI" className="w-full h-full object-contain" />
        </div>
        <div className="w-full flex flex-col gap-1.5 md:gap-2 mb-1">
          <form onSubmit={handleSubmit} className="contents">
            {!isLogin && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  placeholder="Nombre Completo"
                  type="text"
                  value={fullName}
                  disabled={loading}
                  className="w-full pl-10 pr-3 py-1.5 md:py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm disabled:opacity-50"
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                placeholder="Email"
                type="email"
                value={email}
                disabled={loading}
                className="w-full pl-10 pr-3 py-1.5 md:py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm disabled:opacity-50"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                placeholder="Contraseña"
                type="password"
                value={password}
                disabled={loading}
                className="w-full pl-10 pr-10 py-1.5 md:py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm disabled:opacity-50"
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer text-xs select-none"></span>
            </div>
            <div className="w-full flex justify-between items-center">
              {error && (
                <div className="text-sm text-red-500 text-left">{error}</div>
              )}
              {isLogin && (
                <button 
                  type="button" 
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs hover:underline font-medium transition-all hover:text-gray-700 ml-auto"
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
          className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-1.5 md:py-2 text-sm rounded-xl shadow hover:brightness-105 hover:scale-105 cursor-pointer transition-all mb-1 mt-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isLogin ? "Iniciando sesión..." : "Creando cuenta..."}
            </span>
          ) : (
            isLogin ? "Iniciar Sesión" : "Crear Cuenta"
          )}
        </button>
        
        <div className="text-center mt-1.5">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
          >
            {isLogin ? (
              <>
                ¿No tienes cuenta? <span className="font-semibold underline">Crear cuenta</span>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta? <span className="font-semibold underline">Iniciar sesión</span>
              </>
            )}
          </button>
        </div>
        <div className="flex items-center w-full my-1">
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
          <span className="mx-2 text-[10px] text-gray-400">
            {isLogin ? "O inicia sesión con" : "O regístrate con"}
          </span>
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
        </div>
        <div className="flex gap-2 w-full justify-center mt-0.5">
          <button 
            onClick={() => onSocialLogin('google')}
            disabled={loading}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white hover:bg-gray-100 hover:scale-110 transition-all grow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5 md:w-6 md:h-6"
            />
          </button>
          <button 
            onClick={() => onSocialLogin('facebook')}
            disabled={loading}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white hover:bg-gray-100 hover:scale-110 transition-all grow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.svgrepo.com/show/448224/facebook.svg"
              alt="Facebook"
              className="w-5 h-5 md:w-6 md:h-6"
            />
          </button>
          <button 
            onClick={() => onSocialLogin('apple')}
            disabled={loading}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white hover:bg-gray-100 hover:scale-110 transition-all grow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.svgrepo.com/show/511330/apple-173.svg"
              alt="Apple"
              className="w-5 h-5 md:w-6 md:h-6"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
 
export { SignIn2 };