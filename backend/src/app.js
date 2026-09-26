const express = require('express');
const setoresRouter = require('./routes/setores');
const periodosRouter = require('./routes/periodos');
const indicadoresRouter = require('./routes/indicadores');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/setores', setoresRouter);
app.use('/api/periodos', periodosRouter);
app.use('/api/indicadores', indicadoresRouter);

module.exports = app;
