"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, Armchair, Timer } from "lucide-react";
import { ArtificialWebPortal } from "./scripts/artificialW";
import { setExamDates } from '@/components/scripts/cache';
import {
  saveExamSemestersToCache,
  getExamSemestersFromCache,
  saveExamEventsToCache,
  getExamEventsFromCache,
  saveExamScheduleToCache,
  getExamScheduleFromCache,
  getUsername
} from '@/components/scripts/cache';
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
  const [examEvents, setExamEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);

  const isOffline = w && (w instanceof ArtificialWebPortal || (w.constructor && w.constructor.name === 'ArtificialWebPortal'))
  
  // Load cached data when offline
  useEffect(() => {
    const loadCachedData = async () => {
      if (!isOffline) return;
      
      setLoading(true);
      setIsFromCache(true);
      
      try {
        const username = getUsername();
        if (!username) return;
        
        // Load cached exam semesters
        const cachedSemesters = await getExamSemestersFromCache(username);
        if (cachedSemesters && cachedSemesters.length > 0) {
          setExamSemesters(cachedSemesters);
          
          // Try to restore selected semester from localStorage
          const storedSemesterId = localStorage.getItem('selectedExamSemesterId');
          let semesterToSelect = null;
          
          if (storedSemesterId) {
            semesterToSelect = cachedSemesters.find(sem => sem.registration_id === storedSemesterId);
          }
          
          // Fallback to first semester
          semesterToSelect = semesterToSelect || cachedSemesters[0];
          
          if (semesterToSelect) {
            setSelectedExamSem(semesterToSelect);
            
            // Load cached exam events for the selected semester
            const cachedEvents = await getExamEventsFromCache(semesterToSelect.registration_id, username);
            if (cachedEvents && cachedEvents.length > 0) {
              setExamEvents(cachedEvents);
              
              // Try to restore selected event from localStorage
              const storedEventId = localStorage.getItem('selectedExamEventId');
              let eventToSelect = null;
              
              if (storedEventId) {
                eventToSelect = cachedEvents.find(evt => evt.exam_event_id === storedEventId);
              }
              
              // Fallback to first event
              eventToSelect = eventToSelect || cachedEvents[0];
              
              if (eventToSelect) {
                setSelectedExamEvent(eventToSelect);
                
                // Load cached exam schedule for the selected event
                const cachedSchedule = await getExamScheduleFromCache(eventToSelect.exam_event_id, username);
                if (cachedSchedule) {
                  setExamSchedule({
                    [eventToSelect.exam_event_id]: cachedSchedule,
                  });
                  updateExamDates(cachedSchedule);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to load cached exam data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCachedData();
  }, [isOffline]);

  const updateExamDates = (examScheduleData) => {
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

      setExamDates(earliestDate.toISOString(), latestDate.toISOString());
    } catch (error) {
      console.error("Failed to update exam dates:", error);
    }
  }; 

  // Persist selected exam event to localStorage
  useEffect(() => {
    if (selectedExamEvent) {
      localStorage.setItem('selectedExamEventId', selectedExamEvent.exam_event_id);
    }
  }, [selectedExamEvent?.exam_event_id]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (isOffline) return; // Skip fetching when offline
      
      if (examSemesters.length === 0) {
        setLoading(true);
        try {
          const username = getUsername();
          const examSems = await w.get_semesters_for_exam_events();
          setExamSemesters(examSems);
          
          // Save to cache
          if (username) {
            await saveExamSemestersToCache(examSems, username);
          }

          if (examSems.length > 0) {
            const currentYear = new Date().getFullYear().toString();
            const currentYearSemester = examSems.find(sem =>
              sem.registration_code && sem.registration_code.includes(currentYear)
            );
            const selectedSemester = currentYearSemester || examSems[examSems.length - 1];
            setSelectedExamSem(selectedSemester);
            localStorage.setItem('selectedExamSemesterId', selectedSemester.registration_id);

            const events = await w.get_exam_events(selectedSemester);
            setExamEvents(events);
            
            // Save events to cache
            if (username) {
              await saveExamEventsToCache(events, selectedSemester.registration_id, username);
            }

            if (events.length > 0) {
              const storedEventId = localStorage.getItem('selectedExamEventId');
              let eventToSelect = null;
              
              if (storedEventId) {
                eventToSelect = events.find(evt => evt.exam_event_id === storedEventId);
              }
              
              // Fallback to last event if stored event not found
              eventToSelect = eventToSelect || events[events.length - 1];
              
              setSelectedExamEvent(eventToSelect);

              const response = await w.get_exam_schedule(eventToSelect);
              setExamSchedule({
                [eventToSelect.exam_event_id]: response.subjectinfo,
              });
              
              // Save schedule to cache
              if (username) {
                await saveExamScheduleToCache(response.subjectinfo, eventToSelect.exam_event_id, username);
              }
              
              updateExamDates(response.subjectinfo);
            }
          }
        } finally {
          setLoading(false);
        }
      } else if (selectedExamSem && examEvents.length === 0) {
        setLoading(true);
        try {
          const username = getUsername();
          const events = await w.get_exam_events(selectedExamSem);
          setExamEvents(events);
          
          // Save events to cache
          if (username) {
            await saveExamEventsToCache(events, selectedExamSem.registration_id, username);
          }
          
          if (events.length > 0 && !selectedExamEvent) {
            // Try to restore from localStorage
            const storedEventId = localStorage.getItem('selectedExamEventId');
            let eventToSelect = null;
            
            if (storedEventId) {
              eventToSelect = events.find(evt => evt.exam_event_id === storedEventId);
            }
            
            // Fallback to last event if stored event not found
            eventToSelect = eventToSelect || events[events.length - 1];
            
            setSelectedExamEvent(eventToSelect);
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
    isOffline,
  ]);

  if (isOffline && examSemesters.length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-foreground">Exam Schedule Unavailable</h2>
          <p className="text-muted-foreground mt-2">Exam schedule is not available while offline. Connect to the internet to view exam schedules.</p>
        </div>
      </div>
    );
  }

  const handleSemesterChange = async (value) => {
    setLoading(true);
    try {
      const semester = examSemesters.find(
        (sem) => sem.registration_id === value
      );
      setSelectedExamSem(semester);
      localStorage.setItem('selectedExamSemesterId', value); // Store selected semester
      const events = await w.get_exam_events(semester);
      setExamEvents(events);
      setSelectedExamEvent(null);
      localStorage.removeItem('selectedExamEventId'); // Clear stored event when semester changes
      setExamSchedule({});

      // Save events to cache
      const username = getUsername();
      if (username && !isOffline) {
        await saveExamEventsToCache(events, semester.registration_id, username);
      }

      if (events.length > 0) {
        const lastEvent = events[events.length - 1];
        setSelectedExamEvent(lastEvent);
        const response = await w.get_exam_schedule(lastEvent);
        setExamSchedule({
          [lastEvent.exam_event_id]: response.subjectinfo,
        });
        
        // Save schedule to cache
        if (username && !isOffline) {
          await saveExamScheduleToCache(response.subjectinfo, lastEvent.exam_event_id, username);
        }
        
        updateExamDates(response.subjectinfo);
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
      // Store selected event to localStorage
      localStorage.setItem('selectedExamEventId', value);

      if (!examSchedule[value]) {
        const response = await w.get_exam_schedule(selectedEvent);
        setExamSchedule((prev) => ({
          ...prev,
          [value]: response.subjectinfo,
        }));
        
        // Save schedule to cache
        const username = getUsername();
        if (username && !isOffline) {
          await saveExamScheduleToCache(response.subjectinfo, value, username);
        }
        
        updateExamDates(response.subjectinfo);
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
      <div className="container mx-auto p-4 space-y-8 max-w-[1440px] pb-24">
        <div className="bg-card shadow-xl rounded-2xl p-8 border border-border">
          <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-4 lg:space-y-0">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Semester
              </label>
              <Select
                onValueChange={handleSemesterChange}
                value={selectedExamSem?.registration_id || ""}
              >
                <SelectTrigger className="w-full h-12 bg-background border-2 border-border hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Choose your semester" />
                </SelectTrigger>
                <SelectContent>
                  {examSemesters.map((sem) => (
                    <SelectItem
                      key={sem.registration_id}
                      value={sem.registration_id}
                      className="cursor-pointer"
                    >
                      {sem.registration_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedExamSem && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Exam Event
                </label>
                <Select
                  onValueChange={handleEventChange}
                  value={selectedExamEvent?.exam_event_id || ""}
                >
                  <SelectTrigger className="w-full h-12 bg-background border-2 border-border hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Choose exam event" />
                  </SelectTrigger>
                  <SelectContent>
                    {examEvents.map((event) => (
                      <SelectItem
                        key={event.exam_event_id}
                        value={event.exam_event_id}
                        className="cursor-pointer"
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
          <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Exam Schedule Available</h3>
            <p className="text-muted-foreground max-w-md">
              There are no exams scheduled for the selected exam event. Please check back later or select a different exam event.
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

  // Sort exams by date and time
  const sortedSchedule = [...currentSchedule].sort((a, b) => {
    const dateA = parseExamDateTime(a.datetime, a.datetimefrom || "00:00");
    const dateB = parseExamDateTime(b.datetime, b.datetimefrom || "00:00");
    return dateA - dateB;
  });

  const totalExams = sortedSchedule.length;
  const completedCount = sortedSchedule.filter((exam) => {
    const examTime = parseExamDateTime(exam.datetime, exam.datetimefrom || "00:00");
    const diff = examTime.getTime() - now.getTime();
    return diff <= -2 * 60 * 60 * 1000;
  }).length;
  const startingSoonCount = sortedSchedule.filter((exam) => {
    const examTime = parseExamDateTime(exam.datetime, exam.datetimefrom || "00:00");
    const diff = examTime.getTime() - now.getTime();
    return diff > 0 && diff <= fourHours;
  }).length;
  const ongoingCount = sortedSchedule.filter((exam) => {
    const examTime = parseExamDateTime(exam.datetime, exam.datetimefrom || "00:00");
    const diff = examTime.getTime() - now.getTime();
    return diff <= 0 && diff > -2 * 60 * 60 * 1000;
  }).length;
  const upcomingCount = Math.max(totalExams - completedCount - startingSoonCount - ongoingCount, 0);

  const completedWidth = totalExams ? (completedCount / totalExams) * 100 : 0;
  const ongoingWidth = totalExams ? (ongoingCount / totalExams) * 100 : 0;
  const soonWidth = totalExams ? (startingSoonCount / totalExams) * 100 : 0;
  const upcomingWidth = totalExams ? (upcomingCount / totalExams) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedSchedule.map((exam) => (
          <ExamCard
            key={`${exam.subjectcode}-${exam.datetime}-${exam.datetimefrom}`}
            exam={exam}
            formatDate={formatDate}
          />
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Exam progress</p>
          </div>
        </div>

        <div className="mt-4 h-3 flex overflow-hidden rounded-full bg-muted border border-border">
          <div className="h-full bg-primary transition-all" style={{ width: `${completedWidth}%` }} />
          <div className="h-full bg-accent transition-all" style={{ width: `${ongoingWidth}%` }} />
          <div className="h-full bg-secondary transition-all" style={{ width: `${soonWidth}%` }} />
          <div className="h-full bg-muted/60 transition-all" style={{ width: `${upcomingWidth}%` }} />
        </div>
      </div>
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

function ExamCard({ exam, formatDate, index }) {
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
  const now = new Date();
  const timeDiff = examDateTime.getTime() - now.getTime();
  const isUpcoming = timeDiff > 0;
  const isStartingSoon = timeDiff > 0 && timeDiff <= 4 * 60 * 60 * 1000;
  const isOngoing = timeDiff <= 0 && timeDiff > -2 * 60 * 60 * 1000; // Assume 2 hours duration
  const isCompleted = timeDiff <= -2 * 60 * 60 * 1000;

  const { timeLeft } = useCountdown(examDateTime);

  const statusClasses = isCompleted
    ? "bg-muted/70 text-muted-foreground"
    : isOngoing
    ? "bg-primary/10 text-primary"
    : isStartingSoon
    ? "bg-accent/10 text-accent-foreground"
    : "bg-secondary/10 text-secondary-foreground";

  return (
    <div className="relative bg-card text-card-foreground shadow-lg rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-border">

      {/* Countdown Timer for upcoming exams */}
      {isUpcoming && timeLeft && (
        <div className="mb-4 p-3 bg-muted/20 rounded-lg border border-border">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Timer className="w-4 h-4" />
            <span className="font-semibold text-sm text-foreground">
              Starts in: {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </span>
          </div>
        </div>
      )}

      {/* Subject Info */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-xl text-foreground leading-tight">
            {exam.subjectdesc.split("(")[0].trim()}
          </h3>
        </div>
        <p className="text-sm font-medium text-foreground bg-muted/20 px-2 py-1 rounded-md inline-block">
          {exam.subjectcode}
        </p>
      </div>

      {/* Exam Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Date & Time */}
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-muted/20 rounded-lg border border-border">
            <Calendar className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <div className="font-medium text-foreground">{formatDate(exam.datetime)}</div>
              <div className="text-sm text-muted-foreground">Exam Date</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-muted/20 rounded-lg border border-border">
            <Clock className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <div className="font-medium text-foreground">{exam.datetimeupto}</div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
          </div>
        </div>

        {/* Room & Seat */}
        {(exam.roomcode || exam.seatno) && (
          <div className="space-y-3">
            {exam.roomcode && (
              <div className="flex items-center p-3 bg-muted/20 rounded-lg border border-border">
                <MapPin className="mr-3 h-5 w-5 text-foreground flex-shrink-0" />
                <div>
                  <div className="font-semibold text-foreground">{exam.roomcode}</div>
                  <div className="text-sm text-muted-foreground">Room</div>
                </div>
              </div>
            )}
            {exam.seatno && (
              <div className="flex items-center p-3 bg-muted/20 rounded-lg border border-border">
                <Armchair className="mr-3 h-5 w-5 text-foreground flex-shrink-0" />
                <div>
                  <div className="font-semibold text-foreground">{exam.seatno}</div>
                  <div className="text-sm text-muted-foreground">Seat</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Exam Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card shadow-lg rounded-xl p-6 border border-border animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="h-6 w-6 bg-muted/20 rounded-full"></div>
              <div className="h-5 w-20 bg-muted/20 rounded-full"></div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="h-6 w-3/4 bg-muted/20 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-muted/20 rounded"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="h-12 bg-muted/20 rounded-lg"></div>
                  <div className="h-12 bg-muted/20 rounded-lg"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-12 bg-muted/20 rounded-lg"></div>
                  <div className="h-12 bg-muted/20 rounded-lg"></div>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="h-4 w-24 bg-muted/20 rounded mb-2"></div>
                <div className="h-2 bg-muted/20 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
