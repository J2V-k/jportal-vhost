import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import SubjectInfoCard from "./SubjectInfoCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar } from "lucide-react"

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

  useEffect(() => {
    const fetchSemesters = async () => {
      if (semestersData) {
        if (semestersData.semesters.length > 0 && !selectedSem) {
          setSelectedSem(semestersData.latest_semester)

          if (!subjectData?.[semestersData.latest_semester.registration_id]) {
            const data = await w.get_registered_subjects_and_faculties(semestersData.latest_semester)
            setSubjectData((prev) => ({
              ...prev,
              [semestersData.latest_semester.registration_id]: data,
            }))
          }
        }
        return
      }

      setLoading(true)
      setSubjectsLoading(true)
      try {
        const registeredSems = await w.get_registered_semesters()
        const latestSem = registeredSems[0]

        setSemestersData({
          semesters: registeredSems,
          latest_semester: latestSem,
        })

        setSelectedSem(latestSem)

        if (!subjectData?.[latestSem.registration_id]) {
          const data = await w.get_registered_subjects_and_faculties(latestSem)
          setSubjectData((prev) => ({
            ...prev,
            [latestSem.registration_id]: data,
          }))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
        setSubjectsLoading(false)
      }
    }

    fetchSemesters()
  }, [w, setSubjectData, semestersData, setSemestersData, selectedSem]) // Added selectedSem to dependencies

  const handleSemesterChange = async (value) => {
    setSubjectsLoading(true)
    try {
      const semester = semestersData?.semesters?.find((sem) => sem.registration_id === value)
      setSelectedSem(semester)

      if (subjectData?.[semester.registration_id]) {
        setSubjectsLoading(false)
        return
      }

      const data = await w.get_registered_subjects_and_faculties(semester)
      setSubjectData((prev) => ({
        ...prev,
        [semester.registration_id]: data,
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setSubjectsLoading(false)
    }
  }

  const currentSubjects = selectedSem && subjectData?.[selectedSem.registration_id]
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
              <span className="text-sm font-medium text-gray-400 dark:text-gray-300">Total Credits</span>
              <span className="text-lg font-semibold text-white dark:text-black">{currentSubjects?.total_credits || 0}</span>
            </motion.div>
          </div>
        </motion.div>

        {subjectsLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)]"
          >
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading subjects...</span>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[1440px] mx-auto">
              {Object.values(groupedSubjects).map((subject, index) => (
                <motion.div
                  key={subject.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <SubjectInfoCard subject={subject} />
                </motion.div>
              ))}
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
        
        <div className="h-8 md:h-12" />
      </div>
    )
}
