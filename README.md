# 💰 Expenses - Financial Control System

A modern and efficient system for personal income and expense control, developed with Next.js 15, TypeScript, and Supabase.

## 🚀 Features

- **📊 Financial Dashboard**: Financial overview with charts and metrics
- **💸 Expense Management**: Registration and categorization of expenses
- **💰 Income Control**: Registration of financial income
- **📈 Detailed Reports**: Analysis and insights of financial data
- **🏷️ Categorization**: Organization by customizable categories
- **📱 Responsive Design**: Interface optimized for all devices
- **🔐 Secure Authentication**: Login system with Supabase Auth
- **⚡ Performance**: SSR with Next.js for fast loading

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework with SSR/SSG
- **TypeScript** - Static typing
- **Tailwind CSS v4** - Utility styling (ONLY CSS library allowed)
- **React 19** - UI library
- **Zustand** - Global state management

### Backend

- **Supabase** - Backend-as-a-Service
  - PostgreSQL Database
  - Real-time subscriptions
  - Authentication
  - Row Level Security (RLS)
  - Edge Functions

### Tools

- **ESLint** - Code linting
- **Turbopack** - Ultra-fast build tool
- **PostCSS** - CSS processing

## 🎨 Styling Policy

This project follows a **strict styling policy**:

### ✅ Allowed

- **TailwindCSS** - Only CSS library allowed
- Tailwind utility classes
- Custom configurations in `tailwind.config.js`
- Global CSS only in `globals.css` (reset/base styles)

### ❌ Forbidden

- CSS Modules
- Styled Components
- Emotion or other CSS-in-JS
- Separate CSS files per component
- UI libraries that conflict with Tailwind

### Correct Usage Example

```tsx
// ✅ CORRECT - Using only TailwindCSS
const Button = ({ variant, children }) => {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-colors",
        variant === "primary"
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-gray-200 text-gray-900 hover:bg-gray-300"
      )}
    >
      {children}
    </button>
  );
};

// ❌ INCORRECT - CSS-in-JS not allowed
const StyledButton = styled.button`
  padding: 1rem 2rem;
  background: blue;
`;
```

For more details, check [CONTRIBUTING.md](CONTRIBUTING.md).

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

## 🚀 Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/expenses.git
cd expenses
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Configure environment variables**

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anonymous_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Run the project**

```bash
npm run dev
# or
yarn dev
```

Access [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

```sql
-- Usuários (gerenciado pelo Supabase Auth)
-- Profiles para dados extras do usuário

-- Categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  color VARCHAR,
  icon VARCHAR,
  type VARCHAR CHECK (type IN ('income', 'expense')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transações
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description VARCHAR NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES categories(id),
  date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orçamentos
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  period VARCHAR CHECK (period IN ('monthly', 'weekly', 'yearly')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📁 Estrutura do Projeto

```
expenses/
├── app/                    # App Router (Next.js 15)
│   ├── (auth)/            # Rotas de autenticação
│   ├── dashboard/         # Páginas do dashboard
│   ├── transactions/      # Gestão de transações
│   ├── categories/        # Gestão de categorias
│   ├── reports/           # Relatórios e gráficos
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout raiz
│   └── page.tsx           # Página inicial
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes de interface
│   ├── forms/            # Formulários
│   ├── charts/           # Gráficos e visualizações
│   └── layout/           # Componentes de layout
├── lib/                   # Utilitários e configurações
│   ├── supabase.ts       # Cliente Supabase
│   ├── utils.ts          # Funções utilitárias
│   └── validations.ts    # Schemas de validação
├── hooks/                 # Custom hooks
├── store/                 # Gerenciamento de estado
├── types/                 # Definições TypeScript
└── public/               # Arquivos estáticos
```

## 🎨 Estratégia de Gerenciamento de Estado

### Zustand para Estado Global

```typescript
// store/financial-store.ts
interface FinancialState {
  transactions: Transaction[];
  categories: Category[];
  currentBalance: number;
  monthlyBudget: number;

  // Actions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  fetchTransactions: () => Promise<void>;

  // Computed values
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getCategoryExpenses: (categoryId: string) => number;
}
```

### Server State com React Query (Opcional)

Para sincronização avançada com Supabase:

```typescript
// hooks/use-transactions.ts
export const useTransactions = () => {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
```

## 🔐 Autenticação e Segurança

### Row Level Security (RLS)

```sql
-- Política para transações
CREATE POLICY "Users can only see their own transactions"
ON transactions FOR ALL USING (auth.uid() = user_id);

-- Política para categorias
CREATE POLICY "Users can only see their own categories"
ON categories FOR ALL USING (auth.uid() = user_id);
```

### Middleware de Autenticação

```typescript
// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return res;
}
```

## 📊 Funcionalidades de SSR/SSG

### Server-Side Rendering para Dashboard

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .limit(10);

  return <Dashboard initialTransactions={transactions} />;
}
```

### Static Generation para Páginas Públicas

```typescript
// app/page.tsx
export const metadata = {
  title: "Expenses - Controle Financeiro",
  description: "Sistema moderno para controle de receitas e despesas",
};
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e
```

## 📦 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Variáveis de Ambiente (Produção)

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-privada
```

## 🚀 Roadmap

### v1.0 (Atual)

- ✅ Autenticação com Supabase
- ✅ CRUD de transações
- ✅ Categorização
- ✅ Dashboard básico

### v1.1 (Próxima)

- 🔄 Relatórios avançados
- 🔄 Gráficos interativos
- 🔄 Exportação de dados
- 🔄 Notificações

### v1.2 (Futuro)

- 📋 Metas financeiras
- 📋 Sincronização bancária
- 📋 App mobile
- 📋 Compartilhamento de orçamentos

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- 📧 Email: suporte@expenses.com
- 💬 Discord: [Servidor da Comunidade](https://discord.gg/expenses)
- 📚 Documentação: [Wiki do Projeto](https://github.com/seu-usuario/expenses/wiki)

---

Desenvolvido com ❤️ usando Next.js e Supabase
