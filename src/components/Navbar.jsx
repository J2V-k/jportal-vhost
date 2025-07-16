import { NavLink, useLocation } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import { motion } from "framer-motion"
import { Calendar, User, Book, FileText, ChartSpline } from "lucide-react"

const navItems = [
  { name: "Attendance", path: "/attendance", icon: ClipboardList },
  { name: "Grades", path: "/grades", icon: ChartSpline },
  { name: "Exams", path: "/exams", icon: FileText },
  { name: "Subjects", path: "/subjects", icon: Book },
  { name: "Profile", path: "/profile", icon: User },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 max-w-full min-w-full bg-[black] dark:bg-gray-100 py-2 px-2 z-50"
    >
      <ul className="flex items-center justify-between max-w-screen-lg mx-auto">
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
  )
}

