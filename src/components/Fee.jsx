import { useEffect, useState } from "react";
import { Receipt, Hash, BookOpen, GitBranch, Calendar, Tag, AlertCircle, Download, RefreshCw, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { Helmet } from 'react-helmet-async';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from "./ui/badge"; // Assuming you have a Badge component
import axios from 'axios';

export default function Fee({ w, serialize_payload }) {
  const [data, setData] = useState(null);
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "₹0";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const downloadFeeDemandReport = async () => {
    if (!w?.session) return alert("Please login first");
    setDownloadingReport(true);
    try {
      const headers = await w.session.get_headers();
      const payload = { instituteid: w.session.instituteid, studentid: w.session.memberid };
      const encryptedPayload = await serialize_payload(payload);
      const response = await axios.post(
        'https://webportal.jiit.ac.in:6011/StudentPortalAPI/feedemandreportcontroller/generatereportforpdf',
        encryptedPayload,
        { headers: { ...headers, 'Content-Type': 'text/plain' }, responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fee_Report_${w.session.memberid}.pdf`;
      a.click();
    } catch (error) {
      setError("Failed to download report. Please try again.");
    } finally {
      setDownloadingReport(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        if (!w?.get_fee_summary) {
          throw new Error('Fee information is unavailable in offline mode.');
        }
        const [feeResult, finesResult] = await Promise.all([
          w.get_fee_summary(),
          w.get_fines_msc_charges?.().catch(() => []) || []
        ]);
        setData(feeResult);
        setFines(Array.isArray(finesResult) ? finesResult : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [w, refreshCounter]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Fetching financial records...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto p-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <button onClick={() => setRefreshCounter(c => c + 1)} className="mt-4 w-full py-2 bg-primary text-white rounded-md">Retry</button>
    </div>
  );

  const feeData = data?.response || data;
  const student = feeData?.studentInfo?.[0];
  const totalPaid = feeData?.feeHeads?.reduce((s, f) => s + (Number(f.receiveamount) || 0), 0) || 0;
  const totalDue = feeData?.feeHeads?.reduce((s, f) => s + (Number(f.dueamount) || 0), 0) || 0;
  const totalFines = fines.reduce((sum, fine) => sum + (parseFloat(fine.charge || fine.feeamounttobepaid) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      <Helmet><title>Fee Summary | JP Portal</title></Helmet>

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Summary</h1>
          <p className="text-muted-foreground">Manage your academic dues and payment history</p>
        </div>
        <button
          onClick={downloadFeeDemandReport}
          disabled={downloadingReport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:ring-2 ring-primary ring-offset-2 transition-all disabled:opacity-50"
        >
          {downloadingReport ? <RefreshCw className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
          Demand Report (PDF)
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Paid" amount={totalPaid} icon={<CheckCircle2 className="text-emerald-500" />} color="bg-emerald-500/10" />
        <StatCard title="Outstanding Due" amount={totalDue} icon={<Clock className="text-rose-500" />} color="bg-rose-500/10" />
        <StatCard title="Pending Fines" amount={totalFines} icon={<Wallet className="text-amber-500" />} color="bg-amber-500/10" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Student Info */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2"><Tag className="w-4 h-4" /> Academic Profile</h3>
            </div>
            <div className="p-4 space-y-4">
              <InfoRow icon={<Hash />} label="Enrollment" value={student?.enrollmentno} />
              <InfoRow icon={<BookOpen />} label="Program" value={student?.programdesc} />
              <InfoRow icon={<GitBranch />} label="Branch" value={student?.branchdesc} />
              <InfoRow icon={<Calendar />} label="Batch" value={student?.academicyear} />
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Quota</span>
                <Badge variant="outline" className="bg-primary/5">{student?.quotacode}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Fines and Detailed Breakup */}
        <div className="lg:col-span-2 space-y-8">
          {/* Fines Section */}
          {fines.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5" /> Pending Penalties
              </h3>
              <div className="grid gap-3">
                {fines.map((fine, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{fine.servicename || "Misc Charge"}</p>
                      <p className="text-xs text-muted-foreground">{fine.remarksbyauthority}</p>
                    </div>
                    <p className="font-bold text-rose-600">{formatCurrency(fine.charge || fine.feeamounttobepaid)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Fee Heads Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Semester-wise Breakdown</h3>
            <div className="grid gap-4">
              {feeData?.feeHeads?.map((fee, i) => (
                <div key={i} className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-xl font-bold">Semester {fee.stynumber}</h4>
                      <p className="text-sm text-muted-foreground">{fee.academicyear}</p>
                    </div>
                    {fee.dueamount > 0 ? (
                      <Badge variant="destructive" className="animate-pulse">Outstanding</Badge>
                    ) : (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600">Settled</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
                    <DataBlock label="Total Demand" value={formatCurrency(fee.feeamount)} />
                    <DataBlock label="Paid Amount" value={formatCurrency(fee.receiveamount)} color="text-emerald-600" />
                    <DataBlock label="Current Due" value={formatCurrency(fee.dueamount)} color={fee.dueamount > 0 ? "text-rose-600" : ""} />
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Registration Date: <b>{new Date(fee.regallowdate).toLocaleDateString()}</b></span>
                    {fee.transferinamount > 0 && <span>Transfer In: <b>{formatCurrency(fee.transferinamount)}</b></span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner JSX
function StatCard({ title, amount, icon, color }) {
  return (
    <div className={`p-6 rounded-2xl border ${color} shadow-sm space-y-2`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)}</p>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3 text-muted-foreground">
        {cloneElement(icon, { size: 16, className: "group-hover:text-primary transition-colors" })}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-semibold truncate max-w-[150px]">{value || "—"}</span>
    </div>
  );
}

function DataBlock({ label, value, color = "" }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
      <p className={`text-lg font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

import { cloneElement } from "react";