<?php
$page = $_GET['page'] ?? 'dashboard';
$tab = $_GET['tab'] ?? 'manage';

$legacyTabs = ['manage' => 'manage', 'new' => 'new', 'import' => 'import', 'banks' => 'banks'];
if (isset($legacyTabs[$page])) {
    $tab = $legacyTabs[$page];
    $page = 'knowledge';
}
if ($page === 'compare') {
    $page = 'ask';
}
if (!in_array($page, ['dashboard', 'ask', 'interview', 'review', 'knowledge', 'push', 'ai-settings', 'admin'], true)) {
    $page = 'dashboard';
}
if (!in_array($tab, ['manage', 'new', 'import', 'banks', 'index'], true)) {
    $tab = 'manage';
}

$titles = [
    'dashboard' => '训练工作台',
    'ask' => 'AI 问答',
    'interview' => '模拟面试',
    'review' => '学习计划',
    'knowledge' => '知识库',
    'push' => '微信推送',
    'ai-settings' => 'AI 配置',
    'admin' => '用户与邀请码',
];
$descriptions = [
    'dashboard' => '围绕目标岗位安排今天的训练，并持续跟踪能力变化。',
    'ask' => '基于题库检索证据，再由 DeepSeek 生成有来源的回答。',
    'interview' => '从指定题库抽题，获得评分、反馈和最多两轮追问。',
    'review' => '按照记忆稳定度安排复习，巩固模拟面试中回答过的题目。',
    'knowledge' => '集中管理题目、批量导入、题库空间与 BGE 索引状态。',
    'push' => '向微信发送自定义消息，或从指定题库随机抽取一道题目。',
    'ai-settings' => '配置当前账号专用的模型服务，问答和面试调用相互隔离。',
    'admin' => '创建一次性邀请码，查看注册记录并管理普通用户账号状态。',
];
function navClass($value, $page) { return $value === $page ? 'nav-item active' : 'nav-item'; }
function tabClass($value, $tab) { return $value === $tab ? 'knowledge-tab active' : 'knowledge-tab'; }
?>
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#0f172a">
  <title>鉴微 · <?=htmlspecialchars($titles[$page], ENT_QUOTES, 'UTF-8')?></title>
  <link rel="stylesheet" href="/assets/app.css?v=4.0.0">
</head>
<body data-page="<?=htmlspecialchars($page, ENT_QUOTES, 'UTF-8')?>">
<div id="loginView" class="login-view hidden">
  <form id="loginForm" class="login-card">
    <div class="login-brand">
      <div class="login-mark">鉴</div>
      <div><h1>欢迎回来</h1><p>登录鉴微面试学习助手</p></div>
    </div>
    <label>用户名<input name="username" autocomplete="username" value="admin" required></label>
    <label>密码<input name="password" type="password" autocomplete="current-password" required></label>
    <button type="submit">登录</button>
    <button type="button" class="auth-switch ghost" onclick="showRegister()">使用邀请码注册</button>
  </form>
  <form id="registerForm" class="login-card hidden">
    <div class="login-brand">
      <div class="login-mark">鉴</div>
      <div><h1>创建账号</h1><p>使用管理员提供的邀请码注册</p></div>
    </div>
    <label>用户名<input name="username" minlength="3" maxlength="32" pattern="[A-Za-z0-9_.-]+" autocomplete="username" placeholder="3-32 位字母、数字或 ._-" required></label>
    <label>密码<input name="password" type="password" minlength="8" maxlength="128" autocomplete="new-password" placeholder="至少 8 位" required></label>
    <label>邀请码<input name="invite_code" autocomplete="off" placeholder="JW-XXXXX-XXXXX-XXXXX-XXXXX" required></label>
    <button type="submit">注册并登录</button>
    <button type="button" class="auth-switch ghost" onclick="showLoginForm()">返回登录</button>
  </form>
  <div class="login-icp"><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">【工业和信息化部】豫ICP备2026006649号</a></div>
</div>

