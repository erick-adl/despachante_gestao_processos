# despachante_gestao_processos
Despachante Gestão de Processos
│
├── Visão geral
├── Estrutura do projeto
├── Pré-requisitos
├── Configuração de um novo cliente
├── Estrutura do arquivo de cliente
├── Comandos Make
│   ├── make clients
│   ├── make check CLIENT=...
│   ├── make generate-config CLIENT=...
│   ├── make use-firebase CLIENT=...
│   └── make deploy CLIENT=...
├── Firebase
├── Domínio personalizado
├── Logo e identidade visual
├── Adicionando um novo cliente
└── Fluxo recomendado de deploy

# 1. Criar configuração
config/clients/novo.json

# 2. Validar
make check CLIENT=novo

# 3. Selecionar cliente
make generate-config CLIENT=novo

# 4. Selecionar Firebase
make use-firebase CLIENT=novo

# 5. Publicar
make deploy CLIENT=novo