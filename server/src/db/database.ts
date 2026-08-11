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

// Legacy export alias so existing resolver imports don't break
export const queries = educationQueries;

console.log('✅ SQLite database ready at', DB_PATH);

