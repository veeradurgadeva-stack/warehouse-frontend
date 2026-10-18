const KEY = "warehouse_management_frontend_final_v3";
const VERSION = 3;
function clone(x){return JSON.parse(JSON.stringify(x));}
export function loadState(fallback){
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw) return clone(fallback);
    const saved=JSON.parse(raw);
    return {...clone(fallback),...saved,version:VERSION};
  }catch{return clone(fallback);}
}
export function saveState(state){try{localStorage.setItem(KEY,JSON.stringify({...state,version:VERSION}));}catch{} }
export function clearState(){try{localStorage.removeItem(KEY);}catch{}}
export function exportState(state){return JSON.stringify(state,null,2);}
export function importState(text){const parsed=JSON.parse(text);if(!parsed||typeof parsed!=="object")throw new Error("Invalid backup");return parsed;}
