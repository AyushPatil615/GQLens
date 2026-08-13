import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ─── DB file location ────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'graphscope.sqlite');
export const db = new Database(DB_PATH);

// ─── Enable WAL for performance ──────────────────────────────────────
db.pragma('journal_mode = WAL');

// ─── Education tables ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS courses (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    instructor TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    student_id TEXT NOT NULL,
    course_id  TEXT NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id)  REFERENCES courses(id)
  );
`);

// ─── Healthcare tables ───────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS doctors (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    specialty TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS patients (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id         TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    doctor_id  TEXT NOT NULL,
    date       TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id)
  );
`);

// ─── Seed data (idempotent) ──────────────────────────────────────────
const seedStudents  = db.prepare(`INSERT OR IGNORE INTO students VALUES (?, ?, ?)`);
const seedCourses   = db.prepare(`INSERT OR IGNORE INTO courses  VALUES (?, ?, ?)`);
const seedEnroll    = db.prepare(`INSERT OR IGNORE INTO enrollments VALUES (?, ?)`);
const seedDoctors   = db.prepare(`INSERT OR IGNORE INTO doctors VALUES (?, ?, ?)`);
const seedPatients  = db.prepare(`INSERT OR IGNORE INTO patients VALUES (?, ?, ?)`);
const seedAppointment = db.prepare(`INSERT OR IGNORE INTO appointments VALUES (?, ?, ?, ?)`);

const seedAll = db.transaction(() => {
  // ── Education ──
  seedStudents.run('1', 'Alex Rivera',  21);
  seedStudents.run('2', 'Priya Sharma', 23);
  seedStudents.run('3', 'Jordan Lee',   20);

  seedCourses.run('c1', 'Intro to Computer Science', 'Dr. Chen');
  seedCourses.run('c2', 'Data Structures',            'Prof. Patel');
  seedCourses.run('c3', 'Web Development',            'Dr. Martinez');
  seedCourses.run('c4', 'Databases & SQL',             'Prof. Kim');
  seedCourses.run('c5', 'Algorithms',                 'Dr. Johnson');

  seedEnroll.run('1', 'c1');
  seedEnroll.run('1', 'c3');
  seedEnroll.run('2', 'c1');
  seedEnroll.run('2', 'c2');
  seedEnroll.run('2', 'c4');
  seedEnroll.run('3', 'c3');
  seedEnroll.run('3', 'c5');

  // ── Healthcare ──
  seedDoctors.run('d1', 'Dr. Gregory House',    'Diagnostic Medicine');
  seedDoctors.run('d2', 'Dr. Beverly Crusher',  'General Medicine');
  seedDoctors.run('d3', 'Dr. Miranda Bailey',   'Cardiology');
  seedDoctors.run('d4', 'Dr. Meredith Grey',    'Neurology');

  seedPatients.run('p1', 'Sarah Connor',  29);
  seedPatients.run('p2', 'John Watson',   38);
  seedPatients.run('p3', 'Elena Gilbert', 24);

  seedAppointment.run('a1', 'p1', 'd1', '2025-03-12');
  seedAppointment.run('a2', 'p1', 'd2', '2025-04-05');
  seedAppointment.run('a3', 'p2', 'd3', '2025-03-20');
  seedAppointment.run('a4', 'p2', 'd1', '2025-05-10');
  seedAppointment.run('a5', 'p3', 'd4', '2025-04-18');
});

seedAll();

// ─── Education typed query helpers ───────────────────────────────────
export interface StudentRow     { id: string; name: string; age: number }
export interface CourseRow      { id: string; title: string; instructor: string }

export interface CourseWithStudentId extends CourseRow {
  student_id: string;
}

