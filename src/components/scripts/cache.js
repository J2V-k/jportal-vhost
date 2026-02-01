export const saveAttendanceToCache = async (attendance, username, sem) => {
  const key = `attendance-${username}-${semKey(sem)}`;
  await saveToCache(key, attendance, 48);
};

export const getAttendanceFromCache = async (username, sem) => {
  const key = `attendance-${username}-${semKey(sem)}`;
  return await getFromCache(key);
};

export const saveSemesterToCache = async (sem) => {
  localStorage.setItem("latestSemester", JSON.stringify(sem));
};

export const getSemesterFromCache = async () => {
  const sem = localStorage.getItem("latestSemester");
  return sem ? JSON.parse(sem) : null;
};

export const saveSemestersToCache = async (semesters, username, expirationHours = 48) => {
  const key = `semesters-${username}`;
  await saveToCache(key, semesters, expirationHours);
};

export const getSemestersFromCache = async (username) => {
  const key = `semesters-${username}`;
  const cached = await getFromCache(key);
  if (!cached) return null;
  return cached.data || cached;
};

export const saveToCache = async (key, data, expirationHours = 24) => {
  const cacheData = {
    data,
    timestamp: Date.now(),
    expiration: Date.now() + (expirationHours * 60 * 60 * 1000)
  };
  localStorage.setItem(key, JSON.stringify(cacheData));
};

export const getFromCache = async (key) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  try {
    const parsedCache = JSON.parse(cached);
    
    if (!parsedCache.expiration && parsedCache.data) {
      const newFormat = {
        data: parsedCache.data,
        timestamp: Date.now(),
        expiration: Date.now() + (48 * 60 * 60 * 1000)
      };
      localStorage.setItem(key, JSON.stringify(newFormat));
      return newFormat;
    }
    
    if (Date.now() > parsedCache.expiration) {
      localStorage.removeItem(key);
      return null;
    }
    return parsedCache;
  } catch (error) {
    console.error('Error parsing cache:', error);
    localStorage.removeItem(key);
    return null;
  }
};

export const getCachedValueIfAny = async (key) => {
  const cached = await getFromCache(key);
  if (!cached) return null;
  return cached.data || cached;
};

const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));

export const saveGradesToCache = async (grades, username, sem) => {
  const key = `grades-${username}-${semKey(sem)}`;
  await saveToCache(key, grades, 12);
};

export const getGradesFromCache = async (username, sem) => {
  const key = `grades-${username}-${semKey(sem)}`;
  return await getFromCache(key);
};

export const saveSubjectDataToCache = async (subjectData, subjectName, username, sem) => {
  const key = `subject-${subjectName}-${username}-${semKey(sem)}`;
  await saveToCache(key, subjectData, 10);
};

export const getSubjectDataFromCache = async (subjectName, username, sem) => {
  const key = `subject-${subjectName}-${username}-${semKey(sem)}`;
  return await getFromCache(key);
};

export const saveRegisteredSubjectsToCache = async (registeredSubjects, username, sem, expirationHours = 48) => {
  const key = `registered-subjects-${username}-${semKey(sem)}`;
  await saveToCache(key, registeredSubjects, expirationHours);
};

export const getRegisteredSubjectsFromCache = async (username, sem) => {
  const key = `registered-subjects-${username}-${semKey(sem)}`;
  const cached = await getFromCache(key);
  if (!cached) return null;
  return cached.data || cached;
};

export const saveSubjectChoicesToCache = async (choices, username, sem, expirationHours = 48) => {
  const key = `subject-choices-${username}-${semKey(sem)}`;
  await saveToCache(key, choices, expirationHours);
};

export const getSubjectChoicesFromCache = async (username, sem) => {
  const key = `subject-choices-${username}-${semKey(sem)}`;
  const cached = await getFromCache(key);
  if (!cached) return null;
  return cached.data || cached;
};

