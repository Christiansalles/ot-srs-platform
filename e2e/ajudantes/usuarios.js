// Os usuários de desenvolvimento que o seed cria, com os mesmos valores padrão do
// docker-compose.yml. Se o compose subir com ADMIN_* ou EDITOR_* trocados, exporte as
// mesmas variáveis antes de rodar os testes.
const USUARIOS = {
  administrador: {
    email: process.env.ADMIN_EMAIL ?? 'admin@observatorio.local',
    senha: process.env.ADMIN_SENHA ?? 'senha-admin-local-nao-usar-em-producao',
  },
  editor: {
    email: process.env.EDITOR_EMAIL ?? 'editor@observatorio.local',
    senha: process.env.EDITOR_SENHA ?? 'senha-editor-local-nao-usar-em-producao',
  },
};

export function usuarioDe(perfil) {
  const usuario = USUARIOS[perfil];
  if (!usuario) {
    throw new Error(`Perfil desconhecido: "${perfil}". Use "administrador" ou "editor".`);
  }
  return usuario;
}
