import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getDashboardData } from "../../services/dashboardService";
import { 
    FaUsers, 
    FaBoxes, 
    FaFileInvoice, 
    FaChartLine, 
    FaPlus, 
    FaUserPlus, 
    FaBoxOpen, 
    FaCog,
    FaRupeeSign
} from "react-icons/fa";

/**
 * Dashboard page displaying key metrics, quick links, and recent transaction summaries.
 * Connects to live backend api metrics and handles loading & error states.
 */
const Dashboard = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        totalParties: 0,
        totalItems: 0,
        totalInvoices: 0,
        todaySales: 0,
        monthlySales: 0,
        recentInvoices: []
    });

    useEffect(() => {
        const fetchDashboardStats = async () => {
            setLoading(true);
            try {
                const res = await getDashboardData();
                if (res.success && res.data) {
                    setData(res.data);
                } else {
                    toast.error(res.message || "Unable to load dashboard");
                }
            } catch (error) {
                console.error("Dashboard API Error:", error);
                toast.error("Unable to load dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);

    // Helper to format currency values to Indian numbering format (Rupees)
    const formatCurrency = (val) => {
        const num = parseFloat(val || 0);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(num).replace('INR', '₹').trim();
    };

    // Metric stats configuration matching values from live state
    const stats = [
        { name: "Total Parties", value: data.totalParties, icon: FaUsers, color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30" },
        { name: "Total Items", value: data.totalItems, icon: FaBoxes, color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30" },
        { name: "Total Invoices", value: data.totalInvoices, icon: FaFileInvoice, color: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30" },
        { name: "Today's Sales", value: formatCurrency(data.todaySales), icon: FaRupeeSign, color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30" },
        { name: "Monthly Sales", value: formatCurrency(data.monthlySales), icon: FaChartLine, color: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30" },
    ];

    // Quick Actions configuration
    const quickActions = [
        { name: "Create Invoice", description: "Generate new bill", path: "/invoices/create", icon: FaPlus, color: "bg-indigo-600 hover:bg-indigo-700 text-white" },
        { name: "Add Party", description: "Register new customer", path: "/parties", icon: FaUserPlus, color: "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800" },
        { name: "Add Item", description: "Insert product or service", path: "/items", icon: FaBoxOpen, color: "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800" },
        { name: "Company Settings", description: "Configure billing details", path: "/company", icon: FaCog, color: "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800" },
    ];

    return (
        <div className="space-y-8">
            
            {/* Metric Stats Cards / Skeletons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                        <div 
                            key={idx} 
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4 animate-pulse"
                        >
                            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 h-12 w-12 flex items-center justify-center"></div>
                            <div className="flex flex-col space-y-2 flex-grow">
                                <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                <div className="h-4.5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            </div>
                        </div>
                    ))
                ) : (
                    stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div 
                                key={stat.name} 
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition hover:shadow-sm"
                            >
                                <div className={`p-3.5 rounded-xl ${stat.color} flex items-center justify-center`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                                        {stat.name}
                                    </span>
                                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                                        {stat.value}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        const isMainAction = action.color.includes("bg-indigo-600");
                        return (
                            <button
                                key={action.name}
                                onClick={() => navigate(action.path)}
                                className={`flex items-start gap-4 p-5 rounded-2xl shadow-xs transition duration-200 text-left cursor-pointer group ${action.color}`}
                            >
                                <div className={`p-2.5 rounded-lg flex items-center justify-center ${
                                    isMainAction
                                        ? "bg-indigo-500 text-white" 
                                        : "bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                                }`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold tracking-tight">
                                        {action.name}
                                    </span>
                                    <span className={`text-[10px] mt-0.5 ${
                                        isMainAction 
                                            ? "text-indigo-100" 
                                            : "text-slate-400 dark:text-slate-500"
                                    }`}>
                                        {action.description}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Recent Transaction Invoices List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Recent Invoices
                    </h3>
                    <button 
                        onClick={() => navigate("/invoices")}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                        View All Invoices
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice ID</th>
                                <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billing Party</th>
                                <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                <th className="py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="py-3.5"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                                        <td className="py-3.5"><div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                                        <td className="py-3.5"><div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                                        <td className="py-3.5"><div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
                                        <td className="py-3.5"><div className="h-4.5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div></td>
                                    </tr>
                                ))
                            ) : data.recentInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-xs font-semibold text-slate-450 uppercase tracking-wider">
                                        No invoices found
                                    </td>
                                </tr>
                            ) : (
                                data.recentInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition">
                                        <td className="py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {inv.invoice_number}
                                        </td>
                                        <td className="py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                            {inv.company_name || inv.party_name || "—"}
                                        </td>
                                        <td className="py-3.5 text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(inv.invoice_date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="py-3.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                            {formatCurrency(inv.grand_total)}
                                        </td>
                                        <td className="py-3.5 text-xs">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                                                inv.status === "Paid" 
                                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" 
                                                    : inv.status === "Pending"
                                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                                            }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
