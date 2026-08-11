import { state } from './state.js';

import {
    uploadFile,
    deleteFile
} from './firebaseStorage.js';



export async function saveAnexoFile(key, filename, base64, mime) {
    const user = window.getCurrentUser();

    if (!user) {
        throw new Error('Usuário não autenticado.');
    }

    return await uploadFile(
        user.uid,
        key,
        base64,
        mime
    );
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
            const result = reader.result;

            // Remove "data:...;base64," deixando somente o Base64
            const base64 = result.split(',')[1];

            resolve(base64);
        };

        reader.onerror = () => {
            reject(reader.error);
        };

        reader.readAsDataURL(file);
    });
}