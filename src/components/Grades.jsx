import React, { useState, useEffect } from "react";
import { ArtificialWebPortal } from "./scripts/artificialW";
import { motion } from "framer-motion";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Helmet } from 'react-helmet-async';
import { API } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.24/dist/jsjiit.esm.js";
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { themeMode } = useTheme();
  const [isDownloading, setIsDownloading] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [marksCacheTimestamp, setMarksCacheTimestamp] = useState(null);
  const [gradeSort, setGradeSort] = useState('default');
  const [creditSort, setCreditSort] = useState('default');
  const [isMarksRefreshing, setIsMarksRefreshing] = useState(false);
  const [isMarksFromCache, setIsMarksFromCache] = useState(false);
  const marksFetchInFlight = React.useRef(new Set());
  const lastRefreshRef = React.useRef({});

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && ["overview", "marks", "semester"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else {
      const savedTab = localStorage.getItem("grades_active_tab");
      if (savedTab && ["overview", "marks", "semester"].includes(savedTab)) {
        setActiveTab(savedTab);
        setSearchParams({ tab: savedTab }, { replace: true });
      }
    }
  }, []);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
    localStorage.setItem("grades_active_tab", value);
  };

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
        if (err?.message?.includes("Unexpected end of JSON input")) {
          setGradesError("Grade sheet is not available");
        } else {
          setGradesError("Failed to fetch grade data");
        }
      } finally {
        setGradesLoading(false);
      }
    };
    if (!isOffline) fetchData();
  }, [w, semesterData, isOffline]);

  useEffect(() => {
    const fetchGradeCardSemesters = async () => {
      if (!isOffline && (gradeCardSemesters.length === 0 || !gradeCard)) {
        setGradeCardLoading(true);
        try {
          let semesters = gradeCardSemesters;
          if (semesters.length === 0) {
            semesters = await w.get_semesters_for_grade_card();
            setGradeCardSemesters(semesters);
          }

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
        } finally {
          setGradeCardLoading(false);
        }
      }
    };
    fetchGradeCardSemesters();
  }, [w, isOffline]);

  useEffect(() => {
    const fetchMarksSemesters = async () => {
      if (marksSemesters.length === 0 && !isOffline) {
        try {
          const sems = await w.get_semesters_for_marks();
          setMarksSemesters(sems);
        } catch (err) {
          console.error("Failed to fetch marks semesters:", err);
        }
      }
    };
    fetchMarksSemesters();
  }, [w, isOffline]);

  useEffect(() => {
    if (activeTab === 'marks' && marksSemesters.length > 0 && !selectedMarksSem) {
      const currentYear = new Date().getFullYear().toString();
      const currentYearSemester = marksSemesters.find(sem =>
        sem.registration_code && sem.registration_code.includes(currentYear)
      );
      const selectedSemester = currentYearSemester || marksSemesters[0];
      setSelectedMarksSem(selectedSemester);
    }
  }, [marksSemesters, activeTab]);

  useEffect(() => {
    if (activeTab !== 'marks' || isOffline) return;
    setMounted(true);
    const processPdfMarks = async () => {
      if (!selectedMarksSem) return;
      if (marksData[selectedMarksSem.registration_id]) return;
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
        if (marksFetchInFlight.current.has(regId)) return;
        const last = lastRefreshRef.current[regId];
        if (last && Date.now() - last < 10 * 60 * 1000) return;
        marksFetchInFlight.current.add(regId);
        const ENDPOINT = `/studentsexamview/printstudent-exammarks/${w.session.instituteid}/${selectedMarksSem.registration_id}/${selectedMarksSem.registration_code}`;
        const headers = await w.session.get_headers();
        const { getPyodideWithPackages } = await import("@/lib/pyodide");
        const pyodide = await getPyodideWithPackages();
        const fetchRes = await fetch(API + ENDPOINT, { method: "GET", headers });
        if (!fetchRes.ok) throw new Error("Failed to fetch marks PDF");
        const arrayBuffer = await fetchRes.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        pyodide.globals.set("data", pyodide.toPy(uint8));
        const res = await pyodide.runPythonAsync(`
          import pymupdf
          from jiit_marks import parse_report
          doc = pymupdf.Document(stream=bytes(data))
          marks = parse_report(doc)
          marks
        `);
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
        if (mounted) setMarksLoading(false);
        try { marksFetchInFlight.current.delete(selectedMarksSem.registration_id); } catch { }
      }
    };
    if (selectedMarksSem) processPdfMarks();
    return () => { setMounted(false); };
  }, [selectedMarksSem, activeTab]);

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

  const handleSemesterChange = async (value) => {
    setGradeCardLoading(true);
    try {
      const semester = gradeCardSemesters.find((sem) => sem.registration_id === value);
      setSelectedGradeCardSem(semester);
      if (gradeCards[value]) {
        setGradeCard(gradeCards[value]);
      } else {
        const data = await w.get_grade_card(semester);
        data.semesterId = value;
        setGradeCard(data);
        setGradeCards((prev) => ({ ...prev, [value]: data }));
      }
    } catch (error) {
      console.error("Failed to fetch grade card:", error);
    } finally {
      setGradeCardLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    const gradeColors = {
      "A+": "text-green-400", A: "text-green-500", "B+": "text-yellow-400", B: "text-yellow-500",
      "C+": "text-yellow-600", C: "text-orange-400", D: "text-orange-500", F: "text-red-500",
    };
    return gradeColors[grade] || "text-white";
  };

  const toggleGradeSort = () => {
    setCreditSort('default');
    setGradeSort(prev => prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default');
  };

  const toggleCreditSort = () => {
    setGradeSort('default');
    setCreditSort(prev => prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default');
  };

  const handleMarksSemesterChange = async (value) => {
    try {
      const semester = marksSemesters.find((sem) => sem.registration_id === value);
      setSelectedMarksSem(semester);
      if (!gradeCards[value]) {
        try {
          const data = await w.get_grade_card(semester);
          data.semesterId = value;
          setGradeCards((prev) => ({ ...prev, [value]: data }));
        } catch (e) { }
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
        setMarksData((prev) => ({ ...prev, [value]: cached.data || cached }));
        setMarksCacheTimestamp(cached.timestamp || null);
        setIsMarksFromCache(true);
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
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  });

  const getTooltipLabelStyle = () => ({ color: themeMode === 'dark' ? 'white' : 'black' });

  if (gradesLoading) {
    return (
      <motion.div {...fadeInUp} className="flex items-center justify-center py-4 h-[60vh] text-foreground">
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
        <title>Grades & Marks - JP Portal</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-background text-foreground pt-2 pb-24 px-3 md:px-6 font-sans text-sm max-[390px]:text-xs"
      >
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full max-w-7xl mx-auto"
        >
          <div className="md:hidden">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-4 rounded-lg p-1">
              {[
                { name: "overview", icon: BarChart3 },
                { name: "marks", icon: Download },
                { name: "semester", icon: GraduationCap }
              ].map((tab) => (
                <TabsTrigger
                  key={tab.name}
                  value={tab.name}
                  className="rounded-md transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <motion.div className="flex items-center gap-1">
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
                {[
                  { id: "overview", icon: BarChart3, label: "Overview" },
                  { id: "marks", icon: Download, label: "Marks" },
                  { id: "semester", icon: GraduationCap, label: "Semester" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleTabChange(t.id)}
                    className={`px-4 py-1.5 rounded-md transition-all duration-200 flex items-center gap-2 ${activeTab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full max-w-7xl mx-auto">
            <TabsContent value="overview">
              <motion.div {...fadeInUp} className="space-y-4">
                {gradesError ? (
                  <Alert variant="destructive">
                    <AlertDescription className="text-center">
                      <div className="text-xl font-semibold mb-2">{gradesError}</div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <motion.div className="bg-card rounded-lg p-4 border border-border shadow-md">
                      <h2 className="text-xl font-bold mb-4 text-center">Grade Progression</h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={semesterData} margin={{ top: 0, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="stynumber" stroke="#9CA3AF" label={{ value: "Semester", position: "bottom", fill: "#9CA3AF" }} />
                          <YAxis stroke="#9CA3AF" domain={["dataMin", "dataMax"]} tickCount={5} tickFormatter={(v) => v.toFixed(1)} />
                          <Tooltip contentStyle={getTooltipStyle()} labelStyle={getTooltipLabelStyle()} />
                          <Legend verticalAlign="top" height={36} />
                          <Line type="monotone" dataKey="sgpa" stroke="#4ADE80" name="SGPA" strokeWidth={3} dot={{ fill: "#4ADE80" }} />
                          <Line type="monotone" dataKey="cgpa" stroke="#60A5FA" name="CGPA" strokeWidth={3} dot={{ fill: "#60A5FA" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {semesterData.map((sem, idx) => (
                        <motion.div key={sem.stynumber} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-card rounded-lg p-4 border border-border shadow-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-base font-semibold">Semester {sem.stynumber}</h4>
                              <p className="text-xs text-muted-foreground">GP: {sem.earnedgradepoints.toFixed(1)}/{sem.totalcoursecredit * 10}</p>
                            </div>
                            <div className="flex gap-3">
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-400">{sem.sgpa}</div>
                                <div className="text-[10px] text-muted-foreground uppercase">SGPA</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-400">{sem.cgpa}</div>
                                <div className="text-[10px] text-muted-foreground uppercase">CGPA</div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => navigate("/gpa-calculator")}>
                        <Calculator className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs">GPA Calculator</span>
                      </Button>
                      <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => setIsDownloadDialogOpen(true)} disabled={isDownloading}>
                        <Download className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs">Download Marks</span>
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </TabsContent>
            <TabsContent value="semester">
              <motion.div {...fadeInUp} className="space-y-3">
                {gradeCardLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Fetching Grade Card...</p>
                  </div>
                ) : !gradeCard && gradeCardSemesters.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xl">Grade card is not available yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <Select onValueChange={handleSemesterChange} value={selectedGradeCardSem?.registration_id}>
                        <SelectTrigger className="w-full md:w-[250px]">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeCardSemesters.map(s => <SelectItem key={s.registration_id} value={s.registration_id}>{s.registration_code}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {gradeCard && (
                        <Badge variant="outline" className="px-4 py-2">
                          Total Credits: {gradeCard.gradecard?.reduce((sum, sub) => sum + (sub.coursecreditpoint || 0), 0).toFixed(1)}
                        </Badge>
                      )}
                      <ButtonGroup className="rounded-lg overflow-hidden border border-border">
                        <Button variant="ghost" size="sm" onClick={toggleGradeSort} className="gap-1 h-9">
                          <span className="text-xs">Grade</span>
                          {gradeSort === "asc" ? <SortAsc className="w-3.5 h-3.5" /> : gradeSort === "desc" ? <SortDesc className="w-3.5 h-3.5" /> : <ListFilter className="w-3.5 h-3.5" />}
                        </Button>
                        <ButtonGroupSeparator />
                        <Button variant="ghost" size="sm" onClick={toggleCreditSort} className="gap-1 h-9">
                          <span className="text-xs">Credit</span>
                          {creditSort === "asc" ? <SortAsc className="w-3.5 h-3.5" /> : creditSort === "desc" ? <SortDesc className="w-3.5 h-3.5" /> : <ListFilter className="w-3.5 h-3.5" />}
                        </Button>
                      </ButtonGroup>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {gradeCard?.gradecard?.sort((a, b) => {
                        if (gradeSort !== 'default') {
                          const diff = gradePointMap[a.grade] - gradePointMap[b.grade];
                          return gradeSort === 'asc' ? diff : -diff;
                        }
                        if (creditSort !== 'default') {
                          const diff = a.coursecreditpoint - b.coursecreditpoint;
                          return creditSort === 'asc' ? diff : -diff;
                        }
                        return 0;
                      }).map(s => <GradeCard key={s.subjectcode} subject={s} getGradeColor={getGradeColor} />)}
                    </div>
                  </div>
                )}
              </motion.div>
            </TabsContent>
            <TabsContent value="marks">
              <motion.div {...fadeInUp} className="space-y-4">
                {marksSemesters.length === 0 ? (
                  <div className="text-center py-8"><p className="text-xl">Marks data is not available yet</p></div>
                ) : (
                  <>
                    <Select onValueChange={handleMarksSemesterChange} value={selectedMarksSem?.registration_id}>
                      <SelectTrigger className="w-full md:w-[250px]"><SelectValue placeholder="Select semester" /></SelectTrigger>
                      <SelectContent>
                        {marksSemesters.map(s => <SelectItem key={s.registration_id} value={s.registration_id}>{s.registration_code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {isMarksFromCache && marksCacheTimestamp && (
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Archive size={12} />
                        Cached: {new Date(marksCacheTimestamp).toLocaleString()}
                        {isMarksRefreshing && <Loader2 className="animate-spin w-3 h-3 ml-2" />}
                      </div>
                    )}
                    {marksLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                    ) : marksSemesterData?.courses && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {marksSemesterData.courses.map(c => (
                            <MarksCard key={c.code} course={c} gradeInfo={gradeCards[selectedMarksSem?.registration_id]} />
                          ))}
                        </div>
                        <div className="flex justify-center">
                          <Button className="gap-2" onClick={() => setIsDownloadDialogOpen(true)} disabled={isDownloading}>
                            {isDownloading ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="h-4 w-4" />}
                            Download Marks
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
        <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Download Marks</DialogTitle>
              <DialogDescription>Select semester</DialogDescription>
            </DialogHeader>
            <div className="space-y-1">
              {marksSemesters.map(s => (
                <Button key={s.registration_id} variant="ghost" className="w-full justify-between" onClick={() => handleDownloadMarks(s)} disabled={isDownloading}>
                  {s.registration_code}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </>
  );
}