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

export const clearExpiredCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('attendance-') || key.startsWith('grades-') || 
        key.startsWith('subject-') || key === 'mess-menu' ||
        key === 'semestersData' || key === 'gradeCardSemesters' ||
        key === 'profileData') {
      getFromCache(key);
    }
  });
};

export const getCacheStats = () => {
  const keys = Object.keys(localStorage);
  const stats = {
    totalItems: 0,
    totalSize: 0,
    dataTypes: []
  };

  const typeMap = {
    'attendance': { name: 'attendance', prefix: 'attendance-', items: 0, size: 0, lastUpdated: null },
    'grades': { name: 'grades', prefix: 'grades-', items: 0, size: 0, lastUpdated: null },
    'subjects': { name: 'subjects', prefix: 'subject-', items: 0, size: 0, lastUpdated: null },
    'profile': { name: 'profile', prefix: 'profileData', items: 0, size: 0, lastUpdated: null },
    'semesters': { name: 'semesters', prefix: 'semestersData', items: 0, size: 0, lastUpdated: null },
    'gradeCardSemesters': { name: 'gradeCardSemesters', prefix: 'gradeCardSemesters', items: 0, size: 0, lastUpdated: null },
    'mess-menu': { name: 'mess-menu', prefix: 'mess-menu', items: 0, size: 0, lastUpdated: null }
  };

  keys.forEach(key => {
    let matched = false;
    Object.values(typeMap).forEach(type => {
      if (key.startsWith(type.prefix) || key === type.prefix) {
        matched = true;
        type.items++;
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            
            const byteSize = value.length * 2;
            type.size += byteSize;
            if (parsed.timestamp && (!type.lastUpdated || parsed.timestamp > type.lastUpdated)) {
              type.lastUpdated = parsed.timestamp;
            }
          }
        } catch (e) {

        }
      }
    });
    
    if (!matched) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const byteSize = value.length * 2;
          stats.totalSize += byteSize;
          stats.totalItems++;
        }
      } catch (e) {
      }
    }
  });

  Object.values(typeMap).forEach(type => {
    if (type.items > 0) {
      const sizeInMB = type.size / (1024 * 1024);
      type.size = sizeInMB.toFixed(2);
      type.lastUpdated = type.lastUpdated ? new Date(type.lastUpdated).toLocaleDateString() : 'Unknown';
      stats.dataTypes.push(type);
    }
  });

  stats.totalSize = (stats.totalSize / (1024 * 1024)).toFixed(2);

  return stats;
};

export const clearAllCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('attendance-') || key.startsWith('grades-') || 
        key.startsWith('subject-') || key === 'mess-menu' ||
        key === 'semestersData' || key === 'gradeCardSemesters' ||
        key === 'profileData') {
      localStorage.removeItem(key);
    }
  });
};

export const clearSpecificCache = (dataType) => {
  const keys = Object.keys(localStorage);
  const typeMap = {
    'attendance': 'attendance-',
    'grades': 'grades-',
    'subjects': 'subject-',
    'profile': 'profileData',
    'semesters': 'semestersData',
    'gradeCardSemesters': 'gradeCardSemesters',
    'mess-menu': 'mess-menu'
  };
  
  const prefix = typeMap[dataType.toLowerCase()];
  if (prefix) {
    keys.forEach(key => {
      if (key.startsWith(prefix) || key === prefix) {
        localStorage.removeItem(key);
      }
    });
  }
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

