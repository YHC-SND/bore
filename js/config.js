// Supabase 配置 —— 请替换为你自己的 Supabase 项目信息
// 1. 前往 https://supabase.com 创建项目
// 2. 在 Settings > API 中复制 URL 和 anon key
// 3. 启用 Email/Password 认证和 GitHub OAuth 认证

const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// GitHub OAuth 回调地址（部署后需在 Supabase 和 GitHub OAuth App 中同步配置）
const SITE_URL = window.location.origin;
