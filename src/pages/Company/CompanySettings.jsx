import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { getCompany, createCompany, updateCompany } from "../../services/companyService";

// Helper to resolve static file paths from the backend server
const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || "https://invoice-generator-backend-sa53.onrender.com";
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    // Normalize path separation for Windows/Linux paths
    const normalizedPath = path.replace(/\\/g, "/");
    return `${SERVER_BASE_URL}/${normalizedPath}`;
};

const CompanySettings = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [originalCompany, setOriginalCompany] = useState(null);

    // States for custom image files and previews
    const [files, setFiles] = useState({
        logo: null,
        qr_code: null,
        signature: null,
        stamp: null
    });
    const [previews, setPreviews] = useState({
        logo: null,
        qr_code: null,
        signature: null,
        stamp: null
    });

    const {
        register,
        handleSubmit,
        reset: resetForm,
        formState: { errors }
    } = useForm({
        defaultValues: {
            company_name: "",
            gst_number: "",
            phone: "",
            email: "",
            address: "",
            state: "",
            pincode: "",
            bank_name: "",
            account_holder: "",
            account_number: "",
            ifsc_code: ""
        }
    });

    // Load existing company data on component mount
    useEffect(() => {
        const loadCompanyData = async () => {
            try {
                const response = await getCompany();
                
                // Assuming GET /api/company returns an array of companies
                if (response.success && response.data && response.data.length > 0) {
                    const company = response.data[0];
                    setCompanyId(company.id);
                    setOriginalCompany(company);

                    // Pre-fill form values
                    resetForm({
                        company_name: company.company_name || "",
                        gst_number: company.gst_number || "",
                        phone: company.phone || "",
                        email: company.email || "",
                        address: company.address || "",
                        state: company.state || "",
                        pincode: company.pincode || "",
                        bank_name: company.bank_name || "",
                        account_holder: company.account_holder || "",
                        account_number: company.account_number || "",
                        ifsc_code: company.ifsc_code || ""
                    });

                    // Set saved image paths as initial previews
                    setPreviews({
                        logo: getImageUrl(company.logo),
                        qr_code: getImageUrl(company.qr_code),
                        signature: getImageUrl(company.signature),
                        stamp: getImageUrl(company.stamp)
                    });
                }
            } catch (error) {
                console.error("Error loading company profile:", error);
                toast.error("Failed to load company details");
            } finally {
                setLoading(false);
            }
        };

        loadCompanyData();
    }, [resetForm]);

    // Handle local image file selection and validation
    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file is an image
            if (!file.type.startsWith("image/")) {
                toast.error("Only image files are allowed");
                return;
            }
            // Validate file size is less than 5MB
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size cannot exceed 5MB");
                return;
            }

            setFiles((prev) => ({ ...prev, [fieldName]: file }));
            setPreviews((prev) => ({ ...prev, [fieldName]: URL.createObjectURL(file) }));
        }
    };

    // Reset the form back to saved database state or empty fields
    const handleReset = () => {
        if (originalCompany) {
            resetForm({
                company_name: originalCompany.company_name || "",
                gst_number: originalCompany.gst_number || "",
                phone: originalCompany.phone || "",
                email: originalCompany.email || "",
                address: originalCompany.address || "",
                state: originalCompany.state || "",
                pincode: originalCompany.pincode || "",
                bank_name: originalCompany.bank_name || "",
                account_holder: originalCompany.account_holder || "",
                account_number: originalCompany.account_number || "",
                ifsc_code: originalCompany.ifsc_code || ""
            });
            setPreviews({
                logo: getImageUrl(originalCompany.logo),
                qr_code: getImageUrl(originalCompany.qr_code),
                signature: getImageUrl(originalCompany.signature),
                stamp: getImageUrl(originalCompany.stamp)
            });
            setFiles({
                logo: null,
                qr_code: null,
                signature: null,
                stamp: null
            });
            toast.info("Form reset to saved details");
        } else {
            resetForm({
                company_name: "",
                gst_number: "",
                phone: "",
                email: "",
                address: "",
                state: "",
                pincode: "",
                bank_name: "",
                account_holder: "",
                account_number: "",
                ifsc_code: ""
            });
            setPreviews({
                logo: null,
                qr_code: null,
                signature: null,
                stamp: null
            });
            setFiles({
                logo: null,
                qr_code: null,
                signature: null,
                stamp: null
            });
            toast.info("Form cleared");
        }
    };

    // Submit text and file fields together as FormData
    const onSubmit = async (data) => {
        setSubmitting(true);
        const formData = new FormData();

        // Append text fields
        Object.keys(data).forEach((key) => {
            formData.append(key, data[key] || "");
        });

        // Append image files
        Object.keys(files).forEach((key) => {
            if (files[key]) {
                formData.append(key, files[key]);
            }
        });

        try {
            let response;
            if (companyId) {
                // Perform PUT request if company profile already exists
                response = await updateCompany(companyId, formData);
            } else {
                // Perform POST request if no company profile exists yet
                response = await createCompany(formData);
            }

            if (response.success) {
                toast.success(response.message || "Company profile saved successfully");
                
                // Track current state
                const savedCompany = response.data;
                setCompanyId(savedCompany.id);
                setOriginalCompany(savedCompany);
                
                // Reset file selections (since they are uploaded) and update previews
                setFiles({
                    logo: null,
                    qr_code: null,
                    signature: null,
                    stamp: null
                });
                setPreviews({
                    logo: getImageUrl(savedCompany.logo),
                    qr_code: getImageUrl(savedCompany.qr_code),
                    signature: getImageUrl(savedCompany.signature),
                    stamp: getImageUrl(savedCompany.stamp)
                });
            } else {
                toast.error(response.message || "Failed to save company profile");
            }
        } catch (error) {
            console.error("Error saving company profile:", error);
            const errorMsg = error.response?.data?.message || "An error occurred while saving company details";
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
                <span className="ml-3 font-medium text-slate-500">Loading company details...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header Title */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Company Settings</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure company profiles, banking coordinates, and billing stamps for invoices.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Columns - Company Details */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Card 1: Company Information */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Company Information</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Primary identification details of the business.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* Company Name */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Acme Corporation"
                                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200 ${
                                        errors.company_name ? "border-red-500 bg-red-50/10" : "border-slate-200 dark:border-slate-800"
                                    }`}
                                    {...register("company_name", { required: "Company name is required" })}
                                />
                                {errors.company_name && (
                                    <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.company_name.message}</p>
                                )}
                            </div>

                            {/* GST Number */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    GST Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 29ABCDE1234F1Z5"
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200"
                                    {...register("gst_number")}
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. +91 98765 43210"
                                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200 ${
                                        errors.phone ? "border-red-500 bg-red-50/10" : "border-slate-200 dark:border-slate-800"
                                    }`}
                                    {...register("phone", { required: "Phone number is required" })}
                                />
                                {errors.phone && (
                                    <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.phone.message}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="e.g. billing@company.com"
                                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200 ${
                                        errors.email ? "border-red-500 bg-red-50/10" : "border-slate-200 dark:border-slate-800"
                                    }`}
                                    {...register("email", {
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Invalid email address"
                                        }
                                    })}
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email.message}</p>
                                )}
                            </div>

                            {/* State */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    State
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Karnataka"
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200"
                                    {...register("state")}
                                />
                            </div>

                            {/* Pincode */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Pincode
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 560001"
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200"
                                    {...register("pincode")}
                                />
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Company Address
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="e.g. Suite 404, Industrial Business Hub"
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200 resize-none"
                                    {...register("address")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Bank Information */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Bank Information</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Banking coordinates listed directly on invoices for customer remittance.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Bank Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. HDFC Bank"
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200"
                                    {...register("bank_name")}
                                />
                            </div>

                            {/* Account Holder */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Account Holder Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Acme Corporation Pvt Ltd"
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200"
                                    {...register("account_holder")}
                                />
                            </div>

                            {/* Account Number */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 50100293849102"
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200"
                                    {...register("account_number")}
                                />
                            </div>

                            {/* IFSC Code */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    IFSC Code
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. HDFC0000123"
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 bg-white dark:bg-slate-950 dark:text-slate-200"
                                    {...register("ifsc_code")}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Uploads & Actions */}
                <div className="space-y-8">
                    
                    {/* Card 3: Company Media/Uploads */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Company Branding</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Upload logos, signatures, stamps, and payment codes.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-5">
                            
                            {/* Logo Upload */}
                            <ImageUploadField
                                label="Company Logo"
                                id="logo"
                                preview={previews.logo}
                                onChange={(e) => handleFileChange(e, "logo")}
                            />

                            {/* QR Code Upload */}
                            <ImageUploadField
                                label="Payment QR Code"
                                id="qr_code"
                                preview={previews.qr_code}
                                onChange={(e) => handleFileChange(e, "qr_code")}
                            />

                            {/* Signature Upload */}
                            <ImageUploadField
                                label="Authorized Signature"
                                id="signature"
                                preview={previews.signature}
                                onChange={(e) => handleFileChange(e, "signature")}
                            />

                            {/* Stamp Upload */}
                            <ImageUploadField
                                label="Company Stamp"
                                id="stamp"
                                preview={previews.stamp}
                                onChange={(e) => handleFileChange(e, "stamp")}
                            />
                        </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-3 rounded-lg text-sm font-semibold transition cursor-pointer text-white shadow-xs ${
                                submitting
                                    ? "bg-indigo-400 dark:bg-indigo-500/50 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                            }`}
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving Company...
                                </span>
                            ) : (
                                "Save Company"
                            )}
                        </button>
                        
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={submitting}
                            className="w-full py-3 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold transition cursor-pointer"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

// Reusable Image Upload Card component with premium design
const ImageUploadField = ({ label, id, preview, onChange }) => {
    return (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950 transition hover:border-indigo-500 relative overflow-hidden group">
            {preview ? (
                <div className="flex flex-col items-center w-full h-full justify-between">
                    <img
                        src={preview}
                        alt={label}
                        className="h-24 w-auto object-contain rounded mb-2 transition transform group-hover:scale-105"
                    />
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">{label}</span>
                    <label
                        htmlFor={id}
                        className="mt-2 text-[10px] bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold py-1 px-3.5 rounded-full cursor-pointer transition border border-indigo-100 dark:border-indigo-900/40"
                    >
                        Change
                    </label>
                </div>
            ) : (
                <label htmlFor={id} className="flex flex-col items-center justify-center cursor-pointer py-4 w-full h-full">
                    <svg
                        className="w-7 h-7 text-slate-400 dark:text-slate-600 mb-2 group-hover:text-indigo-500 transition"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Upload {label}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-600">PNG, JPG or WEBP (Max 5MB)</span>
                </label>
            )}
            <input
                type="file"
                id={id}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={onChange}
            />
        </div>
    );
};

export default CompanySettings;
