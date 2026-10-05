import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getParties, deleteParty } from "../../services/partyService";
import PartyForm from "./PartyForm";
import { 
    FaSearch, 
    FaPlus, 
    FaEye, 
    FaEdit, 
    FaTrash, 
    FaExclamationTriangle,
    FaChevronLeft,
    FaChevronRight,
    FaTimes,
    FaBuilding
} from "react-icons/fa";

/**
 * PartyList page component.
 * Displays a table of all parties (Customers/Suppliers) with options to filter, search, view, edit, and delete records.
 */
const PartyList = () => {
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Search and filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("All");

    // Modal states
    const [formOpen, setFormOpen] = useState(false);
    const [selectedParty, setSelectedParty] = useState(null); // Active party for edit mode
    const [viewParty, setViewParty] = useState(null); // Active party for detail view modal
    const [deleteTarget, setDeleteTarget] = useState(null); // Active party to delete

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch parties from backend API
    const loadParties = async () => {
        setLoading(true);
        try {
            const response = await getParties();
            if (response.success) {
                setParties(response.data || []);
            } else {
                toast.error(response.message || "Failed to load parties list");
            }
        } catch (error) {
            console.error("Error loading parties:", error);
            toast.error("Failed to retrieve parties from server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadParties();
    }, []);

    // Reset pagination page on search/filter update
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleFilterChange = (type) => {
        setFilterType(type);
        setCurrentPage(1);
    };

    // Filtered parties logic
    const filteredParties = parties.filter((party) => {
        const matchesFilter = filterType === "All" || party.party_type === filterType;
        
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = 
            !query ||
            party.party_name?.toLowerCase().includes(query) ||
            party.phone?.toLowerCase().includes(query) ||
            party.gst_number?.toLowerCase().includes(query) ||
            party.company_name?.toLowerCase().includes(query);

        return matchesFilter && matchesSearch;
    });

    // Pagination computations
    const totalPages = Math.max(1, Math.ceil(filteredParties.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedParties = filteredParties.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Handle Delete confirmation
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            const response = await deleteParty(deleteTarget.id);
            if (response.success) {
                toast.success(response.message || "Party deleted successfully");
                setDeleteTarget(null);
                loadParties();
            } else {
                toast.error(response.message || "Failed to delete party");
            }
        } catch (error) {
            console.error("Error deleting party:", error);
            toast.error(error.response?.data?.message || "An error occurred while deleting the party");
        }
    };

    return (
        <div className="space-y-6">
            
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Parties</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your customer and supplier registry details.</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedParty(null);
                        setFormOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow-sm cursor-pointer transition"
                >
                    <FaPlus className="h-3.5 w-3.5" />
                    <span>Add Party</span>
                </button>
            </div>

            {/* Filters and Search row */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Box */}
                <div className="relative max-w-md w-full">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <FaSearch className="h-3.5 w-3.5" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by Name, Phone, or GSTIN..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg p-1">
                    {["All", "Customer", "Supplier"].map((type) => (
                        <button
                            key={type}
                            onClick={() => handleFilterChange(type)}
                            className={`py-1.5 px-4 text-xs font-semibold rounded-md cursor-pointer transition ${
                                filterType === type
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                        >
                            {type}s
                        </button>
                    ))}
                </div>
            </div>

            {/* Parties Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
                        <span className="ml-3 font-semibold text-slate-500 text-xs">Loading parties...</span>
                    </div>
                ) : paginatedParties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-slate-50 dark:bg-slate-950 text-slate-400 p-4 rounded-full mb-3">
                            <FaBuilding className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No parties found</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">Try adjusting your search criteria or register a new customer/supplier profile.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* Table wrap */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider sticky top-0">
                                        <th className="py-3 px-6">Party Name</th>
                                        <th className="py-3 px-4">Type</th>
                                        <th className="py-3 px-4">GSTIN</th>
                                        <th className="py-3 px-4">Phone</th>
                                        <th className="py-3 px-4">Email</th>
                                        <th className="py-3 px-4">State</th>
                                        <th className="py-3 px-4 text-right">Balance</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-6 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                    {paginatedParties.map((party) => (
                                        <tr key={party.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/25 transition">
                                            <td className="py-3.5 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{party.party_name}</span>
                                                    {party.company_name && (
                                                        <span className="text-[10px] text-slate-400 mt-0.5">{party.company_name}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                    party.party_type === "Customer"
                                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                                        : "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                                                }`}>
                                                    {party.party_type}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">{party.gst_number || "—"}</td>
                                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-350">{party.phone}</td>
                                            <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">{party.email || "—"}</td>
                                            <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">{party.state || "—"}</td>
                                            <td className="py-3.5 px-4 text-xs font-bold text-right text-slate-800 dark:text-slate-200">
                                                ${parseFloat(party.opening_balance || 0).toFixed(2)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                    parseFloat(party.opening_balance || 0) > parseFloat(party.credit_limit || 0) && parseFloat(party.credit_limit || 0) > 0
                                                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                                                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                                }`}>
                                                    {parseFloat(party.opening_balance || 0) > parseFloat(party.credit_limit || 0) && parseFloat(party.credit_limit || 0) > 0
                                                        ? "Limit Exceeded"
                                                        : "Healthy"}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setViewParty(party)}
                                                        title="View Details"
                                                        className="p-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md transition cursor-pointer"
                                                    >
                                                        <FaEye className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedParty(party);
                                                            setFormOpen(true);
                                                        }}
                                                        title="Edit"
                                                        className="p-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-md transition cursor-pointer"
                                                    >
                                                        <FaEdit className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(party)}
                                                        title="Delete"
                                                        className="p-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-red-55/10 text-red-600 dark:text-red-400 rounded-md transition cursor-pointer"
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

                        {/* Pagination Row */}
                        <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 font-semibold">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredParties.length)} of {filteredParties.length} entries
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

            {/* 1. Add/Edit Party Modal Form */}
            <PartyForm
                isOpen={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setSelectedParty(null);
                }}
                onSubmitSuccess={loadParties}
                party={selectedParty}
            />

            {/* 2. Detailed View Modal */}
            {viewParty && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-xl flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-base font-bold text-slate-850 dark:text-slate-200">Party Profile Details</h2>
                            <button onClick={() => setViewParty(null)} className="text-slate-400 hover:text-slate-650 transition cursor-pointer">
                                <FaTimes className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{viewParty.party_name}</h3>
                                    {viewParty.company_name && (
                                        <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">{viewParty.company_name}</p>
                                    )}
                                </div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                    viewParty.party_type === "Customer"
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                        : "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                                }`}>
                                    {viewParty.party_type}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs">
                                <div>
                                    <span className="text-slate-400 block mb-0.5">GSTIN:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{viewParty.gst_number || "—"}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Phone Number:</span>
                                    <span className="font-semibold text-slate-750 dark:text-slate-200">{viewParty.phone}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Alternate Phone:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{viewParty.alternate_phone || "—"}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Email Address:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{viewParty.email || "—"}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-slate-400 block mb-0.5">Billing Address:</span>
                                    <p className="font-semibold text-slate-750 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/40">
                                        {[viewParty.address, viewParty.city, viewParty.state, viewParty.pincode].filter(Boolean).join(", ") || "—"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Opening Balance:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">${parseFloat(viewParty.opening_balance || 0).toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Credit Limit:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {parseFloat(viewParty.credit_limit || 0) > 0 ? `$${parseFloat(viewParty.credit_limit).toFixed(2)}` : "No Limit"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-850 flex justify-end rounded-b-2xl">
                            <button
                                onClick={() => setViewParty(null)}
                                className="py-2 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-xs font-semibold cursor-pointer transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl flex flex-col">
                        <div className="p-6 flex gap-4">
                            <div className="bg-red-50 dark:bg-red-950/20 text-red-650 p-3 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
                                <FaExclamationTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Delete Party Profile?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                    Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">{deleteTarget.party_name}</span>? This action is permanent and cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-850 flex items-center justify-end gap-3 rounded-b-2xl">
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

export default PartyList;
