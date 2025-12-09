import React from "react"
import { motion } from "framer-motion"

export default function MarksCard({ course, gradeInfo }) {
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500"
    if (percentage >= 60) return "bg-yellow-500"
    if (percentage >= 40) return "bg-orange-500"
    return "bg-red-500"
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
      className="bg-[black] dark:bg-white rounded-lg p-3 sm:p-4 md:p-5 border border-gray-700 dark:border-gray-300 md:hover:shadow-lg transition-shadow duration-200"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.2 }}
        className="space-y-3 md:space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
          <div className="flex-1">
            <h3 className="font-bold text-sm sm:text-base md:text-lg dark:text-black mb-1">{course.name}</h3>
            <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-600">
              {course.code}
              {!matchingGrade && (
                <>
                  {" "}
                  <span className="mx-1">•</span>
                  <span className="text-gray-300 dark:text-gray-700">
                    {totalMarks.obtained}/{totalMarks.full}
                  </span>
                </>
              )}
            </span>
          </div>

          {matchingGrade && (
            <div className="flex items-center gap-3 md:gap-6 py-2 md:py-0 border-t md:border-t-0 border-gray-700/50 dark:border-gray-300/50">
              <div className="flex items-center gap-2">
                <span className={`text-base md:text-2xl font-bold ${
                  matchingGrade.grade === 'A+' || matchingGrade.grade === 'A' ? 'text-green-400 dark:text-green-600' :
                  matchingGrade.grade === 'B+' || matchingGrade.grade === 'B' ? 'text-yellow-400 dark:text-yellow-600' :
                  matchingGrade.grade === 'C+' || matchingGrade.grade === 'C' ? 'text-orange-400 dark:text-orange-600' :
                  'text-red-400 dark:text-red-600'
                }`}>
                  {matchingGrade.grade}
                </span>
                <span className="text-xs md:text-sm text-gray-400 dark:text-gray-600">Grade</span>
              </div>
              <div className="h-4 w-[1px] bg-gray-700 dark:bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-base md:text-xl font-bold text-blue-400 dark:text-blue-600">{matchingGrade.coursecreditpoint}</span>
                <span className="text-xs md:text-sm text-gray-400 dark:text-gray-600">Credits</span>
              </div>
              <div className="h-4 w-[1px] bg-gray-700 dark:bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-base md:text-xl font-bold text-gray-300 dark:text-gray-700">{totalMarks.obtained}/{totalMarks.full}</span>
                <span className="text-xs md:text-sm text-gray-400 dark:text-gray-600">{((totalMarks.obtained / totalMarks.full) * 100).toFixed(1)}%</span>
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
                <div className="text-xs md:text-sm text-gray-400 dark:text-gray-600 min-w-[60px] sm:min-w-[80px] md:min-w-[100px] font-medium pr-2 sm:pr-4 md:pr-6">
                  {examName}
                </div>
                <div className="flex-1 min-w-0">
                  <ProgressBar percentage={percentage} color={getProgressColor(percentage)} />
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 * index, duration: 0.5 }}
                  className="flex items-center gap-2 min-w-[80px] md:min-w-[100px] justify-end pl-2 sm:pl-4 md:pl-6"
                >
                  <span className="text-sm md:text-base font-medium text-gray-300 dark:text-gray-700">
                    {marks.OM}
                  </span>
                  <span className="text-xs md:text-sm text-gray-500 dark:text-gray-500">
                    / {marks.FM}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}

function ProgressBar({ percentage, color }) {
  return (
    <div className="relative h-1.5 sm:h-2 bg-gray-700 dark:bg-gray-300 rounded-full overflow-hidden">
      <motion.div
        className={`absolute top-0 left-0 h-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  )
}

