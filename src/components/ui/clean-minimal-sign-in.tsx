"use client" 

import * as React from "react"
 
import { useState } from "react";

import { Lock, Mail, Loader2 } from "lucide-react";
import moniLogo from "@/assets/moni-auth-logo.png";

interface SignIn2Props {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSocialLogin: (provider: 'google' | 'facebook' | 'apple') => Promise<void>;
  loading: boolean;
}
 
const SignIn2 = ({ onSignIn, onSocialLogin, loading }: SignIn2Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
 
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
 
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Por favor ingresa email y contraseña.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Por favor ingresa un email válido.");
      return;
    }
    setError("");
    try {
      await onSignIn(email, password);
    } catch (err) {
      setError("Error al iniciar sesión. Intenta de nuevo.");
    }
  };
 
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-[50vh] md:pt-[30vh] rounded-xl z-1">
      <div className="w-full max-w-[320px] md:max-w-md lg:max-w-lg bg-gradient-to-b from-sky-50/50 to-white rounded-[40px] shadow-xl shadow-opacity-10 pt-3 md:pt-6 px-6 md:px-10 pb-6 md:pb-10 flex flex-col items-center border border-blue-100 text-black">
        <div className="flex items-center justify-center w-48 md:w-64 lg:w-72 h-20 md:h-28 mb-2 md:mb-4">
          <img src={moniLogo} alt="Moni AI" className="w-full h-full object-contain" />
        </div>
        <div className="w-full flex flex-col gap-2 md:gap-3 mb-2">
          <form onSubmit={handleSignIn} className="contents">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                placeholder="Email"
                type="email"
                value={email}
                disabled={loading}
                className="w-full pl-10 pr-3 py-2 md:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm md:text-base disabled:opacity-50"
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
                className="w-full pl-10 pr-10 py-2 md:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm md:text-base disabled:opacity-50"
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer text-xs select-none"></span>
            </div>
            <div className="w-full flex justify-between items-center">
              {error && (
                <div className="text-sm text-red-500 text-left">{error}</div>
              )}
              <button type="button" className="text-xs hover:underline font-medium transition-all hover:text-gray-700 ml-auto">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        </div>
        <button
          type="submit"
          onClick={handleSignIn}
          disabled={loading}
          className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2 md:py-3 text-sm md:text-base rounded-xl shadow hover:brightness-105 hover:scale-105 cursor-pointer transition-all mb-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Iniciando sesión...
            </span>
          ) : (
            "Iniciar Sesión"
          )}
        </button>
        <div className="flex items-center w-full my-1">
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
          <span className="mx-2 text-xs text-gray-400">O inicia sesión con</span>
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
        </div>
        <div className="flex gap-3 w-full justify-center mt-1">
          <button 
            onClick={() => onSocialLogin('google')}
            disabled={loading}
            className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white hover:bg-gray-100 hover:scale-110 transition-all grow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-6 h-6 md:w-8 md:h-8"
            />
          </button>
          <button 
            onClick={() => onSocialLogin('facebook')}
            disabled={loading}
            className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white hover:bg-gray-100 hover:scale-110 transition-all grow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.svgrepo.com/show/448224/facebook.svg"
              alt="Facebook"
              className="w-6 h-6 md:w-8 md:h-8"
            />
          </button>
          <button 
            onClick={() => onSocialLogin('apple')}
            disabled={loading}
            className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white hover:bg-gray-100 hover:scale-110 transition-all grow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="https://www.svgrepo.com/show/511330/apple-173.svg"
              alt="Apple"
              className="w-6 h-6 md:w-8 md:h-8"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
 
export { SignIn2 };