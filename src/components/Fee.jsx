import { useEffect, useState, cloneElement } from "react";
import { Hash, BookOpen, GitBranch, Calendar, Tag, AlertCircle, Download, RefreshCw, Wallet, Clock, CheckCircle2, Info } from "lucide-react";
import { Helmet } from 'react-helmet-async';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { motion } from "framer-motion";
import axios from 'axios';
import { proxy_url } from '@/lib/api';

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
        `${proxy_url}/feedemandreportcontroller/generatereportforpdf`,
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
      <button onClick={() => setRefreshCounter(c => c + 1)} className="mt-4 w-full py-2 bg-primary text-white rounded-lg">Retry</button>
    </div>
  );

  const feeData = data?.response || data;
  const student = feeData?.studentInfo?.[0];
  const totalPaid = feeData?.feeHeads?.reduce((s, f) => s + (Number(f.receiveamount) || 0), 0) || 0;
  const totalDue = feeData?.feeHeads?.reduce((s, f) => s + (Number(f.dueamount) || 0), 0) || 0;
  const totalFines = fines.reduce((sum, fine) => sum + (parseFloat(fine.charge || fine.feeamounttobepaid) || 0), 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 pb-24"
    >
      <Helmet><title>Fee Summary | JP Portal</title></Helmet>

      <motion.div 
        initial={{ y: -10 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Fee Summary</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage your academic dues and payment history</p>
        </div>
        <Button
          onClick={downloadFeeDemandReport}
          disabled={downloadingReport}
          className="flex items-center gap-2 px-5 py-2.5 font-medium whitespace-nowrap"
        >
          {downloadingReport ? <RefreshCw className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
          {downloadingReport ? "Generating..." : "Demand Report (PDF)"}
        </Button>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, staggerChildren: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6"
      >
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
          <StatCard title="Total Paid" amount={totalPaid} icon={<CheckCircle2 className="text-emerald-500" />} color="bg-emerald-500/10" accentColor="border-emerald-500/30" />
        </motion.div>
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <StatCard title="Outstanding Due" amount={totalDue} icon={<Clock className="text-rose-500" />} color="bg-rose-500/10" accentColor="border-rose-500/30" />
        </motion.div>
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <StatCard title="Pending Fines" amount={totalFines} icon={<Wallet className="text-amber-500" />} color="bg-amber-500/10" accentColor="border-amber-500/30" />
        </motion.div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <Card className="bg-card/80 border-border/50 shadow-md overflow-hidden rounded-xl hover:shadow-lg transition-all">
            <div className="p-5 border-b border-border/30 bg-muted/40 backdrop-blur-sm">
              <h3 className="font-bold text-sm md:text-base flex items-center gap-2.5 uppercase tracking-wider"><Tag className="w-4 h-4 text-primary" /> Academic Profile</h3>
            </div>
            <CardContent className="p-5 space-y-4">
              <InfoRow icon={<Hash />} label="Enrollment" value={student?.enrollmentno} />
              <InfoRow icon={<BookOpen />} label="Program" value={student?.programdesc} />
              <InfoRow icon={<GitBranch />} label="Branch" value={student?.branchdesc} />
              <InfoRow icon={<Calendar />} label="Batch" value={student?.academicyear} />
              <div className="pt-4 border-t border-border/30 flex justify-between items-center">
                <span className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quota</span>
                <Badge className="bg-primary/20 text-primary border-primary/30 font-bold">{student?.quotacode}</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-2 space-y-8"
        >
          {fines.length > 0 && (
            <motion.section 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2.5 mb-1">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-lg md:text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400">Pending Penalties</h3>
              </div>
              <div className="grid gap-4">
                {fines.map((fine, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex justify-between items-start p-4 md:p-5 bg-rose-50/40 dark:bg-rose-950/15 border border-rose-200/50 dark:border-rose-900/30 rounded-xl hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-sm md:text-base text-rose-900 dark:text-rose-100">{fine.servicename || "Misc Charge"}</p>
                      <p className="text-xs md:text-sm text-rose-700/70 dark:text-rose-300/60 mt-1">{fine.remarksbyauthority}</p>
                    </div>
                    <Badge className="ml-3 bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300/50 font-bold whitespace-nowrap\">{formatCurrency(fine.charge || fine.feeamounttobepaid)}</Badge>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-lg md:text-xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Semester-wise Breakdown
            </h3>
            <div className="grid gap-5">
              {feeData?.feeHeads?.map((fee, i) => (
                <motion.div 
                  key={i} 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  className="bg-card border border-border/50 rounded-xl p-5 md:p-7 hover:shadow-lg transition-all duration-300 space-y-5"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h4 className="text-xl md:text-2xl font-bold tracking-tight">Semester {fee.stynumber}</h4>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium">{fee.academicyear}</p>
                    </div>
                    {fee.dueamount > 0 ? (
                      <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300/50 font-bold animate-pulse">Outstanding</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300/50 font-bold">Settled</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 md:gap-4 py-3 px-3 md:px-4 bg-muted/40 rounded-lg border border-border/30">
                    <DataBlock label="Total Demand" value={formatCurrency(fee.feeamount)} />
                    <DataBlock label="Paid Amount" value={formatCurrency(fee.receiveamount)} color="text-emerald-600 dark:text-emerald-400" />
                    <DataBlock label="Current Due" value={formatCurrency(fee.dueamount)} color={fee.dueamount > 0 ? "text-rose-600 dark:text-rose-400" : ""} />
                  </div>
                  
                  <div className="pt-3 border-t border-border/30 flex flex-wrap gap-3 md:gap-4 text-xs text-muted-foreground">
                    <span className="font-medium"><Calendar className="w-3 h-3 inline mr-1.5" />Registration: <b className="text-foreground">{new Date(fee.regallowdate).toLocaleDateString()}</b></span>
                    {fee.transferinamount > 0 && <span className="font-medium"><Wallet className="w-3 h-3 inline mr-1.5" />Transfer In: <b className="text-foreground">{formatCurrency(fee.transferinamount)}</b></span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, amount, icon, color, accentColor }) {
  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
      className={`p-6 md:p-7 rounded-xl border-2 ${accentColor || "border-border/50"} ${color} shadow-md transition-all duration-300 space-y-3 hover:shadow-lg`}
    >
      <div className="flex justify-between items-start">
        <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground/80">{title}</span>
        <div className="p-2.5 rounded-lg bg-background/50 backdrop-blur-sm">
          {icon}
        </div>
      </div>
      <p className="text-3xl md:text-4xl font-bold font-mono tracking-tight">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)}</p>
    </motion.div>
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