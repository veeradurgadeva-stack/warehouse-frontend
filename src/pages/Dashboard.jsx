import { useEffect, useMemo, useState } from "react";
import StatCard from "../components/dashboard/StatCard";
import RecentOrders from "../components/dashboard/RecentOrders";
import SmartAlerts from "../components/dashboard/SmartAlerts";
import WarehouseSummary from "../components/dashboard/WarehouseSummary";
import SectionCard from "../components/common/SectionCard";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/$/, "");
const pick = (x, upper, lower, fallback = "") => x?.[upper] ?? x?.[lower] ?? fallback;
const mapProduct = p => ({ productId:String(pick(p,"PRODUCT_ID","productId")), productName:pick(p,"PRODUCT_NAME","productName","Unknown product"), category:pick(p,"CATEGORY","category","Other"), price:Number(pick(p,"PRICE","price",0)), availableStock:Number(pick(p,"AVAILABLE_STOCK","availableStock",pick(p,"STOCK","stock",0))), reorderLevel:Number(pick(p,"REORDER_LEVEL","reorderLevel",0)), reorderQuantity:Number(pick(p,"REORDER_QUANTITY","reorderQuantity",0)) });
const mapOrder = o => ({ orderId:Number(pick(o,"ORDER_ID","orderId",0)), customerName:pick(o,"CUSTOMER_NAME","customerName","—"), productName:pick(o,"PRODUCT_NAME","productName","—"), quantity:Number(pick(o,"QUANTITY","quantity",0)), orderStatus:String(pick(o,"ORDER_STATUS","orderStatus","PENDING")).toUpperCase(), orderDate:pick(o,"ORDER_DATE","orderDate","") });
const mapLocation = l => ({ locationId:Number(pick(l,"LOCATION_ID","locationId",0)), code:pick(l,"CODE","code",pick(l,"LOCATION_CODE","locationCode","—")), capacity:Number(pick(l,"CAPACITY","capacity",0)), usedCapacity:Number(pick(l,"USED_CAPACITY","usedCapacity",0)) });
async function get(path) { const r = await fetch(`${API}${path}`); if (!r.ok) throw new Error(`${path} returned ${r.status}`); return r.json(); }

export default function Dashboard({ navigate = () => {}, notify, globalSearch = "" }) {
  const [data, setData] = useState({ products: [], orders: [], locations: [], inventory: [], report: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const q = String(globalSearch || "").trim().toLowerCase();
  const load = async () => {
    setLoading(true); setError("");
    try {
      const [products, orders, locations, inventory, report] = await Promise.all([get("/products"), get("/orders"), get("/warehouses/locations"), get("/inventory"), get("/reports")]);
      setData({ products: products.map(mapProduct), orders: orders.map(mapOrder), locations: locations.map(mapLocation), inventory, report });
    } catch (e) { setError(`Could not load live dashboard data: ${e.message}. Check Spring Boot and Oracle connection.`); notify?.("Dashboard API load failed. Check backend.", "error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const products = data.products;
  const low = (Array.isArray(data.report?.lowStockProducts) ? data.report.lowStockProducts : products.filter(p => p.availableStock <= p.reorderLevel)).map(mapProduct);
  const available = Number(data.report?.availableStock ?? products.reduce((n,p)=>n+p.availableStock,0));
  const pending = Number(data.report?.pendingOrders ?? data.orders.filter(o => !["SHIPPED","COMPLETED","CANCELLED"].includes(o.orderStatus)).length);
  const totalCapacity = data.locations.reduce((n,x)=>n+x.capacity,0), usedCapacity = data.locations.reduce((n,x)=>n+x.usedCapacity,0);
  const warehouse = { name:"Warehouse", location:"Oracle database", totalCapacity, usedCapacity };
  const searchResults = useMemo(() => {
    if (!q) return [];
    const rows = [];
    products.forEach(x => { if (`${x.productId} ${x.productName} ${x.category}`.toLowerCase().includes(q)) rows.push({type:"Product",title:x.productName,detail:x.productId,go:"Inventory"}); });
    data.orders.forEach(x => { if (`${x.orderId} ${x.customerName} ${x.productName} ${x.orderStatus}`.toLowerCase().includes(q)) rows.push({type:"Order",title:`Order #${x.orderId}`,detail:x.customerName,go:"Orders"}); });
    return rows.slice(0,8);
  }, [q, products, data.orders]);
  return <div className="page-content">
    <div className="page-title"><div><h1>Dashboard</h1><p>Live warehouse data from Spring Boot and Oracle.</p></div><div className="dashboard-navigation"><button onClick={()=>navigate("Inventory")}>Inventory</button><button onClick={()=>navigate("Reports")}>Reports</button><button className="secondary-button" onClick={load} disabled={loading}>{loading?"Refreshing…":"↻ Refresh"}</button></div></div>
    {error && <div role="alert" className="section-card" style={{padding:14,color:"#a22"}}>{error}</div>}
    {q && <section className="section-card global-results"><div className="section-card-header"><div><h2>Search Results</h2><p>Matches for “{globalSearch}”</p></div></div>{searchResults.length?<div className="global-result-grid">{searchResults.map((r,i)=><button key={`${r.type}-${i}`} onClick={()=>navigate(r.go)}><span>{r.type}</span><strong>{r.title}</strong><small>{r.detail}</small></button>)}</div>:<div className="empty-state">No products or orders matched your search.</div>}</section>}
    <div className="stats-grid">
      <StatCard icon="▣" label="Total Products" value={loading?"…":Number(data.report?.totalProducts ?? products.length).toLocaleString()} subtitle="Products in Oracle" trend="Live API" tone="blue" onClick={()=>navigate("Inventory")}/>
      <StatCard icon="◫" label="Available Stock" value={loading?"…":available.toLocaleString()} subtitle="Units currently available" trend="Live API" tone="green" onClick={()=>navigate("Inventory")}/>
      <StatCard icon="⚠" label="Low Stock Items" value={loading?"…":Number(data.report?.lowStock ?? low.length).toLocaleString()} subtitle="Items need attention" trend="Review" tone="orange" onClick={()=>navigate("Inventory")}/>
      <StatCard icon="🛒" label="Pending Orders" value={loading?"…":pending.toLocaleString()} subtitle="Orders awaiting completion" trend="View" tone="purple" onClick={()=>navigate("Orders")}/>
    </div>
    <div className="dashboard-grid"><div className="dashboard-left"><SectionCard><div className="stock-panel"><div className="panel-heading"><div><h3>Inventory Snapshot</h3><p>Live stock levels for products with highest stock</p></div></div><div className="table-container"><table><thead><tr><th>Product</th><th>Available</th><th>Reorder level</th><th>Status</th></tr></thead><tbody>{products.slice().sort((a,b)=>a.availableStock-b.availableStock).slice(0,7).map(p=><tr key={p.productId}><td>{p.productName}</td><td>{p.availableStock}</td><td>{p.reorderLevel}</td><td>{p.availableStock<=p.reorderLevel?"LOW STOCK":"IN STOCK"}</td></tr>)}</tbody></table></div></div></SectionCard><SmartAlerts alerts={low} navigate={navigate}/></div><div className="dashboard-right"><WarehouseSummary warehouse={warehouse} locations={data.locations}/><RecentOrders orders={data.orders.slice(0,5)} navigate={navigate}/></div></div>
  </div>;
}
