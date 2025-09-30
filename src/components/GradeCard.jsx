import React from "react";
import { motion } from "framer-motion";

const GradeCard = ({ subject, getGradeColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#0B0B0D] dark:bg-gray-50 rounded-lg p-4 md:p-6 shadow-md border border-gray-800 dark:border-gray-200"
    >
      <div className="flex items-center justify-between py-1 gap-4">
        <div className="md:col-span-2 flex-1 mr-4 w-full">
          <h2 className="text-base md:text-lg font-semibold">{subject.subjectdesc}</h2>
          <p className="text-sm md:text-base text-gray-400">{subject.subjectcode}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-xl md:text-2xl font-bold ${getGradeColor(subject.grade)}`}>{subject.grade}</div>
            <div className="text-xs md:text-sm text-gray-400">Grade</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-blue-400">{subject.coursecreditpoint}</div>
            <div className="text-xs md:text-sm text-gray-400">Credits</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GradeCard;
