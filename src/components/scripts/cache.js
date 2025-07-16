export const saveAttendanceToCache = async (attendance, username, sem) => {
  const ATTENDANCE_CACHE_KEY = `attendance-${username}-${sem["registration_code"]}`;
  localStorage.setItem(
    ATTENDANCE_CACHE_KEY,
    JSON.stringify({
      data: attendance,
      timestamp: Date.now(),
    })
  );
};

export const getAttendanceFromCache = async (username, sem) => {
  const ATTENDANCE_CACHE_KEY = `attendance-${username}-${sem["registration_code"]}`;
  return localStorage.getItem(ATTENDANCE_CACHE_KEY);
};

export const saveSemesterToCache = async (sem) => {
  localStorage.setItem("latestSemester", JSON.stringify(sem));
};

export const getSemesterFromCache = async () => {
  const sem = localStorage.getItem("latestSemester");
  return sem ? JSON.parse(sem) : null;
};
