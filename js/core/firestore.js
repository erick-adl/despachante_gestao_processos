import {
    getFirestore,
    doc,
    getDoc,
    setDoc
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

export async function getOfficeData(userId) {
    const ref = doc(db, 'escritorios', userId);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data();
}

export async function saveOfficeData(userId, data) {
    const ref = doc(db, 'escritorios', userId);

    const cleanedData = cleanData(data);

    await setDoc(ref, cleanedData);
}