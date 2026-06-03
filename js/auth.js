// 认证模块 —— Supabase 邮箱/GitHub 登录

let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient) {
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Supabase SDK 未加载，请检查网络连接。');
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// 邮箱注册
async function signUp(email, password, username) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { username: username || email.split('@')[0] }
    }
  });
  if (error) throw error;
  return data;
}

// 邮箱登录
async function signIn(email, password) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// GitHub 登录
async function signInWithGitHub() {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: SITE_URL + '/profile.html'
    }
  });
  if (error) throw error;
  return data;
}

// 退出登录
async function signOut() {
  const sb = getSupabase();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

// 获取当前用户
async function getCurrentUser() {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// 监听认证状态变化
function onAuthStateChange(callback) {
  const sb = getSupabase();
  return sb.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

// 同步敲击次数到 Supabase profiles 表
async function syncKnocksToProfile(totalKnocks) {
  const sb = getSupabase();
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await sb
    .from('profiles')
    .upsert({
      id: user.id,
      username: user.user_metadata?.username || user.email?.split('@')[0] || '行者',
      avatar_url: user.user_metadata?.avatar_url || null,
      total_knocks: totalKnocks,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (error) console.error('同步敲击数据失败:', error.message);
}

// 从 Supabase 获取用户敲击次数
async function fetchKnocksFromProfile() {
  const sb = getSupabase();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await sb
    .from('profiles')
    .select('total_knocks, username, avatar_url')
    .eq('id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // 记录不存在
    console.error('获取敲击数据失败:', error.message);
    return null;
  }

  return data;
}
