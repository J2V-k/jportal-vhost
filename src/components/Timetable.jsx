import React, { useState, useEffect } from "react";
import { Calendar, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Timetable = ({ w, profileData, subjectData, subjectSemestersData, selectedSubjectsSem }) => {
  const navigate = useNavigate();
  const [timetableUrl, setTimetableUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localProfileData, setLocalProfileData] = useState(profileData);
  const [localSubjectData, setLocalSubjectData] = useState(subjectData);
  const [localSemestersData, setLocalSemestersData] = useState(subjectSemestersData);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!localProfileData && w) {
        try {
          const data = await w.get_personal_info();
          setLocalProfileData(data);
        } catch (error) {
          setError("Failed to fetch profile data. Please try again.");
        }
      }
    };

    fetchProfileData();
  }, [w, localProfileData]);

  useEffect(() => {
    const fetchSubjectsData = async () => {
      if (!localSemestersData && w) {
        try {
          const registeredSems = await w.get_registered_semesters();
          const latestSem = registeredSems[0];

          const semestersData = {
            semesters: registeredSems,
            latest_semester: latestSem,
          };
          setLocalSemestersData(semestersData);

          if (latestSem && (!localSubjectData || !localSubjectData[latestSem.registration_id])) {
            const subjectsData = await w.get_registered_subjects_and_faculties(latestSem);
            setLocalSubjectData(prev => ({
              ...prev,
              [latestSem.registration_id]: subjectsData,
            }));
          }
        } catch (error) {
        }
      }
    };

    fetchSubjectsData();
  }, [w, localSemestersData, localSubjectData]);

  useEffect(() => {
    if (profileData && !localProfileData) {
      setLocalProfileData(profileData);
    }
  }, [profileData, localProfileData]);

  useEffect(() => {
    if (subjectData && !localSubjectData) {
      setLocalSubjectData(subjectData);
    }
  }, [subjectData, localSubjectData]);

  useEffect(() => {
    if (subjectSemestersData && !localSemestersData) {
      setLocalSemestersData(subjectSemestersData);
    }
  }, [subjectSemestersData, localSemestersData]);

  useEffect(() => {
    const buildTimetableUrl = () => {
      try {
        setLoading(true);
        setError(null);

        const profileInfo = localProfileData?.generalinformation;
        if (!profileInfo) {
          if (localProfileData === null) {
            setLoading(false);
            return;
          }
          setError("Unable to load profile information. Using default values.");
        }

        const programCode = profileInfo?.programcode || "";
        const batch = profileInfo?.batch || "2026";
        const academicYear = profileInfo?.academicyear || "";
        
        let campus = "62";
        if (programCode.includes("128") || programCode.toLowerCase().includes("noida") || 
            profileInfo?.institutename?.toLowerCase().includes("noida")) {
          campus = "128";
        }

        let year = "4";
        const semester = profileInfo?.semester;
        if (semester) {
          const semNum = parseInt(semester);
          year = Math.ceil(semNum / 2).toString();
        }

        const extractShortCode = (subjectCode) => {
          if (!subjectCode) return '';
          const match = subjectCode.match(/[A-Z]+\d+$/);
          return match ? match[0] : subjectCode;
        };

        let selectedSubjects = "";
        
        if (localSemestersData?.latest_semester && localSubjectData?.[localSemestersData.latest_semester.registration_id]) {
          const semesterData = localSubjectData[localSemestersData.latest_semester.registration_id];
          if (semesterData && semesterData.subjects) {
            const subjectCodes = semesterData.subjects
              .map(subject => extractShortCode(subject.subject_code))
              .filter(code => code && code.trim())
              .join(',');
            selectedSubjects = subjectCodes;
          }
        }

        if (!selectedSubjects && selectedSubjectsSem && localSubjectData?.[selectedSubjectsSem.registration_id]) {
          const semesterData = localSubjectData[selectedSubjectsSem.registration_id];
          if (semesterData && semesterData.subjects) {
            const subjectCodes = semesterData.subjects
              .map(subject => extractShortCode(subject.subject_code))
              .filter(code => code && code.trim())
              .join(',');
            selectedSubjects = subjectCodes;
          }
        }

        if (!selectedSubjects && localSubjectData && Object.keys(localSubjectData).length > 0) {
          const firstSemesterKey = Object.keys(localSubjectData)[0];
          const semesterData = localSubjectData[firstSemesterKey];
          if (semesterData && semesterData.subjects) {
            const subjectCodes = semesterData.subjects
              .map(subject => extractShortCode(subject.subject_code))
              .filter(code => code && code.trim())
              .join(',');
            selectedSubjects = subjectCodes;
          }
        }

        const baseUrl = "https://simple-timetable.tashif.codes/";
        const params = new URLSearchParams({
          campus: campus,
          year: year,
          batch: batch,
          selectedSubjects: selectedSubjects || "EC611,EC671,EC691",
          isGenerating: "true"
        });

        const fullUrl = `${baseUrl}?${params.toString()}`;
        setTimetableUrl(fullUrl);
        
        window.open(fullUrl, '_blank');

      } catch (err) {
        setError("Failed to generate timetable. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    buildTimetableUrl();
  }, [localProfileData, localSubjectData, localSemestersData, selectedSubjectsSem]);

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-[black] dark:bg-white">
        <div className="p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-white dark:text-black animate-spin mx-auto mb-4" />
            <p className="text-white dark:text-black">Loading timetable...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] bg-[black] dark:bg-white">
        <div className="p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
        <div className="flex items-center justify-center min-h-[50vh] p-4">
          <div className="text-center max-w-md">
            <Calendar className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white dark:text-black mb-2">
              Timetable Unavailable
            </h3>
            <p className="text-gray-400 dark:text-gray-600 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-[60vh] bg-[black] dark:bg-white"
    >
      <div className="p-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
      
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-white dark:text-black mx-auto mb-4" />
          <p className="text-white dark:text-black">Opening your personalized timetable...</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Timetable;