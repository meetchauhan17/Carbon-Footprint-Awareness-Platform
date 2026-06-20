import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function init() {
  if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL connection. Skipping database creation step...');
    const dbClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await dbClient.connect();
      console.log('Connected to target database.');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      console.log('Applying schema migrations...');
      await dbClient.query(schemaSql);
      console.log('Database tables initialized successfully!');
    } catch (error) {
      console.error('Error applying schema migrations:', error.message);
      process.exit(1);
    } finally {
      await dbClient.end();
    }
    return;
  }

  const dbName = process.env.DB_DATABASE || 'carbonwise';
  
  // Connection config to default 'postgres' database
  const clientConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: 'postgres',
  };

  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected to default database "postgres" to verify database existence...');
    
    // Check if target database exists
    const dbCheckRes = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    
    if (dbCheckRes.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      // Database name is safe since it comes from trusted config/default
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('Error verifying/creating database:', error.message);
    console.error('Please make sure PostgreSQL is running and DB_PASSWORD in server/.env is correct.');
    process.exit(1);
  } finally {
    await client.end();
  }

  // Connect to target database and run schema
  const dbClientConfig = {
    ...clientConfig,
    database: dbName,
  };

  const dbClient = new Client(dbClientConfig);

  try {
    await dbClient.connect();
    console.log(`Connected to target database "${dbName}".`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying schema migrations...');
    await dbClient.query(schemaSql);
    console.log('Database tables initialized successfully!');
  } catch (error) {
    console.error('Error applying schema migrations:', error.message);
    process.exit(1);
  } finally {
    await dbClient.end();
  }
}

init();