export const forceRefreshAttendance = async (username, sem) => {
  const key = `attendance-${username}-${semKey(sem)}`;
  localStorage.removeItem(key);
};

export const forceRefreshSubjectData = async (subjectName, username, sem) => {
  const key = `subject-${subjectName}-${username}-${semKey(sem)}`;
  localStorage.removeItem(key);
};

export const forceRefreshAllData = async (username, sem) => {
  const keys = Object.keys(localStorage);
  const userPattern = `${username}-${semKey(sem)}`;
  keys.forEach(key => {
    if (key.includes(userPattern)) {
      localStorage.removeItem(key);
    }
  });
};

export const findGradesForUsername = async (username) => {
  try {
    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(`grades-${username}-`)) {
        try {
          const raw = JSON.parse(localStorage.getItem(key) || 'null');
          const data = raw && raw.data ? raw.data : raw;
          if (data) entries.push(data);
        } catch (e) { }
      }
    }
    return entries.length > 0 ? entries : null;
  } catch (e) {
    return null;
  }
};

export const findRegisteredSemestersInLocalStorage = () => {
  try {
    const availableSemesters = [];
    const prefix = 'registered-subjects-';
    const seenSemKeys = new Set();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const parts = key.split('-');
        if (parts.length >= 3) {
          const sem = parts[parts.length - 1];
          if (sem && !seenSemKeys.has(sem)) {
            seenSemKeys.add(sem);
            availableSemesters.push({ registration_code: sem, registrationcode: sem, registrationid: sem, registration_id: sem });
          }
        }
      }
    }
    return availableSemesters.length > 0 ? availableSemesters : null;
  } catch (e) {
    return null;
  }
};

export const findAttendanceInLocalStorage = (username, regCode) => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('attendance-') && (key.includes(regCode) || key.includes(username || ''))) {
        const raw = JSON.parse(localStorage.getItem(key) || 'null');
        if (raw) return raw;
      }
    }
    return null;
  } catch (e) { return null; }
};

export const findRegisteredSubjectsFromLocalStorage = (username, regCode) => {
  try {
    const prefix = 'registered-subjects-';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(prefix) && (key.includes(regCode) || key.includes(username || ''))) {
        const raw = JSON.parse(localStorage.getItem(key) || 'null');
        if (raw && raw.data) return raw.data;
        if (raw) return raw;
      }
    }
    return null;
  } catch (e) { return null; }
};

export const findSubjectDataFromLocalStorage = (subjectId, username, regCode) => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(`subject-${subjectId}-${username}-`)) {
        const raw = JSON.parse(localStorage.getItem(key) || 'null');
        if (raw && raw.data) return raw.data;
        if (raw) return raw;
      }
    }
    return null;
  } catch (e) { return null; }
};

export const findSubjectChoicesFromLocalStorage = (username, regCode) => {
  try {
    const prefix = 'subject-choices-';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(prefix) && (key.includes(regCode) || key.includes(username || ''))) {
        const raw = JSON.parse(localStorage.getItem(key) || 'null');
        if (raw && raw.data) return raw.data;
        if (raw) return raw;
      }
    }
    return null;
  } catch (e) { return null; }
};


export const saveSemestersDataToCache = async (data, expirationHours = 24) => {
  await saveToCache('semestersData', data, expirationHours);
};

export const getSemestersDataFromCache = async () => {
  return await getFromCache('semestersData');
};

export const saveGradeCardSemestersToCache = async (data, expirationHours = 24) => {
  await saveToCache('gradeCardSemesters', data, expirationHours);
};

export const getGradeCardSemestersFromCache = async () => {
  return await getFromCache('gradeCardSemesters');
};

export const saveProfileDataToCache = async (data, expirationHours = 12) => {
  await saveToCache('profileData', data, expirationHours);
};

export const getProfileDataFromCache = async () => {
  return await getFromCache('profileData');
};

