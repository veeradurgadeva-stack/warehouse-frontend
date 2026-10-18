import { useEffect, useMemo, useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Receiving from "./pages/Receiving";
import Orders from "./pages/Orders";
import WarehouseSpace from "./pages/WarehouseSpace";
import Suppliers from "./pages/Suppliers";
import Reports from "./pages/Reports";
import Users from "./pages/Users";

import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";

import { initialState } from "./data/mockData";
import { loadState, saveState, clearState } from "./utils/store";
import { normalizePage } from "./utils/navigation";

import "./App.css";


const n = (v) => Number(v) || 0;


const makeInventory = (p, old = {}) => {
  const stock = n(p.stock ?? old.availableStock);
  const level = n(p.reorderLevel ?? old.reorderLevel);

  return {
    ...old,
    ...p,
    availableStock: stock,
    stock: stock,
    reorderLevel: level,
    reorderQuantity: n(
      p.reorderQuantity ?? old.reorderQuantity
    ),
    status: stock <= level ? "LOW STOCK" : "IN STOCK",
  };
};


const uid = (prefix, items, key) => {
  const nums = items
    .map((x) =>
      String(x[key] || "")
        .replace(/\D/g, "")
    )
    .map(Number)
    .filter(Boolean);

  return `${prefix}-${String(
    Math.max(0, ...nums) + 1
  ).padStart(4, "0")}`;
};


export default function App() {

  const [state, setState] = useState(
    () => loadState(initialState)
  );

  const [logged, setLogged] = useState(
    () => sessionStorage.getItem("wm_logged") === "1"
  );

  const [username, setUsername] = useState(
    () => sessionStorage.getItem("wm_user") || ""
  );

  const [role, setRole] = useState(
    () => sessionStorage.getItem("wm_role") || ""
  );

  const [page, setPage] = useState("Dashboard");

  const [globalSearch, setGlobalSearch] = useState("");

  const [toast, setToast] = useState(null);


  /* SAVE LOCAL UI STATE */

  useEffect(() => {
    saveState(state);
  }, [state]);


  /* TOAST */

  useEffect(() => {

    if (!toast) return;

    const t = setTimeout(
      () => setToast(null),
      2800
    );

    return () => clearTimeout(t);

  }, [toast]);


  const notify = (
    message,
    type = "success"
  ) => {
    setToast({
      message,
      type,
    });
  };


  const updateState = (updater) => {

    setState((prev) =>
      typeof updater === "function"
        ? updater(prev)
        : {
            ...prev,
            ...updater,
          }
    );

  };


  const navigate = (target) => {

    setPage(normalizePage(target));

    setGlobalSearch("");

  };


  /* =====================================================
     REAL SPRING BOOT + ORACLE LOGIN
     ===================================================== */

  const login = async (u, p, r) => {

    try {

      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: u.trim(),
            password: p,
            role: r.toUpperCase(),
          }),
        }
      );


      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }


      console.log(
        "LOGIN STATUS:",
        response.status
      );

      console.log(
        "LOGIN RESPONSE:",
        data
      );


      if (!response.ok) {

        notify(
          data?.message ||
            "Invalid username, password or role",
          "error"
        );

        return false;
      }


      setUsername(data.username);

      setRole(data.role);

      setLogged(true);

      setPage("Dashboard");


      sessionStorage.setItem(
        "wm_logged",
        "1"
      );

      sessionStorage.setItem(
        "wm_user",
        data.username
      );

      sessionStorage.setItem(
        "wm_role",
        data.role
      );


      notify(
        "Login successful",
        "success"
      );


      return true;

    } catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      notify(
        "Backend connection failed",
        "error"
      );

      return false;
    }
  };


  /* LOGOUT */

  const logout = () => {

    setLogged(false);

    setUsername("");

    setRole("");

    sessionStorage.removeItem(
      "wm_logged"
    );

    sessionStorage.removeItem(
      "wm_user"
    );

    sessionStorage.removeItem(
      "wm_role"
    );

    setPage("Dashboard");

  };


  /* =====================================================
     APPLICATION ACTIONS
     ===================================================== */

  const actions = useMemo(
    () => ({

      /* PRODUCT */

      addProduct: (p) =>
        updateState((s) => {

          const clean = {
            ...p,

            price: n(p.price),

            stock: n(p.stock),

            reorderLevel:
              n(p.reorderLevel),

            reorderQuantity:
              n(p.reorderQuantity),
          };


          return {
            ...s,

            products: [
              ...s.products,
              clean,
            ],

            inventory: [
              ...s.inventory,
              makeInventory(clean),
            ],
          };

        }),


      updateProduct: (id, p) =>
        updateState((s) => {

          const products =
            s.products.map((x) =>
              x.productId === id
                ? {
                    ...x,
                    ...p,

                    price: n(p.price),

                    stock: n(p.stock),

                    reorderLevel:
                      n(p.reorderLevel),

                    reorderQuantity:
                      n(p.reorderQuantity),
                  }
                : x
            );


          const invOld =
            s.inventory.find(
              (x) =>
                x.productId === id
            ) || {};


          return {
            ...s,

            products,

            inventory:
              s.inventory.map((x) =>
                x.productId === id
                  ? makeInventory(
                      p,
                      invOld
                    )
                  : x
              ),
          };

        }),


      deleteProduct: (id) =>
        updateState((s) => ({
          ...s,

          products:
            s.products.filter(
              (x) =>
                x.productId !== id
            ),

          inventory:
            s.inventory.filter(
              (x) =>
                x.productId !== id
            ),

          orders:
            s.orders.filter(
              (x) =>
                x.productId !== id
            ),
        })),


      /* SUPPLIER */

      addSupplier: (x) =>
        updateState((s) => ({
          ...s,

          suppliers: [
            ...s.suppliers,
            x,
          ],
        })),


      updateSupplier: (id, x) =>
        updateState((s) => ({
          ...s,

          suppliers:
            s.suppliers.map((a) =>
              a.supplierId === id
                ? {
                    ...a,
                    ...x,
                  }
                : a
            ),
        })),


      deleteSupplier: (id) =>
        updateState((s) => ({
          ...s,

          suppliers:
            s.suppliers.filter(
              (x) =>
                x.supplierId !== id
            ),

          products:
            s.products.map((p) =>
              p.supplierId === id
                ? {
                    ...p,
                    supplierId: "",
                  }
                : p
            ),
        })),


      /* LOCATIONS */

      addLocation: (x) =>
        updateState((s) => ({
          ...s,

          locations: [
            ...s.locations,
            x,
          ],
        })),


      updateLocation: (id, x) =>
        updateState((s) => ({
          ...s,

          locations:
            s.locations.map((a) =>
              a.locationId === id
                ? {
                    ...a,
                    ...x,
                  }
                : a
            ),
        })),


      deleteLocation: (id) =>
        updateState((s) => ({
          ...s,

          locations:
            s.locations.filter(
              (x) =>
                x.locationId !== id
            ),
        })),


      /* RECEIVING */

      addReceiving: (x) =>
        updateState((s) => {

          const qty =
            n(x.receivedQuantity);


          const inventory =
            s.inventory.map((i) =>
              i.productId === x.productId
                ? makeInventory(
                    {
                      stock:
                        n(i.availableStock) +
                        qty,
                    },
                    {
                      ...i,

                      stockIn:
                        n(i.stockIn) +
                        qty,
                    }
                  )
                : i
            );


          return {
            ...s,

            receiving: [
              x,
              ...s.receiving,
            ],

            inventory,

            products:
              s.products.map((p) =>
                p.productId ===
                x.productId
                  ? {
                      ...p,

                      stock:
                        n(p.stock) +
                        qty,
                    }
                  : p
              ),

            locations:
              s.locations.map((l) =>
                l.locationId ===
                n(x.locationId)
                  ? {
                      ...l,

                      usedCapacity:
                        n(l.usedCapacity) +
                        qty,
                    }
                  : l
              ),
          };

        }),


      updateReceiving: (id, x) =>
        updateState((s) => ({
          ...s,

          receiving:
            s.receiving.map((r) =>
              r.receivingId === id
                ? {
                    ...r,
                    ...x,
                  }
                : r
            ),
        })),


      deleteReceiving: (id) =>
        updateState((s) => ({
          ...s,

          receiving:
            s.receiving.filter(
              (r) =>
                r.receivingId !== id
            ),
        })),


      /* ORDERS */

      updateOrder: (id, patch) =>
        updateState((s) => {

          const old =
            s.orders.find(
              (o) =>
                o.orderId === id
            );


          if (!old) return s;


          let inventory =
            s.inventory;

          let products =
            s.products;


          let next = {
            ...old,
            ...patch,
          };


          if (
            patch.orderStatus ===
              "SHIPPED" &&
            !old.stockDeducted
          ) {

            const qty =
              n(old.quantity);


            inventory =
              inventory.map((i) =>
                i.productId ===
                old.productId
                  ? makeInventory(
                      {
                        stock:
                          Math.max(
                            0,
                            n(
                              i.availableStock
                            ) - qty
                          ),
                      },
                      {
                        ...i,

                        stockOut:
                          n(i.stockOut) +
                          qty,
                      }
                    )
                  : i
              );


            products =
              products.map((p) =>
                p.productId ===
                old.productId
                  ? {
                      ...p,

                      stock:
                        Math.max(
                          0,
                          n(p.stock) -
                            qty
                        ),
                    }
                  : p
              );


            next = {
              ...next,

              stockDeducted:
                true,

              pickingStatus:
                "COMPLETED",

              packingStatus:
                "COMPLETED",
            };

          }


          return {
            ...s,

            orders:
              s.orders.map((o) =>
                o.orderId === id
                  ? next
                  : o
              ),

            inventory,

            products,
          };

        }),


      addOrder: (x) =>
        updateState((s) => ({
          ...s,

          orders: [
            x,
            ...s.orders,
          ],
        })),


      /* USERS */

      addUser: (x) =>
        updateState((s) => ({
          ...s,

          users: [
            ...s.users,
            x,
          ],
        })),


      updateUser: (id, x) =>
        updateState((s) => ({
          ...s,

          users:
            s.users.map((a) =>
              a.userId === id
                ? {
                    ...a,
                    ...x,
                  }
                : a
            ),
        })),


      deleteUser: (id) =>
        updateState((s) => ({
          ...s,

          users:
            s.users.filter(
              (x) =>
                x.userId !== id
            ),
        })),


      /* RESET */

      resetDemo: () => {

        clearState();

        setState(
          loadState(initialState)
        );

        notify(
          "Demo data restored"
        );

      },

    }),
    []
  );


  /* =====================================================
     LOGIN SCREEN
     ===================================================== */

  if (!logged) {

    return (
      <Login
        onLogin={login}
      />
    );

  }


  /* =====================================================
     COMMON PROPS
     ===================================================== */

  const props = {
    state,
    actions,
    navigate,
    notify,
    globalSearch,
    setGlobalSearch,
  };


  /* =====================================================
     PAGE ROUTING
     ===================================================== */

  const render = {

    Dashboard:
      <Dashboard
        {...props}
      />,

    Inventory:
      <Inventory
        {...props}
      />,

    Receiving:
      <Receiving
        {...props}
      />,

    Orders:
      <Orders
        {...props}
      />,

    Warehouse:
      <WarehouseSpace
        {...props}
      />,

    Suppliers:
      <Suppliers
        {...props}
      />,

    Reports:
      <Reports
        {...props}
      />,

    Users:
      role === "ADMIN"
        ? <Users
            {...props}
          />
        : <Dashboard
            {...props}
          />,

  }[page] || (
    <Dashboard
      {...props}
    />
  );


  /* =====================================================
     MAIN APPLICATION
     ===================================================== */

  return (

    <div className="app-layout">

      <Sidebar
        role={role}
        activePage={page}
        onNavigate={navigate}
        onLogout={logout}
      />


      <div className="app-main">

        <Topbar
          role={role}
          username={username}
          search={globalSearch}
          setSearch={setGlobalSearch}
          onNavigate={navigate}
          state={state}
        />


        <main>
          {render}
        </main>

      </div>


      {toast && (

        <div
          className={`toast ${toast.type}`}
        >

          {toast.type === "error"
            ? "⚠"
            : "✓"}

          {" "}

          {toast.message}

        </div>

      )}

    </div>

  );
}