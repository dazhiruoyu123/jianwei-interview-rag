const api = "/api";
const UI_VERSION = "4.3.0";
let banks = [];
let currentUser = null;
let currentInterview = null;
let currentQuestionIndex = 0;
let interviewMode = "project";
let modalSaveHandler = null;
let importPreviewState = { file: null, items: [], selected: new Set(), filter: "" };

const zh = {
  requestFailed: "\u8bf7\u6c42\u5931\u8d25",
  loginFirst: "\u8bf7\u5148\u767b\u5f55",
  serviceDown: "\u670d\u52a1\u4e0d\u53ef\u7528",
  loginFailed: "\u767b\u5f55\u5931\u8d25",
  loginSuccess: "\u767b\u5f55\u6210\u529f",
  noBanks: "\u6682\u65e0\u9898\u5e93",
  question: "\u9898\u76ee",
  answer: "\u7b54\u6848",
  standardAnswer: "\u6807\u51c6\u7b54\u6848",
  score: "\u8bc4\u5206",
  match: "\u5339\u914d\u5ea6",
  confidence: "\u7f6e\u4fe1\u5ea6",
  qaResult: "\u95ee\u7b54\u7ed3\u679c",
  topSources: "Top 3 \u6765\u6e90",
  searching: "\u68c0\u7d22\u4e2d...",
  evaluating: "\u8bc4\u4f30\u4e2d...",
  inputQuestion: "\u8bf7\u8f93\u5165\u95ee\u9898",
  inputSearch: "\u8bf7\u8f93\u5165\u68c0\u7d22\u5185\u5bb9",
  semantic: "\u8bed\u4e49\u68c0\u7d22",
  keyword: "\u5173\u952e\u8bcd\u68c0\u7d22",
  hybrid: "\u6df7\u5408\u68c0\u7d22",
  noInterview: "\u6682\u65e0\u9762\u8bd5\u5185\u5bb9",
  interviewEnd: "\u672c\u8f6e\u9762\u8bd5\u5df2\u7ed3\u675f",
  nth: "\u7b2c",
  item: "\u9898",
  interviewNote: "\u8bf7\u5148\u72ec\u7acb\u56de\u7b54\u3002\u63d0\u4ea4\u540e\u518d\u5c55\u793a\u8bc4\u4f30\u3001\u6807\u51c6\u7b54\u6848\u548c\u6700\u591a\u4e24\u6b21\u8ffd\u95ee\u3002",
  inputAnswer: "\u8f93\u5165\u4f60\u7684\u56de\u7b54\uff0c\u652f\u6301 Markdown",
  submitAnswer: "\u63d0\u4ea4\u56de\u7b54",
  skip: "\u8df3\u8fc7",
  followUp: "\u8ffd\u95ee",
  answerFollowUp: "\u56de\u7b54\u8ffd\u95ee\uff0c\u652f\u6301 Markdown",
  continueFollowUp: "\u7ee7\u7eed\u8ffd\u95ee",
  saveToBank: "\u52a0\u5165\u9898\u5e93",
  next: "\u4e0b\u4e00\u9898",
  savedFollowUp: "\u8ffd\u95ee\u5df2\u52a0\u5165\u9898\u5e93",
  edit: "\u7f16\u8f91",
  del: "\u5220\u9664",
  editQuestion: "\u7f16\u8f91\u9898\u76ee",
  editAnswer: "\u7f16\u8f91\u7b54\u6848",
  editQuestionMd: "\u7f16\u8f91\u9898\u76ee\uff0c\u652f\u6301 Markdown",
  editAnswerMd: "\u7f16\u8f91\u7b54\u6848\uff0c\u652f\u6301 Markdown",
  editTags: "\u7f16\u8f91\u6807\u7b7e",
  autoTags: "\u81ea\u52a8\u6807\u7b7e",
  noQuestions: "\u6682\u65e0\u9898\u76ee",
  updatedQuestion: "\u9898\u76ee\u5df2\u66f4\u65b0",
  updatedAnswer: "\u7b54\u6848\u5df2\u66f4\u65b0",
  editCategory: "\u7f16\u8f91\u5206\u7c7b",
  editDifficulty: "\u7f16\u8f91\u96be\u5ea6",
  editPosition: "\u7f16\u8f91\u5c97\u4f4d",
  editKeywords: "\u7f16\u8f91\u5173\u952e\u8bcd",
  tagsUpdated: "\u6807\u7b7e\u4fe1\u606f\u5df2\u66f4\u65b0",
  tagged: "\u5df2\u81ea\u52a8\u6807\u6ce8",
  confirmDeleteQuestion: "\u786e\u8ba4\u5220\u9664\u8fd9\u9053\u9898\u5417\uff1f",
  deleteSuccess: "\u5220\u9664\u6210\u529f",
  todayReview: "\u4eca\u65e5\u590d\u4e60",
  yesterdayReview: "\u6628\u65e5\u590d\u4e60",
  interviewReviewOnly: "\u4ec5\u6765\u81ea\u6a21\u62df\u9762\u8bd5\u5df2\u56de\u7b54\u9898\u76ee",
  noInterviewReview: "\u6682\u65e0\u6a21\u62df\u9762\u8bd5\u590d\u4e60\u9898\uff0c\u5148\u53bb\u5b8c\u6210\u4e00\u8f6e\u6a21\u62df\u9762\u8bd5\u5427",
  recall: "\u8bb0\u5fc6\u6982\u7387",
  stability: "\u7a33\u5b9a\u5ea6",
  difficulty: "\u96be\u5ea6",
  viewAnswer: "\u67e5\u770b\u6807\u51c6\u7b54\u6848",
  again: "\u5fd8\u8bb0",
  hard: "\u56f0\u96be",
  good: "\u4e00\u822c",
  easy: "\u7b80\u5355",
  nextInterval: "\u4e0b\u6b21\u95f4\u9694",
  days: "\u5929",
  bankName: "\u9898\u5e93\u540d\u79f0",
  bankDesc: "\u9898\u5e93\u8bf4\u660e",
  bankUpdated: "\u9898\u5e93\u5df2\u66f4\u65b0",
  confirmDeleteBank: "\u5220\u9664\u9898\u5e93\u524d\u9700\u5148\u6e05\u7a7a\u9898\u76ee\uff0c\u786e\u8ba4\u7ee7\u7eed\uff1f",
  bankDeleted: "\u9898\u5e93\u5df2\u5220\u9664",
  bankCreated: "\u9898\u5e93\u5df2\u521b\u5efa",
  questionSaved: "\u9898\u76ee\u5df2\u4fdd\u5b58",
  chooseFile: "\u8bf7\u9009\u62e9\u6587\u4ef6",
  importOk: "\u6210\u529f",
  skipped: "\u8df3\u8fc7",
  failed: "\u5931\u8d25",
  rows: "\u6761",
  sourceSummary: "\u6765\u6e90\u6458\u8981",
  answerGenerated: "\u7efc\u5408\u56de\u7b54",
  importResult: "\u5bfc\u5165\u7ed3\u679c",
  chooseFileLabel: "\u672a\u9009\u62e9\u6587\u4ef6",
  uploading: "\u4e0a\u4f20\u4e2d",
  uploadFailed: "\u4e0a\u4f20\u5931\u8d25",
  uploadDone: "\u4e0a\u4f20\u5b8c\u6210"
  ,projectInfoRequired: "\u8bf7\u586b\u5199\u9879\u76ee\u8bf4\u660e\u6216\u4e0a\u4f20\u9879\u76ee\u6587\u6863",
  generatingInterview: "\u6b63\u5728\u751f\u6210\u538b\u529b\u9762\u8bd5\u9898...",
  saveCurrent: "\u4fdd\u5b58\u672c\u9898\u5230\u9898\u5e93",
  savedQuestion: "\u672c\u9898\u5df2\u4fdd\u5b58\u5230\u9898\u5e93",
  reportTitle: "\u9762\u8bd5\u8bc4\u5206\u62a5\u544a",
  answeredTurns: "\u5df2\u8bc4\u4f30\u56de\u7b54",
  strengthsLabel: "\u4f18\u52bf",
  weaknessesLabel: "\u5f85\u63d0\u5347",
  restartInterview: "\u518d\u7ec3\u4e00\u8f6e"
};

