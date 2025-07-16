import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"

export default function CGPATargetCalculator({ currentCGPA, totalCredits, nextSemesterCredits }) {
  const [targetCGPA, setTargetCGPA] = useState("")
  const [requiredSGPA, setRequiredSGPA] = useState(null)

  const calculateRequiredSGPA = () => {
    const target = Number.parseFloat(targetCGPA)
    if (isNaN(target) || target < 0 || target > 10) {
      return
    }

    // Calculate required SGPA using the formula:
    // (Target CGPA × Total future credits - Current CGPA × Current total credits) / Next semester credits
    const requiredGradePoints = target * (totalCredits + nextSemesterCredits) - currentCGPA * totalCredits
    const required = requiredGradePoints / nextSemesterCredits

    setRequiredSGPA(Math.round(required * 100) / 100)
  }

  return (
    <div className="bg-[#0B0B0D] dark:bg-gray-50 p-4 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calculator className="w-5 h-5" />
        CGPA Target Calculator
      </h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-400 dark:text-gray-600">Target CGPA</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={targetCGPA}
              onChange={(e) => setTargetCGPA(e.target.value)}
              placeholder="Enter target CGPA"
              min="0"
              max="10"
              step="0.01"
              className="bg-[#2C3138] dark:bg-white border-gray-700 dark:border-gray-300"
            />
            <Button
              onClick={calculateRequiredSGPA}
              className="bg-white dark:bg-black hover:bg-gray-200 dark:hover:bg-gray-800 text-black dark:text-white"
            >
              Calculate
            </Button>
          </div>
        </div>

        {requiredSGPA !== null && (
          <div className="p-4 rounded-lg bg-[#2C3138] dark:bg-white space-y-2">
            <div className="text-sm text-gray-400 dark:text-gray-600">Required SGPA for next semester</div>
            {requiredSGPA > 10 ? (
              <div className="text-red-400 font-semibold">Target CGPA is not achievable in one semester</div>
            ) : requiredSGPA < 0 ? (
              <div className="text-green-400 font-semibold">Target CGPA is already achieved!</div>
            ) : (
              <div className="text-2xl font-bold text-blue-400 dark:text-blue-600">{requiredSGPA.toFixed(2)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
