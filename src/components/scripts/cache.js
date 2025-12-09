export const saveAttendanceToCache = async (attendance, username, sem) => {
  const key = `attendance-${username}-${sem["registration_code"]}`;
  await saveToCache(key, attendance, 48);
};

export const getAttendanceFromCache = async (username, sem) => {
  const key = `attendance-${username}-${sem["registration_code"]}`;
  return await getFromCache(key);
};

export const saveSemesterToCache = async (sem) => {
  localStorage.setItem("latestSemester", JSON.stringify(sem));
};

export const getSemesterFromCache = async () => {
  const sem = localStorage.getItem("latestSemester");
  return sem ? JSON.parse(sem) : null;
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

export const saveGradesToCache = async (grades, username, sem) => {
  const key = `grades-${username}-${sem.registration_code}`;
  await saveToCache(key, grades, 12);
};

export const getGradesFromCache = async (username, sem) => {
  const key = `grades-${username}-${sem.registration_code}`;
  return await getFromCache(key);
};

export const saveSubjectDataToCache = async (subjectData, subjectName, username, sem) => {
  const key = `subject-${subjectName}-${username}-${sem.registration_code}`;
  await saveToCache(key, subjectData, 10);
};

export const getSubjectDataFromCache = async (subjectName, username, sem) => {
  const key = `subject-${subjectName}-${username}-${sem.registration_code}`;
  return await getFromCache(key);
};

export const forceRefreshAttendance = async (username, sem) => {
  const key = `attendance-${username}-${sem["registration_code"]}`;
  localStorage.removeItem(key);
};

export const forceRefreshSubjectData = async (subjectName, username, sem) => {
  const key = `subject-${subjectName}-${username}-${sem.registration_code}`;
  localStorage.removeItem(key);
};

export const forceRefreshAllData = async (username, sem) => {
  const keys = Object.keys(localStorage);
  const userPattern = `${username}-${sem.registration_code}`;
  keys.forEach(key => {
    if (key.includes(userPattern)) {
      localStorage.removeItem(key);
    }
  });
};

export const clearExpiredCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('attendance-') || key.startsWith('grades-') || 
        key.startsWith('subject-') || key === 'mess-menu') {
      getFromCache(key);
    }
  });
};
