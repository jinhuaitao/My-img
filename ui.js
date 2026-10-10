/**
 * 前端页面：整页 HTML（样式 + 图标精灵 + Vue 单页应用）
 *
 * 用 String.raw 包裹，避免模板字符串吞掉 CSS / JS 里的反斜杠。
 * 注意：本文件内部不允许出现反引号和美元加大括号（会截断模板字面量）。
 */

export default String.raw`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#4f46e5">
<title>图床控制台</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%234f46e5'/%3E%3Cpath d='M6.5 15.8l3.4-3.4 2.6 2.6 2.4-2.4 2.6 2.6' stroke='white' stroke-width='1.9' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='9' cy='9.4' r='1.5' fill='white'/%3E%3C/svg%3E">
<script>
(function () {
  try {
    var mode = localStorage.getItem('ih_theme') || 'system';
    var dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
</script>
<style>
*,*::before,*::after{box-sizing:border-box}
:root{
  --bg:#f4f5f8;--surface:#ffffff;--surface-2:#fafbfd;--surface-3:#eff1f5;
  --border:#e6e8ee;--border-2:#d5d9e2;
  --text:#0f1729;--text-2:#5b6577;--text-3:#8e97a8;
  --accent:#4f46e5;--accent-hover:#4338ca;--accent-soft:#eef0ff;--accent-text:#4338ca;
  --danger:#e11d48;--danger-soft:#fff1f4;--success:#0f9d78;--success-soft:#e9f8f3;
  --warning:#c2740a;--warning-soft:#fdf4e3;
  --shadow-xs:0 1px 2px rgba(15,23,41,.05);
  --shadow-sm:0 1px 2px rgba(15,23,41,.05),0 2px 8px -2px rgba(15,23,41,.07);
  --shadow-md:0 2px 6px -1px rgba(15,23,41,.07),0 12px 28px -10px rgba(15,23,41,.13);
  --shadow-lg:0 14px 28px -10px rgba(15,23,41,.16),0 36px 72px -20px rgba(15,23,41,.24);
  --r-sm:8px;--r-md:11px;--r-lg:15px;--r-xl:20px;
}
html.dark{
  --bg:#070910;--surface:#101320;--surface-2:#151928;--surface-3:#1c2132;
  --border:#232a3c;--border-2:#333b52;
  --text:#e8ecf5;--text-2:#98a3b8;--text-3:#6b7689;
  --accent:#6366f1;--accent-hover:#818cf8;--accent-soft:#1c2040;--accent-text:#a5b4fc;
  --danger:#fb7185;--danger-soft:#2b1620;--success:#34d399;--success-soft:#0d2620;
  --warning:#fbbf24;--warning-soft:#2a2010;
  --shadow-xs:0 1px 2px rgba(0,0,0,.5);
  --shadow-sm:0 1px 2px rgba(0,0,0,.5),0 2px 8px -2px rgba(0,0,0,.5);
  --shadow-md:0 2px 6px -1px rgba(0,0,0,.5),0 12px 28px -10px rgba(0,0,0,.65);
  --shadow-lg:0 14px 28px -10px rgba(0,0,0,.7),0 36px 72px -20px rgba(0,0,0,.8);
}
html,body{height:100%}
body{
  margin:0;background:var(--bg);color:var(--text);
  font-family:"Inter","PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,-apple-system,sans-serif;
  font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased;
  transition:background-color .25s ease,color .25s ease;
}
[v-cloak]{display:none!important}
button{font:inherit;color:inherit}
a{color:inherit;text-decoration:none}
input,select{font:inherit}
h1,h2,h3,h4,p,dl,dd,dt{margin:0}
::-webkit-scrollbar{width:9px;height:9px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border-2);border-radius:9px;border:2px solid transparent;background-clip:content-box}
::-webkit-scrollbar-thumb:hover{background:var(--text-3);background-clip:content-box}

/* ---------- 图标 ---------- */
.ic{width:18px;height:18px;flex:none;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ic-sm{width:15px;height:15px}
.ic-lg{width:22px;height:22px}
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* ---------- 基础组件 ---------- */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--shadow-xs)}
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:7px;height:38px;padding:0 14px;
  border-radius:var(--r-md);border:1px solid transparent;font-size:13.5px;font-weight:500;
  cursor:pointer;white-space:nowrap;user-select:none;background:transparent;
  transition:background-color .16s ease,border-color .16s ease,color .16s ease,transform .12s ease,box-shadow .16s ease;
}
.btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.btn:active:not(:disabled){transform:scale(.975)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn-primary{background:var(--accent);color:#fff;box-shadow:0 1px 2px rgba(79,70,229,.28)}
.btn-primary:hover:not(:disabled){background:var(--accent-hover)}
.btn-outline{background:var(--surface);border-color:var(--border-2);color:var(--text)}
.btn-outline:hover:not(:disabled){background:var(--surface-2);border-color:var(--text-3)}
.btn-ghost{color:var(--text-2)}
.btn-ghost:hover:not(:disabled){background:var(--surface-3);color:var(--text)}
.btn-danger{background:var(--danger);color:#fff}
.btn-danger:hover:not(:disabled){filter:brightness(1.07)}
.btn-sm{height:31px;padding:0 10px;font-size:12.5px;border-radius:var(--r-sm);gap:5px}
.btn-icon{width:38px;padding:0}
.btn-icon.btn-sm{width:31px}
.btn-block{width:100%}
.danger{color:var(--danger)!important}
.muted{color:var(--text-2)}
.ta-r{text-align:right}
.input{
  width:100%;height:42px;padding:0 12px;border-radius:var(--r-md);
  border:1px solid var(--border-2);background:var(--surface);color:var(--text);
  font-size:14px;outline:none;transition:border-color .16s ease,box-shadow .16s ease;
}
.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.input::placeholder{color:var(--text-3)}
.input.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;height:34px}
select.input{cursor:pointer;appearance:none;padding-right:30px;
  background-image:linear-gradient(45deg,transparent 50%,var(--text-3) 50%),linear-gradient(135deg,var(--text-3) 50%,transparent 50%);
  background-position:calc(100% - 16px) 18px,calc(100% - 11px) 18px;background-size:5px 5px,5px 5px;background-repeat:no-repeat}
.field{display:flex;flex-direction:column;gap:6px}
.field>span{font-size:12.5px;font-weight:500;color:var(--text-2)}
.chip{display:inline-flex;align-items:center;gap:5px;height:23px;padding:0 9px;border-radius:999px;
  font-size:11.5px;font-weight:500;background:var(--surface-3);color:var(--text-2)}
.chip-accent{background:var(--accent-soft);color:var(--accent-text)}
.chip-danger{background:var(--danger-soft);color:var(--danger)}
.seg{display:inline-flex;background:var(--surface-3);border-radius:var(--r-sm);padding:3px;gap:2px}
.seg button{border:0;background:transparent;color:var(--text-2);width:32px;height:25px;border-radius:6px;
  cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:.15s}
.seg button.on{background:var(--surface);color:var(--accent);box-shadow:var(--shadow-xs)}
.bar{height:7px;border-radius:999px;background:var(--surface-3);overflow:hidden}
.bar>i{display:block;height:100%;border-radius:999px;background:var(--accent);transition:width .3s ease}
.bar.sm{height:5px}
.bar>i.err{background:var(--danger)}
.checkbox{width:19px;height:19px;border-radius:6px;border:1.5px solid var(--border-2);background:var(--surface);
  display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:transparent;transition:.15s;padding:0}
.checkbox.on{background:var(--accent);border-color:var(--accent);color:#fff}
.kv{display:grid;gap:0}
.kv>div{display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid var(--border)}
.kv>div:last-child{border-bottom:0}
.kv dt{color:var(--text-2);font-size:13px}
.kv dd{font-weight:500}
.kv.compact>div{padding:8px 0}

/* ---------- 骨架屏 ---------- */
.skel{background:linear-gradient(90deg,var(--surface-3) 25%,var(--surface-2) 37%,var(--surface-3) 63%);
  background-size:400% 100%;animation:shimmer 1.4s ease infinite;border-radius:var(--r-md)}
@keyframes shimmer{0%{background-position:100% 0}100%{background-position:0 0}}
.skel-card{aspect-ratio:1;border-radius:var(--r-lg);overflow:hidden}
.skel-card>.skel{width:100%;height:100%}

/* ---------- 启动 / 认证 ---------- */
.boot{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:var(--accent)}
.auth{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;overflow:hidden;background:var(--bg)}
.auth-glow{position:absolute;width:520px;height:520px;border-radius:50%;filter:blur(110px);opacity:.5;pointer-events:none}
.auth-glow.a{top:-180px;left:-140px;background:rgba(99,102,241,.35)}
.auth-glow.b{bottom:-200px;right:-160px;background:rgba(56,189,248,.28)}
html.dark .auth-glow{opacity:.35}
.auth-card{position:relative;width:100%;max-width:400px;padding:32px;border-radius:var(--r-xl);box-shadow:var(--shadow-lg);
  animation:pop .35s cubic-bezier(.16,1,.3,1)}
@keyframes pop{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
.auth-brand{text-align:center;margin-bottom:26px}
.brand-mark{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(140deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 4px 12px rgba(79,70,229,.32);flex:none}
.brand-mark.lg{width:56px;height:56px;border-radius:17px;margin:0 auto 16px}
.auth-brand h1{font-size:21px;font-weight:600;letter-spacing:-.01em}
.auth-brand p{color:var(--text-2);font-size:13px;margin-top:5px}
.auth-form{display:flex;flex-direction:column;gap:15px}
.with-icon{position:relative}
.with-icon>.ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-3);pointer-events:none}
.with-icon>.input{padding-left:38px}
.with-icon>.eye{position:absolute;right:6px;top:50%;transform:translateY(-50%)}
.auth-foot{text-align:center;color:var(--text-3);font-size:12px;margin-top:18px}

/* ---------- 主框架 ---------- */
.shell{display:flex;height:100vh;overflow:hidden}
.sidebar{width:244px;flex:none;display:flex;flex-direction:column;background:var(--surface);
  border-right:1px solid var(--border);transition:transform .28s cubic-bezier(.4,0,.2,1)}
.brand{display:flex;align-items:center;gap:11px;padding:18px 18px 16px}
.brand-text{display:flex;flex-direction:column;line-height:1.25;min-width:0}
.brand-text strong{font-size:14.5px;font-weight:600;letter-spacing:-.01em}
.brand-text span{font-size:11.5px;color:var(--text-3)}
.nav{flex:1;padding:6px 12px;display:flex;flex-direction:column;gap:3px;overflow-y:auto}
.nav-item{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:var(--r-md);border:0;
  background:transparent;color:var(--text-2);font-size:13.5px;font-weight:500;cursor:pointer;text-align:left;
  transition:background-color .16s ease,color .16s ease;position:relative}
.nav-item:hover{background:var(--surface-3);color:var(--text)}
.nav-item.on{background:var(--accent-soft);color:var(--accent-text)}
.nav-item.on::before{content:"";position:absolute;left:-12px;top:50%;transform:translateY(-50%);
  width:3px;height:18px;border-radius:0 3px 3px 0;background:var(--accent)}
.nav-badge{margin-left:auto;font-style:normal;font-size:11px;padding:1px 7px;border-radius:999px;
  background:var(--surface-3);color:var(--text-2)}
.nav-item.on .nav-badge{background:var(--surface);color:var(--accent-text)}
.nav-foot{display:flex;align-items:center;gap:8px;padding:12px;border-top:1px solid var(--border)}
.user{display:flex;align-items:center;gap:10px;flex:1;min-width:0}
.avatar{width:34px;height:34px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;
  background:var(--accent-soft);color:var(--accent-text);font-weight:600;font-size:14px}
.user-text{display:flex;flex-direction:column;line-height:1.3;min-width:0}
.user-text strong{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.user-text span{font-size:11px;color:var(--text-3)}
.main{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--bg)}
.topbar{height:64px;flex:none;display:flex;align-items:center;gap:12px;padding:0 22px;
  background:var(--surface);border-bottom:1px solid var(--border)}
.topbar-title{min-width:0;flex:1}
.topbar-title h1{font-size:16px;font-weight:600;letter-spacing:-.01em}
.topbar-title p{font-size:12px;color:var(--text-3);margin-top:1px}
.topbar-actions{display:flex;align-items:center;gap:8px}
.only-mobile{display:none}
.content{flex:1;overflow-y:auto;padding:22px;scroll-behavior:smooth}
.page{display:flex;flex-direction:column;gap:16px;max-width:1400px;margin:0 auto;animation:fade .3s ease}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.scrim{position:fixed;inset:0;background:rgba(10,14,26,.5);z-index:55;backdrop-filter:blur(2px)}

/* ---------- 仪表盘 ---------- */
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.stat{display:flex;align-items:center;gap:15px;padding:18px}
.stat-icon{width:44px;height:44px;border-radius:13px;flex:none;display:flex;align-items:center;justify-content:center}
.tone-indigo{background:var(--accent-soft);color:var(--accent-text)}
.tone-teal{background:var(--success-soft);color:var(--success)}
.tone-amber{background:var(--warning-soft);color:var(--warning)}
.stat-label{font-size:12px;color:var(--text-2);font-weight:500}
.stat-value{font-size:23px;font-weight:600;letter-spacing:-.02em;line-height:1.25}
.stat-value.sm{font-size:18px}
.stat-hint{font-size:11.5px;color:var(--text-3);margin-top:1px}
.quota{padding:18px}
.quota-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}
.quota .stat-hint{margin-top:10px}
.dropzone{border:2px dashed var(--border-2);border-radius:var(--r-lg);background:var(--surface);
  padding:38px 20px;text-align:center;cursor:pointer;transition:.2s}
.dropzone:hover{border-color:var(--accent);background:var(--accent-soft)}
.dz-icon{width:56px;height:56px;border-radius:17px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;
  background:var(--surface-3);color:var(--text-2);transition:.2s}
.dropzone:hover .dz-icon{background:var(--surface);color:var(--accent)}
.dz-title{font-size:14.5px;font-weight:500}
.dz-hint{font-size:12.5px;color:var(--text-3);margin-top:6px}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 18px;border-bottom:1px solid var(--border)}
.card-head h3{font-size:14.5px;font-weight:600}
.card-head p{font-size:12px;color:var(--text-3);margin-top:2px}
.recent-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:10px;padding:16px 18px}
.recent-item{padding:0;border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;
  aspect-ratio:1;cursor:pointer;background:var(--surface-3);transition:.18s}
.recent-item:hover{transform:translateY(-2px);box-shadow:var(--shadow-md);border-color:var(--border-2)}
.recent-item img{width:100%;height:100%;object-fit:cover;display:block}

/* ---------- 图库 ---------- */
.toolbar{display:flex;align-items:center;gap:10px;padding:11px;flex-wrap:wrap}
.search{position:relative;flex:1;min-width:190px;max-width:340px}
.search>.ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-3);pointer-events:none}
.search-input{padding-left:37px;padding-right:38px;height:38px}
.search>.btn{position:absolute;right:5px;top:50%;transform:translateY(-50%)}
.toolbar-right{display:flex;align-items:center;gap:8px;margin-left:auto;flex-wrap:wrap}
.toolbar-right select.input{height:38px;width:auto;font-size:13px}
.selectbar{display:flex;align-items:center;gap:12px;padding:10px 14px;flex-wrap:wrap}
.selectbar-left{display:flex;align-items:center;gap:8px;font-size:13px}
.selectbar-right{display:flex;align-items:center;gap:8px;margin-left:auto}
.grid-view{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:14px}
.tile{position:relative;border-radius:var(--r-lg);overflow:hidden;background:var(--surface);
  border:1px solid var(--border);box-shadow:var(--shadow-xs);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
.tile:hover{transform:translateY(-3px);box-shadow:var(--shadow-md);border-color:var(--border-2)}
.tile.sel{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)}
.tile-hit{display:block;width:100%;padding:0;border:0;background:var(--surface-3);cursor:pointer;aspect-ratio:1}
.tile-hit img{width:100%;height:100%;object-fit:cover;display:block}
.tile-ov{position:absolute;inset:auto 0 0 0;padding:22px 10px 9px;display:flex;align-items:flex-end;gap:8px;
  background:linear-gradient(to top,rgba(6,9,18,.82),rgba(6,9,18,0));opacity:0;transition:opacity .18s ease;pointer-events:none}
.tile:hover .tile-ov{opacity:1}
.tile-name{color:#fff;font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.tile-size{color:rgba(255,255,255,.72);font-size:11px;flex:none}
.tile-check{position:absolute;top:9px;right:9px;width:23px;height:23px;border-radius:8px;display:flex;
  align-items:center;justify-content:center;background:var(--accent);color:#fff;box-shadow:var(--shadow-sm)}
.tile-acts{position:absolute;top:9px;right:9px;display:flex;gap:5px;opacity:0;transform:translateY(-4px);transition:.18s}
.tile:hover .tile-acts{opacity:1;transform:none}
.tile-acts button{width:29px;height:29px;border-radius:9px;border:0;display:flex;align-items:center;justify-content:center;
  background:rgba(255,255,255,.94);color:#1e293b;cursor:pointer;box-shadow:var(--shadow-sm);transition:.15s}
.tile-acts button:hover{background:#fff;transform:scale(1.06)}
.tile-acts button.danger:hover{background:var(--danger);color:#fff}
.table-wrap{overflow-x:auto}
.table{width:100%;min-width:560px;border-collapse:collapse;font-size:13px}
.table thead th{text-align:left;font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase;
  letter-spacing:.04em;padding:11px 14px;background:var(--surface-2);border-bottom:1px solid var(--border);white-space:nowrap}
.table tbody td{padding:9px 14px;border-bottom:1px solid var(--border);vertical-align:middle}
.table tbody tr:last-child td{border-bottom:0}
.table tbody tr{transition:background-color .14s}
.table tbody tr:hover{background:var(--surface-2)}
.table tbody tr.sel{background:var(--accent-soft)}
.th-check{width:44px}
.thumb{width:40px;height:40px;border-radius:9px;object-fit:cover;cursor:pointer;border:1px solid var(--border);display:block}
.td-name{max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;font-weight:500}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:72px 20px;
  text-align:center;color:var(--text-3)}
.empty-ic{width:64px;height:64px;border-radius:20px;display:flex;align-items:center;justify-content:center;
  background:var(--surface-3);color:var(--text-3);margin-bottom:4px}
.empty h3{font-size:15px;font-weight:600;color:var(--text)}
.empty p{font-size:13px;max-width:340px}
.notice{display:flex;align-items:center;gap:10px;padding:13px 16px;font-size:13px}
.notice-danger{color:var(--danger);background:var(--danger-soft);border-color:transparent}

/* ---------- 设置 ---------- */
.theme-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:18px}
.theme-opt{display:flex;flex-direction:column;align-items:center;gap:9px;padding:18px 12px;border-radius:var(--r-md);
  border:1px solid var(--border-2);background:var(--surface);color:var(--text-2);cursor:pointer;font-size:13px;
  font-weight:500;transition:.18s}
.theme-opt:hover{background:var(--surface-2);border-color:var(--text-3)}
.theme-opt.on{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-text);box-shadow:0 0 0 1px var(--accent) inset}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;padding:18px}
.form-foot{grid-column:1/-1;display:flex;justify-content:flex-end}

/* ---------- 遮罩 / 弹窗 ---------- */
.overlay{position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;padding:22px;
  background:rgba(8,11,20,.62);backdrop-filter:blur(5px);animation:fade .18s ease}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);box-shadow:var(--shadow-lg);
  overflow:hidden;animation:pop .26s cubic-bezier(.16,1,.3,1);display:flex;flex-direction:column}
.modal.detail{flex-direction:row;width:100%;max-width:1180px;height:min(88vh,820px)}
.detail-stage{flex:1;min-width:0;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
.checker{background-color:var(--surface-2);
  background-image:linear-gradient(45deg,var(--surface-3) 25%,transparent 25%),linear-gradient(-45deg,var(--surface-3) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--surface-3) 75%),linear-gradient(-45deg,transparent 75%,var(--surface-3) 75%);
  background-size:18px 18px;background-position:0 0,0 9px,9px -9px,-9px 0}
.detail-stage>img{max-width:100%;max-height:100%;object-fit:contain;transition:transform .22s ease;user-select:none}
.detail-tools{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:4px;
  padding:6px;border-radius:999px;background:rgba(15,20,34,.78);backdrop-filter:blur(8px);color:#fff;
  opacity:0;transition:opacity .2s ease}
.detail-stage:hover .detail-tools{opacity:1}
.detail-tools button,.detail-tools a{width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:#fff;
  display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s}
.detail-tools button:hover,.detail-tools a:hover{background:rgba(255,255,255,.18)}
.detail-tools .zoom{font-size:11.5px;padding:0 6px;min-width:44px;text-align:center;color:rgba(255,255,255,.85)}
.detail-nav{position:absolute;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:0;
  background:rgba(15,20,34,.6);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;
  opacity:0;transition:.18s}
.detail-stage:hover .detail-nav{opacity:1}
.detail-nav:hover{background:rgba(15,20,34,.85)}
.detail-nav.prev{left:14px}
.detail-nav.next{right:14px}
.detail-side{width:340px;flex:none;display:flex;flex-direction:column;border-left:1px solid var(--border);background:var(--surface)}
.detail-head{display:flex;align-items:center;gap:10px;padding:15px 16px;border-bottom:1px solid var(--border)}
.detail-head h3{font-size:13.5px;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  display:flex;align-items:center;gap:7px}
.detail-side>.kv{padding:4px 16px 10px}
.detail-links{flex:1;overflow-y:auto;padding:4px 16px 16px;display:flex;flex-direction:column;gap:12px}
.link-label{display:block;font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase;
  letter-spacing:.04em;margin-bottom:5px}
.link-box{display:flex;gap:6px}
.link-box>.input{flex:1;min-width:0}
.detail-foot{padding:14px 16px;border-top:1px solid var(--border)}
.modal.confirm{width:100%;max-width:380px;padding:26px;align-items:center;text-align:center}
.confirm-icon{width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;
  background:var(--accent-soft);color:var(--accent-text);margin-bottom:14px}
.confirm-icon.danger{background:var(--danger-soft);color:var(--danger)}
.modal.confirm h3{font-size:16px;font-weight:600;margin-bottom:7px}
.modal.confirm p{color:var(--text-2);font-size:13px;line-height:1.6;margin-bottom:20px}
.confirm-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%}
.modal.result{width:100%;max-width:560px;max-height:82vh}
.result-list{overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:12px}
.result-item{display:flex;gap:12px;padding:11px;border-radius:var(--r-md);background:var(--surface-2);border:1px solid var(--border)}
.result-item>img{width:52px;height:52px;border-radius:9px;object-fit:cover;flex:none;border:1px solid var(--border)}
.result-body{min-width:0;flex:1}
.result-name{font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.result-url{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--text-3);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:2px 0 8px}
.result-acts{display:flex;gap:6px;flex-wrap:wrap}

/* ---------- 上传面板 ---------- */
.upload-panel{position:fixed;right:22px;bottom:22px;z-index:110;width:340px;max-height:62vh;display:flex;
  flex-direction:column;box-shadow:var(--shadow-lg);animation:slidein .3s cubic-bezier(.16,1,.3,1)}
@keyframes slidein{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.upload-head{display:flex;align-items:center;gap:10px;padding:13px 15px;border-bottom:1px solid var(--border)}
.upload-head>div{flex:1;display:flex;align-items:baseline;gap:8px}
.upload-head strong{font-size:13.5px;font-weight:600}
.upload-head span{font-size:11.5px;color:var(--text-3)}
.upload-list{overflow-y:auto;padding:12px 15px;display:flex;flex-direction:column;gap:11px}
.upload-row-top{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.upload-name{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.upload-state{flex:none;color:var(--text-3);display:flex}
.upload-state.done{color:var(--success)}
.upload-state.error{color:var(--danger)}
.upload-err{font-size:11px;color:var(--danger);margin-top:4px}
.upload-foot{padding:11px 15px;border-top:1px solid var(--border);display:flex;justify-content:flex-end}

/* ---------- 右键菜单 / 提示 / 拖拽 ---------- */
.ctxmenu{position:fixed;z-index:200;width:196px;padding:5px;box-shadow:var(--shadow-lg);animation:pop .13s ease}
.ctxmenu button{display:flex;align-items:center;gap:9px;width:100%;padding:8px 10px;border:0;border-radius:var(--r-sm);
  background:transparent;color:var(--text);font-size:13px;cursor:pointer;text-align:left;transition:background-color .13s}
.ctxmenu button:hover{background:var(--surface-3)}
.ctxmenu button.danger:hover{background:var(--danger-soft)}
.ctxmenu .ic{color:var(--text-3)}
.ctx-sep{height:1px;background:var(--border);margin:5px 6px}
.toasts{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:300;display:flex;
  flex-direction:column;gap:8px;align-items:center;pointer-events:none}
.toast{display:flex;align-items:center;gap:9px;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:500;
  background:var(--text);color:var(--surface);box-shadow:var(--shadow-lg);max-width:78vw}
.toast.error{background:var(--danger);color:#fff}
.toast-enter-active,.toast-leave-active{transition:all .26s cubic-bezier(.16,1,.3,1)}
.toast-enter-from,.toast-leave-to{opacity:0;transform:translateY(-12px) scale(.96)}
.drop-overlay{position:fixed;inset:0;z-index:400;display:flex;align-items:center;justify-content:center;
  background:rgba(79,70,229,.16);backdrop-filter:blur(3px)}
.drop-card{display:flex;flex-direction:column;align-items:center;gap:12px;padding:40px 60px;border-radius:var(--r-xl);
  border:2px dashed var(--accent);background:var(--surface);color:var(--accent);box-shadow:var(--shadow-lg)}
.drop-card p{font-size:15px;font-weight:600}
.fade-enter-active,.fade-leave-active{transition:opacity .2s ease}
.fade-enter-from,.fade-leave-to{opacity:0}

/* ---------- 响应式 ---------- */
@media (max-width:1100px){.recent-grid{grid-template-columns:repeat(6,1fr)}}
@media (max-width:900px){
  .only-mobile{display:inline-flex}
  .sidebar{position:fixed;top:0;bottom:0;left:0;z-index:60;transform:translateX(-100%);box-shadow:var(--shadow-lg)}
  .sidebar.open{transform:translateX(0)}
  .content{padding:16px}
  .topbar{padding:0 14px;height:58px}
  .topbar-title p{display:none}
  .grid-view{grid-template-columns:repeat(auto-fill,minmax(124px,1fr));gap:10px}
  .stats{grid-template-columns:1fr 1fr}
  .stat{padding:14px}
  .stat-value{font-size:20px}
  .recent-grid{grid-template-columns:repeat(4,1fr)}
  .modal.detail{flex-direction:column;height:92vh}
  .detail-side{width:100%;max-height:46vh;border-left:0;border-top:1px solid var(--border)}
  .form-grid{grid-template-columns:1fr}
  .theme-grid{grid-template-columns:1fr}
  .upload-panel{right:10px;left:10px;bottom:10px;width:auto}
  .toolbar-right{margin-left:0;width:100%}
  .search{max-width:none}
}
@media (max-width:700px){
  .table{min-width:0}
  .col-size,.col-date{display:none}
  .table thead th,.table tbody td{padding:9px 10px}
  .td-name{max-width:150px}
  .detail-side{max-height:52vh}
}
@media (max-width:520px){
  .stats{grid-template-columns:1fr}
  .topbar-actions .btn-primary span{display:none}
  .topbar-actions .btn-primary{width:38px;padding:0}
}
</style>
</head>
<body>

<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
<defs>
<symbol id="i-upload" viewBox="0 0 24 24"><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></symbol>
<symbol id="i-image" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.6" cy="9.6" r="1.5"/><path d="M4 17.5l4.6-4.6 3.2 3.2 3.2-3.2L20 16"/></symbol>
<symbol id="i-images" viewBox="0 0 24 24"><rect x="3" y="7" width="14" height="14" rx="2.5"/><path d="M7.5 7V5.5A2.5 2.5 0 0110 3h9a2.5 2.5 0 012.5 2.5v9A2.5 2.5 0 0119 17h-2"/></symbol>
<symbol id="i-dashboard" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="9.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="2"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2"/><rect x="3" y="15.5" width="7.5" height="5.5" rx="2"/></symbol>
<symbol id="i-sliders" viewBox="0 0 24 24"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></symbol>
<symbol id="i-logout" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></symbol>
<symbol id="i-refresh" viewBox="0 0 24 24"><path d="M21 3v6h-6"/><path d="M3 21v-6h6"/><path d="M4.2 9a8.5 8.5 0 0114.2-3.6L21 9"/><path d="M19.8 15a8.5 8.5 0 01-14.2 3.6L3 15"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16.5 16.5"/></symbol>
<symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></symbol>
<symbol id="i-list" viewBox="0 0 24 24"><path d="M8.5 6H21"/><path d="M8.5 12H21"/><path d="M8.5 18H21"/><path d="M3.5 6h.01"/><path d="M3.5 12h.01"/><path d="M3.5 18h.01"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6.5L9.2 17.5 4 12.3"/></symbol>
<symbol id="i-check-square" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8 12.3l2.8 2.8L16 9.5"/></symbol>
<symbol id="i-trash" viewBox="0 0 24 24"><path d="M3.5 6.5h17"/><path d="M9 6.5V5a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 5v1.5"/><path d="M18.5 6.5l-.9 13a2 2 0 01-2 1.9H8.4a2 2 0 01-2-1.9l-.9-13"/><path d="M10 11v6"/><path d="M14 11v6"/></symbol>
<symbol id="i-link" viewBox="0 0 24 24"><path d="M10.2 13.3a4.6 4.6 0 007 .5l2.8-2.8a4.6 4.6 0 00-6.5-6.5L12 5.9"/><path d="M13.8 10.7a4.6 4.6 0 00-7-.5L4 13a4.6 4.6 0 006.5 6.5l1.4-1.4"/></symbol>
<symbol id="i-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5.5 15H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v.5"/></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="i-eye-off" viewBox="0 0 24 24"><path d="M17.9 17.9A10.3 10.3 0 0112 19.5c-6.2 0-10-7.5-10-7.5a18.6 18.6 0 015.2-6"/><path d="M9.9 4.7A9.6 9.6 0 0112 4.5c6.2 0 10 7.5 10 7.5a18.7 18.7 0 01-2.2 3.3"/><path d="M14.1 14.1a3 3 0 01-4.2-4.2"/><path d="M2 2l20 20"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M18.5 5.5l-13 13"/><path d="M5.5 5.5l13 13"/></symbol>
<symbol id="i-chevron-left" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></symbol>
<symbol id="i-chevron-right" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></symbol>
<symbol id="i-rotate-left" viewBox="0 0 24 24"><path d="M2.5 4.5v5.5h5.5"/><path d="M4.6 15a8.5 8.5 0 102-9.1L2.5 10"/></symbol>
<symbol id="i-rotate-right" viewBox="0 0 24 24"><path d="M21.5 4.5v5.5H16"/><path d="M19.4 15a8.5 8.5 0 11-2-9.1L21.5 10"/></symbol>
<symbol id="i-external" viewBox="0 0 24 24"><path d="M18 13.5V19a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h5.5"/><path d="M14.5 3H21v6.5"/><path d="M10 14L21 3"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.9 4.9l1.4 1.4"/><path d="M17.7 17.7l1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.9 19.1l1.4-1.4"/><path d="M17.7 6.3l1.4-1.4"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><path d="M21 12.9A9 9 0 1111.1 3a7 7 0 009.9 9.9z"/></symbol>
<symbol id="i-monitor" viewBox="0 0 24 24"><rect x="2.5" y="3.5" width="19" height="13.5" rx="2.5"/><path d="M8.5 21h7"/><path d="M12 17v4"/></symbol>
<symbol id="i-alert" viewBox="0 0 24 24"><path d="M10.3 3.9L1.9 18a2 2 0 001.7 3h16.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9.5v4"/><path d="M12 17.2h.01"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><rect x="3.5" y="10.5" width="17" height="11" rx="2.5"/><path d="M7.5 10.5V7a4.5 4.5 0 019 0v3.5"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7.5" r="4"/></symbol>
<symbol id="i-key" viewBox="0 0 24 24"><circle cx="8" cy="16" r="4"/><path d="M10.9 13.1L21 3"/><path d="M17.5 3H21v3.5"/></symbol>
<symbol id="i-loader" viewBox="0 0 24 24"><path d="M21 12a9 9 0 11-6.2-8.6"/></symbol>
<symbol id="i-zoom-in" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16.5 16.5"/><path d="M11 8.5v5"/><path d="M8.5 11h5"/></symbol>
<symbol id="i-zoom-out" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16.5 16.5"/><path d="M8.5 11h5"/></symbol>
<symbol id="i-code" viewBox="0 0 24 24"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></symbol>
<symbol id="i-hash" viewBox="0 0 24 24"><path d="M4.5 9h15"/><path d="M4.5 15h15"/><path d="M10 3.5L8 20.5"/><path d="M16 3.5l-2 17"/></symbol>
<symbol id="i-folder" viewBox="0 0 24 24"><path d="M3 7.5A2.5 2.5 0 015.5 5h3.2l2 2.5h7.8A2.5 2.5 0 0121 10v7.5A2.5 2.5 0 0118.5 20h-13A2.5 2.5 0 013 17.5z"/></symbol>
</defs>
</svg>

<div id="app" v-cloak>

  <div v-if="view==='boot'" class="boot">
    <svg class="ic ic-lg spin"><use href="#i-loader"/></svg>
  </div>

  <div v-if="view==='login' || view==='setup'" class="auth">
    <div class="auth-glow a"></div>
    <div class="auth-glow b"></div>
    <div class="auth-card card">
      <div class="auth-brand">
        <div class="brand-mark lg"><svg class="ic ic-lg"><use href="#i-image"/></svg></div>
        <h1>{{ view==='setup' ? '初始化图床' : '欢迎回来' }}</h1>
        <p>{{ view==='setup' ? '创建管理员账号，开始使用' : 'Cloudflare Workers 图床控制台' }}</p>
      </div>
      <form class="auth-form" @submit.prevent="submitAuth">
        <label class="field">
          <span>用户名</span>
          <div class="with-icon">
            <svg class="ic"><use href="#i-user"/></svg>
            <input class="input" v-model="form.username" placeholder="请输入用户名" autocomplete="username">
          </div>
        </label>
        <label class="field">
          <span>密码</span>
          <div class="with-icon">
            <svg class="ic"><use href="#i-lock"/></svg>
            <input class="input" :type="showPwd ? 'text' : 'password'" v-model="form.password" :placeholder="view==='setup' ? '至少 6 位' : '请输入密码'" autocomplete="current-password" @keyup.enter="submitAuth">
            <button type="button" class="btn btn-ghost btn-icon btn-sm eye" :title="showPwd ? '隐藏密码' : '显示密码'" @click="showPwd = !showPwd">
              <svg class="ic ic-sm"><use :href="showPwd ? '#i-eye-off' : '#i-eye'"/></svg>
            </button>
          </div>
        </label>
        <button class="btn btn-primary btn-block" type="submit" :disabled="authBusy">
          <svg v-if="authBusy" class="ic ic-sm spin"><use href="#i-loader"/></svg>
          <span>{{ view==='setup' ? '创建并进入' : '登录' }}</span>
        </button>
      </form>
      <p class="auth-foot">{{ view==='setup' ? '账号以加盐哈希形式保存在 R2 中' : '会话有效期 30 天，可在设置页修改密码' }}</p>
    </div>
  </div>

  <div v-if="view==='app'" class="shell">
    <aside class="sidebar" :class="{ open: navOpen }">
      <div class="brand">
        <div class="brand-mark"><svg class="ic"><use href="#i-image"/></svg></div>
        <div class="brand-text"><strong>图床控制台</strong><span>Cloudflare R2</span></div>
      </div>
      <nav class="nav">
        <button class="nav-item" :class="{ on: tab==='dashboard' }" @click="go('dashboard')">
          <svg class="ic"><use href="#i-dashboard"/></svg><span>仪表盘</span>
        </button>
        <button class="nav-item" :class="{ on: tab==='gallery' }" @click="go('gallery')">
          <svg class="ic"><use href="#i-images"/></svg><span>图片管理</span>
          <em class="nav-badge">{{ images.length }}</em>
        </button>
        <button class="nav-item" :class="{ on: tab==='settings' }" @click="go('settings')">
          <svg class="ic"><use href="#i-sliders"/></svg><span>系统设置</span>
        </button>
      </nav>
      <div class="nav-foot">
        <div class="user">
          <div class="avatar">{{ initial }}</div>
          <div class="user-text"><strong>{{ username || '管理员' }}</strong><span>已登录</span></div>
        </div>
        <button class="btn btn-ghost btn-icon" title="退出登录" @click="doLogout">
          <svg class="ic"><use href="#i-logout"/></svg>
        </button>
      </div>
    </aside>

    <div v-if="navOpen" class="scrim" @click="navOpen = false"></div>

    <main class="main">
      <header class="topbar">
        <button class="btn btn-ghost btn-icon only-mobile" @click="navOpen = true" title="菜单">
          <svg class="ic"><use href="#i-menu"/></svg>
        </button>
        <div class="topbar-title">
          <h1>{{ tabTitle }}</h1>
          <p>{{ tabSubtitle }}</p>
        </div>
        <div class="topbar-actions">
          <button class="btn btn-ghost btn-icon" title="刷新列表" :disabled="loadingList" @click="loadAll">
            <svg class="ic" :class="{ spin: loadingList }"><use href="#i-refresh"/></svg>
          </button>
          <button class="btn btn-outline btn-icon" :title="'主题：' + themeLabel" @click="cycleTheme">
            <svg class="ic"><use :href="themeIcon"/></svg>
          </button>
          <button class="btn btn-primary" @click="pickFiles">
            <svg class="ic"><use href="#i-upload"/></svg><span>上传图片</span>
          </button>
        </div>
      </header>

      <div class="content">
        <section v-if="tab==='dashboard'" class="page">
          <div class="stats">
            <div class="card stat">
              <div class="stat-icon tone-indigo"><svg class="ic ic-lg"><use href="#i-images"/></svg></div>
              <div>
                <p class="stat-label">图片数量</p>
                <p class="stat-value">{{ images.length }}</p>
                <p class="stat-hint">张已上传</p>
              </div>
            </div>
            <div class="card stat">
              <div class="stat-icon tone-teal"><svg class="ic ic-lg"><use href="#i-folder"/></svg></div>
              <div>
                <p class="stat-label">占用空间</p>
                <p class="stat-value">{{ fmtSize(totalSize) }}</p>
                <p class="stat-hint">云端对象存储</p>
              </div>
            </div>
            <div class="card stat">
              <div class="stat-icon tone-amber"><svg class="ic ic-lg"><use href="#i-refresh"/></svg></div>
              <div>
                <p class="stat-label">近 24 小时</p>
                <p class="stat-value">{{ recentCount }}</p>
                <p class="stat-hint">张新增图片</p>
              </div>
            </div>
          </div>

          <div class="card quota">
            <div class="quota-head">
              <div>
                <p class="stat-label">存储用量</p>
                <p class="stat-value sm">{{ fmtSize(totalSize) }} <span class="muted" style="font-size:12.5px;font-weight:400">/ 10 GB 免费额度</span></p>
              </div>
              <span class="chip" :class="quotaPct > 80 ? 'chip-danger' : 'chip-accent'">{{ quotaPct.toFixed(2) }}%</span>
            </div>
            <div class="bar"><i :style="{ width: Math.max(1, quotaPct) + '%' }"></i></div>
            <p class="stat-hint">R2 每月免费额度为 10 GB 存储，超出部分按量计费。</p>
          </div>

          <div class="dropzone" @click="pickFiles">
            <div class="dz-icon"><svg class="ic ic-lg"><use href="#i-upload"/></svg></div>
            <p class="dz-title">点击选择、拖拽到页面，或按 Ctrl / Cmd + V 粘贴</p>
            <p class="dz-hint">支持 JPG · PNG · GIF · WebP · AVIF · BMP · SVG · ICO，单张最大 20 MB</p>
          </div>

          <div v-if="recent.length" class="card">
            <div class="card-head">
              <h3>最近上传</h3>
              <button class="btn btn-ghost btn-sm" @click="go('gallery')">
                <span>查看全部</span><svg class="ic ic-sm"><use href="#i-chevron-right"/></svg>
              </button>
            </div>
            <div class="recent-grid">
              <button v-for="img in recent" :key="img.key" class="recent-item" :title="displayName(img.key)" @click="openDetail(img)">
                <img :src="fileUrl(img.key)" :alt="displayName(img.key)" loading="lazy">
              </button>
            </div>
          </div>
        </section>

        <section v-if="tab==='gallery'" class="page">
          <div class="card toolbar">
            <div class="search">
              <svg class="ic"><use href="#i-search"/></svg>
              <input ref="searchInput" v-model="search" class="input search-input" placeholder="搜索文件名…（按 / 聚焦）">
              <button v-if="search" class="btn btn-ghost btn-icon btn-sm" title="清空" @click="search = ''">
                <svg class="ic ic-sm"><use href="#i-x"/></svg>
              </button>
            </div>
            <div class="toolbar-right">
              <select v-model="sortBy" class="input" title="排序方式">
                <option value="date_desc">最新上传</option>
                <option value="date_asc">最早上传</option>
                <option value="size_desc">体积从大到小</option>
                <option value="size_asc">体积从小到大</option>
                <option value="name_asc">按文件名</option>
              </select>
              <div class="seg">
                <button :class="{ on: viewMode==='grid' }" title="网格视图" @click="viewMode = 'grid'">
                  <svg class="ic ic-sm"><use href="#i-grid"/></svg>
                </button>
                <button :class="{ on: viewMode==='list' }" title="列表视图" @click="viewMode = 'list'">
                  <svg class="ic ic-sm"><use href="#i-list"/></svg>
                </button>
              </div>
              <button class="btn" :class="selectMode ? 'btn-primary' : 'btn-outline'" @click="toggleSelectMode">
                <svg class="ic ic-sm"><use href="#i-check-square"/></svg>
                <span>{{ selectMode ? '完成' : '批量管理' }}</span>
              </button>
            </div>
          </div>

          <div v-if="selectMode" class="card selectbar">
            <div class="selectbar-left">
              <button class="btn btn-ghost btn-sm" @click="toggleAll">{{ allSelected ? '取消全选' : '全选' }}</button>
              <button class="btn btn-ghost btn-sm" @click="invertSelect">反选</button>
              <span class="muted">已选 {{ selected.length }} 项 · {{ fmtSize(selectedSize) }}</span>
            </div>
            <div class="selectbar-right">
              <button class="btn btn-outline btn-sm" :disabled="!selected.length" @click="copySelected">
                <svg class="ic ic-sm"><use href="#i-link"/></svg><span>复制直链</span>
              </button>
              <button class="btn btn-danger btn-sm" :disabled="!selected.length" @click="removeKeys(selected.slice())">
                <svg class="ic ic-sm"><use href="#i-trash"/></svg><span>删除</span>
              </button>
            </div>
          </div>

          <div v-if="listError" class="card notice notice-danger">
            <svg class="ic"><use href="#i-alert"/></svg>
            <span>{{ listError }}</span>
            <button class="btn btn-ghost btn-sm" style="margin-left:auto" @click="loadAll">重试</button>
          </div>

          <div v-if="loadingList && !images.length" class="grid-view">
            <div v-for="n in 12" :key="n" class="skel-card"><div class="skel"></div></div>
          </div>

          <div v-else-if="!filtered.length" class="empty">
            <div class="empty-ic"><svg class="ic ic-lg"><use :href="search ? '#i-search' : '#i-image'"/></svg></div>
            <h3>{{ search ? '没有匹配的图片' : '还没有上传任何图片' }}</h3>
            <p>{{ search ? '换个关键词试试，或清空搜索条件。' : '点击下方按钮选择文件，也可以直接把图片拖到页面任意位置。' }}</p>
            <button v-if="search" class="btn btn-outline btn-sm" @click="search = ''">清空搜索</button>
            <button v-else class="btn btn-primary btn-sm" @click="pickFiles">
              <svg class="ic ic-sm"><use href="#i-upload"/></svg><span>上传第一张图片</span>
            </button>
          </div>

          <div v-else-if="viewMode==='grid'" class="grid-view">
            <div v-for="img in filtered" :key="img.key" class="tile" :class="{ sel: isSelected(img.key) }">
              <button class="tile-hit" @click="onTileClick(img)" @contextmenu.prevent="openCtx($event, img)">
                <img :src="fileUrl(img.key)" :alt="displayName(img.key)" loading="lazy">
              </button>
              <div class="tile-ov">
                <span class="tile-name" :title="displayName(img.key)">{{ displayName(img.key) }}</span>
                <span class="tile-size">{{ fmtSize(img.size) }}</span>
              </div>
              <div v-if="selectMode" class="tile-check"><svg class="ic ic-sm"><use href="#i-check"/></svg></div>
              <div v-else class="tile-acts">
                <button title="预览详情" @click.stop="openDetail(img)"><svg class="ic ic-sm"><use href="#i-eye"/></svg></button>
                <button title="复制直链" @click.stop="copy(fileUrl(img.key), '直链')"><svg class="ic ic-sm"><use href="#i-link"/></svg></button>
                <button class="danger" title="删除" @click.stop="removeKeys([img.key])"><svg class="ic ic-sm"><use href="#i-trash"/></svg></button>
              </div>
            </div>
          </div>

          <div v-else class="card table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th v-if="selectMode" class="th-check">
                    <button class="checkbox" :class="{ on: allSelected }" title="全选" @click="toggleAll">
                      <svg class="ic ic-sm"><use href="#i-check"/></svg>
                    </button>
                  </th>
                  <th>预览</th>
                  <th>文件名</th>
                  <th class="col-size">大小</th>
                  <th class="col-date">上传时间</th>
                  <th class="ta-r">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="img in filtered" :key="img.key" :class="{ sel: isSelected(img.key) }">
                  <td v-if="selectMode">
                    <button class="checkbox" :class="{ on: isSelected(img.key) }" @click="toggleOne(img.key)">
                      <svg class="ic ic-sm"><use href="#i-check"/></svg>
                    </button>
                  </td>
                  <td><img class="thumb" :src="fileUrl(img.key)" :alt="displayName(img.key)" loading="lazy" @click="openDetail(img)"></td>
                  <td class="td-name" :title="displayName(img.key)" @click="openDetail(img)">{{ displayName(img.key) }}</td>
                  <td class="muted col-size">{{ fmtSize(img.size) }}</td>
                  <td class="muted col-date">{{ fmtDate(img.uploaded) }}</td>
                  <td class="ta-r">
                    <button class="btn btn-ghost btn-icon btn-sm" title="复制直链" @click="copy(fileUrl(img.key), '直链')"><svg class="ic ic-sm"><use href="#i-link"/></svg></button>
                    <button class="btn btn-ghost btn-icon btn-sm" title="预览详情" @click="openDetail(img)"><svg class="ic ic-sm"><use href="#i-eye"/></svg></button>
                    <button class="btn btn-ghost btn-icon btn-sm danger" title="删除" @click="removeKeys([img.key])"><svg class="ic ic-sm"><use href="#i-trash"/></svg></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="tab==='settings'" class="page">
          <div class="card">
            <div class="card-head"><div><h3>外观主题</h3><p>偏好保存在本机浏览器</p></div></div>
            <div class="theme-grid">
              <button v-for="opt in themeOptions" :key="opt.value" class="theme-opt" :class="{ on: themeMode===opt.value }" @click="setTheme(opt.value)">
                <svg class="ic ic-lg"><use :href="opt.icon"/></svg><span>{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><div><h3>账号安全</h3><p>修改成功后，其它设备上的登录会被强制下线</p></div></div>
            <form class="form-grid" @submit.prevent="savePassword">
              <label class="field"><span>当前密码</span>
                <input class="input" type="password" autocomplete="current-password" v-model="pwdForm.currentPassword" placeholder="请输入当前密码">
              </label>
              <label class="field"><span>新用户名</span>
                <input class="input" type="text" v-model="pwdForm.username" :placeholder="username || '留空则保持不变'">
              </label>
              <label class="field"><span>新密码</span>
                <input class="input" type="password" autocomplete="new-password" v-model="pwdForm.password" placeholder="至少 6 位">
              </label>
              <label class="field"><span>确认新密码</span>
                <input class="input" type="password" autocomplete="new-password" v-model="pwdForm.confirm" placeholder="再次输入新密码">
              </label>
              <div class="form-foot">
                <button class="btn btn-primary" type="submit" :disabled="pwdBusy">
                  <svg v-if="pwdBusy" class="ic ic-sm spin"><use href="#i-loader"/></svg>
                  <svg v-else class="ic ic-sm"><use href="#i-key"/></svg>
                  <span>保存修改</span>
                </button>
              </div>
            </form>
          </div>

          <div class="card">
            <div class="card-head"><div><h3>存储信息</h3><p>数据保存在 Cloudflare R2 存储桶中</p></div></div>
            <dl class="kv" style="padding:0 18px 8px">
              <div><dt>对象数量</dt><dd>{{ images.length }} 个</dd></div>
              <div><dt>占用空间</dt><dd>{{ fmtSize(totalSize) }}</dd></div>
              <div><dt>免费额度</dt><dd>10 GB / 月</dd></div>
              <div><dt>运行环境</dt><dd>Cloudflare Workers + R2</dd></div>
            </dl>
          </div>
        </section>
      </div>
    </main>
  </div>

  <div v-if="upload.open" class="upload-panel card">
    <div class="upload-head">
      <div>
        <strong>{{ upload.running ? '正在上传' : '上传结束' }}</strong>
        <span>{{ uploadDone }} / {{ upload.items.length }}</span>
      </div>
      <button v-if="!upload.running" class="btn btn-ghost btn-icon btn-sm" title="关闭" @click="upload.open = false">
        <svg class="ic ic-sm"><use href="#i-x"/></svg>
      </button>
    </div>
    <div class="upload-list">
      <div v-for="(it, i) in upload.items" :key="i" class="upload-row">
        <div class="upload-row-top">
          <span class="upload-name" :title="it.name">{{ it.name }}</span>
          <span class="upload-state" :class="it.status">
            <svg v-if="it.status==='done'" class="ic ic-sm"><use href="#i-check"/></svg>
            <svg v-else-if="it.status==='error'" class="ic ic-sm"><use href="#i-alert"/></svg>
            <svg v-else class="ic ic-sm spin"><use href="#i-loader"/></svg>
          </span>
        </div>
        <div class="bar sm"><i :class="{ err: it.status==='error' }" :style="{ width: (it.status==='error' ? 100 : it.percent) + '%' }"></i></div>
        <p v-if="it.error" class="upload-err">{{ it.error }}</p>
      </div>
    </div>
    <div class="upload-foot">
      <button v-if="upload.running" class="btn btn-outline btn-sm" @click="upload.cancel = true">取消剩余</button>
      <button v-else class="btn btn-primary btn-sm" @click="upload.open = false">完成</button>
    </div>
  </div>

  <div v-if="result.open" class="overlay" @click.self="result.open = false">
    <div class="modal result">
      <div class="detail-head">
        <h3><svg class="ic" style="color:var(--success)"><use href="#i-check"/></svg><span>成功上传 {{ result.items.length }} 张图片</span></h3>
        <button class="btn btn-ghost btn-icon btn-sm" title="关闭" @click="result.open = false"><svg class="ic"><use href="#i-x"/></svg></button>
      </div>
      <div class="result-list">
        <div v-for="it in result.items" :key="it.key" class="result-item">
          <img :src="it.url" :alt="displayName(it.key)" loading="lazy">
          <div class="result-body">
            <p class="result-name" :title="displayName(it.key)">{{ displayName(it.key) }}</p>
            <p class="result-url" :title="it.url">{{ it.url }}</p>
            <div class="result-acts">
              <button v-for="f in linkFormats(it.url)" :key="f.label" class="btn btn-outline btn-sm" @click="copy(f.value, f.label)">{{ f.label }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="detail.open && detailItem" class="overlay" @click.self="detail.open = false">
    <div class="modal detail">
      <div class="detail-stage checker">
        <img :src="detailUrl" :alt="displayName(detailItem.key)" :style="{ transform: 'scale(' + detail.zoom + ') rotate(' + detail.rotate + 'deg)' }">
        <div class="detail-tools">
          <button title="缩小" @click="detail.zoom = Math.max(0.25, detail.zoom - 0.25)"><svg class="ic"><use href="#i-zoom-out"/></svg></button>
          <span class="zoom">{{ Math.round(detail.zoom * 100) }}%</span>
          <button title="放大" @click="detail.zoom = Math.min(4, detail.zoom + 0.25)"><svg class="ic"><use href="#i-zoom-in"/></svg></button>
          <button title="左转 90°" @click="detail.rotate -= 90"><svg class="ic"><use href="#i-rotate-left"/></svg></button>
          <button title="右转 90°" @click="detail.rotate += 90"><svg class="ic"><use href="#i-rotate-right"/></svg></button>
          <a :href="detailUrl" target="_blank" rel="noopener noreferrer" title="在新窗口打开原图"><svg class="ic"><use href="#i-external"/></svg></a>
        </div>
        <button v-if="filtered.length > 1" class="detail-nav prev" title="上一张（←）" @click="stepDetail(-1)"><svg class="ic"><use href="#i-chevron-left"/></svg></button>
        <button v-if="filtered.length > 1" class="detail-nav next" title="下一张（→）" @click="stepDetail(1)"><svg class="ic"><use href="#i-chevron-right"/></svg></button>
      </div>
      <div class="detail-side">
        <div class="detail-head">
          <h3 :title="displayName(detailItem.key)"><span>{{ displayName(detailItem.key) }}</span></h3>
          <button class="btn btn-ghost btn-icon btn-sm" title="关闭" @click="detail.open = false"><svg class="ic"><use href="#i-x"/></svg></button>
        </div>
        <dl class="kv compact">
          <div><dt>大小</dt><dd>{{ fmtSize(detailItem.size) }}</dd></div>
          <div><dt>上传时间</dt><dd>{{ fmtDate(detailItem.uploaded) }}</dd></div>
          <div><dt>位置</dt><dd>{{ detailPos >= 0 ? (detailPos + 1) + ' / ' + filtered.length : '—' }}</dd></div>
        </dl>
        <div class="detail-links">
          <div v-for="f in linkFormats(detailUrl)" :key="f.label">
            <span class="link-label">{{ f.label }}</span>
            <div class="link-box">
              <input class="input mono" readonly :value="f.value" @focus="$event.target.select()">
              <button class="btn btn-outline btn-sm" title="复制" @click="copy(f.value, f.label)"><svg class="ic ic-sm"><use href="#i-copy"/></svg></button>
            </div>
          </div>
        </div>
        <div class="detail-foot">
          <button class="btn btn-danger btn-block" @click="removeKeys([detailItem.key])">
            <svg class="ic ic-sm"><use href="#i-trash"/></svg><span>删除这张图片</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-if="confirmBox.open" class="overlay" @click.self="closeConfirm(false)">
    <div class="modal confirm">
      <div class="confirm-icon" :class="{ danger: confirmBox.danger }">
        <svg class="ic ic-lg"><use href="#i-alert"/></svg>
      </div>
      <h3>{{ confirmBox.title }}</h3>
      <p>{{ confirmBox.message }}</p>
      <div class="confirm-acts">
        <button class="btn btn-outline" @click="closeConfirm(false)">取消</button>
        <button class="btn" :class="confirmBox.danger ? 'btn-danger' : 'btn-primary'" @click="closeConfirm(true)">{{ confirmBox.confirmText }}</button>
      </div>
    </div>
  </div>

  <div v-if="ctx.open" class="ctxmenu card" :style="{ left: ctx.x + 'px', top: ctx.y + 'px' }" @click.stop>
    <button @click="ctxAction('preview')"><svg class="ic ic-sm"><use href="#i-eye"/></svg><span>预览详情</span></button>
    <div class="ctx-sep"></div>
    <button @click="ctxAction('url')"><svg class="ic ic-sm"><use href="#i-link"/></svg><span>复制直链</span></button>
    <button @click="ctxAction('md')"><svg class="ic ic-sm"><use href="#i-hash"/></svg><span>复制 Markdown</span></button>
    <button @click="ctxAction('html')"><svg class="ic ic-sm"><use href="#i-code"/></svg><span>复制 HTML</span></button>
    <button @click="ctxAction('bb')"><svg class="ic ic-sm"><use href="#i-code"/></svg><span>复制 BBCode</span></button>
    <div class="ctx-sep"></div>
    <button class="danger" @click="ctxAction('delete')"><svg class="ic ic-sm"><use href="#i-trash"/></svg><span>删除图片</span></button>
  </div>

  <div class="toasts">
    <transition-group name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
        <svg class="ic ic-sm"><use :href="t.type==='error' ? '#i-alert' : '#i-check'"/></svg>
        <span>{{ t.message }}</span>
      </div>
    </transition-group>
  </div>

  <transition name="fade">
    <div v-if="dragging" class="drop-overlay">
      <div class="drop-card">
        <svg class="ic ic-lg"><use href="#i-upload"/></svg>
        <p>松开鼠标即可开始上传</p>
      </div>
    </div>
  </transition>

  <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" style="display:none" @change="onFilePick">
</div>

<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script>
(function () {
  var Vue3 = window.Vue;
  var createApp = Vue3.createApp;
  var ref = Vue3.ref;
  var reactive = Vue3.reactive;
  var computed = Vue3.computed;
  var watch = Vue3.watch;
  var nextTick = Vue3.nextTick;
  var onMounted = Vue3.onMounted;
  var onUnmounted = Vue3.onUnmounted;
  var markRaw = Vue3.markRaw;

  var MAX_SIZE = 20 * 1024 * 1024;
  var ACCEPT_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/bmp', 'image/x-icon', 'image/svg+xml'];
  var FREE_QUOTA = 10 * 1024 * 1024 * 1024;
  var UPLOAD_CONCURRENCY = 3;
  var PREF_KEY = 'ih_prefs';
  var TOKEN_KEY = 'ih_token';
  var ORIGIN = window.location.origin;

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function fmtSize(bytes) {
    var n = Number(bytes) || 0;
    if (n < 1024) return n + ' B';
    var units = ['KB', 'MB', 'GB', 'TB'];
    var value = n / 1024;
    var i = 0;
    while (value >= 1024 && i < units.length - 1) { value = value / 1024; i++; }
    var digits = value >= 100 ? 0 : (value >= 10 ? 1 : 2);
    return value.toFixed(digits) + ' ' + units[i];
  }

  function displayName(key) {
    var s = String(key || '');
    var i = s.indexOf('_');
    return i >= 0 ? s.slice(i + 1) : s;
  }

  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(PREF_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) { return {}; }
  }

  var toastSeq = 0;
  var toastTimers = new Map();
  var dragDepth = 0;

  createApp({
    setup: function () {
      var prefs = loadPrefs();

      var view = ref('boot');
      var username = ref('');
      var navOpen = ref(false);
      var tab = ref('dashboard');
      var images = ref([]);
      var loadingList = ref(false);
      var listError = ref('');
      var search = ref('');
      var sortBy = ref(prefs.sort || 'date_desc');
      var viewMode = ref(prefs.view || 'grid');
      var selectMode = ref(false);
      var selected = ref([]);
      var toasts = ref([]);
      var dragging = ref(false);
      var themeMode = ref(localStorage.getItem('ih_theme') || 'system');
      var showPwd = ref(false);
      var authBusy = ref(false);
      var pwdBusy = ref(false);
      var fileInput = ref(null);
      var searchInput = ref(null);

      var form = reactive({ username: '', password: '' });
      var pwdForm = reactive({ currentPassword: '', username: '', password: '', confirm: '' });
      var detail = reactive({ open: false, key: '', zoom: 1, rotate: 0 });
      var ctx = reactive({ open: false, x: 0, y: 0, item: null });
      var confirmBox = reactive({ open: false, title: '', message: '', confirmText: '确定', danger: true, resolve: null });
      var upload = reactive({ open: false, running: false, cancel: false, items: [] });
      var result = reactive({ open: false, items: [] });

      var themeOptions = [
        { value: 'light', label: '浅色', icon: '#i-sun' },
        { value: 'dark', label: '深色', icon: '#i-moon' },
        { value: 'system', label: '跟随系统', icon: '#i-monitor' }
      ];

      /* ---------------- 主题 ---------------- */

      function applyTheme() {
        var mode = themeMode.value;
        var dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', dark);
      }

      function setTheme(mode) {
        themeMode.value = mode;
        try { localStorage.setItem('ih_theme', mode); } catch (e) {}
        applyTheme();
      }

      function cycleTheme() {
        // 始终在明/暗之间互换，保证每次点击都有可见变化；
        // 「跟随系统」只在设置页提供，避免默认态下点了没反应。
        var isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'light' : 'dark');
      }

      /* ---------------- 计算属性 ---------------- */

      var tabTitle = computed(function () {
        if (tab.value === 'gallery') return '图片管理';
        if (tab.value === 'settings') return '系统设置';
        return '仪表盘';
      });

      var tabSubtitle = computed(function () {
        if (tab.value === 'gallery') return images.value.length + ' 张图片 · 支持搜索、排序与批量操作';
        if (tab.value === 'settings') return '主题外观、账号安全与存储概况';
        return '存储概览与快捷上传';
      });

      var initial = computed(function () {
        var name = username.value || 'A';
        return name.slice(0, 1).toUpperCase();
      });

      var themeIcon = computed(function () {
        if (themeMode.value === 'dark') return '#i-moon';
        if (themeMode.value === 'light') return '#i-sun';
        return '#i-monitor';
      });

      var themeLabel = computed(function () {
        if (themeMode.value === 'dark') return '深色';
        if (themeMode.value === 'light') return '浅色';
        return '跟随系统';
      });

      var filtered = computed(function () {
        var list = images.value;
        var q = search.value.trim().toLowerCase();
        if (q) {
          list = list.filter(function (item) {
            return item.key.toLowerCase().indexOf(q) !== -1 || displayName(item.key).toLowerCase().indexOf(q) !== -1;
          });
        }
        var arr = list.slice();
        var mode = sortBy.value;
        arr.sort(function (a, b) {
          if (mode === 'date_asc') return new Date(a.uploaded) - new Date(b.uploaded);
          if (mode === 'size_desc') return b.size - a.size;
          if (mode === 'size_asc') return a.size - b.size;
          if (mode === 'name_asc') return displayName(a.key).localeCompare(displayName(b.key), 'zh-Hans-CN');
          return new Date(b.uploaded) - new Date(a.uploaded);
        });
        return arr;
      });

      var totalSize = computed(function () {
        return images.value.reduce(function (sum, item) { return sum + (Number(item.size) || 0); }, 0);
      });

      var selectedSize = computed(function () {
        var set = selected.value;
        return images.value.reduce(function (sum, item) {
          return set.indexOf(item.key) !== -1 ? sum + (Number(item.size) || 0) : sum;
        }, 0);
      });

      var recentCount = computed(function () {
        var day = 24 * 60 * 60 * 1000;
        var now = Date.now();
        return images.value.filter(function (item) {
          var t = new Date(item.uploaded).getTime();
          return !isNaN(t) && now - t < day;
        }).length;
      });

      var recent = computed(function () {
        return images.value.slice().sort(function (a, b) {
          return new Date(b.uploaded) - new Date(a.uploaded);
        }).slice(0, 8);
      });

      var quotaPct = computed(function () {
        return Math.min(100, totalSize.value / FREE_QUOTA * 100);
      });

      var allSelected = computed(function () {
        if (!filtered.value.length) return false;
        var set = selected.value;
        return filtered.value.every(function (item) { return set.indexOf(item.key) !== -1; });
      });

      var detailItem = computed(function () {
        if (!detail.key) return null;
        var hit = filtered.value.filter(function (i) { return i.key === detail.key; })[0];
        if (hit) return hit;
        return images.value.filter(function (i) { return i.key === detail.key; })[0] || null;
      });

      var detailPos = computed(function () {
        if (!detail.key) return -1;
        return filtered.value.findIndex(function (i) { return i.key === detail.key; });
      });

      var detailUrl = computed(function () {
        return detailItem.value ? fileUrl(detailItem.value.key) : '';
      });

      var uploadDone = computed(function () {
        return upload.items.filter(function (it) { return it.status === 'done' || it.status === 'error'; }).length;
      });

      /* ---------------- 基础工具 ---------------- */

      function fileUrl(key) {
        return ORIGIN + '/file/' + encodeURIComponent(key);
      }

      function toast(message, type) {
        var id = ++toastSeq;
        toasts.value.push({ id: id, message: message, type: type || 'success' });
        var timer = setTimeout(function () {
          toasts.value = toasts.value.filter(function (t) { return t.id !== id; });
          toastTimers.delete(id);
        }, 3200);
        toastTimers.set(id, timer);
      }

      function copy(text, label) {
        var ok = function () { toast((label ? label + ' ' : '') + '已复制到剪贴板'); };
        var fallback = function () { return fallbackCopy(text); };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(ok).catch(function () {
            if (fallback()) ok(); else toast('复制失败，请手动选择文本', 'error');
          });
          return;
        }
        if (fallback()) ok(); else toast('复制失败，请手动选择文本', 'error');
      }

      function fallbackCopy(text) {
        try {
          var area = document.createElement('textarea');
          area.value = text;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.top = '-1000px';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          var done = document.execCommand('copy');
          document.body.removeChild(area);
          return done;
        } catch (e) { return false; }
      }

      function linkFormats(url) {
        return [
          { label: '直链', value: url, icon: '#i-link' },
          { label: 'Markdown', value: '![](' + url + ')', icon: '#i-hash' },
          { label: 'Markdown 链接', value: '[图片](' + url + ')', icon: '#i-hash' },
          { label: 'HTML', value: '<img src="' + url + '" alt="image" />', icon: '#i-code' },
          { label: 'BBCode', value: '[img]' + url + '[/img]', icon: '#i-code' }
        ];
      }

      function askConfirm(title, message, confirmText, danger) {
        return new Promise(function (resolve) {
          confirmBox.title = title;
          confirmBox.message = message;
          confirmBox.confirmText = confirmText || '确定';
          confirmBox.danger = danger !== false;
          confirmBox.resolve = resolve;
          confirmBox.open = true;
        });
      }

      function closeConfirm(value) {
        confirmBox.open = false;
        if (confirmBox.resolve) {
          confirmBox.resolve(value);
          confirmBox.resolve = null;
        }
      }

      /* ---------------- API ---------------- */

      function api(path, options) {
        var opts = options || {};
        var headers = Object.assign({}, opts.headers || {});
        var token = localStorage.getItem(TOKEN_KEY);
        if (token) headers['Authorization'] = token;

        var init = { method: opts.method || 'GET', headers: headers };
        if (opts.body !== undefined) {
          if (opts.body instanceof FormData) {
            init.body = opts.body;
          } else {
            headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(opts.body);
          }
        }

        return fetch('/api' + path, init).then(function (res) {
          return res.text().then(function (text) {
            var data = null;
            if (text) { try { data = JSON.parse(text); } catch (e) { data = null; } }
            if (res.status === 401) {
              localStorage.removeItem(TOKEN_KEY);
              view.value = 'login';
              throw new Error((data && data.error) || '登录已过期，请重新登录');
            }
            if (!res.ok) {
              throw new Error((data && data.error) || ('请求失败（HTTP ' + res.status + '）'));
            }
            return data || {};
          });
        }, function () {
          throw new Error('网络请求失败，请检查网络连接');
        });
      }

      /* ---------------- 启动 ---------------- */

      function boot() {
        applyTheme();
        api('/status').then(function (data) {
          if (!data.setup) { view.value = 'setup'; return; }
          if (data.authed) {
            username.value = data.username || '';
            view.value = 'app';
            return loadAll();
          }
          view.value = 'login';
        }).catch(function () { view.value = 'login'; });
      }

      function loadAll() {
        loadingList.value = true;
        listError.value = '';
        var acc = [];
        var cursor = null;
        var pages = 0;

        function step() {
          var q = cursor ? '?cursor=' + encodeURIComponent(cursor) : '';
          return api('/list' + q).then(function (data) {
            if (Array.isArray(data.files)) acc = acc.concat(data.files);
            cursor = data.cursor || null;
            pages++;
            if (cursor && pages < 20) return step();
            return null;
          });
        }

        return step().then(function () {
          images.value = acc;
          var keys = acc.map(function (i) { return i.key; });
          selected.value = selected.value.filter(function (k) { return keys.indexOf(k) !== -1; });
        }).catch(function (err) {
          listError.value = err.message;
        }).then(function () {
          loadingList.value = false;
        });
      }

      function submitAuth() {
        var isSetup = view.value === 'setup';
        var path = isSetup ? '/setup' : '/login';
        if (!form.username.trim() || !form.password) { toast('请填写用户名和密码', 'error'); return; }
        authBusy.value = true;
        api(path, { method: 'POST', body: { username: form.username.trim(), password: form.password } })
          .then(function (data) {
            if (data.token) { try { localStorage.setItem(TOKEN_KEY, data.token); } catch (e) {} }
            username.value = data.username || form.username.trim();
            form.password = '';
            view.value = 'app';
            toast(isSetup ? '初始化完成，已登录' : '欢迎回来');
            return loadAll();
          })
          .catch(function (err) { toast(err.message, 'error'); })
          .then(function () { authBusy.value = false; });
      }

      function doLogout() {
        api('/logout', { method: 'POST' }).catch(function () {}).then(function () {
          try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
          images.value = [];
          selected.value = [];
          selectMode.value = false;
          detail.open = false;
          view.value = 'login';
          form.username = username.value;
          form.password = '';
        });
      }

      function savePassword() {
        if (!pwdForm.currentPassword) { toast('请输入当前密码', 'error'); return; }
        if (pwdForm.password.length < 6) { toast('新密码至少 6 位', 'error'); return; }
        if (pwdForm.password !== pwdForm.confirm) { toast('两次输入的新密码不一致', 'error'); return; }
        pwdBusy.value = true;
        api('/password', {
          method: 'POST',
          body: {
            currentPassword: pwdForm.currentPassword,
            username: pwdForm.username.trim() || undefined,
            password: pwdForm.password
          }
        }).then(function (data) {
          toast('已保存，其它设备已下线 ' + (data.revoked || 0) + ' 个会话');
          if (pwdForm.username.trim()) username.value = pwdForm.username.trim();
          pwdForm.currentPassword = '';
          pwdForm.username = '';
          pwdForm.password = '';
          pwdForm.confirm = '';
        }).catch(function (err) { toast(err.message, 'error'); })
          .then(function () { pwdBusy.value = false; });
      }

      /* ---------------- 上传 ---------------- */

      function pickFiles() {
        if (fileInput.value) fileInput.value.click();
      }

      function onFilePick(event) {
        var files = event.target.files;
        event.target.value = '';
        startUpload(files);
      }

      function rejectReason(file) {
        var type = String(file.type || '').toLowerCase();
        if (type && ACCEPT_MIME.indexOf(type) === -1) return '不是支持的图片格式';
        if (!type && !/\.(jpe?g|png|gif|webp|avif|bmp|ico|svg)$/i.test(file.name || '')) return '不是支持的图片格式';
        if (file.size > MAX_SIZE) return '超过 20 MB';
        if (!file.size) return '文件为空';
        return null;
      }

      function startUpload(fileList) {
        var list = Array.prototype.slice.call(fileList || []);
        if (!list.length) return;
        if (view.value !== 'app') return;

        var items = [];
        var rejected = 0;
        list.forEach(function (file) {
          var reason = rejectReason(file);
          if (reason) {
            rejected++;
            toast(file.name + '：' + reason, 'error');
            return;
          }
          items.push({ file: markRaw(file), name: file.name, size: file.size, percent: 0, status: 'pending', error: '', key: '', url: '' });
        });

        if (!items.length) return;

        upload.items = items;
        upload.open = true;
        upload.running = true;
        upload.cancel = false;

        // 必须操作 upload.items（响应式代理），直接改原始数组不会触发视图更新
        var queue = upload.items;
        var cursor = 0;
        function worker() {
          if (cursor >= queue.length || upload.cancel) return Promise.resolve();
          var item = queue[cursor++];
          return uploadOne(item).then(worker);
        }

        var runners = [];
        var lanes = Math.min(UPLOAD_CONCURRENCY, queue.length);
        for (var i = 0; i < lanes; i++) runners.push(worker());

        Promise.all(runners).then(function () {
          upload.running = false;
          var ok = queue.filter(function (it) { return it.status === 'done'; });
          var failed = queue.filter(function (it) { return it.status === 'error'; }).length + rejected;
          if (!ok.length) return;
          return loadAll().then(function () {
            if (ok.length <= 8) {
              result.items = ok.map(function (it) { return { key: it.key, url: it.url }; });
              result.open = true;
            } else {
              toast('已上传 ' + ok.length + ' 张图片' + (failed ? '，失败 ' + failed + ' 张' : ''));
            }
          });
        });
      }

      function uploadOne(item) {
        return new Promise(function (resolve) {
          var attempt = 0;

          function send() {
            attempt++;
            item.status = 'uploading';
            item.percent = 0;

            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload');
            var token = localStorage.getItem(TOKEN_KEY);
            if (token) xhr.setRequestHeader('Authorization', token);

            xhr.upload.onprogress = function (event) {
              if (event.lengthComputable) item.percent = Math.round(event.loaded / event.total * 100);
            };

            xhr.onload = function () {
              var data = null;
              try { data = JSON.parse(xhr.responseText); } catch (e) { data = null; }

              if (xhr.status === 200 && data && data.success) {
                item.status = 'done';
                item.percent = 100;
                item.key = data.file.key;
                item.url = fileUrl(data.file.key);
                resolve();
                return;
              }
              if (xhr.status === 401) {
                try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
                view.value = 'login';
              }
              if (attempt < 2 && (xhr.status === 0 || xhr.status >= 500)) {
                setTimeout(send, 700);
                return;
              }
              item.status = 'error';
              item.error = (data && data.error) || ('上传失败（HTTP ' + xhr.status + '）');
              resolve();
            };

            xhr.onerror = function () {
              if (attempt < 2) { setTimeout(send, 700); return; }
              item.status = 'error';
              item.error = '网络错误，上传失败';
              resolve();
            };

            var fd = new FormData();
            fd.append('file', item.file);
            xhr.send(fd);
          }

          send();
        });
      }

      /* ---------------- 选择与删除 ---------------- */

      function isSelected(key) { return selected.value.indexOf(key) !== -1; }

      function toggleOne(key) {
        var idx = selected.value.indexOf(key);
        if (idx === -1) selected.value.push(key);
        else selected.value.splice(idx, 1);
      }

      function toggleAll() {
        if (allSelected.value) {
          var set = filtered.value.map(function (i) { return i.key; });
          selected.value = selected.value.filter(function (k) { return set.indexOf(k) === -1; });
        } else {
          var merged = selected.value.slice();
          filtered.value.forEach(function (item) {
            if (merged.indexOf(item.key) === -1) merged.push(item.key);
          });
          selected.value = merged;
        }
      }

      function invertSelect() {
        var set = filtered.value.map(function (i) { return i.key; });
        var rest = selected.value.filter(function (k) { return set.indexOf(k) === -1; });
        var inverted = set.filter(function (k) { return selected.value.indexOf(k) === -1; });
        selected.value = rest.concat(inverted);
      }

      function toggleSelectMode() {
        selectMode.value = !selectMode.value;
        if (!selectMode.value) selected.value = [];
      }

      function copySelected() {
        if (!selected.value.length) return;
        var text = selected.value.map(fileUrl).join('\n');
        copy(text, selected.value.length + ' 条直链');
      }

      function removeKeys(keys) {
        var list = (keys || []).slice();
        if (!list.length) return;
        var label = list.length === 1 ? '这张图片' : '选中的 ' + list.length + ' 张图片';
        askConfirm('删除图片', '确定要永久删除' + label + '吗？删除后无法恢复。', '删除').then(function (yes) {
          if (!yes) return;
          return api('/delete', { method: 'POST', body: { keys: list } }).then(function () {
            toast('已删除 ' + list.length + ' 张图片');
            selected.value = selected.value.filter(function (k) { return list.indexOf(k) === -1; });
            detail.open = false;
            return loadAll();
          }).catch(function (err) { toast(err.message, 'error'); });
        });
      }

      /* ---------------- 详情 / 右键 ---------------- */

      function openDetail(item) {
        if (!item) return;
        detail.key = item.key;
        detail.zoom = 1;
        detail.rotate = 0;
        detail.open = true;
      }

      function stepDetail(delta) {
        var list = filtered.value;
        if (list.length < 2) return;
        var pos = detailPos.value;
        if (pos < 0) pos = 0;
        var next = (pos + delta + list.length) % list.length;
        detail.key = list[next].key;
        detail.zoom = 1;
        detail.rotate = 0;
      }

      function onTileClick(item) {
        if (selectMode.value) toggleOne(item.key);
        else openDetail(item);
      }

      function openCtx(event, item) {
        ctx.item = item;
        ctx.open = true;
        var width = 196;
        var height = 268;
        ctx.x = event.clientX + width > window.innerWidth ? Math.max(8, event.clientX - width) : event.clientX;
        ctx.y = event.clientY + height > window.innerHeight ? Math.max(8, event.clientY - height) : event.clientY;
      }

      function ctxAction(action) {
        var item = ctx.item;
        ctx.open = false;
        if (!item) return;
        if (action === 'preview') { openDetail(item); return; }
        if (action === 'delete') { removeKeys([item.key]); return; }
        var url = fileUrl(item.key);
        if (action === 'url') copy(url, '直链');
        if (action === 'md') copy('![](' + url + ')', 'Markdown');
        if (action === 'html') copy('<img src="' + url + '" alt="image" />', 'HTML');
        if (action === 'bb') copy('[img]' + url + '[/img]', 'BBCode');
      }

      function go(target) {
        tab.value = target;
        navOpen.value = false;
        ctx.open = false;
      }

      /* ---------------- 全局事件 ---------------- */

      function hasFiles(event) {
        var types = event.dataTransfer && event.dataTransfer.types;
        return !!types && Array.prototype.indexOf.call(types, 'Files') !== -1;
      }

      function onDragEnter(event) {
        if (!hasFiles(event) || view.value !== 'app') return;
        dragDepth++;
        dragging.value = true;
      }

      function onDragOver(event) {
        if (hasFiles(event)) event.preventDefault();
      }

      function onDragLeave() {
        dragDepth = Math.max(0, dragDepth - 1);
        if (!dragDepth) dragging.value = false;
      }

      function onDrop(event) {
        dragDepth = 0;
        dragging.value = false;
        if (!hasFiles(event)) return;
        event.preventDefault();
        if (view.value !== 'app') return;
        startUpload(event.dataTransfer.files);
      }

      function onPaste(event) {
        if (view.value !== 'app') return;
        var items = (event.clipboardData || {}).items || [];
        var files = [];
        for (var i = 0; i < items.length; i++) {
          if (items[i].kind === 'file') {
            var f = items[i].getAsFile();
            if (f && f.type.indexOf('image/') === 0) files.push(f);
          }
        }
        if (files.length) {
          event.preventDefault();
          startUpload(files);
        }
      }

      function onKeydown(event) {
        var el = event.target || {};
        var tag = String(el.tagName || '').toLowerCase();
        var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable === true;

        if (event.key === 'Escape') {
          if (ctx.open) { ctx.open = false; return; }
          if (confirmBox.open) { closeConfirm(false); return; }
          if (result.open) { result.open = false; return; }
          if (detail.open) { detail.open = false; return; }
          if (upload.open && !upload.running) { upload.open = false; return; }
          if (navOpen.value) { navOpen.value = false; return; }
          if (typing) el.blur();
          return;
        }

        if (typing || view.value !== 'app') return;

        if (detail.open && detailItem.value) {
          if (event.key === 'ArrowRight') { event.preventDefault(); stepDetail(1); return; }
          if (event.key === 'ArrowLeft') { event.preventDefault(); stepDetail(-1); return; }
          if (event.key === 'Delete') { event.preventDefault(); removeKeys([detailItem.value.key]); return; }
          return;
        }

        if (event.key === '/') {
          event.preventDefault();
          go('gallery');
          nextTick(function () { if (searchInput.value) searchInput.value.focus(); });
          return;
        }
        if (event.key === 'u' || event.key === 'U') { event.preventDefault(); pickFiles(); return; }
        if (event.key === 'Delete' && selectMode.value && selected.value.length) {
          event.preventDefault();
          removeKeys(selected.value.slice());
          return;
        }
        if ((event.metaKey || event.ctrlKey) && (event.key === 'a' || event.key === 'A') && selectMode.value) {
          event.preventDefault();
          toggleAll();
          return;
        }
        if (event.key === 'g' || event.key === 'G') { go('gallery'); return; }
        if (event.key === 'd' || event.key === 'D') { go('dashboard'); return; }
        if (event.key === 's' || event.key === 'S') { go('settings'); }
      }

      function closeCtx() { if (ctx.open) ctx.open = false; }

      /* ---------------- 生命周期 ---------------- */

      watch([sortBy, viewMode], function () {
        try {
          localStorage.setItem(PREF_KEY, JSON.stringify({ sort: sortBy.value, view: viewMode.value }));
        } catch (e) {}
      });

      watch(tab, function () { ctx.open = false; });

      onMounted(function () {
        boot();
        window.addEventListener('keydown', onKeydown);
        window.addEventListener('click', closeCtx);
        window.addEventListener('scroll', closeCtx, true);
        window.addEventListener('resize', closeCtx);
        window.addEventListener('dragenter', onDragEnter);
        window.addEventListener('dragover', onDragOver);
        window.addEventListener('dragleave', onDragLeave);
        window.addEventListener('drop', onDrop);
        window.addEventListener('paste', onPaste);
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
      });

      onUnmounted(function () {
        window.removeEventListener('keydown', onKeydown);
        window.removeEventListener('click', closeCtx);
        window.removeEventListener('scroll', closeCtx, true);
        window.removeEventListener('resize', closeCtx);
        window.removeEventListener('dragenter', onDragEnter);
        window.removeEventListener('dragover', onDragOver);
        window.removeEventListener('dragleave', onDragLeave);
        window.removeEventListener('drop', onDrop);
        window.removeEventListener('paste', onPaste);
        toastTimers.forEach(function (timer) { clearTimeout(timer); });
        toastTimers.clear();
      });

      return {
        view: view, username: username, initial: initial, navOpen: navOpen, tab: tab,
        images: images, loadingList: loadingList, listError: listError, search: search,
        sortBy: sortBy, viewMode: viewMode, selectMode: selectMode, selected: selected,
        toasts: toasts, dragging: dragging, themeMode: themeMode, themeOptions: themeOptions,
        themeIcon: themeIcon, themeLabel: themeLabel, showPwd: showPwd, authBusy: authBusy, pwdBusy: pwdBusy,
        fileInput: fileInput, searchInput: searchInput, form: form, pwdForm: pwdForm,
        detail: detail, ctx: ctx, confirmBox: confirmBox, upload: upload, result: result,
        tabTitle: tabTitle, tabSubtitle: tabSubtitle, filtered: filtered, totalSize: totalSize,
        selectedSize: selectedSize, recentCount: recentCount, recent: recent, quotaPct: quotaPct,
        allSelected: allSelected, detailItem: detailItem, detailPos: detailPos, detailUrl: detailUrl, uploadDone: uploadDone,
        fmtSize: fmtSize, displayName: displayName, fmtDate: fmtDate, fileUrl: fileUrl, linkFormats: linkFormats,
        setTheme: setTheme, cycleTheme: cycleTheme, submitAuth: submitAuth, doLogout: doLogout,
        savePassword: savePassword, pickFiles: pickFiles, onFilePick: onFilePick,
        isSelected: isSelected, toggleOne: toggleOne, toggleAll: toggleAll, invertSelect: invertSelect,
        toggleSelectMode: toggleSelectMode, copySelected: copySelected, removeKeys: removeKeys,
        openDetail: openDetail, stepDetail: stepDetail, onTileClick: onTileClick,
        openCtx: openCtx, ctxAction: ctxAction, closeConfirm: closeConfirm, go: go,
        loadAll: loadAll, copy: copy
      };
    }
  }).mount('#app');
})();
</script>
</body>
</html>
`;
