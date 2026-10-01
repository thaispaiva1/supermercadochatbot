import { Product, Category, SaleTransaction } from '../types/inventory.ts';

export const GEMINI_MODEL = 'gemini-3.8-flash';

export class AiAgentService {
  // Format the current supermarket state into a rich context for Gemini
  private static buildInventoryContext(
    products: Product[],
    categories: Category[],
    sales: SaleTransaction[] = []
  ): string {
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const now = new Date();

    const lowStockProducts = products.filter((p) => p.quantity <= p.minStock);
    const outOfStockProducts = products.filter((p) => p.quantity <= 0);

    const expiringProducts = products.filter((p) => {
      if (!p.expirationDate) return false;
      const exp = new Date(p.expirationDate);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    const totalStockValue = products.reduce((acc, p) => acc + p.quantity * p.costPrice, 0);
    const totalPotentialSales = products.reduce((acc, p) => acc + p.quantity * p.salePrice, 0);

    // Sales metrics
    const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalSalesCost = sales.reduce((acc, s) => acc + s.totalCost, 0);
    const totalGrossProfit = sales.reduce((acc, s) => acc + s.grossProfit, 0);
    const overallROI = totalSalesCost > 0 ? (totalGrossProfit / totalSalesCost) * 100 : 0;
    const averageTicket = sales.length > 0 ? totalRevenue / sales.length : 0;

    // Aggregate sold units per product
    const soldUnitsMap = new Map<string, number>();
    sales.forEach((s) => {
      s.items.forEach((it) => {
        soldUnitsMap.set(it.productId, (soldUnitsMap.get(it.productId) || 0) + it.quantity);
      });
    });

    const productLines = products.map((p) => {
      const catName = categoryMap.get(p.categoryId) || 'Geral';
      const sold = soldUnitsMap.get(p.id) || 0;
      const unitMargin = p.costPrice > 0 ? ((p.salePrice - p.costPrice) / p.costPrice) * 100 : 0;
      let expInfo = 'Sem validade cadastrada';
      if (p.expirationDate) {
        const exp = new Date(p.expirationDate);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        expInfo = `Vence em ${p.expirationDate} (${diffDays > 0 ? `em ${diffDays} dias` : diffDays === 0 ? 'VENCE HOJE' : `VENCIDO há ${Math.abs(diffDays)} dias`})`;
      }

      return `- [${p.id}] ${p.name} | Categoria: ${catName} | Qtd Atual: ${p.quantity} ${p.unit} (Min: ${p.minStock}) | Custo: R$ ${p.costPrice.toFixed(2)} | Venda: R$ ${p.salePrice.toFixed(2)} | Margem/ROI Unitário: +${unitMargin.toFixed(1)}% | Qtd Vendida no Caixa: ${sold} ${p.unit} | Local: ${p.location} | Validade: ${expInfo}`;
    });

    return `
=== DADOS REAIS DO SUPERMERCADO NESTE MOMENTO ===
- Momento da Consulta: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}
- Total de Produtos na Loja: ${products.length} itens
- Total de Vendas no Caixa: ${sales.length} vendas
- Faturamento Total (Receita Bruta): R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Custo das Mercadorias Vendidas (CMV): R$ ${totalSalesCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Lucro Bruto Total: R$ ${totalGrossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Retorno Geral sobre Investimento (ROI das Vendas): +${overallROI.toFixed(1)}%
- Ticket Médio por Compra: R$ ${averageTicket.toFixed(2)}
- Capital Total em Mercadorias (Custo): R$ ${totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Valor Esperado de Venda do Estoque: R$ ${totalPotentialSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Produtos Zerados na Gôndola: ${outOfStockProducts.length} (${outOfStockProducts.map((p) => p.name).join(', ') || 'Nenhum item zerado'})
- Produtos em Nível Crítico (no mínimo ou abaixo): ${lowStockProducts.length} (${lowStockProducts.map((p) => `${p.name} [${p.quantity} ${p.unit}]`).join(', ') || 'Nenhum'})
- Produtos Vencendo em 30 Dias: ${expiringProducts.length} (${expiringProducts.map((p) => `${p.name} [${p.expirationDate}]`).join(', ') || 'Nenhum'})

=== LISTAGEM DETALHADA DOS PRODUTOS DA LOJA ===
${productLines.join('\n')}
`;
  }

  // Answer user query using Google Gemini API or built-in humanized conversational engine
  static async queryInventory(
    userMessage: string,
    products: Product[],
    categories: Category[],
    sales: SaleTransaction[] = [],
    conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<string> {
    const inventoryContext = this.buildInventoryContext(products, categories, sales);

    const systemPrompt = `Você é o Gemini, parceiro experiente e consultor de confiança do supermercado SuperEstoque.
Você DEVE conversar EXATAMENTE como uma pessoa de verdade: caloroso, próximo, espontâneo, inteligente e empático, falando em português do Brasil coloquial e profissional.

COMO VOCÊ FALA (REGRA MÁXIMA: SOE COMO UMA PESSOA REAL, NUNCA UMA MÁQUINA):
1. Fale na primeira pessoa ("olha só", "eu andei dando uma olhada", "pra te falar a verdade", "a gente tá indo muito bem", "deixa eu te explicar", "pode deixar comigo").
2. NUNCA, SOB NENHUMA HIPÓTESE, use frases robóticas de computador ou de IA como:
   - "Sou uma inteligência artificial..."
   - "Como um modelo de linguagem..."
   - "De acordo com os parâmetros do sistema..."
   - "Relatório gerado com sucesso..."
   - "Processando sua solicitação..."
   - "Meus algoritmos indicam..."
3. Converse com naturalidade e carisma. Pode demonstrar entusiasmo, solidariedade e dar conselhos como alguém que está do seu lado no balcão da loja tomando um café.
4. RESPONDA A QUALQUER PERGUNTA QUE A PESSOA FIZER:
   - Se ela quiser apenas bater um papo informal, falar do dia dela, pedir conselho, tirar qualquer dúvida (de culinária, saúde, tecnologia, finanças, vida prática): converse com toda a simpatia do mundo, sem travas.
   - Se ela perguntar sobre o supermercado (vendas, caixa, estoque, compras, produtos com maior lucro, itens acabando, validade): consulte os dados reais abaixo e explique com clareza humana, trazendo números reais e dicas práticas de quem entende do ramo.
5. Use formatação limpa (negrito em números importantes, listas quando ajudar), mas sempre com tom de conversa fluida e agradável.

DADOS REAIS DA NOSSA LOJA PARA VOCÊ CONSULTAR MENTALMENTE:
${inventoryContext}
`;

    // 1. Tentar chamar a rota de backend /api/chat (Server-Side com @google/genai)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          systemInstruction: systemPrompt,
          history: conversationHistory,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply && data.reply.trim().length > 0) {
          return data.reply;
        }
      }
    } catch (err) {
      console.warn('Erro ao chamar /api/chat:', err);
    }

    // 2. Fallback inteligente humanizado local (se offline ou erro de rede)
    return this.runLocalFallback(userMessage, products, categories, sales);
  }

