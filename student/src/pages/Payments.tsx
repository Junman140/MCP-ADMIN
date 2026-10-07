import { useEffect, useState } from "react";
import { api } from "../api";
import { Download, AlertCircle, CheckCircle2, Clock, XCircle, RefreshCw, CreditCard } from "lucide-react";
import { Badge, Button, Card, PageHeader, Tabs } from "@bio/ui";

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

const STATUS_ICONS: Record<string, any> = {
  AWAITING_PAYMENT: Clock,
  COLLECTED: CheckCircle2,
  REMITTING: RefreshCw,
  REMITTED: CheckCircle2,
  COMPLETE: CheckCircle2,
  FAILED: XCircle,
  EXPIRED: XCircle,
};

const STATUS_TONE: Record<string, "amber" | "green" | "red"> = {
  AWAITING_PAYMENT: "amber",
  COLLECTED: "green",
  REMITTING: "green",
  REMITTED: "green",
  COMPLETE: "green",
  FAILED: "red",
  EXPIRED: "red",
};

function StatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status] || AlertCircle;
  const tone = STATUS_TONE[status] || "amber";
  return (
    <Badge tone={tone}>
      <Icon className="mr-1 h-3 w-3" />
      {status}
    </Badge>
  );
}

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

  useEffect(() => {
    fetchData();
  }, []);

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
    return <p className="py-12 text-center text-[var(--bio-muted)]">Loading payments…</p>;
  }

  return (
    <div>
      <PageHeader title="Payments" subtitle="View balances, pay fees, and download receipts." />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Tabs<"overview" | "invoices" | "new">
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "invoices", label: "My Invoices" },
          { id: "new", label: "Pay Fee" },
        ]}
        active={tab}
        onChange={(t) => {
          setTab(t);
          setInvoiceResult(null);
        }}
      />

      {invoiceResult && (
        <Card className="mt-6 border-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-800 dark:text-emerald-300">Invoice Generated</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-[var(--bio-muted)]">Bank:</span> <strong>{invoiceResult.virtualAccountBank}</strong></div>
              <div><span className="text-[var(--bio-muted)]">Status:</span> <strong>{invoiceResult.status}</strong></div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-white p-3 dark:bg-slate-900">
              <p className="mb-1 text-xs text-[var(--bio-muted)]">Virtual Account Number</p>
              <p className="font-mono text-2xl font-bold tracking-wider text-slate-900 dark:text-white">
                {invoiceResult.virtualAccountNumber}
              </p>
            </div>
            <p className="mt-2 text-xs text-[var(--bio-muted)]">
              Pay the total of <strong>₦{invoiceResult.totalAmount.toLocaleString()}</strong> (Fee: ₦
              {invoiceResult.amount.toLocaleString()} + Processing: ₦{invoiceResult.serviceFee.toLocaleString()}) to the
              account above. Payment is confirmed automatically.
            </p>
          </div>
        </Card>
      )}

      {tab === "overview" && summary && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="mb-1 text-sm text-[var(--bio-muted)]">Total Invoices</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{summary.totalInvoices}</p>
            </Card>
            <Card>
              <p className="mb-1 text-sm text-[var(--bio-muted)]">Completed Payments</p>
              <p className="text-3xl font-bold text-emerald-600">{summary.completedPayments}</p>
            </Card>
            <Card>
              <p className="mb-1 text-sm text-[var(--bio-muted)]">Outstanding</p>
              <p className="text-3xl font-bold text-rose-600">
                ₦{Object.values(summary.outstandingBalances).reduce((s, v) => s + v, 0).toLocaleString()}
              </p>
            </Card>
          </div>

          {Object.keys(summary.outstandingBalances).length > 0 && (
            <Card>
              <h3 className="mb-3 font-semibold text-slate-700 dark:text-slate-200">Outstanding Balances</h3>
              {Object.entries(summary.outstandingBalances).map(([feeType, amount]) => (
                <div key={feeType} className="flex justify-between border-b border-[var(--bio-border)] py-2 last:border-0">
                  <span className="text-sm capitalize text-slate-600 dark:text-slate-300">{feeType.replace(/_/g, " ")}</span>
                  <span className="text-sm font-bold text-rose-600">₦{amount.toLocaleString()}</span>
                </div>
              ))}
            </Card>
          )}

          {summary.recentPayments.length > 0 && (
            <Card>
              <h3 className="mb-3 font-semibold text-slate-700 dark:text-slate-200">Recent Payments</h3>
              <div className="divide-y divide-[var(--bio-border)]">
                {summary.recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <div className="font-medium capitalize text-slate-700 dark:text-slate-200">{p.feeType.replace(/_/g, " ")}</div>
                      <div className="text-xs text-[var(--bio-muted)]">{new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800 dark:text-white">₦{p.totalAmount.toLocaleString()}</div>
                      <div className="text-xs text-[var(--bio-muted)]">{p.receiptNumber}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "invoices" && (
        <div className="mt-6 space-y-3">
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-[var(--bio-muted)]">No invoices yet. Go to “Pay Fee” to create one.</p>
          ) : (
            invoices.map((inv) => (
              <Card key={inv.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={inv.status} />
                  <div>
                    <div className="font-medium capitalize text-slate-700 dark:text-slate-200">{inv.feeType.replace(/_/g, " ")}</div>
                    <div className="text-xs text-[var(--bio-muted)]">{new Date(inv.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-slate-800 dark:text-white">₦{inv.totalAmount.toLocaleString()}</div>
                    <div className="text-xs text-[var(--bio-muted)]">Fee: ₦{inv.amount.toLocaleString()} + ₦{inv.serviceFee} processing</div>
                  </div>
                  {inv.status === "AWAITING_PAYMENT" && inv.virtualAccountNumber && (
                    <Button variant="secondary" className="text-xs" onClick={() => { setTab("new"); setInvoiceResult(inv); }}>
                      <CreditCard className="h-3 w-3" /> View Details
                    </Button>
                  )}
                  {(inv.status === "COMPLETE" || inv.status === "REMITTED") && (
                    <Button variant="primary" className="text-xs" onClick={() => downloadReceipt(inv.id)}>
                      <Download className="h-3 w-3" /> Receipt
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "new" && (
        <div className="mx-auto mt-6 max-w-md space-y-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-200">Create Payment Invoice</h2>
          {feeConfigs.length === 0 ? (
            <p className="py-8 text-center text-[var(--bio-muted)]">No fee configurations available. Contact administrator.</p>
          ) : (
            feeConfigs.map((cfg) => (
              <button
                key={cfg.id}
                onClick={() => generateInvoice(cfg.feeType)}
                disabled={loading}
                className="card w-full text-left transition-all hover:border-brand-300 hover:shadow-pop disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-700 dark:text-slate-200">{cfg.label}</div>
                    <div className="text-xs capitalize text-[var(--bio-muted)]">{cfg.feeType.replace(/_/g, " ")}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800 dark:text-white">₦{cfg.amount.toLocaleString()}</div>
                    <div className="text-xs text-[var(--bio-muted)]">+ ₦{cfg.serviceFee} processing</div>
                    <div className="mt-1 text-sm font-bold text-brand-600 dark:text-brand-400">
                      Pay ₦{(cfg.amount + cfg.serviceFee).toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
