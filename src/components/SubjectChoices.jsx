import React from "react"
import { motion } from "framer-motion"
import { Loader2, Check, Clock, AlertCircle } from "lucide-react"

export default function SubjectChoices({ currentChoices, choicesLoading, semesterName }) {
  const getSubjectStatus = (subject) => {
    if (subject.electivetype === "N" || (subject.electivetype === "Y" && subject.finalizedcount > 0)) {
      return subject.running === "Y" ? "allotted" : "not-allotted";
    } else if (subject.electivetype === "Y" && subject.finalizedcount === 0) {
      return subject.running === "Y" ? "tentative" : "pending";
    }
    return "pending";
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "allotted":
        return { text: "Allotted", color: "bg-green-500", icon: Check, textColor: "text-white" };
      case "tentative":
        return { text: "Tentative", color: "bg-yellow-500", icon: Clock, textColor: "text-white" };
      case "pending":
        return { text: "Pending", color: "bg-gray-500", icon: AlertCircle, textColor: "text-white" };
      default:
        return { text: "Not Allotted", color: "bg-gray-600", icon: AlertCircle, textColor: "text-gray-200" };
    }
  };

  if (choicesLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)]"
      >
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
        <span className="ml-2 text-foreground">Loading subject choices...</span>
      </motion.div>
    )
  }

  if (currentChoices?.subjectpreferencegrid?.length > 0) {
    const isFinalized = currentChoices.subjectpreferencegrid.some(s => s.finalizedcount > 0);
    const totalCredits = currentChoices.subjectpreferencegrid
      .filter(s => s.running === "Y")
      .reduce((sum, s) => sum + (s.credits || 0), 0);

    return (
      <div className="space-y-8">
        {semesterName && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">
              {semesterName} Subject Choices
            </h2>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-2">
              <span>Total Credits: {totalCredits}</span>
              <span>•</span>
              <span className={`flex items-center gap-1 ${isFinalized ? 'text-green-400' : 'text-yellow-400'}`}>
                {isFinalized ? <Check size={14} /> : <Clock size={14} />}
                {isFinalized ? 'Finalized' : 'Not Finalized'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isFinalized ? 'Your subject choices have been finalized' : 'Subject choices are tentative and may change'}
            </p>
          </div>
        )}

        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(
            currentChoices.subjectpreferencegrid.reduce((acc, subject) => {
              const basket = subject.basketcode
              if (!acc[basket]) {
                acc[basket] = {
                  name: subject.basketdesc,
                  code: basket,
                  subjects: []
                }
              }
              acc[basket].subjects.push(subject)
              return acc
            }, {})
          ).map(([basketCode, basket]) => (
            <motion.div
              key={basketCode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="border border-border rounded-xl p-6 bg-card hover:border-border/60 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">
                  {basket.name}
                </h3>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted/10 text-muted-foreground">
                  {basket.subjects.length} subjects
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {basket.subjects
                  .sort((a, b) => a.preference - b.preference)
                  .map((subject) => {
                    const showNumbering = basket.code !== "CORE" && basket.code !== "CORE-AUDIT"
                    const status = getSubjectStatus(subject);
                    const statusDisplay = getStatusDisplay(status);
                    const StatusIcon = statusDisplay.icon;

                    return (
                      <div
                        key={subject.subjectid}
                        className={`group p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${status === "allotted"
                            ? "border-green-500/50 bg-green-500/10 hover:bg-green-500/15"
                            : status === "tentative"
                              ? "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/15"
                              : status === "pending"
                                ? "border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/15"
                                : "border-border bg-card hover:bg-muted/5"
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          {showNumbering && (
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${status === "allotted"
                                  ? "bg-green-500 text-white"
                                  : status === "tentative"
                                    ? "bg-yellow-500 text-white"
                                    : status === "pending"
                                      ? "bg-orange-500 text-white"
                                      : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                                }`}
                            >
                              {subject.preference}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-foreground text-sm leading-tight">
                                {subject.subjectdesc}
                              </h4>
                              <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${statusDisplay.color} ${statusDisplay.textColor} flex items-center gap-1`}>
                                <StatusIcon size={10} /> {statusDisplay.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              <span className="font-mono bg-muted/10 px-2 py-1 rounded">
                                {subject.subjectcode}
                              </span>
                              <span className="font-medium">
                                {subject.credits} Credits
                              </span>
                              {subject.auditsubject === "Y" && (
                                <span className="px-2 py-1 rounded bg-secondary/10 text-secondary-foreground text-xs font-medium">
                                  Audit
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {subject.electivetype === "Y" && (
                                  <span className="px-2 py-1 rounded-md bg-accent/10 text-accent-foreground text-xs font-medium">
                                    {subject.subjecttypedesc}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="md:hidden space-y-6">
          {Object.entries(
            currentChoices.subjectpreferencegrid.reduce((acc, subject) => {
              const basket = subject.basketcode
              if (!acc[basket]) {
                acc[basket] = {
                  name: subject.basketdesc,
                  code: basket,
                  subjects: []
                }
              }
              acc[basket].subjects.push(subject)
              return acc
            }, {})
          ).map(([basketCode, basket]) => (
            <motion.div
              key={basketCode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="border border-border rounded-lg p-4 bg-card"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {basket.name}
              </h3>

              <div className="space-y-3">
                {basket.subjects
                  .sort((a, b) => a.preference - b.preference)
                  .map((subject) => {
                    const showNumbering = basket.code !== "CORE" && basket.code !== "CORE-AUDIT"
                    const status = getSubjectStatus(subject);
                    const statusDisplay = getStatusDisplay(status);
                    const StatusIcon = statusDisplay.icon;

                    return (
                      <div
                        key={subject.subjectid}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${status === "allotted"
                            ? "border-green-500/50 bg-green-500/10"
                            : status === "tentative"
                              ? "border-yellow-500/50 bg-yellow-500/10"
                              : status === "pending"
                                ? "border-orange-500/50 bg-orange-500/10"
                                : "border-border bg-card"
                          }`}
                      >
                        {showNumbering && (
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${status === "allotted"
                                ? "bg-green-500 text-white"
                                : status === "tentative"
                                  ? "bg-yellow-500 text-white"
                                  : status === "pending"
                                    ? "bg-orange-500 text-white"
                                    : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {subject.preference}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground">
                                {subject.subjectdesc}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span className="font-mono">{subject.subjectcode}</span>
                                <span>•</span>
                                <span>{subject.credits} Credits</span>
                                {subject.auditsubject === "Y" && (
                                  <>
                                    <span>•</span>
                                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs font-medium">
                                      Audit
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${statusDisplay.color} ${statusDisplay.textColor} flex items-center gap-1`}>
                              <StatusIcon size={10} /> {statusDisplay.text}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              {subject.electivetype === "Y" && (
                                <span className="px-2 py-1 rounded-md bg-accent/10 text-accent-foreground text-xs font-medium">
                                  {subject.subjecttypedesc}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center py-8"
    >
      <div className="text-center bg-card rounded-lg p-6 max-w-md border border-border">
        <p className="text-muted-foreground">No subject choices available for this semester.</p>
      </div>
    </motion.div>
  )
}