<div id="appView" class="app-view hidden">
  <div id="sidebarBackdrop" class="sidebar-backdrop" onclick="toggleSidebar(false)"></div>
  <aside id="sidebar" class="sidebar">
    <div class="sidebar-head">
      <div class="brand-mark">鉴</div>
      <div><strong>鉴微</strong><span>面试学习助手</span></div>
    </div>
    <nav class="nav-menu">
      <a href="/?page=dashboard" title="训练工作台" class="<?=navClass('dashboard', $page)?>"><span class="nav-icon">⌂</span><span><b>训练工作台</b><small>目标、任务与进度</small></span></a>
      <a href="/?page=ask" title="AI 问答" class="<?=navClass('ask', $page)?>"><span class="nav-icon">✦</span><span><b>AI 问答</b><small>检索并生成回答</small></span></a>
      <a href="/?page=interview" title="模拟面试" class="<?=navClass('interview', $page)?>"><span class="nav-icon">◎</span><span><b>模拟面试</b><small>抽题、评分与追问</small></span></a>
      <a href="/?page=review" title="学习计划" class="<?=navClass('review', $page)?>"><span class="nav-icon">↻</span><span><b>学习计划</b><small>间隔复习与巩固</small></span></a>
      <a href="/?page=knowledge" title="知识库" class="<?=navClass('knowledge', $page)?>"><span class="nav-icon">▤</span><span><b>知识库</b><small>题目、题库与索引</small></span></a>
      <a href="/?page=push" title="微信推送" class="<?=navClass('push', $page)?>"><span class="nav-icon">↗</span><span><b>微信推送</b><small>自定义消息与随机题</small></span></a>
      <a href="/?page=ai-settings" title="AI 配置" class="<?=navClass('ai-settings', $page)?>"><span class="nav-icon">⚙</span><span><b>AI 配置</b><small>个人模型与密钥</small></span></a>
      <a id="adminNav" href="/?page=admin" title="用户与邀请码" class="<?=navClass('admin', $page)?> hidden"><span class="nav-icon">♙</span><span><b>用户与邀请码</b><small>注册权限与账号状态</small></span></a>
    </nav>
    <div class="sidebar-model">
      <span class="model-dot"></span>
      <div><b id="modelStatus">BGE 检索服务</b><small>向量索引已连接</small></div>
    </div>
    <button class="logout ghost" onclick="logout()">退出登录</button>
  </aside>
  <button id="sidebarCollapse" class="sidebar-edge-toggle" onclick="toggleSidebarCollapse()" aria-label="收起侧边栏" title="收起侧边栏">‹</button>

  <main class="content">
    <header class="topbar">
      <button class="icon-button mobile-menu" onclick="toggleSidebar(true)" aria-label="打开导航">☰</button>
      <div class="page-heading">
        <h1><?=htmlspecialchars($titles[$page], ENT_QUOTES, 'UTF-8')?></h1>
        <p><?=$descriptions[$page]?></p>
      </div>
      <div class="service-status"><span></span><b id="health">服务检测中</b></div>
    </header>

    <?php if ($page === 'dashboard'): ?>
      <section id="coachGoal" class="coach-goal-band">
        <div class="coach-goal-main">
          <span class="eyebrow">TARGET ROLE</span>
          <h2 id="coachGoalTitle">先设置你的目标岗位</h2>
          <p id="coachGoalMeta">系统会根据面试日期、材料和训练记录安排每天的任务。</p>
        </div>
        <div class="coach-goal-actions">
          <span id="coachCountdown" class="coach-countdown">尚未设置日期</span>
          <button class="ghost" type="button" onclick="openCoachProfile()">编辑目标</button>
          <a class="button-link" href="/?page=interview">开始面试</a>
        </div>
      </section>

      <section class="coach-overview">
        <article class="readiness-panel">
          <div class="readiness-ring" id="readinessRing"><strong id="coachReadiness">0</strong><span>准备度</span></div>
          <div class="readiness-copy"><span class="eyebrow">READINESS</span><h2 id="readinessTitle">等待首次诊断</h2><p id="readinessHint">完善求职材料并完成一次模拟面试后，准备度会更准确。</p><div id="readinessBreakdown" class="readiness-breakdown"></div></div>
        </article>
        <div class="coach-stat-grid">
          <article><span>已完成面试</span><strong id="coachInterviewCount">0</strong><small>累计训练轮次</small></article>
          <article><span>面试平均分</span><strong id="coachAverageScore">0</strong><small>基于已作答主问题</small></article>
          <article><span>今日待复习</span><strong id="coachDueReviews">0</strong><small>来自低分题和到期题</small></article>
          <article><span>知识库题目</span><strong id="coachKnowledgeCount">0</strong><small>可用于检索与抽题</small></article>
        </div>
      </section>

      <section class="coach-content-grid">
        <article class="coach-section">
          <div class="coach-section-head"><div><span class="eyebrow">TODAY</span><h2>今日训练</h2><p>先完成最靠前的任务，避免在功能之间来回选择。</p></div><span id="coachTaskProgress" class="task-progress">0 / 0</span></div>
          <div id="coachTaskList" class="coach-task-list"><div class="empty">加载训练计划中</div></div>
        </article>
        <aside class="coach-section coach-insights">
          <div class="coach-section-head"><div><span class="eyebrow">WEAK SPOTS</span><h2>优先补齐</h2><p>来自最近的面试评分和反馈。</p></div></div>
          <div id="coachWeakAreas" class="weak-area-list"><div class="empty">完成面试后生成薄弱项</div></div>
          <div class="score-trend-head"><b>最近面试</b><span>分数趋势</span></div>
          <div id="coachScoreTrend" class="score-trend"><div class="empty">暂无成绩记录</div></div>
        </aside>
      </section>

      <details id="coachProfileEditor" class="panel coach-profile-editor">
        <summary><span><b>目标岗位与训练材料</b><small>保存后自动生成未来 7 天训练计划</small></span><i>＋</i></summary>
        <form id="coachProfileForm" class="coach-profile-form">
          <div class="coach-profile-grid">
            <label>目标岗位<input id="coachPosition" maxlength="120" placeholder="例如：Java 后端工程师" required></label>
            <label>目标面试日期<input id="coachInterviewDate" type="date"></label>
            <label>经验阶段<select id="coachExperience"><option>应届 / 实习</option><option selected>1-3 年</option><option>3-5 年</option><option>5 年以上</option></select></label>
            <label>每日训练时长<select id="coachDailyMinutes"><option value="15">15 分钟</option><option value="30" selected>30 分钟</option><option value="45">45 分钟</option><option value="60">60 分钟</option><option value="90">90 分钟</option></select></label>
            <label class="span-2">重点方向<input id="coachFocusAreas" placeholder="例如：JVM、MySQL、系统设计，用逗号分隔"></label>
          </div>
          <div class="coach-material-grid">
            <label class="coach-material-field"><span><b>招聘 JD</b><small>用于识别岗位要求和知识缺口</small></span><textarea id="coachJd" rows="8" placeholder="粘贴招聘描述，或上传文件提取文字"></textarea><span class="material-upload"><input type="file" accept=".pdf,.docx,.md,.markdown,.txt,.json,.csv" onchange="extractCoachMaterial('coachJd',this)">上传 JD 文件</span></label>
            <label class="coach-material-field"><span><b>简历摘要</b><small>建议保留技术栈、职责和量化结果</small></span><textarea id="coachResume" rows="8" placeholder="粘贴简历文本，敏感信息可先删除"></textarea><span class="material-upload"><input type="file" accept=".pdf,.docx,.md,.markdown,.txt,.json,.csv" onchange="extractCoachMaterial('coachResume',this)">上传简历文件</span></label>
            <label class="coach-material-field"><span><b>项目材料</b><small>用于自动带入项目深挖面试</small></span><textarea id="coachProject" rows="8" placeholder="写清业务背景、架构、个人贡献、指标与故障复盘"></textarea><span class="material-upload"><input type="file" accept=".pdf,.docx,.md,.markdown,.txt,.json,.csv" onchange="extractCoachMaterial('coachProject',this)">上传项目文件</span></label>
          </div>
          <div class="coach-profile-actions"><span>材料仅保存在当前账号的私有档案中</span><button id="coachProfileSave" type="submit">保存并生成计划</button></div>
        </form>
      </details>

    <?php elseif ($page === 'ask'): ?>
      <section class="rag-workspace">
        <article class="panel rag-main">
          <div class="rag-toolbar">
            <div><span class="eyebrow">KNOWLEDGE SCOPE</span><label class="select-label">回答范围<select id="bankSelect"></select></label></div>
            <div class="model-chip"><span class="model-dot"></span><span><b>BGE + DeepSeek</b><small>混合检索 · Top 3</small></span></div>
          </div>
          <div id="askTrace" class="retrieval-flow" aria-live="polite">
            <span class="flow-step active">输入问题</span><i>→</i><span class="flow-step">BGE 检索</span><i>→</i><span class="flow-step">Top 3 证据</span><i>→</i><span class="flow-step">生成回答</span>
          </div>
          <div id="askResult" class="output empty">
            <div class="welcome-state"><span>✦</span><h2>从题库中找到可靠答案</h2><p>可以询问知识点、面试题答案或概念之间的区别。回答会附带检索来源。</p></div>
          </div>
          <div class="ask-composer">
            <textarea id="askQuery" rows="3" placeholder="例如：MongoDB 的 _id 索引有什么作用？&#10;Ctrl + Enter 快速发送"></textarea>
            <div class="composer-actions"><span>基于当前题库回答</span><button id="askButton" onclick="askAi()">发送问题 <b>↗</b></button></div>
          </div>
        </article>
        <aside class="panel evidence-panel">
          <div class="panel-head"><div><span class="eyebrow">EVIDENCE</span><h2>检索依据</h2></div><span class="source-count">TOP 3</span></div>
          <div id="askSources" class="source-list empty"><p>提出问题后，这里会展示 BGE 检索到的题目、匹配度和答案片段。</p></div>
        </aside>
      </section>

      <details class="panel advanced-search">
        <summary><span><b>高级检索调试</b><small>对比语义、关键词和混合检索效果</small></span><i>＋</i></summary>
        <div class="advanced-body">
          <div class="control-grid">
            <input id="compareQuery" placeholder="输入要测试的检索内容">
            <select id="compareMode"><option value="all">全部对比</option><option value="semantic">语义检索</option><option value="keyword">关键词检索</option><option value="hybrid">混合检索</option></select>
            <label>语义权重<input id="semanticWeight" type="number" min="0" max="1" step="0.05" value="0.75"></label>
            <label>关键词权重<input id="keywordWeight" type="number" min="0" max="1" step="0.05" value="0.25"></label>
            <label>最低分<input id="minScore" type="number" min="0" max="1" step="0.05" value="0"></label>
            <button onclick="compareSearch()">开始测试</button>
          </div>
          <div id="compareResult" class="compare-grid"></div>
        </div>
      </details>

    <?php elseif ($page === 'interview'): ?>
      <section class="panel feature-shell">
        <div class="feature-intro"><div><span class="eyebrow">MOCK INTERVIEW</span><h2>选择面试方式</h2><p>项目深挖围绕你的真实经历压力追问；通用题库用于系统复习技术知识点。</p></div></div>
        <div class="interview-mode-switch" role="tablist" aria-label="面试方式">
          <button id="projectModeButton" class="mode-card active" type="button" onclick="updateInterviewMode('project')"><span>01</span><strong>项目深挖</strong><small>根据项目文档和经历连续压力追问</small></button>
          <button id="generalModeButton" class="mode-card" type="button" onclick="updateInterviewMode('general')"><span>02</span><strong>通用题库</strong><small>从现有题库随机抽题并评分复盘</small></button>
        </div>
        <div class="interview-config">
          <div id="projectInterviewConfig" class="project-config">
            <label>项目名称<input id="projectTitle" placeholder="例如：企业知识库 RAG 系统"></label>
            <label>项目说明<textarea id="projectInfo" rows="7" placeholder="建议写清业务背景、技术架构、你的职责、难点、指标、线上问题和改进方案"></textarea></label>
            <label class="project-upload"><input id="projectFile" type="file" accept=".pdf,.docx,.md,.markdown,.txt,.json,.csv" onchange="updateProjectFileName()"><span>上传项目文档</span><small id="projectFileName">支持 PDF、Word、Markdown、TXT、JSON、CSV，最大 10 MB</small></label>
          </div>
          <div id="generalInterviewConfig" class="general-config hidden"><div class="welcome-state compact"><span>▤</span><h2>从题库随机抽取 6 题</h2><p>适合日常技术知识检查，回答后展示评分、标准答案和最多两轮追问。</p></div></div>
          <aside class="interview-start-card"><span class="eyebrow">INTERVIEW SETUP</span><label id="interviewBankLabel">保存到题库<select id="bankSelect"></select></label><ul id="interviewModeNotes"><li>基于项目内容生成 6 道压力题</li><li>最多两轮递进追问</li><li>确认后再保存到题库</li></ul><button id="startInterviewButton" type="button" onclick="startInterview()">生成项目面试</button></aside>
        </div>
        <div id="interviewBoard" class="interview-board empty"><div class="welcome-state"><span>◎</span><h2>准备好后开始</h2><p>建议在安静环境中独立作答，再查看 AI 反馈和标准答案。</p></div></div>
      </section>

    <?php elseif ($page === 'review'): ?>
      <section class="review-toolbar">
        <div><h2 id="reviewTitle">今日复习</h2><p id="reviewMeta">加载复习计划中</p></div>
        <div class="segmented"><button onclick="loadReviews('today')">今日待复习</button><button class="ghost" onclick="loadReviews('yesterday')">昨日记录</button></div>
      </section>
      <div id="reviewList" class="review-list"></div>

    <?php elseif ($page === 'admin'): ?>
      <section class="admin-stats">
        <article><span>用户总数</span><strong id="adminUserCount">-</strong></article>
        <article><span>可用邀请码</span><strong id="adminInviteCount">-</strong></article>
        <article><span>已停用用户</span><strong id="adminDisabledCount">-</strong></article>
      </section>
      <section class="admin-layout">
        <form id="inviteCreateForm" class="panel admin-create-panel">
          <div class="section-title"><span class="eyebrow">NEW INVITATION</span><h2>创建邀请码</h2><p>邀请码仅可注册一个普通用户，完整代码只显示一次。</p></div>
          <label>用途备注<input name="note" maxlength="100" placeholder="例如：前端候选人"></label>
          <label>有效期<select name="expires_in_days"><option value="1">1 天</option><option value="7" selected>7 天</option><option value="30">30 天</option><option value="90">90 天</option></select></label>
          <button id="inviteCreateButton" type="submit">生成邀请码</button>
          <div id="newInviteResult" class="new-invite-result hidden" aria-live="polite"><span>新邀请码</span><code id="newInviteCode"></code><button type="button" class="ghost" onclick="copyInviteCode()">复制邀请码</button></div>
        </form>
        <article class="panel admin-users-panel">
          <div class="panel-head"><div><span class="eyebrow">REGISTERED USERS</span><h2>用户管理</h2></div><button class="ghost" type="button" onclick="loadAdminData()">刷新</button></div>
          <div id="adminUserList" class="admin-list"><div class="empty">加载用户中</div></div>
        </article>
      </section>
      <section class="panel admin-invites-panel">
        <div class="panel-head"><div><span class="eyebrow">INVITATION HISTORY</span><h2>邀请码记录</h2></div><span class="admin-note">完整邀请码创建后不再显示</span></div>
        <div id="adminInviteList" class="admin-list"><div class="empty">加载邀请码中</div></div>
      </section>
      <section class="panel metrics-panel">
        <div class="panel-head"><div><span class="eyebrow">ENGINEERING METRICS</span><h2>工程指标看板</h2><p>按 24 小时和 7 天窗口统计 API 稳定性、延迟与 RAG 检索基线。</p></div><button class="ghost" type="button" onclick="loadAdminMetrics()">刷新</button></div>
        <div class="admin-stats metrics-summary"><article><span>题目 / 题库</span><strong id="metricKnowledge">-</strong></article><article><span>用户</span><strong id="metricUsers">-</strong></article><article><span>服务状态</span><strong id="metricHealth">-</strong></article></div>
        <div class="metrics-grid"><article class="metric-window"><h3>最近 24 小时</h3><div id="metrics24h" class="metric-list"><div class="empty">加载中</div></div></article><article class="metric-window"><h3>最近 7 天</h3><div id="metrics7d" class="metric-list"><div class="empty">加载中</div></div></article></div>
        <div id="metricsTargets" class="metrics-targets"></div>
      </section>

    <?php elseif ($page === 'ai-settings'): ?>
      <section class="ai-settings-overview">
        <div><span class="eyebrow">PERSONAL MODEL</span><h2>当前账号的 AI 服务</h2><p>问答、自动标签和模拟面试只调用这里启用的个人配置。</p></div>
        <div id="aiConfigStatus" class="ai-config-status pending"><span></span><b>读取配置中</b><small></small></div>
      </section>
      <form id="aiSettingsForm" class="panel ai-settings-panel">
        <div class="ai-settings-grid">
          <label>服务类型<select id="aiProvider"><option value="deepseek">DeepSeek</option><option value="openai-compatible">OpenAI 兼容服务</option></select></label>
          <label>模型名称<input id="aiModel" autocomplete="off" placeholder="例如：deepseek-chat" required></label>
          <label class="span-2">API Base URL<input id="aiApiBase" type="url" autocomplete="url" placeholder="https://api.deepseek.com" required><small>填写服务根地址，不包含 /chat/completions</small></label>
          <label class="span-2">API Key<input id="aiApiKey" type="password" autocomplete="new-password" placeholder="留空则保留当前密钥"><small id="aiKeyMasked">尚未配置个人密钥</small></label>
          <label class="switch-row span-2"><span><b>启用个人 AI</b><small>关闭后停止当前账号的生成与评分调用</small></span><input id="aiEnabled" type="checkbox" checked><i aria-hidden="true"></i></label>
        </div>
        <div class="ai-security-note"><span>KEY</span><div><strong>密钥不会返回浏览器</strong><p>保存后仅显示掩码，修改模型或地址时可不再填写密钥。</p></div></div>
        <div class="ai-settings-actions">
          <button id="aiTestButton" class="ghost" type="button" onclick="testAISettings()">测试并保存</button>
          <button id="aiDeleteButton" class="danger" type="button" onclick="deleteAISettings()">删除个人配置</button>
          <button id="aiSaveButton" type="submit">保存配置</button>
        </div>
        <div id="aiSettingsResult" class="push-result" aria-live="polite"></div>
      </form>

    <?php elseif ($page === 'push'): ?>
      <section class="push-overview">
        <div><span class="eyebrow">MESSAGE DELIVERY</span><h2>推送到微信</h2><p>消息由服务器转发到 ShowDoc，推送凭证不会发送到浏览器。</p></div>
        <div id="pushStatus" class="push-status pending"><span></span><b>检测推送服务</b></div>
      </section>
      <form id="pushSettingsForm" class="panel push-settings-panel">
        <div class="push-settings-head"><div><span class="eyebrow">DELIVERY SETTINGS</span><h2>定时与地址</h2><p>设置每日随机题推送时间；留空网址则继续使用服务器当前配置。</p></div><span id="pushNextRun" class="push-next-run">读取配置中</span></div>
        <div class="settings-grid">
          <label class="switch-row settings-enabled"><span><b>启用每日推送</b><small>由应用按北京时间执行，每天最多发送一次</small></span><input id="pushScheduleEnabled" type="checkbox"><i aria-hidden="true"></i></label>
          <label>每天推送时间<input id="pushScheduleTime" type="time" required></label>
          <label>定时题库<select id="pushScheduleBank"><option value="">随机题库</option></select></label>
          <label class="switch-row"><span><b>定时消息附带答案</b><small>关闭后先推送题目，适合自主练习</small></span><input id="pushScheduleAnswer" type="checkbox"><i aria-hidden="true"></i></label>
          <label class="push-url-field">ShowDoc 推送网址<input id="pushUrl" type="password" autocomplete="new-password" placeholder="留空保持当前地址"><small id="pushUrlMasked">当前地址读取中</small></label>
        </div>
        <div class="push-actions"><small id="pushSettingsHint">修改后立即生效，推送地址不会显示完整 token。</small><button id="pushSettingsButton" type="submit">保存定时配置</button></div>
        <div id="pushSettingsResult" class="push-result" aria-live="polite"></div>
      </form>
      <section class="push-grid">
        <form id="customPushForm" class="panel push-panel">
          <div class="section-title"><span class="eyebrow">CUSTOM MESSAGE</span><h2>自定义消息</h2><p>正文支持普通文本、Markdown 和 HTML。</p></div>
          <label>消息标题<input id="pushTitle" name="title" maxlength="100" placeholder="例如：服务器告警" required></label>
          <label>消息正文<textarea id="pushContent" name="content" rows="10" maxlength="12000" placeholder="输入需要推送到微信的内容" required></textarea></label>
          <div class="push-actions"><small>最多 12,000 个字符</small><button id="customPushButton" type="submit">发送消息</button></div>
          <div id="customPushResult" class="push-result" aria-live="polite"></div>
        </form>
        <form id="randomPushForm" class="panel push-panel">
          <div class="section-title"><span class="eyebrow">RANDOM QUESTION</span><h2>随机题目</h2><p>可指定题库，也可以从所有非空题库中随机抽取。</p></div>
          <label>题库范围<select id="pushBank" name="bank_id"><option value="">随机题库</option></select></label>
          <label class="switch-row"><span><b>附带标准答案</b><small>关闭后只推送题目，适合先独立思考</small></span><input id="pushIncludeAnswer" type="checkbox" checked><i aria-hidden="true"></i></label>
          <div class="random-preview"><span>抽题规则</span><strong>每次实时随机，不修改题库内容</strong><p>空题库会自动跳过；指定空题库时会提示重新选择。</p></div>
          <div class="push-actions"><small>推送后显示本次抽中的题目</small><button id="randomPushButton" type="submit">随机抽题并推送</button></div>
          <div id="randomPushResult" class="push-result" aria-live="polite"></div>
        </form>
      </section>

    <?php else: ?>
      <nav class="knowledge-tabs" aria-label="知识库功能">
        <a class="<?=tabClass('manage', $tab)?>" href="/?page=knowledge&tab=manage">题目管理</a>
        <a class="<?=tabClass('new', $tab)?>" href="/?page=knowledge&tab=new">单题录入</a>
        <a class="<?=tabClass('import', $tab)?>" href="/?page=knowledge&tab=import">批量导入</a>
        <a class="<?=tabClass('banks', $tab)?>" href="/?page=knowledge&tab=banks">题库空间</a>
        <a class="<?=tabClass('index', $tab)?>" href="/?page=knowledge&tab=index">索引状态</a>
      </nav>

      <?php if ($tab === 'manage'): ?>
        <section class="stats"><article><span>题目记录</span><strong id="totalCount">-</strong></article><article><span>题库数量</span><strong id="bankCount">-</strong></article><article><span>检索策略</span><strong>Top 3</strong></article></section>
        <section class="panel manage-panel"><div class="toolbar"><select id="manageBank"></select><input id="manageKeyword" placeholder="搜索题目、答案或标签"><button onclick="loadQuestions()">查询</button></div><div id="questionList" class="question-list"></div></section>

      <?php elseif ($tab === 'new'): ?>
        <section class="panel form-panel"><div class="section-title"><span class="eyebrow">NEW QUESTION</span><h2>录入一道题目</h2><p>题目和答案会立即生成 BGE 向量并写入当前题库。</p></div><form id="questionForm"><div class="form-grid"><label>题库<select id="newBank" name="bank_id"></select></label><label>分类<input name="category" list="categoryOptions" value="未分类"></label><label>难度<input name="difficulty" list="difficultyOptions" value="中等"></label><label>岗位<input name="position" list="positionOptions" value="通用"></label><label>关键词<input name="keywords" placeholder="多个关键词用逗号分隔"></label><label>标签<input name="tags" placeholder="多个标签用逗号分隔"></label><label class="span-2">题目<textarea name="question" rows="5" placeholder="支持 Markdown" required></textarea></label><label class="span-2">标准答案<textarea name="answer" rows="10" placeholder="支持 Markdown" required></textarea></label><label>来源<input name="source" value="手动录入"></label></div><div class="actions"><button type="submit">保存并建立索引</button></div></form></section>
        <datalist id="categoryOptions"><option value="计算机网络"><option value="操作系统"><option value="数据库"><option value="后端开发"><option value="前端开发"><option value="系统设计"></datalist>
        <datalist id="difficultyOptions"><option value="简单"><option value="中等"><option value="困难"><option value="高频"><option value="核心"></datalist>
        <datalist id="positionOptions"><option value="通用"><option value="后端开发"><option value="前端开发"><option value="测试"><option value="算法"><option value="Java"><option value="Go"></datalist>

      <?php elseif ($tab === 'import'): ?>
        <form id="importForm" class="panel import-studio">
          <div class="section-title"><span class="eyebrow">LANGCHAIN PARENT-CHILD IMPORT</span><h2>解析并选择题目</h2><p>先预览文件内容，再选择需要导入的题目和父子分块策略。</p></div>
          <div class="import-setup-grid">
            <label class="upload"><input id="importFile" type="file" accept=".json,.csv,.md,.markdown,.txt" required onchange="updateImportFileName()"><span>⇧</span><strong>选择题库文件</strong><em id="importFileName">未选择文件</em></label>
            <div class="import-settings">
              <label>目标题库<select id="importBank" name="bank_id"></select></label>
              <label>分块策略<select id="importChunkMode"><option value="smart" selected>智能父子分块（推荐）</option><option value="fixed">固定长度父子分块</option><option value="none">不分块，每题一条</option></select></label>
              <label>子块长度<input id="importChunkSize" type="number" min="300" max="4000" step="100" value="900"></label>
              <label>重叠长度<input id="importChunkOverlap" type="number" min="0" max="600" step="20" value="120"></label>
              <div class="parent-child-note"><strong>父文档</strong><span>保存完整题目与答案</span><i>→</i><strong>子文档</strong><span>由 LangChain 切分并进入 Milvus 检索</span></div>
            </div>
          </div>
          <div class="upload-progress"><i><b id="importProgressBar"></b></i><span id="importProgressText">等待解析</span></div>
          <div class="actions"><button id="importPreviewButton" type="submit">解析并预览</button><button type="button" class="ghost" onclick="resetImportPanel()">重置</button></div>
          <div id="importResult"></div>
        </form>
        <section id="importPreviewPanel" class="panel import-preview-panel hidden">
          <div class="import-preview-head"><div><span class="eyebrow">SELECT QUESTIONS</span><h2>选择导入题目</h2><p id="importPreviewSummary">尚未解析文件</p></div><div class="import-preview-tools"><input id="importPreviewFilter" placeholder="筛选题目或分类" oninput="filterImportPreview()"><button type="button" class="ghost" onclick="toggleImportSelection(true)">全选</button><button type="button" class="ghost" onclick="toggleImportSelection(false)">取消</button></div></div>
          <div id="importPreviewList" class="import-preview-list"></div>
          <div class="import-confirm-bar"><span id="importSelectedCount">已选择 0 题</span><button id="confirmImportButton" type="button" onclick="confirmSelectedImport()">导入所选题目</button></div>
        </section>
        <section class="import-layout import-reference">
          <aside class="panel import-guide"><span class="eyebrow">FORMAT GUIDE</span><h2>Markdown 结构</h2><pre># 后端题库

