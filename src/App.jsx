import { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import "./styles/transitions.css";
import "./styles/layout.css";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Attendance from "./components/Attendance";
import Grades from "./components/Grades";
import Exams from "./components/Exams";
import Subjects from "./components/Subjects";
import Profile from "./components/Profile";
import Timetable from "./components/Timetable";
import Fee from "./components/Fee";
import AcademicCalendar from "./components/AcademicCalendar";
import { Calendar as CalendarIcon } from "lucide-react";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";
import { Analytics } from "@vercel/analytics/react";
import { Loader2 } from "lucide-react";
import MessMenu from "./components/MessMenu";
import InstallPWA from "./components/InstallPWA";
import { UtensilsCrossed } from "lucide-react";
import { HelmetProvider } from 'react-helmet-async';

import { WebPortal, LoginError } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.23/dist/jsjiit.esm.js";
import { serialize_payload } from "@/lib/jiitCrypto";

import Feedback from "./components/Feedback";
import CGPATargetCalculator from "./components/CGPATargetCalculator";

const w = new WebPortal();

function AuthenticatedApp({ w, setIsAuthenticated, messMenuOpen, onMessMenuChange }) {
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [attendanceSemestersData, setAttendanceSemestersData] = useState(null);
  const [activeAttendanceTab, setActiveAttendanceTab] = useState("overview");

  const [subjectData, setSubjectData] = useState({});
  const [subjectSemestersData, setSubjectSemestersData] = useState(null);

  const [gradesData, setGradesData] = useState({});
  const [gradesSemesterData, setGradesSemesterData] = useState(null);

  const [selectedAttendanceSem, setSelectedAttendanceSem] = useState(null);
  const [selectedSubjectsSem, setSelectedSubjectsSem] = useState(null);

  const [attendanceGoal, setAttendanceGoal] = useState(() => {
    const savedGoal = localStorage.getItem("attendanceGoal");
    return savedGoal ? parseInt(savedGoal) : 75;
  });

  useEffect(() => {
    localStorage.setItem("attendanceGoal", attendanceGoal.toString());
  }, [attendanceGoal]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'attendanceGoal') {
        const newValue = e.newValue ? parseInt(e.newValue) : 75;
        setAttendanceGoal(newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!profileData && w && w.session) {
        try {
          const data = await w.get_personal_info();
          setProfileData(data);
          localStorage.setItem('profileData', JSON.stringify({
            studentname: data.generalinformation?.studentname,
            imagepath: data["photo&signature"]?.photo
          }));
        } catch (error) {
          console.error("Failed to fetch profile data in App:", error);
        }
      }
    };
    fetchProfileData();
  }, [w, profileData]);

  const [activeGradesTab, setActiveGradesTab] = useState("overview");
  const [gradeCardSemesters, setGradeCardSemesters] = useState([]);
  const [selectedGradeCardSem, setSelectedGradeCardSem] = useState(null);
  const [gradeCard, setGradeCard] = useState(null);

  const [gradeCards, setGradeCards] = useState({});

  const [subjectAttendanceData, setSubjectAttendanceData] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [examSchedule, setExamSchedule] = useState({});
  const [examSemesters, setExamSemesters] = useState([]);
  const [selectedExamSem, setSelectedExamSem] = useState(null);
  const [selectedExamEvent, setSelectedExamEvent] = useState(null);

  const [marksSemesters, setMarksSemesters] = useState([]);
  const [selectedMarksSem, setSelectedMarksSem] = useState(null);
  const [marksSemesterData, setMarksSemesterData] = useState(null);
  const [marksData, setMarksData] = useState({});

  const [gradesLoading, setGradesLoading] = useState(true);
  const [gradesError, setGradesError] = useState(null);
  const [gradeCardLoading, setGradeCardLoading] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [marksLoading, setMarksLoading] = useState(false);

  const [isAttendanceMetaLoading, setIsAttendanceMetaLoading] = useState(true);
  const [isAttendanceDataLoading, setIsAttendanceDataLoading] = useState(true);
  const [attendanceDailyDate, setAttendanceDailyDate] = useState(null);
  const [isAttendanceCalendarOpen, setIsAttendanceCalendarOpen] =
    useState(false);
  const [isAttendanceTrackerOpen, setIsAttendanceTrackerOpen] = useState(false);
  const [attendanceSubjectCacheStatus, setAttendanceSubjectCacheStatus] =
    useState(null);

  const minSwipeDistance = 75;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
    setTouchEndY(e.touches[0].clientY);
  };

  const location = useLocation();
  const [transitionDirection, setTransitionDirection] = useState('forward');

  const onTouchEndWithTransition = () => {
    if (!touchStart || !touchEnd || !touchStartY || !touchEndY) return;
    
    const swipeEnabled = localStorage.getItem('swipeEnabled') !== 'false';
    const isDesktop = window.innerWidth >= 768;
    if (!swipeEnabled || isDesktop) {
      setTouchStart(null);
      setTouchEnd(null);
      setTouchStartY(null);
      setTouchEndY(null);
      return;
    }
    
    const distanceX = Math.abs(touchStart - touchEnd);
    const distanceY = Math.abs(touchStartY - touchEndY);
    
    if (distanceY > distanceX) {
      setTouchStart(null);
      setTouchEnd(null);
      setTouchStartY(null);
      setTouchEndY(null);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    const routes = ['/attendance', '/grades', '/exams', '/subjects', '/profile'];
    const currentPath = window.location.hash.replace('#', '');
    const currentIndex = routes.indexOf(currentPath);
    
    if (isLeftSwipe && currentIndex < routes.length - 1) {
      setTransitionDirection('forward');
      navigate(routes[currentIndex + 1]);
    }
    
    if (isRightSwipe && currentIndex > 0) {
      setTransitionDirection('reverse');
      navigate(routes[currentIndex - 1]);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
    setTouchStartY(null);
    setTouchEndY(null);
  };

  return (
    <div className="relative">
      <Navbar messMenuOpen={messMenuOpen} onMessMenuChange={onMessMenuChange} />
      <div 
        className="h-screen flex flex-col"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndWithTransition}
      >
        <Analytics />
        <div className="flex-none z-30 bg-[black] -mt-[2px] md:ml-64">
            <Header 
              setIsAuthenticated={setIsAuthenticated} 
              messMenuOpen={messMenuOpen}
              onMessMenuChange={onMessMenuChange}
              attendanceGoal={attendanceGoal}
              setAttendanceGoal={setAttendanceGoal}
            />
          </div>
        <div className="flex-1 overflow-y-auto md:ml-64">
        <TransitionGroup component={null}>
          <CSSTransition
            key={location.pathname}
            timeout={300}
            classNames={`page-transition${transitionDirection === 'reverse' ? '-reverse' : ''}`}
            unmountOnExit
          >
            <div className="w-full min-h-full">
              <Routes location={location}>
                <Route path="/" element={<Navigate to={(() => {
                  let targetTab = localStorage.getItem('defaultTab') || '/attendance';
                  if (targetTab === 'auto') {
                    const examStartDate = localStorage.getItem('examStartDate');
                    const examEndDate = localStorage.getItem('examEndDate');
                    if (examStartDate && examEndDate) {
                      const now = new Date();
                      const examStart = new Date(examStartDate);
                      const examEnd = new Date(examEndDate);
                      const tomorrow = new Date(now);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const isTomorrowExamStart = tomorrow.toDateString() === examStart.toDateString();
                      const isInExamPeriod = now >= examStart && now <= examEnd;
                      if (isTomorrowExamStart || isInExamPeriod) {
                        return '/exams';
                      }
                    }
                    return '/attendance';
                  }
                  const validRoutes = ['/attendance', '/grades', '/exams', '/subjects', '/profile'];
                  return validRoutes.includes(targetTab) ? targetTab : '/attendance';
                })()} replace />} />
                <Route path="/login" element={<Navigate to={(() => {
                  let targetTab = localStorage.getItem('defaultTab') || '/attendance';
                  if (targetTab === 'auto') {
                    const examStartDate = localStorage.getItem('examStartDate');
                    const examEndDate = localStorage.getItem('examEndDate');
                    if (examStartDate && examEndDate) {
                      const now = new Date();
                      const examStart = new Date(examStartDate);
                      const examEnd = new Date(examEndDate);
                      const tomorrow = new Date(now);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const isTomorrowExamStart = tomorrow.toDateString() === examStart.toDateString();
                      const isInExamPeriod = now >= examStart && now <= examEnd;
                      if (isTomorrowExamStart || isInExamPeriod) {
                        return '/exams';
                      }
                    }
                    return '/attendance';
                  }
                  const validRoutes = ['/attendance', '/grades', '/exams', '/subjects', '/profile'];
                  return validRoutes.includes(targetTab) ? targetTab : '/attendance';
                })()} replace />} />
        <Route
          path="/attendance"
          element={
            <Attendance
              w={w}
              attendanceData={attendanceData}
              setAttendanceData={setAttendanceData}
              semestersData={attendanceSemestersData}
              setSemestersData={setAttendanceSemestersData}
              selectedSem={selectedAttendanceSem}
              setSelectedSem={setSelectedAttendanceSem}
              attendanceGoal={attendanceGoal}
              setAttendanceGoal={setAttendanceGoal}
              subjectAttendanceData={subjectAttendanceData}
              setSubjectAttendanceData={setSubjectAttendanceData}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              isAttendanceMetaLoading={isAttendanceMetaLoading}
              setIsAttendanceMetaLoading={setIsAttendanceMetaLoading}
              isAttendanceDataLoading={isAttendanceDataLoading}
              setIsAttendanceDataLoading={setIsAttendanceDataLoading}
              activeTab={activeAttendanceTab}
              setActiveTab={setActiveAttendanceTab}
              dailyDate={attendanceDailyDate}
              setDailyDate={setAttendanceDailyDate}
              calendarOpen={isAttendanceCalendarOpen}
              setCalendarOpen={setIsAttendanceCalendarOpen}
              isTrackerOpen={isAttendanceTrackerOpen}
              setIsTrackerOpen={setIsAttendanceTrackerOpen}
              subjectCacheStatus={attendanceSubjectCacheStatus}
              setSubjectCacheStatus={setAttendanceSubjectCacheStatus}
            />
          }
        />
        <Route
          path="/grades"
          element={
            <Grades
              w={w}
              gradesData={gradesData}
              setGradesData={setGradesData}
              semesterData={gradesSemesterData}
              setSemesterData={setGradesSemesterData}
              activeTab={activeGradesTab}
              setActiveTab={setActiveGradesTab}
              gradeCardSemesters={gradeCardSemesters}
              setGradeCardSemesters={setGradeCardSemesters}
              selectedGradeCardSem={selectedGradeCardSem}
              setSelectedGradeCardSem={setSelectedGradeCardSem}
              gradeCard={gradeCard}
              setGradeCard={setGradeCard}
              gradeCards={gradeCards}
              setGradeCards={setGradeCards}
              marksSemesters={marksSemesters}
              setMarksSemesters={setMarksSemesters}
              selectedMarksSem={selectedMarksSem}
              setSelectedMarksSem={setSelectedMarksSem}
              marksSemesterData={marksSemesterData}
              setMarksSemesterData={setMarksSemesterData}
              marksData={marksData}
              setMarksData={setMarksData}
              gradesLoading={gradesLoading}
              setGradesLoading={setGradesLoading}
              gradesError={gradesError}
              setGradesError={setGradesError}
              gradeCardLoading={gradeCardLoading}
              setGradeCardLoading={setGradeCardLoading}
              isDownloadDialogOpen={isDownloadDialogOpen}
              setIsDownloadDialogOpen={setIsDownloadDialogOpen}
              marksLoading={marksLoading}
              setMarksLoading={setMarksLoading}
            />
          }
        />
        <Route
          path="/exams"
          element={
            <Exams
              w={w}
              examSchedule={examSchedule}
              setExamSchedule={setExamSchedule}
              examSemesters={examSemesters}
              setExamSemesters={setExamSemesters}
              selectedExamSem={selectedExamSem}
              setSelectedExamSem={setSelectedExamSem}
              selectedExamEvent={selectedExamEvent}
              setSelectedExamEvent={setSelectedExamEvent}
            />
          }
        />
        <Route
          path="/subjects"
          element={
            <Subjects
              w={w}
              subjectData={subjectData}
              setSubjectData={setSubjectData}
              semestersData={subjectSemestersData}
              setSemestersData={setSubjectSemestersData}
              selectedSem={selectedSubjectsSem}
              setSelectedSem={setSelectedSubjectsSem}
            />
          }
        />
        <Route
          path="/profile"
          element={
            <Profile
              w={w}
              profileData={profileData}
              setProfileData={setProfileData}
              semesterData={gradesSemesterData}
            />
          }
        />
        <Route
          path="/fee"
          element={
            <Fee w={w} serialize_payload={serialize_payload} />
          }
        />
        <Route
          path="/academic-calendar"
          element={<AcademicCalendar />}
        />
        <Route
          path="/timetable"
          element={
            <Timetable
              w={w}
              profileData={profileData}
              subjectData={subjectData}
              subjectSemestersData={subjectSemestersData}
              selectedSubjectsSem={selectedSubjectsSem}
            />
          }
        />
        <Route
          path="/feedback"
          element={<Feedback w={w} />}
        />
        <Route
          path="/gpa-calculator"
          element={<CGPATargetCalculator w={w} />}
        />
            </Routes>
          </div>
        </CSSTransition>
      </TransitionGroup>
      </div>
      </div>
    </div>
  );
}

