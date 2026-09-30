const express = require('express');
const request = require('supertest');
const errorHandler = require('../src/middlewares/error-handler');

describe('Tratamento padrão de erros', () => {
  it('responde 500 em JSON sem expor detalhes internos', async () => {
    const app = express();
    app.get('/falha', async () => {
      throw new Error('Detalhes internos do banco');
    });
    app.use(errorHandler);

    const res = await request(app).get('/falha');

    expect(res.status).toBe(500);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ erro: 'Erro interno do servidor' });
  });

  it('preserva o status e a mensagem de erros de validação', async () => {
    const app = express();
    app.get('/validacao', (req, res, next) => {
      const err = new Error('setor deve ser um número inteiro positivo');
      err.status = 400;
      next(err);
    });
    app.use(errorHandler);

    const res = await request(app).get('/validacao');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ erro: 'setor deve ser um número inteiro positivo' });
  });
});
