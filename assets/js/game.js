const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 1366;
canvas.height = 720;

const retroCanvas = document.createElement('canvas');
retroCanvas.width = canvas.width;
retroCanvas.height = canvas.height;
const retroCtx = retroCanvas.getContext('2d');

const gravity = 0.8;
const groundLevel = canvas.height - 100;
const frameWidth = 235.5;
const frameHeight = 340;
const deathFrameWidth = 280;
const deathFrameHeight = 320;
const deathMaxFrame = 4;
const enemyFrameWidth = 235.5;
const enemyFrameHeight = 220;

let startSequenceTimer = 0;
let allowEnemyFire = false;
let screenShake = 0;
let deathMessageTimer = 0;
let showVictory = false;
let victoryFadeOutTimer = 0;
let victoryFadeOpacity = 0;
let isVictoryFading = false;
let victoryTimer = 0;


const lifeFullImage = new Image(); lifeFullImage.src = 'assets/icons/lifebar_player1.png';
const lifeDamagedImage = new Image(); lifeDamagedImage.src = 'assets/icons/lifebar_player2.png';
const lifeCritical1Image = new Image(); lifeCritical1Image.src = 'assets/icons/lifebar_player3.1.png';
const lifeCritical2Image = new Image(); lifeCritical2Image.src = 'assets/icons/lifebar_player3.2.png';
const lifeEmptyImage = new Image(); lifeEmptyImage.src = 'assets/icons/lifebar_player3.3.png';
const readyImage = new Image(); readyImage.src = 'assets/icons/ready.png';
const goImage = new Image(); goImage.src = 'assets/icons/wallop.png';
const goImage2 = new Image(); goImage2.src = 'assets/icons/wallop2.png';
const deathMessageImage = new Image(); deathMessageImage.src = 'assets/icons/game over.png';
const victoryImage = new Image(); victoryImage.src = 'assets/icons/knockout.png'; // substitua pelo caminho correto
const loadingFrames = [
  new Image(),
  new Image(),
  new Image()
];
loadingFrames[0].src = 'assets/icons/loading1.png';
loadingFrames[1].src = 'assets/icons/loading2.png';
loadingFrames[2].src = 'assets/icons/loading3.png';

const player = {
  x: 250, y: groundLevel, width: 113, height: 167,
  vx: 0, vy: 0, speed: 5, jumpPower: -15,
  isJumping: false, isAttacking: false, facingLeft: false,
  jumpCount: 0,
  frameX: 0, frameY: 0, frameTimer: 0, frameInterval: 100, maxFrame: 2,
  image: new Image(), normalImage: new Image(), hitImage: new Image(),
  deadImage: new Image(),
  isHit: false, hitTimer: 0,
  life: 3,
  isDead: false
};
player.normalImage.src = 'assets/characters/phonehead_player5.png';
player.hitImage.src = 'assets/characters/phonehead_player5 hit.png';
player.deadImage.src = 'assets/characters/game_over2.png';
player.image = player.normalImage;

const enemy = {
  x: canvas.width - 450, y: groundLevel, width: 480, height: 420,
  vy: 0, isJumping: false, jumpPower: -10,
  jumpCooldown: 0, fireCooldown: 0,
  frameX: 6, frameY: 1, maxFrame: 2, frameTimer: 0, frameInterval: 150,
  image: new Image(), normalImage: new Image(), hitImage: new Image(),
  deadImage: new Image(),
  isHit: false, hitTimer: 0,
  life: 100,
  isDead: false
};
enemy.normalImage.src = 'assets/characters/trashhead_enemy6.png';
enemy.hitImage.src = 'assets/characters/trashhead_enemy6 hit.png';
enemy.deadImage.src = 'assets/characters/trashhead_enemy6 dead.png';
enemy.image = enemy.normalImage;

const backgroundImage = new Image(); backgroundImage.src = 'assets/map/forest_map3.png';
const upperImage = new Image(); upperImage.src = 'assets/map/forest_map upper4.png';
const fireballImage = new Image(); fireballImage.src = 'assets/attack/fire-ball.png';
const enemyFireballImage = new Image(); enemyFireballImage.src = 'assets/attack/bad_apple2.png';

const fireballs = [];
const enemyFireballs = [];
const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, z: false };

