import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import { Coffee, UtensilsCrossed, Moon, Calendar } from "lucide-react";

const dayMapping = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const extractDateFromKey = (key) => {
  const dateRegex = /(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/;
  const match = key.match(dateRegex);

  if (match) {
    const [_, day, month, year] = match;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(`${fullYear}-${month}-${day}`);
  }

  return null;
};

const getTodayDayName = () => {
  return dayMapping[new Date().getDay()];
};

const getCurrentWeekDates = () => {
  const now = new Date();
  const currentDay = now.getDay();
  
  let startDate = new Date(now);
  startDate.setDate(now.getDate() - currentDay);
  
  let endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  if (currentDay >= 1 && currentDay <= 6) {
    const mondayStart = new Date(now);
    mondayStart.setDate(now.getDate() - currentDay + 1);
    
    const sundayEnd = new Date(mondayStart);
    sundayEnd.setDate(mondayStart.getDate() + 6);
    
    startDate = mondayStart;
    endDate = sundayEnd;
  }
  
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
};

const transformNewApiData = (apiData) => {
  const menuData = {};
  
  apiData.forEach(item => {
    const date = new Date(item.dayDate);
    const day = item.day;
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`;
    const key = `${day} ${formattedDate}`;
    
    menuData[key] = {
      Breakfast: item.meals.breakfast.join(", "),
      Lunch: item.meals.lunch.join(", "),
      Dinner: item.meals.dinner.join(", ")
    };
  });
  
  return menuData;
};

const isMenuCurrent = (menuData) => {
  if (!menuData || Object.keys(menuData).length === 0) {
    return false;
  }

  const allDates = Object.keys(menuData).map((key) => {
    const date = extractDateFromKey(key);
    return { key, date };
  });

  allDates.sort((a, b) => {
    if (!a.date) return -1;
    if (!b.date) return 1;
    return a.date - b.date;
  });

  const lastEntry = allDates[allDates.length - 1];

  if (!lastEntry.date) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return lastEntry.date >= today;
};

const MenuUnavailable = ({ onViewOldMenu }) => (
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
    <div className="bg-[#0B0B0D] dark:bg-[#F9FAFB] p-6 rounded-lg border border-gray-700 dark:border-gray-300 shadow-lg">
      <UtensilsCrossed size={50} className="text-white dark:text-black mx-auto mb-4 opacity-25" />
      <h3 className="text-xl sm:text-2xl font-semibold text-white dark:text-black mb-2">
        Menu Currently Unavailable
      </h3>
      <p className="text-gray-400 dark:text-gray-600 mb-6">
        The current menu information is outdated. Please check back later for updated menu details.
      </p>
      <button
        onClick={onViewOldMenu}
        className="px-4 py-2 bg-[#1A1A1D] dark:bg-[#EDF2F7] text-white dark:text-black rounded-md hover:bg-[#2D2D30] dark:hover:bg-[#E2E8F0] transition-colors"
      >
        View Old Menu Anyway
      </button>
    </div>
  </div>
);

const MessMenu = ({ children, open, isOpen, onOpenChange, onChange }) => {
  const [view, setView] = useState("daily");
  const [menuAvailable, setMenuAvailable] = useState(true);
  const [forceShowMenu, setForceShowMenu] = useState(false);
  const [menuData, setMenuData] = useState({});
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined || isOpen !== undefined;
  const dialogOpen = isControlled ? (open ?? isOpen) : internalOpen;

  const handleDialogOpenChange = (val) => {
    if (typeof onOpenChange === "function") onOpenChange(val);
    if (typeof onChange === "function") onChange(val);

    if (!isControlled) setInternalOpen(val);
  };

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const response = await fetch('/mess_menu.json');
        const data = await response.json();
        if (data && data.menu) {
          const menuData = data.menu;
          setMenuData(menuData);
          setMenuAvailable(isMenuCurrent(menuData));
        } else {
          setMenuAvailable(false);
        }
      } catch (error) {
        setMenuAvailable(false);
      }
    };
    fetchMenuData();
  }, []);
  
  const handleViewOldMenu = () => {
    setForceShowMenu(true);
    // ensure dialog is open when forcing old menu view
    handleDialogOpenChange(true);
  };
  
  const shouldShowMenu = menuAvailable || forceShowMenu;
  const showTodayLabel = menuAvailable;

  const DailyView = () => {
    let daysToDisplay;
    
    if (showTodayLabel) {
      const todayIndex = new Date().getDay();
      daysToDisplay = [
        ...dayMapping.slice(todayIndex),
        ...dayMapping.slice(0, todayIndex),
      ];
    } else {
      daysToDisplay = Object.keys(menuData).map(key => key.split(' ')[0]);
    }

    return (
      <div className="space-y-4 sm:space-y-6 py-1 sm:py-2">
        {daysToDisplay.map((dayName, idx) => {
          const menuKey = Object.keys(menuData).find((k) =>
            k.startsWith(dayName)
          );
          if (!menuKey) return null;

          const dayMenu = menuData[menuKey];
          const isToday = showTodayLabel && idx === 0;

          return (
            <motion.div
              key={menuKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className={`p-3 sm:p-5 bg-[#0B0B0D] dark:bg-[#F9FAFB] rounded-lg border ${
                isToday ? "border-primary" : "border-gray-700 dark:border-gray-300"
              } shadow-sm`}
            >
              <h3
                className={`text-base sm:text-lg font-semibold text-center mb-2 sm:mb-4 text-white dark:text-black`}
              >
                {isToday ? `Today - ${menuKey}` : menuKey}
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-1 bg-primary/10 dark:bg-primary/10 p-1 sm:p-2 rounded-full">
                    <Coffee size={16} className="text-white dark:text-black" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white dark:text-black">
                      Breakfast
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-600">
                      {dayMenu.Breakfast}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-1 bg-primary/10 dark:bg-primary/10 p-1 sm:p-2 rounded-full">
                    <UtensilsCrossed size={16} className="text-white dark:text-black" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white dark:text-black">
                      Lunch
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-600">
                      {dayMenu.Lunch}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-1 bg-primary/10 dark:bg-primary/10 p-1 sm:p-2 rounded-full">
                    <Moon size={16} className="text-white dark:text-black" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-white dark:text-black">
                      Dinner
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-600">
                      {dayMenu.Dinner}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const WeeklyView = () => (
    <div className="overflow-x-auto">
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-[#0B0B0D] dark:bg-[#F9FAFB]">
            <TableHead className="font-bold text-white dark:text-black w-[120px]">
              Day
            </TableHead>
            <TableHead className="font-bold text-white dark:text-black">
              <div className="flex items-center gap-2">
                <Coffee size={16} className="text-white dark:text-black" />
                <span>Breakfast</span>
              </div>
            </TableHead>
            <TableHead className="font-bold text-white dark:text-black">
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={16} className="text-white dark:text-black" />
                <span>Lunch</span>
              </div>
            </TableHead>
            <TableHead className="font-bold text-white dark:text-black">
              <div className="flex items-center gap-2">
                <Moon size={16} className="text-white dark:text-black" />
                <span>Dinner</span>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(menuData).map(([day, meals], idx) => {
            const isToday = showTodayLabel && day.startsWith(dayMapping[new Date().getDay()]);

            return (
              <TableRow
                key={day}
                className={`${
                  isToday
                    ? "bg-[#1A1A1D] dark:bg-[#EDF2F7] border-l-2 border-l-primary"
                    : ""
                } hover:bg-[#0B0B0D] dark:hover:bg-[#F9FAFB] transition-colors`}
              >
                <TableCell
                  className={`font-medium ${
                    isToday
                      ? "text-white dark:text-black font-bold"
                      : "text-white dark:text-black"
                  }`}
                >
                  {isToday ? (
                    <div className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                      <span>{day}</span>
                    </div>
                  ) : (
                    <span>{day}</span>
                  )}
                </TableCell>
                
                <TableCell className="text-gray-400 dark:text-gray-600 p-3">
                  <div className="min-w-[200px] space-y-1">
                    {meals.Breakfast.split(", ").map((item, i) => (
                      <span
                        key={i}
                        className="inline-block bg-[#0B0B0D] dark:bg-[#F9FAFB] text-xs text-white dark:text-black rounded px-1.5 py-0.5 mr-1.5 mb-1.5 border border-gray-700 dark:border-gray-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-gray-400 dark:text-gray-600 p-3">
                  <div className="min-w-[250px] space-y-1">
                    {meals.Lunch.split(", ").map((item, i) => (
                      <span
                        key={i}
                        className="inline-block bg-[#0B0B0D] dark:bg-[#F9FAFB] text-xs text-white dark:text-black rounded px-1.5 py-0.5 mr-1.5 mb-1.5 border border-gray-700 dark:border-gray-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-gray-400 dark:text-gray-600 p-3">
                  <div className="min-w-[250px] space-y-1">
                    {meals.Dinner.split(", ").map((item, i) => (
                      <span
                        key={i}
                        className="inline-block bg-[#0B0B0D] dark:bg-[#F9FAFB] text-xs text-white dark:text-black rounded px-1.5 py-0.5 mr-1.5 mb-1.5 border border-gray-700 dark:border-gray-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[90vw] sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto bg-[#000000] dark:bg-[#FFFFFF] text-white dark:text-black rounded-lg mx-auto border border-gray-700 dark:border-gray-300 shadow-lg p-4 sm:p-6">
        <DialogHeader className="border-b border-gray-700 dark:border-gray-300 pb-2">
          <DialogTitle className="text-white dark:text-black flex items-center gap-2 text-lg sm:text-xl">
            <UtensilsCrossed className="text-white dark:text-black" />
            Mess Menu
            {!menuAvailable && forceShowMenu && (
              <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">Outdated</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {shouldShowMenu ? (
          <>
            {!menuAvailable && (
              <></>
            )}
            
            <div className="flex items-center justify-center my-4 sm:my-6">
              <div className="flex items-center bg-[#0B0B0D] dark:bg-[#F9FAFB] p-1 rounded-full shadow-inner border border-gray-800 dark:border-gray-200">
                <div
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-200 ${
                    view === "weekly"
                      ? "bg-[#000000] dark:bg-[#FFFFFF] text-white dark:text-black shadow-sm"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  onClick={() => setView("weekly")}
                  role="button"
                  tabIndex={0}
                >
                  <Calendar
                    size={16}
                    className={
                      view === "weekly"
                        ? "text-white dark:text-black"
                        : "text-gray-400 dark:text-gray-600"
                    }
                  />
                  <span className="text-xs sm:text-sm font-medium">Weekly</span>
                </div>

                <div
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-200 ${
                    view === "daily"
                      ? "bg-[#000000] dark:bg-[#FFFFFF] text-white dark:text-black shadow-sm"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  onClick={() => setView("daily")}
                  role="button"
                  tabIndex={0}
                >
                  <span className="text-xs sm:text-sm font-medium">Daily</span>
                  <UtensilsCrossed
                    size={16}
                    className={
                      view === "daily"
                        ? "text-white dark:text-black"
                        : "text-gray-400 dark:text-gray-600"
                    }
                  />
                </div>
              </div>
            </div>

            {view === "daily" ? <DailyView /> : <WeeklyView />}
          </>
        ) : (
          <MenuUnavailable onViewOldMenu={handleViewOldMenu} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MessMenu;