import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getAttendanceFromCache,
  saveAttendanceToCache,
  getSubjectDataFromCache,
  saveSubjectDataToCache,
  getSemestersFromCache,
  saveSemestersToCache,
} from "@/components/scripts/cache";
import AttendanceCard from "./AttendanceCard";
import AttendanceDaily from "./AttendanceDaily"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  BarChart3,
  Archive,
  CalendarDays,
} from "lucide-react";
import { Helmet } from 'react-helmet-async';

const CACHE_DURATION = 4 * 60 * 60 * 1000;

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [sortOrder, setSortOrder] = useState('default');

  const cycleSortOrder = () => {
    setSortOrder(current => {
      if (current === 'default') return 'asc';
      if (current === 'asc') return 'desc';
      return 'default';
    });
  };

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
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['overview', 'daily'].includes(tabFromUrl)) {
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
      } catch (e) {}
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
        } catch (e) {}
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

          if (cached.timestamp && (Date.now() - cached.timestamp < CACHE_DURATION)) {
             return;
          }

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

      if (cached.timestamp && (Date.now() - cached.timestamp < CACHE_DURATION)) {
         return;
      }

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

  const subjects = useMemo(() => {
    const attendanceResponse = attendanceData[selectedSem?.registration_id];
    const studentList = attendanceResponse?.response?.studentattendancelist || attendanceResponse?.studentattendancelist;    
    const mappedSubjects = (selectedSem && studentList)?.map(
        (item) => {
          const {
            subjectcode,
            Ltotalclass, Ltotalpres, Lpercentage,
            Ttotalclass, Ttotalpres, Tpercentage,
            Ptotalclass, Ptotalpres, Ppercentage,
            LTpercantage,
          } = item;
          const isNewFormat = !Ltotalclass && !Ttotalclass && !Ptotalclass;          
          let attended = 0, total = 0;
          if (!isNewFormat) {
            attended = (Ltotalpres || 0) + (Ttotalpres || 0) + (Ptotalpres || 0);
            total = (Ltotalclass || 0) + (Ttotalclass || 0) + (Ptotalclass || 0);
          }
          let classesNeeded = 0, classesCanMiss = 0;
          if (total > 0 && attendanceGoal) {
            classesNeeded = Math.ceil((attendanceGoal * total - 100 * attended) / (100 - attendanceGoal));
            classesCanMiss = Math.floor((100 * attended - attendanceGoal * total) / attendanceGoal);
          }
          return {
            name: subjectcode,
            attendance: { attended, total },
            combined: LTpercantage,
            lecture: Lpercentage !== undefined && Lpercentage !== null ? String(Lpercentage) : "",
            tutorial: Tpercentage !== undefined && Tpercentage !== null ? String(Tpercentage) : "",
            practical: Ppercentage !== undefined && Ppercentage !== null ? String(Ppercentage) : "",
            classesNeeded: classesNeeded > 0 ? classesNeeded : 0,
            classesCanMiss: classesCanMiss > 0 ? classesCanMiss : 0,
            hasPractical: (Ptotalclass || 0) > 0,
            isNewFormat,
          };
        }
      ) || [];
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
        
        if (cached.timestamp && (Date.now() - cached.timestamp < CACHE_DURATION)) {
             return;
        }

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

      if (subjectcomponentids.length === 0) {
        setSubjectAttendanceData((prev) => ({
           ...prev,
           [subject.name]: []
        }));
        return; 
      }

      const data = await w.get_subject_daily_attendance(
        selectedSem,
        subjectData.subjectid,
        subjectData.individualsubjectcode,
        subjectcomponentids
      );

      if (!data || !data.studentAttdsummarylist) return;

      const freshData = data.studentAttdsummarylist;
      
      setSubjectAttendanceData((prev) => ({
        ...prev,
        [subject.name]: freshData,
      }));

      await saveSubjectDataToCache(freshData, subject.name, username, selectedSem);
    } catch (error) {
      console.error(`Failed to fetch fresh subject attendance for ${subject.name}:`, error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadSubjectsSequentially = async (subjectsToFetch) => {
      for (const subj of subjectsToFetch) {
        if (!isMounted) break;
        
        setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "fetching" }));
        
        await fetchSubjectAttendance(subj);
        
        await new Promise(r => setTimeout(r, 50));

        if (isMounted) {
            setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "cached" }));
        }
      }
    };

    if (activeTab === "daily") {
       const subjectsToFetch = subjects.filter(subj => !subjectAttendanceData[subj.name]);
       if (subjectsToFetch.length > 0) loadSubjectsSequentially(subjectsToFetch);
    } else if (activeTab === "overview") {
       const subjectsToFetch = subjects.filter(subj => subj.isNewFormat && !subjectAttendanceData[subj.name]);
       if (subjectsToFetch.length > 0) loadSubjectsSequentially(subjectsToFetch);
    }

    return () => { isMounted = false; };
  }, [activeTab, selectedSem?.registration_id, subjects]);

  return (
    <>
      <Helmet>
        <title>Attendance - JP Portal | JIIT Student Portal</title>
      </Helmet>
      <div className="text-foreground font-sans">
        <div className="top-14 left-0 right-0 bg-background z-10">
          <div className="flex gap-2 py-2 px-3 max-w-[1440px] mx-auto">
            <Select onValueChange={handleSemesterChange} value={selectedSem?.registration_id}>
              <SelectTrigger className="bg-background text-foreground border-border">
                <SelectValue placeholder={isAttendanceMetaLoading ? "Loading semesters..." : "Select semester"}>
                  {selectedSem?.registration_code}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background text-foreground border-border">
                {semestersData?.semesters?.map((sem) => (
                  <SelectItem key={sem.registration_id} value={sem.registration_id} className="text-foreground hover:bg-accent">
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
              className="w-32 bg-background text-foreground border-border"
              placeholder="Goal %"
            />
            <Button
              onClick={cycleSortOrder}
              variant="outline"
              className="bg-background border-border text-foreground hover:bg-accent"
            >
              {sortOrder === 'default' && <ArrowUpDown className="w-4 h-4 mr-1" />}
              {sortOrder === 'asc' && <ChevronUp className="w-4 h-4 mr-1" />}
              {sortOrder === 'desc' && <ChevronDown className="w-4 h-4 mr-1" />}
              <span className="hidden md:inline">
                {sortOrder === 'default' ? 'Default' : sortOrder === 'asc' ? 'Asc' : 'Desc'}
              </span>
            </Button>
          </div>
        </div>

        {!attendanceData[selectedSem?.registration_id]?.error && (
          <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
            <span>
              {cacheTimestamp && isFromCache ? (
                <span className="flex items-center gap-1">
                  <Archive size={12} /> Cached: {getRelativeTime(cacheTimestamp)}
                </span>
              ) : ''}
            </span>
            {isRefreshing && (
              <span className="ml-2 flex items-center gap-1">
                <Loader2 className="animate-spin w-4 h-4" /> Refreshing...
              </span>
            )}
          </div>
        )}

        {isAttendanceMetaLoading || isAttendanceDataLoading ? (
          <div className="flex items-center justify-center py-4 h-[calc(100vh-200px)]">
            <Loader2 className="animate-spin text-foreground w-6 h-6 mr-2" />
            Loading attendance...
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="px-3 pb-4 max-w-[1440px] mx-auto">
            <TabsList className="grid grid-cols-2 bg-background relative z-30">
              <TabsTrigger value="overview" className="bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="daily" className="bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> Day-to-Day
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {selectedSem && attendanceData[selectedSem.registration_id]?.error ? (
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
              <AttendanceDaily 
                dailyDate={dailyDate}
                setDailyDate={setDailyDate}
                subjects={subjects}
                subjectAttendanceData={subjectAttendanceData}
              />
            </TabsContent>
          </Tabs>
        )}
        <div className="h-16 md:h-20" />
      </div>
    </>
  );
};

export default Attendance;