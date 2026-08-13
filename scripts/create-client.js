const { execSync } = require('child_process');
const fs = require('fs');

const client = process.argv[2];

if (!client) {
    console.error('Uso: node scripts/create-client.js <cliente>');
    process.exit(1);
}

const projectId = `despachante-${client}`;

function run(command) {
    console.log(`> ${command}`);

    return execSync(command, {
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'inherit']
    }).trim();
}

function commandSucceeds(command) {
    try {
        execSync(command, {
            stdio: 'ignore'
        });

        return true;
    } catch {
        return false;
    }
}

console.log(`\nCriando/configurando cliente: ${client}`);
console.log(`Projeto Firebase: ${projectId}\n`);

// ---------------------------------------------------------
// 1. Verificar se o projeto já existe
// ---------------------------------------------------------

let firebaseProjectExists = false;

try {
    const projectsJson = run('firebase projects:list --json');
    const projectsData = JSON.parse(projectsJson);

    firebaseProjectExists = projectsData.result?.some(
        project => project.projectId === projectId
    ) ?? false;
} catch {
    firebaseProjectExists = false;
}

// ---------------------------------------------------------
// 2. Criar projeto se necessário
// ---------------------------------------------------------

if (!firebaseProjectExists) {
    console.log(`\nProjeto ${projectId} não encontrado.`);

    try {
        run(
            `firebase projects:create ${projectId} --display-name="Despachante ${client}"`
        );

        firebaseProjectExists = true;
    } catch {
        console.log(
            '\nA criação do projeto falhou. Verificando se ele foi criado parcialmente...'
        );

        // Caso o projeto Google Cloud tenha sido criado, mas
        // o Firebase não tenha sido adicionado, tentamos adicionar.
        try {
            run(`firebase projects:addfirebase`);

            firebaseProjectExists = true;
        } catch {
            throw new Error(
                `Não foi possível criar/configurar o projeto ${projectId}.`
            );
        }
    }
} else {
    console.log(`\nProjeto ${projectId} já existe. Reutilizando.`);
}

// ---------------------------------------------------------
// 3. Selecionar projeto
// ---------------------------------------------------------

run(`firebase use ${projectId}`);

// ---------------------------------------------------------
// 4. Habilitar APIs necessárias
// ---------------------------------------------------------

console.log('\nHabilitando Cloud Firestore API...');

run(
    `gcloud services enable firestore.googleapis.com --project=${projectId}`
);

console.log('Cloud Firestore API habilitada.');


// ---------------------------------------------------------
// 5. Configurar regras do Firestore
// ---------------------------------------------------------



// ---------------------------------------------------------
// 6. Verificar/Criar Web App
// ---------------------------------------------------------

const appsJson = run(
    `firebase apps:list --project ${projectId} --json`
);

const appsData = JSON.parse(appsJson);

let webApp = appsData.result?.find(
    app => app.platform === 'WEB'
);

if (!webApp) {
    console.log('\nWeb App não encontrado. Criando...');

    run(
        `firebase apps:create web "Despachante ${client}" --project ${projectId}`
    );

    const updatedAppsJson = run(
        `firebase apps:list --project ${projectId} --json`
    );

    const updatedAppsData = JSON.parse(updatedAppsJson);

    webApp = updatedAppsData.result?.find(
        app => app.platform === 'WEB'
    );
} else {
    console.log(`\nWeb App já existe: ${webApp.appId}`);
}

if (!webApp) {
    throw new Error('Não foi possível encontrar o Web App.');
}

// ---------------------------------------------------------
// 7. Obter configuração do Firebase
// ---------------------------------------------------------

console.log('\nObtendo configuração do Firebase...');

const sdkConfigJson = run(
    `firebase apps:sdkconfig WEB ${webApp.appId} --json`
);

const sdkData = JSON.parse(sdkConfigJson);

const firebaseConfig = sdkData.result.sdkConfig;

// ---------------------------------------------------------
// 8. Criar/Atualizar configuração do cliente
// ---------------------------------------------------------

const clientConfig = {
    id: client,
    name: `Despachante ${client}`,
    domain: "",
    logo: "assets/images/logo-teste.png",

    firebase: firebaseConfig,

    theme: {
        primary: "#2196F3",
        primaryDeep: "#1976D2",
        primaryGhost: "#E3F2FD"
    }
};

const output = `config/clients/${client}.json`;

fs.writeFileSync(
    output,
    JSON.stringify(clientConfig, null, 2) + '\n'
);

console.log(`\nArquivo criado/atualizado: ${output}`);

console.log('\n========================================');
console.log('Cliente configurado com sucesso!');
console.log(`Cliente: ${client}`);
console.log(`Firebase: ${projectId}`);
console.log(`Config: ${output}`);
console.log('========================================\n');