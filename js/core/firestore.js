import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    deleteDoc,
    runTransaction
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

import { firebaseApp } from './firebase.js';

export const db = getFirestore(firebaseApp);

function cleanData(value) {
    if (Array.isArray(value)) {
        return value.map(cleanData);
    }

    if (value !== null && typeof value === 'object') {
        const result = {};

        for (const [key, val] of Object.entries(value)) {
            if (val !== undefined) {
                result[key] = cleanData(val);
            }
        }

        return result;
    }

    return value;
}

/* =========================
   CLIENTES
   ========================= */

export async function getClients() {
    const clientsRef = collection(
        db,
        'clientes'
    );

    const snapshot = await getDocs(clientsRef);

    return snapshot.docs.map(snapshotDoc => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data()
    }));
}

export async function getClient(clientId) {
    const clientRef = doc(
        db,
        'clientes',
        clientId
    );

    const snapshot = await getDoc(clientRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data()
    };
}

export async function saveClient(client) {
    const clientRef = doc(
        db,
        'clientes',
        client.id
    );

    await setDoc(
        clientRef,
        cleanData(client)
    );
}

export async function deleteClient(clientId) {
    const clientRef = doc(
        db,
        'clientes',
        clientId
    );

    await deleteDoc(clientRef);
}

/* =========================
   SERVIÇOS
   ========================= */

export async function getServices(clienteId) {
    const servicesRef = collection(
        db,
        'clientes',
        clienteId,
        'servicos'
    );

    const snapshot = await getDocs(servicesRef);

    return snapshot.docs.map(snapshotDoc => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data()
    }));
}

export async function getService(clienteId, serviceId) {
    const serviceRef = doc(
        db,
        'clientes',
        clienteId,
        'servicos',
        serviceId
    );

    const snapshot = await getDoc(serviceRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data()
    };
}

export async function saveService(clienteId, service) {
    const serviceRef = doc(
        db,
        'clientes',
        clienteId,
        'servicos',
        service.id
    );

    await setDoc(
        serviceRef,
        cleanData(service)
    );
}

export async function deleteService(clienteId, serviceId) {
    const serviceRef = doc(
        db,
        'clientes',
        clienteId,
        'servicos',
        serviceId
    );

    await deleteDoc(serviceRef);
}

/* =========================
   STATUS DE SERVIÇO
   ========================= */

const STATUS_SERVICO_PADRAO = [
    { id: 'em-andamento', nome: 'Em andamento', concluido: false },
    { id: 'aguardando-detran', nome: 'Aguardando DETRAN', concluido: false },
    { id: 'aguardando-pagamento', nome: 'Aguardando pagamento', concluido: false },
    { id: 'concluido', nome: 'Concluído', concluido: true }
];

export async function getServiceStatuses() {
    const statusesRef = collection(db, 'statusServicos');
    const snapshot = await getDocs(statusesRef);

    return snapshot.docs
        .filter(snapshotDoc => snapshotDoc.id !== '_meta')
        .map(snapshotDoc => ({
            id: snapshotDoc.id,
            ...snapshotDoc.data()
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function ensureServiceStatuses() {
    const metaRef = doc(db, 'statusServicos', '_meta');
    const metaSnapshot = await getDoc(metaRef);

    if (!metaSnapshot.exists()) {
        await Promise.all([
            setDoc(metaRef, { initialized: true }),
            ...STATUS_SERVICO_PADRAO.map(status =>
                setDoc(doc(db, 'statusServicos', status.id), status)
            )
        ]);
    }

    return getServiceStatuses();
}

export async function saveServiceStatus(status) {
    const statusRef = doc(db, 'statusServicos', status.id);

    await setDoc(statusRef, cleanData(status));
}

export async function deleteServiceStatus(statusId) {
    await deleteDoc(doc(db, 'statusServicos', statusId));
}

/* =========================
   CONFIGURAÇÕES
   ========================= */

export async function getConfiguracoes() {
    const configRef = doc(
        db,
        'configuracoes',
        'geral'
    );

    const snapshot = await getDoc(configRef);

    if (!snapshot.exists()) {
        return {};
    }

    return snapshot.data();
}

export async function saveConfiguracoes(data) {
    const configRef = doc(
        db,
        'configuracoes',
        'geral'
    );

    await setDoc(
        configRef,
        cleanData(data),
        { merge: true }
    );
}

/* =========================
   AGENDA
   ========================= */

export async function getAgenda() {
    const agendaRef = collection(
        db,
        'agenda'
    );

    const snapshot = await getDocs(agendaRef);

    return snapshot.docs.map(snapshotDoc => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data()
    }));
}

export async function saveAgenda(item) {
    const agendaRef = doc(
        db,
        'agenda',
        item.id
    );

    await setDoc(
        agendaRef,
        cleanData(item)
    );
}

export async function deleteAgenda(itemId) {
    const agendaRef = doc(
        db,
        'agenda',
        itemId
    );

    await deleteDoc(agendaRef);
}

export async function createClientWithCode(client) {
    const counterRef = doc(
        db,
        'configuracoes',
        'contadorClientes'
    );

    let codigo;

    await runTransaction(db, async transaction => {
        const counterSnapshot = await transaction.get(counterRef);

        const ultimoCodigo = counterSnapshot.exists()
            ? Number(counterSnapshot.data().ultimoCodigo) || 0
            : 0;

        codigo = ultimoCodigo + 1;

        transaction.set(
            counterRef,
            {
                ultimoCodigo: codigo
            },
            { merge: true }
        );
    });

    const clientRef = doc(
        db,
        'clientes',
        client.id
    );

    await setDoc(
        clientRef,
        cleanData({
            ...client,
            codigo
        })
    );

    return codigo;
}
