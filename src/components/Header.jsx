import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeBtn from "./ui/ThemeBtn";
import MessMenu from './MessMenu';
import { Utensils, RefreshCw, ArrowLeft } from 'lucide-react';
import SettingsDialog from './SettingsDialog';
import { ArtificialWebPortal } from './scripts/artificialW';

const Header = ({ setIsAuthenticated, messMenuOpen, onMessMenuChange, attendanceGoal, setAttendanceGoal, w }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('password');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const rawPath = location.pathname || (location.hash ? location.hash.replace('#', '') : '/');
  const currentPath = rawPath.split('?')[0];
  const backVisiblePaths = ['/academic-calendar', '/fee', '/feedback', '/gpa-calculator', '/timetable'];
  const showBack = backVisiblePaths.includes(currentPath);
  const handleBack = () => navigate(-1);

  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-background text-foreground mx-auto px-3 pt-4 pb-2 shadow-md"
    >
      <div className="container-fluid flex justify-between items-center">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={handleBack} className="p-2 rounded-full bg-transparent hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-foreground text-2xl font-bold lg:text-3xl font-sans"
          >
            <p className="md:hidden"> JP Portal</p>
          </motion.h1>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center space-x-4"
        >
          <MessMenu open={messMenuOpen} onOpenChange={onMessMenuChange}>
            <div
              className="p-2 rounded-full focus:outline-none focus:ring-2 transition-colors duration-300 ease-in-out text-muted-foreground hover:bg-accent cursor-pointer"
            >
              <Utensils className="w-5 h-5" />
            </div>
          </MessMenu>
          <ThemeBtn />
          {(w && (w instanceof ArtificialWebPortal || (w.constructor && w.constructor.name === 'ArtificialWebPortal'))) && (
            <button
              onClick={() => window.location.reload()}
              title="Refresh page"
              aria-label="Refresh page"
              className="flex items-center gap-2 px-2 py-1 bg-accent text-accent-foreground border border-accent/20 rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-accent-foreground" />
              <span className="text-xs font-medium">Offline</span>
            </button>
          )}
          <SettingsDialog
            onLogout={handleLogout}
            attendanceGoal={attendanceGoal}
            setAttendanceGoal={setAttendanceGoal}
          />
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;
