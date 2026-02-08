#!/usr/bin/env node

/**
 * Initialize n8n Data Tables
 * Run this during deployment to ensure tables exist
 * 
 * Usage: node scripts/init-n8n-tables.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file (manual parse to avoid dotenv dependency)
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const N8N_BACKEND_URL = process.env.VITE_N8N_BACKEND_URL || 'https://your-n8n-instance.com';
const WEBHOOK_ENV = process.env.VITE_N8N_WEBHOOK_ENV || 'webhook';

async function initTables() {
  console.log('🔧 Initializing n8n data tables...');
  
  try {
    const response = await fetch(`${N8N_BACKEND_URL}/${WEBHOOK_ENV}/n8n/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', text);

    const result = JSON.parse(text);
    
    if (result.success) {
      if (result.created && result.created.length > 0) {
        console.log('✅ Created tables:', result.created.join(', '));
      } else {
        console.log('✅ All tables already exist');
      }
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Failed to initialize tables:', error.message);
    // Don't exit with error - tables might already exist and init endpoint not deployed yet
    console.log('ℹ️  If this is a fresh deployment, import N8N_Init_Tables.json workflow first');
  }
}

initTables();
