// 木鱼敲击模块

const FLOATING_TEXTS = ['功德+1', '南无阿弥陀佛', '福报+1', '阿弥陀佛', '善哉善哉', '随喜赞叹', '六时吉祥'];
const STORAGE_KEY = 'borege_knock_count';

let knockCount = 0;
let audioCtx = null;

// 初始化计数器（从 localStorage 加载）
function initKnockCounter() {
  const saved = localStorage.getItem(STORAGE_KEY);
  knockCount = saved ? parseInt(saved, 10) || 0 : 0;
  updateDisplay();
}

// 获取当前次数
function getKnockCount() {
  return knockCount;
}

// 更新显示
function updateDisplay() {
  const el = document.getElementById('knock-count');
  if (el) el.textContent = knockCount.toLocaleString('zh-CN');
}

// 保存到 localStorage
function saveKnocks() {
  localStorage.setItem(STORAGE_KEY, knockCount.toString());
}

// 播放木鱼敲击音效（Web Audio API 合成）
function playKnockSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtx;
    const now = ctx.currentTime;

    // 主体音（木质敲击感）
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.start(now);
    osc.stop(now + 0.12);

    // 泛音（增加清脆感）
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1800, now);
    osc2.frequency.exponentialRampToValueAtTime(1000, now + 0.03);

    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc2.start(now);
    osc2.stop(now + 0.06);
  } catch (e) {
    // 静默降级：部分浏览器可能不支持 Web Audio API
  }
}

// 触发手机震动
function triggerVibrate() {
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }
}

// 飘出文字
function spawnFloatingText(x, y) {
  const text = FLOATING_TEXTS[Math.floor(Math.random() * FLOATING_TEXTS.length)];
  const el = document.createElement('span');
  el.className = 'floating-text';
  el.textContent = text;
  // 在点击位置附近随机偏移
  const offsetX = (Math.random() - 0.5) * 120;
  const offsetY = (Math.random() - 0.5) * 40 - 20;
  el.style.left = (x + offsetX) + 'px';
  el.style.top = (y + offsetY) + 'px';
  document.body.appendChild(el);

  el.addEventListener('animationend', () => el.remove());
}

// 创建波纹效果
function createRipple(container, x, y) {
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  container.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

// 敲击处理
async function handleKnock(event) {
  const container = document.getElementById('wooden-fish-container');
  const fish = document.getElementById('wooden-fish');

  if (!container || !fish) return;

  // 动画
  fish.classList.add('knocking');
  setTimeout(() => fish.classList.remove('knocking'), 100);

  // 音效
  playKnockSound();

  // 震动
  triggerVibrate();

  // 波纹
  const rect = container.getBoundingClientRect();
  const cx = event.clientX || (rect.left + rect.width / 2);
  const cy = event.clientY || (rect.top + rect.height / 2);
  createRipple(container, cx - rect.left, cy - rect.top);

  // 飘出文字
  spawnFloatingText(cx, cy);

  // 计数
  knockCount++;
  updateDisplay();
  saveKnocks();

  // 已登录则同步到 Supabase
  if (window.syncKnocksToProfile) {
    window.syncKnocksToProfile(knockCount);
  }
}

// 初始化木鱼
function initWoodenFish() {
  initKnockCounter();

  const fish = document.getElementById('wooden-fish');
  if (fish) {
    fish.addEventListener('click', handleKnock);
    fish.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleKnock(e.touches[0]);
    });
  }
}

// 同步远端数据（登录后合并）
async function mergeRemoteKnocks(remoteCount) {
  const localCount = knockCount;
  // 取较大值
  if (remoteCount > localCount) {
    knockCount = remoteCount;
    saveKnocks();
    updateDisplay();
  } else if (localCount > (remoteCount || 0)) {
    // 本地更多，同步到远端
    if (window.syncKnocksToProfile) {
      await window.syncKnocksToProfile(localCount);
    }
  }
}
