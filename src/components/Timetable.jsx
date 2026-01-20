import { useState, useEffect, useRef } from "react";
import { 
  Calendar as CalendarIcon, RefreshCw, 
  Trash2, X, Plus, Clock, Layers, Settings2, EyeOff, Palmtree, Edit3, PlusCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from 'react-helmet-async';
import { Button } from "./ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

const Timetable = ({ w, profileData, subjectData, subjectSemestersData }) => {
  const [loading, setLoading] = useState(true);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [variantNames, setVariantNames] = useState({});
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [localProfileData, setLocalProfileData] = useState(profileData || null);
  const [localSubjectData, setLocalSubjectData] = useState(subjectData || {});
  const [localSemestersData, setLocalSemestersData] = useState(subjectSemestersData || null);
  const fileInputRef = useRef(null);
  const todayRef = useRef(null);
  const [icalEvents, setIcalEvents] = useState([]);
  
  const currentDayIndex = new Date().getDay();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEventIndex, setEditingEventIndex] = useState(null);
  const [formData, setFormData] = useState({ summary: "", location: "", day: "1", startTime: "09:00", endTime: "10:00" });

  const formatSubjectDisplay = (summary) => {
    if (!summary) return { name: "Unknown", type: null };
    const cleanStr = summary.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    const typeMap = {
      'L -': { label: 'Lecture', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      'T -': { label: 'Tutorial', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
      'P -': { label: 'Practical', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
    };
    const prefix = cleanStr.substring(0, 3);
    if (typeMap[prefix]) {
      return { name: cleanStr.substring(3).trim(), type: typeMap[prefix] };
    }
    return { name: cleanStr, type: null };
  };

  const generateVariants = (subjectCode) => {
    if (!subjectCode) return [];
    const full = String(subjectCode).trim().toUpperCase();
    const variants = new Set();
    const matches = full.match(/[A-Z]+\d+/g);
    if (matches) matches.forEach(m => variants.add(m));
    if (full.length >= 5) variants.add(full.slice(-5));
    if (full.length >= 6) variants.add(full.slice(-6));
    return Array.from(variants).filter(v => v && v.length >= 4 && /^[A-Z]/.test(v));
  };

  useEffect(() => {
    if (selectedSemesterId) {
      updateShortCodes(selectedSemesterId);
    }
  }, [selectedSemesterId]);

  const updateShortCodes = async (semId) => {
    setLoading(true);
    let data = localSubjectData[semId];
    
    if (!data && w?.get_registered_subjects_and_faculties) {
      try {
        data = await w.get_registered_subjects_and_faculties({ registration_id: semId });
        setLocalSubjectData(prev => ({ ...prev, [semId]: data }));
      } catch (e) {
        console.error("Failed to fetch subjects", e);
      }
    }

    const shortCodesArr = [];
    const longCodesArr = [];
    const names = {};

    if (data?.subjects) {
      data.subjects.forEach(s => {
        const subjectFullName = s.subjectdesc || s.subject_desc || s.subject_name || s.subjectname;
        const rawCode = s.subject_code || s.subjectcode;
        
        const variants = generateVariants(rawCode);
        variants.forEach(v => {
          shortCodesArr.push(v);
          if (!names[v]) names[v] = subjectFullName;
        });

        if (rawCode) {
          const longCode = String(rawCode).trim().toUpperCase();
          longCodesArr.push(longCode);
          if (!names[longCode]) names[longCode] = subjectFullName;
        }
      });
    }

    const uniqueShort = Array.from(new Set(shortCodesArr.filter(v => v && v.length >= 4)));
    const uniqueLong = Array.from(new Set(longCodesArr)).filter(l => !uniqueShort.includes(l));
    const combined = [...uniqueShort, ...uniqueLong];

    setSelectedVariants(combined);
    setVariantNames(names);
    setLoading(false);
  };

  useEffect(() => {
    const initTimetable = async () => {
      setLoading(true);
      const savedEvents = localStorage.getItem('timetable_modified_events');
      if (savedEvents) {
        setIcalEvents(JSON.parse(savedEvents).map(ev => ({ 
          ...ev, 
          start: new Date(ev.start),
          end: ev.end ? new Date(ev.end) : new Date(new Date(ev.start).getTime() + 60 * 60 * 1000)
        })));
        setShowCustomizer(false);
      } else {
        const savedIcs = localStorage.getItem('timetable_ics');
        if (savedIcs) {
          setIcalEvents(parseIcs(savedIcs));
          setShowCustomizer(false);
        } else {
          setShowCustomizer(true);
        }
      }

      let currentSems = localSemestersData;
      if (!currentSems?.semesters?.length && w?.get_registered_semesters) {
        try {
          const registered = await w.get_registered_semesters();
          if (registered?.length) {
            currentSems = { semesters: registered, latest_semester: registered[0] };
            setLocalSemestersData(currentSems);
          }
        } catch (e) {}
      }

      if (currentSems?.semesters?.length && !selectedSemesterId) {
        const currentYear = new Date().getFullYear().toString();
        const currentYearSemester = currentSems.semesters.find(sem =>
          sem.registration_code && sem.registration_code.includes(currentYear)
        );
        setSelectedSemesterId(currentYearSemester?.registration_id || currentSems.semesters[0].registration_id);
      }
      setLoading(false);
    };
    initTimetable();
  }, [w]);

  const handleFile = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      localStorage.setItem('timetable_ics', text);
      const parsed = parseIcs(text);
      setIcalEvents(parsed);
      localStorage.setItem('timetable_modified_events', JSON.stringify(parsed));
      setShowCustomizer(false);
    } catch (err) { console.error(err); }
  };

  const saveClass = () => {
    const today = new Date();
    const targetDay = parseInt(formData.day);
    const diff = targetDay - today.getDay();
    const eventDate = new Date(today.setDate(today.getDate() + diff));
    const [sH, sM] = formData.startTime.split(':');
    const [eH, eM] = formData.endTime.split(':');
    const start = new Date(eventDate.setHours(sH, sM, 0));
    const end = new Date(new Date(eventDate).setHours(eH, eM, 0));

    const updatedEvent = { summary: formData.summary, location: formData.location, start, end };
    let updatedEvents = [...icalEvents];
    if (editingEventIndex !== null) updatedEvents[editingEventIndex] = updatedEvent;
    else updatedEvents.push(updatedEvent);

    updatedEvents.sort((a, b) => a.start - b.start);
    setIcalEvents(updatedEvents);
    localStorage.setItem('timetable_modified_events', JSON.stringify(updatedEvents));
    setIsDialogOpen(false);
  };

  function parseIcs(text) {
    if (!text) return [];
    const unfolded = text.replace(/\r?\n[ \t]/g, '');
    const parts = unfolded.split(/BEGIN:VEVENT/).slice(1);
    const out = [];
    parts.forEach(p => {
      const body = p.split(/END:VEVENT/)[0];
      const ev = {};
      body.split(/\r?\n/).forEach(line => {
        const [key, ...val] = line.split(':');
        if (key?.startsWith('DTSTART')) ev.dtstart = val.join(':');
        if (key?.startsWith('DTEND')) ev.dtend = val.join(':');
        if (key === 'SUMMARY') ev.summary = val.join(':');
        if (key === 'LOCATION') ev.location = val.join(':');
      });
      const parseDate = (s) => {
        const m = s?.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
        return m ? new Date(m[1], m[2]-1, m[3], m[4], m[5]) : null;
      };
      const start = parseDate(ev.dtstart);
      const end = parseDate(ev.dtend) || (start ? new Date(start.getTime() + 60*60*1000) : null);
      if (start) out.push({ start, end, summary: ev.summary, location: ev.location || "N/A" });
    });
    return out.sort((a, b) => a.start - b.start);
  }

  const handleLaunchExternal = async () => {
    setLoading(true);
    let profile = localProfileData;
    if (!profile && w?.get_personal_info) profile = await w.get_personal_info().catch(() => null);
    const profileInfo = profile?.generalinformation || {};
    let campus = (profileInfo.programcode?.includes("128") || profileInfo.registrationno?.toString().startsWith("99")) ? "128" : "62";
    let year = "1";
    const semMatch = String(profileInfo.semester || "").match(/(\d+)/);
    if (semMatch) year = Math.ceil(parseInt(semMatch[1]) / 2).toString();
    const batch = profileInfo.batch || "2026";

    const selectedSubjectsStr = selectedVariants.length ? selectedVariants.join(',') : '';
    const params = new URLSearchParams({ campus, year, batch, selectedSubjects: selectedSubjectsStr, isGenerating: "true" });
    window.open(`https://simple-timetable.tashif.codes/?${params.toString()}`, '_blank');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Helmet><title>Timetable | JP Portal</title></Helmet>

      <AnimatePresence>
        {isDialogOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card w-full max-w-md rounded-lg border border-border p-6 shadow-2xl relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{editingEventIndex !== null ? "Edit Class" : "Add Class"}</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)}><X /></Button>
              </div>
              <div className="space-y-4">
                <Input placeholder="Subject" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
                <Input placeholder="Room" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                <Select value={formData.day} onValueChange={v => setFormData({...formData, day: v})}>
                  <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                  <SelectContent className="z-[200]">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                      <SelectItem key={d} value={String(i+1)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                  <Input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                </div>
                <Button className="w-full" onClick={saveClass}>Save</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCustomizer(!showCustomizer)}>
              {showCustomizer ? <EyeOff className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
              <span className="ml-2 xs:inline">Automated Parser</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <CalendarIcon className="w-4 h-4" /> <span className="xs:inline ml-2">Import ICS file</span>
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" accept=".ics" onChange={(e) => handleFile(e.target.files[0])} />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <AnimatePresence initial={false}>
          {showCustomizer && (
            <motion.section 
              key="customizer"
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: "auto", opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="shadow-sm border-border/50 rounded-lg">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4" /> Select Semester</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={selectedSemesterId || ""} onValueChange={setSelectedSemesterId}>
                      <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
                      <SelectContent className="z-40">
                        {localSemestersData?.semesters?.map(s => (
                          <SelectItem key={s.registration_id} value={s.registration_id}>{s.registration_code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="secondary" className="w-full gap-2" onClick={handleLaunchExternal} disabled={!selectedSemesterId}>
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Generate Timetable
                    </Button>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2 shadow-sm border-border/50 rounded-lg">
                  <CardHeader className="pb-3 flex justify-between">
                    <CardTitle className="text-sm font-bold">Subject Codes</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => {
                      const v = prompt('Code:'); if(v) { setSelectedVariants(prev => [...prev, v.toUpperCase()]); setVariantNames(p => ({...p, [v.toUpperCase()]: v})); }
                    }}><Plus className="w-4 h-4" /> Manual</Button>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {selectedVariants.map((v, i) => (
                      <div key={v} className="flex items-center bg-muted/40 rounded-lg border border-border overflow-hidden">
                        <div className="px-3 py-1 bg-primary/10 border-r border-border text-[11px] font-bold text-primary">{v}</div>
                        <div className="px-3 py-1 text-[10px] text-muted-foreground truncate max-w-[150px]">{variantNames[v] || v}</div>
                        <button onClick={() => setSelectedVariants(prev => prev.filter((_, idx) => idx !== i))} className="px-2 hover:bg-destructive/10 text-muted-foreground transition-colors"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" /> Weekly Schedule</h2>
            <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}><PlusCircle className="w-4 h-4 mr-2" /> Add</Button>
               {icalEvents.length > 0 && <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem('timetable_modified_events'); setIcalEvents([]); }} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
              const di = index + 1;
              const dayEvents = icalEvents.filter(ev => ev.start.getDay() === di);
              const isToday = currentDayIndex === di;
              return (
                <div key={day} ref={isToday ? todayRef : null} className={`flex flex-col gap-3 p-1 rounded-lg ${isToday ? 'bg-amber-500/5 ring-2 ring-amber-400' : ''}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 pt-1 ${isToday ? 'text-amber-600' : 'text-muted-foreground/60'}`}>{day}</span>
                  <div className={`flex flex-col gap-2 p-2 rounded-lg border min-h-[140px] ${dayEvents.length ? 'bg-muted/10' : 'border-dashed border-border/30'}`}>
                    {dayEvents.map((ev, idx) => {
                      const subject = formatSubjectDisplay(ev.summary);
                      return (
                        <div key={idx} className="p-3 rounded-lg bg-card border shadow-sm group relative overflow-hidden transition-transform hover:scale-[1.02]">
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 z-10 transition-opacity">
                            <button onClick={() => { setEditingEventIndex(icalEvents.indexOf(ev)); setFormData({summary: ev.summary, location: ev.location, day: String(ev.start.getDay()), startTime: ev.start.toTimeString().substring(0,5), endTime: ev.end.toTimeString().substring(0,5)}); setIsDialogOpen(true); }} className="p-1 hover:bg-muted text-muted-foreground"><Edit3 className="w-3 h-3" /></button>
                            <button onClick={() => setIcalEvents(p => p.filter(e => e !== ev))} className="p-1 hover:bg-destructive/10 text-destructive"><Trash2 className="w-3 h-3" /></button>
                          </div>
                          {subject.type && <Badge variant="outline" className={`mb-1.5 text-[8px] h-3.5 px-1.5 font-bold uppercase rounded-md ${subject.type.color}`}>{subject.type.label}</Badge>}
                          <p className="font-bold text-[10.5px] leading-tight mb-2 pr-6">{subject.name}</p>
                          <div className="space-y-1 text-[9px] text-muted-foreground font-medium">
                            <div className="flex items-center gap-1"><Clock className="w-2.5 h-2.5 text-primary/70" /> {ev.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {ev.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                            {ev.location && <Badge variant="secondary" className="text-[11px] font-black bg-primary/20 text-primary border-none h-5 rounded-md">{ev.location}</Badge>}
                          </div>
                        </div>
                      );
                    })}
                    {!dayEvents.length && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-30">
                        <Palmtree className="w-6 h-6 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase text-emerald-600">Holiday</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Timetable;