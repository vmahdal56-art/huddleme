
export async function readFileAsDataURL(file){
  return new Promise((res, rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
}

export async function loadImage(src){
  return new Promise((res, rej)=>{ const img=new Image(); img.crossOrigin='anonymous'; img.onload=()=>res(img); img.onerror=rej; img.src=src; });
}

export async function compressImage(file, {maxW=1600, maxH=1200, quality=0.85}={}){
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);
  const w = img.width, h = img.height;
  const ratio = Math.min(maxW/w, maxH/h, 1);
  const cw = Math.round(w*ratio), ch = Math.round(h*ratio);
  const canvas = document.createElement('canvas'); canvas.width=cw; canvas.height=ch;
  const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, cw, ch);
  const blob = await new Promise(res=>canvas.toBlob(res, 'image/jpeg', quality));
  return new File([blob], file.name.replace(/\.[^.]+$/, '')+".jpg", { type:'image/jpeg' });
}

export async function previewFiles(files, target){
  const arr = Array.from(files);
  target.innerHTML = arr.map(()=>'<div class="col-4 mb-2"><div class="ratio ratio-4x3 bg-light rounded skeleton"></div></div>').join('');
  const thumbs = arr.map(f=>{
    const url = URL.createObjectURL(f);
    return `<div class='col-4 mb-2'><img class='img-fluid rounded' src='${url}' alt='preview'></div>`;
  });
  target.innerHTML = thumbs.join('');
}


export async function isJpeg(file){ const n=(file&&file.name||"").toLowerCase(); return (file&&file.type==="image/jpeg") || n.endswith(".jpg") || n.endswith(".jpeg"); }

export async function getExifOrientation(file){
  const buf = await file.arrayBuffer();
  const view = new DataView(buf);
  if(view.getUint16(0, false) != 0xFFD8) return -1; // not JPEG
  let offset = 2;
  const length = view.byteLength;
  while (offset < length) {
    const marker = view.getUint16(offset, false); offset += 2;
    if (marker == 0xFFE1) { // APP1
      const exifLength = view.getUint16(offset, false); offset += 2;
      if (view.getUint32(offset, false) != 0x45786966) return -1; // "Exif"
      offset += 6; // skip Exif\0\0
      const little = view.getUint16(offset, false) == 0x4949; offset += 2; // TIFF byte order
      offset += 2; // 42
      let ifdOffset = view.getUint32(offset, little); offset -= 4; offset += ifdOffset;
      const entries = view.getUint16(offset, little); offset += 2;
      for (let i=0;i<entries;i++){
        const tag = view.getUint16(offset + i*12, little);
        if(tag == 0x0112){ // Orientation
          const valOffset = offset + i*12 + 8;
          const orientation = view.getUint16(valOffset, little);
          return orientation;
        }
      }
    } else if ((marker & 0xFF00) != 0xFF00) break; else { offset += view.getUint16(offset, false); }
  }
  return -1;
}

export async function compressImage(file, {maxW=1600, maxH=1200, quality=0.85}={}){
  // Override previous definition: now handles EXIF orientation
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);
  const ori = (await isJpeg(file)) ? await getExifOrientation(file) : -1;
  let w = img.width, h = img.height;
  const ratio = Math.min(maxW/w, maxH/h, 1);
  let cw = Math.round(w*ratio), ch = Math.round(h*ratio);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // Handle rotations 5,6,7,8 swap width/height
  const rotated = [5,6,7,8].includes(ori);
  canvas.width = rotated ? ch : cw;
  canvas.height = rotated ? cw : ch;
  // Transform according to orientation
  switch(ori){
    case 2: ctx.translate(canvas.width,0); ctx.scale(-1,1); break; // flip H
    case 3: ctx.translate(canvas.width,canvas.height); ctx.rotate(Math.PI); break; // 180
    case 4: ctx.translate(0,canvas.height); ctx.scale(1,-1); break; // flip V
    case 5: ctx.rotate(0.5*Math.PI); ctx.scale(1,-1); break;
    case 6: ctx.translate(canvas.width,0); ctx.rotate(0.5*Math.PI); break; // 90 CW
    case 7: ctx.translate(canvas.width,0); ctx.rotate(0.5*Math.PI); ctx.scale(-1,1); break;
    case 8: ctx.translate(0,canvas.height); ctx.rotate(-0.5*Math.PI); break; // 90 CCW
    default: /* no-op */
  }
  // Draw resized image
  ctx.drawImage(img, 0, 0, cw, ch);
  const blob = await new Promise(res=>canvas.toBlob(res, 'image/jpeg', quality));
  return new File([blob], file.name.replace(/\.[^.]+$/, '')+".jpg", { type:'image/jpeg' });
}
