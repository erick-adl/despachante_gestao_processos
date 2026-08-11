import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

import { auth } from './firebase.js';

export function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
    return signOut(auth);
}

export function observeAuth(callback) {
    return onAuthStateChanged(auth, callback);
}