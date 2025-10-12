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
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-[42vh] md:pt-[50vh] rounded-xl z-1">
      <div className="w-full max-w-[340px] md:max-w-md lg:max-w-lg bg-white/5 backdrop-blur-3xl rounded-[45px] shadow-2xl shadow-white/30 border-2 border-white/60 animate-pulse pt-6 md:pt-6 px-6 md:px-10 pb-8 md:pb-10 flex flex-col items-center text-white">
        <div className="flex items-center justify-center w-48 md:w-64 lg:w-72 h-20 md:h-28 mb-2 md:mb-4">
          <img src={moniLogo} alt="Moni AI" className="w-full h-full object-contain" />
        </div>
        <div className="w-full flex flex-col gap-2 md:gap-3 mb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              placeholder="Email"
              type="email"
              value={email}
              className="w-full pl-10 pr-3 py-2 md:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm md:text-base"
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
              className="w-full pl-10 pr-10 py-2 md:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm md:text-base"
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
          className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2 md:py-3 text-sm md:text-base rounded-xl shadow hover:brightness-105 hover:scale-105 cursor-pointer transition-all mb-2 mt-1"
        >
          Get Started
        </button>
        <div className="flex items-center w-full my-1">
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
          <span className="mx-2 text-xs text-gray-400">Or sign in with</span>
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
        </div>
        <div className="flex gap-3 w-full justify-center mt-1">
          <button className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white hover:bg-gray-100 hover:scale-110 transition-all grow">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-6 h-6 md:w-8 md:h-8"
            />
          </button>
          <button className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white hover:bg-gray-100 hover:scale-110 transition-all grow">
            <img
              src="https://www.svgrepo.com/show/448224/facebook.svg"
              alt="Facebook"
              className="w-6 h-6 md:w-8 md:h-8"
            />
          </button>
          <button className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white hover:bg-gray-100 hover:scale-110 transition-all grow">
            <img
              src="https://www.svgrepo.com/show/511330/apple-173.svg"
              alt="Apple"
              className="w-6 h-6 md:w-8 md:h-8"
            />
          </button>
        </div>
        <div className="flex flex-col items-center mt-4 gap-2">
          <div className="flex -space-x-2">
            <img
              src="https://i.pravatar.cc/150?img=1"
              alt="User 1"
              className="w-8 h-8 rounded-full"
            />
            <img
              src="https://i.pravatar.cc/150?img=2"
              alt="User 2"
              className="w-8 h-8 rounded-full"
            />
            <img
              src="https://i.pravatar.cc/150?img=3"
              alt="User 3"
              className="w-8 h-8 rounded-full"
            />
            <img
              src="https://i.pravatar.cc/150?img=4"
              alt="User 4"
              className="w-8 h-8 rounded-full"
            />
          </div>
          <p className="text-xs text-white/80 text-center">
            Únete a más de 10,000 usuarios
          </p>
        </div>
      </div>
    </div>
  );
};
 
export { SignIn2 };