import { getAttendanceFromCache, getRegisteredSubjectsFromCache, getSubjectChoicesFromCache, getSubjectDataFromCache, getSemestersFromCache, getProfileDataFromCache, getFromCache, getGradesFromCache, getGradeCardSemestersFromCache, findGradesForUsername, findRegisteredSemestersInLocalStorage, findAttendanceInLocalStorage, findRegisteredSubjectsFromLocalStorage, findSubjectDataFromLocalStorage, findSubjectChoicesFromLocalStorage } from './cache';
import { getUsername, getProfileDataRaw } from '@/components/scripts/cache';

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
    this.username = (typeof window !== 'undefined' && getUsername()) || "";
  }

  async student_login(username, password, captcha = {}) {
    return this.session;
  }

  async __hit(endpoint, options = {}) {
    return { success: true, data: null };
  }

  async get_personal_info() {
    try {
      const username = (typeof window !== 'undefined' && getUsername()) || this.username;
      const cachedPd = await getProfileDataFromCache();
      if (typeof window !== 'undefined') {
        const pd = getProfileDataRaw();
        if (pd && Object.keys(pd).length > 0) {
          return pd;
        }
      }
      if (cachedPd && cachedPd.data) return cachedPd.data || cachedPd;
    } catch (e) {}

    return null;
  }

  async get_sgpa_cgpa() {
    try {
      const username = (typeof window !== 'undefined' && getUsername()) || this.username;
      const entries = await findGradesForUsername(username);
      if (entries && entries.length > 0) return { semesterList: entries };
    } catch (e) {}
    return null;
  }

  async get_attendance(header, semester) {
    try {
      const regCode = semester?.registration_code || semester?.registrationcode || semester?.registration_id || semester;
      const browserUsername = (typeof window !== 'undefined' && getUsername()) || this.username;
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
          const found = findAttendanceInLocalStorage((typeof window !== 'undefined' && getUsername()) || this.username, regCode);
          if (found) cached = found;
        } catch (e) {}
    } catch (e) {
    }

    return null;
  }

  async get_registered_subjects_and_faculties(semester) {
    try {
      const regCode = semester?.registration_code || semester?.registrationcode || semester?.registration_id || semester;
      const username = (typeof window !== 'undefined' && getUsername()) || this.username;
        let cached = await getRegisteredSubjectsFromCache(username, { registration_code: regCode });
        if (cached) return cached;
        try {
          const found = findRegisteredSubjectsFromLocalStorage((typeof window !== 'undefined' && getUsername()) || this.username, regCode);
          if (found) return found;
        } catch(e) {}
    } catch (e) {
    }
    return null;
  }

  async get_registered_semesters() {
    try {
      const username = (typeof window !== 'undefined' && getUsername()) || this.username;
      const cached = await getSemestersFromCache(username);
      if (cached) {
        cached.sort((a, b) => b.registration_code.localeCompare(a.registration_code));
        return cached;
      }

      const found = findRegisteredSemestersInLocalStorage();
      if (found) return found;
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
      const pd = (typeof window !== 'undefined') ? getProfileDataRaw() : null;
      if (pd && pd.presenthosteldetail) return { presenthosteldetail: pd.presenthosteldetail };
      const cached = await getProfileDataFromCache();
      if (cached && cached.data && cached.data.presenthosteldetail) return { presenthosteldetail: cached.data.presenthosteldetail };
    } catch (e) {}
    return null;
  }

  
  async get_attendance_meta() {
    try {
      const username = (typeof window !== 'undefined' && getUsername()) || this.username;
      const cachedSemesters = await getSemestersFromCache(username);
      const profile = getProfileDataRaw() || (await getProfileDataFromCache()) && (await getProfileDataFromCache()).data;
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
      const username = (typeof window !== 'undefined' && getUsername()) || this.username;
      let cached = await getSubjectDataFromCache(individualsubjectcode || subjectid, username, { registration_code: regCode });
      if (cached) {
        const cachedPayload = cached.data || cached;
        return cachedPayload;
      }
      try {
        const found = findSubjectDataFromLocalStorage(individualsubjectcode || subjectid, username, regCode);
        if (found) return found;
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
      const username = (typeof window !== 'undefined' && getUsername()) || this.username;
        let cached = await getSubjectChoicesFromCache(username, { registration_code: regCode });
        if (cached) return cached;
        try {
          const found = findSubjectChoicesFromLocalStorage((typeof window !== 'undefined' && getUsername()) || this.username, regCode);
          if (found) return found;
        } catch (e) {}
    } catch (e) {
    }
    return null;
  }
}