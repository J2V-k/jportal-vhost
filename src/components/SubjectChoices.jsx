import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, Clock, AlertCircle, Bookmark, GraduationCap, Layers } from "lucide-react"

export default function SubjectChoices({ currentChoices, choicesLoading, semesterName }) {
  const getSubjectStatus = (subject) => {
    if (subject.electivetype === "N" || (subject.electivetype === "Y" && subject.finalizedcount > 0)) {
      return subject.running === "Y" ? "allotted" : "not-allotted";
    } else if (subject.electivetype === "Y" && subject.finalizedcount === 0) {
      return subject.running === "Y" ? "tentative" : "pending";
    }
    return "pending";
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "allotted":
        return { text: "Allotted", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle2 };
      case "tentative":
        return { text: "Tentative", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Clock };
      case "pending":
        return { text: "Pending", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: AlertCircle };
      default:
        return { text: "Not Alloted", color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: AlertCircle };
    }
  };

  if (choicesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse font-medium">Synchronizing your academic choices...</p>
      </div>
    );
  }

  if (currentChoices?.subjectpreferencegrid?.length > 0) {
    const isFinalized = currentChoices.subjectpreferencegrid.some(s => s.finalizedcount > 0);
    const totalCredits = currentChoices.subjectpreferencegrid
      .filter(s => s.running === "Y")
      .reduce((sum, s) => sum + (s.credits || 0), 0);

    const baskets = currentChoices.subjectpreferencegrid.reduce((acc, subject) => {
      const basket = subject.basketcode;
      if (!acc[basket]) {
        acc[basket] = { name: subject.basketdesc, subjects: [] };
      }
      acc[basket].subjects.push(subject);
      return acc;
    }, {});

    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                <GraduationCap size={20} />
                <span className="tracking-wide uppercase text-xs">Academic Profile</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                {semesterName || "Semester Details"}
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-background/50 backdrop-blur-sm border border-border px-4 py-2 rounded-xl shadow-sm">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Active Credits</p>
                <p className="text-xl font-black text-foreground">{totalCredits}</p>
              </div>
              <div className={`backdrop-blur-sm border px-4 py-2 rounded-xl shadow-sm ${isFinalized ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Status</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isFinalized ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <p className={`text-lg font-bold ${isFinalized ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {isFinalized ? 'Finalized' : 'Tentative'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {Object.entries(baskets).map(([basketCode, basket], index) => (
              <motion.div
                key={basketCode}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group flex flex-col bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all overflow-hidden"
              >
                <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                      <Layers size={18} />
                    </div>
                    <h3 className="font-bold text-foreground leading-tight">{basket.name}</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-background border border-border px-2 py-1 rounded-md text-muted-foreground shadow-sm">
                    {basket.subjects.length} OPTIONS
                  </span>
                </div>

                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
                  {basket.subjects
                    .sort((a, b) => a.preference - b.preference)
                    .map((subject) => {
                      const status = getSubjectStatus(subject);
                      const styles = getStatusStyles(status);
                      const StatusIcon = styles.icon;
                      const isCore = basketCode === "CORE" || basketCode === "CORE-AUDIT";

                      return (
                        <div
                          key={subject.subjectid}
                          className={`relative p-4 rounded-xl border transition-all duration-300 ${
                            status === 'allotted' 
                            ? 'bg-emerald-500/[0.03] border-emerald-500/20' 
                            : 'bg-background hover:bg-muted/30 border-border'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {!isCore && (
                              <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-inner border ${
                                status === 'allotted' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-muted text-muted-foreground border-border'
                              }`}>
                                {subject.preference}
                              </div>
                            )}
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-sm text-foreground leading-tight">
                                  {subject.subjectdesc}
                                </h4>
                                <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${styles.bg} ${styles.color} ${styles.border} border`}>
                                  <StatusIcon size={12} strokeWidth={3} />
                                  {styles.text}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                  <Bookmark size={12} className="text-primary" />
                                  <span className="font-mono">{subject.subjectcode}</span>
                                </div>
                                <div className="text-[10px] text-muted-foreground/50">•</div>
                                <span className="text-xs font-bold text-muted-foreground">
                                  {subject.credits} Credits
                                </span>
                                {subject.auditsubject === "Y" && (
                                  <span className="text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                    Audit
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div className="bg-muted/30 p-8 rounded-3xl border border-dashed border-border max-w-sm">
        <AlertCircle size={48} className="mx-auto text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-bold mb-2">No Choices Found</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          It looks like there are no subject preferences registered for this semester yet.
        </p>
      </div>
    </motion.div>
  );
}