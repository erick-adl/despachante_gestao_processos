# despachante_gestao_processos

Sistema de Gestão de Processos para despachantes.

## Estrutura

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
│   ├── make deploy CLIENT=...
│   └── make create-client CLIENT=...
├── Firebase
├── Domínio personalizado
├── Logo e identidade visual
├── Adicionando um novo cliente
└── Fluxo recomendado de deploy


# Configuração de um novo cliente

A aplicação utiliza um único repositório para todos os clientes.

Cada cliente possui:

- Projeto Firebase próprio
- Web App próprio
- Firestore próprio
- Storage próprio
- Configuração visual própria
- Logo próprio
- Domínio próprio (opcional)

As configurações ficam em:

```text
config/clients/
├── claudio.json
├── teste.json
└── ...


Comandos Make
Listar clientes
make clients

Lista todos os clientes configurados em config/clients/.

Verificar configuração
make check CLIENT=claudio

Valida se o cliente possui:

Firebase configurado
Logo configurado
Tema configurado
Domínio (opcional)
Gerar configuração
make generate-config CLIENT=claudio

Gera o arquivo:

config/client.js

a partir da configuração do cliente.

Normalmente não é necessário executar esse comando manualmente, pois ele é executado automaticamente durante o make deploy.

Selecionar Firebase
make use-firebase CLIENT=claudio

Seleciona o projeto Firebase configurado para o cliente.

Também é executado automaticamente durante o make deploy.

Criar novo cliente
make create-client CLIENT=novo

Cria automaticamente:

Projeto Google Cloud/Firebase
Firebase
Web App
Arquivo config/clients/novo.json

O script reutiliza o projeto e o Web App caso eles já existam.

Após criar o cliente

A criação do Firestore e Storage é feita manualmente no Firebase Console.

Para o Firestore, utilizar a região:

nam5

Depois, configurar o Storage conforme necessário.

Deploy
make deploy CLIENT=claudio

O deploy executa automaticamente:

Validação da configuração
Geração do config/client.js
Seleção do Firebase
Deploy do Hosting
Deploy das Firestore Rules
Deploy das Storage Rules

Os arquivos de regras são:

firestore.rules
storage.rules

O firebase.json aponta para esses arquivos.

Exemplo
make deploy CLIENT=claudio

ou:

make deploy CLIENT=teste
Estrutura do arquivo de cliente

Exemplo:

{
  "id": "claudio",
  "name": "Despachante Claudio Luz",
  "domain": "sistema.despclaudioluz.com",
  "logo": "assets/images/logo-teste.png",
  "firebase": {
    "apiKey": "...",
    "authDomain": "...",
    "projectId": "...",
    "storageBucket": "...",
    "messagingSenderId": "...",
    "appId": "..."
  },
  "theme": {
    "primary": "#2196F3",
    "primaryDeep": "#1976D2",
    "primaryGhost": "#E3F2FD"
  }
}
Domínio

O domínio é opcional.

Enquanto o cliente não tiver domínio:

"domain": ""

Depois que o domínio estiver configurado:

"domain": "sistema.cliente.com.br"
Logo e identidade visual

Cada cliente pode possuir sua própria configuração visual.

O logo é definido no arquivo do cliente:

"logo": "assets/images/logo-teste.png"

As cores são definidas em:

"theme": {
  "primary": "#2196F3",
  "primaryDeep": "#1976D2",
  "primaryGhost": "#E3F2FD"
}
Fluxo recomendado
Cliente novo
make create-client CLIENT=novo

Depois, no Firebase Console:

1. Criar Firestore
2. Criar Storage
3. Configurar Authentication

Depois verificar:

make check CLIENT=novo

E publicar:

make deploy CLIENT=novo
Alteração no sistema

Depois de alterar o código:

make deploy CLIENT=claudio

Para outro cliente:

make deploy CLIENT=teste
Arquitetura

Cada cliente possui seu próprio projeto Firebase:

                    GitHub
                      │
             Código da aplicação
                      │
        ┌─────────────┴─────────────┐
        │                           │
   Cliente Cláudio             Cliente Teste
        │                           │
        ▼                           ▼
 Firebase Cláudio              Firebase Teste
        │                           │
   ┌────┼────┐                 ┌────┼────┐
   │    │    │                 │    │    │
Hosting Firestore Storage    Hosting Firestore Storage

Isso mantém os dados, autenticação, armazenamento e infraestrutura de cada cliente isolados.



### Uma pequena correção no seu README atual


Seu fluxo atual diz:


```text
1. Criar configuração
config/clients/novo.json

Isso ficou desatualizado.

Agora o correto é:

make create-client CLIENT=novo