import React from "react";
import { motion } from "framer-motion";

const GradeCard = ({ subject, getGradeColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#0B0B0D] rounded-lg p-4 shadow-md dark:bg-gray-50"
    >
      <div className="flex justify-between items-center py-1">
        <div className="flex-1 mr-4">
          <h2 className="text-sm max-[390px]:text-xs font-semibold">{subject.subjectdesc}</h2>
          <p className="text-sm max-[390px]:text-xs lg:text-base">{subject.subjectcode}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={`text-xl font-bold ${getGradeColor(subject.grade)}`}>{subject.grade}</div>
            <div className="text-xs text-gray-400">Grade</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-400">{subject.coursecreditpoint}</div>
            <div className="text-xs text-gray-400">Credits</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GradeCard;
