import React, { useState, useEffect } from "react"
import { User, Mail, Phone, MapPin, GraduationCap, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function Profile({ w, profileData, setProfileData }) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("personal")


  useEffect(() => {
    const fetchProfileData = async () => {
      if (profileData) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await w.get_personal_info()
        console.log("Profile data fetched:", data)
        setProfileData(data)
      } catch (error) {
        console.error("Failed to fetch profile data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [w, profileData, setProfileData])



  const info = profileData?.generalinformation || {}
  const qualifications = profileData?.qualification || []
  // guard photo access safely
  const photosrc = profileData?.['photo&signature']?.photo
    ? `data:image/jpg;base64,${profileData['photo&signature'].photo}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-white dark:text-black animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto max-w-4xl px-4 py-4 space-y-6"
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
              <h1 className="text-lg md:text-2xl font-semibold text-white dark:text-black truncate">{info.studentname}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-300 dark:text-gray-700">
                <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4" />{info.programcode}</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2"><User className="w-4 h-4" />{info.registrationno}</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-2 truncate"><Mail className="w-4 h-4" />{info.studentemailid}</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto mt-2 md:mt-0">
            {/* compact mobile summary */}
            <div className="md:hidden text-sm text-gray-300">
              <div className="flex flex-wrap gap-3">
                <span>Sem: <span className="font-semibold text-white dark:text-black">{info.semester}</span></span>
                <span>Sec: <span className="font-semibold text-white dark:text-black">{info.sectioncode}</span></span>
                <span>Batch: <span className="font-semibold text-white dark:text-black">{info.batch}</span></span>
              </div>
            </div>

            {/* desktop: 2-column grid of academic fields */}
            <div className="hidden md:grid grid-cols-2 gap-3 min-w-[220px] text-sm">
              <div className="text-gray-400 dark:text-gray-600">Semester</div>
              <div className="font-semibold text-white dark:text-black">{info.semester}</div>
              <div className="text-gray-400 dark:text-gray-600">Section</div>
              <div className="font-semibold text-white dark:text-black">{info.sectioncode}</div>
              <div className="text-gray-400 dark:text-gray-600">Batch</div>
              <div className="font-semibold text-white dark:text-black">{info.batch}</div>
              <div className="text-gray-400 dark:text-gray-600">Academic Year</div>
              <div className="font-semibold text-white dark:text-black">{info.academicyear}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="bg-[#0B0B0D] dark:bg-white shadow rounded-lg">
        <div className="flex overflow-x-auto border-b border-gray-700 dark:border-gray-200">
          {[
            "personal",
            "contact",
            "education"
          ].map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-none min-w-[88px] py-2 px-3 text-center text-sm font-medium ${
                activeTab === tab
                  ? "text-white border-b-2 border-white dark:text-black dark:border-black"
                  : "text-gray-300 hover:text-gray-100 dark:text-gray-700 dark:hover:text-gray-900"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
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
              <div className="space-y-1">
                <InfoRow icon={User} label="Date of Birth" value={info.dateofbirth} />
                <InfoRow icon={User} label="Gender" value={info.gender} />
                <InfoRow icon={User} label="Blood Group" value={info.bloodgroup} />
                <InfoRow icon={User} label="Nationality" value={info.nationality} />
                <InfoRow icon={User} label="Category" value={info.category} />
              </div>
            )}
            {/* academic tab removed - details now shown in header */}
            {activeTab === "contact" && (
              <div className="space-y-1">
                <InfoRow icon={Mail} label="College Email" value={info.studentemailid} />
                <InfoRow icon={Mail} label="Personal Email" value={info.studentpersonalemailid} />
                <InfoRow icon={Phone} label="Mobile" value={info.studentcellno} />
                <InfoRow icon={Phone} label="Telephone" value={info.studenttelephoneno || "N/A"} />
                <InfoRow icon={User} label="Father's Name" value={info.fathersname} />
                <InfoRow icon={User} label="Mother's Name" value={info.mothername} />
                <InfoRow icon={MapPin} label="Current Address" value={[info.caddress1, info.caddress3].filter(Boolean).join(", ")} />
                <InfoRow icon={MapPin} label="City" value={info.ccityname} />
                <InfoRow icon={MapPin} label="District" value={info.cdistrict} />
                <InfoRow icon={MapPin} label="State" value={info.cstatename} />
                <InfoRow icon={MapPin} label="Postal Code" value={info.cpostalcode} />
              </div>
            )}
            {activeTab === "education" && (
              <div className="space-y-2">
                <div className="grid gap-2">
                  {qualifications.map((qual, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-2 rounded bg-white/3 dark:bg-black/3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm text-white dark:text-black">{qual.qualificationcode}</div>
                        <div className="text-xs text-gray-400">{qual.yearofpassing}</div>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-300 dark:text-gray-700">{qual.boardname}</div>
                        <div className="text-gray-300 dark:text-gray-700 text-right">{qual.percentagemarks}%</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center p-4 text-sm text-gray-300 dark:text-gray-700"
      >
        powered by{' '}
        <a href="https://pyjiit.codelif.in/" className="text-blue-500 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
          PyJiit
        </a>
        {' '}and originally created by{' '}
        <a href="https://github.com/codeblech" className="text-blue-500 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
          Yash Malik
        </a>
        <br />
        <span className="block mt-2">
          Current Source code for this version on{' '}
          <a href="https://github.com/J2V-k/jportal-vhost" className="text-blue-500 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </span>
      </motion.div>
    </motion.div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2 px-2 rounded transition-colors hover:bg-white/4 dark:hover:bg-black/4">
      <Icon className="h-4 w-4 text-gray-300 dark:text-gray-700 shrink-0" />
      <div className="grid grid-cols-2 gap-4 flex-1 items-center">
        <span className="text-sm font-medium text-gray-400 dark:text-gray-600">{label}</span>
        <span className="text-sm text-white dark:text-black break-all font-medium">{value || "N/A"}</span>
      </div>
    </div>
  )
}

