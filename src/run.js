// 局内成长：经验宝石、升级三选一、兵器 / 战法 / 祝福、宝箱（老虎机）。
// 普通脚本，在主脚本之前加载；只在被调用时才用到主脚本里的全局（S、P、hit、mult…）。
// 结构参考异世界幸存者 src/run.js：兵器 3 格、战法 3 格、祝福 5 格，兵器战法 5 级，满了只出升级。

const RUN_MAX = { g: 1, w: 3, s: 3, b: 5 };
const CARD = {
  // ---- 专属（金框，不占格子）----
  lance: { t: 'g', nm: '骑枪', ic: '矛', d: ['刺正前方 100° 内的敌人，伤害靠马速', '伤害 +30%', '枪更长：射程 +25%', '出枪更快', '满级「贯阵」：冲锋速度下一枪贯穿前方一条线'] },
  // ---- 兵器（蓝框）----
  sabre: { t: 'w', nm: '马刀', ic: '刀', d: ['冲过人群时顺手劈两侧（速度 40% 以上才出刀）', '伤害 +30%', '刀光更长', '砍得更快', '满级「劈斩」：冲锋速度下砍飞敌人，飞出去的人会撞倒后面的人'] },
  bow: { t: 'w', nm: '骑弓', ic: '弓', d: ['自动射最近的敌人', '伤害 +30%', '多 1 支箭', '射得更快', '满级：回马箭，向后多射 2 支，可穿透'] },
  flail: { t: 'w', nm: '流星锤', ic: '锤', d: ['铁锤绕着身体旋转', '伤害 +30%', '多 1 个锤', '半径 +25%', '满级：再多 1 个，锤更大'] },
  jav: { t: 'w', nm: '标枪', ic: '枪', d: ['向前投出，穿透 3 个；马越快飞越远', '伤害 +30%', '多投 1 支', '投得更快', '满级：无限穿透，落地炸开'] },
  // ---- 战法（紫框）----
  horn: { t: 's', nm: '冲锋号', ic: '号', d: ['每 14 秒：全队 3 秒内极速 +25%、加速更猛', '冷却 -2 秒', '持续 +1 秒', '冷却 -2 秒', '满级：号响时亲卫回满血'] },
  hoof: { t: 's', nm: '铁蹄', ic: '蹄', d: ['冲锋速度下，马蹄持续踩伤身边的敌人', '伤害 +40%', '范围 +30%', '亲卫也会踩', '满级：把小兵踩飞'] },
  whirl: { t: 's', nm: '旋风斩', ic: '旋', d: ['每 7 秒：横扫身边一圈，越快越痛', '伤害 +40%', '范围 +25%', '冷却 -2 秒', '满级：连扫两圈'] },
  rain: { t: 's', nm: '箭雨', ic: '雨', d: ['每 9 秒：朝敌人最密处落下 3 轮箭雨', '伤害 +40%', '范围 +30%', '冷却 -2.5 秒', '满级：同时落两处'] },
  // ---- 祝福（灰框）：部曲 + 被动 ----
  str: { t: 'b', nm: '力量', ic: '力', max: 5, d: '所有伤害 +10%' },
  vit: { t: 'b', nm: '体魄', ic: '体', max: 5, d: '生命上限 +15%，并回血' },
  surge: { t: 'b', nm: '蓄势', ic: '势', max: 3, d: '一直保持冲锋速度，伤害每秒 +10%，最多 +30% / 45% / 60%；掉到 60% 以下清零' },
  turn: { t: 'b', nm: '回马', ic: '回', max: 3, d: '快速调头后 2 / 2.5 / 3 秒内，伤害按满速算' },
  haste: { t: 'b', nm: '急速', ic: '速', max: 5, d: '兵器、战法冷却 -6%' },
  regen: { t: 'b', nm: '再生', ic: '愈', max: 5, d: '每秒回复 0.6 生命' },
  guard: { t: 'b', nm: '部曲', ic: '卫', max: 3, d: '亲卫骑兵 +1' },
  elite: { t: 'b', nm: '精锐', ic: '精', max: 3, d: '亲卫生命 +25%、伤害 +25%，并回满血' },
  // 什么都满了时的保底
  food: { t: 'x', nm: '军粮', ic: '粮', max: 99, d: '回复 40% 生命' },
};
const T_NAME = { g: '专属', w: '兵器', s: '战法', b: '祝福', x: '补给' };
const T_FRAME = { g: 3, w: 1, s: 2, b: 0, x: 3 };
const lvOf = k => (S.run[CARD[k].t] || {})[k] || 0;
const maxOf = k => CARD[k].max || 5;
const runNeed = lv => Math.round((6 + lv * 4 + lv * lv * 0.35) * (P.xpNeed || 1));

function runReset() {
  if (typeof LVUI !== 'undefined' && LVUI) LVUI.hidden = true;
  if (typeof SLOT !== 'undefined' && SLOT) SLOT.hidden = true;
  S.run = { lv: 1, xp: 0, need: runNeed(1), g: { lance: 1 }, w: {}, s: {}, b: {}, surge: 0, hm: 0, hist: [], hmCd: 0, cd: {}, gems: [], chests: [], shots: [], fx: [], jobs: [], ang: 0, queue: 0, rr: 0, lastLv: -9, horn: 0, chestN: 0 };
}
// ---- 派生数值 ----
const runAtk = () => S.run ? (1 + 0.1 * (S.run.b.str || 0)) * (1 + S.run.surge) : 1;
const runCdm = () => S.run ? 1 - 0.06 * (S.run.b.haste || 0) : 1;
const runSpd = () => S.run && S.run.horn > 0 ? 1.25 : 1;   // 局内不永久改马的手感，只有战法的短时爆发
const runAcc = () => S.run && S.run.horn > 0 ? 1.8 : 1;
const runTurn = () => 1;
const runElite = () => S.run ? 1 + 0.25 * (S.run.b.elite || 0) : 1;

