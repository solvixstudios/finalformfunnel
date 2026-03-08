#!/usr/bin/env node

/**
 * Initialize Backend Data Tables
 * Run this during deployment to ensure tables exist
 * 
 * Usage: node scripts/init-backend-tables.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file (manual parse to avoid dotenv dependency)
const envPath = path.resolve(__dirname, '../.env');
console.log('📂 Looking for .env at:', envPath);
if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return; // Skip empty lines and comments
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} else {
  console.log('❌ .env file NOT found');
}

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'https://your-backend-instance.com';
const WEBHOOK_ENV = process.env.VITE_WEBHOOK_ENV || 'webhook';

async function initTables() {
  console.log('🔧 Initializing backend data tables...');
  console.log('📦 BACKEND_URL:', BACKEND_URL);
  console.log('📦 WEBHOOK_ENV:', WEBHOOK_ENV);

  const url = `${BACKEND_URL}/${WEBHOOK_ENV}/backend/init`;
  console.log('🌐 Calling URL:', url);

  try {
    const response = await fetch(url, {
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
    console.log('ℹ️  If this is a fresh deployment, import Backend_Init_Tables.json workflow first');
  }
}

initTables();
