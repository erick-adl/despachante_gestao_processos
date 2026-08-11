import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: 'AIzaSyB3p_q3rpy2MmFx4BYUmUUlpQwTmWAZ7_c',
    authDomain: 'projeto-victor-61cec.firebaseapp.com',
    projectId: 'projeto-victor-61cec',
    storageBucket: 'projeto-victor-61cec.firebasestorage.app',
    messagingSenderId: '592034080425',
    appId: '1:592034080425:web:0caf918f843d556194abb8',
    measurementId: 'G-1ZVLRWRF73'
};

const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export { firebaseApp };