import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { createItem, updateItem } from "../../services/itemService";
import { FaTimes } from "react-icons/fa";

/**
 * ItemForm component modal.
 * Supports adding and editing product/service item models.
 * Styled with reusable dark classes and Indian Rupee aggregates.
 */
const ItemForm = ({ isOpen, onClose, onSubmitSuccess, item }) => {
    const [submitting, setSubmitting] = useState(false);
    const isEditMode = !!item;

    const categories = ["Electronics", "Food", "Medicine", "Clothing", "Others"];
    const units = ["Piece", "Kg", "Gram", "Liter", "Box", "Packet", "Meter", "Dozen"];
    const gstRates = ["0%", "5%", "12%", "18%", "28%"];

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        defaultValues: {
            item_type: "Product",
            item_name: "",
            category: "",
            unit: "",
            hsn_sac: "",
            sku: "",
            barcode: "",
            gst_percentage: "",
            purchase_price: 0,
            selling_price: 0,
            opening_stock: 0,
            minimum_stock: 0,
            description: ""
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (item) {
                reset({
                    item_type: item.item_type || "Product",
                    item_name: item.item_name || "",
                    category: item.category || "",
                    unit: item.unit || "",
                    hsn_sac: item.hsn_sac || "",
                    sku: item.sku || "",
                    barcode: item.barcode || "",
                    gst_percentage: item.gst_percentage || "",
                    purchase_price: item.purchase_price || 0,
                    selling_price: item.selling_price || 0,
                    opening_stock: item.opening_stock || 0,
                    minimum_stock: item.minimum_stock || 0,
                    description: item.description || ""
                });
            } else {
                reset({
                    item_type: "Product",
                    item_name: "",
                    category: "",
                    unit: "",
                    hsn_sac: "",
                    sku: "",
                    barcode: "",
                    gst_percentage: "",
                    purchase_price: 0,
                    selling_price: 0,
                    opening_stock: 0,
                    minimum_stock: 0,
                    description: ""
                });
            }
        }
    }, [isOpen, item, reset]);

    const handleFormSubmit = async (data) => {
        setSubmitting(true);
        try {
            let response;
            if (isEditMode) {
                response = await updateItem(item.id, data);
            } else {
                response = await createItem(data);
            }

            if (response.success) {
                toast.success(response.message || `Item ${isEditMode ? "updated" : "created"} successfully`);
                onSubmitSuccess();
                onClose();
            } else {
                toast.error(response.message || "Failed to save item details");
            }
        } catch (error) {
            console.error("Error saving item:", error);
            const errorMsg = error.response?.data?.message || "An error occurred while saving item details";
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
                        {isEditMode ? "Edit Item Details" : "Add New Catalog Item"}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
                        <FaTimes className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#16223B] custom-scrollbar">
                    
                    {/* Item Type */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-[#5B6CFF] uppercase tracking-wider border-b border-[rgba(79,70,229,0.15)] pb-1">
                            Item Classification
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="md:col-span-3">
                                <label className={labelClass}>
                                    Item Type <span className="text-rose-500 font-bold">*</span>
                                </label>
                                <div className="flex gap-6 mt-1">
                                    <label className="flex items-center gap-2.5 text-sm font-semibold text-white cursor-pointer select-none">
                                        <input
                                            type="radio"
                                            value="Product"
                                            className="h-4.5 w-4.5 text-[#4F46E5] border-[#2E5BFF] bg-[#111C33] focus:ring-0 cursor-pointer"
                                            {...register("item_type", { required: true })}
                                        />
                                        Product
                                    </label>
                                    <label className="flex items-center gap-2.5 text-sm font-semibold text-white cursor-pointer select-none">
                                        <input
                                            type="radio"
                                            value="Service"
                                            className="h-4.5 w-4.5 text-[#4F46E5] border-[#2E5BFF] bg-[#111C33] focus:ring-0 cursor-pointer"
                                            {...register("item_type", { required: true })}
                                        />
                                        Service
                                    </label>
                                </div>
                            </div>

                            {/* Item Name */}
                            <div className="md:col-span-2">
                                <label className={labelClass}>
                                    Item Name <span className="text-rose-500 font-bold">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Wireless Mouse"
                                    className={`w-full input-dark ${
                                        errors.item_name ? "border-rose-500" : ""
                                    }`}
                                    {...register("item_name", { required: "Item name is required" })}
                                />
                                {errors.item_name && (
                                    <p className="text-rose-500 text-[10px] mt-1.5 font-bold">{errors.item_name.message}</p>
                                )}
                            </div>

                            {/* HSN/SAC Code */}
                            <div>
                                <label className={labelClass}>
                                    HSN / SAC Code
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 84713010"
                                    className="w-full input-dark"
                                    {...register("hsn_sac")}
                                />
                            </div>

                            {/* Category Dropdown */}
                            <div>
                                <label className={labelClass}>
                                    Category <span className="text-rose-500 font-bold">*</span>
                                </label>
                                <select
                                    className={`w-full select-dark ${
                                        errors.category ? "border-rose-500" : ""
                                    }`}
                                    {...register("category", { required: "Category is required" })}
                                >
                                    <option value="" className="bg-[#111C33]">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat} className="bg-[#111C33]">{cat}</option>
                                    ))}
                                </select>
                                {errors.category && (
                                    <p className="text-rose-500 text-[10px] mt-1.5 font-bold">{errors.category.message}</p>
                                )}
                            </div>

                            {/* Unit Dropdown */}
                            <div>
                                <label className={labelClass}>
                                    Unit <span className="text-rose-500 font-bold">*</span>
                                </label>
                                <select
                                    className={`w-full select-dark ${
                                        errors.unit ? "border-rose-500" : ""
                                    }`}
                                    {...register("unit", { required: "Unit is required" })}
                                >
                                    <option value="" className="bg-[#111C33]">Select Unit</option>
                                    {units.map((u) => (
                                        <option key={u} value={u} className="bg-[#111C33]">{u}</option>
                                    ))}
                                </select>
                                {errors.unit && (
                                    <p className="text-rose-500 text-[10px] mt-1.5 font-bold">{errors.unit.message}</p>
                                )}
                            </div>

                            {/* GST Rate Dropdown */}
                            <div>
                                <label className={labelClass}>
                                    GST Percentage <span className="text-rose-500 font-bold">*</span>
                                </label>
                                <select
                                    className={`w-full select-dark ${
                                        errors.gst_percentage ? "border-rose-500" : ""
                                    }`}
                                    {...register("gst_percentage", { required: "GST Rate is required" })}
                                >
                                    <option value="" className="bg-[#111C33]">Select GST Rate</option>
                                    {gstRates.map((rate) => (
                                        <option key={rate} value={rate} className="bg-[#111C33]">{rate}</option>
                                    ))}
                                </select>
                                {errors.gst_percentage && (
                                    <p className="text-rose-500 text-[10px] mt-1.5 font-bold">{errors.gst_percentage.message}</p>
                                )}
                            </div>

                            {/* SKU */}
                            <div>
                                <label className={labelClass}>
                                    SKU
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. MOUSE-W-01"
                                    className="w-full input-dark"
                                    {...register("sku")}
                                />
                            </div>

                            {/* Barcode */}
                            <div className="md:col-span-2">
                                <label className={labelClass}>
                                    Barcode / Serial Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 123456789012"
                                    className="w-full input-dark"
                                    {...register("barcode")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Financials & Stock */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-[#5B6CFF] uppercase tracking-wider border-b border-[rgba(79,70,229,0.15)] pb-1">
                            Pricing & Stock
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            {/* Purchase Price */}
                            <div>
                                <label className={labelClass}>
                                    Purchase Price (₹)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g. 15.00"
                                    className={`w-full number-input-dark ${
                                        errors.purchase_price ? "border-rose-500" : ""
                                    }`}
                                    {...register("purchase_price", { 
                                        valueAsNumber: true,
                                        min: { value: 0, message: "Must be >= 0" }
                                    })}
                                />
                                {errors.purchase_price && (
                                    <p className="text-rose-500 text-[10px] mt-1.5 font-bold">{errors.purchase_price.message}</p>
                                )}
                            </div>

                            {/* Selling Price */}
                            <div>
                                <label className={labelClass}>
                                    Selling Price (₹) <span className="text-rose-500 font-bold">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g. 25.00"
                                    className={`w-full number-input-dark ${
                                        errors.selling_price ? "border-rose-500" : ""
                                    }`}
                                    {...register("selling_price", { 
                                        required: "Selling price is required",
                                        valueAsNumber: true,
                                        min: { value: 0, message: "Must be >= 0" }
                                    })}
                                />
                                {errors.selling_price && (
                                    <p className="text-rose-500 text-[10px] mt-1.5 font-bold">{errors.selling_price.message}</p>
                                )}
                            </div>

                            {/* Opening Stock */}
                            <div>
                                <label className={labelClass}>
                                    Opening Stock
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 100"
                                    className={`w-full number-input-dark ${
                                        errors.opening_stock ? "border-rose-500" : ""
                                    }`}
                                    {...register("opening_stock", { 
                                        valueAsNumber: true,
                                        min: { value: 0, message: "Must be >= 0" }
                                    })}
                                />
                                {errors.opening_stock && (
                                    <p className="text-rose-500 text-[10px] mt-1.5 font-bold">{errors.opening_stock.message}</p>
                                )}
                            </div>

                            {/* Minimum Stock */}
                            <div>
                                <label className={labelClass}>
                                    Min Stock Alert
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 10"
                                    className="w-full number-input-dark"
                                    {...register("minimum_stock", { valueAsNumber: true })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-[#5B6CFF] uppercase tracking-wider border-b border-[rgba(79,70,229,0.15)] pb-1">
                            Description
                        </h3>
                        <div>
                            <textarea
                                rows="2"
                                placeholder="Product terms or details..."
                                className="w-full textarea-dark"
                                {...register("description")}
                            />
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
                            "Update Item"
                        ) : (
                            "Save Item"
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ItemForm;
