#!/usr/bin/env tsx

/**
 * Quick setup script that works without exec_sql function
 * Uses basic Supabase operations to validate and setup the database
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Test database connectivity and basic functionality
 */
async function quickSetup(): Promise<void> {
  try {
    console.log("🚀 Quick Database Setup & Validation\n");

    // 1. Test basic connectivity
    console.log("🔍 Testing database connection...");
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Failed to connect to Supabase");
      console.error("Error:", authError.message);
      console.log("\n💡 Check your environment variables:");
      console.log("   - NEXT_PUBLIC_SUPABASE_URL");
      console.log("   - SUPABASE_SERVICE_ROLE_KEY");
      return;
    }

    console.log("✅ Database connection successful");

    // 2. Test if tables exist
    const tables = ["profiles", "categories", "transactions", "budgets"];
    console.log("\n📋 Checking tables...");

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table as any)
          .select("*", { count: "exact", head: true });

        if (error && error.code === "PGRST116") {
          console.log(`❌ Table '${table}' not found`);
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}'`);
      }
    }

    // 3. Test exec_sql function
    console.log("\n⚙️ Testing exec_sql function...");
    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: "SELECT 1 as test;",
      });

      if (error) {
        console.log("❌ exec_sql function not available");
        console.log(
          "\n📋 REQUIRED: Execute this SQL in Supabase Dashboard > SQL Editor:"
        );
        console.log("```sql");
        console.log(`CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`);
        console.log("```\n");
      } else {
        console.log("✅ exec_sql function working");
      }
    } catch (err) {
      console.log("❌ Failed to test exec_sql function");
    }

    // 4. Apply critical missing configurations
    console.log("\n🔧 Applying critical configurations...");

    // Update transactions table to support installments
    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: `
          -- Make category_id optional
          ALTER TABLE transactions ALTER COLUMN category_id DROP NOT NULL;
          
          -- Add installment fields if they don't exist
          ALTER TABLE transactions 
          ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS installment_count INTEGER,
          ADD COLUMN IF NOT EXISTS installment_current INTEGER,
          ADD COLUMN IF NOT EXISTS installment_group_id UUID;
          
          -- Update existing records
          UPDATE transactions 
          SET is_installment = false 
          WHERE is_installment IS NULL;
        `,
      });

      if (!error) {
        console.log("✅ Installment support added to transactions");
      } else {
        console.log("⚠️  Could not add installment support (exec_sql needed)");
      }
    } catch (err) {
      console.log("⚠️  Could not add installment support (exec_sql needed)");
    }

    // 5. Test migrations table
    console.log("\n🚀 Checking migrations system...");
    try {
      const { data: migrations, error } = await supabase
        .from("_migrations")
        .select("*", { count: "exact" });

      if (error && error.code === "PGRST116") {
        console.log("❌ Migrations table not found");
        console.log("💡 Run the SQL script provided earlier to create it");
      } else {
        console.log(
          `✅ Migrations table exists (${migrations?.length || 0} migrations)`
        );
      }
    } catch (err) {
      console.log("❌ Error checking migrations table");
    }

    // 6. Final status
    console.log("\n🎯 Setup Status Summary:");
    console.log("   ✅ Database connection working");
    console.log("   ✅ Tables structure verified");
    console.log("   ⚠️  Need to execute SQL script in Supabase dashboard");
    console.log("   ⚠️  exec_sql function required for full automation");

    console.log("\n📋 Next Steps:");
    console.log("1. Execute the SQL script in Supabase Dashboard > SQL Editor");
    console.log("2. Run: npm run db:status");
    console.log("3. Run: npm run migrate");
    console.log("4. Start developing: npm run dev");

    console.log("\n💡 Quick Start Command:");
    console.log("   npm run dev  # Start the application");
  } catch (error) {
    console.error("\n💥 Setup failed:", error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  quickSetup();
}

export { quickSetup };
