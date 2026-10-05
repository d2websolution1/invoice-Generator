import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getInvoice } from "../../services/invoiceService";
import { getCompany } from "../../services/companyService";
import { FaPrint, FaArrowLeft, FaDownload, FaBuilding } from "react-icons/fa";
import QRCode from "qrcode";
import directorStampSignature from "../../assets/director_stamp_signature.png";

/**
 * InvoicePreview page component.
 * Produces an exact replica of the user's GST Tax Invoice PDF format.
 * Features:
 *  - Exact 2-page A4 layout matching the provided PDF sample
 *  - Page 1: Header, Company Box, Bill To / Ship To / Invoice / Transport grids, Items table, Tax summary, Calculations, Description, Terms & Conditions
 *  - Page 2: Header, Company Box, Bank Details, Authorized Signatory / Stamp, e-Invoice QR & IRN, Scissors Cut-line, Acknowledgement Slip
 *  - Direct "Download PDF" (html2canvas + jsPDF, one page per .pdf-page div) & "Print Invoice" (window.print)
 */
const InvoicePreview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const shouldPrint = searchParams.get("print") === "true";

    const [invoice, setInvoice] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrDataUrl, setQrDataUrl] = useState("");

    const printContainerRef = useRef(null);

    useEffect(() => {
        const loadInvoiceData = async () => {
            setLoading(true);
            try {
                const compRes = await getCompany();
                let compData = null;
                if (compRes.success && compRes.data?.length > 0) {
                    compData = compRes.data[0];
                    setCompany(compData);
                }

                const invRes = await getInvoice(id);
                if (invRes.success && invRes.data) {
                    const invData = invRes.data;

                    if (typeof invData.items === "string") {
                        try {
                            invData.items = JSON.parse(invData.items);
                        } catch {
                            invData.items = [];
                        }
                    }
                    setInvoice(invData);

                    // Generate QR Code for e-Invoice
                    const irnText = invData.irn || `IRN:${invData.invoice_number}-${Date.now()}-KAMAKHYA-GSTIN-09AAKCK1604P1Z5`;
                    const qrUrl = await QRCode.toDataURL(irnText, {
                        width: 140,
                        margin: 1,
                        color: { dark: "#000000", light: "#ffffff" }
                    });
                    setQrDataUrl(qrUrl);
                } else {
                    toast.error(invRes.message || "Failed to load invoice");
                    navigate("/invoices");
                }
            } catch (error) {
                console.error("Error loading invoice preview:", error);
                toast.error("Failed to load invoice preview details");
            } finally {
                setLoading(false);
            }
        };

        loadInvoiceData();
    }, [id, navigate]);

    // Handle auto-print if requested via query param
    useEffect(() => {
        if (!loading && invoice && shouldPrint) {
            const previousTitle = document.title;
            document.title = `Invoice_${invoice?.invoice_number || "KW-26-27"}`;
            const timer = setTimeout(() => {
                window.print();
                setTimeout(() => {
                    document.title = previousTitle;
                }, 1000);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [loading, invoice, shouldPrint]);

    // Helper functions
    const getImageUrl = (path) => {
        if (!path) return "";
        if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
            return path;
        }
        const cleanPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
        const baseUrl = import.meta.env.VITE_SERVER_URL || "https://invoice-generator-backend-sa53.onrender.com";
        return `${baseUrl}/${cleanPath}`;
    };

    const formatNumber = (val, decimals = 3) => {
        const num = parseFloat(val || 0);
        return new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    };

    const formatRs = (val, decimals = 3) => {
        return `Rs ${formatNumber(val, decimals)}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const numberToWords = (num) => {
        if (num === null || num === undefined || isNaN(num)) return "";
        let amount = Math.round(parseFloat(num));
        if (amount === 0) return "Zero Rupees only";

        const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
        const doubleDigits = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const tensMultiple = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

        const convertToWords = (n) => {
            let str = "";
            if (n >= 100) {
                str += singleDigits[Math.floor(n / 100)] + " Hundred ";
                n %= 100;
            }
            if (n >= 10 && n < 20) {
                str += doubleDigits[n - 10] + " ";
            } else if (n >= 20) {
                str += tensMultiple[Math.floor(n / 10)] + " " + singleDigits[n % 10] + " ";
            } else if (n > 0) {
                str += singleDigits[n] + " ";
            }
            return str;
        };

        let result = "";
        if (amount >= 10000000) {
            result += convertToWords(Math.floor(amount / 10000000)) + "Crore ";
            amount %= 10000000;
        }
        if (amount >= 100000) {
            result += convertToWords(Math.floor(amount / 100000)) + "Lakh ";
            amount %= 100000;
        }
        if (amount >= 1000) {
            result += convertToWords(Math.floor(amount / 1000)) + "Thousand ";
            amount %= 1000;
        }
        if (amount > 0) {
            result += convertToWords(amount);
        }

        result = result.trim();
        return result ? `${result} Rupees only` : "";
    };

    /**
     * FIX: after multiple attempts, html2canvas (with or without
     * foreignObjectRendering) could not reliably reproduce this page's
     * Tailwind layout (divide-y / divide-x / space-y / nested flex):
     *  - The default renderer misjudged flexbox heights, causing borders
     *    to overlap text ("ghosting" lines through content).
     *  - foreignObjectRendering avoided that but produced fully blank
     *    pages (Chrome silently taints the canvas in this mode when the
     *    page has certain CSS/asset combinations, with no thrown error).
     *
     * The only rendering path that is GUARANTEED to match the on-screen
     * preview pixel-for-pixel is the browser's own print pipeline, since
     * that's the exact same engine used for "Print Invoice" (which
     * already works correctly). So "Download PDF" now opens the native
     * print dialog too — the user just picks "Save as PDF" as the
     * destination there instead of a physical printer.
     */
    const handleDownloadPdf = () => {
        if (!invoice) return;
        const previousTitle = document.title;
        // Browsers use document.title as the default filename in the
        // print dialog's "Save as PDF" flow.
        document.title = `Invoice_${invoice?.invoice_number || "KW-26-27"}`;
        window.print();
        setTimeout(() => {
            document.title = previousTitle;
        }, 1000);
    };

    if (loading) {
        return (
            <div className="flex h-72 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
                <span className="ml-3 font-semibold text-slate-600 text-sm">Loading invoice...</span>
            </div>
        );
    }

    if (!invoice) return null;

    // Derived variables and fallbacks matching the PDF sample
    const isIntraState = company?.state && invoice.customer_state &&
        company.state.toLowerCase().trim() === invoice.customer_state.toLowerCase().trim();

    // Default company data matching the exact PDF sample if not filled
    const activeCompany = {
        company_name: company?.company_name || "KAMAKHYA WORLDWIDE TECHNOLOGY PRIVATE LIMITED",
        address: company?.address || "BUILDING NO 1, METRO PILLAR NO 526 DELHI MEERUT ROAD, Sewa Nagar, Ghaziabad, Ghaziabad, Uttar Pradesh, 201001",
        address_line2: company ? (company?.address_line2 || "") : "PLOT NO -12, KHASRA NO 11, Mainapur, Mohiddinpur Industrial Area, Muhiuddinpur Hisauli, Ghaziabad, Uttar Pradesh, 201206",
        phone: company?.phone || "7410074397",
        email: company?.email || "SALES@TEJASEV.COM",
        gst_number: company?.gst_number || "09AAKCK1604P1Z5",
        state: company?.state || "09-Uttar Pradesh",
        bank_name: company?.bank_name || "HDFC BANK, KAUSHAMBI",
        account_number: company?.account_number || "50200114432341",
        ifsc_code: company?.ifsc_code || "HDFC0002653",
        account_holder: company?.account_holder || "KAMAKHYA WORLDWIDE TECHINOLOGY PRIVATE LIMITED",
        logo: company?.logo,
        signature: company?.signature,
        stamp: company?.stamp,
        qr_code: company?.qr_code
    };

    // Calculate items totals
    const itemsList = invoice.items && invoice.items.length > 0 ? invoice.items : [
        {
            item_name: "TEJAS EON (DOUBLE LIGHT) 12-10",
            description: "ELECTRIC SCOOTY , GRY",
            hsn_sac: "87116020",
            qty: 2,
            unit: "Nos",
            price: 21428.571,
            gst_pct: 5,
            gst_amount: 2142.857,
            total: 45000
        },
        {
            item_name: "TEJAS SAHARA (3-WHEEL HANDICAPPED)",
            description: "ELECTRIC SCOOTY",
            hsn_sac: "87116020",
            qty: 1,
            unit: "Nos",
            price: 41904.762,
            gst_pct: 5,
            gst_amount: 2095.238,
            total: 44000
        }
    ];

    const totalQty = itemsList.reduce((acc, it) => acc + parseFloat(it.qty !== undefined ? it.qty : (it.quantity || 0)), 0);
    const totalGst = itemsList.reduce((acc, it) => {
        const qty = parseFloat(it.qty !== undefined ? it.qty : (it.quantity || 0));
        const price = parseFloat(it.price !== undefined ? it.price : (it.unit_price || 0));
        const gst_pct = parseFloat(it.gst_pct !== undefined ? it.gst_pct : (it.gst_percentage || 0));
        const taxable = qty * price;
        const gstAmt = it.gst_amount !== undefined ? parseFloat(it.gst_amount) : (taxable * (gst_pct / 100));
        return acc + gstAmt;
    }, 0);
    const totalAmount = itemsList.reduce((acc, it) => acc + parseFloat(it.total !== undefined ? it.total : (it.amount || 0)), 0);

    // Group items by HSN for Tax Summary
    const taxSummaryMap = {};
    itemsList.forEach((it) => {
        const hsn = it.hsn_sac || it.sku || "87116020";
        const qty = parseFloat(it.qty !== undefined ? it.qty : (it.quantity || 0));
        const price = parseFloat(it.price !== undefined ? it.price : (it.unit_price || 0));
        const gst_pct = parseFloat(it.gst_pct !== undefined ? it.gst_pct : (it.gst_percentage || 0));
        const taxable = qty * price;
        const gstAmt = it.gst_amount !== undefined ? parseFloat(it.gst_amount) : (taxable * (gst_pct / 100));

        if (!taxSummaryMap[hsn]) {
            taxSummaryMap[hsn] = { hsn, taxableAmount: 0, gstRate: gst_pct, gstAmount: 0 };
        }
        taxSummaryMap[hsn].taxableAmount += taxable;
        taxSummaryMap[hsn].gstAmount += gstAmt;
    });

    const taxSummaryRows = Object.values(taxSummaryMap);
    const totalTaxable = taxSummaryRows.reduce((sum, r) => sum + r.taxableAmount, 0);
    const totalTax = taxSummaryRows.reduce((sum, r) => sum + r.gstAmount, 0);

    const receivedAmount = parseFloat(invoice.received_amount || totalAmount || 0);
    const grandTotal = parseFloat(invoice.grand_total || totalAmount || 0);
    const balance = grandTotal - receivedAmount;
    const previousBalance = parseFloat(invoice.previous_balance || 0);
    const currentBalance = balance + previousBalance;

    const defaultTerms = [
        "1. Goods once sold will not be taken back, only warranty and service may be Provided by the Tejas as per terms.",
        "2. Payment 100% adavance with P.O., in case of short payment with P.O., the rest amount will be payable immediately on receipt of the invoice.",
        "3. Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.",
        "4. No cash payment will be settled against this invoice. Only onlinepayment i.e. UPI/NEFT/RTGS/IMPS/DD/Cheque is acceptable.",
        "5 . In case of Cheque payment, the dishonour of chaque charges shall be Rs.2000/- per cheque alongwith 24% PA interest from date of the invoice."
    ];

    // Reusable Company Header component
    const renderCompanyHeader = () => (
        <div className="company-header-box border-[2px] border-black p-4 mt-6 flex items-center justify-between text-black bg-white">
            {/* Logo Section */}
            <div className="flex-shrink-0 w-24 flex flex-col items-center justify-center">
                {activeCompany.logo ? (
                    <img
                        src={getImageUrl(activeCompany.logo)}
                        alt="Logo"
                        crossOrigin="anonymous"
                        className="max-h-10 max-w-full object-contain"
                    />
                ) : (
                    <div className="flex flex-col items-center  ">
                        <div className="text-[#ea580c] font-black text-lg tracking-tighter italic flex items-center ">
                            <span>T</span><span className="text-[#dc2626]">e</span><span className="text-[#2563eb]">j</span><span className="text-[#16a34a]">a</span><span className="text-[#0284c7]">s</span>
                        </div>
                        <div className="text-[6px] font-bold tracking-wider text-black mt-0 uppercase">
                            INNOVATION FOR NEXT GENERATION
                        </div>
                    </div>
                )}
            </div>

            {/* Company Info Section */}
            <div className="flex-grow pl-2 text-center mb-2">
                <div className="font-extrabold text-[16px] uppercase tracking-tight text-black leading-snug mb-1">
                    {activeCompany.company_name}
                </div>
                <div className="text-[10.5px] text-black font-normal mt-0 leading-tight mb-1" >
                    {activeCompany.address}
                </div>
                {activeCompany.address_line2 && (
                    <div className="text-[10.5px] text-black font-normal mt-0 leading-tight">
                        {activeCompany.address_line2}
                    </div>
                )}
                <div className="flex justify-between items-center text-[10.5px] font-semibold text-black mt-0 px-1 ">
                    <div>Phone: <span className="font-bold">{activeCompany.phone}</span></div>
                    <div>Email: <span className="font-bold uppercase">{activeCompany.email}</span></div>
                </div>
                <div className="flex justify-between items-center text-[10.5px] font-semibold text-black mt-0 px-1">
                    <div>GSTIN: <span className="font-bold">{activeCompany.gst_number}</span></div>
                    <div>State: <span className="font-bold">{activeCompany.state}</span></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="invoice-preview-root min-h-screen bg-slate-100 dark:bg-slate-950 py-6 px-2 sm:px-4 font-sans antialiased text-black">
            {/* Print & PDF Layout Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0mm;
                    }
                    html, body {
                        width: 210mm !important;
                        height: auto !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Reset ALL wrapping containers so they do not push content down or introduce extra pages */
                    #root,
                    #root > div,
                    main,
                    .invoice-preview-root,
                    .pdf-preview-wrapper {
                        margin: 0 !important;
                        padding: 0 !important;
                        min-height: 0 !important;
                        height: auto !important;
                        width: 210mm !important;
                        max-width: 210mm !important;
                        display: block !important;
                        position: static !important;
                        overflow: visible !important;
                        background: #ffffff !important;
                        border: none !important;
                        box-shadow: none !important;
                        transform: none !important;
                        gap: 0 !important;
                    }

                    /* Hide all UI elements from print */
                    .no-print, header, nav, aside, button, .Toastify, .pdf-page-break {
                        display: none !important;
                        height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Strict A4 page definition:
                       295.5mm ensures Chrome's subpixel rasterizer never exceeds the
                       297mm physical page boundary and never produces blank overflow pages.
                    */
                    .pdf-page {
                        display: flex !important;
                        flex-direction: column !important;
                        width: 210mm !important;
                        max-width: 210mm !important;
                        height: 295.5mm !important;
                        max-height: 295.5mm !important;
                        min-height: 295.5mm !important;
                        padding: 6mm 8mm !important;
                        margin: 0 auto !important;
                        box-sizing: border-box !important;
                        border: none !important;
                        box-shadow: none !important;
                        overflow: hidden !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        position: relative !important;
                    }

                    /* Page 1 breaks cleanly to Page 2 */
                    .pdf-page-1 {
                        page-break-after: always !important;
                        break-after: page !important;
                        page-break-before: auto !important;
                        break-before: auto !important;
                        justify-content: space-between !important;
                    }

                    /* Page 2 is the final page and avoids any trailing break */
                    .pdf-page-2,
                    .pdf-page:last-child {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        page-break-before: auto !important;
                        break-before: auto !important;
                    }
                }

                .pdf-page {
                    width: 210mm;
                    height: 297mm;
                    min-height: 297mm;
                    max-height: 297mm;
                    padding: 6mm 8mm;
                    margin: 0 auto;
                    background: #ffffff;
                    box-sizing: border-box;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #000000;
                    line-height: 1.2;
                    letter-spacing: normal;
                    overflow: hidden;
                    page-break-inside: avoid;
                    break-inside: avoid;
                    position: relative;
                }

                .pdf-page, .pdf-page * {
                    letter-spacing: normal !important;
                }
                .pdf-page * {
                    line-height: 1.2 !important;
                }

                .pdf-page-break {
                    height: 0;
                    page-break-before: always;
                    break-before: page;
                }

                .pdf-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1.2px solid #000000;
                }
                .pdf-table th, .pdf-table td {
                    border: 1.2px solid #000000;
                    padding: 4px 6px;
                }

                /* FIX: force pure black borders everywhere inside the invoice */
                .pdf-page,
                .pdf-page * {
                    border-color: #000000 !important;
                }

                .pdf-table th, .pdf-table td {
                    border-color: #000000 !important;
                }

                .divide-black > :not([hidden]) ~ :not([hidden]) {
                    border-color: #000000 !important;
                }

                /* Light grey header bar style matching original sample invoice */
                .pdf-header-bar {
                    background-color: #f4f4f4 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                .pdf-page .flex-1 {
                    min-height: 0 !important;
                }
                `
            }} />

            {/* Action Bar (Download PDF & Print buttons) */}
            <div className="max-w-[210mm] mx-auto mb-5 no-print flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/invoices")}
                        className="p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Back to Invoices"
                    >
                        <FaArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            Invoice {invoice.invoice_number}
                        </h2>
                        <p className="text-[11px] text-slate-500">Official GST Format (Exact 2-Page PDF Replica)</p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleDownloadPdf}
                        className="flex items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
                        title='Opens the print dialog — choose "Save as PDF" as the destination'
                    >
                        <FaDownload className="h-3.5 w-3.5" />
                        <span>Download PDF</span>
                    </button>

                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
                    >
                        <FaPrint className="h-3.5 w-3.5" />
                        <span>Print Invoice</span>
                    </button>
                </div>
            </div>

            {/* Printable & Downloadable Container */}
            <div ref={printContainerRef} className="pdf-preview-wrapper flex flex-col items-center gap-8">

                {/* ========================================================================= */}
                {/* PAGE 1: Tax Invoice, Details, Items Table, Tax Summary, Calculations, T&C */}
                {/* ========================================================================= */}
                <div className="pdf-page pdf-page-1 shadow-lg flex flex-col justify-between text-[10.5px]">
                    {/* TOP SECTION - Heading, Header, Details Grid */}
                    <div>
                        {/* Top Heading - Arrow wali jagah ka space sirf 5px */}
                        <div className="flex justify-between items-end mb-[5px]">
                            <div className="w-1/3"></div>
                            <div className="w-1/3 text-center font-bold text-[20px] text-black tracking-normal leading-none">
                                Tax Invoice
                            </div>
                            <div className="w-1/3 text-right text-[10px] font-semibold text-black uppercase tracking-wider">
                                ORIGINAL FOR RECIPIENT
                            </div>
                        </div>

                        {/* Company Header Box */}
                        {renderCompanyHeader()}

                        {/* Two-Column Details Grid - Top aur bottom se space */}
                        <div className="border-[1.2px] border-black text-[10px] mt-[16px]">
                            {/* Row 1 Header Bar: Bill To & Invoice Details */}
                            <div className="grid grid-cols-2 divide-x divide-black border-b border-black bg-[#f4f4f4] pdf-header-bar font-bold text-[10.5px]">
                                <div className="px-1.5 py-0.5 text-black">Bill To:</div>
                                <div className="px-1.5 py-0.5 text-black">Invoice Details:</div>
                            </div>

                            {/* Row 1: Bill To & Invoice Details Content */}
                            <div className="grid grid-cols-2 divide-x divide-black border-b border-black">
                                {/* Bill To */}
                                <div className="p-1.5 flex flex-col justify-between space-y-0.5">
                                    <div className="font-bold text-[12px] text-black uppercase">
                                        {invoice.company_name ||
                                            invoice.customer_name ||
                                            "DOMARP MOTORS PRIVATE LIMITED"}
                                    </div>

                                    <div className="text-black text-[11px] leading-relaxed">
                                        {invoice.customer_address ||
                                            "FF A-25 Block A Veer Bazar Road New Delhi"}
                                    </div>

                                    <div className="text-black text-[11px] leading-relaxed">
                                        {invoice.customer_city_pincode ||
                                            "New Delhi, Delhi-110059"}
                                    </div>

                                    <div className="text-black text-[11px] leading-relaxed">
                                        {invoice.customer_country || "India"}
                                    </div>

                                    <div className="flex justify-between text-black font-semibold text-[11px]">
                                        <div>
                                            GSTIN:{" "}
                                            <span className="font-bold">
                                                {invoice.customer_gstin || "07AAMCD3814G1ZP"}
                                            </span>
                                        </div>

                                        <div>
                                            State:{" "}
                                            <span className="font-bold">
                                                {invoice.customer_state || "07-Delhi"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-black font-bold uppercase text-[11px]">
                                        CLIENT MANAGE BY -:{" "}
                                        <span className="font-bold">
                                            {invoice.party_name || "DEEPAK"}
                                        </span>
                                    </div> 
                                </div>

                                {/* Invoice Details */}
                                <div className="p-1.5 space-y-0.5">
                                    <div className="flex justify-between">
                                        <span className="text-black">Invoice No.:</span>
                                        <span className="font-bold text-black">{invoice.invoice_number || "KW/26-27/173"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-black">Date:</span>
                                        <span className="font-bold text-black">{formatDate(invoice.invoice_date) || "31/08/2026"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-black">E-way Bill number:</span>
                                        <span className="font-bold text-black">{invoice.eway_bill_no || "401766817912"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-black">Place Of Supply:</span>
                                        <span className="font-bold text-black">{invoice.customer_state || "07-Delhi"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2 Header Bar: Ship To & Transportation Details */}
                            <div className="grid grid-cols-2 divide-x divide-black border-b border-black bg-[#f4f4f4] pdf-header-bar font-bold text-[10.5px]">
                                <div className="px-1.5 py-0.5 text-black">Ship To:</div>
                                <div className="px-1.5 py-0.5 text-black">Transportation Details:</div>
                            </div>

                            {/* Row 2: Ship To & Transportation Details Content */}
                            <div className="grid grid-cols-2 divide-x divide-black">
                                {/* Ship To */}
                                <div className="p-1.5 space-y-0.5">
                                    <div className="text-black leading-tight">
                                        {invoice.shipping_address || invoice.customer_address || "A-25, FF, Rama Park, swami nityanand marg, uttam nagar"}
                                    </div>
                                    <div className="text-black leading-tight">
                                        {invoice.shipping_city || "Delhi, Delhi-110059"}
                                    </div>
                                    <div className="text-black leading-tight">India</div>
                                </div>

                                {/* Transportation Details */}
                                <div className="p-1.5 space-y-0.5">
                                    <div className="flex justify-between">
                                        <span className="text-black">Transport Name:</span>
                                        <span className="font-bold text-black">{invoice.transport_name || ""}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-black">Vehicle Number:</span>
                                        <span className="font-bold text-black">{invoice.vehicle_number || "UP14TT1198"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-black">Delivery Date:</span>
                                        <span className="font-bold text-black">{invoice.delivery_date ? formatDate(invoice.delivery_date) : ""}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MIDDLE SECTION - Items Table + Tax Summary */}
                    <div className="flex-1 flex flex-col mt-2 space-y-1.5 mt-6 min-h-0 overflow-hidden">
                        {/* Items Table - Top aur bottom se space */}
                        <table className="pdf-table text-[10px] p-1">
                            <thead className="bg-[#f4f4f4] pdf-header-bar">
                                <tr className="font-bold text-black text-center p-1 ">
                                    <th className="w-5 py-1.5">#</th>
                                    <th className="text-left py-1.5 px-1">Item name</th>
                                    <th className="w-16 py-1.5">HSN/ SAC</th>
                                    <th className="w-12 py-1.5">Quantity</th>
                                    <th className="w-8 py-1.5">Unit</th>
                                    <th className="w-20 py-1.5 text-right px-1">Price/ Unit(Rs)</th>
                                    <th className="w-20 py-1.5 text-right px-1">GST(Rs)</th>
                                    <th className="w-22 py-1.5 text-right px-1">Amount(Rs)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsList.map((item, idx) => {
                                    const qty = parseFloat(item.qty !== undefined ? item.qty : (item.quantity || 0));
                                    const price = parseFloat(item.price !== undefined ? item.price : (item.unit_price || 0));
                                    const gst_pct = parseFloat(item.gst_pct !== undefined ? item.gst_pct : (item.gst_percentage || 0));
                                    const taxable = qty * price;
                                    const gstAmt = item.gst_amount !== undefined ? parseFloat(item.gst_amount) : (taxable * (gst_pct / 100));
                                    const lineTotal = item.total !== undefined ? parseFloat(item.total) : (item.amount !== undefined ? parseFloat(item.amount) : (taxable + gstAmt));
                                    const hsn = item.hsn_sac || item.sku || "87116020";

                                    return (
                                        <tr key={idx} className="align-top border-b border-black">
                                            <td className="text-center py-1.5 font-medium">{idx + 1}</td>
                                            <td className="py-1.5 px-1">
                                                <div className="font-bold uppercase text-black leading-tight">{item.item_name}</div>
                                                {item.description && (
                                                    <div className="text-[9px] text-black mt-0 uppercase leading-tight">
                                                        ({item.description})
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-center py-1.5 font-medium">{hsn}</td>
                                            <td className="text-center py-1.5 font-medium">{qty}</td>
                                            <td className="text-center py-1.5 font-medium">{item.unit || "Nos"}</td>
                                            <td className="text-right py-1.5 px-1 font-medium">{formatRs(price)}</td>
                                            <td className="text-right py-1.5 px-1 font-medium">
                                                <div>{formatRs(gstAmt)}</div>
                                                <div className="text-[9px] text-black">({gst_pct}%)</div>
                                            </td>
                                            <td className="text-right py-1.5 px-1 font-medium">{formatRs(lineTotal)}</td>
                                        </tr>
                                    );
                                })}

                                {/* Table Total Row */}
                                <tr className="font-bold text-black bg-[#f4f4f4] pdf-header-bar">
                                    <td className="text-center"></td>
                                    <td className="py-1.5 px-1">Total</td>
                                    <td className="text-center"></td>
                                    <td className="text-center py-1.5">{totalQty}</td>
                                    <td className="text-center"></td>
                                    <td className="text-right"></td>
                                    <td className="text-right py-1.5 px-1">{formatRs(totalGst)}</td>
                                    <td className="text-right py-1.5 px-1">{formatRs(totalAmount)}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Tax Summary & Calculations Row */}
                        <div className="grid grid-cols-12 gap-1.5 mt-5">
                            {/* Left Side: Tax Summary Table & Payment Mode (Cols 7) */}
                            <div className="col-span-7 space-y-1">
                                <div>
                                    <div className="bg-[#f4f4f4] pdf-header-bar font-bold text-[10px] text-black px-1.5 py-0.5 border-[1.2px] border-black border-b-0">
                                        Tax Summary:
                                    </div>
                                    <table className="pdf-table text-[9.5px]">
                                        <thead className="bg-[#f4f4f4] pdf-header-bar">
                                            <tr className="text-center font-bold text-black">
                                                <th className="py-0.5 px-0.5" rowSpan={2}>HSN/ SAC</th>
                                                <th className="py-0.5 px-0.5" rowSpan={2}>Taxable amount (Rs)</th>
                                                <th className="py-0.5 px-0.5" colSpan={2}>{isIntraState ? "CGST + SGST" : "IGST"}</th>
                                                <th className="py-0.5 px-0.5" rowSpan={2}>Total Tax (Rs)</th>
                                            </tr>
                                            <tr className="text-center font-bold text-black">
                                                <th className="py-0.5 px-0.5">Rate (%)</th>
                                                <th className="py-0.5 px-0.5">Amt (Rs)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {taxSummaryRows.map((row, idx) => (
                                                <tr key={idx} className="text-center">
                                                    <td className="py-0.5 px-0.5 font-medium">{row.hsn}</td>
                                                    <td className="py-0.5 px-0.5 text-right font-medium">{formatNumber(row.taxableAmount)}</td>
                                                    <td className="py-0.5 px-0.5 font-medium">{row.gstRate}</td>
                                                    <td className="py-0.5 px-0.5 text-right font-medium">{formatNumber(row.gstAmount)}</td>
                                                    <td className="py-0.5 px-0.5 text-right font-medium">{formatNumber(row.gstAmount)}</td>
                                                </tr>
                                            ))}
                                            <tr className="font-bold text-black text-center bg-[#f4f4f4] pdf-header-bar">
                                                <td className="py-0.5 px-0.5">TOTAL</td>
                                                <td className="py-0.5 px-0.5 text-right">{formatNumber(totalTaxable)}</td>
                                                <td className="py-0.5 px-0.5"></td>
                                                <td className="py-0.5 px-0.5 text-right">{formatNumber(totalTax)}</td>
                                                <td className="py-0.5 px-0.5 text-right">{formatNumber(totalTax)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Payment Mode */}
                                <div className="border-[1.2px] border-black text-[10px]">
                                    <div className="bg-[#f4f4f4] pdf-header-bar font-bold text-black px-1.5 py-0.5 border-b border-black">
                                        Payment Mode:
                                    </div>
                                    <div className="p-1 px-1.5 text-black font-semibold uppercase">
                                        {invoice.payment_mode || activeCompany.company_name}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Totals & Balance Breakdown (Cols 5) */}
                            <div className="col-span-5">
                                <div className="border-[1.2px] border-black divide-y divide-black text-[10px]">
                                    <div className="flex justify-between p-1 px-1.5">
                                        <span className="font-semibold text-black">Sub Total :</span>
                                        <span className="font-bold text-black">{formatRs(grandTotal)}</span>
                                    </div>
                                    <div className="flex justify-between p-1 px-1.5 font-bold text-[10.5px] text-black">
                                        <span>Total :</span>
                                        <span>{formatRs(grandTotal)}</span>
                                    </div>
                                    <div className="p-1 px-1.5">
                                        <div className="font-bold text-black text-[9.5px]">Invoice Amount in Words:</div>
                                        <div className="text-black font-medium text-[9.5px] leading-tight">
                                            {numberToWords(grandTotal)}
                                        </div>
                                    </div>
                                    <div className="flex justify-between p-1 px-1.5">
                                        <span className="font-semibold text-black">Received :</span>
                                        <span className="font-bold text-black">{formatRs(receivedAmount)}</span>
                                    </div>
                                    <div className="flex justify-between p-1 px-1.5">
                                        <span className="font-semibold text-black">Balance :</span>
                                        <span className="font-bold text-black">{formatRs(balance)}</span>
                                    </div>
                                    <div className="flex justify-between p-1 px-1.5">
                                        <span className="font-semibold text-black">Previous Balance:</span>
                                        <span className="font-bold text-black">{formatRs(previousBalance)}</span>
                                    </div>
                                    <div className="flex justify-between p-1 px-1.5">
                                        <span className="font-semibold text-black">Current Balance :</span>
                                        <span className="font-bold text-black">{formatRs(currentBalance)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM SECTION - Description & Terms & Conditions - Top aur bottom se space */}
                    <div className="border-[1.2px] border-black text-[9.5px] mt-10">
                        <div className="grid grid-cols-2 divide-x divide-black border-b border-black bg-[#f4f4f4] pdf-header-bar font-bold text-[10px]">
                            <div className="px-1.5 py-0.5 text-black">Description:</div>
                            <div className="px-1.5 py-0.5 text-black">Terms & Conditions:</div>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-black">
                            {/* Description */}
                            <div className="p-1.5 space-y-0.5">
                                <div className="text-black font-medium uppercase leading-tight">
                                    {invoice.notes ? (
                                        <div className="whitespace-pre-line">{invoice.notes}</div>
                                    ) : (
                                        <>
                                            <div>HANICAP</div>
                                            <div>CONTROLLER NO : 3FB67D362604</div>
                                            <div>CHASIS NO : EVSR205F4873</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Terms & Conditions */}
                            <div className="p-1.5 space-y-0.5 text-black">
                                {defaultTerms.map((term, i) => (
                                    <div key={i} className="leading-tight text-[8.5px]">{term}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>



                {/* ========================================================================= */}
                {/* PAGE 2: Header, Bank Details, Signature, e-Invoice, Acknowledgement Slip */}
                {/* ========================================================================= */}
                <div className="pdf-page pdf-page-2 shadow-lg flex flex-col text-[10.5px]">
                    <div className="space-y-2.5">
                        {/* Top Heading - Arrow wali jagah ka space sirf 5px */}
                        <div className="flex justify-between items-end mb-[5px]">
                            <div className="w-1/3"></div>
                            <div className="w-1/3 text-center font-bold text-[20px] text-black tracking-normal leading-none">
                                Tax Invoice
                            </div>
                            <div className="w-1/3 text-right text-[10px] font-semibold text-black uppercase tracking-wider">
                                ORIGINAL FOR RECIPIENT
                            </div>
                        </div>

                        {/* Company Header Box */}
                        {renderCompanyHeader()}

                        {/* Bank Details & Authorized Signatory Box */}
                        <div className="border-[1.2px] border-black text-[10px]">
                            <div className="grid grid-cols-2 divide-x divide-black border-b border-black bg-[#f4f4f4] pdf-header-bar font-bold">
                                <div className="px-1.5 py-0.5 text-[10.5px] text-black">Bank Details:</div>
                                <div className="px-1.5 py-0.5 text-[10px] text-black uppercase">
                                    For {activeCompany.company_name}:
                                </div>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-black">
                                {/* Bank Details */}
                                <div className="p-1.5 space-y-0.5">
                                    <div>Name : <span className="font-bold text-black">{activeCompany.bank_name}</span></div>
                                    <div>Account No. : <span className="font-bold text-black">{activeCompany.account_number}</span></div>
                                    <div>IFSC code : <span className="font-bold text-black">{activeCompany.ifsc_code}</span></div>
                                    <div>Account holder's name : <span className="font-bold text-black uppercase">{activeCompany.account_holder}</span></div>
                                </div>

                                {/* Authorized Signatory */}
                                <div className="p-1.5 flex flex-col justify-between items-center text-center min-h-[85px] space-y-1">
                                    <div className="flex-1 flex items-center justify-center">
                                        <img
                                            src={activeCompany.signature ? getImageUrl(activeCompany.signature) : directorStampSignature}
                                            onError={(e) => { e.currentTarget.src = directorStampSignature; }}
                                            alt="Director Stamp & Signature"
                                            crossOrigin="anonymous"
                                            className="h-10 object-contain"
                                        />
                                    </div>
                                    <div className="font-bold text-[10px] text-black">
                                        Director
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* e-Invoice Box */}
                        <div className="border-[1.2px] border-black text-[10px]">
                            <div className="px-1.5 py-0.5 font-bold text-[10.5px] text-black bg-[#f4f4f4] pdf-header-bar border-b border-black">
                                e-Invoice:
                            </div>
                            <div className="p-1.5 flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    {qrDataUrl ? (
                                        <img
                                            src={qrDataUrl}
                                            alt="e-Invoice QR"
                                            className="w-20 h-20 border border-black"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 border border-black flex items-center justify-center text-[9.5px]">QR Code</div>
                                    )}
                                </div>
                                <div className="space-y-1 text-[10px] text-black leading-normal">
                                    <div>
                                        <span className="font-semibold">IRN : </span>
                                        <span className="font-mono text-[9.5px] break-all">
                                            {invoice.irn || "60205026ff220ac2820d129997679d15a5a9e9248f33b57889375a94f7f02477"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-semibold">Ack. No : </span>
                                        <span className="font-mono text-[10px]">{invoice.ack_no || "142621181389192"}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold">Ack. Dt : </span>
                                        <span className="font-medium">{formatDate(invoice.ack_dt || invoice.invoice_date) || "31/08/2026"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scissors Cut-out Line */}
                        <div className="flex items-center text-black text-xs select-none">
                            <span className="mr-1 text-[10px]">✂</span>
                            <div className="flex-grow border-t border-dashed border-black"></div>
                        </div>

                        {/* Acknowledgement Slip */}
                        <div className="text-center font-bold text-[15px] text-black uppercase tracking-wide">
                            Acknowledgement
                        </div>

                        <div className="border-[1.2px] border-black text-[10px]">
                            {/* Company Details Header Bar */}
                            <div className="px-1.5 py-0.5 font-bold text-[10px] text-black bg-[#f4f4f4] pdf-header-bar border-b border-black">
                                Company Details:
                            </div>

                            {/* Company Details Row */}
                            <div className="p-1.5 border-b border-black">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <div className="text-[#ea580c] font-black text-xs italic">
                                            <span>T</span><span className="text-[#dc2626]">e</span><span className="text-[#2563eb]">j</span><span className="text-[#16a34a]">a</span><span className="text-[#0284c7]">s</span>
                                        </div>
                                        <div className="font-bold text-[10px] text-black uppercase">
                                            {activeCompany.company_name}
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-black">
                                        Phone: <span className="font-bold">{activeCompany.phone}</span> | Email: <span className="font-bold uppercase">{activeCompany.email}</span> | GSTIN: <span className="font-bold">{activeCompany.gst_number}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3-Column Header Bar */}
                            <div className="grid grid-cols-3 divide-x divide-black border-b border-black bg-[#f4f4f4] pdf-header-bar font-bold text-[10px]">
                                <div className="px-1.5 py-0.5 text-black">Invoice Details:</div>
                                <div className="px-1.5 py-0.5 text-black">Party Details:</div>
                                <div className="px-1.5 py-0.5 text-black">Receiver's Seal & Sign:</div>
                            </div>

                            {/* 3-Column Content */}
                            <div className="grid grid-cols-3 divide-x divide-black">
                                {/* Invoice Details */}
                                <div className="p-1.5 space-y-0.5">
                                    <div>Invoice No. : <span className="font-bold">{invoice.invoice_number || "KW/26-27/173"}</span></div>
                                    <div>Invoice date : <span className="font-bold">{formatDate(invoice.invoice_date) || "31-08-2026"}</span></div>
                                    <div>Invoice Amount : <span className="font-bold">{formatRs(grandTotal)}</span></div>
                                </div>

                                {/* Party Details */}
                                <div className="p-1.5 space-y-0.5">
                                    <div className="font-bold uppercase text-[10px] text-black">
                                        {invoice.company_name || invoice.customer_name || "DOMARP MOTORS PRIVATE LIMITED"}
                                    </div>
                                    <div className="text-[9.5px] text-black leading-tight uppercase">
                                        {invoice.customer_address || "FF A-25 BLOCK A VEER BAZAR ROAD NEW DELHI NEW DELHI, DELHI-110059 INDIA"}
                                    </div>
                                </div>

                                {/* Receiver's Seal & Sign */}
                                <div className="p-1.5 flex flex-col justify-end min-h-[65px]">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InvoicePreview;