import { Card } from "@/components/ui/card"
import { CalendarDays, CheckCircle2, Clock3, FileText, UserRound } from "lucide-react"

const datePattern = /\d{1,2}-[A-Za-z]{3}-\d{4}\s+\d{1,2}:\d{2}\s+[AP]M/
const standardStages = [
  "Choice Submitted",
  "Review by Dept. MOOC Coordinator",
  "Finalized by MOOC Coordinator",
  "Final Allocation",
]

function parseStage(raw, fallbackTitle) {
  if (!raw || typeof raw !== "string") {
    return { title: fallbackTitle, status: "P", date: null, coordinator: null }
  }

  const [text, status = "P"] = raw.split("@")
  // Replace non-breaking spaces with normal spaces
  const cleanText = text.replace(/\u00a0/g, " ").trim()
  
  const date = cleanText.match(datePattern)?.[0] || null
  const coordinatorMatch = cleanText.match(/\bby\s+([^(]+?)(?:\s*\(|$)/i)
  const coordinator = coordinatorMatch ? coordinatorMatch[1].trim() : null

  return {
    title: fallbackTitle,
    status: status.trim(),
    date,
    coordinator,
  }
}

export default function MoocStatus({ moocStatus }) {
  // Support passing either response object directly or root API object
  const data = moocStatus?.response || moocStatus || {}
  const subjects = data?.totalsubjectDetailList || []

  if (subjects.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No MOOC status found for this semester
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-2">
      {/* Header Info Badges */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {data.duesAmount > 0 && (
          <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
            Pending dues: ₹{data.duesAmount}
          </span>
        )}
        {data.onlyapprovedbyvc === "Y" && (
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 font-medium">
            Final VC Approval Only
          </span>
        )}
      </div>

      {subjects.map((subject) => {
        const stageNames = data.onlyapprovedbyvc === "Y"
          ? [standardStages[0], standardStages[3]]
          : standardStages

        const stages = stageNames.map((title, index) => {
          const raw = subject.totalStages?.[index]
          return parseStage(raw, title)
        })

        const completedCount = stages.filter((s) => s.status === "D").length
        const isFullyApproved = subject.approvalstatus === "D" || completedCount === stages.length

        const phaseLabel = isFullyApproved
          ? "Approved"
          : completedCount > 0
            ? "In Progress"
            : "Pending"

        return (
          <Card 
            key={subject.subjectid || subject.subjectcode} 
            className="overflow-hidden border border-border/80 bg-card shadow-sm"
          >
            {/* Subject Header */}
            <div className="border-b border-border bg-muted/20 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold tracking-wider text-primary">
                    {subject.subjectcode}
                  </span>
                  <h3 className="mt-1.5 text-sm font-semibold leading-snug text-card-foreground">
                    {subject.subjectdesc}
                  </h3>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    isFullyApproved
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : completedCount > 0
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                        : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {phaseLabel}
                </span>
              </div>

              {subject.choicetype && (
                <div className="mt-2.5 text-[11px] font-medium text-muted-foreground">
                  <span className="text-muted-foreground/70">Applied against: </span>
                  <span className="font-semibold text-foreground">
                    {subject.choicetype.replace(/^CURRENT\s+Againts\((.*)\)$/i, "$1")}
                  </span>
                </div>
              )}
            </div>

            {/* Stage Timeline */}
            <div className="p-4">
              {stages.map((stage, index) => {
                const isLast = index === stages.length - 1
                const isDone = stage.status === "D"

                const Icon = isDone
                  ? CheckCircle2
                  : index === 0
                    ? FileText
                    : Clock3

                return (
                  <div key={index} className="grid grid-cols-[1.5rem_1fr] gap-x-3">
                    {/* Icon & Connector Line Column */}
                    <div className="relative flex flex-col items-center">
                      {/* Node Icon */}
                      <div
                        className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                          isDone
                            ? "bg-emerald-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      {/* Line extending down to next node */}
                      {!isLast && (
                        <div
                          className={`w-[2px] grow ${
                            isDone ? "bg-emerald-500/40" : "bg-border"
                          }`}
                        />
                      )}
                    </div>

                    {/* Stage Details Column */}
                    <div className={`${!isLast ? "pb-5" : "pb-0"} pt-0.5`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-card-foreground">
                          {stage.title}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            isDone
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isDone ? "Done" : "Pending"}
                        </span>
                      </div>

                      {/* Metadata Details */}
                      {(stage.date || stage.coordinator) && (
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          {stage.date && (
                            <div className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3 w-3 shrink-0" />
                              <span>{stage.date}</span>
                            </div>
                          )}
                          {stage.coordinator && (
                            <div className="inline-flex items-center gap-1">
                              <UserRound className="h-3 w-3 shrink-0" />
                              <span className="font-medium text-foreground/80">
                                {stage.coordinator}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
    </div>
  )
}