// ---- 击杀掉落 ----
const GEM_V = { grunt: 1, pha: 1, cav: 3, brute: 5, char: 3 };
function runKill(e) {
  const R = S.run; if (!R || S.demo) return;
  const v = GEM_V[e.type] || 1;
  if (R.gems.length < 350) R.gems.push({ x: e.x + rand(-6, 6), y: e.y + rand(-6, 6), v });
  else R.gems[(Math.random() * R.gems.length) | 0].v += v;
  if (e.type === 'brute' && Math.random() < 0.35) R.chests.push({ x: e.x, y: e.y });
}

// ---- 每帧 ----
function runUpdate(dt) {
  const R = S.run; if (!R || S.demo) return;
  const L = S.h;
  // 宝石：靠近就吸过来
  for (const g of R.gems) {
    const dx = L.x - g.x, dy = L.y - g.y, d = Math.hypot(dx, dy);
    if (d < 110 || g.fly) { g.fly = true; const sp = 420 + L.v; g.x += dx / (d || 1) * sp * dt; g.y += dy / (d || 1) * sp * dt; }
    if (d < 24) { R.xp += g.v; g.got = true; }
  }
  R.gems = R.gems.filter(g => !g.got);
  while (R.xp >= R.need) { R.xp -= R.need; R.lv++; R.need = runNeed(R.lv); R.queue++; if (R.lv % 3 === 0) R.rr = Math.min(2, R.rr + 1); }
  for (const c of R.chests) if (Math.hypot(L.x - c.x, L.y - c.y) < 34) { c.got = true; openChest(); }
  R.chests = R.chests.filter(c => !c.got);
  if (R.queue > 0 && !S.paused && S.t - R.lastLv > 0.6) { R.queue--; R.lastLv = S.t; openLevelUp(); }
  // 再生
  if (R.b.regen) L.hp = Math.min(L.max, L.hp + 0.6 * R.b.regen * dt);
  if (R.horn > 0) R.horn -= dt;
  // 延迟动作（第二刀、箭雨的后几轮…）
  for (const j of R.jobs) { j.t -= dt; if (j.t <= 0) { j.f(); j.done = true; } }
  R.jobs = R.jobs.filter(j => !j.done);
  lanceUpd(R.g.lance, dt);
  // 蓄势：保持冲锋叠伤害，掉到 60% 以下清零
  if (R.b.surge) { const r = ratio(L); if (r >= P.charge) R.surge = Math.min([0, .3, .45, .6][R.b.surge], R.surge + 0.1 * dt); else if (r < 0.6) R.surge = 0; }
  // 回马：1.5 秒内马头转过 150° 以上
  if (R.hm > 0) R.hm -= dt;
  if (R.hmCd > 0) R.hmCd -= dt;
  if (R.b.turn) {
    R.hist.push({ t: S.t, a: L.a }); while (R.hist.length && R.hist[0].t < S.t - 1.5) R.hist.shift();
    if (R.hmCd <= 0 && L.v > P.maxSpeed * 0.3 && R.hist.some(h => Math.abs(wrap(L.a - h.a)) > 2.6)) {
      R.hm = [0, 2, 2.5, 3][R.b.turn]; R.hmCd = 3; R.hist = [];
      addNum(L.x, L.y - 40, '回马！', '#ffd860', true);
    }
  }
  // 劈斩：被砍飞的人撞倒路上的人
  for (const e of S.en) if (e.dead && e.missile && e.fly > 0) for (const o of S.en) {
    if (o.dead || o === e || (o.msT || 0) > S.t) continue;
    const dx = o.x - e.x, dy = o.y - e.y;
    if (dx * dx + dy * dy < (o.r + 14) ** 2) { o.msT = S.t + 0.5; hit(o, e.missile, e.fvx / 400, e.fvy / 400, 200); }
  }
  for (const k in R.w) WEAP[k](R.w[k], dt);
  for (const k in R.s) TACT[k](R.s[k], dt);
  // 飞行物
  for (const s of R.shots) {
    s.t -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
    for (const e of S.en) {
      if (e.dead || s.hit.has(e)) continue;
      const dx = e.x - s.x, dy = e.y - s.y;
      if (dx * dx + dy * dy < (e.r + s.r) ** 2) {
        s.hit.add(e); hit(e, s.dmg, s.vx / s.sp, s.vy / s.sp, 160);
        if (s.pierce-- <= 0) { s.t = 0; break; }
      }
    }
    if (s.t <= 0 && s.boom) aoe(s.x, s.y, 60, s.dmg * 0.8, 200, '#ffb040');
  }
  R.shots = R.shots.filter(s => s.t > 0);
  for (const f of R.fx) f.t += dt;
  R.fx = R.fx.filter(f => f.t < f.d);
}
const cdReady = (k, base, dt) => { const R = S.run; R.cd[k] = (R.cd[k] || 0) - dt; if (R.cd[k] > 0) return false; R.cd[k] = base * runCdm(); return true; };
function aoe(x, y, r, dmg, kp, col) {
  for (const e of S.en) {
    if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy);
    if (d < r + e.r) hit(e, dmg, dx / (d || 1), dy / (d || 1), kp);
  }
  S.run.fx.push({ k: 'ring', x, y, r, t: 0, d: 0.35, col });
}
const anyNear = (x, y, r) => S.en.some(e => !e.dead && Math.abs(e.x - x) < r && Math.abs(e.y - y) < r);

