# 🤝 Contributing Guide - Expenses

This document establishes the guidelines and best practices for contributing to the Expenses project. Follow these rules to maintain code quality and consistency.

## 📋 Table of Contents

1. [Code Standards](#code-standards)
2. [File Structure](#file-structure)
3. [Naming Conventions](#naming-conventions)
4. [TypeScript Guidelines](#typescript-guidelines)
5. [Next.js 15 Patterns](#nextjs-15-patterns)
6. [Supabase Practices](#supabase-practices)
7. [Styling Guidelines](#styling-guidelines)
8. [Testing Standards](#testing-standards)
9. [Mandatory Unit Testing Policy](#mandatory-unit-testing-policy)
10. [Architecture Decision Records (ADR)](#architecture-decision-records-adr)
11. [Git Workflow](#git-workflow)
12. [AI Assistant Guidelines](#ai-assistant-guidelines)

## 🎯 Code Standards

### Language Requirements

**MANDATORY: All code, comments, and documentation must be written in English:**

- ✅ **REQUIRED**: Variable names in English
- ✅ **REQUIRED**: Function names in English
- ✅ **REQUIRED**: Comments in English
- ✅ **REQUIRED**: Documentation in English
- ✅ **REQUIRED**: Commit messages in English
- ✅ **REQUIRED**: ADR documents in English
- ✅ **REQUIRED**: API responses in English
- ✅ **REQUIRED**: Error messages in English
- ✅ **REQUIRED**: User interface text in English (unless specifically localized)

**Examples:**

```typescript
// ✅ CORRECT - English names and comments
const userBalance = 1000;
const calculateTotalExpenses = (transactions: Transaction[]) => {
  // Calculate the sum of all expense transactions
  return transactions
    .filter(transaction => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
};

// ❌ INCORRECT - Non-English names or comments
const saldoUsuario = 1000;
const calcularTotalDespesas = (transacoes: Transacao[]) => {
  // Calcula a soma de todas as transações de despesa
  return transacoes
    .filter(transacao => transacao.tipo === "despesa")
    .reduce((total, transacao) => total + transacao.valor, 0);
};
```

**Justification:**

- **Team Consistency**: Ensures all team members can understand the code
- **Maintainability**: Facilitates code maintenance and reviews
- **Documentation**: Improves code documentation and knowledge sharing
- **Industry Standard**: Follows global software development practices
- **Collaboration**: Enables collaboration with international developers

### String Formatting

```typescript
// ✅ CORRECT - Use double quotes
const message = "Hello, world!";
const queryKey = ["transactions"];
const tableName = "transactions";

// ❌ INCORRECT - Don't use single quotes
const message = "Hello, world!";
const queryKey = ["transactions"];
```

### Object Destructuring

```typescript
// ✅ CORRECT - Line breaks for complex destructuring
const {
  data: { session },
} = await supabase.auth.getSession();

const { transactions, categories, isLoading } = useFinancialStore();

// ❌ INCORRECT - Everything in one line when complex
const {
  data: { session },
} = await supabase.auth.getSession();
```

### Import Statements

```typescript
// ✅ CORRECT - Double quotes, alphabetical order
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ❌ INCORRECT - Single quotes, no ordering
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
```

### Console Logging

```typescript
// ✅ CORRECT - Always use label + value format
console.log("transactions", transactions);
console.log("userBalance", userBalance);
console.log("error", error);

// ❌ INCORRECT - No label or just value
console.log(transactions);
console.log("Something happened");
```

### Function Declarations

```typescript
// ✅ CORRECT - Arrow functions for components
const TransactionCard = ({ transaction }: TransactionCardProps) => {
  return <div>{transaction.description}</div>;
};

// ✅ CORRECT - Async/await formatting
const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.log("fetchTransactions error", error);
    throw error;
  }

  return data || [];
};
```

## 📁 File Structure

### Directory Organization

```
app/
├── (auth)/                 # Route groups for authentication
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── dashboard/             # Main pages
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
├── transactions/          # Transaction CRUD
│   ├── page.tsx
│   ├── [id]/
│   │   ├── page.tsx
│   │   └── edit/
│   │       └── page.tsx
│   └── new/
│       └── page.tsx
├── api/                   # API Routes
│   ├── auth/
│   └── transactions/
├── globals.css
├── layout.tsx
└── page.tsx

components/
├── ui/                    # Base reusable components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── index.ts          # Barrel export
├── forms/                 # Specific forms
│   ├── transaction-form.tsx
│   └── category-form.tsx
├── charts/                # Chart components
│   ├── expense-chart.tsx
│   └── income-chart.tsx
└── layout/                # Layout components
    ├── header.tsx
    ├── sidebar.tsx
    └── footer.tsx

lib/
├── supabase/
│   ├── client.ts          # Browser client
│   ├── server.ts          # Server client
│   └── types.ts           # Database types
├── utils.ts               # General utilities
├── validations.ts         # Zod schemas
└── constants.ts           # Application constants

hooks/
├── use-transactions.ts
├── use-categories.ts
└── use-auth.ts

store/
├── financial-store.ts
├── auth-store.ts
└── ui-store.ts

types/
├── database.ts            # Supabase types
├── api.ts                 # API types
└── index.ts               # Main exports
```

## 🏷️ Naming Conventions

### Files and Directories

```typescript
// ✅ CORRECT - kebab-case for files
transaction - form.tsx;
expense - chart.tsx;
financial - store.ts;
use - transactions.ts;

// ✅ CORRECT - PascalCase for components
TransactionForm.tsx;
ExpenseChart.tsx;

// ❌ INCORRECT - camelCase for files
transactionForm.tsx;
expenseChart.tsx;
```

### Variables and Functions

```typescript
// ✅ CORRECT - camelCase for variables and functions
const userBalance = 1000;
const calculateTotalExpenses = (transactions: Transaction[]) => {};
const isLoadingTransactions = false;

// ✅ CORRECT - PascalCase for components and types
interface TransactionFormProps {}
type DatabaseTransaction = {};
const TransactionCard = () => {};

// ✅ CORRECT - UPPER_CASE for constants
const MAX_TRANSACTIONS_PER_PAGE = 20;
const API_BASE_URL = "https://api.expenses.com";
```

### Database Naming

```sql
-- ✅ CORRECT - snake_case for database
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- ✅ CORRECT - Plural for tables
transactions
categories
budgets
```

## 📝 TypeScript Guidelines

### Interface vs Type

```typescript
// ✅ CORRETO - Interface para objetos extensíveis
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  userId: string;
}

interface TransactionFormProps extends Transaction {
  onSubmit: (data: Transaction) => void;
}

// ✅ CORRETO - Type para unions e computed types
type TransactionType = "income" | "expense";
type TransactionWithCategory = Transaction & {
  category: Category;
};
```

### Strict Type Checking

```typescript
// ✅ CORRETO - Sempre tipagem explícita
const fetchTransactions = async (): Promise<Transaction[]> => {
  // implementação
};

const TransactionCard = ({ transaction }: { transaction: Transaction }) => {
  // implementação
};

// ✅ CORRETO - Uso de enums para constantes
enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense",
}

// ✅ CORRETO - Validação com Zod
const TransactionSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().positive("Valor deve ser positivo"),
  type: z.enum(["income", "expense"]),
  date: z.date(),
});

type TransactionFormData = z.infer<typeof TransactionSchema>;
```

### Error Handling

```typescript
// ✅ CORRETO - Tratamento de erro tipado
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

const fetchTransactions = async (): Promise<ApiResponse<Transaction[]>> => {
  try {
    const { data, error } = await supabase.from("transactions").select("*");

    if (error) {
      console.log("fetchTransactions error", error);
      return { data: null, error: error.message, success: false };
    }

    return { data: data || [], error: null, success: true };
  } catch (error) {
    console.log("fetchTransactions catch", error);
    return {
      data: null,
      error: "Erro interno do servidor",
      success: false,
    };
  }
};
```

## ⚡ Next.js 15 Patterns

### App Router Structure

```typescript
// ✅ CORRETO - Server Components por padrão
// app/dashboard/page.tsx
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return <Dashboard initialTransactions={transactions} />;
}

// ✅ CORRETO - Client Components quando necessário
("use client");

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TransactionForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // implementação
}
```

### Metadata and SEO

```typescript
// ✅ CORRETO - Metadata estática
export const metadata = {
  title: "Dashboard - Expenses",
  description: "Controle suas finanças pessoais",
  keywords: ["finanças", "controle", "despesas", "receitas"],
};

// ✅ CORRETO - Metadata dinâmica
export async function generateMetadata({ params }: { params: { id: string } }) {
  const transaction = await fetchTransaction(params.id);

  return {
    title: `${transaction.description} - Expenses`,
    description: `Transação de ${transaction.amount}`,
  };
}
```

### Route Handlers

```typescript
// ✅ CORRETO - API Route structure
// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", session.user.id);

    if (error) {
      console.log("GET transactions error", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.log("GET transactions catch", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

## 🗄️ Supabase Practices

### Client Configuration

```typescript
// ✅ CORRETO - lib/supabase/client.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database";

export const supabase = createClientComponentClient<Database>();

// ✅ CORRETO - lib/supabase/server.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

export const createServerSupabase = () => {
  return createServerComponentClient<Database>({ cookies });
};
```

### Database Queries

```typescript
// ✅ CORRETO - Queries tipadas com RLS
const fetchUserTransactions = async (userId: string) => {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      *,
      categories (
        id,
        name,
        color,
        icon
      )
    `
    )
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    console.log("fetchUserTransactions error", error);
    throw new Error("Erro ao buscar transações");
  }

  return data;
};

// ✅ CORRETO - Mutations com validação
const createTransaction = async (transaction: Omit<Transaction, "id">) => {
  const validatedData = TransactionSchema.parse(transaction);

  const { data, error } = await supabase
    .from("transactions")
    .insert([validatedData])
    .select()
    .single();

  if (error) {
    console.log("createTransaction error", error);
    throw new Error("Erro ao criar transação");
  }

  return data;
};
```

### Real-time Subscriptions

```typescript
// ✅ CORRETO - Subscription patterns
const useRealtimeTransactions = (userId: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("realtime payload", payload);

          if (payload.eventType === "INSERT") {
            setTransactions((prev) => [payload.new as Transaction, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTransactions((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? (payload.new as Transaction) : t
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTransactions((prev) =>
              prev.filter((t) => t.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return transactions;
};
```

## 🎨 Styling Guidelines

### ⚠️ MANDATORY STYLING RULES

**ONLY TailwindCSS should be used for styling:**

- ✅ **ALLOWED**: Tailwind utility classes
- ✅ **ALLOWED**: Custom configuration in `tailwind.config.js`
- ✅ **ALLOWED**: Custom CSS only in `globals.css` for reset/base styles
- ✅ **ALLOWED**: CSS custom properties (CSS variables)
- ✅ **ALLOWED**: Modern CSS features (Grid, Flexbox, backdrop-filter)
- ❌ **FORBIDDEN**: CSS Modules (`.module.css`)
- ❌ **FORBIDDEN**: Styled Components
- ❌ **FORBIDDEN**: Emotion or other CSS-in-JS libraries
- ❌ **FORBIDDEN**: Separate CSS files for components
- ❌ **FORBIDDEN**: Inline styles with `style` prop (except specific cases with dynamic values)

### Justification

- **Consistency**: Maintains uniform visual standard
- **Maintainability**: Facilitates maintenance and modifications
- **Performance**: Avoids unused CSS and improves bundle size
- **DX**: Better development experience with autocomplete
- **Modern Aesthetics**: Professional financial dashboard appearance

### 🎨 Modern Financial Dashboard Design System

**MANDATORY: Use only these design tokens for consistency:**

#### Color System

```typescript
// Background Hierarchy (Dark Theme)
const backgrounds = {
  primary: "#0f1419",      // Main app background (deep dark blue)
  secondary: "#1a1f2e",    // Card backgrounds
  elevated: "#242b3d",     // Elevated elements (buttons, inputs)
  glass: "rgba(36, 43, 61, 0.8)", // Glass morphism backgrounds
}

// Text Hierarchy
const text = {
  primary: "#ffffff",      // Main text (headings, important content)
  secondary: "#b8bcc8",    // Secondary text (descriptions)
  muted: "#6b7280",        // Muted text (helpers, placeholders)
}

// Gradient System
const gradients = {
  primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Main purple gradient
  secondary: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", // Pink gradient
  success: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Blue gradient
  warning: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", // Green gradient
}

// Status Colors (matching dashboard pie chart)
const status = {
  active: "#8b5cf6",       // Purple - 45%
  complete: "#3b82f6",     // Blue - 35%
  pending: "#ef4444",      // Red - 20%
}

// Accent Colors
const accents = {
  primary: "#667eea",      // Primary purple
  secondary: "#764ba2",    // Secondary purple
  success: "#10b981",      // Success green
  error: "#ef4444",        // Error red
  warning: "#f59e0b",      // Warning orange
  info: "#3b82f6",         // Info blue
}
```

#### Design Principles

1. **Dark Theme First**: Always design for dark backgrounds
2. **Purple Brand Identity**: Use purple gradients for primary actions
3. **Glass Morphism**: Cards use backdrop blur and transparency
4. **Depth Through Elevation**: Darker = lower, lighter = elevated
5. **Smooth Micro-interactions**: 0.3s transitions with proper easing
6. **Accessible Contrast**: Maintain WCAG AA standards
7. **Responsive by Default**: Mobile-first approach

#### Component Patterns

```typescript
// ✅ CORRECT - Modern metric card
const MetricCard = ({ title, value, trend, icon }: MetricCardProps) => {
  return (
    <div className="card-modern p-6 hover:card-elevated transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-primary rounded-lg">
          {icon}
        </div>
        <span className={`text-sm font-medium ${
          trend > 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      </div>
      
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
      <p className="text-white text-2xl font-bold mt-1">{value}</p>
      
      <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-primary transition-all duration-500"
          style={{ width: `${Math.abs(trend)}%` }}
        />
      </div>
    </div>
  );
};

// ✅ CORRECT - Status badge component
const StatusBadge = ({ status, children }: StatusBadgeProps) => {
  const statusVariants = {
    active: "status-active",
    complete: "status-complete",
    pending: "status-pending",
  };

  return (
    <span className={`
      inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
      ${statusVariants[status]}
    `}>
      <div 
        className="w-2 h-2 rounded-full mr-2"
        style={{ backgroundColor: status === 'active' ? '#8b5cf6' : 
                                  status === 'complete' ? '#3b82f6' : '#ef4444' }}
      />
      {children}
    </span>
  );
};

// ✅ CORRECT - Modern button with gradient
const PrimaryButton = ({ children, loading, ...props }: ButtonProps) => {
  return (
    <button 
      className={`
        btn-primary focus-ring
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}
        transition-all duration-300
      `}
      disabled={loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
      )}
      {children}
    </button>
  );
};

// ✅ CORRECT - Chart container with modern styling
const ChartContainer = ({ title, children, actions }: ChartProps) => {
  return (
    <div className="card-modern p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <div className="flex items-center space-x-4 text-sm mt-1">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-400">Current Revenue</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-400">Last Month Expenses</span>
            </div>
          </div>
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      
      <div className="chart-container">
        {children}
      </div>
    </div>
  );
};
```

#### CSS Custom Classes Usage

```typescript
// ✅ REQUIRED - Use predefined CSS classes from globals.css
const DashboardLayout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* Header with glass morphism */}
      <header className="glass-morphism sticky top-0 z-50 px-6 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">UI Art</h1>
            <span className="text-sm text-gray-400">Financial Dashboard</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="input-modern w-64">
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="w-full bg-transparent outline-none"
              />
            </div>
            <button className="btn-primary">
              Nova Transação
            </button>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
};

// ✅ REQUIRED - Animation classes for smooth interactions
const TransactionList = ({ transactions }: TransactionListProps) => {
  return (
    <div className="space-y-4">
      {transactions.map((transaction, index) => (
        <div 
          key={transaction.id}
          className="card-modern p-4 animate-fade-in-up hover:card-elevated"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${transaction.type === 'income' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'}
              `}>
                {transaction.type === 'income' ? '↗' : '↙'}
              </div>
              
              <div>
                <p className="text-white font-medium">{transaction.description}</p>
                <p className="text-gray-400 text-sm">{formatDate(transaction.date)}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className={`text-lg font-semibold ${
                transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
              }`}>
                {transaction.type === 'expense' ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </p>
              <StatusBadge status={transaction.status} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### Responsive Design Patterns

```typescript
// ✅ REQUIRED - Mobile-first responsive design
const DashboardGrid = ({ children }: GridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {children}
    </div>
  );
};

// ✅ REQUIRED - Responsive chart layout
const ChartsSection = ({ earnings, status }: ChartsSectionProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Earnings Chart - spans 2 columns on large screens */}
      <div className="lg:col-span-2 card-modern p-6">
        <EarningsChart data={earnings} />
      </div>
      
      {/* Status Chart - spans 1 column */}
      <div className="card-modern p-6">
        <StatusChart data={status} />
      </div>
    </div>
  );
};
```

#### Accessibility Requirements

```typescript
// ✅ REQUIRED - Proper focus management
const AccessibleButton = ({ children, ...props }: ButtonProps) => {
  return (
    <button 
      className="btn-primary focus-ring"
      {...props}
    >
      {children}
    </button>
  );
};

// ✅ REQUIRED - Screen reader support
const MetricCard = ({ title, value, trend }: MetricCardProps) => {
  return (
    <div 
      className="card-modern p-6" 
      role="region" 
      aria-label={`${title} metric`}
    >
      <h3 className="sr-only">{title}</h3>
      <div aria-live="polite">
        <span className="text-2xl font-bold text-white">
          {value}
        </span>
        <span className={`ml-2 text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend > 0 ? 'increased' : 'decreased'} by {Math.abs(trend)}%
        </span>
      </div>
    </div>
  );
};

// ✅ REQUIRED - Color contrast compliance
const HighContrastText = ({ children, variant = 'primary' }: TextProps) => {
  const variants = {
    primary: 'text-white',       // Contrast ratio > 4.5:1
    secondary: 'text-gray-300',  // Contrast ratio > 3:1
    muted: 'text-gray-400',      // Contrast ratio > 3:1
  };
  
  return (
    <span className={variants[variant]}>
      {children}
    </span>
  );
};
```

### Color Rules

- **Always use dark backgrounds** (`#0f1419`, `#1a1f2e`, `#242b3d`)
- **Always use purple gradients** (`#667eea` to `#764ba2`) for primary actions
- **Always maintain text contrast** (white/gray on dark backgrounds)
- **Never use bright colors** except for status indicators and gradients
- **Use elevation through background lightness** (darker = lower, lighter = higher)
- **Status colors must match pie chart** (purple 45%, blue 35%, red 20%)

### Animation Guidelines

- **Use smooth transitions** (0.3s duration with ease-out timing)
- **Respect reduced motion preferences** (check `prefers-reduced-motion`)
- **Micro-interactions only** (hover states, focus rings, loading states)
- **Stagger animations** for lists (0.1s delay between items)
- **Use transform over position changes** for better performance
