import { useEffect, useMemo, useState } from "react";
import StatusBadge from "../components/common/StatusBadge";

import Modal from "../components/common/Modal";



const API = "http://localhost:8080/api";



const mapProduct = (p) => ({

  productId: String(p.PRODUCT_ID ?? p.productId ?? ""),

  productName: p.PRODUCT_NAME ?? p.productName ?? "",

  category: p.CATEGORY ?? p.category ?? "Grocery",

  price: Number(p.PRICE ?? p.price ?? 0),

  stock: Number(p.STOCK ?? p.stock ?? 0),

  availableStock: Number(

    p.AVAILABLE_STOCK ?? p.availableStock ?? p.STOCK ?? p.stock ?? 0

  ),

  supplierId: String(p.SUPPLIER_ID ?? p.supplierId ?? ""),

  reorderLevel: Number(p.REORDER_LEVEL ?? p.reorderLevel ?? 0),

  reorderQuantity: Number(p.REORDER_QUANTITY ?? p.reorderQuantity ?? 0),

  status: p.STATUS ?? p.status ?? "IN STOCK",

});



const mapSupplier = (s) => ({

  supplierId: String(s.SUPPLIER_ID ?? s.supplierId ?? ""),

  supplierName: s.SUPPLIER_NAME ?? s.supplierName ?? "",

});



