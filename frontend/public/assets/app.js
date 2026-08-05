const api = "/api";
let banks = [];
let currentInterview = null;
let currentQuestionIndex = 0;
let modalSaveHandler = null;

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
  importResult: "\u5bfc\u5165\u7ed3\u679c"
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
  document.getElementById("loginView").style.display = "grid";
  document.getElementById("appView").style.display = "none";
}
function showApp() {
  document.getElementById("loginView").style.display = "none";
  document.getElementById("appView").style.display = "block";
}
function logout() { localStorage.removeItem("jianwei_token"); showLogin(); }
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}
function escapeAttr(value) { return escapeHtml(value).replace(/`/g, "&#96;"); }
function splitList(value) {
  return String(value || "").split(/[,\uFF0C\u3001\n]+/).map((item) => item.trim()).filter(Boolean);
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
  const bankCount = document.getElementById("bankCount");
  if (bankCount) bankCount.textContent = String(banks.length);
}
function renderBanks() {
  const list = document.getElementById("bankList");
  if (!list) return;
  list.innerHTML = banks.length ? banks.map((bank) => `<article class="bank-card"><strong>${escapeHtml(bank.name)}</strong><p>${escapeHtml(bank.description || "")}</p><span>${bank.question_count} ${zh.item}</span><div class="bank-actions"><button class="ghost" onclick="editBank('${bank.id}','${escapeAttr(bank.name)}','${escapeAttr(bank.description || "")}')">${zh.edit}</button><button class="ghost" onclick="deleteBank('${bank.id}')">${zh.del}</button></div></article>`).join("") : `<div class="empty">${zh.noBanks}</div>`;
}
async function init() {
  if (!token()) { showLogin(); return; }
  showApp();
  try {
    const health = await fetch("/health").then((r) => r.json());
    document.getElementById("health").textContent = `${health.name} ${health.version}`;
  } catch { document.getElementById("health").textContent = zh.serviceDown; }
  await loadBanks();
  if (document.getElementById("questionList")) loadQuestions();
  if (document.getElementById("reviewList")) loadReviews("today");
}
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
  box.className = "output";
  box.innerHTML = `<div class='empty'>${zh.searching}</div>`;
  try {
    const data = await request("/ask", { method: "POST", body: JSON.stringify({ query, bank_id: bankValue() }) });
    const answer = data.answer || {};
    box.innerHTML = `<article class="answer-card"><div class="answer-top"><h3>${zh.qaResult}</h3><span>${zh.confidence} ${Number(answer.confidence || 0).toFixed(2)}</span></div>${renderContentBlock(zh.answerGenerated, answer.answer || "", "answer-block")}<div class="summary-box"><strong>${zh.sourceSummary}</strong><div class="markdown">${renderMarkdown(answer.sources_summary || "")}</div></div><h3>${zh.topSources}</h3><div class="result-grid">${(data.sources || []).map(renderResultCard).join("")}</div></article>`;
  } catch (error) { box.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`; }
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
async function startInterview() {
  try {
    currentInterview = await request("/interviews/start", { method: "POST", body: JSON.stringify({ bank_id: bankValue(), user_id: "default" }) });
    currentQuestionIndex = 0;
    renderInterview();
  } catch (error) { toast(error.message); }
}
function renderInterview() {
  const board = document.getElementById("interviewBoard");
  if (!currentInterview) { board.innerHTML = `<div class='empty'>${zh.noInterview}</div>`; return; }
  const question = currentInterview.questions[currentQuestionIndex];
  if (!question) { board.innerHTML = `<div class='empty'>${zh.interviewEnd}</div>`; return; }
  board.className = "interview-board";
  board.innerHTML = `<section class="interview-question"><div class="progress">${zh.nth} ${currentQuestionIndex + 1} / ${currentInterview.questions.length} ${zh.item}</div>${renderContentBlock(zh.question, question.question || "", "question-block single")}
    <p class="interview-note">${zh.interviewNote}</p><textarea id="candidateAnswer" placeholder="${zh.inputAnswer}"></textarea><div class="actions"><button onclick="submitInterviewAnswer('${question.id}',0,'${escapeAttr(question.question)}')">${zh.submitAnswer}</button><button class="ghost" onclick="nextInterviewQuestion()">${zh.skip}</button></div><div id="interviewFeedback"></div></section>`;
}
async function submitInterviewAnswer(questionId, depth, prompt) {
  const answer = document.getElementById("candidateAnswer").value.trim();
  if (!answer) return toast(zh.inputAnswer);
  const feedback = document.getElementById("interviewFeedback");
  feedback.innerHTML = `<div class='empty'>${zh.evaluating}</div>`;
  try {
    const data = await request(`/interviews/${currentInterview.id}/answer`, { method: "POST", body: JSON.stringify({ question_id: questionId, prompt, answer, depth }) });
    const evaluation = data.evaluation || {};
    feedback.innerHTML = `<article class="feedback-card"><div class="answer-top"><h3>${zh.score} ${escapeHtml(evaluation.score ?? "-")}</h3><span>${escapeHtml(evaluation.feedback || "")}</span></div>${renderContentBlock(zh.standardAnswer, evaluation.correct_answer || "", "answer-block single")}<div class="result-grid">${(evaluation.strengths || []).map((item) => `<div class="pill good">${escapeHtml(item)}</div>`).join("")}${(evaluation.weaknesses || []).map((item) => `<div class="pill warn">${escapeHtml(item)}</div>`).join("")}</div>${data.follow_up ? `<div class="follow-up"><h4>${zh.followUp}</h4><div class="markdown">${renderMarkdown(data.follow_up)}</div><textarea id="candidateAnswer" placeholder="${zh.answerFollowUp}"></textarea><div class="actions"><button onclick="submitInterviewAnswer('${questionId}',${data.next_depth},'${escapeAttr(data.follow_up)}')">${zh.continueFollowUp}</button><button class="ghost" onclick="saveFollowUp('${data.id}')">${zh.saveToBank}</button><button onclick="nextInterviewQuestion()">${zh.next}</button></div></div>` : `<div class="actions"><button onclick="nextInterviewQuestion()">${zh.next}</button></div>`}</article>`;
  } catch (error) { feedback.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`; }
}
async function saveFollowUp(turnId) {
  try {
    await request(`/interview-turns/${turnId}/save-question?bank_id=${encodeURIComponent(bankValue())}`, { method: "POST" });
    toast(zh.savedFollowUp);
    loadBanks();
  } catch (error) { toast(error.message); }
}
function nextInterviewQuestion() { currentQuestionIndex += 1; renderInterview(); }
async function loadQuestions() {
  const keyword = document.getElementById("manageKeyword")?.value || "";
  const bank = document.getElementById("manageBank")?.value || "";
  const [data, stats] = await Promise.all([request(`/questions?keyword=${encodeURIComponent(keyword)}&bank_id=${encodeURIComponent(bank)}`), request("/stats")]);
  document.getElementById("totalCount").textContent = stats.total;
  document.getElementById("bankCount").textContent = stats.banks;
  const list = document.getElementById("questionList");
  list.innerHTML = data.items.length ? data.items.map((item) => `<article class="question-row"><div class="question-main">${renderQuestionAnswerBlocks(item)}<div class="meta-line">${metaLine(item)}</div><div class="meta-line">${renderTags(item.tags || [])}</div></div><div class="row-actions"><button class="ghost" onclick="editQuestionText('${item.id}')">${zh.editQuestion}</button><button class="ghost" onclick="editAnswerText('${item.id}')">${zh.editAnswer}</button><button class="ghost" onclick="openQuestionEditor('${item.id}')">${zh.editTags}</button><button class="ghost" onclick="autoTags('${item.id}')">${zh.autoTags}</button><button class="danger" onclick="deleteQuestion('${item.id}')">${zh.del}</button></div></article>`).join("") : `<div class='empty'>${zh.noQuestions}</div>`;
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
  if (!file) return toast(zh.chooseFile);
  const form = new FormData();
  form.append("file", file);
  form.append("bank_id", document.getElementById("importBank").value);
  try {
    const data = await requestRaw("/import", { method: "POST", body: form });
    document.getElementById("importResult").innerHTML = `<div class="import-result"><strong>${zh.importResult}</strong>?${zh.importOk} ${data.created} ${zh.rows} / ${zh.skipped} ${data.skipped} ${zh.rows} / ${zh.failed} ${data.errors.length} ${zh.rows}</div>`;
    loadBanks();
  } catch (error) { toast(error.message); }
});
function renderResultCard(item) {
  return `<article class="mini-result"><div class="mini-head"><strong>${zh.match}</strong><span>${(Number(item.score || 0) * 100).toFixed(1)}%</span></div>${renderQuestionAnswerBlocks(item)}<div class="meta-line">${metaLine(item)}</div><div class="meta-line">${renderTags(item.tags || [])}</div></article>`;
}
init();

function filterNav() {
  const input = document.getElementById("navFilter");
  const keyword = (input?.value || "").trim().toLowerCase();
  document.querySelectorAll(".nav-menu a").forEach((link) => {
    const text = `${link.dataset.title || ""} ${link.textContent || ""}`.toLowerCase();
    link.style.display = !keyword || text.includes(keyword) ? "grid" : "none";
  });
}
