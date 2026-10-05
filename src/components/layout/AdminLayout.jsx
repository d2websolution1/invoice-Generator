import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { FaBars, FaTimes } from "react-icons/fa";

/**
 * AdminLayout component.
 * Wraps all inner admin pages with a consistent Navbar, responsive Sidebar, and main workspace container.
 */
const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-200">
            {/* Top Navigation Bar */}
            <Navbar />

            {/* Layout Body Container */}
            <div className="flex flex-1 relative">
                
                {/* Mobile Menu Toggler (FAB) */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden fixed bottom-6 right-6 z-30 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95 border border-indigo-500/20"
                >
                    {mobileOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
                </button>

                {/* Mobile Overlay Backdrop */}
                {mobileOpen && (
                    <div 
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden fixed inset-0 z-10 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
                    />
                )}

                {/* Sidebar Navigation Panel wrapper (responsive sliding overlay on mobile, static on desktop) */}
                <div 
                    className={`
                        z-20 md:z-10
                        fixed md:sticky top-16 h-[calc(100vh-64px)] transition-transform duration-300
                        ${mobileOpen ? "translate-x-0" : "-translate-x-60 md:translate-x-0"}
                    `}
                >
                    <Sidebar 
                        collapsed={collapsed} 
                        setCollapsed={setCollapsed} 
                    />
                </div>

                {/* Main Viewport Content Workspace */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
