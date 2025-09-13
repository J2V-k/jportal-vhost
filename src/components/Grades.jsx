import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  generate_local_name,
  API,
} from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.16/dist/jsjiit.esm.js";
import GradeCard from "./GradeCard";
import MarksCard from "./MarksCard";
import CGPATargetCalculator from "./CGPATargetCalculator";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [mounted, setMounted] = useState(true);

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
        console.log(data.semisterList);
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
  ]); // Added setGradesLoading to dependencies

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
    setMounted(true);

    const processPdfMarks = async () => {
      if (!selectedMarksSem || marksData[selectedMarksSem.registration_id]) {
        return;
      }

      setMarksLoading(true);
      try {
        const ENDPOINT = `/studentsexamview/printstudent-exammarks/${w.session.instituteid}/${selectedMarksSem.registration_id}/${selectedMarksSem.registration_code}`;
        const localname = await generate_local_name();
        const headers = await w.session.get_headers(localname);

        const pyodide = await loadPyodide();

        pyodide.globals.set("ENDPOINT", ENDPOINT);
        pyodide.globals.set("fetchOptions", { method: "GET", headers });
        pyodide.globals.set("API", API);

        const res = await pyodide.runPythonAsync(`
          import pyodide_js
          import asyncio
          import pyodide.http

          marks = {}

          async def process_pdf():
              global marks
              await pyodide_js.loadPackage("/artifact/PyMuPDF-1.24.12-cp311-abi3-emscripten_3_1_32_wasm32.whl")
              await pyodide_js.loadPackage("/artifact/jiit_marks-0.2.0-py3-none-any.whl")

              import pymupdf
              from jiit_marks import parse_report

              r = await pyodide.http.pyfetch(API+ENDPOINT, **(fetchOptions.to_py()))
              data = await r.bytes()

              doc = pymupdf.Document(stream=data)
              marks = parse_report(doc)
              return marks

          await process_pdf()
        `);

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
        }
      } catch (error) {
        console.error("Failed to load marks:", error);
      } finally {
        if (mounted) {
          setMarksLoading(false);
        }
      }
    };

    if (selectedMarksSem) {
      processPdfMarks();
    }

    return () => {
      setMounted(false);
    };
  }, [selectedMarksSem, w.session, marksData]);

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

  const handleMarksSemesterChange = async (value) => {
    try {
      const semester = marksSemesters.find(
        (sem) => sem.registration_id === value
      );
      console.log(semester);
      setSelectedMarksSem(semester);

      // Fetch grade card if not already cached
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

  if (gradesLoading) {
    return (
      <motion.div
        {...fadeInUp}
        className="flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)] text-white"
      >
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span className="text-lg">Loading grades...</span>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[black] dark:bg-white text-white dark:text-black pt-2 pb-4 px-3 font-sans text-sm max-[390px]:text-xs"
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-4xl mx-auto"
      >
        <TabsList className="grid w-full grid-cols-3 mb-4 bg-[#0B0B0D] dark:bg-gray-50 rounded-lg p-1">
          {["overview","marks", "semester"].map((tab, index) => (
            <TabsTrigger
              key={tab} // Changed from index to tab for unique keys
              value={tab}
              className="bg-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-black text-gray-300 dark:text-gray-700 data-[state=active]:text-black dark:data-[state=active]:text-white rounded-md transition-all duration-200"
            >
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.div>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <motion.div {...fadeInUp} className="space-y-6">
            {gradesError ? (
              <motion.div
                {...fadeInUp}
                className="text-center py-8 bg-[#0B0B0D] dark:bg-gray-50 rounded-lg"
              >
                <p className="text-xl text-red-400"> {gradesError} </p>
                <p className="text-gray-400 dark:text-gray-600 mt-2">
                  {" "}
                  Please check back later{" "}
                </p>
              </motion.div>
            ) : (
              <>
                <motion.div
                  {...fadeInUp}
                  className="bg-[#0B0B0D] dark:bg-gray-50 rounded-lg p-4"
                >
                  <h2 className="text-xl font-semibold mb-4">
                    {" "}
                    Grade Progression{" "}
                  </h2>
                  <ResponsiveContainer width="100%" height={250}>
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
                        contentStyle={{
                          backgroundColor: "#374151",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                          fontWeight: "500",
                        }}
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

                <motion.div {...fadeInUp} className="space-y-4">
                  {semesterData.map((sem, index) => (
                    <motion.div
                      key={sem.stynumber}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-[#0B0B0D] dark:bg-gray-50 rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="text-base md:text-lg font-semibold">
                          {" "}
                          Semester {sem.stynumber}{" "}
                        </h4>
                        <p className="text-sm text-gray-400 dark:text-gray-600">
                          GP: {sem.earnedgradepoints.toFixed(1)}/
                          {sem.totalcoursecredit * 10}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-lg md:text-2xl font-bold text-green-400">
                            {" "}
                            {sem.sgpa}{" "}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-600">
                            {" "}
                            SGPA{" "}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg md:text-2xl font-bold text-blue-400">
                            {" "}
                            {sem.cgpa}{" "}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-600">
                            {" "}
                            CGPA{" "}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}
          <CGPATargetCalculator semesterData={semesterData} />

          </motion.div>
        </TabsContent>

        <TabsContent value="semester">
          <motion.div {...fadeInUp} className="space-y-4">
            {gradeCardSemesters.length === 0 ? (
              <motion.div
                {...fadeInUp}
                className="text-center py-8 bg-[#0B0B0D] dark:bg-gray-50 rounded-lg"
              >
                <p className="text-xl"> Grade card is not available yet </p>
                <p className="text-gray-400 dark:text-gray-600 mt-2">
                  {" "}
                  Please check back later{" "}
                </p>
              </motion.div>
            ) : (
              <>
                <Select
                  onValueChange={handleSemesterChange}
                  value={selectedGradeCardSem?.registration_id}
                >
                  <SelectTrigger className="bg-[#0B0B0D] dark:bg-gray-50 border-gray-700 dark:border-gray-300 text-white dark:text-black">
                    <SelectValue
                      placeholder={
                        gradeCardLoading
                          ? "Loading semesters..."
                          : "Select semester"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B0B0D] dark:bg-gray-50 border-gray-700 dark:border-gray-300 text-white dark:text-black">
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

                <AnimatePresence mode="wait">
                  {gradeCardLoading ? (
                    <motion.div
                      key="loading"
                      {...fadeInUp}
                      className="flex items-center justify-center py-8 bg-[#0B0B0D] dark:bg-gray-50 rounded-lg"
                    >
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span> Loading subjects... </span>
                    </motion.div>
                  ) : gradeCard ? (
                    <motion.div
                      key="gradecard"
                      {...fadeInUp}
                      className="space-y-4"
                    >
                      {gradeCard.gradecard.map((subject) => (
                        <GradeCard
                          key={subject.subjectcode}
                          subject={subject}
                          getGradeColor={getGradeColor}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="nodata"
                      {...fadeInUp}
                      className="text-center py-8 bg-[#0B0B0D] dark:bg-gray-50 rounded-lg"
                    >
                      <p> No grade card data available for this semester </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="marks">
          <motion.div {...fadeInUp} className="space-y-4">
            {marksSemesters.length === 0 ? (
              <motion.div
                {...fadeInUp}
                className="text-center py-8 bg-[#0B0B0D] dark:bg-gray-50 rounded-lg"
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
                  <SelectTrigger className="bg-[#0B0B0D] dark:bg-gray-50 border-gray-700 dark:border-gray-300 text-white dark:text-black">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0B0B0D] dark:bg-gray-50 border-gray-700 dark:border-gray-300 text-white dark:text-black">
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

                <AnimatePresence mode="wait">
                  {marksLoading ? (
                    <motion.div
                      key="loading"
                      {...fadeInUp}
                      className="flex items-center justify-center py-8 bg-[#0B0B0D] dark:bg-gray-50 rounded-lg"
                    >
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span> Loading marks data... </span>
                    </motion.div>
                  ) : marksSemesterData && marksSemesterData.courses ? (
                    <motion.div
                      key="marksdata"
                      {...fadeInUp}
                      className="space-y-4"
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
                              .filter(subject => subject.sgpapoints!=0) // Filter out audit subjects
                              .forEach((subject) => {
                                console.log("Regular subject:", subject);
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
                                  className="bg-[#0B0B0D] dark:bg-gray-50 rounded-lg p-4"
                                >
                                  <div className="flex flex-row justify-around items-start text-center gap-4">
                                    <div className="flex-1">
                                      <h4 className="text-gray-400 dark:text-gray-600 text-sm">
                                        Grade Points
                                      </h4>
                                      <p className="text-lg font-bold">
                                        {calculatedEarnedGradePoints.toFixed(1)} /{" "}
                                        {calculatedTotalCredits * 10}
                                      </p>
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-gray-400 dark:text-gray-600 text-sm">
                                        SGPA
                                      </h4>
                                      <p className="text-lg font-bold text-green-400">
                                        {calculatedSGPA.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </>
                          );
                        })()}

                      {marksSemesterData.courses.map((course) => (
                        <MarksCard
                          key={course.code}
                          course={course}
                          gradeInfo={
                            gradeCards[selectedMarksSem?.registration_id]
                          }
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="nodata"
                      {...fadeInUp}
                      className="text-center py-8 bg-[#0B0B0D] dark:bg-gray-50 rounded-lg"
                    >
                      <p> Select a semester to view marks </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full flex justify-end mt-6 max-w-4xl mx-auto"
      >
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 text-white dark:text-black border-none mb-4"
          onClick={() => setIsDownloadDialogOpen(true)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isDownloading ? "Downloading..." : "Download Marks"}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isDownloadDialogOpen && (
          <Dialog
            open={isDownloadDialogOpen}
            onOpenChange={setIsDownloadDialogOpen}
          >
            <DialogContent className="bg-[#0B0B0D] dark:bg-gray-50 text-white dark:text-black border-gray-700 dark:border-gray-300">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {" "}
                  Download Marks{" "}
                </DialogTitle>
              </DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
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
                      className="w-full justify-between text-left bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-900 text-black dark:text-white border-none"
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
  );
}
