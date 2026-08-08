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

// ─── Create tables ───────────────────────────────────────────────────
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

// ─── Seed data (idempotent) ──────────────────────────────────────────
const seedStudents = db.prepare(`INSERT OR IGNORE INTO students VALUES (?, ?, ?)`);
const seedCourses  = db.prepare(`INSERT OR IGNORE INTO courses  VALUES (?, ?, ?)`);
const seedEnroll   = db.prepare(`INSERT OR IGNORE INTO enrollments VALUES (?, ?)`);

const seedAll = db.transaction(() => {
  // Students
  seedStudents.run('1', 'Alex Rivera',    21);
  seedStudents.run('2', 'Priya Sharma',   23);
  seedStudents.run('3', 'Jordan Lee',     20);

  // Courses
  seedCourses.run('c1', 'Intro to Computer Science', 'Dr. Chen');
  seedCourses.run('c2', 'Data Structures',            'Prof. Patel');
  seedCourses.run('c3', 'Web Development',            'Dr. Martinez');
  seedCourses.run('c4', 'Databases & SQL',             'Prof. Kim');
  seedCourses.run('c5', 'Algorithms',                 'Dr. Johnson');

  // Enrollments
  seedEnroll.run('1', 'c1');
  seedEnroll.run('1', 'c3');
  seedEnroll.run('2', 'c1');
  seedEnroll.run('2', 'c2');
  seedEnroll.run('2', 'c4');
  seedEnroll.run('3', 'c3');
  seedEnroll.run('3', 'c5');
});

seedAll();

// ─── Typed query helpers ─────────────────────────────────────────────
export interface StudentRow { id: string; name: string; age: number }
export interface CourseRow  { id: string; title: string; instructor: string }

export const queries = {
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

console.log('✅ SQLite database ready at', DB_PATH);
