// src/pages/StockReport.jsx
import React, { useEffect, useState } from "react";
import supabase from "../utils/supabaseClient";

export default function StockReport({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [q]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("item_code, item_name, barcode, purchase_rate, qty");

      const map = new Map();

      purchases?.forEach(r => {
        const code = String(r.item_code || "");
        if (!code) return;

        const item = map.get(code) || {
          item_code: code,
          item_name: r.item_name,
          barcode: r.barcode,
          purchase_qty: 0,
          purchase_rate: Number(r.purchase_rate || 0),
          sold_qty: 0
        };

        item.purchase_qty += Number(r.qty || 0);
        map.set(code, item);
      });

      // ✅ صرف وہی sales لا رہے ہیں جن کا deleted = false ہے
      const { data: sales, error: salesErr } = await supabase
        .from("sales")
        .select("item_code, qty, is_deleted")
        .eq("is_deleted", false); // 🔥 یہی اصل لائن ہے

      if (salesErr) throw salesErr;

      sales?.forEach(r => {
        const code = String(r.item_code || "");
        const qty = Number(r.qty || 0);
        if (!code) return;

        const item = map.get(code);
        if (!item) return;

        item.sold_qty += qty;
      });

      const final = [];

      for (const it of map.values()) {
        const remaining = it.purchase_qty - it.sold_qty;
        final.push({
          ...it,
          remaining_qty: remaining,
          remaining_amount: remaining * it.purchase_rate
        });
      }

      const f = q
        ? final.filter(
            r =>
              r.item_code.toLowerCase().includes(q.toLowerCase()) ||
              r.item_name.toLowerCase().includes(q.toLowerCase()) ||
              (r.barcode || "").toLowerCase().includes(q.toLowerCase())
          )
        : final;

      setRows(f);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  const totalValue = rows.reduce((s, r) => s + (r.remaining_amount || 0), 0);

  function handleExit() {
    if (typeof onNavigate === "function") onNavigate("dashboard");
    else window.history.back();
  }

  return (
    <div style={{ padding: 12, color: "#fff", fontFamily: "Inter" }}>
      <h2 style={{ color: "#f3c46b" }}>📦 Stock Report</h2>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 Search item code / name / barcode"
        style={{ width: "100%", padding: 8, borderRadius: 6, marginBottom: 10 }}
      />

      <div style={{ background: "#111", padding: 8, borderRadius: 6 }}>
        {loading ? "Loading..." : error ? error : (
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#222" }}>
                <th>Code</th>
                <th>Name</th>
                <th>Purchased</th>
                <th>Sold</th>
                <th>Remain</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="6">No items</td></tr>
              ) : rows.map(r => (
                <tr key={r.item_code}>
                  <td>{r.item_code}</td>
                  <td>{r.item_name}</td>
                  <td style={{ textAlign: "right" }}>{r.purchase_qty}</td>
                  <td style={{ textAlign: "right" }}>{r.sold_qty}</td>
                  <td style={{ textAlign: "right", color: r.remaining_qty < 0 ? "red" : "#4caf50" }}>
                    {r.remaining_qty}
                  </td>
                  <td style={{ textAlign: "right", color: "#f3c46b" }}>
                    {r.remaining_amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 8 }}>
          <b>Total Stock Value:</b> Rs {totalValue.toFixed(2)}
        </div>

        {/* Exit + Thermal Print Buttons */}
        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button
            onClick={handleExit}
            style={{ background: "#c33", padding: "8px 10px", borderRadius: 6, color: "#fff", width: "100%" }}
          >
            Exit
          </button>

          <button
            onClick={() => window.print()}
            style={{ background: "#4caf50", padding: "8px 10px", borderRadius: 6, color: "#fff", width: "100%" }}
          >
            🖨️ Thermal Print
          </button>
        </div>
      </div>

      {/* Thermal Print CSS */}
      <style>
        {`
        @media print {
          body {
            width: 80mm;
            font-size: 11px;
          }
          table {
            width: 100%;
          }
          button, input, h2 {
            display: none !important;
          }
        }
        `}
      </style>
    </div>
  );
}
