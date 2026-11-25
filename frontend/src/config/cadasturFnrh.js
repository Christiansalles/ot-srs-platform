// Conteúdo da página /cadastur-e-fnrh (item 7 da fase 2 da Proposta).
// Cada trecho resume uma página oficial do governo federal, citada em `fontes`.
// Não acrescente regra, prazo ou passo que não esteja na página citada: na dúvida, fica só o link.

export const DATA_DA_CONFERENCIA = '25/11/2026';

const FONTES = {
  servicoCadastur: {
    rotulo: 'Cadastrar prestador de serviços turísticos (gov.br)',
    url: 'https://www.gov.br/pt-br/servicos/cadastrar-prestadora-de-servico-turistico',
  },
  perguntasCadastur: {
    rotulo: 'Perguntas frequentes sobre o Cadastur (gov.br)',
    url: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/quero-ser-mei/cadastro-de-atividade-turistica-cadastur/perguntas-frequentes-sobre-o-cadastur',
  },
  paginaFnrh: {
    rotulo: 'Ficha Nacional de Registro de Hóspedes (Ministério do Turismo)',
    url: 'https://www.gov.br/turismo/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/ficha-nacional-de-registro-de-hospedes',
  },
  perguntasFnrh: {
    rotulo: 'Perguntas frequentes sobre a FNRH Digital (Ministério do Turismo)',
    url: 'https://www.gov.br/turismo/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/ficha-nacional-de-registro-de-hospedes/faq',
  },
  obrigatoriedadeFnrh: {
    rotulo: 'Ficha Digital de Hóspedes entra em fase obrigatória (Serpro)',
    url: 'https://www.serpro.gov.br/menu/noticias/noticias-2026/ficha-digital-de-hospedes-e-obrigatoria-mas-adesao-ainda-alcanca-cerca-de-20-do-setor',
  },
};

export const SECOES = [
  {
    id: 'cadastur',
    titulo: 'Cadastur',
    resumo: 'Cadastro do Ministério do Turismo para quem presta serviços turísticos.',
    blocos: [
      {
        titulo: 'O que é',
        paragrafos: [
          'O Cadastro de Prestadores de Serviços Turísticos (Cadastur), do Ministério do Turismo, é o cadastro de pessoas físicas e jurídicas que atuam no setor turístico. Com o Certificado Cadastur, o prestador atua de acordo com a Lei do Turismo.',
        ],
        fontes: [FONTES.servicoCadastur],
      },
      {
        titulo: 'Quem deve se cadastrar',
        paragrafos: [
          'O cadastro é obrigatório para meios de hospedagem, agências de turismo, transportadoras turísticas, organizadoras de eventos, parques temáticos, acampamentos turísticos e guias de turismo.',
          'Para outras atividades, como restaurantes, cafeterias e bares, locadoras de veículos para turistas, casas de espetáculo e centros de convenções, o cadastro é opcional.',
        ],
        fontes: [FONTES.perguntasCadastur],
      },
      {
        titulo: 'Custo e validade',
        paragrafos: [
          'O cadastro e a renovação são gratuitos. O cadastro vale por dois anos para pessoas jurídicas e por cinco anos para guias de turismo.',
        ],
        fontes: [FONTES.perguntasCadastur],
      },
      {
        titulo: 'Como se cadastrar',
        passos: [
          'Acesse o site do Cadastur e entre com a conta gov.br.',
          'Preencha o formulário eletrônico de cadastro da sua atividade.',
          'Assine o Termo de Responsabilidade Eletrônico e envie.',
          'Depois da análise, o certificado fica disponível em até 5 dias úteis.',
        ],
        fontes: [FONTES.perguntasCadastur],
      },
    ],
    links: [
      { rotulo: 'Site do Cadastur', url: 'https://cadastur.turismo.gov.br/' },
      FONTES.servicoCadastur,
      FONTES.perguntasCadastur,
    ],
  },
  {
    id: 'fnrh-digital',
    titulo: 'FNRH Digital',
    resumo: 'Ficha de registro de hóspedes em formato digital, para meios de hospedagem.',
    blocos: [
      {
        titulo: 'O que é',
        paragrafos: [
          'A Ficha Nacional de Registro de Hóspedes Digital (FNRH Digital) foi desenvolvida pelo Serpro para o Ministério do Turismo e substitui o preenchimento da ficha em papel. Ela tem pré-check-in, check-in e check-out.',
        ],
        fontes: [FONTES.obrigatoriedadeFnrh, FONTES.perguntasFnrh],
      },
      {
        titulo: 'Quem usa',
        paragrafos: [
          'A ficha digital é obrigatória para os meios de hospedagem de todo o país. Para usar o sistema, o meio de hospedagem precisa estar regular no Cadastur.',
        ],
        fontes: [FONTES.obrigatoriedadeFnrh, FONTES.perguntasFnrh],
      },
      {
        titulo: 'Com ou sem sistema de gestão',
        paragrafos: [
          'Hotéis que usam sistema de gestão (PMS) podem integrá-lo à plataforma por API, com uma chave de acesso gerada no sistema da FNRH. Quem não tem sistema de gestão faz tudo pela própria plataforma, entrando com a conta gov.br da pessoa indicada no Cadastur como responsável pela FNRH.',
        ],
        fontes: [FONTES.obrigatoriedadeFnrh, FONTES.perguntasFnrh],
      },
      {
        titulo: 'Para o hóspede',
        paragrafos: [
          'O hóspede pode fazer o pré-check-in antes de chegar, por um link enviado pelo meio de hospedagem ou por QR Code. A conta gov.br é o acesso recomendado. Estrangeiros não precisam de CPF nem de conta gov.br: usam o passaporte ou outro documento de identificação.',
        ],
        fontes: [FONTES.obrigatoriedadeFnrh, FONTES.perguntasFnrh],
      },
    ],
    links: [
      FONTES.paginaFnrh,
      { rotulo: 'Entrar como meio de hospedagem', url: 'https://fnrh.turismo.serpro.gov.br/FNRH_SRH/Login' },
      { rotulo: 'Entrar como hóspede', url: 'https://fnrh.turismo.serpro.gov.br/FNRH_Hospede/Login' },
      FONTES.perguntasFnrh,
    ],
  },
];
