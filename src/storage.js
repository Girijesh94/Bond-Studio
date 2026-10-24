const open = () => new Promise((resolve, reject) => {
  const request = indexedDB.open('bond-studio', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('project');
  request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
});
export async function saveProject(project) {
  const db = await open();
  return new Promise((resolve, reject) => { const tx = db.transaction('project', 'readwrite'); tx.objectStore('project').put(project, 'current'); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => { db.close(); reject(tx.error); }; });
}
export async function loadProject() {
  const db = await open(); return new Promise((resolve, reject) => { const tx = db.transaction('project'); const request = tx.objectStore('project').get('current'); request.onsuccess = () => { db.close(); resolve(request.result); }; request.onerror = () => { db.close(); reject(request.error); }; });
}
