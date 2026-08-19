import { Pool } from 'pg';

async function seedPostgres() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is missing.');
    console.error('Please set DATABASE_URL (e.g., from your Supabase connection string) before running seed:postgres.');
    process.exit(1);
  }

  console.log('🔄 Connecting to PostgreSQL database...');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }, // Required for Supabase cloud connection
  });

  const client = await pool.connect();

  try {
    console.log('📦 Creating tables...');

    // ── Education Tables ──
    await client.query(`
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
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        PRIMARY KEY (student_id, course_id)
      );
    `);

    // ── Healthcare Tables ──
    await client.query(`
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
        patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id  TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        date       TEXT NOT NULL
      );

      -- ── Enable Row-Level Security (RLS) to secure against public PostgREST exposure ──
      ALTER TABLE students ENABLE ROW LEVEL SECURITY;
      ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
      ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
      ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
    `);

    console.log('🌱 Seeding initial data...');

    // ── Education Seed Data ──
    await client.query(`
      INSERT INTO students (id, name, age) VALUES
        ('1', 'Alex Rivera', 21),
        ('2', 'Priya Sharma', 23),
        ('3', 'Jordan Lee', 20)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO courses (id, title, instructor) VALUES
        ('c1', 'Intro to Computer Science', 'Dr. Chen'),
        ('c2', 'Data Structures', 'Prof. Patel'),
        ('c3', 'Web Development', 'Dr. Martinez'),
        ('c4', 'Databases & SQL', 'Prof. Kim'),
        ('c5', 'Algorithms', 'Dr. Johnson')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO enrollments (student_id, course_id) VALUES
        ('1', 'c1'), ('1', 'c3'),
        ('2', 'c1'), ('2', 'c2'), ('2', 'c4'),
        ('3', 'c3'), ('3', 'c5')
      ON CONFLICT DO NOTHING;
    `);

    // ── Healthcare Seed Data ──
    await client.query(`
      INSERT INTO doctors (id, name, specialty) VALUES
        ('d1', 'Dr. Gregory House', 'Diagnostic Medicine'),
        ('d2', 'Dr. Beverly Crusher', 'General Medicine'),
        ('d3', 'Dr. Miranda Bailey', 'Cardiology'),
        ('d4', 'Dr. Meredith Grey', 'Neurology')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO patients (id, name, age) VALUES
        ('p1', 'Sarah Connor', 29),
        ('p2', 'John Watson', 38),
        ('p3', 'Elena Gilbert', 24)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO appointments (id, patient_id, doctor_id, date) VALUES
        ('a1', 'p1', 'd1', '2025-03-12'),
        ('a2', 'p1', 'd2', '2025-04-05'),
        ('a3', 'p2', 'd3', '2025-03-20'),
        ('a4', 'p2', 'd1', '2025-05-10'),
        ('a5', 'p3', 'd4', '2025-04-18')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ Supabase PostgreSQL Database successfully created and seeded!');
  } catch (err) {
    console.error('❌ Error seeding PostgreSQL database:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedPostgres();
