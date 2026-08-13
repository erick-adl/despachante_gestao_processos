import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

import clientConfig from '../../config/client.js';

const firebaseConfig = clientConfig.firebase;

export const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);