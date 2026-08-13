# 🚀 Despachante Gestão de Processos

Aplicação web para gestão de processos de despachantes, com suporte a múltiplos clientes e integração com Firebase.

A aplicação utiliza **um único código-fonte** para diferentes clientes. Cada cliente possui seu próprio projeto Firebase e sua própria configuração.

---

## 📋 Pré-requisitos

Instale:

* [Node.js](https://nodejs.org/)
* Firebase CLI
* Git
* Make

Verifique:

```bash
node --version
npm --version
firebase --version
make --version
```

Faça login no Firebase CLI:

```bash
firebase login
```

---

# 📁 Estrutura

```text
.
├── config/
│   ├── clients/
│   │   ├── claudio.json
│   │   └── ...
│   └── client.js
│
├── scripts/
│   └── create-client.js
│
├── firestore.rules
├── storage.rules
├── firebase.json
├── Makefile
└── README.md
```

### `config/clients`

Contém as configurações específicas de cada cliente.

Exemplo:

```text
config/clients/
├── claudio.json
├── victor.json
└── ...
```

Os arquivos JSON são **criados automaticamente** pelo comando `make create-client`.

---

# 🔥 Configuração do Firebase

A criação do projeto Firebase é feita **manualmente pelo Firebase Console**.

Depois disso, o projeto local automatiza a configuração necessária.

## 1. Criar o projeto

No Firebase Console, crie um novo projeto.

Exemplo:

```text
Nome do projeto:
projeto-victor
```

Depois da criação, o Firebase fornecerá um **Project ID**:

```text
projeto-victor-61cec
```

> O Project ID é utilizado apenas no momento da criação da configuração do cliente.

---

# 👤 Criando um novo cliente

Depois de criar o projeto no Firebase Console, execute:

```bash
make create-client CLIENT=victor PROJECT_ID=projeto-victor-61cec
```

O comando irá:

1. Verificar se o projeto Firebase existe.
2. Verificar se existe um Web App.
3. Criar o Web App caso ele não exista.
4. Obter automaticamente a configuração do Firebase.
5. Criar o arquivo:

```text
config/clients/victor.json
```

A configuração do projeto passa a ficar armazenada nesse arquivo.

### Importante

O `PROJECT_ID` **só precisa ser informado nesse momento**.

Depois disso, não é necessário informar novamente.

---

# ⚙️ Configuração manual do Firebase

Depois de criar o cliente, configure os serviços necessários pelo Firebase Console.

## Firestore

Acesse:

```text
Firestore Database
        ↓
Criar banco de dados
```

Escolha a localização desejada.

## Storage

Acesse:

```text
Storage
    ↓
Começar
```

Configure o bucket.

## Authentication

Acesse:

```text
Authentication
        ↓
Configurar método de login
```

Habilite os provedores utilizados pela aplicação.

---

# 🛠️ Comandos do Makefile

## Listar clientes

```bash
make clients
```

Exemplo:

```text
Clientes disponíveis:
  - claudio
  - victor
```

---

## Criar cliente

Utilizado **uma única vez por cliente**:

```bash
make create-client CLIENT=victor PROJECT_ID=projeto-victor-61cec
```

Esse comando cria automaticamente:

```text
config/clients/victor.json
```

---

## Verificar configuração

Depois que o cliente já foi criado:

```bash
make check CLIENT=victor
```

O comando verifica:

* existência do arquivo do cliente;
* Firebase `projectId`;
* Firebase `apiKey`;
* Firebase `appId`;
* logo;
* tema.

O `PROJECT_ID` não precisa ser informado.

---

## Gerar configuração

```bash
make generate-config CLIENT=victor
```

Esse comando gera:

```text
config/client.js
```

a partir de:

```text
config/clients/victor.json
```

---

# 🚀 Deploy

Para publicar um cliente:

```bash
make deploy CLIENT=victor
```

O comando automaticamente:

1. Valida a configuração.
2. Gera `config/client.js`.
3. Obtém o `projectId` do JSON do cliente.
4. Executa o deploy no projeto Firebase correto.

São publicados:

* Firebase Hosting
* Firestore Rules
* Storage Rules

As regras utilizadas são:

```text
firestore.rules
storage.rules
```

### Não é necessário informar o Project ID

Depois que o cliente foi criado:

```bash
make deploy CLIENT=victor
```

é suficiente.

O fluxo é:

```text
CLIENT=victor
      ↓
config/clients/victor.json
      ↓
firebase.projectId
      ↓
projeto-victor-61cec
      ↓
Firebase Deploy
```

Isso evita o risco de informar manualmente um projeto Firebase incorreto.

---

# 🔄 Fluxo completo para um novo cliente

## 1. Criar projeto no Firebase Console

Exemplo:

```text
Nome:
Projeto Victor

Project ID:
projeto-victor-61cec
```

## 2. Criar automaticamente a configuração

```bash
make create-client CLIENT=victor PROJECT_ID=projeto-victor-61cec
```

## 3. Configurar os serviços do Firebase

No Firebase Console:

```text
Firestore
Storage
Authentication
```

## 4. Validar

```bash
make check CLIENT=victor
```

## 5. Fazer deploy

```bash
make deploy CLIENT=victor
```

Pronto.

---

# 💻 Desenvolvimento local

Instale as dependências:

```bash
npm install
```

Execute a aplicação utilizando o comando definido no `package.json`.

Por exemplo:

```bash
npm run dev
```

---

# 🔐 Boas práticas

## Configurações do Firebase

As configurações públicas do Firebase Web App, como:

```text
apiKey
authDomain
projectId
storageBucket
messagingSenderId
appId
```

podem fazer parte da configuração do frontend.

A segurança dos dados deve ser garantida através das:

* Firebase Security Rules
* Authentication
* permissões do Firebase/Google Cloud

## Nunca versionar credenciais privadas

Não coloque no Git:

* Senhas
* Tokens privados
* Chaves privadas
* Service Account JSON
* Credenciais administrativas

---

# 🌳 Git

Depois de criar ou alterar a configuração de um cliente:

```bash
git status
```

Adicione os arquivos:

```bash
git add .
```

Faça o commit:

```bash
git commit -m "feat: add victor client"
```

Envie para o repositório:

```bash
git push
```

---

# 📌 Comandos rápidos

### Listar clientes

```bash
make clients
```

### Criar novo cliente

```bash
make create-client CLIENT=victor PROJECT_ID=projeto-victor-61cec
```

### Validar cliente

```bash
make check CLIENT=victor
```

### Gerar configuração

```bash
make generate-config CLIENT=victor
```

### Fazer deploy

```bash
make deploy CLIENT=victor
```

---

# 🏗️ Arquitetura Multi-Cliente

A aplicação utiliza um único código-fonte para todos os clientes.

```text
                       ┌─────────────────────┐
                       │  Código da aplicação │
                       └──────────┬──────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
             Cliente Claudio              Cliente Victor
                    │                           │
                    ▼                           ▼
          claudio.json                  victor.json
                    │                           │
                    ▼                           ▼
           Firebase Claudio              Firebase Victor
```

Cada cliente possui:

* seu próprio projeto Firebase;
* seu próprio Web App;
* sua própria configuração;
* seus próprios dados.

Enquanto isso, o código da aplicação, `firestore.rules`, `storage.rules` e demais configurações compartilhadas permanecem centralizados neste repositório.

---

# 🚀 Resumo do fluxo

```text
┌─────────────────────────────┐
│ 1. Criar projeto Firebase   │
│    manualmente no Console   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 2. make create-client       │
│    CLIENT=victor             │
│    PROJECT_ID=...            │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 3. Configurar Firestore,    │
│    Storage e Authentication │
│    no Firebase Console      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 4. make deploy              │
│    CLIENT=victor             │
└──────────────┬──────────────┘
               │
               ▼
       🎉 Cliente publicado
```
