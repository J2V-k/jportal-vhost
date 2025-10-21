import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, Clock, BookOpen, GraduationCap, Users, Award, Target, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AcademicCalendar = () => {
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const navigate = useNavigate();
  const todayEventRef = useRef(null);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    const fetchCalendarData = async () => {
      const response = await fetch('/AC.json');
      const data = await response.json();
      setCalendarData(data);
      setLoading(false);
    };

    fetchCalendarData();
  }, []);

  const isEventToday = (event) => {
    const today = new Date();
    const eventStartDate = new Date(event.startDate);
    const eventEndDate = event.endDate ? new Date(event.endDate) : null;

    const todayStr = today.toDateString();
    const startDateStr = eventStartDate.toDateString();
    const endDateStr = eventEndDate ? eventEndDate.toDateString() : null;

    // Event is today if it starts today, ends today, or spans across today
    const startsToday = startDateStr === todayStr;
    const endsToday = endDateStr === todayStr;
    const spansToday = eventEndDate && today >= eventStartDate && today <= eventEndDate;

    return startsToday || endsToday || spansToday;
  };

  const isEventUpcoming = (event) => {
    const today = new Date();
    const eventDate = new Date(event.startDate);
    return eventDate > today;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('registration') || categoryLower.includes('reporting'))
      return <Users className="w-4 h-4" />;
    else if (categoryLower.includes('orientation') || categoryLower.includes('commencement'))
      return <BookOpen className="w-4 h-4" />;
    else if (categoryLower.includes('examination') || categoryLower.includes('exam'))
      return <Award className="w-4 h-4" />;
    else if (categoryLower.includes('holiday') || categoryLower.includes('vacation'))
      return <Calendar className="w-4 h-4" />;
    else
      return <GraduationCap className="w-4 h-4" />;
  };

  const getCategoryColor = (category) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('registration') || categoryLower.includes('reporting'))
      return 'bg-blue-700 border-blue-600 text-white';
    else if (categoryLower.includes('orientation') || categoryLower.includes('commencement'))
      return 'bg-emerald-700 border-emerald-600 text-white';
    else if (categoryLower.includes('examination') || categoryLower.includes('exam') || categoryLower.includes('result'))
      return 'bg-red-700 border-red-600 text-white';
    else if (categoryLower.includes('holiday') || categoryLower.includes('vacation'))
      return 'bg-violet-700 border-violet-600 text-white';
    else if (categoryLower.includes('phd') || categoryLower.includes('ph.d'))
      return 'bg-indigo-800 border-indigo-700 text-white';
    else if (categoryLower.includes('attendance') || categoryLower.includes('review'))
      return 'bg-amber-600 border-amber-500 text-black';
    else if (categoryLower.includes('lab') || categoryLower.includes('project'))
      return 'bg-teal-700 border-teal-600 text-white';
    else if (categoryLower.includes('training') || categoryLower.includes('viva'))
      return 'bg-orange-700 border-orange-600 text-white';
    else
      return 'bg-rose-700 border-rose-600 text-white';
  };

  const allEvents = calendarData?.timelineEvents || [];

  // Get unique semesters and categories for filters
  const getUniqueSemesters = () => {
    const semesters = [...new Set(allEvents.map(event => event.semester))];
    return semesters.sort();
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(allEvents.map(event => event.category))];
    return categories.sort();
  };

  // Filter events based on selected filters
  const getFilteredEvents = () => {
    return allEvents.filter(event => {
      const semesterMatch = selectedSemesters.length === 0 || selectedSemesters.includes(event.semester);
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(event.category);
      return semesterMatch && categoryMatch;
    });
  };

  const filteredEvents = getFilteredEvents();

  // Find the first event that occurs today in filtered events, or the next upcoming event
  const firstTodayEventIndex = filteredEvents.findIndex(event => isEventToday(event));
  const nextUpcomingEventIndex = filteredEvents.findIndex(event => isEventUpcoming(event));
  const targetEventIndex = firstTodayEventIndex !== -1 ? firstTodayEventIndex : nextUpcomingEventIndex;

  // Auto-scroll to today's event when data loads - REMOVED as per user request

  const scrollToCurrentEvent = () => {
    const element = document.getElementById('today');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black dark:bg-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-white dark:text-black" />
          <p className="text-white dark:text-black">Loading Academic Calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black dark:bg-white text-white dark:text-black">
      {/* Header - Hidden on Desktop */}
      <div className="sticky top-0 bg-black dark:bg-white border-b border-gray-800 dark:border-gray-200 z-10 md:hidden">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-200 dark:to-gray-300 hover:from-gray-700 hover:to-gray-600 dark:hover:from-gray-300 dark:hover:to-gray-400 text-white dark:text-black rounded-lg border border-gray-600 dark:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-900/50 dark:bg-gray-100/50 rounded-lg border border-gray-700 dark:border-gray-300">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-400 dark:text-gray-600" />
            <h2 className="text-lg font-semibold">Filters</h2>
            {(selectedSemesters.length > 0 || selectedCategories.length > 0) && (
              <button
                onClick={() => {
                  setSelectedSemesters([]);
                  setSelectedCategories([]);
                }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white dark:hover:text-black transition-colors"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 max-h-16 overflow-y-auto">
              <button
                key="all"
                onClick={() => {
                  setSelectedSemesters([]);
                  setSelectedCategories([]);
                }}
                className={`px-3 py-1 rounded-full text-sm transition-colors border ${
                  selectedSemesters.length === 0 && selectedCategories.length === 0
                    ? 'bg-gray-700 dark:bg-gray-300 text-white dark:text-black border-gray-600 dark:border-gray-400'
                    : 'bg-gray-800/50 dark:bg-gray-200/50 text-gray-300 dark:text-gray-700 border-gray-600 dark:border-gray-400 hover:bg-gray-700/50 dark:hover:bg-gray-300/50'
                }`}
              >
                All
              </button>
              {getUniqueSemesters().map(semester => (
                <button
                  key={`sem-${semester}`}
                  onClick={() => {
                    setSelectedSemesters(prev => 
                      prev.includes(semester) 
                        ? prev.filter(s => s !== semester)
                        : [...prev, semester]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors border ${
                    selectedSemesters.includes(semester)
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-gray-800/50 dark:bg-gray-200/50 text-gray-300 dark:text-gray-700 border-gray-600 dark:border-gray-400 hover:bg-gray-700/50 dark:hover:bg-gray-300/50'
                  }`}
                >
                  {semester}
                </button>
              ))}
              {getUniqueCategories().map(category => (
                <button
                  key={`cat-${category}`}
                  onClick={() => {
                    setSelectedCategories(prev => 
                      prev.includes(category) 
                        ? prev.filter(c => c !== category)
                        : [...prev, category]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors border ${
                    selectedCategories.includes(category)
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-gray-800/50 dark:bg-gray-200/50 text-gray-300 dark:text-gray-700 border-gray-600 dark:border-gray-400 hover:bg-gray-700/50 dark:hover:bg-gray-300/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredEvents.map((event, index) => {
            const isTodayEvent = isEventToday(event);
            const isFirstTodayEvent = isTodayEvent && index === firstTodayEventIndex;
            const isTargetEvent = index === targetEventIndex;
            const isUpcoming = isEventUpcoming(event);
            
            return (
              <div
                key={index}
                id={(isTargetEvent || (targetEventIndex === -1 && index === 0)) ? 'today' : undefined}
                data-event-index={index}
                ref={isTargetEvent ? todayEventRef : null}
                style={isMobile ? { scrollMarginTop: '120px' } : {}}
                className={`border rounded-lg p-4 transition-all ${getCategoryColor(event.category)} ${isFirstTodayEvent ? 'ring-2 ring-yellow-400 dark:ring-yellow-500 shadow-lg' : ''}`}
              >
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(event.category)}
                          <h3 className="font-medium break-words">{event.category}</h3>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded bg-gray-700 text-gray-200 dark:bg-gray-300 dark:text-gray-800 flex-shrink-0">
                          {event.semester} Sem
                        </span>
                        <span className="text-xs font-medium px-2 py-1 rounded bg-gray-700 text-gray-200 dark:bg-gray-300 dark:text-gray-800 flex-shrink-0">
                          {event.type}
                        </span>
                        {isTodayEvent && (
                          <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-500 text-black flex-shrink-0">
                            TODAY
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatDate(event.startDate)}
                      {event.endDate && ` - ${formatDate(event.endDate)}`}
                    </div>
                  </div>
                  <p className="text-sm opacity-90">{event.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-400 dark:text-gray-500">
              {allEvents.length === 0 
                ? "No events found in academic calendar." 
                : "No events match the selected filters."
              }
            </p>
            {allEvents.length > 0 && filteredEvents.length === 0 && (
              <button
                onClick={() => {
                  setSelectedSemesters([]);
                  setSelectedCategories([]);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Go to Current Event Button */}
      <button
        onClick={scrollToCurrentEvent}
        disabled={filteredEvents.length === 0}
        className={`fixed bottom-24 md:bottom-6 right-6 w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group ${
          filteredEvents.length === 0
            ? 'bg-yellow-500/50 cursor-not-allowed opacity-50 border border-yellow-400'
            : 'bg-yellow-500 hover:bg-yellow-600 border border-yellow-400'
        }`}
        title={filteredEvents.length === 0 ? "No events available" : targetEventIndex !== -1 ? "Go to Current Event" : "Go to First Event"}
      >
        <Target className={`w-4 h-4 ${filteredEvents.length === 0 ? 'text-yellow-200' : 'text-white group-hover:scale-110 transition-transform duration-200'}`} />
      </button>
    </div>
  );
};

export default AcademicCalendar;