// ---- 兵器 ----
const WEAP = {
  sabre(lv, dt) {
    // 冲过人群时顺手劈：马身两侧一条长刀光，速度 40% 以上才出刀
    const L = S.h; if (ratio(L) < 0.4) return;
    const c = Math.cos(L.a), s = Math.sin(L.a), f0 = -30, f1 = 55 * (lv >= 3 ? 1.5 : 1), l0 = 12, l1 = 70;
    const inZone = e => { const dx = e.x - L.x, dy = e.y - L.y, f = dx * c + dy * s, l = Math.abs(-dx * s + dy * c); return f > f0 - e.r && f < f1 + e.r && l > l0 - e.r && l < l1 + e.r; };
    const R = S.run; R.cd.sabre = (R.cd.sabre || 0) - dt;
    if (R.cd.sabre > 0) return;
    const tg = S.en.filter(e => !e.dead && Math.abs(e.x - L.x) < 140 && Math.abs(e.y - L.y) < 140 && inZone(e));
    if (!tg.length) return;
    R.cd.sabre = (lv >= 4 ? 0.35 : 0.5) * runCdm();
    const chg = lv >= 5 && ratio(L) >= P.charge, dmg = 8 * (lv >= 2 ? 1.3 : 1) * mult(L) * (chg ? 1.5 : 1);
    for (const e of tg) {
      const dx = e.x - L.x, dy = e.y - L.y, sd = (-dx * s + dy * c) > 0 ? 1 : -1;
      hit(e, dmg, -s * sd * 0.8 + c * 0.6, c * sd * 0.8 + s * 0.6, chg ? 560 : 220);
      if (chg && e.dead && e.type === 'grunt') e.missile = dmg * 0.5;
    }
    const sides = new Set(tg.map(e => ((-(e.x - L.x) * s + (e.y - L.y) * c) > 0 ? 1 : -1)));
    for (const sd of sides) S.run.fx.push({ k: 'sw', x: L.x, y: L.y, a: L.a, sd, f0, f1, l: 40, t: 0, d: 0.2 });
  },
  bow(lv, dt) {
    const L = S.h;
    if (!anyNear(L.x, L.y, 480)) return;
    if (!cdReady('bow', lv >= 4 ? 0.8 : 1.1, dt)) return;
    const n = lv >= 3 ? 2 : 1, tg = S.en.filter(e => !e.dead && Math.abs(e.x - L.x) < 480 && Math.abs(e.y - L.y) < 480)
      .sort((a, b) => (a.x - L.x) ** 2 + (a.y - L.y) ** 2 - (b.x - L.x) ** 2 - (b.y - L.y) ** 2).slice(0, n);
    const dmg = 9 * (lv >= 2 ? 1.3 : 1);
    for (const e of tg) shoot(L.x, L.y, Math.atan2(e.y - L.y, e.x - L.x), 760, 0.8, dmg, lv >= 5 ? 2 : 0, 6, 'arrow');
    if (lv >= 5) for (const da of [-0.25, 0.25]) shoot(L.x, L.y, L.a + Math.PI + da, 760, 0.7, dmg, 2, 6, 'arrow');
  },
  flail(lv, dt) {
    const L = S.h, R = S.run, n = 1 + (lv >= 3) + (lv >= 5), rad = 78 * (lv >= 4 ? 1.25 : 1), br = lv >= 5 ? 20 : 14;
    R.ang += 3.6 * dt;
    R.balls = [];
    for (let i = 0; i < n; i++) {
      const a = R.ang + i * TAU / n, x = L.x + Math.cos(a) * rad, y = L.y + Math.sin(a) * rad;
      R.balls.push({ x, y, r: br });
      for (const e of S.en) {
        if (e.dead || (e.flT || 0) > S.t) continue;
        const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy);
        if (d < br + e.r) { e.flT = S.t + 0.35; hit(e, 7 * (lv >= 2 ? 1.3 : 1), dx / (d || 1), dy / (d || 1), 180); }
      }
    }
  },
  jav(lv, dt) {
    const L = S.h;
    if (!cdReady('jav', lv >= 4 ? 1.15 : 1.6, dt)) return;
    const n = lv >= 3 ? 2 : 1, dmg = 12 * (lv >= 2 ? 1.3 : 1) * (1 + ratio(L) * 0.5);
    for (let i = 0; i < n; i++) shoot(L.x, L.y, L.a + (n > 1 ? (i - 0.5) * 0.16 : 0), 520 + L.v, 0.75, dmg, lv >= 5 ? 999 : 3, 8, 'jav', lv >= 5);
  },
};
// ---- 骑枪（专属）：只刺正前方 100°，伤害靠马速 ----
function lanceUpd(lv, dt) {
  const L = S.h, R = S.run, reach = 110 * (lv >= 3 ? 1.25 : 1), half = 50 * Math.PI / 180;
  const c = Math.cos(L.a), s = Math.sin(L.a);
  R.cd.lance = (R.cd.lance || 0) - dt;
  if (R.cd.lance > 0) return;
  const inCone = (e, rr) => { const dx = e.x - L.x, dy = e.y - L.y, d = Math.hypot(dx, dy); if (d > rr + e.r || d < 1) return d < 1; return Math.abs(wrap(Math.atan2(dy, dx) - L.a)) < half + Math.atan2(e.r, d); };
  const tg = S.en.filter(e => !e.dead && Math.abs(e.x - L.x) < reach + 30 && Math.abs(e.y - L.y) < reach + 30 && inCone(e, reach));
  const pierce = lv >= 5 && ratio(L) >= P.charge;
  if (!tg.length && !pierce) return;
  if (!tg.length && pierce && !anyNear(L.x + c * 150, L.y + s * 150, 160)) return;
  R.cd.lance = (lv >= 4 ? 0.45 : 0.6) * runCdm();
  const dmg = 14 * (lv >= 2 ? 1.3 : 1) * mult(L);
  for (const e of tg) hit(e, dmg, c, s, 260);
  let len = reach;
  if (pierce) {   // 贯阵：前方 300 一条线
    len = 300;
    for (const e of S.en) {
      if (e.dead || tg.includes(e)) continue;
      const dx = e.x - L.x, dy = e.y - L.y, f = dx * c + dy * s, l = Math.abs(-dx * s + dy * c);
      if (f > 0 && f < 300 && l < 18 + e.r) hit(e, dmg * 0.8, c, s, 300);
    }
  }
  R.fx.push({ k: 'thrust', x: L.x, y: L.y, a: L.a, len, t: 0, d: pierce ? 0.22 : 0.14 });
}
function shoot(x, y, a, sp, t, dmg, pierce, r, k, boom) {
  S.run.shots.push({ k, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, sp, t, dmg, pierce, r, boom, hit: new Set() });
}

