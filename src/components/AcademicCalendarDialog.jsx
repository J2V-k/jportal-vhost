import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Target, X } from "lucide-react";
import AcademicCalendar from "./AcademicCalendar";

const AcademicCalendarDialog = ({ children }) => {
  const [open, setOpen] = React.useState(false);

  const scrollToToday = () => {
    const element = document.getElementById('today');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] bg-black text-white border border-white/10 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-white flex items-center gap-2">
            <Calendar size={18} />
            Academic Calendar
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-4">
          <AcademicCalendar isDialog />
        </div>
        <DialogFooter className="flex flex-row items-center border-t border-white/10 pt-4 flex-shrink-0">
          <button
            onClick={scrollToToday}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#0B0D0D] border border-white/20 text-white rounded-lg hover:bg-[#1A1A1D] transition-colors text-sm mr-1"
          >
            <Target size={14} />
            Today
          </button>
          <button
            onClick={() => setOpen(false)}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#0B0D0D] border border-white/20 text-white rounded-lg hover:bg-[#1A1A1D] transition-colors text-sm ml-1"
          >
            <X size={14} />
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AcademicCalendarDialog;