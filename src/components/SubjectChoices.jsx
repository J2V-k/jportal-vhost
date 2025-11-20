import React from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

export default function SubjectChoices({ currentChoices, choicesLoading, semesterName }) {
  if (choicesLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)]"
      >
        <Loader2 className="w-8 h-8 animate-spin text-white dark:text-black" />
        <span className="ml-2 text-white dark:text-black">Loading subject choices...</span>
      </motion.div>
    )
  }

  if (currentChoices?.subjectpreferencegrid?.length > 0) {
    return (
      <div className="space-y-8">
        {semesterName && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-white dark:text-black mb-2">
              {semesterName} Subject Choices
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-600">
              Preview available electives and your current preferences
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
              className="border border-white/20 dark:border-black/20 rounded-xl p-6 bg-[#0B0B0D] dark:bg-gray-50 hover:border-white/30 dark:hover:border-black/30 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white dark:text-black">
                  {basket.name}
                </h3>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10 dark:bg-black/10 text-gray-300 dark:text-gray-600">
                  {basket.subjects.length} subjects
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {basket.subjects
                  .sort((a, b) => a.preference - b.preference)
                  .map((subject) => {
                    const showNumbering = basket.code !== "CORE" && basket.code !== "CORE-AUDIT"
                    return (
                      <div
                        key={subject.subjectid}
                        className={`group p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                          subject.running === "Y"
                            ? "border-green-500/50 bg-green-500/10 hover:bg-green-500/15"
                            : "border-white/10 dark:border-black/10 bg-[#1A1A1D] dark:bg-gray-100 hover:bg-[#202025] dark:hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {showNumbering && (
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                subject.running === "Y"
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-600 dark:bg-gray-300 text-gray-200 dark:text-gray-700 group-hover:bg-gray-500 dark:group-hover:bg-gray-400"
                              }`}
                            >
                              {subject.preference}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-white dark:text-black text-sm leading-tight">
                                {subject.subjectdesc}
                              </h4>
                              {subject.running === "Y" && (
                                <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-green-500 text-white">
                                  ✓ Allotted
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mb-2">
                              <span className="font-mono bg-white/10 dark:bg-black/10 px-2 py-1 rounded">
                                {subject.subjectcode}
                              </span>
                              <span className="font-medium">
                                {subject.credits} Credits
                              </span>
                            </div>
                            {subject.electivetype === "Y" && (
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 dark:text-blue-700 text-xs font-medium">
                                  {subject.subjecttypedesc}
                                </span>
                              </div>
                            )}
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
              className="border border-white/20 dark:border-black/20 rounded-lg p-4 bg-[#0B0B0D] dark:bg-gray-50"
            >
              <h3 className="text-lg font-semibold text-white dark:text-black mb-4">
                {basket.name}
              </h3>

              <div className="space-y-3">
                {basket.subjects
                  .sort((a, b) => a.preference - b.preference)
                  .map((subject) => {
                    const showNumbering = basket.code !== "CORE" && basket.code !== "CORE-AUDIT"
                    return (
                      <div
                        key={subject.subjectid}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          subject.running === "Y"
                            ? "border-accent bg-accent/5"
                            : "border-white/10 dark:border-black/10 bg-[#1A1A1D] dark:bg-gray-100"
                        }`}
                      >
                        {showNumbering && (
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              subject.running === "Y"
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {subject.preference}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white dark:text-black">
                                {subject.subjectdesc}
                              </h4>
                              <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">
                                {subject.subjectcode} • {subject.credits} Credits
                              </p>
                            </div>
                            {subject.running === "Y" && (
                              <span className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-accent text-accent-foreground">
                                Allotted
                              </span>
                            )}
                          </div>
                          {subject.electivetype === "Y" && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                              <span className="px-2 py-0.5 rounded bg-gray-700 dark:bg-gray-200 text-gray-300 dark:text-gray-700">
                                {subject.subjecttypedesc}
                              </span>
                            </div>
                          )}
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
      <div className="text-center bg-[#0B0B0D] dark:bg-gray-50 rounded-lg p-6 max-w-md">
        <p className="text-gray-400 dark:text-gray-600">No subject choices available for this semester.</p>
      </div>
    </motion.div>
  )
}