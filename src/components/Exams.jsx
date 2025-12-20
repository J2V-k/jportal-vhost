"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, Armchair, Timer } from "lucide-react";
import { ArtificialWebPortal } from "./scripts/artificialW";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Helmet } from 'react-helmet-async';

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
  const isOffline = w && (w instanceof ArtificialWebPortal || (w.constructor && w.constructor.name === 'ArtificialWebPortal'))
  if (isOffline) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-foreground">Exam Schedule Unavailable</h2>
          <p className="text-muted-foreground mt-2">Exam schedule is not available while offline. Connect to the internet to view exam schedules.</p>
        </div>
      </div>
    );
  }
  const [examEvents, setExamEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const updateExamDatesInLocalStorage = (examScheduleData) => {
    if (!examScheduleData || examScheduleData.length === 0) {
      return;
    }

    try {
      const examDates = examScheduleData.map((exam) => exam.datetime);
      const examDatesAsDate = examDates.map((dateStr) => {
        const [day, month, year] = dateStr.split("/");
        return new Date(`${month}/${day}/${year}`);
      });

      const earliestDate = new Date(Math.min(...examDatesAsDate));
      const latestDate = new Date(Math.max(...examDatesAsDate));

      localStorage.setItem("examStartDate", earliestDate.toISOString());
      localStorage.setItem("examEndDate", latestDate.toISOString());
    } catch (error) {
      console.error("Failed to update exam dates in localStorage:", error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (examSemesters.length === 0) {
        setLoading(true);
        try {
          const examSems = await w.get_semesters_for_exam_events();
          setExamSemesters(examSems);

          if (examSems.length > 0) {
            const currentYear = new Date().getFullYear().toString();
            const currentYearSemester = examSems.find(sem =>
              sem.registration_code && sem.registration_code.includes(currentYear)
            );
            const selectedSemester = currentYearSemester || examSems[examSems.length - 1];
            setSelectedExamSem(selectedSemester);

            const events = await w.get_exam_events(selectedSemester);
            setExamEvents(events);

            if (events.length > 0) {
              const firstEvent = events[events.length - 1];
              setSelectedExamEvent(firstEvent);

              const response = await w.get_exam_schedule(firstEvent);
              setExamSchedule({
                [firstEvent.exam_event_id]: response.subjectinfo,
              });
              updateExamDatesInLocalStorage(response.subjectinfo);
            }
          }
        } finally {
          setLoading(false);
        }
      } else if (selectedExamSem && examEvents.length === 0) {
        setLoading(true);
        try {
          const events = await w.get_exam_events(selectedExamSem);
          setExamEvents(events);
          if (events.length > 0 && !selectedExamEvent) {
            setSelectedExamEvent(events[events.length - 1]);
          }
        } finally {
          setLoading(false);
        }
      }
    };
    fetchInitialData();
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
  ]);

  const handleSemesterChange = async (value) => {
    setLoading(true);
    try {
      const semester = examSemesters.find(
        (sem) => sem.registration_id === value
      );
      setSelectedExamSem(semester);
      const events = await w.get_exam_events(semester);
      setExamEvents(events);
      setSelectedExamEvent(null);
      setExamSchedule({});

      if (events.length > 0) {
        const lastEvent = events[events.length - 1];
        setSelectedExamEvent(lastEvent);
        const response = await w.get_exam_schedule(lastEvent);
        setExamSchedule({
          [lastEvent.exam_event_id]: response.subjectinfo,
        });
        updateExamDatesInLocalStorage(response.subjectinfo);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = async (value) => {
    setLoading(true);
    try {
      const selectedEvent = examEvents.find(
        (evt) => evt.exam_event_id === value
      );
      setSelectedExamEvent(selectedEvent);

      if (!examSchedule[value]) {
        const response = await w.get_exam_schedule(selectedEvent);
        setExamSchedule((prev) => ({
          ...prev,
          [value]: response.subjectinfo,
        }));
        updateExamDatesInLocalStorage(response.subjectinfo);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentSchedule =
    selectedExamEvent && examSchedule[selectedExamEvent.exam_event_id];

  const formatDate = (dateStr) => {
    const [day, month, year] = dateStr.split("/");
    return new Date(`${month}/${day}/${year}`).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Helmet>
        <title>Exams - JP Portal | JIIT Student Portal</title>
        <meta name="description" content="View exam schedules and downloadable schedules for your semesters at JIIT." />
        <meta name="keywords" content="JIIT exams, exam schedule, JP Portal" />
        <link rel="canonical" href="https://jportal2-0.vercel.app/#/exams" />
      </Helmet>
      <div className="container mx-auto p-4 space-y-6 max-w-[1440px] pb-24">
        <div className="bg-card shadow rounded-lg p-6 md:max-w-[50%] md:mx-auto">
          <meta property="og:title" content="Exams - JP Portal | JIIT Student Portal" />
          <meta property="og:description" content="View exam schedules and downloadable schedules for your semesters at JIIT." />
          <meta property="og:url" content="https://jportal2-0.vercel.app/#/exams" />
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            Exam Schedule
          </h2>
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
            <div className="flex-1">
              <Select
                onValueChange={handleSemesterChange}
                value={selectedExamSem?.registration_id || ""}
              >
                <SelectTrigger className="w-full bg-muted/10 text-foreground border border-border">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {examSemesters.map((sem) => (
                    <SelectItem
                      key={sem.registration_id}
                      value={sem.registration_id}
                    >
                      {sem.registration_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedExamSem && (
              <div className="flex-1">
                <Select
                  onValueChange={handleEventChange}
                  value={selectedExamEvent?.exam_event_id || ""}
                >
                  <SelectTrigger className="w-full bg-muted/10 text-foreground border border-border">
                    <SelectValue placeholder="Select exam event" />
                  </SelectTrigger>
                  <SelectContent>
                    {examEvents.map((event) => (
                      <SelectItem
                        key={event.exam_event_id}
                        value={event.exam_event_id}
                      >
                        {event.exam_event_desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : currentSchedule?.length > 0 ? (
          <ExamScheduleGrid
            currentSchedule={currentSchedule}
            formatDate={formatDate}
          />
        ) : selectedExamEvent ? (
          <div className="bg-card shadow rounded-lg p-6 flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              No exam schedule available
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

function ExamScheduleGrid({ currentSchedule, formatDate }) {
  const now = new Date();
  const fourHours = 4 * 60 * 60 * 1000;

  const parseExamDateTime = (dateStr, timeStr) => {
    const [day, month, year] = dateStr.split("/");
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":");

    let hour24 = parseInt(hours);
    if (period?.toUpperCase() === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period?.toUpperCase() === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hour24,
      parseInt(minutes)
    );
  };

  let nextExamId = null;
  let nearestTime = Infinity;

  currentSchedule.forEach((exam) => {
    const examDateTime = parseExamDateTime(
      exam.datetime,
      exam.datetimefrom || "00:00"
    );
    const timeDiff = examDateTime.getTime() - now.getTime();

    if (timeDiff > 0 && timeDiff <= fourHours && timeDiff < nearestTime) {
      nearestTime = timeDiff;
      nextExamId = `${exam.subjectcode}-${exam.datetime}-${exam.datetimefrom}`;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-4">
      {currentSchedule.map((exam) => (
        <ExamCard
          key={`${exam.subjectcode}-${exam.datetime}-${exam.datetimefrom}`}
          exam={exam}
          formatDate={formatDate}
          showTimer={
            `${exam.subjectcode}-${exam.datetime}-${exam.datetimefrom}` ===
            nextExamId
          }
        />
      ))}
    </div>
  );
}

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isWithin4Hours, setIsWithin4Hours] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;
      const fourHours = 4 * 60 * 60 * 1000;
      const within4Hours = difference > 0 && difference <= fourHours;
      setIsWithin4Hours(within4Hours);

      if (difference > 0 && within4Hours) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return { timeLeft, isWithin4Hours };
}

function ExamCard({ exam, formatDate, showTimer = false }) {
  const parseExamDateTime = (dateStr, timeStr) => {
    const [day, month, year] = dateStr.split("/");
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":");

    let hour24 = parseInt(hours);
    if (period?.toUpperCase() === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period?.toUpperCase() === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hour24,
      parseInt(minutes)
    );
  };

  const examDateTime = parseExamDateTime(
    exam.datetime,
    exam.datetimefrom || "00:00"
  );
  const { timeLeft } = useCountdown(examDateTime);

  return (
    <div className="bg-card shadow rounded-lg p-6 border border-border">
      <div className="space-y-2">
        {showTimer && timeLeft && (
          <div className="bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-500 dark:to-orange-500 p-4 rounded-lg border-2 border-red-400 shadow-lg">
            <div className="flex items-center justify-center gap-2 text-white">
              <Timer className="w-5 h-5 animate-pulse" />
              <span className="font-bold text-lg">
                Exam starts in: {timeLeft.hours}h {timeLeft.minutes}m{" "}
                {timeLeft.seconds}s
              </span>
            </div>
          </div>
        )}

        <div className="border-b border-border pb-3">
          <h3 className="font-semibold text-lg sm:text-xl text-foreground">
            {exam.subjectdesc.split("(")[0].trim()}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {exam.subjectcode}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
              <span>{formatDate(exam.datetime)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
              <span>{exam.datetimeupto}</span>
            </div>
          </div>

          {(exam.roomcode || exam.seatno) && (
            <div className="space-y-3 text-sm">
              {exam.roomcode && (
                <div className="flex items-center bg-accent/10 px-3 py-2 rounded-lg">
                  <MapPin className="mr-2 h-5 w-5 text-accent-foreground" />
                  <span className="text-accent-foreground font-medium">
                    Room: {" "}
                    <span className="text-accent-foreground font-semibold">
                      {exam.roomcode}
                    </span>
                  </span>
                </div>
              )}
              {exam.seatno && (
                <div className="flex items-center bg-secondary/10 px-3 py-2 rounded-lg">
                  <Armchair className="mr-2 h-5 w-5 text-secondary-foreground" />
                  <span className="text-secondary-foreground font-medium">
                    Seat: {" "}
                    <span className="text-secondary-foreground font-semibold">
                      {exam.seatno}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-muted/10 rounded"></div>
              <div className="h-4 w-24 bg-muted/10 rounded"></div>
            </div>
            <div className="h-6 w-16 bg-muted/10 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted/10 rounded"></div>
            <div className="h-4 w-full bg-muted/10 rounded"></div>
            <div className="h-4 w-full bg-muted/10 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
