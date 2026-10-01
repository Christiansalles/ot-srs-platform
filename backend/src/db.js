const { PrismaClient } = require('@prisma/client');

// Uma única conexão para a API inteira.
const prisma = new PrismaClient();

module.exports = prisma;
