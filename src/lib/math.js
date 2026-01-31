/**
 * Centralized Mathematical Utilities for JPortal
 */

export const gradePointMap = {
    "A+": 10,
    "A": 9,
    "B+": 8,
    "B": 7,
    "C+": 6,
    "C": 5,
    "D": 4,
    "F": 0,
};

/**
 * Calculates SGPA from a list of subjects
 * @param {Array} subjects - List of subjects with { credits, gradePoints }
 * @returns {number|null} - Calculated SGPA or null if total credits is 0
 */
export function calculateSGPA(subjects) {
    let totalPoints = 0;
    let totalCredits = 0;

    subjects.forEach(subject => {
        const credits = parseFloat(subject.credits);
        if (credits > 0) {
            const gp = subject.gradePoints ?? gradePointMap[subject.grade] ?? 0;
            totalPoints += gp * credits;
            totalCredits += credits;
        }
    });

    return totalCredits === 0 ? null : totalPoints / totalCredits;
}

/**
 * Calculates CGPA from a list of semesters
 * @param {Array} semesters - List of semesters with { sgpa, credits }
 * @returns {number|null} - Calculated CGPA or null if total credits is 0
 */
export function calculateCGPA(semesters) {
    let totalPoints = 0;
    let totalCredits = 0;

    semesters.forEach(({ sgpa, credits }) => {
        const s = parseFloat(sgpa);
        const c = parseFloat(credits);
        if (!isNaN(s) && !isNaN(c) && c > 0) {
            totalPoints += s * c;
            totalCredits += c;
        }
    });

    if (totalCredits === 0) return null;
    return totalPoints / totalCredits;
}

/**
 * Calculates the SGPA required in the next semester to achieve a target CGPA
 * @param {number} targetCgpa - The desired CGPA
 * @param {Array} pastSemesters - List of past semesters with { sgpa, credits }
 * @param {number} nextCredits - Credits available in the next semester
 * @returns {number|null} - Required SGPA
 */
export function calculateRequiredSGPA(targetCgpa, pastSemesters, nextCredits) {
    const t = parseFloat(targetCgpa);
    const n = parseFloat(nextCredits);
    if (isNaN(t) || isNaN(n) || n <= 0) return null;

    let totalPoints = 0;
    let totalCredits = 0;

    pastSemesters.forEach(({ sgpa, credits }) => {
        const s = parseFloat(sgpa);
        const c = parseFloat(credits);
        if (!isNaN(s) && !isNaN(c)) {
            totalPoints += s * c;
            totalCredits += c;
        }
    });

    // Target = (TotalPoints + Required * NextCredits) / (TotalCredits + NextCredits)
    return (t * (totalCredits + n) - totalPoints) / n;
}

/**
 * Attendance Forecasting
 */

export function calculateClassesNeeded(attended, total, goal) {
    const a = parseInt(attended) || 0;
    const t = parseInt(total) || 0;
    const g = parseInt(goal) || 75;
    if (t === 0 || g >= 100) return 0;
    // Formula: (Goal * Total - 100 * Attended) / (100 - Goal)
    // But we need to account for the fact that Total increases as we attend more classes
    // Let x be additional classes.
    // (a + x) / (t + x) >= g/100
    // 100(a + x) >= g(t + x)
    // 100a + 100x >= gt + gx
    // x(100 - g) >= gt - 100a
    // x >= (gt - 100a) / (100 - g)
    const needed = Math.ceil((g * t - 100 * a) / (100 - g));
    return Math.max(0, needed);
}

export function calculateClassesCanMiss(attended, total, goal) {
    const a = parseInt(attended) || 0;
    const t = parseInt(total) || 0;
    const g = parseInt(goal) || 75;
    if (t === 0 || g <= 0) return 0;
    // Let x be missed classes.
    // a / (t + x) >= g/100
    // 100a >= g(t + x)
    // 100a >= gt + gx
    // gx <= 100a - gt
    // x <= (100a - gt) / g
    const canMiss = Math.floor((100 * a - g * t) / g);
    return Math.max(0, canMiss);
}
