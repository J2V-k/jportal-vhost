import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeBtn from "./ui/ThemeBtn";
import MessMenu from './MessMenu';
import { Utensils, ArrowLeft, WifiOff, Info } from 'lucide-react';
import SettingsDialog from './SettingsDialog';
import { removePassword } from '@/components/scripts/cache';
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
    removePassword();
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
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm"
    >
      <AnimatePresence>
        {notice && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-primary/8 border-b border-primary/15 overflow-hidden"
          >
            <div className="mx-auto px-4 py-2 flex items-center justify-center gap-2 max-w-[1440px] text-center">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs font-medium text-primary line-clamp-1">
                {notice}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto px-4 h-16 flex items-center justify-between max-w-[1440px]">
        <div className="flex items-center gap-6">
          {showBack && (
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center justify-center w-10 h-10 rounded-xl border border-border/50 bg-card hover:bg-accent transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </motion.button>
          )}

          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
              JP Portal
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isOfflineMode && (
            <motion.button
              onClick={() => window.location.reload()}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15 transition-all duration-200 shadow-sm hover:shadow-md"
              title="You are viewing cached data - Click to reload"
            >
              <WifiOff className="w-4 h-4" />
              <span className="hidden md:inline text-xs font-semibold uppercase tracking-tight">Offline</span>
            </motion.button>
          )}

          <div className="flex items-center gap-2">
            <MessMenu open={messMenuOpen} onOpenChange={onMessMenuChange}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground bg-transparent hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="View Mess Menu"
              >
                <Utensils className="w-5 h-5" />
              </motion.button>
            </MessMenu>

            <ThemeBtn />

            <div className="w-px h-6 bg-border/40 mx-1" />

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
