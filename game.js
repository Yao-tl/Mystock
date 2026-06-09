// 游戏核心变量
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// 游戏状态
let gameState = 'start'; // start, playing, gameOver, win
let currentLevel = 1;
let score = 0;
let difficulty = 'normal';
let shotsRemaining = 10;
let timeRemaining = 60;
let lastTime = 0;
let gameStartTime = 0;

// 炮台位置
const cannon = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 60,
    width: 80,
    height: 50,
    angle: -Math.PI / 2
};

// 弹珠
let ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 80,
    vx: 0,
    vy: 0,
    radius: 10,
    active: false,
    speed: 8
};

// 充能状态
let charging = false;
let chargeTime = 0;
const MAX_CHARGE = 60;

// 方块数组
let bricks = [];

// 增益buff
let powerUps = [];
let activePowerUps = [];

// 粒子效果
let particles = [];

// 音频上下文
let audioCtx;

// 难度配置
const difficultyConfig = {
    easy: {
        ballSpeed: 7,
        brickHealthMultiplier: 1,
        shotsPerLevel: 15,
        timePerLevel: 90,
        scoreToPass: 500
    },
    normal: {
        ballSpeed: 8,
        brickHealthMultiplier: 1.5,
        shotsPerLevel: 10,
        timePerLevel: 60,
        scoreToPass: 800
    },
    hard: {
        ballSpeed: 10,
        brickHealthMultiplier: 2,
        shotsPerLevel: 8,
        timePerLevel: 45,
        scoreToPass: 1200
    }
};

// 关卡配置
const levelConfigs = [
    {
        name: '第一关',
        pattern: 'grid',
        colors: ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#ff9ff3'],
        rows: 4,
        cols: 14,
        gaps: true,
        winCondition: 'shots' // 在特定发射次数内消除所有方块
    },
    {
        name: '第二关',
        pattern: 'staggered',
        colors: ['#5f27cd', '#341f97', '#00d2d3', '#01a3a4', '#ff6b6b'],
        rows: 6,
        cols: 16,
        gaps: true,
        winCondition: 'time' // 在规定时间内达到特定分数
    },
    {
        name: '第三关',
        pattern: 'pyramid',
        colors: ['#ee5a24', '#f8b739', '#f79f1f', '#a3cb38', '#1b9cfc'],
        rows: 7,
        cols: 18,
        gaps: true,
        winCondition: 'clear' // 清除所有方块
    },
    {
        name: '第四关',
        pattern: 'checkerboard',
        colors: ['#c23616', '#e1b12c', '#0097e6', '#44bd32', '#e84393'],
        rows: 8,
        cols: 20,
        gaps: true,
        winCondition: 'score' // 达到特定分数
    },
    {
        name: '第五关',
        pattern: 'diamond',
        colors: ['#6c5ce7', '#00cec9', '#fd79a8', '#fab1a0', '#00b894'],
        rows: 9,
        cols: 22,
        gaps: true,
        winCondition: 'shots'
    }
];

// 初始化音频
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    playBackgroundMusic();
}

// 播放音效
function playSound(frequency, duration, type = 'sine', volume = 0.3) {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
}

// 背景音乐
let bgMusicOscillator;
let bgMusicGain;
function playBackgroundMusic() {
    if (!audioCtx) return;
    
    // 创建简单的循环旋律
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
    let noteIndex = 0;
    
    function playNextNote() {
        if (gameState !== 'playing') {
            setTimeout(playNextNote, 500);
            return;
        }
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.frequency.value = notes[noteIndex % notes.length];
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.5);
        
        noteIndex++;
        setTimeout(playNextNote, 600);
    }
    
    playNextNote();
}

// 碰撞音效
function playCollisionSound() {
    playSound(440, 0.1, 'square', 0.2);
}

// 消除方块音效
function playDestroySound() {
    playSound(880, 0.2, 'sawtooth', 0.3);
    setTimeout(() => playSound(660, 0.15, 'sine', 0.2), 50);
}

// 发射音效
function playShootSound() {
    playSound(550, 0.15, 'triangle', 0.25);
}

// 拾取buff音效
function playPowerUpSound() {
    playSound(770, 0.1, 'sine', 0.3);
    setTimeout(() => playSound(990, 0.15, 'sine', 0.3), 100);
}

// 创建粒子效果
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 30,
            maxLife: 30,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

// 更新粒子
function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        return p.life > 0;
    });
}

