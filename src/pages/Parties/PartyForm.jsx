import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { createParty, updateParty } from "../../services/partyService";
import { FaTimes } from "react-icons/fa";

/**
 * PartyForm component modal.
 * Allows adding or editing customer/supplier profiles in-place.
 * Redesigned to use unified dark styling inputs and Rupee aggregates.
 */
const PartyForm = ({ isOpen, onClose, onSubmitSuccess, party }) => {
    const [submitting, setSubmitting] = useState(false);
    const isEditMode = !!party;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        defaultValues: {
            party_type: "Customer",
            party_name: "",
            company_name: "",
            gst_number: "",
            phone: "",
            alternate_phone: "",
            email: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            opening_balance: 0,
            credit_limit: 0
        }
    });

    // Reset and load details on open
    useEffect(() => {
        if (isOpen) {
            if (party) {
                reset({
                    party_type: party.party_type || "Customer",
                    party_name: party.party_name || "",
                    company_name: party.company_name || "",
                    gst_number: party.gst_number || "",
                    phone: party.phone || "",
                    alternate_phone: party.alternate_phone || "",
                    email: party.email || "",
                    address: party.address || "",
                    city: party.city || "",
                    state: party.state || "",
                    pincode: party.pincode || "",
                    opening_balance: party.opening_balance || 0,
                    credit_limit: party.credit_limit || 0
                });
            } else {
                reset({
                    party_type: "Customer",
                    party_name: "",
                    company_name: "",
                    gst_number: "",
                    phone: "",
                    alternate_phone: "",
                    email: "",
                    address: "",
                    city: "",
                    state: "",
                    pincode: "",
                    opening_balance: 0,
                    credit_limit: 0
                });
            }
        }
    }, [isOpen, party, reset]);

    const handleFormSubmit = async (data) => {
        setSubmitting(true);
        try {
            let response;
            if (isEditMode) {
                response = await updateParty(party.id, data);
            } else {
                response = await createParty(data);
            }

            if (response.success) {
                toast.success(response.message || `Party ${isEditMode ? "updated" : "created"} successfully`);
                onSubmitSuccess();
                onClose();
            } else {
                toast.error(response.message || "Failed to save party details");
            }
        } catch (error) {
            console.error("Error saving party:", error);
            const errorMsg = error.response?.data?.message || "An error occurred while saving party details";
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const labelClass = "block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto custom-scrollbar">
            <div className="bg-[#16223B] border border-[rgba(79,70,229,0.2)] w-full max-w-3xl rounded-[20px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(79,70,229,0.2)] bg-[#16223B]">
                    <h2 className="text-base font-extrabold text-white tracking-tight uppercase">
                        {isEditMode ? "Edit Party Profile" : "Add New Customer/Supplier"}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
                        <FaTimes className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#16223B] custom-scrollbar">
                    
                    {/* Radio Switch */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-[#5B6CFF] uppercase tracking-wider border-b border-[rgba(79,70,229,0.15)] pb-1">
                            Party Type
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="md:col-span-3">
                                <label className={labelClass}>
                                    Party Type <span className="text-rose-500 font-bold">*</span>
                                </label>
                                <div className="flex gap-6 mt-1">
                                    <label className="flex items-center gap-2.5 text-sm font-semibold text-white cursor-pointer select-none">
                                        <input
                                            type="radio"
                                            value="Customer"
                                            className="h-4.5 w-4.5 text-[#4F46E5] border-[#2E5BFF] bg-[#111C33] focus:ring-0 cursor-pointer"
                                            {...register("party_type", { required: true })}
                                        />
                                        Customer
                                    </label>
                                    <label className="flex items-center gap-2.5 text-sm font-semibold text-white cursor-pointer select-none">
                                        <input
                                            type="radio"
                                            value="Supplier"
                                            className="h-4.5 w-4.5 text-[#4F46E5] border-[#2E5BFF] bg-[#111C33] focus:ring-0 cursor-pointer"
                                            {...register("party_type", { required: true })}
                                        />
                                        Supplier
                                    </label>
                                </div>
                            </div>

                            {/* Party Name */}
                            <div className="md:col-span-2">
                                <label className={labelClass}>
                                    Party Name <span className="text-rose-500 font-bold">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    className={`w-full input-dark ${
                                        errors.party_name ? "border-rose-500" : ""
                                    }`}
                                    {...register("party_name", { required: "Party name is required" })}
                                />
                                {errors.party_name && (
                                    <p className="text-rose-500 text-[10px] mt-1.5 font-bold">{errors.party_name.message}</p>
                                )}
                            </div>

                            {/* GST Number */}
                            <div>
                                <label className={labelClass}>
                                    GSTIN
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 29ABCDE1234F1Z5"
                                    className="w-full input-dark"
                                    {...register("gst_number")}
                                />
                            </div>

                            {/* Company Name */}
                            <div className="md:col-span-3">
                                <label className={labelClass}>
                                    Company / Business Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Apex Global Solutions"
                                    className="w-full input-dark"
                                    {...register("company_name")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Contacts */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-[#5B6CFF] uppercase tracking-wider border-b border-[rgba(79,70,229,0.15)] pb-1">
                            Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Phone */}
                            <div>
                                <label className={labelClass}>
                                    Phone Number <span className="text-rose-500 font-bold">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 9876543210"
                                    className={`w-full input-dark ${
                                        errors.phone ? "border-rose-500" : ""
                                    }`}
                                    {...register("phone", { required: "Phone number is required" })}
                                />
                                {errors.phone && (
                                    <p className="text-rose-500 text-[10px] mt-1.5 font-bold">{errors.phone.message}</p>
                                )}
                            </div>

                            {/* Alternate Phone */}
                            <div>
                                <label className={labelClass}>
                                    Alternate Phone
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 080-123456"
                                    className="w-full input-dark"
                                    {...register("alternate_phone")}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className={labelClass}>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="e.g. billing@party.com"
                                    className={`w-full input-dark ${
                                        errors.email ? "border-rose-500" : ""
                                    }`}
                                    {...register("email", {
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Invalid email address format"
                                        }
                                    })}
                                />
                                {errors.email && (
                                    <p className="text-rose-500 text-[10px] mt-1.5 font-bold">{errors.email.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Address */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-[#5B6CFF] uppercase tracking-wider border-b border-[rgba(79,70,229,0.15)] pb-1">
                            Address Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Address Text Area */}
                            <div className="md:col-span-3">
                                <label className={labelClass}>
                                    Billing Address
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="e.g. 123 Tech Center, Phase 1"
                                    className="w-full textarea-dark"
                                    {...register("address")}
                                />
                            </div>

                            {/* City */}
                            <div>
                                <label className={labelClass}>
                                    City
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Mumbai"
                                    className="w-full input-dark"
                                    {...register("city")}
                                />
                            </div>

                            {/* State */}
                            <div>
                                <label className={labelClass}>
                                    State
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Maharashtra"
                                    className="w-full input-dark"
                                    {...register("state")}
                                />
                            </div>

                            {/* Pincode */}
                            <div>
                                <label className={labelClass}>
                                    Pincode
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 400001"
                                    className="w-full input-dark"
                                    {...register("pincode")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Finances */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-[#5B6CFF] uppercase tracking-wider border-b border-[rgba(79,70,229,0.15)] pb-1">
                            Financial Coordinates
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Opening Balance */}
                            <div>
                                <label className={labelClass}>
                                    Opening Balance (₹)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g. 5000.00"
                                    className="w-full number-input-dark"
                                    {...register("opening_balance", { valueAsNumber: true })}
                                />
                            </div>

                            {/* Credit Limit */}
                            <div>
                                <label className={labelClass}>
                                    Credit Limit (₹)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g. 25000.00"
                                    className="w-full number-input-dark"
                                    {...register("credit_limit", { valueAsNumber: true })}
                                />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer buttons */}
                <div className="px-6 py-4 bg-[#16223B] border-t border-[rgba(79,70,229,0.2)] flex items-center justify-end gap-3 rounded-b-[20px]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="h-10 px-5 bg-transparent border border-[#2E5BFF] hover:bg-[#2E5BFF]/10 text-white rounded-[10px] text-xs font-bold cursor-pointer transition select-none flex items-center justify-center disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    
                    <button
                        type="button"
                        onClick={handleSubmit(handleFormSubmit)}
                        disabled={submitting}
                        className={`h-10 px-6 bg-[#4F46E5] hover:bg-[#6366F1] text-white rounded-[10px] text-xs font-bold cursor-pointer transition select-none flex items-center justify-center shadow-md ${
                            submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        {submitting ? (
                            <span className="flex items-center gap-1.5">
                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Saving...
                            </span>
                        ) : isEditMode ? (
                            "Update Profile"
                        ) : (
                            "Save Profile"
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PartyForm;
