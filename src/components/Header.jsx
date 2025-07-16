import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeBtn from "./ui/ThemeBtn";
import MessMenu from './MessMenu';
import { Utensils } from 'lucide-react';

const Header = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    localStorage.removeItem('attendanceData');
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
          JPortal
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center space-x-4"
        >
          <MessMenu>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full focus:outline-none focus:ring-2 transition-colors duration-300 ease-in-out dark:text-gray-700 dark:hover:bg-gray-200 text-gray-300 hover:bg-[#0A0A0C] cursor-pointer"
            >
              <Utensils className="w-5 h-5 text-[#D1D5DB] dark:text-[#47505F]" />
            </motion.div>
          </MessMenu>
          <ThemeBtn />
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full focus:outline-none focus:ring-2 transition-colors duration-300 ease-in-out dark:text-gray-700 dark:hover:bg-gray-200 text-gray-300 hover:bg-[#0A0A0C]"
          >
            <img
              src='/icons/logout.svg'
              alt="Logout"
              onClick={handleLogout}
              className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity dark:filter dark:invert"
            />
          </motion.div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;
