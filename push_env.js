import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(fs.readFileSync('.env'));

console.log('Uploading environment variables to Vercel (Production)...');

for (const [key, value] of Object.entries(envConfig)) {
  if (!value) continue;
  try {
    console.log(`Adding ${key}...`);
    // Escape single quotes for PowerShell
    const safeValue = value.replace(/'/g, "''");
    // Use PowerShell syntax to pipe
    execSync(`echo '${safeValue}' | npx vercel env add ${key} production`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to add ${key}`);
  }
}

console.log('Done uploading envs!');