export const educationQueries = {
  getStudent: db.prepare<[string], StudentRow>(
    `SELECT * FROM students WHERE id = ?`
  ),
  getAllStudents: db.prepare<[], StudentRow>(
    `SELECT * FROM students`
  ),
  getCoursesForStudent: db.prepare<[string], CourseRow>(
    `SELECT c.* FROM courses c
     JOIN enrollments e ON e.course_id = c.id
     WHERE e.student_id = ?`
  ),
  /** Batched: get all courses for multiple student IDs in ONE query (DataLoader pattern) */
  getBatchedCoursesForStudents(studentIds: string[]): CourseWithStudentId[] {
    if (studentIds.length === 0) return [];
    const placeholders = studentIds.map(() => '?').join(', ');
    const stmt = db.prepare<string[], CourseWithStudentId>(
      `SELECT c.*, e.student_id
       FROM courses c
       JOIN enrollments e ON e.course_id = c.id
       WHERE e.student_id IN (${placeholders})`
    );
    return stmt.all(...studentIds);
  },
};

// ─── Healthcare typed query helpers ──────────────────────────────────
export interface PatientRow     { id: string; name: string; age: number }
export interface DoctorRow      { id: string; name: string; specialty: string }
export interface AppointmentRow { id: string; patient_id: string; doctor_id: string; date: string }

export const healthcareQueries = {
  getPatient: db.prepare<[string], PatientRow>(
    `SELECT * FROM patients WHERE id = ?`
  ),
  getAllPatients: db.prepare<[], PatientRow>(
    `SELECT * FROM patients`
  ),
  getAppointmentsForPatient: db.prepare<[string], AppointmentRow>(
    `SELECT * FROM appointments WHERE patient_id = ?`
  ),
  getDoctor: db.prepare<[string], DoctorRow>(
    `SELECT * FROM doctors WHERE id = ?`
  ),
};


// ─── Enriched row types for mutation snapshots ───────────────────────────────
export interface EnrollmentSnapshot {
  studentId:   string;
  courseId:    string;
  studentName: string;
  courseName:  string;
}

export interface AppointmentSnapshot {
  id:          string;
  patientId:   string;
  doctorId:    string;
  date:        string;
  patientName: string;
  doctorName:  string;
}

// ─── Education mutation helpers ───────────────────────────────────────────────
export const educationMutations = {
  /** Enriched snapshot of all enrollments for a student */
  getEnrollmentSnapshot: db.prepare<[string], EnrollmentSnapshot>(
    `SELECT e.student_id AS studentId, e.course_id AS courseId,
            s.name AS studentName, c.title AS courseName
     FROM enrollments e
     JOIN students s ON s.id = e.student_id
     JOIN courses  c ON c.id = e.course_id
     WHERE e.student_id = ?
     ORDER BY c.title`
  ),
  enroll: db.prepare<[string, string], void>(
    `INSERT OR IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)`
  ),
  unenroll: db.prepare<[string, string], void>(
    `DELETE FROM enrollments WHERE student_id = ? AND course_id = ?`
  ),
  /** Returns true if the enrollment exists */
  isEnrolled: db.prepare<[string, string], { cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM enrollments WHERE student_id = ? AND course_id = ?`
  ),
};

// ─── Healthcare mutation helpers ──────────────────────────────────────────────
export const healthcareMutations = {
  /** Enriched snapshot of all appointments for a patient */
  getAppointmentSnapshot: db.prepare<[string], AppointmentSnapshot>(
    `SELECT a.id, a.patient_id AS patientId, a.doctor_id AS doctorId, a.date,
            p.name AS patientName, d.name AS doctorName
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN doctors  d ON d.id = a.doctor_id
     WHERE a.patient_id = ?
     ORDER BY a.date`
  ),
  scheduleAppointment: db.prepare<[string, string, string], void>(
    `INSERT INTO appointments (id, patient_id, doctor_id, date)
     VALUES (lower(hex(randomblob(4))), ?, ?, ?)`
  ),
  cancelAppointment: db.prepare<[string], { patient_id: string }>(
    `DELETE FROM appointments WHERE id = ? RETURNING patient_id`
  ),
  /** Get patient_id for an appointment (needed to fetch snapshot after cancel) */
  getAppointmentPatientId: db.prepare<[string], { patient_id: string }>(
    `SELECT patient_id FROM appointments WHERE id = ?`
  ),
};

// Legacy export alias so existing resolver imports don't break
export const queries = educationQueries;

console.log('✅ SQLite database ready at', DB_PATH);
