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

### 3. 🎯 **SIMPLIFIED DATABASE SETUP**

**NEW:** We've simplified the database setup into a single script!

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and execute the complete script from: `scripts/unified-setup.sql`

**That's it!** ✨ The unified script will automatically create:

- ✅ All required tables (profiles, categories, transactions, budgets)
- ✅ Row Level Security (RLS) policies for data protection
- ✅ Performance indexes for fast queries
- ✅ Utility functions and triggers
- ✅ Default categories for new users (in Portuguese)
- ✅ Data validation constraints
- ✅ Migration tracking

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

**Database verification:**

- Check **Table Editor** in Supabase to see all tables
- Verify RLS is enabled in **Authentication** > **Policies**
- Test creating a user and see if default categories are created

## 🚨 Common Issues

### Error: "Invalid API Key"

- Check if the keys in `.env.local` are correct
- Confirm you copied from the right page in Supabase

### Error: "RLS Policy Violation"

- Make sure you ran the complete `unified-setup.sql` script
- Confirm the user is authenticated

### Error: "Table does not exist"

- Run the `unified-setup.sql` script again (it's idempotent)
- Check if you're in the correct Supabase project

### Error: "Function does not exist"

- The unified script creates all necessary functions
- Re-run the script if functions are missing

## 📂 Database Scripts Reference

For developers who want to understand the database structure:

- `scripts/unified-setup.sql` - **Main setup script** (use this one!)
- `scripts/fix-missing-functions.sql` - Legacy fix script
- `scripts/complete-setup.sql` - Legacy complete setup
- `migrations/` - Future schema migrations

## 📚 Next Steps

1. Configure authentication routes
2. Implement main pages (dashboard, transactions, etc.)
3. Configure Vercel deployment
4. Configure custom domain (optional)

## 🆘 Support

If you encounter problems:

- Check [Supabase documentation](https://supabase.com/docs)
- Check browser logs (F12)
- Review the `CONTRIBUTING.md` file for code standards
- The unified setup script shows detailed progress messages
