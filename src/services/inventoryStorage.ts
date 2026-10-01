import { Category, Product, StockMovement, UnitOfMeasure, SaleTransaction, MovementType } from '../types/inventory.ts';
import { getSupabaseClient } from '../lib/supabase.ts';

const CATEGORIES_KEY = 'super_estoque_categories_v2';
const PRODUCTS_KEY = 'super_estoque_products_v2';
const MOVEMENTS_KEY = 'super_estoque_movements_v2';
const SALES_KEY = 'super_estoque_sales_v2';

// Clear previous sample storage if present
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('super_estoque_products_v1');
    localStorage.removeItem('super_estoque_movements_v1');
  } catch {}
}

// Initial supermarket categories so user has departments to pick from when creating items
const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-mercearia',
    name: 'Mercearia & Grãos',
    description: 'Arroz, feijão, massas, farinhas, óleos e condimentos',
    icon: 'Package',
    color: '#D97706',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-bebidas',
    name: 'Bebidas & Sucos',
    description: 'Refrigerantes, sucos, cervejas, águas e destilados',
    icon: 'Wine',
    color: '#2563EB',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-laticinios',
    name: 'Laticínios & Frios',
    description: 'Leites, queijos, iogurtes, manteigas e embutidos',
    icon: 'Egg',
    color: '#EAB308',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-hortifruti',
    name: 'Hortifrúti',
    description: 'Frutas frescas, verduras selecionadas e legumes',
    icon: 'Apple',
    color: '#16A34A',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-carnes',
    name: 'Açougue & Carnes',
    description: 'Carnes bovinas, suínas, aves e cortes especiais',
    icon: 'Beef',
    color: '#DC2626',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-padaria',
    name: 'Padaria & Confeitaria',
    description: 'Pães artesanais, bolos, tortas, biscoitos e torradas',
    icon: 'Croissant',
    color: '#EA580C',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-limpeza',
    name: 'Limpeza & Lavanderia',
    description: 'Detergentes, sabão em pó, desinfetantes e alvejantes',
    icon: 'Sparkles',
    color: '#0891B2',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-higiene',
    name: 'Higiene & Cuidados',
    description: 'Sabonetes, cremes dentais, shampoos e desodorantes',
    icon: 'HeartPulse',
    color: '#9333EA',
    createdAt: new Date().toISOString(),
  },
];

// Clean inventory ready for user inserts
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_MOVEMENTS: StockMovement[] = [];

