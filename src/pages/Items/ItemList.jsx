import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getItems, deleteItem } from "../../services/itemService";
import ItemForm from "./ItemForm";
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
    FaBoxes
} from "react-icons/fa";

/**
 * ItemList component page.
 * Renders list of products and services, allowing search, filtering, and CRUD operations.
 */
const ItemList = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search and filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("All");

    // Modal controls
    const [formOpen, setFormOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [viewItem, setViewItem] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Load items from API
    const loadItems = async () => {
        setLoading(true);
        try {
            const response = await getItems();
            if (response.success) {
                setItems(response.data || []);
            } else {
                toast.error(response.message || "Failed to load items");
            }
        } catch (error) {
            console.error("Error loading items:", error);
            toast.error("Failed to retrieve items from server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    // Handlers
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleFilterChange = (type) => {
        setFilterType(type);
        setCurrentPage(1);
    };

    // Filter items logic
    const filteredItems = items.filter((item) => {
        const matchesFilter = filterType === "All" || item.item_type === filterType;

        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = 
            !query ||
            item.item_name?.toLowerCase().includes(query) ||
            item.sku?.toLowerCase().includes(query) ||
            item.barcode?.toLowerCase().includes(query) ||
            item.hsn_sac?.toLowerCase().includes(query) ||
            item.category?.toLowerCase().includes(query);

        return matchesFilter && matchesSearch;
    });

    // Pagination computations
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Delete confirm
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            const response = await deleteItem(deleteTarget.id);
            if (response.success) {
                toast.success(response.message || "Item deleted successfully");
                setDeleteTarget(null);
                loadItems();
            } else {
                toast.error(response.message || "Failed to delete item");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            toast.error(error.response?.data?.message || "An error occurred while deleting the item");
        }
    };

    return (
        <div className="space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Items</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your catalog of products and services.</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedItem(null);
                        setFormOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow-sm cursor-pointer transition"
                >
                    <FaPlus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                </button>
            </div>

            {/* Filters / Search */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <FaSearch className="h-3.5 w-3.5" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by Name, SKU, Barcode, or HSN Code..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200"
                    />
                </div>

                <div className="flex bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-lg p-1">
                    {["All", "Product", "Service"].map((type) => (
                        <button
                            key={type}
                            onClick={() => handleFilterChange(type)}
                            className={`py-1.5 px-4 text-xs font-semibold rounded-md cursor-pointer transition ${
                                filterType === type
                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                            }`}
                        >
                            {type}s
                        </button>
                    ))}
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
                        <span className="ml-3 font-semibold text-slate-500 text-xs">Loading items...</span>
                    </div>
                ) : paginatedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="bg-slate-50 dark:bg-slate-955 text-slate-400 p-4 rounded-full mb-3">
                            <FaBoxes className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No items found</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">Create product catalog models or add new invoiceable service offerings.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[950px]">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider sticky top-0">
                                        <th className="py-3 px-6">Item Name</th>
                                        <th className="py-3 px-4">Type</th>
                                        <th className="py-3 px-4">HSN/SAC</th>
                                        <th className="py-3 px-4">Category</th>
                                        <th className="py-3 px-4">Unit</th>
                                        <th className="py-3 px-4">GST Rate</th>
                                        <th className="py-3 px-4 text-right">Purchase Price</th>
                                        <th className="py-3 px-4 text-right">Selling Price</th>
                                        <th className="py-3 px-4 text-right">Stock</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-6 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                    {paginatedItems.map((item) => {
                                        const isLowStock = item.item_type === "Product" && parseFloat(item.opening_stock || 0) <= parseFloat(item.minimum_stock || 0);
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition">
                                                <td className="py-3.5 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.item_name}</span>
                                                        {item.sku && (
                                                            <span className="text-[10px] text-slate-400 mt-0.5">SKU: {item.sku}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-xs">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                        item.item_type === "Product"
                                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                                            : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                                    }`}>
                                                        {item.item_type}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">{item.hsn_sac || "—"}</td>
                                                <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">{item.category}</td>
                                                <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">{item.unit}</td>
                                                <td className="py-3.5 px-4 text-xs text-slate-650 dark:text-slate-350">{item.gst_percentage}</td>
                                                <td className="py-3.5 px-4 text-xs text-right text-slate-700 dark:text-slate-300">
                                                    ${parseFloat(item.purchase_price || 0).toFixed(2)}
                                                </td>
                                                <td className="py-3.5 px-4 text-xs font-bold text-right text-slate-800 dark:text-slate-200">
                                                    ${parseFloat(item.selling_price || 0).toFixed(2)}
                                                </td>
                                                <td className="py-3.5 px-4 text-xs text-right text-slate-700 dark:text-slate-300">
                                                    {item.item_type === "Product" ? item.opening_stock : "—"}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                        item.item_type === "Service"
                                                            ? "bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400"
                                                            : isLowStock
                                                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                                    }`}>
                                                        {item.item_type === "Service" ? "Infinite" : isLowStock ? "Low Stock" : "In Stock"}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setViewItem(item)}
                                                            title="View Details"
                                                            className="p-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md transition cursor-pointer"
                                                        >
                                                            <FaEye className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setFormOpen(true);
                                                            }}
                                                            title="Edit"
                                                            className="p-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-md transition cursor-pointer"
                                                        >
                                                            <FaEdit className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteTarget(item)}
                                                            title="Delete"
                                                            className="p-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-red-55/10 text-red-650 dark:text-red-400 rounded-md transition cursor-pointer"
                                                        >
                                                            <FaTrash className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 font-semibold">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredItems.length)} of {filteredItems.length} entries
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

            {/* Forms and confirm overlay modules */}
            <ItemForm
                isOpen={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setSelectedItem(null);
                }}
                onSubmitSuccess={loadItems}
                item={selectedItem}
            />

            {/* View item details */}
            {viewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-xl flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-base font-bold text-slate-850 dark:text-slate-200">Catalog Item Details</h2>
                            <button onClick={() => setViewItem(null)} className="text-slate-400 hover:text-slate-650 transition cursor-pointer">
                                <FaTimes className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{viewItem.item_name}</h3>
                                    {viewItem.sku && (
                                        <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">SKU: {viewItem.sku}</p>
                                    )}
                                </div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                    viewItem.item_type === "Product"
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                }`}>
                                    {viewItem.item_type}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Category:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-350">{viewItem.category}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Unit of Measurement:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-350">{viewItem.unit}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">HSN/SAC Code:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{viewItem.hsn_sac || "—"}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Barcode:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{viewItem.barcode || "—"}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Purchase Price:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">${parseFloat(viewItem.purchase_price || 0).toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Selling Price (Excl. Tax):</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">${parseFloat(viewItem.selling_price || 0).toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">GST Rate / Tax:</span>
                                    <span className="font-semibold text-slate-750 dark:text-slate-300">{viewItem.gst_percentage}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Opening Stock Quantity:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {viewItem.item_type === "Product" ? viewItem.opening_stock : "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-0.5">Min Stock Alert Level:</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-250">
                                        {viewItem.item_type === "Product" ? viewItem.minimum_stock : "—"}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-slate-400 block mb-0.5">Description:</span>
                                    <p className="font-semibold text-slate-750 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/40">
                                        {viewItem.description || "No description provided."}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-955 border-t border-slate-100 dark:border-slate-850 flex justify-end rounded-b-2xl">
                            <button
                                onClick={() => setViewItem(null)}
                                className="py-2 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-xs font-semibold cursor-pointer transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl flex flex-col">
                        <div className="p-6 flex gap-4">
                            <div className="bg-red-50 dark:bg-red-950/20 text-red-655 p-3 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
                                <FaExclamationTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Delete Item Profile?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                    Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">{deleteTarget.item_name}</span>? This action is permanent and cannot be undone.
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

export default ItemList;
