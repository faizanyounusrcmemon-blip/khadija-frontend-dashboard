// src/pages/InvoiceEdit.jsx
import React, { useEffect, useState } from "react";
import supabase from "../utils/supabaseClient";

export default function InvoiceEdit({ onNavigate }) {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const inv = localStorage.getItem("edit_invoice");
    if (inv) {
      setInvoiceNo(inv);
      loadInvoice(inv);
    }
  }, []);

  async function loadInvoice(inv) {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("invoice_no", inv)
      .eq("is_deleted", false);

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    if (!data || !data.length) {
      alert("Invoice not found");
      setLoading(false);
      return;
    }

    // Extract customer info and items
    setCustomer({
      name: data[0].customer_name,
      phone: data[0].customer_phone,
      date: data[0].sale_date,
    });

    setItems(data);
    setLoading(false);
  }

  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    // update amount dynamically
    const qty = Number(updated[index].qty || 0);
    const rate = Number(updated[index].sale_rate || 0);
    const disc = Number(updated[index].discount || 0);
    const amount = qty * rate - (disc / 100) * qty * rate;
    updated[index].amount = amount;

    setItems(updated);
  };

  const handleRemove = (index) => {
    if (!confirm("Remove this item?")) return;
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleSave = async () => {
    if (!items.length) return alert("No items to save!");
    setLoading(true);

    try {
      // Soft delete old invoice records
      await supabase
        .from("sales")
        .update({ is_deleted: true })
        .eq("invoice_no", invoiceNo);

      // Remove id to avoid duplicate primary key error
      const cleanItems = items.map(({ id, ...rest }) => rest);

      // Insert updated invoice records
      const { error } = await supabase.from("sales").insert(cleanItems);

      if (error) throw error;

      alert("✅ Invoice updated successfully!");
      onNavigate("sales-detail"); // go back to sale list
    } catch (err) {
      alert("Error saving: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 12, fontFamily: "Inter" }}>
      <h2 style={{ color: "#f3c46b" }}>📝 Edit Invoice - {invoiceNo}</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{ marginBottom: 10 }}>
            <b>Customer:</b> {customer.name || "Cash Sale"} <br />
            <b>Phone:</b> {customer.phone || "-"} <br />
            <b>Date:</b> {customer.date}
          </div>

          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead style={{ background: "#222", color: "#fff" }}>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Disc%</th>
                <th>Amount</th>
                <th>❌</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i, index) => (
                <tr key={index}>
                  <td>{i.item_name}</td>
                  <td>
                    <input
                      type="number"
                      value={i.qty}
                      onChange={(e) =>
                        handleChange(index, "qty", Number(e.target.value))
                      }
                      style={{ width: "60px" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={i.sale_rate}
                      onChange={(e) =>
                        handleChange(index, "sale_rate", Number(e.target.value))
                      }
                      style={{ width: "60px" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={i.discount || 0}
                      onChange={(e) =>
                        handleChange(index, "discount", Number(e.target.value))
                      }
                      style={{ width: "50px" }}
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {Number(i.amount || 0).toFixed(2)}
                  </td>
                  <td>
                    <button
                      onClick={() => handleRemove(index)}
                      style={{
                        background: "red",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        padding: "2px 5px",
                        cursor: "pointer",
                      }}
                    >
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 10, textAlign: "right" }}>
            <b>
              Total: Rs{" "}
              {items
                .reduce((sum, i) => sum + Number(i.amount || 0), 0)
                .toFixed(2)}
            </b>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
            <button
              onClick={handleSave}
              style={{
                background: "#4caf50",
                color: "white",
                border: "none",
                padding: "8px 10px",
                borderRadius: 6,
                width: "100%",
              }}
            >
              💾 Save Changes
            </button>
            <button
              onClick={() => onNavigate("sales-detail")}
              style={{
                background: "#999",
                color: "white",
                border: "none",
                padding: "8px 10px",
                borderRadius: 6,
                width: "100%",
              }}
            >
              🔙 Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}
