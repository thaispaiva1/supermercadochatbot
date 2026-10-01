import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  User,
  Package,
  X,
  Check,
  AlertOctagon,
} from 'lucide-react';
import { Product, StockMovement, MovementType } from '../types/inventory.ts';

interface StockMovementViewProps {
  movements: StockMovement[];
  products: Product[];
  onRecordMovement: (
    productId: string,
    type: MovementType,
    quantity: number,
    reason: string
  ) => Promise<void>;
  initialModalProduct?: Product | null;
  initialModalType?: 'in' | 'out';
}

export const StockMovementView: React.FC<StockMovementViewProps> = ({
  movements,
  products,
  onRecordMovement,
  initialModalProduct = null,
  initialModalType = 'in',
}) => {
  const [filterType, setFilterType] = useState<'all' | MovementType>('all');
  const [isModalOpen, setIsModalOpen] = useState(!!initialModalProduct);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialModalProduct ? initialModalProduct.id : products[0]?.id || ''
  );
  const [movementType, setMovementType] = useState<MovementType>(initialModalType);
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Recebimento de Mercadorias');
  const [submitting, setSubmitting] = useState(false);

  const filteredMovements = movements.filter((m) => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    return true;
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleOpenModal = () => {
    setSelectedProductId(products[0]?.id || '');
    setMovementType('in');
    setQuantity(10);
    setReason('Entrada de Mercadoria / Fornecedor');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) return;

    setSubmitting(true);
    await onRecordMovement(selectedProductId, movementType, Number(quantity), reason);
    setSubmitting(false);
    setIsModalOpen(false);
  };

  const getTypeBadge = (type: MovementType) => {
    switch (type) {
      case 'in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Entrada
          </span>
        );
      case 'out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ArrowDownRight className="w-3.5 h-3.5" />
            Saída / PDV
          </span>
        );
      case 'loss':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertOctagon className="w-3.5 h-3.5" />
            Avaria / Quebra
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Ajuste de Balanço
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-emerald-400" />
            Movimentações de Estoque
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Registro de entradas de notas, saídas de caixa, perdas e auditoria de inventário.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Movimentação</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filtrar:
          </span>
          {(['all', 'in', 'out', 'loss', 'adjustment'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                filterType === t
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
              }`}
            >
              {t === 'all'
                ? 'Todas'
                : t === 'in'
                ? 'Entradas'
                : t === 'out'
                ? 'Saídas'
                : t === 'loss'
                ? 'Avarias'
                : 'Ajustes'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">
          Total de <strong>{filteredMovements.length}</strong> registros
        </span>
      </div>

      {/* Movements Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Quantidade</th>
                <th className="py-3 px-4">Motivo / Documento</th>
                <th className="py-3 px-4">Data & Hora</th>
                <th className="py-3 px-4">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-medium">Nenhuma movimentação para o filtro selecionado</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">{getTypeBadge(m.type)}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {m.productName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {m.type === 'in' ? '+' : m.type === 'out' || m.type === 'loss' ? '-' : ''}
                      {m.quantity} {m.unit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{m.reason}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(m.date).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{m.performedBy}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                Lançar Movimentação de Estoque
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Select */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Selecione o Produto *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Atual: {p.quantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement Type Radio */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tipo de Lançamento *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('in');
                      setReason('Entrada de Nota Fiscal Fornecedor');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      movementType === 'in'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span>Entrada (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('out');
                      setReason('Saída de Venda / PDV');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      movementType === 'out'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 text-blue-400" />
                    <span>Saída (-)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('loss');
                      setReason('Avaria / Embalagem Rompida');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      movementType === 'loss'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <span>Perda / Avaria</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('adjustment');
                      setReason('Ajuste de Auditoria de Balanço');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      movementType === 'adjustment'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                    <span>Balanço / Ajuste</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Quantidade a Movimentar ({selectedProduct?.unit || 'un'}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Motivo / Observação / Nº Documento *
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Nota Fiscal 1234, Reposição de Gôndola"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmar Lançamento</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
