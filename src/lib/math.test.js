import { calculateSGPA, calculateCGPA, calculateRequiredSGPA, calculateClassesNeeded, calculateClassesCanMiss } from './math.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

// Test SGPA
const sgpaSubjects = [
    { credits: 4, grade: 'A+' }, // 10 * 4 = 40
    { credits: 3, grade: 'B' },  // 7 * 3 = 21
    { credits: 0, grade: 'A' },  // Audit
];
const sgpa = calculateSGPA(sgpaSubjects);
assert(Math.abs(sgpa - (61 / 7)) < 0.01, `SGPA should be ~8.71, got ${sgpa}`);

// Test CGPA
const semesters = [
    { sgpa: 8, credits: 20 }, // 160
    { sgpa: 9, credits: 20 }, // 180
];
const cgpa = calculateCGPA(semesters);
assert(cgpa === 8.5, `CGPA should be 8.5, got ${cgpa}`);

// Test Required SGPA
// Target 8.5, Past: {sgpa: 8, credits: 20}, Next: 20 credits
// (8 * 20 + req * 20) / 40 = 8.5
// 160 + 20req = 340 => 20req = 180 => req = 9
const req = calculateRequiredSGPA(8.5, [{ sgpa: 8, credits: 20 }], 20);
assert(req === 9, `Required SGPA should be 9, got ${req}`);

// Test Attendance
// 10/12 attended, goal 75%
// Needed: (75*12 - 100*10) / 25 = (900 - 1000) / 25 = -4 (0 needed)
assert(calculateClassesNeeded(10, 12, 75) === 0, "Should need 0 classes");

// 5/10 attended, goal 75%
// Formula: (gt - 100a) / (100 - g)
// (75*10 - 100*5) / 25 = (750 - 500) / 25 = 250 / 25 = 10
// Verify: Attend 10 more => 15/20 = 75%. Correct.
assert(calculateClassesNeeded(5, 10, 75) === 10, "Should need 10 classes");

// Can Miss
// 10/10 attended, goal 75%
// Formula: (100a - gt) / g
// (1000 - 750) / 75 = 250 / 75 = 3.33 => 3
// Verify: Miss 3 => 10/13 = 76.9%. Miss 4 => 10/14 = 71.4%. Correct.
assert(calculateClassesCanMiss(10, 10, 75) === 3, "Should be able to miss 3 classes");

console.log("All math tests passed!");
