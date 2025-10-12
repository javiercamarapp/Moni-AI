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
    <div className="min-h-screen w-full flex flex-col items-center justify-center rounded-xl z-1 gap-6">
      <div className="w-full max-w-[320px] bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl shadow-opacity-10 pt-3 px-6 pb-6 flex flex-col items-center border border-blue-100 text-black">
        <div className="flex items-center justify-center w-48 h-24 mb-2">
          <img src={moniLogo} alt="Moni AI" className="w-full h-full object-contain" />
        </div>
        <div className="w-full flex flex-col gap-2 mb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              placeholder="Email"
              type="email"
              value={email}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              placeholder="Password"
              type="password"
              value={password}
              className="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer text-xs select-none"></span>
          </div>
          <div className="w-full flex justify-end">
          {error && (
            <div className="text-sm text-red-500 text-left">{error}</div>
          )}
            <button className="text-xs hover:underline font-medium transition-all hover:text-gray-700">
              Forgot password?
            </button>
          </div>
        </div>
        <button
          onClick={handleSignIn}
          className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2 rounded-xl shadow hover:brightness-105 hover:scale-105 cursor-pointer transition-all mb-2 mt-1"
        >
          Get Started
        </button>
        <div className="flex items-center w-full my-1">
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
          <span className="mx-2 text-xs text-gray-400">Or sign in with</span>
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
        </div>
        <div className="flex gap-3 w-full justify-center mt-1">
          <button className="flex items-center justify-center w-12 h-12 rounded-xl bg-white hover:bg-gray-100 hover:scale-110 transition-all grow">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-6 h-6"
            />
          </button>
          <button className="flex items-center justify-center w-12 h-12 rounded-xl bg-white hover:bg-gray-100 hover:scale-110 transition-all grow">
            <img
              src="https://www.svgrepo.com/show/448224/facebook.svg"
              alt="Facebook"
              className="w-6 h-6"
            />
          </button>
          <button className="flex items-center justify-center w-12 h-12 rounded-xl bg-white hover:bg-gray-100 hover:scale-110 transition-all grow">
            <img
              src="https://www.svgrepo.com/show/511330/apple-173.svg"
              alt="Apple"
              className="w-6 h-6"
            />
          </button>
        </div>
      </div>
      
      {/* User testimonials section - outside card */}
      <div className="w-full max-w-[320px]">
        <p className="text-xs text-center text-white font-medium mb-3">
          Únete a los cientos de mexicanos que cuidan sus finanzas
        </p>
        <div className="flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            <img 
              src="https://i.pravatar.cc/150?img=12" 
              alt="User" 
              className="w-8 h-8 rounded-full object-cover"
            />
            <img 
              src="https://i.pravatar.cc/150?img=25" 
              alt="User" 
              className="w-8 h-8 rounded-full object-cover"
            />
            <img 
              src="https://i.pravatar.cc/150?img=33" 
              alt="User" 
              className="w-8 h-8 rounded-full object-cover"
            />
            <img 
              src="https://i.pravatar.cc/150?img=47" 
              alt="User" 
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
 
export { SignIn2 };