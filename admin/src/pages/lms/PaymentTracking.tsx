import { useEffect, useState } from "react";
import { api } from "../../api";
import { Search, AlertTriangle, CheckCircle2, Clock, RefreshCw, XCircle, ExternalLink } from "lucide-react";

interface Invoice {
  id: string;
  studentId: string;
  feeType: string;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  status: string;
  virtualAccountNumber: string;
  virtualAccountBank: string;
  pspProvider: string;
  paidAt: string | null;
  createdAt: string;
  expiresAt: string;
}

interface LedgerEntry {
  id: string;
  event: string;
  amount: number;
  previousHash: string;
  currentHash: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { icon: React.ComponentType<any>; color: string; label: string }> = {
  AWAITING_PAYMENT: { icon: Clock, color: "bg-amber-100 text-amber-700", label: "Awaiting Payment" },
  COLLECTED: { icon: CheckCircle2, color: "bg-blue-100 text-blue-700", label: "Collected" },
  REMITTING: { icon: RefreshCw, color: "bg-purple-100 text-purple-700", label: "Remitting" },
  REMITTED: { icon: CheckCircle2, color: "bg-green-100 text-green-700", label: "Remitted" },
  COMPLETE: { icon: CheckCircle2, color: "bg-green-200 text-green-800", label: "Complete" },
  FAILED: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Failed" },
  EXPIRED: { icon: XCircle, color: "bg-slate-100 text-slate-600", label: "Expired" },
};

export default function PaymentTracking() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [ledger, setLedger] = useState<{ entries: LedgerEntry[]; chainIntegrity: any } | null>(null);

  const fetchInvoices = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    api<Invoice[]>(`/payments/invoices?${params.toString()}`)
      .then(setInvoices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoices(); }, [statusFilter]);

  const viewLedger = async (invoiceId: string) => {
    setSelectedInvoice(invoiceId);
    try {
      const data = await api<{ entries: LedgerEntry[]; chainIntegrity: any }>(`/payments/invoices/${invoiceId}/ledger`);
      setLedger(data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const filtered = invoices.filter((inv) => {
    if (search && !inv.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payment Tracking</h1>
        <button onClick={fetchInvoices} disabled={loading} className="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice ID..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_MAP).map((s) => (
            <option key={s} value={s}>{STATUS_MAP[s].label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={selectedInvoice ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-slate-500">Invoice ID</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-500">Type</th>
                  <th className="text-right p-3 text-sm font-medium text-slate-500">Total</th>
                  <th className="text-center p-3 text-sm font-medium text-slate-500">Status</th>
                  <th className="text-right p-3 text-sm font-medium text-slate-500">Date</th>
                  <th className="text-right p-3 text-sm font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filtered.map((inv) => {
                  const stat = STATUS_MAP[inv.status] || STATUS_MAP.AWAITING_PAYMENT;
                  const StatIcon = stat.icon;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 text-sm font-mono text-xs text-slate-500">{inv.id.slice(0, 8)}...</td>
                      <td className="p-3 text-sm capitalize">{inv.feeType.replace(/_/g, " ")}</td>
                      <td className="p-3 text-sm text-right font-mono font-bold">₦{inv.totalAmount.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${stat.color}`}>
                          <StatIcon className="w-3 h-3" />{stat.label}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-right text-slate-400 text-xs">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => viewLedger(inv.id)}
                          className={`px-3 py-1 rounded text-xs ${selectedInvoice === inv.id ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700 hover:bg-sky-100"}`}
                        >
                          <ExternalLink className="w-3 h-3 inline mr-1" />Ledger
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && !loading && (
            <p className="text-slate-500 text-center py-12">No invoices found.</p>
          )}
        </div>

        {selectedInvoice && ledger && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Ledger Chain</h3>
              <button onClick={() => { setSelectedInvoice(null); setLedger(null); }}>
                <XCircle className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className={`mb-4 p-2 rounded-lg text-xs font-medium text-center ${
              ledger.chainIntegrity.valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {ledger.chainIntegrity.valid ? (
                <><CheckCircle2 className="w-3 h-3 inline mr-1" />Chain Valid ({ledger.chainIntegrity.entryCount} entries)</>
              ) : (
                <><AlertTriangle className="w-3 h-3 inline mr-1" />Chain Broken at {ledger.chainIntegrity.brokenAt?.slice(0, 8)}</>
              )}
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {ledger.entries.map((entry) => (
                <div key={entry.id} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-sky-600">{entry.event}</span>
                    <span className="text-slate-400">{new Date(entry.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-500">Amount: ₦{entry.amount.toLocaleString()}</div>
                  <div className="text-slate-400 break-all font-mono text-[10px] mt-1">
                    Prev: {entry.previousHash.slice(0, 16)}...
                  </div>
                  <div className="text-slate-400 break-all font-mono text-[10px]">
                    Curr: {entry.currentHash.slice(0, 16)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
