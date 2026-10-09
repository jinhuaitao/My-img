/**
 * Cloudflare Workers Photo Manager v8.8 (Custom Tooltips)
 * Features: 
 * - Custom Tooltips for Link Buttons (Hover text).
 * - Full Link Formats, Dark Mode, Upload Progress.
 */

const CONFIG_FILE = '.sys_config.json'; 

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. 静态资源 (图片)
    if (path.startsWith('/file/')) {
      const key = decodeURIComponent(path.replace('/file/', ''));
      if (key === CONFIG_FILE) return new Response('Forbidden', { status: 403 });
      
      const object = await env.BUCKET.get(key);
      if (!object) return new Response('File not found', { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable'); 
      headers.set('Access-Control-Allow-Origin', '*'); 

      return new Response(object.body, { headers });
    }

    // 2. API 路由
    if (path.startsWith('/api/')) {
      return handleApi(request, env, url);
    }

    // 3. 前端页面
    return new Response(getHtml(), {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  },
};

// --- 后端 API ---
async function handleApi(request, env, url) {
  const path = url.pathname;
  const configObj = await env.BUCKET.get(CONFIG_FILE);
  const isSetup = configObj !== null;

  // 初始化 & 修改密码
  if (path === '/api/setup' || path === '/api/password') {
    if (path === '/api/setup' && isSetup) return jsonResp({ error: 'System already setup' }, 403);
    
    if (path === '/api/password' && !await isAuthenticated(request, env)) {
        return jsonResp({ error: 'Unauthorized' }, 401);
    }

    const { username, password } = await request.json();
    if (!username || !password) return jsonResp({ error: 'Missing fields' }, 400);
    
    await env.BUCKET.put(CONFIG_FILE, JSON.stringify({ username, password }));
    return jsonResp({ success: true });
  }

  // 状态
  if (path === '/api/status') {
    return jsonResp({ setup: isSetup });
  }

  // 登录
  if (path === '/api/login') {
    if (!isSetup) return jsonResp({ error: 'Not setup' }, 400);
    const { username, password } = await request.json();
    const currentConfig = await request.json ? await configObj.json() : null;
    
    if (username === currentConfig.username && password === currentConfig.password) {
      const token = btoa(`${username}:${password}:${Date.now()}`);
      return jsonResp({ success: true, token });
    }
    return jsonResp({ error: 'Invalid credentials' }, 401);
  }

  // 鉴权拦截
  if (!await isAuthenticated(request, env)) {
    return jsonResp({ error: 'Unauthorized' }, 401);
  }

  // 获取列表
  if (path === '/api/list') {
    const list = await env.BUCKET.list({ limit: 1000 });
    const files = list.objects
      .filter(o => o.key !== CONFIG_FILE)
      .map(o => ({ key: o.key, size: o.size, uploaded: o.uploaded }));
    return jsonResp({ files });
  }

  // 上传
  if (path === '/api/upload' && request.method === 'POST') {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return jsonResp({ error: 'No file' }, 400);

    const timestamp = Date.now();
    const safeName = file.name.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_'); 
    const key = `${timestamp}_${safeName}`; 
    
    await env.BUCKET.put(key, file, {
      httpMetadata: { contentType: file.type }
    });
    return jsonResp({ success: true, key });
  }

  // 删除
  if (path === '/api/delete' && request.method === 'POST') {
    const body = await request.json();
    const keys = body.keys || [body.key];
    if (keys.includes(CONFIG_FILE)) return jsonResp({ error: 'Forbidden' }, 403);
    await Promise.all(keys.map(k => env.BUCKET.delete(k)));
    return jsonResp({ success: true });
  }

  return jsonResp({ error: 'Not found' }, 404);
}

async function isAuthenticated(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  try {
    const decoded = atob(authHeader);
    const [user, pass] = decoded.split(':');
    const configObj = await env.BUCKET.get(CONFIG_FILE);
    if (!configObj) return false;
    const config = await configObj.json();
    return user === config.username && pass === config.password;
  } catch (e) { return false; }
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// --- 前端 UI ---
function getHtml() {
  return `
<!DOCTYPE html>
<html lang="zh-CN" class="">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>图床管理控制台</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = { darkMode: 'class' }
    </script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; }
        
        [v-cloak] { display: none !important; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark ::-webkit-scrollbar-thumb { background: #475569; }
        .dark ::-webkit-scrollbar-thumb:hover { background: #64748b; }

        .fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
        .fade-enter-from, .fade-leave-to { opacity: 0; }
        
        .scale-enter-active, .scale-leave-active { transition: all 0.2s ease; }
        .scale-enter-from, .scale-leave-to { opacity: 0; transform: scale(0.95); }

        .slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
        .slide-up-enter-from, .slide-up-leave-to { transform: translateY(20px); opacity: 0; }

        .masonry { column-count: 2; column-gap: 1rem; }
        @media (min-width: 640px) { .masonry { column-count: 3; } }
        @media (min-width: 1024px) { .masonry { column-count: 4; } }
        @media (min-width: 1280px) { .masonry { column-count: 5; } }
        .break-inside { break-inside: avoid; }
    </style>
</head>
<body class="h-screen overflow-hidden flex text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
    <div id="app" v-cloak class="w-full h-full flex relative">

        <transition name="fade">
            <div v-if="loading" class="fixed inset-0 z-[100] bg-white/60 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
                <i class="fas fa-circle-notch fa-spin text-4xl text-blue-600 dark:text-blue-500"></i>
            </div>
        </transition>

        <transition name="fade">
            <div v-if="confirmState.show" class="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <transition name="scale" appear>
                    <div class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 p-6">
                        <div class="flex flex-col items-center text-center">
                            <div class="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center text-xl mb-4">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-2">{{ confirmState.title }}</h3>
                            <p class="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed whitespace-pre-wrap">{{ confirmState.msg }}</p>
                            <div class="grid grid-cols-2 gap-3 w-full">
                                <button @click="handleCancel" class="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition">
                                    取消
                                </button>
                                <button @click="handleConfirm" class="px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white font-medium shadow-lg shadow-red-500/30 transition">
                                    确定
                                </button>
                            </div>
                        </div>
                    </div>
                </transition>
            </div>
        </transition>

        <transition name="fade">
            <div v-if="uploadResult.show" class="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <transition name="scale" appear>
                    <div class="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
                        <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 class="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <i class="fas fa-check-circle text-green-500"></i> 上传成功 ({{ uploadResult.items.length }})
                            </h3>
                            <button @click="uploadResult.show = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                                <i class="fas fa-times text-lg"></i>
                            </button>
                        </div>
                        <div class="p-4 overflow-y-auto">
                            <div class="space-y-4">
                                <div v-for="(item, index) in uploadResult.items" :key="index" class="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 rounded overflow-hidden bg-slate-200 flex-shrink-0">
                                            <img :src="item.url" class="w-full h-full object-cover">
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="text-sm font-medium text-slate-700 dark:text-slate-300 truncate mb-1" :title="item.key">
                                                {{ item.key.split('_').slice(1).join('_') }}
                                            </div>
                                            <div class="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">
                                                {{ item.url }}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <button v-for="link in getAllLinks(item.url)" :key="link.label" @click="copyText(link.val)" class="flex-1 min-w-[60px] text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-600 dark:hover:text-blue-400 transition flex items-center justify-center gap-1.5" :title="link.tip">
                                            <i :class="link.icon"></i> {{ link.label }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                            <button @click="uploadResult.show = false" class="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium">
                                关闭窗口
                            </button>
                        </div>
                    </div>
                </transition>
            </div>
        </transition>

        <transition name="slide-up">
            <div v-if="uploadStatus.show" class="fixed bottom-6 right-6 z-[120] w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 overflow-hidden">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                        <i class="fas fa-cloud-upload-alt text-blue-500 animate-bounce"></i> 上传中...
                    </span>
                    <span class="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {{ uploadStatus.current }} / {{ uploadStatus.total }}
                    </span>
                </div>
                <div class="mb-2">
                    <div class="text-xs text-slate-500 dark:text-slate-400 truncate mb-1">{{ uploadStatus.filename }}</div>
                    <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div class="bg-blue-500 h-2 rounded-full transition-all duration-200" :style="{ width: uploadStatus.percent + '%' }"></div>
                    </div>
                </div>
                <div class="text-right text-xs font-bold text-blue-600 dark:text-blue-400">{{ uploadStatus.percent }}%</div>
            </div>
        </transition>

        <div class="fixed top-5 right-5 z-[110] flex flex-col gap-2 pointer-events-none">
            <transition-group name="fade">
                <div v-for="t in toasts" :key="t.id" :class="['px-4 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 pointer-events-auto', t.type === 'error' ? 'bg-red-500' : 'bg-slate-800 dark:bg-slate-700 dark:border dark:border-slate-600']">
                    <i :class="['fas', t.type === 'error' ? 'fa-times-circle' : 'fa-check-circle']"></i> {{ t.msg }}
                </div>
            </transition-group>
        </div>

        <div v-if="view === 'login' || view === 'setup'" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-500">
            
            <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/30 dark:bg-blue-600/20 rounded-full blur-[100px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]"></div>
            <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite]" style="animation-delay: 1s;"></div>
            <div class="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-cyan-300/20 dark:bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse" style="animation-delay: 2s;"></div>

            <transition name="scale" appear>
                <div class="relative w-full max-w-[400px] bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-none border border-white/50 dark:border-white/10 p-8 md:p-10 overflow-hidden group">
                    
                    <div class="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

                    <div class="text-center mb-10 relative z-10">
                        <div class="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-blue-500/30 transform group-hover:scale-110 group-hover:rotate-3 transition duration-500 mb-6">
                            <i class="fas fa-cloud"></i>
                        </div>
                        <h1 class="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                            {{ view === 'setup' ? '系统初始化' : '欢迎回来' }}
                        </h1>
                        <p class="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                            {{ view === 'setup' ? '配置管理员账号以开始使用' : 'Cloudflare Workers 图床管理' }}
                        </p>
                    </div>

                    <div class="space-y-5 relative z-10">
                        <div class="group/input">
                            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">账号</label>
                            <div class="relative">
                                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors">
                                    <i class="fas fa-user"></i>
                                </div>
                                <input v-model="form.username" type="text" placeholder="请输入用户名" 
                                    class="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all duration-300 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm font-medium">
                            </div>
                        </div>

                        <div class="group/input">
                            <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">密码</label>
                            <div class="relative">
                                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors">
                                    <i class="fas fa-lock"></i>
                                </div>
                                <input v-model="form.password" type="password" placeholder="请输入密码" @keyup.enter="submitAuth"
                                    class="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all duration-300 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm font-medium">
                            </div>
                        </div>

                        <button @click="submitAuth" 
                            class="w-full mt-2 relative overflow-hidden bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 group/btn">
                            <span class="relative z-10 flex items-center justify-center gap-2">
                                {{ view === 'setup' ? '立即设置' : '登录控制台' }} 
                                <i class="fas fa-arrow-right text-xs opacity-70 group-hover/btn:translate-x-1 transition-transform"></i>
                            </span>
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                        </button>
                    </div>

                </div>
            </transition>
        </div>

        <aside v-if="isAuth" :class="['fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300', sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0']">
            <div class="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-500/20 shadow-lg"><i class="fas fa-cloud"></i></div>
                <span class="font-bold text-lg tracking-tight text-slate-800 dark:text-white">图片管理</span>
            </div>
            
            <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
                <a @click="currentTab = 'dashboard'; sidebarOpen = false" :class="['flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition cursor-pointer', currentTab === 'dashboard' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white']">
                    <i class="fas fa-chart-pie w-5"></i> 仪表盘
                </a>
                <a @click="currentTab = 'gallery'; sidebarOpen = false" :class="['flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition cursor-pointer', currentTab === 'gallery' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white']">
                    <i class="fas fa-images w-5"></i> 图片管理
                    <span class="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs py-0.5 px-2 rounded-full">{{ images.length }}</span>
                </a>
                <a @click="currentTab = 'settings'; sidebarOpen = false" :class="['flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition cursor-pointer', currentTab === 'settings' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white']">
                    <i class="fas fa-cog w-5"></i> 系统设置
                </a>
            </nav>

            <div class="p-4 border-t border-slate-100 dark:border-slate-800">
                <button @click="logout" class="flex items-center gap-3 px-4 py-3 w-full text-left text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition">
                    <i class="fas fa-sign-out-alt w-5"></i> 退出登录
                </button>
            </div>
        </aside>

        <div v-if="sidebarOpen && isAuth" @click="sidebarOpen = false" class="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"></div>

        <main v-if="isAuth" class="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-950 transition-colors">
            <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20 transition-colors">
                <div class="flex items-center gap-4">
                    <button @click="sidebarOpen = !sidebarOpen" class="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-700"><i class="fas fa-bars text-xl"></i></button>
                    <h2 class="text-xl font-bold text-slate-800 dark:text-white">{{ tabTitle }}</h2>
                </div>
                <input type="file" ref="fileInput" @change="handleFileChange" class="hidden" multiple accept="image/*">
            </header>

            <div class="flex-1 overflow-y-auto p-4 md:p-8" @paste="handlePaste">
                
                <div v-if="currentTab === 'dashboard'" class="max-w-5xl mx-auto space-y-6 animate-fade-in">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors hover:shadow-md dark:hover:border-slate-700">
                            <div class="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">占用空间</div>
                            <div class="text-3xl font-bold text-slate-800 dark:text-white">{{ totalSize }}</div>
                            <div class="text-green-500 text-xs mt-2 font-medium"><i class="fas fa-database"></i> 云端存储</div>
                        </div>
                        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors hover:shadow-md dark:hover:border-slate-700">
                            <div class="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">图片数量</div>
                            <div class="text-3xl font-bold text-slate-800 dark:text-white">{{ images.length }}</div>
                            <div class="text-blue-500 text-xs mt-2 font-medium"><i class="fas fa-camera"></i> 累计上传</div>
                        </div>
                         <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors hover:shadow-md dark:hover:border-slate-700">
                            <div class="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">近期上传</div>
                            <div class="text-3xl font-bold text-slate-800 dark:text-white">{{ recentCount }}</div>
                            <div class="text-purple-500 text-xs mt-2 font-medium"><i class="fas fa-clock"></i> 24小时内</div>
                        </div>
                    </div>
                    
                    <div @click="triggerUpload" @drop.prevent="handleDrop" @dragover.prevent class="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition group">
                        <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-blue-500 transition mb-4">
                            <i class="fas fa-cloud-upload-alt text-2xl"></i>
                        </div>
                        <p class="text-lg font-medium text-slate-600 dark:text-slate-300">点击或拖拽上传</p>
                        <p class="text-slate-400 text-sm mt-1">支持 Ctrl+V 粘贴</p>
                    </div>
                </div>

                <div v-if="currentTab === 'gallery'" class="h-full flex flex-col">
                    <div class="flex flex-wrap gap-4 items-center justify-between mb-6 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                        <div class="relative w-full md:w-64">
                            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input v-model="searchQuery" placeholder="搜索文件名..." class="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-none transition dark:text-white dark:placeholder-slate-500">
                        </div>
                        
                        <div class="flex items-center gap-2 ml-auto">
                            <select v-model="sortBy" class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg p-2 outline-none cursor-pointer">
                                <option value="date_desc">📅 日期 (新→旧)</option>
                                <option value="date_asc">📅 日期 (旧→新)</option>
                                <option value="size_desc">💾 大小 (大→小)</option>
                                <option value="name_asc">🔤 文件名 (A-Z)</option>
                            </select>

                            <div class="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                <button @click="viewMode = 'grid'" :class="['p-1.5 rounded-md w-8 flex items-center justify-center transition', viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400']"><i class="fas fa-th-large"></i></button>
                                <button @click="viewMode = 'list'" :class="['p-1.5 rounded-md w-8 flex items-center justify-center transition', viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400']"><i class="fas fa-list"></i></button>
                            </div>
                        </div>

                        <button @click="toggleSelectMode" :class="['px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2', selectMode ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700']">
                            <i class="fas fa-check-square"></i> {{ selectMode ? '取消' : '管理' }}
                        </button>
                    </div>

                    <div v-if="selectMode" class="mb-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex items-center justify-between animate-fade-in">
                        <div class="flex items-center gap-3">
                             <button @click="selectAll" class="text-blue-700 dark:text-blue-400 font-medium text-sm hover:underline">全选</button>
                             <span class="text-blue-400 dark:text-slate-600">|</span>
                             <span class="text-blue-900 dark:text-blue-300 text-sm font-bold">已选 {{ selected.length }} 项</span>
                        </div>
                        <div class="flex gap-2">
                             <button @click="batchCopy" :disabled="selected.length===0" class="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-50">复制链接</button>
                             <button @click="batchDelete" :disabled="selected.length===0" class="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-red-600 disabled:opacity-50">删除</button>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto pb-20">
                        <div v-if="filteredImages.length === 0" class="text-center py-20 text-slate-400 dark:text-slate-500">
                            <i class="far fa-folder-open text-4xl mb-2"></i>
                            <p>无匹配图片</p>
                        </div>

                        <div v-if="viewMode === 'grid'" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
    <div v-for="img in filteredImages" :key="img.key" class="relative group">
        <div @click="handleClick(img)" @contextmenu.prevent="openCtxMenu($event, img)" :class="['aspect-square rounded-xl overflow-hidden border transition cursor-pointer relative bg-white dark:bg-slate-900', isSelected(img) ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200 dark:border-slate-800 hover:shadow-md dark:hover:border-slate-700']">
            <img :src="'/file/' + img.key" loading="lazy" class="w-full h-full object-cover">
            
            <div v-if="selectMode" class="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-colors" :class="isSelected(img) ? 'bg-blue-500 border-blue-500' : 'bg-black/30'">
                <i v-if="isSelected(img)" class="fas fa-check text-white text-[10px]"></i>
            </div>
            <div v-if="!selectMode" class="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition text-white text-xs truncate">
                {{ img.key.split('_').slice(1).join('_') }}
            </div>
        </div>
    </div>
</div>

                        <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                            <table class="w-full text-left border-collapse">
                                <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                                    <tr>
                                        <th class="p-4 w-10" v-if="selectMode"><div class="w-4 h-4 border dark:border-slate-600 rounded"></div></th>
                                        <th class="p-4">预览</th>
                                        <th class="p-4">文件名</th>
                                        <th class="p-4">大小</th>
                                        <th class="p-4">上传时间</th>
                                        <th class="p-4 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr v-for="img in filteredImages" :key="img.key" @click="handleClick(img)" @contextmenu.prevent="openCtxMenu($event, img)" :class="['hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition', isSelected(img) ? 'bg-blue-50/50 dark:bg-blue-900/20' : '']">
                                        <td class="p-4" v-if="selectMode">
                                            <div :class="['w-5 h-5 rounded border flex items-center justify-center', isSelected(img) ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-600']">
                                                <i v-if="isSelected(img)" class="fas fa-check text-white text-xs"></i>
                                            </div>
                                        </td>
                                        <td class="p-4 w-16">
                                            <img :src="'/file/' + img.key" class="w-10 h-10 rounded object-cover border border-slate-200 dark:border-slate-700">
                                        </td>
                                        <td class="p-4 text-slate-700 dark:text-slate-200 font-medium truncate max-w-xs">{{ img.key.split('_').slice(1).join('_') }}</td>
                                        <td class="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{{ formatSize(img.size) }}</td>
                                        <td class="p-4 text-slate-500 dark:text-slate-400 text-xs">{{ formatDate(img.uploaded) }}</td>
                                        <td class="p-4 text-right">
                                            <button @click.stop="copyLink(img)" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2"><i class="fas fa-link"></i></button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div v-if="currentTab === 'settings'" class="max-w-4xl mx-auto animate-fade-in space-y-6">
                    
                    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
                        <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <i class="fas fa-palette text-purple-600"></i> 外观设置
                        </h3>
                        <div class="grid grid-cols-3 gap-4">
                            <button @click="setThemeMode('light')" :class="['p-4 rounded-xl border flex flex-col items-center gap-3 transition', themeMode === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800']">
                                <i class="fas fa-sun text-2xl"></i> <span class="text-sm font-medium">浅色模式</span>
                            </button>
                            <button @click="setThemeMode('dark')" :class="['p-4 rounded-xl border flex flex-col items-center gap-3 transition', themeMode === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800']">
                                <i class="fas fa-moon text-2xl"></i> <span class="text-sm font-medium">深色模式</span>
                            </button>
                            <button @click="setThemeMode('system')" :class="['p-4 rounded-xl border flex flex-col items-center gap-3 transition', themeMode === 'system' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800']">
                                <i class="fas fa-desktop text-2xl"></i> <span class="text-sm font-medium">跟随系统</span>
                            </button>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
                        <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <i class="fas fa-user-shield text-blue-600"></i> 用户管理
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">新的用户名</label>
                                <div class="relative">
                                    <i class="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                    <input v-model="settingsForm.username" type="text" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition dark:text-white">
                                </div>
                            </div>
                            <div>
                                <label class="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">新的密码</label>
                                <div class="relative">
                                    <i class="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                    <input v-model="settingsForm.password" type="password" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition dark:text-white">
                                </div>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button @click="updateSettings" class="bg-slate-900 dark:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition shadow-lg">
                                <i class="fas fa-save mr-2"></i> 保存更改
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </main>

        <transition name="fade">
            <div v-if="ctxMenu.show" :style="{ top: ctxMenu.y + 'px', left: ctxMenu.x + 'px' }" class="fixed z-[999] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 w-56 text-sm flex flex-col overflow-hidden" @click.stop>
                <button @click="handleClick(ctxMenu.item); closeCtxMenu()" class="text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-3 transition">
                    <i class="fas fa-eye text-slate-400 w-4"></i> 预览详情
                </button>
                <div class="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                <button @click="copyLink(ctxMenu.item); closeCtxMenu()" class="text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-3 transition">
                    <i class="fas fa-link text-slate-400 w-4"></i> 复制直链
                </button>
                <button @click="copyFmt(ctxMenu.item, 'mdlink'); closeCtxMenu()" class="text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-3 transition">
                    <i class="fas fa-font text-slate-400 w-4"></i> 复制 [Link](url)
                </button>
                <button @click="copyFmt(ctxMenu.item, 'md'); closeCtxMenu()" class="text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-3 transition">
                    <i class="fab fa-markdown text-slate-400 w-4"></i> 复制 Markdown
                </button>
                <button @click="copyFmt(ctxMenu.item, 'html'); closeCtxMenu()" class="text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-3 transition">
                    <i class="fas fa-code text-slate-400 w-4"></i> 复制 HTML
                </button>
                 <button @click="copyFmt(ctxMenu.item, 'bbcode'); closeCtxMenu()" class="text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-3 transition">
                    <i class="fas fa-square-brackets text-slate-400 w-4"></i> 复制 BBCode
                </button>
                <div class="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                <button @click="deleteSingle(ctxMenu.item); closeCtxMenu()" class="text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-3 transition">
                    <i class="fas fa-trash-alt w-4"></i> 删除图片
                </button>
            </div>
        </transition>

        <transition name="fade">
            <div v-if="detail.show" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" @click.self="detail.show = false">
                <div class="relative w-full max-w-6xl h-[90vh] flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
                    <div class="flex-1 bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative overflow-hidden group">
                        <img :src="detailUrl" :style="{ transform: 'rotate(' + rotateDeg + 'deg)' }" class="max-w-full max-h-full object-contain transition-transform duration-300">
                        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white rounded-full px-4 py-2 flex gap-4 opacity-0 group-hover:opacity-100 transition">
                            <button @click="rotateDeg -= 90" title="左旋"><i class="fas fa-undo"></i></button>
                            <button @click="rotateDeg += 90" title="右旋"><i class="fas fa-redo"></i></button>
                            <a :href="detailUrl" target="_blank" title="原图"><i class="fas fa-external-link-alt"></i></a>
                        </div>
                    </div>
                    <div class="w-full md:w-80 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 p-6 flex flex-col">
                         <div class="flex justify-between items-center mb-6">
                            <h3 class="font-bold text-slate-800 dark:text-white">图片详情</h3>
                            <button @click="detail.show = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><i class="fas fa-times text-xl"></i></button>
                        </div>
                        <div class="space-y-4 flex-1 overflow-y-auto">
                            <div v-for="linkObj in detailLinks" :key="linkObj.label">
                                <label class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{{ linkObj.label }}</label>
                                <div class="flex mt-1">
                                    <input readonly :value="linkObj.val" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-l px-2 py-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono outline-none">
                                    <button @click="copyText(linkObj.val)" class="bg-white dark:bg-slate-700 border border-l-0 border-slate-200 dark:border-slate-700 px-3 text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs rounded-r">复制</button>
                                </div>
                            </div>
                        </div>
                        <div class="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                            <button @click="deleteSingle(detail.item)" class="w-full bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 py-2 rounded-lg font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition"><i class="fas fa-trash-alt"></i> 删除图片</button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

    </div>
    <script>
        const { createApp, ref, computed, onMounted, reactive, watch, onUnmounted } = Vue;

        createApp({
            setup() {
                // --- Theme Management ---
                const themeMode = ref(localStorage.getItem('theme_mode') || 'system');

                const applyTheme = () => {
                    const isDark = themeMode.value === 'dark' || (themeMode.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    if (isDark) document.documentElement.classList.add('dark');
                    else document.documentElement.classList.remove('dark');
                };

                const setThemeMode = (mode) => {
                    themeMode.value = mode;
                    localStorage.setItem('theme_mode', mode);
                    applyTheme();
                };

                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

                // --- Core State ---
                const view = ref('loading');
                const sidebarOpen = ref(false);
                const currentTab = ref('dashboard');
                const images = ref([]);
                const loading = ref(false); 
                const form = ref({ username: '', password: '' });
                const settingsForm = ref({ username: '', password: '' });
                const toasts = ref([]);
                const fileInput = ref(null);

                // --- Confirm Modal State ---
                const confirmState = reactive({
                    show: false,
                    title: '',
                    msg: '',
                    resolve: null
                });

                const safeConfirm = (title, msg) => {
                    return new Promise((resolve) => {
                        confirmState.title = title;
                        confirmState.msg = msg;
                        confirmState.show = true;
                        confirmState.resolve = resolve;
                    });
                };

                const handleConfirm = () => {
                    confirmState.show = false;
                    if(confirmState.resolve) confirmState.resolve(true);
                };

                const handleCancel = () => {
                    confirmState.show = false;
                    if(confirmState.resolve) confirmState.resolve(false);
                };

                // --- Upload State & Result Modal ---
                const uploadStatus = reactive({ show: false, total: 0, current: 0, filename: '', percent: 0 });
                const uploadResult = reactive({ show: false, items: [] }); 

                // --- Gallery State ---
                const searchQuery = ref('');
                const sortBy = ref('date_desc');
                const viewMode = ref('grid'); 
                const selectMode = ref(false);
                const selected = ref([]);
                
                // --- Detail & Context Menu ---
                const detail = reactive({ show: false, item: null });
                const rotateDeg = ref(0);
                const ctxMenu = reactive({ show: false, x: 0, y: 0, item: null });

                // --- Watchers ---
                watch(currentTab, () => { ctxMenu.show = false; });
                watch(view, () => { ctxMenu.show = false; });

                // --- Computed ---
                const isAuth = computed(() => view.value !== 'login' && view.value !== 'setup' && view.value !== 'loading');
                
                const tabTitle = computed(() => {
                    if (currentTab.value === 'dashboard') return '仪表盘';
                    if (currentTab.value === 'gallery') return '图片管理';
                    if (currentTab.value === 'settings') return '系统设置';
                });

                const totalSize = computed(() => {
                    const bytes = images.value.reduce((acc, img) => acc + img.size, 0);
                    if (bytes === 0) return '0 B';
                    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                });

                const recentCount = computed(() => {
                    const day = 24 * 60 * 60 * 1000;
                    const now = Date.now();
                    return images.value.filter(i => (now - new Date(i.uploaded).getTime()) < day).length;
                });

                const filteredImages = computed(() => {
                    let res = images.value;
                    if (searchQuery.value) {
                        res = res.filter(i => i.key.toLowerCase().includes(searchQuery.value.toLowerCase()));
                    }
                    res = [...res].sort((a, b) => {
                        if (sortBy.value === 'date_desc') return new Date(b.uploaded) - new Date(a.uploaded);
                        if (sortBy.value === 'date_asc') return new Date(a.uploaded) - new Date(b.uploaded);
                        if (sortBy.value === 'size_desc') return b.size - a.size;
                        if (sortBy.value === 'name_asc') return a.key.localeCompare(b.key);
                        return 0;
                    });
                    return res;
                });

                const detailUrl = computed(() => detail.item ? window.location.origin + '/file/' + detail.item.key : '');
                
                const detailLinks = computed(() => {
                    const u = detailUrl.value;
                    return [
                        { label: '直接网址', val: u },
                        { label: 'Markdown Text', val: \`[Link](\${u})\` }, 
                        { label: 'Markdown', val: \`![](\${u})\` },
                        { label: 'Markdown Image Link', val: \`[![Image](\${u})](\${u})\` },
                        { label: 'HTML', val: \`<img src="\${u}" />\` },
                        { label: 'BBCode', val: \`[img]\${u}[/img]\` }
                    ];
                });

                // Helper to generate ALL link formats for a given URL with TOOLTIPS
                const getAllLinks = (url) => {
                    return [
                        { label: 'URL', icon: 'fas fa-link', val: url, tip: '直链' },
                        { label: 'MD', icon: 'fab fa-markdown', val: \`![](\${url})\`, tip: '![ ]( )' },
                        { label: 'Text', icon: 'fas fa-font', val: \`[Link](\${url})\`, tip: '[Link]( )' },
                        { label: 'HTML', icon: 'fas fa-code', val: \`<img src="\${url}" />\`, tip: '<img> ' },
                        { label: 'BB', icon: 'fas fa-square-brackets', val: \`[img]\${url}[/img]\`, tip: '[img][/img]' }
                    ];
                };

                // --- Methods ---
                const showToast = (msg, type = 'success') => {
                    const id = Date.now();
                    toasts.value.push({ id, msg, type });
                    setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 3000);
                };

                const fetchApi = async (path, opts = {}) => {
                    const token = localStorage.getItem('auth_token');
                    if (token) opts.headers = { ...opts.headers, 'Authorization': token };
                    const res = await fetch('/api' + path, opts);
                    if (res.status === 401) {
                        localStorage.removeItem('auth_token');
                        view.value = 'login';
                        throw new Error('Auth failed');
                    }
                    return await res.json();
                };

                const checkStatus = async () => {
                    try {
                        const data = await fetchApi('/status');
                        if (!data.setup) view.value = 'setup';
                        else if (localStorage.getItem('auth_token')) {
                            view.value = 'app';
                            loadImages();
                        } else view.value = 'login';
                    } catch (e) { view.value = 'login'; }
                };

                const loadImages = async () => {
                    try {
                        const data = await fetchApi('/list');
                        images.value = data.files;
                    } catch(e) {}
                };

                const submitAuth = async () => {
                    loading.value = true;
                    try {
                        const path = view.value === 'setup' ? '/setup' : '/login';
                        const data = await fetchApi(path, { method: 'POST', body: JSON.stringify(form.value) });
                        if (data.success) {
                            if (data.token) localStorage.setItem('auth_token', data.token);
                            view.value = 'app';
                            loadImages();
                            showToast('欢迎回来');
                        } else showToast(data.error, 'error');
                    } catch(e) { showToast('错误', 'error'); } 
                    finally { loading.value = false; }
                };

                const updateSettings = async () => {
                    if(!settingsForm.value.username || !settingsForm.value.password) return showToast('请填写完整', 'error');
                    
                    if (!await safeConfirm('安全警告', '修改密码后需要重新登录，确定继续吗？')) return;
                    
                    try {
                        const data = await fetchApi('/password', { method: 'POST', body: JSON.stringify(settingsForm.value) });
                        if(data.success) {
                            showToast('密码已修改，请重新登录');
                            setTimeout(logout, 1500);
                        }
                    } catch(e) { showToast('修改失败', 'error'); }
                };

                const uploadOneFile = (file) => {
                    return new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', '/api/upload');
                        xhr.setRequestHeader('Authorization', localStorage.getItem('auth_token'));
                        
                        xhr.upload.onprogress = (e) => {
                            if (e.lengthComputable) {
                                uploadStatus.percent = Math.round((e.loaded / e.total) * 100);
                            }
                        };
                        
                        xhr.onload = () => {
                            if (xhr.status === 200) {
                                try {
                                    const res = JSON.parse(xhr.responseText);
                                    resolve(res); 
                                } catch(e) { resolve({ success: true }); }
                            }
                            else reject();
                        };
                        xhr.onerror = reject;

                        const formData = new FormData();
                        formData.append('file', file);
                        xhr.send(formData);
                    });
                };

                const uploadFiles = async (files) => {
                    if (!files.length) return;
                    
                    uploadStatus.show = true;
                    uploadStatus.total = files.length;
                    uploadStatus.current = 0;
                    
                    const newUploads = [];
                    let successCount = 0;

                    for (const file of files) {
                        uploadStatus.current++;
                        uploadStatus.filename = file.name;
                        uploadStatus.percent = 0;
                        
                        try {
                            const res = await uploadOneFile(file);
                            if (res.success && res.key) {
                                newUploads.push({ 
                                    key: res.key, 
                                    url: window.location.origin + '/file/' + res.key 
                                });
                            }
                            successCount++;
                        } catch(e) { console.error(e); }
                    }

                    uploadStatus.show = false;
                    
                    if(successCount > 0) {
                        await loadImages();
                        
                        if (successCount <= 5) {
                            uploadResult.items = newUploads;
                            uploadResult.show = true;
                        } else {
                            showToast(\`成功上传 \${successCount} 张图片\`);
                        }
                    }
                };

                const logout = () => {
                    localStorage.removeItem('auth_token');
                    view.value = 'login';
                    form.value = { username: '', password: '' };
                };

                const triggerUpload = () => {
                    closeCtxMenu();
                    if (fileInput.value) fileInput.value.click();
                };

                const handleFileChange = (e) => uploadFiles(Array.from(e.target.files));
                const handleDrop = (e) => uploadFiles(Array.from(e.dataTransfer.files));
                const handlePaste = (e) => {
                    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
                    const files = [];
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].kind === 'file' && items[i].type.startsWith('image/')) files.push(items[i].getAsFile());
                    }
                    if(files.length) uploadFiles(files);
                };

                const toggleSelectMode = () => {
                    selectMode.value = !selectMode.value;
                    selected.value = [];
                };

                const handleClick = (img) => {
                    if (selectMode.value) {
                        const idx = selected.value.indexOf(img.key);
                        if (idx > -1) selected.value.splice(idx, 1);
                        else selected.value.push(img.key);
                    } else {
                        detail.item = img;
                        detail.show = true;
                        rotateDeg.value = 0;
                    }
                };

                const openCtxMenu = (e, img) => {
                    ctxMenu.show = true;
                    ctxMenu.item = img;
                    const w = 224; 
                    const h = 280; 
                    ctxMenu.x = (e.clientX + w > window.innerWidth) ? e.clientX - w : e.clientX;
                    ctxMenu.y = (e.clientY + h > window.innerHeight) ? e.clientY - h : e.clientY;
                };

                const closeCtxMenu = () => {
                    ctxMenu.show = false;
                };

                const isSelected = (img) => selected.value.includes(img.key);
                const selectAll = () => {
                    if(selected.value.length === filteredImages.value.length) selected.value = [];
                    else selected.value = filteredImages.value.map(i => i.key);
                };

                const copyText = (txt) => navigator.clipboard.writeText(txt).then(() => showToast('已复制'));
                const copyLink = (img) => copyText(window.location.origin + '/file/' + img.key);
                const copyFmt = (img, type) => {
                    const u = window.location.origin + '/file/' + img.key;
                    if(type === 'mdlink') copyText(\`[Link](\${u})\`); 
                    if(type === 'md') copyText(\`![](\${u})\`);
                    if(type === 'html') copyText(\`<img src="\${u}" />\`);
                    if(type === 'bbcode') copyText(\`[img]\${u}[/img]\`);
                };
                
                const batchCopy = () => {
                     const links = selected.value.map(k => window.location.origin + '/file/' + k).join('\\n');
                     copyText(links);
                     showToast(\`已复制 \${selected.value.length} 条链接\`);
                     selectMode.value = false;
                };

                const batchDelete = async () => {
                    const count = selected.value.length;
                    const msg = '确定要删除选中的 ' + count + ' 张图片吗？此操作无法撤销。\\n请谨慎操作。';
                    
                    if (!await safeConfirm('批量删除', msg)) return;

                    loading.value = true;
                    try {
                        await fetchApi('/delete', { method: 'POST', body: JSON.stringify({ keys: selected.value }) });
                        showToast('删除成功');
                        await loadImages();
                        selectMode.value = false;
                        selected.value = [];
                    } catch(e) { showToast('删除失败', 'error'); } 
                    finally { loading.value = false; }
                };

                const deleteSingle = async (img) => {
                    if (!await safeConfirm('删除确认', '确定要永久删除这张图片吗？\\n删除后无法恢复。')) return;
                    
                    loading.value = true;
                    try {
                        await fetchApi('/delete', { method: 'POST', body: JSON.stringify({ key: img.key }) });
                        detail.show = false;
                        await loadImages();
                        showToast('删除成功');
                    } catch(e) {} finally { loading.value = false; }
                };

                const formatSize = (bytes) => (bytes / 1024).toFixed(1) + ' KB';
                const formatDate = (d) => new Date(d).toLocaleDateString();

                const handleGlobalClick = () => { if (ctxMenu.show) ctxMenu.show = false; };
                const handleScroll = () => { if (ctxMenu.show) ctxMenu.show = false; };

                onMounted(() => {
                    checkStatus();
                    applyTheme();
                    window.addEventListener('click', handleGlobalClick);
                    window.addEventListener('scroll', handleScroll, true);
                });

                onUnmounted(() => {
                     window.removeEventListener('click', handleGlobalClick);
                     window.removeEventListener('scroll', handleScroll, true);
                });

                return {
                    view, loading, form, settingsForm, sidebarOpen, currentTab, isAuth, tabTitle,
                    images, filteredImages, totalSize, recentCount,
                    searchQuery, sortBy, viewMode, selectMode, selected, isSelected,
                    detail, detailUrl, detailLinks, rotateDeg, toasts, fileInput,
                    ctxMenu, openCtxMenu, closeCtxMenu, copyFmt, 
                    submitAuth, logout, updateSettings, themeMode, setThemeMode,
                    triggerUpload, handleFileChange, handleDrop, handlePaste, uploadStatus, uploadResult, getAllLinks, confirmState, handleConfirm, handleCancel,
                    toggleSelectMode, handleClick, selectAll, batchCopy, batchDelete, deleteSingle,
                    copyLink, copyText, formatSize, formatDate
                };
            }
        }).mount('#app');
    </script>
</body>
</html>
  `;
}