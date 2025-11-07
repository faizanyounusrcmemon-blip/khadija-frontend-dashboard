// src/pages/SaleDetail.jsx
import React, { useState, useEffect } from "react";
import supabase from "../utils/supabaseClient";

export default function SaleDetail({ onNavigate }) {
  const [sales, setSales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // 🔹 Fetch all sales initially
  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("is_deleted", false)
      .order("sale_date", { ascending: false });

    if (error) console.error(error);
    else {
      setSales(data || []);
      setFiltered(data || []);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // 🔹 Search / Filter
  useEffect(() => {
    let result = [...sales];

    // Search by customer name
    if (search) {
      result = result.filter((r) =>
        r.customer_name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Search by invoice no
    if (invoiceSearch) {
      result = result.filter((r) =>
        r.invoice_no?.toLowerCase().includes(invoiceSearch.toLowerCase())
      );
    }

    // Date filter
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      result = result.filter((r) => {
        const date = new Date(r.sale_date);
        return date >= from && date <= to;
      });
    }

    setFiltered(result);
  }, [search, invoiceSearch, fromDate, toDate, sales]);

  // 🔹 Reprint (Thermal 80mm)
  const handleReprint = (invoiceNo) => {
    const invoiceItems = sales.filter(
      (s) => s.invoice_no === invoiceNo && !s.is_deleted
    );

    if (!invoiceItems.length) return alert("Invoice not found!");

    const total = invoiceItems.reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const printWindow = window.open("", "PRINT", "height=600,width=400");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoiceNo}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 11px;
              width: 80mm;
              margin: 0;
              padding: 4px;
            }
            h2 {
              text-align: center;
              margin: 0;
              font-size: 13px;
            }
            .center { text-align: center; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 4px;
            }
            th, td {
              text-align: left;
              padding: 2px 0;
              font-size: 11px;
            }
            th {
              border-bottom: 1px dashed #000;
            }
            hr {
              border: none;
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="center">
            <h2>💎 Khadija Jewelry 💎</h2>
            <div>Central Plaza Ground Floor</div>
            <div>Contact: Fahim Younus - 03212404509</div>
          </div>
          <hr>
          <div>
            <b>Invoice No:</b> ${invoiceNo}<br>
            <b>Date:</b> ${invoiceItems[0].sale_date}<br>
            <b>Customer:</b> ${invoiceItems[0].customer_name || "CASH SALE"}<br>
            <b>Phone:</b> ${invoiceItems[0].customer_phone || "-"}
          </div>
          <hr>
          <table>
            <thead>
              <tr>
                <th style="width:40%">Item</th>
                <th style="width:15%;text-align:right;">Qty</th>
                <th style="width:15%;text-align:right;">Rate</th>
                <th style="width:15%;text-align:right;">Disc%</th>
                <th style="width:15%;text-align:right;">Amt</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceItems
                .map(
                  (i) => `
                  <tr>
                    <td>${i.item_name}</td>
                    <td style="text-align:right;">${i.qty}</td>
                    <td style="text-align:right;">${Number(i.sale_rate).toFixed(2)}</td>
                    <td style="text-align:right;">${i.discount || 0}</td>
                    <td style="text-align:right;">${Number(i.amount).toFixed(2)}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
          <hr>
          <p style="text-align:right;"><b>Total: Rs. ${total.toFixed(2)}</b></p>
          <div class="center">Thank you for shopping with us!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // 🔹 Edit invoice
  const handleEdit = (invoiceNo) => {
    localStorage.setItem("edit_invoice", invoiceNo);
    onNavigate("invoice-edit"); // open InvoiceEdit.jsx
  };

  // 🔹 Soft Delete Invoice
  const handleDelete = async (invoiceNo) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete invoice ${invoiceNo}?`
    );
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("sales")
      .update({ is_deleted: true })
      .eq("invoice_no", invoiceNo);

    if (error) console.error(error);
    else {
      alert("Invoice hidden (soft deleted).");
      fetchSales();
    }
  };

  // 🔹 Group invoices (merge by invoice_no)
  const groupedInvoices = Object.values(
    filtered.reduce((acc, sale) => {
      if (!acc[sale.invoice_no]) {
        acc[sale.invoice_no] = {
          ...sale,
          total_amount: 0,
        };
      }
      acc[sale.invoice_no].total_amount += Number(sale.amount || 0);
      return acc;
    }, {})
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Sales Detail</h2>

      {/* 🔸 Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="Search by Customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          placeholder="Search by Invoice No"
          value={invoiceSearch}
          onChange={(e) => setInvoiceSearch(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* 🔸 Table */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th>Invoice No</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Total Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groupedInvoices.map((inv) => (
            <tr key={inv.invoice_no}>
              <td>{inv.invoice_no}</td>
              <td>{inv.sale_date}</td>
              <td>{inv.customer_name}</td>
              <td>{inv.customer_address}</td>
              <td>{inv.customer_phone}</td>
              <td>{inv.total_amount.toFixed(2)}</td>
              <td className="flex gap-1">
                <button
                  onClick={() => handleReprint(inv.invoice_no)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Reprint
                </button>
                <button
                  onClick={() => handleEdit(inv.invoice_no)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(inv.invoice_no)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {groupedInvoices.length === 0 && (
        <p className="text-center text-gray-500 mt-4">No invoices found.</p>
      )}
    </div>
  );
}
