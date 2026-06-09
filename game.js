(() => {
  'use strict';

  // ========================================================================
  // 1. 关卡配置 & 风格主题
  // ========================================================================

  const THEMES = {
    neon: {
      name: '霓虹',
      bgTop: '#1a0b3d',
      bgBot: '#0a0520',
      grid: 'rgba(255,255,255,0.04)',
      brickColors: ['#4fc3f7', '#ff6ec7', '#ffd166', '#7c4dff', '#69f0ae'],
      glow: true,
      emoji: '🌆',
    },
    ocean: {
      name: '深海',
      bgTop: '#003c5c',
      bgBot: '#001822',
      grid: 'rgba(255,255,255,0.03)',
      brickColors: ['#26c6da', '#00bcd4', '#4dd0e1', '#80deea', '#b2ebf2'],
      glow: false,
      emoji: '🌊',
    },
    forest: {
      name: '森林',
      bgTop: '#1b4332',
      bgBot: '#081c15',
      grid: 'rgba(255,255,255,0.03)',
      brickColors: ['#95d5b2', '#74c69d', '#52b788', '#40916c', '#2d6a4f'],
      glow: false,
      emoji: '🌲',
    },
    fire: {
      name: '熔岩',
      bgTop: '#3a0a0a',
      bgBot: '#150505',
      grid: 'rgba(255,255,255,0.03)',
      brickColors: ['#ff9f1c', '#ffbf69', '#ff5470', '#e63946', '#f1a208'],
      glow: true,
      emoji: '🔥',
    },
    candy: {
      name: '糖果',
      bgTop: '#4a1942',
      bgBot: '#1a0a2e',
      grid: 'rgba(255,255,255,0.04)',
      brickColors: ['#ff99c8', '#fcf6bd', '#d0f4de', '#a9def9', '#e4c1f9'],
      glow: true,
      emoji: '🍬',
    },
    space: {
      name: '星空',
      bgTop: '#0a0e40',
      bgBot: '#02030d',
      grid: 'rgba(255,255,255,0.02)',
      brickColors: ['#bdb2ff', '#a0c4ff', '#caffbf', '#ffc6ff', '#fffffc'],
      glow: true,
      emoji: '🌌',
    },
  };

  const GOAL_TYPES = {
    CLEAR_ALL: 'clear_all',
    LIMITED_SHOTS: 'limited_shots',
    TIME_SCORE: 'time_score',
    TARGET_SCORE: 'target_score',
  };

  const LEVELS = [
    {
      id: 1,
      title: '初级试炼',
      theme: 'neon',
      goal: GOAL_TYPES.CLEAR_ALL,
      balls: 6,
      brickRows: 5,
      brickCols: 10,
      hpScale: 1.0,
      layout: 'rows',
      unbreakableRatio: 0,
      specialRatio: 0.15,
    },
    {
      id: 2,
      title: '深海走廊',
      theme: 'ocean',
      goal: GOAL_TYPES.LIMITED_SHOTS,
      balls: 8,
      brickRows: 6,
      brickCols: 12,
      hpScale: 1.2,
      layout: 'checker',
      unbreakableRatio: 0.05,
      specialRatio: 0.18,
    },
    {
      id: 3,
      title: '森林迷阵',
      theme: 'forest',
      goal: GOAL_TYPES.TARGET_SCORE,
      targetScore: 2000,
      balls: 10,
      brickRows: 6,
      brickCols: 14,
      hpScale: 1.4,
      layout: 'pyramid',
      unbreakableRatio: 0.08,
      specialRatio: 0.2,
    },
    {
      id: 4,
      title: '熔岩核心',
      theme: 'fire',
      goal: GOAL_TYPES.TIME_SCORE,
      timeLimit: 90,
      targetScore: 2500,
      balls: 12,
      brickRows: 7,
      brickCols: 14,
      hpScale: 1.6,
      layout: 'diamond',
      unbreakableRatio: 0.1,
      specialRatio: 0.22,
    },
    {
      id: 5,
      title: '糖果梦境',
      theme: 'candy',
      goal: GOAL_TYPES.LIMITED_SHOTS,
      balls: 10,
      brickRows: 7,
      brickCols: 16,
      hpScale: 1.8,
      layout: 'waves',
      unbreakableRatio: 0.12,
      specialRatio: 0.25,
    },
    {
      id: 6,
      title: '星海关底',
      theme: 'space',
      goal: GOAL_TYPES.CLEAR_ALL,
      balls: 15,
      brickRows: 8,
      brickCols: 16,
      hpScale: 2.2,
      layout: 'random',
      unbreakableRatio: 0.15,
      specialRatio: 0.3,
    },
  ];

  // ========================================================================
  // 2. Buff 配置
  // ========================================================================

  const BUFF_TYPES = {
    MULTI_BALL: {
      key: 'MULTI_BALL',
      name: '分裂弹珠',
      icon: '⚡',
      color: '#ffd166',
      duration: 0,
      desc: '掉落时立刻分裂出 2 颗额外弹珠',
      instant: true,
    },
    POWER: {
      key: 'POWER',
      name: '强化炮弹',
      icon: '💥',
      color: '#ff5470',
      duration: 10,
      desc: '碰撞伤害 x2，持续 10 秒',
      instant: false,
    },
    SLOW: {
      key: 'SLOW',
      name: '慢速弹珠',
      icon: '🐢',
      color: '#4fc3f7',
      duration: 8,
      desc: '弹珠速度降低，便于瞄准，持续 8 秒',
      instant: false,
    },
    WIDE_PADDLE: {
      key: 'WIDE_PADDLE',
      name: '宽幅炮台',
      icon: '📏',
      color: '#69f0ae',
      duration: 12,
      desc: '炮台宽度增加，持续 12 秒',
      instant: false,
    },
    LASER: {
      key: 'LASER',
      name: '激光穿透',
      icon: '🔺',
      color: '#e040fb',
      duration: 6,
      desc: '弹珠可穿透方块，持续 6 秒',
      instant: false,
    },
    EXTRA_BALL: {
      key: 'EXTRA_BALL',
      name: '额外弹珠',
      icon: '🎁',
      color: '#ffd166',
      duration: 0,
      desc: '立刻获得 1 颗额外弹珠',
      instant: true,
    },
  };

  // ========================================================================
  // 3. 工具函数
  // ========================================================================

  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ========================================================================
  // 4. 音效系统
  // ========================================================================

  const AudioManager = {
    audioContext: null,
    bgmEnabled: true,
    sfxEnabled: true,
    bgmNode: null,
    init() {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.startBGM();
    },
    startBGM() {
      if (!this.bgmEnabled || !this.audioContext) return;
      const ctx = this.audioContext;
      const gain = ctx.createGain();
      gain.gain.value = 0.15;
      gain.connect(ctx.destination);

      let time = 0;
      const play = () => {
        if (!this.bgmEnabled) return;
        const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
        const note = notes[Math.floor(Math.random() * notes.length)];
        
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = note;
        
        noteGain.gain.setValueAtTime(0, ctx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
        
        osc.connect(noteGain);
        noteGain.connect(gain);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 2);
        
        time += 0.8 + Math.random() * 0.6;
        setTimeout(play, time * 1000 - ctx.currentTime * 1000);
      };
      play();
    },
    toggleBGM() {
      this.bgmEnabled = !this.bgmEnabled;
      if (this.bgmEnabled && this.audioContext) {
        this.startBGM();
      }
      return this.bgmEnabled;
    },
    toggleSFX() {
      this.sfxEnabled = !this.sfxEnabled;
      return this.sfxEnabled;
    },
    playTone(freq, duration, type = 'sine', volume = 0.1) {
      if (!this.sfxEnabled || !this.audioContext) return;
      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, ctx.currentTime + duration);
      
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    },
    playHit() {
      this.playTone(800 + Math.random() * 400, 0.08, 'square', 0.08);
    },
    playBounce() {
      this.playTone(1200 + Math.random() * 300, 0.05, 'sine', 0.05);
    },
    playBreak() {
      this.playTone(600, 0.15, 'sawtooth', 0.12);
      setTimeout(() => this.playTone(800, 0.1, 'sine', 0.08), 50);
    },
    playBuff() {
      this.playTone(523, 0.15, 'sine', 0.1);
      setTimeout(() => this.playTone(659, 0.15, 'sine', 0.1), 100);
      setTimeout(() => this.playTone(784, 0.2, 'sine', 0.1), 200);
    },
    playLaunch() {
      this.playTone(200 + Math.random() * 100, 0.1, 'sawtooth', 0.1);
    },
    playSuccess() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((n, i) => {
        setTimeout(() => this.playTone(n, 0.3, 'sine', 0.12), i * 150);
      });
    },
    playFail() {
      this.playTone(300, 0.4, 'sawtooth', 0.1);
      setTimeout(() => this.playTone(200, 0.6, 'sawtooth', 0.1), 300);
    },
  };

  // ========================================================================
  // 5. 游戏核心类
  // ========================================================================

  class Ball {
    constructor(x, y, vx, vy, radius = 8) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.r = radius;
      this.baseR = radius;
      this.trail = [];
      this.alive = true;
      this.laserPhase = 0;
      this.bounceCount = 0;
      this.lastBrickHit = null;
    }

    update(dt, game) {
      const speedMul = game.hasBuff('SLOW') ? 0.7 : 1.0;
      this.x += this.vx * dt * speedMul;
      this.y += this.vy * dt * speedMul;

      if (this.x - this.r < 0) {
        this.x = this.r;
        this.vx = Math.abs(this.vx);
        this.bounceCount++;
        AudioManager.playBounce();
      } else if (this.x + this.r > game.width) {
        this.x = game.width - this.r;
        this.vx = -Math.abs(this.vx);
        this.bounceCount++;
        AudioManager.playBounce();
      }
      if (this.y - this.r < 0) {
        this.y = this.r;
        this.vy = Math.abs(this.vy);
        this.bounceCount++;
        AudioManager.playBounce();
      }

      if (this.y - this.r > game.height + 40) {
        this.alive = false;
      }

      if (this.bounceCount > 60) {
        this.alive = false;
      }

      this.trail.push({ x: this.x, y: this.y, t: 1 });
      if (this.trail.length > 8) this.trail.shift();
      this.trail.forEach((p) => (p.t -= dt * 3));

      this.laserPhase += dt * 8;
    }

    draw(ctx, game) {
      const isLaser = game.hasBuff('LASER');
      const isPower = game.hasBuff('POWER');

      for (let i = 0; i < this.trail.length; i++) {
        const p = this.trail[i];
        if (p.t <= 0) continue;
        ctx.beginPath();
        ctx.fillStyle = isLaser
          ? `rgba(224,64,251,${p.t * 0.35})`
          : isPower
          ? `rgba(255,84,112,${p.t * 0.3})`
          : `rgba(79,195,247,${p.t * 0.25})`;
        ctx.arc(p.x, p.y, this.r * p.t, 0, TAU);
        ctx.fill();
      }

      const grad = ctx.createRadialGradient(
        this.x - this.r * 0.3,
        this.y - this.r * 0.3,
        this.r * 0.2,
        this.x,
        this.y,
        this.r
      );
      grad.addColorStop(0, '#ffffff');
      if (isLaser) {
        grad.addColorStop(0.5, '#e040fb');
        grad.addColorStop(1, '#4a0072');
      } else if (isPower) {
        grad.addColorStop(0.5, '#ff5470');
        grad.addColorStop(1, '#7a0020');
      } else {
        grad.addColorStop(0.5, '#4fc3f7');
        grad.addColorStop(1, '#01579b');
      }

      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(this.x, this.y, this.r, 0, TAU);
      ctx.fill();

      if (isLaser || isPower) {
        ctx.shadowColor = isLaser ? '#e040fb' : '#ff5470';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.arc(this.x, this.y, this.r * 0.5, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  class Brick {
    constructor(x, y, w, h, hp, color, opts = {}) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.maxHp = hp;
      this.hp = hp;
      this.color = color;
      this.alive = true;
      this.unbreakable = opts.unbreakable || false;
      this.special = opts.special || false;
      this.hitFlash = 0;
      this.shakeX = 0;
      this.shakeY = 0;
      this.dropChance = opts.dropChance || 0;
      this.crackLevel = 0;
    }

    getRect() {
      return {
        x: this.x + this.shakeX,
        y: this.y + this.shakeY,
        w: this.w,
        h: this.h,
      };
    }

    hit(damage, game) {
      if (this.unbreakable) {
        this.hitFlash = 0.3;
        return { destroyed: false, bounced: true };
      }
      this.hp -= damage;
      this.hitFlash = 0.35;
      this.shakeX = rand(-3, 3);
      this.shakeY = rand(-2, 2);
      this.crackLevel = Math.min(3, Math.floor((this.maxHp - this.hp) / (this.maxHp / 3)));

      if (this.hp <= 0) {
        this.alive = false;
        const baseScore = this.maxHp * 50;
        game.addScore(baseScore);
        game.spawnBrickParticles(this.x + this.w / 2, this.y + this.h / 2, this.color);
        AudioManager.playBreak();
        if (this.special || Math.random() < this.dropChance) {
          game.maybeSpawnBuff(this.x + this.w / 2, this.y + this.h / 2, this.special);
        }
        return { destroyed: true, bounced: true };
      }
      AudioManager.playHit();
      return { destroyed: false, bounced: true };
    }

    update(dt) {
      this.hitFlash = Math.max(0, this.hitFlash - dt * 2);
      this.shakeX *= 0.85;
      this.shakeY *= 0.85;
    }

    draw(ctx) {
      const r = this.getRect();
      const radius = 4;

      if (this.unbreakable) {
        ctx.fillStyle = '#3a3f5a';
        ctx.strokeStyle = '#7a8099';
      } else {
        const hpRatio = this.hp / this.maxHp;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.4 + hpRatio * 0.6;
      }

      this.roundRect(ctx, r.x, r.y, r.w, r.h, radius);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = this.unbreakable
        ? '#7a8099'
        : this.hitFlash > 0
        ? '#ffffff'
        : 'rgba(255,255,255,0.3)';
      this.roundRect(ctx, r.x, r.y, r.w, r.h, radius);
      ctx.stroke();

      this.drawCracks(ctx, r);

      if (!this.unbreakable) {
        ctx.fillStyle = '#ffffff';
        ctx.font = this.h >= 22 ? 'bold 11px system-ui' : 'bold 9px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.hp, r.x + r.w / 2, r.y + r.h / 2);
      } else {
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#c5cae9';
        ctx.fillText('✦', r.x + r.w / 2, r.y + r.h / 2);
      }

      if (this.special && !this.unbreakable) {
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        this.roundRect(ctx, r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3, radius - 1);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    drawCracks(ctx, r) {
      if (this.crackLevel === 0 || this.unbreakable) return;
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      const cracks = [
        { x1: 0, y1: 0, x2: r.w, y2: r.h },
        { x1: r.w, y1: 0, x2: 0, y2: r.h },
        { x1: r.w / 2, y1: 0, x2: r.w / 2, y2: r.h },
        { x1: 0, y1: r.h / 2, x2: r.w, y2: r.h / 2 },
      ];

      for (let i = 0; i < Math.min(this.crackLevel * 2, cracks.length); i++) {
        const c = cracks[i];
        ctx.moveTo(r.x + c.x1, r.y + c.y1);
        ctx.lineTo(r.x + c.x2, r.y + c.y2);
      }
      ctx.stroke();
    }

    roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  }

  class Buff {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.r = 16;
      this.vy = 80;
      this.alive = true;
      this.phase = Math.random() * TAU;
    }

    update(dt, game) {
      this.y += this.vy * dt;
      this.phase += dt * 4;
      if (this.y - this.r > game.height + 40) this.alive = false;
    }

    draw(ctx) {
      const pulse = 1 + Math.sin(this.phase) * 0.12;
      const r = this.r * pulse;

      ctx.beginPath();
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 1.8);
      grad.addColorStop(0, this.type.color + 'cc');
      grad.addColorStop(1, this.type.color + '00');
      ctx.fillStyle = grad;
      ctx.arc(this.x, this.y, r * 1.8, 0, TAU);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.arc(this.x, this.y, r, 0, TAU);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = this.type.color;
      ctx.arc(this.x, this.y, r - 3, 0, TAU);
      ctx.fill();

      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.type.icon, this.x, this.y + 1);
    }
  }

  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.vx = rand(-200, 200);
      this.vy = rand(-240, -40);
      this.life = rand(0.4, 0.9);
      this.max = this.life;
      this.color = color;
      this.size = rand(2, 5);
    }

    update(dt) {
      this.vy += 600 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
    }

    draw(ctx) {
      const a = this.life / this.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // ========================================================================
  // 6. 游戏主控制器
  // ========================================================================

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.width = canvas.width;
      this.height = canvas.height;

      this.balls = [];
      this.bricks = [];
      this.buffs = [];
      this.particles = [];
      this.activeBuffs = new Map();

      this.paddle = {
        x: this.width / 2,
        y: this.height - 30,
        w: 130,
        baseW: 130,
        h: 12,
      };

      this.mouse = { x: this.width / 2, y: this.height / 2 };
      this.aimAngle = -Math.PI / 2;

      this.state = 'splash';
      this.currentLevel = null;
      this.theme = THEMES.neon;

      this.score = 0;
      this.ballsRemaining = 0;
      this.ballsLaunched = 0;
      this.bricksDestroyed = 0;
      this.totalBricks = 0;
      this.timeLeft = 0;
      this.elapsed = 0;

      this.awaitingLaunch = true;
      this.launchSpeed = 520;

      this.stars = [];
      this.generateStars();

      this.lastTime = 0;
      this.spaceHoldTime = 0;
      this.isHoldingSpace = false;

      requestAnimationFrame((t) => this.loop(t));
    }

    generateStars() {
      this.stars = [];
      for (let i = 0; i < 120; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          r: rand(0.3, 1.6),
          a: rand(0.15, 0.7),
          speed: rand(2, 10),
        });
      }
    }

    loadLevel(levelConfig) {
      this.currentLevel = levelConfig;
      this.theme = THEMES[levelConfig.theme] || THEMES.neon;
      this.balls = [];
      this.bricks = [];
      this.buffs = [];
      this.particles = [];
      this.activeBuffs.clear();

      this.score = 0;
      this.ballsRemaining = levelConfig.balls;
      this.ballsLaunched = 0;
      this.bricksDestroyed = 0;
      this.elapsed = 0;
      this.timeLeft = levelConfig.timeLimit || 0;
      this.awaitingLaunch = true;

      this.paddle.x = this.width / 2;
      this.paddle.w = this.paddle.baseW;

      this.generateBricks(levelConfig);
      this.totalBricks = this.bricks.filter((b) => !b.unbreakable).length;
      this.state = 'playing';
      this.updateUI();
    }

    generateBricks(cfg) {
      const cols = cfg.brickCols;
      const rows = cfg.brickRows;
      const padding = 5;
      const topOffset = 50;
      const sideOffset = 25;
      const w = (this.width - sideOffset * 2 - padding * (cols - 1)) / cols;
      const h = Math.min(22, Math.max(16, (this.height * 0.45) / rows));

      const colors = this.theme.brickColors;

      const shouldHave = (r, c) => {
        switch (cfg.layout) {
          case 'rows':
            return true;
          case 'checker':
            return (r + c) % 2 === 0;
          case 'pyramid': {
            const mid = (cols - 1) / 2;
            return Math.abs(c - mid) <= rows - r;
          }
          case 'diamond': {
            const midC = (cols - 1) / 2;
            const midR = (rows - 1) / 2;
            return Math.abs(c - midC) + Math.abs(r - midR) <= Math.max(rows, cols) / 1.4;
          }
          case 'waves': {
            return Math.sin((c / cols) * TAU * 2 + r * 0.5) > -0.3;
          }
          case 'random': {
            return Math.random() > 0.2;
          }
          default:
            return true;
        }
      };

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!shouldHave(r, c)) continue;

          const baseHp = Math.ceil((1 + r * 0.5) * cfg.hpScale);
          const unbreakable = Math.random() < cfg.unbreakableRatio;
          const special = Math.random() < cfg.specialRatio;
          const dropChance = 0.18 + cfg.hpScale * 0.05;

          const brick = new Brick(
            sideOffset + c * (w + padding),
            topOffset + r * (h + padding),
            w,
            h,
            baseHp,
            colors[r % colors.length],
            {
              unbreakable,
              special,
              dropChance,
            }
          );
          this.bricks.push(brick);
        }
      }
    }

    launchBall() {
      if (!this.awaitingLaunch || this.state !== 'playing') return;
      if (this.ballsRemaining <= 0 && this.balls.length === 0) return;

      const speed = this.launchSpeed;
      const vx = Math.cos(this.aimAngle) * speed;
      const vy = Math.sin(this.aimAngle) * speed;

      const ball = new Ball(
        this.paddle.x,
        this.paddle.y - this.paddle.h / 2 - 10,
        vx,
        vy
      );
      this.balls.push(ball);
      this.ballsRemaining -= 1;
      this.ballsLaunched += 1;
      this.awaitingLaunch = false;
      AudioManager.playLaunch();
      this.updateUI();
    }

    recallBalls() {
      if (this.balls.length === 0) return;
      if (this.ballsRemaining <= 0) return;

      this.balls = [];
      this.awaitingLaunch = true;
      this.updateUI();
    }

    maybeSpawnBuff(x, y, forced) {
      const roll = forced ? 1 : Math.random();
      if (roll < 0.25 || forced) {
        const keys = Object.keys(BUFF_TYPES);
        const type = BUFF_TYPES[pick(keys)];
        this.buffs.push(new Buff(x, y, type));
      }
    }

    spawnBrickParticles(x, y, color) {
      for (let i = 0; i < 12; i++) {
        this.particles.push(new Particle(x, y, color));
      }
    }

    applyBuff(type) {
      if (type.instant) {
        if (type.key === 'MULTI_BALL') {
          const template = this.balls[0];
          if (template) {
            for (let i = 0; i < 2; i++) {
              const angle = Math.atan2(template.vy, template.vx) + rand(-0.4, 0.4);
              const sp = Math.hypot(template.vx, template.vy);
              this.balls.push(new Ball(template.x, template.y, Math.cos(angle) * sp, Math.sin(angle) * sp));
            }
          } else {
            this.ballsRemaining += 2;
          }
        } else if (type.key === 'EXTRA_BALL') {
          this.ballsRemaining += 1;
        }
      } else {
        this.activeBuffs.set(type.key, { type, remaining: type.duration, total: type.duration });
        if (type.key === 'WIDE_PADDLE') {
          this.paddle.w = this.paddle.baseW * 1.6;
        }
      }
      AudioManager.playBuff();
      this.updateBuffBar();
      this.updateUI();
    }

    hasBuff(key) {
      return this.activeBuffs.has(key);
    }

    addScore(amount) {
      this.score += amount;
      this.updateUI();
    }

    checkGoalReached() {
      const cfg = this.currentLevel;
      if (cfg.goal === GOAL_TYPES.CLEAR_ALL) {
        return this.bricks.every((b) => b.unbreakable || !b.alive);
      }
      if (cfg.goal === GOAL_TYPES.TARGET_SCORE || cfg.goal === GOAL_TYPES.TIME_SCORE) {
        return this.score >= (cfg.targetScore || 0);
      }
      return false;
    }

    goalText() {
      const cfg = this.currentLevel;
      switch (cfg.goal) {
        case GOAL_TYPES.CLEAR_ALL:
          return '清除全部方块';
        case GOAL_TYPES.LIMITED_SHOTS:
          return `${cfg.balls} 颗弹珠内清除所有方块`;
        case GOAL_TYPES.TARGET_SCORE:
          return `达到 ${cfg.targetScore} 分`;
        case GOAL_TYPES.TIME_SCORE:
          return `${cfg.timeLimit}s 内达 ${cfg.targetScore} 分`;
        default:
          return '--';
      }
    }

    collideBallRect(ball, rect) {
      const cx = clamp(ball.x, rect.x, rect.x + rect.w);
      const cy = clamp(ball.y, rect.y, rect.y + rect.h);
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      const distSq = dx * dx + dy * dy;
      if (distSq > ball.r * ball.r) return null;

      const dist = Math.sqrt(distSq) || 0.001;
      return { nx: dx / dist, ny: dy / dist, overlap: ball.r - dist };
    }

    reflectBall(ball, nx, ny, overlap) {
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx -= 2 * dot * nx;
      ball.vy -= 2 * dot * ny;
      ball.x += nx * (overlap + 0.5);
      ball.y += ny * (overlap + 0.5);
    }

    update(dt) {
      if (this.state !== 'playing') return;

      this.elapsed += dt;
      if (this.currentLevel.goal === GOAL_TYPES.TIME_SCORE && this.timeLeft > 0) {
        this.timeLeft = Math.max(0, this.timeLeft - dt);
        if (this.timeLeft === 0) {
          this.handleGameOver(this.checkGoalReached());
          return;
        }
      }

      if (this.isHoldingSpace) {
        this.spaceHoldTime += dt;
        if (this.spaceHoldTime > 0.5) {
          this.recallBalls();
          this.spaceHoldTime = 0;
        }
      } else {
        this.spaceHoldTime = 0;
      }

      for (const [key, entry] of this.activeBuffs) {
        entry.remaining -= dt;
        if (entry.remaining <= 0) {
          this.activeBuffs.delete(key);
          if (key === 'WIDE_PADDLE') this.paddle.w = this.paddle.baseW;
          this.updateBuffBar();
        }
      }

      for (const b of this.balls) b.update(dt, this);
      for (const br of this.bricks) br.update(dt);
      for (const bf of this.buffs) bf.update(dt, this);
      for (const p of this.particles) p.update(dt);

      for (const ball of this.balls) {
        for (const brick of this.bricks) {
          if (!brick.alive) continue;
          const hit = this.collideBallRect(ball, brick.getRect());
          if (!hit) continue;
          const damage = this.hasBuff('POWER') ? 2 : 1;
          const res = brick.hit(damage, this);
          if (res.destroyed) this.bricksDestroyed += 1;
          if (!this.hasBuff('LASER') || brick.unbreakable) {
            this.reflectBall(ball, hit.nx, hit.ny, hit.overlap);
            ball.bounceCount++;
          }
        }

        const pRect = {
          x: this.paddle.x - this.paddle.w / 2,
          y: this.paddle.y - this.paddle.h / 2,
          w: this.paddle.w,
          h: this.paddle.h,
        };
        const pHit = this.collideBallRect(ball, pRect);
        if (pHit && ball.vy > 0) {
          const rel = (ball.x - this.paddle.x) / (this.paddle.w / 2);
          const angle = -Math.PI / 2 + rel * (Math.PI / 3);
          const speed = Math.max(420, Math.hypot(ball.vx, ball.vy));
          ball.vx = Math.cos(angle) * speed;
          ball.vy = Math.sin(angle) * speed;
          ball.y = pRect.y - ball.r - 1;
          ball.bounceCount = 0;
          AudioManager.playBounce();
        }
      }

      for (const bf of this.buffs) {
        const pRect = {
          x: this.paddle.x - this.paddle.w / 2,
          y: this.paddle.y - this.paddle.h / 2 - 8,
          w: this.paddle.w,
          h: this.paddle.h + 16,
        };
        if (
          bf.x > pRect.x &&
          bf.x < pRect.x + pRect.w &&
          bf.y > pRect.y &&
          bf.y < pRect.y + pRect.h
        ) {
          bf.alive = false;
          this.applyBuff(bf.type);
        }
      }

      this.balls = this.balls.filter((b) => b.alive);
      this.bricks = this.bricks.filter((b) => b.alive);
      this.buffs = this.buffs.filter((b) => b.alive);
      this.particles = this.particles.filter((p) => p.life > 0);

      if (this.balls.length === 0) {
        if (this.checkGoalReached()) {
          this.handleGameOver(true);
          return;
        }
        if (this.ballsRemaining > 0) {
          this.awaitingLaunch = true;
        } else {
          if (this.currentLevel.goal === GOAL_TYPES.CLEAR_ALL || this.currentLevel.goal === GOAL_TYPES.LIMITED_SHOTS) {
            this.handleGameOver(false);
          } else {
            this.handleGameOver(this.score >= (this.currentLevel.targetScore || 0));
          }
          return;
        }
      }

      if (this.checkGoalReached()) {
        this.handleGameOver(true);
        return;
      }

      this.updateUI();
    }

    handleGameOver(won) {
      this.state = 'result';
      const resultEl = document.getElementById('result');
      const titleEl = document.getElementById('result-title');
      const subEl = document.getElementById('result-sub');
      const statsEl = document.getElementById('result-stats');

      titleEl.textContent = won ? '🎉 通关成功' : '💫 挑战失败';
      subEl.textContent = won
        ? `已完成：${this.currentLevel.title}`
        : `未达成目标，再来一次吧`;

      statsEl.innerHTML = `
        <div class="r-stat"><div class="v">${this.score}</div><div class="k">得分</div></div>
        <div class="r-stat"><div class="v">${this.bricksDestroyed}</div><div class="k">消除方块</div></div>
        <div class="r-stat"><div class="v">${Math.floor(this.elapsed)}s</div><div class="k">用时</div></div>
      `;

      document.getElementById('btn-next').style.display =
        won && this.currentLevel.id < LEVELS.length ? '' : 'none';

      resultEl.classList.remove('hidden');
      won ? AudioManager.playSuccess() : AudioManager.playFail();
    }

    drawBackground() {
      const ctx = this.ctx;
      const g = ctx.createLinearGradient(0, 0, 0, this.height);
      g.addColorStop(0, this.theme.bgTop);
      g.addColorStop(1, this.theme.bgBot);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.strokeStyle = this.theme.grid;
      ctx.lineWidth = 1;
      for (let x = 0; x < this.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();
      }
      for (let y = 0; y < this.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      }

      for (const s of this.stars) {
        s.y += s.speed * 0.016;
        if (s.y > this.height) {
          s.y = 0;
          s.x = Math.random() * this.width;
        }
        ctx.globalAlpha = s.a;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    drawPaddle() {
      const ctx = this.ctx;
      const p = this.paddle;

      ctx.shadowColor = this.hasBuff('WIDE_PADDLE') ? '#69f0ae' : '#4fc3f7';
      ctx.shadowBlur = 18;

      const grad = ctx.createLinearGradient(p.x - p.w / 2, p.y, p.x + p.w / 2, p.y);
      grad.addColorStop(0, '#1a237e');
      grad.addColorStop(0.5, '#4fc3f7');
      grad.addColorStop(1, '#1a237e');
      ctx.fillStyle = grad;

      ctx.beginPath();
      const r = 8;
      ctx.moveTo(p.x - p.w / 2 + r, p.y - p.h / 2);
      ctx.arcTo(p.x + p.w / 2, p.y - p.h / 2, p.x + p.w / 2, p.y + p.h / 2, r);
      ctx.arcTo(p.x + p.w / 2, p.y + p.h / 2, p.x - p.w / 2, p.y + p.h / 2, r);
      ctx.arcTo(p.x - p.w / 2, p.y + p.h / 2, p.x - p.w / 2, p.y - p.h / 2, r);
      ctx.arcTo(p.x - p.w / 2, p.y - p.h / 2, p.x + p.w / 2, p.y - p.h / 2, r);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    drawAimGuide() {
      if (!this.awaitingLaunch || this.state !== 'playing') return;
      const ctx = this.ctx;
      const x1 = this.paddle.x;
      const y1 = this.paddle.y - this.paddle.h / 2 - 10;
      const x2 = x1 + Math.cos(this.aimAngle) * 140;
      const y2 = y1 + Math.sin(this.aimAngle) * 140;

      ctx.save();
      ctx.strokeStyle = 'rgba(79,195,247,0.7)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.arc(x2, y2, 4, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    drawTopStatus() {
      if (!this.currentLevel) return;
      const ctx = this.ctx;
      if (this.currentLevel.goal === GOAL_TYPES.TIME_SCORE) {
        ctx.font = 'bold 18px system-ui';
        ctx.fillStyle = this.timeLeft < 10 ? '#ff5470' : '#ffd166';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`⏱ ${Math.ceil(this.timeLeft)}s`, 16, 16);
      }
      if (this.currentLevel.targetScore) {
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = '#69f0ae';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        const need = this.currentLevel.targetScore;
        ctx.fillText(`目标: ${Math.min(this.score, need)} / ${need}`, this.width - 16, 16);
      }
    }

    render() {
      this.drawBackground();
      for (const b of this.bricks) b.draw(this.ctx);
      for (const p of this.particles) p.draw(this.ctx);
      for (const bf of this.buffs) bf.draw(this.ctx);
      this.drawPaddle();
      for (const b of this.balls) b.draw(this.ctx, this);
      this.drawAimGuide();
      this.drawTopStatus();
    }

    updateUI() {
      document.getElementById('stat-level').textContent = this.currentLevel
        ? this.currentLevel.id
        : 1;
      document.getElementById('stat-score').textContent = this.score;
      const activeBalls = this.balls.length;
      document.getElementById('stat-balls').textContent =
        this.ballsRemaining + activeBalls;
      document.getElementById('stat-bricks').textContent =
        this.bricks.length > 0
          ? this.bricks.filter((b) => !b.unbreakable).length
          : 0;
      document.getElementById('stat-goal').textContent = this.currentLevel
        ? this.goalText()
        : '--';
    }

    updateBuffBar() {
      const bar = document.getElementById('buff-bar');
      bar.innerHTML = '';
      for (const [, entry] of this.activeBuffs) {
        const chip = document.createElement('div');
        chip.className = 'buff-chip';
        chip.innerHTML = `<span>${entry.type.icon}</span>
          <span>${entry.type.name}</span>
          <div class="bar"><div class="fill" style="width:${(entry.remaining / entry.total) * 100}%"></div></div>
          <span style="color:${entry.type.color}">${entry.remaining.toFixed(1)}s</span>`;
        bar.appendChild(chip);
      }
      if (this.activeBuffs.size === 0 && this.state === 'playing') {
        const tip = document.createElement('div');
        tip.style.cssText = 'color:#a9b1d6;font-size:12px;padding:6px 10px;';
        tip.textContent = '提示：击碎方块有几率掉落 Buff，用炮台接住即可生效';
        bar.appendChild(tip);
      }
    }

    loop(t) {
      const dt = Math.min(0.033, (t - this.lastTime) / 1000 || 0);
      this.lastTime = t;

      if (this.state === 'playing') {
        this.update(dt);
        this.updateBuffBar();
      }
      this.render();

      requestAnimationFrame((tt) => this.loop(tt));
    }

    setMouse(x, y) {
      this.mouse.x = x;
      this.mouse.y = y;
      const dx = x - this.paddle.x;
      const dy = y - this.paddle.y;
      let angle = Math.atan2(dy, dx);
      angle = clamp(angle, -Math.PI + 0.15, -0.15);
      this.aimAngle = angle;
      this.paddle.x = clamp(x, this.paddle.w / 2 + 10, this.width - this.paddle.w / 2 - 10);
    }

    showMenu() {
      this.state = 'menu';
      document.getElementById('splash').classList.add('hidden');
      document.getElementById('top-bar').classList.remove('hidden');
      document.getElementById('buff-bar').classList.remove('hidden');
      document.getElementById('footer').classList.remove('hidden');
      document.getElementById('overlay').classList.remove('hidden');
    }
  }

  // ========================================================================
  // 7. 启动 & 菜单
  // ========================================================================

  const canvas = document.getElementById('game');
  const game = new Game(canvas);

  function getCanvasPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY,
    };
  }

  canvas.addEventListener('mousemove', (e) => {
    const p = getCanvasPos(e);
    game.setMouse(p.x, p.y);
  });

  canvas.addEventListener('click', () => game.launchBall());

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!game.isHoldingSpace && game.state === 'playing' && game.awaitingLaunch) {
        game.launchBall();
      }
      game.isHoldingSpace = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      game.isHoldingSpace = false;
    }
  });

  function renderLevelMenu() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';
    LEVELS.forEach((lv) => {
      const theme = THEMES[lv.theme] || THEMES.neon;
      const card = document.createElement('div');
      card.className = 'level-card';
      let goalLabel = '';
      switch (lv.goal) {
        case GOAL_TYPES.CLEAR_ALL:
          goalLabel = '清除模式';
          break;
        case GOAL_TYPES.LIMITED_SHOTS:
          goalLabel = `限 ${lv.balls} 弹珠`;
          break;
        case GOAL_TYPES.TARGET_SCORE:
          goalLabel = `${lv.targetScore} 分`;
          break;
        case GOAL_TYPES.TIME_SCORE:
          goalLabel = `${lv.timeLimit}s · ${lv.targetScore} 分`;
          break;
      }
      card.innerHTML = `
        <div class="theme">${theme.emoji}</div>
        <div class="no">LEVEL ${lv.id}</div>
        <div class="lvl-title">${lv.title}</div>
        <div class="tags">
          <span class="tag">${theme.name}风</span>
          <span class="tag">${goalLabel}</span>
          <span class="tag">${lv.brickCols}×${lv.brickRows}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('result').classList.add('hidden');
        game.loadLevel(lv);
      });
      grid.appendChild(card);
    });
  }

  document.getElementById('btn-start').addEventListener('click', () => {
    AudioManager.init();
    game.showMenu();
  });

  document.getElementById('btn-music').addEventListener('click', () => {
    const enabled = AudioManager.toggleBGM();
    document.getElementById('btn-music').classList.toggle('active', enabled);
  });

  document.getElementById('btn-sfx').addEventListener('click', () => {
    const enabled = AudioManager.toggleSFX();
    document.getElementById('btn-sfx').classList.toggle('active', enabled);
  });

  document.getElementById('btn-restart').addEventListener('click', () => {
    if (game.currentLevel) {
      document.getElementById('result').classList.add('hidden');
      game.loadLevel(game.currentLevel);
    }
  });

  document.getElementById('btn-replay').addEventListener('click', () => {
    document.getElementById('result').classList.add('hidden');
    if (game.currentLevel) game.loadLevel(game.currentLevel);
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    document.getElementById('result').classList.add('hidden');
    document.getElementById('overlay').classList.remove('hidden');
    game.state = 'menu';
    renderLevelMenu();
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    document.getElementById('result').classList.add('hidden');
    const nextId = game.currentLevel.id + 1;
    const next = LEVELS.find((l) => l.id === nextId);
    if (next) game.loadLevel(next);
  });

  renderLevelMenu();
  game.updateBuffBar();
})();
