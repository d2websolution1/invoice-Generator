import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login, isAuthenticated } from "../../services/authService";
import { API_BASE_URL } from "../../services/api";
import { 
    FaFileInvoice, 
    FaEnvelope, 
    FaLock, 
    FaSignInAlt, 
    FaCircleNotch,
    FaEye,
    FaEyeSlash,
    FaKey
} from "react-icons/fa";

/**
 * Login page component.
 * Provides a highly premium, modern, responsive interface for administrator authentication.
 */
const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("admin@gmail.com");
    const [password, setPassword] = useState("admin123");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Redirect to dashboard if session token exists and is valid
    useEffect(() => {
        if (isAuthenticated()) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const handleQuickFill = (demoEmail, demoPass) => {
        setEmail(demoEmail);
        setPassword(demoPass);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic inputs validation
        if (!email.trim() || !password.trim()) {
            toast.warn("Please enter both email and password.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await login(email.trim(), password);
            if (res.success) {
                toast.success(res.message || "Login successful! Welcome back.");
                navigate("/dashboard");
            } else {
                toast.error(res.message || "Authentication failed.");
            }
        } catch (error) {
            console.error("Login Error details:", error, "API_BASE_URL:", API_BASE_URL);
            let errMsg = "Login failed. Please verify your credentials.";
            if (error.response?.data?.message) {
                errMsg = error.response.data.message;
            } else if (error.message === "Network Error" || !error.response) {
                errMsg = `Backend connectivity issue. If Render is waking up, please wait a few seconds and try again.`;
            }
            toast.error(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100 antialiased overflow-hidden relative">
            
            {/* Background glowing orb design decorations */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-3xl animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full filter blur-3xl animate-pulse delay-700 pointer-events-none"></div>

            {/* Login Glassmorphic Container Box */}
            <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 flex flex-col justify-center">
                
                {/* Brand Logo & Name */}
                <div className="flex flex-col items-center justify-center mb-6">
                    <div className="bg-indigo-600 text-white p-3 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 transform hover:scale-105 transition-transform duration-200">
                        <FaFileInvoice className="h-7 w-7" />
                    </div>
                    <h1 className="text-xl font-extrabold tracking-tight mt-3.5 text-white uppercase">
                        Invoice Generator
                    </h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">
                        Administrator Portal
                    </p>
                </div>

                {/* Demo Credentials Quick-Fill Cards */}
                <div className="mb-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <FaKey className="text-indigo-400 h-2.5 w-2.5" />
                        <span>Quick Login Credentials</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => handleQuickFill("admin@gmail.com", "admin123")}
                            className="text-left p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer group"
                        >
                            <span className="block text-[11px] font-bold text-slate-200 group-hover:text-indigo-400">Super Admin</span>
                            <span className="block text-[9px] text-slate-400 truncate">admin@gmail.com</span>
                            <span className="block text-[9px] text-indigo-400/80 font-mono mt-0.5">pass: admin123</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickFill("admin@invoice.com", "admin123")}
                            className="text-left p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer group"
                        >
                            <span className="block text-[11px] font-bold text-slate-200 group-hover:text-indigo-400">Admin</span>
                            <span className="block text-[9px] text-slate-400 truncate">admin@invoice.com</span>
                            <span className="block text-[9px] text-indigo-400/80 font-mono mt-0.5">pass: admin123</span>
                        </button>
                    </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Input Field */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Administrator Email
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                                <FaEnvelope className="h-3.5 w-3.5" />
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@gmail.com"
                                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-3 text-xs font-semibold tracking-wide text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 focus:bg-slate-950 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-150"
                                required
                                disabled={submitting}
                            />
                        </div>
                    </div>

                    {/* Password Input Field */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Password
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                                <FaLock className="h-3.5 w-3.5" />
                            </span>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="admin123"
                                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-10 py-3 text-xs font-semibold tracking-wide text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 focus:bg-slate-950 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-150"
                                required
                                disabled={submitting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                            >
                                {showPassword ? <FaEyeSlash className="h-3.5 w-3.5" /> : <FaEye className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full mt-2 flex items-center justify-center gap-2.5 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-600/20 cursor-pointer transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <FaCircleNotch className="h-3.5 w-3.5 animate-spin" />
                                <span>Authenticating credentials...</span>
                            </>
                        ) : (
                            <>
                                <FaSignInAlt className="h-3.5 w-3.5" />
                                <span>Authorize Access</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Premium layout footer */}
                <div className="text-center mt-6 border-t border-slate-800/80 pt-4 space-y-1.5">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">
                        Secured session protocol • Authorized admins only
                    </p>
                    <div className="flex items-center justify-center gap-1.5 text-[9px] text-emerald-400/90 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Cloud Backend: Render Live</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
