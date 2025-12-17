import { getAttendanceFromCache, getRegisteredSubjectsFromCache, getSubjectChoicesFromCache, getSubjectDataFromCache, getSemestersFromCache, getProfileDataFromCache, getFromCache, getGradesFromCache, getGradeCardSemestersFromCache } from './cache';

export class ArtificialWebPortal {
  constructor() {
    this.session = {
      institute: "JIIT",
      instituteid: "JIIT001",
      memberid: "OFFLINE_USER",
      userid: "offline_user",
      token: "offline_token",
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      clientid: "OFFLINE_CLIENT",
      membertype: "S",
      name: "Offline Student",
      enrollmentno: "OFF-00001",
      get_headers: async () => ({ Authorization: `Bearer offline_token`, LocalName: "offline_local_name" })
    };
    this.username = (typeof window !== 'undefined' && localStorage.getItem('username')) || "";
  }

  async student_login(username, password, captcha = {}) {
    return this.session;
  }

  async __hit(endpoint, options = {}) {
    return { success: true, data: null };
  }

  async get_personal_info() {
    try {
      const username = (typeof window !== 'undefined' && localStorage.getItem('username')) || this.username;
      const cachedPd = await getProfileDataFromCache();
      if (typeof window !== 'undefined') {
        const pd = localStorage.getItem('pd');
        if (pd) {
          try {
            const parsed = JSON.parse(pd);
            if (parsed) return parsed;
          } catch (e) {}
        }
      }
      if (cachedPd && cachedPd.data) return cachedPd.data || cachedPd;
    } catch (e) {}

    return null;
  }

