import { useState } from "react";
import PropTypes from 'prop-types';
import CircleProgress from "./CircleProgress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
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
}) => {
  const { name, attendance, combined, lecture, tutorial, practical, classesNeeded, classesCanMiss } = subject;
  
  const parsedCombined = parseFloat(combined);
  const rawPercentage = attendance.total > 0
    ? (isFinite(parsedCombined) ? parsedCombined : (attendance.attended / attendance.total) * 100)
    : 100;
  const displayedNumber = Math.round(rawPercentage * 10) / 10;
  const attendancePercentage = Number(displayedNumber);
  const displayName = name.replace(/\s*\([^)]*\)\s*$/, '');

  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const handleClick = async () => {
    setSelectedSubject(subject);
    
    if (!subjectAttendanceData[subject.name]) {
      setIsLoading(true);
      await fetchSubjectAttendance(subject);
      setIsLoading(false);
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
      <div
        className="flex justify-between items-center py-3 cursor-pointer hover:bg-[#0B0B0D] dark:border-gray-300 dark:hover:bg-gray-200/50 rounded-lg px-4 transition-colors duration-200 ease-in-out border border-gray-800"
        onClick={handleClick}
      >
        <div className="flex-1 mr-4">
          <h2 className="text-sm max-[390px]:text-xs font-semibold dark:text-black">{displayName}</h2>
          {lecture !== '' && <p className="text-sm max-[390px]:text-xs dark:text-black">Lecture: {lecture}%</p>}
          {tutorial !== '' && <p className="text-sm max-[390px]:text-xs dark:text-black">Tutorial: {tutorial}%</p>}
          {practical !== '' && <p className="text-sm max-[390px]:text-xs dark:text-black">Practical: {practical}%</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-center">
            <div className="text-sm max-[390px]:text-xs dark:text-black">{attendance.attended}</div>
            <div className="h-px w-full bg-gray-700 dark:bg-gray-300"></div>
            <div className="text-sm max-[390px]:text-xs dark:text-black">{attendance.total}</div>
          </div>
          <div className="flex flex-col items-center">
            <CircleProgress percentage={attendancePercentage} label={`${Math.round(attendancePercentage)}`} />
            {classesNeeded > 0 ? (
              <div className="text-xs mt-1 text-gray-400 dark:text-gray-600">
                Attend {classesNeeded}
              </div>
            ) : classesCanMiss > 0 && (
              <div className="text-xs mt-1 text-gray-400 dark:text-gray-600">
                Can miss {classesCanMiss}
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet open={selectedSubject?.name === subject.name} onOpenChange={() => {
        setSelectedSubject(null);
        setSelectedDate(null);
      }}>
  <SheetContent side="bottom" className="h-[80vh] md:h-[600px] bg-[black] text-white border-0 overflow-hidden flex flex-col dark:bg-white dark:text-black">
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
                  selected: (date) => date === selectedDate,
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
                selected={selectedDate}
                onSelect={(date) => setSelectedDate(date)}
                className={`pb-2 text-white dark:text-black ${isLoading ? 'animate-pulse' : ''} w-full flex-shrink-0 max-w-full`}
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

              {selectedDate && (
                <div className="mt-4 space-y-2 w-full pb-4 flex-shrink-0">
                  {getClassesForDate(selectedDate).map((classData, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        classData.present === "Present"
                          ? "bg-green-600/40 dark:bg-green-200/40"
                          : "bg-red-600/40 dark:bg-red-200/40"
                      }`}
                    >
                      <p className="text-sm max-[390px]:text-xs dark:text-black">
                        {classData.attendanceby}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-600">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" className="dark:stroke-gray-300" />
                  <XAxis
                    dataKey="date"
                    stroke="currentColor"
                    tick={{ fill: 'currentColor', fontSize: '0.75rem', dy: 10 }}
                    className="text-white dark:text-black"
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
                    className="text-white dark:text-black"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ddd',
                      color: '#000',
                      borderRadius: '4px',
                    }}
                    labelStyle={{
                      color: '#000',
                    }}
                    itemStyle={{
                      color: '#000',
                    }}
                    wrapperClassName="dark:[&_.recharts-tooltip-wrapper]:bg-black dark:[&_.recharts-tooltip-wrapper]:text-white dark:[&_.recharts-tooltip-wrapper]:border-gray-600"
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
