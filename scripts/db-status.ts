#!/usr/bin/env tsx

/**
 * Database status and validation script
 * Checks database health, migrations status, and configuration
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface TableInfo {
  name: string;
  exists: boolean;
  rowCount?: number;
  hasRLS?: boolean;
}

interface DatabaseStatus {
  connection: boolean;
  tables: TableInfo[];
  migrations: {
    tableExists: boolean;
    count: number;
    latest?: string;
  };
  functions: string[];
  policies: number;
}

/**
 * Check database connection
 */
async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("_migrations")
      .select("count")
      .limit(1);
    return !error || error.code !== "PGRST116"; // Table not found is okay
  } catch {
    return false;
  }
}

/**
 * Check if table exists and get basic info
 */
async function checkTable(tableName: string): Promise<TableInfo> {
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from(tableName as any)
      .select("*", { count: "exact", head: true });

    if (error && error.code === "PGRST116") {
      return { name: tableName, exists: false };
    }

    // Get row count
    const rowCount = data?.length || 0;

    // Check RLS status (simplified check)
    let hasRLS = false;
    try {
      const { error: rlsError } = await supabase.rpc("exec_sql", {
        sql_query: `SELECT row_security FROM pg_tables WHERE tablename = '${tableName}';`,
      });
      hasRLS = !rlsError;
    } catch {
      // Ignore RLS check errors
    }

    return {
      name: tableName,
      exists: true,
      rowCount,
      hasRLS,
    };
  } catch {
    return { name: tableName, exists: false };
  }
}

/**
 * Check migrations status
 */
async function checkMigrations() {
  try {
    const { data, error } = await supabase
      .from("_migrations")
      .select("version, executed_at")
      .order("executed_at", { ascending: false });

    if (error && error.code === "PGRST116") {
      return { tableExists: false, count: 0 };
    }

    const latest = data && data.length > 0 ? data[0].version : undefined;

    return {
      tableExists: true,
      count: data?.length || 0,
      latest,
    };
  } catch {
    return { tableExists: false, count: 0 };
  }
}

/**
 * Check database functions (improved version)
 */
async function checkFunctions(): Promise<string[]> {
  // First try with exec_sql
  try {
    const { data, error } = await supabase.rpc("exec_sql", {
      sql_query: `
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_type = 'FUNCTION' 
        AND routine_schema = 'public'
        AND routine_name IN ('handle_updated_at', 'create_default_categories', 'exec_sql');
      `,
    });

    if (!error && data) return data.map((row: any) => row.routine_name);
  } catch {
    // exec_sql doesn't exist, try alternative approach
  }

  // Alternative: Try calling each function directly to see if it exists
  const functions = [];
  const functionsToCheck = [
    "handle_updated_at",
    "create_default_categories",
    "exec_sql",
  ];

  for (const funcName of functionsToCheck) {
    try {
      if (funcName === "exec_sql") {
        // Test exec_sql with a simple query
        await supabase.rpc("exec_sql", { sql_query: "SELECT 1;" });
        functions.push(funcName);
      } else {
        // For other functions, check in pg_proc directly via a simple query
        const { error } = await supabase
          .from("profiles") // Use an existing table
          .select("id")
          .limit(0); // Don't actually fetch data

        // This is a fallback - we'll update this after exec_sql works
        if (!error || error.code !== "PGRST116") {
          // Table exists, but we can't easily check functions without exec_sql
          // We'll mark functions as missing for now
        }
      }
    } catch {
      // Function doesn't exist
    }
  }

  return functions;
}

/**
 * Count RLS policies (improved version)
 */
async function countPolicies(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("exec_sql", {
      sql_query: `SELECT COUNT(*) as count FROM pg_policies WHERE schemaname = 'public';`,
    });

    if (!error && data && data.length > 0) {
      return parseInt(data[0].count || "0");
    }
  } catch {
    // exec_sql doesn't exist, return 0
  }

  return 0;
}

/**
 * Generate database status report
 */