// 绘制粒子
function drawParticles() {
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// 生成关卡方块
function generateBricks(levelIndex) {
    const config = levelConfigs[levelIndex % levelConfigs.length];
    bricks = [];
    
    const brickWidth = 35;
    const brickHeight = 25;
    const paddingX = 30;
    const paddingY = 50;
    
    for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
            let shouldCreate = true;
            
            // 根据不同排列模式决定是否创建方块
            switch (config.pattern) {
                case 'grid':
                    shouldCreate = true;
                    break;
                case 'staggered':
                    shouldCreate = (row + col) % 2 === 0 || Math.random() > 0.3;
                    break;
                case 'pyramid':
                    shouldCreate = col >= row && col < config.cols - row;
                    break;
                case 'checkerboard':
                    shouldCreate = (row + col) % 2 === 0;
                    break;
                case 'diamond':
                    const centerCol = config.cols / 2;
                    const centerRow = config.rows / 2;
                    const dist = Math.abs(col - centerCol) + Math.abs(row - centerRow);
                    shouldCreate = dist < centerRow + 1;
                    break;
            }
            
            // 添加一些空隙
            if (config.gaps && Math.random() > 0.85) {
                shouldCreate = false;
            }
            
            if (shouldCreate) {
                const baseHealth = Math.floor((row + 1) * difficultyConfig[difficulty].brickHealthMultiplier) + levelIndex;
                const colorIndex = (row + col) % config.colors.length;
                
                bricks.push({
                    x: paddingX + col * brickWidth,
                    y: paddingY + row * brickHeight,
                    width: brickWidth - 4,
                    height: brickHeight - 4,
                    health: baseHealth,
                    maxHealth: baseHealth,
                    color: config.colors[colorIndex],
                    hasPowerUp: Math.random() > 0.85 // 15%概率有buff
                });
            }
        }
    }
}

// 生成增益buff
function spawnPowerUp(x, y) {
    const types = [
        { type: 'multiball', color: '#ff6b6b', name: '多球' },
        { type: 'bigball', color: '#feca57', name: '大球' },
        { type: 'speed', color: '#48dbfb', name: '加速' },
        { type: 'damage', color: '#1dd1a1', name: '双倍伤害' },
        { type: 'extrashot', color: '#ff9ff3', name: '额外发射' }
    ];
    
    const powerUp = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
        x: x,
        y: y,
        vy: 2,
        radius: 15,
        type: powerUp.type,
        color: powerUp.color,
        name: powerUp.name
    });
}

// 更新增益buff
function updatePowerUps() {
    powerUps = powerUps.filter(p => {
        p.y += p.vy;
        
        // 检测玩家是否拾取
        if (Math.abs(p.x - cannon.x) < 60 && p.y > cannon.y - 30 && p.y < cannon.y + 20) {
            activatePowerUp(p);
            playPowerUpSound();
            return false;
        }
        
        return p.y < CANVAS_HEIGHT;
    });
    
    // 更新活跃buff的计时器
    activePowerUps = activePowerUps.filter(p => {
        p.duration--;
        return p.duration > 0;
    });
}

// 激活buff
function activatePowerUp(powerUp) {
    const existing = activePowerUps.find(p => p.type === powerUp.type);
    if (existing) {
        existing.duration = 300; // 重置时间
    } else {
        activePowerUps.push({
            type: powerUp.type,
            color: powerUp.color,
            duration: 300 // 5秒 (60fps * 5)
        });
    }
    
    // 立即效果
    if (powerUp.type === 'extrashot') {
        shotsRemaining += 3;
    }
    
    updateUI();
}

// 绘制增益buff
function drawPowerUps() {
    powerUps.forEach(p => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 内部图标
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('★', p.x, p.y + 4);
        ctx.restore();
    });
}

// 绘制活跃buff显示
function drawActivePowerUps() {
    ctx.save();
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    
    activePowerUps.forEach((p, index) => {
        ctx.fillStyle = p.color;
        const y = 30 + index * 25;
        ctx.fillText(`${getPowerUpName(p.type)}: ${Math.ceil(p.duration / 60)}s`, CANVAS_WIDTH - 20, y);
    });
    
    ctx.restore();
}

function getPowerUpName(type) {
    const names = {
        'multiball': '多球',
        'bigball': '大球',
        'speed': '加速',
        'damage': '双倍伤害',
        'extrashot': '额外发射'
    };
    return names[type] || type;
}

// 检查是否有特定buff激活
function hasActivePowerUp(type) {
    return activePowerUps.some(p => p.type === type);
}

