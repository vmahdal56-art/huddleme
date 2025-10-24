
import { auth, db, storage, isConfigured, collection, addDoc, setDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDocs, onSnapshot, serverTimestamp, ref, uploadBytesResumable, getDownloadURL } from '../firebase.js';
import { currency, getLang, t } from './util.js';

export async function getMyListings(uid){
  const q = query(collection(db,'listings'), where('ownerUid','==', uid), orderBy('createdAt','desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d=>({id:d.id, ...d.data()}));
}

export async function createListing(uid, data){
  data.ownerUid = uid;
  data.createdAt = serverTimestamp();
  data.status = data.status || 'pending';
  const docRef = await addDoc(collection(db,'listings'), data);
  return docRef.id;
}

export async function updateListing(id, data){
  await updateDoc(doc(db,'listings', id), data);
}

export async function removeListing(id){
  await deleteDoc(doc(db,'listings', id));
}

export function uploadPhotos(uid, files, onProgress){
  return Promise.all(Array.from(files).map(file=>new Promise((resolve,reject)=>{
    const path = `listing-photos/${uid}/${Date.now()}-${file.name}`;
    const r = ref(storage, path);
    const task = uploadBytesResumable(r, file);
    task.on('state_changed', (snap)=>{
      if(onProgress){ onProgress(Math.round(100*snap.bytesTransferred/snap.totalBytes)); }
    }, reject, async ()=>{
      const url = await getDownloadURL(task.snapshot.ref);
      resolve(url);
    });
  })));
}