// ---- 战法 ----
const TACT = {
  horn(lv, dt) {
    if (!cdReady('horn', 14 - 2 * (lv >= 2) - 2 * (lv >= 4), dt)) return;
    S.run.horn = 3 + (lv >= 3);
    addNum(S.h.x, S.h.y - 40, '冲锋号！', '#ffd860', true);
    S.run.fx.push({ k: 'ring', x: S.h.x, y: S.h.y, r: 160, t: 0, d: 0.5, col: '#ffd860' });
    if (lv >= 5) for (const g of S.g) g.hp = g.max;
  },
  hoof(lv, dt) {
    if (!cdReady('hoof', 0.4, dt)) return;
    const r = 44 * (lv >= 3 ? 1.3 : 1), dmg = 5 * (lv >= 2 ? 1.4 : 1), kp = lv >= 5 ? 320 : 60;
    for (const o of lv >= 4 ? [S.h, ...S.g] : [S.h]) {
      if (ratio(o) < P.charge) continue;
      for (const e of S.en) {
        if (e.dead) continue;
        const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy);
        if (d < r + e.r) hit(e, dmg, dx / (d || 1), dy / (d || 1), e.type === 'grunt' ? kp : 60);
      }
      S.run.fx.push({ k: 'ring', x: o.x, y: o.y, r, t: 0, d: 0.25, col: '#c8a070' });
    }
  },
  whirl(lv, dt) {
    const L = S.h;
    if (!anyNear(L.x, L.y, 150)) return;
    if (!cdReady('whirl', 7 - 2 * (lv >= 4), dt)) return;
    const go = () => aoe(L.x, L.y, 110 * (lv >= 3 ? 1.25 : 1), 16 * (lv >= 2 ? 1.4 : 1) * mult(L), 280, '#e8f0ff');
    go(); if (lv >= 5) S.run.jobs.push({ t: 0.35, f: go });
  },
  rain(lv, dt) {
    const L = S.h;
    if (!anyNear(L.x, L.y, 600)) return;
    if (!cdReady('rain', 9 - 2.5 * (lv >= 4), dt)) return;
    const near = S.en.filter(e => !e.dead && Math.hypot(e.x - L.x, e.y - L.y) < 650);
    const pick = () => {   // 随机抽一些敌人，选身边最挤的那个
      let best = null, bn = -1;
      for (let i = 0; i < 14 && near.length; i++) {
        const c = near[(Math.random() * near.length) | 0];
        let n = 0; for (const e of near) if (Math.abs(e.x - c.x) < 90 && Math.abs(e.y - c.y) < 90) n++;
        if (n > bn) { bn = n; best = c; }
      }
      return best;
    };
    const r = 85 * (lv >= 3 ? 1.3 : 1), dmg = 10 * (lv >= 2 ? 1.4 : 1);
    for (let q = 0; q < (lv >= 5 ? 2 : 1); q++) {
      const c = pick(); if (!c) return;
      const x = c.x, y = c.y;
      S.run.fx.push({ k: 'mark', x, y, r, t: 0, d: 1.2 });
      for (let w = 0; w < 3; w++) S.run.jobs.push({ t: 0.5 + w * 0.28, f: () => { aoe(x, y, r, dmg, 120, '#d8c8a0'); S.run.fx.push({ k: 'arrows', x, y, r, t: 0, d: 0.3 }); } });
    }
  },
};

// ---- 选卡 ----
function runOwnedN(t) { return Object.keys(S.run[t]).length; }
function runOptions(onlyUp) {
  const R = S.run, c = [];
  for (const k in CARD) {
    const d = CARD[k], t = d.t; if (t === 'x') continue;
    if (t === 'g') { const l = R.g[k] || 0; if (l > 0 && l < maxOf(k)) c.push({ k, w: 1.3 }); continue; }
    const l = R[t][k] || 0;
    if (l > 0 && l < maxOf(k)) c.push({ k, w: 1.2 });
    else if (!l && !onlyUp && runOwnedN(t) < RUN_MAX[t]) c.push({ k, w: 1 });
  }
  return c;
}
function pickN(cands, n) {
  const out = [], pool = cands.slice();
  while (out.length < n && pool.length) {
    let s = 0; for (const o of pool) s += o.w;
    let r = Math.random() * s, i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].w; if (r <= 0) break; }
    out.push(pool[i].k); pool.splice(i, 1);
  }
  return out;
}
function rollLevel() {
  const R = S.run;
  let c = runOptions(false);
  if (!runOwnedN('w')) c = c.filter(o => CARD[o.k].t === 'w');   // 第一次升级：先给一把兵器
  const ks = pickN(c, 3);
  while (ks.length < 3 && !ks.includes('food')) ks.push('food');
  return ks;
}
function applyCard(k) {
  const R = S.run, d = CARD[k], L = S.h;
  if (d.t === 'x') { L.hp = Math.min(L.max, L.hp + L.max * 0.4); return; }
  const l = (R[d.t][k] || 0) + 1; R[d.t][k] = l;
  if (k === 'vit') { const m = Math.round(100 * (1 + 0.15 * l)); L.hp = Math.min(m, L.hp + m - L.max); L.max = m; }
  if (k === 'guard') { const n = S.g.length + 1; setGuards(n); }
  if (k === 'guard' || k === 'elite') for (const g of S.g) { const m = Math.round(60 * runElite()); if (k === 'elite' || g.max !== m) { g.max = m; g.hp = m; } }
}
function cardDesc(k) {
  const d = CARD[k], l = lvOf(k);
  if (typeof d.d === 'string') return d.d;
  return l ? d.d[l] : d.d[0];
}

