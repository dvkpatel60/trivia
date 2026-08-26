// Server-authoritative game engine for Candlelight.
// Clients submit answers; the server grades, scores, and manages state.
//
// Deploy alongside kv.mjs at: netlify/functions/game.mjs
// Client calls it at:          /.netlify/functions/game

import { getStore } from "@netlify/blobs";
import { BANK } from "../bank.mjs";

const NS = "cndl";
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const store = getStore({ name: "candlelight-game", consistency: "strong" });

/* ── helpers ── */
const uid = () => Math.random().toString(36).slice(2, 10);
const norm = (s) => String(s).toUpperCase().replace(/[^A-Z]/g, "");
const shuffle = (a) => {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

const CODE_WORDS = [
  "NIFFLER","THESTRAL","MANDRAKE","BOGGART","PENSIEVE","PORTKEY",
  "GRINDYLOW","KNEAZLE","AUGUREY","BOWTRUCKLE","OCCAMY","DEMIGUISE",
  "MOONCALF","RUNESPOOR","HIPPOGRIFF","SNIDGET","CLABBERT","JOBBERKNOLL",
];

async function claimCode() {
  for (let i = 0; i < 12; i++) {
    const c =
      CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)] +
      "-" +
      (10 + Math.floor(Math.random() * 90));
    const existing = await store.get(c);
    if (!existing) return c;
  }
  return "GAME-" + uid().slice(0, 4).toUpperCase();
}

const PLAYER_COLORS = [
  "#e8b55c","#3f9c7d","#8878d6","#c2543a",
  "#4fa3c7","#c98bb0","#9bb04f","#d78a4a",
];

/* ── question generation (server-side, mirrors client logic) ── */
function pick(typeKey, n, used) {
  const pool = BANK[typeKey];
  if (!used[typeKey]) used[typeKey] = [];
  let avail = pool
    .map((_, i) => i)
    .filter((i) => !used[typeKey].includes(i));
  if (avail.length < n) {
    used[typeKey] = [];
    avail = pool.map((_, i) => i);
  }
  const chosen = shuffle(avail).slice(0, n);
  used[typeKey].push(...chosen);
  return chosen.map((i) => pool[i]);
}

function makeQuestion(type, used) {
  const one = (k) => pick(k, 1, used)[0];
  switch (type) {
    case "trivia": {
      const d = one("trivia");
      const idx = shuffle(d.o.map((_, i) => i));
      return { type, prompt: d.q, opts: idx.map((i) => d.o[i]), correct: idx.indexOf(d.a) };
    }
    case "tf": {
      const d = one("tf");
      return { type, prompt: d.q, correct: d.a, note: d.note || "" };
    }
    case "odd": {
      const d = one("odd");
      const idx = shuffle(d.items.map((_, i) => i));
      return { type, prompt: "Which one doesn't belong?", opts: idx.map((i) => d.items[i]), correct: idx.indexOf(d.a), why: d.why };
    }
    case "spells": {
      const set = pick("spells", 4, used);
      return {
        type, prompt: "Pair each spell with what it does.",
        left: set.map((x) => x.s),
        right: shuffle(set.map((x) => x.e)),
        truth: Object.fromEntries(set.map((x) => [x.s, x.e])),
      };
    }
    case "scramble": {
      const d = one("scramble");
      let sc = shuffle(d.w.split(""));
      if (sc.join("") === d.w) sc = sc.reverse();
      return { type, prompt: d.h, word: d.w, tiles: sc };
    }
    case "whoami": {
      const d = one("whoami");
      const idx = shuffle(d.o.map((_, i) => i));
      return { type, clues: d.clues, opts: idx.map((i) => d.o[i]), correct: idx.indexOf(d.a) };
    }
    case "sorting": {
      const set = pick("sorting", 3, used);
      return { type, prompt: "Sort each of them.", items: set };
    }
    case "sequence": {
      const d = one("sequence");
      let sc = shuffle(d.items.map((_, i) => i));
      if (sc.every((v, i) => v === i)) sc = sc.reverse();
      return { type, prompt: d.t, items: sc.map((i) => d.items[i]), truth: sc.map((i) => i) };
    }
  }
}

