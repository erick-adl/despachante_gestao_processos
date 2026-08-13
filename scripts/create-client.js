const { execSync } = require('child_process');
const fs = require('fs');

const client = process.argv[2];
const projectId = process.argv[3];

if (!client || !projectId) {
    console.error(
        'Uso: make create-client CLIENT=victor PROJECT_ID=projeto-victor-61cec'
    );
    process.exit(1);
}

function run(command) {
    console.log(`> ${command}`);

    return execSync(command, {
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'inherit']
    }).trim();
}

console.log(`\nConfigurando cliente: ${client}`);
console.log(`Projeto Firebase: ${projectId}\n`);

// ---------------------------------------------------------
// 1. Verificar se o projeto existe
// ---------------------------------------------------------

console.log('Verificando projeto Firebase...');

const projectsJson = run('firebase projects:list --json');
const projectsData = JSON.parse(projectsJson);

const projectExists = projectsData.result?.some(
    project => project.projectId === projectId
);

if (!projectExists) {
    throw new Error(
        `O projeto Firebase "${projectId}" não foi encontrado.`
    );
}

console.log(`Projeto ${projectId} encontrado.`);

// ---------------------------------------------------------
// 2. Verificar/Criar Web App
// ---------------------------------------------------------

console.log('\nVerificando Web App...');

const appsJson = run(
    `firebase apps:list --project ${projectId} --json`
);

const appsData = JSON.parse(appsJson);

let webApp = appsData.result?.find(
    app => app.platform === 'WEB'
);

if (!webApp) {
    console.log('Web App não encontrado. Criando...');

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
    console.log(`Web App já existe: ${webApp.appId}`);
}

if (!webApp) {
    throw new Error('Não foi possível encontrar o Web App.');
}

// ---------------------------------------------------------
// 3. Obter configuração do Firebase
// ---------------------------------------------------------

console.log('\nObtendo configuração do Firebase...');

const sdkConfigJson = run(
    `firebase apps:sdkconfig WEB ${webApp.appId} --json`
);

const sdkData = JSON.parse(sdkConfigJson);

const firebaseConfig = sdkData.result.sdkConfig;

// ---------------------------------------------------------
// 4. Criar diretório de clientes
// ---------------------------------------------------------

fs.mkdirSync('config/clients', {
    recursive: true
});

// ---------------------------------------------------------
// 5. Criar configuração do cliente
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

console.log(`\nArquivo criado: ${output}`);

console.log('\n========================================');
console.log('Cliente configurado com sucesso!');
console.log(`Cliente: ${client}`);
console.log(`Firebase: ${projectId}`);
console.log(`Config: ${output}`);
console.log('========================================\n');