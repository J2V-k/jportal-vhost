import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeBtn from "./ui/ThemeBtn";
import MessMenu from './MessMenu';
import { Utensils, ArrowLeft, WifiOff, Info } from 'lucide-react';
import SettingsDialog from './SettingsDialog';
import { ArtificialWebPortal } from './scripts/artificialW';

const Header = ({ setIsAuthenticated, messMenuOpen, onMessMenuChange, attendanceGoal, setAttendanceGoal, w }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/J2V-k/data/refs/heads/main/notice.txt');
        if (response.ok) {
          const text = await response.text();
          if (text && text.trim().length > 0) {
            setNotice(text.trim());
          }
        }
      } catch (error) {
        console.error("Failed to fetch notice:", error);
      }
    };

    fetchNotice();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('password');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const rawPath = location.pathname || (location.hash ? location.hash.replace('#', '') : '/');
  const currentPath = rawPath.split('?')[0];
  const backVisiblePaths = ['/academic-calendar', '/fee', '/feedback', '/gpa-calculator', '/timetable', '/subjects'];
  const showBack = backVisiblePaths.includes(currentPath);
  const handleBack = () => navigate(-1);

  const isOfflineMode = (w && (w instanceof ArtificialWebPortal || (w.constructor && w.constructor.name === 'ArtificialWebPortal')));

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <AnimatePresence>
        {notice && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-primary/10 border-b border-primary/10 overflow-hidden"
          >
            <div className="mx-auto px-4 py-1.5 flex items-center justify-center gap-2 max-w-[1440px] text-center">
              <Info className="w-3.5 h-3.5 text-primary shrink-0" />
              <p className="text-xs font-medium text-primary">
                {notice}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto px-4 h-16 flex items-center justify-between max-w-[1440px]">
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={handleBack}
              className="group flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card hover:bg-accent transition-all duration-200 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </button>
          )}

          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              JP Portal
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOfflineMode && (
            <button
              onClick={() => window.location.reload()}
              className="mr-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
              title="You are viewing cached data"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[10px] font-bold uppercase tracking-tighter">Offline</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <MessMenu open={messMenuOpen} onOpenChange={onMessMenuChange}>
              <button 
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="View Mess Menu"
              >
                <Utensils className="w-5 h-5" />
              </button>
            </MessMenu>

            <ThemeBtn />

            <div className="w-px h-6 bg-border mx-1" />

            <SettingsDialog
              onLogout={handleLogout}
              attendanceGoal={attendanceGoal}
              setAttendanceGoal={setAttendanceGoal}
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
