import { useLocation, useNavigate } from "react-router-dom";
import { FaFileInvoice, FaRegCalendarAlt, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { logout, getAdminProfile } from "../../services/authService";
import { toast } from "react-toastify";

/**
 * Navbar component for the Admin layout.
 * Displays application logo, active page heading, date, and admin profile trigger.
 */
const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const admin = getAdminProfile();

    const handleLogout = () => {
        logout();
        toast.info("Logged out successfully");
        navigate("/login");
    };

    // Map pathnames to human-readable page titles
    const pageTitles = {
        "/dashboard": "Dashboard",
        "/company": "Company Settings",
        "/parties": "Parties",
        "/items": "Items",
        "/invoices": "Invoices",
        "/reports": "Reports",
        "/settings": "Settings"
    };

    // Format current date: e.g. "Tue, Aug 4, 2026"
    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-20 sticky top-0">
            {/* Left: App Logo & Brand Name */}
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 text-white p-2 rounded-lg flex items-center justify-center shadow-xs">
                    <FaFileInvoice className="h-5 w-5" />
                </div>
                <span className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">
                    Invoice Generator
                </span>
            </div>

            {/* Right: Date & Profile Avatar */}
            <div className="flex items-center gap-6">
                {/* Current Date Display */}
                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 rounded-full border border-slate-100 dark:border-slate-800/40">
                    <FaRegCalendarAlt className="text-slate-400 dark:text-slate-500" />
                    <span>{currentDate}</span>
                </div>

                {/* Profile Widget */}
                <div className="flex items-center gap-2">
                    <div className="flex flex-col text-right hidden xs:flex">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {admin?.name || admin?.email?.split("@")[0] || "Admin"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                            {admin?.email || "Super Admin"}
                        </span>
                    </div>
                    <FaUserCircle className="h-8 w-8 text-slate-400 dark:text-slate-500 transition" />
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    title="Logout Session"
                    className="p-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 hover:text-rose-600 dark:hover:text-rose-500 rounded-xl transition cursor-pointer flex items-center justify-center"
                >
                    <FaSignOutAlt className="h-3.5 w-3.5" />
                </button>
            </div>
        </header>
    );
};

export default Navbar;
