# Warehouse Management System — Final Frontend

This is the final React/Vite `src` package for the Warehouse Management System.

## Included frontend requirements

1. User Login with role selection and password visibility.
2. Supplier Management: add, view, edit, delete, search, phone, email and address.
3. Product Management: add, view, edit, delete, search and category/status filters.
4. Inventory Management: available stock, reorder level, reorder quantity and status.
5. Automatic Stock Tracking: receiving increases stock; shipping decreases stock.
6. Low-Stock Alert: dashboard alerts are calculated from current inventory.
7. Smart Reorder Suggestion: low-stock rows show reorder quantity.
8. Search: dashboard top search searches products, suppliers and orders and navigates to the correct module.
9. Reports: inventory, stock movement, order and warehouse reports.
10. Receiving & Putaway: create receiving records and update inventory/location usage.
11. Orders: pending → picking → packing → shipped workflow with stock deduction once.
12. Warehouse Locations: add, edit, delete and utilization calculation.
13. User Management: add, edit, activate/deactivate and delete non-admin users.
14. Dashboard KPI cards, stock chart, warehouse utilization, recent orders and alerts are interactive.
15. Logout, profile menu, notifications and reset/demo state are included.
16. Browser localStorage keeps frontend changes after refresh.

## Demo login

ADMIN: `admin` / `admin123`
STAFF: `staff` / `staff123`

## Run

Put this `src` folder into the existing Vite React project and run:

```bash
npm install
npm run dev
```

## Backend-ready structure

`utils/api.js` contains REST client definitions for the future Spring Boot backend. The UI currently uses centralized frontend state so every interaction can be tested without a server.

Expected REST endpoints:

- POST `/api/auth/login`
- GET/POST/PUT/DELETE `/api/products`
- GET/POST/PUT/DELETE `/api/suppliers`
- GET/PUT `/api/inventory`
- GET/POST `/api/receiving`
- GET/PUT `/api/orders`
- GET/POST/PUT/DELETE `/api/warehouses/locations`
- GET/POST/PUT/DELETE `/api/users`
- GET `/api/reports`

Set `VITE_API_BASE_URL` later to the Spring Boot API base URL. The frontend state model uses the same entity names and IDs so the page components can be connected to REST services without redesigning the UI.

## Important

The supplier records in this final frontend contain real-looking demo contact/email values so the UI does not display missing-data placeholders. No external dataset dependency is required to run the frontend.
