// 局内成长：经验宝石、升级三选一、兵器 / 战法 / 祝福、宝箱（老虎机）。
// 普通脚本，在主脚本之前加载；只在被调用时才用到主脚本里的全局（S、P、hit、mult…）。
// 结构参考异世界幸存者 src/run.js：兵器 3 格、战法 3 格、祝福 5 格，兵器战法 5 级，满了只出升级。

const RUN_MAX = { g: 1, w: 3, s: 3, b: 5 };
const CARD = {
  // ---- 专属（金框，不占格子）----
  lance: { t: 'g', nm: '骑枪', ic: '矛', d: ['刺正前方 100° 内的敌人，伤害靠马速', '伤害 +30%', '枪更长：攻击范围 +25%', '出枪更快', '满级「贯阵」：冲锋速度下一枪贯穿前方一条线'] },
  // ---- 兵器（蓝框）----
  sabre: { t: 'w', nm: '马刀', ic: '刀', d: ['冲过人群时顺手劈两侧（速度 40% 以上才出刀）', '伤害 +30%', '刀光更长', '砍得更快', '满级「劈斩」：冲锋速度下砍飞敌人，飞出去的人会撞倒后面的人'] },
  mbow: { t: 'w', nm: '蒙古短弓', ic: '弓', d: ['射两侧（左右各 90°），射程 300，箭带上马速；每第 5 支是鸣镝：被射中的敌人 4 秒内受伤 +40%。骑射手左手持弓，往左射最顺', '伤害 +30%', '左右各多射 1 支', '每第 3 支就是鸣镝', '满级「箭袋」：每轮混入破甲重箭或火箭'] },
  rbow: { t: 'w', nm: '回马弓', ic: '返', d: ['帕提亚回马箭：只射后方 140° 的追兵。跑起来射得快，停下来射得慢', '伤害 +30%', '每次多射 1 支', '射得更快', '满级「回马箭雨」：每次 3 支扇形箭，穿透 2 人'] },
  jav: { t: 'w', nm: '标枪', ic: '标', d: ['自动锁定最强的敌人，高爆发单体。带 2 支，掷出的标枪插在地上，骑过去能捡回', '伤害 +30%', '多带 1 支', '补得更快', '满级「破盾」：命中的敌人 6 秒内受伤 +50%'] },
  axe: { t: 'w', nm: '投斧', ic: '斧', d: ['朝前方敌人最密处投出，弹跳打 3 人，砸碎盾牌（之后受伤 +50%，冲锋能撞飞）', '伤害 +30%', '多弹 1 次', '多带 1 把、补得更快', '满级「穿心」：砸死一个后继续弹，不消耗弹跳次数'] },
  lasso: { t: 'w', nm: '套索', ic: '索', d: ['近身套住一个敌人（他减速、不能攻击），骑马拉开到绳长时拽飞，高额伤害', '拽飞伤害 +30%', '绳子更长，拽得更狠', '套得更远、冷却更短', '满级「绊马索」：绳子绷直时横扫，路上的敌人全部绊倒'] },
  calt: { t: 'w', nm: '铁蒺藜', ic: '蒺', d: ['跑起来在马后撒铁蒺藜，追兵踩到受伤减速，敌骑会失蹄', '伤害 +30%', '存在更久（9 秒）', '撒得更宽更密', '满级「马失前蹄」：敌骑踩到摔倒 2 秒，步兵踩到倒地'] },
  mace: { t: 'w', nm: '铁锏', ic: '锏', d: ['解围：低速时砸周围一圈，被近身打中时立刻反击，把人推开', '伤害 +30%', '范围 +25%', '冷却更短', '满级「双锏」：连砸两下，第二下击退很远并让人倒地'] },
  shield: { t: 'w', nm: '骑兵小盾', ic: '盾', d: ['每 6 秒充好一次，自动挡下下一次伤害，并盾击攻击者', '充得更快（4.5 秒）', '盾击伤害 +50% 并让对方倒地', '可以存 2 次', '满级「盾墙」：亲卫每 8 秒也能挡一次'] },
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
  S.run = { lv: 1, xp: 0, need: runNeed(1), g: { lance: 1 }, w: {}, s: {}, b: {}, surge: 0, hm: 0, hist: [], hmCd: 0, sticks: [], calt: [], lasso: null, sh: 0, shT: 0, shInv: 0, cd: {}, gems: [], chests: [], shots: [], fx: [], jobs: [], ang: 0, queue: 0, rr: 0, lastLv: -9, horn: 0, chestN: 0 };
}
// ---- 派生数值 ----
const runAtk = () => S.run ? (1 + 0.1 * (S.run.b.str || 0)) * (1 + S.run.surge) : 1;
const runCdm = () => S.run ? 1 - 0.06 * (S.run.b.haste || 0) : 1;
const runSpd = () => S.run && S.run.horn > 0 ? 1.25 : 1;   // 局内不永久改马的手感，只有战法的短时爆发
const runAcc = () => S.run && S.run.horn > 0 ? 1.8 : 1;
const runTurn = () => 1;
const runElite = () => S.run ? 1 + 0.25 * (S.run.b.elite || 0) : 1;
// ---- 状态：硬控（同一个敌人 3 秒内只能被硬控一次；Boss 只减速，最多 30%）、减速、标记 ----
function slowE(e, k, t) { e.slowK = (e.slowU || 0) > S.t ? Math.min(e.slowK, k) : k; e.slowU = Math.max(e.slowU || 0, S.t + t); }
function cc(e, t) {
  if (e.type === 'dar' || e.boss || e.elite) { slowE(e, 0.7, t); return false; }
  if ((e.ccU || 0) > S.t) return false;
  e.stunU = S.t + t; e.ccU = S.t + Math.max(3, t + 0.5); return true;
}
const runStun = e => (e.stunU || 0) > S.t;
const lassoed = e => !!(S.run && S.run.lasso && S.run.lasso.e === e);
const runSlow = e => runStun(e) ? 0 : (lassoed(e) ? 0.3 : 1) * ((e.slowU || 0) > S.t ? e.slowK : 1);
const runNoAtk = e => runStun(e) || lassoed(e);
const runVuln = e => ((e.markU || 0) > S.t ? 1.4 : 1) * ((e.vulnU || 0) > S.t ? 1.5 : 1) * (e.sb ? 1.5 : 1);
// 受伤前：铁锏反击、骑兵小盾格挡。返回 true = 这次伤害被挡掉
function runBlock(rd, dmg) {
  const R = S.run; if (!R || S.demo) return false;
  if (rd === S.h) {
    if (R.shInv > S.t) return true;
    if (R.w.mace && (R.maceCt || 0) <= S.t) { R.maceCt = S.t + (R.w.mace >= 4 ? 0.9 : 1.2); maceSmash(R.w.mace); }
    if (R.w.shield && R.sh > 0) { R.sh--; R.shInv = S.t + 0.6; shieldBash(rd, R.w.shield); return true; }
  } else if (R.w.shield >= 5 && (rd.shU || 0) <= S.t) { rd.shU = S.t + 8; shieldBash(rd, 3); return true; }
  return false;
}
function maceSmash(lv) {
  const L = S.h, r = 60 * (lv >= 3 ? 1.25 : 1), dmg = 20 * (lv >= 2 ? 1.3 : 1);
  const go = (push, stun) => {
    for (const e of S.en) {
      if (e.dead) continue;
      const dx = e.x - L.x, dy = e.y - L.y, d = Math.hypot(dx, dy) || 1;
      if (d < r + e.r) { hit(e, dmg, dx / d, dy / d, 220); if (!e.dead && e.type !== 'dar') { e.x += dx / d * push; e.y += dy / d * push; if (stun) cc(e, 1); } }
    }
    S.run.fx.push({ k: 'ring', x: L.x, y: L.y, r: r + push * 0.3, t: 0, d: 0.3, col: '#c8ccd8' });
  };
  go(40, false);
  if (lv >= 5) S.run.jobs.push({ t: 0.25, f: () => go(110, true) });
}
function shieldBash(o, lv) {
  let best = null, bd = 70;
  for (const e of S.en) { if (e.dead) continue; const d = Math.hypot(e.x - o.x, e.y - o.y) - e.r; if (d < bd) { bd = d; best = e; } }
  if (best) {
    const dx = best.x - o.x, dy = best.y - o.y, d = Math.hypot(dx, dy) || 1;
    hit(best, 25 * (lv >= 3 ? 1.5 : 1), dx / d, dy / d, 260);
    if (!best.dead && best.type !== 'dar') { best.x += dx / d * 50; best.y += dy / d * 50; if (lv >= 3) cc(best, 1); }
  }
  S.run.fx.push({ k: 'ring', x: o.x, y: o.y, r: 34, t: 0, d: 0.3, col: '#ffd860' });
  if (o === S.h) addNum(o.x, o.y - 30, '格挡', '#ffd860', false);
}

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
    if (s.home && !s.home.dead) { const dx = s.home.x - s.x, dy = s.home.y - s.y, d = Math.hypot(dx, dy) || 1; s.vx = dx / d * s.sp; s.vy = dy / d * s.sp; }
    s.t -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot = (s.rot || 0) + dt * 16;
    for (const e of S.en) {
      if (e.dead || s.hit.has(e)) continue;
      const dx = e.x - s.x, dy = e.y - s.y;
      if (dx * dx + dy * dy < (e.r + s.r) ** 2) { shotHit(s, e); if (s.t <= 0 || s.k === 'axe') break; }
    }
    if (s.t <= 0 && s.k === 'jav' && !s.stuck) { s.stuck = 1; R.sticks.push({ x: s.x, y: s.y, a: Math.atan2(s.vy, s.vx), t: 6 }); }
  }
  R.shots = R.shots.filter(s => s.t > 0);
  // 插在地上的标枪：骑过去捡回
  for (const k of R.sticks) {
    k.t -= dt;
    if (Math.hypot(k.x - L.x, k.y - L.y) < 36) { k.t = 0; if (R.w.jav && R.jAmmo < (R.w.jav >= 3 ? 3 : 2)) { R.jAmmo++; addNum(L.x, L.y - 30, '捡回标枪', '#d8e8ff', false); } }
  }
  R.sticks = R.sticks.filter(k => k.t > 0);
  for (const f of R.fx) f.t += dt;
  R.fx = R.fx.filter(f => f.t < f.d);
}
function shotHit(s, e) {
  const R = S.run;
  s.hit.add(e);
  const sp = Math.hypot(s.vx, s.vy) || 1;
  hit(e, s.dmg, s.vx / sp, s.vy / sp, s.kp || 160);
  if (s.mark) e.markU = S.t + 4;
  if (s.vuln) e.vulnU = S.t + 6;
  if (s.fire) aoe(e.x, e.y, 40, s.dmg * 0.6, 80, '#ff8a30');
  if (s.k === 'axe') {
    e.sb = true;   // 盾被砸碎
    if (!(s.chain && e.dead)) s.n--;
    const nx = s.n > 0 ? S.en.filter(o => !o.dead && !s.hit.has(o) && Math.abs(o.x - e.x) < 130 && Math.abs(o.y - e.y) < 130).sort((a, b) => (a.x - e.x) ** 2 + (a.y - e.y) ** 2 - (b.x - e.x) ** 2 - (b.y - e.y) ** 2)[0] : null;
    if (!nx) { s.t = 0; return; }
    s.home = nx; s.t = 0.6; s.x = e.x; s.y = e.y;
    return;
  }
  if (s.pierce-- <= 0) s.t = 0;
}
function shootV(x, y, a, sp, t, dmg, o) {   // o: { k, pierce, r, mark, fire, vuln, kp, home, inherit, n, chain }
  o = o || {};
  let vx = Math.cos(a) * sp, vy = Math.sin(a) * sp;
  if (o.inherit) { vx += Math.cos(S.h.a) * S.h.v; vy += Math.sin(S.h.a) * S.h.v; }
  S.run.shots.push(Object.assign({ k: 'arrow', pierce: 0, r: 6 }, o, { x, y, vx, vy, sp: Math.hypot(vx, vy), t, dmg, hit: new Set() }));
}
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
function inArc(L, e, ang, half, R) {
  const dx = e.x - L.x, dy = e.y - L.y, d = Math.hypot(dx, dy);
  return d < R + e.r && Math.abs(wrap(Math.atan2(dy, dx) - ang)) < half;
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
  mbow(lv, dt) {   // 蒙古短弓：两侧各 90°，鸣镝标记
    const L = S.h, R = S.run;
    R.cd.mbow = (R.cd.mbow || 0) - dt; if (R.cd.mbow > 0) return;
    const near = S.en.filter(e => !e.dead && Math.abs(e.x - L.x) < 310 && Math.abs(e.y - L.y) < 310);
    const per = lv >= 3 ? 2 : 1, dmg = 7 * (lv >= 2 ? 1.3 : 1);
    let shot = false;
    for (const sd of [-1, 1]) {
      const side = L.a + sd * Math.PI / 2;
      const tg = near.filter(e => inArc(L, e, side, Math.PI / 4, 300)).sort((a, b) => dist2(a, L) - dist2(b, L)).slice(0, per);
      for (const e of tg) {
        R.mbN = (R.mbN || 0) + 1;
        const wh = R.mbN % (lv >= 4 ? 3 : 5) === 0;
        shootV(L.x, L.y, Math.atan2(e.y - L.y, e.x - L.x), 620, 0.6, dmg, { k: wh ? 'whistle' : 'arrow', mark: wh, inherit: true });
        shot = true;
      }
      if (lv >= 5 && tg.length) {   // 箭袋：破甲重箭 / 火箭轮流
        R.mbQ = !R.mbQ; const e = tg[0], a = Math.atan2(e.y - L.y, e.x - L.x) + 0.08;
        shootV(L.x, L.y, a, 620, 0.6, R.mbQ ? dmg * 2.5 : dmg, R.mbQ ? { k: 'ap', pierce: 2, inherit: true } : { k: 'fire', fire: true, inherit: true });
      }
    }
    if (shot) R.cd.mbow = (ratio(L) >= 0.4 ? 0.5 : 1.0) * runCdm();
  },
  rbow(lv, dt) {   // 回马弓：只射后方 140°
    const L = S.h, R = S.run;
    R.cd.rbow = (R.cd.rbow || 0) - dt; if (R.cd.rbow > 0) return;
    const back = L.a + Math.PI;
    const tg = S.en.filter(e => !e.dead && Math.abs(e.x - L.x) < 330 && Math.abs(e.y - L.y) < 330 && inArc(L, e, back, 70 * Math.PI / 180, 320))
      .sort((a, b) => dist2(a, L) - dist2(b, L)).slice(0, lv >= 3 ? 2 : 1);
    if (!tg.length) return;
    R.cd.rbow = (ratio(L) >= 0.4 ? 0.8 : 1.6) * (lv >= 4 ? 0.75 : 1) * runCdm();
    const dmg = 9 * (lv >= 2 ? 1.3 : 1);
    for (const e of tg) {
      const a = Math.atan2(e.y - L.y, e.x - L.x);
      if (lv >= 5) for (const da of [-0.15, 0, 0.15]) shootV(L.x, L.y, a + da, 620, 0.6, dmg, { pierce: 2 });
      else shootV(L.x, L.y, a, 620, 0.6, dmg);
    }
  },
  jav(lv, dt) {   // 标枪：锁定最强的敌人，高爆发单体；插地可捡回
    const L = S.h, R = S.run, cap = lv >= 3 ? 3 : 2;
    if (R.jAmmo === undefined) R.jAmmo = cap;
    if (R.jAmmo < cap) { R.jRef = (R.jRef || 0) + dt; if (R.jRef >= (lv >= 4 ? 2.8 : 4) * runCdm()) { R.jAmmo++; R.jRef = 0; } } else R.jRef = 0;
    let best = null, bs = -1;
    for (const e of S.en) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - L.x, e.y - L.y); if (d > 350) continue;
      const sc = (e.type === 'dar' ? 1e7 : e.boss ? 5e6 : e.elite ? 1e6 : e.max * 100) - d;
      if (sc > bs) { bs = sc; best = e; }
    }
    R.jTg = best;
    R.cd.jav = (R.cd.jav || 0) - dt;
    if (!best || R.jAmmo <= 0 || R.cd.jav > 0) return;
    R.cd.jav = 0.35; R.jAmmo--;
    const dmg = 60 * (1 + 0.5 * Math.min(1, ratio(L))) * (lv >= 2 ? 1.3 : 1);
    shootV(L.x, L.y, Math.atan2(best.y - L.y, best.x - L.x), 600, 1.2, dmg, { k: 'jav', r: 8, kp: 320, vuln: lv >= 5, home: best });
  },
  axe(lv, dt) {   // 投斧：朝前方最密处投，弹跳、破盾
    const L = S.h, R = S.run, cap = lv >= 4 ? 4 : 3;
    if (R.aAmmo === undefined) R.aAmmo = cap;
    if (R.aAmmo < cap) { R.aRef = (R.aRef || 0) + dt; if (R.aRef >= (lv >= 4 ? 1.4 : 2) * runCdm()) { R.aAmmo++; R.aRef = 0; } } else R.aRef = 0;
    R.cd.axe = (R.cd.axe || 0) - dt;
    if (R.cd.axe > 0 || R.aAmmo <= 0) return;
    const cand = S.en.filter(e => !e.dead && Math.abs(e.x - L.x) < 190 && Math.abs(e.y - L.y) < 190 && inArc(L, e, L.a, Math.PI / 2, 180));
    if (!cand.length) return;
    let best = cand[0], bn = -1;
    for (let q = 0; q < Math.min(10, cand.length); q++) {
      const c = cand[(Math.random() * cand.length) | 0];
      let n = 0; for (const o of cand) if (Math.abs(o.x - c.x) < 60 && Math.abs(o.y - c.y) < 60) n++;
      if (n > bn) { bn = n; best = c; }
    }
    R.cd.axe = 0.45; R.aAmmo--;
    shootV(L.x, L.y, Math.atan2(best.y - L.y, best.x - L.x), 440, 0.8, 20 * (lv >= 2 ? 1.3 : 1), { k: 'axe', r: 9, kp: 200, home: best, n: lv >= 3 ? 4 : 3, chain: lv >= 5 });
  },
  lasso(lv, dt) {   // 套索：近身套住，拉开到绳长时拽飞
    const L = S.h, R = S.run, len = lv >= 3 ? 210 : 160, reach = lv >= 4 ? 90 : 60;
    if (R.lasso && (R.lasso.e.dead || R.lasso.e.gone)) R.lasso = null;
    if (!R.lasso) {
      R.cd.lasso = (R.cd.lasso || 0) - dt; if (R.cd.lasso > 0) return;
      let best = null, bs = -1;
      for (const e of S.en) { if (e.dead) continue; const d = Math.hypot(e.x - L.x, e.y - L.y); if (d < reach + e.r && e.max > bs) { bs = e.max; best = e; } }
      if (best) { R.lasso = { e: best }; R.fx.push({ k: 'ring', x: best.x, y: best.y, r: 18, t: 0, d: 0.3, col: '#e8d8a0' }); }
      return;
    }
    const e = R.lasso.e, dx = e.x - L.x, dy = e.y - L.y, d = Math.hypot(dx, dy) || 1;
    if (d < len) return;
    const nx = -dx / d, ny = -dy / d, dmg = 50 * mult(L) * (lv >= 2 ? 1.3 : 1);
    R.fx.push({ k: 'snap', x: L.x, y: L.y, x2: e.x, y2: e.y, t: 0, d: 0.22 });
    if (lv >= 5) {   // 绊马索：绷直的绳子横扫
      for (const o of S.en) {
        if (o.dead || o === e) continue;
        const t = clamp(((o.x - L.x) * dx + (o.y - L.y) * dy) / (d * d), 0, 1), px = L.x + dx * t, py = L.y + dy * t;
        if (Math.hypot(o.x - px, o.y - py) < 14 + o.r) { hit(o, dmg * 0.5, nx, ny, 160); if (!o.dead) cc(o, 1); }
      }
    }
    hit(e, dmg, nx, ny, 560);
    if (e.dead) e.missile = dmg * 0.5;
    else if (e.type !== 'dar') { e.x += nx * 60; e.y += ny * 60; cc(e, 0.8); }
    addNum(e.x, e.y - 24, '拽!', '#ffd860', false);
    R.lasso = null; R.cd.lasso = (lv >= 4 ? 1.4 : 2) * runCdm();
  },
  calt(lv, dt) {   // 铁蒺藜：跑起来撒在马后
    const L = S.h, R = S.run;
    if (ratio(L) >= 0.4) {
      R.cd.calt = (R.cd.calt || 0) - dt;
      if (R.cd.calt <= 0) { R.cd.calt = 0.5; R.calt.push({ x: L.x - Math.cos(L.a) * 30, y: L.y - Math.sin(L.a) * 30, r: lv >= 4 ? 30 : 22, t: lv >= 3 ? 9 : 6, sd: Math.random() * 1000 }); }
    }
    for (const p of R.calt) p.t -= dt;
    R.calt = R.calt.filter(p => p.t > 0);
    if (!R.calt.length) return;
    const dmg = 4 * (lv >= 2 ? 1.3 : 1);
    for (const e of S.en) {
      if (e.dead || (e.calT || 0) > S.t) continue;
      for (const p of R.calt) {
        if (Math.abs(e.x - p.x) > p.r + e.r || Math.abs(e.y - p.y) > p.r + e.r) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) > p.r + e.r) continue;
        e.calT = S.t + 0.5;
        if (e.type === 'cav' || e.type === 'char') {
          hit(e, dmg * 3, 0, 0, 0); e.v *= 0.4;
          if (lv >= 5 && cc(e, 2)) for (const o of S.en) if (!o.dead && o !== e && Math.abs(o.x - e.x) < 40 && Math.abs(o.y - e.y) < 40) cc(o, 0.5);
        } else { hit(e, dmg, 0, 0, 0); slowE(e, 0.6, 1); if (lv >= 5) cc(e, 0.5); }
        break;
      }
    }
  },
  mace(lv, dt) {   // 铁锏：低速时砸一圈（被打时的反击在 runBlock）
    const L = S.h, R = S.run;
    R.cd.mace = (R.cd.mace || 0) - dt;
    if (ratio(L) < 0.3 && R.cd.mace <= 0 && anyNear(L.x, L.y, 80)) { maceSmash(lv); R.cd.mace = (lv >= 4 ? 0.7 : 1) * runCdm(); }
  },
  shield(lv, dt) {   // 骑兵小盾：充能（格挡在 runBlock）
    const R = S.run, cap = lv >= 4 ? 2 : 1;
    if (R.sh < cap) { R.shT += dt; if (R.shT >= (lv >= 2 ? 4.5 : 6) * runCdm()) { R.sh++; R.shT = 0; } }
  },
};
// ---- 亲卫：跑起来用骑枪往前刺，停下来拔刀小范围环形砍 ----
function guardAtk(g, dt) {
  if (g.slashAnim > 0) g.slashAnim -= dt;
  if (g.flash > 0) g.flash -= dt;
  g.slashT -= dt; if (g.slashT > 0) return;
  const el = runElite(), c = Math.cos(g.a), s = Math.sin(g.a);
  if (ratio(g) >= 0.3) {
    const reach = 100, half = 50 * Math.PI / 180, dmg = 10 * mult(g) * el;
    let any = false;
    for (const e of S.en) {
      if (e.dead) continue;
      const dx = e.x - g.x, dy = e.y - g.y, d = Math.hypot(dx, dy);
      if (d < reach + e.r && Math.abs(wrap(Math.atan2(dy, dx) - g.a)) < half + Math.atan2(e.r, d || 1)) { any = true; hit(e, dmg, c, s, 240); }
    }
    if (any) { g.slashT = 0.7; S.run.fx.push({ k: 'thrust', x: g.x, y: g.y, a: g.a, len: reach, t: 0, d: 0.12 }); }
  } else {
    let any = false;
    for (const e of S.en) {
      if (e.dead) continue;
      const dx = e.x - g.x, dy = e.y - g.y, d = Math.hypot(dx, dy);
      if (d < 45 + e.r) { any = true; hit(e, 5 * el, dx / (d || 1), dy / (d || 1), 160); }
    }
    if (any) { g.slashT = 0.6; g.slashAnim = 0.18; }
  }
}
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
  for (const p of R.calt) {   // 铁蒺藜
    ctx.globalAlpha = Math.min(1, p.t); ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const q = P3(p.x + (hash(i, p.sd | 0) - 0.5) * p.r * 1.6, p.y + (hash(i + 9, p.sd | 0) - 0.5) * p.r * 1.6, 0);
      ctx.beginPath(); ctx.moveTo(q[0] - 3, q[1] - 2); ctx.lineTo(q[0] + 3, q[1] + 2); ctx.moveTo(q[0] + 3, q[1] - 2); ctx.lineTo(q[0] - 3, q[1] + 2); ctx.moveTo(q[0], q[1] - 4); ctx.lineTo(q[0], q[1]); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  for (const k of R.sticks) {   // 插在地上的标枪
    const a = P3(k.x, k.y, 0), b = P3(k.x - Math.cos(k.a) * 10, k.y - Math.sin(k.a) * 10, 26);
    ctx.globalAlpha = Math.min(1, k.t); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    ctx.fillStyle = 'rgba(200,220,255,.5)'; ctx.beginPath(); ctx.ellipse(a[0], a[1], 8, 3, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
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
  // 套索的绳子
  if (R.lasso) {
    const e = R.lasso.e, a = P3(L.x, L.y, 26), b = P3(e.x, e.y, 14), d = Math.hypot(e.x - L.x, e.y - L.y), len = R.w.lasso >= 3 ? 210 : 160;
    const sag = Math.max(0, len - d) * 0.25;
    ctx.strokeStyle = '#c8a870'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag, b[0], b[1]); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(b[0], b[1] + 4, 9, 4, 0, 0, TAU); ctx.stroke();
  }
  // 标枪锁定的准星
  if (R.w.jav && R.jTg && !R.jTg.dead) {
    const p = P3(R.jTg.x, R.jTg.y, 34), r = 9 + Math.sin(S.t * 8) * 1.5;
    ctx.strokeStyle = R.jAmmo > 0 ? '#ff4030' : 'rgba(255,64,48,.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.moveTo(p[0] - r - 5, p[1]); ctx.lineTo(p[0] - r + 3, p[1]); ctx.moveTo(p[0] + r - 3, p[1]); ctx.lineTo(p[0] + r + 5, p[1]);
    ctx.moveTo(p[0], p[1] - r - 5); ctx.lineTo(p[0], p[1] - r + 3); ctx.moveTo(p[0], p[1] + r - 3); ctx.lineTo(p[0], p[1] + r + 5); ctx.stroke();
  }
  // 小盾充好：金色光圈
  if (R.w.shield && R.sh > 0) {
    const p = P3(L.x, L.y, 0);
    ctx.save(); ctx.globalAlpha = 0.45 + 0.15 * Math.sin(S.t * 5); ctx.strokeStyle = '#ffd860'; ctx.lineWidth = 2 + R.sh;
    ctx.beginPath(); ctx.ellipse(p[0], p[1] - 6, 30, 30 * SQ, 0, 0, TAU); ctx.stroke(); ctx.restore();
  }
  // 倒地的敌人头上冒星；被鸣镝标记的敌人脚下红圈
  for (const e of S.en) {
    if (e.dead) continue;
    if (runStun(e)) { const p = P3(e.x, e.y, 30); ctx.fillStyle = '#ffe060'; for (let i = 0; i < 3; i++) { const a = S.t * 6 + i * 2.1; ctx.fillRect(p[0] + Math.cos(a) * 8 - 1.5, p[1] + Math.sin(a) * 3 - 1.5, 3, 3); } }
    if ((e.markU || 0) > S.t) { const p = P3(e.x, e.y, 0); ctx.strokeStyle = 'rgba(255,60,60,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p[0], p[1], e.r + 5, (e.r + 5) * SQ, 0, 0, TAU); ctx.stroke(); }
  }
  for (const s of R.shots) {
    const a = Math.atan2(s.vy * SQ, s.vx), p = P3(s.x, s.y, 18);
    ctx.save(); ctx.translate(p[0], p[1]);
    if (s.k === 'axe') {
      ctx.rotate(s.rot);
      ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(5, -1); ctx.lineTo(11, -6); ctx.lineTo(11, 6); ctx.lineTo(5, 1); ctx.fill();
    } else {
      ctx.rotate(a);
      const jav = s.k === 'jav', len = jav ? 26 : 16;
      if (s.k === 'whistle') { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-10, 0); ctx.stroke(); }
      ctx.strokeStyle = jav ? '#6a4a2a' : s.k === 'ap' ? '#2a2a2a' : '#4a3420'; ctx.lineWidth = jav || s.k === 'ap' ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(len * 0.6, 0); ctx.stroke();
      ctx.fillStyle = s.k === 'fire' ? '#ff8a30' : s.k === 'whistle' ? '#ffffff' : '#d0d4dc';
      ctx.beginPath(); ctx.moveTo(len * 0.6 + 6, 0); ctx.lineTo(len * 0.6 - 1, -3); ctx.lineTo(len * 0.6 - 1, 3); ctx.fill();
      if (s.k === 'fire') { ctx.fillStyle = 'rgba(255,160,40,.6)'; ctx.beginPath(); ctx.arc(len * 0.6 + 3, 0, 5, 0, TAU); ctx.fill(); }
    }
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
    } else if (f.k === 'snap') {
      const a = P3(f.x, f.y, 26), b = P3(f.x2, f.y2, 14);
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = '#fff4c8'; ctx.lineWidth = 4 * k + 1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore();
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