// 更新弹珠
function updateBall() {
    if (!ball.active) return;
    
    let currentSpeed = ball.speed;
    if (hasActivePowerUp('speed')) {
        currentSpeed *= 1.5;
    }
    
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // 边界碰撞
    if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx *= -1;
        playCollisionSound();
    }
    if (ball.x + ball.radius > CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - ball.radius;
        ball.vx *= -1;
        playCollisionSound();
    }
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy *= -1;
        playCollisionSound();
    }
    
    // 掉出底部
    if (ball.y > CANVAS_HEIGHT + ball.radius) {
        ball.active = false;
        resetBallPosition();
        checkGameStatus();
    }
    
    // 方块碰撞
    for (let i = bricks.length - 1; i >= 0; i--) {
        const brick = bricks[i];
        if (checkCollision(ball, brick)) {
            // 计算碰撞方向
            const overlapLeft = ball.x + ball.radius - brick.x;
            const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
            const overlapTop = ball.y + ball.radius - brick.y;
            const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
            
            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);
            
            if (minOverlapX < minOverlapY) {
                ball.vx *= -1;
            } else {
                ball.vy *= -1;
            }
            
            // 伤害方块
            const damage = hasActivePowerUp('damage') ? 2 : 1;
            brick.health -= damage;
            playCollisionSound();
            
            // 创建粒子
            createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 5);
            
            // 检查是否被消灭
            if (brick.health <= 0) {
                // 如果有buff，生成buff
                if (brick.hasPowerUp) {
                    spawnPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
                }
                
                createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 20);
                playDestroySound();
                score += 100 * currentLevel;
                bricks.splice(i, 1);
                updateUI();
            }
            
            break;
        }
    }
}

// 碰撞检测
function checkCollision(ball, brick) {
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;
    
    return ballRight > brick.x &&
           ballLeft < brick.x + brick.width &&
           ballBottom > brick.y &&
           ballTop < brick.y + brick.height;
}

// 绘制背景
function drawBackground() {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 星星效果
    for (let i = 0; i < 50; i++) {
        const x = (i * 37) % CANVAS_WIDTH;
        const y = (i * 23) % (CANVAS_HEIGHT - 100);
        const size = (Math.sin(Date.now() / 500 + i) + 1) * 1.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(Date.now() / 300 + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 绘制方块
function drawBricks() {
    bricks.forEach(brick => {
        const healthRatio = brick.health / brick.maxHealth;
        
        // 根据血量改变透明度
        ctx.save();
        ctx.globalAlpha = 0.5 + healthRatio * 0.5;
        ctx.fillStyle = brick.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = brick.color;
        
        // 圆角方块
        const radius = 5;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height, radius);
        ctx.fill();
        
        // 如果血量低，绘制裂纹
        if (healthRatio < 0.7) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            // 第一条裂纹
            ctx.moveTo(brick.x + 5, brick.y + brick.height * 0.3);
            ctx.lineTo(brick.x + brick.width * 0.4, brick.y + brick.height * 0.7);
            ctx.lineTo(brick.x + brick.width - 5, brick.y + brick.height * 0.4);
            
            // 如果血量更低，添加更多裂纹
            if (healthRatio < 0.4) {
                ctx.moveTo(brick.x + brick.width * 0.7, brick.y + 5);
                ctx.lineTo(brick.x + brick.width * 0.5, brick.y + brick.height * 0.5);
                ctx.lineTo(brick.x + brick.width * 0.8, brick.y + brick.height - 5);
            }
            
            ctx.stroke();
        }
        
        // 显示血量
        if (brick.maxHealth > 1) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(brick.health.toString(), brick.x + brick.width / 2, brick.y + brick.height / 2 + 4);
        }
        
        // 如果有buff，显示标记
        if (brick.hasPowerUp) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('★', brick.x + brick.width - 5, brick.y + 8);
        }
        
        ctx.restore();
    });
}

