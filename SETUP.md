# 🔧 Environment Setup - Expenses

This document explains how to set up the development environment for the Expenses project.

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (create at [supabase.com](https://supabase.com))

## 🚀 Installing Dependencies

```bash
npm install
# or
yarn install
```

## ⚙️ Environment Variables Configuration

### 1. Create .env.local file

Create a `.env.local` file at the project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Other authentication providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

**⚠️ IMPORTANT:** These values are for local development only and will not work in production.

## 🗄️ Supabase Database Configuration

### 1. Create Supabase Project

1. Access [supabase.com](https://supabase.com)
2. Create an account or log in
3. Click "New Project"
4. Choose your organization
5. Fill in the project details:
   - **Name**: expenses-app
   - **Database Password**: [generate a strong password]
   - **Region**: Brazil (South America)
6. Click "Create new project"

### 2. Get API Keys

After creating the project:

1. Go to **Settings** > **API**
2. Copy the values:
   - **URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY` (keep it secret!)

### 3. Run SQL Scripts

In the Supabase panel, go to **SQL Editor** and run the following scripts:

#### 3.1. Create Tables

```sql
-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  period VARCHAR(10) CHECK (period IN ('monthly', 'weekly', 'yearly')) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.2. Configure Row Level Security (RLS)

```sql
-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for categories table
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for transactions table
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for budgets table
CREATE POLICY "Users can view their own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);
```

#### 3.3. Create Triggers for Updated_at

```sql
-- Function to update updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
```

#### 3.4. Insert Default Categories (Optional)

```sql
-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Income categories
  INSERT INTO categories (name, color, icon, type, user_id) VALUES
    ('Salary', '#10B981', 'wallet', 'income', NEW.id),
    ('Freelance', '#3B82F6', 'laptop', 'income', NEW.id),
    ('Investments', '#8B5CF6', 'trending-up', 'income', NEW.id),
    ('Others', '#6B7280', 'plus-circle', 'income', NEW.id);

  -- Expense categories
  INSERT INTO categories (name, color, icon, type, user_id) VALUES
    ('Food', '#F59E0B', 'utensils', 'expense', NEW.id),
    ('Transportation', '#EF4444', 'car', 'expense', NEW.id),
    ('Housing', '#06B6D4', 'home', 'expense', NEW.id),
    ('Health', '#10B981', 'heart', 'expense', NEW.id),
    ('Entertainment', '#8B5CF6', 'gamepad-2', 'expense', NEW.id),
    ('Education', '#3B82F6', 'book', 'expense', NEW.id),
    ('Shopping', '#F97316', 'shopping-bag', 'expense', NEW.id),
    ('Others', '#6B7280', 'more-horizontal', 'expense', NEW.id);

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create default categories
CREATE TRIGGER create_default_categories_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();
```

### 4. Configure Authentication

1. Go to **Authentication** > **Settings**
2. Configure the options:
   - **Enable email confirmations**: true (recommended)
   - **Enable phone confirmations**: false (optional)
3. Configure external providers if needed:
   - **Google**, **GitHub**, etc.

## 🔧 Run the Project

```bash
npm run dev
# or
yarn dev
```

The project will be available at [http://localhost:3000](http://localhost:3000)

## 🧪 Verify Configuration

To verify everything is working:

1. Access the application
2. Try to register/login
3. Check if tables are created in Supabase
4. Test basic operations (create transaction, category, etc.)

## 🚨 Common Issues

### Error: "Invalid API Key"

- Check if the keys in `.env.local` are correct
- Confirm you copied from the right page in Supabase

### Error: "RLS Policy Violation"

- Check if RLS policies were created correctly
- Confirm the user is authenticated

### Error: "Table does not exist"

- Run the table creation SQL scripts again
- Check if you're in the correct Supabase project

## 📚 Next Steps

1. Configure authentication routes
2. Implement main pages (dashboard, transactions, etc.)
3. Configure Vercel deployment
4. Configure custom domain (optional)

## 🆘 Support

If you encounter problems:

- Check [Supabase documentation](https://supabase.com/docs)
- Check browser logs (F12)
- Check the `CONTRIBUTING.md` file for code standards
