const express = require('express');
const cors = require('cors');
const setoresRouter = require('./routes/setores');
const periodosRouter = require('./routes/periodos');
const indicadoresRouter = require('./routes/indicadores');
const relatoriosRouter = require('./routes/relatorios');
const authRouter = require('./routes/auth');
const adminIndicadoresRouter = require('./routes/admin-indicadores');
const adminMedicoesRouter = require('./routes/admin-medicoes');
const adminRelatoriosRouter = require('./routes/admin-relatorios');
const errorHandler = require('./middlewares/error-handler');

const app = express();

// Sem CORS_ORIGIN libera qualquer origem; em produção, defina a URL do front.
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/setores', setoresRouter);
app.use('/api/periodos', periodosRouter);
app.use('/api/indicadores', indicadoresRouter);
app.use('/api/relatorios', relatoriosRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/indicadores', adminIndicadoresRouter);
app.use('/api/admin/medicoes', adminMedicoesRouter);
app.use('/api/admin/relatorios', adminRelatoriosRouter);

// Deve vir depois das rotas para que rotas inválidas recebam JSON 404.
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Middleware de erro fica por último para receber erros das rotas e do parser JSON.
app.use(errorHandler);

module.exports = app;
