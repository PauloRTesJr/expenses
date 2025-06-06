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
- ❌ **FORBIDDEN**: CSS Modules (`.module.css`)
- ❌ **FORBIDDEN**: Styled Components
- ❌ **FORBIDDEN**: Emotion or other CSS-in-JS libraries
- ❌ **FORBIDDEN**: Separate CSS files for components
- ❌ **FORBIDDEN**: Inline styles with `style` prop (except specific cases with dynamic values)

### Justification

- **Consistency**: Maintains uniform visual standard
- **Maintainability**: Facilitates maintenance and modifications
- **Performance**: Avoids unused CSS
- **DX**: Better development experience with autocomplete
- **Bundle Size**: Reduces final application size

### 🎨 Color Palette (Spotify-Inspired Theme)

**MANDATORY: Use only these colors for consistency:**

```typescript
// Primary Colors
const colors = {
  // Background Colors
  background: {
    primary: "bg-[#121212]", // Main background (dark)
    secondary: "bg-[#1e1e1e]", // Card/section background
    elevated: "bg-[#2a2a2a]", // Elevated elements
  },

  // Text Colors
  text: {
    primary: "text-white", // Main text
    secondary: "text-gray-300", // Secondary text
    muted: "text-gray-400", // Muted text
  },

  // Accent Colors
  accent: {
    primary: "bg-[#1DB954]", // Spotify green (primary actions)
    hover: "bg-[#1ed760]", // Hover state
    focus: "ring-[#1DB954]", // Focus rings
  },

  // Status Colors
  status: {
    success: "bg-green-500", // Success states
    error: "bg-red-500", // Error states
    warning: "bg-yellow-500", // Warning states
    info: "bg-blue-500", // Info states
  },

  // Border Colors
  border: {
    default: "border-gray-700", // Default borders
    hover: "border-gray-600", // Hover borders
    focus: "border-[#1DB954]", // Focus borders
  },
};
```

**Usage Examples:**

```typescript
// ✅ CORRECT - Background hierarchy
<div className="bg-[#121212] min-h-screen">           {/* Main background */}
  <div className="bg-[#1e1e1e] rounded-lg p-6">      {/* Card background */}
    <button className="bg-[#2a2a2a] hover:bg-[#333]"> {/* Elevated button */}
      Click me
    </button>
  </div>
</div>

// ✅ CORRECT - Text hierarchy
<h1 className="text-white text-2xl font-bold">Main Title</h1>
<p className="text-gray-300">Secondary text content</p>
<span className="text-gray-400 text-sm">Muted helper text</span>

// ✅ CORRECT - Accent usage
<button className="bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold px-4 py-2 rounded-lg transition-colors">
  Primary Action
</button>
```

**Color Rules:**

- **Always use dark backgrounds** (`#121212`, `#1e1e1e`, `#2a2a2a`)
- **Always use Spotify green** (`#1DB954`) for primary actions
- **Always maintain text contrast** (white/gray on dark backgrounds)
- **Never use bright colors** except for the green accent
- **Use elevation through background lightness** (darker = lower, lighter = higher)

### Tailwind CSS v4 Patterns

```typescript
// ✅ CORRETO - Utility classes organizadas por categoria
const TransactionCard = ({ transaction }: TransactionCardProps) => {
  return (
    <div
      className="
      flex items-center justify-between
      p-4 
      bg-white dark:bg-gray-800 
      border border-gray-200 dark:border-gray-700 
      rounded-lg shadow-sm
      hover:shadow-md hover:border-blue-300
      transition-all duration-200
    "
    >
      <div className="flex items-center space-x-3">
        <div
          className={`
          w-10 h-10 
          rounded-full 
          flex items-center justify-center
          ${
            transaction.type === "income"
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }
        `}
        >
          {/* Icon */}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {transaction.description}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(transaction.date)}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <span
          className={`
          text-lg font-semibold
          ${transaction.type === "income" ? "text-green-600" : "text-red-600"}
        `}
        >
          {formatCurrency(transaction.amount)}
        </span>
      </div>
    </div>
  );
};
```

