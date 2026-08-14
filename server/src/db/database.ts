import dns from 'dns';
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

// ─── Interfaces ──────────────────────────────────────────────────────
export interface StudentRow     { id: string; name: string; age: number }
export interface CourseRow      { id: string; title: string; instructor: string }
export interface CourseWithStudentId extends CourseRow { student_id: string; }
export interface PatientRow     { id: string; name: string; age: number }
export interface DoctorRow      { id: string; name: string; specialty: string }
export interface AppointmentRow { id: string; patient_id: string; doctor_id: string; date: string }

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

// ─── Hybrid Database Initialization ─────────────────────────────────
const isPg = Boolean(process.env.DATABASE_URL);
let sqliteDb: Database.Database | null = null;
let pgPool: Pool | null = null;

if (isPg) {
  console.log('⚡ Connecting to PostgreSQL / Supabase Cloud Database...');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  });

  pgPool.on('error', (err) => {
    console.error('⚠️ Unexpected PostgreSQL client error:', err.message);
  });
} else {
  const DATA_DIR = path.join(__dirname, '../../data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const DB_PATH = path.join(DATA_DIR, 'graphscope.sqlite');

  sqliteDb = new Database(DB_PATH);
  sqliteDb.pragma('journal_mode = WAL');

  // SQLite Table initialization & seeding
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, name TEXT NOT NULL, age INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, title TEXT NOT NULL, instructor TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS enrollments (
      student_id TEXT NOT NULL REFERENCES students(id),
      course_id TEXT NOT NULL REFERENCES courses(id),
      PRIMARY KEY (student_id, course_id)
    );
    CREATE TABLE IF NOT EXISTS doctors (id TEXT PRIMARY KEY, name TEXT NOT NULL, specialty TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS patients (id TEXT PRIMARY KEY, name TEXT NOT NULL, age INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id),
      doctor_id TEXT NOT NULL REFERENCES doctors(id),
      date TEXT NOT NULL
    );
  `);

  const seedAll = sqliteDb.transaction(() => {
    sqliteDb!.prepare(`INSERT OR IGNORE INTO students VALUES ('1', 'Alex Rivera', 21)`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO students VALUES ('2', 'Priya Sharma', 23)`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO students VALUES ('3', 'Jordan Lee', 20)`).run();

    sqliteDb!.prepare(`INSERT OR IGNORE INTO courses VALUES ('c1', 'Intro to Computer Science', 'Dr. Chen')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO courses VALUES ('c2', 'Data Structures', 'Prof. Patel')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO courses VALUES ('c3', 'Web Development', 'Dr. Martinez')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO courses VALUES ('c4', 'Databases & SQL', 'Prof. Kim')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO courses VALUES ('c5', 'Algorithms', 'Dr. Johnson')`).run();

    sqliteDb!.prepare(`INSERT OR IGNORE INTO enrollments VALUES ('1', 'c1')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO enrollments VALUES ('1', 'c3')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO enrollments VALUES ('2', 'c1')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO enrollments VALUES ('2', 'c2')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO enrollments VALUES ('2', 'c4')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO enrollments VALUES ('3', 'c3')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO enrollments VALUES ('3', 'c5')`).run();

    sqliteDb!.prepare(`INSERT OR IGNORE INTO doctors VALUES ('d1', 'Dr. Gregory House', 'Diagnostic Medicine')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO doctors VALUES ('d2', 'Dr. Beverly Crusher', 'General Medicine')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO doctors VALUES ('d3', 'Dr. Miranda Bailey', 'Cardiology')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO doctors VALUES ('d4', 'Dr. Meredith Grey', 'Neurology')`).run();

    sqliteDb!.prepare(`INSERT OR IGNORE INTO patients VALUES ('p1', 'Sarah Connor', 29)`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO patients VALUES ('p2', 'John Watson', 38)`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO patients VALUES ('p3', 'Elena Gilbert', 24)`).run();

    sqliteDb!.prepare(`INSERT OR IGNORE INTO appointments VALUES ('a1', 'p1', 'd1', '2025-03-12')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO appointments VALUES ('a2', 'p1', 'd2', '2025-04-05')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO appointments VALUES ('a3', 'p2', 'd3', '2025-03-20')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO appointments VALUES ('a4', 'p2', 'd1', '2025-05-10')`).run();
    sqliteDb!.prepare(`INSERT OR IGNORE INTO appointments VALUES ('a5', 'p3', 'd4', '2025-04-18')`).run();
  });
  seedAll();
  console.log('✅ SQLite local database ready at', DB_PATH);
}

// ─── Education Queries ───────────────────────────────────────────────
export const educationQueries = {
  async getStudent(id: string): Promise<StudentRow | undefined> {
    if (isPg) {
      const res = await pgPool!.query<StudentRow>('SELECT * FROM students WHERE id = $1', [id]);
      return res.rows[0];
    }
    return sqliteDb!.prepare<[string], StudentRow>('SELECT * FROM students WHERE id = ?').get(id);
  },

  async getAllStudents(): Promise<StudentRow[]> {
    if (isPg) {
      const res = await pgPool!.query<StudentRow>('SELECT * FROM students');
      return res.rows;
    }
    return sqliteDb!.prepare<[], StudentRow>('SELECT * FROM students').all();
  },

  async getCoursesForStudent(studentId: string): Promise<CourseRow[]> {
    if (isPg) {
      const res = await pgPool!.query<CourseRow>(
        `SELECT c.* FROM courses c JOIN enrollments e ON e.course_id = c.id WHERE e.student_id = $1`,
        [studentId]
      );
      return res.rows;
    }
    return sqliteDb!.prepare<[string], CourseRow>(
      `SELECT c.* FROM courses c JOIN enrollments e ON e.course_id = c.id WHERE e.student_id = ?`
    ).all(studentId);
  },

  async getBatchedCoursesForStudents(studentIds: string[]): Promise<CourseWithStudentId[]> {
    if (studentIds.length === 0) return [];
    if (isPg) {
      const res = await pgPool!.query<CourseWithStudentId>(
        `SELECT c.*, e.student_id
         FROM courses c
         JOIN enrollments e ON e.course_id = c.id
         WHERE e.student_id = ANY($1::text[])`,
        [studentIds]
      );
      return res.rows;
    }
    const placeholders = studentIds.map(() => '?').join(', ');
    return sqliteDb!.prepare<string[], CourseWithStudentId>(
      `SELECT c.*, e.student_id FROM courses c JOIN enrollments e ON e.course_id = c.id WHERE e.student_id IN (${placeholders})`
    ).all(...studentIds);
  },
};

// ─── Healthcare Queries ──────────────────────────────────────────────
export const healthcareQueries = {
  async getPatient(id: string): Promise<PatientRow | undefined> {
    if (isPg) {
      const res = await pgPool!.query<PatientRow>('SELECT * FROM patients WHERE id = $1', [id]);
      return res.rows[0];
    }
    return sqliteDb!.prepare<[string], PatientRow>('SELECT * FROM patients WHERE id = ?').get(id);
  },

  async getAllPatients(): Promise<PatientRow[]> {
    if (isPg) {
      const res = await pgPool!.query<PatientRow>('SELECT * FROM patients');
      return res.rows;
    }
    return sqliteDb!.prepare<[], PatientRow>('SELECT * FROM patients').all();
  },

  async getAppointmentsForPatient(patientId: string): Promise<AppointmentRow[]> {
    if (isPg) {
      const res = await pgPool!.query<AppointmentRow>('SELECT * FROM appointments WHERE patient_id = $1', [patientId]);
      return res.rows;
    }
    return sqliteDb!.prepare<[string], AppointmentRow>('SELECT * FROM appointments WHERE patient_id = ?').all(patientId);
  },

  async getDoctor(id: string): Promise<DoctorRow | undefined> {
    if (isPg) {
      const res = await pgPool!.query<DoctorRow>('SELECT * FROM doctors WHERE id = $1', [id]);
      return res.rows[0];
    }
    return sqliteDb!.prepare<[string], DoctorRow>('SELECT * FROM doctors WHERE id = ?').get(id);
  },
};

// ─── Education Mutations ─────────────────────────────────────────────
export const educationMutations = {
  async getEnrollmentSnapshot(studentId: string): Promise<EnrollmentSnapshot[]> {
    if (isPg) {
      const res = await pgPool!.query<EnrollmentSnapshot>(
        `SELECT e.student_id AS "studentId", e.course_id AS "courseId",
                s.name AS "studentName", c.title AS "courseName"
         FROM enrollments e
         JOIN students s ON s.id = e.student_id
         JOIN courses  c ON c.id = e.course_id
         WHERE e.student_id = $1
         ORDER BY c.title`,
        [studentId]
      );
      return res.rows;
    }
    return sqliteDb!.prepare<[string], EnrollmentSnapshot>(
      `SELECT e.student_id AS studentId, e.course_id AS courseId,
              s.name AS studentName, c.title AS courseName
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       JOIN courses  c ON c.id = e.course_id
       WHERE e.student_id = ?
       ORDER BY c.title`
    ).all(studentId);
  },

  async enroll(studentId: string, courseId: string): Promise<void> {
    if (isPg) {
      await pgPool!.query(
        `INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [studentId, courseId]
      );
      return;
    }
    sqliteDb!.prepare(`INSERT OR IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)`).run(studentId, courseId);
  },

  async unenroll(studentId: string, courseId: string): Promise<void> {
    if (isPg) {
      await pgPool!.query(`DELETE FROM enrollments WHERE student_id = $1 AND course_id = $2`, [studentId, courseId]);
      return;
    }
    sqliteDb!.prepare(`DELETE FROM enrollments WHERE student_id = ? AND course_id = ?`).run(studentId, courseId);
  },

  async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    if (isPg) {
      const res = await pgPool!.query<{ cnt: string }>(
        `SELECT COUNT(*) AS cnt FROM enrollments WHERE student_id = $1 AND course_id = $2`,
        [studentId, courseId]
      );
      return Number(res.rows[0]?.cnt ?? 0) > 0;
    }
    const row = sqliteDb!.prepare<[string, string], { cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM enrollments WHERE student_id = ? AND course_id = ?`
    ).get(studentId, courseId);
    return (row?.cnt ?? 0) > 0;
  },
};

// ─── Healthcare Mutations ────────────────────────────────────────────
export const healthcareMutations = {
  async getAppointmentSnapshot(patientId: string): Promise<AppointmentSnapshot[]> {
    if (isPg) {
      const res = await pgPool!.query<AppointmentSnapshot>(
        `SELECT a.id, a.patient_id AS "patientId", a.doctor_id AS "doctorId", a.date,
                p.name AS "patientName", d.name AS "doctorName"
         FROM appointments a
         JOIN patients p ON p.id = a.patient_id
         JOIN doctors  d ON d.id = a.doctor_id
         WHERE a.patient_id = $1
         ORDER BY a.date`,
        [patientId]
      );
      return res.rows;
    }
    return sqliteDb!.prepare<[string], AppointmentSnapshot>(
      `SELECT a.id, a.patient_id AS patientId, a.doctor_id AS doctorId, a.date,
              p.name AS patientName, d.name AS doctorName
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       JOIN doctors  d ON d.id = a.doctor_id
       WHERE a.patient_id = ?
       ORDER BY a.date`
    ).all(patientId);
  },

  async scheduleAppointment(patientId: string, doctorId: string, date: string): Promise<void> {
    if (isPg) {
      const id = 'a_' + Math.random().toString(36).substring(2, 10);
      await pgPool!.query(
        `INSERT INTO appointments (id, patient_id, doctor_id, date) VALUES ($1, $2, $3, $4)`,
        [id, patientId, doctorId, date]
      );
      return;
    }
    sqliteDb!.prepare(
      `INSERT INTO appointments (id, patient_id, doctor_id, date) VALUES (lower(hex(randomblob(4))), ?, ?, ?)`
    ).run(patientId, doctorId, date);
  },

  async cancelAppointment(appointmentId: string): Promise<{ patient_id: string } | undefined> {
    if (isPg) {
      const res = await pgPool!.query<{ patient_id: string }>(
        `DELETE FROM appointments WHERE id = $1 RETURNING patient_id`,
        [appointmentId]
      );
      return res.rows[0];
    }
    return sqliteDb!.prepare<[string], { patient_id: string }>(
      `DELETE FROM appointments WHERE id = ? RETURNING patient_id`
    ).get(appointmentId);
  },

  async getAppointmentPatientId(appointmentId: string): Promise<{ patient_id: string } | undefined> {
    if (isPg) {
      const res = await pgPool!.query<{ patient_id: string }>(
        `SELECT patient_id FROM appointments WHERE id = $1`,
        [appointmentId]
      );
      return res.rows[0];
    }
    return sqliteDb!.prepare<[string], { patient_id: string }>(
      `SELECT patient_id FROM appointments WHERE id = ?`
    ).get(appointmentId);
  },
};

export const queries = educationQueries;