window.addEventListener('keydown', e => {
  if (e.key in keys) keys[e.key] = true;
  if (!player.isDead) {
    if (e.key === 'ArrowUp' && player.jumpCount < 2) {
      player.vy = player.jumpPower;
      player.isJumping = true;
      player.jumpCount++;
    }
    if (e.key === 'z' && startSequenceTimer >= 150) {
      player.isAttacking = true;
      fireballs.push({
        x: player.facingLeft ? player.x : player.x + player.width,
        y: player.y + player.height / 2,
        width: 40, height: 20, speed: player.facingLeft ? -10 : 10
      });
      setTimeout(() => player.isAttacking = false, 200);
    }
  }
});
window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

function handlePlayerAnimation(deltaTime) {
  if (player.isDead) return;
  if (player.frameTimer > player.frameInterval) {
    player.frameX = (player.frameX + 1) % (player.maxFrame + 1);
    player.frameTimer = 0;
  } else {
    player.frameTimer += deltaTime;
  }
}

function setPlayerAnimation() {
  if (player.isDead) return;
  if (player.isJumping) {
    player.frameX = 4; player.frameY = 0; player.maxFrame = 4;
  } else if (player.isAttacking && (keys.ArrowLeft || keys.ArrowRight)) {
    player.frameY = 2; player.maxFrame = 2;
  } else if (player.isAttacking) {
    player.frameX = 3; player.frameY = 0; player.maxFrame = 3;
  } else if (keys.ArrowLeft || keys.ArrowRight) {
    player.frameY = 1; player.maxFrame = 2;
  } else {
    player.frameY = 0; player.maxFrame = 2;
  }
}

let enemyAnimationDirection = 1;
function handleEnemyAnimation(deltaTime) {
  if (enemy.isDead) return; 
  if (enemy.frameTimer > enemy.frameInterval) {
    enemy.frameX += enemyAnimationDirection;
    if (enemy.frameX >= enemy.maxFrame) {
      enemy.frameX = enemy.maxFrame;
      enemyAnimationDirection = -1;
    } else if (enemy.frameX <= 0) {
      enemy.frameX = 0;
      enemyAnimationDirection = 1;
    }
    enemy.frameTimer = 0;
  } else enemy.frameTimer += deltaTime;
}

let loadingTime = 0;
let loadingFrameIndex = 0;
let loadingFrameTimer = 0;
const MAX_LOADING_TIME = 120; 


function updateEnemy() {
  enemy.y += enemy.vy;
  enemy.vy += gravity;
  if (enemy.y + enemy.height >= groundLevel) {
    enemy.y = groundLevel - enemy.height;
    enemy.vy = 0;
    enemy.isJumping = false;
  }
  if (!enemy.isDead && enemy.jumpCooldown <= 0 && Math.random() < 0.01) {
    enemy.vy = enemy.jumpPower;
    enemy.isJumping = true;
    enemy.jumpCooldown = 100;
  } else enemy.jumpCooldown--;

  if (!enemy.isDead && !player.isDead && allowEnemyFire && enemy.fireCooldown <= 0) {
    const heights = [enemy.y + enemy.height - 40, enemy.y + enemy.height - 70];
    heights.forEach(h => enemyFireballs.push({ x: enemy.x, y: h, width: 55, height: 35, speed: -6 }));
    enemy.fireCooldown = 120;
  } else enemy.fireCooldown--;

  if (enemy.isHit) {
    enemy.hitTimer--;
    if (enemy.hitTimer <= 0) {
      enemy.isHit = false;
      if (!enemy.isDead) enemy.image = enemy.normalImage;
    }
  }
}

function enemyTakeDamage() {
  if (enemy.isDead) return; 

  enemy.life--;
  enemy.isHit = true;
  enemy.hitTimer = 10;
  enemy.image = enemy.hitImage;

  if (enemy.life <= 0) {
    enemy.isDead = true;
    enemy.image = enemy.deadImage;
    enemy.frameX = 0;
    enemy.frameY = 0;
    enemy.maxFrame = 0; 
    allowEnemyFire = false; 
    showVictory = true;
    victoryTimer = 0;
  }
}

