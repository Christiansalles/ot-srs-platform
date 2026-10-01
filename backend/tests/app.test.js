const request = require('supertest');
const app = require('../src/app');

describe('Base do Express', () => {
  it('responde 404 em JSON para uma rota inexistente', async () => {
    const res = await request(app).get('/api/rota-inexistente');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ erro: 'Rota não encontrada' });
  });

  it('libera CORS para o frontend', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('responde ao preflight do navegador', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Content-Type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-methods']).toContain('GET');
    expect(res.headers['access-control-allow-headers']).toBe('Content-Type');
  });

  it('responde 400 no formato padrão quando o JSON é inválido', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{');

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toEqual({ erro: 'JSON inválido' });
  });

  it('responde 413 em português quando o corpo passa do limite', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ texto: 'x'.repeat(200 * 1024) }));

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ erro: 'Corpo da requisição muito grande' });
  });

  it('libera só a origem de CORS_ORIGIN quando ela está definida', async () => {
    const origemAnterior = process.env.CORS_ORIGIN;
    process.env.CORS_ORIGIN = 'http://localhost:8080';

    let appComOrigem;
    jest.isolateModules(() => {
      appComOrigem = require('../src/app');
    });

    if (origemAnterior === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = origemAnterior;
    }

    const res = await request(appComOrigem)
      .get('/api/health')
      .set('Origin', 'http://localhost:8080');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:8080');
  });
});
