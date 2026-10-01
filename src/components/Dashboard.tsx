import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Bot,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  ShoppingCart,
  Percent,
  Receipt,
  QrCode,
  Banknote,
  Wallet,
} from 'lucide-react';
import { Category, Product, StockMovement, SaleTransaction } from '../types/inventory.ts';

interface DashboardProps {
  products: Product[];
  categories: Category[];
  movements: StockMovement[];
  sales?: SaleTransaction[];
  onNavigateTab: (tab: 'dashboard' | 'pos' | 'products' | 'categories' | 'movements' | 'agent') => void;
  onOpenAddProduct: () => void;
  onOpenAddCategory: () => void;
  onQuickMovement: (product: Product, type: 'in' | 'out') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  categories,
  movements,
  sales = [],
  onNavigateTab,
  onOpenAddProduct,
  onOpenAddCategory,
  onQuickMovement,
}) => {
  const [activeView, setActiveView] = useState<'all' | 'financial' | 'inventory'>('all');
  const now = new Date();

  // Inventory Metrics
  const totalProducts = products.length;
  const totalStockQuantity = products.reduce((acc, p) => acc + p.quantity, 0);
  const totalCostValue = products.reduce((acc, p) => acc + p.quantity * p.costPrice, 0);
  const totalSaleValue = products.reduce((acc, p) => acc + p.quantity * p.salePrice, 0);
  const estimatedPotentialProfit = totalSaleValue - totalCostValue;

  const lowStockProducts = products.filter((p) => p.quantity <= p.minStock);
  const outOfStockProducts = products.filter((p) => p.quantity <= 0);

  const expiringProducts = products
    .filter((p) => {
      if (!p.expirationDate) return false;
      const exp = new Date(p.expirationDate);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    })
    .sort((a, b) => {
      const expA = new Date(a.expirationDate!).getTime();
      const expB = new Date(b.expirationDate!).getTime();
      return expA - expB;
    });

  // Sales & Cashier Metrics
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalSalesCost = sales.reduce((acc, s) => acc + s.totalCost, 0);
  const totalGrossProfit = sales.reduce((acc, s) => acc + s.grossProfit, 0);
  const overallROI = totalSalesCost > 0 ? (totalGrossProfit / totalSalesCost) * 100 : 0;
  const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;

  // Aggregate item sales
  const productSalesMap = new Map<string, { unitsSold: number; totalRevenue: number; totalProfit: number }>();
  sales.forEach((s) => {
    s.items.forEach((it) => {
      const existing = productSalesMap.get(it.productId) || { unitsSold: 0, totalRevenue: 0, totalProfit: 0 };
      const itemProfit = (it.unitPrice - it.unitCost) * it.quantity;
      productSalesMap.set(it.productId, {
        unitsSold: existing.unitsSold + it.quantity,
        totalRevenue: existing.totalRevenue + it.subtotal,
        totalProfit: existing.totalProfit + itemProfit,
      });
    });
  });

  // Product ROI & Performance Table items
  const productPerformance = products.map((p) => {
    const saleData = productSalesMap.get(p.id) || { unitsSold: 0, totalRevenue: 0, totalProfit: 0 };
    const unitProfit = p.salePrice - p.costPrice;
    const roiPercent = p.costPrice > 0 ? (unitProfit / p.costPrice) * 100 : 0;

    return {
      product: p,
      unitProfit,
      roiPercent,
      unitsSold: saleData.unitsSold,
      revenueGenerated: saleData.totalRevenue,
      accumulatedProfit: saleData.totalProfit,
    };
  }).sort((a, b) => b.roiPercent - a.roiPercent);

  // Payment Breakdown
  const paymentBreakdown: Record<string, { count: number; total: number }> = {};
  sales.forEach((s) => {
    if (!paymentBreakdown[s.paymentMethod]) {
      paymentBreakdown[s.paymentMethod] = { count: 0, total: 0 };
    }
    paymentBreakdown[s.paymentMethod].count += 1;
    paymentBreakdown[s.paymentMethod].total += s.totalAmount;
  });

  const paymentLabels: Record<string, { label: string; icon: any; color: string }> = {
    dinheiro: { label: 'Dinheiro', icon: Banknote, color: 'text-emerald-400 bg-emerald-500/10' },
    pix: { label: 'PIX', icon: QrCode, color: 'text-teal-400 bg-teal-500/10' },
    cartao_credito: { label: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-400 bg-blue-500/10' },
    cartao_debito: { label: 'Cartão de Débito', icon: CreditCard, color: 'text-cyan-400 bg-cyan-500/10' },
    vale_alimentacao: { label: 'Vale Alimentação', icon: Wallet, color: 'text-amber-400 bg-amber-500/10' },
    vale_refeicao: { label: 'Vale Refeição', icon: Wallet, color: 'text-orange-400 bg-orange-500/10' },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Gestão */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                Painel do Gestor
              </span>
              <span className="text-slate-500 text-xs">• Indicadores em Tempo Real</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Visão Geral de Vendas, ROI & Estoque
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Monitore a receita das vendas do caixa, lucratividade dos produtos, reposições urgentes e consulte o Bot de IA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('pos')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Abrir Caixa (PDV)</span>
            </button>

            <button
              onClick={() => onNavigateTab('agent')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 transition active:scale-95"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Bot do Gestor</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Sales & Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento (Vendas)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mb-1">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>{sales.length} {sales.length === 1 ? 'venda registrada' : 'vendas registradas'}</span>
            <span className="text-emerald-400 font-semibold">Caixa Aberto</span>
          </div>
        </div>

        {/* Card 2: Lucro Bruto & ROI */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Lucro Bruto Realizado</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mb-1">
            R$ {totalGrossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px]">
              ROI +{overallROI.toFixed(1)}%
            </span>
            <span>sobre custo vendido</span>
          </div>
        </div>

        {/* Card 3: Ticket Médio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio por Venda</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mb-1">
            R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400">
            Média financeira por cliente atendido
          </p>
        </div>

        {/* Card 4: Valor do Estoque Imobilizado */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Estoque Atual (Custo)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mb-1">
            R$ {totalCostValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="text-slate-300 font-medium">{totalProducts} produtos</span>
            <span>({totalStockQuantity.toFixed(0)} volumes)</span>
          </p>
        </div>
      </div>

      {/* Main Content: Product ROI Analytics & Payment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Product ROI Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    Retorno sobre Investimento (ROI) por Produto
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Rentabilidade calculada: <code className="text-emerald-400 font-mono">((Venda - Custo) / Custo) * 100</code>
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('products')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <span>Gerenciar Preços</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="font-semibold text-slate-300">Nenhum produto cadastrado para análise de ROI</p>
                <p className="text-xs text-slate-500 mt-1">Cadastre seus itens em estoque para visualizar a rentabilidade.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/60 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                      <th className="py-2.5 px-3">Produto</th>
                      <th className="py-2.5 px-3">Custo</th>
                      <th className="py-2.5 px-3">Venda</th>
                      <th className="py-2.5 px-3">Lucro Unit.</th>
                      <th className="py-2.5 px-3">ROI Unit.</th>
                      <th className="py-2.5 px-3">Vendido</th>
                      <th className="py-2.5 px-3 text-right">Lucro Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {productPerformance.slice(0, 7).map(({ product: p, unitProfit, roiPercent, unitsSold, accumulatedProfit }) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-white block truncate max-w-[170px]">{p.name}</span>
                          <span className="text-[10px] text-slate-400">Estoque: {p.quantity} {p.unit}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          R$ {p.costPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">
                          R$ {p.salePrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-semibold">
                          +R$ {unitProfit.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            +{roiPercent.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-medium">
                          {unitsSold} {p.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          R$ {accumulatedProfit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Low Stock Items Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">
                  Itens Críticos para Reposição ({lowStockProducts.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('products')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="text-center py-6 text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-slate-300">
                  {totalProducts === 0 ? 'Nenhum produto cadastrado ainda' : 'Estoque em perfeitas condições'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {totalProducts === 0 ? 'Cadastre produtos para iniciar o monitoramento.' : 'Nenhum produto está abaixo do limite mínimo.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {lowStockProducts.slice(0, 4).map((prod) => {
                  const isZero = prod.quantity <= 0;
                  return (
                    <div key={prod.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white truncate">{prod.name}</span>
                          {isZero && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              ZERADO
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">Local: {prod.location} • Mínimo: {prod.minStock} {prod.unit}</span>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-bold ${isZero ? 'text-rose-400' : 'text-amber-400'}`}>
                          {prod.quantity} {prod.unit}
                        </span>
                        <button
                          onClick={() => onQuickMovement(prod, 'in')}
                          className="block text-[10px] text-emerald-400 hover:underline font-medium mt-0.5"
                        >
                          + Repor
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Payment Methods & Quick Manager Bot Card */}
        <div className="space-y-6">
          {/* Payment Methods Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Formas de Pagamento</h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{sales.length} transações</span>
            </div>

            {sales.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                <p className="text-xs font-semibold text-slate-300">Sem vendas registradas hoje</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Conclua vendas no Caixa para ver o gráfico de pagamentos.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.keys(paymentLabels).map((key) => {
                  const conf = paymentLabels[key];
                  const data = paymentBreakdown[key] || { count: 0, total: 0 };
                  const percent = totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0;
                  const Icon = conf.icon;

                  if (data.total === 0) return null;

                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Icon className={`w-3.5 h-3.5 ${conf.color.split(' ')[0]}`} />
                          <span>{conf.label}</span>
                        </span>
                        <span className="font-bold text-white">
                          R$ {data.total.toFixed(2)} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manager Bot Teaser Card */}
          <div className="bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Bot do Gestor</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tire dúvidas em tempo real sobre retorno dos produtos, faturamento diário, giro de mercadorias e previsão de compras.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div
                onClick={() => onNavigateTab('agent')}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 cursor-pointer transition flex items-center justify-between"
              >
                <span>"Quais produtos têm o maior ROI hoje?"</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div
                onClick={() => onNavigateTab('agent')}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 cursor-pointer transition flex items-center justify-between"
              >
                <span>"Qual o faturamento e lucro acumulado?"</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('agent')}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Abrir Consultor de Gestão</span>
            </button>
          </div>

          {/* Validades Próximas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-white">Vencimentos Próximos (30 dias)</h3>
              </div>
              <span className="text-xs font-bold text-rose-400">{expiringProducts.length} itens</span>
            </div>

            {expiringProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">Nenhum produto vencendo nos próximos 30 dias.</p>
            ) : (
              <div className="space-y-2">
                {expiringProducts.slice(0, 3).map((p) => {
                  const exp = new Date(p.expirationDate!);
                  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={p.id} className="text-xs p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div className="truncate max-w-[140px]">
                        <span className="font-semibold text-white block truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.quantity} {p.unit}</span>
                      </div>
                      <span className={`text-[10px] font-bold ${diffDays <= 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                        {diffDays <= 0 ? 'Vencido!' : `em ${diffDays} dias`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
