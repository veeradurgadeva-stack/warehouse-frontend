export const STORAGE_KEY = 'warehouse_frontend_v2';
export function loadData(defaults){ try { const raw=localStorage.getItem(STORAGE_KEY); return raw?{...defaults,...JSON.parse(raw)}:defaults; } catch { return defaults; } }
export function saveData(data){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch{} }