function LoginWrapper({ onLoginSuccess, w }) {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    onLoginSuccess();
    setTimeout(() => {
      let targetTab = localStorage.getItem('defaultTab') || '/attendance';
      
      if (targetTab === 'auto') {
        const examStartDate = localStorage.getItem('examStartDate');
        const examEndDate = localStorage.getItem('examEndDate');
        
        if (examStartDate && examEndDate) {
          const now = new Date();
          const examStart = new Date(examStartDate);
          const examEnd = new Date(examEndDate);
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const isTomorrowExamStart = tomorrow.toDateString() === examStart.toDateString();
          const isInExamPeriod = now >= examStart && now <= examEnd;
          
          if (isTomorrowExamStart || isInExamPeriod) {
            targetTab = '/exams';
          } else {
            targetTab = '/attendance';
          }
        } else {
          targetTab = '/attendance';
        }
      }
      
      const validRoutes = ['/attendance', '/grades', '/exams', '/subjects', '/profile'];
      if (!validRoutes.includes(targetTab)) {
        console.warn(`Invalid default tab: ${targetTab}, falling back to /attendance`);
        targetTab = '/attendance';
      }
      try {
        navigate(targetTab, { replace: true });
      } catch (error) {
        console.error('Navigation failed, falling back to /attendance:', error);
        navigate('/attendance', { replace: true });
      }
      setTimeout(() => {
        if (window.location.hash.includes('/login') || window.location.hash === '#/') {
          navigate('/attendance', { replace: true });
        }
      }, 2000);
    }, 100);
  };

  return <Login onLoginSuccess={handleLoginSuccess} w={w} />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('defaultTheme') || 'light';
  });
  const [messMenuOpen, setMessMenuOpen] = useState(() => {
    return localStorage.getItem("messMenuOpen") === "true";
  });

  const handleMessMenuChange = (open) => {
    setMessMenuOpen(open);
    localStorage.setItem("messMenuOpen", open.toString());
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem("messMenuOpen");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setMessMenuOpen(false);
        localStorage.removeItem("messMenuOpen");
      }
    };

    const handleBlur = () => {
      setMessMenuOpen(false);
      localStorage.removeItem("messMenuOpen");
    };

    const handleFocus = () => {
      setMessMenuOpen(false);
      localStorage.removeItem("messMenuOpen");
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const darkTheme = () => {
    setThemeMode("dark");
    localStorage.setItem('defaultTheme', 'dark');
  };
  const lightTheme = () => {
    setThemeMode("light");
    localStorage.setItem('defaultTheme', 'light');
  };
  useEffect(() => {
    document.querySelector("html")?.classList.remove("dark", "light");
    document.querySelector("html")?.classList.add(themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.querySelector("html")?.classList.remove("dark", "light");
    document.querySelector("html")?.classList.add(themeMode);
  }, []);

  useEffect(() => {
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");

    const performLogin = async () => {
      try {
        if (username && password) {
          await w.student_login(username, password);
          if (w.session) {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        if (
          error instanceof LoginError &&
          error.message.includes(
            "JIIT Web Portal server is temporarily unavailable"
          )
        ) {
          setError(
            "JIIT Web Portal server is temporarily unavailable. Please try again later."
          );
        } else if (
          error instanceof LoginError &&
          error.message.includes("Failed to fetch")
        ) {
          setError("JIIT Web Portal server is temporarily unavailable.");
        } else {
          console.error("Auto-login failed:", error);
          setError("Auto-login failed. Please login again.");
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    performLogin();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-900 text-white dark:bg-gradient-to-br dark:from-black dark:via-gray-900 dark:to-blue-900 dark:text-white">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <p className="text-lg font-semibold mb-1">Signing in...</p>
          <p className="text-sm mb-4">Welcome to JP Portal</p>
              <div className="bg-white/10 rounded-xl p-4 shadow-lg flex flex-col items-center gap-3 mb-4">
            <span className="text-xs text-white/60 mb-1">Quick Access</span>
            <div className="flex flex-wrap gap-2 items-center justify-center">
              <MessMenu open={messMenuOpen} onOpenChange={handleMessMenuChange}>
                <span className="flex items-center justify-center px-6 py-2 bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 hover:text-green-300 transition-colors rounded-lg text-sm font-medium gap-2 cursor-pointer">
                  <UtensilsCrossed size={18} /> Mess Menu
                </span>
              </MessMenu>
              <a
                href="#/academic-calendar"
                onClick={(e) => {
                  try {
                    e.preventDefault();
                    const target = '#/academic-calendar';
                    if (window.location.hash !== target) {
                      window.location.hash = target;
                      window.dispatchEvent(new Event('hashchange'));
                    }
                  } catch (err) {
                    window.location.href = '#/academic-calendar';
                  }
                }}
                className="flex w-full sm:w-auto items-center justify-center px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 transition-colors rounded-lg text-sm font-medium gap-2"
              >
                <CalendarIcon size={18} /> Academic Calendar
              </a>
              <InstallPWA />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <ThemeProvider value={{ themeMode, darkTheme, lightTheme }}>
        <Router>
          <div className="min-h-screen bg-[black] dark:bg-white dark:text-black">
            {" "}
            {!isAuthenticated || !w.session ? (
              <Routes>
                <Route path="/academic-calendar" element={<AcademicCalendar />} />
                <Route
                  path="*"
                  element={
                    <>
                      {error && (
                        <div className="text-red-500 dark:text-red-500 text-center pt-4">
                          {error}
                        </div>
                      )}
                      <LoginWrapper
                        onLoginSuccess={() => setIsAuthenticated(true)}
                        w={w}
                      />
                    </>
                  }
                />
              </Routes>
            ) : (
              <AuthenticatedApp 
                w={w} 
                setIsAuthenticated={setIsAuthenticated} 
                messMenuOpen={messMenuOpen}
                onMessMenuChange={handleMessMenuChange}
              />
            )}
          </div>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
