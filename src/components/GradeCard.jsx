import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const GradeCard = ({ subject, getGradeColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card border border-border">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between py-1 gap-4">
            <div className="md:col-span-2 flex-1 mr-4 w-full">
              <h2 className="text-base md:text-lg font-semibold text-foreground">{subject.subjectdesc}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{subject.subjectcode}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-xl md:text-2xl font-bold ${getGradeColor(subject.grade)}`}>{subject.grade}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Grade</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-400">{subject.coursecreditpoint}</div>
                <div className="text-xs md:text-sm text-muted-foreground">Credits</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GradeCard;
