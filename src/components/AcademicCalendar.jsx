import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, Clock, BookOpen, GraduationCap, Users, Award, Target, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Empty } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

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
      try {
        const response = await fetch('https://raw.githubusercontent.com/J2V-k/data/main/AC.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setCalendarData(data);
      } catch (err) {
        console.error('Failed to load academic calendar:', err);
        setCalendarData({ timelineEvents: [] });
        setError('Unable to load academic calendar.');
      } finally {
        setLoading(false);
      }
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
      return 'bg-blue-700/80 border-blue-600 text-white dark:bg-blue-900/40 dark:border-blue-700';
    else if (categoryLower.includes('orientation') || categoryLower.includes('commencement'))
      return 'bg-emerald-700/80 border-emerald-600 text-white dark:bg-emerald-900/40 dark:border-emerald-700';
    else if (categoryLower.includes('examination') || categoryLower.includes('exam') || categoryLower.includes('result'))
      return 'bg-red-700/80 border-red-600 text-white dark:bg-red-900/40 dark:border-red-700';
    else if (categoryLower.includes('holiday') || categoryLower.includes('vacation'))
      return 'bg-violet-700/80 border-violet-600 text-white dark:bg-violet-900/40 dark:border-violet-700';
    else if (categoryLower.includes('phd') || categoryLower.includes('ph.d'))
      return 'bg-indigo-800/80 border-indigo-700 text-white dark:bg-indigo-900/40 dark:border-indigo-700';
    else if (categoryLower.includes('attendance') || categoryLower.includes('review'))
      return 'bg-amber-600/80 border-amber-500 text-white dark:bg-amber-900/40 dark:border-amber-700';
    else if (categoryLower.includes('lab') || categoryLower.includes('project'))
      return 'bg-teal-700/80 border-teal-600 text-white dark:bg-teal-900/40 dark:border-teal-700';
    else if (categoryLower.includes('training') || categoryLower.includes('viva'))
      return 'bg-orange-700/80 border-orange-600 text-white dark:bg-orange-900/40 dark:border-orange-700';
    else
      return 'bg-rose-700/80 border-rose-600 text-white dark:bg-rose-900/40 dark:border-rose-700';
  };

  const allEvents = calendarData?.timelineEvents || [];

  const getUniqueSemesters = () => {
    const semesters = [...new Set(allEvents.map(event => event.semester))];
    return semesters.sort();
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(allEvents.map(event => event.category))];
    return categories.sort();
  };

  const getFilteredEvents = () => {
    return allEvents.filter(event => {
      const semesterMatch = selectedSemesters.length === 0 || selectedSemesters.includes(event.semester);
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(event.category);
      return semesterMatch && categoryMatch;
    });
  };

  const filteredEvents = getFilteredEvents();

  const firstTodayEventIndex = filteredEvents.findIndex(event => isEventToday(event));
  const nextUpcomingEventIndex = filteredEvents.findIndex(event => isEventUpcoming(event));
  const targetEventIndex = firstTodayEventIndex !== -1 ? firstTodayEventIndex : nextUpcomingEventIndex;

  useEffect(() => {
    if (!loading && filteredEvents.length > 0) {
      setTimeout(() => {
        const element = document.getElementById('today');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  }, [loading, filteredEvents.length, targetEventIndex]);

  const scrollToCurrentEvent = () => {
    const element = document.getElementById('today');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="w-8 h-8 mx-auto rounded-full" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <div className="space-y-2 mt-8">
            <Skeleton className="h-4 w-64 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto" />
            <Skeleton className="h-4 w-60 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Academic Calendar - JP Portal | JIIT Student Portal</title>
        <meta name="description" content="View the academic calendar for Jaypee Institute of Information Technology (JIIT) with important dates, exam schedules, holidays, and semester events." />
        <meta name="keywords" content="academic calendar, exam schedule, holidays, semester events, JIIT calendar, JP Portal, JIIT, student portal, jportal, jpportal, jp_portal, jp portal" />
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="JP Portal" />
        <meta property="og:title" content="Academic Calendar - JP Portal | JIIT Student Portal" />
        <meta property="og:description" content="View the academic calendar for Jaypee Institute of Information Technology (JIIT) with important dates, exam schedules, holidays, and semester events." />
        <meta property="og:url" content="https://jportal2-0.vercel.app/#/academic-calendar" />
        <link rel="canonical" href="https://jportal2-0.vercel.app/#/academic-calendar" />
      </Helmet>
      <h1 className="sr-only">Academic Calendar</h1>
      <div className="min-h-screen bg-background text-foreground">
        <div className="w-full bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <div className="flex items-center gap-2 pr-4 border-r border-border shrink-0">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
                {(selectedSemesters.length > 0 || selectedCategories.length > 0) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedSemesters([]);
                      setSelectedCategories([]);
                    }}
                    className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    title="Clear All"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={selectedSemesters.length === 0 && selectedCategories.length === 0 ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setSelectedSemesters([]);
                    setSelectedCategories([]);
                  }}
                  className="rounded-full text-xs h-7 px-3"
                >
                  All
                </Button>
                {getUniqueSemesters().map(semester => (
                  <Badge
                    key={`sem-${semester}`}
                    variant={selectedSemesters.includes(semester) ? "default" : "outline"}
                    className="cursor-pointer transition-colors hover:bg-primary/20 bg-background text-foreground border border-border whitespace-nowrap"
                    onClick={() => {
                      setSelectedSemesters(prev =>
                        prev.includes(semester)
                          ? prev.filter(s => s !== semester)
                          : [...prev, semester]
                      );
                    }}
                  >
                    {semester}
                  </Badge>
                ))}
                <div className="w-px h-4 bg-border mx-2 shrink-0" />
                {getUniqueCategories().map(category => (
                  <Badge
                    key={`cat-${category}`}
                    variant={selectedCategories.includes(category) ? "default" : "outline"}
                    className="cursor-pointer transition-colors hover:bg-primary/20 bg-background text-foreground border border-border whitespace-nowrap"
                    onClick={() => {
                      setSelectedCategories(prev =>
                        prev.includes(category)
                          ? prev.filter(c => c !== category)
                          : [...prev, category]
                      );
                    }}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">

          <div className="space-y-4">
            {filteredEvents.map((event, index) => {
              const isTodayEvent = isEventToday(event);
              const isFirstTodayEvent = isTodayEvent && index === firstTodayEventIndex;
              const isTargetEvent = index === targetEventIndex;
              const isUpcoming = isEventUpcoming(event);

              return (
                <Card
                  key={index}
                  id={(isTargetEvent || (targetEventIndex === -1 && index === 0)) ? 'today' : undefined}
                  data-event-index={index}
                  ref={isTargetEvent ? todayEventRef : null}
                  style={isMobile ? { scrollMarginTop: '120px' } : {}}
                  role="article"
                  aria-labelledby={`event-title-${index}`}
                  className={`${getCategoryColor(event.category)} ${isFirstTodayEvent ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] border-amber-400' : ''} transition-all hover:shadow-md border`}
                >
                  <CardContent className="p-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white/80">{getCategoryIcon(event.category)}</span>
                              <h3 id={`event-title-${index}`} className="font-medium break-words text-white">{event.category}</h3>
                            </div>
                            <Badge variant="secondary" className="text-xs bg-black/20 text-white border-white/20 backdrop-blur-sm">
                              {event.semester} Sem
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-black/20 text-white border-white/20 backdrop-blur-sm">
                              {event.type}
                            </Badge>
                            {isTodayEvent && (
                              <Badge className="text-xs font-bold bg-white text-black hover:bg-white/90 border-none shadow-sm">
                                TODAY
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-white/90 whitespace-nowrap bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
                          {formatDate(event.startDate)}
                          {event.endDate && ` - ${formatDate(event.endDate)}`}
                        </div>
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed font-medium">{event.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Empty
                description={
                  allEvents.length === 0
                    ? "No events found in academic calendar."
                    : "No events match the selected filters."
                }
              />
              {allEvents.length > 0 && filteredEvents.length === 0 && (
                <Button
                  onClick={() => {
                    setSelectedSemesters([]);
                    setSelectedCategories([]);
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={scrollToCurrentEvent}
          disabled={filteredEvents.length === 0}
          size="icon"
          className={`fixed bottom-24 md:bottom-6 right-6 w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 ${filteredEvents.length === 0
            ? 'bg-muted cursor-not-allowed opacity-50 border border-border'
            : 'bg-primary hover:bg-primary/90 border border-primary text-primary-foreground'
            }`}
          title={filteredEvents.length === 0 ? "No events available" : targetEventIndex !== -1 ? "Go to Current Event" : "Go to First Event"}
        >
          <Target className={`w-4 h-4 ${filteredEvents.length === 0 ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
        </Button>
      </div >
    </>
  );
};

export default AcademicCalendar;