import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Barcode,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  Check,
  RefreshCw,
  Minus,
  Sparkles,
  AlertOctagon,
} from 'lucide-react';
import { Category, Product, UnitOfMeasure } from '../types/inventory.ts';

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  onSaveProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onQuickMovement: (product: Product, type: 'in' | 'out') => void;
  onClearAllProducts?: () => Promise<void>;
  initialAddModalOpen?: boolean;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  categories,
  onSaveProduct,
  onDeleteProduct,
  onQuickMovement,
  onClearAllProducts,
  initialAddModalOpen = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'low' | 'zero' | 'expiring'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'price' | 'expiration'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(initialAddModalOpen);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formQuantity, setFormQuantity] = useState(10);
  const [formUnit, setFormUnit] = useState<UnitOfMeasure>('un');
  const [formMinStock, setFormMinStock] = useState(5);
  const [formCostPrice, setFormCostPrice] = useState(0);
  const [formSalePrice, setFormSalePrice] = useState(0);
  const [formExpirationDate, setFormExpirationDate] = useState('');
  const [formLocation, setFormLocation] = useState('Corredor 1 - Gôndola A');
  const [formSupplier, setFormSupplier] = useState('');

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const now = new Date();

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
          return false;
        }

        if (statusFilter === 'zero' && p.quantity > 0) return false;
        if (statusFilter === 'low' && (p.quantity <= 0 || p.quantity > p.minStock)) return false;
        if (statusFilter === 'ok' && p.quantity <= p.minStock) return false;
        if (statusFilter === 'expiring') {
          if (!p.expirationDate) return false;
          const exp = new Date(p.expirationDate);
          const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 30) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'name') comp = a.name.localeCompare(b.name);
        if (sortBy === 'quantity') comp = a.quantity - b.quantity;
        if (sortBy === 'price') comp = a.salePrice - b.salePrice;
        if (sortBy === 'expiration') {
          const dateA = a.expirationDate ? new Date(a.expirationDate).getTime() : 9999999999999;
          const dateB = b.expirationDate ? new Date(b.expirationDate).getTime() : 9999999999999;
          comp = dateA - dateB;
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [products, searchTerm, selectedCategory, statusFilter, sortBy, sortOrder]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategoryId(categories[0]?.id || 'cat-mercearia');
    setFormBarcode(`789${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setFormQuantity(10);
    setFormUnit('un');
    setFormMinStock(5);
    setFormCostPrice(5.0);
    setFormSalePrice(9.9);
    setFormExpirationDate('');
    setFormLocation('Corredor 1 - Gôndola A');
    setFormSupplier('');
    setSaveError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategoryId(p.categoryId || categories[0]?.id || 'cat-mercearia');
    setFormBarcode(p.barcode);
    setFormQuantity(p.quantity);
    setFormUnit(p.unit);
    setFormMinStock(p.minStock);
    setFormCostPrice(p.costPrice);
    setFormSalePrice(p.salePrice);
    setFormExpirationDate(p.expirationDate || '');
    setFormLocation(p.location);
    setFormSupplier(p.supplier || '');
    setSaveError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setSaveError('Por favor, informe o nome do produto.');
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      const prod: Product = {
        id: editingProduct ? editingProduct.id : `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: formName.trim(),
        categoryId: formCategoryId || categories[0]?.id || 'cat-mercearia',
        barcode: formBarcode.trim() || `789${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        quantity: Number(formQuantity) || 0,
        unit: formUnit,
        minStock: Number(formMinStock) || 0,
        costPrice: Number(formCostPrice) || 0,
        salePrice: Number(formSalePrice) || 0,
        expirationDate: formExpirationDate || undefined,
        location: formLocation.trim() || 'Gôndola Central',
        supplier: formSupplier.trim() || undefined,
        createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveProduct(prod);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error onSaveProduct:', err);
      setSaveError(err.message || 'Erro ao cadastrar produto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await onDeleteProduct(id);
    setDeleteConfirmId(null);
  };

  const handleClearAll = async () => {
    if (onClearAllProducts) {
      await onClearAllProducts();
    }
    setShowClearConfirm(false);
  };

  const generateBarcode = () => {
    const randomEAN = `789${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setFormBarcode(randomEAN);
  };

  const margin = formCostPrice > 0 ? ((formSalePrice - formCostPrice) / formCostPrice) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-400" />
            Itens em Estoque
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Cadastre, consulte e gerencie as quantidades, preços e validades do seu inventário.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {products.length > 0 && onClearAllProducts && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition"
              title="Excluir todos os itens do estoque"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpar Todos os Itens</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Produto</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (only if there are products or search active) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, código de barras, localização ou fornecedor..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="all">Todos os Status</option>
              <option value="ok">Estoque Normal</option>
              <option value="low">Estoque Baixo</option>
              <option value="zero">Zerado / Esgotado</option>
              <option value="expiring">Vencimento Próximo</option>
            </select>
          </div>
        </div>

        {/* Quick status chips & count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Mostrando <strong className="text-white">{filteredProducts.length}</strong> de {products.length} itens cadastrados</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Ordenar por:</span>
            <button
              onClick={() => {
                if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('name'); setSortOrder('asc'); }
              }}
              className={`px-2 py-1 rounded-lg border text-[11px] transition ${
                sortBy === 'name'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Nome {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'quantity') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('quantity'); setSortOrder('asc'); }
              }}
              className={`px-2 py-1 rounded-lg border text-[11px] transition ${
                sortBy === 'quantity'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Qtd {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'price') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('price'); setSortOrder('desc'); }
              }}
              className={`px-2 py-1 rounded-lg border text-[11px] transition ${
                sortBy === 'price'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Preço {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => {
                if (sortBy === 'expiration') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('expiration'); setSortOrder('asc'); }
              }}
              className={`px-2 py-1 rounded-lg border text-[11px] transition ${
                sortBy === 'expiration'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Validade {sortBy === 'expiration' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Products Table or Empty State */}
      {products.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">
            Seu estoque está pronto para ser preenchido!
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-6">
            Todos os itens de exemplo foram removidos. Comece agora inserindo os seus produtos e departamentos do supermercado.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Meu Primeiro Produto</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Item & Categoria</th>
                  <th className="py-3 px-4">Código / EAN</th>
                  <th className="py-3 px-4">Qtd em Estoque</th>
                  <th className="py-3 px-4">Custo / Venda</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">Validade</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p className="font-medium">Nenhum produto encontrado com o filtro atual</p>
                      <p className="text-xs text-slate-600 mt-1">Tente ajustar seus termos de pesquisa.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const cat = categoryMap.get(p.categoryId);
                    const isZero = p.quantity <= 0;
                    const isLow = p.quantity > 0 && p.quantity <= p.minStock;

                    let expDays: number | null = null;
                    if (p.expirationDate) {
                      const exp = new Date(p.expirationDate);
                      expDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    }

                    const productMargin = p.costPrice > 0 ? ((p.salePrice - p.costPrice) / p.costPrice) * 100 : 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        {/* Name & Category */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{p.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat?.color || '#3b82f6' }}
                            />
                            <span className="text-[11px] text-slate-400">{cat?.name || 'Geral'}</span>
                          </div>
                        </td>

                        {/* Barcode */}
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Barcode className="w-3.5 h-3.5 text-slate-500" />
                            <span>{p.barcode}</span>
                          </div>
                        </td>

                        {/* Stock Quantity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                isZero
                                  ? 'text-rose-400'
                                  : isLow
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {p.quantity} {p.unit}
                            </span>
                            {isZero ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                ZERADO
                              </span>
                            ) : isLow ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                BAIXO
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-slate-500">Mínimo: {p.minStock} {p.unit}</span>
                        </td>

                        {/* Prices */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">
                            R$ {p.salePrice.toFixed(2)}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span>Custo: R$ {p.costPrice.toFixed(2)}</span>
                            <span className="text-emerald-400 text-[10px]">
                              (+{productMargin.toFixed(0)}%)
                            </span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-xs text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[130px]">{p.location}</span>
                          </div>
                        </td>

                        {/* Expiration Date */}
                        <td className="py-3.5 px-4 text-xs">
                          {p.expirationDate ? (
                            <div>
                              <span className="text-slate-300">{p.expirationDate}</span>
                              {expDays !== null && (
                                <span
                                  className={`block text-[10px] font-medium ${
                                    expDays <= 0
                                      ? 'text-rose-400 font-bold'
                                      : expDays <= 15
                                      ? 'text-amber-400'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {expDays <= 0
                                    ? 'Venceu!'
                                    : expDays === 1
                                    ? 'Vence amanhã'
                                    : `em ${expDays} dias`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">Não cadastrado</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onQuickMovement(p, 'in')}
                              title="Entrada de mercadoria"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onQuickMovement(p, 'out')}
                              title="Saída de mercadoria"
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              title="Editar dados do produto"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(p.id)}
                              title="Excluir produto"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Esvaziar Estoque?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Isso removerá todos os {products.length} produtos cadastrados para você começar a inserir seus próprios itens do zero.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Excluir Produto?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Esta ação removerá este produto do controle de estoque.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {saveError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome do Produto */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome Completo do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Arroz Branco Tipo 1 5kg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Categoria / Departamento *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Código de Barras / SKU */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Código de Barras (EAN-13)
                    </label>
                    <button
                      type="button"
                      onClick={generateBarcode}
                      className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Gerar
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="7891234567890"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Quantidade Inicial */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Quantidade em Estoque *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Unidade de Medida */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as UnitOfMeasure)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="g">Grama (g)</option>
                    <option value="L">Litro (L)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="cx">Caixa (cx)</option>
                    <option value="pct">Pacote / Fardo (pct)</option>
                  </select>
                </div>

                {/* Estoque Mínimo */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Estoque Mínimo de Alerta
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <span className="text-[10px] text-slate-500">Dispara alerta quando atingir este nível</span>
                </div>

                {/* Localização no Supermercado */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Localização (Corredor / Gôndola)
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Ex: Corredor 3 - Gôndola B"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Preço de Custo */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Preço de Venda */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Preço de Venda (R$) *
                    </label>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Margem: +{margin.toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Data de Validade */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data de Validade do Lote
                  </label>
                  <input
                    type="date"
                    value={formExpirationDate}
                    onChange={(e) => setFormExpirationDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Fornecedor */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Fornecedor / Fabricante
                  </label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="Ex: Distribuidora Central Ltda"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingProduct ? 'Salvar Alterações' : 'Concluir Cadastro'}</span>
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
