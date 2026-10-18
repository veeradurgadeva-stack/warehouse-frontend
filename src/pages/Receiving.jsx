import { useEffect, useMemo, useState } from "react";

import StatusBadge from "../components/common/StatusBadge";

import Modal from "../components/common/Modal";



const API = "http://localhost:8080/api";



export default function Receiving({ notify }) {

  const [records, setRecords] = useState([]);

  const [products, setProducts] = useState([]);

  const [suppliers, setSuppliers] = useState([]);

  const [locations, setLocations] = useState([]);

  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [completingId, setCompletingId] = useState(null);

  const [form, setForm] = useState({

    productId: "",

    supplierId: "",

    warehouseId: "1",

    locationId: "",

    receivedQuantity: "",

    receivedDate: new Date().toISOString().slice(0, 10),

  });



  const loadData = async (showLoading = true) => {

    if (showLoading) setLoading(true);

    try {

      const responses = await Promise.all([

        fetch(`${API}/receiving`),

        fetch(`${API}/products`),

        fetch(`${API}/suppliers`),

        fetch(`${API}/warehouses/locations`),

      ]);

      const failed = responses.find((r) => !r.ok);

      if (failed) throw new Error(`Unable to load receiving data (HTTP ${failed.status})`);

      const [rData, pData, sData, lData] = await Promise.all(responses.map((r) => r.json()));



      setRecords(Array.isArray(rData) ? rData : []);

      setProducts((Array.isArray(pData) ? pData : []).map((p) => ({

        productId: String(p.PRODUCT_ID ?? p.productId ?? ""),

        productName: p.PRODUCT_NAME ?? p.productName ?? "",

        supplierId: String(p.SUPPLIER_ID ?? p.supplierId ?? ""),

      })));

      setSuppliers((Array.isArray(sData) ? sData : []).map((s) => ({

        supplierId: String(s.SUPPLIER_ID ?? s.supplierId ?? ""),

        supplierName: s.SUPPLIER_NAME ?? s.supplierName ?? "",

      })));

      setLocations((Array.isArray(lData) ? lData : []).map((l) => ({

        locationId: Number(l.LOCATION_ID ?? l.locationId),

        code: l.LOCATION_CODE ?? l.locationCode ?? l.code ?? "",

        zone: l.LOCATION_TYPE ?? l.locationType ?? l.zone ?? "",

        warehouseId: Number(l.WAREHOUSE_ID ?? l.warehouseId ?? 1),

      })));

    } catch (error) {

      console.error("Receiving loading error:", error);

      notify?.(`${error.message}. Check the backend and Oracle connection.`, "error");

    } finally {

      setLoading(false);

    }

  };
  const handleRefresh = async () => {
    await loadData(true);
  };

  const handleResetSearch = () => {
    setQ("");
  };

  const getDefaultForm = () => ({
    productId: products[0]?.productId || "",
    supplierId:
      products.find((p) => p.productId === (products[0]?.productId || ""))?.supplierId ||
      suppliers[0]?.supplierId ||
      "",
    warehouseId: String(locations[0]?.warehouseId || 1),
    locationId: locations[0] ? String(locations[0].locationId) : "",
    receivedQuantity: "",
    receivedDate: new Date().toISOString().slice(0, 10),
  });

  const handleResetForm = () => {
    setForm(getDefaultForm());
  };





  useEffect(() => { loadData(); }, []);



  useEffect(() => {

    if (!products.length || !suppliers.length) return;

    setForm((old) => ({

      ...old,

      productId: old.productId || products[0].productId,

      supplierId: old.supplierId || products.find((p) => p.productId === old.productId)?.supplierId || suppliers[0].supplierId,

      locationId: old.locationId || (locations[0] ? String(locations[0].locationId) : ""),

      warehouseId: old.locationId

        ? old.warehouseId

        : String(locations[0]?.warehouseId || 1),

    }));

  }, [products, suppliers, locations]);



  const value = (r, upper, lower) => r?.[upper] ?? r?.[lower] ?? "";

  const normalizeStatus = (r) =>

    String(value(r, "PUTAWAY_STATUS", "STATUS") || value(r, "status", "putawayStatus") || "IN PROGRESS")

      .trim().toUpperCase().replaceAll("_", " ");



  const rows = useMemo(() => {

    const query = q.trim().toLowerCase();

    return records.filter((r) => {

      const searchable = [

        value(r, "RECEIVING_ID", "receivingId"),

        value(r, "SUPPLIER_NAME", "supplierName"),

        value(r, "SUPPLIER", "supplier"),

        value(r, "PRODUCT_NAME", "productName"),

        value(r, "PRODUCT_ID", "productId"),

        value(r, "LOCATION_CODE", "locationCode"),

        value(r, "LOCATION_ID", "locationId"),

        normalizeStatus(r),

      ].join(" ").toLowerCase();

      return searchable.includes(query);

    });

  }, [records, q]);



  const add = () => {
    setForm(getDefaultForm());
    setOpen(true);
  };



  const save = async (e) => {

    e.preventDefault();

    const qty = Number(form.receivedQuantity);

    if (!form.productId || !form.supplierId || !form.locationId) {

      notify?.("Select product, supplier and putaway location.", "error");

      return;

    }

    if (!Number.isInteger(qty) || qty <= 0) {

      notify?.("Enter a positive whole-number quantity.", "error");

      return;

    }

    const selectedLocation = locations.find((l) => l.locationId === Number(form.locationId));

    if (!selectedLocation) {

      notify?.("Selected warehouse location is no longer available. Reload and try again.", "error");

      return;

    }



    const payload = {

      productId: form.productId,

      supplierId: form.supplierId,

      warehouseId: Number(selectedLocation.warehouseId || form.warehouseId || 1),

      locationId: Number(form.locationId),

      receivedQuantity: qty,

      receivedDate: form.receivedDate,

      status: "IN PROGRESS",

    };



    setSaving(true);

    try {

      const response = await fetch(`${API}/receiving`, {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(payload),

      });

      if (!response.ok) {

        const message = await response.text();

        throw new Error(message || `Could not save receiving record (HTTP ${response.status})`);

      }

      await loadData(false);

      setOpen(false);

      notify?.("Receiving saved. Stock will be added to available inventory only after putaway is completed.");

    } catch (error) {

      console.error("Save receiving error:", error);

      notify?.(`Receiving failed: ${error.message}`, "error");

    } finally {

      setSaving(false);

    }

  };



  const completePutaway = async (record) => {

    const id = value(record, "RECEIVING_ID", "receivingId");

    if (!id) {

      notify?.("Receiving ID is missing; cannot complete putaway.", "error");

      return;

    }

    const confirmed = window.confirm(

      `Complete putaway for receiving R${String(id).slice(-4)}? This will add the received quantity to inventory and update location capacity exactly once.`

    );

    if (!confirmed) return;



    setCompletingId(id);

    try {

      const response = await fetch(`${API}/receiving/${encodeURIComponent(id)}/putaway/complete`, {

        method: "PUT",

        headers: { "Content-Type": "application/json" },

      });

      if (!response.ok) {

        const message = await response.text();

        throw new Error(message || `Could not complete putaway (HTTP ${response.status})`);

      }

      await loadData(false);

      notify?.("Putaway completed. Inventory and warehouse location were updated.");

    } catch (error) {

      console.error("Putaway completion error:", error);

      notify?.(`Putaway failed: ${error.message}`, "error");

    } finally {

      setCompletingId(null);

    }

  };



  const formatDate = (raw) => {

    if (!raw) return "—";

    const date = String(raw).slice(0, 10);

    const parsed = new Date(`${date}T00:00:00`);

    return Number.isNaN(parsed.getTime())

      ? String(raw)

      : parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  };



  return (

    <div className="page-content">

      <div className="page-title action-title">

        <div>

          <h1>Receiving &amp; Putaway</h1>

          <p>Receive incoming stock and put it into a warehouse location.</p>

        </div>

        <div className="page-actions">
          <button type="button" className="secondary-button" onClick={handleRefresh} disabled={loading}>
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
          <button type="button" className="primary-button" onClick={add}>＋ New Receiving</button>
        </div>

      </div>



      <section className="section-card">

        <div className="filter-bar">

          <div className="search-field wide">

            <span>⌕</span>

            <input

              value={q}

              onChange={(e) => setQ(e.target.value)}

              placeholder="Search receiving ID, supplier or product..."

            />

          </div>
            <button type="button" className="secondary-button reset-button" onClick={handleResetSearch}>Reset Search</button>

        </div>



        <div className="result-count">

          {loading ? "Loading receiving records..." : `${rows.length} records found`}

        </div>



        <div className="table-container">

          <table>

            <thead>

              <tr>

                <th>ID</th><th>Supplier</th><th>Product</th><th>Quantity</th>

                <th>Location</th><th>Date</th><th>Status</th><th>Action</th>

              </tr>

            </thead>

            <tbody>

              {rows.map((r, i) => {

                const id = value(r, "RECEIVING_ID", "receivingId");

                const productId = String(value(r, "PRODUCT_ID", "productId"));

                const locationId = Number(value(r, "LOCATION_ID", "locationId"));

                const product = products.find((p) => p.productId === productId);

                const location = locations.find((l) => l.locationId === locationId);

                const productName = value(r, "PRODUCT_NAME", "productName") || product?.productName || productId || "—";

                const supplierName = value(r, "SUPPLIER_NAME", "supplierName") ||

                  value(r, "SUPPLIER", "supplier") ||

                  suppliers.find((s) => s.supplierId === String(value(r, "SUPPLIER_ID", "supplierId")))?.supplierName || "—";

                const status = normalizeStatus(r);

                const date = value(r, "RECEIVED_DATE", "receivedDate");

                return (

                  <tr key={id || i}>

                    <td>R{String(id ?? "").slice(-4)}</td>

                    <td>{supplierName}</td>

                    <td>{productName}</td>

                    <td>{value(r, "RECEIVED_QUANTITY", "receivedQuantity")}</td>

                    <td>{value(r, "LOCATION_CODE", "locationCode") || location?.code || (locationId ? `Location ${locationId}` : "—")}</td>

                    <td>{formatDate(date)}</td>

                    <td><StatusBadge status={status} /></td>

                    <td>

                      {status !== "COMPLETED" && status !== "PUTAWAY COMPLETED" ? (

                        <button

                          type="button"

                          className="secondary-button"

                          disabled={completingId === id || loading}

                          onClick={() => completePutaway(r)}

                        >

                          {completingId === id ? "Completing..." : "Complete Putaway"}

                        </button>

                      ) : <span>—</span>}

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

        {!loading && rows.length === 0 && <div className="empty-state">No receiving records found.</div>}

      </section>



      {open && (

        <Modal

          title="New Receiving"

          onClose={() => !saving && setOpen(false)}

          footer={

            <>

              <button className="secondary-button" type="button" onClick={handleResetForm} disabled={saving}>Reset Form</button>
              <button className="secondary-button" type="button" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>

              <button className="primary-button" type="submit" form="receive-form" disabled={saving}>

                {saving ? "Saving..." : "Save Receiving"}

              </button>

            </>

          }

        >

          <form id="receive-form" className="form-grid" onSubmit={save}>

            <label>

              Product

              <select required value={form.productId} onChange={(e) => {

                const selectedProduct = products.find((p) => p.productId === e.target.value);

                setForm({

                  ...form,

                  productId: e.target.value,

                  supplierId: selectedProduct?.supplierId || form.supplierId,

                });

              }}>

                <option value="">Select product</option>

                {products.map((p) => <option key={p.productId} value={p.productId}>{p.productName} ({p.productId})</option>)}

              </select>

            </label>

            <label>

              Supplier

              <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>

                <option value="">Select supplier</option>

                {suppliers.map((s) => <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>)}

              </select>

            </label>

            <label>

              Putaway Location

              <select required value={form.locationId} onChange={(e) => {

                const selected = locations.find((l) => l.locationId === Number(e.target.value));

                setForm({ ...form, locationId: e.target.value, warehouseId: String(selected?.warehouseId || 1) });

              }}>

                <option value="">Select location</option>

                {locations.map((l) => <option key={l.locationId} value={l.locationId}>{l.code || `Location ${l.locationId}`} {l.zone ? `· ${l.zone}` : ""}</option>)}

              </select>

            </label>

            <label>

              Quantity

              <input type="number" min="1" step="1" required value={form.receivedQuantity}

                onChange={(e) => setForm({ ...form, receivedQuantity: e.target.value })} />

            </label>

            <label>

              Received Date

              <input type="date" required value={form.receivedDate}

                onChange={(e) => setForm({ ...form, receivedDate: e.target.value })} />

            </label>

            <p className="form-hint">New records start as IN PROGRESS. Available stock and location capacity update only when putaway is completed.</p>

          </form>

        </Modal>

      )}

    </div>

  );

}
