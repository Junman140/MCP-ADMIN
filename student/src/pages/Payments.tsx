import { useEffect, useState } from "react";
import { api } from "../api";
import { CreditCard, Download, AlertCircle, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";

interface FeeConfig {
  id: string;
  feeType: string;
  label: string;
  amount: number;
  serviceFee: number;
}

interface Invoice {
  id: string;
  feeType: string;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  status: string;
  virtualAccountNumber: string;
  virtualAccountBank: string;
  pspProvider: string;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
}

interface PaymentSummary {
  totalInvoices: number;
  completedPayments: number;
  outstandingBalances: Record<string, number>;
  recentPayments: Array<{
    id: string;
    receiptNumber: string;
    amount: number;
    serviceFee: number;
    totalAmount: number;
    feeType: string;
    createdAt: string;
  }>;
}

const STATUS_ICONS: Record<string, React.ComponentType<any>> = {
  AWAITING_PAYMENT: Clock,
  COLLECTED: CheckCircle2,
  REMITTING: RefreshCw,
  REMITTED: CheckCircle2,
  COMPLETE: CheckCircle2,
  FAILED: XCircle,
  EXPIRED: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  AWAITING_PAYMENT: "text-amber-600 bg-amber-50",
  COLLECTED: "text-blue-600 bg-blue-50",
  REMITTING: "text-purple-600 bg-purple-50",
  REMITTED: "text-green-600 bg-green-50",
  COMPLETE: "text-green-700 bg-green-100",
  FAILED: "text-red-600 bg-red-50",
  EXPIRED: "text-gray-600 bg-gray-100",
};

export default function Payments() {
  const [tab, setTab] = useState<"overview" | "invoices" | "new">("overview");
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [feeConfigs, setFeeConfigs] = useState<FeeConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoiceResult, setInvoiceResult] = useState<Invoice | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError("");
    Promise.all([
      api<PaymentSummary>("/payments/student-summary"),
      api<Invoice[]>("/payments/invoices"),
      api<FeeConfig[]>("/payments/fee-configs"),
    ])
      .then(([s, invs, cfgs]) => {
        setSummary(s);
        setInvoices(invs);
        setFeeConfigs(cfgs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const generateInvoice = async (feeType: string) => {
    setLoading(true);
    setError("");
    try {
      const inv = await api<Invoice>("/payments/invoices", {
        method: "POST",
        body: JSON.stringify({ feeType }),
      });
      setInvoiceResult(inv);
      setTab("overview");
      fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (invoiceId: string) => {
    try {
      const receipt = await api<any>(`/payments/invoices/${invoiceId}/receipt`);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/payments/receipts/${receipt.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receipt.receiptNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError("Failed to download receipt: " + e.message);
    }
  };

  if (loading && !summary) {
    return <div className="text-center py-12 text-slate-500">Loading payments...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Payments</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-3">
        {(["overview", "invoices", "new"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setInvoiceResult(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t ? "bg-sky-50 text-sky-700 border-b-2 border-sky-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "overview" ? "Overview" : t === "invoices" ? "My Invoices" : "Pay Fee"}
          </button>
        ))}
      </div>

      {invoiceResult && (
        <div className="card mb-6 border-2 border-green-200 bg-green-50">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-800">Invoice Generated</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-slate-500">Bank:</span> <strong>{invoiceResult.virtualAccountBank}</strong></div>
              <div><span className="text-slate-500">Status:</span> <strong>{invoiceResult.status}</strong></div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-green-200">
              <p className="text-xs text-slate-500 mb-1">Virtual Account Number</p>
              <p className="text-2xl font-mono font-bold text-slate-900 tracking-wider">{invoiceResult.virtualAccountNumber}</p>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Pay the total of <strong>₦{invoiceResult.totalAmount.toLocaleString()}</strong> (Fee: ₦{invoiceResult.amount.toLocaleString()} + Processing: ₦{invoiceResult.serviceFee.toLocaleString()}) to the account above via your bank app, USSD, OPay or POS. Payment will be confirmed automatically.
            </p>
          </div>
        </div>
      )}

      {tab === "overview" && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="text-sm text-slate-500 mb-1">Total Invoices</div>
              <div className="text-3xl font-bold text-slate-800">{summary.totalInvoices}</div>
            </div>
            <div className="card">
              <div className="text-sm text-slate-500 mb-1">Completed Payments</div>
              <div className="text-3xl font-bold text-green-600">{summary.completedPayments}</div>
            </div>
            <div className="card">
              <div className="text-sm text-slate-500 mb-1">Outstanding</div>
              <div className="text-3xl font-bold text-red-600">
                ₦{Object.values(summary.outstandingBalances).reduce((s, v) => s + v, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {Object.keys(summary.outstandingBalances).length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">Outstanding Balances</h3>
              {Object.entries(summary.outstandingBalances).map(([feeType, amount]) => (
                <div key={feeType} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600 capitalize">{feeType.replace(/_/g, " ")}</span>
                  <span className="text-sm font-bold text-red-600">₦{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {summary.recentPayments.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3">Recent Payments</h3>
              <div className="space-y-2">
                {summary.recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="font-medium text-slate-700 capitalize">{p.feeType.replace(/_/g, " ")}</div>
                      <div className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800">₦{p.totalAmount.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">{p.receiptNumber}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "invoices" && (
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No invoices yet. Go to "Pay Fee" to create one.</p>
          ) : (
            invoices.map((inv) => {
              const Icon = STATUS_ICONS[inv.status] || AlertCircle;
              const color = STATUS_COLORS[inv.status] || "";
              return (
                <div key={inv.id} className="card flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                      <Icon className="w-3 h-3" />{inv.status}
                    </span>
                    <div>
                      <div className="font-medium text-slate-700 capitalize">{inv.feeType.replace(/_/g, " ")}</div>
                      <div className="text-xs text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-slate-800">₦{inv.totalAmount.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">
                        Fee: ₦{inv.amount.toLocaleString()} + Processing: ₦{inv.serviceFee}
                      </div>
                    </div>
                    {inv.status === "AWAITING_PAYMENT" && inv.virtualAccountNumber && (
                      <button
                        onClick={() => {
                          setTab("new");
                          setInvoiceResult(inv);
                        }}
                        className="btn-secondary text-xs"
                      >
                        <CreditCard className="w-3 h-3" /> View Details
                      </button>
                    )}
                    {(inv.status === "COMPLETE" || inv.status === "REMITTED") && (
                      <button
                        onClick={() => downloadReceipt(inv.id)}
                        className="btn-primary text-xs flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Receipt
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "new" && (
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Create Payment Invoice</h2>
          {feeConfigs.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No fee configurations available. Contact administrator.</p>
          ) : (
            feeConfigs.map((cfg) => (
              <button
                key={cfg.id}
                onClick={() => generateInvoice(cfg.feeType)}
                disabled={loading}
                className="card w-full text-left hover:border-sky-300 hover:shadow-md transition-all flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-slate-700">{cfg.label}</div>
                  <div className="text-xs text-slate-400 capitalize">{cfg.feeType.replace(/_/g, " ")}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800">₦{cfg.amount.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">+ ₦{cfg.serviceFee} processing fee</div>
                  <div className="text-sm font-bold text-sky-600 mt-1">Pay ₦{(cfg.amount + cfg.serviceFee).toLocaleString()}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
