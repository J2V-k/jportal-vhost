import { NavLink, useLocation } from "react-router-dom"
import { CheckSquare } from "lucide-react"
import { motion } from "framer-motion"
import { Calendar, User, Book, FileCheck, BarChart3, MessageSquare, Calculator, DollarSign } from "lucide-react"
import InstallPWA from "./InstallPWA"
import { ArtificialWebPortal } from "./scripts/artificialW"

const navItems = [
  { name: "Attendance", path: "/attendance", icon: CheckSquare },
  { name: "Grades", path: "/grades", icon: BarChart3 },
  { name: "Exams", path: "/exams", icon: FileCheck },
  { name: "Subjects", path: "/subjects", icon: Book },
  { name: "Profile", path: "/profile", icon: User },
]

const desktopNavItems = [
  { name: "Attendance", path: "/attendance", icon: CheckSquare },
  { name: "Grades", path: "/grades", icon: BarChart3 },
  { name: "GPA Calculator", path: "/gpa-calculator", icon: Calculator },
  { name: "Exams", path: "/exams", icon: FileCheck },
  { name: "Subjects", path: "/subjects", icon: Book },
  { name: "Fee", path: "/fee", icon: DollarSign },
  { name: "Academic Calendar", path: "/academic-calendar", icon: Calendar },
  { name: "Profile", path: "/profile", icon: User },
]

const currentMonth = new Date().getMonth()
const showFeedbackButton = currentMonth === 4 || currentMonth === 11
const desktopNavItemsWithFeedback = showFeedbackButton
  ? [...desktopNavItems, { name: "Faculty Feedback", path: "/feedback", icon: MessageSquare }]
  : desktopNavItems

export default function Navbar({ w }) {
  const location = useLocation()
  const isOffline = w && (w instanceof ArtificialWebPortal || (w.constructor && w.constructor.name === 'ArtificialWebPortal'))
  const mobileNavItemsFiltered = isOffline ? navItems.filter(item => item.name !== 'Fee' && item.name !== 'Faculty Feedback' && item.name !== 'Grades' && item.name !== 'Exams') : navItems
  const desktopNavItemsFiltered = isOffline ? desktopNavItemsWithFeedback.filter(item => item.name !== 'Fee' && item.name !== 'Faculty Feedback' && item.name !== 'Grades' && item.name !== 'Exams') : desktopNavItemsWithFeedback

  return (
    <>
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-background py-1 px-1 z-50"
      >
        <ul className="flex items-center justify-between max-w-screen-lg mx-auto">
          <InstallPWA />
          {mobileNavItemsFiltered.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <motion.li key={item.name} className="flex-1" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <NavLink
                  to={item.path}
                  className={`flex flex-col items-center justify-center p-1 rounded-lg transition-colors ${isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: isActive ? 1.2 : 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Icon className="w-5 h-5 mb-0.5" />
                  </motion.div>
                  <motion.span
                    className="text-[10px] font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {item.name}
                  </motion.span>
                  {isActive && (
                    <motion.div
                      className="bg-primary/20 rounded-lg z-[-1] opacity-20"
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
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border z-40 flex-col"
      >
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">JP Portal</h1>
        </div>

        <ul className="flex-1 px-3 py-4 space-y-2">
          {desktopNavItemsFiltered.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <motion.li key={item.name} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <NavLink
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg transition-colors ${isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
                    }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-primary-foreground rounded-full"
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

        <div className="p-3 border-t border-border">
          <InstallPWA />
        </div>
      </motion.nav>
    </>
  )
}

