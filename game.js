/* ===========================================================
 * Pixel Mech Duel — 像素机甲对战 (game.js)
 * 纯 Canvas 2D 绘制，无外部素材。逻辑坐标 640x360。
 * ------------------------------------------------------------
 * 结构：
 *   常量 & 调色板
 *   Input          —— 键盘输入
 *   Mech           —— 机甲实体（移动/跳跃/攻击/防御/血量）
 *   Scene / Particles —— 背景与特效
 *   Game           —— 主循环、局制、胜负、绘制调度
 * =========================================================== */

(() => {
  'use strict';

  /* ---------- 常量 ---------- */
  const W = 640;
  const H = 360;
  const GROUND_Y = 300;           // 地面 y
  const GRAVITY = 0.55;
  const MOVE_SPEED = 1.8;
  const JUMP_V = -8.6;
  const FRICTION = 0.82;
  const MECH_W = 28;
  const MECH_H = 44;
  const MAX_HP = 100;

  /* 色板（复古 8 位机味） */
  const PAL = {
    sky1: '#1a1b3a',
    sky2: '#3b2a5a',
    sky3: '#d15a7a',
    sun: '#ffd27a',
    mountain1: '#2a1f4a',
    mountain2: '#1a1230',
    ground1: '#3a2a1a',
    ground2: '#5a3a22',
    ground3: '#2a1a10',
    grid: '#22264a',
    p1Body: '#d93a4a',
    p1BodyD: '#7a1a26',
    p1Metal: '#e8e8ee',
    p1Eye: '#ffd23a',
    p2Body: '#3a7ad9',
    p2BodyD: '#1a3a7a',
    p2Metal: '#e8e8ee',
    p2Eye: '#66ffee',
    hpBack: '#22264a',
    hpBorder: '#0b0e22',
    hpFillP1: '#ff6677',
    hpFillP2: '#66aaff',
    shadow: 'rgba(0,0,0,0.35)',
    flash: '#ffffff',
    spark: '#ffd27a',
    spark2: '#ff8844',
    text: '#f2f4ff',
    textShadow: '#000',
  };

  /* ---------- Canvas ---------- */
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlaySub = document.getElementById('overlaySub');

  /* ---------- 输入 ---------- */
  const keys = new Set();
  const keyPressed = new Set(); // 仅本帧按下
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (
      [
        'a','d','w','f','g',
        'arrowleft','arrowright','arrowup','j','k','enter',' '
      ].includes(k)
    ) {
      e.preventDefault();
    }
    if (!keys.has(k)) keyPressed.add(k);
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.key.toLowerCase());
  });

  /* ---------- 工具 ---------- */
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rectOverlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  /* ---------- 像素绘制工具 ---------- */
  // 以 (ox,oy) 为左上角，按矩阵绘制像素，每个元素为颜色 key 或 null
  function drawPixelMatrix(mat, ox, oy, px, flipX) {
    const rows = mat.length;
    const cols = mat[0].length;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const c = mat[j][i];
        if (!c) continue;
        const dx = flipX ? (cols - 1 - i) : i;
        ctx.fillStyle = c;
        ctx.fillRect(Math.round(ox + dx * px), Math.round(oy + j * px), px, px);
      }
    }
  }

  /* 用 ASCII + 色表构建矩阵（更紧凑易读） */
  // 字符 ' ' 表示透明；其他字符映射到 colors 表
  function asciiToMatrix(ascii, colors) {
    const lines = ascii.replace(/^\n+|\n+$/g, '').split('\n');
    return lines.map((line) =>
      Array.from(line).map((ch) => (ch === ' ' ? null : colors[ch] || ch))
    );
  }

  /* ---------- 机甲像素图（基础姿态，28x44，1px 格） ---------- */
  // 色表：
  //   B = body   b = bodyDark   M = metal/亮边   E = eye/屏幕   L = 腿/鞋
  //   G = 枪     S = 肩甲边     . = 透明
  function makeMechSprite(body, bodyD, metal, eye) {
    const colors = {
      B: body, b: bodyD, M: metal, E: eye, L: metal, G: metal, S: bodyD,
    };
    // 28 宽 × 44 高，用多行 ASCII 拼出一个有头、躯干、手臂、双腿的机甲
    const ascii = `
............................
.........SSSSSS.............
........SBBBBBBBS...........
.......SBbbbbbbBS...........
......SBBMMMMMMBBS..........
.....SBBMEEEEEEBMBS.........
.....SBbMEEEEEEBmBS.........
.....SBBMMMMMMMMBBS.........
......SBBBBBBBBBBS..........
.......SSSSSSSSSS...........
.....SBBBBBBBBBBBBBS........
....SBbbbbbbbbbbbbBS........
....SBbMMMMMMMMMMMBS........
....SBbMBBBBBBBBBMBS........
....SBbMBbbbbbbBMMBS........
....SBbMBBGGGGGBBMBS........
....SBbMMMMMMMMMMMBS........
....SBbbbGGGGGGbbbBS........
....SBbMMMMMMMMMMMBS........
....SBbbbbbbbbbbbbBS........
....SBBBBBBBBBBBBBBS........
.....SBBBBBBBBBBBBS.........
......SSSSSSSSSSSS..........
.......SBBSSSSBBS...........
.......SBBSSSSBBS...........
.......SBBSSSSBBS...........
.......SBBSSSSBBS...........
.......SBBSSSSBBS...........
.......SBBSSSSBBS...........
.......SLLSSSSLLS...........
.......LLL....LLL...........
......LLLL....LLLL..........
.....LLLLL....LLLLL.........
.....LLLLL....LLLLL.........
.....LLLLL....LLLLL.........
......LLL......LLL..........
............................
............................
............................
............................
............................
............................
............................
............................
`;
    // 修正：上面的 'm' 被当作非键，忽略；让我们把它当作 body 处理
    return asciiToMatrix(ascii, colors);
  }

  /* 攻击时拳/枪前伸 —— 用简化的附加图 */
  function makeArmSprite(body, metal) {
    const colors = { B: body, M: metal };
    const ascii = `
........
..MMMM..
.MBBBBM.
.MBBBBM.
.MBBBBM.
..MMMM..
...MM...
`;
    return asciiToMatrix(ascii, colors);
  }

  /* 盾 */
  function makeShieldSprite(metal) {
    const colors = { M: metal, S: '#888', D: '#444' };
    const ascii = `
..MMMM..
.MMMMMMM
.MSMMMSM
.MMMMMMM
.MDMMMDM
.MMMMMMM
..MMMMM.
...MMM..
....M...
`;
    return asciiToMatrix(ascii, colors);
  }

  /* 预渲染：像素矩阵 → offscreen canvas，便于翻转与缩放绘制 */
  function bakeSprite(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const c = document.createElement('canvas');
    c.width = cols;
    c.height = rows;
    const cc = c.getContext('2d');
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const color = matrix[j][i];
        if (!color) continue;
        cc.fillStyle = color;
        cc.fillRect(i, j, 1, 1);
      }
    }
    return c;
  }

  const SPR = {
    p1: bakeSprite(makeMechSprite(PAL.p1Body, PAL.p1BodyD, PAL.p1Metal, PAL.p1Eye)),
    p2: bakeSprite(makeMechSprite(PAL.p2Body, PAL.p2BodyD, PAL.p2Metal, PAL.p2Eye)),
    arm1: bakeSprite(makeArmSprite(PAL.p1Body, PAL.p1Metal)),
    arm2: bakeSprite(makeArmSprite(PAL.p2Body, PAL.p2Metal)),
    shield: bakeSprite(makeShieldSprite(PAL.p1Metal)),
  };

  /* ---------- 机甲实体 ---------- */
  class Mech {
    constructor({ x, facing, palette, id, controls }) {
      this.id = id;
      this.palette = palette;
      this.controls = controls;
      this.x = x;
      this.y = GROUND_Y - MECH_H;
      this.vx = 0;
      this.vy = 0;
      this.w = MECH_W;
      this.h = MECH_H;
      this.facing = facing; // 1 向右，-1 向左
      this.onGround = true;
      this.hp = MAX_HP;
      this.state = 'idle'; // idle | walk | jump | attack | block | hurt | ko
      this.anim = 0;      // 动画帧（float）
      this.animFrame = 0; // 整数帧
      this.attackCooldown = 0;
      this.attackTimer = 0;    // >0 表示攻击中
      this.attackHitDone = false;
      this.blocking = false;
      this.hurtTimer = 0;
      this.hitStop = 0;
      this.flashTimer = 0;
      this.knockbackVx = 0;
      this.shake = 0;
    }

    get aabb() {
      return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    /* 攻击命中盒：从身体朝向方向伸出一个小盒子 */
    get hitbox() {
      const reach = 22;
      const hx = this.facing === 1 ? this.x + this.w - 4 : this.x + 4 - reach;
      return { x: hx, y: this.y + 14, w: reach, h: 16 };
    }

    update(opponent) {
      if (this.hp <= 0) {
        this.state = 'ko';
        this.vx *= 0.85;
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        if (this.y + this.h >= GROUND_Y) {
          this.y = GROUND_Y - this.h;
          this.vy = 0;
        }
        return;
      }

      /* 输入 */
      const ctl = this.controls;
      const left = keys.has(ctl.left);
      const right = keys.has(ctl.right);
      const jumpKey = keyPressed.has(ctl.jump);
      const attackKey = keyPressed.has(ctl.attack);
      const blockDown = keys.has(ctl.block);

      this.blocking = false;
      const baseMove = MOVE_SPEED * (this.hurtTimer > 0 ? 0.4 : 1);

      /* 水平移动 */
      if (this.hurtTimer > 0) {
        // 被击退中：受 knockback 主导
      } else if (attackKey && this.attackCooldown <= 0) {
        this.attackTimer = 14;
        this.attackCooldown = 28;
        this.attackHitDone = false;
      } else if (blockDown) {
        this.blocking = true;
        this.vx *= 0.6;
      } else {
        if (left && !right) {
          this.vx = -baseMove;
          this.facing = -1;
        } else if (right && !left) {
          this.vx = baseMove;
          this.facing = 1;
        } else {
          this.vx *= FRICTION;
          if (Math.abs(this.vx) < 0.05) this.vx = 0;
        }
      }

      /* 跳跃 */
      if (jumpKey && this.onGround && this.hurtTimer <= 0) {
        this.vy = JUMP_V;
        this.onGround = false;
      }

      /* 外力（击退） */
      if (Math.abs(this.knockbackVx) > 0.1) {
        this.vx += this.knockbackVx;
        this.knockbackVx *= 0.7;
        if (Math.abs(this.knockbackVx) < 0.1) this.knockbackVx = 0;
      }

      /* 物理 */
      this.vy += GRAVITY;
      this.x += this.vx;
      this.y += this.vy;

      /* 地面 */
      if (this.y + this.h >= GROUND_Y) {
        this.y = GROUND_Y - this.h;
        this.vy = 0;
        if (!this.onGround) {
          this.onGround = true;
          spawnDust(this.x + this.w / 2, GROUND_Y, 4);
        }
      }

      /* 边界 */
      this.x = clamp(this.x, 8, W - 8 - this.w);

      /* 与对手的简易排斥（防止重叠） */
      if (opponent && opponent !== this && opponent.hp > 0) {
        const a = this.aabb, b = opponent.aabb;
        if (rectOverlap(a, b)) {
          const midA = this.x + this.w / 2;
          const midB = opponent.x + opponent.w / 2;
          if (midA < midB) {
            this.x -= 0.6;
            opponent.x += 0.6;
          } else {
            this.x += 0.6;
            opponent.x -= 0.6;
          }
          this.x = clamp(this.x, 8, W - 8 - this.w);
          opponent.x = clamp(opponent.x, 8, W - 8 - opponent.w);
        }
      }

      /* 计时器 */
      if (this.attackCooldown > 0) this.attackCooldown--;
      if (this.attackTimer > 0) this.attackTimer--;
      if (this.hurtTimer > 0) this.hurtTimer--;
      if (this.flashTimer > 0) this.flashTimer--;
      if (this.hitStop > 0) this.hitStop--;
      if (this.shake > 0) this.shake *= 0.85;

      /* 状态判定（用于动画选择） */
      if (this.hurtTimer > 0) this.state = 'hurt';
      else if (this.attackTimer > 0) this.state = 'attack';
      else if (!this.onGround) this.state = 'jump';
      else if (this.blocking) this.state = 'block';
      else if (Math.abs(this.vx) > 0.2) this.state = 'walk';
      else this.state = 'idle';

      /* 动画节拍 */
      this.anim += (this.state === 'walk' ? 0.22 : this.state === 'idle' ? 0.06 : 0.18);
      this.animFrame = Math.floor(this.anim) % 4;

      /* 攻击触发命中 */
      if (this.attackTimer > 0 && this.attackTimer < 10 && !this.attackHitDone) {
        const hb = this.hitbox;
        if (opponent && opponent.hp > 0 && rectOverlap(hb, opponent.aabb)) {
          this.attackHitDone = true;
          applyHit(this, opponent);
        }
      }
    }

    render(ctx) {
      /* 投影 */
      ctx.fillStyle = PAL.shadow;
      ctx.beginPath();
      ctx.ellipse(
        this.x + this.w / 2,
        GROUND_Y + 2,
        this.w * 0.45,
        4,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      /* 抖动 */
      const sx = (Math.random() - 0.5) * this.shake;
      const sy = (Math.random() - 0.5) * this.shake;

      /* 身体小幅上下呼吸 */
      let bob = 0;
      if (this.state === 'idle') bob = Math.sin(this.anim * 1.1) * 0.8;
      else if (this.state === 'walk') bob = Math.abs(Math.sin(this.anim * 2)) * -1.2;
      else if (this.state === 'jump') bob = -2;
      else if (this.state === 'hurt') bob = Math.sin(this.anim * 6) * 1;

      const baseX = Math.round(this.x + sx);
      const baseY = Math.round(this.y + sy + bob);
      const flip = this.facing === -1;

      const sprite = this.id === 'p1' ? SPR.p1 : SPR.p2;

      /* 闪烁：受击白闪 */
      if (this.flashTimer > 0 && Math.floor(this.flashTimer / 2) % 2 === 0) {
        // 先画原图，再叠一层白色
        drawSpriteFlipped(sprite, baseX, baseY, flip);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(baseX, baseY, sprite.width, sprite.height);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        drawSpriteFlipped(sprite, baseX, baseY, flip);
      }

      /* 防御盾 */
      if (this.blocking) {
        const shieldX = flip ? baseX - 6 : baseX + this.w - 2;
        const shieldY = baseY + 16;
        drawSpriteFlipped(SPR.shield, shieldX, shieldY, flip);
        /* 盾光 */
        ctx.fillStyle = 'rgba(120,200,255,0.18)';
        ctx.fillRect(shieldX - 2, shieldY - 2, SPR.shield.width + 4, SPR.shield.height + 4);
      }

      /* 攻击时伸出的拳头 */
      if (this.attackTimer > 0 && this.attackTimer < 11) {
        const armSprite = this.id === 'p1' ? SPR.arm1 : SPR.arm2;
        const t = 1 - Math.abs(this.attackTimer - 7) / 6; // 0→1→0
        const extend = 12 * t;
        const ax = flip ? baseX - extend - armSprite.width + 6 : baseX + this.w - 6 + extend - armSprite.width * 0;
        const ay = baseY + 18;
        drawSpriteFlipped(armSprite, flip ? ax + armSprite.width : ax, ay, flip);
      }

      /* 被击火花在全局 particles 中绘制 */
    }
  }

  function drawSpriteFlipped(sprite, x, y, flip) {
    if (flip) {
      ctx.save();
      ctx.translate(x + sprite.width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(sprite, x, y);
    }
  }

  /* ---------- 击中处理 ---------- */
  function applyHit(attacker, target) {
    const baseDmg = 9 + Math.floor(Math.random() * 4);
    let dmg = baseDmg;
    let kb = 2.6;
    let shake = 2;

    if (target.blocking) {
      dmg = 0;
      kb = 1.2;
      shake = 1;
      spawnSpark(target.x + target.w / 2 + target.facing * -10, target.y + 22, '#88ccff', 10);
    } else {
      spawnSpark(target.x + target.w / 2, target.y + 20, PAL.spark, 14);
    }

    target.hp = clamp(target.hp - dmg, 0, MAX_HP);
    target.hurtTimer = 18;
    target.flashTimer = 10;
    target.attackTimer = 0;
    target.knockbackVx = attacker.facing * kb;
    target.shake = shake;
    attacker.hitStop = 3;

    game.hitStop = Math.max(game.hitStop, 3);
    game.cameraShake = Math.max(game.cameraShake, shake);
  }

  /* ---------- 粒子 ---------- */
  const particles = [];
  function spawnSpark(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x, y,
        vx: rand(-2.4, 2.4),
        vy: rand(-2.8, 0.4),
        life: rand(18, 32),
        age: 0,
        color: Math.random() < 0.5 ? color : PAL.spark2,
        size: Math.random() < 0.7 ? 2 : 3,
        gravity: 0.25,
      });
    }
  }
  function spawnDust(x, y, n) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x, y,
        vx: rand(-1.2, 1.2),
        vy: rand(-0.8, -0.1),
        life: rand(14, 22),
        age: 0,
        color: '#a88a6a',
        size: 2,
        gravity: 0.05,
      });
    }
  }
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.96;
      if (p.age >= p.life) particles.splice(i, 1);
    }
  }
  function renderParticles() {
    for (const p of particles) {
      const alpha = 1 - p.age / p.life;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- 场景 ---------- */
  // 远山：每局固定的伪随机轮廓
  let mountainProfile = [];
  function genMountain(seed) {
    let s = seed | 0;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const arr = [];
    let h = 180;
    for (let x = 0; x <= W; x += 8) {
      h += (rnd() - 0.5) * 18;
      h = clamp(h, 150, 240);
      arr.push({ x, h });
    }
    return arr;
  }

  // 星空：在进入游戏时固定一次
  let stars = [];
  function genStars() {
    stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({ x: Math.floor(rand(0, W)), y: Math.floor(rand(10, 140)), s: Math.random() < 0.3 ? 2 : 1 });
    }
  }

  function renderScene(t) {
    /* 天空渐变（条带式，复古感） */
    const bands = [
      { y: 0, h: 60, c: PAL.sky1 },
      { y: 60, h: 60, c: PAL.sky2 },
      { y: 120, h: 80, c: '#6a3a6a' },
      { y: 200, h: 60, c: PAL.sky3 },
      { y: 260, h: 40, c: '#e08a4a' },
    ];
    for (const b of bands) ctx.fillStyle = b.c, ctx.fillRect(0, b.y, W, b.h);

    /* 星星 */
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      const blink = ((t / 30 + s.x) | 0) % 7 === 0 ? 0 : 1;
      if (blink) ctx.fillRect(s.x, s.y, s.s, s.s);
    }

    /* 太阳 / 月 */
    ctx.fillStyle = PAL.sun;
    const sunX = 480, sunY = 90;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,210,122,0.18)';
    ctx.beginPath(); ctx.arc(sunX, sunY, 34, 0, Math.PI * 2); ctx.fill();

    /* 远山 1 */
    ctx.fillStyle = PAL.mountain1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (const p of mountainProfile) ctx.lineTo(p.x, p.h);
    ctx.lineTo(W, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    /* 远山 2（更矮、更暗） */
    ctx.fillStyle = PAL.mountain2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let i = 0; i < mountainProfile.length; i++) {
      const p = mountainProfile[i];
      ctx.lineTo(p.x, p.h + 26 + Math.sin(i) * 2);
    }
    ctx.lineTo(W, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    /* 远景建筑剪影（像素方块） */
    const skyline = [
      [20, 262, 18, 20], [46, 252, 14, 30], [68, 258, 22, 24],
      [100, 248, 18, 34], [126, 260, 14, 22], [150, 254, 26, 28],
      [200, 258, 16, 24], [226, 250, 18, 32], [256, 256, 14, 26],
      [282, 252, 22, 30], [330, 258, 18, 24], [360, 250, 22, 32],
      [400, 254, 14, 28], [430, 248, 22, 34], [470, 256, 18, 26],
      [510, 252, 22, 30], [550, 258, 18, 24], [580, 250, 14, 32],
      [606, 256, 22, 28],
    ];
    ctx.fillStyle = '#0e0a22';
    for (const [x, y, w, h] of skyline) ctx.fillRect(x, y, w, h);
    /* 窗户 */
    ctx.fillStyle = '#ffcc33';
    for (const [x, y, w, h] of skyline) {
      for (let wy = y + 4; wy < y + h - 2; wy += 6) {
        for (let wx = x + 2; wx < x + w - 2; wx += 5) {
          if (((wx + wy + x) & 3) === 0) ctx.fillRect(wx, wy, 2, 2);
        }
      }
    }

    /* 地面 */
    ctx.fillStyle = PAL.ground2;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = PAL.ground1;
    ctx.fillRect(0, GROUND_Y, W, 4);
    ctx.fillStyle = PAL.ground3;
    ctx.fillRect(0, GROUND_Y + 14, W, 2);

    /* 地面网格（近大远小伪透视） */
    ctx.strokeStyle = PAL.grid;
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= W; gx += 32) {
      ctx.beginPath();
      ctx.moveTo(gx, GROUND_Y + 4);
      ctx.lineTo(gx + (gx - W / 2) * 0.08, H);
      ctx.stroke();
    }
    for (let gy = GROUND_Y + 16; gy <= H; gy += 10) {
      ctx.fillStyle = PAL.grid;
      ctx.fillRect(0, gy, W, 1);
    }

    /* 装饰灯柱 */
    for (let i = 0; i < 4; i++) {
      const lx = 60 + i * 150;
      ctx.fillStyle = '#222';
      ctx.fillRect(lx, GROUND_Y - 24, 2, 24);
      ctx.fillStyle = (i + (t / 40 | 0)) % 2 === 0 ? '#ffee66' : '#885522';
      ctx.fillRect(lx - 2, GROUND_Y - 28, 6, 4);
    }
  }

  /* ---------- HUD ---------- */
  function renderHUD() {
    /* 顶部血条外框 */
    const barW = 220, barH = 14;
    const p1X = 12, p1Y = 12;
    const p2X = W - 12 - barW, p2Y = 12;

    /* P1 */
    drawHpBar(p1X, p1Y, barW, barH, game.p1.hp / MAX_HP, PAL.hpFillP1, 'P1 · 赤红', true);
    /* P2 */
    drawHpBar(p2X, p2Y, barW, barH, game.p2.hp / MAX_HP, PAL.hpFillP2, 'P2 · 深蓝', false);

    /* 局数 */
    ctx.fillStyle = PAL.text;
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = PAL.textShadow;
    ctx.fillText(`ROUND ${game.round} / ${MAX_ROUNDS}   ${game.scoreP1} : ${game.scoreP2}`, W / 2 + 1, 14);
    ctx.fillStyle = PAL.text;
    ctx.fillText(`ROUND ${game.round} / ${MAX_ROUNDS}   ${game.scoreP1} : ${game.scoreP2}`, W / 2, 13);

    /* 计时 */
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.textShadow;
    ctx.fillText(`TIME ${Math.max(0, Math.ceil(game.timer / 60))}`, W / 2 + 1, 30);
    ctx.fillStyle = PAL.accent;
    ctx.fillText(`TIME ${Math.max(0, Math.ceil(game.timer / 60))}`, W / 2, 29);

    ctx.textAlign = 'start';
  }

  function drawHpBar(x, y, w, h, ratio, color, label, leftAlign) {
    /* 外黑边 */
    ctx.fillStyle = PAL.hpBorder;
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#0b0e22';
    ctx.fillRect(x, y, w, h);

    /* 分段刻度 */
    for (let i = 1; i < 10; i++) {
      ctx.fillStyle = '#1a1e3a';
      ctx.fillRect(x + (w * i) / 10, y, 1, h);
    }

    /* 血条 */
    const fw = Math.max(0, Math.floor(w * ratio));
    const fx = leftAlign ? x : x + (w - fw);
    ctx.fillStyle = color;
    ctx.fillRect(fx, y + 2, fw, h - 4);

    /* 高光 */
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(fx, y + 2, fw, 2);

    /* 标签 */
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = PAL.textShadow;
    ctx.fillText(label, (leftAlign ? x : x + w - ctx.measureText(label).width) + 1, y - 11);
    ctx.fillStyle = PAL.text;
    ctx.fillText(label, leftAlign ? x : x + w - ctx.measureText(label).width, y - 12);
  }

  /* 中心浮字（KO / FIGHT! 等） */
  const floatTexts = [];
  function spawnFloat(text, color, duration = 60) {
    floatTexts.push({ text, color, age: 0, life: duration });
  }
  function updateFloats() {
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      floatTexts[i].age++;
      if (floatTexts[i].age >= floatTexts[i].life) floatTexts.splice(i, 1);
    }
  }
  function renderFloats() {
    for (const f of floatTexts) {
      const t = f.age / f.life;
      const alpha = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
      const scale = 1 + t * 0.6;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(W / 2, 110);
      ctx.scale(scale, scale);
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(f.text, 2, 2);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, 0, 0);
      ctx.restore();
    }
  }

  /* ---------- 游戏主对象 ---------- */
  const MAX_ROUNDS = 3;
  const game = {
    p1: null,
    p2: null,
    round: 1,
    scoreP1: 0,
    scoreP2: 0,
    state: 'title', // title | intro | fight | roundEnd | matchEnd
    stateTimer: 0,
    timer: 60 * 60, // 60 秒（60fps）
    hitStop: 0,
    cameraShake: 0,
    t: 0,
  };

  function resetRound() {
    game.p1 = new Mech({
      x: 120, facing: 1, id: 'p1',
      controls: { left: 'a', right: 'd', jump: 'w', attack: 'f', block: 'g' },
    });
    game.p2 = new Mech({
      x: W - 120 - MECH_W, facing: -1, id: 'p2',
      controls: { left: 'arrowleft', right: 'arrowright', jump: 'arrowup', attack: 'j', block: 'k' },
    });
    game.timer = 60 * 60;
    particles.length = 0;
    floatTexts.length = 0;
    game.state = 'intro';
    game.stateTimer = 90;
    showOverlay('ROUND ' + game.round, '准备…', false);
  }

  function resetMatch() {
    game.round = 1;
    game.scoreP1 = 0;
    game.scoreP2 = 0;
    genStars();
    mountainProfile = genMountain(Math.random() * 1e6);
    resetRound();
  }

  function showOverlay(title, sub, autoHideAfter) {
    overlayTitle.textContent = title;
    overlaySub.textContent = sub;
    overlay.classList.remove('hidden');
    if (autoHideAfter) {
      setTimeout(() => overlay.classList.add('hidden'), autoHideAfter);
    }
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  /* ---------- 循环 ---------- */
  function update() {
    game.t++;
    game.cameraShake *= 0.85;

    /* 按键：Enter 随时重开 */
    if (keyPressed.has('enter')) {
      if (game.state === 'title' || game.state === 'matchEnd') {
        resetMatch();
      } else {
        resetMatch();
      }
    }

    if (game.hitStop > 0) { game.hitStop--; return; }

    if (game.state === 'title') {
      /* 静态画面 */
      return;
    }

    if (game.state === 'intro') {
      game.stateTimer--;
      if (game.stateTimer === 60) spawnFloat('FIGHT!', PAL.accent, 50);
      if (game.stateTimer <= 0) {
        game.state = 'fight';
        hideOverlay();
      }
      updateParticles();
      updateFloats();
      return;
    }

    if (game.state === 'fight') {
      game.p1.update(game.p2);
      game.p2.update(game.p1);
      updateParticles();
      updateFloats();
      game.timer--;

      /* 胜负判定 */
      const p1Dead = game.p1.hp <= 0;
      const p2Dead = game.p2.hp <= 0;
      const timeUp = game.timer <= 0;
      if (p1Dead || p2Dead || timeUp) {
        if (p1Dead && p2Dead) {
          /* 同归于尽：谁也不得分，重开此局 */
          spawnFloat('DOUBLE KO', '#ffaa33', 90);
        } else if (p1Dead) {
          game.scoreP2++;
          spawnFloat('P2 WINS!', PAL.hpFillP2, 90);
        } else if (p2Dead) {
          game.scoreP1++;
          spawnFloat('P1 WINS!', PAL.hpFillP1, 90);
        } else {
          /* 时间到：按 HP 判 */
          if (game.p1.hp > game.p2.hp) {
            game.scoreP1++;
            spawnFloat('TIME UP · P1', PAL.hpFillP1, 90);
          } else if (game.p2.hp > game.p1.hp) {
            game.scoreP2++;
            spawnFloat('TIME UP · P2', PAL.hpFillP2, 90);
          } else {
            spawnFloat('DRAW', '#ffaa33', 90);
          }
        }
        game.state = 'roundEnd';
        game.stateTimer = 160;
      }
      return;
    }

    if (game.state === 'roundEnd') {
      game.p1.update(game.p2);
      game.p2.update(game.p1);
      updateParticles();
      updateFloats();
      game.stateTimer--;
      if (game.stateTimer <= 0) {
        const p1Done = game.scoreP1 >= 2;
        const p2Done = game.scoreP2 >= 2;
        if (p1Done || p2Done) {
          game.state = 'matchEnd';
          showOverlay(
            p1Done ? '🏆 P1 · 赤红 WIN' : '🏆 P2 · 深蓝 WIN',
            '按 [回车] 再战',
            false
          );
        } else {
          game.round++;
          resetRound();
        }
      }
      return;
    }

    if (game.state === 'matchEnd') {
      updateParticles();
      updateFloats();
      return;
    }
  }

  function render() {
    /* 镜头抖动 */
    const shakeX = (Math.random() - 0.5) * game.cameraShake;
    const shakeY = (Math.random() - 0.5) * game.cameraShake;

    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.translate(shakeX, shakeY);

    renderScene(game.t);

    if (game.p1 && game.p2) {
      /* 让被击退的在前景后面 */
      if (game.p1.y < game.p2.y) {
        game.p1.render(ctx);
        game.p2.render(ctx);
      } else {
        game.p2.render(ctx);
        game.p1.render(ctx);
      }
      renderParticles();
    }

    ctx.restore();

    renderHUD();
    renderFloats();

    /* 扫描线，轻微复古 CRT 感 */
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#000';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    ctx.globalAlpha = 1;
  }

  function frame() {
    update();
    render();
    keyPressed.clear();
    requestAnimationFrame(frame);
  }

  /* ---------- 启动 ---------- */
  function boot() {
    genStars();
    mountainProfile = genMountain(42);
    game.state = 'title';
    /* 标题画面：放置两个机甲作为展示 */
    game.p1 = new Mech({
      x: 120, facing: 1, id: 'p1',
      controls: { left: 'a', right: 'd', jump: 'w', attack: 'f', block: 'g' },
    });
    game.p2 = new Mech({
      x: W - 120 - MECH_W, facing: -1, id: 'p2',
      controls: { left: 'arrowleft', right: 'arrowright', jump: 'arrowup', attack: 'j', block: 'k' },
    });
    showOverlay('PIXEL MECH DUEL', '按 [回车] 开始', false);
    requestAnimationFrame(frame);
  }

  boot();
})();
