const MAX_AUDIO = 30 * 1024 * 1024;
async function packFile(file) {
  if (!file) return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
  return {name:file.name,type:file.type,data:btoa(binary)};
}
function unpackFile(value) {
  if (!value) return null;
  if(typeof value.data!=='string'||value.data.length>MAX_AUDIO*1.34||typeof value.name!=='string')throw new Error('A saved audio file is invalid or larger than 30 MB.');
  let binary;try{binary=atob(value.data);}catch{throw new Error('A saved audio file is damaged.');}
  if(binary.length>MAX_AUDIO)throw new Error('Choose audio files under 30 MB.');
  return new File([Uint8Array.from(binary,c=>c.charCodeAt(0))],value.name.slice(0,200),{type:typeof value.type==='string'?value.type:'audio/mpeg'});
}
function safeImage(value) {
  if(!value)return null;
  if(typeof value!=='string'||value.length>30*1024*1024||!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/.test(value))throw new Error('A saved image is invalid. Use a project exported by Bond Studio.');
  return value;
}
export async function serializeProject(project) {
  return JSON.stringify({kind:'bond-studio-project',version:2,studio:project.studio,music:project.music,volume:project.volume,sharedFile:await packFile(project.sharedFile),stages:await Promise.all(project.stages.map(async s=>({...s,sound:await packFile(s.sound)})))});
}
export function deserializeProject(text) {
  let p;try{p=JSON.parse(text);}catch{throw new Error('This project file is not valid JSON.');}
  if(p?.kind!=='bond-studio-project'||p.version!==2||!Array.isArray(p.stages)||p.stages.length!==8)throw new Error('Choose a Bond Studio project file with eight images.');
  const ids=new Set();
  const stages=p.stages.map((s,i)=>{
    if(!s||typeof s.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(s.id)||ids.has(s.id))throw new Error('The project contains invalid or duplicate image identities.');ids.add(s.id);
    return {id:s.id.slice(0,80),name:typeof s.name==='string'?s.name.slice(0,28):`Ball ${i+1}`,color:/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#a9c7f5',imageMode:s.imageMode==='original'?'original':'circle',imageName:typeof s.imageName==='string'?s.imageName.slice(0,200):'',soundName:typeof s.soundName==='string'?s.soundName.slice(0,200):'',image:safeImage(s.image),originalImage:safeImage(s.originalImage),circleImage:safeImage(s.circleImage),logoImage:safeImage(s.logoImage),sound:unpackFile(s.sound)};
  });
  return {stages,sharedFile:unpackFile(p.sharedFile),volume:Number.isFinite(p.volume)?Math.max(0,Math.min(1,p.volume)):.65,studio:p.studio,music:p.music};
}
