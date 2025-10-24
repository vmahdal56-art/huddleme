
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
import { getFirestore, collection, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js';
import { getAppCheck, initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app-check.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-functions.js';

let firebaseConfig; let isConfigured = false;
try {
  const mod = await import('./firebase-config.js');
  firebaseConfig = mod.firebaseConfig;
  isConfigured = !!firebaseConfig && firebaseConfig.projectId && firebaseConfig.projectId !== 'YOUR_PROJECT';
} catch (e) { isConfigured = false; }

let app=null, auth=null, db=null, storage=null, functions=null;
if(isConfigured){
  app = initializeApp(firebaseConfig);
  try {
    const cfg = await import('./firebase-config.js');
    const siteKey = cfg.appCheckSiteKey || cfg.firebaseConfig?.appCheckSiteKey;
    if(siteKey){
      initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true });
    }
  } catch(e) { /* no app check config */ }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app, 'europe-west3');
}

export { app, auth, db, storage, functions, httpsCallable, isConfigured,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut,
  collection, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, onSnapshot,
  ref, uploadBytesResumable, getDownloadURL };