// ---- 界面：样式 ----
(function () {
  const st = document.createElement('style');
  st.textContent = `
#lvup,#slot{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:#05080e8c;font-family:"Noto Serif CJK SC","Songti SC","SimSun",serif;color:#fff;user-select:none;-webkit-user-select:none}
#lvup[hidden],#slot[hidden]{display:none}
#lvup .b2{width:min(640px,96vw);display:flex;flex-direction:column;align-items:center;gap:8px}
#lvup .scroll{width:min(460px,86vw);aspect-ratio:700/131;background:url(assets/ui/buttons_0.png) center/100% 100%;display:grid;place-items:center;font-size:clamp(20px,5.5vw,28px);font-weight:900;color:#5a2e0e;image-rendering:pixelated}
#lvup .sub{color:#ffe7a8;text-shadow:0 1px 3px #000;font-size:14px}
#lvup .cards{display:flex;gap:min(12px,2vw);justify-content:center;width:100%}
#lvup button.c2{all:unset;display:block;cursor:pointer;width:min(200px,30vw);transition:transform .1s}
#lvup button.c2:hover,#lvup button.c2:focus{transform:translateY(-5px);filter:drop-shadow(0 0 8px #ffd860)}
#lvup .cf{display:block;position:relative;margin-top:22px;width:100%;aspect-ratio:180/290;background:center/100% 100% no-repeat;image-rendering:pixelated}
#lvup .cn{position:absolute;top:-20px;left:-10%;right:-10%;text-align:center;color:#ffe7a8;text-shadow:0 2px 2px #000;font-weight:900;font-size:clamp(14px,3.8vw,19px);white-space:nowrap}
#lvup .ty{position:absolute;top:7.4%;left:30%;right:30%;height:5%;display:grid;place-items:center;font:900 clamp(9px,2.3vw,11px) system-ui,sans-serif;border-radius:3px;color:#fff;text-shadow:0 1px 1px #0008}
.ty_w{background:#2f5fb8}.ty_s{background:#6a3fa8}.ty_b{background:#5e6670}.ty_x{background:#b88a1a}
#lvup .nw{position:absolute;top:1%;right:5%;transform:rotate(8deg);padding:0 5px;background:#c8323a;border-radius:3px;color:#fff;font:900 10px/15px system-ui,sans-serif}
#lvup .ci{position:absolute;left:20%;right:20%;top:22%;height:28%;display:grid;place-items:center;font-size:clamp(30px,9vw,52px);font-weight:900;color:#5a3a14}
#lvup .st{position:absolute;top:53%;left:0;right:0;text-align:center;color:#7a5a2a;font:700 clamp(10px,2.6vw,13px) system-ui,sans-serif}
#lvup .cd{position:absolute;top:68.8%;left:18%;right:18%;bottom:16.6%;display:block;text-align:center;word-break:break-all;font-size:clamp(10px,2.7vw,13px);line-height:1.25;color:#3a2410;overflow:hidden}
#lvup .btns{display:flex;gap:10px;margin-top:6px}
#lvup .pb{all:unset;cursor:pointer;width:min(130px,32vw);aspect-ratio:360/135;background:center/100% 100%;display:grid;place-items:center;color:#fff;font:900 16px system-ui,sans-serif;text-shadow:0 2px #0008;image-rendering:pixelated}
#lvup .pb.green{background-image:url(assets/ui/buttons_1.png)}#lvup .pb.gray{background-image:url(assets/ui/buttons_3.png)}#lvup .pb:disabled{filter:grayscale(1) brightness(.7);cursor:default}
#lvup .own{display:flex;gap:5px;flex-wrap:wrap;justify-content:center;max-width:96vw}
#lvup .sl{position:relative;width:36px;height:36px;background:url(assets/ui/buttons_9.png) center/100% 100%;display:grid;place-items:center;color:#f6db94;font-weight:900;font-size:16px;image-rendering:pixelated}
#lvup .sl b{position:absolute;right:2px;bottom:0;font:700 10px sans-serif;color:#ffd166;text-shadow:0 1px 2px #000}
#lvup .sl.e{opacity:.35}
#lvup .cd.out{position:static;display:block;margin-top:4px;padding:4px 3px;min-height:3.4em;background:#0b1a38d9;border:1px solid #e2cb8766;border-radius:6px;color:#f3ead2;font-size:11px;line-height:1.25}
@media (max-width:560px){#lvup .cards{gap:4px}#lvup button.c2{width:32vw}#lvup .cf{aspect-ratio:180/360}#lvup .cd{font-size:10.5px;line-height:1.18}}
@media (max-height:460px){#lvup .b2{gap:4px}#lvup .scroll{width:min(320px,60vw)}#lvup button.c2{width:min(150px,24vw)}#lvup .cf{margin-top:18px}#lvup .own{display:none}}
#slot .m{position:relative;width:min(380px,74vw);aspect-ratio:760/544;margin-top:40px;background:url(assets/ui/slot_body.png) center/100% 100% no-repeat;image-rendering:pixelated}
#slot .sign{position:absolute;left:-2%;right:-2%;top:-15%;height:19%;display:flex;align-items:center;justify-content:center;background:url(assets/ui/slot_sign.png) center/100% 100% no-repeat;color:#ffd96a;font-size:18px;letter-spacing:3px;text-shadow:0 2px 0 #000;font-weight:900}
#slot .reels{position:absolute;left:15.5%;width:69%;top:40%;height:34%;display:flex;gap:4px;padding:4px;box-sizing:border-box}
#slot .reel{flex:1;overflow:hidden;background:url(assets/ui/slot_cell.png) center/100% 100% no-repeat;position:relative}
#slot .strip{position:absolute;left:0;right:0;top:0}
#slot .cell{height:var(--h);box-sizing:border-box;padding:10% 8%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#3a2410;font-size:12px;font-weight:700;text-align:center;line-height:1.2}
#slot .cell .g{font-size:28px;line-height:34px;font-weight:900;color:#5a3a14}
#slot .scr{position:absolute;left:0;right:0;top:104%;min-height:19%;display:flex;flex-wrap:wrap;gap:2px 12px;align-items:center;justify-content:center;background:url(assets/ui/slot_bar.png) center/100% 100% no-repeat;color:#ffe9a8;font-size:14px;text-shadow:0 2px 0 #000;padding:6px 9%;box-sizing:border-box}
#slot .scr span{white-space:nowrap}
#slot .lever{position:absolute;right:-15%;top:12%;width:13%;height:62%;background:url(assets/ui/slot_lever_up.png) center/contain no-repeat}
#slot .lever.dn{background-image:url(assets/ui/slot_lever_dn.png);top:30%}
#slot .fx{position:absolute;pointer-events:none;width:32%;aspect-ratio:1;background:center/contain no-repeat;animation:sfx 1s ease-out forwards}
@keyframes sfx{0%{opacity:0;transform:scale(.4) translateY(20px)}30%{opacity:1}100%{opacity:0;transform:scale(1.2) translateY(-30px)}}
#slot .tip{position:absolute;left:0;right:0;top:135%;color:#ffe9b0;text-align:center;font-size:12px}`;
  document.head.append(st);
})();

