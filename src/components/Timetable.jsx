import { useState, useEffect, useRef } from "react";
import { Calendar, Loader2, ArrowLeft, ExternalLink, RefreshCw, Edit2, Trash2, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from 'react-helmet-async';
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";

const Timetable = ({ w, profileData, setProfileData, subjectData, setSubjectData, subjectSemestersData }) => {
  const navigate = useNavigate();

  const [timetableUrl, setTimetableUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const openedRef = useRef(false);

  const [selectedVariants, setSelectedVariants] = useState([]);
  const [variantNames, setVariantNames] = useState({});

  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingValue, setEditingValue] = useState("");

  const [lastCampus, setLastCampus] = useState("62");
  const [lastYear, setLastYear] = useState("4");
  const [lastBatch, setLastBatch] = useState("2026");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('timetable_state');
      if (stored) {
        const obj = JSON.parse(stored);
        if (Array.isArray(obj.variants)) setSelectedVariants(obj.variants);
        if (obj.names && typeof obj.names === 'object') setVariantNames(obj.names);
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('timetable_state', JSON.stringify({ variants: selectedVariants, names: variantNames }));
    } catch (e) { }
  }, [selectedVariants, variantNames]);

  const updateUrlFromVariants = (variants, campus = lastCampus, year = lastYear, batch = lastBatch) => {
    const selectedSubjects = variants && variants.length ? variants.join(',') : 'EC611,EC671,EC691';
    const baseUrl = "https://simple-timetable.tashif.codes/";
    const params = new URLSearchParams({ campus, year, batch, selectedSubjects, isGenerating: "true" });
    const url = `${baseUrl}?${params.toString()}`;
    setTimetableUrl(url);
  };

  const [localProfileData, setLocalProfileData] = useState(profileData || null);
  const [localSubjectData, setLocalSubjectData] = useState(subjectData || {});
  const [localSemestersData, setLocalSemestersData] = useState(subjectSemestersData || null);

  useEffect(() => {
    if (profileData && !localProfileData) setLocalProfileData(profileData);
  }, [profileData]);

  useEffect(() => {
    if (subjectData && Object.keys(subjectData).length > 0 && Object.keys(localSubjectData).length === 0) {
      setLocalSubjectData(subjectData);
    }
  }, [subjectData]);

  useEffect(() => {
    if (subjectSemestersData && !localSemestersData) setLocalSemestersData(subjectSemestersData);
  }, [subjectSemestersData]);

  const generateForSemester = async (semId) => {
    setLoading(true);
    setError(null);

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

    try {
      let profile = localProfileData;
      if (!profile && w?.get_personal_info) {
        profile = await w.get_personal_info().catch(() => null);
        if (profile) setLocalProfileData(profile);
        if (setProfileData && profile) setProfileData(profile);
      }

      const profileInfo = profile?.generalinformation || {};

      let campus = "62";
      const programCode = (profileInfo.programcode || "").toString();
      const institute = (profileInfo.institutename || "").toString();
      const enrollment = (profileInfo.registrationno || "").toString();
      if (programCode.includes("128") || programCode.toLowerCase().includes("noida") || institute.toLowerCase().includes("noida") || enrollment.startsWith("99")) {
        campus = "128";
      }

      let year = "4";
      const semRaw = profileInfo.semester || "";
      const semMatch = String(semRaw).match(/(\d+)/);
      if (semMatch) {
        const semNum = parseInt(semMatch[1]);
        year = Math.ceil(semNum / 2).toString();
      }

      const batch = profileInfo.batch || profileInfo.batchname || "2026";

      let subjectsMap = localSubjectData || {};
      let semesters = localSemestersData;

      if ((!semesters || !semesters.latest_semester) && w?.get_registered_semesters) {
        const registered = await w.get_registered_semesters().catch(() => []);
        if (registered && registered.length > 0) {
          semesters = { semesters: registered, latest_semester: registered[0] };
          setLocalSemestersData(semesters);
        }
      }

      if (semId && (!subjectsMap[semId] || !subjectsMap[semId].subjects) && w?.get_registered_subjects_and_faculties) {
        try {
          const subs = await w.get_registered_subjects_and_faculties({ registration_id: semId });
          subjectsMap = { ...subjectsMap, [semId]: subs };
          setLocalSubjectData(subjectsMap);
          if (setSubjectData) setSubjectData(subjectsMap);
        } catch (e) { }
      }

      const arr = [];
      const names = {};
      if (semId && subjectsMap[semId] && subjectsMap[semId].subjects) {
        subjectsMap[semId].subjects.forEach(s => {
          const subjectName = s.subject_name || s.subjectname || s.subject || s.name || s.subject_code;
          generateVariants(s.subject_code).forEach(v => { arr.push(v); if (!names[v]) names[v] = subjectName; });
        });
      } else if (Object.keys(subjectsMap).length > 0) {
        const firstKey = Object.keys(subjectsMap)[0];
        subjectsMap[firstKey].subjects.forEach(s => {
          const subjectName = s.subject_name || s.subjectname || s.subject || s.name || s.subject_code;
          generateVariants(s.subject_code).forEach(v => { arr.push(v); if (!names[v]) names[v] = subjectName; });
        });
      }

      const unique = Array.from(new Set(arr.filter(v => v && v.length >= 4)));
      setSelectedVariants(unique);
      setVariantNames(names);
      const selectedSubjects = unique.length ? unique.join(',') : 'EC611,EC671,EC691';

      const baseUrl = "https://simple-timetable.tashif.codes/";
      const params = new URLSearchParams({ campus, year, batch, selectedSubjects, isGenerating: "true" });
      const url = `${baseUrl}?${params.toString()}`;
      setLastCampus(campus);
      setLastYear(year);
      setLastBatch(batch);
      setTimetableUrl(url);
      if (!openedRef.current) {
        window.open(url, '_blank');
        openedRef.current = true;
      }

    } catch (err) {
      console.error(err);
      setError("Failed to generate timetable URL. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const requestRaw = sessionStorage.getItem('timetableRequest');
    const request = requestRaw ? JSON.parse(requestRaw) : null;

    if (request && request.semId) {
      sessionStorage.removeItem('timetableRequest');
      setSelectedSemesterId(request.semId);
      return;
    }

    (async () => {
      try {
        const registered = await (w?.get_registered_semesters ? w.get_registered_semesters() : Promise.resolve([]));
        if (registered && registered.length > 0) {
          setLocalSemestersData({ semesters: registered, latest_semester: registered[0] });

          const currentYear = new Date().getFullYear().toString();
          const currentYearSemester = registered.find(sem =>
            sem.registration_code && sem.registration_code.includes(currentYear)
          );
          const selectedSem = currentYearSemester || registered[0];
          setSelectedSemesterId(selectedSem.registration_id);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    })();

    const updateOnVariantEdit = (variants) => {
      if (!variants || variants.length === 0) return;
      updateUrlFromVariants(variants, lastCampus, lastYear, lastBatch);
    };

    window.__rebuildTimetableFromVariants = updateOnVariantEdit;

    return () => {
      delete window.__rebuildTimetableFromVariants;
    };
  }, [w]);

  useEffect(() => {
    const requestRaw = sessionStorage.getItem('timetableRequest');
    const request = requestRaw ? JSON.parse(requestRaw) : null;

    if (request && request.semId) {
      sessionStorage.removeItem('timetableRequest');

      (async () => {
        try {
          const semId = request.semId;

          let profile = localProfileData;
          if (!profile && w?.get_personal_info) {
            profile = await w.get_personal_info().catch(() => null);
            if (profile) setLocalProfileData(profile);
            if (setProfileData && profile) setProfileData(profile);
          }

          const profileInfo = profile?.generalinformation || {};
          let campus = "62";
          const programCode = (profileInfo.programcode || "").toString();
          const institute = (profileInfo.institutename || "").toString();
          const enrollment = (profileInfo.registrationno || "").toString();
          if (programCode.includes("128") || programCode.toLowerCase().includes("noida") || institute.toLowerCase().includes("noida") || enrollment.startsWith("99")) {
            campus = "128";
          }
          let year = "4";
          const semRaw = profileInfo.semester || "";
          const semMatch = String(semRaw).match(/(\d+)/);
          if (semMatch) {
            const semNum = parseInt(semMatch[1]);
            year = Math.ceil(semNum / 2).toString();
          }
          const batch = profileInfo.batch || profileInfo.batchname || "2026";

          let subjectsMap = localSubjectData || {};
          let semesters = localSemestersData;

          if ((!semesters || !semesters.latest_semester) && w?.get_registered_semesters) {
            const registered = await w.get_registered_semesters().catch(() => []);
            if (registered && registered.length > 0) {
              semesters = { semesters: registered, latest_semester: registered[0] };
              setLocalSemestersData(semesters);
            }
          }

          if (!subjectsMap[semId] && w?.get_registered_subjects_and_faculties) {
            try {
              const subs = await w.get_registered_subjects_and_faculties({ registration_id: semId });
              subjectsMap = { ...subjectsMap, [semId]: subs };
              setLocalSubjectData(subjectsMap);
              if (setSubjectData) setSubjectData(subjectsMap);
            } catch (e) {
            }
          }


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

          let arr = [];
          const names = {};
          if (subjectsMap[semId] && subjectsMap[semId].subjects) {
            subjectsMap[semId].subjects.forEach(s => {
              const subjectName = s.subject_name || s.subjectname || s.subject || s.name || s.subject_code;
              generateVariants(s.subject_code).forEach(v => { arr.push(v); if (!names[v]) names[v] = subjectName; });
            });
          }

          const unique = Array.from(new Set(arr.filter(v => v && v.length >= 4)));
          setSelectedVariants(unique);
          setVariantNames(names);
          updateUrlFromVariants(unique, campus, year, batch);
        } catch (err) {
          console.error('Error processing timetableRequest:', err);
        }
      })();

      return;
    }

  }, [timetableUrl]);

  useEffect(() => {
    if (selectedSemesterId) {
      generateForSemester(selectedSemesterId);
    }
  }, [selectedSemesterId]);

  if (loading) {
    return (
      <div className="bg-background text-foreground">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-foreground animate-spin mx-auto mb-4" />
          <p className="text-foreground">Loading timetable...</p>
          <div className="mt-4 flex justify-center">
            <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-background text-foreground h-full overflow-hidden"
    >
      <Helmet>
        <title>Timetable - JP Portal | JIIT Student Portal</title>
        <meta name="description" content="Generate and view your personalized timetable based on registered subjects at JIIT." />
        <meta property="og:title" content="Timetable - JP Portal | JIIT Student Portal" />
        <meta property="og:description" content="Generate and view your personalized timetable based on registered subjects at JIIT." />
        <meta property="og:url" content="https://jportal2-0.vercel.app/#/timetable" />
        <meta name="keywords" content="timetable, class schedule, JP Portal, JIIT" />
        <link rel="canonical" href="https://jportal2-0.vercel.app/#/timetable" />
      </Helmet>

      <div className="max-w-full mx-auto p-6 rounded-lg bg-card text-foreground shadow-sm">
        <h1 className="text-xl font-bold mb-4 text-center">Timetable Generator</h1>
        <p className="text-sm text-center mb-4 text-muted-foreground">Select your semester, generate subject codes, and open your personalized timetable.</p>
        <div className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
          <div className="flex items-start sm:items-center gap-3 w-full">
            <div className="flex flex-col w-full">
              <Select value={selectedSemesterId || ""} onValueChange={(val) => setSelectedSemesterId(val)}>
                <SelectTrigger className="bg-card text-foreground border-border w-full sm:w-56">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent className="bg-card text-foreground">
                  {localSemestersData?.semesters?.map((s) => (
                    <SelectItem key={s.registration_id} value={s.registration_id}>{s.registration_code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!localSemestersData?.semesters?.length && (
                <span className="text-muted-foreground text-xs mt-1">No registered semesters available — Generate will use default subjects.</span>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto bg-primary text-primary-foreground border border-primary/20" onClick={async () => {
                if (!selectedSemesterId && localSemestersData?.semesters?.length) { setError('Please select a semester'); return; }
                await generateForSemester(selectedSemesterId);
                if (timetableUrl) {
                  window.open(timetableUrl, '_blank');
                }
              }}>Generate</Button>
            </div>
          </div>
        </div>

        <div className="flex justify-center py-1">
          <div className="text-center">
            <div className="mt-4 flex justify-center flex-col items-center gap-3">
              {selectedVariants && selectedVariants.length > 0 && (
                <div className="flex flex-wrap gap-2 max-w-full pb-2 align-top justify-center">
                  {selectedVariants.slice(0, 50).map((v, i) => (
                    <div key={v} className="flex items-center justify-between p-2 rounded-lg bg-muted/10 text-muted-foreground border border-border">
                      {editingIndex === i ? (
                        <input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newArr = [...selectedVariants];
                              newArr[i] = editingValue.trim();
                              setSelectedVariants(newArr.filter(av => av && av.length >= 4 && /^[A-Z]/.test(av)));
                              setEditingIndex(-1);
                              updateUrlFromVariants(newArr.filter(av => av && av.length >= 4 && /^[A-Z]/.test(av)));
                            } else if (e.key === 'Escape') {
                              setEditingIndex(-1);
                            }
                          }}
                          className="bg-transparent outline-none text-sm flex-1"
                        />
                      ) : (
                        <div className="flex-1">
                          <div className="font-medium text-sm">{v}</div>
                          {variantNames[v] && variantNames[v] !== v && (
                            <div className="text-xs text-muted-foreground truncate">{variantNames[v]}</div>
                          )}
                        </div>
                      )}
                      {editingIndex === i ? (
                        <Button size="icon" variant="ghost" onClick={() => {
                          const old = selectedVariants[i];
                          const newVal = editingValue.trim();
                          const newArr = [...selectedVariants];
                          newArr[i] = newVal;
                          const filtered = newArr.filter(av => av && av.length >= 4 && /^[A-Z]/.test(av));
                          const newNames = { ...variantNames };
                          if (newVal) newNames[newVal] = newNames[newVal] || newVal;
                          if (old && old !== newVal) delete newNames[old];
                          setVariantNames(newNames);
                          setSelectedVariants(filtered);
                          setEditingIndex(-1);
                          updateUrlFromVariants(filtered);
                        }}><Check className="w-3 h-3" /></Button>
                      ) : (
                        <div className="flex gap-0">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingIndex(i); setEditingValue(v); }}><Edit2 className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { const old = v; const newArr = selectedVariants.filter((_, idx) => idx !== i); const newNames = { ...variantNames }; delete newNames[old]; setVariantNames(newNames); setSelectedVariants(newArr); updateUrlFromVariants(newArr); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button size="sm" className="bg-card text-foreground border border-border" onClick={() => {
                const v = prompt('Enter new variant (e.g., PH532)');
                if (v) {
                  const trimmed = v.trim().toUpperCase();
                  if (!trimmed || trimmed.length < 4 || !/^[A-Z]/.test(trimmed)) { alert('Variant must start with a letter and be at least 4 characters'); return; }
                  const newArr = Array.from(new Set([trimmed, ...selectedVariants]));
                  const newNames = { ...variantNames };
                  newNames[trimmed] = newNames[trimmed] || trimmed;
                  setVariantNames(newNames);
                  setSelectedVariants(newArr);
                  updateUrlFromVariants(newArr);
                }
              }}>+</Button>

              <div className="flex items-center gap-2">
                <Button size="sm" className="bg-card text-foreground" disabled={!timetableUrl} onClick={() => {
                  if (!timetableUrl) { setError('Timetable URL not ready yet.'); return; }
                  try { window.open(timetableUrl, '_blank'); openedRef.current = true; } catch (e) { }
                }}>
                  <ExternalLink className="w-4 h-4" />
                  Open in new tab
                </Button>
                <Button size="sm" className="text-foreground" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Timetable;