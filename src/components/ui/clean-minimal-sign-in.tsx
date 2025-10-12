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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a1628] relative overflow-hidden">
      {/* Financial graphics background */}
      <div className="absolute inset-0 opacity-30">
        {/* Credit card icon - top left */}
        <div className="absolute top-[15%] left-[10%]">
          <svg width="120" height="80" viewBox="0 0 120 80" className="opacity-40">
            <rect x="10" y="15" width="100" height="60" rx="12" fill="none" stroke="#22d3ee" strokeWidth="2.5"/>
            <line x1="10" y1="35" x2="110" y2="35" stroke="#22d3ee" strokeWidth="2.5"/>
            <line x1="20" y1="50" x2="50" y2="50" stroke="#22d3ee" strokeWidth="2"/>
          </svg>
        </div>

        {/* Line chart - center */}
        <div className="absolute top-[25%] right-[15%] w-64 h-32">
          <svg viewBox="0 0 250 120" className="w-full h-full opacity-40">
            <polyline
              points="0,100 50,80 100,90 150,60 200,70 250,30"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Candlestick chart - top right */}
        <div className="absolute top-[12%] right-[8%] flex items-end gap-1.5 opacity-40">
          {[40, 55, 48, 65, 58, 75, 70, 85].map((height, i) => (
            <div key={i} className="relative" style={{ height: `${height}px` }}>
              <div className="w-3 h-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-sm"></div>
              <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-cyan-400 -translate-x-1/2 -translate-y-2"></div>
              <div className="absolute bottom-0 left-1/2 w-0.5 h-2 bg-cyan-600 -translate-x-1/2 translate-y-2"></div>
            </div>
          ))}
        </div>

        {/* Concentric circles - bottom right */}
        <div className="absolute bottom-[8%] right-[5%] opacity-30">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#22d3ee" strokeWidth="2"/>
            <circle cx="100" cy="100" r="55" fill="none" stroke="#22d3ee" strokeWidth="2"/>
            <circle cx="100" cy="100" r="30" fill="none" stroke="#22d3ee" strokeWidth="2"/>
          </svg>
        </div>

        {/* Floating dots */}
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-60"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `pulse ${2 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-[90%] sm:max-w-[500px] md:max-w-[560px] lg:max-w-[620px] bg-[#1a2942] rounded-[45px] shadow-2xl p-10 md:p-14 lg:p-16 border-t-[3px] border-l-[1px] border-r-[1px] border-cyan-400/40">
        {/* Logo and title */}
        <div className="text-center mb-12 md:mb-14">
          <h1 className="text-[3.5rem] md:text-[4.5rem] lg:text-[5rem] font-black text-white mb-1 tracking-tight">
            MONI AI.
          </h1>
          <p className="text-white/80 text-base md:text-lg tracking-[0.3em] font-light">
            Coach financiero
          </p>
        </div>

        {/* Form */}
        <div className="w-full flex flex-col gap-5 mb-5">
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600">
              <Mail className="w-6 h-6" strokeWidth={2}/>
            </span>
            <input
              placeholder="Email"
              type="email"
              value={email}
              className="w-full pl-16 pr-5 py-5 md:py-6 rounded-[25px] border-none focus:outline-none focus:ring-0 bg-slate-200 text-slate-700 text-lg md:text-xl placeholder:text-slate-500 font-normal"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600">
              <Lock className="w-6 h-6" strokeWidth={2}/>
            </span>
            <input
              placeholder="Password"
              type="password"
              value={password}
              className="w-full pl-16 pr-5 py-5 md:py-6 rounded-[25px] border-none focus:outline-none focus:ring-0 bg-slate-200 text-slate-700 text-lg md:text-xl placeholder:text-slate-500 font-normal"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-400 text-left px-2">{error}</div>
          )}
          
          <div className="w-full flex justify-end px-2 -mt-2">
            <button className="text-base md:text-lg text-white font-normal hover:underline transition-all">
              Forgot password?
            </button>
          </div>
        </div>

        <button
          onClick={handleSignIn}
          className="w-full bg-[#0d1b2e] text-white font-semibold py-5 md:py-6 text-xl md:text-2xl rounded-[25px] shadow-lg hover:bg-[#1a2942] transition-all mb-8"
        >
          Get Started
        </button>

        {/* Divider */}
        <div className="flex items-center w-full my-8">
          <div className="flex-grow border-t-2 border-dashed border-slate-600/50"></div>
          <span className="mx-5 text-base md:text-lg text-slate-400 font-light">Or sign in with</span>
          <div className="flex-grow border-t-2 border-dashed border-slate-600/50"></div>
        </div>

        {/* Social buttons */}
        <div className="flex gap-5 w-full justify-center">
          <button className="flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-[25px] bg-slate-200 hover:bg-slate-300 transition-all">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-12 h-12 md:w-14 md:h-14"
            />
          </button>
          <button className="flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-[25px] bg-slate-200 hover:bg-slate-300 transition-all">
            <img
              src="https://www.svgrepo.com/show/448224/facebook.svg"
              alt="Facebook"
              className="w-12 h-12 md:w-14 md:h-14"
            />
          </button>
          <button className="flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-[25px] bg-slate-200 hover:bg-slate-300 transition-all">
            <img
              src="https://www.svgrepo.com/show/511330/apple-173.svg"
              alt="Apple"
              className="w-12 h-12 md:w-14 md:h-14"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
 
export { SignIn2 };