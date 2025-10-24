
import { auth, db, isConfigured, collection, addDoc, doc, setDoc, onSnapshot, query, where, orderBy, getDocs, deleteDoc } from '../firebase.js';

export async function saveSearch(uid, params){
  const ref = await addDoc(collection(db,'users', uid, 'savedSearches'), {
    params, email:true, createdAt: Date.now()
  });
  return ref.id;
}

export async function deleteSearch(uid, id){
  await deleteDoc(doc(db,'users', uid, 'savedSearches', id));
}

export async function getSavedSearches(uid){
  const snap = await getDocs(collection(db,'users', uid, 'savedSearches'));
  return snap.docs.map(d=>({id:d.id, ...d.data()}));
}
