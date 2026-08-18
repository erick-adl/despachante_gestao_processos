import {
    getStorage,
    ref,
    uploadString,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js';

import { firebaseApp } from './firebase.js';

export const storage = getStorage(firebaseApp);

export async function uploadFile(userId, key, base64, mime) {
    const fileRef = ref(storage, `escritorios/${userId}/${key}`);

    await uploadString(
        fileRef,
        base64,
        'base64',
        {
            contentType: mime
        }
    );

    return await getDownloadURL(fileRef);
}

export async function getFileDownloadUrl(userId, key) {
    const fileRef = ref(storage, `escritorios/${userId}/${key}`);

    return await getDownloadURL(fileRef);
}

export async function deleteFile(userId, key) {
    const fileRef = ref(storage, `escritorios/${userId}/${key}`);

    try {
        await deleteObject(fileRef);
    } catch (error) {
        if (error.code !== 'storage/object-not-found') {
            throw error;
        }
    }
}
