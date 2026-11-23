const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendRoot = path.join(__dirname, '..');
const schema = path.join(backendRoot, 'prisma', 'schema.prisma');

if (!fs.existsSync(schema)) {
  process.exit(0);
}

const prismaBin =
  [
    path.join(backendRoot, 'node_modules', '.bin', 'prisma'),
    path.join(backendRoot, '..', '..', 'node_modules', '.bin', 'prisma'),
  ].find((candidate) => fs.existsSync(candidate)) ?? 'prisma';

execFileSync(prismaBin, ['generate', '--schema', schema], {
  stdio: 'inherit',
  cwd: backendRoot,
});

// Vercel は動的に開く WASM を Function に入れない。require できる JS に置き換える。
if (process.env.VERCEL === '1') {
  embedQueryCompilerWasm(backendRoot);
}

if (process.env.VERCEL !== '1') {
  process.exit(0);
}

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL is not set; skip prisma migrate deploy');
  process.exit(0);
}

execFileSync(prismaBin, ['migrate', 'deploy', '--schema', schema], {
  stdio: 'inherit',
  cwd: backendRoot,
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

function embedQueryCompilerWasm(backendRoot) {
  const clientDir = path.join(
    backendRoot,
    '..',
    '..',
    'node_modules',
    '.prisma',
    'client',
  );
  const indexPath = path.join(clientDir, 'index.js');
  const wasmPath = path.join(clientDir, 'query_compiler_bg.wasm');

  if (!fs.existsSync(indexPath) || !fs.existsSync(wasmPath)) {
    console.warn('Prisma query compiler wasm was not found; skip embed');
    return;
  }

  const embeddedPath = path.join(clientDir, 'query_compiler_wasm_embedded.js');
  const base64 = fs.readFileSync(wasmPath).toString('base64');
  fs.writeFileSync(
    embeddedPath,
    `'use strict';\nmodule.exports = ${JSON.stringify(base64)};\n`,
  );

  const index = fs.readFileSync(indexPath, 'utf8');
  const pattern =
    /getQueryCompilerWasmModule:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?query_compiler_bg\.wasm[\s\S]*?\n\s*\}/;
  if (!pattern.test(index)) {
    console.warn('Prisma client wasm loader was not found; skip embed');
    return;
  }

  const replacement = `getQueryCompilerWasmModule: async () => {
        const queryCompilerWasmBase64 = require('./query_compiler_wasm_embedded.js')
        return new WebAssembly.Module(Buffer.from(queryCompilerWasmBase64, 'base64'))
      }`;
  fs.writeFileSync(indexPath, index.replace(pattern, replacement));
}
