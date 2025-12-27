import { useState, useEffect } from "react"
import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Helmet } from 'react-helmet-async'
import SubjectInfoCard from "./SubjectInfoCard"
import SubjectChoices from "./SubjectChoices"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Empty } from "@/components/ui/empty";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Calendar, Eye, ArrowLeft, BookOpen, ListChecks } from "lucide-react"
import { getRegisteredSubjectsFromCache, saveRegisteredSubjectsToCache, getSubjectChoicesFromCache, saveSubjectChoicesToCache } from '@/components/scripts/cache'

export default function Subjects({
  w,
  subjectData,
  setSubjectData,
  semestersData,
  setSemestersData,
  selectedSem,
  setSelectedSem,
}) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(!semestersData)
  const [subjectsLoading, setSubjectsLoading] = useState(!subjectData)
  const [activeTab, setActiveTab] = useState("registered")
  const [subjectChoices, setSubjectChoices] = useState({})
  const [choicesLoading, setChoicesLoading] = useState(false)
  const [nextSemChoices, setNextSemChoices] = useState(null)
  const [nextSemChoicesLoading, setNextSemChoicesLoading] = useState(false)
  const [componentFilters, setComponentFilters] = useState({
    L: true,
    T: true,
    P: true,
  })

  useEffect(() => {
    const fetchSemesters = async () => {
      if (semestersData) {
        if (semestersData.semesters.length > 0 && !selectedSem) {
          await findFirstSemesterWithSubjects(semestersData.semesters)
        }
        return
      }

      setLoading(true)
      setSubjectsLoading(true)
      setChoicesLoading(true)
      try {
        const registeredSems = await w.get_registered_semesters()
        const semestersList = Array.isArray(registeredSems) ? registeredSems : (registeredSems ? registeredSems : [])
        setSemestersData({
          semesters: semestersList,
          latest_semester: semestersList[0] || null,
        })

        await findFirstSemesterWithSubjects(registeredSems)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
        setSubjectsLoading(false)
        setChoicesLoading(false)
      }
    }

    const findFirstSemesterWithSubjects = async (semesters) => {
      for (const semester of semesters) {
        try {
          const username = w.username || (typeof window !== 'undefined' && localStorage.getItem('username')) || 'user';

          if (!subjectData?.[semester.registration_id]) {
            try {
              const cachedRegSubjects = await getRegisteredSubjectsFromCache(username, semester);
              if (cachedRegSubjects) {
                setSubjectData((prev) => ({ ...prev, [semester.registration_id]: cachedRegSubjects }));
              }
            } catch (e) {
            }
          }

          if (subjectData?.[semester.registration_id]) {
            const existingData = subjectData[semester.registration_id];
            if (existingData?.subjects && existingData.subjects.length > 0) {
              setSelectedSem(semester);
              return;
            }
          }

          const data = await w.get_registered_subjects_and_faculties(semester);
          setSubjectData((prev) => ({
            ...prev,
            [semester.registration_id]: data,
          }));
          try { await saveRegisteredSubjectsToCache(data, username, semester); } catch (e) { }

          if (data?.subjects && data.subjects.length > 0) {
            setSelectedSem(semester);
            return;
          }
        } catch (err) {
          setSubjectData((prev) => ({
            ...prev,
            [semester.registration_id]: { error: err.message },
          }));
        }
      }

      if (semesters && semesters.length > 0) {
        setSelectedSem(semesters[0]);
      }
    }

    fetchSemesters()
  }, [w, setSubjectData, semestersData, setSemestersData, selectedSem, subjectData])

  useEffect(() => {
    const fetchChoicesForSelectedSemester = async () => {
      const username = w.username || (typeof window !== 'undefined' && localStorage.getItem('username')) || 'user';
      if (selectedSem && !subjectChoices?.[selectedSem.registration_id]) {
        setChoicesLoading(true)
        try {
          const cachedChoices = await getSubjectChoicesFromCache(username, selectedSem);
          if (cachedChoices) {
            setSubjectChoices((prev) => ({
              ...prev,
              [selectedSem.registration_id]: cachedChoices,
            }))
            setChoicesLoading(false)
            return
          }
          const choicesData = await w.get_subject_choices(selectedSem)
          setSubjectChoices((prev) => ({
            ...prev,
            [selectedSem.registration_id]: choicesData,
          }))
          try { await saveSubjectChoicesToCache(choicesData, username, selectedSem); } catch (e) { }
        } catch (err) {
          console.error("Error fetching subject choices:", err)
        } finally {
          setChoicesLoading(false)
        }
      }
    }

    fetchChoicesForSelectedSemester()
  }, [selectedSem, subjectChoices, w])

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['registered', 'choices'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('tab', activeTab);
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  const handleComponentFilterChange = (componentType, checked) => {
    setComponentFilters(prev => ({
      ...prev,
      [componentType]: checked
    }))
  }

  const handleSemesterChange = async (value) => {
    setSubjectsLoading(true)
    try {
      const semester = semestersData?.semesters?.find((sem) => sem.registration_id === value)
      setSelectedSem(semester)

      const username = w.username || (typeof window !== 'undefined' && localStorage.getItem('username')) || 'user';
      const cached = await getRegisteredSubjectsFromCache(username, semester);
      if (cached) {
        setSubjectData((prev) => ({
          ...prev,
          [semester.registration_id]: cached,
        }))
        setSubjectsLoading(false)
        return
      }

      if (subjectData?.[semester.registration_id]) {
        setSubjectsLoading(false)
      } else {
        const data = await w.get_registered_subjects_and_faculties(semester)
        setSubjectData((prev) => ({
          ...prev,
          [semester.registration_id]: data,
        }))
        try { await saveRegisteredSubjectsToCache(data, username, semester); } catch (e) { }
      }
    } catch (err) {
      setSubjectData((prev) => ({
        ...prev,
        [semester.registration_id]: { error: err.message },
      }));
    } finally {
      setSubjectsLoading(false)
    }
  }

  const currentSubjects = selectedSem && subjectData?.[selectedSem.registration_id]
  const currentChoices = selectedSem && subjectChoices?.[selectedSem.registration_id]
  const currentSubjectsError = currentSubjects?.error

  const getNextSemester = () => {
    if (!semestersData?.semesters || !selectedSem) return null
    const currentIndex = semestersData.semesters.findIndex(sem => sem.registration_id === selectedSem.registration_id)
    if (currentIndex === -1 || currentIndex === 0) return null
    return semestersData.semesters[currentIndex - 1]
  }

  const handleViewNextSemElectives = async () => {
    const nextSem = getNextSemester()
    if (!nextSem) return

    setNextSemChoicesLoading(true)
    try {
      const username = w.username || (typeof window !== 'undefined' && localStorage.getItem('username')) || 'user';
      const cachedChoices = await getSubjectChoicesFromCache(username, nextSem);
      if (cachedChoices) {
        setNextSemChoices({ semester: nextSem, choices: cachedChoices });
        setNextSemChoicesLoading(false);
        return;
      }
      const choicesData = await w.get_subject_choices(nextSem)
      setNextSemChoices({
        semester: nextSem,
        choices: choicesData
      })
      try { await saveSubjectChoicesToCache(choicesData, username, nextSem); } catch (e) { }
    } catch (err) {
      console.error("Error fetching next semester choices:", err)
      setNextSemChoices(null)
    } finally {
      setNextSemChoicesLoading(false)
    }
  }

  const handleBackToCurrent = () => {
    setNextSemChoices(null)
  }

  const groupedSubjects =
    currentSubjects?.subjects?.reduce((acc, subject) => {
      const baseCode = subject.subject_code
      if (!acc[baseCode]) {
        acc[baseCode] = {
          name: subject.subject_desc,
          code: baseCode,
          credits: subject.credits,
          components: [],
          isAudit: subject.audtsubject === "Y",
        }
      }
      acc[baseCode].components.push({
        type: subject.subject_component_code,
        teacher: subject.employee_name,
      })
      return acc
    }, {}) || {}

  const navigate = useNavigate();

  const buildTimetableUrlFromSubjects = (semester) => {
    const generateVariants = (subjectCode) => {
      if (!subjectCode) return [];
      const full = String(subjectCode).trim().toUpperCase();
      const variants = new Set();

      const matches = full.match(/[A-Z]+\d+/g);
      if (matches) matches.forEach(m => variants.add(m));

      if (full.length >= 5) variants.add(full.slice(-5));
      if (full.length >= 6) variants.add(full.slice(-6));

      return Array.from(variants).filter(v => v && v.length >= 4 && /^[A-Z]/.test(v));
    };

    let selectedSubjectsArr = [];
    const semId = semester?.registration_id || (selectedSem && selectedSem.registration_id);

    const pushVariantsFromList = (list) => {
      list.forEach((s) => {
        const variants = generateVariants(s.subject_code);
        variants.forEach(v => selectedSubjectsArr.push(v));
      });
    };

    if (semId && subjectData?.[semId]?.subjects) {
      pushVariantsFromList(subjectData[semId].subjects);
    } else if (currentSubjects?.subjects) {
      pushVariantsFromList(currentSubjects.subjects);
    }

    const unique = Array.from(new Set(selectedSubjectsArr.filter(v => v && v.length >= 4)));
    let selectedSubjects = unique.join(',');

    if (!selectedSubjects) selectedSubjects = 'EC611,EC671,EC691';

    const baseUrl = 'https://simple-timetable.tashif.codes/';
    const params = new URLSearchParams({
      campus: '62',
      year: '4',
      batch: '2026',
      selectedSubjects: selectedSubjects,
      isGenerating: 'true'
    });

    return `${baseUrl}?${params.toString()}`;
  }

  const TimetableButton = ({ semester = selectedSem }) => {
    const handleClick = (e) => {
      e.preventDefault();
      const semId = semester?.registration_id || (selectedSem && selectedSem.registration_id) || null;
      sessionStorage.setItem('timetableRequest', JSON.stringify({ semId, ts: Date.now() }));
      navigate('/timetable');
    }

    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-3 px-6 py-2 bg-primary text-primary-foreground border border-primary/20 rounded-lg hover:bg-primary/90 transition-all duration-200 text-lg font-medium shadow-lg"
      >
        <Calendar size={20} />
        Create personalized Timetable
      </button>
    )
  }

  return (
    <>
      <Helmet>
        <title>Subjects - JP Portal | JIIT Student Portal</title>
        <meta name="description" content="View your registered subjects and subject choices for each semester at JIIT." />
        <meta property="og:title" content="Subjects - JP Portal | JIIT Student Portal" />
        <meta property="og:description" content="View your registered subjects and subject choices for each semester at JIIT." />
        <meta property="og:url" content="https://jportal2-0.vercel.app/#/subjects" />
        <meta name="keywords" content="JIIT subjects, subject choices, student subjects" />
        <link rel="canonical" href="https://jportal2-0.vercel.app/#/subjects" />
      </Helmet>
      <div className="relative pb-16 md:pb-20">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="top-14 bg-background z-20 border-b border-border"
        >
          <div className="py-2 px-3 max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <Select onValueChange={handleSemesterChange} value={selectedSem?.registration_id} disabled={loading}>
              <SelectTrigger className="bg-card text-foreground border-border md:w-[320px]">
                <SelectValue placeholder={loading ? "Loading semesters..." : "Select semester"}>
                  {selectedSem?.registration_code}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-card text-foreground border-border">
                {semestersData?.semesters?.map((sem) => (
                  <SelectItem key={sem.registration_id} value={sem.registration_id}>
                    {sem.registration_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-3 max-w-[1440px] mx-auto">
          <TabsList className="grid grid-cols-2 gap-3 mt-4">
            <TabsTrigger
              value="registered"
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Registered
            </TabsTrigger>
            <TabsTrigger
              value="choices"
              className="flex items-center gap-2"
            >
              <ListChecks className="w-4 h-4" />
              Choices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registered" className="mt-4">
            {!subjectsLoading && currentSubjects && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4 flex justify-center"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/5 text-muted-foreground border border-border rounded-full text-sm font-medium">
                  <BookOpen className="w-4 h-4" />
                  Total Credits: {currentSubjects?.total_credits || 0}
                </div>
              </motion.div>
            )}
            {subjectsLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)]"
              >
                <Loader2 className="w-8 h-8 animate-spin text-foreground" />
                <span className="ml-2 text-foreground">Loading subjects...</span>
              </motion.div>
            ) : currentSubjectsError ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center py-8"
              >
                <div className="text-center bg-card rounded-lg p-6 max-w-md border border-border">
                  <p className="text-xl text-destructive mb-2">Subjects Unavailable</p>
                  <p className="text-muted-foreground">{currentSubjectsError}</p>
                </div>
              </motion.div>
            ) : Object.keys(groupedSubjects).length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center py-8"
              >
                <Empty description="No subjects found for this semester." />
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-4 p-4 bg-card rounded-lg border border-border"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-foreground">Filter by Component:</span>
                    <div className="flex items-center space-x-4">
                      {Object.entries(componentFilters).map(([component, isChecked]) => (
                        <div key={component} className="flex items-center space-x-2">
                          <Checkbox
                            id={`filter-${component}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => handleComponentFilterChange(component, checked)}
                            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <label
                            htmlFor={`filter-${component}`}
                            className="text-sm font-medium text-foreground cursor-pointer"
                          >
                            {component === 'L' ? 'Lectures' : component === 'T' ? 'Tutorials' : 'Practicals'}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      let subjects = Object.values(groupedSubjects);
                      subjects = subjects.sort((a, b) => (b.credits || 0) - (a.credits || 0));

                      if (!componentFilters.L || !componentFilters.T || !componentFilters.P) {
                        subjects = subjects.filter(subject => {
                          const hasL = componentFilters.L && subject.components.some(comp => comp.type === 'L');
                          const hasT = componentFilters.T && subject.components.some(comp => comp.type === 'T');
                          const hasP = componentFilters.P && subject.components.some(comp => comp.type === 'P');
                          return hasL || hasT || hasP;
                        });
                      }

                      return subjects.map((subject, index) => (
                        <motion.div
                          key={subject.code}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <SubjectInfoCard subject={subject} />
                        </motion.div>
                      ));
                    })()}
                  </motion.div>
                </AnimatePresence>
              </>
            )}

            {currentSubjects && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex justify-center mt-4"
              >
                <TimetableButton />
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="choices" className="mt-4">
            <div className="flex justify-center mb-4">
              {nextSemChoices ? (
                <button
                  onClick={handleBackToCurrent}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card text-foreground border border-border rounded-lg hover:bg-muted/5 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={14} /> Back to {selectedSem?.registration_code}
                </button>
              ) : (
                <button
                  onClick={handleViewNextSemElectives}
                  disabled={nextSemChoicesLoading || !getNextSemester()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card text-foreground border border-border rounded-lg hover:bg-muted/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {nextSemChoicesLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {nextSemChoicesLoading ? 'Loading...' : `View ${getNextSemester()?.registration_code || ''} Electives`}
                </button>
              )}
            </div>
            <SubjectChoices
              currentChoices={nextSemChoices ? nextSemChoices.choices : currentChoices}
              choicesLoading={nextSemChoices ? nextSemChoicesLoading : choicesLoading}
              semesterName={nextSemChoices ? nextSemChoices.semester.registration_code : selectedSem?.registration_code}
            />
          </TabsContent>
        </Tabs>

        <div className="h-8 md:h-12" />
      </div>
    </>
  )
}