describe('Configuração do servidor', () => {
  const originalPort = process.env.PORT;

  afterEach(() => {
    if (originalPort === undefined) delete process.env.PORT;
    else process.env.PORT = originalPort;
    jest.resetModules();
    jest.dontMock('../src/app');
  });

  it('inicia na porta fornecida pelo ambiente', () => {
    process.env.PORT = '4321';
    const listen = jest.fn();
    jest.doMock('../src/app', () => ({ listen }));

    require('../src/server');

    expect(listen).toHaveBeenCalledWith('4321', expect.any(Function));
  });
});
