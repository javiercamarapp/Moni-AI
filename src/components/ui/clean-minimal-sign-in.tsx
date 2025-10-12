"use client" 

import * as React from "react"
 
import { useState } from "react";

import { Lock, Mail } from "lucide-react";
import moniLogo from "@/assets/moni-auth-logo.png";
 
const SignIn2 = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
 
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
 
  const handleSignIn = () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    alert("Sign in successful! (Demo)");
  };
 
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Financial graphics background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-cyan-500/30 rounded-xl"></div>
        <div className="absolute top-40 right-20 w-48 h-32">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            <polyline
              points="0,80 40,60 80,70 120,40 160,50 200,20"
              fill="none"
              stroke="rgba(34, 211, 238, 0.3)"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="absolute bottom-32 right-32">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="inline-block w-3 h-16 mx-1 bg-gradient-to-t from-cyan-500/20 to-cyan-500/40"
              style={{ height: `${(i + 1) * 8}px` }}
            />
          ))}
        </div>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400/40 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-[380px] md:max-w-[440px] lg:max-w-[500px] bg-slate-900/80 backdrop-blur-xl rounded-[40px] shadow-2xl border border-slate-700/50 p-8 md:p-12">
        {/* Logo and title */}
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2">MONI AI.</h1>
          <p className="text-white/70 text-sm md:text-base tracking-widest">Coach financiero</p>
        </div>

        {/* Form */}
        <div className="w-full flex flex-col gap-4 mb-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
              <Mail className="w-5 h-5" />
            </span>
            <input
              placeholder="Email"
              type="email"
              value={email}
              className="w-full pl-12 pr-4 py-4 md:py-5 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-slate-200 text-slate-900 text-base md:text-lg placeholder:text-slate-500"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
              <Lock className="w-5 h-5" />
            </span>
            <input
              placeholder="Password"
              type="password"
              value={password}
              className="w-full pl-12 pr-4 py-4 md:py-5 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-slate-200 text-slate-900 text-base md:text-lg placeholder:text-slate-500"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-400 text-left">{error}</div>
          )}
          
          <div className="w-full flex justify-end">
            <button className="text-sm md:text-base text-white/90 hover:text-white hover:underline font-medium transition-all">
              Forgot password?
            </button>
          </div>
        </div>

        <button
          onClick={handleSignIn}
          className="w-full bg-slate-950 text-white font-semibold py-4 md:py-5 text-base md:text-lg rounded-2xl shadow-lg hover:bg-slate-800 hover:scale-[1.02] cursor-pointer transition-all mb-6"
        >
          Get Started
        </button>

        {/* Divider */}
        <div className="flex items-center w-full my-6">
          <div className="flex-grow border-t border-dashed border-slate-600"></div>
          <span className="mx-4 text-sm text-slate-400">Or sign in with</span>
          <div className="flex-grow border-t border-dashed border-slate-600"></div>
        </div>

        {/* Social buttons */}
        <div className="flex gap-4 w-full justify-center">
          <button className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-200 hover:bg-slate-300 hover:scale-105 transition-all">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-10 h-10 md:w-12 md:h-12"
            />
          </button>
          <button className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-200 hover:bg-slate-300 hover:scale-105 transition-all">
            <img
              src="https://www.svgrepo.com/show/448224/facebook.svg"
              alt="Facebook"
              className="w-10 h-10 md:w-12 md:h-12"
            />
          </button>
          <button className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-200 hover:bg-slate-300 hover:scale-105 transition-all">
            <img
              src="https://www.svgrepo.com/show/511330/apple-173.svg"
              alt="Apple"
              className="w-10 h-10 md:w-12 md:h-12"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
 
export { SignIn2 };