let lastTime = 0;
function animate(timeStamp) {
    if (loadingTime < MAX_LOADING_TIME) {
  loadingTime++;

  retroCtx.fillStyle = 'black';
  retroCtx.fillRect(0, 0, canvas.width, canvas.height);

  const gifWidth = 200;
  const gifHeight = 90;
  loadingFrameTimer++;
if (loadingFrameTimer > 10) { 
  loadingFrameIndex = (loadingFrameIndex + 1) % loadingFrames.length;
  loadingFrameTimer = 0;
}
retroCtx.drawImage(loadingFrames[loadingFrameIndex], 20, canvas.height - 120, gifWidth, gifHeight);

  for (let y = 0; y < canvas.height; y += 4) {
    retroCtx.fillStyle = 'rgba(0,0,0,0.1)';
    retroCtx.fillRect(0, y, canvas.width, 2);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(retroCanvas, 0, 0);

  requestAnimationFrame(animate);
  return; 
}


  const deltaTime = timeStamp - lastTime;
  lastTime = timeStamp;

  retroCtx.clearRect(0, 0, canvas.width, canvas.height);
  retroCtx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  if (startSequenceTimer < 150) {
  if (startSequenceTimer < 100) {
    const s = Math.max(1.5, 3 - (startSequenceTimer / 32) * 1.5);
    const w = readyImage.width * s;
    const h = readyImage.height * s;
    retroCtx.drawImage(readyImage, 0, 0, readyImage.width, readyImage.height, centerX - w / 2, centerY - h / 2, w, h);
  } else {
    const img = (Math.floor(startSequenceTimer / 10) % 2 === 0) ? goImage : goImage2;
    retroCtx.drawImage(img, centerX - 450, centerY - 350, 900, 700);
  }

  let fade = 1 - (startSequenceTimer / 150);
  fade = Math.max(0, Math.min(fade, 1));
  retroCtx.fillStyle = `rgba(0, 0, 0, ${fade * 0.8})`;
  retroCtx.fillRect(0, 0, canvas.width, canvas.height);

    startSequenceTimer += 0.5; 
} else {
  allowEnemyFire = true;
}

  if (!player.isDead) {
    if (keys.ArrowLeft) { player.vx = -player.speed; player.facingLeft = true; }
    else if (keys.ArrowRight) { player.vx = player.speed; player.facingLeft = false; }
    else player.vx = 0;

    player.x += player.vx;
    player.y += player.vy;
    player.vy += gravity;
    if (player.y + player.height >= groundLevel) {
      player.y = groundLevel - player.height;
      player.vy = 0;
      player.isJumping = false;
      player.jumpCount = 0;
    }

    player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
  }

  setPlayerAnimation();
  handlePlayerAnimation(deltaTime);

  if (player.isHit) {
    screenShake = 10;
    player.hitTimer--;
    if (player.hitTimer <= 0) player.isHit = false;
  }

  if (player.life <= 0 && !player.isDead) {
  player.isDead = true;
  player.image = player.deadImage;
  player.frameX = 0;
  player.isHit = true;
  player.hitTimer = 10;
  deathMessageTimer = 0;
  fadeOutOpacity = 0;        
  isRestarting = false;      
}
 else if (!player.isDead) {
    player.image = player.isHit ? player.hitImage : player.normalImage;
  }

  retroCtx.save();
  if (player.facingLeft) retroCtx.scale(-1, 1);

  if (player.isDead) {
    retroCtx.drawImage(
      player.image,
      player.frameX * deathFrameWidth,
      0,
      deathFrameWidth,
      deathFrameHeight,
      player.facingLeft ? -player.x - player.width : player.x,
      player.y,
      player.width,
      player.height
    );
  } else {
    retroCtx.drawImage(
      player.image,
      player.frameX * frameWidth,
      player.frameY * frameHeight,
      frameWidth,
      frameHeight,
      player.facingLeft ? -player.x - player.width : player.x,
      player.y,
      player.width,
      player.height
    );
  }
  retroCtx.restore();

  for (let i = fireballs.length - 1; i >= 0; i--) {
    const f = fireballs[i];
    f.x += f.speed;
    if (f.x < enemy.x + enemy.width && f.x + f.width > enemy.x && f.y < enemy.y + enemy.height && f.y + f.height > enemy.y) {
      fireballs.splice(i, 1);
      enemyTakeDamage();
      continue;
    }
    retroCtx.drawImage(fireballImage, f.x, f.y, f.width, f.height);
  }

  updateEnemy();
  handleEnemyAnimation(deltaTime);

  retroCtx.drawImage(
    enemy.image,
    enemy.frameX * enemyFrameWidth,
    enemy.frameY * enemyFrameHeight,
    enemyFrameWidth,
    enemyFrameHeight,
    enemy.x,
    enemy.y,
    enemy.width,
    enemy.height
  );

  for (let i = enemyFireballs.length - 1; i >= 0; i--) {
    const f = enemyFireballs[i];
    f.x += f.speed;
    if (f.x < -f.width) { enemyFireballs.splice(i, 1); continue; }
    if (!player.isDead && f.x < player.x + player.width && f.x + f.width > player.x && f.y < player.y + player.height && f.y + f.height > player.y) {
      enemyFireballs.splice(i, 1);
      if (!player.isHit && player.life > 0) {
        player.life--;
        player.isHit = true;
        player.hitTimer = 10;
      }
      continue;
    }
    retroCtx.drawImage(enemyFireballImage, f.x, f.y, f.width, f.height);
  }

  retroCtx.drawImage(upperImage, 0, 0, canvas.width, canvas.height);

if (showVictory) {
  victoryTimer += deltaTime;

const revealProgress = Math.min(1, victoryTimer / 1000); 
const revealWidth = victoryImage.width * revealProgress;

const brushScale = 2.0;
const brushAlpha = revealProgress;
const brushWidth = victoryImage.width * brushScale;
const brushHeight = victoryImage.height * brushScale;

const sx = 0;
const sy = 0;
const sw = revealWidth;
const sh = victoryImage.height;

const dx = centerX - (brushWidth / 2);
const dy = centerY - (brushHeight / 2);
const dw = brushWidth * revealProgress;
const dh = brushHeight;

retroCtx.save();
retroCtx.globalAlpha = brushAlpha;
retroCtx.drawImage(
  victoryImage,
  sx, sy, sw, sh,
  dx, dy, dw, dh
);
retroCtx.restore();

if (victoryTimer > 1000) {
  isVictoryFading = true;
}

if (isVictoryFading) {
  victoryFadeOpacity += 0.01;
  retroCtx.fillStyle = `rgba(0, 0, 0, ${Math.min(victoryFadeOpacity, 1)})`;
  retroCtx.fillRect(0, 0, canvas.width, canvas.height);

  if (victoryFadeOpacity >= 1 && !isRestarting) {
    isRestarting = true;
    setTimeout(() => {
      player.x = 250;
      player.y = groundLevel;
      player.life = 3;
      player.isDead = false;
      player.image = player.normalImage;
      player.jumpCount = 0;
      player.vx = 0;
      player.vy = 0;

      enemy.x = canvas.width - 450;
      enemy.y = groundLevel - enemy.height;
      enemy.life = 30;
      enemy.isDead = false;
      enemy.image = enemy.normalImage;
      enemy.fireCooldown = 0;

      fireballs.length = 0;
      enemyFireballs.length = 0;

      screenShake = 0;
      startSequenceTimer = 0;
      showVictory = false;
      victoryTimer = 0;
      victoryFadeOutTimer = 0;
      victoryFadeOpacity = 0;
      isVictoryFading = false;
      loadingTime = 0;

      fadeOutOpacity = 0;
      isRestarting = false;
    }, 1000); 
  }
}

}




  if (player.isDead) {
    deathMessageTimer += deltaTime;
    const oscillation = Math.sin(deathMessageTimer / 200) * 10;
    const scale = 1 + Math.sin(deathMessageTimer / 300) * 0.05;
    const msgWidth = deathMessageImage.width * scale;
    const msgHeight = deathMessageImage.height * scale;
    retroCtx.save();
    retroCtx.translate(centerX + oscillation, centerY);
    retroCtx.drawImage(
      deathMessageImage,
      -msgWidth / 2, -msgHeight / 2,
      msgWidth, msgHeight
    );
    retroCtx.restore();
  }

  for (let y = 0; y < canvas.height; y += 4) {
    retroCtx.fillStyle = 'rgba(0,0,0,0.1)';
    retroCtx.fillRect(0, y, canvas.width, 2);
  }
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    retroCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    retroCtx.fillRect(x, y, 1, 1);
  }

  if (screenShake > 0) {
    screenShake--;
    const shakeX = Math.random() * 8 - 4;
    const shakeY = Math.random() * 8 - 4;
    ctx.setTransform(1, 0, 0, 1, shakeX, shakeY);
  } else ctx.setTransform(1, 0, 0, 1, 0, 0);

  let lifeImage = lifeFullImage;
  if (player.life === 2) lifeImage = lifeDamagedImage;
  else if (player.life === 1) lifeImage = (Math.floor(timeStamp / 300) % 2 === 0) ? lifeCritical1Image : lifeCritical2Image;
  else if (player.life <= 0) lifeImage = lifeEmptyImage;

  retroCtx.drawImage(lifeImage, 20, canvas.height - 120, 200, 90);

for (let y = 0; y < canvas.height; y += 4) {
  retroCtx.fillStyle = 'rgba(0,0,0,0.1)';
  retroCtx.fillRect(0, y, canvas.width, 2);
}

for (let i = 0; i < 200; i++) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  retroCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
  retroCtx.fillRect(x, y, 1, 1);
}

