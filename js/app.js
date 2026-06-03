// 般若阁 - 全局应用逻辑

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFontSize();
  initAuthUI();
  setActiveNav();
});

// ===== 主题切换 =====
function initTheme() {
  const saved = localStorage.getItem('borege_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    updateThemeIcon(btn, saved);
    btn.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('borege_theme', next);

  const btn = document.getElementById('theme-toggle');
  if (btn) updateThemeIcon(btn, next);
}

function updateThemeIcon(btn, theme) {
  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  btn.setAttribute('aria-label', theme === 'dark' ? '切换日间模式' : '切换夜间模式');
}

// ===== 字体大小调节 =====
function initFontSize() {
  const saved = localStorage.getItem('borege_font_size') || 'normal';
  document.documentElement.setAttribute('data-font-size', saved);

  document.querySelectorAll('.font-size-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.size === saved) btn.classList.add('active');

    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      document.documentElement.setAttribute('data-font-size', size);
      localStorage.setItem('borege_font_size', size);
      document.querySelectorAll('.font-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ===== 认证 UI =====
async function initAuthUI() {
  const loginBtn = document.getElementById('btn-login');
  const userInfo = document.getElementById('user-info');
  const usernameDisplay = document.getElementById('username-display');

  try {
    const user = await getCurrentUser();
    if (user) {
      // 已登录
      if (loginBtn) loginBtn.style.display = 'none';
      if (userInfo) userInfo.style.display = 'flex';
      if (usernameDisplay) {
        usernameDisplay.textContent = user.user_metadata?.username || user.email?.split('@')[0] || '行者';
      }

      // 同步敲击数据
      const remote = await fetchKnocksFromProfile();
      if (remote !== null && typeof mergeRemoteKnocks === 'function') {
        await mergeRemoteKnocks(remote.total_knocks || 0);
      }
    }
  } catch (e) {
    // Supabase 未配置或网络错误，使用离线模式
    console.log('离线模式：未连接 Supabase');
  }
}

// 显示登录/注册弹窗
let currentModal = null;

function showAuthModal(mode) {
  if (currentModal) currentModal.remove();

  const isLogin = mode === 'login';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="modal-close">&times;</button>
      <h2 class="modal-title">${isLogin ? '登录' : '注册'}</h2>
      <form id="auth-form">
        ${!isLogin ? `
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input class="form-input" type="text" id="auth-username" placeholder="请输入用户名" autocomplete="username">
        </div>` : ''}
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input class="form-input" type="email" id="auth-email" placeholder="请输入邮箱" required autocomplete="email">
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input class="form-input" type="password" id="auth-password" placeholder="请输入密码（至少6位）" required minlength="6" autocomplete="${isLogin ? 'current-password' : 'new-password'}">
        </div>
        <div class="form-error" id="auth-error"></div>
        <button type="submit" class="btn btn-primary btn-block">
          ${isLogin ? '登录' : '注册'}
        </button>
      </form>
      <div class="modal-divider">或</div>
      <button class="btn btn-github btn-block" id="btn-github-login">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        GitHub 登录
      </button>
      <div class="modal-footer">
        ${isLogin
          ? '没有账号？<span id="switch-to-register">立即注册</span>'
          : '已有账号？<span id="switch-to-login">立即登录</span>'
        }
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  currentModal = overlay;

  // 关闭
  overlay.querySelector('#modal-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // 切换登录/注册
  const switchBtn = overlay.querySelector(isLogin ? '#switch-to-register' : '#switch-to-login');
  if (switchBtn) {
    switchBtn.addEventListener('click', () => {
      overlay.remove();
      showAuthModal(isLogin ? 'register' : 'login');
    });
  }

  // GitHub 登录
  overlay.querySelector('#btn-github-login').addEventListener('click', async () => {
    try {
      await signInWithGitHub();
    } catch (e) {
      document.getElementById('auth-error').textContent = 'GitHub 登录失败：' + e.message;
    }
  });

  // 表单提交
  overlay.querySelector('#auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('auth-error');
    errEl.textContent = '';
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        const username = document.getElementById('auth-username')?.value?.trim() || email.split('@')[0];
        const result = await signUp(email, password, username);
        if (result?.user?.identities?.length === 0) {
          errEl.textContent = '该邮箱已注册，请直接登录。';
          return;
        }
        showToast('注册成功！请查看邮箱确认链接。');
      }
      overlay.remove();
      currentModal = null;
      showToast(isLogin ? '登录成功！' : '注册成功！');
      // 刷新登录状态
      setTimeout(() => initAuthUI(), 500);
    } catch (err) {
      errEl.textContent = err.message || '操作失败，请重试。';
    }
  });
}

// 登出
async function handleLogout() {
  try {
    await signOut();
    showToast('已退出登录');
    setTimeout(() => location.reload(), 500);
  } catch (e) {
    showToast('退出失败：' + e.message);
  }
}

// ===== Toast 提示 =====
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);

  toast.addEventListener('animationend', (e) => {
    if (e.animationName === 'toastOut') toast.remove();
  });
}

// ===== 导航高亮 =====
function setActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.bottom-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// 暴露到全局
window.showToast = showToast;
window.showAuthModal = showAuthModal;
window.handleLogout = handleLogout;
window.initWoodenFish = initWoodenFish;
window.initKnockCounter = initKnockCounter;
window.getKnockCount = getKnockCount;
window.syncKnocksToProfile = syncKnocksToProfile;
window.fetchKnocksFromProfile = fetchKnocksFromProfile;
window.mergeRemoteKnocks = mergeRemoteKnocks;
