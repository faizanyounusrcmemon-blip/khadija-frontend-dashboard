import React, { useEffect, useState } from "react";
import supabase from "../utils/supabaseClient";

export default function SaleItemDetail({ onNavigate }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerList, setCustomerList] = useState([]);
  const [itemList, setItemList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [filteredSales, setFilteredSales] = useState([]);

  // Load customers and items
  useEffect(() => {
    const loadLists = async () => {
      const { data: customers } = await supabase.from("sales").select("customer_name");
      const { data: items } = await supabase.from("sales").select("item_name");

      const uniqueCustomers = customers ? [...new Set(customers.map((c) => c.customer_name))] : [];
      const uniqueItems = items ? [...new Set(items.map((i) => i.item_name))] : [];

      setCustomerList(uniqueCustomers);
      setItemList(uniqueItems);
    };
    loadLists();
  }, []);

  // Search handler
  const handleSearch = async () => {
    let query = supabase.from("sales").select("*");

    if (fromDate && toDate) {
      query = query.gte("sale_date", fromDate).lte("sale_date", toDate);
    }
    if (selectedCustomer) {
      query = query.eq("customer_name", selectedCustomer);
    }
    if (selectedItem) {
      query = query.eq("item_name", selectedItem);
    }

    const { data, error } = await query.order("invoice_no", { ascending: true });
    if (error) {
      console.error(error);
      setFilteredSales([]);
    } else {
      setFilteredSales(data || []);
    }
  };

  // Group by invoice_no
  const grouped = filteredSales.reduce((acc, sale) => {
    if (!acc[sale.invoice_no]) acc[sale.invoice_no] = { customer: sale, items: [] };
    acc[sale.invoice_no].items.push(sale);
    return acc;
  }, {});
  const invoices = Object.keys(grouped);

  // Inline styles to ensure borders show regardless of CSS framework
  const containerStyle = { padding: 16, fontFamily: "Arial, sans-serif" };
  const blockStyle = { border: "2px solid #999", borderRadius: 6, padding: 12, marginBottom: 20, background: "#fff" };
  const tableStyle = { width: "100%", borderCollapse: "collapse", border: "1px solid #666" };
  const thStyle = { padding: 8, border: "1px solid #666", background: "#e6eef8", textAlign: "left", fontWeight: 700 };
  const tdStyle = { padding: 8, border: "1px solid #666", textAlign: "left" };
  const moneyTdStyle = { ...tdStyle, textAlign: "right" };
  const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>🧾 Sales Item Detail</h2>
        <button
          onClick={() => onNavigate && onNavigate("sale-detail")}
          style={{
            padding: "6px 10px",
            background: "#e53e3e",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          🚪 Exit
        </button>
      </div>

      {/* Filters block */}
      <div style={{ ...blockStyle, background: "#f9fafb" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 160 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>From Date:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>To Date:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
          </div>

          <div style={{ minWidth: 220 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Customer:</label>
            <input
              list="customerList"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              placeholder="Search customer..."
              style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
            <datalist id="customerList">
              {customerList.map((c, idx) => (
                <option key={idx} value={c} />
              ))}
            </datalist>
          </div>

          <div style={{ minWidth: 220 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Item:</label>
            <input
              list="itemList"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              placeholder="Search item..."
              style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
            <datalist id="itemList">
              {itemList.map((i, idx) => (
                <option key={idx} value={i} />
              ))}
            </datalist>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            onClick={handleSearch}
            style={{
              padding: "8px 12px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            🔍 Search
          </button>
        </div>
      </div>

      {/* Results */}
      {invoices.length > 0 ? (
        invoices.map((inv) => {
          const data = grouped[inv];
          const total = data.items.reduce((sum, i) => sum + Number(i.amount || 0), 0);

          return (
            <div key={inv} style={blockStyle}>
              {/* Customer heading table with border */}
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Invoice No</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Customer Name</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Address</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={tdStyle}>{inv}</td>
                    <td style={tdStyle}>{data.customer.sale_date}</td>
                    <td style={tdStyle}>{data.customer.customer_name}</td>
                    <td style={tdStyle}>{data.customer.customer_phone}</td>
                    <td style={tdStyle}>{data.customer.customer_address}</td>
                  </tr>
                </tbody>
              </table>

              {/* Spacing */}
              <div style={{ height: 12 }} />

              {/* Items table with borders */}
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Item Name</th>
                    <th style={thStyle}>Barcode</th>
                    <th style={thStyle}>Qty</th>
                    <th style={thStyle}>Rate</th>
                    <th style={thStyle}>Discount %</th>
                    <th style={thStyle}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((it) => (
                    <tr key={it.id}>
                      <td style={tdStyle}>{it.item_name}</td>
                      <td style={tdStyle}>{it.barcode}</td>
                      <td style={tdStyle}>{it.qty}</td>
                      <td style={tdStyle}>{it.sale_rate}</td>
                      <td style={tdStyle}>{it.discount}</td>
                      <td style={moneyTdStyle}>{Number(it.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total with top border */}
              <div style={{ marginTop: 12, borderTop: "1px solid #666", paddingTop: 8, textAlign: "right", fontWeight: 700 }}>
                Total: Rs {total.toFixed(2)}
              </div>
            </div>
          );
        })
      ) : (
        <p style={{ textAlign: "center", color: "#6b7280" }}>No records found.</p>
      )}
    </div>
  );
}
