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
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Exam Schedule</h1>
          {isFromCache && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              Offline Mode - Showing Cached Data
            </div>
          )}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay organized with your exam timetable. Track upcoming exams, room assignments, and important deadlines.
          </p>
        </div>

        {/* Selection Controls */}
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

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">{sortedSchedule.length}</div>
          <div className="text-sm text-muted-foreground">Total Exams</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {sortedSchedule.filter(exam => parseExamDateTime(exam.datetime, exam.datetimefrom || "00:00") > now).length}
          </div>
          <div className="text-sm text-muted-foreground">Upcoming</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {sortedSchedule.filter(exam => {
              const examTime = parseExamDateTime(exam.datetime, exam.datetimefrom || "00:00");
              const timeDiff = examTime.getTime() - now.getTime();
              return timeDiff > 0 && timeDiff <= fourHours;
            }).length}
          </div>
          <div className="text-sm text-muted-foreground">Starting Soon</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {sortedSchedule.filter(exam => parseExamDateTime(exam.datetime, exam.datetimefrom || "00:00") <= now).length}
          </div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
      </div>

      {/* Exam Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedSchedule.map((exam, index) => (
          <ExamCard
            key={`${exam.subjectcode}-${exam.datetime}-${exam.datetimefrom}`}
            exam={exam}
            formatDate={formatDate}
            index={index}
          />
        ))}
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

  const getStatusColor = () => {
    if (isCompleted) return "bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700";
    if (isOngoing) return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800";
    if (isStartingSoon) return "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800";
    return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
  };

  const getStatusBadge = () => {
    if (isCompleted) return { text: "Completed", color: "bg-gray-500" };
    if (isOngoing) return { text: "Ongoing", color: "bg-blue-500" };
    if (isStartingSoon) return { text: "Starting Soon", color: "bg-orange-500" };
    return { text: "Upcoming", color: "bg-green-500" };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className={`relative bg-card shadow-lg rounded-xl p-6 border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${getStatusColor()}`}>
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${statusBadge.color}`}>
          {statusBadge.text}
        </span>
      </div>

      {/* Countdown Timer for upcoming exams */}
      {isUpcoming && timeLeft && (
        <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Timer className="w-4 h-4" />
            <span className="font-semibold text-sm">
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
        <p className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-md inline-block">
          {exam.subjectcode}
        </p>
      </div>

      {/* Exam Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Date & Time */}
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-muted/30 rounded-lg">
            <Calendar className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <div className="font-medium text-foreground">{formatDate(exam.datetime)}</div>
              <div className="text-sm text-muted-foreground">Exam Date</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-muted/30 rounded-lg">
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
              <div className="flex items-center p-3 bg-accent/20 rounded-lg border border-accent/30">
                <MapPin className="mr-3 h-5 w-5 text-accent-foreground flex-shrink-0" />
                <div>
                  <div className="font-semibold text-accent-foreground">{exam.roomcode}</div>
                  <div className="text-sm text-accent-foreground/70">Room</div>
                </div>
              </div>
            )}
            {exam.seatno && (
              <div className="flex items-center p-3 bg-secondary/20 rounded-lg border border-secondary/30">
                <Armchair className="mr-3 h-5 w-5 text-secondary-foreground flex-shrink-0" />
                <div>
                  <div className="font-semibold text-secondary-foreground">{exam.seatno}</div>
                  <div className="text-sm text-secondary-foreground/70">Seat</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Exam Progress</span>
          <span>
            {isCompleted ? "100%" :
             isOngoing ? "In Progress" :
             isStartingSoon ? "Starting Soon" :
             "Not Started"}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isCompleted ? "bg-gray-500 w-full" :
              isOngoing ? "bg-blue-500 w-3/4" :
              isStartingSoon ? "bg-orange-500 w-1/4" :
              "bg-green-500 w-0"
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 text-center animate-pulse">
            <div className="h-8 w-12 bg-muted/20 rounded mx-auto mb-2"></div>
            <div className="h-4 w-16 bg-muted/20 rounded mx-auto"></div>
          </div>
        ))}
      </div>

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
