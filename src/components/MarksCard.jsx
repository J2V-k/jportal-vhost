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
      className="bg-[black] dark:bg-white rounded-lg p-3 sm:p-4 border border-gray-700 dark:border-gray-300"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.2 }}
        className="space-y-2 sm:space-y-3"
      >
        <h3 className="font-bold text-sm sm:text-base dark:text-black">{course.name}</h3>
        
        <div className="flex items-center justify-between gap-2 sm:gap-4 border-b border-gray-700/50 dark:border-gray-300/50">
          <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-600">
            {course.code}
          </span>

          {matchingGrade && (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`text-base sm:text-lg font-bold ${
                matchingGrade.grade === 'A+' || matchingGrade.grade === 'A' ? 'text-green-400 dark:text-green-600' :
                matchingGrade.grade === 'B+' || matchingGrade.grade === 'B' ? 'text-yellow-400 dark:text-yellow-600' :
                matchingGrade.grade === 'C+' || matchingGrade.grade === 'C' ? 'text-orange-400 dark:text-orange-600' :
                'text-red-400 dark:text-red-600'
              }`}>
                {matchingGrade.grade}
              </span>
              <div className="h-4 w-[1px] bg-gray-700 dark:bg-gray-300"></div>
              <span className="text-xs sm:text-sm font-medium text-blue-400 dark:text-blue-600 whitespace-nowrap">
                {matchingGrade.coursecreditpoint} credits
              </span>
              <div className="h-4 w-[1px] bg-gray-700 dark:bg-gray-300"></div>
              <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-600 whitespace-nowrap">
                  {totalMarks.obtained}/{totalMarks.full} Marks
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                ({((totalMarks.obtained / totalMarks.full) * 100).toFixed(1)}%)
                </span>
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="space-y-2 sm:space-y-3 pt-2"
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
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-xs text-gray-400 dark:text-gray-600 min-w-[60px] sm:min-w-[80px]">
                  {examName}
                </div>
                <div className="flex-1">
                  <ProgressBar percentage={percentage} color={getProgressColor(percentage)} />
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 * index, duration: 0.5 }}
                  className="text-xs sm:text-sm text-gray-400 dark:text-gray-600 min-w-[50px] sm:min-w-[60px] text-right"
                >
                  {marks.OM}/{marks.FM}
                </motion.span>
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

