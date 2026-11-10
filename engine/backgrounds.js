// pastel-toon-shorts — location backgrounds (Canvas 2D, deterministic)
// Rule: backgrounds are QUIET. Pastel fills, thin lines in a darker shade of the SAME hue,
// no pure black, low contrast. One dominant hue per location. Characters must pop on top.
// drawBG(ctx, id, t) draws into a 1080 x 1920 world (ground line around y = 1500).
(function (G) {
  const W = 1080, H = 1920, GROUND = 1500;
  const LOC = {
    park:   { hue: 'lime',   sky: ['#e4f5ee', '#f6f8dc'], line: '#a9c172', ground: '#d4e88f', ground2: '#c6df7c', far: '#e2eeb0', bush: '#b7d56d', accent: '#ffd85e' },
    street: { hue: 'mint',   sky: ['#dcf2f2', '#eef8f4'], line: '#8fc3b6', ground: '#d5e7e4', ground2: '#c3dcd8', far: '#bfe3d8', bush: '#9ed3c3', accent: '#f7a6a0' },
    shop:   { hue: 'salmon', sky: ['#f9d3c8', '#fbe2d8'], line: '#d99a8c', ground: '#f3dcd0', ground2: '#ead0c2', far: '#f4b9aa', bush: '#efa898', accent: '#8fc9d6' },
    kitchen:{ hue: 'sky',    sky: ['#d3e6f5', '#e6f0f9'], line: '#94b6d3', ground: '#e8eef5', ground2: '#dbe5ef', far: '#b9d3ea', bush: '#a9c8e4', accent: '#ffcf7a' },
    night:  { hue: 'indigo', sky: ['#4a4f86', '#7a6fa8'], line: '#3a3c6b', ground: '#5d6a8f', ground2: '#536084', far: '#6b6a9e', bush: '#4f6b78', accent: '#ffe08a' },
  };

  function shape(ctx, L, fill, lw) {
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = lw || 3; ctx.strokeStyle = L.line; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function blob(ctx, cx, cy, r, n, seed) { // bumpy cloud/bush outline
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a0 = Math.PI + (i / n) * Math.PI;
      const x = cx + Math.cos(a0) * r, y = cy + Math.sin(a0) * r * 0.62;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const am = Math.PI + ((i - 0.5) / n) * Math.PI;
        const bump = 1.28 + 0.08 * Math.sin(seed + i * 2.3);
        ctx.quadraticCurveTo(cx + Math.cos(am) * r * bump, cy + Math.sin(am) * r * 0.62 * bump, x, y);
      }
    }
    ctx.closePath();
  }
  function sky(ctx, L) {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, L.sky[0]); g.addColorStop(1, L.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, GROUND + H);
  }
  function ground(ctx, L) {
    ctx.fillStyle = L.ground; ctx.fillRect(-W, GROUND, W * 3, H * 2);
    ctx.beginPath(); ctx.moveTo(-W, GROUND); ctx.lineTo(W * 2, GROUND);
    ctx.lineWidth = 3; ctx.strokeStyle = L.line; ctx.stroke();
  }
  function clouds(ctx, L, t) {
    const drift = (t || 0) * 6;
    [[180, 300, 90], [760, 220, 120], [520, 520, 70]].forEach(([x, y, r], i) => {
      blob(ctx, ((x + drift * (i + 1) * 0.5) % 1400) - 120, y, r, 5, i); shape(ctx, L, 'rgba(255,255,255,0.85)', 2.5);
    });
  }

  const DRAW = {
    park(ctx, L, t) {
      sky(ctx, L); clouds(ctx, L, t);
      // far hills
      ctx.beginPath(); ctx.moveTo(-200, 1240);
      ctx.quadraticCurveTo(200, 1040, 560, 1200); ctx.quadraticCurveTo(880, 1060, 1300, 1220);
      ctx.lineTo(1300, GROUND); ctx.lineTo(-200, GROUND); ctx.closePath(); shape(ctx, L, L.far);
      // big pale tree (left)
      ctx.beginPath(); ctx.moveTo(60, GROUND); ctx.quadraticCurveTo(120, 1100, 90, 760); ctx.lineTo(230, 760);
      ctx.quadraticCurveTo(220, 1100, 300, GROUND); ctx.closePath(); shape(ctx, L, '#efe8bd');
      blob(ctx, 160, 760, 300, 7, 1); shape(ctx, L, L.bush);
      blob(ctx, 120, 640, 190, 5, 4); shape(ctx, L, '#c9e283');
      // bushes + flowers
      [[880, GROUND, 150, 2], [640, GROUND + 10, 90, 3]].forEach(([x, y, r, s]) => { blob(ctx, x, y, r, 6, s); shape(ctx, L, L.bush); });
      ground(ctx, L);
      ctx.fillStyle = L.ground2; ctx.beginPath(); ctx.ellipse(540, 1760, 700, 120, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 9; i++) {
        const x = 40 + i * 127, y = GROUND + 40 + (i % 3) * 70;
        ctx.fillStyle = L.accent; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
        ctx.strokeStyle = L.line; ctx.lineWidth = 2; ctx.stroke();
      }
    },
    street(ctx, L, t) {
      sky(ctx, L); clouds(ctx, L, t);
      const b = [[-40, 700, 360, '#c9ebe0'], [300, 560, 330, '#b3dfd2'], [610, 760, 300, '#c9ebe0'], [890, 620, 300, '#a9d8ca']];
      b.forEach(([x, y, w, c]) => {
        ctx.beginPath(); ctx.rect(x, y, w, GROUND - y); shape(ctx, L, c);
        for (let r = 0; y + 90 + r * 170 < GROUND - 220; r++) for (let k = 0; k < 2; k++) {
          ctx.beginPath(); ctx.rect(x + 50 + k * (w / 2), y + 90 + r * 170, w / 2 - 100, 100); shape(ctx, L, '#eef9f6', 2.5);
        }
      });
      // door
      ctx.beginPath(); ctx.moveTo(400, GROUND); ctx.lineTo(400, 1270); ctx.arc(470, 1270, 70, Math.PI, 0); ctx.lineTo(540, GROUND); ctx.closePath();
      shape(ctx, L, '#7fc2b0');
      ground(ctx, L);
      ctx.fillStyle = L.ground2; ctx.fillRect(-W, GROUND + 160, W * 3, 18);
    },
    shop(ctx, L) {
      ctx.fillStyle = L.sky[0]; ctx.fillRect(-W, -H, W * 3, GROUND + H);
      // shelves with boxes
      for (let r = 0; r < 3; r++) {
        const y = 520 + r * 260;
        ctx.beginPath(); ctx.rect(60, y, 960, 22); shape(ctx, L, L.far);
        for (let k = 0; k < 6; k++) {
          const w = 90 + (k * 37 + r * 13) % 60, x = 90 + k * 155, h = 110 + ((k + r) % 3) * 30;
          const cols = ['#ffe1a8', '#bfe3e8', '#f6c1d1', '#d8ecb2'];
          ctx.beginPath(); ctx.rect(x, y - h, w, h); shape(ctx, L, cols[(k + r) % 4], 2.5);
        }
      }
      ground(ctx, L);
      // counter
      ctx.beginPath(); ctx.rect(620, 1250, 520, 250); shape(ctx, L, '#eaa494');
      ctx.beginPath(); ctx.rect(600, 1230, 560, 30); shape(ctx, L, '#f6c3b5');
    },
    kitchen(ctx, L) {
      ctx.fillStyle = L.sky[0]; ctx.fillRect(-W, -H, W * 3, GROUND + H);
      // tiles
      ctx.strokeStyle = L.line; ctx.globalAlpha = 0.35; ctx.lineWidth = 2;
      for (let y = 980; y < 1250; y += 60) { ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(W * 2, y); ctx.stroke(); }
      ctx.globalAlpha = 1;
      // window
      ctx.beginPath(); ctx.rect(620, 420, 340, 420); shape(ctx, L, '#f1f8ff');
      ctx.beginPath(); ctx.moveTo(790, 420); ctx.lineTo(790, 840); ctx.moveTo(620, 630); ctx.lineTo(960, 630); ctx.lineWidth = 3; ctx.stroke();
      // upper cabinets
      ctx.beginPath(); ctx.rect(40, 360, 480, 360); shape(ctx, L, L.far);
      ctx.beginPath(); ctx.moveTo(280, 360); ctx.lineTo(280, 720); ctx.stroke();
      // counter
      ctx.beginPath(); ctx.rect(-20, 1250, 1120, 250); shape(ctx, L, L.bush);
      ctx.beginPath(); ctx.rect(-40, 1225, 1160, 30); shape(ctx, L, '#eef4fa');
      ground(ctx, L);
    },
    night(ctx, L) {
      sky(ctx, L);
      ctx.fillStyle = L.accent;
      for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.5 + 0.5 * ((i * 7) % 3) / 2; ctx.beginPath(); ctx.arc((i * 263) % 1080, (i * 137) % 1100, 3 + (i % 3), 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(820, 360, 110, 0, 7); shape(ctx, L, '#fff2c2');
      ctx.beginPath(); ctx.moveTo(-200, 1300); ctx.quadraticCurveTo(400, 1100, 1300, 1320); ctx.lineTo(1300, GROUND); ctx.lineTo(-200, GROUND); ctx.closePath(); shape(ctx, L, L.far);
      ground(ctx, L);
    },
  };

  function drawBG(ctx, id, t) {
    const L = LOC[id]; if (!L) throw new Error('unknown location ' + id);
    DRAW[id](ctx, L, t || 0);
  }
  // soft contact shadow under a character
  function shadow(ctx, x, y, w) {
    ctx.fillStyle = 'rgba(60,40,30,0.13)'; ctx.beginPath(); ctx.ellipse(x, y + 4, w, w * 0.16, 0, 0, Math.PI * 2); ctx.fill();
  }

  G.PT = G.PT || {};
  Object.assign(G.PT, { W, H, GROUND, LOC, drawBG, shadow });
})(typeof window !== 'undefined' ? window : globalThis);