  async get_sgpa_cgpa() {
    try {
      const username = (typeof window !== 'undefined' && localStorage.getItem('username')) || this.username;
      const entries = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith(`grades-${username}-`)) {
          try {
            const raw = JSON.parse(localStorage.getItem(key) || 'null');
            const data = raw && raw.data ? raw.data : raw;
            if (data) entries.push(data);
          } catch (e) {}
        }
      }
      if (entries.length > 0) return { semesterList: entries };
    } catch (e) {}
    return null;
  }

  async get_attendance(header, semester) {
    try {
      const regCode = semester?.registration_code || semester?.registrationcode || semester?.registration_id || semester;
      const browserUsername = (typeof window !== 'undefined' && localStorage.getItem('username')) || this.username;
        let cached = await getAttendanceFromCache(browserUsername, { registration_code: regCode });
      if (cached && cached.data) {
        const payload = Object.assign({}, cached.data);
        payload.currentSem = payload.currentSem || regCode;
        payload.timestamp = cached.timestamp;
        payload.expiration = cached.expiration;
        return payload;
      }
      if (cached && cached.studentattendancelist) {
        const payload = Object.assign({}, cached);
        payload.timestamp = cached.timestamp || Date.now();
        payload.expiration = cached.expiration || Date.now() + 48 * 60 * 60 * 1000;
        payload.currentSem = payload.currentSem || regCode;
        return payload;
      }
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (key.startsWith('attendance-') && (key.includes(regCode) || key.includes(semester?.registration_id || '') || key.includes(semester?.registrationcode || ''))) {
              const raw = JSON.parse(localStorage.getItem(key) || 'null');
              if (raw && raw.data) {
                cached = raw;
                break;
              } else if (raw) {
                cached = raw;
                break;
              }
            }
          }
        } catch (e) {}
    } catch (e) {
    }

    return null;
  }

  async get_registered_subjects_and_faculties(semester) {
    try {
      const regCode = semester?.registration_code || semester?.registrationcode || semester?.registration_id || semester;
      const username = (typeof window !== 'undefined' && localStorage.getItem('username')) || this.username;
        let cached = await getRegisteredSubjectsFromCache(username, { registration_code: regCode });
        if (cached) return cached;
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (key.startsWith('registered-subjects-') && (key.includes(regCode) || key.includes(semester?.registration_id || '') || key.includes(semester?.registrationcode || ''))) {
              const raw = JSON.parse(localStorage.getItem(key) || 'null');
              if (raw && raw.data) {
                return raw.data;
              } else if (raw) {
                return raw;
              }
            }
          }
        } catch(e) {}
    } catch (e) {
    }
    return null;
  }

  async get_registered_semesters() {
    try {
      const username = (typeof window !== 'undefined' && localStorage.getItem('username')) || this.username;
      const cached = await getSemestersFromCache(username);
      if (cached) {
        cached.sort((a, b) => b.registration_code.localeCompare(a.registration_code));
        return cached;
      }

      const availableSemesters = [];
      const prefix = 'registered-subjects-';
      const seenSemKeys = new Set();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const parts = key.split('-');
          if (parts.length >= 3) {
            const semKey = parts[parts.length - 1];
            if (semKey && !seenSemKeys.has(semKey)) {
              seenSemKeys.add(semKey);
              availableSemesters.push({
                registration_code: semKey,
                registrationcode: semKey,
                registrationid: semKey,
                registration_id: semKey
              });
            }
          }
        }
      }
      if (availableSemesters.length > 0) {
        availableSemesters.sort((a, b) => b.registration_code.localeCompare(a.registration_code));
        return availableSemesters;
      }
    } catch (e) {}

    return null;
  }

  async get_grade_card(semester) {
    return null;
  }

  async get_semesters_for_grade_card() {
    return [];
  }

  async get_semesters_for_marks() {
    return [];
  }

  async get_marks(semester) {
    return null;
  }

  async get_exam_schedule(semester) {
    return null;
  }

  async get_semesters_for_exam_events() {
    return [];
  }

  async get_exam_events(semester) {
    return [];
  }

  async get_hostel_details() {
    try {
      if (typeof window !== 'undefined') {
        const pd = localStorage.getItem('pd');
        if (pd) {
          try {
            const parsed = JSON.parse(pd);
            if (parsed && parsed.presenthosteldetail) return { presenthosteldetail: parsed.presenthosteldetail };
          } catch (e) {}
        }
      }
      const cached = await getProfileDataFromCache();
      if (cached && cached.data && cached.data.presenthosteldetail) return { presenthosteldetail: cached.data.presenthosteldetail };
    } catch (e) {}
    return null;
  }

  
  async get_attendance_meta() {
    try {
      const username = (typeof window !== 'undefined' && localStorage.getItem('username')) || this.username;
      const cachedSemesters = await getSemestersFromCache(username);
      const profile = (typeof window !== 'undefined' && localStorage.getItem('pd')) ? JSON.parse(localStorage.getItem('pd')) : (await getProfileDataFromCache()) && (await getProfileDataFromCache()).data;
      const headerlist = profile && profile.generalinformation ? [profile.generalinformation] : null;
      if (cachedSemesters) {
        return {
          headerlist: headerlist || [],
          semlist: cachedSemesters,
          semesters: cachedSemesters,
          latest_header: () => (headerlist && headerlist[0]) || null,
          latest_semester: () => (cachedSemesters && cachedSemesters[0]) || null,
        };
      }
    } catch (e) {}
    return null;
  }

  async get_subject_daily_attendance(semester, subjectid, individualsubjectcode, subjectcomponentids) {
    try {
      const regCode = semester?.registration_code || semester?.registrationcode || semester?.registration_id || semester;
      const username = (typeof window !== 'undefined' && localStorage.getItem('username')) || this.username;
      let cached = await getSubjectDataFromCache(individualsubjectcode || subjectid, username, { registration_code: regCode });
      if (cached) {
        const cachedPayload = cached.data || cached;
        return cachedPayload;
      }
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (key.startsWith(`subject-${(individualsubjectcode || subjectid)}-${username}-`)) {
            const raw = JSON.parse(localStorage.getItem(key) || 'null');
            if (raw && raw.data) return raw.data;
            if (raw) return raw;
          }
        }
      } catch (e) {}
    } catch (e) {

    }
    return null;
  }

  async download_marks(semester) {
    return true;
  }

  async get_token() {
    return "offline_token";
  }

  async refresh_token() {
    return "offline_token_refreshed";
  }

  async get_subject_choices(semester) {
    try {
      const regCode = semester?.registration_code || semester?.registrationcode || semester?.registration_id || semester;
      const username = (typeof window !== 'undefined' && localStorage.getItem('username')) || this.username;
        let cached = await getSubjectChoicesFromCache(username, { registration_code: regCode });
        if (cached) return cached;
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (key.startsWith('subject-choices-') && (key.includes(regCode) || key.includes(semester?.registration_id || '') || key.includes(semester?.registrationcode || ''))) {
              const raw = JSON.parse(localStorage.getItem(key) || 'null');
              if (raw && raw.data) {
                return raw.data;
              } else if (raw) {
                return raw;
              }
            }
          }
        } catch (e) {}
    } catch (e) {
    }
    return null;
  }
}