function token() { return localStorage.getItem("jianwei_token") || ""; }
function authHeaders() { return token() ? { Authorization: `Bearer ${token()}` } : {}; }
function toast(message) {
  const element = document.getElementById("toast");
  if (!element) return;
  element.textContent = message;
  element.classList.add("show");
  setTimeout(() => element.classList.remove("show"), 2400);
}
async function request(path, options = {}) {
  const headers = options.body instanceof FormData
    ? authHeaders()
    : { "Content-Type": "application/json", ...authHeaders(), ...(options.headers || {}) };
  const response = await fetch(api + path, { ...options, headers });
  const data = await response.json().catch(() => ({ detail: zh.requestFailed }));
  if (response.status === 401) { showLogin(); throw new Error(data.detail || zh.loginFirst); }
  if (!response.ok) throw new Error(data.detail || zh.requestFailed);
  return data;
}
async function requestRaw(path, options = {}) {
  const response = await fetch(api + path, { ...options, headers: authHeaders() });
  const data = await response.json().catch(() => ({ detail: zh.requestFailed }));
  if (!response.ok) throw new Error(data.detail || zh.requestFailed);
  return data;
}
function showLogin() {
  showLoginForm();
  document.getElementById("loginView").classList.remove("hidden");
  document.getElementById("appView").classList.add("hidden");
}
function showRegister() {
  document.getElementById("loginForm")?.classList.add("hidden");
  document.getElementById("registerForm")?.classList.remove("hidden");
}
function showLoginForm() {
  document.getElementById("registerForm")?.classList.add("hidden");
  document.getElementById("loginForm")?.classList.remove("hidden");
}
function showApp() {
  document.getElementById("loginView").classList.add("hidden");
  document.getElementById("appView").classList.remove("hidden");
  applySidebarPreference();
}
function toggleSidebar(open) {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (!sidebar || !backdrop) return;
  sidebar.classList.toggle("open", Boolean(open));
  backdrop.classList.toggle("open", Boolean(open));
}
function setSidebarCollapsed(collapsed) {
  const appView = document.getElementById("appView");
  const button = document.getElementById("sidebarCollapse");
  if (!appView) return;
  appView.classList.toggle("sidebar-collapsed", Boolean(collapsed));
  localStorage.setItem("jianwei_sidebar_collapsed", collapsed ? "1" : "0");
  if (button) {
    button.textContent = collapsed ? "›" : "‹";
    button.setAttribute("aria-label", collapsed ? "展开侧边栏" : "收起侧边栏");
    button.title = collapsed ? "展开侧边栏" : "收起侧边栏";
  }
}
function toggleSidebarCollapse() {
  if (window.matchMedia("(max-width: 1080px)").matches) return;
  const appView = document.getElementById("appView");
  setSidebarCollapsed(!appView?.classList.contains("sidebar-collapsed"));
}
function applySidebarPreference() {
  setSidebarCollapsed(localStorage.getItem("jianwei_sidebar_collapsed") === "1");
}
function logout() { currentUser = null; localStorage.removeItem("jianwei_token"); showLogin(); }
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}
function escapeAttr(value) { return escapeHtml(value).replace(/`/g, "&#96;"); }
function splitList(value) {
  return String(value || "").split(/[,\uFF0C\u3001\n]+/).map((item) => item.trim()).filter(Boolean);
}
function updateImportFileName() {
  const input = document.getElementById("importFile");
  const label = document.getElementById("importFileName");
  const result = document.getElementById("importResult");
  const progressBar = document.getElementById("importProgressBar");
  const progressText = document.getElementById("importProgressText");
  const file = input?.files?.[0];
  if (label) label.textContent = file ? `${file.name} - ${(file.size / 1024).toFixed(1)} KB` : zh.chooseFileLabel;
  if (result) result.innerHTML = "";
  if (progressBar) progressBar.style.width = "0%";
  if (progressText) progressText.textContent = file ? "等待解析" : "等待选择文件";
  clearImportPreview();
}
function clearImportPreview() {
  importPreviewState = { file: null, items: [], selected: new Set(), filter: "" };
  document.getElementById("importPreviewPanel")?.classList.add("hidden");
  const list = document.getElementById("importPreviewList");
  const filter = document.getElementById("importPreviewFilter");
  if (list) list.innerHTML = "";
  if (filter) filter.value = "";
  updateImportSelectedCount();
}
function resetImportPanel() {
  const input = document.getElementById("importFile");
  const label = document.getElementById("importFileName");
  const result = document.getElementById("importResult");
  const progressBar = document.getElementById("importProgressBar");
  const progressText = document.getElementById("importProgressText");
  if (input) input.value = "";
  if (label) label.textContent = zh.chooseFileLabel;
  if (result) result.innerHTML = "";
  if (progressBar) progressBar.style.width = "0%";
  if (progressText) progressText.textContent = "等待解析";
  clearImportPreview();
}

function importChunkSettings() {
  const mode = document.getElementById("importChunkMode")?.value || "smart";
  const size = Math.max(300, Math.min(4000, Number(document.getElementById("importChunkSize")?.value || 900)));
  const overlap = Math.max(0, Math.min(600, Math.floor(Number(document.getElementById("importChunkOverlap")?.value || 0)), Math.floor(size / 2)));
  return { mode, size, overlap };
}

function appendImportSettings(form) {
  const settings = importChunkSettings();
  form.append("chunk_mode", settings.mode);
  form.append("chunk_size", String(settings.size));
  form.append("chunk_overlap", String(settings.overlap));
  return settings;
}

function importVisibleItems() {
  const keyword = importPreviewState.filter.trim().toLowerCase();
  if (!keyword) return importPreviewState.items;
  return importPreviewState.items.filter((item) => [item.question, item.answer_preview, item.category, item.difficulty, item.position, item.bank_name]
    .some((value) => String(value || "").toLowerCase().includes(keyword)));
}

function renderImportPreview() {
  const panel = document.getElementById("importPreviewPanel");
  const list = document.getElementById("importPreviewList");
  const summary = document.getElementById("importPreviewSummary");
  if (!panel || !list) return;
  panel.classList.remove("hidden");
  const visible = importVisibleItems();
  const validTotal = importPreviewState.items.filter((item) => item.valid).length;
  if (summary) summary.textContent = `共解析 ${importPreviewState.items.length} 题，可导入 ${validTotal} 题；当前显示 ${visible.length} 题`;
  list.innerHTML = visible.length ? visible.map((item) => {
    const checked = importPreviewState.selected.has(item.index);
    const meta = [item.category, item.difficulty, item.position, item.bank_name].filter(Boolean).map(escapeHtml).join(" / ");
    return `<label class="import-preview-row ${item.valid ? "" : "invalid"}"><input type="checkbox" ${checked ? "checked" : ""} ${item.valid ? "" : "disabled"} onchange="setImportSelection(${item.index},this.checked)"><span class="import-check" aria-hidden="true"></span><span class="import-preview-main"><span class="import-preview-title"><b>${escapeHtml(item.question)}</b><em>#${item.index}</em></span><small>${meta || "未分类"}</small><span class="import-answer-preview">${escapeHtml(item.answer_preview || item.error || "无答案预览")}</span></span><span class="import-preview-metrics">${item.valid ? `<b>${Number(item.estimated_chunks || 1)}</b><small>预计子块</small><em>${Number(item.answer_length || 0)} 字</em>` : `<b>不可导入</b><small>${escapeHtml(item.error || "格式错误")}</small>`}</span></label>`;
  }).join("") : `<div class="empty">没有符合筛选条件的题目</div>`;
  updateImportSelectedCount();
}

function setImportSelection(index, selected) {
  if (selected) importPreviewState.selected.add(index);
  else importPreviewState.selected.delete(index);
  updateImportSelectedCount();
}

function updateImportSelectedCount() {
  const count = importPreviewState.selected.size;
  const label = document.getElementById("importSelectedCount");
  const button = document.getElementById("confirmImportButton");
  if (label) label.textContent = `已选择 ${count} 题`;
  if (button) button.disabled = count === 0;
}

function filterImportPreview() {
  importPreviewState.filter = document.getElementById("importPreviewFilter")?.value || "";
  renderImportPreview();
}