### Component Composition

```typescript
// ✅ CORRETO - Composição de componentes
const Button = ({
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

## 🧪 Testing Standards

### Unit Tests

```typescript
// ✅ CORRETO - Test structure
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TransactionForm } from "@/components/forms/transaction-form";

describe("TransactionForm", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("should render form fields correctly", () => {
    render(<TransactionForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
  });

  it("should validate required fields", async () => {
    render(<TransactionForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole("button", { name: "Salvar" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Descrição é obrigatória")).toBeInTheDocument();
    });
  });

  it("should submit form with valid data", async () => {
    render(<TransactionForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Compra no supermercado" },
    });

    fireEvent.change(screen.getByLabelText("Valor"), {
      target: { value: "150.50" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        description: "Compra no supermercado",
        amount: 150.5,
        type: "expense",
      });
    });
  });
});
```

### Integration Tests

```typescript
// ✅ CORRETO - API route testing
import { GET } from "@/app/api/transactions/route";
import { createMocks } from "node-mocks-http";

describe("/api/transactions", () => {
  it("should return transactions for authenticated user", async () => {
    const { req } = createMocks({
      method: "GET",
      headers: {
        authorization: "Bearer valid-token",
      },
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toBeInstanceOf(Array);
  });

  it("should return 401 for unauthenticated user", async () => {
    const { req } = createMocks({
      method: "GET",
    });

    const response = await GET(req);

    expect(response.status).toBe(401);
  });
});
```

## ⚠️ Mandatory Unit Testing Policy

### 🚨 CRITICAL REQUIREMENT: Unit Tests for All Code Changes

**EVERY code change or addition MUST include comprehensive unit tests that cover ALL conditions and edge cases:**

#### When Unit Tests Are Required

- ✅ **MANDATORY**: New functions or methods
- ✅ **MANDATORY**: New React components
- ✅ **MANDATORY**: New utility functions
- ✅ **MANDATORY**: New validation schemas
- ✅ **MANDATORY**: New API routes
- ✅ **MANDATORY**: New hooks
- ✅ **MANDATORY**: New stores/state management
- ✅ **MANDATORY**: Bug fixes (test for the bug + fix)
- ✅ **MANDATORY**: Modified existing functions
- ✅ **MANDATORY**: Refactored code

#### Test Coverage Requirements

**100% condition coverage is MANDATORY:**

```typescript
// ✅ REQUIRED - Test ALL conditions
describe('calculateTransactionTotal', () => {
  it('calculates positive total for income transactions', () => {
    const transactions = [
      { amount: 100, type: 'income' as const },
      { amount: 200, type: 'income' as const }
    ]
    expect(calculateTransactionTotal(transactions)).toBe(300)
  })

  it('calculates negative total for expense transactions', () => {
    const transactions = [
      { amount: 50, type: 'expense' as const },
      { amount: 75, type: 'expense' as const }
    ]
    expect(calculateTransactionTotal(transactions)).toBe(-125)
  })

  it('calculates mixed total for income and expense transactions', () => {
    const transactions = [
      { amount: 100, type: 'income' as const },
      { amount: 50, type: 'expense' as const }
    ]
    expect(calculateTransactionTotal(transactions)).toBe(50)
  })

  it('returns 0 for empty array', () => {
    expect(calculateTransactionTotal([])).toBe(0)
  })

  it('handles zero amounts correctly', () => {
    const transactions = [
      { amount: 0, type: 'income' as const },
      { amount: 0, type: 'expense' as const }
    ]
    expect(calculateTransactionTotal(transactions)).toBe(0)
  })

  it('handles large numbers correctly', () => {
    const transactions = [
      { amount: 999999.99, type: 'income' as const }
    ]
    expect(calculateTransactionTotal(transactions)).toBe(999999.99)
  })
})
```

#### Component Testing Requirements

**ALL React components MUST have tests for:**

```typescript
// ✅ REQUIRED - Component test coverage
describe('TransactionCard', () => {
  // Required: Rendering tests
  it('renders with all required props', () => {
    const transaction = {
      id: '1',
      description: 'Test transaction',
      amount: 100,
      type: 'income' as const,
      date: new Date(),
      categoryId: 'cat-1'
    }
    render(<TransactionCard transaction={transaction} />)
    
    expect(screen.getByText('Test transaction')).toBeInTheDocument()
    expect(screen.getByText('R$ 100,00')).toBeInTheDocument()
  })

  // Required: All variant tests
  it('displays income transactions with green styling', () => {
    const transaction = { /* income transaction */ }
    render(<TransactionCard transaction={transaction} />)
    
    expect(screen.getByTestId('amount')).toHaveClass('text-green-600')
  })

  it('displays expense transactions with red styling', () => {
    const transaction = { /* expense transaction */ }
    render(<TransactionCard transaction={transaction} />)
    
    expect(screen.getByTestId('amount')).toHaveClass('text-red-600')
  })

  // Required: Interaction tests
  it('calls onEdit when edit button is clicked', async () => {
    const mockOnEdit = jest.fn()
    const transaction = { /* transaction data */ }
    
    render(<TransactionCard transaction={transaction} onEdit={mockOnEdit} />)
    
    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(mockOnEdit).toHaveBeenCalledWith(transaction.id)
  })

  // Required: Edge case tests
  it('handles very long descriptions with truncation', () => {
    const transaction = {
      ...baseTransaction,
      description: 'A'.repeat(100)
    }
    render(<TransactionCard transaction={transaction} />)
    
    expect(screen.getByText(/A+\.\.\./)).toBeInTheDocument()
  })

  // Required: Error state tests
  it('displays error state when transaction data is invalid', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    
    render(<TransactionCard transaction={null} />)
    
    expect(screen.getByText(/error loading transaction/i)).toBeInTheDocument()
    consoleError.mockRestore()
  })
})
```

#### API Route Testing Requirements

**ALL API routes MUST have tests for:**

```typescript
// ✅ REQUIRED - API route test coverage
describe('/api/transactions', () => {
  // Required: Success scenarios
  it('returns transactions for authenticated user', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' }
    mockAuth.mockResolvedValue({ user: mockUser })
    
    const response = await GET(createMockRequest())
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.transactions).toBeDefined()
  })

  // Required: Authentication tests
  it('returns 401 for unauthenticated requests', async () => {
    mockAuth.mockResolvedValue({ user: null })
    
    const response = await GET(createMockRequest())
    
    expect(response.status).toBe(401)
  })

  // Required: Validation tests
  it('returns 400 for invalid request data', async () => {
    const invalidData = { amount: -100 } // Invalid negative amount
    
    const response = await POST(createMockRequest({ body: invalidData }))
    
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining('validation')
    })
  })

  // Required: Database error tests
  it('returns 500 when database operation fails', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockRejectedValue(new Error('Database error'))
    }))
    
    const response = await GET(createMockRequest())
    
    expect(response.status).toBe(500)
  })

  // Required: Rate limiting tests
  it('returns 429 when rate limit is exceeded', async () => {
    // Mock rate limiter to return exceeded
    mockRateLimit.mockResolvedValue({ success: false })
    
    const response = await GET(createMockRequest())
    
    expect(response.status).toBe(429)
  })
})
```

#### Utility Function Testing Requirements

**ALL utility functions MUST test:**

```typescript
// ✅ REQUIRED - Utility function comprehensive testing
describe('formatCurrency', () => {
  // Required: Standard cases
  it('formats positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toMatch(/R\$\s*1\.234,56/)
  })

  it('formats negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toMatch(/-R\$\s*1\.234,56/)
  })

  // Required: Edge cases
  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toMatch(/R\$\s*0,00/)
  })

  it('formats very large numbers', () => {
    expect(formatCurrency(999999999.99)).toMatch(/R\$\s*999\.999\.999,99/)
  })

  it('formats very small decimal numbers', () => {
    expect(formatCurrency(0.01)).toMatch(/R\$\s*0,01/)
  })

  // Required: Invalid input tests
  it('handles NaN input', () => {
    expect(() => formatCurrency(NaN)).toThrow('Invalid number')
  })

  it('handles Infinity input', () => {
    expect(() => formatCurrency(Infinity)).toThrow('Invalid number')
  })

  it('handles undefined input', () => {
    expect(() => formatCurrency(undefined as any)).toThrow('Invalid input')
  })
})
```

#### Test Quality Requirements

**Tests MUST be:**

- ✅ **Independent**: Each test can run in isolation
- ✅ **Deterministic**: Same input always produces same output
- ✅ **Fast**: Complete test suite runs in under 30 seconds
- ✅ **Descriptive**: Test names clearly describe what is being tested
- ✅ **Focused**: One assertion per logical test case
- ✅ **Maintainable**: Easy to update when requirements change

#### Test File Organization

```typescript
// ✅ REQUIRED - Test file structure
describe('ComponentName or FunctionName', () => {
  // Setup section
  const mockProps = { /* default props */ }
  let mockFunction: jest.Mock

  beforeEach(() => {
    mockFunction = jest.fn()
    // Reset all mocks
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // Group related tests
  describe('rendering', () => {
    it('renders with default props', () => { /* test */ })
    it('renders with custom props', () => { /* test */ })
  })

  describe('user interactions', () => {
    it('handles click events', () => { /* test */ })
    it('handles keyboard events', () => { /* test */ })
  })

  describe('edge cases', () => {
    it('handles empty data', () => { /* test */ })
    it('handles invalid data', () => { /* test */ })
  })

  describe('error scenarios', () => {
    it('displays error messages', () => { /* test */ })
    it('recovers from errors', () => { /* test */ })
  })
})
```

#### Pre-commit Test Requirements

**Before ANY commit, you MUST:**

```bash
# ✅ REQUIRED - Run all tests
npm test

# ✅ REQUIRED - Check test coverage
npm run test:coverage

# ✅ REQUIRED - Verify minimum 95% coverage
npm run test:coverage:check
```

#### Pull Request Test Requirements

**Every PR MUST include:**

- [ ] **New tests for all new code**
- [ ] **Updated tests for modified code**
- [ ] **Test coverage report showing 95%+ coverage**
- [ ] **All tests passing in CI/CD**
- [ ] **Performance tests for critical paths**
- [ ] **Integration tests for API changes**

#### Test Documentation Requirements

```typescript
// ✅ REQUIRED - Document complex test scenarios
describe('Complex financial calculations', () => {
  /**
   * Test scenario: User has mixed income/expense transactions
   * across multiple categories with different date ranges.
   * 
   * Expected behavior: Calculate accurate totals while 
   * respecting category filters and date boundaries.
   * 
   * Edge cases covered:
   * - Transactions on boundary dates
   * - Zero amount transactions
   * - Deleted categories
   * - Currency precision handling
   */
  it('calculates filtered totals correctly', () => {
    // Test implementation with detailed comments
  })
})
```

#### Enforcement Policy

**Non-compliance consequences:**

- 🚫 **PR Rejection**: PRs without adequate tests will be rejected
- 🚫 **Code Review Block**: Code reviews blocked until tests added
- 🚫 **CI/CD Failure**: Automated checks will fail builds
- 🚫 **Deployment Prevention**: Untested code cannot be deployed

#### Test Automation

```json
// package.json scripts for test enforcement
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:check": "jest --coverage --coverageThreshold='{\"global\":{\"branches\":95,\"functions\":95,\"lines\":95,\"statements\":95}}'",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "precommit": "npm run test:coverage:check",
    "prepush": "npm run test:ci"
  }
}
```

#### Test Examples Repository

**Reference implementations available in:**

- `__tests__/examples/` - Comprehensive test examples
- `__tests__/patterns/` - Common testing patterns
- `__tests__/mocks/` - Reusable mock implementations
- `__tests__/utils/` - Testing utility functions

#### Getting Help with Testing

**When you need testing assistance:**

1. 📚 Check existing test examples in `__tests__/`
2. 📖 Review testing patterns documentation
3. 💬 Ask for help in code review comments
4. 🔧 Use testing utilities and helpers
5. 📝 Reference Jest and Testing Library docs

**Remember: Good tests are an investment in code quality, maintainability, and team confidence. They are not optional.**

## 📚 Architecture Decision Records (ADR)

### ⚠️ MANDATORY ADR CREATION

**Every significant feature or architectural change MUST have an ADR:**

- ✅ **REQUIRED**: New features that affect user experience
- ✅ **REQUIRED**: Changes to data models or database schema
- ✅ **REQUIRED**: Integration with external services
- ✅ **REQUIRED**: Performance optimization implementations
- ✅ **REQUIRED**: Security-related changes
- ✅ **REQUIRED**: Breaking changes to existing APIs
- ✅ **REQUIRED**: New architectural patterns or frameworks

### ADR File Structure

```
docs/
├── adr-template.md          # Template for new ADRs
├── adr-001-auth-system.md   # Authentication implementation
├── adr-002-data-model.md    # Database design decisions
├── adr-003-ui-framework.md  # UI/UX framework choices
└── adr-xxx-feature-name.md  # Your new feature ADR
```

### ADR Naming Convention

```bash
# ✅ CORRECT - Sequential numbering with descriptive name
adr-001-user-authentication.md
adr-002-transaction-categorization.md
adr-003-real-time-notifications.md
adr-004-expense-reporting-system.md

