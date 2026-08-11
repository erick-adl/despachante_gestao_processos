import {
    getFirestore,
    doc,
    getDoc,
    setDoc
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

import { firebaseApp } from './firebase.js';

export const db = getFirestore(firebaseApp);

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

    await setDoc(ref, data);
}