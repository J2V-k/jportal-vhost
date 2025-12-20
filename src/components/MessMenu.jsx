import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Sunrise, Sun, Sunset, Calendar, ChefHat, History, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

const mealTimeLabel = (dayName, meal) => {
  if (meal === 'Breakfast') {
    if (dayName === 'Sunday') return 'Till 9:30 AM';
    return 'Till 9:00 AM';
  }
  if (meal === 'Lunch') return '12:00 - 14:00';
  if (meal === 'Dinner') return 'From 19:30';
  return '';
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

const MenuUnavailable = React.memo(({ onViewOldMenu }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="bg-muted/30 p-8 rounded-2xl border border-dashed border-border max-w-sm">
      <ChefHat size={48} className="text-muted-foreground mx-auto mb-4 opacity-50" />
      <h3 className="text-xl font-bold text-foreground mb-2">
        Menu Unavailable
      </h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        The mess menu is currently outdated or unavailable. Check back later!
      </p>
      <button
        onClick={onViewOldMenu}
        className="text-sm px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors flex items-center gap-2 mx-auto font-medium"
      >
        <History className="w-4 h-4" />
        View Previous Menu
      </button>
    </div>
  </div>
));

const MessMenu = ({ children, open, onOpenChange }) => {
  const [view, setView] = useState(() => {
    return localStorage.getItem('defaultMessMenuView') || 'daily';
  });
  const [menuAvailable, setMenuAvailable] = useState(true);
  const [forceShowMenu, setForceShowMenu] = useState(false);
  const [menuData, setMenuData] = useState({});

  const [menuLoaded, setMenuLoaded] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  const effectiveOpen = typeof open === 'boolean' ? open : internalOpen;

  useEffect(() => {
    if (!effectiveOpen || menuLoaded) return;
    let cancelled = false;
    const fetchMenuData = async () => {
      try {
        let response = await fetch('/api/messmenu');
        if (cancelled) return;

        const data = await response.json();
        let parsed = null;
        if (data && data.menu) {
          parsed = data.menu;
        } else if (data && typeof data === 'object') {
          parsed = data;
        }
        if (parsed && Object.keys(parsed).length > 0) {
          setMenuData(parsed);
          setMenuAvailable(isMenuCurrent(parsed));
        } else {
          setMenuAvailable(false);
        }
      } catch (error) {
        if (!cancelled) setMenuAvailable(false);
      } finally {
        if (!cancelled) setMenuLoaded(true);
      }
    };
    fetchMenuData();
    return () => { cancelled = true; };
  }, [effectiveOpen, menuLoaded]);

  useEffect(() => {
    const handleStorageChange = () => {
      const defaultView = localStorage.getItem('defaultMessMenuView') || 'daily';
      setView(defaultView);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleViewOldMenu = useCallback(() => {
    setForceShowMenu(true);
  }, []);

  const handleViewChange = useCallback((newView) => {
    setView(newView);
    localStorage.setItem('defaultMessMenuView', newView);
  }, []);

  const shouldShowMenu = useMemo(() => menuAvailable || forceShowMenu, [menuAvailable, forceShowMenu]);
  const showTodayLabel = useMemo(() => menuAvailable, [menuAvailable]);

  const DailyView = useMemo(() => {
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

    if (!menuLoaded) {
      return (
        <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-sm">Loading today's menu...</span>
        </div>
      );
    }
    return (
      <div className="space-y-6 py-2">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className={`group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 ${isToday
                ? "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)] ring-1 ring-amber-400/50"
                : "border-border hover:border-primary/30 hover:shadow-sm"
                }`}
            >
              {isToday && (
                <div className="absolute top-0 right-0">
                  <div className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm">
                    Running Today
                  </div>
                </div>
              )}

              <div className="p-4 sm:p-5">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  {dayName}
                  <span className="text-sm font-normal text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                    {menuKey.replace(dayName, "").trim()}
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Breakfast', icon: Sunrise, items: dayMenu.Breakfast, color: 'text-orange-500' },
                    { label: 'Lunch', icon: Sun, items: dayMenu.Lunch, color: 'text-yellow-500' },
                    { label: 'Dinner', icon: Sunset, items: dayMenu.Dinner, color: 'text-indigo-500' }
                  ].map((meal) => (
                    <div key={meal.label} className="bg-muted/20 rounded-lg p-3 border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <meal.icon size={16} className={meal.color} />
                        <span className="font-semibold text-sm">{meal.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto bg-background px-1.5 py-0.5 rounded border border-border">
                          {mealTimeLabel(dayName, meal.label).replace("Till ", "< ")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {meal.items.split(", ").map((item, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-background border border-border/60 text-foreground/80"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }, [menuData, showTodayLabel, menuLoaded]);

  const WeeklyView = useMemo(() => (
    <div className="w-full rounded-xl border border-border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[120px] font-bold">Day</TableHead>
              {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
                <TableHead key={meal} className="min-w-[200px]">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    {meal === 'Breakfast' && <Sunrise size={14} className="text-orange-500" />}
                    {meal === 'Lunch' && <Sun size={14} className="text-yellow-500" />}
                    {meal === 'Dinner' && <Sunset size={14} className="text-indigo-500" />}
                    {meal}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(menuData).map(([day, meals], idx) => {
              const isToday = showTodayLabel && day.startsWith(dayMapping[new Date().getDay()]);
              return (
                <TableRow
                  key={day}
                  className={isToday ? "bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500" : "hover:bg-muted/30"}
                >
                  <TableCell className="font-medium align-top py-3">
                    <div className="flex flex-col">
                      <span className={isToday ? "text-amber-600 dark:text-amber-400 font-bold" : ""}>{day.split(" ")[0]}</span>
                      <span className="text-xs text-muted-foreground">{day.split(" ")[1]}</span>
                      {isToday && <Badge variant="outline" className="w-fit mt-1 text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 px-1.5 h-5">Today</Badge>}
                    </div>
                  </TableCell>
                  {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
                    <TableCell key={meal} className="align-top py-3">
                      <div className="flex flex-wrap gap-1">
                        {meals[meal].split(", ").map((item, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded border ${isToday ? 'bg-amber-500/5 border-amber-500/20 text-foreground' : 'bg-muted/30 border-border text-foreground/90'}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  ), [menuData, showTodayLabel]);

  return (
    <Dialog open={effectiveOpen} onOpenChange={(v) => {
      if (typeof open === 'boolean') {
        onOpenChange && onOpenChange(v);
      } else {
        setInternalOpen(v);
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-3xl lg:max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden flex flex-col bg-card border-border shadow-2xl rounded-lg">
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b border-border bg-muted/10 shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ChefHat className="w-5 h-5 text-primary" />
                Mess Menu
              </DialogTitle>
              <DialogDescription>
                Weekly menu schedule and timings
              </DialogDescription>
            </div>

            {shouldShowMenu && (
              <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
                <button
                  onClick={() => handleViewChange("daily")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "daily" ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <span className="flex items-center gap-1"><Calendar size={12} /> Daily</span>
                </button>
                <button
                  onClick={() => handleViewChange("weekly")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "weekly" ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <span className="hidden sm:inline">Weekly View</span>
                  <span className="sm:hidden">Weekly</span>
                </button>
              </div>
            )}
          </div>

          {!menuAvailable && forceShowMenu && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-3 py-2 rounded-md border border-amber-200 dark:border-amber-900/50">
              <Info size={14} className="text-amber-600 dark:text-amber-400" />
              <span>You are viewing an old menu. Dates might not match current week.</span>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
          {shouldShowMenu ? (
            view === "daily" ? DailyView : WeeklyView
          ) : (
            <MenuUnavailable onViewOldMenu={handleViewOldMenu} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessMenu;