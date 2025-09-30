import React, { useState, useEffect } from "react";
import AttendanceCard from "./AttendanceCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import CircleProgress from "./CircleProgress";
import {
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
  isTrackerOpen,
  setIsTrackerOpen,
  subjectCacheStatus,
  setSubjectCacheStatus,
}) => {
  useEffect(() => {
    const fetchSemesters = async () => {
      if (semestersData) {
        if (semestersData.semesters.length > 0 && !selectedSem) {
          setSelectedSem(semestersData.latest_semester);
        }
        return;
      }

      setIsAttendanceMetaLoading(true);
      setIsAttendanceDataLoading(true);
      try {
        const meta = await w.get_attendance_meta();
        const header = meta.latest_header();
        const latestSem = meta.latest_semester();

        setSemestersData({
          semesters: meta.semesters,
          latest_header: header,
          latest_semester: latestSem,
        });

        try {
          const data = await w.get_attendance(header, latestSem);
          setAttendanceData((prev) => ({
            ...prev,
            [latestSem.registration_id]: data,
          }));
          setSelectedSem(latestSem);
        } catch (error) {
          console.log(error.message);
          console.log(error.status);
          if (error.message.includes("NO Attendance Found")) {
            const previousSem = meta.semesters[1];
            if (previousSem) {
              const data = await w.get_attendance(header, previousSem);
              setAttendanceData((prev) => ({
                ...prev,
                [previousSem.registration_id]: data,
              }));
              setSelectedSem(previousSem);
              console.log(previousSem);
            }
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
      } finally {
        setIsAttendanceMetaLoading(false);
        setIsAttendanceDataLoading(false);
      }
    };

    fetchSemesters();
  }, [w, setAttendanceData, semestersData, setSemestersData]);

  const handleSemesterChange = async (value) => {
    const semester = semestersData.semesters.find(
      (sem) => sem.registration_id === value,
    );
    setSelectedSem(semester);

    setIsAttendanceDataLoading(true);
    try {
      if (attendanceData[value]) {
        setIsAttendanceDataLoading(false);
        return;
      }

      const meta = await w.get_attendance_meta();
      const header = meta.latest_header();
      const data = await w.get_attendance(header, semester);
      setAttendanceData((prev) => ({
        ...prev,
        [value]: data,
      }));
    } catch (error) {
      if (error.message.includes("NO Attendance Found")) {
        setAttendanceData((prev) => ({
          ...prev,
          [value]: { error: "Attendance not available for this semester" },
        }));
      } else {
        console.error("Failed to fetch attendance:", error);
      }
    } finally {
      setIsAttendanceDataLoading(false);
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

  const subjects =
    (selectedSem &&
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
                  (100 - attendanceGoal),
              )
            : null;
          const classesCanMiss = attendanceGoal
            ? Math.floor(
                (100 * attended - attendanceGoal * total) / attendanceGoal,
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
          };
        },
      )) ||
    [];

  const fetchSubjectAttendance = async (subject) => {
    try {
      const attendance = attendanceData[selectedSem.registration_id];
      const subjectData = attendance.studentattendancelist.find(
        (s) => s.subjectcode === subject.name,
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
        subjectcomponentids,
      );

      setSubjectAttendanceData((prev) => ({
        ...prev,
        [subject.name]: data.studentAttdsummarylist,
      }));
    } catch (error) {
      console.error("Failed to fetch subject attendance:", error);
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
        }),
      );
    };
    loadAllSubjects();
  }, [activeTab]);

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
            <SelectContent className="bg-[#0B0B0D] dark:bg-[#f9f9f9] text-white dark:text-black border-white dark:border-black">
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
            className="w-32 bg-[#0B0B0D] dark:bg-[#f9f9f9] text-white dark:text-black border-white dark:border-black"
            placeholder="Goal %"
          />
        </div>
      </div>

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
          <TabsList className="grid grid-cols-2 bg-[#0B0B0D] dark:bg-white relative z-30">
            <TabsTrigger
              value="overview"
              className="bg-[#0B0B0D] dark:bg-white data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="daily"
              className="bg-[#0B0B0D] dark:bg-white data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white"
            >
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
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="daily">
            <div className="flex flex-col md:flex-row md:items-start md:gap-8 md:justify-center">
              <div className="w-full max-w-[320px] flex flex-col sticky top-[120px]">
                <Calendar
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
                        (s) => getClassesFor(s.name, date).length > 0,
                      ),
                    selected: (date) =>
                      date.toDateString() === safeDailyDate.toDateString(),
                  }}
                  modifiersStyles={{
                    hasActivity: {
                      boxShadow: "inset 0 -2px 0 0 rgba(96,165,250,0.8)",
                      borderRadius: "2px",
                    },
                  }}
                  className="mb-4 dark:bg-white dark:text-black"
                />
              </div>

              <div className="md:flex-1 md:max-w-xl w-full">
                {subjects.length === 0 ? (
                  <p className="text-gray-400 dark:text-gray-600">No subjects found.</p>
                ) : (
                  subjects.flatMap((subj) => {
                  const lectures = getClassesFor(subj.name, safeDailyDate);
                  if (lectures.length === 0) return [];
                  return (
                    <div
                      key={subj.name}
                      className="w-full max-w-lg border-b border-gray-700 dark:border-gray-300 py-3"
                    >
                      <h3 className="font-semibold mb-1 dark:text-black">{subj.name}</h3>
                      {lectures.map((cls, i) => (
                        <div
                          key={i}
                          className={`flex justify-between text-sm ${
                            cls.present === "Present"
                              ? "text-green-400 dark:text-green-700"
                              : "text-red-400 dark:text-red-700"
                          }`}
                        >
                          <span>
                            {cls.classtype} • {cls.present}
                          </span>
                          <span>{cls.datetime.split(" ").slice(1).join(" ").slice(1, -1)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}

                {subjects.every(
                  (s) => getClassesFor(s.name, safeDailyDate).length === 0,
                ) && (
                  <p className="text-gray-400 dark:text-gray-600 mt-4">
                    No classes were scheduled on&nbsp;
                    {safeDailyDate.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {subjects.length > 0 &&
              subjectCacheStatus &&
              typeof subjectCacheStatus === "object" &&
              Object.values(subjectCacheStatus).some((s) => s !== "cached") && (
                <Sheet open={isTrackerOpen} onOpenChange={setIsTrackerOpen}>
                  <SheetTrigger asChild>
                    <button
                      className="fixed bottom-20 right-4 z-50
                           drop-shadow-lg bg-[#242a32] dark:bg-[#f3f4f6] rounded-full
                           ring-blue-400
                           hover:ring-blue-300 hover:scale-105
                           transition-transform cursor-pointer"
                    >
                      <CircleProgress
                        percentage={
                          (100 *
                            subjects.filter(
                              (s) => subjectCacheStatus[s.name] === "cached",
                            ).length) /
                          subjects.length
                        }
                        label={`${subjects.filter((s) => subjectCacheStatus[s.name] === "cached").length}/${subjects.length}`}
                        className="shadow-inner"
                      />
                    </button>
                  </SheetTrigger>

                  <SheetContent
                    side="bottom"
                    className="h-[45vh] bg-[#242a32] dark:bg-[#f3f4f6] text-white dark:text-black border-0 overflow-hidden
                         [&_[data-radix-dialog-close]]:hidden"
                  >
                    <SheetHeader>
                      <SheetTitle className="text-sm text-white dark:text-black">
                        Fetching daily attendance&nbsp;(
                        {
                          subjects.filter(
                            (s) => subjectCacheStatus[s.name] === "cached",
                          ).length
                        }
                        /{subjects.length})
                      </SheetTitle>
                    </SheetHeader>

                    <div className="mt-4 space-y-4 px-1 overflow-y-auto h-[calc(100%-3rem)]">
                      <Progress
                        value={
                          (100 *
                            subjects.filter(
                              (s) => subjectCacheStatus[s.name] === "cached",
                            ).length) /
                          subjects.length
                        }
                        className="h-2"
                      />

                      <div className="divide-y divide-white/10 dark:divide-black/10 mt-4 overflow-y-auto h-[calc(100%-5rem)] pr-1">
                        {subjects.map((s) => {
                          const st = subjectCacheStatus[s.name] || "idle";
                          return (
                            <div
                              key={s.name}
                              className="py-3 flex items-center justify-between"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate dark:text-black">
                                  {s.name}
                                </p>
                              </div>
                              {st === "cached" && (
                                <Check className="text-green-400 dark:text-green-700 w-5 h-5" />
                              )}
                              {st === "fetching" && (
                                <Loader2 className="animate-spin text-blue-400 dark:text-blue-700 w-5 h-5" />
                              )}
                              {st === "idle" && (
                                <AlertCircle className="text-gray-500 dark:text-gray-400 w-5 h-5" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Attendance;
