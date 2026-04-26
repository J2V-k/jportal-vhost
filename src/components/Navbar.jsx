import { NavLink, useLocation } from "react-router-dom"
import { CheckSquare, Calendar, User, Book, FileCheck, BarChart3, Calculator, DollarSign } from "lucide-react"
import { ArtificialWebPortal } from "./scripts/artificialW"
import { useState, useEffect } from 'react'
import { getShowTimetableInNavbar } from '@/components/scripts/cache' 

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

export default function Navbar({ w }) {
  const location = useLocation()
  const [showTimetableInNavbar, setShowTimetableInNavbar] = useState(() => {
    return getShowTimetableInNavbar();
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'showTimetableInNavbar') setShowTimetableInNavbar(e.newValue === 'true');
    };
    const onCustom = (e) => {
      if (e?.detail && typeof e.detail.showTimetableInNavbar !== 'undefined') {
        setShowTimetableInNavbar(Boolean(e.detail.showTimetableInNavbar));
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('jp:settingsChange', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('jp:settingsChange', onCustom);
    };
  }, []);

  const isOffline = w && (w instanceof ArtificialWebPortal || (w?.constructor?.name === 'ArtificialWebPortal'))
  
  const filterItems = (items) => isOffline 
    ? items.filter(item => !['Fee', 'Faculty Feedback', 'Grades', 'Exams'].includes(item.name)) 
    : items;

  const mobileItems = filterItems([...navItems]);
  if (showTimetableInNavbar && !mobileItems.find(i => i.path === '/timetable')) {
    mobileItems.push({ name: 'Timetable', path: '/timetable', icon: Calendar });
  }

  const desktopItems = filterItems([...desktopNavItems]);
  if (showTimetableInNavbar && !desktopItems.find(i => i.path === '/timetable')) {
    desktopItems.splice(1, 0, { name: 'Timetable', path: '/timetable', icon: Calendar });
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-card border-t border-border/40 z-50 flex items-center shadow-2xl shadow-black/20 dark:shadow-black/40">
        <div className="flex w-full items-center px-1">
          <div className="flex flex-1 justify-around items-center h-full">
            {mobileItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={`flex flex-col items-center justify-center flex-1 min-w-0 h-[60px] transition-all relative group ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={20} className={`transition-all ${ isActive ? "translate-y-[-3px]" : "group-hover:translate-y-[-1px]" }`} />
                  <span className="text-[8px] mt-0.5 font-bold uppercase tracking-tighter truncate w-full text-center px-0.5">
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-1 left-1/4 right-1/4 h-0.5 bg-primary rounded-full shadow-sm" />
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      </nav>

      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border/40 z-40 flex-col shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="h-16 flex items-center px-6 border-b border-border/40 gap-3">
          <img src="https://cdn.jsdelivr.net/gh/J2V-k/jportal-vhost@main/public/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold tracking-tight text-foreground uppercase">
            JP Portal
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {desktopItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon size={18} className="mr-3 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  )
}