import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calculator, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

export default function CGPATargetCalculator({ semesterData: sd = [] }) {
  const [o, so] = useState(false);
  let is =
    Array.isArray(sd) && sd.length > 0
      ? sd.map((s) => ({
          g: s.sgpa?.toString() || "",
          c: s.totalcoursecredit?.toString() || "",
        }))
      : [
          { g: "", c: "" },
          { g: "", c: "" },
        ];
  const lc = sd?.[sd.length - 1]?.totalcoursecredit || "";
  is = [
    ...is,
    { g: "", c: lc ? lc.toString() : "" },
  ];
  const [s, ss] = useState(is);
  const mx = 10;

  const hc = (i, f, v) => {
    ss((p) =>
      p.map((sm, j) => {
        if (j !== i) return sm;
        let val = v.replace(/[^\d.]/g, "");
        if (f === "g") {
          let n = parseFloat(val);
          if (!isNaN(n)) {
            if (n > 10) n = 10;
            val = n.toString();
          }
        }
        return { ...sm, [f]: val };
      })
    );
  };

  const ha = () => {
    if (s.length < mx) {
      ss([...s, { g: "", c: "" }]);
    }
  };

  const hr = (i) => {
    if (s.length > 1) {
      ss(s.filter((_, j) => j !== i));
    }
  };

  const cg = () => {
    let tp = 0;
    let tc = 0;
    s.forEach(({ g, c }) => {
      const sg = parseFloat(g);
      const cr = parseFloat(c);
      if (!isNaN(sg) && !isNaN(cr)) {
        tp += sg * cr;
        tc += cr;
      }
    });
    if (tc === 0) return "-";
    return (tp / tc).toFixed(2);
  };

  return (
    <Dialog open={o} onOpenChange={so}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 w-full justify-center bg-white dark:bg-black text-black dark:text-white border border-gray-300 dark:border-gray-700">
          <Calculator className="w-5 h-5" />
          CGPA Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full p-0 bg-black dark:bg-gray-50 text-white dark:text-black rounded-lg overflow-hidden relative">
        <DialogHeader className="sticky top-0 z-10 bg-black dark:bg-gray-50 p-4 border-b border-gray-700 dark:border-gray-300">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            CGPA Calculator
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-gray-400 hover:text-red-500" aria-label="Close dialog" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="max-h-[70vh] min-h-[300px] overflow-y-auto px-4 py-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <div className="flex flex-col gap-4">
            {s.map((sm, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#0B0B0D] dark:bg-white/80 rounded-md p-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 dark:text-gray-600 mb-1">Semester {i + 1}</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      placeholder="SGPA"
                      value={sm.g}
                      onChange={e => hc(i, "g", e.target.value)}
                      className="bg-[#0f1013] dark:bg-white border-gray-700 dark:border-gray-300 w-24"
                      inputMode="decimal"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="40"
                      step="0.01"
                      placeholder="Credits"
                      value={sm.c}
                      onChange={e => hc(i, "c", e.target.value)}
                      className="bg-[#0f1013] dark:bg-white border-gray-700 dark:border-gray-300 w-24"
                      inputMode="decimal"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-gray-400 hover:text-red-500"
                  onClick={() => hr(i)}
                  disabled={s.length === 1 || i !== s.length - 1}
                  aria-label="Remove semester"
                  type="button"
                  style={i !== s.length - 1 ? { visibility: 'hidden' } : {}}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 text-white dark:text-black border-none"
              onClick={ha}
              disabled={s.length >= mx}
              type="button"
            >
              <Plus className="w-4 h-4" /> Add Semester
            </Button>
          </div>
          <div className="mt-4 p-4 rounded-lg bg-[#0f1013] dark:bg-white/80 flex flex-col items-center">
            <span className="text-sm text-gray-400 dark:text-gray-600 mb-1">Calculated CGPA</span>
            <span className="text-2xl font-bold text-blue-400 dark:text-blue-600">{cg()}</span>
          </div>
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="w-full mt-2 bg-white dark:bg-black text-black dark:text-white border border-gray-300 dark:border-gray-700">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
