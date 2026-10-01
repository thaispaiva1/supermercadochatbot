import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
  Layers,
  ArrowRight,
  Printer,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { Product, Category, SaleTransaction, SaleItem, PaymentMethod } from '../types/inventory.ts';

interface PosCheckoutProps {
  products: Product[];
  categories: Category[];
  onCompleteSale: (sale: SaleTransaction) => Promise<void>;
  cashierName?: string;
}

export const PosCheckout: React.FC<PosCheckoutProps> = ({
  products,
  categories,
  onCompleteSale,
  cashierName = 'Operador de Caixa',
}) => {
  // Cart state
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quickQty, setQuickQty] = useState<number>(1);

  // Payment Modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('dinheiro');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Success Receipt Modal state
  const [completedSale, setCompletedSale] = useState<SaleTransaction | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Total calculations
  const totalAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cart]);

  const totalCost = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitCost * item.quantity, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const changeAmount = useMemo(() => {
    if (selectedPayment !== 'dinheiro') return 0;
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - totalAmount);
  }, [amountReceived, totalAmount, selectedPayment]);

  // Filter products for the POS catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchQuery =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // Focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Add product to cart
  const handleAddToCart = (product: Product, quantityToAdd: number = 1) => {
    if (product.quantity <= 0) {
      alert(`O produto "${product.name}" está com estoque esgotado!`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const newQty = existing.quantity + quantityToAdd;
        if (newQty > product.quantity) {
          alert(`Quantidade solicitada (${newQty}) excede o saldo em estoque (${product.quantity} ${product.unit}).`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: Number((newQty * existing.unitPrice).toFixed(2)),
        };
        return updated;
      } else {
        if (quantityToAdd > product.quantity) {
          alert(`Quantidade solicitada (${quantityToAdd}) excede o saldo em estoque (${product.quantity} ${product.unit}).`);
          return prev;
        }
        const newItem: SaleItem = {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          quantity: quantityToAdd,
          unit: product.unit,
          unitCost: product.costPrice,
          unitPrice: product.salePrice,
          subtotal: Number((quantityToAdd * product.salePrice).toFixed(2)),
        };
        return [...prev, newItem];
      }
    });

    setSearchTerm('');
    setQuickQty(1);
    barcodeInputRef.current?.focus();
  };

  // Handle direct barcode scan/submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Search exact barcode first
    const cleanSearch = searchTerm.trim().toLowerCase();
    const exactBarcode = products.find((p) => p.barcode.toLowerCase() === cleanSearch);
    if (exactBarcode) {
      handleAddToCart(exactBarcode, quickQty);
      return;
    }

    // Next search exact or first partial match
    const matched = products.find((p) => p.name.toLowerCase().includes(cleanSearch));
    if (matched) {
      handleAddToCart(matched, quickQty);
      return;
    }

    alert('Produto não localizado pelo código informado.');
  };

  // Update item quantity in cart
  const handleUpdateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (product && nextQty > product.quantity) {
              alert(`Saldo em estoque insuficiente (${product.quantity} ${product.unit}).`);
              return item;
            }
            return {
              ...item,
              quantity: nextQty,
              subtotal: Number((nextQty * item.unitPrice).toFixed(2)),
            };
          }
          return item;
        })
        .filter(Boolean) as SaleItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Deseja realmente cancelar esta venda e limpar o carrinho?')) {
      setCart([]);
      setAmountReceived('');
    }
  };

  // Finalize sale
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setAmountReceived(totalAmount.toFixed(2));
    setIsPaymentOpen(true);
  };

  const handleConfirmSale = async () => {
    if (cart.length === 0) return;

    const receivedNum = parseFloat(amountReceived) || totalAmount;
    if (selectedPayment === 'dinheiro' && receivedNum < totalAmount) {
      alert('O valor em dinheiro informado é menor que o valor total da compra.');
      return;
    }

    setProcessing(true);
    const saleCode = `${Math.floor(1000 + Math.random() * 9000)}`;
    const grossProfit = Number((totalAmount - totalCost).toFixed(2));

    const transaction: SaleTransaction = {
      id: `sale-${Date.now()}`,
      code: saleCode,
      items: [...cart],
      totalAmount: Number(totalAmount.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      grossProfit,
      paymentMethod: selectedPayment,
      amountReceived: selectedPayment === 'dinheiro' ? receivedNum : undefined,
      changeAmount: selectedPayment === 'dinheiro' ? changeAmount : undefined,
      date: new Date().toISOString(),
      cashierName,
      notes: saleNotes || undefined,
    };

    try {
      await onCompleteSale(transaction);
      setIsPaymentOpen(false);
      setCompletedSale(transaction);
      setCart([]);
      setSaleNotes('');
      setAmountReceived('');
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar venda.');
    } finally {
      setProcessing(false);
    }
  };

  const paymentLabels: Record<PaymentMethod, { label: string; icon: any; color: string }> = {
    dinheiro: { label: 'Dinheiro', icon: Banknote, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    pix: { label: 'PIX Instantâneo', icon: QrCode, color: 'text-teal-400 border-teal-500/40 bg-teal-500/10' },
    cartao_credito: { label: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
    cartao_debito: { label: 'Cartão de Débito', icon: CreditCard, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' },
    vale_alimentacao: { label: 'Vale Alimentação', icon: Wallet, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
    vale_refeicao: { label: 'Vale Refeição', icon: Wallet, color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' },
  };

  return (
    <div className="space-y-6">
      {/* Header Caixa */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Frente de Caixa (PDV)</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Caixa Aberto
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Operador: <strong className="text-slate-200">{cashierName}</strong> • Registro ágil de vendas com baixa automática de estoque.
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            onClick={handleClearCart}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Cancelar Venda</span>
          </button>
        )}
      </div>

      {/* Main Grid: Left (Product Selector) / Right (Cart & Checkout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Catalog & Search */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Barcode Scanner Bar */}
          <form
            onSubmit={handleBarcodeSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Escaneie o código de barras ou digite o nome do item..."
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-950/70 border border-slate-700/80 rounded-xl px-2 py-1">
                <span className="text-xs text-slate-400 mr-2 font-mono">Qtd:</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={quickQty}
                  onChange={(e) => setQuickQty(Math.max(1, Number(e.target.value)))}
                  className="w-14 bg-transparent text-sm text-white text-center focus:outline-none font-bold"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
            </div>
          </form>

          {/* Department Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos os Itens
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Cards Catalog */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm min-h-[420px]">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                <Package className="w-10 h-10 mb-2 text-slate-600" />
                <p className="font-semibold text-slate-300">Nenhum produto encontrado</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifique o código digitado ou cadastre novos produtos na aba "Itens em Estoque".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.quantity <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && handleAddToCart(p, quickQty)}
                      className={`group p-3 rounded-xl border transition flex flex-col justify-between cursor-pointer select-none ${
                        isOutOfStock
                          ? 'bg-slate-950/40 border-slate-800/50 opacity-50 cursor-not-allowed'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/50 active:scale-[0.98]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono text-slate-400 truncate">
                            {p.barcode || 'S/ Código'}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              isOutOfStock
                                ? 'bg-rose-500/20 text-rose-400'
                                : p.quantity <= p.minStock
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {p.quantity} {p.unit}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300 line-clamp-2 leading-tight">
                          {p.name}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-emerald-400">
                          R$ {p.salePrice.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          por {p.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Order Cupom / Carrinho & Total */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-full min-h-[520px]">
            <div>
              {/* Cupom Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Cupom de Venda</h3>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-800/60 max-h-[320px] overflow-y-auto pr-1 my-3 scrollbar-thin">
                {cart.length === 0 ? (
                  <div className="py-16 text-center text-slate-500">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                    <p className="font-semibold text-slate-300">Caixa Livre</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                      Selecione produtos ao lado ou escaneie o código de barras para iniciar a venda.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-white truncate">{item.productName}</h5>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.quantity} {item.unit} x R$ {item.unitPrice.toFixed(2)}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-400">
                          R$ {item.subtotal.toFixed(2)}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-[10px] text-slate-500 hover:text-rose-400 transition"
                        >
                          remover
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totalizer & Checkout Button */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-white font-medium">R$ {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Descontos / Promoções:</span>
                  <span className="text-emerald-400 font-medium">R$ 0,00</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Total a Pagar
                  </span>
                  <div className="text-2xl font-black text-white">
                    R$ {totalAmount.toFixed(2)}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>{totalItemsCount} {totalItemsCount === 1 ? 'volume' : 'volumes'}</span>
                </div>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={handleOpenPayment}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <CreditCard className="w-4 h-4" />
                <span>Finalizar Venda / Pagamento</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Selection Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Forma de Pagamento</h3>
                  <p className="text-xs text-slate-400">Total: R$ {totalAmount.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(Object.keys(paymentLabels) as PaymentMethod[]).map((key) => {
                const conf = paymentLabels[key];
                const IconComponent = conf.icon;
                const isSelected = selectedPayment === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPayment(key)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      isSelected
                        ? conf.color + ' ring-2 ring-emerald-500/50 font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mb-2" />
                    <span className="text-xs">{conf.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dinheiro (Cash) specifics: Valor recebido & Troco */}
            {selectedPayment === 'dinheiro' && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Valor Recebido em Dinheiro (R$):
                  </label>
                  <span className="text-xs text-slate-500">Total: R$ {totalAmount.toFixed(2)}</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder={totalAmount.toFixed(2)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-medium text-slate-400">Troco a Devolver:</span>
                  <span
                    className={`text-lg font-black ${
                      changeAmount > 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    R$ {changeAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* PIX specifics: QR Code */}
            {selectedPayment === 'pix' && (
              <div className="p-4 rounded-xl bg-slate-950 border border-teal-500/30 text-center space-y-3">
                <div className="w-32 h-32 bg-white rounded-xl mx-auto flex items-center justify-center p-2 shadow-inner">
                  <QrCode className="w-28 h-28 text-slate-900" />
                </div>
                <div>
                  <span className="text-xs font-bold text-teal-400">Chave PIX do Supermercado</span>
                  <p className="text-[11px] text-slate-400">
                    financeiro@supermercadocentral.com.br
                  </p>
                </div>
                <p className="text-[11px] text-slate-500">
                  Aguardando confirmação do pagamento instantâneo pelo terminal do cliente...
                </p>
              </div>
            )}

            {/* Cartão de Crédito / Débito specifics */}
            {(selectedPayment === 'cartao_credito' || selectedPayment === 'cartao_debito') && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <span className="text-white font-medium block">
                    Terminal TEF / Maquininha Integrada
                  </span>
                  Aproxime ou insira o cartão do cliente na máquina conectada ao caixa.
                </div>
              </div>
            )}

            {/* Vale Alimentação specifics */}
            {(selectedPayment === 'vale_alimentacao' || selectedPayment === 'vale_refeicao') && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                <Wallet className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-white font-medium block">Convênios Aceitos</span>
                  Alelo, Ticket, Sodexo, VR Benefícios e Pluxee.
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleConfirmSale}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Concluir Venda (R$ {totalAmount.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Success Cupom Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Venda Concluída com Sucesso!</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Venda #{completedSale.code} • {new Date(completedSale.date).toLocaleTimeString('pt-BR')}
              </p>
            </div>

            {/* Cupom Impresso Mockup */}
            <div className="p-4 bg-slate-950 border border-dashed border-slate-800 rounded-xl text-left font-mono text-[11px] text-slate-300 space-y-2">
              <div className="text-center font-bold text-white border-b border-slate-800 pb-2">
                SUPERMERCADO CENTRAL
                <div className="text-[10px] text-slate-400 font-normal">CUPOM NÃO FISCAL</div>
              </div>

              <div className="space-y-1">
                {completedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[190px]">
                      {it.quantity}x {it.productName}
                    </span>
                    <span className="font-bold text-emerald-400">R$ {it.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-2 space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>TOTAL:</span>
                  <span>R$ {completedSale.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>PAGAMENTO:</span>
                  <span className="uppercase">{paymentLabels[completedSale.paymentMethod]?.label || completedSale.paymentMethod}</span>
                </div>
                {completedSale.changeAmount !== undefined && completedSale.changeAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>TROCO:</span>
                    <span>R$ {completedSale.changeAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Cupom</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Próxima Venda (F2)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
