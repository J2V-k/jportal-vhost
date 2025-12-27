import React, { useState, useEffect } from "react";
import { ArtificialWebPortal } from "./scripts/artificialW";
import { motion, AnimatePresence } from "framer-motion";
import useTheme from "@/context/ThemeContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsTrigger, TabsContent, TabsList } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, ChevronRight, Archive, Calculator, BarChart3, GraduationCap, ArrowUpDown, Grid3x3, ListFilter, SortAsc, SortDesc } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Helmet } from 'react-helmet-async';
import { API } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.23/dist/jsjiit.esm.js";
import {
  saveToCache,
  getFromCache,
} from "@/components/scripts/cache";
import GradeCard from "./GradeCard";
import MarksCard from "./MarksCard";

const gradePointMap = {
  "A+": 10,
  A: 9,
  "B+": 8,
  B: 7,
  "C+": 6,
  C: 5,
  D: 4,
  F: 0,
};

export default function Grades({
  w,
  gradesData,
  setGradesData,
  semesterData,
  setSemesterData,
  activeTab,
  setActiveTab,
  gradeCardSemesters,
  setGradeCardSemesters,
  selectedGradeCardSem,
  setSelectedGradeCardSem,
  gradeCard,
  setGradeCard,
  gradeCards,
  setGradeCards,
  marksSemesters,
  setMarksSemesters,
  selectedMarksSem,
  setSelectedMarksSem,
  marksData,
  setMarksData,
  marksSemesterData,
  setMarksSemesterData,
  gradesLoading,
  setGradesLoading,
  gradesError,
  setGradesError,
  gradeCardLoading,
  setGradeCardLoading,
  isDownloadDialogOpen,
  setIsDownloadDialogOpen,
  marksLoading,
  setMarksLoading,
}) {
  const isOffline = w && (w instanceof ArtificialWebPortal || (w.constructor && w.constructor.name === 'ArtificialWebPortal'))
  if (isOffline) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-foreground">Grades Unavailable</h2>
          <p className="text-muted-foreground mt-2">Grades are not available while offline. Connect to the internet to view grade reports.</p>
        </div>
      </div>
    );
  }
  const navigate = useNavigate();
  const { themeMode } = useTheme();
  const [isDownloading, setIsDownloading] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [marksCacheTimestamp, setMarksCacheTimestamp] = useState(null);
  const [semesterSortBy, setSemesterSortBy] = useState('credit');
  const [gradeSort, setGradeSort] = useState('default');
  const [creditSort, setCreditSort] = useState('default');
  const [isMarksRefreshing, setIsMarksRefreshing] = useState(false);
  const [isMarksFromCache, setIsMarksFromCache] = useState(false);
  const marksFetchInFlight = React.useRef(new Set());
  const lastRefreshRef = React.useRef({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (semesterData) {
          setGradesLoading(false);
          return;
        }

        const data = await w.get_sgpa_cgpa();

        if (!data || Object.keys(data).length === 0) {
          setGradesError("Grade sheet is not available");
          return;
        }

        setGradesData(data);
        setSemesterData(data.semesterList);
      } catch (err) {
        if (err.message.includes("Unexpected end of JSON input")) {
          setGradesError("Grade sheet is not available");
        } else {
          setGradesError("Failed to fetch grade data");
        }
        console.error(err);
      } finally {
        setGradesLoading(false);
      }
    };
    fetchData();
  }, [
    w,
    semesterData,
    setGradesData,
    setSemesterData,
    setGradesError,
    setGradesLoading,
  ]);

  useEffect(() => {
    const fetchGradeCardSemesters = async () => {
      if (gradeCardSemesters.length === 0) {
        try {
          const semesters = await w.get_semesters_for_grade_card();
          setGradeCardSemesters(semesters);

          if (semesters.length > 0 && !selectedGradeCardSem) {
            const latestSemester = semesters[0];
            setSelectedGradeCardSem(latestSemester);
            const data = await w.get_grade_card(latestSemester);
            data.semesterId = latestSemester.registration_id;
            setGradeCard(data);
            setGradeCards((prev) => ({
              ...prev,
              [latestSemester.registration_id]: data,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch grade card semesters:", err);
        }
      }
    };
    fetchGradeCardSemesters();
  }, [
    w,
    gradeCardSemesters.length,
    setGradeCardSemesters,
    selectedGradeCardSem,
  ]);

  useEffect(() => {
    const fetchMarksSemesters = async () => {
      if (marksSemesters.length === 0) {
        try {
          const sems = await w.get_semesters_for_marks();
          setMarksSemesters(sems);
        } catch (err) {
          console.error("Failed to fetch marks semesters:", err);
        }
      }
    };
    fetchMarksSemesters();
  }, [w, marksSemesters.length]);

  useEffect(() => {
    if (activeTab === 'marks' && marksSemesters.length > 0 && !selectedMarksSem) {
      const currentYear = new Date().getFullYear().toString();
      const currentYearSemester = marksSemesters.find(sem =>
        sem.registration_code && sem.registration_code.includes(currentYear)
      );
      const selectedSemester = currentYearSemester || marksSemesters[0];
      setSelectedMarksSem(selectedSemester);
    }
  }, [marksSemesters, selectedMarksSem, setSelectedMarksSem, activeTab]);

  useEffect(() => {
    if (activeTab !== 'marks') return;

    setMounted(true);

    const processPdfMarks = async () => {
      if (!selectedMarksSem) {
        return;
      }

      if (marksData[selectedMarksSem.registration_id]) {
        return;
      }

      setMarksLoading(true);
      const username = w.username || "user";
      const cacheKey = `marks-${selectedMarksSem.registration_code}-${username}`;

      const cached = await getFromCache(cacheKey);
      if (cached && mounted) {
        setMarksSemesterData(cached.data || cached);
        setMarksData((prev) => ({
          ...prev,
          [selectedMarksSem.registration_id]: cached.data || cached,
        }));
        setMarksCacheTimestamp(cached.timestamp || null);
        setIsMarksFromCache(true);
        setMarksLoading(false);

        const cacheTs = cached.timestamp || 0;
        if (Date.now() - cacheTs > 10 * 60 * 1000) {
          setIsMarksRefreshing(true);
          await fetchFreshMarksData();
          setIsMarksRefreshing(false);
        }
        return;
      }

      await fetchFreshMarksData();
    };

    const fetchFreshMarksData = async () => {
      try {
        const regId = selectedMarksSem.registration_id;
        if (marksFetchInFlight.current.has(regId)) {
          return;
        }
        const last = lastRefreshRef.current[regId];
        if (last && Date.now() - last < 10 * 60 * 1000) {
          return;
        }
        marksFetchInFlight.current.add(regId);
        const ENDPOINT = `/studentsexamview/printstudent-exammarks/${w.session.instituteid}/${selectedMarksSem.registration_id}/${selectedMarksSem.registration_code}`;
        const headers = await w.session.get_headers();


        const { getPyodideWithPackages } = await import("@/lib/pyodide");
        const tEnsureStart = performance.now();
        const pyodide = await getPyodideWithPackages();
        console.log(`pyodide:ensure: ${performance.now() - tEnsureStart} ms`);

        const tFetchStart = performance.now();
        const fetchRes = await fetch(API + ENDPOINT, { method: "GET", headers });
        if (!fetchRes.ok) throw new Error("Failed to fetch marks PDF");
        const arrayBuffer = await fetchRes.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        pyodide.globals.set("data", pyodide.toPy(uint8));
        console.log(`marks:fetch-pdf: ${performance.now() - tFetchStart} ms`);

        const tParseStart = performance.now();
        const res = await pyodide.runPythonAsync(`
      import pymupdf
      from jiit_marks import parse_report
      doc = pymupdf.Document(stream=bytes(data))
      marks = parse_report(doc)
      marks
        `);
        console.log(`marks:parse: ${performance.now() - tParseStart} ms`);

        try { pyodide.globals.delete("data"); } catch (e) { }

        if (mounted) {
          const result = res.toJs({
            dict_converter: Object.fromEntries,
            create_pyproxies: false,
          });

          setMarksSemesterData(result);
          setMarksData((prev) => ({
            ...prev,
            [selectedMarksSem.registration_id]: result,
          }));

          const username = w.username || "user";
          const cacheKey = `marks-${selectedMarksSem.registration_code}-${username}`;
          await saveToCache(cacheKey, result, 240);
          setMarksCacheTimestamp(Date.now());
          setIsMarksFromCache(false);
          lastRefreshRef.current[regId] = Date.now();
        }
      } catch (error) {
        console.error("Failed to load marks:", error);
      } finally {
        if (mounted) {
          setMarksLoading(false);
        }
        try { marksFetchInFlight.current.delete(selectedMarksSem.registration_id); } catch { }
      }
    };

    if (selectedMarksSem) {
      processPdfMarks();
    }

    return () => {
      setMounted(false);
    };
  }, [selectedMarksSem, w.session, marksData, activeTab]);

  const handleSemesterChange = async (value) => {
    setGradeCardLoading(true);
    try {
      const semester = gradeCardSemesters.find(
        (sem) => sem.registration_id === value
      );
      setSelectedGradeCardSem(semester);

      if (gradeCards[value]) {
        setGradeCard(gradeCards[value]);
      } else {
        const data = await w.get_grade_card(semester);
        data.semesterId = value;
        setGradeCard(data);
        setGradeCards((prev) => ({
          ...prev,
          [value]: data,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch grade card:", error);
    } finally {
      setGradeCardLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    const gradeColors = {
      "A+": "text-green-400",
      A: "text-green-500",
      "B+": "text-yellow-400",
      B: "text-yellow-500",
      "C+": "text-yellow-600",
      C: "text-orange-400",
      D: "text-orange-500",
      F: "text-red-500",
    };
    return gradeColors[grade] || "text-white";
  };

  const toggleGradeSort = () => {
    setGradeSort(prev => {
      if (prev === 'default') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'default';
    });
  };

  const toggleCreditSort = () => {
    setCreditSort(prev => {
      if (prev === 'default') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'default';
    });
  };

  const handleMarksSemesterChange = async (value) => {
    try {
      const semester = marksSemesters.find(
        (sem) => sem.registration_id === value
      );
      setSelectedMarksSem(semester);

      if (!gradeCards[value]) {
        try {
          const data = await w.get_grade_card(semester);
          data.semesterId = value;
          setGradeCards((prev) => ({
            ...prev,
            [value]: data,
          }));
        } catch (error) {
          console.error("Failed to fetch grade card for marks:", error);
        }
      }

      if (marksData[value]) {
        setMarksSemesterData(marksData[value]);
        return;
      }

      const username = w.username || "user";
      const cacheKey = `marks-${semester.registration_code}-${username}`;
      const cached = await getFromCache(cacheKey);

      if (cached) {
        setMarksSemesterData(cached.data || cached);
        setMarksData((prev) => ({
          ...prev,
          [value]: cached.data || cached,
        }));
        setMarksCacheTimestamp(cached.timestamp || null);
        setIsMarksFromCache(true);

        setIsMarksRefreshing(true);
        try {
          await fetchFreshMarksData();
        } finally {
          setIsMarksRefreshing(false);
        }
      }
    } catch (error) {
      console.error("Failed to change marks semester:", error);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  };

  const getTooltipStyle = () => ({
    backgroundColor: themeMode === 'dark' ? 'black' : 'white',
    border: themeMode === 'dark' ? '1px solid #374151' : '1px solid #d1d5db',
    borderRadius: '8px',
    color: themeMode === 'dark' ? 'white' : 'black',
    fontWeight: '500',
    boxShadow: themeMode === 'dark'
      ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  });

  const getTooltipLabelStyle = () => ({
    color: themeMode === 'dark' ? 'white' : 'black',
  });

  if (gradesLoading) {
    return (
      <motion.div
        {...fadeInUp}
        className="flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)] text-foreground"
      >
        <Loader2 className="w-8 h-8 animate-spin mr-2 text-foreground" />
        <span className="text-lg text-foreground">Loading grades...</span>
      </motion.div>
    );
  }

  const handleDownloadMarks = async (semester) => {
    setIsDownloading(true);
    try {
      await w.download_marks(semester);
      setIsDownloadDialogOpen(false);
    } catch (err) {
      console.error("Failed to download marks:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Grades & Marks - JP Portal | JIIT Student Portal</title>
        <meta name="description" content="View your academic grades, SGPA, CGPA, semester-wise marks, and grade progression charts at Jaypee Institute of Information Technology (JIIT)." />
        <meta name="keywords" content="grades, marks, SGPA, CGPA, semester marks, JIIT grades, JP Portal, JIIT, student portal, jportal, jpportal, jp_portal, jp portal" />
        <meta property="og:title" content="Grades & Marks - JP Portal | JIIT Student Portal" />
        <meta property="og:description" content="View your academic grades, SGPA, CGPA, semester-wise marks, and grade progression charts at Jaypee Institute of Information Technology (JIIT)." />
        <meta property="og:url" content="https://jportal2-0.vercel.app/#/grades" />
        <link rel="canonical" href="https://jportal2-0.vercel.app/#/grades" />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-background text-foreground pt-2 pb-24 md:pb-8 px-3 md:px-6 mb-4 font-sans text-sm max-[390px]:text-xs"
      >
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full max-w-7xl mx-auto"
        >
          <div className="md:hidden">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-4 rounded-lg p-1">
              {[
                { name: "overview", icon: BarChart3 },
                { name: "marks", icon: Download },
                { name: "semester", icon: GraduationCap }
              ].map((tab, index) => (
                <TabsTrigger
                  key={tab.name}
                  value={tab.name}
                  className="rounded-md transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <tab.icon className="w-4 h-4 hidden md:inline" />
                    <span>{tab.name.charAt(0).toUpperCase() + tab.name.slice(1)}</span>
                  </motion.div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="hidden md:block">
            <div className="flex justify-center mb-4">
              <div className="flex bg-muted/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-1.5 rounded-md transition-all duration-200 flex items-center gap-2 ${activeTab === "overview"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("marks")}
                  className={`px-4 py-1.5 rounded-md transition-all duration-200 flex items-center gap-2 ${activeTab === "marks"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Download className="w-4 h-4" />
                  Marks
                </button>
                <button
                  onClick={() => setActiveTab("semester")}
                  className={`px-4 py-1.5 rounded-md transition-all duration-200 flex items-center gap-2 ${activeTab === "semester"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Semester
                </button>
              </div>
            </div>
          </div>

          <div className="w-full max-w-7xl mx-auto">
            <TabsContent value="overview">
              <motion.div {...fadeInUp} className="space-y-4">
                {gradesError ? (
                  <motion.div {...fadeInUp}>
                    <Alert variant="destructive">
                      <AlertDescription className="text-center">
                        <div className="text-xl font-semibold mb-2">{gradesError}</div>
                        <div className="text-sm">Please check back later</div>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      {...fadeInUp}
                      className="bg-card rounded-lg p-4 border border-border shadow-md hover:shadow-lg transition-shadow duration-200"
                    >
                      <h2 className="text-xl font-bold mb-4 text-center">
                        Grade Progression
                      </h2>
                      <ResponsiveContainer
                        width="100%"
                        height={250}
                        className="md:h-[300px]"
                      >
                        <LineChart
                          data={semesterData}
                          margin={{
                            top: 0,
                            right: 10,
                            left: 0,
                            bottom: 20,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis
                            dataKey="stynumber"
                            stroke="#9CA3AF"
                            label={{
                              value: "Semester",
                              position: "bottom",
                              fill: "#9CA3AF",
                            }}
                            tickFormatter={(value) => `${value}`}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            domain={["dataMin", "dataMax"]}
                            ticks={undefined}
                            tickCount={5}
                            padding={{ top: 20, bottom: 20 }}
                            tickFormatter={(value) => value.toFixed(1)}
                          />
                          <Tooltip
                            contentStyle={getTooltipStyle()}
                            labelStyle={getTooltipLabelStyle()}
                          />
                          <Legend verticalAlign="top" height={36} />
                          <Line
                            type="monotone"
                            dataKey="sgpa"
                            stroke="#4ADE80"
                            name="SGPA"
                            strokeWidth={3}
                            dot={{ fill: "#4ADE80" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="cgpa"
                            stroke="#60A5FA"
                            name="CGPA"
                            strokeWidth={3}
                            dot={{ fill: "#60A5FA" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </motion.div>

                    <motion.div
                      {...fadeInUp}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
                    >
                      {semesterData.map((sem, index) => (
                        <motion.div
                          key={sem.stynumber}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-card rounded-lg p-4 border border-border shadow-md hover:shadow-lg transition-shadow duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-base md:text-lg font-semibold text-foreground">
                                {" "}
                                Semester {sem.stynumber}{" "}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                GP: {sem.earnedgradepoints.toFixed(1)}/
                                {sem.totalcoursecredit * 10}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <div className="text-base md:text-lg font-bold text-green-400">
                                  {sem.sgpa}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  SGPA
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-base md:text-lg font-bold text-blue-400">
                                  {sem.cgpa}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  CGPA
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="grid grid-cols-3 gap-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate("/gpa-calculator")}
                          className="aspect-square md:aspect-auto bg-card hover:bg-accent/50 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-foreground shadow-lg hover:shadow-xl transition-all duration-200 border border-border"
                        >
                          <Calculator className="w-8 h-8 md:w-6 md:h-6 mb-2 text-muted-foreground" />
                          <span className="text-xs font-medium text-center">GPA Calculator</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsDownloadDialogOpen(true)}
                          disabled={isDownloading}
                          className="aspect-square md:aspect-auto bg-card hover:bg-accent/50 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-foreground shadow-lg hover:shadow-xl transition-all duration-200 border border-border"
                        >
                          <Download className="w-8 h-8 md:w-6 md:h-6 mb-2 text-muted-foreground" />
                          <span className="text-xs font-medium text-center">Download Marks</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="semester">
              <motion.div {...fadeInUp} className="space-y-3">
                {gradeCardSemesters.length === 0 ? (
                  <motion.div
                    {...fadeInUp}
                    className="text-center py-8 bg-[#0B0B0D] dark:bg-gray-50 rounded-lg"
                  >
                    <p className="text-xl"> Grade card is not available yet </p>
                    <p className="text-muted-foreground mt-2">
                      {" "}
                      Please check back later{" "}
                    </p>
                  </motion.div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4 mb-6 flex-wrap">
                      <Select
                        onValueChange={handleSemesterChange}
                        value={selectedGradeCardSem?.registration_id}
                        className="flex-1"
                      >
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue
                            placeholder={
                              gradeCardLoading
                                ? "Loading semesters..."
                                : "Select semester"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border text-foreground">
                          {gradeCardSemesters.map((sem) => (
                            <SelectItem
                              key={sem.registration_id}
                              value={sem.registration_id}
                            >
                              {sem.registration_code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {gradeCard && (
                        <Badge
                          variant="outline"
                          className="px-4 py-2 text-sm font-semibold bg-background border-border text-foreground"
                        >
                          Total Credits: {(() => {
                            let subjects = gradeCard?.gradecard || [];

                            if (gradeSort === 'asc') {
                              subjects = subjects.sort((a, b) => {
                                const ga = gradePointMap[a.grade] || 0;
                                const gb = gradePointMap[b.grade] || 0;
                                return ga - gb;
                              });
                            } else if (gradeSort === 'desc') {
                              subjects = subjects.sort((a, b) => {
                                const ga = gradePointMap[a.grade] || 0;
                                const gb = gradePointMap[b.grade] || 0;
                                return gb - ga;
                              });
                            } else if (creditSort === 'asc') {
                              subjects = subjects.sort((a, b) => (a.coursecreditpoint || 0) - (b.coursecreditpoint || 0));
                            } else if (creditSort === 'desc') {
                              subjects = subjects.sort((a, b) => (b.coursecreditpoint || 0) - (a.coursecreditpoint || 0));
                            }

                            return subjects.reduce((sum, subject) => sum + (subject.coursecreditpoint || 0), 0).toFixed(1);
                          })()}
                        </Badge>
                      )}

                      <ButtonGroup className="w-auto border-1 rounded-lg overflow-hidden border border-border">
                        <Button
                          variant="outline"
                          onClick={toggleGradeSort}
                          title={`Sort by grade (${gradeSort})`}
                          className="cursor-pointer px-2 bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50 border-0"
                        >
                          <span className="text-xs">Grade</span>
                          {gradeSort === "default" && <ListFilter className="w-3.5 h-3.5" />}
                          {gradeSort === "asc" && <SortAsc className="w-3.5 h-3.5" />}
                          {gradeSort === "desc" && <SortDesc className="w-3.5 h-3.5" />}
                        </Button>

                        <ButtonGroupSeparator className="bg-border" />

                        <Button
                          variant="outline"
                          onClick={toggleCreditSort}
                          title={`Sort by credits (${creditSort})`}
                          className="cursor-pointer px-2 bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50 border-0"
                        >
                          <span className="text-xs">Credit</span>
                          {creditSort === "default" && <ListFilter className="w-3.5 h-3.5" />}
                          {creditSort === "asc" && <SortAsc className="w-3.5 h-3.5" />}
                          {creditSort === "desc" && <SortDesc className="w-3.5 h-3.5" />}
                        </Button>
                      </ButtonGroup>
                    </div>

                    <AnimatePresence mode="wait">
                      {gradeCardLoading ? (
                        <motion.div
                          key="loading"
                          {...fadeInUp}
                          className="flex items-center justify-center py-8 bg-card rounded-lg"
                        >
                          <Loader2 className="w-6 h-6 animate-spin mr-2 text-foreground" />
                          <span className="text-foreground"> Loading subjects... </span>
                        </motion.div>
                      ) : gradeCard ? (
                        <motion.div
                          key="gradecard"
                          {...fadeInUp}
                          className="space-y-3"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(() => {
                              let subjects = gradeCard?.gradecard || [];

                              if (gradeSort === 'asc') {
                                subjects = subjects.sort((a, b) => {
                                  const ga = gradePointMap[a.grade] || 0;
                                  const gb = gradePointMap[b.grade] || 0;
                                  return ga - gb;
                                });
                              } else if (gradeSort === 'desc') {
                                subjects = subjects.sort((a, b) => {
                                  const ga = gradePointMap[a.grade] || 0;
                                  const gb = gradePointMap[b.grade] || 0;
                                  return gb - ga;
                                });
                              } else if (creditSort === 'asc') {
                                subjects = subjects.sort((a, b) => (a.coursecreditpoint || 0) - (b.coursecreditpoint || 0));
                              } else if (creditSort === 'desc') {
                                subjects = subjects.sort((a, b) => (b.coursecreditpoint || 0) - (a.coursecreditpoint || 0));
                              }

                              return subjects.map((subject) => (
                                <GradeCard
                                  key={subject.subjectcode}
                                  subject={subject}
                                  getGradeColor={getGradeColor}
                                />
                              ));
                            })()}
                          </div>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex justify-center mt-6"
                          >
                            <Button
                              variant="outline"
                              className="flex items-center gap-2 bg-[#0B0B0D] dark:bg-gray-50 hover:bg-gray-700 dark:hover:bg-gray-100 text-white dark:text-black border border-gray-600 dark:border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 rounded-lg"
                              onClick={() => setIsDownloadDialogOpen(true)}
                              disabled={isDownloading}
                            >
                              <Download className="h-5 w-5" />
                              Download Marks
                            </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="nodata"
                          {...fadeInUp}
                          className="text-center py-8 bg-card rounded-lg"
                        >
                          <p> No grade card data available for this semester </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="marks">
              <motion.div {...fadeInUp} className="space-y-3">
                {marksSemesters.length === 0 ? (
                  <motion.div
                    {...fadeInUp}
                    className="text-center py-8 bg-card rounded-lg"
                  >
                    <p className="text-xl"> Marks data is not available yet </p>
                    <p className="text-gray-400 dark:text-gray-600 mt-2">
                      {" "}
                      Please check back later{" "}
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <Select
                      onValueChange={handleMarksSemesterChange}
                      value={selectedMarksSem?.registration_id}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border text-foreground">
                        {marksSemesters.map((sem) => (
                          <SelectItem
                            key={sem.registration_id}
                            value={sem.registration_id}
                          >
                            {sem.registration_code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {isMarksFromCache && marksCacheTimestamp && (
                      <div className="flex items-center justify-center py-2 text-xs text-gray-400 dark:text-gray-600">
                        <span className="flex items-center gap-1">
                          <Archive size={12} />
                          Cached: {new Date(marksCacheTimestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })} at {new Date(marksCacheTimestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                        {isMarksRefreshing && (
                          <span className="ml-2 flex items-center gap-1 text-foreground">
                            <Loader2 className="animate-spin w-4 h-4 text-foreground" />
                            Refreshing...
                          </span>
                        )}
                      </div>
                    )}

                    <AnimatePresence mode="wait">
                      {marksLoading ? (
                        <motion.div
                          key="loading"
                          {...fadeInUp}
                          className="flex items-center justify-center py-8 bg-card rounded-lg"
                        >
                          <Loader2 className="w-6 h-6 animate-spin mr-2 text-foreground" />
                          <span className="text-foreground"> Loading marks data... </span>
                        </motion.div>
                      ) : marksSemesterData && marksSemesterData.courses ? (
                        <motion.div
                          key="marksdata"
                          {...fadeInUp}
                          className="space-y-3"
                        >
                          {selectedMarksSem &&
                            gradeCards[selectedMarksSem.registration_id] &&
                            (() => {
                              const currentSemesterGradeInfo =
                                gradeCards[selectedMarksSem.registration_id];
                              let calculatedEarnedGradePoints = 0;
                              let calculatedTotalCredits = 0;

                              if (currentSemesterGradeInfo.gradecard) {
                                currentSemesterGradeInfo.gradecard
                                  .filter((subject) => subject.sgpapoints != 0)
                                  .forEach((subject) => {
                                    const credits = parseFloat(
                                      subject.coursecreditpoint
                                    );
                                    let points = 0;
                                    if (subject.gradepoint !== undefined) {
                                      points = parseFloat(subject.gradepoint);
                                    } else if (subject.pointsecured !== undefined) {
                                      points = parseFloat(subject.pointsecured);
                                    }

                                    if (!isNaN(credits) && !isNaN(points)) {
                                      calculatedEarnedGradePoints += credits * points;
                                      calculatedTotalCredits += credits;
                                    }
                                  });
                              }

                              const calculatedSGPA =
                                calculatedTotalCredits > 0
                                  ? calculatedEarnedGradePoints /
                                  calculatedTotalCredits
                                  : 0.0;

                              return (
                                <>
                                  {calculatedSGPA !== 0 && (
                                    <motion.div
                                      {...fadeInUp}
                                      className="bg-card rounded-lg p-4 border border-border"
                                    >
                                      <div className="flex flex-row justify-around items-start text-center gap-4">
                                        <div className="flex-1">
                                          <h4 className="text-muted-foreground text-sm">
                                            Grade Points
                                          </h4>
                                          <p className="text-lg font-bold">
                                            {calculatedEarnedGradePoints.toFixed(1)} /{" "}
                                            {calculatedTotalCredits * 10}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <div className="text-center">
                                            <div className="text-lg font-bold text-green-400">
                                              {calculatedSGPA.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              SGPA
                                            </div>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-lg font-bold text-blue-400">
                                              {gradesData?.cgpa || "--"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              CGPA
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </>
                              );
                            })()}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(() => {
                              const courses = marksSemesterData.courses || [];
                              const labPattern = /\bLab$/i;
                              const nonLabs = courses.filter(c => !labPattern.test((c.name || '').trim()));
                              const labs = courses.filter(c => labPattern.test((c.name || '').trim()));
                              const sortedCourses = nonLabs.concat(labs);

                              return sortedCourses.map((course) => (
                                <MarksCard
                                  key={course.code}
                                  course={course}
                                  gradeInfo={
                                    gradeCards[selectedMarksSem?.registration_id]
                                  }
                                />
                              ));
                            })()}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="nodata"
                          {...fadeInUp}
                          className="text-center py-8 bg-card rounded-lg"
                        >
                          <p> Select a semester to view marks </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex justify-center mt-6"
                    >
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 bg-primary text-primary-foreground border border-border shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 rounded-lg"
                        onClick={() => setIsDownloadDialogOpen(true)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                        ) : (
                          <Download className="h-5 w-5" />
                        )}
                        {isDownloading ? <span className="text-foreground">Downloading...</span> : "Download Marks"}
                      </Button>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>

        <AnimatePresence>
          {isDownloadDialogOpen && (
            <Dialog
              open={isDownloadDialogOpen}
              onOpenChange={setIsDownloadDialogOpen}
            >
              <DialogContent className="bg-card text-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">Download Marks</DialogTitle>
                  <DialogDescription className="text-sm text-gray-400">Select the semester to download marks from the available list.</DialogDescription>
                </DialogHeader>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-1.5"
                >
                  {marksSemesters.map((sem, index) => (
                    <motion.div
                      key={sem.registration_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left bg-background hover:bg-accent text-foreground border-none"
                        onClick={() => handleDownloadMarks(sem)}
                        disabled={isDownloading}
                      >
                        {sem.registration_code}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
