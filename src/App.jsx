import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import SaleEntry from "./pages/SaleEntry";
import SaleReturn from "./pages/SaleReturn";
import SaleReturnDetail from "./pages/SaleReturnDetail";
import SaleReturnItemDetail from "./pages/SaleReturnItemDetail";
import SaleDetail from "./pages/SaleDetail";
import SaleItemDetail from "./pages/SaleItemDetail";
import PurchaseEntry from "./pages/PurchaseEntry";
import PurchaseReturn from "./pages/PurchaseReturn";
import PurchaseDetail from "./pages/PurchaseDetail";
import PurchaseItemDetail from "./pages/PurchaseItemDetail";
import ItemProfile from "./pages/ItemProfile";
import CustomerProfile from "./pages/CustomerProfile";
import ManageUsers from "./pages/ManageUsers";
import StockReport from "./pages/StockReport";
import BarcodePrint from "./pages/BarcodePrint";
import Login from "./pages/Login";
import InvoiceEdit from "./pages/InvoiceEdit";

export default function App() {
  // ✅ ہمیشہ login سے شروع: sessionStorage استعمال
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // ہر render پر fresh user لو
  useEffect(() => {
    const u = sessionStorage.getItem("user");
    setUser(u ? JSON.parse(u) : null);
  }, [page]);

  // جب login ہوا تو dashboard جاو، ورنہ login
  useEffect(() => {
    if (!user) setPage("login");
    else if (page === "login") setPage("dashboard");
  }, [user, page]);

  const renderPage = () => {
    if (!user) return <Login onNavigate={setPage} />;

    switch (page) {
      case "dashboard": return <Dashboard onNavigate={setPage} />;
      case "sale-entry": return <SaleEntry onNavigate={setPage} />;
      case "sale-return": return <SaleReturn onNavigate={setPage} />;
      case "sale-return-detail": return <SaleReturnDetail onNavigate={setPage} />;
      case "sale-return-item-detail": return <SaleReturnItemDetail onNavigate={setPage} />;
      case "sale-detail":
        return (
          <SaleDetail
            onNavigate={setPage}
            onEditInvoice={(inv) => { setSelectedInvoice(inv); setPage("invoice-edit"); }}
          />
        );
      case "sale-item-detail": return <SaleItemDetail onNavigate={setPage} />;
      case "purchase-entry": return <PurchaseEntry onNavigate={setPage} />;
      case "purchase-return": return <PurchaseReturn onNavigate={setPage} />;
      case "purchase-detail": return <PurchaseDetail onNavigate={setPage} />;
      case "purchase-item-detail": return <PurchaseItemDetail onNavigate={setPage} />;
      case "barcode-print": return <BarcodePrint onNavigate={setPage} />;
      case "item-profile": return <ItemProfile onNavigate={setPage} />;
      case "customer-profile": return <CustomerProfile onNavigate={setPage} />;
      case "manage-users": return <ManageUsers onNavigate={setPage} />;
      case "stock-report": return <StockReport onNavigate={setPage} />;
      case "invoice-edit": return <InvoiceEdit onNavigate={setPage} />;

      // invoice-edit page placeholder remove kia hai kyun ke file nahi thi:
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <div className="app-root">
      {/* ✅ Navbar صرف login کے بعد */}
      {user && <Navbar onNavigate={setPage} />}
      <div className="content-area">{renderPage()}</div>
    </div>
  );
}