/* ── strip answers before sending to client ── */
function stripAnswers(q) {
  const out = { ...q };
  delete out.correct;
  delete out.truth;
  delete out.note;
  delete out.why;
  delete out.word;
  return out;
}

/* ── server-side grading ── */
function gradeAnswer(q, answer, elapsedMs) {
  if (!answer) return { fraction: 0, message: "No answer submitted." };

  let fraction = 0;
  let message = "";

  switch (q.type) {
    case "trivia":
    case "odd": {
      const ok = answer.choice === q.correct;
      fraction = ok ? 1 : 0;
      message = ok ? "" : q.type === "odd" ? q.why || "" : "";
      break;
    }
    case "tf": {
      const ok = answer.value === q.correct;
      fraction = ok ? 1 : 0;
      if (!ok) message = q.note ? q.note : `It's ${q.correct ? "true" : "false"}.`;
      break;
    }
    case "spells": {
      if (!answer.pairs || !Array.isArray(answer.pairs)) break;
      let right = 0;
      const map = {};
      answer.pairs.forEach(([s, e]) => { if (s && e) map[s] = e; });
      q.left.forEach((s) => { if (map[s] === q.truth[s]) right++; });
      fraction = right / q.left.length;
      message = `${right} of ${q.left.length} pairs correct.`;
      break;
    }
    case "scramble": {
      const ok = norm(answer.word || "") === norm(q.word);
      fraction = ok ? 1 : 0;
      message = ok ? "" : `The word was ${q.word}.`;
      break;
    }
    case "whoami": {
      const ok = answer.choice === q.correct;
      const clueIndex = Math.min(answer.clueIndex || 0, 2);
      const mult = [1, 0.7, 0.45];
      fraction = ok ? mult[clueIndex] : 0;
      message = ok ? `Solved on clue ${clueIndex + 1}.` : `It was ${q.opts[q.correct]}.`;
      break;
    }
    case "sorting": {
      if (!answer.order || !Array.isArray(answer.order)) break;
      let right = 0;
      answer.order.forEach((item, i) => {
        if (item === q.items[i].n) right++;
      });
      fraction = right / q.items.length;
      message = `${right} of ${q.items.length} sorted correctly.`;
      break;
    }
    case "sequence": {
      if (!answer.order || !Array.isArray(answer.order)) break;
      let right = 0;
      answer.order.forEach((itemIdx, pos) => {
        if (q.truth[itemIdx] === pos) right++;
      });
      fraction = right / q.items.length;
      message = `${right} of ${q.items.length} in the right place.`;
      break;
    }
  }

  return { fraction, message };
}

function scoreAnswer(cfg, fraction, elapsedMs, streak) {
  const base = Math.round(cfg.basePoints * fraction);
  let total = base;
  const lines = [`base     +${base}`];

  // speed bonus: up to +50% based on remaining time
  if (fraction > 0 && cfg.speedBonus && cfg.timerOn && elapsedMs != null) {
    const timeLimit = cfg.seconds * 1000;
    const remaining = Math.max(0, timeLimit - elapsedMs);
    const sp = Math.round(cfg.basePoints * 0.5 * (remaining / timeLimit) * fraction);
    if (sp > 0) { total += sp; lines.push(`speed    +${sp}`); }
  }

  // streak bonus: +25 per consecutive correct
  if (fraction >= 0.999) {
    streak++;
    if (cfg.streakBonus && streak > 1) {
      const sb = 25 * (streak - 1);
      total += sb;
      lines.push(`streak x${streak} +${sb}`);
    }
  } else {
    streak = 0;
  }

  return { total, streak, lines };
}

