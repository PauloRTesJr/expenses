#!/usr/bin/env tsx

/**
 * Migration runner for Supabase database
 * Executes SQL migrations and manages database schema
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { Database } from "@/types/database";

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MIGRATIONS_DIR = join(process.cwd(), "migrations");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface Migration {
  filename: string;
  version: string;
  name: string;
  sql: string;
}

/**
 * Create migrations tracking table if it doesn't exist
 */
async function ensureMigrationsTable(): Promise<void> {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      checksum VARCHAR(64) NOT NULL
    );
  `;

  const { error } = await supabase.rpc("exec_sql", {
    sql_query: createTableSQL,
  });

  if (error) {
    console.error("❌ Failed to create migrations table:", error.message);
    throw error;
  }
}

/**
 * Get executed migrations from database
 */
async function getExecutedMigrations(): Promise<string[]> {
  const { data, error } = await supabase
    .from("_migrations")
    .select("version")
    .order("executed_at", { ascending: true });

  if (error) {
    console.error("❌ Failed to fetch executed migrations:", error.message);
    throw error;
  }

  return data?.map((m) => m.version) || [];
}

/**
 * Parse migration filename to extract version and name
 */
function parseMigrationFilename(filename: string): {
  version: string;
  name: string;
} {
  // Format: YYYYMMDD_HHMMSS_migration_name.sql
  const match = filename.match(/^(\d{8}_\d{6})_(.+)\.sql$/);

  if (!match) {
    throw new Error(`Invalid migration filename format: ${filename}`);
  }

  return {
    version: match[1],
    name: match[2].replace(/_/g, " "),
  };
}

/**
 * Load all migration files from the migrations directory
 */
function loadMigrations(): Migration[] {
  if (!existsSync(MIGRATIONS_DIR)) {
    console.log("📁 No migrations directory found. Creating...");
    return [];
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  return files.map((filename) => {
    const { version, name } = parseMigrationFilename(filename);
    const sql = readFileSync(join(MIGRATIONS_DIR, filename), "utf-8");

    return {
      filename,
      version,
      name,
      sql,
    };
  });
}

/**
 * Execute a single migration
 */
async function executeMigration(migration: Migration): Promise<void> {
  console.log(`🔄 Executing: ${migration.version} - ${migration.name}`);

  // Execute the migration SQL
  const { error: execError } = await supabase.rpc("exec_sql", {
    sql_query: migration.sql,
  });

  if (execError) {
    console.error(`❌ Migration failed: ${migration.filename}`);
    console.error("Error:", execError.message);
    throw execError;
  }

  // Record the migration as executed
  const checksum = Buffer.from(migration.sql).toString("base64").slice(0, 64);

  const { error: recordError } = await supabase.from("_migrations").insert({
    version: migration.version,
    name: migration.name,
    filename: migration.filename,
    checksum,
  });

  if (recordError) {
    console.error(`❌ Failed to record migration: ${migration.filename}`);
    throw recordError;
  }

  console.log(`✅ Completed: ${migration.version} - ${migration.name}`);
}

/**
 * Run all pending migrations
 */
async function runMigrations(): Promise<void> {
  try {
    console.log("🚀 Starting database migrations...\n");

    // Ensure migrations table exists
    await ensureMigrationsTable();

    // Load migrations and get executed ones
    const migrations = loadMigrations();
    const executedVersions = await getExecutedMigrations();

    if (migrations.length === 0) {
      console.log("📭 No migrations found.");
      return;
    }

    // Filter pending migrations
    const pendingMigrations = migrations.filter(
      (migration) => !executedVersions.includes(migration.version)
    );

    if (pendingMigrations.length === 0) {
      console.log("✅ All migrations are up to date!");
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migration(s):\n`);

    // Execute each pending migration
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }

    console.log("\n🎉 All migrations completed successfully!");
  } catch (error) {
    console.error("\n💥 Migration failed:", error);
    process.exit(1);
  }
}

/**
 * Create a new migration file
 */
async function createMigration(name: string): Promise<void> {
  if (!name) {
    console.error("❌ Migration name is required");
    console.log("Usage: npm run migrate:create <migration_name>");
    process.exit(1);
  }

  // Create migrations directory if it doesn't exist
  const fs = await import("fs/promises");
  if (!existsSync(MIGRATIONS_DIR)) {
    await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
  }

  // Generate timestamp and filename
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .replace(/\.\d{3}Z$/, "");

  const filename = `${timestamp}_${name
    .replace(/\s+/g, "_")
    .toLowerCase()}.sql`;
  const filepath = join(MIGRATIONS_DIR, filename);

  // Create migration template
  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: Add your migration description here

-- TODO: Add your SQL statements here
-- Example:
-- CREATE TABLE example (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   name TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Don't forget to add RLS policies if needed:
-- ALTER TABLE example ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own records" ON example
--   FOR SELECT USING (auth.uid() = user_id);
`;

  await fs.writeFile(filepath, template);
  console.log(`✅ Created migration: ${filename}`);
}

/**
 * Main CLI interface
 */
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case "run":
    case undefined:
      await runMigrations();
      break;

    case "create":
      await createMigration(arg);
      break;

    case "status":
      // TODO: Implement status command
      console.log("📊 Migration status command not yet implemented");
      break;

    default:
      console.log("Usage:");
      console.log("  npm run migrate           # Run pending migrations");
      console.log("  npm run migrate:create    # Create new migration");
      console.log("  npm run migrate:status    # Show migration status");
      break;
  }
}

// Run the CLI
if (require.main === module) {
  main().catch(console.error);
}

export { runMigrations, createMigration };
