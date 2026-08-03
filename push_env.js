import fs from 'fs';
import { spawnSync } from 'child_process';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(fs.readFileSync('.env', 'utf8'));

function quotePowerShellArg(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

console.log('Uploading environment variables to Vercel (Production)...');

for (const [key, value] of Object.entries(envConfig)) {
  if (value == null || value === '') continue;
  try {
    console.log(`Adding ${key}...`);
    const args = ['vercel', 'env', 'add', key, 'production', '--force', '--yes', '--value', value];
    const result = process.platform === 'win32'
      ? spawnSync(
          'pwsh',
          ['-NoProfile', '-Command', `& npx ${args.map(quotePowerShellArg).join(' ')}`],
          { stdio: 'inherit', shell: false }
        )
      : spawnSync('npx', args, { stdio: 'inherit', shell: false });

    if (result.status !== 0) {
      throw new Error(`vercel env add exited with code ${result.status}`);
    }
  } catch (err) {
    console.error(`Failed to add ${key}`);
  }
}

console.log('Done uploading envs!');
