import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { logout } from "../../services/authService";
import {
    FaChartLine,
    FaBuilding,
    FaUsers,
    FaBoxes,
    FaFileInvoiceDollar,
    FaChartBar,
    FaCog,
    FaSignOutAlt,
    FaChevronLeft,
    FaChevronRight
} from "react-icons/fa";

/**
 * Sidebar component containing main navigation links.
 * Accepts collapsed state to dynamically adjust sidebar width and visibility.
 */
const Sidebar = ({ collapsed, setCollapsed }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.info("Logged out successfully");
        navigate("/login");
    };

    const menuItems = [
        { name: "Dashboard", path: "/dashboard", icon: FaChartLine },
        { name: "Company", path: "/company", icon: FaBuilding },
        { name: "Parties", path: "/parties", icon: FaUsers },
        { name: "Items", path: "/items", icon: FaBoxes },
        { name: "Invoices", path: "/invoices", icon: FaFileInvoiceDollar },
    ];

    return (
        <aside
            className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 z-10 
                fixed md:sticky top-16 h-[calc(100vh-64px)] 
                ${collapsed ? "w-16" : "w-60"} 
                ${collapsed ? "-translate-x-16 md:translate-x-0" : "translate-x-0"}
            `}
        >
            {/* Navigation Links */}
            <div className="flex-1 py-4 overflow-y-auto">
                <nav className="space-y-1 px-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group cursor-pointer
                                    ${isActive
                                        ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600 rounded-l-none"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 hover:text-slate-800 dark:hover:text-slate-200 border-l-4 border-transparent"
                                    }
                                `}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0 transition-colors duration-200" />
                                {!collapsed && <span className="truncate">{item.name}</span>}
                            </NavLink>
                        );
                    })}

                </nav>
            </div>

            {/* Bottom Actions: Collapse Toggle & Logout */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 p-2 space-y-1">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 border-l-4 border-transparent cursor-pointer"
                >
                    <FaSignOutAlt className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>Logout</span>}
                </button>

                {/* Desktop Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex w-full items-center justify-center py-2.5 mt-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                    {collapsed ? <FaChevronRight className="h-4 w-4" /> : <FaChevronLeft className="h-4 w-4" />}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
