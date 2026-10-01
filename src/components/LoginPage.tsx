import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Store, ShieldCheck, CheckCircle2, Package, ShoppingCart } from 'lucide-react';
import { AuthService } from '../services/authService.ts';
import { UserSession } from '../types/inventory.ts';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }
    if (!password) {
      setError('Por favor, digite sua senha de acesso.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = AuthService.login(email, password);
      setLoading(false);

      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        setError(result.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-slate-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 mb-4 ring-4 ring-emerald-500/10">
            <Store className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Super<span className="text-emerald-400">Estoque</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Sistema Integrado de Caixa & Gestão de Estoque
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Acesso ao Sistema
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Seguro
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@supermercado.com.br"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feature badges */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60 text-slate-400 text-xs">
            <ShoppingCart className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span>Frente de Caixa (PDV)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60 text-slate-400 text-xs">
            <Package className="w-4 h-4 text-teal-400 mx-auto mb-1" />
            <span>Controle de Estoque</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span>Acesso por Perfil</span>
          </div>
        </div>
      </div>
    </div>
  );
};
