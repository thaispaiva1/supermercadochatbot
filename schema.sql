-- ==============================================================================
-- SCRIPT COMPLETO COM POLÍTICAS DE ARMAZENAMENTO (STORAGE) ATIVADAS
-- Projeto: SuperEstoque (Supermercado)
-- Banco: Supabase PostgreSQL
-- ==============================================================================

-- 1. TABELA DE DEPARTAMENTOS / CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Package',
    color TEXT DEFAULT '#2563EB',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- INSERIR CATEGORIAS PADRÃO DE SUPERMERCADO
INSERT INTO public.categories (id, name, description, icon, color) VALUES
('cat-mercearia', 'Mercearia & Grãos', 'Arroz, feijão, massas, farinhas, óleos e condimentos', 'Package', '#D97706'),
('cat-bebidas', 'Bebidas & Sucos', 'Refrigerantes, sucos, cervejas, águas e destilados', 'Wine', '#2563EB'),
('cat-laticinios', 'Laticínios & Frios', 'Leites, queijos, iogurtes, manteigas e embutidos', 'Egg', '#EAB308'),
('cat-hortifruti', 'Hortifrúti', 'Frutas frescas, verduras selecionadas e legumes', 'Apple', '#16A34A'),
('cat-carnes', 'Açougue & Carnes', 'Carnes bovinas, suínas, aves e cortes especiais', 'Beef', '#DC2626'),
('cat-padaria', 'Padaria & Confeitaria', 'Pães artesanais, bolos, tortas, biscoitos e torradas', 'Croissant', '#EA580C'),
('cat-limpeza', 'Limpeza & Lavanderia', 'Detergentes, sabão em pó, desinfetantes e alvejantes', 'Sparkles', '#0891B2'),
('cat-higiene', 'Higiene & Cuidados', 'Sabonetes, cremes dentais, shampoos e desodorantes', 'HeartPulse', '#9333EA')
ON CONFLICT (id) DO NOTHING;

-- 2. TABELA DE PRODUTOS / ITENS DO ESTOQUE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    barcode TEXT,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'un',
    min_stock NUMERIC(12, 2) NOT NULL DEFAULT 5,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    expiration_date DATE,
    location TEXT,
    supplier TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABELA DE HISTÓRICO DE MOVIMENTAÇÕES DE ESTOQUE
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'loss', 'adjustment', 'venda')),
    quantity NUMERIC(12, 2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'un',
    reason TEXT,
    date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    performed_by TEXT NOT NULL DEFAULT 'Operador de Estoque'
);

-- 4. TABELA DE VENDAS DO CAIXA (PDV)
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    gross_profit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL,
    amount_received NUMERIC(12, 2),
    change_amount NUMERIC(12, 2),
    date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    cashier_name TEXT NOT NULL DEFAULT 'Operador de Caixa',
    notes TEXT
);

-- ==============================================================================
-- ÍNDICES DE BUSCA E PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_expiration ON public.products(expiration_date);
CREATE INDEX IF NOT EXISTS idx_movements_date ON public.stock_movements(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_code ON public.sales(code);

-- ==============================================================================
-- HABILITAR RLS NAS TABELAS DO ESQUEMA PUBLIC
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLÍTICAS RLS (CRUD) PARA TABELAS
-- ==============================================================================
-- Categorias
DROP POLICY IF EXISTS "Permitir leitura de categorias" ON public.categories;
CREATE POLICY "Permitir leitura de categorias" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de categorias" ON public.categories;
CREATE POLICY "Permitir inserção de categorias" ON public.categories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de categorias" ON public.categories;
CREATE POLICY "Permitir atualização de categorias" ON public.categories FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão de categorias" ON public.categories;
CREATE POLICY "Permitir exclusão de categorias" ON public.categories FOR DELETE USING (true);

-- Produtos
DROP POLICY IF EXISTS "Permitir leitura de produtos" ON public.products;
CREATE POLICY "Permitir leitura de produtos" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de produtos" ON public.products;
CREATE POLICY "Permitir inserção de produtos" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de produtos" ON public.products;
CREATE POLICY "Permitir atualização de produtos" ON public.products FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão de produtos" ON public.products;
CREATE POLICY "Permitir exclusão de produtos" ON public.products FOR DELETE USING (true);

-- Movimentações de Estoque
DROP POLICY IF EXISTS "Permitir leitura de movimentações" ON public.stock_movements;
CREATE POLICY "Permitir leitura de movimentações" ON public.stock_movements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de movimentações" ON public.stock_movements;
CREATE POLICY "Permitir inserção de movimentações" ON public.stock_movements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão de movimentações" ON public.stock_movements;
CREATE POLICY "Permitir exclusão de movimentações" ON public.stock_movements FOR DELETE USING (true);

-- Vendas do Caixa
DROP POLICY IF EXISTS "Permitir leitura de vendas" ON public.sales;
CREATE POLICY "Permitir leitura de vendas" ON public.sales FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de vendas" ON public.sales;
CREATE POLICY "Permitir inserção de vendas" ON public.sales FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão de vendas" ON public.sales;
CREATE POLICY "Permitir exclusão de vendas" ON public.sales FOR DELETE USING (true);

-- ==============================================================================
-- POLÍTICAS DE ARMAZENAMENTO (SUPABASE STORAGE) ATIVADAS
-- ==============================================================================

-- 1. Criação e configuração do bucket público 'product-images'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- Limite de 5MB por arquivo
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Política: Visualização pública de buckets
DROP POLICY IF EXISTS "Visualização pública de buckets" ON storage.buckets;
CREATE POLICY "Visualização pública de buckets"
ON storage.buckets FOR SELECT
USING (public = true);

-- 3. Política: Visualização pública de imagens dos produtos (SELECT)
DROP POLICY IF EXISTS "Visualização pública de imagens dos produtos" ON storage.objects;
CREATE POLICY "Visualização pública de imagens dos produtos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 4. Política: Upload de imagens dos produtos (INSERT)
DROP POLICY IF EXISTS "Upload de imagens dos produtos" ON storage.objects;
CREATE POLICY "Upload de imagens dos produtos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- 5. Política: Atualização e substituição de imagens dos produtos (UPDATE)
DROP POLICY IF EXISTS "Atualização de imagens dos produtos" ON storage.objects;
CREATE POLICY "Atualização de imagens dos produtos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 6. Política: Exclusão de imagens dos produtos (DELETE)
DROP POLICY IF EXISTS "Exclusão de imagens dos produtos" ON storage.objects;
CREATE POLICY "Exclusão de imagens dos produtos"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');

-- ==============================================================================
-- RECURSO TEMPO REAL (SUPABASE REALTIME)
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'stock_movements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'sales'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
  END IF;
END $$;