  // Built-in humanized conversational engine when offline
  private static runLocalFallback(
    userMessage: string,
    products: Product[],
    categories: Category[],
    sales: SaleTransaction[] = []
  ): string {
    const q = userMessage.toLowerCase().trim();
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const now = new Date();

    // 0. Saudações e Conversas Humanas e Naturais
    if (
      q === 'oi' ||
      q === 'olá' ||
      q === 'ola' ||
      q.startsWith('bom dia') ||
      q.startsWith('boa tarde') ||
      q.startsWith('boa noite') ||
      q.includes('tudo bem') ||
      q.includes('como vai') ||
      q.includes('beleza')
    ) {
      return `Oi! Tudo ótimo por aqui, e com você como estão as coisas? 😊\n\n` +
        `Pode falar comigo sobre qualquer coisa que precisar! A gente pode trocar uma ideia sobre o movimento da loja, ver o faturamento e o lucro no caixa, dar uma checada no que tá acabando no estoque ou conversar sobre qualquer outro assunto do seu dia a dia.\n\n` +
        `O que manda hoje?`;
    }

    // Quem é você
    if (q.includes('quem é você') || q.includes('quem e voce') || q.includes('o que você faz') || q.includes('o que voce faz')) {
      return `Eu sou o Gemini, seu parceiro aqui no supermercado! Trabalho lado a lado com você pra cuidar do estoque, acompanhar as vendas do caixa, analisar o lucro e o retorno das mercadorias, e também pra trocar ideias sobre estratégias e o dia a dia.\n\n` +
        `Você pode falar comigo com total naturalidade, como se estivéssemos tomando um café juntos. O que você gostaria de ver agora?`;
    }

    // 1. Sales & Cashier Queries
    if (
      q.includes('venda') ||
      q.includes('faturament') ||
      q.includes('caixa') ||
      q.includes('faturou') ||
      q.includes('vendido') ||
      q.includes('ticket')
    ) {
      const totalRev = sales.reduce((acc, s) => acc + s.totalAmount, 0);
      const totalCost = sales.reduce((acc, s) => acc + s.totalCost, 0);
      const totalProfit = sales.reduce((acc, s) => acc + s.grossProfit, 0);
      const avgTicket = sales.length > 0 ? totalRev / sales.length : 0;
      const roi = totalCost > 0 ? ((totalProfit / totalCost) * 100) : 0;

      let res = `Olha só, dei uma olhada no movimento do nosso caixa agora há pouco:\n\n`;
      res += `A gente já fechou **${sales.length} vendas**, totalizando **R$ ${totalRev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** de faturamento.\n\n`;
      res += `Desse valor, o nosso lucro bruto tá em **R$ ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**, o que dá um retorno (ROI geral) de **+${roi.toFixed(1)}%** sobre o que a gente pagou nas mercadorias vendidas.\n\n`;
      res += `O ticket médio tá saindo por volta de **R$ ${avgTicket.toFixed(2)}** por cliente.\n\n`;

      if (sales.length > 0) {
        const payMap: Record<string, number> = {};
        sales.forEach((s) => {
          payMap[s.paymentMethod] = (payMap[s.paymentMethod] || 0) + s.totalAmount;
        });
        res += `Sobre a forma que os clientes mais tão pagando:\n`;
        Object.entries(payMap).forEach(([method, val]) => {
          const pct = totalRev > 0 ? (val / totalRev) * 100 : 0;
          res += `• **${method.toUpperCase().replace('_', ' ')}**: R$ ${val.toFixed(2)} (${pct.toFixed(1)}% do total)\n`;
        });
      } else {
        res += `Assim que o pessoal do caixa for registrando as compras de hoje, esses números vão atualizando sozinhos aqui pra gente, tá?`;
      }
      return res;
    }

    // 2. ROI & Profitability Queries
    if (
      q.includes('roi') ||
      q.includes('retorno') ||
      q.includes('lucrativ') ||
      q.includes('margem') ||
      q.includes('lucro')
    ) {
      const itemsWithROI = products
        .map((p) => {
          const margin = p.costPrice > 0 ? ((p.salePrice - p.costPrice) / p.costPrice) * 100 : 0;
          const unitProfit = p.salePrice - p.costPrice;
          return { ...p, margin, unitProfit };
        })
        .sort((a, b) => b.margin - a.margin);

      let res = `Boa pergunta! Fiz as contas do retorno dos nossos produtos pra ver onde a gente tá ganhando mais dinheiro:\n\n`;
      res += `Os campeões de margem e retorno (ROI) na nossa loja hoje são:\n\n`;
      itemsWithROI.slice(0, 5).forEach((item, idx) => {
        res += `${idx + 1}. **${item.name}**: tá dando **+${item.margin.toFixed(1)}%** de retorno! A gente paga R$ ${item.costPrice.toFixed(2)} e vende por R$ ${item.salePrice.toFixed(2)} (um lucro limpo de R$ ${item.unitProfit.toFixed(2)} por unidade).\n`;
      });
      res += `\nVale super a pena dar um destaque a mais pra esses itens na gôndola ou na frente de loja!`;
      return res;
    }

    // 3. Stock Level & Critical Alerts
    if (
      q.includes('baixo') ||
      q.includes('critico') ||
      q.includes('zerad') ||
      q.includes('acabando') ||
      q.includes('esgotad') ||
      q.includes('repor') ||
      q.includes('reposi')
    ) {
      const lowStock = products.filter((p) => p.quantity <= p.minStock);
      const outOfStock = products.filter((p) => p.quantity <= 0);

      let response = `Fui dar uma conferida no estoque pra você não ser pego de surpresa:\n\n`;
      if (outOfStock.length > 0) {
        response += `⚠️ **Atenção: temos produtos que já zeraram:**\n`;
        outOfStock.forEach((p) => {
          response += `• **${p.name}** tá com estoque zerado! Fica no setor *${p.location}* (Fornecedor: ${p.supplier}).\n`;
        });
        response += `\n`;
      }

      if (lowStock.length > 0) {
        response += `📦 **Itens que tão quase no fim (abaixo do estoque de segurança):**\n`;
        lowStock.forEach((p) => {
          response += `• **${p.name}**: só restam **${p.quantity} ${p.unit}** (o ideal é ter pelo menos ${p.minStock} ${p.unit}).\n`;
        });
        response += `\nMinha dica: se puder, já aciona os fornecedores desses itens hoje mesmo pra gente não perder vendas.`;
      } else {
        response += `Pelo que olhei aqui, tá tudo bem abastecido! Nenhum item tá abaixo da margem de segurança no momento.`;
      }
      return response;
    }

    // 4. Expiration / Validade Queries
    if (
      q.includes('validade') ||
      q.includes('vence') ||
      q.includes('vencimento') ||
      q.includes('estragar') ||
      q.includes('perec')
    ) {
      const withDates = products
        .filter((p) => p.expirationDate)
        .map((p) => {
          const exp = new Date(p.expirationDate!);
          const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return { product: p, diffDays };
        })
        .sort((a, b) => a.diffDays - b.diffDays);

      const criticalExp = withDates.filter((item) => item.diffDays <= 30);

      let response = `Fiz um pente-fino nas datas de validade dos nossos lotes:\n\n`;
      if (criticalExp.length > 0) {
        response += `Dá uma olhada nesses itens que vencem nos próximos 30 dias:\n\n`;
        criticalExp.forEach(({ product, diffDays }) => {
          const status =
            diffDays <= 0
              ? '⛔ VENCIDO!'
              : diffDays <= 7
              ? `🔥 Vence em ${diffDays} dia(s)!`
              : `⚠️ Vence em ${diffDays} dias`;
          response += `• **${product.name}**: vence em **${product.expirationDate}** (${status}). A gente tem **${product.quantity} ${product.unit}** na prateleira.\n`;
        });
        response += `\n💡 Que tal a gente colocar uma etiqueta de promoção relâmpago ou colocar perto do caixa pra girar rápido antes de perder?`;
      } else {
        response += `Boa notícia: não encontrei nenhum lote com validade apertada pros próximos 30 dias!`;
      }
      return response;
    }

    // 5. Searching for specific items in stock
    const matchedProducts = products.filter((p) => {
      const name = p.name.toLowerCase();
      const cat = (categoryMap.get(p.categoryId) || '').toLowerCase();
      const words = q.split(/\s+/).filter((w) => w.length > 3 && !['onde', 'fica', 'quantos', 'quantas', 'temos', 'estoque', 'qual', 'preco', 'valor', 'sobre'].includes(w));

      if (name.includes(q)) return true;
      return words.some((w) => name.includes(w) || cat.includes(w));
    });

    if (matchedProducts.length > 0) {
      let response = `Achei aqui! Olha só as informações sobre o que você perguntou:\n\n`;
      matchedProducts.forEach((p) => {
        const catName = categoryMap.get(p.categoryId) || 'Geral';
        const roi = p.costPrice > 0 ? (((p.salePrice - p.costPrice) / p.costPrice) * 100).toFixed(1) : '0';
        response += `• **${p.name}** (${catName})\n`;
        response += `  - Quantidade atual: **${p.quantity} ${p.unit}** (mínimo que costumamos deixar: ${p.minStock})\n`;
        response += `  - Preço: Vendemos por **R$ ${p.salePrice.toFixed(2)}** (nosso custo é R$ ${p.costPrice.toFixed(2)}, margem de +${roi}%)\n`;
        response += `  - Onde fica: *${p.location}*\n`;
        if (p.expirationDate) {
          response += `  - Validade do lote: ${p.expirationDate}\n`;
        }
        response += `\n`;
      });
      return response;
    }

    // 6. Conversa humana para perguntas gerais
    return `Entendi perfeitamente o que você me perguntou! Como seu parceiro aqui, adoro trocar ideias sobre isso.\n\n` +
      `Seja pra pensar em como melhorar o atendimento, organizar os corredores, criar promoções pros clientes ou qualquer outro assunto que você queira conversar, tô 100% à sua disposição.\n\n` +
      `Como posso te ajudar a levar essa ideia adiante? Me conta mais! 😊`;
  }
}
