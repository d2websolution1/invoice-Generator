import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { getInvoice, createInvoice, updateInvoice } from "../../services/invoiceService";
import { getParties } from "../../services/partyService";
import { getItems } from "../../services/itemService";
import { getCompany } from "../../services/companyService";
import { FaPlus, FaTrash, FaUndo, FaSave, FaPrint, FaArrowLeft, FaChevronDown, FaSearch } from "react-icons/fa";

/**
 * CreateInvoice page component.
 * Supports invoicing creation and modifications with live tax calculations.
 * Redesigned to provide a premium, modern dark Vyapar/Razorpay styled layout.
 */
const CreateInvoice = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [parties, setParties] = useState([]);
    const [itemsList, setItemsList] = useState([]);
    const [company, setCompany] = useState(null);

    // Dropdown search states
    const [partySearch, setPartySearch] = useState("");
    const [partyDropdownOpen, setPartyDropdownOpen] = useState(false);
    const [itemDropdownOpenIndex, setItemDropdownOpenIndex] = useState(null);
    const [itemSearch, setItemSearch] = useState("");

    // Setup React Hook Form
    const {
        register,
        handleSubmit,
        control,
        setValue,
        getValues,
        watch,
        reset,
        formState: { errors }
    } = useForm({
        defaultValues: {
            invoice_number: `INV-${Date.now().toString().slice(-6)}`,
            invoice_date: new Date().toISOString().split("T")[0],
            due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            delivery_date: "",
            payment_mode: "Cash",
            payment_status: "Unpaid",
            party_id: "",
            customer_name: "",
            customer_phone: "",
            customer_gstin: "",
            customer_address: "",
            customer_state: "",
            items: [{ item_id: "", item_name: "", qty: 1, unit: "Piece", price: 0, discount_pct: 0, gst_pct: 18, amount: 0 }],
            notes: "",
            terms: "",
            transport_details: "",
            transport_name: "",
            vehicle_number: "",
            eway_bill_no: "",
            shipping_address: "",
            shipping_city: "",
            subtotal: 0,
            discount_total: 0,
            taxable_amount: 0,
            cgst_total: 0,
            sgst_total: 0,
            igst_total: 0,
            grand_total: 0,
            round_off: 0,
            received_amount: 0,
            balance_amount: 0
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });
    const watchedItems = useWatch({
        control,
        name: "items"
    });

    // Watch dynamic fields for live calculations

    const selectedPartyId = watch("party_id");
    const customerState = watch("customer_state");
    const receivedAmountVal = watch("received_amount");

    // Fetch initial parameters
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch company info for GST comparison
                const compRes = await getCompany();
                if (compRes.success && compRes.data) {
                    const compData = Array.isArray(compRes.data) ? compRes.data[0] : compRes.data;
                    setCompany(compData || null);
                }

                // Fetch customers/parties
                const partyRes = await getParties();
                if (partyRes.success) {
                    setParties(partyRes.data || []);
                }

                // Fetch catalog items
                const itemRes = await getItems();
                if (itemRes.success) {
                    setItemsList(itemRes.data || []);
                }

                // Load invoice if edit mode
                if (isEditMode) {
                    const invRes = await getInvoice(id);
                    if (invRes.success && invRes.data) {
                        const invData = invRes.data;

                        // Parse date formats
                        invData.invoice_date = new Date(invData.invoice_date).toISOString().split("T")[0];
                        if (invData.due_date) {
                            invData.due_date = new Date(invData.due_date).toISOString().split("T")[0];
                        }

                        // Parse line items JSON if string
                        if (typeof invData.items === "string") {
                            invData.items = JSON.parse(invData.items);
                        }

                        reset(invData);
                    } else {
                        toast.error(invRes.message || "Failed to retrieve invoice details");
                        navigate("/invoices");
                    }
                }
            } catch (error) {
                console.error("Error loading invoice creation components:", error);
                toast.error("Failed to load initial invoice modules");
            }
        };

        fetchInitialData();
    }, [id, isEditMode, reset, navigate]);

    // Handle party selection
    const handlePartySelect = (party) => {
        setValue("party_id", party.id);
        setValue("customer_name", party.party_name);
        setValue("customer_phone", party.phone || "");
        setValue("customer_gstin", party.gst_number || "");
        setValue("customer_address", [party.address, party.city].filter(Boolean).join(", "));
        setValue("customer_state", party.state || "");
        setPartyDropdownOpen(false);
        setPartySearch("");
    };

    // Handle catalog item selection
    const handleItemSelect = (index, catalogItem) => {
        setValue(`items.${index}.item_id`, catalogItem.id, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });

        setValue(`items.${index}.item_name`, catalogItem.item_name, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });

        setValue(`items.${index}.unit`, catalogItem.unit || "Piece", {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });

        setValue(`items.${index}.price`, Number(catalogItem.selling_price) || 0, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });

        setValue(`items.${index}.gst_pct`, Number(catalogItem.gst_percentage) || 0, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });

        // Optional: reset discount when selecting a new item
        if (!getValues(`items.${index}.discount_pct`)) {
            setValue(`items.${index}.discount_pct`, 0, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
        }

        setItemDropdownOpenIndex(null);
    };

    // Live Calculations Hook
    useEffect(() => {
        if (!watchedItems || watchedItems.length === 0) return;

        let subtotal = 0;
        let discountTotal = 0;
        let taxableTotal = 0;
        let cgstTotal = 0;
        let sgstTotal = 0;
        let igstTotal = 0;

        // Is intra-state? Compare company state and party state
        const isIntraState = !company || !customerState ||
            company.state?.toLowerCase().trim() === customerState?.toLowerCase().trim();

        watchedItems.forEach((item, index) => {
            const qty = Number(item?.qty ?? 0);
            const price = Number(item?.price ?? 0);
            const discPct = Number(item?.discount_pct ?? 0);
            const gstPct = Number(item?.gst_pct ?? 0);

            // Calculate values
            const grossAmount = qty * price;
            const discountAmount = (grossAmount * discPct) / 100;
            const taxableAmount = grossAmount - discountAmount;
            const gstAmount = (taxableAmount * gstPct) / 100;
            const lineAmount = taxableAmount + gstAmount;

            // Update row amount only if it actually changed
            const currentAmount = Number(getValues(`items.${index}.amount`) || 0);

            if (currentAmount !== Number(lineAmount.toFixed(2))) {
                setValue(
                    `items.${index}.amount`,
                    Number(lineAmount.toFixed(2)),
                    {
                        shouldDirty: false,
                        shouldValidate: false,
                    }
                );
            }

            // Summary
            subtotal += grossAmount;
            discountTotal += discountAmount;
            taxableTotal += taxableAmount;

            if (isIntraState) {
                cgstTotal += gstAmount / 2;
                sgstTotal += gstAmount / 2;
            } else {
                igstTotal += gstAmount;
            }
        });

        const grossGrandTotal = taxableTotal + cgstTotal + sgstTotal + igstTotal;
        const roundedGrandTotal = Math.round(grossGrandTotal);
        const roundOff = parseFloat((roundedGrandTotal - grossGrandTotal).toFixed(2));

        const received = parseFloat(receivedAmountVal || 0);
        const balance = parseFloat((roundedGrandTotal - received).toFixed(2));

        // Update payment status dynamically based on balance
        let payStatus = "Unpaid";
        if (received >= roundedGrandTotal && roundedGrandTotal > 0) {
            payStatus = "Paid";
        } else if (received > 0 && balance > 0) {
            payStatus = "Partial";
        }

        setValue("subtotal", parseFloat(subtotal.toFixed(2)));
        setValue("discount_total", parseFloat(discountTotal.toFixed(2)));
        setValue("taxable_amount", parseFloat(taxableTotal.toFixed(2)));
        setValue("cgst_total", parseFloat(cgstTotal.toFixed(2)));
        setValue("sgst_total", parseFloat(sgstTotal.toFixed(2)));
        setValue("igst_total", parseFloat(igstTotal.toFixed(2)));
        setValue("grand_total", roundedGrandTotal);
        setValue("round_off", roundOff);
        setValue("balance_amount", balance);
        setValue("payment_status", payStatus);

    }, [watchedItems, customerState, company, receivedAmountVal, setValue]);

    // Handle Form Submit
    const onSubmit = async (data, printAfter = false) => {
        try {
            let response;
            if (isEditMode) {
                response = await updateInvoice(id, data);
            } else {
                response = await createInvoice(data);
            }

            if (response.success) {
                const finalId = isEditMode ? id : response.data.id;
                toast.success(response.message || `Invoice ${isEditMode ? "updated" : "saved"} successfully`);

                if (printAfter) {
                    navigate(`/invoices/preview/${finalId}?print=true`);
                } else {
                    navigate("/invoices");
                }
            } else {
                toast.error(response.message || "Failed to save invoice records");
            }
        } catch (error) {
            console.error("Error saving invoice:", error);
            toast.error(error.response?.data?.message || "Failed to store invoice record on the server");
        }
    };

    // Filter lists
    const filteredParties = parties.filter(p =>
        p.party_name?.toLowerCase().includes(partySearch.toLowerCase()) ||
        p.phone?.toLowerCase().includes(partySearch.toLowerCase())
    );

    const filteredItems = itemsList.filter(it =>
        it.item_name?.toLowerCase().includes(itemSearch.toLowerCase()) ||
        it.sku?.toLowerCase().includes(itemSearch.toLowerCase())
    );

    // Global style configs matching Vyapar theme parameters
    const cardClass = "bg-[#16223B] border border-[rgba(79,70,229,0.2)] rounded-2xl p-6 shadow-md space-y-4";
    const labelClass = "block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5";
    const inputClass = "w-full rounded-[10px] border border-[#2E5BFF] px-3.5 py-2 text-xs outline-none bg-[#111C33] text-white placeholder-[#A5B4D4] h-10 font-semibold transition focus:ring-1 focus:ring-[#2E5BFF]/50";
    const selectClass = "w-full rounded-[10px] border border-[#2E5BFF] px-3.5 py-2 text-xs outline-none bg-[#111C33] text-white h-10 font-semibold transition focus:ring-1 focus:ring-[#2E5BFF]/50";
    const textareaClass = "w-full rounded-[10px] border border-[#2E5BFF] px-3.5 py-2 text-xs outline-none bg-[#111C33] text-white placeholder-[#A5B4D4] font-semibold transition focus:ring-1 focus:ring-[#2E5BFF]/50 resize-none";

    // Buttons styled as per design requirements
    const primaryBtnClass = "flex items-center justify-center gap-2 py-2.5 px-5 bg-[#4F46E5] hover:bg-[#6366F1] text-white rounded-[10px] text-xs font-bold cursor-pointer transition select-none h-10 shadow-md";
    const secondaryBtnClass = "flex items-center justify-center gap-2 py-2.5 px-5 bg-transparent border border-[#2E5BFF] text-[#2E5BFF] hover:bg-[#2E5BFF]/10 rounded-[10px] text-xs font-bold cursor-pointer transition select-none h-10";

    return (
        <div className="space-y-8 font-sans antialiased text-slate-200">
            {/* Custom styles injection to override browser default date pickers, number spinners, scrollbars */}
            <style>{`
                input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    cursor: pointer;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #111C33;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #2E5BFF;
                    border-radius: 3px;
                }
                /* Remove spinner controls in Chrome/Safari/Edge */
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                /* Remove spinner controls in Firefox */
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => navigate("/invoices")}
                    className="p-2.5 border border-[#2E5BFF]/50 bg-[#111C33] hover:bg-[#2E5BFF]/10 rounded-xl text-[#2E5BFF] cursor-pointer transition shadow-xs"
                >
                    <FaArrowLeft className="h-3.5 w-3.5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        {isEditMode ? "Edit Invoice Voucher" : "Create Invoice Voucher"}
                    </h1>
                    <p className="text-xs text-[#A5B4D4] mt-1">Issue customer billing vouchers with dynamic calculations and automatic GST parsing.</p>
                </div>
            </div>

            <form className="space-y-8">

                {/* 1. Invoice & Customer Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Invoice Meta details */}
                    <div className={cardClass}>
                        <h3 className="text-xs font-bold text-white border-b border-[rgba(79,70,229,0.2)] pb-2.5 uppercase tracking-widest">
                            Invoice Metadata
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={labelClass}>Invoice Number</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    {...register("invoice_number", { required: true })}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Invoice Date</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    {...register("invoice_date", { required: true })}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Due Date</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    {...register("due_date")}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className={labelClass}>Payment Mode</label>
                                <select
                                    className={selectClass}
                                    {...register("payment_mode")}
                                >
                                    <option value="Cash" className="bg-[#111C33]">Cash</option>
                                    <option value="UPI" className="bg-[#111C33]">UPI</option>
                                    <option value="Bank" className="bg-[#111C33]">Bank Account</option>
                                    <option value="Cheque" className="bg-[#111C33]">Cheque</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Customer Selection details */}
                    <div className="bg-[#16223B] border border-[rgba(79,70,229,0.2)] rounded-2xl p-6 lg:col-span-2 space-y-4 shadow-md">
                        <h3 className="text-xs font-bold text-white border-b border-[rgba(79,70,229,0.2)] pb-2.5 uppercase tracking-widest">
                            Billing Customer Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                            {/* Searchable Customer Dropdown */}
                            <div className="relative">
                                <label className={labelClass}>Search Customer Party *</label>
                                <div
                                    onClick={() => setPartyDropdownOpen(!partyDropdownOpen)}
                                    className="w-full rounded-[10px] border border-[#2E5BFF] px-3.5 py-2 text-xs outline-none flex items-center justify-between cursor-pointer bg-[#111C33] text-white h-10 font-semibold"
                                >
                                    <span className="font-semibold text-white">
                                        {watch("customer_name") || "Select Party"}
                                    </span>
                                    <FaChevronDown className="h-3 w-3 text-[#A5B4D4]" />
                                </div>

                                {partyDropdownOpen && (
                                    <div className="absolute left-0 right-0 mt-1.5 bg-[#16223B] border border-[#2E5BFF] rounded-xl shadow-2xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                                        <div className="p-2 border-b border-[rgba(79,70,229,0.2)] flex items-center gap-2 bg-[#111C33] sticky top-0">
                                            <FaSearch className="text-[#A5B4D4] h-3 w-3" />
                                            <input
                                                type="text"
                                                placeholder="Search customer by name..."
                                                value={partySearch}
                                                onChange={(e) => setPartySearch(e.target.value)}
                                                className="w-full text-xs bg-transparent outline-none py-1 text-white placeholder-[#A5B4D4]"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <ul className="py-1">
                                            {filteredParties.map(p => (
                                                <li
                                                    key={p.id}
                                                    onClick={() => handlePartySelect(p)}
                                                    className="px-4 py-2.5 text-xs hover:bg-[#2E5BFF]/20 cursor-pointer flex justify-between font-semibold text-white"
                                                >
                                                    <span>{p.party_name}</span>
                                                    <span className="text-[#A5B4D4] text-[10px]">{p.phone}</span>
                                                </li>
                                            ))}
                                            {filteredParties.length === 0 && (
                                                <li className="px-4 py-3 text-xs text-[#A5B4D4] italic text-center">No customers found</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Contact Number */}
                            <div>
                                <label className={labelClass}>Phone Number</label>
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select customer details"
                                    className={inputClass}
                                    {...register("customer_phone")}
                                />
                            </div>

                            {/* GST Number */}
                            <div>
                                <label className={labelClass}>GSTIN Number</label>
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select customer details"
                                    className={inputClass}
                                    {...register("customer_gstin")}
                                />
                            </div>

                            {/* Customer State */}
                            <div>
                                <label className={labelClass}>Billing State</label>
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select customer details"
                                    className={inputClass}
                                    {...register("customer_state")}
                                />
                            </div>

                            {/* Billing Address */}
                            <div className="md:col-span-2">
                                <label className={labelClass}>Billing Address</label>
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select customer details"
                                    className={inputClass}
                                    {...register("customer_address")}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Items Table Section */}
                <div className="bg-[#16223B] border border-[rgba(79,70,229,0.2)] rounded-2xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-[rgba(79,70,229,0.2)] flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Invoice Line Items</h3>
                        <button
                            type="button"
                            onClick={() => append({ item_id: "", item_name: "", qty: 1, unit: "Piece", price: 0, discount_pct: 0, gst_pct: 18, amount: 0 })}
                            className="flex items-center gap-1.5 text-xs text-white bg-[#4F46E5] hover:bg-[#6366F1] font-bold py-2 px-3.5 rounded-[10px] cursor-pointer transition shadow-sm h-9"
                        >
                            <FaPlus className="h-2.5 w-2.5" />
                            Add Item
                        </button>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[950px]">
                            <thead>
                                <tr className="bg-[#111C33] border-b border-[rgba(79,70,229,0.2)] text-[#A5B4D4] text-[10px] font-bold uppercase tracking-wider">
                                    <th className="py-3.5 px-6">Item description</th>
                                    <th className="py-3.5 px-4 w-28 text-right">Quantity</th>
                                    <th className="py-3.5 px-4 w-28">Unit</th>
                                    <th className="py-3.5 px-4 w-32 text-right">Rate (₹)</th>
                                    <th className="py-3.5 px-4 w-28 text-right">Discount %</th>
                                    <th className="py-3.5 px-4 w-28 text-right">GST %</th>
                                    <th className="py-3.5 px-4 w-36 text-right">Amount (₹)</th>
                                    <th className="py-3.5 px-6 text-center w-20">Remove</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgba(79,70,229,0.15)] bg-[#16223B]">
                                {fields.map((itemField, index) => (
                                    <tr key={itemField.id} className="hover:bg-[#111C33]/30 transition-colors">

                                        {/* Dropdown description select */}
                                        <td className="py-3.5 px-6 relative min-w-[280px]">
                                            <div
                                                onClick={() => setItemDropdownOpenIndex(itemDropdownOpenIndex === index ? null : index)}
                                                className="w-full rounded-[10px] border border-[#2E5BFF] px-3.5 py-2 text-xs cursor-pointer flex justify-between items-center bg-[#111C33] text-white h-10 font-semibold"
                                            >
                                                <span>{watch(`items.${index}.item_name`) || "Select Catalog Item"}</span>
                                                <FaChevronDown className="h-2.5 w-2.5 text-[#A5B4D4]" />
                                            </div>

                                            {itemDropdownOpenIndex === index && (
                                                <div className="absolute left-6 right-6 mt-1.5 bg-[#16223B] border border-[#2E5BFF] rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto custom-scrollbar">
                                                    <div className="p-2 border-b border-[rgba(79,70,229,0.2)] flex items-center gap-2 bg-[#111C33] sticky top-0">
                                                        <FaSearch className="text-[#A5B4D4] h-2.5 w-2.5" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search catalog items..."
                                                            value={itemSearch}
                                                            onChange={(e) => setItemSearch(e.target.value)}
                                                            className="w-full text-xs bg-transparent outline-none py-1 text-white placeholder-[#A5B4D4]"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <ul>
                                                        {filteredItems.map(catalogItem => (
                                                            <li
                                                                key={catalogItem.id}
                                                                onClick={() => handleItemSelect(index, catalogItem)}
                                                                className="px-4 py-2.5 text-xs hover:bg-[#2E5BFF]/20 cursor-pointer flex justify-between font-semibold text-white"
                                                            >
                                                                <span>{catalogItem.item_name}</span>
                                                                <span className="text-[#A5B4D4] text-[10px]">Stock: {catalogItem.opening_stock}</span>
                                                            </li>
                                                        ))}
                                                        {filteredItems.length === 0 && (
                                                            <li className="px-4 py-3 text-xs text-[#A5B4D4] italic text-center">No items match</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </td>

                                        {/* Qty */}
                                        <td className="py-3.5 px-4">
                                            <input
                                                type="number"
                                                className="w-full rounded-[10px] border border-[#2E5BFF] px-2 py-2 text-xs text-right outline-none bg-[#111C33] text-white h-10 font-semibold transition focus:ring-1 focus:ring-[#2E5BFF]/50"
                                                {...register(`items.${index}.qty`, { valueAsNumber: true, required: true })}
                                            />
                                        </td>

                                        {/* Unit */}
                                        <td className="py-3.5 px-4">
                                            <input
                                                type="text"
                                                className="w-full rounded-[10px] border border-[#2E5BFF] px-2 py-2 text-xs outline-none bg-[#111C33] text-white h-10 font-semibold cursor-not-allowed"
                                                readOnly
                                                {...register(`items.${index}.unit`)}
                                            />
                                        </td>

                                        {/* Price */}
                                        <td className="py-3.5 px-4">
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-full rounded-[10px] border border-[#2E5BFF] px-2 py-2 text-xs text-right outline-none bg-[#111C33] text-white h-10 font-semibold transition focus:ring-1 focus:ring-[#2E5BFF]/50"
                                                {...register(`items.${index}.price`, { valueAsNumber: true, required: true })}
                                            />
                                        </td>

                                        {/* Discount % */}
                                        <td className="py-3.5 px-4">
                                            <input
                                                type="number"
                                                step="0.1"
                                                className="w-full rounded-[10px] border border-[#2E5BFF] px-2 py-2 text-xs text-right outline-none bg-[#111C33] text-white h-10 font-semibold transition focus:ring-1 focus:ring-[#2E5BFF]/50"
                                                {...register(`items.${index}.discount_pct`, { valueAsNumber: true })}
                                            />
                                        </td>

                                        {/* GST % */}
                                        <td className="py-3.5 px-4">
                                            <input
                                                type="number"
                                                className="w-full rounded-[10px] border border-[#2E5BFF] px-2 py-2 text-xs text-right outline-none bg-[#111C33] text-white h-10 font-semibold transition focus:ring-1 focus:ring-[#2E5BFF]/50"
                                                {...register(`items.${index}.gst_pct`, { valueAsNumber: true })}
                                            />
                                        </td>

                                        {/* Line Total */}
                                        <td className="py-3.5 px-4 text-xs font-extrabold text-right text-white pr-6">
                                            {(() => {
                                                const qty = Number(watch(`items.${index}.qty`) || 0);
                                                const price = Number(watch(`items.${index}.price`) || 0);
                                                const discount = Number(watch(`items.${index}.discount_pct`) || 0);
                                                const gst = Number(watch(`items.${index}.gst_pct`) || 0);

                                                const gross = qty * price;
                                                const taxable = gross - (gross * discount) / 100;
                                                const total = taxable + (taxable * gst) / 100;

                                                return `₹${total.toLocaleString("en-IN", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}`;
                                            })()}
                                        </td>

                                        {/* Remove Action */}
                                        <td className="py-3.5 px-6 text-center">
                                            <button
                                                type="button"
                                                disabled={fields.length === 1}
                                                onClick={() => remove(index)}
                                                className="p-2 bg-[#111C33] hover:bg-rose-950/40 text-rose-500 border border-[#2E5BFF]/30 hover:border-rose-500/50 disabled:opacity-30 rounded-[10px] cursor-pointer transition flex items-center justify-center mx-auto"
                                            >
                                                <FaTrash className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Extra Details & Final pricing calculations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Extra details (transportation, notes, terms) */}
                    <div className="bg-[#16223B] border border-[rgba(79,70,229,0.2)] rounded-2xl p-6 lg:col-span-2 space-y-4 shadow-md">
                        <h3 className="text-xs font-bold text-white border-b border-[rgba(79,70,229,0.2)] pb-2.5 uppercase tracking-widest">
                            Additional Dispatch Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Notes / Description</label>
                                <textarea
                                    rows="2"
                                    placeholder="Internal memo or payment request details..."
                                    className={textareaClass}
                                    {...register("notes")}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Terms & Conditions</label>
                                <textarea
                                    rows="2"
                                    placeholder="Terms of returns, delivery policies..."
                                    className={textareaClass}
                                    {...register("terms")}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Transport / Transporter Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. DTDC, Gati, Self"
                                    className={inputClass}
                                    {...register("transport_name")}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Vehicle Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g. UP14TT1198"
                                    className={inputClass}
                                    {...register("vehicle_number")}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>E-Way Bill Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 401766817912"
                                    className={inputClass}
                                    {...register("eway_bill_no")}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Delivery Date</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    {...register("delivery_date")}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Shipping Address</label>
                                <input
                                    type="text"
                                    placeholder="Shipping / delivery address"
                                    className={inputClass}
                                    {...register("shipping_address")}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Shipping City / Pincode</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Delhi, Delhi-110059"
                                    className={inputClass}
                                    {...register("shipping_city")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing summary widget */}
                    <div className="bg-[#16223B] border border-[rgba(79,70,229,0.2)] rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-6">
                        <h3 className="text-xs font-bold text-white border-b border-[rgba(79,70,229,0.2)] pb-2.5 uppercase tracking-widest">
                            Billing Summary
                        </h3>

                        <div className="space-y-3 text-xs font-semibold text-[#A5B4D4]">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="font-bold text-white">₹{(watch("subtotal") || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Discount:</span>
                                <span className="text-rose-500 font-bold">-₹{(watch("discount_total") || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {/* GST details breakdown */}
                            {watch("cgst_total") > 0 && (
                                <div className="flex justify-between text-slate-400">
                                    <span>CGST:</span>
                                    <span>₹{(watch("cgst_total") || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {watch("sgst_total") > 0 && (
                                <div className="flex justify-between text-slate-400 border-b border-[rgba(79,70,229,0.2)] pb-2">
                                    <span>SGST:</span>
                                    <span>₹{(watch("sgst_total") || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {watch("igst_total") > 0 && (
                                <div className="flex justify-between text-slate-400 border-b border-[rgba(79,70,229,0.2)] pb-2">
                                    <span>IGST:</span>
                                    <span>₹{(watch("igst_total") || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span>Round Off:</span>
                                <span className="text-slate-400 font-bold">₹{(watch("round_off") || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between border-b border-[rgba(79,70,229,0.2)] pb-2 pt-2 text-sm">
                                <span className="font-bold text-white">Grand Total:</span>
                                <span className="font-extrabold text-[#2E5BFF] text-base">₹{(watch("grand_total") || 0).toLocaleString('en-IN')}</span>
                            </div>

                            {/* Received Cash details */}
                            <div className="pt-2 grid grid-cols-2 gap-4 items-center">
                                <div>
                                    <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1">Received (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full rounded-[10px] border border-[#2E5BFF] px-2 py-1.5 text-xs text-right outline-none bg-[#111C33] text-white font-bold"
                                        {...register("received_amount", { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1">Balance Due</span>
                                    <span className="font-extrabold text-sm text-white">
                                        ₹{(watch("balance_amount") || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Row buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-[rgba(79,70,229,0.2)]">
                    <button
                        type="button"
                        onClick={() => navigate("/invoices")}
                        className={secondaryBtnClass}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={() => reset()}
                        className={secondaryBtnClass}
                    >
                        <FaUndo className="h-3 w-3" />
                        Reset
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit((data) => onSubmit(data, false))}
                        className={primaryBtnClass}
                    >
                        <FaSave className="h-3.5 w-3.5" />
                        {isEditMode ? "Update Invoice" : "Save Invoice"}
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit((data) => onSubmit(data, true))}
                        className="flex items-center justify-center gap-2 py-2.5 px-5 bg-teal-600 hover:bg-teal-500 text-white rounded-[10px] text-xs font-bold cursor-pointer transition select-none h-10 shadow-md"
                    >
                        <FaPrint className="h-3.5 w-3.5" />
                        Save & Print
                    </button>
                </div>

            </form>
        </div>
    );
};

export default CreateInvoice;