# ❌ INCORRECT - No numbering or vague names
auth-decision.md
feature.md
changes.md
```

### When to Create an ADR

**Before Implementation:**

- [ ] **Planning Phase**: Create ADR during feature planning
- [ ] **Design Review**: Get team approval on the ADR
- [ ] **Implementation**: Reference ADR during development
- [ ] **Testing**: Validate against ADR success criteria
- [ ] **Deployment**: Update ADR status to "Accepted"

**Feature Categories Requiring ADRs:**

1. **User Interface Changes**
   - New pages or major UI components
   - Navigation structure changes
   - Responsive design implementations
   - Accessibility improvements

2. **Data Architecture**
   - New database tables or relationships
   - Data validation rules
   - Migration strategies
   - Performance optimizations

3. **Integration Features**
   - Third-party service integrations
   - API endpoint additions
   - Authentication/authorization changes
   - External data synchronization

4. **Technical Infrastructure**
   - Build process modifications
   - Deployment strategy changes
   - Monitoring and logging implementations
   - Security enhancements

### ADR Creation Process

#### Step 1: Copy Template

```bash
# Copy the template with sequential number
cp docs/adr-template.md docs/adr-XXX-your-feature-name.md
```

#### Step 2: Fill Required Sections

- **Context and Problem Statement**: Why is this needed?
- **Decision Drivers**: What requirements must be met?
- **Considered Options**: What alternatives were evaluated?
- **Decision Outcome**: What was chosen and why?
- **Implementation Details**: How will it be built?

#### Step 3: Review Process

- [ ] Self-review for completeness
- [ ] Peer review from team members
- [ ] Stakeholder approval (if applicable)
- [ ] Mark status as "Accepted"

#### Step 4: Implementation Tracking

- [ ] Reference ADR in related commits
- [ ] Update ADR during implementation if needed
- [ ] Mark as "Implemented" when complete

### ADR Content Requirements

**MANDATORY Sections:**

```markdown
## Context and Problem Statement
- Clear business/technical problem description
- Current state and constraints
- Success criteria definition

