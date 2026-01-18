import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
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
  AtSign,
  Map,
  Bed,
  Key,
  Shield,
  IdCard,
  BookOpen,
  Users,
  Smartphone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Profile({
  w,
  profileData,
  setProfileData,
  semesterData: initialSemesterData,
}) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [_, setLocalSemesterData] = useState(initialSemesterData || []);
  const [hostelData, setHostelData] = useState(null);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ["personal", "contact", "education", "hostel"];
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
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
        console.error("Failed to fetch grades data:", error);
      }
    };
    if (w) fetchGradesData();
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
    if (w) fetchHostelData();
  }, [w]);

  const info = profileData?.generalinformation || {};
  const qualifications = profileData?.qualification || [];
  const photosrc = profileData?.["photo&signature"]?.photo
    ? `data:image/jpg;base64,${profileData["photo&signature"].photo}`
    : null;

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-4 pb-24 md:pb-8 space-y-6">
        <Card className="bg-card shadow rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
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
      </Helmet>

      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="bg-card text-foreground shadow-sm rounded-lg p-4 md:p-6 border border-border"
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
              <h1 className="text-lg md:text-2xl font-semibold text-foreground truncate">{info.studentname}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> {info.programcode}</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2"><IdCard className="w-4 h-4" /> {info.registrationno}</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2 truncate"><Mail className="w-4 h-4" /> {info.studentemailid}</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto mt-2 md:mt-0 md:border-l md:pl-6 border-border">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 min-w-[220px] text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><BookOpen className="w-4 h-4" /> Semester</div>
              <Badge variant="secondary" className="w-fit rounded-md">{info.semester}</Badge>
              <div className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" /> Section</div>
              <div className="font-semibold text-foreground">{info.sectioncode}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /> Batch</div>
              <div className="font-semibold text-foreground">{info.batch}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start bg-card h-auto p-1 border border-border overflow-x-auto rounded-lg">
          <TabsTrigger value="personal" className="flex items-center gap-2 py-2 rounded-md"><User className="w-4 h-4" /> Personal</TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2 py-2 rounded-md"><Phone className="w-4 h-4" /> Contact</TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2 py-2 rounded-md"><GraduationCap className="w-4 h-4" /> Education</TabsTrigger>
          {hostelData?.presenthosteldetail && (
            <TabsTrigger value="hostel" className="flex items-center gap-2 py-2 rounded-md"><Home className="w-4 h-4" /> Hostel</TabsTrigger>
          )}
        </TabsList>

        <Card className="mt-4 border-border bg-card shadow-sm overflow-hidden rounded-lg">
          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-4 md:p-6"
              >
                <TabsContent value="personal" className="m-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                    <InfoRow icon={Calendar} label="Date of Birth" value={info.dateofbirth} />
                    <InfoRow icon={Users} label="Gender" value={info.gender} />
                    <InfoRow icon={Droplets} label="Blood Group" value={info.bloodgroup} />
                    <InfoRow icon={Globe} label="Nationality" value={info.nationality} />
                    <InfoRow icon={Tag} label="Category" value={info.category} />
                    <InfoRow icon={Hash} label="APAAR ID" value={info.apaarid} />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                    <InfoRow icon={GraduationCap} label="Admission Year" value={info.admissionyear} />
                    <InfoRow icon={Home} label="Institute Code" value={info.institutecode} />
                    <InfoRow icon={CreditCard} label="Bank Account" value={info.bankaccountno} />
                    <InfoRow icon={Building} label="Bank Name" value={info.bankname} />
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="m-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                    <InfoRow icon={Mail} label="College Email" value={info.studentemailid} />
                    <InfoRow icon={AtSign} label="Personal Email" value={info.studentpersonalemailid} />
                    <InfoRow icon={Smartphone} label="Mobile" value={info.studentcellno} />
                    <InfoRow icon={Phone} label="Telephone" value={info.studenttelephoneno} />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                    <InfoRow icon={User} label="Father's Name" value={info.fathersname} />
                    <InfoRow icon={User} label="Mother's Name" value={info.mothername} />
                    <InfoRow icon={Smartphone} label="Parent Mobile" value={info.parentcellno} />
                    <InfoRow icon={Mail} label="Parent Email" value={info.parentemailid} />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <InfoRow icon={MapPin} label="Address" value={[info.paddress1, info.paddress2, info.paddress3].filter(Boolean).join(", ")} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                      <InfoRow icon={Map} label="City" value={info.pcityname} />
                      <InfoRow icon={MapPin} label="State" value={info.pstatename} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="education" className="m-0 space-y-3">
                  {qualifications.map((qual, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/10">
                      <GraduationCap className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold truncate">{qual.qualificationcode}</span>
                          <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">{qual.percentagemarks}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span className="truncate">{qual.boardname}</span>
                          <span>Passed {qual.yearofpassing}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="hostel" className="m-0 space-y-4">
                  {hostelData?.presenthosteldetail && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                      <InfoRow icon={Home} label="Hostel Name" value={hostelData.presenthosteldetail.hosteldescription} />
                      <InfoRow icon={Key} label="Room Number" value={hostelData.presenthosteldetail.allotedroomno} />
                      <InfoRow icon={Bed} label="Bed Number" value={hostelData.presenthosteldetail.beddesc} />
                      <InfoRow icon={Building} label="Floor" value={hostelData.presenthosteldetail.floor} />
                      <InfoRow icon={Shield} label="Hostel Type" value={hostelData.presenthosteldetail.hosteltypedesc} />
                      <InfoRow icon={Calendar} label="Allotted From" value={hostelData.presenthosteldetail.allotedfromdate} />
                    </div>
                  )}
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </Tabs>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3"
      >
        {[
          { icon: Calendar, label: "Calendar", path: "/academic-calendar" },
          { icon: Calculator, label: "GPA Calc", path: "/gpa-calculator" },
          { icon: Calendar, label: "Timetable", path: "/timetable" },
          { icon: MessageSquare, label: "Feedback", path: "/feedback", hideOnPortal: true },
          { icon: DollarSign, label: "Fee", path: "/fee", hideOnPortal: true },
        ].filter(btn => !btn.hideOnPortal || !((w && w.constructor.name === 'ArtificialWebPortal'))).map((btn, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(btn.path)}
            className="aspect-square bg-card border border-border rounded-lg p-2 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-all group"
          >
            <btn.icon className="w-6 h-6 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-[10px] md:text-xs font-medium text-center">{btn.label}</span>
          </motion.button>
        ))}

        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="https://github.com/J2V-k/jportal-vhost"
          target="_blank"
          className="aspect-square bg-card border border-border rounded-lg p-2 flex flex-col items-center justify-center shadow-sm group"
        >
          <Github className="w-6 h-6 mb-2 text-muted-foreground group-hover:text-blue-400" />
          <span className="text-[10px] md:text-xs font-medium text-center">GitHub</span>
        </motion.a>

        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="https://J2V-k.github.io/jportal-vhost"
          target="_blank"
          className="aspect-square bg-card border border-border rounded-lg p-2 flex flex-col items-center justify-center shadow-sm group"
        >
          <BookOpen className="w-6 h-6 mb-2 text-muted-foreground group-hover:text-green-400" />
          <span className="text-[10px] md:text-xs font-medium text-center">Docs</span>
        </motion.a>
      </motion.div>
    </motion.div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors group cursor-help">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
            <div className="grid grid-cols-2 gap-4 flex-1 items-center">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
              <span className="text-sm text-foreground break-all font-semibold">{value || "N/A"}</span>
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