// 绘制炮台
function drawCannon() {
    ctx.save();
    
    // 炮座
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(cannon.x, cannon.y + 10, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // 旋转炮管
    ctx.translate(cannon.x, cannon.y);
    ctx.rotate(cannon.angle + Math.PI / 2);
    
    ctx.fillStyle = '#636e72';
    ctx.fillRect(-15, -50, 30, 50);
    
    // 炮口
    ctx.fillStyle = '#b2bec3';
    ctx.fillRect(-18, -55, 36, 10);
    
    ctx.restore();
    
    // 如果在充能，显示能量条
    if (charging) {
        const chargeRatio = chargeTime / MAX_CHARGE;
        ctx.save();
        ctx.fillStyle = `rgba(255, ${255 - chargeRatio * 150}, 0, 0.8)`;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(cannon.x, cannon.y - 30, 10 + chargeRatio * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 绘制弹珠
function drawBall() {
    if (!ball.active && !charging) return;
    
    const radius = hasActivePowerUp('bigball') ? ball.radius * 1.5 : ball.radius;
    
    ctx.save();
    
    if (charging) {
        // 充能状态下显示准备发射的弹珠
        const chargeRatio = chargeTime / MAX_CHARGE;
        ctx.globalAlpha = 0.5 + chargeRatio * 0.5;
        ctx.fillStyle = `rgb(${50 + chargeRatio * 200}, ${200 - chargeRatio * 100}, ${255})`;
        ctx.shadowBlur = 20 + chargeRatio * 20;
        ctx.shadowColor = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // 活跃状态
        ctx.fillStyle = hasActivePowerUp('damage') ? '#ff6b6b' : '#00ff88';
        ctx.shadowBlur = 20;
        ctx.shadowColor = hasActivePowerUp('damage') ? '#ff6b6b' : '#00ff88';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

// 绘制充能条
function updatePowerBar() {
    const fill = document.getElementById('powerBarFill');
    if (charging) {
        fill.style.width = `${(chargeTime / MAX_CHARGE) * 100}%`;
    } else {
        fill.style.width = '50%';
    }
}

// 重置弹珠位置
function resetBallPosition() {
    ball.x = cannon.x;
    ball.y = cannon.y - 30;
    ball.vx = 0;
    ball.vy = 0;
    ball.active = false;
}

// 收回弹珠
function reclaimBall() {
    if (ball.active) {
        ball.active = false;
        resetBallPosition();
        checkGameStatus();
    }
}

// 发射弹珠
function shootBall() {
    if (ball.active || shotsRemaining <= 0) return;
    
    const chargeRatio = Math.min(chargeTime / MAX_CHARGE, 1);
    const speed = ball.speed + chargeRatio * 4;
    
    // 根据炮台角度发射
    ball.vx = Math.cos(cannon.angle) * speed;
    ball.vy = Math.sin(cannon.angle) * speed;
    ball.active = true;
    
    // 如果有多球buff，额外发射两个
    if (hasActivePowerUp('multiball')) {
        // 这里简化为只发射一个球，多球需要修改数据结构
    }
    
    shotsRemaining--;
    chargeTime = 0;
    charging = false;
    
    playShootSound();
    updateUI();
}

// 更新UI
function updateUI() {
    document.getElementById('scoreDisplay').textContent = `分数: ${score}`;
    document.getElementById('livesDisplay').textContent = `剩余发射: ${shotsRemaining}`;
    document.getElementById('levelDisplay').textContent = `关卡: ${currentLevel} - ${levelConfigs[(currentLevel - 1) % levelConfigs.length].name}`;
    document.getElementById('timeDisplay').textContent = `时间: ${timeRemaining}s`;
}

// 检查游戏状态
function checkGameStatus() {
    const config = levelConfigs[(currentLevel - 1) % levelConfigs.length];
    
    // 检查是否通关
    if (bricks.length === 0) {
        if (currentLevel >= levelConfigs.length) {
            // 完成所有关卡
            showWinScreen();
            return;
        }
        // 进入下一关
        nextLevel();
        return;
    }
    
    // 根据胜利条件检查
    switch (config.winCondition) {
        case 'shots':
            if (shotsRemaining <= 0 && bricks.length > 0) {
                showGameOver();
            }
            break;
        case 'time':
            if (timeRemaining <= 0) {
                if (score >= difficultyConfig[difficulty].scoreToPass * currentLevel) {
                    if (currentLevel >= levelConfigs.length) {
                        showWinScreen();
                    } else {
                        nextLevel();
                    }
                } else {
                    showGameOver();
                }
            }
            break;
        case 'clear':
            // 必须清除所有方块，已经检查过了
            break;
        case 'score':
            if (score >= difficultyConfig[difficulty].scoreToPass * currentLevel && bricks.length === 0) {
                if (currentLevel >= levelConfigs.length) {
                    showWinScreen();
                } else {
                    nextLevel();
                }
            }
            break;
    }
}

// 下一关
function nextLevel() {
    currentLevel++;
    const config = difficultyConfig[difficulty];
    shotsRemaining = config.shotsPerLevel;
    timeRemaining = config.timePerLevel;
    
    generateBricks(currentLevel - 1);
    resetBallPosition();
    updateUI();
    
    // 显示关卡信息
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`第 ${currentLevel} 关`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(levelConfigs[(currentLevel - 1) % levelConfigs.length].name, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    ctx.restore();
}

// 显示游戏结束
function showGameOver() {
    gameState = 'gameOver';
    document.getElementById('gameOverScreen').classList.add('show');
    document.getElementById('finalScore').textContent = `最终分数: ${score}`;
}

// 显示胜利
function showWinScreen() {
    gameState = 'win';
    document.getElementById('winScreen').classList.add('show');
    document.getElementById('finalScore').textContent = `最终分数: ${score}`;
}

// 开始游戏
function startGame(diff) {
    difficulty = diff;
    currentLevel = 1;
    score = 0;
    
    const config = difficultyConfig[difficulty];
    shotsRemaining = config.shotsPerLevel;
    timeRemaining = config.timePerLevel;
    ball.speed = config.ballSpeed;
    
    generateBricks(0);
    resetBallPosition();
    
    gameState = 'playing';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').classList.remove('show');
    document.getElementById('winScreen').classList.remove('show');
    
    if (!audioCtx) {
        initAudio();
    }
    
    gameStartTime = Date.now();
    updateUI();
}

// 重新开始
function restartGame() {
    document.getElementById('gameOverScreen').classList.remove('show');
    document.getElementById('winScreen').classList.remove('show');
    document.getElementById('startScreen').style.display = 'flex';
    gameState = 'start';
    
    // 清空数据
    bricks = [];
    powerUps = [];
    activePowerUps = [];
    particles = [];
    resetBallPosition();
}

// 鼠标事件
canvas.addEventListener('mousemove', (e) => {
    if (gameState !== 'playing' || ball.active) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    cannon.angle = Math.atan2(mouseY - cannon.y, mouseX - cannon.x);
    
    // 限制角度在上半部分
    if (cannon.angle > 0) {
        cannon.angle = -Math.PI / 2;
    }
    
    // 更新准备发射的弹珠位置
    if (!ball.active) {
        ball.x = cannon.x + Math.cos(cannon.angle) * 40;
        ball.y = cannon.y + Math.sin(cannon.angle) * 40;
    }
});

canvas.addEventListener('mousedown', (e) => {
    if (gameState !== 'playing' || ball.active || shotsRemaining <= 0) return;
    charging = true;
    chargeTime = 0;
});

canvas.addEventListener('mouseup', (e) => {
    if (charging) {
        shootBall();
    }
});

// 键盘事件
document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;
    
    if (e.code === 'Space' && !ball.active && !charging && shotsRemaining > 0) {
        charging = true;
        chargeTime = 0;
    }
    
    if (e.code === 'KeyR') {
        reclaimBall();
    }
});

document.addEventListener('keyup', (e) => {
    if (charging && e.code === 'Space') {
        shootBall();
    }
});

// 主游戏循环
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (gameState === 'playing') {
        // 更新时间
        if (Math.floor(timestamp / 1000) !== Math.floor((timestamp - deltaTime) / 1000)) {
            timeRemaining--;
            updateUI();
            if (timeRemaining <= 0) {
                checkGameStatus();
            }
        }
        
        // 更新充能
        if (charging) {
            chargeTime = Math.min(chargeTime + 1, MAX_CHARGE);
            updatePowerBar();
        }
        
        // 更新游戏对象
        updateBall();
        updatePowerUps();
        updateParticles();
    }
    
    // 绘制
    drawBackground();
    drawBricks();
    drawPowerUps();
    drawCannon();
    drawBall();
    drawParticles();
    drawActivePowerUps();
    
    requestAnimationFrame(gameLoop);
}

// 开始游戏循环
requestAnimationFrame(gameLoop);

// 为canvas添加圆角支持（polyfill）
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        }
        
        this.beginPath();
        this.moveTo(x + radius.tl, y);
        this.lineTo(x + width - radius.tr, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        this.lineTo(x + width, y + height - radius.br);
        this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        this.lineTo(x + radius.bl, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        this.lineTo(x, y + radius.tl);
        this.quadraticCurveTo(x, y, x + radius.tl, y);
        this.closePath();
        return this;
    };
}