function toggleImportSelection(selected) {
  for (const item of importVisibleItems()) {
    if (!item.valid) continue;
    if (selected) importPreviewState.selected.add(item.index);
    else importPreviewState.selected.delete(item.index);
  }
  renderImportPreview();
}
function cleanSegmentLabel(value) {
  return String(value || "")
    .replace(/[\uFF08(]\s*(?:\u5206\u6bb5|\u6bb5)\s*\d+\s*[\uFF09)]\s*$/g, "")
    .replace(/\s*[-\u2014]\s*(?:\u5206\u6bb5|\u6bb5)\s*\d+\s*$/g, "")
    .trim();
}
function renderMarkdown(value) {
  let source = escapeHtml(cleanSegmentLabel(value || ""));
  source = source.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  source = source.replace(/^### (.*)$/gm, "<h4>$1</h4>");
  source = source.replace(/^## (.*)$/gm, "<h3>$1</h3>");
  source = source.replace(/^# (.*)$/gm, "<h2>$1</h2>");
  source = source.replace(/^[-*] (.*)$/gm, "<li>$1</li>");
  source = source.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  source = source.replace(/`([^`]+)`/g, "<code>$1</code>");
  return source.replace(/\n/g, "<br>");
}
function renderContentBlock(title, text, className = "") {
  return `<section class="qa-block ${className}"><div class="qa-block-title">${escapeHtml(title)}</div><div class="markdown qa-block-body">${renderMarkdown(text || "")}</div></section>`;
}
function renderQuestionAnswerBlocks(item) {
  return `<div class="qa-pair">${renderContentBlock(zh.question, item.question || "", "question-block")}${renderContentBlock(zh.answer, item.answer || "", "answer-block")}</div>`;
}
function answerPreview(value, limit = 150) {
  const text = cleanSegmentLabel(value || "").replace(/\s+/g, " ").trim();
  return `${escapeHtml(text.slice(0, limit))}${text.length > limit ? "…" : ""}`;
}
function renderQuestionRow(item) {
  return `<article class="question-row"><div class="question-main">${renderContentBlock(zh.question, item.question || "", "question-block compact-question")}<details class="question-answer"><summary>${zh.viewAnswer}<span>⌄</span></summary><div class="markdown question-answer-body">${renderMarkdown(item.answer || "")}</div></details><div class="meta-line">${metaLine(item)}</div><div class="meta-line">${renderTags(item.tags || [])}</div></div><div class="row-actions"><button class="ghost" onclick="editQuestionText('${item.id}')">${zh.editQuestion}</button><button class="ghost" onclick="editAnswerText('${item.id}')">${zh.editAnswer}</button><button class="ghost" onclick="openQuestionEditor('${item.id}')">${zh.editTags}</button><button class="ghost" onclick="autoTags('${item.id}')">${zh.autoTags}</button><button class="danger" onclick="deleteQuestion('${item.id}')">${zh.del}</button></div></article>`;
}
function setButtonBusy(button, busy, label) {
  if (!button) return;
  if (busy) {
    if (!button.dataset.idleLabel) button.dataset.idleLabel = button.innerHTML;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    if (label) button.innerHTML = `<span class="button-spinner" aria-hidden="true"></span>${escapeHtml(label)}`;
  } else {
    button.disabled = false;
    button.removeAttribute("aria-busy");
    if (button.dataset.idleLabel) button.innerHTML = button.dataset.idleLabel;
  }
}
function renderTags(tags = []) { return tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join(""); }
function metaLine(item) {
  return [item.category, item.difficulty, item.position].filter(Boolean).map(escapeHtml).join(" / ");
}
function bankValue() {
  const active = document.activeElement;
  const scoped = active?.closest("form, .panel")?.querySelector("select[id$='Bank'], select#bankSelect");
  return scoped?.value || document.getElementById("bankSelect")?.value || document.getElementById("manageBank")?.value || document.getElementById("importBank")?.value || document.getElementById("newBank")?.value || "";
}
function fillSelects() {
  for (const id of ["bankSelect", "importBank", "manageBank", "newBank"]) {
    const element = document.getElementById(id);
    if (!element) continue;
    const previous = element.value;
    element.innerHTML = banks.map((bank) => `<option value="${bank.id}">${escapeHtml(bank.name)} (${bank.question_count})</option>`).join("");
    if (previous) element.value = previous;
  }
  const pushBank = document.getElementById("pushBank");
  if (pushBank) {
    const previous = pushBank.value;
    pushBank.innerHTML = `<option value="">随机题库</option>${banks.filter((bank) => Number(bank.question_count) > 0).map((bank) => `<option value="${bank.id}">${escapeHtml(bank.name)} (${bank.question_count})</option>`).join("")}`;
    pushBank.value = previous;
  }
  const scheduleBank = document.getElementById("pushScheduleBank");
  if (scheduleBank) {
    const previous = scheduleBank.value;
    scheduleBank.innerHTML = `<option value="">随机题库</option>${banks.filter((bank) => Number(bank.question_count) > 0).map((bank) => `<option value="${bank.id}">${escapeHtml(bank.name)} (${bank.question_count})</option>`).join("")}`;
    scheduleBank.value = previous;
  }
  const bankCount = document.getElementById("bankCount");
  if (bankCount) bankCount.textContent = String(banks.length);
}
function renderBanks() {
  const list = document.getElementById("bankList");
  if (!list) return;
  const bankCountLabel = document.getElementById("bankListCount");
  if (bankCountLabel) bankCountLabel.textContent = `${banks.length} 个空间`;
  list.innerHTML = banks.length ? banks.map((bank, index) => `<article class="bank-card"><div class="bank-card-head"><span class="bank-index">${String(index + 1).padStart(2, "0")}</span><div><strong>${escapeHtml(bank.name)}</strong><small>${bank.question_count ? "正在用于检索和面试" : "等待添加第一道题"}</small></div><span class="bank-count"><b>${bank.question_count}</b><em>${zh.item}</em></span></div><p>${escapeHtml(bank.description || "还没有填写题库说明，建议补充适用岗位或复习目标。")}</p><div class="bank-card-foot"><span class="bank-scope">${bank.question_count ? "● 已建立内容索引" : "○ 空题库"}</span><div class="bank-actions"><button class="ghost" onclick="editBank('${bank.id}','${escapeAttr(bank.name)}','${escapeAttr(bank.description || "")}')">${zh.edit}</button><button class="danger" onclick="deleteBank('${bank.id}')">${zh.del}</button></div></div></article>`).join("") : `<div class="empty bank-empty"><span>▤</span><strong>还没有题库空间</strong><p>先创建一个题库，再从单题录入或批量导入添加内容。</p></div>`;
}
async function init() {
  if (!token()) { showLogin(); return; }
  showApp();
  try {
    currentUser = await request("/auth/me");
    document.getElementById("adminNav")?.classList.toggle("hidden", currentUser.role !== "admin");
    if (document.body.dataset.page === "admin" && currentUser.role !== "admin") {
      window.location.replace("/?page=ask");
      return;
    }
    const health = await fetch("/health").then((r) => r.json());
    document.getElementById("health").textContent = `${health.name} UI ${UI_VERSION} · API ${health.version}`;
    const modelStatus = document.getElementById("modelStatus");
    if (modelStatus) modelStatus.textContent = health.embedding_backend === "fastembed" ? "BGE 检索服务" : "轻量检索服务";
    const indexModel = document.getElementById("indexModel");
    const indexBackend = document.getElementById("indexBackend");
    const indexCollection = document.getElementById("indexCollection");
    const indexHealth = document.getElementById("indexHealth");
    if (indexModel) indexModel.textContent = health.model || "未配置";
    if (indexBackend) indexBackend.textContent = health.embedding_backend || "未知";
    if (indexCollection) indexCollection.textContent = health.vector_collection || "默认集合";
    if (indexHealth) indexHealth.textContent = health.status === "ok" ? "运行正常" : "需要检查";
  } catch { document.getElementById("health").textContent = zh.serviceDown; }
  await loadBanks();
  if (document.getElementById("askButton")) loadAIAvailability();
  if (document.getElementById("questionList")) loadQuestions();
  if (document.getElementById("reviewList")) loadReviews("today");
  if (document.getElementById("pushStatus")) loadPushSettings();
  if (document.getElementById("aiSettingsForm")) loadAISettings();
  if (document.getElementById("adminUserList")) { loadAdminData(); loadAdminMetrics(); }
}

async function loadAIAvailability() {
  const button = document.getElementById("askButton");
  if (!button) return;
  try {
    const data = await request("/ai/settings");
    button.disabled = !data.configured;
    button.innerHTML = data.configured ? "发送问题 <b>↗</b>" : "先配置 AI";
    if (!data.configured) {
      const result = document.getElementById("askResult");
      if (result) result.innerHTML = `<div class="welcome-state"><span>⚙</span><h2>当前账号尚未配置 AI API</h2><p>配置个人 DeepSeek 或 OpenAI 兼容服务后即可使用问答。</p><a class="ai-config-link" href="/?page=ai-settings">配置 AI</a></div>`;
    }
  } catch (error) {
    button.disabled = true;
    button.textContent = "AI 状态不可用";
  }
}

function renderAIStatus(data) {
  const status = document.getElementById("aiConfigStatus");
  if (!status) return;
  const labels = { personal: "个人配置", server: "服务器兼容配置", none: "未配置" };
  status.className = `ai-config-status ${data.configured ? "ready" : "error"}`;
  status.querySelector("b").textContent = data.configured ? `AI 已启用 · ${labels[data.source] || data.source}` : "当前账号未启用 AI";
  const savedAt = data.updated_at ? new Date(Number(data.updated_at) * 1000).toLocaleString("zh-CN", { hour12: false }) : "";
  status.querySelector("small").textContent = data.configured
    ? `${data.provider} · ${data.model}${savedAt ? ` · 已保存 ${savedAt}` : ""}`
    : "请填写个人 API 配置后使用生成能力";
}

async function loadAISettings() {
  try {
    const data = await request("/ai/settings");
    renderAIStatus(data);
    const provider = document.getElementById("aiProvider");
    const base = document.getElementById("aiApiBase");
    const model = document.getElementById("aiModel");
    const key = document.getElementById("aiKeyMasked");
    const enabled = document.getElementById("aiEnabled");
    if (provider) provider.value = data.provider || "deepseek";
    if (base) base.value = data.api_base || "https://api.deepseek.com";
    if (model) model.value = data.model || "deepseek-chat";
    if (key) key.textContent = data.api_key_masked ? `当前密钥：${data.api_key_masked}` : "尚未配置个人密钥";
    if (enabled) enabled.checked = data.has_personal_config ? Boolean(data.enabled) : true;
  } catch (error) {
    renderAIStatus({ configured: false, source: "none", provider: "deepseek", model: "" });
    showAIResult(`<strong>读取失败</strong><span>${escapeHtml(error.message)}</span>`, "error");
  }
}

function aiSettingsPayload() {
  return {
    provider: document.getElementById("aiProvider").value,
    api_base: document.getElementById("aiApiBase").value.trim(),
    model: document.getElementById("aiModel").value.trim(),
    api_key: document.getElementById("aiApiKey").value.trim() || null,
    enabled: document.getElementById("aiEnabled").checked,
  };
}

function showAIResult(message, type = "success") {
  const result = document.getElementById("aiSettingsResult");
  if (!result) return;
  result.className = `push-result show ${type}`;
  result.innerHTML = message;
}

async function testAISettings() {
  const button = document.getElementById("aiTestButton");
  const payload = aiSettingsPayload();
  if (!payload.api_base || !payload.model) return toast("请填写 API 地址和模型名称");
  setButtonBusy(button, true, "测试中...");
  try {
    const tested = await request("/ai/settings/test", { method: "POST", body: JSON.stringify(payload) });
    const saved = await request("/ai/settings", { method: "PUT", body: JSON.stringify(payload) });
    document.getElementById("aiApiKey").value = "";
    document.getElementById("aiKeyMasked").textContent = saved.api_key_masked ? `当前密钥：${saved.api_key_masked}` : "尚未配置个人密钥";
    renderAIStatus(saved);
    showAIResult(`<strong>连接成功，配置已保存</strong><span>模型：${escapeHtml(tested.model)} · API 配置已写入当前账号</span>`);
    toast("连接成功，配置已保存");
  } catch (error) {
    showAIResult(`<strong>连接失败</strong><span>${escapeHtml(error.message)}</span>`, "error");
  } finally { setButtonBusy(button, false); }
}

async function deleteAISettings() {
  if (!window.confirm("确定删除当前账号的个人 AI 配置吗？")) return;
  const button = document.getElementById("aiDeleteButton");
  setButtonBusy(button, true, "删除中...");
  try {
    const data = await request("/ai/settings", { method: "DELETE" });
    document.getElementById("aiApiKey").value = "";
    showAIResult(`<strong>${escapeHtml(data.message)}</strong><span>当前账号不再使用个人模型配置。</span>`);
    await loadAISettings();
    toast(data.message);
  } catch (error) {
    showAIResult(`<strong>删除失败</strong><span>${escapeHtml(error.message)}</span>`, "error");
  } finally { setButtonBusy(button, false); }
}

document.getElementById("aiSettingsForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.getElementById("aiSaveButton");
  const payload = aiSettingsPayload();
  if (!payload.api_base || !payload.model) return toast("请填写 API 地址和模型名称");
  setButtonBusy(button, true, "保存中...");
  try {
    const data = await request("/ai/settings", { method: "PUT", body: JSON.stringify(payload) });
    document.getElementById("aiApiKey").value = "";
    document.getElementById("aiKeyMasked").textContent = data.api_key_masked ? `当前密钥：${data.api_key_masked}` : "尚未配置个人密钥";
    const savedAt = data.updated_at ? new Date(Number(data.updated_at) * 1000).toLocaleString("zh-CN", { hour12: false }) : "刚刚";
    showAIResult(`<strong>${escapeHtml(data.message)}</strong><span>后续 AI 调用将使用当前账号配置，保存时间：${escapeHtml(savedAt)}</span>`);
    renderAIStatus(data);
    toast(data.message);
  } catch (error) {
    showAIResult(`<strong>保存失败</strong><span>${escapeHtml(error.message)}</span>`, "error");
  } finally { setButtonBusy(button, false); }
});

async function loadPushSettings() {
  const status = document.getElementById("pushStatus");
  if (!status) return;
  try {
    const data = await request("/push/settings");
    status.className = `push-status ${data.configured ? "ready" : "error"}`;
    status.querySelector("b").textContent = data.configured ? `推送服务已连接 · ${data.enabled ? "定时已启用" : "定时已暂停"}` : "推送服务未配置";
    const enabled = document.getElementById("pushScheduleEnabled");
    const time = document.getElementById("pushScheduleTime");
    const bank = document.getElementById("pushScheduleBank");
    const answer = document.getElementById("pushScheduleAnswer");
    const masked = document.getElementById("pushUrlMasked");
    const next = document.getElementById("pushNextRun");
    if (enabled) enabled.checked = Boolean(data.enabled);
    if (time) time.value = data.push_time || "";
    if (bank) bank.value = data.bank_id || "";
    if (answer) answer.checked = Boolean(data.include_answer);
    if (masked) masked.textContent = data.push_url_masked ? `当前：${data.push_url_masked}` : "当前未配置地址";
    if (next) next.textContent = data.next_push_at ? `下次执行：${data.next_push_at.replace("T", " ")}（北京时间）` : "定时任务已暂停";
  } catch (error) {
    status.className = "push-status error";
    status.querySelector("b").textContent = error.message;
  }
}

function showPushResult(elementId, message, type = "success") {
  const result = document.getElementById(elementId);
  if (!result) return;
  result.className = `push-result show ${type}`;
  result.innerHTML = message;
}

document.getElementById("pushSettingsForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.getElementById("pushSettingsButton");
  const payload = {
    enabled: document.getElementById("pushScheduleEnabled").checked,
    push_time: document.getElementById("pushScheduleTime").value,
    bank_id: document.getElementById("pushScheduleBank").value || null,
    include_answer: document.getElementById("pushScheduleAnswer").checked,
    push_url: document.getElementById("pushUrl").value.trim() || null,
  };
  if (!payload.push_time) return toast("请选择每天推送时间");
  setButtonBusy(button, true, "保存中...");
  try {
    const data = await request("/push/settings", { method: "PUT", body: JSON.stringify(payload) });
    document.getElementById("pushUrl").value = "";
    showPushResult("pushSettingsResult", `<strong>定时配置已保存</strong><span>${escapeHtml(data.next_push_at ? `下次执行：${data.next_push_at.replace("T", " ")}（北京时间）` : "定时任务已暂停")}</span>`);
    toast("定时配置已保存");
    loadPushSettings();
  } catch (error) {
    showPushResult("pushSettingsResult", `<strong>保存失败</strong><span>${escapeHtml(error.message)}</span>`, "error");
  } finally { setButtonBusy(button, false); }
});

document.getElementById("customPushForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.getElementById("customPushButton");
  const title = document.getElementById("pushTitle").value.trim();
  const content = document.getElementById("pushContent").value.trim();
  if (!title || !content) return toast("请填写消息标题和正文");
  setButtonBusy(button, true, "正在推送...");
  try {
    const data = await request("/push/custom", { method: "POST", body: JSON.stringify({ title, content }) });
    showPushResult("customPushResult", `<strong>${escapeHtml(data.message)}</strong><span>${escapeHtml(title)}</span>`);
    toast(data.message);
  } catch (error) {
    showPushResult("customPushResult", `<strong>推送失败</strong><span>${escapeHtml(error.message)}</span>`, "error");
  } finally { setButtonBusy(button, false); }
});

document.getElementById("randomPushForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.getElementById("randomPushButton");
  const bankId = document.getElementById("pushBank").value || null;
  const includeAnswer = document.getElementById("pushIncludeAnswer").checked;
  setButtonBusy(button, true, "正在抽题...");
  try {
    const data = await request("/push/random-question", { method: "POST", body: JSON.stringify({ bank_id: bankId, include_answer: includeAnswer }) });
    showPushResult("randomPushResult", `<strong>${escapeHtml(data.message)} · ${escapeHtml(data.bank.name)}</strong><span>${escapeHtml(cleanSegmentLabel(data.question.title))}</span>`);
    toast(data.message);
  } catch (error) {
    showPushResult("randomPushResult", `<strong>推送失败</strong><span>${escapeHtml(error.message)}</span>`, "error");
  } finally { setButtonBusy(button, false); }
});
document.getElementById("loginForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target).entries());
  try {
    const data = await fetch(api + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json());
    if (!data.token) throw new Error(data.detail || zh.loginFailed);
    localStorage.setItem("jianwei_token", data.token);
    toast(zh.loginSuccess);
    init();
  } catch (error) { toast(error.message); }
});
document.getElementById("registerForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.target.querySelector('button[type="submit"]');
  const payload = Object.fromEntries(new FormData(event.target).entries());
  setButtonBusy(button, true, "注册中...");
  try {
    const data = await fetch(api + "/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(async (response) => {
      const result = await response.json().catch(() => ({ detail: zh.requestFailed }));
      if (!response.ok) throw new Error(result.detail || zh.requestFailed);
      return result;
    });
    localStorage.setItem("jianwei_token", data.token);
    toast(data.message || "注册成功");
    window.location.replace("/?page=ai-settings");
  } catch (error) { toast(error.message); }
  finally { setButtonBusy(button, false); }
});

function formatDateTime(timestamp) {
  if (!timestamp) return "-";
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(Number(timestamp) * 1000));
}

function inviteStatusLabel(status) {
  return ({ active: "可使用", used: "已使用", expired: "已过期", revoked: "已撤销" })[status] || status;
}

async function loadAdminData() {
  const userList = document.getElementById("adminUserList");
  const inviteList = document.getElementById("adminInviteList");
  if (!userList || !inviteList) return;
  try {
    const [users, invites] = await Promise.all([request("/admin/users"), request("/admin/invites")]);
    document.getElementById("adminUserCount").textContent = users.total;
    document.getElementById("adminInviteCount").textContent = invites.items.filter((item) => item.status === "active").length;
    document.getElementById("adminDisabledCount").textContent = users.items.filter((item) => !item.active).length;
    userList.innerHTML = users.items.map((user) => `<article class="admin-row"><div class="admin-row-main"><span class="role-badge ${user.role}">${user.role === "admin" ? "管理员" : "普通用户"}</span><div><strong>${escapeHtml(user.username)}</strong><small>注册：${escapeHtml(formatDateTime(user.created_at))} · 最近登录：${escapeHtml(formatDateTime(user.last_login_at))}</small></div></div><div class="admin-row-action"><span class="status-badge ${user.active ? "active" : "disabled"}">${user.active ? "正常" : "已停用"}</span>${user.role === "admin" ? "" : `<button class="${user.active ? "danger" : "ghost"}" onclick="setUserActive('${escapeAttr(user.username)}',${user.active ? "false" : "true"})">${user.active ? "停用" : "启用"}</button>`}</div></article>`).join("") || `<div class="empty">暂无用户</div>`;
    inviteList.innerHTML = invites.items.map((invite) => `<article class="admin-row"><div class="admin-row-main"><span class="status-badge ${escapeAttr(invite.status)}">${escapeHtml(inviteStatusLabel(invite.status))}</span><div><strong>${escapeHtml(invite.code_masked)}</strong><small>${escapeHtml(invite.note || "无备注")} · 到期：${escapeHtml(formatDateTime(invite.expires_at))}${invite.used_by ? ` · 使用人：${escapeHtml(invite.used_by)}` : ""}</small></div></div>${invite.status === "active" ? `<button class="danger" onclick="revokeInvite('${invite.id}')">撤销</button>` : ""}</article>`).join("") || `<div class="empty">暂无邀请码</div>`;
  } catch (error) {
    userList.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
    inviteList.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
  }
}

function renderMetricWindow(data) {
  const rows = [
    ["API 请求", data.requests], ["5xx 错误", `${data.errors_5xx} (${(Number(data.error_rate || 0) * 100).toFixed(2)}%)`],
    ["平均延迟", `${data.latency_ms?.avg || 0} ms`], ["P95 延迟", `${data.latency_ms?.p95 || 0} ms`],
    ["RAG 检索", data.searches], ["平均检索耗时", `${data.avg_search_latency_ms || 0} ms`],
    ["空召回率", `${(Number(data.empty_recall_rate || 0) * 100).toFixed(2)}%`],
    ["Top1 平均分", Number(data.avg_top1_score || 0).toFixed(3)],
  ];
  return rows.map(([label, value]) => `<div class="metric-row"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`).join("");
}

async function loadAdminMetrics() {
  const target = document.getElementById("metrics24h");
  if (!target) return;
  try {
    const data = await request("/admin/metrics");
    document.getElementById("metricKnowledge").textContent = `${data.knowledge.questions} / ${data.knowledge.banks}`;
    document.getElementById("metricUsers").textContent = `${data.users.active}`;
    document.getElementById("metricHealth").textContent = "正常";
    target.innerHTML = renderMetricWindow(data.windows["24h"]);
    document.getElementById("metrics7d").innerHTML = renderMetricWindow(data.windows["7d"]);
    document.getElementById("metricsTargets").innerHTML = `<span>可用性目标 ${escapeHtml(data.targets.availability)}</span><span>API P95 ${escapeHtml(data.targets.api_p95_ms)}</span><span>空召回目标 ${escapeHtml(data.targets.empty_recall_rate)}</span><span>Top1 目标 ${escapeHtml(data.targets.top1_score)}</span><small>Recall@3、MRR 和幻觉率仍需人工标注评测集统计。</small>`;
  } catch (error) {
    target.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
  }
}

document.getElementById("inviteCreateForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.getElementById("inviteCreateButton");
  const form = new FormData(event.target);
  const payload = { note: form.get("note") || "", expires_in_days: Number(form.get("expires_in_days")) };
  setButtonBusy(button, true, "生成中...");
  try {
    const data = await request("/admin/invites", { method: "POST", body: JSON.stringify(payload) });
    document.getElementById("newInviteCode").textContent = data.code;
    document.getElementById("newInviteResult").classList.remove("hidden");
    toast(data.message);
    loadAdminData();
  } catch (error) { toast(error.message); }
  finally { setButtonBusy(button, false); }
});

async function copyInviteCode() {
  const code = document.getElementById("newInviteCode")?.textContent || "";
  if (!code) return;
  try { await navigator.clipboard.writeText(code); toast("邀请码已复制"); }
  catch { toast("复制失败，请手动选择邀请码"); }
}

async function revokeInvite(id) {
  if (!confirm("确认撤销这个邀请码吗？")) return;
  try { const data = await request(`/admin/invites/${id}`, { method: "DELETE" }); toast(data.message); loadAdminData(); }
  catch (error) { toast(error.message); }
}

async function setUserActive(username, active) {
  if (!confirm(`${active ? "启用" : "停用"}用户 ${username}？`)) return;
  try { const data = await request(`/admin/users/${encodeURIComponent(username)}`, { method: "PATCH", body: JSON.stringify({ active }) }); toast(data.message); loadAdminData(); }
  catch (error) { toast(error.message); }
}
async function loadBanks() {
  const data = await request("/banks");
  banks = data.items || [];
  fillSelects();
  renderBanks();
}
async function askAi() {
  const query = document.getElementById("askQuery").value.trim();
  if (!query) return toast(zh.inputQuestion);
  const box = document.getElementById("askResult");
  const sourcesBox = document.getElementById("askSources");
  const button = document.getElementById("askButton");
  const trace = document.querySelectorAll("#askTrace .flow-step");
  trace.forEach((item, index) => item.classList.toggle("active", index === 1));
  setButtonBusy(button, true, zh.searching);
  box.className = "output";
  box.innerHTML = `<div class='empty'>正在检索题库并生成回答…</div>`;
  if (sourcesBox) { sourcesBox.className = "source-list empty"; sourcesBox.innerHTML = `<p>正在查找最相关的 3 条题目…</p>`; }
  try {
    const data = await request("/ask", { method: "POST", body: JSON.stringify({ query, bank_id: bankValue() }) });
    const answer = data.answer || {};
    trace.forEach((item, index) => item.classList.toggle("active", index >= 2));
    box.innerHTML = `<article class="answer-card"><div class="answer-top"><h3>${zh.qaResult}</h3><span>${confidenceLabel(answer.confidence)}</span></div>${renderContentBlock(zh.answerGenerated, answer.answer || "", "answer-block")}<div class="summary-box"><strong>${zh.sourceSummary}</strong><div class="markdown">${renderMarkdown(answer.sources_summary || "")}</div></div></article>`;
    if (sourcesBox) {
      sourcesBox.className = "source-list";
      sourcesBox.innerHTML = (data.sources || []).length ? data.sources.map(renderSourceCard).join("") : `<div class="empty">没有找到可展示的来源</div>`;
    }
  } catch (error) {
    box.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
    if (sourcesBox) sourcesBox.innerHTML = `<div class="empty">检索失败，请稍后重试</div>`;
  } finally {
    setButtonBusy(button, false);
    trace.forEach((item, index) => item.classList.toggle("active", index === 3));
  }
}
function confidenceLabel(value) {
  const score = Number(value || 0);
  if (score >= .75) return "高置信度";
  if (score >= .45) return "中等置信度";
  return "需核对来源";
}
function renderSourceCard(item, index) {
  const title = cleanSegmentLabel(item.question || "未命名题目");
  const sourceText = item.matched_chunk || item.answer || "";
  const preview = cleanSegmentLabel(sourceText).replace(/\s+/g, " ").slice(0, 180);
  const chunkLabel = item.matched_chunk ? `<span class="source-chunk-label">命中子块 / 共 ${Number(item.chunk_count || 0)} 块</span>` : "";
  return `<details class="source-card" ${index === 0 ? "open" : ""}><summary><h3>${index + 1}. ${escapeHtml(title)}</h3><span class="source-score">${(Number(item.score || 0) * 100).toFixed(1)}%</span></summary><div class="source-meta">${escapeHtml(metaLine(item) || "未分类")}${chunkLabel}</div><div class="source-preview">${escapeHtml(preview)}${sourceText.length > 180 ? "…" : ""}</div></details>`;
}
async function compareSearch() {
  const query = document.getElementById("compareQuery").value.trim();
  if (!query) return toast(zh.inputSearch);
  const payload = {
    query,
    bank_id: bankValue(),
    limit: 3,
    semantic_weight: Number(document.getElementById("semanticWeight").value),
    keyword_weight: Number(document.getElementById("keywordWeight").value),
    min_score: Number(document.getElementById("minScore").value)
  };
  const mode = document.getElementById("compareMode").value;
  const box = document.getElementById("compareResult");
  box.innerHTML = `<div class='empty'>${zh.searching}</div>`;
  try {
    if (mode === "all") {
      const data = await request("/search/compare", { method: "POST", body: JSON.stringify(payload) });
      box.innerHTML = ["semantic", "keyword", "hybrid"].map((key) => `<section class="compare-col"><h3>${{ semantic: zh.semantic, keyword: zh.keyword, hybrid: zh.hybrid }[key]}</h3><div class="result-grid">${(data[key] || []).map(renderResultCard).join("")}</div></section>`).join("");
    } else {
      const data = await request("/search", { method: "POST", body: JSON.stringify({ ...payload, mode }) });
      box.innerHTML = `<section class="compare-col wide"><h3>${{ semantic: zh.semantic, keyword: zh.keyword, hybrid: zh.hybrid }[mode]}</h3><div class="result-grid">${(data.items || []).map(renderResultCard).join("")}</div></section>`;
    }
  } catch (error) { box.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`; }
}
function updateInterviewMode(mode) {
  interviewMode = mode === "general" ? "general" : "project";
  document.getElementById("projectModeButton")?.classList.toggle("active", interviewMode === "project");
  document.getElementById("generalModeButton")?.classList.toggle("active", interviewMode === "general");
  document.getElementById("projectInterviewConfig")?.classList.toggle("hidden", interviewMode !== "project");
  document.getElementById("generalInterviewConfig")?.classList.toggle("hidden", interviewMode !== "general");
  const bankLabel = document.getElementById("interviewBankLabel");
  const notes = document.getElementById("interviewModeNotes");
  const button = document.getElementById("startInterviewButton");
  if (bankLabel) bankLabel.firstChild.textContent = interviewMode === "project" ? "\u4fdd\u5b58\u5230\u9898\u5e93" : "\u62bd\u9898\u9898\u5e93";
  if (notes) notes.innerHTML = interviewMode === "project"
    ? "<li>\u57fa\u4e8e\u9879\u76ee\u5185\u5bb9\u751f\u6210 6 \u9053\u538b\u529b\u9898</li><li>\u6700\u591a\u4e24\u8f6e\u9012\u8fdb\u8ffd\u95ee</li><li>\u786e\u8ba4\u540e\u518d\u4fdd\u5b58\u5230\u9898\u5e93</li>"
    : "<li>\u4ece\u5f53\u524d\u9898\u5e93\u968f\u673a\u62bd\u53d6 6 \u9898</li><li>\u56de\u7b54\u540e\u5c55\u793a\u8bc4\u5206\u548c\u6807\u51c6\u7b54\u6848</li><li>\u6700\u591a\u4e24\u8f6e\u8ffd\u95ee</li>";
  if (button) button.textContent = interviewMode === "project" ? "\u751f\u6210\u9879\u76ee\u9762\u8bd5" : "\u5f00\u59cb\u9898\u5e93\u9762\u8bd5";
}
function updateProjectFileName() {
  const file = document.getElementById("projectFile")?.files?.[0];
  const label = document.getElementById("projectFileName");
  if (label) label.textContent = file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : "\u652f\u6301 PDF\u3001Word\u3001Markdown\u3001TXT\u3001JSON\u3001CSV\uff0c\u6700\u5927 10 MB";
}
async function startInterview() {
  const button = document.getElementById("startInterviewButton");
  setButtonBusy(button, true, interviewMode === "project" ? zh.generatingInterview : zh.searching);
  try {
    if (interviewMode === "project") {
      const projectInfo = document.getElementById("projectInfo")?.value.trim() || "";
      const file = document.getElementById("projectFile")?.files?.[0];
      if (!projectInfo && !file) return toast(zh.projectInfoRequired);
      if (file && file.size > 10 * 1024 * 1024) return toast("\u9879\u76ee\u6587\u6863\u4e0d\u80fd\u8d85\u8fc7 10 MB");
      const form = new FormData();
      form.append("project_title", document.getElementById("projectTitle")?.value.trim() || "");
      form.append("project_info", projectInfo);
      form.append("bank_id", bankValue());
      form.append("user_id", "default");
      if (file) form.append("file", file);
      currentInterview = await requestRaw("/project-interviews/start", { method: "POST", body: form });
    } else {
      currentInterview = await request("/interviews/start", { method: "POST", body: JSON.stringify({ bank_id: bankValue(), user_id: "default" }) });
    }
    currentQuestionIndex = 0;
    renderInterview();
    document.getElementById("interviewBoard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) { toast(error.message); }
  finally { setButtonBusy(button, false); }
}
function renderInterview() {
  const board = document.getElementById("interviewBoard");
  if (!currentInterview) { board.innerHTML = `<div class='empty'>${zh.noInterview}</div>`; return; }
  const question = currentInterview.questions[currentQuestionIndex];
  if (!question) { renderInterviewReport(); return; }
  board.className = "interview-board";
  const modeLabel = currentInterview.mode === "project" ? `\u9879\u76ee\u6df1\u6316 · ${escapeHtml(currentInterview.project_title || "")}` : "\u901a\u7528\u9898\u5e93";
  board.innerHTML = `<section class="interview-question"><div class="progress"><span>${modeLabel}</span><b>${zh.nth} ${currentQuestionIndex + 1} / ${currentInterview.questions.length} ${zh.item}</b></div>${renderContentBlock(zh.question, question.question || "", "question-block single")}
    <p class="interview-note">${zh.interviewNote}</p><textarea id="candidateAnswer" placeholder="${zh.inputAnswer}"></textarea><div class="actions"><button id="interviewSubmitButton" onclick="submitInterviewAnswer('${question.id}',0,'${escapeAttr(question.question)}')">${zh.submitAnswer}</button><button class="ghost" onclick="nextInterviewQuestion()">${zh.skip}</button></div><div id="interviewFeedback"></div></section>`;
}
function renderEvaluationDimensions(dimensions = {}) {
  const labels = { authenticity: "\u771f\u5b9e\u6027", architecture: "\u67b6\u6784", troubleshooting: "\u6392\u969c", tradeoff: "\u53d6\u820d", communication: "\u8868\u8fbe" };
  const entries = Object.entries(dimensions || {});
  if (!entries.length) return "";
  return `<div class="dimension-grid">${entries.map(([key, value]) => `<div><span>${escapeHtml(labels[key] || key)}</span><strong>${Number(value || 0).toFixed(0)}</strong><i><b style="width:${Math.max(0, Math.min(100, Number(value || 0)))}%"></b></i></div>`).join("")}</div>`;
}
async function submitInterviewAnswer(questionId, depth, prompt) {
  const answer = document.getElementById("candidateAnswer").value.trim();
  if (!answer) return toast(zh.inputAnswer);
  const feedback = document.getElementById("interviewFeedback");
  const submitButton = document.getElementById("interviewSubmitButton");
  setButtonBusy(submitButton, true, zh.evaluating);
  feedback.innerHTML = `<div class='empty'>${zh.evaluating}</div>`;
  try {
    const data = await request(`/interviews/${currentInterview.id}/answer`, { method: "POST", body: JSON.stringify({ question_id: questionId, prompt, answer, depth }) });
    const evaluation = data.evaluation || {};
    const saveCurrentButton = currentInterview.mode === "project" ? `<button class="ghost" onclick="saveCurrentQuestion('${data.id}')">${zh.saveCurrent}</button>` : "";
    feedback.innerHTML = `<article class="feedback-card"><div class="answer-top"><h3>${zh.score} ${escapeHtml(evaluation.score ?? "-")}</h3><span>${escapeHtml(evaluation.feedback || "")}</span></div>${renderEvaluationDimensions(evaluation.dimensions)}${renderContentBlock(zh.standardAnswer, evaluation.correct_answer || "", "answer-block single")}<div class="result-grid">${(evaluation.strengths || []).map((item) => `<div class="pill good">${escapeHtml(item)}</div>`).join("")}${(evaluation.weaknesses || []).map((item) => `<div class="pill warn">${escapeHtml(item)}</div>`).join("")}</div>${data.follow_up ? `<div class="follow-up"><h4>${zh.followUp}</h4><div class="markdown">${renderMarkdown(data.follow_up)}</div><textarea id="candidateAnswer" placeholder="${zh.answerFollowUp}"></textarea><div class="actions"><button id="interviewSubmitButton" onclick="submitInterviewAnswer('${questionId}',${data.next_depth},'${escapeAttr(data.follow_up)}')">${zh.continueFollowUp}</button>${saveCurrentButton}<button class="ghost" onclick="saveFollowUp('${data.id}')">${zh.saveToBank}</button><button onclick="nextInterviewQuestion()">${zh.next}</button></div></div>` : `<div class="actions">${saveCurrentButton}<button onclick="nextInterviewQuestion()">${zh.next}</button></div>`}</article>`;
  } catch (error) { feedback.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`; }
  finally { setButtonBusy(submitButton, false); }
}
async function saveFollowUp(turnId) {
  try {
    await request(`/interview-turns/${turnId}/save-question?bank_id=${encodeURIComponent(bankValue())}`, { method: "POST" });
    toast(zh.savedFollowUp);
    loadBanks();
  } catch (error) { toast(error.message); }
}
async function saveCurrentQuestion(turnId) {
  try {
    await request(`/interview-turns/${turnId}/save-current-question?bank_id=${encodeURIComponent(bankValue())}`, { method: "POST" });
    toast(zh.savedQuestion);
    loadBanks();
  } catch (error) { toast(error.message); }
}
async function renderInterviewReport() {
  const board = document.getElementById("interviewBoard");
  board.className = "interview-board";
  board.innerHTML = `<div class="empty">${zh.evaluating}</div>`;
  try {
    const report = await request(`/interviews/${currentInterview.id}/report`);
    const strengths = (report.strengths || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("") || `<li>\u5b8c\u6210\u66f4\u591a\u56de\u7b54\u540e\u751f\u6210</li>`;
    const weaknesses = (report.weaknesses || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("") || `<li>\u5b8c\u6210\u66f4\u591a\u56de\u7b54\u540e\u751f\u6210</li>`;
    board.innerHTML = `<section class="interview-report"><div class="report-score"><span>${zh.reportTitle}</span><strong>${Number(report.score || 0).toFixed(1)}</strong><small>${zh.answeredTurns} ${report.answered_turns}</small></div>${renderEvaluationDimensions(report.dimensions)}<div class="report-columns"><article><h3>${zh.strengthsLabel}</h3><ul>${strengths}</ul></article><article><h3>${zh.weaknessesLabel}</h3><ul>${weaknesses}</ul></article></div><div class="actions"><button onclick="restartInterview()">${zh.restartInterview}</button></div></section>`;
  } catch (error) { board.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`; }
}
function restartInterview() {
  currentInterview = null;
  currentQuestionIndex = 0;
  const board = document.getElementById("interviewBoard");
  board.className = "interview-board empty";
  board.innerHTML = `<div class="welcome-state"><span>◎</span><h2>\u51c6\u5907\u597d\u540e\u5f00\u59cb</h2><p>\u9009\u62e9\u4e0a\u65b9\u9762\u8bd5\u65b9\u5f0f\uff0c\u5f00\u59cb\u65b0\u4e00\u8f6e\u7ec3\u4e60\u3002</p></div>`;
  board.scrollIntoView({ behavior: "smooth", block: "start" });
}
function nextInterviewQuestion() { currentQuestionIndex += 1; renderInterview(); }
async function loadQuestions() {
  const keyword = document.getElementById("manageKeyword")?.value || "";
  const bank = document.getElementById("manageBank")?.value || "";
  const [data, stats] = await Promise.all([request(`/questions?keyword=${encodeURIComponent(keyword)}&bank_id=${encodeURIComponent(bank)}`), request("/stats")]);
  document.getElementById("totalCount").textContent = stats.total;
  document.getElementById("bankCount").textContent = stats.banks;
  const list = document.getElementById("questionList");
  list.innerHTML = data.items.length ? data.items.map(renderQuestionRow).join("") : `<div class='empty'>${zh.noQuestions}</div>`;
}
function openEditModal(title, value, onSave) {
  const modal = document.getElementById("editModal");
  const modalTitle = document.getElementById("editModalTitle");
  const modalText = document.getElementById("editModalText");
  const saveButton = document.getElementById("editModalSave");
  modalTitle.textContent = title;
  modalText.value = value || "";
  modal.classList.remove("hidden");
  modalText.focus();
  modalSaveHandler = onSave;
  saveButton.onclick = async () => {
    if (!modalSaveHandler) return;
    await modalSaveHandler(modalText.value);
    closeEditModal();
  };
}
function closeEditModal() {
  const modal = document.getElementById("editModal");
  if (modal) modal.classList.add("hidden");
  modalSaveHandler = null;
}
async function editQuestionText(id) {
  const item = await request(`/questions/${id}`);
  openEditModal(zh.editQuestionMd, item.question || "", async (question) => {
    await request(`/questions/${id}`, { method: "PUT", body: JSON.stringify({ question }) });
    toast(zh.updatedQuestion);
    loadQuestions();
  });
}
async function editAnswerText(id) {
  const item = await request(`/questions/${id}`);
  openEditModal(zh.editAnswerMd, item.answer || "", async (answer) => {
    await request(`/questions/${id}`, { method: "PUT", body: JSON.stringify({ answer }) });
    toast(zh.updatedAnswer);
    loadQuestions();
  });
}
async function openQuestionEditor(id) {
  const item = await request(`/questions/${id}`);
  const category = prompt(zh.editCategory, item.category || "");
  if (category === null) return;
  const difficulty = prompt(zh.editDifficulty, item.difficulty || "");
  if (difficulty === null) return;
  const position = prompt(zh.editPosition, item.position || "");
  if (position === null) return;
  const tags = prompt(zh.editTags, (item.tags || []).join(","));
  if (tags === null) return;
  const keywords = prompt(zh.editKeywords, (item.keywords || []).join(","));
  if (keywords === null) return;
  try {
    await request(`/questions/${id}`, { method: "PUT", body: JSON.stringify({ category, difficulty, position, tags: splitList(tags), keywords: splitList(keywords) }) });
    toast(zh.tagsUpdated);
    loadQuestions();
  } catch (error) { toast(error.message); }
}
async function autoTags(id) {
  try { await request(`/questions/${id}/auto-tags`, { method: "POST" }); toast(zh.tagged); loadQuestions(); }
  catch (error) { toast(error.message); }
}
async function deleteQuestion(id) {
  if (!confirm(zh.confirmDeleteQuestion)) return;
  try { await request(`/questions/${id}`, { method: "DELETE" }); toast(zh.deleteSuccess); loadQuestions(); loadBanks(); }
  catch (error) { toast(error.message); }
}
async function loadReviews(scope) {
  const list = document.getElementById("reviewList");
  document.getElementById("reviewTitle").textContent = scope === "yesterday" ? zh.yesterdayReview : zh.todayReview;
  try {
    const data = await request(`/reviews?user_id=default&scope=${scope}&limit=30`);
    document.getElementById("reviewMeta").textContent = `${data.total} ${zh.item} / ${zh.interviewReviewOnly}`;
    if (!data.items.length) { list.innerHTML = `<div class='empty'>${zh.noInterviewReview}</div>`; return; }
    list.innerHTML = data.items.map((item) => `<article class="review-card"><div class="review-head"><span class="tag">${escapeHtml(item.category)}</span><strong>${escapeHtml(cleanSegmentLabel(item.question))}</strong></div><p>${zh.recall} ${(Number(item.recall_probability || 0) * 100).toFixed(1)}% / ${zh.stability} ${Number(item.stability || 0).toFixed(1)} / ${zh.difficulty} ${Number(item.difficulty_factor || 0).toFixed(1)}</p>${renderQuestionAnswerBlocks(item)}${scope === "today" ? `<div class="rating-actions"><button onclick="submitReview('${item.id}','again')">${zh.again}</button><button onclick="submitReview('${item.id}','hard')">${zh.hard}</button><button onclick="submitReview('${item.id}','good')">${zh.good}</button><button onclick="submitReview('${item.id}','easy')">${zh.easy}</button></div>` : ""}</article>`).join("");
  } catch (error) { list.innerHTML = `<div class='empty'>${escapeHtml(error.message)}</div>`; }
}
async function submitReview(id, rating) {
  try { const data = await request(`/reviews/${id}`, { method: "POST", body: JSON.stringify({ user_id: "default", rating }) }); toast(`${zh.nextInterval} ${data.interval_days} ${zh.days}`); loadReviews("today"); }
  catch (error) { toast(error.message); }
}
async function editBank(id, name, description) {
  const nextName = prompt(zh.bankName, name);
  if (nextName === null) return;
  const nextDescription = prompt(zh.bankDesc, description);
  if (nextDescription === null) return;
  try { await request(`/banks/${id}`, { method: "PUT", body: JSON.stringify({ name: nextName, description: nextDescription }) }); toast(zh.bankUpdated); loadBanks(); }
  catch (error) { toast(error.message); }
}
async function deleteBank(id) {
  if (!confirm(zh.confirmDeleteBank)) return;
  try { await request(`/banks/${id}`, { method: "DELETE" }); toast(zh.bankDeleted); loadBanks(); }
  catch (error) { toast(error.message); }
}
document.getElementById("bankForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(event.target).entries());
  try { await request("/banks", { method: "POST", body: JSON.stringify(payload) }); toast(zh.bankCreated); event.target.reset(); loadBanks(); }
  catch (error) { toast(error.message); }
});
document.getElementById("questionForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const payload = Object.fromEntries(form.entries());
  payload.keywords = splitList(payload.keywords);
  payload.tags = splitList(payload.tags);
  try { await request("/questions", { method: "POST", body: JSON.stringify(payload) }); toast(zh.questionSaved); event.target.reset(); loadBanks(); }
  catch (error) { toast(error.message); }
});
document.getElementById("manageBank")?.addEventListener("change", () => loadQuestions());
document.getElementById("importForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = document.getElementById("importFile").files[0];
  const result = document.getElementById("importResult");
  const progressBar = document.getElementById("importProgressBar");
  const progressText = document.getElementById("importProgressText");
  const submitButton = event.target.querySelector('button[type="submit"]');
  if (!file) return toast(zh.chooseFile);
  const form = new FormData();
  form.append("file", file);
  appendImportSettings(form);
  setButtonBusy(submitButton, true, "解析中...");
  if (result) result.innerHTML = `<div class="import-result pending"><strong>${escapeHtml(file.name)}</strong> - 正在解析题目结构...</div>`;
  if (progressBar) progressBar.style.width = "45%";
  if (progressText) progressText.textContent = "正在解析";
  try {
    const data = await requestRaw("/import/preview", { method: "POST", body: form });
    importPreviewState = {
      file,
      items: data.items || [],
      selected: new Set((data.items || []).filter((item) => item.valid).map((item) => item.index)),
      filter: ""
    };
    if (progressBar) progressBar.style.width = "100%";
    if (progressText) progressText.textContent = `解析完成 · ${data.valid_total}/${data.total} 题可导入`;
    if (result) result.innerHTML = `<div class="import-result success"><strong>解析完成</strong>：预计生成 ${Number(data.estimated_chunks || 0)} 个检索块，可在下方逐题选择。</div>`;
    renderImportPreview();
    document.getElementById("importPreviewPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    if (progressBar) progressBar.style.width = "0%";
    if (progressText) progressText.textContent = "解析失败";
    if (result) result.innerHTML = `<div class="import-result error"><strong>解析失败</strong>: ${escapeHtml(error.message)}</div>`;
    toast(error.message);
  } finally { setButtonBusy(submitButton, false); }
});

async function confirmSelectedImport() {
  const file = importPreviewState.file;
  const selected = [...importPreviewState.selected].sort((a, b) => a - b);
  if (!file) return toast("请先解析题库文件");
  if (!selected.length) return toast("请至少选择一道题目");
  const button = document.getElementById("confirmImportButton");
  const result = document.getElementById("importResult");
  const progressBar = document.getElementById("importProgressBar");
  const progressText = document.getElementById("importProgressText");
  const form = new FormData();
  form.append("file", file);
  form.append("bank_id", document.getElementById("importBank")?.value || "");
  form.append("selected_indices", JSON.stringify(selected));
  appendImportSettings(form);
  setButtonBusy(button, true, "导入中...");
  if (progressBar) progressBar.style.width = "55%";
  if (progressText) progressText.textContent = `正在导入 ${selected.length} 题`;
  try {
    const data = await requestRaw("/import", { method: "POST", body: form });
    const errors = data.errors || [];
    const errorHtml = errors.length ? `<ul class="import-error-list">${errors.map((item) => `<li>${zh.failed} ${escapeHtml(item.row)}: ${escapeHtml(item.detail || item.message || "")}</li>`).join("")}</ul>` : "";
    if (progressBar) progressBar.style.width = "100%";
    if (progressText) progressText.textContent = `导入完成 · ${data.created_questions} 题 / ${data.created_chunks} 子块`;
    if (result) result.innerHTML = `<div class="import-result success"><strong>${zh.importResult}</strong>：题目 ${Number(data.created_questions || 0)} 道，子块 ${Number(data.created_chunks || 0)} 个，跳过 ${Number(data.skipped || 0)} 道，失败 ${errors.length} 道${errorHtml}</div>`;
    toast("所选题目已导入并建立父子索引");
    clearImportPreview();
    loadBanks();
  } catch (error) {
    if (progressText) progressText.textContent = "导入失败";
    if (result) result.innerHTML = `<div class="import-result error"><strong>${zh.uploadFailed}</strong>: ${escapeHtml(error.message)}</div>`;
    toast(error.message);
  } finally { setButtonBusy(button, false); }
}
function renderResultCard(item) {
  return `<article class="mini-result"><div class="mini-head"><strong>${zh.match}</strong><span>${(Number(item.score || 0) * 100).toFixed(1)}%</span></div>${renderQuestionAnswerBlocks(item)}<div class="meta-line">${metaLine(item)}</div><div class="meta-line">${renderTags(item.tags || [])}</div></article>`;
}
init();

document.getElementById("askQuery")?.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") askAi();
});

function filterNav() {
  const input = document.getElementById("navFilter");
  const keyword = (input?.value || "").trim().toLowerCase();
  document.querySelectorAll(".nav-menu a").forEach((link) => {
    const text = `${link.dataset.title || ""} ${link.textContent || ""}`.toLowerCase();
    link.style.display = !keyword || text.includes(keyword) ? "grid" : "none";
  });
}
