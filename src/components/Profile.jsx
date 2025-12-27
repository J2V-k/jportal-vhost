import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Loader2,
  Calendar,
  Github,
  Home,
  MessageSquare,
  Calculator,
  Droplets,
  Globe,
  Tag,
  Hash,
  CreditCard,
  DollarSign,
  Building,
  Briefcase,
  AtSign,
  Map,
  Bed,
  Key,
  Shield,
  IdCard,
  BookOpen,
  Users,
  Heart,
  Smartphone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from 'react-helmet-async';
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

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
          studentname: data?.generalinformation?.studentname,
          imagepath: data?.["photo&signature"]?.photo
        }));
        try { localStorage.setItem('pd', JSON.stringify(data)); } catch (e) { }
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
      <div className="container mx-auto max-w-4xl px-4 py-4 pb-24 md:pb-8 space-y-6">
        <Card className="bg-card shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow">
          <CardContent className="p-4">
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
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
      <Helmet>
        <title>{info.studentname ? `${info.studentname} - Profile | JP Portal` : 'Profile - JP Portal'}</title>
        <meta name="description" content={`Student profile page for ${info.studentname || 'JIIT student'}.`} />
        <meta property="og:title" content={info.studentname ? `${info.studentname} - Profile | JP Portal` : 'Profile - JP Portal'} />
        <meta property="og:description" content={`Student profile page for ${info.studentname || 'JIIT student'}.`} />
        <meta property="og:url" content="https://jportal2-0.vercel.app/#/profile" />
        <meta name="keywords" content="JIIT profile, student profile, JP Portal" />
        <link rel="canonical" href="https://jportal2-0.vercel.app/#/profile" />
      </Helmet>
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="bg-card text-foreground shadow-sm rounded-lg p-4 md:p-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
            {photosrc ? (
              <motion.img
                src={photosrc}
                whileHover={{ scale: 1.03 }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted object-cover shadow"
              />
            ) : (
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted flex items-center justify-center text-2xl md:text-3xl font-bold text-foreground shadow"
              >
                {info.studentname?.charAt(0)}
              </motion.div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-2xl font-semibold text-foreground truncate">
                {info.studentname}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  {info.programcode}
                </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2">
                  <IdCard className="w-4 h-4" />
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
            <div className="md:hidden text-sm text-muted-foreground">
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  Sem:{" "}
                  <Badge variant="secondary">{info.semester}</Badge>
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Sec:{" "}
                  <span className="font-semibold text-foreground">
                    {info.sectioncode}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Batch:{" "}
                  <span className="font-semibold text-foreground">
                    {info.batch}
                  </span>
                </span>
              </div>
            </div>

            <div className="hidden md:grid grid-cols-2 gap-3 min-w-[220px] text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                Semester
              </div>
              <Badge variant="secondary">{info.semester}</Badge>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                Section
              </div>
              <div className="font-semibold text-foreground">
                {info.sectioncode}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Batch
              </div>
              <div className="font-semibold text-foreground">
                {info.batch}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <GraduationCap className="w-4 h-4" />
                Academic Year
              </div>
              <div className="font-semibold text-foreground">
                {info.academicyear}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <Card className="bg-card shadow">
        <CardContent className="p-0">
          <div className="flex overflow-x-auto border-b border-border">
            {(() => {
              const tabs = [
                { name: "personal", icon: User },
                { name: "contact", icon: Phone },
                { name: "education", icon: GraduationCap },
                ...(hostelData?.presenthosteldetail ? [{ name: "hostel", icon: Home }] : []),
              ];
              return tabs.map((tab) => (
                <motion.button
                  key={tab.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-none min-w-[88px] py-2 px-3 text-center text-sm font-medium flex items-center justify-center gap-2 ${activeTab === tab.name
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                  onClick={() => setActiveTab(tab.name)}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name.charAt(0).toUpperCase() + tab.name.slice(1)}</span>
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
                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <InfoRow icon={Calendar} label="Date of Birth" value={info.dateofbirth} />
                    <InfoRow icon={Users} label="Gender" value={info.gender} />
                    <InfoRow icon={Droplets} label="Blood Group" value={info.bloodgroup} />
                    <InfoRow icon={Globe} label="Nationality" value={info.nationality} />
                    <InfoRow icon={Tag} label="Category" value={info.category} />
                    <InfoRow icon={Hash} label="APAAR ID" value={info.apaarid} />
                  </div>
                  <Separator />
                  <div className="space-y-0.5">
                    <InfoRow icon={GraduationCap} label="Admission Year" value={info.admissionyear} />
                    <InfoRow icon={Home} label="Institute Code" value={info.institutecode} />
                  </div>
                  <Separator />
                  <div className="space-y-0.5">
                    <InfoRow icon={CreditCard} label="Bank Account No" value={info.bankaccountno} />
                    <InfoRow icon={Building} label="Bank Name" value={info.bankname} />
                    <InfoRow icon={Briefcase} label="Father's Designation" value={info.designation} />
                  </div>
                </div>
              )}
              {activeTab === "contact" && (
                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <InfoRow icon={Mail} label="College Email" value={info.studentemailid} />
                    <InfoRow icon={AtSign} label="Personal Email" value={info.studentpersonalemailid} />
                    <InfoRow icon={Smartphone} label="Mobile" value={info.studentcellno} />
                    <InfoRow icon={Phone} label="Telephone" value={info.studenttelephoneno || "N/A"} />
                  </div>
                  <Separator />
                  <div className="space-y-0.5">
                    <InfoRow icon={User} label="Father's Name" value={info.fathersname} />
                    <InfoRow icon={User} label="Mother's Name" value={info.mothername} />
                    <InfoRow icon={Mail} label="Parent Email" value={info.parentemailid} />
                    <InfoRow icon={Smartphone} label="Parent Mobile" value={info.parentcellno} />
                    <InfoRow icon={Phone} label="Parent Telephone" value={info.parenttelephoneno} />
                  </div>
                  <Separator />
                  <div className="space-y-0.5">
                    <InfoRow icon={MapPin} label="Address" value={[info.paddress1, info.paddress2, info.paddress3].filter(Boolean).join(", ")} />
                    <InfoRow icon={Map} label="City" value={info.pcityname} />
                    <InfoRow icon={MapPin} label="District" value={info.pdistrict} />
                    <InfoRow icon={MapPin} label="State" value={info.pstatename} />
                    <InfoRow icon={Hash} label="Postal Code" value={info.ppostalcode} />
                  </div>
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
                      className="flex items-center gap-3 py-1 px-2 rounded transition-colors hover:bg-muted/5"
                    >
                      <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {qual.qualificationcode}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {qual.yearofpassing}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {qual.boardname}
                          </span>
                          <span className="text-muted-foreground">
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
                    <h3 className="text-lg font-semibold text-foreground">
                      Hostel Information
                    </h3>
                  </div>
                  <InfoRow
                    icon={Home}
                    label="Hostel Name"
                    value={hostelData.presenthosteldetail.hosteldescription}
                  />
                  <InfoRow
                    icon={MapPin}
                    label="Hostel Code"
                    value={hostelData.presenthosteldetail.hostelcode}
                  />
                  <InfoRow
                    icon={Key}
                    label="Room Number"
                    value={hostelData.presenthosteldetail.allotedroomno}
                  />
                  <InfoRow
                    icon={Building}
                    label="Floor"
                    value={hostelData.presenthosteldetail.floor}
                  />
                  <InfoRow
                    icon={Bed}
                    label="Bed Number"
                    value={hostelData.presenthosteldetail.beddesc}
                  />
                  <InfoRow
                    icon={Home}
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
                    icon={Shield}
                    label="Hostel Type"
                    value={hostelData.presenthosteldetail.hosteltypedesc}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

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
            className="aspect-square md:aspect-auto bg-card hover:bg-muted/5 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-foreground shadow-lg hover:shadow-xl transition-all duration-200 border border-border"
          >
            <Calendar className="w-8 h-8 md:w-6 md:h-6 mb-2 text-muted-foreground" />
            <span className="text-xs font-medium text-center">
              Academic Calendar
            </span>
          </motion.button>
          {!((w && (w.constructor && w.constructor.name === 'ArtificialWebPortal'))) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/fee")}
              className="aspect-square md:aspect-auto bg-card hover:bg-muted/5 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-foreground shadow-lg hover:shadow-xl transition-all duration-200 border border-border"
            >
              <DollarSign className="w-8 h-8 md:w-6 md:h-6 mb-2 text-muted-foreground" />
              <span className="text-xs font-medium text-center">Fee Details</span>
            </motion.button>
          )}
          {!((w && (w.constructor && w.constructor.name === 'ArtificialWebPortal'))) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/feedback")}
              className="aspect-square md:aspect-auto bg-card hover:bg-muted/5 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-foreground shadow-lg hover:shadow-xl transition-all duration-200 border border-border"
            >
              <MessageSquare className="w-8 h-8 md:w-6 md:h-6 mb-2 text-muted-foreground" />
              <span className="text-xs font-medium text-center">Faculty Feedback</span>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/gpa-calculator")}
            className="aspect-square md:aspect-auto bg-card hover:bg-muted/5 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-foreground shadow-lg hover:shadow-xl transition-all duration-200 border border-border"
          >
            <Calculator className="w-8 h-8 md:w-6 md:h-6 mb-2 text-muted-foreground" />
            <span className="text-xs font-medium text-center">GPA Calculator</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/timetable')}
            className="aspect-square md:aspect-auto bg-card hover:bg-muted/5 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-foreground shadow-lg hover:shadow-xl transition-all duration-200 border border-border"
          >
            <Calendar className="w-8 h-8 md:w-6 md:h-6 mb-2 text-muted-foreground" />
            <span className="text-xs font-medium text-center">Timetable</span>
          </motion.button>

          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://github.com/J2V-k/jportal-vhost"
            target="_blank"
            rel="noopener noreferrer"
            className="aspect-square md:aspect-auto bg-card hover:bg-muted/5 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-foreground shadow-lg hover:shadow-xl transition-all duration-200 border border-border group"
          >
            <Github className="w-8 h-8 md:w-6 md:h-6 mb-2 text-muted-foreground group-hover:text-blue-400 transition-colors duration-200" />
            <span className="text-xs font-medium text-center mb-1">
              View Source Code
            </span>
            <span className="hidden md:inline text-xs text-blue-400 group-hover:text-blue-300 transition-colors duration-200">
              and Contribute
            </span>
          </motion.a>

          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="https://J2V-k.github.io/jportal-vhost"
            target="_blank"
            rel="noopener noreferrer"
            className="aspect-square md:aspect-auto bg-card hover:bg-muted/5 rounded-lg p-4 md:p-3 md:h-20 flex flex-col items-center justify-center text-foreground shadow-lg hover:shadow-xl transition-all duration-200 border border-border group"
          >
            <BookOpen className="w-8 h-8 md:w-6 md:h-6 mb-2 text-muted-foreground group-hover:text-green-400 transition-colors duration-200" />
            <span className="text-xs font-medium text-center">
              Documentation
            </span>
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 py-1 px-2 rounded transition-colors hover:bg-muted/5 cursor-help">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="grid grid-cols-2 gap-4 flex-1 items-center">
              <span className="text-sm font-medium text-muted-foreground">
                {label}
              </span>
              <span className="text-sm text-foreground break-all font-medium">
                {value || "N/A"}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}: {value || "Not available"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