/* ── game state shape stored in Blobs ──
{
  code, host, status: "lobby"|"playing"|"done",
  round, cfg, createdAt,
  questions: { 0: [...], 1: [...] },
  players: { [id]: { id, name, color, joined, score, streak, answers: { 0: { done, answers, score, streak } } } }
}
*/

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body;
  try { body = await req.json(); } catch {
    return json({ error: "Body must be JSON" }, 400);
  }

  const { op } = body;

  try {
    switch (op) {
      /* ── create game ── */
      case "create": {
        const { hostId, hostName, cfg } = body;
        if (!hostId || !cfg) return json({ error: "hostId and cfg required" }, 400);

        const code = await claimCode();
        const game = {
          code,
          host: hostId,
          status: "lobby",
          round: 0,
          cfg,
          createdAt: Date.now(),
          questions: {},
          players: {
            [hostId]: {
              id: hostId,
              name: hostName || "Host",
              color: PLAYER_COLORS[0],
              joined: Date.now(),
              score: 0,
              streak: 0,
              answers: {},
            },
          },
        };
        await store.set(code, JSON.stringify(game));
        return json({ ok: true, code, game });
      }

      /* ── join game ── */
      case "join": {
        const { code, playerId, playerName } = body;
        if (!code || !playerId) return json({ error: "code and playerId required" }, 400);

        const raw = await store.get(code);
        if (!raw) return json({ error: "No game with that code." }, 404);
        const game = JSON.parse(raw);

        if (game.status === "done") return json({ error: "That game has already finished." }, 400);

        if (!game.players[playerId]) {
          const colorIndex = Object.keys(game.players).length % PLAYER_COLORS.length;
          game.players[playerId] = {
            id: playerId,
            name: playerName || "Player",
            color: PLAYER_COLORS[colorIndex],
            joined: Date.now(),
            score: 0,
            streak: 0,
            answers: {},
          };
          await store.set(code, JSON.stringify(game));
        } else {
          // update name if changed
          game.players[playerId].name = playerName || game.players[playerId].name;
          await store.set(code, JSON.stringify(game));
        }

        return json({ ok: true, game });
      }

      /* ── start first round ── */
      case "start": {
        const { code, hostId } = body;
        const raw = await store.get(code);
        if (!raw) return json({ error: "Game not found." }, 404);
        const game = JSON.parse(raw);
        if (game.host !== hostId) return json({ error: "Only the host can start." }, 403);

        const used = {};
        const qsPerPlayer = game.cfg.turnsPerPlayer;
        const total = qsPerPlayer;
        const qs = [];
        const chosen = Object.keys(BANK).filter((k) => game.cfg.types[k]);

        if (game.cfg.themedRounds) {
          const t = chosen[game.round % chosen.length];
          for (let i = 0; i < total; i++) qs.push(makeQuestion(t, used));
        } else {
          const order = [];
          while (order.length < total) order.push(...shuffle(chosen));
          for (let i = 0; i < total; i++) qs.push(makeQuestion(order[i], used));
        }

        game.questions[game.round] = qs;
        game.status = "playing";
        game.roundStartedAt = Date.now();
        await store.set(code, JSON.stringify(game));

        return json({ ok: true, game });
      }

      /* ── get game state ── */
      case "state": {
        const { code } = body;
        if (!code) return json({ error: "code required" }, 400);
        const raw = await store.get(code);
        if (!raw) return json({ error: "Game not found." }, 404);
        return json({ game: JSON.parse(raw) });
      }

      /* ── submit answers for a round ── */
      case "submit": {
        const { code, playerId, round, answers, elapsedMs } = body;
        if (!code || !playerId || round == null || !answers) {
          return json({ error: "code, playerId, round, and answers required" }, 400);
        }

        const raw = await store.get(code);
        if (!raw) return json({ error: "Game not found." }, 404);
        const game = JSON.parse(raw);

        const qs = game.questions[round];
        if (!qs) return json({ error: "Round not found." }, 404);
        if (game.status !== "playing") return json({ error: "Game is not in playing state." }, 400);

        const player = game.players[playerId];
        if (!player) return json({ error: "Player not in game." }, 404);

        // grade each answer server-side
        const results = [];
        let totalScore = 0;
        let streak = player.streak || 0;
        const roundConfig = { ...game.cfg };

        for (let i = 0; i < qs.length; i++) {
          const q = qs[i];
          const ans = answers[i];
          const { fraction, message } = gradeAnswer(q, ans?.answer || null, ans?.elapsedMs || null);
          const perAnswerElapsed = ans?.elapsedMs || null;
          const { total, streak: newStreak, lines } = scoreAnswer(roundConfig, fraction, perAnswerElapsed, streak);
          streak = newStreak;
          totalScore += total;
          results.push({ f: fraction, p: total, message, lines });
        }

        // store the result
        player.answers[round] = { done: true, results, score: totalScore, streak };
        player.score = (player.score || 0) + totalScore;
        player.streak = streak;

        await store.set(code, JSON.stringify(game));
        return json({ ok: true, results, totalScore, streak });
      }

      /* ── host closes round (reveal) ── */
      case "reveal": {
        const { code, hostId, round } = body;
        const raw = await store.get(code);
        if (!raw) return json({ error: "Game not found." }, 404);
        const game = JSON.parse(raw);
        if (game.host !== hostId) return json({ error: "Only the host can close rounds." }, 403);

        // grade any players who didn't submit (score = 0)
        const qs = game.questions[round];
        for (const pid of Object.keys(game.players)) {
          const p = game.players[pid];
          if (!p.answers[round]) {
            p.answers[round] = { done: true, results: qs.map(() => ({ f: 0, p: 0, message: "No answer." })), score: 0, streak: 0 };
          }
        }

        game.revealed = game.revealed || {};
        game.revealed[round] = true;
        await store.set(code, JSON.stringify(game));
        return json({ ok: true, game });
      }

      /* ── host advances to next round ── */
      case "next": {
        const { code, hostId } = body;
        const raw = await store.get(code);
        if (!raw) return json({ error: "Game not found." }, 404);
        const game = JSON.parse(raw);
        if (game.host !== hostId) return json({ error: "Only the host can advance." }, 403);

        const next = game.round + 1;
        if (next >= game.cfg.rounds) {
          game.status = "done";
          await store.set(code, JSON.stringify(game));
          return json({ ok: true, game, finished: true });
        }

        game.round = next;
        game.status = "playing";
        game.roundStartedAt = Date.now();

        // generate questions for the new round
        const used = {};
        const total = game.cfg.turnsPerPlayer;
        const qs = [];
        const chosen = Object.keys(BANK).filter((k) => game.cfg.types[k]);

        if (game.cfg.themedRounds) {
          const t = chosen[next % chosen.length];
          for (let i = 0; i < total; i++) qs.push(makeQuestion(t, used));
        } else {
          const order = [];
          while (order.length < total) order.push(...shuffle(chosen));
          for (let i = 0; i < total; i++) qs.push(makeQuestion(order[i], used));
        }

        game.questions[next] = qs;
        await store.set(code, JSON.stringify(game));
        return json({ ok: true, game });
      }

      /* ── cleanup old games ── */
      case "cleanup": {
        const { keys } = await store.list({ prefix: "" });
        let cleaned = 0;
        const now = Date.now();
        const maxAge = 4 * 60 * 60 * 1000; // 4 hours

        for (const { key } of keys) {
          try {
            const raw = await store.get(key);
            if (!raw) continue;
            const game = JSON.parse(raw);
            if (game.status === "done" && now - (game.createdAt || 0) > maxAge) {
              await store.delete(key);
              cleaned++;
            }
          } catch { /* skip corrupt entries */ }
        }
        return json({ ok: true, cleaned });
      }

      default:
        return json({ error: "Unknown op: " + op }, 400);
    }
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
};
