import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage.tsx';
import { Header } from './components/Header.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { PosCheckout } from './components/PosCheckout.tsx';
import { ProductManagement } from './components/ProductManagement.tsx';
import { CategoryManagement } from './components/CategoryManagement.tsx';
import { StockMovementView } from './components/StockMovementView.tsx';
import { AiAssistant } from './components/AiAssistant.tsx';
import { AuthService } from './services/authService.ts';
import { InventoryStorageService } from './services/inventoryStorage.ts';
import { Product, Category, StockMovement, UserSession, MovementType, SaleTransaction } from './types/inventory.ts';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => AuthService.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'pos' | 'products' | 'categories' | 'movements' | 'agent'>(() => {
    const user = AuthService.getCurrentUser();
    return user?.role === 'operador' ? 'pos' : 'dashboard';
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modal triggers from Dashboard or quick actions
  const [openProductModal, setOpenProductModal] = useState(false);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [quickMovementTarget, setQuickMovementTarget] = useState<{
    product: Product;
    type: 'in' | 'out';
  } | null>(null);

  // Load inventory and sales data
  const loadInventory = async () => {
    try {
      const [cats, prods, movs, sls] = await Promise.all([
        InventoryStorageService.getCategories(),
        InventoryStorageService.getProducts(),
        InventoryStorageService.getMovements(),
        InventoryStorageService.getSales(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setMovements(movs);
      setSales(sls);
    } catch (e) {
      console.warn('Error loading inventory data:', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadInventory();
      if (session.role === 'operador') {
        setCurrentTab('pos');
      }
    }
  }, [session]);

  const handleLogout = () => {
    AuthService.logout();
    setSession(null);
  };

  // Product Actions
  const handleSaveProduct = async (product: Product) => {
    await InventoryStorageService.saveProduct(product);
    await loadInventory();
  };

  const handleDeleteProduct = async (id: string) => {
    await InventoryStorageService.deleteProduct(id);
    await loadInventory();
  };

  const handleClearAllProducts = async () => {
    await InventoryStorageService.clearAllProducts();
    await loadInventory();
  };

  // Category Actions
  const handleSaveCategory = async (category: Category) => {
    await InventoryStorageService.saveCategory(category);
    await loadInventory();
  };

  const handleDeleteCategory = async (id: string) => {
    await InventoryStorageService.deleteCategory(id);
    await loadInventory();
  };

  // Stock Movement Actions
  const handleRecordMovement = async (
    productId: string,
    type: MovementType,
    quantity: number,
    reason: string
  ) => {
    const performer = session ? `${session.name} (${session.role})` : 'Operador';
    await InventoryStorageService.recordMovement(productId, type, quantity, reason, performer);
    await loadInventory();
  };

  // Cashier Sale Action
  const handleCompleteSale = async (sale: SaleTransaction) => {
    await InventoryStorageService.recordSale(sale);
    await loadInventory();
  };

  // Quick Movement from Dashboard or Product Table
  const handleTriggerQuickMovement = (product: Product, type: 'in' | 'out') => {
    setQuickMovementTarget({ product, type });
    setCurrentTab('movements');
  };

  // Count alerts (low stock + expiring within 30 days)
  const now = new Date();
  const alertCount = products.filter((p) => {
    const isLow = p.quantity <= p.minStock;
    let isExpiring = false;
    if (p.expirationDate) {
      const exp = new Date(p.expirationDate);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) isExpiring = true;
    }
    return isLow || isExpiring;
  }).length;

  // Not logged in -> Show Login Page
  if (!session) {
    return (
      <LoginPage
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          if (newSession.role === 'operador') {
            setCurrentTab('pos');
          } else {
            setCurrentTab('dashboard');
          }
        }}
      />
    );
  }

  // Operador: Deverá ser estritamente SÓ o caixa (PDV)
  if (session.role === 'operador') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Header
          currentTab="pos"
          onSelectTab={() => setCurrentTab('pos')}
          user={session}
          onLogout={handleLogout}
          alertCount={0}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
              <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium">Carregando frente de caixa...</p>
            </div>
          ) : (
            <PosCheckout
              products={products}
              categories={categories}
              onCompleteSale={handleCompleteSale}
              cashierName={session.name}
            />
          )}
        </main>
      </div>
    );
  }

  // Gestor: Acesso total (Dashboard, Caixa, Estoque, Categorias, Movimentações e Bot IA)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setOpenProductModal(false);
          setOpenCategoryModal(false);
        }}
        user={session}
        onLogout={handleLogout}
        alertCount={alertCount}
        onOpenAlerts={() => setCurrentTab('products')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loadingData ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
            <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium">Carregando sistema do supermercado...</p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard
                products={products}
                categories={categories}
                movements={movements}
                sales={sales}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onOpenAddProduct={() => {
                  setCurrentTab('products');
                  setOpenProductModal(true);
                }}
                onOpenAddCategory={() => {
                  setCurrentTab('categories');
                  setOpenCategoryModal(true);
                }}
                onQuickMovement={handleTriggerQuickMovement}
              />
            )}

            {currentTab === 'pos' && (
              <PosCheckout
                products={products}
                categories={categories}
                onCompleteSale={handleCompleteSale}
                cashierName={session.name}
              />
            )}

            {currentTab === 'products' && (
              <ProductManagement
                products={products}
                categories={categories}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onQuickMovement={handleTriggerQuickMovement}
                onClearAllProducts={handleClearAllProducts}
                initialAddModalOpen={openProductModal}
              />
            )}

            {currentTab === 'categories' && (
              <CategoryManagement
                categories={categories}
                products={products}
                onSaveCategory={handleSaveCategory}
                onDeleteCategory={handleDeleteCategory}
                initialAddModalOpen={openCategoryModal}
              />
            )}

            {currentTab === 'movements' && (
              <StockMovementView
                movements={movements}
                products={products}
                onRecordMovement={handleRecordMovement}
                initialModalProduct={quickMovementTarget?.product || null}
                initialModalType={quickMovementTarget?.type || 'in'}
              />
            )}

            {currentTab === 'agent' && (
              <AiAssistant
                products={products}
                categories={categories}
                sales={sales}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
