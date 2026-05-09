import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 });

// No config.path — function is at /.netlify/functions/api
// We handle routing via query param: /api?action=load etc
// index.html will call /.netlify/functions/api?action=load

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', type TEXT NOT NULL DEFAULT 'boy', draw_num INTEGER, archived BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS malams (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT DEFAULT '', days INTEGER[] NOT NULL DEFAULT '{6,0,1,2,3}', sessions TEXT[] NOT NULL DEFAULT '{"morning","evening"}', created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS attendance (id SERIAL PRIMARY KEY, date TEXT NOT NULL, session TEXT NOT NULL, present_ids TEXT[] NOT NULL DEFAULT '{}', note TEXT DEFAULT '', saved_at TIMESTAMP DEFAULT NOW(), UNIQUE(date,session));
      CREATE TABLE IF NOT EXISTS malam_attendance (id SERIAL PRIMARY KEY, date TEXT NOT NULL, session TEXT NOT NULL, present_ids TEXT[] NOT NULL DEFAULT '{}', note TEXT DEFAULT '', saved_at TIMESTAMP DEFAULT NOW(), UNIQUE(date,session));
      CREATE TABLE IF NOT EXISTS draw_history (id SERIAL PRIMARY KEY, num INTEGER NOT NULL, student_id TEXT, student_name TEXT, task TEXT DEFAULT '', round INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS clean_history (id SERIAL PRIMARY KEY, student_id TEXT NOT NULL, student_name TEXT, round INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      INSERT INTO app_state(key,value) VALUES('draw_pool','[]'),('draw_round','1'),('draw_from','1'),('draw_to','20'),('clean_pool','[]'),('clean_round','1'),('present','[]') ON CONFLICT(key) DO NOTHING;
    `);
  } finally { client.release(); }
}
initDB().catch(e => console.error('DB init error:', e));

function jsonRes(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers: {'Content-Type':'application/json'} });
}
async function getState(key) {
  const c = await pool.connect();
  try { const r = await c.query('SELECT value FROM app_state WHERE key=$1',[key]); return r.rows.length ? JSON.parse(r.rows[0].value) : null; }
  finally { c.release(); }
}
async function setState(key, value) {
  const c = await pool.connect();
  try { await c.query('INSERT INTO app_state(key,value)VALUES($1,$2)ON CONFLICT(key)DO UPDATE SET value=EXCLUDED.value',[key,JSON.stringify(value)]); }
  finally { c.release(); }
}

export default async function handler(req) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || '';
  const method = req.method;

  try {
    if (action==='load' && method==='GET') {
      const c = await pool.connect();
      let students,malams,attendance,malamAtt,drawHist,cleanHist;
      try {
        [students,malams,attendance,malamAtt,drawHist,cleanHist] = await Promise.all([
          c.query('SELECT * FROM students ORDER BY id').then(r=>r.rows),
          c.query('SELECT * FROM malams ORDER BY created_at').then(r=>r.rows),
          c.query('SELECT * FROM attendance ORDER BY date').then(r=>r.rows),
          c.query('SELECT * FROM malam_attendance ORDER BY date').then(r=>r.rows),
          c.query('SELECT * FROM draw_history ORDER BY created_at').then(r=>r.rows),
          c.query('SELECT * FROM clean_history ORDER BY created_at').then(r=>r.rows),
        ]);
      } finally { c.release(); }

      const attMap={};
      for(const r of attendance){if(!attMap[r.date])attMap[r.date]={};attMap[r.date][r.session]={present:r.present_ids,note:r.note,savedAt:r.saved_at};}
      const malamAttMap={};
      for(const r of malamAtt){if(!malamAttMap[r.date])malamAttMap[r.date]={};malamAttMap[r.date][r.session]={present:r.present_ids,note:r.note,savedAt:r.saved_at};}
      const [drawPool,drawRound,drawFrom,drawTo,cleanPool,cleanRound,present]=await Promise.all([getState('draw_pool'),getState('draw_round'),getState('draw_from'),getState('draw_to'),getState('clean_pool'),getState('clean_round'),getState('present')]);

      return jsonRes({
        students:students.map(s=>({id:s.id,name:s.name,type:s.type,drawNum:s.draw_num,archived:s.archived})),
        malams:malams.map(m=>({id:m.id,name:m.name,role:m.role,days:m.days,sessions:m.sessions})),
        attendance:attMap, malamAttendance:malamAttMap,
        drawPool:drawPool||[], drawRound:drawRound||1, drawFrom:drawFrom||1, drawTo:drawTo||20,
        cleanPool:cleanPool||[], cleanRound:cleanRound||1, present:present||[],
        history:[...drawHist.map(h=>({type:'draw',num:h.num,id:h.student_id,name:h.student_name,task:h.task,round:h.round,ts:h.created_at})),...cleanHist.map(h=>({type:'clean',id:h.student_id,name:h.student_name,round:h.round,ts:h.created_at}))].sort((a,b)=>new Date(a.ts)-new Date(b.ts)),
      });
    }

    if (action==='students' && method==='POST') {
      const {id,name,type,drawNum}=await req.json();
      const c=await pool.connect();
      try{await c.query('INSERT INTO students(id,name,type,draw_num,archived)VALUES($1,$2,$3,$4,false)ON CONFLICT(id)DO UPDATE SET name=$2,type=$3,draw_num=$4',[id,name||'',type||'boy',drawNum||null]);}finally{c.release();}
      return jsonRes({ok:true});
    }
    if (action==='students/archive' && method==='POST') {
      const {id,archived}=await req.json();
      const c=await pool.connect();
      try{await c.query('UPDATE students SET archived=$1 WHERE id=$2',[archived,id]);}finally{c.release();}
      return jsonRes({ok:true});
    }
    if (action==='students/delete' && method==='POST') {
      const {id}=await req.json();
      const c=await pool.connect();
      try{await c.query('DELETE FROM students WHERE id=$1',[id]);}finally{c.release();}
      return jsonRes({ok:true});
    }
    if (action==='students/bulk' && method==='POST') {
      const {students}=await req.json();
      const c=await pool.connect();
      try{for(const s of students){await c.query('INSERT INTO students(id,name,type,draw_num,archived)VALUES($1,$2,$3,$4,$5)ON CONFLICT(id)DO NOTHING',[s.id,s.name||'',s.type||'boy',s.drawNum||null,s.archived||false]);}}finally{c.release();}
      return jsonRes({ok:true,imported:students.length});
    }
    if (action==='malams' && method==='POST') {
      const {id,name,role,days,sessions}=await req.json();
      const c=await pool.connect();
      try{await c.query('INSERT INTO malams(id,name,role,days,sessions)VALUES($1,$2,$3,$4,$5)ON CONFLICT(id)DO UPDATE SET name=$2,role=$3,days=$4,sessions=$5',[id,name,role||'',days||[6,0,1,2,3],sessions||['morning','evening']]);}finally{c.release();}
      return jsonRes({ok:true});
    }
    if (action==='malams/delete' && method==='POST') {
      const {id}=await req.json();
      const c=await pool.connect();
      try{await c.query('DELETE FROM malams WHERE id=$1',[id]);}finally{c.release();}
      return jsonRes({ok:true});
    }
    if (action==='attendance' && method==='POST') {
      const {date,session,present,note}=await req.json();
      const c=await pool.connect();
      try{await c.query('INSERT INTO attendance(date,session,present_ids,note,saved_at)VALUES($1,$2,$3,$4,NOW())ON CONFLICT(date,session)DO UPDATE SET present_ids=$3,note=$4,saved_at=NOW()',[date,session,present,note||'']);}finally{c.release();}
      return jsonRes({ok:true});
    }
    if (action==='malam-attendance' && method==='POST') {
      const {date,session,present,note}=await req.json();
      const c=await pool.connect();
      try{await c.query('INSERT INTO malam_attendance(date,session,present_ids,note,saved_at)VALUES($1,$2,$3,$4,NOW())ON CONFLICT(date,session)DO UPDATE SET present_ids=$3,note=$4,saved_at=NOW()',[date,session,present,note||'']);}finally{c.release();}
      return jsonRes({ok:true});
    }
    if (action==='state' && method==='POST') {
      const body=await req.json();
      await Promise.all(Object.entries(body).map(([k,v])=>setState(k,v)));
      return jsonRes({ok:true});
    }
    if (action==='draw-history' && method==='POST') {
      const {num,studentId,studentName,task,round}=await req.json();
      const c=await pool.connect();
      try{await c.query('INSERT INTO draw_history(num,student_id,student_name,task,round)VALUES($1,$2,$3,$4,$5)',[num,studentId||null,studentName||null,task||'',round]);}finally{c.release();}
      return jsonRes({ok:true});
    }
    if (action==='clean-history' && method==='POST') {
      const {studentId,studentName,round}=await req.json();
      const c=await pool.connect();
      try{await c.query('INSERT INTO clean_history(student_id,student_name,round)VALUES($1,$2,$3)',[studentId,studentName||'',round]);}finally{c.release();}
      return jsonRes({ok:true});
    }
    if (action==='clear-all' && method==='POST') {
      const c=await pool.connect();
      try{await c.query('TRUNCATE students,malams,attendance,malam_attendance,draw_history,clean_history');await c.query("UPDATE app_state SET value='[]' WHERE key IN('draw_pool','clean_pool','present')");await c.query("UPDATE app_state SET value='1' WHERE key IN('draw_round','clean_round')");}finally{c.release();}
      return jsonRes({ok:true});
    }

    // ── BULK MIGRATE (single request) ──
    if (action==='migrate' && method==='POST') {
      const { students=[], malams=[], attendance=[], malamAttendance=[], appState={} } = await req.json();
      const c = await pool.connect();
      try {
        // Students
        for (const s of students) {
          await c.query(
            'INSERT INTO students(id,name,type,draw_num,archived)VALUES($1,$2,$3,$4,$5)ON CONFLICT(id)DO UPDATE SET name=$2,type=$3,draw_num=$4,archived=$5',
            [s.id, s.name||'', s.type||'boy', s.drawNum||null, s.archived||false]
          );
        }
        // Malams
        for (const m of malams) {
          await c.query(
            'INSERT INTO malams(id,name,role,days,sessions)VALUES($1,$2,$3,$4,$5)ON CONFLICT(id)DO UPDATE SET name=$2,role=$3,days=$4,sessions=$5',
            [m.id, m.name, m.role||'', m.days||[6,0,1,2,3], m.sessions||['morning','evening']]
          );
        }
        // Attendance
        for (const a of attendance) {
          await c.query(
            'INSERT INTO attendance(date,session,present_ids,note,saved_at)VALUES($1,$2,$3,$4,NOW())ON CONFLICT(date,session)DO UPDATE SET present_ids=$3,note=$4',
            [a.date, a.session, a.present, a.note||'']
          );
        }
        // Malam attendance
        for (const a of malamAttendance) {
          await c.query(
            'INSERT INTO malam_attendance(date,session,present_ids,note,saved_at)VALUES($1,$2,$3,$4,NOW())ON CONFLICT(date,session)DO UPDATE SET present_ids=$3,note=$4',
            [a.date, a.session, a.present, a.note||'']
          );
        }
        // App state
        for (const [k,v] of Object.entries(appState)) {
          await c.query('INSERT INTO app_state(key,value)VALUES($1,$2)ON CONFLICT(key)DO UPDATE SET value=EXCLUDED.value',[k,JSON.stringify(v)]);
        }
      } finally { c.release(); }
      return jsonRes({ ok: true, students: students.length, malams: malams.length, attendance: attendance.length });
    }

    return jsonRes({error:'Unknown action: '+action},404);
  } catch(err) {
    console.error('API error:',err);
    return jsonRes({error:err.message},500);
  }
}
