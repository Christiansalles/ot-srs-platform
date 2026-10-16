const { conferirSenha, gerarHash } = require('../src/services/senha');

describe('serviço de senhas', () => {
  it('gera um hash no formato salt:hash e aceita a senha correta', async () => {
    const senha = 'Senha-de-teste-123';
    const senhaHash = await gerarHash(senha);

    expect(senhaHash).toMatch(/^[a-f\d]{32}:[a-f\d]{128}$/i);
    await expect(conferirSenha(senha, senhaHash)).resolves.toBe(true);
  });

  it('recusa uma senha incorreta', async () => {
    const senhaHash = await gerarHash('Senha-correta');

    await expect(conferirSenha('Senha-incorreta', senhaHash)).resolves.toBe(false);
  });

  it.each([
    ['', ''],
    ['senha', 'salt-sem-separador'],
    ['senha', `${'a'.repeat(32)}:${'b'.repeat(64)}`],
    ['senha', `${'a'.repeat(32)}:${'b'.repeat(128)}:extra`],
  ])('recusa hash malformado (%p)', async (senha, senhaHash) => {
    await expect(conferirSenha(senha, senhaHash)).resolves.toBe(false);
  });

  it('gera salts diferentes para a mesma senha', async () => {
    const primeiroHash = await gerarHash('mesma senha');
    const segundoHash = await gerarHash('mesma senha');

    expect(primeiroHash.split(':')[0]).not.toBe(segundoHash.split(':')[0]);
    expect(primeiroHash).not.toBe(segundoHash);
  });
});
