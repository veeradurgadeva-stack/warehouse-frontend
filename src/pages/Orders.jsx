import { useEffect, useMemo, useState } from "react";

import StatusBadge from "../components/common/StatusBadge";

import Modal from "../components/common/Modal";



const API = "http://localhost:8080/api";



const mapOrder = (o) => ({

  orderId: Number(o.ORDER_ID ?? o.orderId ?? 0),

  customerName: o.CUSTOMER_NAME ?? o.customerName ?? "—",

  productId: String(o.PRODUCT_ID ?? o.productId ?? ""),

  productName: o.PRODUCT_NAME ?? o.productName ?? "—",

  quantity: Number(o.QUANTITY ?? o.quantity ?? 0),

  orderStatus: String(

    o.ORDER_STATUS ?? o.orderStatus ?? "PENDING"

  ).trim().toUpperCase(),

  pickingStatus: String(

    o.PICKING_STATUS ?? o.pickingStatus ?? "PENDING"

  ).trim().toUpperCase(),

  packingStatus: String(

    o.PACKING_STATUS ?? o.packingStatus ?? "PENDING"

  ).trim().toUpperCase(),

  orderDate: String(o.ORDER_DATE ?? o.orderDate ?? ""),

});



export default function Orders({ notify }) {

  const [orders, setOrders] = useState([]);

  const [tabs, setTab] = useState("ALL");

  const [q, setQ] = useState("");

  const [view, setView] = useState(null);

  const [loading, setLoading] = useState(true);

  const [updating, setUpdating] = useState(null);
  const [products, setProducts] = useState([]);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({ customerName: "", productId: "", quantity: "1" });



  // Load orders

  const loadData = async (showLoader = true) => {

    if (showLoader) setLoading(true);



    try {

      const [response, productsResponse] = await Promise.all([
        fetch(`${API}/orders`),
        fetch(`${API}/products`),
      ]);

      if (!response.ok) throw new Error(`Unable to load orders (${response.status})`);
      if (!productsResponse.ok) throw new Error(`Unable to load products (${productsResponse.status})`);

      const [data, productData] = await Promise.all([response.json(), productsResponse.json()]);
      if (!Array.isArray(data)) throw new Error("Invalid orders response from backend");
      if (!Array.isArray(productData)) throw new Error("Invalid products response from backend");

      setProducts(productData.map((p) => ({
        productId: String(p.PRODUCT_ID ?? p.productId ?? ""),
        productName: String(p.PRODUCT_NAME ?? p.productName ?? ""),
        price: Number(p.PRICE ?? p.price ?? 0),
        availableStock: Number(p.AVAILABLE_STOCK ?? p.availableStock ?? p.STOCK ?? p.stock ?? 0),
      })));

      const mappedOrders = data.map(mapOrder);
      setOrders(mappedOrders);



      // Keep the open modal synchronized with updated order data

      setView((current) => {

        if (!current) return null;

        return (

          mappedOrders.find(

            (order) => order.orderId === current.orderId

          ) ?? null

        );

      });

    } catch (error) {

      console.error("Orders loading error:", error);

      notify?.("Unable to load orders. Check backend.", "error");

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    loadData();

  }, []);



  // Search and status filters

  const rows = useMemo(() => {

    return orders.filter((o) => {

      const searchText =

        `${o.orderId} ${o.customerName} ${o.productId} ${o.productName} ${o.orderStatus}`.toLowerCase();



      const matchesSearch =

        !q.trim() ||

        searchText.includes(q.trim().toLowerCase());



      const matchesTab =

        tabs === "ALL" || o.orderStatus === tabs;



      return matchesSearch && matchesTab;

    });

  }, [orders, q, tabs]);



  // Create a real order through the existing Spring Boot API
  const createOrder = async (event) => {
    event.preventDefault();
    const customerName = orderForm.customerName.trim();
    const quantity = Number(orderForm.quantity);
    const selectedProduct = products.find((p) => p.productId === orderForm.productId);

    if (!customerName) return notify?.("Enter the customer name.", "error");
    if (!selectedProduct) return notify?.("Select a valid product.", "error");
    if (!Number.isInteger(quantity) || quantity <= 0) return notify?.("Quantity must be a positive whole number.", "error");
    if (quantity > selectedProduct.availableStock) {
      return notify?.(`Only ${selectedProduct.availableStock} units are available.`, "error");
    }

    setSavingOrder(true);
    try {
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, productId: orderForm.productId, quantity }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Order creation failed (${response.status})`);
      }
      await response.json();
      setOrderForm({ customerName: "", productId: "", quantity: "1" });
      setNewOrderOpen(false);
      await loadData(false);
      notify?.("Order created and saved successfully.", "success");
    } catch (error) {
      console.error("Create order error:", error);
      notify?.(`Order creation failed: ${error.message}`, "error");
    } finally {
      setSavingOrder(false);
    }
  };

  // Pick, Pack, Ship and Complete workflow

  const action = async (o, type) => {

    let patch;



    if (type === "PICK") {

      if (o.orderStatus !== "PENDING") return;



      patch = {

        orderStatus: "PICKING",

        pickingStatus: "IN PROGRESS",

        packingStatus: "PENDING",

      };

    } else if (type === "PACK") {

      if (o.orderStatus !== "PICKING") return;



      patch = {

        orderStatus: "PACKING",

        pickingStatus: "COMPLETED",

        packingStatus: "IN PROGRESS",

      };

    } else if (type === "SHIP") {

      if (o.orderStatus !== "PACKING") return;



      patch = {

        orderStatus: "SHIPPED",

        pickingStatus: "COMPLETED",

        packingStatus: "COMPLETED",

      };

    } else if (type === "COMPLETE") {

      if (o.orderStatus !== "SHIPPED") return;



      patch = {

        orderStatus: "COMPLETED",

        pickingStatus: "COMPLETED",

        packingStatus: "COMPLETED",

      };

    } else {

      return;

    }



    setUpdating(o.orderId);



    try {

      const response = await fetch(

        `${API}/orders/${encodeURIComponent(o.orderId)}`,

        {

          method: "PUT",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify(patch),

        }

      );



      if (!response.ok) {

        const message = await response.text();

        throw new Error(

          message || `Order update failed (${response.status})`

        );

      }



      await loadData(false);

      setView(null);



      notify?.(

        `Order #${o.orderId} updated to ${patch.orderStatus}`,

        "success"

      );

    } catch (error) {

      console.error("Order update error:", error);

      notify?.(`Update failed: ${error.message}`, "error");

    } finally {

      setUpdating(null);

    }

  };



  const tabsList = [

    ["ALL", "All Orders"],

    ["PENDING", "Pending"],

    ["PICKING", "Picking"],

    ["PACKING", "Packing"],

    ["SHIPPED", "Shipped"],

    ["COMPLETED", "Completed"],

  ];



  return (

    <div className="page-content">

      <div className="page-title action-title">
        <div>
          <h1>Orders</h1>
          <p>Order picking, packing and shipment workflow.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setNewOrderOpen(true)}>
          + New Order
        </button>
      </div>



      <section className="section-card">

        {/* Search and Reset */}

        <div className="filter-bar">

          <div className="search-field wide">

            <span>⌕</span>



            <input

              type="text"

              value={q}

              onChange={(e) => setQ(e.target.value)}

              placeholder="Search order, customer or product..."

            />



            <button

              type="button"

              onClick={() => setQ("")}

            >

              ×

            </button>

          </div>



          <button

            type="button"

            className="secondary-button reset-button"

            onClick={() => {

              setQ("");

              setTab("ALL");

            }}

          >

            Reset

          </button>

        </div>



        {/* Status tabs */}

        <div className="tabs">

          {tabsList.map(([key, label]) => (

            <button

              type="button"

              key={key}

              className={tabs === key ? "active" : ""}

              onClick={() => setTab(key)}

            >

              {label}

            </button>

          ))}

        </div>



        <div className="result-count">

          {loading

            ? "Loading orders..."

            : `${rows.length} orders found`}

        </div>



        {/* Orders table */}

        <div className="table-container">

          <table>

            <thead>

              <tr>

                <th>Order ID</th>

                <th>Customer</th>

                <th>Product</th>

                <th>Qty</th>

                <th>Status</th>

                <th>Picking</th>

                <th>Packing</th>

                <th>Date</th>

                <th>Actions</th>

              </tr>

            </thead>



            <tbody>

              {rows.map((o) => (

                <tr key={o.orderId}>

                  <td>#{o.orderId}</td>



                  <td>

                    <strong>{o.customerName}</strong>

                  </td>



                  <td>{o.productName}</td>

                  <td>{o.quantity}</td>



                  <td>

                    <StatusBadge status={o.orderStatus} />

                  </td>



                  <td>

                    <StatusBadge status={o.pickingStatus} />

                  </td>



                  <td>

                    <StatusBadge status={o.packingStatus} />

                  </td>



                  <td>{o.orderDate || "—"}</td>



                  <td>

                    <div className="row-actions">

                      <button

                        type="button"

                        onClick={() => setView(o)}

                      >

                        View

                      </button>



                      {o.orderStatus === "PENDING" && (

                        <button

                          type="button"

                          disabled={updating === o.orderId}

                          onClick={() => action(o, "PICK")}

                        >

                          {updating === o.orderId

                            ? "Updating..."

                            : "Pick"}

                        </button>

                      )}



                      {o.orderStatus === "PICKING" && (

                        <button

                          type="button"

                          disabled={updating === o.orderId}

                          onClick={() => action(o, "PACK")}

                        >

                          {updating === o.orderId

                            ? "Updating..."

                            : "Pack"}

                        </button>

                      )}



                      {o.orderStatus === "PACKING" && (

                        <button

                          type="button"

                          disabled={updating === o.orderId}

                          onClick={() => action(o, "SHIP")}

                        >

                          {updating === o.orderId

                            ? "Updating..."

                            : "Ship"}

                        </button>

                      )}



                      {o.orderStatus === "SHIPPED" && (

                        <button

                          type="button"

                          disabled={updating === o.orderId}

                          onClick={() => action(o, "COMPLETE")}

                        >

                          {updating === o.orderId

                            ? "Updating..."

                            : "Complete"}

                        </button>

                      )}



                      {o.orderStatus === "COMPLETED" && (

                        <span>Completed</span>

                      )}

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>



        {!loading && rows.length === 0 && (

          <div className="empty-state">

            No orders found for this status.

          </div>

        )}

      </section>



      {/* Create order modal */}
      {newOrderOpen && (
        <Modal
          title="New Order"
          onClose={() => !savingOrder && setNewOrderOpen(false)}
          footer={null}
        >
          <form className="form-grid" onSubmit={createOrder}>
            <div>
              <label htmlFor="new-order-customer">Customer Name</label>
              <input
                id="new-order-customer"
                type="text"
                value={orderForm.customerName}
                onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                placeholder="Enter customer name"
                maxLength={150}
                required
              />
            </div>
            <div>
              <label htmlFor="new-order-product">Product</label>
              <select
                id="new-order-product"
                value={orderForm.productId}
                onChange={(e) => setOrderForm({ ...orderForm, productId: e.target.value })}
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.productId} value={product.productId} disabled={product.availableStock <= 0}>
                    {product.productName} ({product.productId}) — {product.availableStock} available
                  </option>
                ))}
              </select>
              {products.length === 0 && <small>No products loaded. Check the Products API.</small>}
            </div>
            <div>
              <label htmlFor="new-order-quantity">Quantity</label>
              <input
                id="new-order-quantity"
                type="number"
                min="1"
                step="1"
                max={products.find((p) => p.productId === orderForm.productId)?.availableStock || undefined}
                value={orderForm.quantity}
                onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                required
              />
              {(() => {
                const product = products.find((p) => p.productId === orderForm.productId);
                const qty = Number(orderForm.quantity);
                return product ? <small>Available: {product.availableStock} · Unit price: ₹{product.price.toFixed(2)} · Total: ₹{(product.price * (qty > 0 ? qty : 0)).toFixed(2)}</small> : null;
              })()}
            </div>
            <div className="row-actions">
              <button type="button" className="secondary-button" disabled={savingOrder} onClick={() => setNewOrderOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={savingOrder || products.length === 0}>
                {savingOrder ? "Saving..." : "Create Order"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View order modal */}

      {view && (

        <Modal

          title={`Order #${view.orderId}`}

          onClose={() => setView(null)}

          footer={

            <button

              type="button"

              className="primary-button"

              onClick={() => setView(null)}

            >

              Close

            </button>

          }

        >

          <div className="detail-grid">

            <div>

              <span>Order ID</span>

              <strong>#{view.orderId}</strong>

            </div>



            <div>

              <span>Customer</span>

              <strong>{view.customerName}</strong>

            </div>



            <div>

              <span>Product ID</span>

              <strong>{view.productId || "—"}</strong>

            </div>



            <div>

              <span>Product</span>

              <strong>{view.productName}</strong>

            </div>



            <div>

              <span>Quantity</span>

              <strong>{view.quantity}</strong>

            </div>



            <div>

              <span>Status</span>

              <strong>{view.orderStatus}</strong>

            </div>



            <div>

              <span>Picking</span>

              <strong>{view.pickingStatus}</strong>

            </div>



            <div>

              <span>Packing</span>

              <strong>{view.packingStatus}</strong>

            </div>



            <div>

              <span>Date</span>

              <strong>{view.orderDate || "—"}</strong>

            </div>

          </div>



          <div className="row-actions">

            {view.orderStatus === "PENDING" && (

              <button

                type="button"

                disabled={updating === view.orderId}

                onClick={() => action(view, "PICK")}

              >

                Pick

              </button>

            )}



            {view.orderStatus === "PICKING" && (

              <button

                type="button"

                disabled={updating === view.orderId}

                onClick={() => action(view, "PACK")}

              >

                Pack

              </button>

            )}



            {view.orderStatus === "PACKING" && (

              <button

                type="button"

                disabled={updating === view.orderId}

                onClick={() => action(view, "SHIP")}

              >

                Ship

              </button>

            )}



            {view.orderStatus === "SHIPPED" && (

              <button

                type="button"

                disabled={updating === view.orderId}

                onClick={() => action(view, "COMPLETE")}

              >

                Complete

              </button>

            )}

          </div>

        </Modal>

      )}

    </div>

  );
}