import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import SubjectInfoCard from "./SubjectInfoCard"
import SubjectChoices from "./SubjectChoices"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2, Calendar, Eye, ArrowLeft } from "lucide-react"

export default function Subjects({
  w,
  subjectData,
  setSubjectData,
  semestersData,
  setSemestersData,
  selectedSem,
  setSelectedSem,
}) {
  const [loading, setLoading] = useState(!semestersData)
  const [subjectsLoading, setSubjectsLoading] = useState(!subjectData)
  const [activeTab, setActiveTab] = useState("registered")
  const [subjectChoices, setSubjectChoices] = useState({})
  const [choicesLoading, setChoicesLoading] = useState(false)
  const [nextSemChoices, setNextSemChoices] = useState(null)
  const [nextSemChoicesLoading, setNextSemChoicesLoading] = useState(false)

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
        
        setSemestersData({
          semesters: registeredSems,
          latest_semester: registeredSems[0],
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
          if (subjectData?.[semester.registration_id]) {
            const existingData = subjectData[semester.registration_id]
            if (existingData?.subjects && existingData.subjects.length > 0) {
              setSelectedSem(semester)
              return
            }
          } else {
            const data = await w.get_registered_subjects_and_faculties(semester)
            setSubjectData((prev) => ({
              ...prev,
              [semester.registration_id]: data,
            }))
            
            if (data?.subjects && data.subjects.length > 0) {
              setSelectedSem(semester)
              return
            }
          }
        } catch (err) {
          setSubjectData((prev) => ({
            ...prev,
            [semester.registration_id]: { error: err.message },
          }));
        }
      }
      if (semesters.length > 0) {
        setSelectedSem(semesters[0])
      }
    }

    fetchSemesters()
  }, [w, setSubjectData, semestersData, setSemestersData, selectedSem, subjectData])

  useEffect(() => {
    const fetchChoicesForSelectedSemester = async () => {
      if (selectedSem && !subjectChoices?.[selectedSem.registration_id]) {
        setChoicesLoading(true)
        try {
          const choicesData = await w.get_subject_choices(selectedSem)
          setSubjectChoices((prev) => ({
            ...prev,
            [selectedSem.registration_id]: choicesData,
          }))
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

      if (subjectData?.[semester.registration_id]) {
        setSubjectsLoading(false)
      } else {
        const data = await w.get_registered_subjects_and_faculties(semester)
        setSubjectData((prev) => ({
          ...prev,
          [semester.registration_id]: data,
        }))
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
      const choicesData = await w.get_subject_choices(nextSem)
      setNextSemChoices({
        semester: nextSem,
        choices: choicesData
      })
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

  return (
    <div className="relative pb-16 md:pb-20">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="top-14 dark:bg-white bg-[black] z-20 border-b border-white/10 dark:border-black/10"
      >
        <div className="py-2 px-3 max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <Select onValueChange={handleSemesterChange} value={selectedSem?.registration_id} disabled={loading}>
            <SelectTrigger className="dark:bg-white bg-[black] dark:text-black text-white dark:border-black border-white md:w-[320px]">
              <SelectValue placeholder={loading ? "Loading semesters..." : "Select semester"}>
                {selectedSem?.registration_code}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="dark:bg-white bg-[black] dark:text-black text-white dark:border-black border-white">
              {semestersData?.semesters?.map((sem) => (
                <SelectItem key={sem.registration_id} value={sem.registration_id}>
                  {sem.registration_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <motion.div className="flex items-center space-x-2 mt-2 md:mt-0">
            <span className="text-sm font-medium text-gray-300 dark:text-gray-600">Total Credits</span>
            <span className="text-lg font-semibold text-white dark:text-black">{currentSubjects?.total_credits || 0}</span>
          </motion.div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-3 max-w-[1440px] mx-auto">
        <TabsList className="grid grid-cols-2 bg-[#0B0B0D] dark:bg-gray-100 gap-3 mt-4">
          <TabsTrigger
            value="registered"
            className="cursor-pointer text-gray-400 dark:text-gray-600 bg-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white transition-colors"
          >
            Registered
          </TabsTrigger>
          <TabsTrigger
            value="choices"
            className="cursor-pointer text-gray-400 dark:text-gray-600 bg-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white transition-colors"
          >
            Choices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registered" className="mt-4">
          {subjectsLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)]"
            >
              <Loader2 className="w-8 h-8 animate-spin text-white dark:text-black" />
              <span className="ml-2 text-white dark:text-black">Loading subjects...</span>
            </motion.div>
          ) : currentSubjectsError ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center py-8"
            >
              <div className="text-center bg-[#0B0B0D] dark:bg-gray-50 rounded-lg p-6 max-w-md">
                <p className="text-xl text-red-400 mb-2">Subjects Unavailable</p>
                <p className="text-gray-400 dark:text-gray-600">{currentSubjectsError}</p>
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
              <div className="text-center bg-[#0B0B0D] dark:bg-gray-50 rounded-lg p-6 max-w-md">
                <p className="text-gray-400 dark:text-gray-600">No subjects found for this semester.</p>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  let subjects = Object.values(groupedSubjects);
                  subjects = subjects.sort((a, b) => (b.credits || 0) - (a.credits || 0));

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
          )}
          
          {currentSubjects && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-center mt-4"
            >
              <Link
                to="/timetable"
                className="inline-flex items-center gap-3 px-6 py-2 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white rounded-lg hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200 text-lg font-medium shadow-lg"
              >
                <Calendar size={20} />
                Create personalized Timetable
              </Link>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="choices" className="mt-4">
          <div className="flex justify-center mb-4">
            {nextSemChoices ? (
              <button
                onClick={handleBackToCurrent}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B0B0D] dark:bg-gray-100 text-white dark:text-black border border-white/20 dark:border-black/20 rounded-lg hover:bg-[#1A1A1D] dark:hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={14} /> Back to {selectedSem?.registration_code}
              </button>
            ) : (
              <button
                onClick={handleViewNextSemElectives}
                disabled={nextSemChoicesLoading || !getNextSemester()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B0B0D] dark:bg-gray-100 text-white dark:text-black border border-white/20 dark:border-black/20 rounded-lg hover:bg-[#1A1A1D] dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
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
  )
}