"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, MapPin, Armchair } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Exams({
  w,
  examSchedule,
  setExamSchedule,
  examSemesters,
  setExamSemesters,
  selectedExamSem,
  setSelectedExamSem,
  selectedExamEvent,
  setSelectedExamEvent,
}) {
  const [examEvents, setExamEvents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchInitialData = async () => {
      if (examSemesters.length === 0) {
        setLoading(true)
        try {
          const examSems = await w.get_semesters_for_exam_events()
          setExamSemesters(examSems)

          if (examSems.length > 0) {
            const firstSemester = examSems[0]
            setSelectedExamSem(firstSemester)

            const events = await w.get_exam_events(firstSemester)
            setExamEvents(events)

            if (events.length > 0) {
              const firstEvent = events[0]
              setSelectedExamEvent(firstEvent)

              const response = await w.get_exam_schedule(firstEvent)
              setExamSchedule({
                [firstEvent.exam_event_id]: response.subjectinfo,
              })
            }
          }
        } finally {
          setLoading(false)
        }
      } else if (selectedExamSem && examEvents.length === 0) {
        // Fetch exam events if they're not available
        setLoading(true)
        try {
          const events = await w.get_exam_events(selectedExamSem)
          setExamEvents(events)
          if (events.length > 0 && !selectedExamEvent) {
            setSelectedExamEvent(events[0])
          }
        } finally {
          setLoading(false)
        }
      }
    }
    fetchInitialData()
  }, [
    w,
    setExamSemesters,
    setSelectedExamSem,
    setSelectedExamEvent,
    setExamSchedule,
    examSemesters,
    selectedExamSem,
    examEvents.length,
    selectedExamEvent,
  ])

  const handleSemesterChange = async (value) => {
    setLoading(true)
    try {
      const semester = examSemesters.find((sem) => sem.registration_id === value)
      setSelectedExamSem(semester)
      const events = await w.get_exam_events(semester)
      setExamEvents(events)
      setSelectedExamEvent(null)
      setExamSchedule({})

      if (events.length > 0) {
        const firstEvent = events[0]
        setSelectedExamEvent(firstEvent)
        const response = await w.get_exam_schedule(firstEvent)
        setExamSchedule({
          [firstEvent.exam_event_id]: response.subjectinfo,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEventChange = async (value) => {
    setLoading(true)
    try {
      const selectedEvent = examEvents.find((evt) => evt.exam_event_id === value)
      setSelectedExamEvent(selectedEvent)

      if (!examSchedule[value]) {
        const response = await w.get_exam_schedule(selectedEvent)
        setExamSchedule((prev) => ({
          ...prev,
          [value]: response.subjectinfo,
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const currentSchedule = selectedExamEvent && examSchedule[selectedExamEvent.exam_event_id]

  const formatDate = (dateStr) => {
    const [day, month, year] = dateStr.split("/")
    return new Date(`${month}/${day}/${year}`).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-[1440px]">
      <div className="bg-black dark:bg-white shadow rounded-lg p-6 md:max-w-[50%] md:mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-white dark:text-black">Exam Schedule</h2>
        <div className="space-y-4">
          <Select onValueChange={handleSemesterChange} value={selectedExamSem?.registration_id || ""}>
            <SelectTrigger className="w-full bg-[#0B0B0D] text-white dark:bg-white dark:text-black border-gray-700 dark:border-gray-300">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {examSemesters.map((sem) => (
                <SelectItem key={sem.registration_id} value={sem.registration_id}>
                  {sem.registration_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedExamSem && (
            <Select onValueChange={handleEventChange} value={selectedExamEvent?.exam_event_id || ""}>
              <SelectTrigger className="w-full bg-[#0B0B0D] text-white dark:bg-white dark:text-black border-gray-700 dark:border-gray-300">
                <SelectValue placeholder="Select exam event" />
              </SelectTrigger>
              <SelectContent>
                {examEvents.map((event) => (
                  <SelectItem key={event.exam_event_id} value={event.exam_event_id}>
                    {event.exam_event_desc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : currentSchedule?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentSchedule.map((exam) => (
            <ExamCard
              key={`${exam.subjectcode}-${exam.datetime}-${exam.datetimefrom}`}
              exam={exam}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : selectedExamEvent ? (
        <div className="bg-black dark:bg-white shadow rounded-lg p-6 flex items-center justify-center h-32">
          <p className="text-gray-400 dark:text-gray-500">No exam schedule available</p>
        </div>
      ) : null}
    </div>
  )
}

function ExamCard({ exam, formatDate }) {
  return (
    <div className="bg-black dark:bg-white shadow rounded-lg p-6">
      <div className="space-y-4">
        {/* Exam Name Row */}
        <div className="border-b border-gray-800 dark:border-gray-200 pb-3">
          <h3 className="font-semibold text-lg sm:text-xl text-white dark:text-black">
            {exam.subjectdesc.split("(")[0].trim()}
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {exam.subjectcode}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3 text-sm text-gray-300 dark:text-gray-600">
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span>{formatDate(exam.datetime)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span>{exam.datetimeupto}</span>
            </div>
          </div>

          {(exam.roomcode || exam.seatno) && (
            <div className="space-y-3 text-sm text-gray-300 dark:text-gray-600">
              {exam.roomcode && (
                <div className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <span>Room: {exam.roomcode}</span>
                </div>
              )}
              {exam.seatno && (
                <div className="flex items-center">
                  <Armchair className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <span>Seat: {exam.seatno}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-black dark:bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-[#0B0B0D] dark:bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-[#0B0B0D] dark:bg-gray-200 rounded"></div>
            </div>
            <div className="h-6 w-16 bg-[#0B0B0D] dark:bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-[#0B0B0D] dark:bg-gray-200 rounded"></div>
            <div className="h-4 w-full bg-[#0B0B0D] dark:bg-gray-200 rounded"></div>
            <div className="h-4 w-full bg-[#0B0B0D] dark:bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

