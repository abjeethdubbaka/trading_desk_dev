/**
 * @file src/pages/Login.jsx
 *
 * Authentication page — Email/password + Google sign-in.
 * Shows when the user is not signed in.
 */

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { TrendingUp, Mail, Lock, Chrome, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { cn }     from '@/lib/utils';

export default function Login() {
  const { signIn, signUp, signInGoogle, error, clearError } = useAuth();

  const [mode,     setMode]     = useState('signin');   // 'signin' | 'signup'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [localErr, setLocalErr] = useState('');

  const err = localErr || error;

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalErr('');
    clearError?.();
    if (!email || !password) { setLocalErr('Email and password are required'); return; }
    setLoading(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else                   await signUp(email, password);
    } catch (e) {
      setLocalErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLocalErr('');
    setLoading(true);
    try   { await signInGoogle(); }
    catch (e) { setLocalErr(e.message); }
    finally   { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TradeDesk Pro</h1>
          <p className="text-white/40 text-sm mt-1">Your professional trading journal</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-xl">
          {/* Mode tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {(['signin','signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setLocalErr(''); }}
                className={cn(
                  'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
                  mode === m
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70'
                )}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Error */}
          {err && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{err}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-10"
            >
              {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google */}
          <Button
            variant="outline"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white gap-2"
          >
            <Chrome className="w-4 h-4" />
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Your data is private and encrypted end-to-end.
        </p>
      </div>
    </div>
  );
}