## Considered Options
- At least 2 alternatives evaluated
- Pros/cons for each option
- Implementation effort estimation

## Decision Outcome
- Clear rationale for chosen solution
- Trade-offs accepted
- Risk mitigation strategies

## Implementation Details
- File structure changes
- Database schema modifications
- API changes (if applicable)
- Testing strategy
```

**RECOMMENDED Sections:**

```markdown
## Security Considerations
- Authentication/authorization impact
- Data protection measures
- Vulnerability assessments

## Performance Impact
- Expected performance characteristics
- Monitoring requirements
- Optimization strategies

## Migration Strategy
- Data migration requirements
- Rollout plan
- Rollback procedures
```

### ADR Status Management

```markdown
## Status Tracking

- [ ] **Proposed**: Initial draft, under review
- [ ] **Accepted**: Approved for implementation
- [ ] **Rejected**: Not approved, document reasons
- [ ] **Superseded**: Replaced by newer ADR
- [ ] **Deprecated**: No longer relevant
- [ ] **Implemented**: Successfully deployed
```

### Integration with Development Workflow

#### Git Commit Messages

```bash
# ✅ CORRECT - Reference ADR in commits
feat: implement transaction filtering (ADR-005)
fix: resolve date formatting issue in dashboard
docs: update ADR-007 with implementation details

