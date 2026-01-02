import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, BookOpen, GraduationCap, Loader2, Target, TrendingUp, Award } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFromCache } from "@/components/scripts/cache"
import { Helmet } from 'react-helmet-async'

export default function CGPATargetCalculator({ w }) {
  const [activeTab, setActiveTab] = useState("sgpa");

  const [subjectSemesters, setSubjectSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [subjectData, setSubjectData] = useState({});
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [fetchedSemesters, setFetchedSemesters] = useState([]);

  const initialSemesters = [
    { g: "", c: "" },
    { g: "", c: "" },
  ];
  const [cgpaSemesters, setCgpaSemesters] = useState(() => initialSemesters);
  const maxSemesters = 10;

  const [sgpaSubjects, setSgpaSubjects] = useState([]);
  const [targetCgpa, setTargetCgpa] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchSemesters = async () => {
      try {
        try {
          const data = await w.get_sgpa_cgpa();
          if (!mounted) return;
          if (data && Array.isArray(data.semesterList) && data.semesterList.length > 0) {
            setFetchedSemesters(data.semesterList);
            const updatedSemesters = data.semesterList.map((s) => ({
              g: s.sgpa ? s.sgpa.toString() : "",
              c: s.totalcoursecredit ? s.totalcoursecredit.toString() : "",
            }));
            const lastCredits = data.semesterList[data.semesterList.length - 1]?.totalcoursecredit || "";
            updatedSemesters.push({ g: "", c: lastCredits ? lastCredits.toString() : "" });
            setCgpaSemesters(updatedSemesters);
            return;
          }
        } catch (err) {
          console.warn('Failed to fetch sgpa/cgpa from portal for CGPA calculator, will try cache:', err);
        }

        const cached = localStorage.getItem('cgpaCalculatorSemesters');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) setCgpaSemesters(parsed);
          } catch (e) { }
        }
      } catch (error) {
        console.error('Failed to fetch semester data for CGPA calculator:', error);
      }
    };

    fetchSemesters();
    return () => { mounted = false; };
  }, [w]);

  useEffect(() => {
    localStorage.setItem('cgpaCalculatorSemesters', JSON.stringify(cgpaSemesters));
  }, [cgpaSemesters]);


  useEffect(() => {
    const cachedTargetCgpa = localStorage.getItem('cgpaCalculatorTargetCgpa');
    if (cachedTargetCgpa) {
      setTargetCgpa(cachedTargetCgpa);
    }

    const cachedSelectedSemester = localStorage.getItem('cgpaCalculatorSelectedSemester');
    if (cachedSelectedSemester) {
      try {
        const parsed = JSON.parse(cachedSelectedSemester);
        setSelectedSemester(parsed);
      } catch (e) {
        console.error('Failed to parse cached selected semester:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cgpaCalculatorTargetCgpa', targetCgpa);
  }, [targetCgpa]);

  useEffect(() => {
    if (selectedSemester) {
      localStorage.setItem('cgpaCalculatorSelectedSemester', JSON.stringify(selectedSemester));
    }
  }, [selectedSemester]);

  useEffect(() => {
    if (selectedSemester && w && !subjectData[selectedSemester.registration_id]) {
      fetchSubjectsForSemester(selectedSemester);
    }
  }, [selectedSemester, w]);

  useEffect(() => {
    if (activeTab === "sgpa" && w && subjectSemesters.length === 0) {
      fetchSubjectSemesters();
    }
  }, [activeTab, w, subjectSemesters.length]);

  const fetchSubjectSemesters = async () => {
    setIsLoadingSemesters(true);
    try {
      try {
        const semesters = await w.get_registered_semesters();
        if (semesters && semesters.length > 0) {
          setSubjectSemesters(semesters);
          const currentYear = new Date().getFullYear().toString();
          const currentYearSemester = semesters.find(sem =>
            sem.registration_code && sem.registration_code.includes(currentYear)
          );
          setSelectedSemester(currentYearSemester || semesters[0]);
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch registered semesters from portal, will try cache:', err);
      }

      try {
        const cached = localStorage.getItem('subjectSemestersData');
        if (cached) {
          const parsed = JSON.parse(cached);
          setSubjectSemesters(parsed || []);
        }
      } catch (err) {
        console.error('Failed to load cached subject semesters:', err);
      }
    } catch (error) {
      console.error('Failed to fetch subject semesters:', error);
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

        try {
          const username = w?.username || "user";
          const cacheKey = `marks-${semester.registration_code}-${username}`;
          const cached = await getFromCache(cacheKey);
          const marksMap = {};
          if (cached && cached.data && Array.isArray(cached.data.courses)) {
            cached.data.courses.forEach((course) => {
              const total = Object.values(course.exams || {}).reduce((acc, exam) => ({
                obtained: acc.obtained + (exam.OM || 0),
                full: acc.full + (exam.FM || 0)
              }), { obtained: 0, full: 0 });
              marksMap[course.code] = total;
            });
          }

          const withMarksAndGrades = processedSubjects.map((s) => ({
            ...s,
            marks: marksMap[s.code] || null,
            grade: s.grade
          }));
          setSgpaSubjects(withMarksAndGrades);
        } catch (e) {
          console.error('Failed to attach marks cache:', e);
          setSgpaSubjects(processedSubjects);
        }
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
        const gp = gradePointMap[subject.grade] || 0;
        totalPoints += gp * subject.credits;
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

    if (Array.isArray(fetchedSemesters) && fetchedSemesters.length > 0) {
      fetchedSemesters.forEach(sem => {
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
    const cgpa = totalPoints / totalCredits;
    const bounded = Math.min(10, Math.max(0, cgpa));
    return bounded.toFixed(2);
  };

  const calculateRequiredSGPA = () => {
    const t = parseFloat(targetCgpa);
    if (isNaN(t)) return "-";
    let prevGradePoints = 0;
    let prevCredits = 0;
    if (Array.isArray(fetchedSemesters) && fetchedSemesters.length > 0) {
      fetchedSemesters.forEach(sem => {
        const sgpa = parseFloat(sem.sgpa);
        const credits = parseFloat(sem.totalcoursecredit);
        if (!isNaN(sgpa) && !isNaN(credits)) {
          prevGradePoints += sgpa * credits;
          prevCredits += credits;
        }
      });
    }
    const nextIndex = Array.isArray(fetchedSemesters) ? fetchedSemesters.length : 0;
    const nextCredits = parseFloat(cgpaSemesters[nextIndex]?.c);
    if (isNaN(nextCredits) || nextCredits <= 0) return "-";
    const required = (t * (prevCredits + nextCredits) - prevGradePoints) / nextCredits;
    if (!isFinite(required)) return "-";
    return required.toFixed(2);
  };


  return (
    <>
      <Helmet>
        <title>GPA Calculator - JP Portal | JIIT Student Portal</title>
        <meta name="description" content="Calculate SGPA/CGPA projections and targets for your semesters at JIIT." />
        <meta property="og:title" content="GPA Calculator - JP Portal | JIIT Student Portal" />
        <meta property="og:description" content="Calculate SGPA/CGPA projections and targets for your semesters at JIIT." />
        <meta property="og:url" content="https://jportal2-0.vercel.app/#/gpa-calculator" />
        <meta name="keywords" content="GPA calculator, SGPA, CGPA, JIIT, JP Portal" />
        <link rel="canonical" href="https://jportal2-0.vercel.app/#/gpa-calculator" />
      </Helmet>
      <div className="w-full max-w-5xl mx-auto bg-background text-foreground rounded-lg overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mx-4 md:mx-6 mt-2">
            <TabsTrigger
              value="sgpa"
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              SGPA Calculator
            </TabsTrigger>
            <TabsTrigger
              value="cgpa"
              className="flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              CGPA Calculator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sgpa" className="min-h-[300px] md:min-h-[350px] overflow-y-auto px-4 md:px-6 space-y-4 md:space-y-5 py-2">
            <div className="space-y-3 md:space-y-4">
              <Select onValueChange={handleSemesterChange} value={selectedSemester?.registration_id || ""}>
                <SelectTrigger className="w-full md:max-w-sm h-11 md:h-12 bg-card text-foreground border-2 border-border hover:border-primary/50 text-sm rounded-lg transition-all shadow-lg">
                  <SelectValue placeholder={isLoadingSemesters ? "Loading semesters..." : "Choose your semester"} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {subjectSemesters.map((semester) => (
                    <SelectItem
                      key={semester.registration_id}
                      value={semester.registration_id}
                      className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      {semester.registration_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingSemesters && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading semesters...</span>
                </div>
              )}
            </div>
            {selectedSemester && (
              <>
                {isLoadingSubjects ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading subjects...</span>
                  </div>
                ) : sgpaSubjects.length > 0 ? (
                  <>
                    <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
                      {sgpaSubjects.map((subject, index) => (
                        <div key={index} className="bg-card rounded-lg p-3 md:p-4 border border-border hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm md:text-base font-medium text-foreground mb-2">
                                {subject.name}
                              </div>
                              <div className="flex items-center gap-3 text-xs md:text-sm">
                                <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-medium">{subject.code}</span>
                                <span className="text-muted-foreground">{subject.credits} credits</span>
                                {subject.marks && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {subject.marks.obtained}/{subject.marks.full}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 w-20 md:w-24">
                              <Select
                                value={subject.grade}
                                onValueChange={(grade) => handleGradeChange(index, grade)}
                              >
                                <SelectTrigger className="w-full h-9 md:h-10 bg-background text-foreground border-border text-sm font-medium">
                                  <SelectValue placeholder="Grade" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-foreground">
                                  {gradeOptions.map(grade => (
                                    <SelectItem
                                      key={grade}
                                      value={grade}
                                      className="text-foreground hover:bg-accent focus:bg-accent"
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
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div className="p-4 md:p-5 rounded-lg bg-card border border-border flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm md:text-base text-muted-foreground font-medium">Calculated SGPA</span>
                        </div>
                        <span className={`text-2xl md:text-3xl font-bold ${calculateSGPA() !== "-" && parseFloat(calculateSGPA()) < 6
                          ? "text-destructive"
                          : "text-foreground"
                          }`}>
                          {calculateSGPA()}
                        </span>
                      </div>
                      <div className="p-4 md:p-5 rounded-lg bg-card border border-border flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm md:text-base text-muted-foreground font-medium">Projected CGPA</span>
                        </div>
                        <span className={`text-2xl md:text-3xl font-bold ${calculateProjectedCGPA() !== "-" && parseFloat(calculateProjectedCGPA()) < 6
                          ? "text-destructive"
                          : "text-foreground"
                          }`}>
                          {calculateProjectedCGPA()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No subjects found for this semester
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="cgpa" className="min-h-[300px] md:min-h-[350px] overflow-y-auto px-4 md:px-6 py-4 space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-card border border-border">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <label className="w-40 text-sm md:text-base text-muted-foreground">Target CGPA (next)</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    placeholder="e.g. 8.50"
                    value={targetCgpa}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.]/g, "");
                      if (raw === "") { setTargetCgpa(""); return; }
                      let n = parseFloat(raw);
                      if (isNaN(n)) { setTargetCgpa(""); return; }
                      if (n > 10) n = 10;
                      if (n < 0) n = 0;
                      setTargetCgpa(n.toString());
                    }}
                    className="h-9 md:h-10 text-sm md:text-base bg-background border-border text-foreground"
                    inputMode="decimal"
                  />
                </div>
                <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm md:text-base text-muted-foreground">Required SGPA (next)</span>
                  </div>
                  {(() => {
                    const req = calculateRequiredSGPA();
                    const n = parseFloat(req);
                    const impossible = !isNaN(n) && (n > 10 || n < 0);
                    if (req === "-" || isNaN(n)) {
                      return <span className="text-foreground text-xl md:text-2xl font-bold">-</span>;
                    }
                    if (impossible) {
                      return <span className="text-destructive text-sm md:text-base font-semibold">Impossible</span>;
                    }
                    const bounded = Math.min(10, Math.max(0, n));
                    return (
                      <span className="text-foreground text-xl md:text-2xl font-bold">
                        {bounded.toFixed(2)}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="relative my-1 md:my-2">
                <div className="h-px w-full bg-border"></div>
                <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2">
                  <span className="px-2 text-xs md:text-sm text-muted-foreground bg-background">OR</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm md:text-base font-semibold text-foreground">Long-term Planner</h3>
              </div>

              <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
                {cgpaSemesters.map((sem, i) => (
                  <div key={i} className={`bg-card rounded-lg p-3 md:p-4 border transition-colors ${i < (fetchedSemesters.length || 0)
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/30"
                    }`}>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <label className="block text-sm md:text-base font-medium text-foreground">
                          Sem {i + 1} {i < (fetchedSemesters.length || 0) ? "(Previous)" : ""}
                        </label>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Award className="w-3 h-3 text-muted-foreground" />
                            <label className="block text-xs md:text-sm text-muted-foreground">SGPA</label>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.01"
                            placeholder="0.00"
                            value={sem.g}
                            onChange={e => handleCgpaChange(i, "g", e.target.value)}
                            className={`h-8 md:h-9 text-xs md:text-sm ${i < (fetchedSemesters.length || 0)
                              ? "bg-primary/10 border-primary/30 text-foreground"
                              : "bg-background border-border text-foreground"
                              }`}
                            inputMode="decimal"
                            readOnly={i < (fetchedSemesters.length || 0)}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <BookOpen className="w-3 h-3 text-muted-foreground" />
                            <label className="block text-xs md:text-sm text-muted-foreground">Credits</label>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max="40"
                            step="0.01"
                            placeholder="0"
                            value={sem.c}
                            onChange={e => handleCgpaChange(i, "c", e.target.value)}
                            className={`h-8 md:h-9 text-xs md:text-sm ${i < (fetchedSemesters.length || 0)
                              ? "bg-primary/10 border-primary/30 text-foreground"
                              : "bg-background border-border text-foreground"
                              }`}
                            inputMode="decimal"
                            readOnly={i < (fetchedSemesters.length || 0)}
                          />
                        </div>
                      </div>
                      {i === cgpaSemesters.length - 1 && cgpaSemesters.length > 1 && i >= (fetchedSemesters.length || 0) && (
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
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
                    className="flex items-center justify-center gap-2 bg-card text-foreground border border-border hover:bg-accent/50 px-6 md:px-8 h-10 md:h-11 text-sm md:text-base font-semibold rounded-lg transition-all w-full md:w-auto"
                    onClick={addSemester}
                    disabled={cgpaSemesters.length >= maxSemesters}
                    type="button"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" /> Add Semester
                  </Button>
                </div>

                <div className="flex-1 h-10 md:h-11 px-4 md:px-5 rounded-lg bg-card border border-border flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm md:text-base text-muted-foreground font-medium">Calculated CGPA</span>
                  </div>
                  <span className="text-xl md:text-2xl font-bold text-foreground">{calculateCGPA()}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
                <div className="h-12 md:h-12" />

      </div>
    </>
  );
}