export const setUsername = (username) => { try { localStorage.setItem('username', username); } catch (e) { } };
export const getUsername = () => { try { return localStorage.getItem('username'); } catch (e) { return null; } };
export const removeUsername = () => { try { localStorage.removeItem('username'); } catch (e) { } };

export const setPassword = (password) => { try { localStorage.setItem('password', password); } catch (e) { } };
export const getPassword = () => { try { return localStorage.getItem('password'); } catch (e) { return null; } };
export const removePassword = () => { try { localStorage.removeItem('password'); } catch (e) { } };

export const setCredentials = (username, password) => { setUsername(username); setPassword(password); };
export const clearCredentials = () => { removeUsername(); removePassword(); };

export const getDefaultTab = () => { try { return localStorage.getItem('defaultTab') || '/attendance'; } catch (e) { return '/attendance'; } };
export const setDefaultTab = (tab) => { try { localStorage.setItem('defaultTab', tab); } catch (e) { } };

export const getExamStartDate = () => { try { return localStorage.getItem('examStartDate'); } catch (e) { return null; } };
export const setExamStartDate = (isoDate) => { try { localStorage.setItem('examStartDate', isoDate); } catch (e) { } };
export const getExamEndDate = () => { try { return localStorage.getItem('examEndDate'); } catch (e) { return null; } };
export const setExamEndDate = (isoDate) => { try { localStorage.setItem('examEndDate', isoDate); } catch (e) { } };
export const setExamDates = (startIso, endIso) => { setExamStartDate(startIso); setExamEndDate(endIso); };

export const getSwipeEnabled = () => { try { return localStorage.getItem('swipeEnabled') !== 'false'; } catch (e) { return true; } };
export const setSwipeEnabled = (enabled) => { try { localStorage.setItem('swipeEnabled', enabled ? 'true' : 'false'); } catch (e) { } };

export const getDefaultMessMenuView = () => { try { return localStorage.getItem('defaultMessMenuView') || 'daily'; } catch (e) { return 'daily'; } };
export const setDefaultMessMenuView = (view) => { try { localStorage.setItem('defaultMessMenuView', view); } catch (e) { } };

export const getMessMenuOpen = () => { try { return localStorage.getItem('messMenuOpen') === 'true'; } catch (e) { return false; } };
export const setMessMenuOpen = (open) => { try { localStorage.setItem('messMenuOpen', open ? 'true' : 'false'); } catch (e) { } };

export const getAttendanceGoal = () => { try { const v = localStorage.getItem('attendanceGoal'); return v ? Number(v) : null; } catch (e) { return null; } };
export const setAttendanceGoal = (goal) => { try { localStorage.setItem('attendanceGoal', Number(goal).toString()); } catch (e) { } };
export const removeAttendanceGoal = () => { try { localStorage.removeItem('attendanceGoal'); } catch (e) { } };

export const getGradesActiveTab = () => { try { return localStorage.getItem('grades_active_tab'); } catch (e) { return null; } };
export const setGradesActiveTab = (tab) => { try { localStorage.setItem('grades_active_tab', tab); } catch (e) { } };

export const getJPTheme = () => { try { const raw = localStorage.getItem('jp-theme'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };
export const setJPTheme = (theme) => { try { localStorage.setItem('jp-theme', JSON.stringify(theme)); } catch (e) { } };
export const removeJPTheme = () => { try { localStorage.removeItem('jp-theme'); } catch (e) { } };

export const getThemePresetsCache = () => { try { const raw = localStorage.getItem('jportal_theme_presets_v2'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };
export const setThemePresetsCache = (data) => { try { localStorage.setItem('jportal_theme_presets_v2', JSON.stringify(data)); } catch (e) { } };

export const hasCachedProfile = () => { try { return !!localStorage.getItem('profileData') || !!localStorage.getItem('pd'); } catch (e) { return false; } };
export const hasCachedAttendance = (username) => { try { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(`attendance-${username}-`)) return true; } return false; } catch (e) { return false; } };
export const hasCachedGrades = (username) => { try { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(`grades-${username}-`)) return true; } return false; } catch (e) { return false; } };

