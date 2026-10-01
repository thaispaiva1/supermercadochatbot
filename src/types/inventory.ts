export type UnitOfMeasure = 'un' | 'kg' | 'g' | 'L' | 'ml' | 'cx' | 'pct';

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  barcode: string;
  quantity: number;
  unit: UnitOfMeasure;
  minStock: number;
  costPrice: number;
  salePrice: number;
  expirationDate?: string;
  location: string;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'in' | 'out' | 'adjustment' | 'loss' | 'venda';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  unit: UnitOfMeasure;
  reason: string;
  date: string;
  performedBy: string;
}

export type PaymentMethod =
  | 'dinheiro'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'pix'
  | 'vale_alimentacao'
  | 'vale_refeicao';

export interface SaleItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unit: UnitOfMeasure;
  unitCost: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleTransaction {
  id: string;
  code: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  grossProfit: number;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
  changeAmount?: number;
  date: string;
  cashierName: string;
  notes?: string;
}

export type UserRole = 'gerente' | 'supervisor' | 'operador';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeName: string;
  avatarUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  highlightedProducts?: string[];
}

export interface AiAgentConfig {
  apiKey: string;
  provider: 'groq' | 'grok';
  model: string;
}
