import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Empty } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Info,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils"; 

const AttendanceDaily = ({ 
  dailyDate, 
  setDailyDate, 
  subjects, 
  subjectAttendanceData 
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const safeDailyDate = dailyDate instanceof Date && !isNaN(dailyDate) ? dailyDate : new Date();

  const getClassesFor = (subjectName, date) => {
    const all = subjectAttendanceData[subjectName];
    if (!all) return [];
    const key = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return all.filter((c) => c.datetime.startsWith(key));
  };

  const handleDateChange = (days) => {
    const newDate = new Date(safeDailyDate);
    newDate.setDate(newDate.getDate() + days);
    setDailyDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isCurrentDate = isToday(safeDailyDate);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 md:static md:p-0 md:bg-transparent bg-background/80 backdrop-blur-md border-b md:border-none border-border/40 transition-all">
        <div className={cn(
          "flex items-center justify-between p-1.5 rounded-xl border shadow-sm transition-all duration-300",
          isCurrentDate 
            ? "bg-amber-500/10 border-amber-500/20 shadow-amber-500/5" 
            : "bg-card border-border"
        )}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleDateChange(-1)}
            className="h-9 w-9 rounded-lg hover:bg-background/80 hover:scale-105 transition-transform"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div 
            className="flex flex-col items-center cursor-pointer select-none active:scale-95 transition-transform" 
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          >
            <div className={cn(
              "text-sm md:text-base flex items-center gap-2 transition-colors",
              isCurrentDate ? "font-bold text-amber-600 dark:text-amber-400" : "font-semibold text-foreground"
            )}>
              {formatDate(safeDailyDate)} 
              {isCurrentDate && (
                <span className="hidden sm:inline-flex items-center text-[10px] uppercase tracking-wider font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full ml-1 shadow-sm">
                  Today
                </span>
              )}
            </div>
            
            <div className="flex items-center text-xs text-muted-foreground md:hidden gap-1 mt-0.5">
              <span>{isCalendarOpen ? "Hide Calendar" : "Tap to view calendar"}</span>
              {isCalendarOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleDateChange(1)}
            className="h-9 w-9 rounded-lg hover:bg-background/80 hover:scale-105 transition-transform"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className={cn(
          "w-full md:w-auto md:sticky md:top-24 flex-shrink-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
          isCalendarOpen ? "max-h-[500px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-4 md:max-h-[none] md:opacity-100 md:translate-y-0"
        )}>
          <div className="flex justify-center md:justify-start">
            <Card className="bg-card border-border shadow-md max-w-fit rounded-xl overflow-hidden">
              <CardHeader className="pb-3 hidden md:block bg-muted/30 border-b border-border/50">
                <CardTitle className="text-center text-foreground flex items-center justify-center gap-2 text-base font-medium">
                  <CalendarIcon className="w-4 h-4 text-primary" /> Select Date
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 md:pt-4">
                <CalendarComponent
                  mode="single"
                  selected={safeDailyDate}
                  onSelect={(d) => {
                    if (d) {
                      setDailyDate(d);
                      setIsCalendarOpen(false); 
                    }
                  }}
                  modifiers={{
                    hasActivity: (date) => subjects.some((s) => getClassesFor(s.name, date).length > 0),
                    selected: (date) => date.toDateString() === safeDailyDate.toDateString(),
                    today: (date) => isToday(date)
                  }}
                  modifiersStyles={{
                    hasActivity: {
                      backgroundColor: "hsl(var(--primary) / 0.15)",
                      border: "2px solid hsl(var(--primary) / 0.4)",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      color: "hsl(var(--primary))"
                    },
                    today: {
                      color: "rgb(245 158 11)",
                      fontWeight: "900",
                      textDecoration: "underline"
                    },
                    selected: {
                        backgroundColor: "hsl(var(--primary))",
                        color: "hsl(var(--primary-foreground))",
                        borderRadius: "8px",
                    }
                  }}
                  className="bg-card text-card-foreground rounded-md border-0 p-0"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex-1 w-full min-w-0">
          <div className="min-h-[400px] space-y-6">
            {subjects.length === 0 ? (
              <Empty description="No subjects found." />
            ) : (
              <div className="space-y-4">
                {subjects.flatMap((subj) => {
                  const lectures = getClassesFor(subj.name, safeDailyDate);
                  if (lectures.length === 0) return [];
                  
                  return (
                    <Card key={subj.name} className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30 group">
                      <CardHeader className="py-3 px-4 bg-muted/20 border-b border-border/60 group-hover:bg-muted/40 transition-colors">
                        <CardTitle className="text-foreground flex items-center gap-3 text-sm md:text-base font-semibold">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                          </span>
                          {subj.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                          {lectures.map((cls, i) => (
                            <div key={i} className="flex items-center justify-between p-3 md:p-4 hover:bg-accent/10 transition-colors">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={cn(
                                  "px-2.5 py-1 text-xs font-bold border-0 shadow-sm",
                                  cls.present === "Present" 
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20" 
                                    : "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-inset ring-red-500/20"
                                )}>
                                  {cls.present}
                                </Badge>
                                <span className="text-sm text-foreground/80 font-medium tracking-tight">{cls.classtype}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/40 px-2 py-1 rounded-md border border-border/30">
                                <Clock className="w-3 h-3" />
                                {cls.datetime.split(" ").slice(1).join(" ").slice(1, -1)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {subjects.every(s => getClassesFor(s.name, safeDailyDate).length === 0) && (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-gradient-to-b from-accent/5 to-transparent rounded-2xl border border-dashed border-border/60">
                    <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                      <CalendarIcon className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-lg font-medium text-foreground">No classes scheduled</p>
                    <p className="text-sm text-muted-foreground mt-1">Enjoy your free time!</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-4 shadow-sm flex gap-4 items-start md:items-center animate-in slide-in-from-bottom-4 duration-700">
              <div className="p-2 bg-amber-500/10 rounded-full flex-shrink-0">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  Daily Attendance Update
                </p>
                <p className="text-xs md:text-sm text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                  Attendance marked for today typically reflects on the portal by <strong>tomorrow morning</strong>. 
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDaily;