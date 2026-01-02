import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Helmet } from 'react-helmet-async'
import SubjectInfoCard from "./SubjectInfoCard"
import SubjectChoices from "./SubjectChoices"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Empty } from "@/components/ui/empty"
import { Loader2, Calendar, Eye, ArrowLeft, BookOpen, ListChecks} from "lucide-react"
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
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['registered', 'choices'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, []);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('tab', value);
      return params;
    }, { replace: true });
  }

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

        await findFirstSemesterWithSubjects(semestersList)
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
            } catch (e) {}
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
          try { await saveRegisteredSubjectsToCache(data, username, semester); } catch (e) {}

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
  }, [w, setSubjectData, semestersData, setSemestersData])

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
          try { await saveSubjectChoicesToCache(choicesData, username, selectedSem); } catch (e) {}
        } catch (err) {
          console.error("Error fetching subject choices:", err)
        } finally {
          setChoicesLoading(false)
        }
      }
    }

    fetchChoicesForSelectedSemester()
  }, [selectedSem, subjectChoices, w])

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
        return
      }

      if (!subjectData?.[semester.registration_id]) {
        const data = await w.get_registered_subjects_and_faculties(semester)
        setSubjectData((prev) => ({
          ...prev,
          [semester.registration_id]: data,
        }))
        try { await saveRegisteredSubjectsToCache(data, username, semester); } catch (e) {}
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
      try { await saveSubjectChoicesToCache(choicesData, username, nextSem); } catch (e) {}
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

  const groupedSubjects = useMemo(() => {
    return currentSubjects?.subjects?.reduce((acc, subject) => {
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

      const order = { 'L': 1, 'T': 2, 'P': 3 };
      acc[baseCode].components.sort((a, b) => 
        (order[a.type] || 99) - (order[b.type] || 99)
      );

      return acc
    }, {}) || {}
  }, [currentSubjects])

  const filteredSubjectsList = useMemo(() => {
    let subjects = Object.values(groupedSubjects);
    subjects = subjects.sort((a, b) => (b.credits || 0) - (a.credits || 0));

    return subjects.filter(subject => {      
      const hasL = componentFilters.L && subject.components.some(comp => comp.type === 'L');
      const hasT = componentFilters.T && subject.components.some(comp => comp.type === 'T');
      const hasP = componentFilters.P && subject.components.some(comp => comp.type === 'P');
      
      return (hasL || hasT || hasP);
    });
  }, [groupedSubjects, componentFilters]);

  const navigate = useNavigate();

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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="px-3 max-w-[1440px] mx-auto">
          <TabsList className="grid grid-cols-2 bg-card gap-3 mt-4">
            <TabsTrigger
              value="registered"
              className="cursor-pointer text-muted-foreground bg-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-foreground transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Registered
            </TabsTrigger>
            <TabsTrigger
              value="choices"
              className="cursor-pointer text-muted-foreground bg-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-foreground transition-colors flex items-center gap-2"
            >
              <ListChecks className="w-4 h-4" />
              Choices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registered" className="mt-4">
            {!subjectsLoading && currentSubjects && (
              <div className="space-y-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-lg border border-border w-full md:w-auto overflow-x-auto">
                    {[
                      { id: 'L', label: 'Lectures' },
                      { id: 'T', label: 'Tutorials' },
                      { id: 'P', label: 'Practicals' }
                    ].map((comp) => (
                      <button
                        key={comp.id}
                        onClick={() => setComponentFilters(prev => ({ ...prev, [comp.id]: !prev[comp.id] }))}
                        className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                          componentFilters[comp.id] 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {comp.label}
                      </button>
                    ))}
                  </div>

                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary border border-primary/20 rounded-full text-xs font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    {currentSubjects?.total_credits || 0} CREDITS
                  </div>
                </div>
              </div>
            )}

            {subjectsLoading ? (
              <div className="flex items-center justify-center py-4 h-[400px]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <span className="text-muted-foreground font-medium">Fetching subjects...</span>
                </div>
              </div>
            ) : currentSubjectsError ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center bg-card rounded-lg p-6 max-w-md border border-border">
                  <p className="text-xl text-destructive mb-2">Subjects Unavailable</p>
                  <p className="text-muted-foreground">{currentSubjectsError}</p>
                </div>
              </div>
            ) : filteredSubjectsList.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Empty description={"No subjects found for this semester."} />
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div 
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {filteredSubjectsList.map((subject, index) => (
                    <motion.div
                      layout
                      key={subject.code}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                      <SubjectInfoCard subject={subject} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {currentSubjects && !subjectsLoading && (
              <div className="flex justify-center mt-10">
                <TimetableButton />
              </div>
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
                  {nextSemChoicesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
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