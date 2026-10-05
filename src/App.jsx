import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import CompanySettings from "./pages/Company/CompanySettings";
import PartyList from "./pages/Parties/PartyList";
import ItemList from "./pages/Items/ItemList";
import InvoiceList from "./pages/Invoices/InvoiceList";
import CreateInvoice from "./pages/Invoices/CreateInvoice";
import InvoicePreview from "./pages/Invoices/InvoicePreview";
import Login from "./pages/Auth/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Reusable placeholder component for routes under development
const Placeholder = ({ name }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 h-80 flex flex-col items-center justify-center text-center shadow-xs">
    <div className="bg-indigo-55 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 p-4 rounded-full mb-4">
      <svg className="h-8 w-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    </div>
    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{name} Module</h2>
    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 max-w-sm">This section is currently under active construction and will be integrated with backend services shortly.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public login route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes wrapper */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Primary modules */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="company" element={<CompanySettings />} />
            <Route path="parties" element={<PartyList />} />
            <Route path="items" element={<ItemList />} />

            {/* Invoices Module Routes */}
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoices/create" element={<CreateInvoice />} />
            <Route path="invoices/edit/:id" element={<CreateInvoice />} />
            <Route path="invoices/preview/:id" element={<InvoicePreview />} />
            <Route path="reports" element={<Placeholder name="Reports" />} />
            <Route path="settings" element={<Placeholder name="Settings" />} />

            {/* Wildcard redirect back to home dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>

      {/* Universal feedback toast layer */}
      <ToastContainer position="top-right" autoClose={3500} hideProgressBar={false} />
    </BrowserRouter>
  );
}

export default App;