# ✅ CORRECT - ADR-specific commits
docs(adr): add ADR-008 for expense categorization
docs(adr): update ADR-006 status to implemented
```

#### Pull Request Requirements

```markdown
## ADR Compliance Checklist

- [ ] ADR created for this feature
- [ ] ADR number: ADR-XXX
- [ ] ADR status: [Proposed/Accepted]
- [ ] Implementation follows ADR decisions
- [ ] Tests cover ADR success criteria
```

#### Feature Branch Naming

```bash
# ✅ CORRECT - Include ADR reference
feature/adr-005-transaction-filtering
fix/adr-003-date-formatting-issue
refactor/adr-007-validation-logic
```

### ADR Review Guidelines

#### For Reviewers

- [ ] **Business Alignment**: Does it solve the stated problem?
- [ ] **Technical Feasibility**: Is the solution realistic?
- [ ] **Consistency**: Follows existing architectural patterns?
- [ ] **Completeness**: All required sections filled?
- [ ] **Alternatives**: Were sufficient options considered?
- [ ] **Risk Assessment**: Are risks properly identified?

#### Common Review Comments

```markdown
# ✅ GOOD ADR Examples
- "Clear problem statement with measurable success criteria"
- "Comprehensive options analysis with trade-offs"
- "Detailed implementation plan with timeline"
- "Proper risk assessment and mitigation"