export class InventoryStorageService {
  private static getStoredData<T>(key: string, defaultData: T): T {
    if (typeof window === 'undefined') return defaultData;
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        localStorage.setItem(key, JSON.stringify(defaultData));
        return defaultData;
      }
      return JSON.parse(item) as T;
    } catch {
      return defaultData;
    }
  }

  private static setStoredData<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error('Error persisting data locally:', err);
    }
  }

  // --- CATEGORIES ---
  static async getCategories(): Promise<Category[]> {
    const localCats = this.getStoredData<Category[]>(CATEGORIES_KEY, INITIAL_CATEGORIES);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (!error && data && data.length > 0) {
          const mapped: Category[] = data.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description || '',
            icon: c.icon || 'Package',
            color: c.color || '#2563EB',
            createdAt: c.created_at || new Date().toISOString(),
          }));
          this.setStoredData(CATEGORIES_KEY, mapped);
          return mapped;
        } else if (!error && data && data.length === 0) {
          // If categories table in Supabase is empty, auto-seed default categories into Supabase!
          try {
            await supabase.from('categories').upsert(
              localCats.map((c) => ({
                id: c.id,
                name: c.name,
                description: c.description || '',
                icon: c.icon || 'Package',
                color: c.color || '#2563EB',
                created_at: c.createdAt || new Date().toISOString(),
              }))
            );
          } catch (seedErr) {
            console.warn('Could not auto-seed categories in Supabase:', seedErr);
          }
          return localCats;
        }
      } catch (err) {
        console.warn('Falling back to local storage for categories:', err);
      }
    }
    return localCats;
  }

  static async saveCategory(category: Category): Promise<Category> {
    const current = await this.getCategories();
    const index = current.findIndex((c) => c.id === category.id);
    let updated: Category[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = category;
    } else {
      updated = [...current, category];
    }
    this.setStoredData(CATEGORIES_KEY, updated);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('categories').upsert({
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color,
          created_at: category.createdAt,
        });
      } catch (e) {
        console.warn('Cloud sync error on category save:', e);
      }
    }

    return category;
  }

  static async deleteCategory(id: string): Promise<boolean> {
    const current = await this.getCategories();
    const filtered = current.filter((c) => c.id !== id);
    this.setStoredData(CATEGORIES_KEY, filtered);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (e) {
        console.warn('Cloud sync error on category delete:', e);
      }
    }
    return true;
  }

  // --- PRODUCTS ---
  static async getProducts(): Promise<Product[]> {
    const localData = this.getStoredData<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          if (data.length > 0) {
            const mapped: Product[] = data.map((p: any) => ({
              id: p.id,
              name: p.name,
              categoryId: p.category_id || p.categoryId || 'cat-mercearia',
              barcode: p.barcode || '',
              quantity: Number(p.quantity) || 0,
              unit: (p.unit as UnitOfMeasure) || 'un',
              minStock: Number(p.min_stock ?? p.minStock ?? 5),
              costPrice: Number(p.cost_price ?? p.costPrice ?? 0),
              salePrice: Number(p.sale_price ?? p.salePrice ?? 0),
              expirationDate: p.expiration_date || p.expirationDate || '',
              location: p.location || 'Gôndola Central',
              supplier: p.supplier || '',
              createdAt: p.created_at || new Date().toISOString(),
              updatedAt: p.updated_at || new Date().toISOString(),
            }));
            this.setStoredData(PRODUCTS_KEY, mapped);
            return mapped;
          } else if (localData.length > 0) {
            // Local products exist but Supabase is clean: sync local products to Supabase
            for (const prod of localData) {
              await this.saveProduct(prod);
            }
            return localData;
          }
        }
      } catch (err) {
        console.warn('Falling back to local storage for products:', err);
      }
    }

    return localData;
  }

  static async saveProduct(product: Product): Promise<Product> {
    // 1. Immediately store product locally so UI never loses it
    const current = this.getStoredData<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const index = current.findIndex((p) => p.id === product.id);
    let updated: Product[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = { ...product, updatedAt: new Date().toISOString() };
    } else {
      updated = [{ ...product, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...current];
    }
    this.setStoredData(PRODUCTS_KEY, updated);

    // 2. If Supabase is connected, sync to database safely
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Ensure category exists in Supabase to satisfy foreign key constraint
        if (product.categoryId) {
          const { data: catCheck } = await supabase.from('categories').select('id').eq('id', product.categoryId).maybeSingle();
          if (!catCheck) {
            const allCats = await this.getCategories();
            const foundCat = allCats.find((c) => c.id === product.categoryId);
            if (foundCat) {
              await supabase.from('categories').upsert({
                id: foundCat.id,
                name: foundCat.name,
                description: foundCat.description || '',
                icon: foundCat.icon || 'Package',
                color: foundCat.color || '#2563EB',
                created_at: foundCat.createdAt || new Date().toISOString(),
              });
            }
          }
        }

        const payload: any = {
          id: product.id,
          name: product.name,
          category_id: product.categoryId || null,
          barcode: product.barcode || null,
          quantity: Number(product.quantity) || 0,
          unit: product.unit || 'un',
          min_stock: Number(product.minStock) || 0,
          cost_price: Number(product.costPrice) || 0,
          sale_price: Number(product.salePrice) || 0,
          expiration_date: product.expirationDate || null,
          location: product.location || 'Gôndola Central',
          supplier: product.supplier || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('products').upsert(payload);
        if (error) {
          console.warn('Supabase product upsert error, retrying without foreign key:', error);
          if (error.message?.includes('foreign key') || error.code === '23503') {
            payload.category_id = null;
            await supabase.from('products').upsert(payload);
          }
        }
      } catch (e) {
        console.warn('Cloud sync error on product save:', e);
      }
    }

    return product;
  }

  static async deleteProduct(id: string): Promise<boolean> {
    const current = this.getStoredData<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const filtered = current.filter((p) => p.id !== id);
    this.setStoredData(PRODUCTS_KEY, filtered);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.warn('Cloud sync error on product delete:', e);
      }
    }
    return true;
  }

  // Clear all products at once
  static async clearAllProducts(): Promise<void> {
    this.setStoredData(PRODUCTS_KEY, []);
    this.setStoredData(MOVEMENTS_KEY, []);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('products').delete().neq('id', '___none___');
        await supabase.from('stock_movements').delete().neq('id', '___none___');
      } catch (e) {
        console.warn('Cloud sync error on clear all products:', e);
      }
    }
  }

  // --- STOCK MOVEMENTS ---
  static async getMovements(): Promise<StockMovement[]> {
    const localMovs = this.getStoredData<StockMovement[]>(MOVEMENTS_KEY, INITIAL_MOVEMENTS);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('stock_movements').select('*').order('date', { ascending: false });
        if (!error && data) {
          const mapped: StockMovement[] = data.map((m: any) => ({
            id: m.id,
            productId: m.product_id || m.productId,
            productName: m.product_name || m.productName,
            type: m.type,
            quantity: Number(m.quantity),
            unit: (m.unit as UnitOfMeasure) || 'un',
            reason: m.reason || '',
            date: m.date || new Date().toISOString(),
            performedBy: m.performed_by || m.performedBy || 'Sistema',
          }));
          this.setStoredData(MOVEMENTS_KEY, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Falling back to local storage for movements:', err);
      }
    }
    return localMovs;
  }

  static async recordMovement(
    productId: string,
    type: MovementType,
    quantity: number,
    reason: string,
    performedBy: string
  ): Promise<{ product: Product; movement: StockMovement } | null> {
    const products = await this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return null;

    let newQuantity = product.quantity;
    if (type === 'in') {
      newQuantity += quantity;
    } else if (type === 'out' || type === 'loss' || type === 'venda') {
      newQuantity = Math.max(0, newQuantity - quantity);
    } else if (type === 'adjustment') {
      newQuantity = quantity;
    }

    const updatedProduct: Product = {
      ...product,
      quantity: Number(newQuantity.toFixed(2)),
      updatedAt: new Date().toISOString(),
    };

    await this.saveProduct(updatedProduct);

    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId,
      productName: product.name,
      type,
      quantity,
      unit: product.unit,
      reason,
      date: new Date().toISOString(),
      performedBy,
    };

    const currentMovements = await this.getMovements();
    const updatedMovements = [movement, ...currentMovements];
    this.setStoredData(MOVEMENTS_KEY, updatedMovements);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('stock_movements').insert({
          id: movement.id,
          product_id: movement.productId,
          product_name: movement.productName,
          type: movement.type,
          quantity: movement.quantity,
          unit: movement.unit,
          reason: movement.reason,
          date: movement.date,
          performed_by: movement.performedBy,
        });
      } catch (e) {
        console.warn('Cloud sync error on movement insert:', e);
      }
    }

    return { product: updatedProduct, movement };
  }

  // --- SALES / CAIXA PDV ---
  static async getSales(): Promise<SaleTransaction[]> {
    const localSales = this.getStoredData<SaleTransaction[]>(SALES_KEY, []);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false });
        if (!error && data) {
          const mapped: SaleTransaction[] = data.map((s: any) => ({
            id: s.id,
            code: s.code,
            items: typeof s.items === 'string' ? JSON.parse(s.items) : (s.items || []),
            totalAmount: Number(s.total_amount ?? s.totalAmount ?? 0),
            totalCost: Number(s.total_cost ?? s.totalCost ?? 0),
            grossProfit: Number(s.gross_profit ?? s.grossProfit ?? 0),
            paymentMethod: s.payment_method || s.paymentMethod || 'dinheiro',
            amountReceived: s.amount_received ? Number(s.amount_received) : undefined,
            changeAmount: s.change_amount ? Number(s.change_amount) : undefined,
            date: s.date || new Date().toISOString(),
            cashierName: s.cashier_name || s.cashierName || 'Caixa 01',
            notes: s.notes || undefined,
          }));
          this.setStoredData(SALES_KEY, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Falling back to local storage for sales:', err);
      }
    }
    return localSales;
  }

  static async recordSale(sale: SaleTransaction): Promise<SaleTransaction> {
    // 1. Process inventory deduction for each item in the sale
    const products = await this.getProducts();
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of sale.items) {
      const prod = productMap.get(item.productId);
      if (prod) {
        const newQty = Math.max(0, Number((prod.quantity - item.quantity).toFixed(2)));
        const updatedProd: Product = {
          ...prod,
          quantity: newQty,
          updatedAt: new Date().toISOString(),
        };
        await this.saveProduct(updatedProd);

        // Record stock movement for this sale item
        const mov: StockMovement = {
          id: `mov-sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: prod.id,
          productName: prod.name,
          type: 'out',
          quantity: item.quantity,
          unit: item.unit,
          reason: `Venda Caixa PDV #${sale.code} (${sale.paymentMethod.toUpperCase()})`,
          date: new Date().toISOString(),
          performedBy: sale.cashierName || 'Operador de Caixa',
        };

        const currentMovements = await this.getMovements();
        this.setStoredData(MOVEMENTS_KEY, [mov, ...currentMovements]);

        const supabase = getSupabaseClient();
        if (supabase) {
          try {
            await supabase.from('stock_movements').insert({
              id: mov.id,
              product_id: mov.productId,
              product_name: mov.productName,
              type: mov.type,
              quantity: mov.quantity,
              unit: mov.unit,
              reason: mov.reason,
              date: mov.date,
              performed_by: mov.performedBy,
            });
          } catch (e) {
            console.warn('Error recording sale stock movement in cloud:', e);
          }
        }
      }
    }

    // 2. Save the sale transaction locally
    const currentSales = this.getStoredData<SaleTransaction[]>(SALES_KEY, []);
    const updatedSales = [sale, ...currentSales];
    this.setStoredData(SALES_KEY, updatedSales);

    // 3. Save to Supabase if available
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('sales').insert({
          id: sale.id,
          code: sale.code,
          items: JSON.stringify(sale.items),
          total_amount: sale.totalAmount,
          total_cost: sale.totalCost,
          gross_profit: sale.grossProfit,
          payment_method: sale.paymentMethod,
          amount_received: sale.amountReceived || null,
          change_amount: sale.changeAmount || null,
          date: sale.date,
          cashier_name: sale.cashierName,
          notes: sale.notes || null,
        });
      } catch (e) {
        console.warn('Error persisting sale to cloud:', e);
      }
    }

    return sale;
  }

  static async clearAllSales(): Promise<void> {
    this.setStoredData(SALES_KEY, []);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('sales').delete().neq('id', '___none___');
      } catch (e) {
        console.warn('Error clearing sales in cloud:', e);
      }
    }
  }
}
