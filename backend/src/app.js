const express = require('express');
const cors = require('cors');
const setoresRouter = require('./routes/setores');
const periodosRouter = require('./routes/periodos');
const indicadoresRouter = require('./routes/indicadores');
const errorHandler = require('./middlewares/error-handler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/setores', setoresRouter);
app.use('/api/periodos', periodosRouter);
app.use('/api/indicadores', indicadoresRouter);

// Deve vir depois das rotas para que rotas inválidas recebam JSON 404.
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Middleware de erro fica por último para receber erros das rotas e do parser JSON.
app.use(errorHandler);

module.exports = app;