// ---- 界面：升级三选一 ----
let LVUI = null, LVCUR = [];
function pauseGame() { S.paused = true; if (typeof joy !== 'undefined') { joy.on = false; joy.id = null; } for (const k in keys) keys[k] = false; }
function openLevelUp() {
  if (!LVUI) { LVUI = document.createElement('div'); LVUI.id = 'lvup'; LVUI.hidden = true; document.body.append(LVUI); }
  pauseGame();
  LVCUR = rollLevel();
  renderLevel();
}
function cardHTML(k, i) {
  const d = CARD[k], l = lvOf(k), nl = l + 1;
  const st = d.t === 'x' ? '' : `Lv ${l ? l + ' → ' + nl : 1}${nl >= maxOf(k) ? ' · 满级' : ''}`;
  return `<button class="c2" data-i="${i}"><span class="cf" style="background-image:url(assets/ui/card_${T_FRAME[d.t]}.png)"><span class="cn">${d.nm}</span>${l ? '' : d.t === 'x' ? '' : '<span class="nw">NEW</span>'}<span class="ty ty_${d.t}">${T_NAME[d.t]}</span><span class="ci">${d.ic}</span><span class="st">${st}</span><span class="cd">${cardDesc(k)}</span></span></button>`;
}
function ownHTML() {
  const R = S.run, row = t => {
    const ks = Object.keys(R[t]);
    let h = ks.map(k => `<span class="sl" title="${CARD[k].nm}">${CARD[k].ic}<b>${R[t][k]}</b></span>`).join('');
    for (let i = ks.length; i < RUN_MAX[t]; i++) h += '<span class="sl e"></span>';
    return h;
  };
  return `<div class="own">${row('g')}<span style="width:8px"></span>${row('w')}<span style="width:8px"></span>${row('s')}<span style="width:8px"></span>${row('b')}</div>`;
}
function renderLevel() {
  const R = S.run;
  LVUI.innerHTML = `<div class="b2"><div class="scroll">升到 ${R.lv} 级</div><div class="sub">选择一张（键盘 1 / 2 / 3）</div><div class="cards">${LVCUR.map(cardHTML).join('')}</div>
<div class="btns"><button class="pb green" data-a="rr" ${R.rr > 0 ? '' : 'disabled'}>重抽 ×${R.rr}</button><button class="pb gray" data-a="skip">跳过</button></div>${ownHTML()}</div>`;
  LVUI.hidden = false;
  fitDesc();
  LVUI.querySelectorAll('button.c2').forEach(b => b.onclick = () => chooseLevel(+b.dataset.i));
  LVUI.querySelector('[data-a=rr]').onclick = () => { if (R.rr > 0) { R.rr--; LVCUR = rollLevel(); renderLevel(); } };
  LVUI.querySelector('[data-a=skip]').onclick = closeLevel;
}
function fitDesc() {   // 说明放不下就缩小字；还放不下就挪到卡下面
  for (const d of LVUI.querySelectorAll('.cd')) {
    let f = parseFloat(getComputedStyle(d).fontSize);
    while ((d.scrollHeight > d.clientHeight + 1 || d.scrollWidth > d.clientWidth + 1) && f > 9) { f -= 0.5; d.style.fontSize = f + 'px'; }
    if (d.scrollHeight > d.clientHeight + 1) { d.style.fontSize = ''; d.classList.add('out'); d.closest('button').append(d); }
  }
}
function chooseLevel(i) { const k = LVCUR[i]; if (!k) return; applyCard(k); closeLevel(); }
function closeLevel() { LVUI.hidden = true; S.paused = false; S.run.lastLv = S.t; }
addEventListener('keydown', e => {
  if (!LVUI || LVUI.hidden) return;
  if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') { e.stopImmediatePropagation(); chooseLevel(+e.code.slice(5) - 1); }
  else if (e.code === 'KeyR') LVUI.querySelector('[data-a=rr]').click();
}, true);

