
import { auth, db, isConfigured, collection, addDoc, doc, setDoc, onSnapshot, query, where, orderBy, serverTimestamp, getDocs } from '../firebase.js';

function threadId(ownerUid, seekerUid, listingId){ return `${ownerUid}_${seekerUid}_${listingId}`; }

export async function ensureThread(ownerUid, seekerUid, listing){
  const id = threadId(ownerUid, seekerUid, listing.id||listing.listingId);
  const ref = doc(db,'threads', id);
  await setDoc(ref, {
    listingId: listing.id||listing.listingId,
    listingTitle: listing.title,
    ownerUid, seekerUid,
    participants: [ownerUid, seekerUid],
    updatedAt: serverTimestamp()
  }, { merge: true });
  return id;
}

export function listenThreads(uid, cb){
  const qy = query(collection(db,'threads'), where('participants','array-contains', uid), orderBy('updatedAt','desc'));
  return onSnapshot(qy, snap=> cb(snap.docs.map(d=>({id:d.id, ...d.data()}))));
}

export function listenMessages(threadId, cb){
  const qy = query(collection(db,'threads', threadId, 'messages'), orderBy('ts','asc'));
  return onSnapshot(qy, snap=> cb(snap.docs.map(d=>({id:d.id, ...d.data()}))));
}

export async function sendMessage(threadId, fromUid, text){
  await addDoc(collection(db,'threads', threadId, 'messages'), {
    fromUid, text, ts: serverTimestamp()
  });
  await setDoc(doc(db,'threads', threadId), { updatedAt: serverTimestamp() }, { merge:true });
}

import { storage, ref, uploadBytesResumable, getDownloadURL, db, collection, addDoc, doc, setDoc, serverTimestamp } from '../firebase.js';

export async function uploadChatImages(threadId, uid, files){
  const urls = [];
  for(const f of files){
    const path = `chat-attachments/${threadId}/${uid}/${Date.now()}-${f.name}`;
    const r = ref(storage, path);
    const snap = await uploadBytesResumable(r, f);
    const url = await getDownloadURL(snap.ref);
    urls.push(url);
  }
  return urls;
}

export async function sendMessageWithImages(threadId, fromUid, text, imageUrls){
  await addDoc(collection(db,'threads', threadId, 'messages'), {
    fromUid, text, images: imageUrls, ts: serverTimestamp(), seenBy: [fromUid]
  });
  await setDoc(doc(db,'threads', threadId), { updatedAt: serverTimestamp() }, { merge:true });
}

export async function markSeen(threadId, uid){
  // naive: mark latest 50 as seen
  const qs = await import('../firebase.js');
  const { getDocs, query, orderBy, limit } = qs;
  const qy = query(collection(db,'threads', threadId, 'messages'), orderBy('ts','desc'), limit(50));
  const snap = await getDocs(qy);
  const batchMod = (await import('../firebase.js')).writeBatch(db);
  snap.docs.forEach(d=>{
    const data = d.data();
    if(data.fromUid !== uid){
      batchMod.update(d.ref, { seenBy: (data.seenBy||[]).concat([uid]) });
    }
  });
  await batchMod.commit();
}

export async function getThumbUrl(image){ if(!image||!image.path) return image&&image.url; const tpath=image.path.replace('chat-attachments/','chat-attachments/_thumbs/'); try{ const tRef = ref(storage, tpath); return await getDownloadURL(tRef);}catch(e){ return image.url; } }
