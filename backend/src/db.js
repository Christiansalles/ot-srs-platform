const { PrismaClient } = require('@prisma/client');
const path = require('node:path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
  quiet: true,
});

// Uma única conexão para a API inteira.
const prisma = new PrismaClient();

module.exports = prisma;
