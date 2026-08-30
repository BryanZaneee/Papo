#!/usr/bin/env node
/**
 * Generates config.json from config.example.json with a bcrypt password hash
 * and a fresh JWT secret. Re-running rotates the secret (logs everyone out).
 * Usage: node setup.js <password>
 */
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node setup.js <password>');
  process.exit(1);
}

const dir = import.meta.dirname;
const configPath = join(dir, 'config.json');
const source = await readFile(configPath, 'utf-8').catch(() => readFile(join(dir, 'config.example.json'), 'utf-8'));
const config = JSON.parse(source);

config.passwordHash = await bcrypt.hash(password, 10);
config.jwtSecret = randomBytes(48).toString('hex');

await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
console.log('Wrote api/config.json — password hash + new JWT secret.');
