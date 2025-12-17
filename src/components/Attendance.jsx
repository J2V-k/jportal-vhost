import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  getAttendanceFromCache,
  saveAttendanceToCache,
  getSubjectDataFromCache,
  saveSubjectDataToCache,
  getSemesterFromCache,
  getSemestersFromCache,
  saveSemestersToCache,
} from "@/components/scripts/cache";
import AttendanceCard from "./AttendanceCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Calendar,
  BarChart3,
  Archive,
  CalendarDays,
} from "lucide-react";
import { Helmet } from 'react-helmet-async';

const Attendance = ({
  w,
  attendanceData,
  setAttendanceData,
  semestersData,
  setSemestersData,
  selectedSem,
  setSelectedSem,
  attendanceGoal,
  setAttendanceGoal,
  subjectAttendanceData,
  setSubjectAttendanceData,
  selectedSubject,
  setSelectedSubject,
  isAttendanceMetaLoading,
  setIsAttendanceMetaLoading,
  isAttendanceDataLoading,
  setIsAttendanceDataLoading,
  activeTab,
  setActiveTab,
  dailyDate,
  setDailyDate,
  calendarOpen,
  setCalendarOpen,
  subjectCacheStatus,
  setSubjectCacheStatus,
}) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [sortOrder, setSortOrder] = useState('default');

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const timeDiff = now - new Date(timestamp);
    
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchSemesters = async () => {
      if (semestersData) {
        if (semestersData.semesters.length > 0 && !selectedSem) {
          const currentYear = new Date().getFullYear().toString();
          const currentYearSemester = semestersData.semesters.find(sem =>
            sem.registration_code && sem.registration_code.includes(currentYear)
          );
          setSelectedSem(currentYearSemester || semestersData.latest_semester);
        }
        return;
      }

      setIsAttendanceMetaLoading(true);
      setIsAttendanceDataLoading(true);
      try {
        const username = (typeof window !== 'undefined' && localStorage.getItem('username')) || w.username || 'user';
        const cachedSemList = await getSemestersFromCache(username);
        if (cachedSemList) {
          const header = semestersData?.latest_header || null;
          setSemestersData({
            semesters: cachedSemList,
            latest_header: header,
            latest_semester: cachedSemList[0] || null,
          });
          setIsAttendanceMetaLoading(false);
          setIsAttendanceDataLoading(false);
        }
      } catch (e) {
      }
      try {
        const meta = await w.get_attendance_meta();
        if (!meta) {
          setSemestersData({ semesters: [], latest_header: null, latest_semester: null });
          setIsAttendanceMetaLoading(false);
          setIsAttendanceDataLoading(false);
          return;
        }
        const header = (meta.latest_header && meta.latest_header()) || null;
        const latestSem = (meta.latest_semester && meta.latest_semester()) || null;

        setSemestersData({
          semesters: meta.semesters,
          latest_header: header,
          latest_semester: latestSem,
        });
        try {
          const username = (typeof window !== 'undefined' && localStorage.getItem('username')) || w.username || 'user';
          await saveSemestersToCache(meta.semesters, username);
        } catch (e) {
        }

        const currentYear = new Date().getFullYear().toString();
        const currentYearSemester = meta.semesters.find(sem =>
          sem.registration_code && sem.registration_code.includes(currentYear)
        );
        const semesterToLoad = currentYearSemester || latestSem;

        const username = (typeof window !== 'undefined' && localStorage.getItem('username')) || w.username || 'user';
        const cached = await getAttendanceFromCache(username, semesterToLoad);
        if (cached) {
          setAttendanceData((prev) => ({
            ...prev,
            [semesterToLoad.registration_id]: cached.data || cached,
          }));
          setSelectedSem(semesterToLoad);
          setCacheTimestamp(cached.timestamp || null);
          setIsFromCache(true);
          setIsAttendanceMetaLoading(false);
          setIsAttendanceDataLoading(false);
          setIsRefreshing(true);
          try {
                const data = await w.get_attendance(header, semesterToLoad);
                if (!data) {
                  setAttendanceData((prev) => ({
                    ...prev,
                    [semesterToLoad.registration_id]: { error: 'No cached attendance available' },
                  }));
                  setIsRefreshing(false);
                  return;
                }
            setAttendanceData((prev) => ({
              ...prev,
              [semesterToLoad.registration_id]: data,
            }));
            await saveAttendanceToCache(data, username, semesterToLoad);
            setCacheTimestamp(Date.now());
            setIsFromCache(false);
          } catch (error) {
            setAttendanceData((prev) => ({
              ...prev,
              [semesterToLoad.registration_id]: {
                error: error.message
              },
            }));
          }
          setIsRefreshing(false);
          return;
        }

        try {
          const data = await w.get_attendance(header, semesterToLoad);
          setAttendanceData((prev) => ({
            ...prev,
            [semesterToLoad.registration_id]: data,
          }));
          setSelectedSem(semesterToLoad);
          await saveAttendanceToCache(data, username, semesterToLoad);
          setCacheTimestamp(Date.now());
        } catch (error) {
          setAttendanceData((prev) => ({
            ...prev,
            [semesterToLoad.registration_id]: {
              error: error.message
            },
          }));
          setSelectedSem(semesterToLoad);
        }
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
      } finally {
        setIsAttendanceMetaLoading(false);
        setIsAttendanceDataLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchSemesters();
  }, [w, setAttendanceData, semestersData, setSemestersData]);

  const handleSemesterChange = async (value) => {
    const semester = semestersData.semesters.find(
      (sem) => sem.registration_id === value
    );
    setSelectedSem(semester);

    if (attendanceData[value]) {
      setIsFromCache(false);
      setCacheTimestamp(null);
      setIsRefreshing(false);
      return;
    }

    setIsAttendanceDataLoading(true);
    const username = (typeof window !== 'undefined' && localStorage.getItem('username')) || w.username || 'user';
    const cached = await getAttendanceFromCache(username, semester);
    if (cached) {
      setAttendanceData((prev) => ({
        ...prev,
        [value]: cached.data || cached,
      }));
      setCacheTimestamp(cached.timestamp || null);
      setIsFromCache(true);
      setIsAttendanceDataLoading(false);
      setIsRefreshing(true);
        try {
          const meta = await w.get_attendance_meta();
          if (!meta) throw new Error('No attendance metadata available');
          const header = (meta.latest_header && meta.latest_header()) || null;
          const data = await w.get_attendance(header, semester);
          if (!data) throw new Error('No cached attendance available');
        setAttendanceData((prev) => ({
          ...prev,
          [value]: data,
        }));
        await saveAttendanceToCache(data, username, semester);
        setCacheTimestamp(Date.now());
        setIsFromCache(false);
      } catch (error) {
        setAttendanceData((prev) => ({
          ...prev,
          [value]: { error: error.message },
        }));
      }
      setIsRefreshing(false);
      return;
    }
    try {
      const meta = await w.get_attendance_meta();
      const header = meta.latest_header();
      const data = await w.get_attendance(header, semester);
      setAttendanceData((prev) => ({
        ...prev,
        [value]: data,
      }));
      await saveAttendanceToCache(data, username, semester);
      setCacheTimestamp(Date.now());
    } catch (error) {
      setAttendanceData((prev) => ({
        ...prev,
        [value]: { error: error.message },
      }));
    } finally {
      setIsAttendanceDataLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleGoalChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value);
    if (value === "" || (!isNaN(value) && value > 0 && value <= 100)) {
      setAttendanceGoal(value);
    }
  };

  const safeDailyDate =
    dailyDate instanceof Date && !isNaN(dailyDate) ? dailyDate : new Date();

  const subjects = useMemo(() => {
    const mappedSubjects = (selectedSem &&
      attendanceData[selectedSem.registration_id]?.studentattendancelist?.map(
        (item) => {
          const {
            subjectcode,
            Ltotalclass,
            Ltotalpres,
            Lpercentage,
            Ttotalclass,
            Ttotalpres,
            Tpercentage,
            Ptotalclass,
            Ptotalpres,
            Ppercentage,
            LTpercantage,
          } = item;

          const { attended, total } = {
            attended: (Ltotalpres || 0) + (Ttotalpres || 0) + (Ptotalpres || 0),
            total: (Ltotalclass || 0) + (Ttotalclass || 0) + (Ptotalclass || 0),
          };

          const currentPercentage = (attended / total) * 100;
          const classesNeeded = attendanceGoal
            ? Math.ceil(
                (attendanceGoal * total - 100 * attended) /
                  (100 - attendanceGoal)
              )
            : null;
          const classesCanMiss = attendanceGoal
            ? Math.floor(
                (100 * attended - attendanceGoal * total) / attendanceGoal
              )
            : null;

          return {
            name: subjectcode,
            attendance: {
              attended,
              total,
            },
            combined: LTpercantage,
            lecture:
              Lpercentage !== undefined && Lpercentage !== null
                ? String(Lpercentage)
                : "",
            tutorial:
              Tpercentage !== undefined && Tpercentage !== null
                ? String(Tpercentage)
                : "",
            practical:
              Ppercentage !== undefined && Ppercentage !== null
                ? String(Ppercentage)
                : "",
            classesNeeded: classesNeeded > 0 ? classesNeeded : 0,
            classesCanMiss: classesCanMiss > 0 ? classesCanMiss : 0,
            hasPractical: (Ptotalclass || 0) > 0,
          };
        }
      )) ||
    [];

    if (sortOrder === 'default') {
      const isDesktop = window.innerWidth > 768;
      if (isDesktop) {
        return mappedSubjects.sort((a, b) => {
          if (a.hasPractical && !b.hasPractical) return 1;
          if (!a.hasPractical && b.hasPractical) return -1;
          return 0;
        });
      }
      return mappedSubjects;
    }
    return [...mappedSubjects].sort((a, b) => {
      const aPerc = parseFloat(a.combined) || 0;
      const bPerc = parseFloat(b.combined) || 0;
      if (sortOrder === 'asc') return aPerc - bPerc;
      return bPerc - aPerc;
    });
  }, [selectedSem, attendanceData, attendanceGoal, sortOrder]);

  const fetchSubjectAttendance = async (subject) => {
    try {
      const username = (typeof window !== 'undefined' && localStorage.getItem('username')) || w.username || 'user';
      const cached = await getSubjectDataFromCache(subject.name, username, selectedSem);
      
      if (cached) {
        setSubjectAttendanceData((prev) => ({
          ...prev,
          [subject.name]: cached.data || cached,
        }));
        
        await fetchFreshSubjectData(subject, username);
        return;
      }
      await fetchFreshSubjectData(subject, username);
    } catch (error) {
      console.error("Failed to fetch subject attendance:", error);
    }
  };

  const fetchFreshSubjectData = async (subject, username) => {
    try {
      const attendance = attendanceData[selectedSem.registration_id];
      const subjectData = attendance.studentattendancelist.find(
        (s) => s.subjectcode === subject.name
      );

      if (!subjectData) return;

      const subjectcomponentids = [
        "Lsubjectcomponentid",
        "Psubjectcomponentid",
        "Tsubjectcomponentid",
      ]
        .filter((id) => subjectData[id])
        .map((id) => subjectData[id]);

      const data = await w.get_subject_daily_attendance(
        selectedSem,
        subjectData.subjectid,
        subjectData.individualsubjectcode,
        subjectcomponentids
      );

      if (!data || !data.studentAttdsummarylist) {
        return;
      }
      const freshData = data.studentAttdsummarylist;
      
      setSubjectAttendanceData((prev) => ({
        ...prev,
        [subject.name]: freshData,
      }));

      await saveSubjectDataToCache(freshData, subject.name, username, selectedSem);
    } catch (error) {
      console.error("Failed to fetch fresh subject attendance:", error);
    }
  };

  useEffect(() => {
    if (activeTab !== "daily") return;

    const loadAllSubjects = async () => {
      await Promise.all(
        subjects.map(async (subj) => {
          if (subjectAttendanceData[subj.name]) {
            setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "cached" }));
            return;
          }
          setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "fetching" }));
          await fetchSubjectAttendance(subj);
          setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "cached" }));
        })
      );
    };
    loadAllSubjects();
  }, [activeTab]);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['overview', 'daily'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, setActiveTab]);

  useEffect(() => {
    if (activeTab) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('tab', activeTab);
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  const getClassesFor = (subjectName, date) => {
    const all = subjectAttendanceData[subjectName];
    if (!all) return [];
    const key = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return all.filter((c) => c.datetime.startsWith(key));
  };

  return (
    <>
      <Helmet>
        <title>Attendance - JP Portal | JIIT Student Portal</title>
        <meta name="description" content="Track your attendance records, view subject-wise attendance percentages, and monitor your daily class attendance at Jaypee Institute of Information Technology (JIIT)." />
        <meta name="keywords" content="attendance records, subject-wise attendance, daily attendance, JIIT attendance, JP Portal, JIIT, student portal, jportal, jpportal, jp_portal, jp portal" />
        <meta property="og:title" content="Attendance - JP Portal | JIIT Student Portal" />
        <meta property="og:description" content="Track your attendance records, view subject-wise attendance percentages, and monitor your daily class attendance at Jaypee Institute of Information Technology (JIIT)." />
        <meta property="og:url" content="https://jportal2-0.vercel.app/attendance" />
        <link rel="canonical" href="https://jportal2-0.vercel.app/attendance" />
      </Helmet>
      <div className="text-white dark:text-black font-sans">
      <div className="top-14 left-0 right-0 bg-[black] dark:bg-white z-10">
        <div className="flex gap-2 py-2 px-3 max-w-[1440px] mx-auto">
          <Select
            onValueChange={handleSemesterChange}
            value={selectedSem?.registration_id}
          >
            <SelectTrigger className="bg-[#0B0B0D] dark:bg-[#f9f9f9] text-white dark:text-black border-white dark:border-black">
              <SelectValue
                placeholder={
                  isAttendanceMetaLoading
                    ? "Loading semesters..."
                    : "Select semester"
                }
              >
                {selectedSem?.registration_code}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#0B0D0D] dark:bg-[#f9f9f9] text-white dark:text-black border-white dark:border-black">
              {semestersData?.semesters?.map((sem) => (
                <SelectItem
                  key={sem.registration_id}
                  value={sem.registration_id}
                  className="dark:text-black text-white hover:bg-black"
                >
                  {sem.registration_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={attendanceGoal}
            onChange={handleGoalChange}
            min="-1"
            max="100"
            className="w-32 bg-[#0B0D0D] dark:bg-[#f9f9f9] text-white dark:text-black border-white dark:border-black"
            placeholder="Goal %"
          />
          <button
            onClick={() => setSortOrder(prev => prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default')}
            className="flex items-center gap-2 px-3 py-1 bg-[#0B0D0D] dark:bg-[#f9f9f9] text-white dark:text-black border border-white dark:border-black rounded text-xs font-medium hover:bg-[#1A1A1D] dark:hover:bg-gray-200 hover:text-white dark:hover:text-black transition-colors"
            title={`Sort by attendance: ${sortOrder === 'default' ? 'Default' : sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            {sortOrder === 'asc' ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="hidden md:inline">Ascending</span>
              </>
            ) : sortOrder === 'desc' ? (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="hidden md:inline">Descending</span>
              </>
            ) : (
              <>
                <ArrowUpDown className="w-4 h-4" />
                <span className="hidden md:inline">Default</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!attendanceData[selectedSem?.registration_id]?.error && (
        <div className="flex items-center justify-center py-2 text-xs text-gray-400 dark:text-gray-600">
          <span>
            {cacheTimestamp  && isFromCache ? (
              <span className="flex items-center gap-1">
                <Archive size={12} />
                Cached: {getRelativeTime(cacheTimestamp)}
              </span>
            ) : (
              ''
            )}
          </span>
          {isRefreshing && (
            <span className="ml-2 flex items-center gap-1">
              <Loader2 className="animate-spin w-4 h-4" />
              Refreshing...
            </span>
          )}
        </div>
      )}
      {isAttendanceMetaLoading || isAttendanceDataLoading ? (
        <div className="flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)]">
          <Loader2 className="animate-spin text-white dark:text-black w-6 h-6 mr-2" />
          Loading attendance...
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="px-3 pb-4 max-w-[1440px] mx-auto"
        >
          <TabsList className="grid grid-cols-2 bg-[#0B0D0D] dark:bg-white relative z-30">
            <TabsTrigger
              value="overview"
              className="bg-[#0B0D0D] dark:bg-white data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="daily"
              className="bg-[#0B0D0D] dark:bg-white data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              Day‑to‑Day
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {selectedSem &&
            attendanceData[selectedSem.registration_id]?.error ? (
              <div className="flex items-center justify-center py-4">
                {attendanceData[selectedSem.registration_id].error}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((subject) => (
                  <AttendanceCard
                    key={subject.name}
                    subject={subject}
                    selectedSubject={selectedSubject}
                    setSelectedSubject={setSelectedSubject}
                    subjectAttendanceData={subjectAttendanceData}
                    fetchSubjectAttendance={fetchSubjectAttendance}
                    attendanceGoal={attendanceGoal}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="daily">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-1 order-2 lg:order-1">
                  <div className="sticky top-4">
                    <div className="bg-[#0B0D0D] dark:bg-gray-50 rounded-lg p-4 border border-gray-800 dark:border-gray-200 shadow-lg flex flex-col items-center">
                      <h3 className="text-lg font-semibold mb-3 text-white dark:text-black text-center">
                        Select Date
                      </h3>
                      <CalendarComponent
                        mode="single"
                        selected={safeDailyDate}
                        onSelect={(d) => {
                          if (d) {
                            setDailyDate(d);
                          }
                        }}
                        modifiers={{
                          hasActivity: (date) =>
                            subjects.some(
                              (s) => getClassesFor(s.name, date).length > 0
                            ),
                          selected: (date) =>
                            date.toDateString() ===
                            safeDailyDate.toDateString(),
                        }}
                        modifiersStyles={{
                          hasActivity: {
                            backgroundColor: "rgba(59, 130, 246, 0.2)",
                            border: "2px solid rgba(59, 130, 246, 0.6)",
                            borderRadius: "6px",
                            fontWeight: "bold",
                          },
                        }}
                        classNames={{
                          day_selected:
                            "bg-[#1e40af] text-white border-2 border-[#1e40af] hover:bg-[#1e40af] hover:text-white hover:border-[#1e40af] rounded-md",
                          day_today:
                            "aria-selected:bg-[#1e40af] aria-selected:text-white aria-selected:border-[#1e40af] bg-accent text-accent-foreground",
                        }}
                        className="dark:bg-white dark:text-black rounded-md border-0"
                      />
                      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full border border-blue-300"></div>
                          <span>Has Classes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 order-1 lg:order-2">
                  <div className="min-h-[400px]">
                    {isAttendanceDataLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                          <p className="text-gray-400 dark:text-gray-600">
                            Loading attendance data...
                          </p>
                        </div>
                      </div>
                    ) : subjects.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400 dark:text-gray-600 text-lg">
                          No subjects found.
                        </p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                          Please select a semester first.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {subjects.flatMap((subj) => {
                          const lectures = getClassesFor(
                            subj.name,
                            safeDailyDate
                          );
                          if (lectures.length === 0) return [];
                          return (
                            <div
                              key={subj.name}
                              className="bg-[#0B0D0D] dark:bg-gray-50 rounded-lg p-4 border border-gray-800 dark:border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200"
                            >
                              <h3 className="font-semibold mb-3 text-white dark:text-black flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                {subj.name}
                              </h3>
                              <div className="space-y-2">
                                {lectures.map((cls, i) => (
                                  <div
                                    key={i}
                                    className={`flex justify-between items-center p-3 rounded-md text-sm ${
                                      cls.present === "Present"
                                        ? "bg-green-900/20 dark:bg-green-100 border border-green-700 dark:border-green-300"
                                        : "bg-red-900/20 dark:bg-red-100 border border-red-700 dark:border-red-300"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-2 h-2 rounded-full ${
                                          cls.present === "Present"
                                            ? "bg-green-400"
                                            : "bg-red-400"
                                        }`}
                                      ></div>
                                      <span
                                        className={
                                          cls.present === "Present"
                                            ? "text-green-400 dark:text-green-700"
                                            : "text-red-400 dark:text-red-700"
                                        }
                                      >
                                        {cls.classtype}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`font-medium ${
                                          cls.present === "Present"
                                            ? "text-green-400 dark:text-green-700"
                                            : "text-red-400 dark:text-red-700"
                                        }`}
                                      >
                                        {cls.present}
                                      </span>
                                      <span className="text-gray-400 dark:text-gray-600 text-xs">
                                        {cls.datetime
                                          .split(" ")
                                          .slice(1)
                                          .join(" ")
                                          .slice(1, -1)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {subjects.every(
                      (s) => getClassesFor(s.name, safeDailyDate).length === 0
                    ) &&
                      subjects.length > 0 && (
                        <div className="text-center py-12">
                          <div className="text-4xl mb-4">
                            <Calendar className="w-10 h-10 mx-auto text-blue-400" />
                          </div>
                          <p className="text-gray-400 dark:text-gray-600 text-lg font-medium">
                            No classes scheduled
                          </p>
                          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                            {safeDailyDate.toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {subjects.length > 0 &&
              subjectCacheStatus &&
              typeof subjectCacheStatus === "object" &&
              Object.values(subjectCacheStatus).some((s) => s !== "cached") && (
                <div className="mb-6 p-4 bg-[#0B0D0D] dark:bg-gray-50 rounded-lg border border-gray-800 dark:border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-white dark:text-black flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Fetching Daily Attendance
                    </h4>
                    <span className="text-xs text-gray-400 dark:text-gray-600">
                      {
                        subjects.filter(
                          (s) => subjectCacheStatus[s.name] === "cached"
                        ).length
                      }{" "}
                      of {subjects.length} subjects
                    </span>
                  </div>
                  <Progress
                    value={
                      (100 *
                        subjects.filter((s) => subjectCacheStatus[s.name] === "cached").length) /
                      subjects.length
                    }
                  />
                </div>
              )}
          </TabsContent>
        </Tabs>
      )}
      <div className="h-16 md:h-20" />
    </div>
    </>
  );
};

export default Attendance;
