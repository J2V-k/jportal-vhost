import { NavLink, useLocation } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import { motion } from "framer-motion"
import { Calendar, User, Book, FileText, ChartSpline, MessageSquare, Calculator } from "lucide-react"
import InstallPWA from "./InstallPWA"

const navItems = [
  { name: "Attendance", path: "/attendance", icon: ClipboardList },
  { name: "Grades", path: "/grades", icon: ChartSpline },
  { name: "Exams", path: "/exams", icon: FileText },
  { name: "Subjects", path: "/subjects", icon: Book },
  { name: "Profile", path: "/profile", icon: User },
]

const desktopNavItems = [
  { name: "Attendance", path: "/attendance", icon: ClipboardList },
  { name: "Grades", path: "/grades", icon: ChartSpline },
  { name: "GPA Calculator", path: "/gpa-calculator", icon: Calculator },
  { name: "Exams", path: "/exams", icon: FileText },
  { name: "Subjects", path: "/subjects", icon: Book },
  { name: "Fee", path: "/fee", icon: FileText },
  { name: "Academic Calendar", path: "/academic-calendar", icon: Calendar },
  { name: "Profile", path: "/profile", icon: User },
]

const currentMonth = new Date().getMonth()
const showFeedbackButton = currentMonth === 4 || currentMonth === 11
const desktopNavItemsWithFeedback = showFeedbackButton 
  ? [...desktopNavItems, { name: "Faculty Feedback", path: "/feedback", icon: MessageSquare }]
  : desktopNavItems

export default function Navbar() {
  const location = useLocation()

  return (
    <>
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[black] dark:bg-gray-100 py-2 px-2 z-50"
      >
        <ul className="flex items-center justify-between max-w-screen-lg mx-auto">
          <InstallPWA />
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <motion.li key={item.name} className="flex-1" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <NavLink
                  to={item.path}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                    isActive
                      ? "text-white dark:text-black"
                      : "text-gray-400 hover:text-gray-200 dark:text-gray-500 dark:hover:text-gray-800"
                  }`}
                >
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: isActive ? 1.2 : 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Icon className="w-6 h-6 mb-1" />
                  </motion.div>
                  <motion.span
                    className="text-xs font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {item.name}
                  </motion.span>
                  {isActive && (
                    <motion.div
                      className="bg-white dark:bg-black rounded-lg z-[-1] opacity-20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.2 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </NavLink>
              </motion.li>
            )
          })}
        </ul>
      </motion.nav>

      <motion.nav
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-[black] dark:bg-gray-100 border-r border-gray-800 dark:border-gray-200 z-40 flex-col"
      >
        <div className="p-4 border-b border-gray-800 dark:border-gray-200">
          <h1 className="text-xl font-bold text-white dark:text-black">JP Portal</h1>
        </div>
        
        <ul className="flex-1 px-3 py-4 space-y-2">
          {desktopNavItemsWithFeedback.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <motion.li key={item.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <NavLink
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-white dark:bg-black text-black dark:text-white"
                      : "text-gray-400 hover:text-gray-200 dark:text-gray-500 dark:hover:text-gray-800 hover:bg-gray-900 dark:hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-green-500 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </NavLink>
              </motion.li>
            )
          })}
        </ul>
        
        <div className="p-3 border-t border-gray-800 dark:border-gray-200">
          <InstallPWA />
        </div>
      </motion.nav>
    </>
  )
}

