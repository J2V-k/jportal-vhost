import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calculator, Plus, Trash2, BookOpen, GraduationCap, Loader2, RefreshCw } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { motion } from "framer-motion"

export default function CGPATargetCalculator({ 
  w,
  semesterData: sd = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sgpa");
  
  const [subjectSemesters, setSubjectSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [subjectData, setSubjectData] = useState({});
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  
  let initialSemesters =
    Array.isArray(sd) && sd.length > 0
      ? sd.map((s, index) => {
          return {
            g: s.sgpa ? s.sgpa.toString() : "",
            c: s.totalcoursecredit ? s.totalcoursecredit.toString() : "",
          };
        })
      : [
          { g: "", c: "" },
          { g: "", c: "" },
        ];
  const lastCredits = sd?.[sd.length - 1]?.totalcoursecredit || "";
  initialSemesters = [
    ...initialSemesters,
    { g: "", c: lastCredits ? lastCredits.toString() : "" },
  ];
  const [cgpaSemesters, setCgpaSemesters] = useState([{ g: "", c: "" }]);
  const maxSemesters = 10;

  const [sgpaSubjects, setSgpaSubjects] = useState([]);

  useEffect(() => {
    const cached = localStorage.getItem('cgpaCalculatorSemesters');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCgpaSemesters(parsed);
        }
      } catch (error) {
        console.error('Failed to parse cached CGPA semesters:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cgpaCalculatorSemesters', JSON.stringify(cgpaSemesters));
  }, [cgpaSemesters]);

  useEffect(() => {
    if (sd && Array.isArray(sd) && sd.length > 0) {
      const updatedSemesters = sd.map((s) => ({
        g: s.sgpa ? s.sgpa.toString() : "",
        c: s.totalcoursecredit ? s.totalcoursecredit.toString() : "",
      }));
      
      const lastCredits = sd[sd.length - 1]?.totalcoursecredit || "";
      updatedSemesters.push({ g: "", c: lastCredits ? lastCredits.toString() : "" });
      
      setCgpaSemesters(updatedSemesters);
    } else {
      setCgpaSemesters([{ g: "", c: "" }]);
    }
  }, [sd]);

  useEffect(() => {
    if (selectedSemester && w && !subjectData[selectedSemester.registration_id]) {
      fetchSubjectsForSemester(selectedSemester);
    }
  }, [selectedSemester, w]);

  useEffect(() => {
    if (isOpen && activeTab === "sgpa" && w && subjectSemesters.length === 0) {
      fetchSubjectSemesters();
    }
  }, [isOpen, activeTab, w, subjectSemesters.length]);

  const fetchSubjectSemesters = async () => {
    setIsLoadingSemesters(true);
    try {
      const semesters = await w.get_registered_semesters();
      setSubjectSemesters(semesters);
      
      if (semesters.length > 0) {
        const currentYear = new Date().getFullYear().toString();
        const currentYearSemester = semesters.find(sem =>
          sem.registration_code && sem.registration_code.includes(currentYear)
        );
        setSelectedSemester(currentYearSemester || semesters[0]);
      }
    } catch (error) {
      console.error('Failed to fetch semesters:', error);
    } finally {
      setIsLoadingSemesters(false);
    }
  };

  const fetchSubjectsForSemester = async (semester) => {
    setIsLoadingSubjects(true);
    try {
      const subjects = await w.get_registered_subjects_and_faculties(semester);
      setSubjectData(prev => ({
        ...prev,
        [semester.registration_id]: subjects
      }));
      
      if (subjects?.subjects) {
        const processedSubjects = processSubjectsForSGPA(subjects.subjects);
        setSgpaSubjects(processedSubjects);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const processSubjectsForSGPA = (subjects) => {
    const groupedSubjects = subjects.reduce((acc, subject) => {
      const baseCode = subject.subject_code;
      if (!acc[baseCode] && subject.audtsubject !== "Y") {
        acc[baseCode] = {
          name: subject.subject_desc,
          code: baseCode,
          credits: parseInt(subject.credits) || 0,
          grade: "A",
          gradePoints: 9
        };
      }
      return acc;
    }, {});
    
    return Object.values(groupedSubjects);
  };

  const gradePointMap = {
    "A+": 10, "A": 9, "B+": 8, "B": 7, "C+": 6, "C": 5, "D": 4, "F": 0
  };

  const gradeOptions = ["A+", "A", "B+", "B", "C+", "C", "D", "F"];

  const handleGradeChange = (index, grade) => {
    setSgpaSubjects(prev => prev.map((subject, i) => 
      i === index 
        ? { ...subject, grade, gradePoints: gradePointMap[grade] || 0 }
        : subject
    ));
  };

  const calculateSGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    
    sgpaSubjects.forEach(subject => {
      if (subject.grade && subject.credits > 0) {
        totalPoints += subject.gradePoints * subject.credits;
        totalCredits += subject.credits;
      }
    });
    
    if (totalCredits === 0) return "-";
    return (totalPoints / totalCredits).toFixed(2);
  };

  const handleSemesterChange = (semesterId) => {
    const semester = subjectSemesters.find(sem => sem.registration_id === semesterId);
    setSelectedSemester(semester);
    
    if (semester && w) {
      fetchSubjectsForSemester(semester);
    }
  };

  const handleCgpaChange = (i, f, v) => {
    setCgpaSemesters((prev) =>
      prev.map((sem, j) => {
        if (j !== i) return sem;
        let val = v.replace(/[^\d.]/g, "");
        if (f === "g") {
          let n = parseFloat(val);
          if (!isNaN(n)) {
            if (n > 10) n = 10;
            val = n.toString();
          }
        }
        return { ...sem, [f]: val };
      })
    );
  };

  const addSemester = () => {
    if (cgpaSemesters.length < maxSemesters) {
      setCgpaSemesters([...cgpaSemesters, { g: "", c: "" }]);
    }
  };

  const removeSemester = (i) => {
    if (cgpaSemesters.length > 1) {
      setCgpaSemesters(cgpaSemesters.filter((_, j) => j !== i));
    }
  };

  const calculateProjectedCGPA = () => {
    const currentSgpa = parseFloat(calculateSGPA());
    if (isNaN(currentSgpa) || currentSgpa === 0) return "-";
    
    let currentCredits = 0;
    sgpaSubjects.forEach(subject => {
      if (subject.credits > 0) {
        currentCredits += subject.credits;
      }
    });
    
    if (currentCredits === 0) return "-";
    
    let previousGradePoints = 0;
    let previousCredits = 0;
    
    if (sd && Array.isArray(sd)) {
      sd.forEach(sem => {
        const sgpa = parseFloat(sem.sgpa);
        const credits = parseFloat(sem.totalcoursecredit);
        if (!isNaN(sgpa) && !isNaN(credits)) {
          previousGradePoints += sgpa * credits;
          previousCredits += credits;
        }
      });
    }
    
    const totalGradePoints = previousGradePoints + (currentSgpa * currentCredits);
    const totalCredits = previousCredits + currentCredits;
    
    if (totalCredits === 0) return "-";
    return (totalGradePoints / totalCredits).toFixed(2);
  };

  const calculateCGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    cgpaSemesters.forEach(({ g, c }) => {
      const sgpa = parseFloat(g);
      const credits = parseFloat(c);
      if (!isNaN(sgpa) && !isNaN(credits)) {
        totalPoints += sgpa * credits;
        totalCredits += credits;
      }
    });
    if (totalCredits === 0) return "-";
    return (totalPoints / totalCredits).toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="aspect-square md:aspect-auto bg-[#0B0B0D] dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-gray-200 dark:text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-600 dark:border-gray-300"
        >
          <Calculator className="w-8 h-8 md:w-6 md:h-6 mb-2 text-gray-400 dark:text-gray-600" />
          <span className="text-xs font-medium text-center">GPA Calculator</span>
        </motion.button>
      </DialogTrigger>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl md:max-w-3xl lg:max-w-5xl max-h-[90vh] p-0 bg-black dark:bg-white text-white dark:text-black rounded-lg overflow-hidden z-50">
        <DialogHeader className="sticky top-0 z-10 bg-gradient-to-r from-black to-black dark:from-white dark:to-white p-4 md:p-5 border-b border-gray-700 dark:border-gray-300 shadow-lg">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-lg md:text-xl font-bold text-white dark:text-black">
              <div className="p-2 bg-white dark:bg-black rounded-lg">
                <Calculator className="w-5 h-5 md:w-6 md:h-6 text-black dark:text-white" />
              </div>
              GPA Calculator
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="outline" className="h-9 md:h-10 px-4 md:px-6 text-sm md:text-base font-semibold bg-white dark:bg-black text-black dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all rounded-lg">
                Close Calculator
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mx-4 md:mx-6 mt-2 md:mt-2 bg-gradient-to-r from-black to-black dark:from-white dark:to-white h-11 md:h-13 rounded-xl border border-gray-600 dark:border-gray-400">
            <TabsTrigger 
              value="sgpa" 
              className="flex items-center gap-2 text-xs md:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-white data-[state=active]:to-white data-[state=active]:text-black dark:data-[state=active]:from-black dark:data-[state=active]:to-black dark:data-[state=active]:text-white text-gray-300 dark:text-gray-600 hover:text-white dark:hover:text-black transition-all rounded-lg m-1"
            >
              <BookOpen className="w-4 h-4" />
              SGPA Calculator
            </TabsTrigger>
            <TabsTrigger 
              value="cgpa"
              className="flex items-center gap-2 text-xs md:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-white data-[state=active]:to-white data-[state=active]:text-black dark:data-[state=active]:from-black dark:data-[state=active]:to-black dark:data-[state=active]:text-white text-gray-300 dark:text-gray-600 hover:text-white dark:hover:text-black transition-all rounded-lg m-1"
            >
              <GraduationCap className="w-4 h-4" />
              CGPA Calculator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sgpa" className="max-h-[70vh] min-h-[300px] md:min-h-[350px] overflow-y-auto px-4 md:px-6 space-y-4 md:space-y-5 py-2">
            <div className="space-y-3 md:space-y-4">
              <Select onValueChange={handleSemesterChange} value={selectedSemester?.registration_id || ""}>
                <SelectTrigger className="w-full md:max-w-sm h-11 md:h-12 bg-gradient-to-r from-black to-black dark:from-white dark:to-white text-white dark:text-black border-2 border-gray-600 dark:border-gray-400 hover:border-gray-400 dark:hover:border-gray-600 text-sm rounded-lg transition-all shadow-lg">
                  <SelectValue placeholder={isLoadingSemesters ? "Loading semesters..." : "Choose your semester"} />
                </SelectTrigger>
                <SelectContent className="bg-[#0B0B0D] dark:bg-white border-gray-700 dark:border-gray-300 text-white dark:text-black">
                  {subjectSemesters.map((semester) => (
                    <SelectItem 
                      key={semester.registration_id} 
                      value={semester.registration_id}
                      className="text-white dark:text-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white focus:bg-white focus:text-black dark:focus:bg-black dark:focus:text-white"
                    >
                      {semester.registration_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {isLoadingSemesters && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-400 dark:text-gray-600">Loading semesters...</span>
                </div>
              )}
            </div>

            {selectedSemester && (
              <>
                {isLoadingSubjects ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-400 dark:text-gray-600">Loading subjects...</span>
                  </div>
                ) : sgpaSubjects.length > 0 ? (
                  <>
                    <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
                      {sgpaSubjects.map((subject, index) => (
                        <div key={index} className="bg-[#0B0B0D] dark:bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-700 dark:border-gray-300 hover:border-gray-600 dark:hover:border-gray-400 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm md:text-base font-medium text-white dark:text-black mb-2">
                                {subject.name}
                              </div>
                              <div className="flex items-center gap-3 text-xs md:text-sm">
                                <span className="px-2 py-1 bg-gray-800 dark:bg-gray-200 text-gray-300 dark:text-gray-700 rounded text-xs font-medium">{subject.code}</span>
                                <span className="text-gray-400 dark:text-gray-600">{subject.credits} credits</span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 w-20 md:w-24">
                              <Select 
                                value={subject.grade} 
                                onValueChange={(grade) => handleGradeChange(index, grade)}
                              >
                                  <SelectTrigger className="w-full h-9 md:h-10 bg-[#000000] dark:bg-white text-white dark:text-black border-gray-600 dark:border-gray-400 text-sm font-medium">
                                  <SelectValue placeholder="Grade" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0B0B0D] dark:bg-white border-gray-700 dark:border-gray-300 text-white dark:text-black">
                                  {gradeOptions.map(grade => (
                                    <SelectItem 
                                      key={grade} 
                                      value={grade}
                                      className="text-white dark:text-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white focus:bg-white focus:text-black dark:focus:bg-black dark:focus:text-white"
                                    >
                                      {grade}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 space-y-3">
                    

        
                      <div className="p-4 md:p-5 rounded-lg bg-[#000000] dark:bg-gray-50 border border-gray-700 dark:border-gray-300 flex items-center justify-between max-w-md mx-auto">
                        <span className="text-sm md:text-base text-gray-400 dark:text-gray-600 font-medium">Calculated SGPA</span>
                        <span className={`text-2xl md:text-3xl font-bold ${
                          calculateSGPA() !== "-" && parseFloat(calculateSGPA()) < 6 
                            ? "text-red-500 dark:text-red-600" 
                            : "text-white dark:text-black"
                        }`}>
                          {calculateSGPA()}
                        </span>
                      </div>
                      <div className="p-4 md:p-5 rounded-lg bg-[#000000] dark:bg-gray-50 border border-gray-700 dark:border-gray-300 flex items-center justify-between max-w-md mx-auto">
                        <span className="text-sm md:text-base text-gray-400 dark:text-gray-600 font-medium">Projected CGPA</span>
                        <span className={`text-2xl md:text-3xl font-bold ${
                          calculateProjectedCGPA() !== "-" && parseFloat(calculateProjectedCGPA()) < 6 
                            ? "text-red-500 dark:text-red-600" 
                            : "text-white dark:text-black"
                        }`}>
                          {calculateProjectedCGPA()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 dark:text-gray-600">
                      No subjects found for this semester
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="cgpa" className="max-h-[70vh] min-h-[300px] md:min-h-[350px] overflow-y-auto px-4 md:px-6 py-4 space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
                {cgpaSemesters.map((sem, i) => (
                  <div key={i} className={`bg-[#0B0B0D] dark:bg-gray-50 rounded-lg p-3 md:p-4 border transition-colors ${
                    i < (sd?.length || 0) 
                      ? "border-blue-700 dark:border-blue-300 bg-blue-900/10 dark:bg-blue-50/10" 
                      : "border-gray-700 dark:border-gray-300 hover:border-gray-600 dark:hover:border-gray-400"
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <label className="block text-sm md:text-base font-medium text-white dark:text-black">
                          Sem {i + 1} {i < (sd?.length || 0) ? "(Previous)" : ""}
                        </label>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs md:text-sm text-gray-400 dark:text-gray-600 mb-1">SGPA</label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.01"
                            placeholder="0.00"
                            value={sem.g}
                            onChange={e => handleCgpaChange(i, "g", e.target.value)}
                            className={`h-8 md:h-9 text-xs md:text-sm ${
                              i < (sd?.length || 0)
                                ? "bg-blue-900/30 dark:bg-blue-50/30 border-blue-600 dark:border-blue-400 text-blue-100 dark:text-blue-900"
                                : "bg-[#000000] dark:bg-white border-gray-600 dark:border-gray-400 text-white dark:text-black"
                            }`}
                            inputMode="decimal"
                            readOnly={i < (sd?.length || 0)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs md:text-sm text-gray-400 dark:text-gray-600 mb-1">Credits</label>
                          <Input
                            type="number"
                            min="0"
                            max="40"
                            step="0.01"
                            placeholder="0"
                            value={sem.c}
                            onChange={e => handleCgpaChange(i, "c", e.target.value)}
                            className={`h-8 md:h-9 text-xs md:text-sm ${
                              i < (sd?.length || 0)
                                ? "bg-blue-900/30 dark:bg-blue-50/30 border-blue-600 dark:border-blue-400 text-blue-100 dark:text-blue-900"
                                : "bg-[#000000] dark:bg-white border-gray-600 dark:border-gray-400 text-white dark:text-black"
                            }`}
                            inputMode="decimal"
                            readOnly={i < (sd?.length || 0)}
                          />
                        </div>
                      </div>
                      {i === cgpaSemesters.length - 1 && cgpaSemesters.length > 1 && i >= (sd?.length || 0) && (
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => removeSemester(i)}
                            aria-label="Remove semester"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mt-6">
                <div className="flex justify-center md:justify-start w-full md:w-auto">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2 bg-white dark:bg-black text-black dark:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 px-6 md:px-8 h-10 md:h-11 text-sm md:text-base font-semibold rounded-lg transition-all w-full md:w-auto"
                    onClick={addSemester}
                    disabled={cgpaSemesters.length >= maxSemesters}
                    type="button"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" /> Add Semester
                  </Button>
                </div>
                
                <div className="flex-1 h-10 md:h-11 px-4 md:px-5 rounded-lg bg-[#000000] dark:bg-gray-50 border border-gray-700 dark:border-gray-300 flex items-center justify-between w-full">
                  <span className="text-sm md:text-base text-gray-400 dark:text-gray-600 font-medium">Calculated CGPA</span>
                  <span className="text-xl md:text-2xl font-bold text-white dark:text-black">{calculateCGPA()}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
