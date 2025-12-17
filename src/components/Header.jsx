import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeBtn from "./ui/ThemeBtn";
import MessMenu from './MessMenu';
import { Utensils, RefreshCw } from 'lucide-react';
import SettingsDialog from './SettingsDialog';
import { ArtificialWebPortal } from './scripts/artificialW';

const Header = ({ setIsAuthenticated, messMenuOpen, onMessMenuChange, attendanceGoal, setAttendanceGoal, w }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('password');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[black] mx-auto px-3 pt-4 pb-2 dark:bg-white shadow-md"
    >
      <div className="container-fluid flex justify-between items-center">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-white text-2xl font-bold lg:text-3xl font-sans dark:text-black"
        >
         <p className="md:hidden"> JP Portal</p>
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center space-x-4"
        >
          <MessMenu open={messMenuOpen} onOpenChange={onMessMenuChange}>
            <div
              className="p-2 rounded-full focus:outline-none focus:ring-2 transition-colors duration-300 ease-in-out dark:text-gray-700 dark:hover:bg-gray-200 text-gray-300 hover:bg-[#0A0A0C] cursor-pointer"
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
              className="flex items-center gap-2 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/30 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-yellow-300" />
              <span className="text-xs text-yellow-300 font-medium">Offline</span>
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
