export const adminMenu=["Dashboard","Inventory","Receiving","Orders","Warehouse","Suppliers","Reports","Users"];
export const staffMenu=["Dashboard","Inventory","Receiving","Orders","Warehouse","Suppliers","Reports"];
export const aliases={"Receiving & Putaway":"Receiving","User Management":"Users","Warehouse Space":"Warehouse"};
export function normalizePage(name){return aliases[name]||name||"Dashboard";}
export const pageRoutes={Dashboard:"Dashboard",Inventory:"Inventory",Receiving:"Receiving",Orders:"Orders",Warehouse:"Warehouse",Suppliers:"Suppliers",Reports:"Reports",Users:"Users"};
