import React from 'react';
import {
  Store,
  LayoutDashboard,
  Package,
  Tags,
  ArrowLeftRight,
  Bot,
  LogOut,
  AlertTriangle,
  User,
  ShoppingCart,
  ShieldAlert,
} from 'lucide-react';
import { UserSession } from '../types/inventory.ts';

interface HeaderProps {
  currentTab: 'dashboard' | 'pos' | 'products' | 'categories' | 'movements' | 'agent';
  onSelectTab: (tab: 'dashboard' | 'pos' | 'products' | 'categories' | 'movements' | 'agent') => void;
  user: UserSession;
  onLogout: () => void;
  alertCount: number;
  onOpenAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  alertCount,
  onOpenAlerts,
}) => {
  const isOperator = user.role === 'operador';

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'gerente':
        return 'Gestor Geral';
      case 'supervisor':
        return 'Gestor de Operações';
      case 'operador':
        return 'Operador de Caixa';
      default:
        return 'Colaborador';
    }
  };

  // Operador só tem acesso exclusivo ao Caixa (PDV)
  const navItems = isOperator
    ? [
        { id: 'pos' as const, label: 'Frente de Caixa (PDV)', icon: ShoppingCart },
      ]
    : [
        { id: 'dashboard' as const, label: 'Visão Geral & ROI', icon: LayoutDashboard },
        { id: 'pos' as const, label: 'Caixa (PDV)', icon: ShoppingCart },
        { id: 'products' as const, label: 'Itens em Estoque', icon: Package },
        { id: 'categories' as const, label: 'Categorias', icon: Tags },
        { id: 'movements' as const, label: 'Movimentações', icon: ArrowLeftRight },
        { id: 'agent' as const, label: 'Bot do Gestor', icon: Bot, isAi: true },
      ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onSelectTab(isOperator ? 'pos' : 'dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-lg tracking-tight">
                  Super<span className="text-emerald-400">Estoque</span>
                </span>
                <span className={`hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isOperator
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {isOperator ? 'Terminal PDV' : 'Gestão'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight hidden sm:block">
                {isOperator ? 'Operação de Caixa & Vendas' : 'Controle Integrado de Caixa & Mercadorias'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isAi = (item as any).isAi;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition ${
                    isActive
                      ? isAi
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                        : 'bg-slate-800 text-white border border-slate-700'
                      : isAi
                      ? 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isAi && !isActive ? 'text-emerald-400' : ''}`} />
                  <span>{item.label}</span>
                  {isAi && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            {/* Quick alert badge - only for Gestor */}
            {!isOperator && alertCount > 0 && (
              <button
                onClick={onOpenAlerts}
                className="relative p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-amber-400 border border-amber-500/20 transition flex items-center justify-center"
                title={`${alertCount} itens com estoque baixo`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              </button>
            )}

            {/* User pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${
                isOperator
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}>
                {user.name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-white leading-none">{user.name}</p>
                <span className={`text-[10px] font-medium leading-tight ${
                  isOperator ? 'text-blue-400' : 'text-emerald-400'
                }`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              title="Encerrar Sessão"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        {!isOperator && (
          <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 overflow-x-auto gap-1 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium flex flex-col items-center gap-1 whitespace-nowrap ${
                    isActive
                      ? 'text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
