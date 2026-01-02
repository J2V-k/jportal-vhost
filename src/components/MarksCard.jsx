import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function MarksCard({ course, gradeInfo }) {
  const getProgressColor = (percentage) => {
    if (percentage >= 75) return "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]";
    if (percentage >= 50) return "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]";
    return "bg-orange-500 shadow-[0_0_12px_rgba(234,88,12,0.3)]";
  };

  const matchingGrade = gradeInfo?.gradecard?.find(
    (g) => g.subjectcode === course.code
  );

  const totalMarks = Object.values(course.exams).reduce(
    (acc, exam) => ({
      obtained: acc.obtained + exam.OM,
      full: acc.full + exam.FM,
    }),
    { obtained: 0, full: 0 }
  );

  const totalPercentage = (totalMarks.obtained / totalMarks.full) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="w-full"
    >
      <Card className="overflow-hidden bg-card border-border/60 shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-4 md:p-6 space-y-5">
          
          <div className="flex flex-col gap-1.5 w-full">
            <h3 className="font-bold text-base md:text-lg text-foreground tracking-tight leading-tight break-words">
              {course.name}
            </h3>
            <div className="flex items-center gap-2">
              <code className="text-[10px] md:text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase tracking-wider">
                {course.code}
              </code>
              {!matchingGrade && (
                 <Badge variant="outline" className="text-[10px] font-medium border-primary/20 text-primary/80">
                   Score: {totalMarks.obtained}/{totalMarks.full}
                 </Badge>
              )}
            </div>
          </div>

          {matchingGrade && (
            <div className="w-full grid grid-cols-3 gap-2 bg-muted/30 p-3 rounded-xl border border-border/40">
              <StatBox label="Grade" value={matchingGrade.grade} colorClass="text-foreground" />
              <div className="flex items-center justify-center border-x border-border/40">
                <StatBox label="Credits" value={matchingGrade.coursecreditpoint} colorClass="text-primary" />
              </div>
              <StatBox label="Total Score" value={`${totalPercentage.toFixed(0)}%`} colorClass="text-foreground" />
            </div>
          )}

          <Separator className="opacity-50" />

          <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">
              <span>Assessment</span>
              <span>Weightage</span>
            </div>
            
            <div className="space-y-3">
              {Object.entries(course.exams).map(([examName, marks], index) => {
                const percentage = (marks.OM / marks.FM) * 100;
                return (
                  <motion.div
                    key={examName}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <span className="text-xs md:text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                        {examName}
                      </span>
                      <div className="text-xs font-medium">
                        <span className="text-foreground">{marks.OM}</span>
                        <span className="text-muted-foreground/50 mx-1">/</span>
                        <span className="text-muted-foreground">{marks.FM}</span>
                      </div>
                    </div>
                    <ProgressBar 
                        percentage={percentage} 
                        color={getProgressColor(percentage)} 
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatBox({ label, value, colorClass }) {
  return (
    <div className="flex flex-col items-center justify-center px-1 text-center">
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mb-0.5">{label}</span>
      <span className={`text-base md:text-lg font-black leading-tight ${colorClass}`}>{value}</span>
    </div>
  );
}

function ProgressBar({ percentage, color }) {
  return (
    <div className="relative h-2 bg-muted rounded-full overflow-hidden border border-border/20">
      <motion.div
        className={`absolute top-0 left-0 h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(percentage, 2)}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}