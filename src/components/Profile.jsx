import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Loader2,
  Calendar,
  ArrowRight,
  Github,
  FileText,
  Home,
  MessageSquare,
  Calculator,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Profile({
  w,
  profileData,
  setProfileData,
  semesterData: initialSemesterData,
}) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const navigate = useNavigate();
  const [localSemesterData, setLocalSemesterData] = useState(
    initialSemesterData || []
  );
  const [hostelData, setHostelData] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (profileData) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await w.get_personal_info();
        setProfileData(data);
        localStorage.setItem('profileData', JSON.stringify({
          studentname: data.generalinformation?.studentname,
          imagepath: data["photo&signature"]?.photo
        }));
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [w, profileData, setProfileData]);

  useEffect(() => {
    const fetchGradesData = async () => {
      try {
        const data = await w.get_sgpa_cgpa();
        if (data && data.semesterList) {
          setLocalSemesterData(data.semesterList);
        }
      } catch (error) {
        console.error("Failed to fetch grades data for GPA calculator:", error);
      }
    };

    if (w) {
      fetchGradesData();
    }
  }, [w]);

  useEffect(() => {
    const fetchHostelData = async () => {
      try {
        const data = await w.get_hostel_details();

        if (data && data.presenthosteldetail) {
          setHostelData(data);
        }
      } catch (error) {
        console.error("Failed to fetch hostel data:", error);
      }
};

    if (w) {
      fetchHostelData();
    }
  }, [w]);

  const info = profileData?.generalinformation || {};
  const qualifications = profileData?.qualification || [];
  const photosrc = profileData?.["photo&signature"]?.photo
    ? `data:image/jpg;base64,${profileData["photo&signature"].photo}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-white dark:text-black animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto max-w-4xl px-4 py-4 pb-24 md:pb-8 space-y-6"
    >
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="bg-[#0B0B0D] dark:bg-white shadow-sm rounded-lg p-4 md:p-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
            {photosrc ? (
              <motion.img
                src={photosrc}
                whileHover={{ scale: 1.03 }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-600 dark:bg-gray-300 object-cover shadow"
              />
            ) : (
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-600 dark:bg-gray-300 flex items-center justify-center text-2xl md:text-3xl font-bold text-white dark:text-black shadow"
              >
                {info.studentname?.charAt(0)}
              </motion.div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-2xl font-semibold text-white dark:text-black truncate">
                {info.studentname}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400 dark:text-gray-600">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {info.programcode}
                </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {info.registrationno}
                </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2 truncate">
                  <Mail className="w-4 h-4" />
                  {info.studentemailid}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto mt-2 md:mt-0">
            <div className="md:hidden text-sm text-gray-400 dark:text-gray-600">
              <div className="flex flex-wrap gap-3">
                <span>
                  Sem:{" "}
                  <span className="font-semibold text-white dark:text-black">
                    {info.semester}
                  </span>
                </span>
                <span>
                  Sec:{" "}
                  <span className="font-semibold text-white dark:text-black">
                    {info.sectioncode}
                  </span>
                </span>
                <span>
                  Batch:{" "}
                  <span className="font-semibold text-white dark:text-black">
                    {info.batch}
                  </span>
                </span>
              </div>
            </div>

            <div className="hidden md:grid grid-cols-2 gap-3 min-w-[220px] text-sm">
              <div className="text-gray-400 dark:text-gray-600">Semester</div>
              <div className="font-semibold text-white dark:text-black">
                {info.semester}
              </div>
              <div className="text-gray-400 dark:text-gray-600">Section</div>
              <div className="font-semibold text-white dark:text-black">
                {info.sectioncode}
              </div>
              <div className="text-gray-400 dark:text-gray-600">Batch</div>
              <div className="font-semibold text-white dark:text-black">
                {info.batch}
              </div>
              <div className="text-gray-400 dark:text-gray-600">
                Academic Year
              </div>
              <div className="font-semibold text-white dark:text-black">
                {info.academicyear}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="bg-[#0B0B0D] dark:bg-white shadow rounded-lg">
        <div className="flex overflow-x-auto border-b border-gray-700 dark:border-gray-200">
          {(() => {
            const tabs = [
              "personal",
              "contact",
              "education",
              ...(hostelData?.presenthosteldetail ? ["hostel"] : []),
            ];
            return tabs.map((tab) => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-none min-w-[88px] py-2 px-3 text-center text-sm font-medium ${
                  activeTab === tab
                    ? "text-white border-b-2 border-white dark:text-black dark:border-black"
                    : "text-gray-400 hover:text-gray-200 dark:text-gray-600 dark:hover:text-gray-800"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ));
          })()}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="p-4"
          >
            {activeTab === "personal" && (
              <div className="space-y-0.5">
                <InfoRow
                  icon={User}
                  label="Date of Birth"
                  value={info.dateofbirth}
                />
                <InfoRow icon={User} label="Gender" value={info.gender} />
                <InfoRow
                  icon={User}
                  label="Blood Group"
                  value={info.bloodgroup}
                />
                <InfoRow
                  icon={User}
                  label="Nationality"
                  value={info.nationality}
                />
                <InfoRow icon={User} label="Category" value={info.category} />
                <InfoRow icon={User} label="APAAR ID" value={info.apaarid} />
                <InfoRow
                  icon={User}
                  label="Admission Year"
                  value={info.admissionyear}
                />
                <InfoRow
                  icon={User}
                  label="Institute Code"
                  value={info.institutecode}
                />
                <InfoRow
                  icon={User}
                  label="Bank Account No"
                  value={info.bankaccountno}
                />
                <InfoRow icon={User} label="Bank Name" value={info.bankname} />
                <InfoRow
                  icon={User}
                  label="Father's Designation"
                  value={info.designation}
                />
              </div>
            )}
            {activeTab === "contact" && (
              <div className="space-y-0.5">
                <InfoRow
                  icon={Mail}
                  label="College Email"
                  value={info.studentemailid}
                />
                <InfoRow
                  icon={Mail}
                  label="Personal Email"
                  value={info.studentpersonalemailid}
                />
                <InfoRow
                  icon={Phone}
                  label="Mobile"
                  value={info.studentcellno}
                />
                <InfoRow
                  icon={Phone}
                  label="Telephone"
                  value={info.studenttelephoneno || "N/A"}
                />
                <InfoRow
                  icon={User}
                  label="Father's Name"
                  value={info.fathersname}
                />
                <InfoRow
                  icon={User}
                  label="Mother's Name"
                  value={info.mothername}
                />
                <InfoRow
                  icon={Mail}
                  label="Parent Email"
                  value={info.parentemailid}
                />
                <InfoRow
                  icon={Phone}
                  label="Parent Mobile"
                  value={info.parentcellno}
                />
                <InfoRow
                  icon={Phone}
                  label="Parent Telephone"
                  value={info.parenttelephoneno}
                />
                <InfoRow
                  icon={MapPin}
                  label="Address"
                  value={[info.paddress1, info.paddress2, info.paddress3]
                    .filter(Boolean)
                    .join(", ")}
                />
                <InfoRow icon={MapPin} label="City" value={info.pcityname} />
                <InfoRow
                  icon={MapPin}
                  label="District"
                  value={info.pdistrict}
                />
                <InfoRow icon={MapPin} label="State" value={info.pstatename} />
                <InfoRow
                  icon={MapPin}
                  label="Postal Code"
                  value={info.ppostalcode}
                />
              </div>
            )}
            {activeTab === "education" && (
              <div className="space-y-0.5">
                {qualifications.map((qual, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-3 py-1 px-2 rounded transition-colors hover:bg-white/4 dark:hover:bg-black/4"
                  >
                    <GraduationCap className="h-4 w-4 text-gray-500 dark:text-gray-500 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white dark:text-black">
                          {qual.qualificationcode}
                        </span>
                        <span className="text-xs text-gray-300 dark:text-gray-600">
                          {qual.yearofpassing}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between text-sm">
                        <span className="text-gray-300 dark:text-gray-600">
                          {qual.boardname}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">
                          {qual.percentagemarks}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {activeTab === "hostel" && hostelData?.presenthosteldetail && (
              <div className="space-y-0.5">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-white dark:text-black">
                    Hostel Information
                  </h3>
                </div>
                <InfoRow
                  icon={MapPin}
                  label="Hostel Name"
                  value={hostelData.presenthosteldetail.hosteldescription}
                />
                <InfoRow
                  icon={MapPin}
                  label="Hostel Code"
                  value={hostelData.presenthosteldetail.hostelcode}
                />
                <InfoRow
                  icon={MapPin}
                  label="Room Number"
                  value={hostelData.presenthosteldetail.allotedroomno}
                />
                <InfoRow
                  icon={MapPin}
                  label="Floor"
                  value={hostelData.presenthosteldetail.floor}
                />
                <InfoRow
                  icon={MapPin}
                  label="Bed Number"
                  value={hostelData.presenthosteldetail.beddesc}
                />
                <InfoRow
                  icon={MapPin}
                  label="Room Type"
                  value={hostelData.presenthosteldetail.roomtype}
                />
                <InfoRow
                  icon={Calendar}
                  label="Allotted From"
                  value={hostelData.presenthosteldetail.allotedfromdate}
                />
                <InfoRow
                  icon={Calendar}
                  label="Allotted Till"
                  value={hostelData.presenthosteldetail.allotedtilldate}
                />
                <InfoRow
                  icon={MapPin}
                  label="Hostel Type"
                  value={hostelData.presenthosteldetail.hosteltypedesc}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="grid grid-cols-3 gap-3 md:gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/academic-calendar")}
            className="aspect-square md:aspect-auto bg-[#0B0B0D] dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-gray-200 dark:text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-600 dark:border-gray-300"
          >
            <Calendar className="w-8 h-8 md:w-6 md:h-6 mb-2 text-gray-400 dark:text-gray-600" />
            <span className="text-xs font-medium text-center">
              Academic Calendar
            </span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/fee")}
            className="aspect-square md:aspect-auto bg-[#0B0B0D] dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-gray-200 dark:text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-600 dark:border-gray-300"
          >
            <FileText className="w-8 h-8 md:w-6 md:h-6 mb-2 text-gray-400 dark:text-gray-600" />
            <span className="text-xs font-medium text-center">Fee Details</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/feedback")}
            className="aspect-square md:aspect-auto bg-[#0B0B0D] dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-gray-200 dark:text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-600 dark:border-gray-300"
          >
            <MessageSquare className="w-8 h-8 md:w-6 md:h-6 mb-2 text-gray-400 dark:text-gray-600" />
            <span className="text-xs font-medium text-center">Faculty Feedback</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/gpa-calculator")}
            className="aspect-square md:aspect-auto bg-[#0B0B0D] dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-gray-200 dark:text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-600 dark:border-gray-300"
          >
            <Calculator className="w-8 h-8 md:w-6 md:h-6 mb-2 text-gray-400 dark:text-gray-600" />
            <span className="text-xs font-medium text-center">GPA Calculator</span>
          </motion.button>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://github.com/J2V-k/jportal-vhost"
            target="_blank"
            rel="noopener noreferrer"
            className="aspect-square md:aspect-auto bg-[#0B0B0D] dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-gray-200 dark:text-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-600 dark:border-gray-300 group"
          >
            <Github className="w-8 h-8 md:w-6 md:h-6 mb-2 text-gray-400 dark:text-gray-600 group-hover:text-blue-400 dark:group-hover:text-blue-500 transition-colors duration-200" />
            <span className="text-xs font-medium text-center mb-1">
              View Source Code
            </span>
            <span className="hidden md:inline text-xs text-blue-400 dark:text-blue-500 group-hover:text-blue-300 dark:group-hover:text-blue-400 transition-colors duration-200">
              and Contribute
            </span>
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-1 px-2 rounded transition-colors hover:bg-white/4 dark:hover:bg-black/4">
      <Icon className="h-4 w-4 text-gray-500 dark:text-gray-500 shrink-0" />
      <div className="grid grid-cols-2 gap-4 flex-1 items-center">
        <span className="text-sm font-medium dark:text-gray-900 text-gray-400">
          {label}
        </span>
        <span className="text-sm dark:text-black text-white break-all font-medium">
          {value || "N/A"}
        </span>
      </div>
    </div>
  );
}
