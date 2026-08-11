import { state } from './state.js';
import { showToast } from '../components/toast.js';
import { saveOfficeData } from './firestore.js';
import {
    uploadFile,
    deleteFile
} from './firebaseStorage.js';

export async function saveData() {
    const user = window.getCurrentUser();
    if (!user) {
        throw new Error('Usuário não autenticado.');
    }

    await saveOfficeData(user.uid, state.DATA);
}

export async function saveAnexoFile(key, filename, base64, mime) {
    const user = window.getCurrentUser();

    if (!user) {
        throw new Error('Usuário não autenticado.');
    }

    const url = await uploadFile(
        user.uid,
        key,
        base64,
        mime
    );

    return {
        key,
        filename,
        mime,
        url
    };
}

export async function getAnexoFile(key) {
    return null;
}

export async function deleteAnexoFile(key) {
    const user = window.getCurrentUser();

    if (!user) {
        throw new Error('Usuário não autenticado.');
    }

    await deleteFile(user.uid, key);
}

export function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result.split(',')[1]);
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}