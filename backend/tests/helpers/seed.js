const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const backendDir = path.resolve(__dirname, '../..');
const seedPath = path.join(backendDir, 'prisma', 'seed.js');
const uploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ot-srs-uploads-'));

function executarSeed(variaveis = {}, stdio = 'inherit') {
  execFileSync(process.execPath, [seedPath], {
    cwd: backendDir,
    stdio,
    env: {
      ...process.env,
      UPLOADS_DIR: uploadsDir,
      ...variaveis,
    },
  });
}

function limparUploads() {
  fs.rmSync(uploadsDir, { recursive: true, force: true });
}

module.exports = { executarSeed, limparUploads, uploadsDir };