export const hasKeyStartingWith = (prefix) => { try { return Object.keys(localStorage).some(k => k.startsWith(prefix)); } catch (e) { return false; } };
export const hasAnyAttendance = () => { return hasKeyStartingWith('attendance-'); };
export const hasAnyGrades = () => { return hasKeyStartingWith('grades-'); };

export const hasAnyPortalData = () => { try { const keys = Object.keys(localStorage); return keys.some(key => key.startsWith('attendance-') || key.startsWith('grades-') || key.startsWith('subject-') || key === 'latestSemester' || key === 'semestersData' || key === 'gradeCardSemesters' || key === 'mess-menu' || key === 'profileData'); } catch (e) { return false; } };

export const getDefaultTheme = () => { try { return localStorage.getItem('defaultTheme') || 'light'; } catch (e) { return 'light'; } };
export const setDefaultTheme = (t) => { try { localStorage.setItem('defaultTheme', t); } catch (e) { } };

export const getSelectedPreset = () => { try { return localStorage.getItem('selectedPreset') || ''; } catch (e) { return ''; } };
export const setSelectedPreset = (id) => { try { localStorage.setItem('selectedPreset', id); } catch (e) { } };

export const getShowTimetableInNavbar = () => { try { return localStorage.getItem('showTimetableInNavbar') === 'true'; } catch (e) { return false; } };
export const setShowTimetableInNavbar = (v) => { try { localStorage.setItem('showTimetableInNavbar', v ? 'true' : 'false'); } catch (e) { } };

export const getProfileDataRaw = () => { try { const raw = localStorage.getItem('profileData') || localStorage.getItem('pd') || '{}'; return JSON.parse(raw); } catch (e) { return {}; } };

export const clearAllCache = () => { try { localStorage.clear(); } catch (e) { } };
export const getCgpaCalculatorSemesters = () => { try { const raw = localStorage.getItem('cgpaCalculatorSemesters'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };
export const setCgpaCalculatorSemesters = (data) => { try { localStorage.setItem('cgpaCalculatorSemesters', JSON.stringify(data)); } catch (e) { } };
export const getCgpaCalculatorTargetCgpa = () => { try { return localStorage.getItem('cgpaCalculatorTargetCgpa') || ''; } catch (e) { return ''; } };
export const setCgpaCalculatorTargetCgpa = (v) => { try { localStorage.setItem('cgpaCalculatorTargetCgpa', v); } catch (e) { } };
export const getCgpaCalculatorSelectedSemester = () => { try { const raw = localStorage.getItem('cgpaCalculatorSelectedSemester'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };
export const setCgpaCalculatorSelectedSemester = (sem) => { try { localStorage.setItem('cgpaCalculatorSelectedSemester', JSON.stringify(sem)); } catch (e) { } };
export const getSubjectSemestersData = () => { try { const raw = localStorage.getItem('subjectSemestersData'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };
export const setSubjectSemestersData = (data) => { try { localStorage.setItem('subjectSemestersData', JSON.stringify(data)); } catch (e) { } };
export const getTimetableModifiedEvents = () => { try { const raw = localStorage.getItem('timetable_modified_events'); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };
export const setTimetableModifiedEvents = (events) => { try { localStorage.setItem('timetable_modified_events', JSON.stringify(events)); } catch (e) { } };
export const removeTimetableModifiedEvents = () => { try { localStorage.removeItem('timetable_modified_events'); } catch (e) { } };
export const getTimetableIcs = () => { try { return localStorage.getItem('timetable_ics') || null; } catch (e) { return null; } };
export const setTimetableIcs = (text) => { try { localStorage.setItem('timetable_ics', text); } catch (e) { } };
export const removeTimetableIcs = () => { try { localStorage.removeItem('timetable_ics'); } catch (e) { } };

