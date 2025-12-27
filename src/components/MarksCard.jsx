import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

export default function MarksCard({ course, gradeInfo }) {
  const getProgressColor = (percentage) => {
    if (percentage >= 75) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]";
    if (percentage >= 50) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]";
    return "bg-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.4)]";
  }

  const matchingGrade = gradeInfo?.gradecard?.find(
    (g) => g.subjectcode === course.code
  );

  const totalMarks = Object.values(course.exams).reduce(
    (acc, exam) => ({
      obtained: acc.obtained + exam.OM,
      full: acc.full + exam.FM
    }),
    { obtained: 0, full: 0 }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="bg-card border border-border md:hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-3 sm:p-4 md:p-5 bg-card">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            className="space-y-3 md:space-y-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-6">
              <div className="flex-1">
                <h3 className="font-bold text-sm sm:text-base md:text-lg text-foreground mb-1">{course.name}</h3>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {course.code}
                  {!matchingGrade && (
                    <>
                      {" "}
                      <span className="mx-1">•</span>
                      <span className="text-muted-foreground">
                        {totalMarks.obtained}/{totalMarks.full}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}({((totalMarks.obtained / totalMarks.full) * 100).toFixed(1)}%)
                      </span>
                    </>
                  )}
                </span>
              </div>

              {matchingGrade && (
                <div className="flex items-center gap-3 md:gap-6 py-2 md:py-0 border-t md:border-t-0 border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-base md:text-2xl font-bold text-foreground">
                      {matchingGrade.grade}
                    </span>
                    <span className="text-xs md:text-sm text-muted-foreground">Grade</span>
                  </div>
                  <div className="h-4 w-[1px] bg-muted/10"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-base md:text-xl font-bold text-primary">{matchingGrade.coursecreditpoint}</span>
                    <span className="text-xs md:text-sm text-muted-foreground">Credits</span>
                  </div>
                  <div className="h-4 w-[1px] bg-muted/10"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-base md:text-xl font-bold text-foreground">{totalMarks.obtained}/{totalMarks.full}</span>
                    <span className="text-xs md:text-sm text-muted-foreground">{((totalMarks.obtained / totalMarks.full) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-2 sm:space-y-3 md:space-y-4 pt-2 md:pt-4"
          >
            {Object.entries(course.exams).map(([examName, marks], index) => {
              const percentage = (marks.OM / marks.FM) * 100
              return (
                <motion.div
                  key={examName}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                >
                  <div className="flex items-center">
                    <div className="text-xs md:text-sm text-muted-foreground w-[60px] sm:w-[80px] md:w-[100px] font-medium pr-2 sm:pr-4 md:pr-6 truncate">
                      {examName}
                    </div>
                    <div className="flex-1 min-w-0">
                      <ProgressBar percentage={percentage} color={getProgressColor(percentage)} />
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 * index, duration: 0.5 }}
                      className="flex items-center gap-2 min-w-[80px] md:min-w-[100px] justify-end"
                    >
                      <span className="text-sm md:text-base font-medium text-foreground">
                        {marks.OM}
                      </span>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        / {marks.FM}
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ProgressBar({ percentage, color }) {
  return (
    <div className="relative h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
      <motion.div
        className={`absolute top-0 left-0 h-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(percentage, 2)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  )
}

