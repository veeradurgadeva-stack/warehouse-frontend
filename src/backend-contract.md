# Backend Contract

Use these JSON shapes when implementing Spring Boot + Oracle REST APIs.

## Product
`productId, productName, category, price, stock, reorderLevel, reorderQuantity, supplierId`

## Supplier
`supplierId, supplierName, phone, email, address, status`

## Inventory
`productId, stockIn, stockOut, availableStock, reorderLevel, reorderQuantity, status, lastUpdated`

## Receiving
`receivingId, productId, productName, supplierId, supplier, warehouseId, locationId, receivedQuantity, receivedDate, status`

## Order
`orderId, customerName, productId, productName, quantity, orderStatus, pickingStatus, packingStatus, orderDate, stockDeducted`

## Location
`locationId, code, zone, type, capacity, usedCapacity`

## User
`userId, username, password, role, displayRole, status`

## Recommended controller mapping

AuthController -> `/api/auth`
ProductController -> `/api/products`
SupplierController -> `/api/suppliers`
InventoryController -> `/api/inventory`
ReceivingController -> `/api/receiving`
OrderController -> `/api/orders`
WarehouseController -> `/api/warehouses/locations`
UserController -> `/api/users`
ReportController -> `/api/reports`
