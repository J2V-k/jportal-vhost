import { useState, useEffect, useCallback } from "react";
import PropTypes from 'prop-types';
import CircleProgress from "./CircleProgress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AttendanceCard = ({
  subject,
  selectedSubject,
  setSelectedSubject,
  subjectAttendanceData,
  fetchSubjectAttendance,
  attendanceGoal,
}) => {
  const { name, attendance, combined, lecture, tutorial, practical, classesNeeded, classesCanMiss, target, isNewFormat } = subject;
  const effTarget = typeof attendanceGoal === 'number' ? attendanceGoal : (typeof target === 'number' ? target : 75);

  const [loading, setLoading] = useState(false);
  const [selDate, setSelDate] = useState(null);
  const [attn, setAttn] = useState(attendance);
  const [needClass, setNeedClass] = useState(classesNeeded);
  const [missClass, setMissClass] = useState(classesCanMiss);

  const comb = parseFloat(combined);
  const rawPct = attn.total > 0
    ? (isFinite(comb) ? comb : (attn.attended / attn.total) * 100)
    : (isFinite(comb) ? comb : 100);
  const num = Math.round(rawPct * 10) / 10;
  const pct = Number(num);
  const dName = name.replace(/\s*\([^)]*\)\s*$/, '');

  const calcFromDaily = useCallback((data) => {
    if (!Array.isArray(data)) return;
    
    let att = 0;
    let tot = 0;
    
    data.forEach((entry) => {
      tot++;
      if (entry.present === "Present") {
        att++;
      }
    });

    setAttn(prev => {
      if (prev.attended === att && prev.total === tot) return prev;
      return { attended: att, total: tot };
    });
    
    if (tot > 0 && attendanceGoal) {
      const need = Math.ceil((attendanceGoal * tot - 100 * att) / (100 - attendanceGoal));
      const miss = Math.floor((100 * att - attendanceGoal * tot) / attendanceGoal);
      
      setNeedClass(prev => {
        const newVal = need > 0 ? need : 0;
        return prev === newVal ? prev : newVal;
      });
      setMissClass(prev => {
        const newVal = miss > 0 ? miss : 0;
        return prev === newVal ? prev : newVal;
      });
    }
  }, [attendanceGoal]);

  // FIX: Removed the 'else { fetchSubjectAttendance(subject) }' block.
  // This prevents the "thundering herd" of API calls on mount.
  useEffect(() => {
    if (isNewFormat) {
      if (subjectAttendanceData[subject.name]) {
        calcFromDaily(subjectAttendanceData[subject.name]);
      }
    }
  }, [isNewFormat, subject.name, subjectAttendanceData, calcFromDaily]);

  const handleClick = async () => {
    setSelectedSubject(subject);

    if (!subjectAttendanceData[subject.name]) {
      setLoading(true);
      await fetchSubjectAttendance(subject);
      setLoading(false);
    }
    
    if (isNewFormat && subjectAttendanceData[subject.name]) {
       calcFromDaily(subjectAttendanceData[subject.name]);
    }
  };

  const getDayStatus = (date) => {
    if (!subjectAttendanceData[subject.name]) return null;

    const dateStr = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const attendances = subjectAttendanceData[subject.name].filter(
      a => a.datetime.startsWith(dateStr)
    );

    if (attendances.length === 0) return null;
    return attendances.map(a => a.present === "Present");
  };

  const getClassesForDate = (dateStr) => {
    if (!subjectAttendanceData[subject.name] || !dateStr) return [];

    const date = new Date(dateStr);
    const formattedDateStr = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return subjectAttendanceData[subject.name].filter(
      a => a.datetime.startsWith(formattedDateStr)
    );
  };

  const processAttendanceData = () => {
    if (!subjectAttendanceData[subject.name]) return [];

    const data = subjectAttendanceData[subject.name];

    const sortedData = [...data].sort((a, b) => {
      const [aDay, aMonth, aYear] = a.datetime.split(' ')[0].split('/');
      const [bDay, bMonth, bYear] = b.datetime.split(' ')[0].split('/');
      return new Date(aYear, aMonth - 1, aDay) - new Date(bYear, bMonth - 1, bDay);
    });

    let cumulativePresent = 0;
    let cumulativeTotal = 0;
    const attendanceByDate = {};

    sortedData.forEach(entry => {
      const [date] = entry.datetime.split(' ');
      cumulativeTotal++;
      if (entry.present === "Present") {
        cumulativePresent++;
      }

      attendanceByDate[date] = {
        date,
        percentage: (cumulativePresent / cumulativeTotal) * 100
      };
    });

    return Object.values(attendanceByDate);
  };

  return (
    <>
      <Card className="cursor-pointer bg-card hover:bg-accent/50 transition-colors duration-200 border-border">
        <CardContent className="p-4" onClick={handleClick}>
          <div className="flex justify-between items-center">
            <div className="flex-1 mr-4">
              <h2 className="text-sm max-[390px]:text-xs font-semibold text-foreground">{dName}</h2>
              {lecture !== '' && <p className="text-sm max-[390px]:text-xs text-foreground">Lecture: {lecture}%</p>}
              {tutorial !== '' && <p className="text-sm max-[390px]:text-xs text-foreground">Tutorial: {tutorial}%</p>}
              {practical !== '' && <p className="text-sm max-[390px]:text-xs text-foreground">Practical: {practical}%</p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-center">
                <div className="text-sm max-[390px]:text-xs text-foreground">
                  {attn.attended ?? '-'}
                </div>
                <div className="h-px w-full bg-border"></div>
                <div className="text-sm max-[390px]:text-xs text-foreground">
                  {attn.total ?? '-'}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <CircleProgress percentage={pct} label={`${Math.round(pct)}`} target={effTarget} />
                {needClass > 0 ? (
                  <div className="text-xs mt-1 text-muted-foreground">
                    Attend {needClass}
                  </div>
                ) : missClass > 0 && (
                  <div className="text-xs mt-1 text-muted-foreground">
                    Can miss {missClass}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={selectedSubject?.name === subject.name} onOpenChange={() => {
        setSelectedSubject(null);
        setSelDate(null);
      }}>
        <SheetContent side="bottom" className="h-[80vh] md:h-[600px] bg-background text-foreground border-0 overflow-hidden flex flex-col">
          <SheetHeader>
          </SheetHeader>
          <div className="py-4 flex flex-1 overflow-y-auto">
            <div className="flex flex-col md:flex-row w-full max-w-[1100px] mx-auto gap-8 px-4">
              <div className="w-full md:w-[340px] flex flex-col">
                <Calendar
                  mode="single"
                  modifiers={{
                    presentSingle: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 1 && statuses[0] === true;
                    },
                    absentSingle: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 1 && statuses[0] === false;
                    },
                    presentDouble: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 2 && statuses.every(s => s === true);
                    },
                    absentDouble: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 2 && statuses.every(s => s === false);
                    },
                    mixedDouble: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 2 && statuses[0] !== statuses[1];
                    },
                    presentTriple: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 3 && statuses.every(s => s === true);
                    },
                    absentTriple: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 3 && statuses.every(s => s === false);
                    },
                    mixedTripleAllPresent: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 3 && statuses.filter(s => s === true).length === 2;
                    },
                    mixedTripleAllAbsent: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 3 && statuses.filter(s => s === false).length === 2;
                    },
                    mixedTripleEqual: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 3 &&
                        statuses.filter(s => s === true).length ===
                        statuses.filter(s => s === false).length;
                    },
                    selected: (date) => date === selDate,
                  }}
                  modifiersStyles={{
                    presentSingle: {
                      backgroundColor: 'rgba(22, 163, 72, 0.4)',
                      borderRadius: '50%'
                    },
                    absentSingle: {
                      backgroundColor: 'rgba(220, 38, 38, 0.4)',
                      borderRadius: '50%'
                    },
                    presentDouble: {
                      backgroundColor: 'rgba(22, 163, 72, 0.4)',
                      borderRadius: '50%'
                    },
                    absentDouble: {
                      backgroundColor: 'rgba(220, 38, 38, 0.4)',
                      borderRadius: '50%'
                    },
                    mixedDouble: {
                      background: 'linear-gradient(90deg, rgba(22, 163, 72, 0.4) 50%, rgba(220, 38, 38, 0.4) 50%)',
                      borderRadius: '50%'
                    },
                    presentTriple: {
                      backgroundColor: 'rgba(22, 163, 72, 0.4)',
                      borderRadius: '50%'
                    },
                    absentTriple: {
                      backgroundColor: 'rgba(220, 38, 38, 0.4)',
                      borderRadius: '50%'
                    },
                    mixedTripleAllPresent: {
                      background: 'conic-gradient(rgba(22, 163, 72, 0.4) 0deg 240deg, rgba(220, 38, 38, 0.4) 240deg 360deg)',
                      borderRadius: '50%'
                    },
                    mixedTripleAllAbsent: {
                      background: 'conic-gradient(rgba(220, 38, 38, 0.4) 0deg 240deg, rgba(22, 163, 72, 0.4) 240deg 360deg)',
                      borderRadius: '50%'
                    },
                    mixedTripleEqual: {
                      background: 'conic-gradient(rgba(22, 163, 72, 0.4) 0deg 120deg, rgba(220, 38, 38, 0.4) 120deg 240deg, rgba(22, 163, 72, 0.4) 240deg 360deg)',
                      borderRadius: '50%'
                    },
                  }}
                  selected={selDate}
                  onSelect={(date) => setSelDate(date)}
                  className={`pb-2 text-foreground ${loading ? 'animate-pulse' : ''} w-full flex-shrink-0 max-w-full`}
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4 w-full",
                    caption: "flex justify-center pt-1 relative items-center text-sm max-[390px]:text-xs",
                    caption_label: "text-sm max-[390px]:text-xs font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-gray-500 rounded-md flex-1 font-normal text-[0.8rem] max-[390px]:text-[0.7rem]",
                    row: "flex w-full mt-2",
                    cell: "flex-1 text-center text-sm max-[390px]:text-xs p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 mx-auto max-[390px]:h-6 max-[390px]:w-6 max-[390px]:text-xs",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                />

                {selDate && (
                  <div className="mt-4 space-y-2 w-full pb-4 flex-shrink-0">
                    {getClassesForDate(selDate).map((classData, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded ${classData.present === "Present"
                            ? "bg-green-600/40 dark:bg-green-200/40"
                            : "bg-red-600/40 dark:bg-red-200/40"
                          }`}
                      >
                        <p className="text-sm max-[390px]:text-xs text-foreground">
                          {classData.attendanceby}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {classData.classtype} - {classData.present}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-600">
                          {classData.datetime}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 h-[320px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={processAttendanceData()}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" className="stroke-muted-foreground/30" />
                    <XAxis
                      dataKey="date"
                      stroke="currentColor"
                      tick={{ fill: 'currentColor', fontSize: '0.75rem', dy: 10 }}
                      className="text-foreground"
                      tickFormatter={(value) => {
                        const [day, month] = value.split('/');
                        return `${day}/${month}`;
                      }}
                    />
                    <YAxis
                      stroke="currentColor"
                      tick={{ fill: 'currentColor', fontSize: '0.75rem' }}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      width={65}
                      className="text-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--card-foreground))',
                        borderRadius: '4px',
                      }}
                      labelStyle={{
                        color: 'hsl(var(--card-foreground))',
                      }}
                      itemStyle={{
                        color: 'hsl(var(--card-foreground))',
                      }}
                      wrapperClassName="outline-none"
                      formatter={(value) => [`${Number(value).toFixed(1)}%`]}
                    />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Present"
                      className="dark:stroke-blue-500"
                    />
                  </LineChart>
                </ResponsiveContainer>

              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AttendanceCard;

AttendanceCard.propTypes = {
  subject: PropTypes.shape({
    name: PropTypes.string.isRequired,
    attendance: PropTypes.shape({
      attended: PropTypes.number.isRequired,
      total: PropTypes.number.isRequired,
    }).isRequired,
    combined: PropTypes.number.isRequired,
    lecture: PropTypes.string,
    tutorial: PropTypes.string,
    practical: PropTypes.string,
    classesNeeded: PropTypes.number,
    classesCanMiss: PropTypes.number,
  }).isRequired,
  selectedSubject: PropTypes.object,
  setSelectedSubject: PropTypes.func.isRequired,
  subjectAttendanceData: PropTypes.object.isRequired,
  fetchSubjectAttendance: PropTypes.func.isRequired,
};