# ❌ ADR Issues to Address
- "Problem statement too vague"
- "Only one option considered"
- "Missing implementation details"
- "No testing strategy defined"
- "Security implications not addressed"
```

### ADR Maintenance

#### Quarterly ADR Review

- [ ] Review all "Accepted" ADRs for implementation status
- [ ] Update "Implemented" ADRs with actual outcomes
- [ ] Identify "Deprecated" ADRs for archival
- [ ] Extract lessons learned for future ADRs

#### ADR Updates

```markdown
## When to Update an ADR
- Implementation details change significantly
- New requirements discovered during development
- Technical constraints require solution modifications
- Performance requirements not met as planned

## How to Update
1. Add entry to Changelog section
2. Update relevant sections
3. Keep original decisions for historical context
4. Add "Updated" status with reasoning
```

### Tools and Automation

#### ADR Generation Script

```bash
# Create new ADR with auto-incrementing number
npm run adr:new "feature-name"

# Validate ADR format
npm run adr:validate docs/adr-XXX-feature-name.md

# Generate ADR index
npm run adr:index
```

#### Integration with Documentation

- ADRs automatically included in project documentation
- Cross-references with code comments
- Links to related issues and PRs
- Integration with architectural diagrams

### Success Metrics for ADRs

#### Quality Indicators

- [ ] **Completeness**: All required sections filled
- [ ] **Clarity**: Non-technical stakeholders can understand
- [ ] **Traceability**: Clear links to requirements and implementation
- [ ] **Maintainability**: Easy to update and reference

#### Process Metrics

- [ ] **Coverage**: 100% of significant features have ADRs
- [ ] **Timeliness**: ADRs created before implementation starts
- [ ] **Review Quality**: Average 2+ reviewers per ADR
- [ ] **Implementation Alignment**: 95%+ adherence to ADR decisions