for (let x = 0; x < canvas.width; x += 5) {
  if (Math.random() < 0.5) {
    retroCtx.fillStyle = 'rgba(255,255,255,0.03)';
    retroCtx.fillRect(x, 0, 2, canvas.height);
  }
}

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(retroCanvas, 0, 0);

for (let x = 0; x < canvas.width; x += 3) {
  if (Math.random() < 0.3) {
    retroCtx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    retroCtx.fillRect(x, 0, 1, canvas.height);
  }
}

if (startSequenceTimer < 150) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  if (startSequenceTimer < 100) {
    const s = Math.max(1.5, 3 - (startSequenceTimer / 32) * 1.5);
    const w = readyImage.width * s;
    const h = readyImage.height * s;
    retroCtx.drawImage(readyImage, 0, 0, readyImage.width, readyImage.height, centerX - w / 2, centerY - h / 2, w, h);
  } else {
    const img = (Math.floor(startSequenceTimer / 10) % 2 === 0) ? goImage : goImage2;
    retroCtx.drawImage(img, centerX - 450, centerY - 350, 900, 700);
  }

  let fade = 1 - (startSequenceTimer / 150);
  fade = Math.max(0, Math.min(fade, 1));
  retroCtx.fillStyle = `rgba(0, 0, 0, ${fade * 0.8})`;
  retroCtx.fillRect(0, 0, canvas.width, canvas.height);

  startSequenceTimer++;
} else {
  allowEnemyFire = true;
}

