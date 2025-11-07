// src/pages/SaleEntry.jsx
import React, { useEffect, useState } from "react";
import supabase from "../utils/supabaseClient";
import ThermalPrint from "./ThermalPrint";

export default function SaleEntry() {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [focusedField, setFocusedField] = useState("");

  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerList, setCustomerList] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saleRate, setSaleRate] = useState("");
  const [qty, setQty] = useState("");
  const [discount, setDiscount] = useState("");
  const [amount, setAmount] = useState(0);
  const [itemList, setItemList] = useState([]);
  const [entries, setEntries] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [reprintInvoice, setReprintInvoice] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("customers").select("*");
      setCustomerList(data || []);
    })();
    (async () => {
      const { data } = await supabase.from("items").select("*");
      setItemList(data || []);
    })();
    (async () => {
      const { count } = await supabase.from("sales").select("*", { count: "exact" });
      setInvoiceNo(`INV-${(count || 0) + 1}`);
    })();
  }, []);

  useEffect(() => {
    if (!customerCode) return;
    const c = customerList.find((x) => String(x.customer_code) === String(customerCode));
    if (c) {
      setCustomerName(c.customer_name);
      setCustomerAddress(c.address);
      setCustomerPhone(c.phone);
    }
  }, [customerCode]);

  useEffect(() => {
    if (!itemCode && !barcode) return;
    const i =
      itemList.find(
        (x) =>
          String(x.id) === String(itemCode) ||
          String(x.barcode) === String(barcode)
      ) || null;
    if (i) {
      setItemCode(i.id);
      setBarcode(i.barcode);
      setItemName(i.item_name);
      setCategory(i.category);
      setDescription(i.description);
      setSaleRate(i.sale_price);
    }
  }, [itemCode, barcode]);

  useEffect(() => {
    const rate = parseFloat(saleRate || 0);
    const q = parseFloat(qty || 0);
    const d = parseFloat(discount || 0);
    const a = (rate * q) - (rate * q * d) / 100;
    setAmount(isNaN(a) ? 0 : a);
  }, [saleRate, qty, discount]);

  const handleAdd = () => {
    if (!itemName || !qty) return alert("Item or Qty missing!");
    const newItem = {
      itemCode,
      barcode,
      itemName,
      category,
      description,
      saleRate,
      qty,
      discount,
      amount,
    };
    setEntries([...entries, newItem]);
    setItemCode("");
    setBarcode("");
    setItemName("");
    setCategory("");
    setDescription("");
    setSaleRate("");
    setQty("");
    setDiscount("");
    setAmount(0);
    setTimeout(() => document.getElementById("itemCode").focus(), 100);
  };

  const handleRemove = (index) => {
    const updated = [...entries];
    updated.splice(index, 1);
    setEntries(updated);
  };

  const handleSave = async () => {
    if (!entries.length) return alert("No items added!");
    const total = entries.reduce((s, e) => s + Number(e.amount || 0), 0);
    const rows = entries.map((e) => ({
      invoice_no: invoiceNo,
      sale_date: saleDate,
      customer_code: customerCode,
      customer_name: customerName,
      customer_address: customerAddress,
      customer_phone: customerPhone,
      item_code: e.itemCode,
      item_name: e.itemName,
      barcode: e.barcode,
      category: e.category,
      description: e.description,
      sale_rate: e.saleRate,
      qty: e.qty,
      amount: e.amount,
      discount: e.discount,
      total_amount: total,
      created_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("sales").insert(rows);
    if (error) return alert("Error saving sale: " + error.message);

    for (const e of entries)
      await supabase.rpc("decrease_stock", { p_barcode: e.barcode, p_qty: e.qty });

    alert("Sale saved successfully!");
    setPrintData({
      invoiceNo,
      saleDate,
      customerName,
      customerPhone,
      entries,
      total,
      discount,
    });
    setEntries([]);
  };

  // ✅ Reprint Function
  const handleReprint = async () => {
    if (!reprintInvoice) return alert("Enter invoice number to print");
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("invoice_no", reprintInvoice);

    if (error || !data?.length) return alert("Invoice not found!");
    const entries = data.map((d) => ({
      itemName: d.item_name,
      qty: d.qty,
      saleRate: d.sale_rate,
      amount: d.amount,
      discount: d.discount,
    }));

    setPrintData({
      invoiceNo: reprintInvoice,
      saleDate: data[0].sale_date,
      customerName: data[0].customer_name,
      customerPhone: data[0].customer_phone,
      entries,
      total: data[0].total_amount,
      discount: data[0].discount,
    });
  };

  const focusStyle = (name) => ({
    border: focusedField === name ? "2px solid blue" : "1px solid #ccc",
    outline: "none",
  });

  const handleItemCodeEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const found = itemList.find((x) => String(x.id) === String(itemCode));
      if (found) {
        setBarcode(found.barcode);
        setItemName(found.item_name);
        setCategory(found.category);
        setDescription(found.description);
        setSaleRate(found.sale_price);
      }
      setItemCode("");
      document.getElementById("barcode").focus();
    }
  };

  const handleBarcodeEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const found = itemList.find((x) => String(x.barcode) === String(barcode));
      if (found) {
        setItemCode(found.id);
        setItemName(found.item_name);
        setCategory(found.category);
        setDescription(found.description);
        setSaleRate(found.sale_price);
      }
      setBarcode("");
      document.getElementById("itemName").focus();
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2 style={{ textAlign: "center" }}>Sale Entry</h2>

      {/* 🔹 Invoice + Date + Reprint */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 12,
          border: "1px solid #ccc",
          padding: 8,
          borderRadius: 6,
        }}
      >
        <div>
          <label>Invoice No</label>
          <input
            value={invoiceNo}
            readOnly
            style={{
              border: "1px solid #ccc",
              padding: 5,
              marginLeft: 5,
              background: "#f3f3f3",
            }}
          />
        </div>

        <div>
          <label>Date</label>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            style={{ border: "1px solid #ccc", padding: 5, marginLeft: 5 }}
          />
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <input
            placeholder="Enter Invoice No to Print"
            value={reprintInvoice}
            onChange={(e) => setReprintInvoice(e.target.value)}
            style={{ border: "1px solid #ccc", padding: 5 }}
          />
          <button
            onClick={handleReprint}
            style={{
              background: "#007bff",
              color: "white",
              border: "none",
              padding: "5px 10px",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* ✅ Rest of Original Code Unchanged */}
      {/* Customer Info */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div>
          <label>Customer Code</label>
          <input
            id="customerCode"
            style={focusStyle("customerCode")}
            onFocus={() => setFocusedField("customerCode")}
            onBlur={() => setFocusedField("")}
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("customerName").focus()}
          />
        </div>
        <div>
          <label>Customer Name</label>
          <input
            id="customerName"
            style={focusStyle("customerName")}
            onFocus={() => setFocusedField("customerName")}
            onBlur={() => setFocusedField("")}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("customerAddress").focus()}
          />
        </div>
        <div>
          <label>Address</label>
          <input
            id="customerAddress"
            style={focusStyle("customerAddress")}
            onFocus={() => setFocusedField("customerAddress")}
            onBlur={() => setFocusedField("")}
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("customerPhone").focus()}
          />
        </div>
        <div>
          <label>Phone</label>
          <input
            id="customerPhone"
            style={focusStyle("customerPhone")}
            onFocus={() => setFocusedField("customerPhone")}
            onBlur={() => setFocusedField("")}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("itemCode").focus()}
          />
        </div>
      </div>

      {/* Item Entry */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          border: "1px solid #ddd",
          padding: 10,
          borderRadius: 6,
        }}
      >
        <div>
          <label>Item Code</label>
          <input
            id="itemCode"
            style={focusStyle("itemCode")}
            onFocus={() => setFocusedField("itemCode")}
            onBlur={() => setFocusedField("")}
            value={itemCode}
            onChange={(e) => setItemCode(e.target.value)}
            onKeyDown={handleItemCodeEnter}
          />
        </div>

        <div>
          <label>Barcode</label>
          <input
            id="barcode"
            style={focusStyle("barcode")}
            onFocus={() => setFocusedField("barcode")}
            onBlur={() => setFocusedField("")}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleBarcodeEnter}
          />
        </div>

        <div>
          <label>Item Name</label>
          <input
            id="itemName"
            style={focusStyle("itemName")}
            onFocus={() => setFocusedField("itemName")}
            onBlur={() => setFocusedField("")}
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("category").focus()}
          />
        </div>

        <div>
          <label>Category</label>
          <input
            id="category"
            style={focusStyle("category")}
            onFocus={() => setFocusedField("category")}
            onBlur={() => setFocusedField("")}
            value={category}
            readOnly
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("description").focus()}
          />
        </div>

        <div>
          <label>Description</label>
          <input
            id="description"
            style={focusStyle("description")}
            onFocus={() => setFocusedField("description")}
            onBlur={() => setFocusedField("")}
            value={description}
            readOnly
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("saleRate").focus()}
          />
        </div>

        <div>
          <label>Rate</label>
          <input
            id="saleRate"
            style={focusStyle("saleRate")}
            onFocus={() => setFocusedField("saleRate")}
            onBlur={() => setFocusedField("")}
            value={saleRate}
            onChange={(e) => setSaleRate(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("qty").focus()}
          />
        </div>

        <div>
          <label>Qty</label>
          <input
            id="qty"
            style={focusStyle("qty")}
            onFocus={() => setFocusedField("qty")}
            onBlur={() => setFocusedField("")}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("discount").focus()}
          />
        </div>

        <div>
          <label>Discount %</label>
          <input
            id="discount"
            style={focusStyle("discount")}
            onFocus={() => setFocusedField("discount")}
            onBlur={() => setFocusedField("")}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && document.getElementById("addItemBtn").focus()}
          />
        </div>

        <div style={{ alignSelf: "flex-end" }}>
          <button
            id="addItemBtn"
            style={{
              background: focusedField === "addItemBtn" ? "blue" : "#ddd",
              color: focusedField === "addItemBtn" ? "#fff" : "#000",
            }}
            onFocus={() => setFocusedField("addItemBtn")}
            onBlur={() => setFocusedField("")}
            onClick={handleAdd}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          >
            Add Item
          </button>
        </div>
      </div>

      {/* Items Table with Remove button */}
      <table border="1" width="100%" style={{ marginTop: 10, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f1f1f1" }}>
            <th>#</th>
            <th>Item</th>
            <th>Rate</th>
            <th>Qty</th>
            <th>Disc%</th>
            <th>Amount</th>
            <th>❌</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{e.itemName}</td>
              <td>{e.saleRate}</td>
              <td>{e.qty}</td>
              <td>{e.discount}</td>
              <td>{e.amount.toFixed(2)}</td>
              <td>
                <button
                  onClick={() => handleRemove(i)}
                  style={{
                    background: "red",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 6px",
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
        <button onClick={handleSave}>💾 Save & Print</button>
        <button onClick={() => window.location.reload()} style={{ marginLeft: 6 }}>
          ❌ Exit
        </button>
      </div>

      {printData && <ThermalPrint data={printData} onClose={() => setPrintData(null)} />}
    </div>
  );
}
