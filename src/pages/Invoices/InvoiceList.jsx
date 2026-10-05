import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getInvoices, deleteInvoice } from "../../services/invoiceService";
import { 
    FaSearch, 
    FaPlus, 
    FaEye, 
    FaEdit, 
    FaTrash, 
    FaPrint,
    FaExclamationTriangle,
    FaChevronLeft,
    FaChevronRight,
    FaFileInvoiceDollar
} from "react-icons/fa";

/**
 * InvoiceList component page.
 * Displays all created invoices in a datatable with search, pagination, and print/preview commands.
 */
const InvoiceList = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search query states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // Modal & Pagination states
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Load invoices from API
    const loadInvoices = async () => {
        setLoading(true);
        try {
            const response = await getInvoices();
            if (response.success) {
                setInvoices(response.data || []);
            } else {
                toast.error(response.message || "Failed to load invoices list");
            }
        } catch (error) {
            console.error("Error loading invoices:", error);
            toast.error("Failed to retrieve invoices from server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInvoices();
    }, []);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (status) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    // Filter logic
    const filteredInvoices = invoices.filter((inv) => {
        const invStatus = inv.payment_status || inv.status || "Unpaid";
        // Filter by payment status if not "All"
        const matchesStatus = statusFilter === "All" || invStatus.toLowerCase() === statusFilter.toLowerCase();

        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = 
            !query ||
            inv.invoice_number?.toLowerCase().includes(query) ||
            inv.party_name?.toLowerCase().includes(query) ||
            inv.customer_name?.toLowerCase().includes(query) ||
            inv.invoice_date?.toLowerCase().includes(query);

        return matchesStatus && matchesSearch;
    });

    // Pagination computations
    const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            const response = await deleteInvoice(deleteTarget.id);
            if (response.success) {
                toast.success(response.message || "Invoice deleted successfully");
                setDeleteTarget(null);
                loadInvoices();
            } else {
                toast.error(response.message || "Failed to delete invoice");
            }
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast.error(error.response?.data?.message || "An error occurred while deleting the invoice");
        }
    };

    return (
        <div className="space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Invoices</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage and track your GST billing sales invoices.</p>
                </div>
                <button
                    onClick={() => navigate("/invoices/create")}
                    className="flex items-center justify-center gap-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow-sm cursor-pointer transition"
                >
                    <FaPlus className="h-3.5 w-3.5" />
                    <span>Create Invoice</span>
                </button>
            </div>

            {/* Filters Row */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <FaSearch className="h-3.5 w-3.5" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by Invoice No, Customer, or Date..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200"
                    />
                </div>

                <div className="flex bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-lg p-1">
                    {["All", "Paid", "Unpaid", "Partial"].map((status) => (
                        <button
                            key={status}
                            onClick={() => handleStatusFilterChange(status)}
                            className={`py-1.5 px-4 text-xs font-semibold rounded-md cursor-pointer transition ${
                                statusFilter === status
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
                        <span className="ml-3 font-semibold text-slate-500 text-xs">Loading invoices...</span>
                    </div>
                ) : paginatedInvoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-slate-50 dark:bg-slate-955 text-slate-400 p-4 rounded-full mb-3">
                            <FaFileInvoiceDollar className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No invoices found</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">Start selling by issuing a professional GST-compliant customer invoice.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[850px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider sticky top-0">
                                        <th className="py-3 px-6">Invoice Number</th>
                                        <th className="py-3 px-4">Invoice Date</th>
                                        <th className="py-3 px-4">Customer</th>
                                        <th className="py-3 px-4 text-right">Total Amount</th>
                                        <th className="py-3 px-4 text-center">Payment Status</th>
                                        <th className="py-3 px-4 text-center">Created By</th>
                                        <th className="py-3 px-6 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                    {paginatedInvoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition">
                                            <td className="py-3.5 px-6 text-xs font-bold text-slate-800 dark:text-slate-200">
                                                {inv.invoice_number}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                                                {new Date(inv.invoice_date).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric"
                                                })}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-350">
                                                {inv.party_name || inv.customer_name || "—"}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-bold text-right text-slate-800 dark:text-slate-200">
                                                ₹{parseFloat(inv.grand_total || inv.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {(() => {
                                                    const s = inv.payment_status || inv.status || "Unpaid";
                                                    return (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                                            s.toLowerCase() === "paid"
                                                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                                                : s.toLowerCase() === "partial" || s.toLowerCase() === "partially paid"
                                                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                                                        }`}>
                                                            {s}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-center text-slate-500 dark:text-slate-450 font-medium">
                                                {inv.created_by || "Admin"}
                                            </td>
                                            <td className="py-3.5 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/invoices/preview/${inv.id}`)}
                                                        title="View Details"
                                                        className="p-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md transition cursor-pointer"
                                                    >
                                                        <FaEye className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/invoices/edit/${inv.id}`)}
                                                        title="Edit"
                                                        className="p-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-md transition cursor-pointer"
                                                    >
                                                        <FaEdit className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/invoices/preview/${inv.id}?print=true`)}
                                                        title="Print"
                                                        className="p-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-650 dark:text-teal-400 rounded-md transition cursor-pointer"
                                                    >
                                                        <FaPrint className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(inv)}
                                                        title="Delete"
                                                        className="p-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-red-55/10 text-red-655 dark:text-red-400 rounded-md transition cursor-pointer"
                                                    >
                                                        <FaTrash className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 font-semibold">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} entries
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-50 transition cursor-pointer"
                                >
                                    <FaChevronLeft className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 px-2">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-50 transition cursor-pointer"
                                >
                                    <FaChevronRight className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl flex flex-col">
                        <div className="p-6 flex gap-4">
                            <div className="bg-red-50 dark:bg-red-950/20 text-red-655 p-3 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
                                <FaExclamationTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Delete Invoice Record?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                    Are you sure you want to delete invoice <span className="font-semibold text-slate-700 dark:text-slate-300">{deleteTarget.invoice_number}</span>? This action will revert stock transactions and cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-955 border-t border-slate-100 dark:border-slate-850 flex items-center justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="py-2 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-xs font-semibold cursor-pointer transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="py-2 px-5 bg-red-600 hover:bg-red-750 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default InvoiceList;