## TCP 为什么需要三次握手？
### 标准答案
用于确认双方收发能力并同步序列号。
- 分类: 计算机网络
- 难度: 中等
- 标签: TCP, 网络</pre><p><b>#</b> 创建题库，<b>##</b> 创建题目，<b>### 标准答案</b> 后填写答案正文。</p></aside>
          <aside class="panel import-guide"><span class="eyebrow">RETRIEVAL FLOW</span><h2>父子检索流程</h2><ol class="parent-child-flow"><li><b>1</b><span>完整父题写入 SQLite</span></li><li><b>2</b><span>LangChain 按语义边界拆分答案</span></li><li><b>3</b><span>子块向量写入 Milvus</span></li><li><b>4</b><span>命中子块后聚合返回完整父题</span></li></ol></aside>
        </section>

      <?php elseif ($tab === 'banks'): ?>
        <section class="bank-space-layout"><article class="panel bank-create-card"><div class="section-title"><span class="eyebrow">BANK SPACES</span><h2>管理题库空间</h2><p>按岗位、技术栈或学习阶段拆分检索范围。题库会同步用于问答、面试和复习。</p></div><div class="bank-create-hint"><span>＋</span><div><strong>创建一个专属训练空间</strong><small>例如：Agent 项目深挖、RAG 基础、后端通用题</small></div></div><form id="bankForm" class="bank-form"><label>题库名称<input name="name" placeholder="例如：Agent 项目深挖" required></label><label>题库说明<input name="description" placeholder="描述题库用途和适用场景"></label><button type="submit">创建题库</button></form></article><aside class="panel bank-space-guide"><span class="eyebrow">HOW TO USE</span><h3>建议这样组织</h3><ul><li><b>项目深挖</b><span>保存真实项目追问和复盘题</span></li><li><b>通用题库</b><span>按技术栈沉淀基础题</span></li><li><b>面试收藏</b><span>把薄弱题集中起来复习</span></li></ul></aside></section><section class="bank-list-section"><div class="bank-list-head"><div><span class="eyebrow">YOUR BANKS</span><h2>已有题库</h2></div><span id="bankListCount" class="bank-list-count">0 个空间</span></div><div id="bankList" class="bank-grid"></div></section>

      <?php else: ?>
        <section class="index-grid">
          <article class="panel index-card"><span>Embedding 模型</span><strong id="indexModel">加载中</strong><p>负责将问题和题库内容编码为中文语义向量。</p></article>
          <article class="panel index-card"><span>向量后端</span><strong id="indexBackend">加载中</strong><p>当前运行时使用的 embedding 实现。</p></article>
          <article class="panel index-card"><span>Milvus Collection</span><strong id="indexCollection">加载中</strong><p>与当前模型隔离的向量集合名称。</p></article>
          <article class="panel index-card"><span>运行状态</span><strong id="indexHealth">检测中</strong><p>索引在题目录入、编辑和导入时自动更新。</p></article>
        </section>
      <?php endif; ?>
    <?php endif; ?>
    <footer class="site-footer"><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">【工业和信息化部】豫ICP备2026006649号</a></footer>
  </main>
</div>

<div id="editModal" class="modal hidden"><div class="modal-card"><div class="modal-head"><h3 id="editModalTitle">编辑</h3><button class="icon-button" type="button" onclick="closeEditModal()">×</button></div><textarea id="editModalText" rows="16"></textarea><div class="actions"><button id="editModalSave" type="button">保存</button></div></div></div>
<div id="toast"></div>
  <script src="/assets/app.js?v=4.0.0"></script>
</body>
</html>
