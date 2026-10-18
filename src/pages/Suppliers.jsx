
import { useEffect, useMemo, useState } from "react";
import StatusBadge from "../components/common/StatusBadge";
import Modal from "../components/common/Modal";

const API = "http://localhost:8080/api";

const mapSupplier = (s) => ({
  supplierId: String(s.SUPPLIER_ID ?? s.supplierId ?? ""),
  supplierName: s.SUPPLIER_NAME ?? s.supplierName ?? "",
  phone: s.PHONE ?? s.phone ?? "",
  email: s.EMAIL ?? s.email ?? "",
  address: s.ADDRESS ?? s.address ?? "",
  status: s.STATUS ?? s.status ?? "ACTIVE",
});

export default function Suppliers({ notify }) {
  const [suppliers, setSuppliers] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const blank = {
    supplierId: "",
    supplierName: "",
    phone: "",
    email: "",
    address: "",
    status: "ACTIVE",
  };

  const [form, setForm] = useState(blank);

  const loadData = async () => {
    try {
      const response = await fetch(`${API}/suppliers`);
      if (!response.ok) throw new Error("Unable to load suppliers");

      const data = await response.json();
      setSuppliers(data.map(mapSupplier));
    } catch (error) {
      console.error("Supplier loading error:", error);
      notify?.("Unable to load suppliers. Check backend.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rows = useMemo(
    () =>
      suppliers.filter((s) =>
        `${s.supplierId} ${s.supplierName} ${s.phone} ${s.email} ${s.address}`
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [suppliers, q]
  );

  const add = () => {
    setEdit(null);
    setForm({
      ...blank,
      supplierId: `SUP-${String(Date.now()).slice(-6)}`,
    });
    setOpen(true);
  };

  const editRow = (supplier) => {
    setEdit(supplier.supplierId);
    setForm({ ...supplier });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();

    if (
      !form.supplierId.trim() ||
      !form.supplierName.trim() ||
      !form.phone.trim() ||
      !form.email.trim()
    ) {
      notify?.(
        "Supplier ID, name, contact and email are required",
        "error"
      );
      return;
    }

    const payload = {
      supplierId: form.supplierId.trim(),
      supplierName: form.supplierName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      status: form.status,
    };

    setSaving(true);

    try {
      const response = await fetch(
        edit
          ? `${API}/suppliers/${encodeURIComponent(edit)}`
          : `${API}/suppliers`,
        {
          method: edit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to save supplier");
      }

      await loadData();
      setOpen(false);
      notify?.(
        edit
          ? "Supplier updated successfully"
          : "Supplier added successfully"
      );
    } catch (error) {
      console.error("Save supplier error:", error);
      notify?.(`Save failed: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this supplier from the database?")) return;

    try {
      const response = await fetch(
        `${API}/suppliers/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to delete supplier");
      }

      await loadData();
      notify?.("Supplier deleted successfully");
    } catch (error) {
      console.error("Delete supplier error:", error);
      notify?.(`Delete failed: ${error.message}`, "error");
    }
  };

  // Reset search filter
  const handleReset = () => {
    setQ("");
  };

  return (
    <div className="page-content">
      <div className="page-title action-title">
        <div>
          <h1>Suppliers</h1>
          <p>Manage supplier company, contact and email information.</p>
        </div>

        <button className="primary-button" onClick={add}>
          ＋ Add Supplier
        </button>
      </div>

      <section className="section-card">
        <div className="filter-bar">
          <div className="search-field wide">
            <span>⌕</span>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search supplier, phone, email or ID..."
            />

            <button type="button" onClick={handleReset}>
              ×
            </button>
          </div>

          <button
            type="button"
            className="secondary-button reset-button"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>

        <div className="result-count">
          {loading
            ? "Loading suppliers..."
            : `${rows.length} suppliers found`}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier Name</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((s) => (
                <tr key={s.supplierId}>
                  <td>{s.supplierId}</td>
                  <td>
                    <strong>{s.supplierName}</strong>
                  </td>
                  <td>{s.phone || "—"}</td>
                  <td>{s.email || "—"}</td>
                  <td>{s.address || "—"}</td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => editRow(s)}
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        title="Delete"
                        onClick={() => remove(s.supplierId)}
                      >
                        ⌫
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 && (
          <div className="empty-state">No suppliers found.</div>
        )}
      </section>

      {open && (
        <Modal
          title={edit ? "Edit Supplier" : "Add Supplier"}
          onClose={() => !saving && setOpen(false)}
          footer={
            <>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                type="submit"
                form="supplier-form"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Supplier"}
              </button>
            </>
          }
        >
          <form
            id="supplier-form"
            className="form-grid"
            onSubmit={save}
          >
            <label>
              Supplier ID
              <input
                value={form.supplierId}
                disabled={!!edit}
                onChange={(e) =>
                  setForm({ ...form, supplierId: e.target.value })
                }
              />
            </label>

            <label>
              Supplier Name
              <input
                required
                value={form.supplierName}
                onChange={(e) =>
                  setForm({ ...form, supplierName: e.target.value })
                }
              />
            </label>

            <label>
              Phone / Contact
              <input
                required
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
              />
            </label>

            <label>
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </label>

            <label className="full">
              Address
              <input
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
              />
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
              >
                <option>ACTIVE</option>
                <option>INACTIVE</option>
              </select>
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
}
