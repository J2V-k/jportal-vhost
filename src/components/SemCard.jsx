import { motion } from "framer-motion";
import React from "react";

export default function SemCard({ semester, onClick }) {
  if (!semester) return null;

  const earnedPoints = Number(semester.earnedgradepoints || 0);
  const totalCredits = Number(semester.totalcoursecredit || 0);
  const maxPoints = totalCredits > 0 ? totalCredits * 10 : 0;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="w-full rounded-lg border border-border bg-card p-4 text-left shadow-md transition-all hover:border-primary/40 hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Section: Semester Header and Points Summary */}
        <div>
          <h4 className="text-base font-semibold text-foreground">Semester {semester.stynumber}</h4>
          <p className="text-xs text-muted-foreground">GP: {earnedPoints.toFixed(1)}/{maxPoints.toFixed(1)}</p>
        </div>

        {/* Right Section: Core Academic Performance Grids (Including Re-positioned Credits) */}
        <div className="flex items-center gap-4 text-center">
          <div className="min-w-[50px] border-r border-border/60 pr-2">
            <div className="text-lg font-bold text-foreground">{totalCredits.toFixed(1)}</div>
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Credits</div>
          </div>
          
          <div className="min-w-[45px]">
            <div className="text-lg font-bold text-green-400">{Number(semester.sgpa || 0).toFixed(2)}</div>
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider">SGPA</div>
          </div>

          <div className="min-w-[45px]">
            <div className="text-lg font-bold text-blue-400">{Number(semester.cgpa || 0).toFixed(2)}</div>
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider">CGPA</div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}