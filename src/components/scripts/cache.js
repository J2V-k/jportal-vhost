export const saveAttendanceToCache = async (attendance, username, sem) => {
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
  const key = `attendance-${username}-${semKey(sem)}`;
  await saveToCache(key, attendance, 48);
};

export const getAttendanceFromCache = async (username, sem) => {
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
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

export const saveGradesToCache = async (grades, username, sem) => {
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
  const key = `grades-${username}-${semKey(sem)}`;
  await saveToCache(key, grades, 12);
};

export const getGradesFromCache = async (username, sem) => {
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
  const key = `grades-${username}-${semKey(sem)}`;
  return await getFromCache(key);
};

export const saveSubjectDataToCache = async (subjectData, subjectName, username, sem) => {
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
  const key = `subject-${subjectName}-${username}-${semKey(sem)}`;
  await saveToCache(key, subjectData, 10);
};

export const getSubjectDataFromCache = async (subjectName, username, sem) => {
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
  const key = `subject-${subjectName}-${username}-${semKey(sem)}`;
  return await getFromCache(key);
};

export const saveRegisteredSubjectsToCache = async (registeredSubjects, username, sem, expirationHours = 48) => {
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
  const key = `registered-subjects-${username}-${semKey(sem)}`;
  await saveToCache(key, registeredSubjects, expirationHours);
};

export const getRegisteredSubjectsFromCache = async (username, sem) => {
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
  const key = `registered-subjects-${username}-${semKey(sem)}`;
  const cached = await getFromCache(key);
  if (!cached) return null;
  return cached.data || cached;
};

export const saveSubjectChoicesToCache = async (choices, username, sem, expirationHours = 48) => {
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
  const key = `subject-choices-${username}-${semKey(sem)}`;
  await saveToCache(key, choices, expirationHours);
};

export const getSubjectChoicesFromCache = async (username, sem) => {
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
  const key = `subject-choices-${username}-${semKey(sem)}`;
  const cached = await getFromCache(key);
  if (!cached) return null;
  return cached.data || cached;
};

export const forceRefreshAttendance = async (username, sem) => {
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
  const key = `attendance-${username}-${semKey(sem)}`;
  localStorage.removeItem(key);
};

export const forceRefreshSubjectData = async (subjectName, username, sem) => {
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
  const key = `subject-${subjectName}-${username}-${semKey(sem)}`;
  localStorage.removeItem(key);
};

export const forceRefreshAllData = async (username, sem) => {
  const keys = Object.keys(localStorage);
  const semKey = (s) => (typeof s === 'string' ? s : (s?.registration_code || s?.registrationcode || s?.registration_id || s?.registrationid || s));
  const userPattern = `${username}-${semKey(sem)}`;
  keys.forEach(key => {
    if (key.includes(userPattern)) {
      localStorage.removeItem(key);
    }
  });
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