// ---- 宝箱：老虎机 ----
let SLOT = null;
function openChest(forceN) {
  const R = S.run;
  R.chestN++;
  const fixed = [1, 3, 1, 5];   // 前 4 个固定 1-3-1-5，之后随机
  let n = forceN || (R.chestN <= fixed.length ? fixed[R.chestN - 1] : (Math.random() < 0.08 ? 5 : Math.random() < 0.25 ? 3 : 1));
  const got = [];
  for (let i = 0; i < n; i++) {
    let c = runOptions(true);
    if (!c.length) c = runOptions(false);
    const k = pickN(c, 1)[0] || 'food';
    applyCard(k); got.push(k);
  }
  pauseGame();
  slotShow(`宝箱 × ${n}`, got, () => { S.paused = false; });
}
function slotShow(title, got, done) {
  if (!SLOT) { SLOT = document.createElement('div'); SLOT.id = 'slot'; SLOT.hidden = true; document.body.append(SLOT); }
  const sl = SLOT, pool = Object.keys(CARD).filter(k => k !== 'food');
  sl.innerHTML = `<div class="m"><div class="sign">${title}</div><div class="reels">${[0, 1, 2].map(() => '<div class="reel"><div class="strip"></div></div>').join('')}</div><div class="scr">转动中…</div><div class="lever dn"></div><div class="tip">点击跳过</div></div>`;
  sl.hidden = false;
  const cell = k => k ? `<div class="cell"><span class="g">${CARD[k].ic}</span><span>${CARD[k].nm}${CARD[k].t !== 'x' ? ' Lv' + lvOf(k) : ''}</span></div>` : '<div class="cell"><span class="g">★</span></div>';
  const show = got.length === 1 ? [null, got[0], null] : [got[0], got[1] || null, got[2] || null];
  const reels = [...sl.querySelectorAll('.strip')], N = 18, durs = [900, 1300, 1700];
  const H = reels[0].parentNode.clientHeight || 80; sl.style.setProperty('--h', H + 'px');
  const lv = sl.querySelector('.lever'); setTimeout(() => lv.classList.remove('dn'), 300);
  reels.forEach((s, i) => {
    const items = Array.from({ length: N }, () => pool[(Math.random() * pool.length) | 0]); items.push(show[i]);
    s.innerHTML = items.map(cell).join('');
    s.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-N * H}px)` }], { duration: durs[i], easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' });
  });
  let finished = false, t2 = setTimeout(fin, 1900);
  function fin() {
    if (finished) return; finished = true; clearTimeout(t2);
    reels.forEach(s => s.getAnimations().forEach(a => a.finish()));
    sl.querySelector('.scr').innerHTML = got.map(k => `<span>${CARD[k].nm}${CARD[k].t !== 'x' ? ' Lv' + lvOf(k) : ''}</span>`).join('');
    sl.querySelector('.tip').textContent = '点击继续';
    const M2 = sl.querySelector('.m');
    for (const [n, l, t] of [['coins', 30, 10], ['spark', -5, 5], ['spark', 65, 0]]) { const d = document.createElement('div'); d.className = 'fx'; d.style.cssText = `left:${l}%;top:${t}%;background-image:url(assets/ui/slot_${n}.png)`; M2.append(d); }
    setTimeout(() => { sl.onclick = close; }, 250);
  }
  function close() { sl.hidden = true; sl.onclick = null; done && done(); }
  sl.onclick = () => { if (!finished) fin(); };
}
addEventListener('keydown', e => {
  if (!SLOT || SLOT.hidden) return;
  if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); SLOT.onclick && SLOT.onclick(); }
}, true);

// ---- 绘制（2.5D，世界坐标 → P3）----
function runDrawGround() {
  const R = S.run; if (!R) return;
  for (const g of R.gems) {
    const p = P3(g.x, g.y, 6 + Math.sin(S.t * 5 + g.x) * 2), s = g.v >= 5 ? 7 : g.v >= 3 ? 6 : 4.5;
    ctx.fillStyle = g.v >= 5 ? '#ff6a6a' : g.v >= 3 ? '#7cf07c' : '#6ab8ff';
    ctx.beginPath(); ctx.moveTo(p[0], p[1] - s); ctx.lineTo(p[0] + s * 0.7, p[1]); ctx.lineTo(p[0], p[1] + s); ctx.lineTo(p[0] - s * 0.7, p[1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.stroke();
  }
  for (const c of R.chests) {
    shadow3(c.x, c.y, 16, 7, 0);
    const p = P3(c.x, c.y, 0), b = Math.sin(S.t * 4) * 1.5;
    ctx.fillStyle = '#7a4a1e'; ctx.fillRect(p[0] - 14, p[1] - 20 + b, 28, 18);
    ctx.fillStyle = '#9a6028'; ctx.fillRect(p[0] - 14, p[1] - 26 + b, 28, 8);
    ctx.fillStyle = '#e8c040'; ctx.fillRect(p[0] - 14, p[1] - 19 + b, 28, 3); ctx.fillRect(p[0] - 3, p[1] - 22 + b, 6, 8);
    ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 2; ctx.strokeRect(p[0] - 14, p[1] - 26 + b, 28, 24);
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(S.t * 6); ctx.fillStyle = '#ffe080'; ctx.beginPath(); ctx.arc(p[0], p[1] - 30 + b, 4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
  for (const f of R.fx) if (f.k === 'mark') {
    const p = P3(f.x, f.y, 0);
    ctx.save(); ctx.globalAlpha = 0.5 * (1 - f.t / f.d); ctx.strokeStyle = '#ff5040'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.ellipse(p[0], p[1], f.r, f.r * SQ, 0, 0, TAU); ctx.stroke(); ctx.restore();
  }
}
function runDrawFx() {
  const R = S.run; if (!R) return;
  const L = S.h;
  if (R.w.flail && R.balls) for (const b of R.balls) {
    const p = P3(b.x, b.y, 16), h = P3(L.x, L.y, 26);
    ctx.strokeStyle = 'rgba(60,50,40,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(h[0], h[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
    shadow3(b.x, b.y, b.r * 0.8, b.r * 0.35, 0);
    ctx.fillStyle = '#5a5a62'; ctx.beginPath(); ctx.arc(p[0], p[1], b.r * 0.7, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#9a9aa4'; ctx.beginPath(); ctx.arc(p[0] - b.r * 0.2, p[1] - b.r * 0.2, b.r * 0.22, 0, TAU); ctx.fill();
  }
  for (const s of R.shots) {
    const a = Math.atan2(s.vy * SQ, s.vx), p = P3(s.x, s.y, 18), len = s.k === 'jav' ? 26 : 16;
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(a);
    ctx.strokeStyle = s.k === 'jav' ? '#6a4a2a' : '#4a3420'; ctx.lineWidth = s.k === 'jav' ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(len * 0.6, 0); ctx.stroke();
    ctx.fillStyle = '#d0d4dc'; ctx.beginPath(); ctx.moveTo(len * 0.6 + 6, 0); ctx.lineTo(len * 0.6 - 1, -3); ctx.lineTo(len * 0.6 - 1, 3); ctx.fill();
    ctx.restore();
  }
  for (const f of R.fx) {
    const k = 1 - f.t / f.d, p = P3(f.x, f.y, 0);
    if (f.k === 'ring') {
      ctx.save(); ctx.globalAlpha = 0.6 * k; ctx.strokeStyle = f.col || '#fff'; ctx.lineWidth = 4 * k + 1;
      const r = f.r * (0.6 + 0.4 * (1 - k)); ctx.beginPath(); ctx.ellipse(p[0], p[1], r, r * SQ, 0, 0, TAU); ctx.stroke(); ctx.restore();
    } else if (f.k === 'arc') {
      ctx.save(); ctx.globalAlpha = 0.85 * k; ctx.strokeStyle = f.col; ctx.lineWidth = 5 * k + 1;
      ctx.translate(p[0], p[1] - 14); ctx.scale(1, SQ); ctx.beginPath(); ctx.arc(0, 0, f.r * 0.8, f.a - 1.1, f.a + 1.1); ctx.stroke(); ctx.restore();
    } else if (f.k === 'thrust') {
      const c = Math.cos(f.a), s = Math.sin(f.a), a = P3(f.x + c * 30, f.y + s * 30, 26), b = P3(f.x + c * f.len, f.y + s * f.len, 22);
      ctx.save(); ctx.globalAlpha = k; ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,240,200,.55)'; ctx.lineWidth = 9 * k + 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore();
    } else if (f.k === 'sw') {
      const c = Math.cos(f.a), s = Math.sin(f.a), L = S.h, pt = (fw, l) => P3(L.x + c * fw - s * l * f.sd, L.y + s * fw + c * l * f.sd, 20);
      ctx.save(); ctx.globalAlpha = 0.9 * k; ctx.strokeStyle = '#eef4ff'; ctx.lineWidth = 6 * k + 1; ctx.lineCap = 'round';
      ctx.beginPath(); for (let i = 0; i <= 8; i++) { const u = i / 8, p = pt(f.f1 - (f.f1 - f.f0) * u, 22 + Math.sin(u * Math.PI) * f.l); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke(); ctx.restore();
    } else if (f.k === 'arrows') {
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) { const x = p[0] + (hash(i, f.x | 0) - 0.5) * f.r * 1.6, y = p[1] + (hash(i + 7, f.y | 0) - 0.5) * f.r * SQ * 1.6; ctx.beginPath(); ctx.moveTo(x - 4, y - 30 * k - 8); ctx.lineTo(x, y - 30 * k + 8); ctx.stroke(); }
      ctx.restore();
    }
  }
}
function runHUD() {
  const R = S.run; if (!R) return;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, 6);
  ctx.fillStyle = '#4ab0ff'; ctx.fillRect(0, 0, W * Math.min(1, R.xp / R.need), 6);
  ctx.font = 'bold 13px system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
  ctx.strokeText('Lv ' + R.lv, 172, 21); ctx.fillStyle = '#9fd8ff'; ctx.fillText('Lv ' + R.lv, 172, 21);
  // 已拥有：小方块
  let x = 10; const y = 50;
  for (const t of ['g', 'w', 's', 'b']) {
    for (const k in R[t]) {
      ctx.fillStyle = t === 'g' ? 'rgba(170,120,20,.9)' : t === 'w' ? 'rgba(40,80,170,.85)' : t === 's' ? 'rgba(100,60,160,.85)' : 'rgba(80,86,96,.85)';
      ctx.fillRect(x, y, 22, 22); ctx.strokeStyle = '#e8d8a8'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, 21, 21);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(CARD[k].ic, x + 11, y + 16);
      ctx.font = 'bold 9px system-ui,sans-serif'; ctx.fillStyle = '#ffd166'; ctx.fillText(R[t][k], x + 19, y + 21);
      x += 24;
    }
    if (Object.keys(R[t]).length) x += 6;
  }
  ctx.textAlign = 'left';
}