async function getDatabaseStatus(): Promise<DatabaseStatus> {
  console.log("🔍 Checking database status...\n");

  const connection = await checkConnection();

  if (!connection) {
    console.error("❌ Cannot connect to database");
    return {
      connection: false,
      tables: [],
      migrations: { tableExists: false, count: 0 },
      functions: [],
      policies: 0,
    };
  }

  const tableNames = ["profiles", "categories", "transactions", "budgets"];
  const tables = await Promise.all(tableNames.map((name) => checkTable(name)));

  const migrations = await checkMigrations();
  const functions = await checkFunctions();
  const policies = await countPolicies();

  return {
    connection,
    tables,
    migrations,
    functions,
    policies,
  };
}

/**
 * Print status report
 */
function printStatusReport(status: DatabaseStatus): void {
  console.log("📊 DATABASE STATUS REPORT\n");

  // Connection
  console.log(
    `🔗 Connection: ${status.connection ? "✅ Connected" : "❌ Failed"}`
  );

  // Tables
  console.log("\n📋 Tables:");
  status.tables.forEach((table) => {
    const statusIcon = table.exists ? "✅" : "❌";
    const rowInfo =
      table.exists && table.rowCount !== undefined
        ? ` (${table.rowCount} rows)`
        : "";
    const rlsInfo = table.exists && table.hasRLS ? " 🔒 RLS" : "";

    console.log(`   ${statusIcon} ${table.name}${rowInfo}${rlsInfo}`);
  });

  // Migrations
  console.log("\n🚀 Migrations:");
  if (status.migrations.tableExists) {
    console.log(`   ✅ Migration table exists`);
    console.log(`   📊 ${status.migrations.count} migrations executed`);
    if (status.migrations.latest) {
      console.log(`   🏷️  Latest: ${status.migrations.latest}`);
    }
  } else {
    console.log(`   ❌ Migration table not found`);
  }

  // Functions
  console.log("\n⚙️ Functions:");
  const expectedFunctions = [
    "handle_updated_at",
    "create_default_categories",
    "exec_sql",
  ];
  expectedFunctions.forEach((fn) => {
    const exists = status.functions.includes(fn);
    console.log(`   ${exists ? "✅" : "❌"} ${fn}`);
  });

  // Policies
  console.log("\n🔒 Security:");
  console.log(`   📊 ${status.policies} RLS policies active`);

  // Summary
  const missingTables = status.tables.filter((t) => !t.exists).length;
  const allTablesExist = missingTables === 0;
  const allFunctionsExist = expectedFunctions.every((fn) =>
    status.functions.includes(fn)
  );

  console.log("\n🎯 Summary:");
  if (
    status.connection &&
    allTablesExist &&
    status.migrations.tableExists &&
    allFunctionsExist
  ) {
    console.log("   ✅ Database is fully configured and ready!");
  } else {
    console.log("   ⚠️  Database setup incomplete:");
    if (!status.connection) console.log("      - Connection failed");
    if (missingTables > 0)
      console.log(`      - ${missingTables} tables missing`);
    if (!status.migrations.tableExists)
      console.log("      - Migration system not setup");
    if (!allFunctionsExist) console.log("      - Some functions missing");
    console.log("\n   💡 Run: npm run db:setup");
  }
}

/**
 * Validate environment variables
 */
function validateEnvironment(): boolean {
  console.log("🔧 Environment Configuration:\n");

  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  let allValid = true;

  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    const isSet = !!value;
    const isValid = isSet && value.length > 10; // Basic validation

    console.log(
      `   ${isValid ? "✅" : "❌"} ${varName}: ${isSet ? "Set" : "Missing"}`
    );

    if (!isValid) allValid = false;
  });

  if (!allValid) {
    console.log("\n   💡 Check your .env.local file");
  }

  return allValid;
}

/**
 * Main status check
 */
async function checkStatus(): Promise<void> {
  try {
    // Validate environment
    const envValid = validateEnvironment();

    if (!envValid) {
      console.log("\n❌ Fix environment variables first");
      return;
    }

    // Get and print status
    const status = await getDatabaseStatus();
    printStatusReport(status);
  } catch (error) {
    console.error("\n💥 Status check failed:", error);
    process.exit(1);
  }
}

// Run status check if called directly
if (require.main === module) {
  checkStatus();
}

export { getDatabaseStatus, checkStatus };