for (let y = 0; y < canvas.height; y += 4) {
  retroCtx.fillStyle = 'rgba(0,0,0,0.1)';
  retroCtx.fillRect(0, y, canvas.width, 2);
}

for (let i = 0; i < 200; i++) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  retroCtx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
  retroCtx.fillRect(x, y, 1, 1);
}

for (let x = 0; x < canvas.width; x += 5) {
  if (Math.random() < 0.5) {
    retroCtx.fillStyle = 'rgba(255,255,255,0.03)';
    retroCtx.fillRect(x, 0, 2, canvas.height);
  }
}

if (player.isDead) {
  fadeOutOpacity += 0.01;
  retroCtx.fillStyle = `rgba(0, 0, 0, ${Math.min(fadeOutOpacity, 1)})`;
  retroCtx.fillRect(0, 0, canvas.width, canvas.height);

  if (fadeOutOpacity >= 1 && !isRestarting) {
    isRestarting = true;
    setTimeout(() => {
    
      player.x = 250;
      player.y = groundLevel;
      player.life = 3;
      player.isDead = false;
      player.image = player.normalImage;
      player.jumpCount = 0;
      player.vx = 0;
      player.vy = 0;

      enemy.x = canvas.width - 450;
      enemy.y = groundLevel - enemy.height;
      enemy.life = 30;
      enemy.isDead = false;
      enemy.image = enemy.normalImage;
      enemy.fireCooldown = 0;

      fireballs.length = 0;
      enemyFireballs.length = 0;

      screenShake = 0;
      startSequenceTimer = 0;
      showVictory = false;
      victoryTimer = 0;
      loadingTime = 0;

      fadeOutOpacity = 0;
      isRestarting = false;

    }, 1000); 
  }
}

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(retroCanvas, 0, 0);




  requestAnimationFrame(animate);
}

let fadeOutOpacity = 0;
let isRestarting = false;


let assetsLoaded = 0;
function checkAllLoaded() {
  assetsLoaded++;
  if (assetsLoaded === 22) animate(0);
}
[
  player.normalImage, player.hitImage, player.deadImage,
  enemy.normalImage, enemy.hitImage, enemy.deadImage,
  backgroundImage, upperImage,
  fireballImage, enemyFireballImage,
  readyImage, goImage, goImage2,
  lifeFullImage, lifeDamagedImage, lifeCritical1Image, lifeCritical2Image, lifeEmptyImage,
  deathMessageImage,
  victoryImage,
  loadingFrames[0], loadingFrames[1], loadingFrames[2] 
].forEach(img => img.onload = checkAllLoaded);


