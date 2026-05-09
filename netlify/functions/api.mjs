import { getDatabase } from '@netlify/database';

const db = getDatabase();

export const config = { path: '/api/:action' };

// ── helpers ──
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getState(key) {
  const rows = await db.sql`SELECT value FROM app_state WHERE key = ${key}`;
  return rows.length ? JSON.parse(rows[0].value) : null;
}

async function setState(key, value) {
  await db.sql`
    INSERT INTO app_state (key, value) VALUES (${key}, ${JSON.stringify(value)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

// ── main handler ──
export default async function handler(req) {
  const url = new URL(req.url);
  const action = url.pathname.replace('/api/', '');
  const method = req.method;

  try {

    // ════════════════════════════════
    //  LOAD ALL STATE (app boot)
    // ════════════════════════════════
    if (action === 'load' && method === 'GET') {
      const [students, malams, attendance, malamAtt, drawHist, cleanHist] = await Promise.all([
        db.sql`SELECT * FROM students ORDER BY id`,
        db.sql`SELECT * FROM malams ORDER BY created_at`,
        db.sql`SELECT * FROM attendance ORDER BY date`,
        db.sql`SELECT * FROM malam_attendance ORDER BY date`,
        db.sql`SELECT * FROM draw_history ORDER BY created_at`,
        db.sql`SELECT * FROM clean_history ORDER BY created_at`,
      ]);

      // Rebuild attendance map { "YYYY-MM-DD": { morning: {...}, evening: {...} } }
      const attMap = {};
      for (const r of attendance) {
        if (!attMap[r.date]) attMap[r.date] = {};
        attMap[r.date][r.session] = { present: r.present_ids, note: r.note, savedAt: r.saved_at };
      }
      const malamAttMap = {};
      for (const r of malamAtt) {
        if (!malamAttMap[r.date]) malamAttMap[r.date] = {};
        malamAttMap[r.date][r.session] = { present: r.present_ids, note: r.note, savedAt: r.saved_at };
      }

      // App state
      const [drawPool, drawRound, drawFrom, drawTo, cleanPool, cleanRound, present] = await Promise.all([
        getState('draw_pool'), getState('draw_round'), getState('draw_from'),
        getState('draw_to'), getState('clean_pool'), getState('clean_round'), getState('present'),
      ]);

      return json({
        students: students.map(s => ({
          id: s.id, name: s.name, type: s.type,
          drawNum: s.draw_num, archived: s.archived,
        })),
        malams: malams.map(m => ({
          id: m.id, name: m.name, role: m.role,
          days: m.days, sessions: m.sessions,
        })),
        attendance: attMap,
        malamAttendance: malamAttMap,
        drawHistory: drawHist,
        cleanHistory: cleanHist,
        drawPool: drawPool || [],
        drawRound: drawRound || 1,
        drawFrom: drawFrom || 1,
        drawTo: drawTo || 20,
        cleanPool: cleanPool || [],
        cleanRound: cleanRound || 1,
        present: present || [],
        history: [
          ...drawHist.map(h => ({ type: 'draw', num: h.num, id: h.student_id, name: h.student_name, task: h.task, round: h.round, ts: h.created_at })),
          ...cleanHist.map(h => ({ type: 'clean', id: h.student_id, name: h.student_name, round: h.round, ts: h.created_at })),
        ].sort((a, b) => new Date(a.ts) - new Date(b.ts)),
      });
    }

    // ════════════════════════════════
    //  STUDENTS
    // ════════════════════════════════
    if (action === 'students' && method === 'POST') {
      const { id, name, type, drawNum } = await req.json();
      await db.sql`
        INSERT INTO students (id, name, type, draw_num, archived)
        VALUES (${id}, ${name || ''}, ${type || 'boy'}, ${drawNum || null}, false)
        ON CONFLICT (id) DO UPDATE SET name=${name||''}, type=${type||'boy'}, draw_num=${drawNum||null}
      `;
      return json({ ok: true });
    }

    if (action === 'students/archive' && method === 'POST') {
      const { id, archived } = await req.json();
      await db.sql`UPDATE students SET archived = ${archived} WHERE id = ${id}`;
      return json({ ok: true });
    }

    if (action === 'students/delete' && method === 'POST') {
      const { id } = await req.json();
      await db.sql`DELETE FROM students WHERE id = ${id}`;
      return json({ ok: true });
    }

    // ════════════════════════════════
    //  MALAMS
    // ════════════════════════════════
    if (action === 'malams' && method === 'POST') {
      const { id, name, role, days, sessions } = await req.json();
      await db.sql`
        INSERT INTO malams (id, name, role, days, sessions)
        VALUES (${id}, ${name}, ${role||''}, ${days||[6,0,1,2,3]}, ${sessions||['morning','evening']})
        ON CONFLICT (id) DO UPDATE SET name=${name}, role=${role||''}, days=${days||[6,0,1,2,3]}, sessions=${sessions||['morning','evening']}
      `;
      return json({ ok: true });
    }

    if (action === 'malams/delete' && method === 'POST') {
      const { id } = await req.json();
      await db.sql`DELETE FROM malams WHERE id = ${id}`;
      return json({ ok: true });
    }

    // ════════════════════════════════
    //  ATTENDANCE
    // ════════════════════════════════
    if (action === 'attendance' && method === 'POST') {
      const { date, session, present, note } = await req.json();
      await db.sql`
        INSERT INTO attendance (date, session, present_ids, note, saved_at)
        VALUES (${date}, ${session}, ${present}, ${note||''}, NOW())
        ON CONFLICT (date, session) DO UPDATE
          SET present_ids=${present}, note=${note||''}, saved_at=NOW()
      `;
      return json({ ok: true });
    }

    // ════════════════════════════════
    //  MALAM ATTENDANCE
    // ════════════════════════════════
    if (action === 'malam-attendance' && method === 'POST') {
      const { date, session, present, note } = await req.json();
      await db.sql`
        INSERT INTO malam_attendance (date, session, present_ids, note, saved_at)
        VALUES (${date}, ${session}, ${present}, ${note||''}, NOW())
        ON CONFLICT (date, session) DO UPDATE
          SET present_ids=${present}, note=${note||''}, saved_at=NOW()
      `;
      return json({ ok: true });
    }

    // ════════════════════════════════
    //  APP STATE (draw pool, present, etc.)
    // ════════════════════════════════
    if (action === 'state' && method === 'POST') {
      const body = await req.json();
      await Promise.all(
        Object.entries(body).map(([key, value]) => setState(key, value))
      );
      return json({ ok: true });
    }

    // ════════════════════════════════
    //  DRAW HISTORY
    // ════════════════════════════════
    if (action === 'draw-history' && method === 'POST') {
      const { num, studentId, studentName, task, round } = await req.json();
      await db.sql`
        INSERT INTO draw_history (num, student_id, student_name, task, round)
        VALUES (${num}, ${studentId||null}, ${studentName||null}, ${task||''}, ${round})
      `;
      return json({ ok: true });
    }

    // ════════════════════════════════
    //  CLEAN HISTORY
    // ════════════════════════════════
    if (action === 'clean-history' && method === 'POST') {
      const { studentId, studentName, round } = await req.json();
      await db.sql`
        INSERT INTO clean_history (student_id, student_name, round)
        VALUES (${studentId}, ${studentName||''}, ${round})
      `;
      return json({ ok: true });
    }

    // ════════════════════════════════
    //  BULK IMPORT students
    // ════════════════════════════════
    if (action === 'students/bulk' && method === 'POST') {
      const { students } = await req.json();
      for (const s of students) {
        await db.sql`
          INSERT INTO students (id, name, type, draw_num, archived)
          VALUES (${s.id}, ${s.name||''}, ${s.type||'boy'}, ${s.drawNum||null}, ${s.archived||false})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      return json({ ok: true, imported: students.length });
    }

    // ════════════════════════════════
    //  CLEAR ALL (danger zone)
    // ════════════════════════════════
    if (action === 'clear-all' && method === 'POST') {
      await db.sql`TRUNCATE students, malams, attendance, malam_attendance, draw_history, clean_history`;
      await db.sql`UPDATE app_state SET value='[]' WHERE key IN ('draw_pool','clean_pool','present')`;
      await db.sql`UPDATE app_state SET value='1' WHERE key IN ('draw_round','clean_round')`;
      return json({ ok: true });
    }

    return json({ error: 'Not found' }, 404);

  } catch (err) {
    console.error('API error:', err);
    return json({ error: err.message }, 500);
  }
}
