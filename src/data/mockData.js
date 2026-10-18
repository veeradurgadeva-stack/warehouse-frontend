const products = [
  { productId:"29-205-1132", productName:"Sushi Rice", category:"Grocery", price:120, stock:12, reorderLevel:72, reorderQuantity:70, supplierId:"SUP-001" },
  { productId:"PRD-1002", productName:"Organic Milk", category:"Dairy", price:65, stock:18, reorderLevel:40, reorderQuantity:50, supplierId:"SUP-002" },
  { productId:"PRD-1003", productName:"Wheat Flour", category:"Grocery", price:58, stock:25, reorderLevel:60, reorderQuantity:70, supplierId:"SUP-003" },
  { productId:"PRD-1004", productName:"Basmati Rice", category:"Grocery", price:110, stock:180, reorderLevel:40, reorderQuantity:70, supplierId:"SUP-001" },
  { productId:"PRD-1005", productName:"Cooking Oil", category:"Grocery", price:150, stock:120, reorderLevel:40, reorderQuantity:50, supplierId:"SUP-003" },
  { productId:"PRD-1006", productName:"Tea Powder", category:"Beverages", price:180, stock:95, reorderLevel:30, reorderQuantity:60, supplierId:"SUP-002" },
  { productId:"PRD-1007", productName:"Coffee Beans", category:"Beverages", price:260, stock:22, reorderLevel:25, reorderQuantity:50, supplierId:"SUP-002" },
  { productId:"PRD-1008", productName:"Paper Cups", category:"Packaging", price:3, stock:500, reorderLevel:100, reorderQuantity:300, supplierId:"SUP-001" },
];
const suppliers = [
  { supplierId:"SUP-001", supplierName:"Chennai Grocery Supplies", phone:"9876543210", email:"contact@chennaigrocery.com", address:"Guindy, Chennai", status:"ACTIVE" },
  { supplierId:"SUP-002", supplierName:"South India Distributors", phone:"9123456780", email:"sales@southdistributors.com", address:"Ambattur, Chennai", status:"ACTIVE" },
  { supplierId:"SUP-003", supplierName:"Global Food Imports", phone:"9988776655", email:"info@globalfoodimports.com", address:"T Nagar, Chennai", status:"ACTIVE" },
];
const inventory = products.map((p, i) => ({ ...p, stockIn:p.stock + (i + 1) * 20, stockOut:(i + 1) * 20, availableStock:p.stock, status:p.stock <= p.reorderLevel ? "LOW STOCK" : "IN STOCK" }));
const locations = [
  { locationId:1, code:"A-01", zone:"Zone A", type:"Rack", capacity:1000, usedCapacity:50 },
  { locationId:2, code:"A-02", zone:"Zone A", type:"Shelf", capacity:1000, usedCapacity:0 },
  { locationId:3, code:"B-01", zone:"Zone B", type:"Rack", capacity:400, usedCapacity:380 },
  { locationId:4, code:"B-02", zone:"Zone B", type:"Shelf", capacity:600, usedCapacity:240 },
  { locationId:5, code:"C-01", zone:"Zone C", type:"Rack", capacity:800, usedCapacity:400 },
];
const orders = [
  { orderId:1001, customerName:"Retail Store", productId:"29-205-1132", productName:"Sushi Rice", quantity:5, orderStatus:"PENDING", pickingStatus:"PENDING", packingStatus:"PENDING", orderDate:"10 Oct 2026" },
  { orderId:1002, customerName:"Office Supplies", productId:"PRD-1004", productName:"Basmati Rice", quantity:10, orderStatus:"PICKING", pickingStatus:"IN PROGRESS", packingStatus:"PENDING", orderDate:"10 Oct 2026" },
  { orderId:1003, customerName:"Tech Hub", productId:"PRD-1002", productName:"Organic Milk", quantity:3, orderStatus:"PACKING", pickingStatus:"COMPLETED", packingStatus:"IN PROGRESS", orderDate:"9 Oct 2026" },
  { orderId:1004, customerName:"Global Retail", productId:"PRD-1005", productName:"Cooking Oil", quantity:8, orderStatus:"SHIPPED", pickingStatus:"COMPLETED", packingStatus:"COMPLETED", orderDate:"9 Oct 2026", stockDeducted:true },
];
const receiving = [
  { receivingId:1, productId:"29-205-1132", supplier:"Chennai Grocery Supplies", receivedQuantity:50, receivedDate:"10 Oct 2026", status:"COMPLETED" },
  { receivingId:2, productId:"PRD-1002", supplier:"South India Distributors", receivedQuantity:50, receivedDate:"9 Oct 2026", status:"IN PROGRESS" },
  { receivingId:3, productId:"PRD-1005", supplier:"Global Food Imports", receivedQuantity:30, receivedDate:"8 Oct 2026", status:"COMPLETED" },
];
const users = [
  { userId:1, username:"admin", password:"admin123", role:"ADMIN", displayRole:"Warehouse Manager", status:"ACTIVE" },
  { userId:2, username:"staff", password:"staff123", role:"STAFF", displayRole:"Staff", status:"ACTIVE" },
];
export const stockOverview = [
  {month:"Jan",inStock:340,outOfStock:90},{month:"Feb",inStock:450,outOfStock:120},{month:"Mar",inStock:560,outOfStock:150},{month:"Apr",inStock:430,outOfStock:110},
  {month:"May",inStock:390,outOfStock:95},{month:"Jun",inStock:510,outOfStock:130},{month:"Jul",inStock:470,outOfStock:125},{month:"Aug",inStock:590,outOfStock:155},
  {month:"Sep",inStock:520,outOfStock:140},{month:"Oct",inStock:610,outOfStock:170},{month:"Nov",inStock:575,outOfStock:160},{month:"Dec",inStock:640,outOfStock:180},
];
export const initialState = { products, inventory, suppliers, locations, orders, receiving, users, stockOverview, warehouse:{ warehouseId:1, name:"Main Warehouse", location:"Chennai", totalCapacity:10000, usedCapacity:3500 } };