export default function Inventory({ notify }) {

  const [products, setProducts] = useState([]);

  const [suppliers, setSuppliers] = useState([]);

  const [q, setQ] = useState("");

  const [cat, setCat] = useState("All Categories");

  const [status, setStatus] = useState("All Status");

  const [open, setOpen] = useState(false);

  const [edit, setEdit] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);



  const blank = {

    productId: "",

    productName: "",

    category: "Grocery",

    price: "",

    stock: "",

    reorderLevel: "",

    reorderQuantity: "",

    supplierId: "",

  };



  const [form, setForm] = useState(blank);



  const loadData = async () => {

    try {

      const [productsResponse, suppliersResponse] = await Promise.all([

        fetch(`${API}/products`),

        fetch(`${API}/suppliers`),

      ]);



      if (!productsResponse.ok || !suppliersResponse.ok) {

        throw new Error("Could not load products or suppliers");

      }



      const [productData, supplierData] = await Promise.all([

        productsResponse.json(),

        suppliersResponse.json(),

      ]);



      setProducts(productData.map(mapProduct));

      setSuppliers(supplierData.map(mapSupplier));

    } catch (error) {

      console.error("Inventory loading error:", error);

      notify?.("Unable to load data. Check that the backend is running.", "error");

    } finally {

      setLoading(false);

    }

  };
  const handleRefresh = async () => {
    setLoading(true);
    await loadData();
  };

  const handleResetFilters = () => {
    setQ("");
    setCat("All Categories");
    setStatus("All Status");
  };

  const handleResetForm = () => {
    if (edit) {
      const product = products.find((p) => p.productId === edit);
      if (product) {
        setForm({
          ...product,
          stock: product.availableStock ?? product.stock,
        });
      }
      return;
    }

    setForm({
      ...blank,
      productId: `PRD-${Date.now().toString().slice(-6)}`,
      supplierId: suppliers[0]?.supplierId || "",
    });
  };





  useEffect(() => {

    loadData();

  }, []);



  const cats = [

    ...new Set(products.map((p) => p.category).filter(Boolean)),

  ];



  const rows = useMemo(

    () =>

      products.filter((p) => {

        const stock = Number(p.availableStock ?? p.stock);

        const text =

          `${p.productId} ${p.productName} ${p.category} ${p.supplierId}`.toLowerCase();



        return (

          (!q || text.includes(q.toLowerCase())) &&

          (cat === "All Categories" || p.category === cat) &&

          (status === "All Status" ||

            (status === "Low Stock" && stock <= Number(p.reorderLevel)) ||

            (status === "In Stock" && stock > Number(p.reorderLevel)))

        );

      }),

    [products, q, cat, status]

  );



  const openAdd = () => {

    setEdit(null);

    setForm({

      ...blank,

      productId: `PRD-${Date.now().toString().slice(-6)}`,

      supplierId: suppliers[0]?.supplierId || "",

    });

    setOpen(true);

  };



  const openEdit = (product) => {

    setEdit(product.productId);

    setForm({

      ...product,

      stock: product.availableStock ?? product.stock,

    });

    setOpen(true);

  };



  const save = async (e) => {

    e.preventDefault();



    if (!form.productId.trim() || !form.productName.trim()) {

      notify?.("Product ID and product name are required", "error");

      return;

    }



    if (

      Number(form.price) < 0 ||

      Number(form.stock) < 0 ||

      Number(form.reorderLevel) < 0 ||

      Number(form.reorderQuantity) < 0

    ) {

      notify?.("Values cannot be negative", "error");

      return;

    }



    const payload = {

      productId: form.productId.trim(),

      productName: form.productName.trim(),

      category: form.category,

      price: Number(form.price || 0),

      stock: Number(form.stock || 0),

      reorderLevel: Number(form.reorderLevel || 0),

      reorderQuantity: Number(form.reorderQuantity || 0),

      supplierId: form.supplierId || "",

    };



    setSaving(true);



    try {

      const response = await fetch(

        edit

          ? `${API}/products/${encodeURIComponent(edit)}`

          : `${API}/products`,

        {

          method: edit ? "PUT" : "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify(payload),

        }

      );



      if (!response.ok) {

        const message = await response.text();

        throw new Error(message || "Product could not be saved");

      }



      await loadData();

      setOpen(false);

      notify?.(

        edit ? "Product updated successfully" : "Product added successfully"

      );

    } catch (error) {

      console.error("Save product error:", error);

      notify?.(`Save failed: ${error.message}`, "error");

    } finally {

      setSaving(false);

    }

  };



  const remove = async (id) => {

    if (!window.confirm("Delete this product from the database?")) return;



    try {

      const response = await fetch(

        `${API}/products/${encodeURIComponent(id)}`,

        { method: "DELETE" }

      );



      if (!response.ok) {

        const message = await response.text();

        throw new Error(message || "Product could not be deleted");

      }



      await loadData();

      notify?.("Product deleted successfully");

    } catch (error) {

      console.error("Delete product error:", error);

      notify?.(`Delete failed: ${error.message}`, "error");

    }

  };



  return (

    <div className="page-content">

      <div className="page-title action-title">

        <div>

          <h1>Products</h1>

          <p>Manage products, inventory quantities and reorder levels.</p>

        </div>

        <div className="page-actions">
            <button type="button" className="secondary-button" onClick={handleRefresh} disabled={loading}>
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
            <button type="button" className="primary-button" onClick={openAdd}>
              ＋ Add Product
            </button>
          </div>

      </div>



      <section className="section-card">

        <div className="filter-bar">

          <div className="search-field">

            <span>⌕</span>

            <input

              value={q}

              onChange={(e) => setQ(e.target.value)}

              placeholder="Search products by ID, name, category..."

            />

            <button onClick={() => setQ("")}>×</button>

          </div>



          <select value={cat} onChange={(e) => setCat(e.target.value)}>

            <option>All Categories</option>

            {cats.map((x) => (

              <option key={x}>{x}</option>

            ))}

          </select>



          <select value={status} onChange={(e) => setStatus(e.target.value)}>

            <option>All Status</option>

            <option>In Stock</option>

            <option>Low Stock</option>

          </select>



          <button

            type="button"

            className="secondary-button reset-button"

            onClick={handleResetFilters}

          >

            Reset

          </button>

        </div>



        <div className="result-count">

          {loading ? "Loading products..." : `${rows.length} product${rows.length !== 1 ? "s" : ""} found`}

        </div>



        <div className="table-container">

          <table>

            <thead>

              <tr>

                <th>ID</th>

                <th>Product Name</th>

                <th>Category</th>

                <th>Supplier</th>

                <th>Stock</th>

                <th>Reorder Level</th>

                <th>Reorder Qty</th>

                <th>Status</th>

                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              {rows.map((p) => {

                const stock = Number(p.availableStock ?? p.stock);

                return (

                  <tr key={p.productId}>

                    <td>{p.productId}</td>

                    <td><strong>{p.productName}</strong></td>

                    <td>{p.category}</td>

                    <td>

                      {suppliers.find((s) => s.supplierId === p.supplierId)?.supplierName || "—"}

                    </td>

                    <td>{stock}</td>

                    <td>{p.reorderLevel}</td>

                    <td>{p.reorderQuantity}</td>

                    <td>

                      <StatusBadge

                        status={stock <= Number(p.reorderLevel) ? "LOW STOCK" : "IN STOCK"}

                      />

                    </td>

                    <td>

                      <div className="row-actions">

                        <button title="Edit" onClick={() => openEdit(p)}>✎</button>

                        <button title="Delete" onClick={() => remove(p.productId)}>⌫</button>

                      </div>

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>



        {!loading && rows.length === 0 && (

          <div className="empty-state">No products match the selected search/filter.</div>

        )}

      </section>



      {open && (

        <Modal

          title={edit ? "Edit Product" : "Add New Product"}

          onClose={() => !saving && setOpen(false)}

          footer={

            <>

              <button className="secondary-button" type="button" onClick={handleResetForm} disabled={saving}>
                Reset Form
              </button>
              <button className="secondary-button" type="button" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </button>

              <button

                className="primary-button"

                type="submit"

                form="product-form"

                disabled={saving}

              >

                {saving ? "Saving..." : "Save Product"}

              </button>

            </>

          }

        >

          <form id="product-form" className="form-grid" onSubmit={save}>

            <label>

              Product ID

              <input

                value={form.productId}

                disabled={!!edit}

                onChange={(e) => setForm({ ...form, productId: e.target.value })}

              />

            </label>



            <label>

              Product Name

              <input

                required

                value={form.productName}

                onChange={(e) => setForm({ ...form, productName: e.target.value })}

              />

            </label>



            <label>

              Category

              <select

                value={form.category}

                onChange={(e) => setForm({ ...form, category: e.target.value })}

              >

                {[...new Set(["Grocery", "Dairy", "Beverages", "Packaging", "Electronics", "Accessories", ...cats])].map((c) => (

                  <option key={c}>{c}</option>

                ))}

              </select>

            </label>



            <label>

              Supplier

              <select

                value={form.supplierId}

                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}

              >

                <option value="">No supplier</option>

                {suppliers.map((s) => (

                  <option key={s.supplierId} value={s.supplierId}>

                    {s.supplierName}

                  </option>

                ))}

              </select>

            </label>



            <label>

              Unit Price

              <input

                type="number"

                min="0"

                step="0.01"

                value={form.price}

                onChange={(e) => setForm({ ...form, price: e.target.value })}

              />

            </label>



            <label>

              Stock Quantity

              <input

                type="number"

                min="0"

                value={form.stock}

                onChange={(e) => setForm({ ...form, stock: e.target.value })}

              />

            </label>



            <label>

              Reorder Level

              <input

                type="number"

                min="0"

                value={form.reorderLevel}

                onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}

              />

            </label>



            <label>

              Reorder Quantity

              <input

                type="number"

                min="0"

                value={form.reorderQuantity}

                onChange={(e) => setForm({ ...form, reorderQuantity: e.target.value })}

              />

            </label>

          </form>

        </Modal>

      )}

    </div>

  );

}