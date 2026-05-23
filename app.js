const APP_CONFIG = window.__PLANBOARD_CONFIG__ || {};
const DATA_SOURCE = APP_CONFIG.DATA_SOURCE || "rest";
const PLANBOARD_DOMAIN = window.PlanboardDomain || {};
const PORTFOLIO_UTILS = window.PlanboardPortfolioUtils || {};
const FIREBASE_ADAPTER = window.PlanboardFirebaseAdapter || null;
const API_CLIENT = window.PlanboardApiClient
  ? window.PlanboardApiClient.create({ config: APP_CONFIG, firebaseAdapter: FIREBASE_ADAPTER })
  : null;
const USE_FIREBASE = API_CLIENT ? API_CLIENT.useFirebase : DATA_SOURCE === "firebase";
const AUTO_SYNC_MS = 15000;
const TOKEN_KEY = "planboard-token";
const UI_KEY = "planboard-ui";
const NOTIFICATION_KEY = "planboard-notified";
const LANES = PLANBOARD_DOMAIN.LANES || ["ideas", "month", "week", "today", "done"];
const LANE_PREFIX = PLANBOARD_DOMAIN.LANE_PREFIX || /^\[\[lane:(ideas|month|week|today|done)\]\]\s*/i;

const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const authScreen = document.querySelector("#authScreen");
const appShell = document.querySelector("#appShell");
const composerOverlay = document.querySelector("#composerOverlay");
const authMessage = document.querySelector("#authMessage");
const statusMessage = document.querySelector("#statusMessage");
const avatarBadge = document.querySelector("#avatarBadge");
const workspaceNameLabel = document.querySelector("#workspaceNameLabel");
const userNameLabel = document.querySelector("#userNameLabel");
const selectedDateLabel = document.querySelector("#selectedDateLabel");
const selectedDateMeta = document.querySelector("#selectedDateMeta");
const boardTitle = document.querySelector(".board-header__copy h1");
const selectedDateInput = document.querySelector("#selectedDateInput");
const planDateInput = document.querySelector("#planDateInput");
const dailyNoteInput = document.querySelector("#dailyNoteInput");
const notePreviewText = document.querySelector("#notePreviewText");
const taskEditorId = document.querySelector("#taskEditorId");
const planEditorId = document.querySelector("#planEditorId");
const taskSubmitButton = document.querySelector("#taskSubmitButton");
const planSubmitButton = document.querySelector("#planSubmitButton");
const portfolioSubmitButton = document.querySelector("#portfolioSubmitButton");
const completedMeta = document.querySelector("#completedMeta");
const clearCompletedButton = document.querySelector("#clearCompletedButton");
const allTaskCountBadge = document.querySelector("#allTaskCountBadge");
const allTaskCountHeader = document.querySelector("#allTaskCountHeader");
const boardViewButton = document.querySelector("#boardViewButton");
const calendarViewButton = document.querySelector("#calendarViewButton");
const portfolioViewButton = document.querySelector("#portfolioViewButton");
const boardView = document.querySelector("#boardView");
const calendarView = document.querySelector("#calendarView");
const portfolioView = document.querySelector("#portfolioView");
const calendarSelectedDateLabel = document.querySelector("#calendarSelectedDateLabel");
const calendarSelectedDateMeta = document.querySelector("#calendarSelectedDateMeta");
const calendarTimelineList = document.querySelector("#calendarTimelineList");
const calendarMonthHeading = document.querySelector("#calendarMonthHeading");
const calendarMonthSelect = document.querySelector("#calendarMonthSelect");
const calendarYearLabel = document.querySelector("#calendarYearLabel");
const calendarPrevYearButton = document.querySelector("#calendarPrevYearButton");
const calendarNextYearButton = document.querySelector("#calendarNextYearButton");
const calendarGrid = document.querySelector("#calendarGrid");
const openTaskCount = document.querySelector("#openTaskCount");
const noteCount = document.querySelector("#noteCount");
const planCount = document.querySelector("#planCount");
const syncStatusLabel = document.querySelector("#syncStatusLabel");
const syncTimeLabel = document.querySelector("#syncTimeLabel");
const composerEyebrow = document.querySelector("#composerEyebrow");
const composerTitle = document.querySelector("#composerTitle");
const composerHint = document.querySelector("#composerHint");
const installButton = document.querySelector("#installButton");
const notificationButton = document.querySelector("#notificationButton");
const refreshButton = document.querySelector("#refreshButton");
const openComposerButton = document.querySelector("#openComposerButton");
const todoCardTemplate = document.querySelector("#todoCardTemplate");
const planItemTemplate = document.querySelector("#planItemTemplate");
const portfolioItemTemplate = document.querySelector("#portfolioItemTemplate");
const planList = document.querySelector("#planList");
const portfolioActiveList = document.querySelector("#portfolioActiveList");
const portfolioPlannedList = document.querySelector("#portfolioPlannedList");
const portfolioCompletedList = document.querySelector("#portfolioCompletedList");
const portfolioFilterButtons = [...document.querySelectorAll("[data-portfolio-filter]")];
const portfolioYearFilter = document.querySelector("#portfolioYearFilter");
const portfolioCertFilter = document.querySelector("#portfolioCertFilter");
const portfolioSearchInput = document.querySelector("#portfolioSearchInput");
const todoLaneInput = document.querySelector("#todoLaneInput");
const todoPriorityInput = document.querySelector("#todoPriorityInput");
const todoDueDateInput = document.querySelector("#todoDueDateInput");
const todoDailyInput = document.querySelector("#todoDailyInput");
const todoTitleInput = document.querySelector("#todoTitleInput");
const planTitleInput = document.querySelector("#planTitleInput");
const planDetailsInput = document.querySelector("#planDetailsInput");
const portfolioEditorId = document.querySelector("#portfolioEditorId");
const portfolioTypeInput = document.querySelector("#portfolioTypeInput");
const portfolioStatusInput = document.querySelector("#portfolioStatusInput");
const portfolioTitleInput = document.querySelector("#portfolioTitleInput");
const portfolioOrganizationInput = document.querySelector("#portfolioOrganizationInput");
const portfolioRoleInput = document.querySelector("#portfolioRoleInput");
const portfolioStartDateInput = document.querySelector("#portfolioStartDateInput");
const portfolioEndDateInput = document.querySelector("#portfolioEndDateInput");
const portfolioTeammatesInput = document.querySelector("#portfolioTeammatesInput");
const portfolioCertInput = document.querySelector("#portfolioCertInput");
const portfolioAchievementInput = document.querySelector("#portfolioAchievementInput");
const portfolioLinksInput = document.querySelector("#portfolioLinksInput");
const portfolioNotesInput = document.querySelector("#portfolioNotesInput");
const portfolioMoreDetails = document.querySelector("#portfolioMoreDetails");
const quickAddForm = document.querySelector("#quickAddForm");
const quickAddInput = document.querySelector("#quickAddInput");
const quickAddLaneInput = document.querySelector("#quickAddLaneInput");
const filterStateLabel = document.querySelector("#filterStateLabel");
const filterButtons = {
  all: document.querySelector("#filterAllButton"),
  today: document.querySelector("#filterTodayButton"),
  overdue: document.querySelector("#filterOverdueButton"),
  high: document.querySelector("#filterHighButton"),
};
const sortSelect = document.querySelector("#sortSelect");
const themeToggleButton = document.querySelector("#themeToggleButton");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const taskDetailPanel = document.querySelector("#taskDetailPanel");
const taskDetailOverlay = document.querySelector("#taskDetailOverlay");
const taskDetailEmpty = document.querySelector("#taskDetailEmpty");
const taskDetailForm = document.querySelector("#taskDetailForm");
const detailHeading = document.querySelector("#detailHeading");
const detailSaveState = document.querySelector("#detailSaveState");
const detailTaskId = document.querySelector("#detailTaskId");
const detailTitleInput = document.querySelector("#detailTitleInput");
const detailDetailsInput = document.querySelector("#detailDetailsInput");
const detailLaneInput = document.querySelector("#detailLaneInput");
const detailPriorityInput = document.querySelector("#detailPriorityInput");
const detailDueDateInput = document.querySelector("#detailDueDateInput");
const detailDailyInput = document.querySelector("#detailDailyInput");
const detailSubtaskList = document.querySelector("#detailSubtaskList");
const detailSubtaskMeta = document.querySelector("#detailSubtaskMeta");
const detailSubtaskInput = document.querySelector("#detailSubtaskInput");
const addDetailSubtaskButton = document.querySelector("#addDetailSubtaskButton");
const toggleCompletedSubtasksButton = document.querySelector("#toggleCompletedSubtasksButton");
const toggleTaskDoneButton = document.querySelector("#toggleTaskDoneButton");
const deleteTaskButton = document.querySelector("#deleteTaskButton");
const closeTaskDetailButton = document.querySelector("#closeTaskDetailButton");
const taskActionOverlay = document.querySelector("#taskActionOverlay");
const taskActionTitle = document.querySelector("#taskActionTitle");
const taskActionEditButton = document.querySelector("#taskActionEditButton");
const taskActionMoveList = document.querySelector("#taskActionMoveList");
const closeTaskActionButton = document.querySelector("#closeTaskActionButton");
const portfolioDetailOverlay = document.querySelector("#portfolioDetailOverlay");
const portfolioDetailPanel = document.querySelector("#portfolioDetailPanel");
const portfolioDetailType = document.querySelector("#portfolioDetailType");
const portfolioDetailTitle = document.querySelector("#portfolioDetailTitle");
const portfolioDetailMeta = document.querySelector("#portfolioDetailMeta");
const portfolioDetailStatus = document.querySelector("#portfolioDetailStatus");
const portfolioDetailDates = document.querySelector("#portfolioDetailDates");
const portfolioDetailRole = document.querySelector("#portfolioDetailRole");
const portfolioDetailTeammates = document.querySelector("#portfolioDetailTeammates");
const portfolioDetailCert = document.querySelector("#portfolioDetailCert");
const portfolioDetailAchievementBlock = document.querySelector("#portfolioDetailAchievementBlock");
const portfolioDetailAchievement = document.querySelector("#portfolioDetailAchievement");
const portfolioDetailLinksBlock = document.querySelector("#portfolioDetailLinksBlock");
const portfolioDetailLinks = document.querySelector("#portfolioDetailLinks");
const portfolioDetailNotesBlock = document.querySelector("#portfolioDetailNotesBlock");
const portfolioDetailNotes = document.querySelector("#portfolioDetailNotes");
const editPortfolioDetailButton = document.querySelector("#editPortfolioDetailButton");
const deletePortfolioDetailButton = document.querySelector("#deletePortfolioDetailButton");
const closePortfolioDetailButton = document.querySelector("#closePortfolioDetailButton");
const undoToast = document.querySelector("#undoToast");
const undoToastLabel = document.querySelector("#undoToastLabel");
const undoToastButton = document.querySelector("#undoToastButton");
const mobileTabButtons = [...document.querySelectorAll(".mobile-tabbar__button")];

const laneTargets = {
  ideas: document.querySelector("#lane-ideas"),
  month: document.querySelector("#lane-month"),
  week: document.querySelector("#lane-week"),
  today: document.querySelector("#lane-today"),
  done: document.querySelector("#lane-done"),
};

const laneCountTargets = {
  ideas: document.querySelector("#count-ideas"),
  month: document.querySelector("#count-month"),
  week: document.querySelector("#count-week"),
  today: document.querySelector("#count-today"),
  done: document.querySelector("#count-done"),
};

let deferredPrompt = null;
let syncIntervalId = 0;
let liveSyncUnsubscribe = null;
let liveSyncGeneration = 0;
let dragTodoId = "";
let dragPortfolioItemId = "";
let dragCardPosition = "after";
let statusTimerId = 0;
let detailSaveTimerId = 0;
let syncLabelTimerId = 0;
let undoTimerId = 0;
const dailyStreakResetIds = new Set();

const state = {
  token: localStorage.getItem(TOKEN_KEY) || "",
  user: null,
  activeAuthMode: "login",
  activeComposerTab: "task",
  selectedDate: loadUiState().selectedDate,
  filterMode: loadUiState().filterMode,
  activeView: loadUiState().activeView,
  portfolioFilter: loadUiState().portfolioFilter,
  portfolioYear: loadUiState().portfolioYear,
  portfolioCert: loadUiState().portfolioCert,
  portfolioSearch: loadUiState().portfolioSearch,
  mobileView: loadUiState().mobileView,
  sortMode: loadUiState().sortMode,
  theme: loadUiState().theme,
  notesByDate: {},
  plans: [],
  portfolioItems: [],
  todos: [],
  syncing: false,
  editingTaskId: "",
  editingPlanId: "",
  notified: loadNotifiedState(),
  detailTaskId: "",
  detailDraft: null,
  detailDirty: false,
  detailSaving: false,
  detailCompletedCollapsed: true,
  taskActionTaskId: "",
  portfolioDetailItemId: "",
  lastSyncedAt: 0,
  undoAction: null,
};

bindEvents();
applyTheme();
hydrateSession();
registerServiceWorker();

function loadUiState() {
  const defaults = {
    selectedDate: todayIso(),
    activeView: "board",
    portfolioFilter: "all",
    portfolioYear: "all",
    portfolioCert: "all",
    portfolioSearch: "",
    filterMode: "all",
    mobileView: "today",
    sortMode: "manual",
    theme: "dark",
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(UI_KEY) || "null");
    const activeView = parsed && ["board", "calendar", "portfolio"].includes(parsed.activeView)
      ? parsed.activeView
      : "board";
    const portfolioFilter = parsed && ["all", "project", "competition", "course"].includes(parsed.portfolioFilter)
      ? parsed.portfolioFilter
      : "all";
    const portfolioCert = parsed && ["all", "cert", "no-cert"].includes(parsed.portfolioCert)
      ? parsed.portfolioCert
      : "all";
    return {
      ...defaults,
      ...(parsed || {}),
      activeView,
      portfolioFilter,
      portfolioYear: String((parsed && parsed.portfolioYear) || "all"),
      portfolioCert,
      portfolioSearch: String((parsed && parsed.portfolioSearch) || ""),
      selectedDate: normalizeIsoDateInput(parsed && parsed.selectedDate) || defaults.selectedDate,
    };
  } catch {
    return defaults;
  }
}

function saveUiState() {
  localStorage.setItem(
    UI_KEY,
    JSON.stringify({
      selectedDate: state.selectedDate,
      activeView: state.activeView,
      portfolioFilter: state.portfolioFilter,
      portfolioYear: state.portfolioYear,
      portfolioCert: state.portfolioCert,
      portfolioSearch: state.portfolioSearch,
      filterMode: state.filterMode,
      mobileView: state.mobileView,
      sortMode: state.sortMode,
      theme: state.theme,
    })
  );
}

function loadNotifiedState() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATION_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveNotifiedState() {
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(state.notified.slice(-200)));
}

function bindEvents() {
  document.querySelector("#showLoginButton").addEventListener("click", () => setAuthMode("login"));
  document.querySelector("#showRegisterButton").addEventListener("click", () => setAuthMode("register"));
  document.querySelector("#closeComposerButton").addEventListener("click", closeComposer);

  boardViewButton.addEventListener("click", () => setActiveView("board"));
  calendarViewButton.addEventListener("click", () => setActiveView("calendar"));
  portfolioViewButton.addEventListener("click", () => setActiveView("portfolio"));
  portfolioFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.portfolioFilter = button.dataset.portfolioFilter || "all";
      saveUiState();
      renderPortfolio();
    });
  });
  portfolioYearFilter?.addEventListener("change", () => {
    state.portfolioYear = portfolioYearFilter.value || "all";
    saveUiState();
    renderPortfolio();
  });
  portfolioCertFilter?.addEventListener("change", () => {
    state.portfolioCert = portfolioCertFilter.value || "all";
    saveUiState();
    renderPortfolio();
  });
  portfolioSearchInput?.addEventListener("input", () => {
    state.portfolioSearch = portfolioSearchInput.value.trim();
    saveUiState();
    renderPortfolio();
  });
  calendarMonthSelect.addEventListener("change", () => {
    const current = new Date(`${state.selectedDate}T00:00:00`);
    const next = new Date(current.getFullYear(), Number(calendarMonthSelect.value), 1);
    state.selectedDate = dateToLocalIso(next);
    saveUiState();
    render();
  });
  calendarPrevYearButton.addEventListener("click", () => shiftCalendarYear(-1));
  calendarNextYearButton.addEventListener("click", () => shiftCalendarYear(1));

  document.querySelector("#tabTaskButton").addEventListener("click", () => setComposerTab("task"));
  document.querySelector("#tabNoteButton").addEventListener("click", () => setComposerTab("note"));
  document.querySelector("#tabPlanButton").addEventListener("click", () => setComposerTab("plan"));
  document.querySelector("#tabPortfolioButton").addEventListener("click", () => setComposerTab("portfolio"));

  openComposerButton.addEventListener("click", () => {
    openComposer(composerTabForActiveView(), { locked: true });
  });
  todoLaneInput.addEventListener("change", syncTaskDateByLane);
  quickAddForm?.addEventListener("submit", handleQuickAdd);

  Object.entries(filterButtons).forEach(([mode, button]) => {
    button.addEventListener("click", () => {
      state.filterMode = mode;
      state.mobileView = mode === "today" ? "today" : "filtered";
      saveUiState();
      renderBoard();
      renderSidebar();
      renderMobileView();
    });
  });

  mobileTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.mobileView = button.dataset.mobileView || "today";
      saveUiState();
      renderMobileView();
    });
  });

  sortSelect.addEventListener("change", () => {
    state.sortMode = sortSelect.value;
    saveUiState();
    renderBoard();
  });

  themeToggleButton.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveUiState();
    applyTheme();
    render();
  });

  closeTaskDetailButton.addEventListener("click", closeTaskDetail);
  taskDetailOverlay.addEventListener("click", (event) => {
    if (event.target === taskDetailOverlay) {
      closeTaskDetail();
    }
  });
  closeTaskActionButton.addEventListener("click", closeTaskActionSheet);
  taskActionEditButton.addEventListener("click", () => {
    const todoId = state.taskActionTaskId;
    closeTaskActionSheet();
    if (todoId) {
      openTaskDetail(todoId, { focusTitle: true });
    }
  });
  taskActionOverlay.addEventListener("click", (event) => {
    if (event.target === taskActionOverlay) {
      closeTaskActionSheet();
    }
  });
  closePortfolioDetailButton.addEventListener("click", closePortfolioDetail);
  portfolioDetailOverlay.addEventListener("click", (event) => {
    if (event.target === portfolioDetailOverlay) {
      closePortfolioDetail();
    }
  });
  editPortfolioDetailButton.addEventListener("click", () => {
    const item = currentPortfolioDetailItem();
    closePortfolioDetail();
    if (item) {
      openPortfolioEditor(item);
    }
  });
  deletePortfolioDetailButton.addEventListener("click", async () => {
    const item = currentPortfolioDetailItem();
    closePortfolioDetail();
    if (item) {
      queuePortfolioDeleteUndo(item.id);
    }
  });

  composerOverlay.addEventListener("click", (event) => {
    if (event.target === composerOverlay) {
      closeComposer();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    if (!composerOverlay.classList.contains("composer-overlay--hidden")) {
      closeComposer();
      return;
    }
    if (!taskActionOverlay.classList.contains("task-action-overlay--hidden")) {
      closeTaskActionSheet();
      return;
    }
    if (!portfolioDetailOverlay.classList.contains("task-detail-overlay--hidden")) {
      closePortfolioDetail();
      return;
    }
    if (!taskDetailPanel.classList.contains("task-detail--hidden")) {
      closeTaskDetail();
    }
  });

  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      setAuthMessage("Signing in...");
      const payload = await api("/auth/login", {
        method: "POST",
        body: {
          email: String(formData.get("email") || "").trim(),
          password: String(formData.get("password") || ""),
        },
      });
      completeAuth(payload, "Signed in.");
      form.reset();
    } catch (error) {
      setAuthMessage(error.message, true);
    }
  });

  document.querySelector("#registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      setAuthMessage("Creating account...");
      const payload = await api("/auth/register", {
        method: "POST",
        body: {
          name: String(formData.get("name") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          password: String(formData.get("password") || ""),
        },
      });
      completeAuth(payload, "Account created.");
      form.reset();
    } catch (error) {
      setAuthMessage(error.message, true);
    }
  });

  document.querySelector("#logoutButton").addEventListener("click", async () => {
    const token = state.token;
    clearSession();
    try {
      if (token) {
        await api("/auth/logout", { method: "POST", tokenOverride: token });
      }
    } catch {}
  });

  document.querySelector("#todayButton").addEventListener("click", () => {
    state.selectedDate = todayIso();
    syncDateInputs();
    saveUiState();
    render();
  });

  refreshButton.addEventListener("click", async () => {
    await refreshFromServer(false);
  });

  notificationButton.addEventListener("click", async () => {
    await enableNotifications();
  });

  clearCompletedButton.addEventListener("click", async () => {
    const completed = state.todos.filter((todo) => todo.done);
    if (!completed.length) {
      return;
    }
    try {
      setStatus("Completed tasks removed.");
      queueClearCompletedUndo(completed);
      render();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  selectedDateInput.addEventListener("change", () => {
    state.selectedDate = normalizeIsoDateInput(selectedDateInput.value) || todayIso();
    syncComposerNote();
    syncDateInputs();
    saveUiState();
    render();
  });

  planDateInput.addEventListener("change", () => {
    state.selectedDate = normalizeIsoDateInput(planDateInput.value) || todayIso();
    syncDateInputs();
    saveUiState();
    render();
  });

  dailyNoteInput.addEventListener("input", () => {
    const value = dailyNoteInput.value.trim();
    notePreviewText.textContent = value ? summarize(value, 160) : "No note for this day yet.";
  });

  document.querySelector("#taskComposerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const editingId = taskEditorId.value;
      setStatus(editingId ? "Updating task..." : "Adding task...");
      const isDaily = formData.get("daily") === "on";
      const dueDate = normalizeIsoDateInput(String(formData.get("dueDate") || "").trim()) || null;
      const requestedLane = inferStartingLane(String(formData.get("lane") || ""), dueDate, isDaily);
      const payload = await api(editingId ? `/todos/${editingId}` : "/todos", {
        method: editingId ? "PUT" : "POST",
        body: {
          title: String(formData.get("title") || "").trim(),
          details: String(formData.get("details") || "").trim(),
          subtasks: currentTaskSubtasks(editingId),
          dueDate,
          lane: requestedLane,
          priority: String(formData.get("priority") || "medium"),
          done: editingId ? currentTaskDone(editingId) : false,
          daily: isDaily,
          dailyCompletedOn: editingId ? currentTaskDailyMeta(editingId).dailyCompletedOn : null,
          streak: editingId ? currentTaskDailyMeta(editingId).streak : 0,
        },
      });
      const hydrated = hydrateTodoFromServer(payload.todo);
      updateTodo(hydrated);
      state.lastSyncedAt = Date.now();
      if (state.detailTaskId === hydrated.id) {
        state.detailDraft = cloneTodoDraft(hydrated);
        state.detailDirty = false;
      }
      form.reset();
      taskEditorId.value = "";
      taskSubmitButton.textContent = "Add Task";
      todoLaneInput.value = "";
      todoPriorityInput.value = "medium";
      todoDueDateInput.value = "";
      todoDailyInput.checked = false;
      closeComposer();
      render();
      setStatus(editingId ? "Task updated." : "Task added.");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.querySelector("#saveNoteButton").addEventListener("click", async () => {
    try {
      setStatus("Saving note...");
      const content = dailyNoteInput.value.trim();
      await api(`/notes/${state.selectedDate}`, {
        method: "PUT",
        body: { content },
      });
      if (content) {
        state.notesByDate[state.selectedDate] = content;
      } else {
        delete state.notesByDate[state.selectedDate];
      }
      state.lastSyncedAt = Date.now();
      renderSidebar();
      closeComposer();
      setStatus("Note saved.");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.querySelector("#planComposerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const editingId = planEditorId.value;
      setStatus(editingId ? "Updating plan..." : "Adding plan...");
      const payload = await api(editingId ? `/plans/${editingId}` : "/plans", {
        method: editingId ? "PUT" : "POST",
        body: {
          planDate: normalizeIsoDateInput(planDateInput.value || state.selectedDate) || state.selectedDate,
          timeLabel: String(formData.get("timeLabel") || "").trim(),
          title: String(formData.get("title") || "").trim(),
          details: String(formData.get("details") || "").trim(),
        },
      });
      upsertPlan(payload.plan);
      state.lastSyncedAt = Date.now();
      form.reset();
      planEditorId.value = "";
      planSubmitButton.textContent = "Add Plan";
      renderSidebar();
      renderPlans();
      closeComposer();
      setStatus(editingId ? "Plan updated." : "Plan added.");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.querySelector("#portfolioComposerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const editingId = portfolioEditorId.value;
      const startDate = normalizeIsoDateInput(String(formData.get("startDate") || "").trim()) || null;
      const endDate = normalizeIsoDateInput(String(formData.get("endDate") || "").trim()) || null;
      const requestedStatus = String(formData.get("status") || "auto");
      const statusMode = requestedStatus === "auto" ? "auto" : "manual";
      setStatus(editingId ? "Updating portfolio item..." : "Adding portfolio item...");
      const payload = await api(editingId ? `/portfolio/${editingId}` : "/portfolio", {
        method: editingId ? "PUT" : "POST",
        body: {
          type: String(formData.get("type") || "project"),
          title: String(formData.get("title") || "").trim(),
          organization: String(formData.get("organization") || "").trim(),
          role: String(formData.get("role") || "").trim(),
          teammates: String(formData.get("teammates") || "").trim(),
          startDate,
          endDate,
          status: statusMode === "auto" ? inferPortfolioStatus(startDate, endDate) : requestedStatus,
          statusMode,
          cert: formData.get("cert") === "on",
          achievement: String(formData.get("achievement") || "").trim(),
          links: String(formData.get("links") || "").trim(),
          notes: String(formData.get("notes") || "").trim(),
        },
      });
      upsertPortfolioItem(payload.portfolioItem);
      state.lastSyncedAt = Date.now();
      form.reset();
      portfolioEditorId.value = "";
      portfolioSubmitButton.textContent = "Add Portfolio Item";
      closeComposer();
      setActiveView("portfolio");
      setStatus(editingId ? "Portfolio item updated." : "Portfolio item added.");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  document.querySelectorAll(".column").forEach((column) => {
    const lane = String(column.dataset.lane || "");
    const laneBody = column.querySelector(".column__body");

    const activateDropTarget = (event) => {
      if (!dragTodoId || !lane) {
        return;
      }
      event.preventDefault();
      column.classList.add("is-drop-target");
    };

    const clearDropTarget = () => {
      column.classList.remove("is-drop-target");
    };

    column.addEventListener("dragover", activateDropTarget);
    laneBody?.addEventListener("dragover", activateDropTarget);

    column.addEventListener("dragleave", (event) => {
      if (event.relatedTarget && column.contains(event.relatedTarget)) {
        return;
      }
      clearDropTarget();
    });
    laneBody?.addEventListener("dragleave", (event) => {
      if (event.relatedTarget && column.contains(event.relatedTarget)) {
        return;
      }
      clearDropTarget();
    });

    const handleLaneDrop = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      clearDropTarget();
      if (!dragTodoId || !lane) {
        return;
      }
      const dragged = state.todos.find((entry) => entry.id === dragTodoId);
      if (!dragged) {
        dragTodoId = "";
        dragCardPosition = "after";
        return;
      }
      if (lane !== "done" && !dragged.done && canManualReorder()) {
        await reorderTodo(dragTodoId, lane);
      } else if (groupingLane(dragged) !== lane || dragged.done !== (lane === "done")) {
        await moveTodoToLane(dragTodoId, lane);
      }
      dragTodoId = "";
      dragCardPosition = "after";
    };

    column.addEventListener("drop", handleLaneDrop);
    laneBody?.addEventListener("drop", handleLaneDrop);
  });

  document.querySelectorAll(".portfolio-section").forEach((section) => {
    const status = String(section.dataset.portfolioStatus || "");
    const list = section.querySelector(".portfolio-list");

    const activateDropTarget = (event) => {
      if (!dragPortfolioItemId || !status) {
        return;
      }
      event.preventDefault();
      section.classList.add("is-drop-target");
    };

    const clearDropTarget = () => {
      section.classList.remove("is-drop-target");
    };

    const handlePortfolioDrop = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      clearDropTarget();
      if (!dragPortfolioItemId || !status) {
        return;
      }
      await movePortfolioItemToStatus(dragPortfolioItemId, status);
      dragPortfolioItemId = "";
    };

    section.addEventListener("dragover", activateDropTarget);
    list?.addEventListener("dragover", activateDropTarget);
    section.addEventListener("dragleave", (event) => {
      if (event.relatedTarget && section.contains(event.relatedTarget)) {
        return;
      }
      clearDropTarget();
    });
    list?.addEventListener("dragleave", (event) => {
      if (event.relatedTarget && section.contains(event.relatedTarget)) {
        return;
      }
      clearDropTarget();
    });
    section.addEventListener("drop", handlePortfolioDrop);
    list?.addEventListener("drop", handlePortfolioDrop);
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener("focus", () => {
    if (state.token) {
      refreshFromServer(true);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state.token) {
      refreshFromServer(true);
    }
  });

  detailTitleInput.addEventListener("input", () => {
    updateDetailDraft({ title: detailTitleInput.value });
  });
  detailDetailsInput.addEventListener("input", () => {
    updateDetailDraft({ details: detailDetailsInput.value });
  });
  detailLaneInput.addEventListener("change", () => {
    const patch = { lane: detailLaneInput.value };
    if (detailLaneInput.value === "today" && !detailDueDateInput.value) {
      patch.dueDate = state.selectedDate;
      detailDueDateInput.value = state.selectedDate;
    }
    updateDetailDraft(patch);
  });
  detailPriorityInput.addEventListener("change", () => {
    updateDetailDraft({ priority: detailPriorityInput.value });
  });
  detailDueDateInput.addEventListener("change", () => {
    updateDetailDraft({ dueDate: normalizeIsoDateInput(detailDueDateInput.value) || null });
  });
  detailDailyInput.addEventListener("change", () => {
    const patch = { daily: detailDailyInput.checked };
    if (detailDailyInput.checked) {
      patch.lane = "today";
      detailLaneInput.value = "today";
    }
    updateDetailDraft(patch);
  });
  addDetailSubtaskButton.addEventListener("click", addDetailSubtask);
  toggleCompletedSubtasksButton.addEventListener("click", () => {
    state.detailCompletedCollapsed = !state.detailCompletedCollapsed;
    renderTaskDetail();
  });
  detailSubtaskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addDetailSubtask();
    }
  });
  toggleTaskDoneButton.addEventListener("click", async () => {
    const todo = currentDetailTodo();
    if (!todo) {
      return;
    }
    await toggleTodoDone(todo.id, todo.daily ? true : !todo.done);
  });
  deleteTaskButton.addEventListener("click", async () => {
    const todo = currentDetailTodo();
    if (!todo) {
      return;
    }
    await deleteTodo(todo.id);
  });
  undoToastButton.addEventListener("click", () => {
    undoLastAction();
  });
}

function setAuthMode(mode) {
  state.activeAuthMode = mode;
  document.querySelector("#loginForm").classList.toggle("auth-form--hidden", mode !== "login");
  document.querySelector("#registerForm").classList.toggle("auth-form--hidden", mode !== "register");
  document.querySelector("#showLoginButton").classList.toggle("is-active", mode === "login");
  document.querySelector("#showRegisterButton").classList.toggle("is-active", mode === "register");
  setAuthMessage("");
}

function openComposer(tab, options = {}) {
  taskEditorId.value = "";
  planEditorId.value = "";
  portfolioEditorId.value = "";
  document.querySelector("#taskComposerForm").reset();
  document.querySelector("#planComposerForm").reset();
  document.querySelector("#portfolioComposerForm").reset();
  portfolioMoreDetails.open = false;
  taskSubmitButton.textContent = "Add Task";
  planSubmitButton.textContent = "Add Plan";
  portfolioSubmitButton.textContent = "Add Portfolio Item";
  composerEyebrow.textContent = "Quick Add";
  composerOverlay.dataset.locked = options.locked ? "true" : "false";
  composerOverlay.dataset.lockedTab = options.locked ? tab : "";
  setComposerTab(tab);
  syncDateInputs();
  if (tab === "task") {
    const shouldPrefillCalendarDate = state.activeView === "calendar" && state.selectedDate;
    todoDueDateInput.value = shouldPrefillCalendarDate ? state.selectedDate : "";
    todoLaneInput.value = "";
    todoDailyInput.checked = false;
    if (!shouldPrefillCalendarDate) {
      syncTaskDateByLane();
    }
  }
  planDateInput.value = state.selectedDate;
  if (tab === "note") {
    syncComposerNote();
  }
  if (tab === "plan") {
    if (!planEditorId.value) {
      planSubmitButton.textContent = "Add Plan";
    }
    renderPlans();
  }
  composerOverlay.classList.remove("composer-overlay--hidden");
  focusComposerField(tab);
}

function closeComposer() {
  taskEditorId.value = "";
  planEditorId.value = "";
  portfolioEditorId.value = "";
  taskSubmitButton.textContent = "Add Task";
  planSubmitButton.textContent = "Add Plan";
  portfolioSubmitButton.textContent = "Add Portfolio Item";
  composerEyebrow.textContent = "Quick Add";
  composerOverlay.dataset.locked = "false";
  composerOverlay.dataset.lockedTab = "";
  composerOverlay.classList.add("composer-overlay--hidden");
}

function setComposerTab(tab) {
  if (composerOverlay.dataset.locked === "true") {
    tab = composerOverlay.dataset.lockedTab || composerTabForActiveView();
  }
  state.activeComposerTab = tab;
  document.querySelector("#taskComposerForm").classList.toggle("composer-form--hidden", tab !== "task");
  document.querySelector("#noteComposerForm").classList.toggle("composer-form--hidden", tab !== "note");
  document.querySelector("#planComposerForm").classList.toggle("composer-form--hidden", tab !== "plan");
  document.querySelector("#portfolioComposerForm").classList.toggle("composer-form--hidden", tab !== "portfolio");
  document.querySelector("#tabTaskButton").classList.toggle("is-active", tab === "task");
  document.querySelector("#tabNoteButton").classList.toggle("is-active", tab === "note");
  document.querySelector("#tabPlanButton").classList.toggle("is-active", tab === "plan");
  document.querySelector("#tabPortfolioButton").classList.toggle("is-active", tab === "portfolio");
  const composerMoreDetails = document.querySelector("#composerMoreDetails");
  if (composerMoreDetails) {
    composerMoreDetails.classList.toggle("is-active", tab === "note" || tab === "plan" || tab === "portfolio");
    composerMoreDetails.open = tab === "note" || tab === "plan" || tab === "portfolio";
  }
  composerTitle.textContent = tab === "task" ? "Add Task" : tab === "note" ? "Daily Note" : tab === "plan" ? "Daily Plan" : "Portfolio";
  composerHint.textContent = tab === "task"
    ? "Create a task and move it between lanes when needed."
    : tab === "note"
      ? "Save a short note for the selected day."
      : tab === "plan"
        ? "Add a scheduled item for the selected day."
        : "Capture a project, competition, or course for your long-term record.";
}

function composerTabForActiveView() {
  if (state.activeView === "calendar") {
    return "plan";
  }
  if (state.activeView === "portfolio") {
    return "portfolio";
  }
  return "task";
}

async function hydrateSession() {
  if (USE_FIREBASE) {
    if (!FIREBASE_ADAPTER || !FIREBASE_ADAPTER.isEnabled()) {
      setAuthMessage("Firebase adapter failed to load.", true);
      return;
    }
    try {
      await FIREBASE_ADAPTER.getClient();
      const firebaseUser = await FIREBASE_ADAPTER.waitForAuthUser();
      if (!firebaseUser) {
        clearSession(true);
        return;
      }
      state.token = firebaseUser.uid;
      localStorage.setItem(TOKEN_KEY, state.token);
      setStatus("Syncing workspace...");
      const payload = await api("/bootstrap");
      applyBootstrap(payload);
      showApp();
      render();
      startAutoSync();
      setStatus("Ready.");
      return;
    } catch (error) {
      setAuthMessage(error.message, true);
      return;
    }
  }

  if (!state.token) {
    clearSession(true);
    return;
  }
  try {
    setStatus("Syncing workspace...");
    const payload = await api("/bootstrap");
    applyBootstrap(payload);
    showApp();
    render();
    startAutoSync();
    setStatus("Ready.");
  } catch (error) {
    if (error.status === 401) {
      clearSession(true);
      setAuthMessage("Session expired. Please sign in again.", true);
      return;
    }
    setAuthMessage(error.message, true);
  }
}

function completeAuth(payload, message) {
  state.token = payload.token || state.token || (payload.user ? payload.user.id : "");
  localStorage.setItem(TOKEN_KEY, state.token);
  applyBootstrap(payload);
  showApp();
  render();
  startAutoSync();
  setAuthMessage("");
  setStatus(message);
}

function clearSession(silent = false) {
  finalizePendingUndo(false);
  state.token = "";
  state.user = null;
  state.notesByDate = {};
  state.plans = [];
  state.portfolioItems = [];
  state.todos = [];
  state.notified = [];
  state.detailTaskId = "";
  state.detailDraft = null;
  state.detailDirty = false;
  state.detailSaving = false;
  state.taskActionTaskId = "";
  state.portfolioDetailItemId = "";
  state.lastSyncedAt = 0;
  dailyStreakResetIds.clear();
  localStorage.removeItem(TOKEN_KEY);
  saveNotifiedState();
  stopAutoSync();
  closeTaskDetail();
  closePortfolioDetail();
  authScreen.classList.remove("app-hidden");
  appShell.classList.add("app-hidden");
  closeComposer();
  if (!silent) {
    setStatus("Signed out.");
  }
}

function showApp() {
  authScreen.classList.add("app-hidden");
  appShell.classList.remove("app-hidden");
}

function setActiveView(view) {
  state.activeView = ["calendar", "portfolio"].includes(view) ? view : "board";
  saveUiState();
  render();
}

function applyBootstrap(payload) {
  state.user = payload.user || null;
  state.notesByDate = Object.fromEntries((payload.notes || []).map((note) => [note.noteDate, note.content]));
  state.plans = payload.plans || [];
  state.portfolioItems = sortPortfolioItems((payload.portfolioItems || []).map(hydratePortfolioItemFromServer));
  const hydratedTodos = (payload.todos || []).map(hydrateTodoFromServer);
  const resetTodos = hydratedTodos.map((todo) =>
    state.detailDirty && state.detailTaskId === todo.id ? todo : resetMissedDailyStreak(todo)
  );
  const missedDailyResets = resetTodos.filter((todo, index) => todo !== hydratedTodos[index]);
  state.todos = resetTodos;
  persistMissedDailyStreaks(missedDailyResets);
  if (state.todos.length && filteredTodos().length === 0 && state.filterMode !== "all") {
    state.filterMode = "all";
    saveUiState();
  }
  state.lastSyncedAt = Date.now();
  if (state.detailDirty && state.detailTaskId && state.detailDraft) {
    const exists = state.todos.some((todo) => todo.id === state.detailTaskId);
    if (exists) {
      updateTodo(hydrateTodoFromServer({
        ...state.detailDraft,
        lane: normalizeLane(state.detailDraft),
      }));
    }
  }
  if (state.detailTaskId && !state.todos.some((todo) => todo.id === state.detailTaskId)) {
    closeTaskDetail();
  }
}

function render() {
  syncDateInputs();
  sortSelect.value = state.sortMode;
  applyTheme();
  renderSidebar();
  renderBoard();
  renderCalendar();
  renderPortfolio();
  renderTaskDetail();
  renderPortfolioDetail();
  renderUndoToast();
  renderTaskActionSheet();
  renderMobileView();
  renderViewMode();
  if (!composerOverlay.classList.contains("composer-overlay--hidden") && state.activeComposerTab === "plan") {
    renderPlans();
  }
  updateNotificationButton();
  scanNotifications();
  renderSyncMeta();
}

function renderSidebar() {
  const displayName = state.user?.name || "-";
  const email = state.user?.email || "";
  workspaceNameLabel.textContent = state.user ? `${displayName}'s workspace` : "Planboard";
  userNameLabel.textContent = state.user ? `${displayName} (${email})` : "-";
  avatarBadge.textContent = initialsForName(displayName);
  const today = todayIso();
  selectedDateLabel.textContent = DAY_FORMATTER.format(new Date(`${today}T00:00:00`));
  const todayPlans = plansForDate(today);
  const todayTasks = todosForDate(today);
  const selectedPlans = plansForDate(state.selectedDate);
  selectedDateMeta.textContent = `${todayPlans.length} plan${todayPlans.length === 1 ? "" : "s"} / ${todayTasks.length} task${todayTasks.length === 1 ? "" : "s"}`;
  allTaskCountBadge.textContent = String(state.todos.length);
  openTaskCount.textContent = String(state.todos.filter((todo) => !todo.done && !isDailyCompletedToday(todo)).length);
  noteCount.textContent = state.notesByDate[state.selectedDate] ? "1" : "0";
  planCount.textContent = String(selectedPlans.length);
  const completedCount = state.todos.filter((todo) => todo.done).length;
  completedMeta.textContent = `${completedCount} completed`;
  clearCompletedButton.hidden = completedCount === 0;
}

function renderTaskDetail() {
  const todo = currentDetailTodo();
  const isOpen = Boolean(todo);
  appShell.classList.toggle("window-shell--detail-open", isOpen);
  taskDetailOverlay.classList.toggle("task-detail-overlay--hidden", !isOpen);
  taskDetailOverlay.setAttribute("aria-hidden", String(!isOpen));
  taskDetailPanel.classList.toggle("task-detail--hidden", !isOpen);
  taskDetailPanel.setAttribute("aria-hidden", String(!isOpen));
  taskDetailEmpty.classList.toggle("task-detail__empty--hidden", isOpen);
  taskDetailForm.classList.toggle("task-detail__form--hidden", !isOpen);

  if (!todo) {
    state.detailTaskId = "";
    state.detailDraft = null;
    state.detailDirty = false;
    state.detailSaving = false;
    detailHeading.textContent = "Task details";
    detailSaveState.textContent = "Pick a task to inspect and edit.";
    detailTaskId.value = "";
    detailLaneInput.disabled = false;
    detailDailyInput.checked = false;
    detailSubtaskList.innerHTML = "";
    detailSubtaskMeta.textContent = "0 items";
    return;
  }

  const draft = state.detailDraft || cloneTodoDraft(todo);
  if (!state.detailDraft) {
    state.detailDraft = draft;
  }
  detailTaskId.value = todo.id;
  detailTitleInput.value = draft.title || "";
  detailDetailsInput.value = draft.details || "";
  detailLaneInput.value = normalizeLane(draft);
  detailLaneInput.disabled = Boolean(draft.daily);
  detailPriorityInput.value = draft.priority || "medium";
  detailDueDateInput.value = draft.dueDate || "";
  detailDailyInput.checked = Boolean(draft.daily);
  syncTaskDetailChrome(draft);
  renderDetailSubtasks(draft.subtasks || []);
}

function syncTaskDetailChrome(draft = state.detailDraft || currentDetailTodo()) {
  if (!draft) {
    detailHeading.textContent = "Task details";
    detailSaveState.textContent = "Pick a task to inspect and edit.";
    return;
  }
  detailHeading.textContent = draft.title || "Task details";
  toggleTaskDoneButton.textContent = draft.daily ? "Complete Today" : draft.done ? "Mark Active" : "Mark Done";
  detailSaveState.textContent = state.detailSaving
    ? "Saving changes..."
    : state.detailDirty
      ? "Unsaved changes..."
      : "Saved";
}

function renderDetailSubtasks(subtasks) {
  detailSubtaskList.innerHTML = "";
  const completed = subtasks.filter((item) => item.done).length;
  detailSubtaskMeta.textContent = `${completed}/${subtasks.length} done`;
  toggleCompletedSubtasksButton.hidden = completed === 0;
  toggleCompletedSubtasksButton.textContent = state.detailCompletedCollapsed
    ? `Show completed (${completed})`
    : `Hide completed (${completed})`;

  if (!subtasks.length) {
    const empty = document.createElement("li");
    empty.className = "lane-empty";
    empty.textContent = "No subtasks yet.";
    detailSubtaskList.appendChild(empty);
    return;
  }

  const pending = subtasks.filter((subtask) => !subtask.done);
  const completedItems = subtasks.filter((subtask) => subtask.done);
  const visibleCompleted = state.detailCompletedCollapsed ? [] : completedItems;

  [...pending, ...visibleCompleted].forEach((subtask) => {
    const item = document.createElement("li");
    item.className = "subtask-item";
    item.classList.toggle("is-done", Boolean(subtask.done));

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = Boolean(subtask.done);
    toggle.addEventListener("change", () => {
      updateDetailSubtask(subtask.id, { done: toggle.checked });
    });

    const text = document.createElement("input");
    text.type = "text";
    text.className = "subtask-item__text";
    text.value = subtask.text;
    text.maxLength = 120;
    text.addEventListener("input", () => {
      updateDetailSubtask(subtask.id, { text: text.value });
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "subtask-item__remove";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      removeDetailSubtask(subtask.id);
    });

    item.append(toggle, text, remove);
    detailSubtaskList.appendChild(item);
  });

  if (completedItems.length && state.detailCompletedCollapsed) {
    const collapsed = document.createElement("li");
    collapsed.className = "subtask-list__collapsed";
    collapsed.textContent = `${completedItems.length} completed subtask${completedItems.length === 1 ? "" : "s"} hidden`;
    detailSubtaskList.appendChild(collapsed);
  }
}

function renderUndoToast() {
  const isOpen = Boolean(state.undoAction);
  undoToast.classList.toggle("undo-toast--hidden", !isOpen);
  if (!isOpen) {
    undoToastLabel.textContent = "";
    return;
  }
  undoToastLabel.textContent = state.undoAction.label;
}

function renderTaskActionSheet() {
  const todo = state.taskActionTaskId ? state.todos.find((entry) => entry.id === state.taskActionTaskId) : null;
  const isOpen = Boolean(todo);
  taskActionOverlay.classList.toggle("task-action-overlay--hidden", !isOpen);
  taskActionOverlay.setAttribute("aria-hidden", String(!isOpen));

  if (!todo) {
    taskActionTitle.textContent = "Selected task";
    taskActionMoveList.innerHTML = "";
    return;
  }

  taskActionTitle.textContent = todo.title;
  taskActionMoveList.innerHTML = "";
  LANES.forEach((lane) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `task-action-move-list__button${groupingLane(todo) === lane ? " is-active" : ""}`;
    button.textContent = laneLabel(lane);
    button.disabled = todo.daily || groupingLane(todo) === lane;
    button.addEventListener("click", async () => {
      closeTaskActionSheet();
      if (groupingLane(todo) !== lane || todo.done !== (lane === "done")) {
        await moveTodoToLane(todo.id, lane);
      }
    });
    taskActionMoveList.appendChild(button);
  });
}

function renderMobileView() {
  appShell.dataset.mobileView = state.mobileView || "today";
  mobileTabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mobileView === appShell.dataset.mobileView);
  });
}

function renderViewMode() {
  const isCalendar = state.activeView === "calendar";
  const isPortfolio = state.activeView === "portfolio";
  appShell.dataset.activeView = isCalendar ? "calendar" : isPortfolio ? "portfolio" : "board";
  boardTitle.textContent = isPortfolio ? "Portfolio" : "Tasks";
  openComposerButton.textContent = isPortfolio ? "+ Add Portfolio" : isCalendar ? "+ Add Plan" : "+ Add Task";
  boardViewButton.classList.toggle("is-active", !isCalendar && !isPortfolio);
  calendarViewButton.classList.toggle("is-active", isCalendar);
  portfolioViewButton.classList.toggle("is-active", isPortfolio);
  boardView.classList.toggle("board-view--hidden", isCalendar || isPortfolio);
  calendarView.classList.toggle("board-view--hidden", !isCalendar);
  portfolioView.classList.toggle("board-view--hidden", !isPortfolio);
  clearCompletedButton.hidden = isPortfolio || isCalendar || state.todos.filter((todo) => todo.done).length === 0;
}

function applyTheme() {
  const theme = state.theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  themeToggleButton.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", theme === "dark" ? "#22262b" : "#f7f9fc");
  }
}

function renderSyncMeta() {
  if (state.syncing) {
    syncStatusLabel.textContent = "Syncing";
    syncTimeLabel.textContent = "Updating from server";
    return;
  }
  syncStatusLabel.textContent = "Visible";
  syncTimeLabel.textContent = state.lastSyncedAt ? `Synced ${relativeTime(state.lastSyncedAt)}` : "Waiting for first sync";
}

function renderFilterState(visibleCount) {
  const totalCount = state.todos.length;
  const parts = [];
  if (state.filterMode !== "all") {
    parts.push(
      {
        today: "Today",
        overdue: "Overdue",
        high: "High Priority",
      }[state.filterMode] || state.filterMode
    );
  }
  filterStateLabel.textContent = parts.length
    ? `Showing ${visibleCount} of ${totalCount} tasks · ${parts.join(" · ")}`
    : `${visibleCount} task${visibleCount === 1 ? "" : "s"} visible`;
}

function renderLaneEmpty(lane) {
  const empty = document.createElement("div");
  empty.className = "lane-empty";

  const text = document.createElement("p");
  text.textContent = emptyTextForLane(lane);
  empty.appendChild(text);
  return empty;
}

function renderBoard() {
  const visibleTodos = filteredTodos();
  const grouped = {
    ideas: [],
    month: [],
    week: [],
    today: [],
    done: [],
  };

  allTaskCountHeader.textContent = String(visibleTodos.length);
  visibleTodos.forEach((todo) => {
    grouped[groupingLane(todo)].push(todo);
  });

  LANES.forEach((lane) => {
    const target = laneTargets[lane];
    target.innerHTML = "";
    laneCountTargets[lane].textContent = String(grouped[lane].length);
    if (!grouped[lane].length) {
      const empty = renderLaneEmpty(lane);
      target.appendChild(empty);
      return;
    }
    sortTodos(grouped[lane]).forEach((todo) => {
      target.appendChild(renderTodoCard(todo));
    });
  });
  updateFilterButtons();
  renderFilterState(visibleTodos.length);
}

function renderCalendar() {
  const selected = new Date(`${state.selectedDate}T00:00:00`);
  const month = selected.getMonth();
  const year = selected.getFullYear();
  const deadlineMap = deadlineTodosByDate();

  calendarMonthSelect.value = String(month);
  calendarYearLabel.textContent = String(year);
  calendarMonthHeading.textContent = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(selected);

  calendarGrid.innerHTML = "";
  calendarMonthDates(year, month).forEach((date) => {
    const iso = dateToLocalIso(date);
    const todos = deadlineMap.get(iso) || [];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.classList.toggle("is-muted", date.getMonth() !== month);
    button.classList.toggle("is-today", iso === todayIso());
    button.classList.toggle("is-selected", iso === state.selectedDate);

    const number = document.createElement("span");
    number.className = "calendar-day__number";
    number.textContent = String(date.getDate());
    button.appendChild(number);

    const count = document.createElement("span");
    count.className = "calendar-day__count";
    count.textContent = todos.length ? `${todos.length} task${todos.length === 1 ? "" : "s"}` : "";
    button.appendChild(count);

    if (todos.length) {
      const priorityCounts = PLANBOARD_DOMAIN.calendarPriorityCounts
        ? PLANBOARD_DOMAIN.calendarPriorityCounts(todos)
        : todos.reduce((counts, todo) => {
          const priority = ["high", "medium", "low"].includes(todo.priority) ? todo.priority : "medium";
          counts[priority] += 1;
          return counts;
        }, { high: 0, medium: 0, low: 0 });
      const prioritySummary = document.createElement("div");
      prioritySummary.className = "calendar-day__priorities";
      [
        ["high", "H"],
        ["medium", "M"],
        ["low", "L"],
      ].forEach(([priority, label]) => {
        if (!priorityCounts[priority]) {
          return;
        }
        const item = document.createElement("span");
        item.className = `calendar-day__priority calendar-day__priority--${priority}`;
        item.textContent = `${label} ${priorityCounts[priority]}`;
        prioritySummary.appendChild(item);
      });
      button.appendChild(prioritySummary);
    }

    button.addEventListener("click", () => {
      state.selectedDate = iso;
      saveUiState();
      render();
    });
    calendarGrid.appendChild(button);
  });

  renderCalendarTimeline(deadlineMap.get(state.selectedDate) || []);
}

function renderCalendarTimeline(todos) {
  calendarSelectedDateLabel.textContent = DAY_FORMATTER.format(new Date(`${state.selectedDate}T00:00:00`));
  calendarSelectedDateMeta.textContent = `${todos.length} deadline${todos.length === 1 ? "" : "s"}`;
  calendarTimelineList.innerHTML = "";

  if (!todos.length) {
    const empty = document.createElement("div");
    empty.className = "deadline-empty";
    empty.textContent = "No dated deadlines for this day.";
    calendarTimelineList.appendChild(empty);
    return;
  }

  sortDeadlineTodos(todos).forEach((todo) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `deadline-item priority-${todo.priority || "medium"}`;
    button.classList.toggle("is-done", Boolean(todo.done));

    const priority = document.createElement("span");
    priority.className = "deadline-item__priority";
    priority.textContent = todo.priority || "medium";

    const title = document.createElement("strong");
    title.textContent = todo.title || "Untitled task";

    const details = document.createElement("span");
    details.className = "deadline-item__details";
    details.textContent = todo.details || laneLabel(groupingLane(todo));

    button.append(priority, title, details);
    button.addEventListener("click", () => {
      openTaskDetail(todo.id);
    });
    calendarTimelineList.appendChild(button);
  });
}

function renderPortfolio() {
  const allItems = sortPortfolioItems(state.portfolioItems || []);
  renderPortfolioYearFilter(allItems);
  if (portfolioSearchInput && portfolioSearchInput.value !== state.portfolioSearch) {
    portfolioSearchInput.value = state.portfolioSearch;
  }
  if (portfolioCertFilter && portfolioCertFilter.value !== state.portfolioCert) {
    portfolioCertFilter.value = state.portfolioCert;
  }
  const items = filterPortfolioItems(allItems);
  const grouped = groupPortfolioItems(items);
  portfolioFilterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.portfolioFilter === state.portfolioFilter);
  });

  if (state.activeView === "portfolio") {
    allTaskCountHeader.textContent = String(items.length);
    completedMeta.textContent = `${grouped.planned.length} planned / ${grouped.active.length} active / ${grouped.completed.length} completed`;
  }

  renderPortfolioList(portfolioPlannedList, grouped.planned, "Nothing planned yet.");
  renderPortfolioList(portfolioActiveList, grouped.active, "No active portfolio items.");
  renderPortfolioList(portfolioCompletedList, grouped.completed, "No completed portfolio items yet.");
}

function renderPortfolioYearFilter(items) {
  if (!portfolioYearFilter) {
    return;
  }
  const years = portfolioYearsForItems(items);
  if (state.portfolioYear !== "all" && !years.includes(state.portfolioYear)) {
    state.portfolioYear = "all";
  }
  const currentOptions = [...portfolioYearFilter.options].map((option) => option.value).join("|");
  const nextOptions = ["all", ...years].join("|");
  if (currentOptions !== nextOptions) {
    portfolioYearFilter.innerHTML = "";
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "All years";
    portfolioYearFilter.appendChild(all);
    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      portfolioYearFilter.appendChild(option);
    });
  }
  portfolioYearFilter.value = state.portfolioYear;
}

function renderPortfolioList(target, items, emptyText) {
  target.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "portfolio-empty";
    empty.textContent = emptyText;
    target.appendChild(empty);
    return;
  }
  items.forEach((item) => {
    target.appendChild(renderPortfolioCard(item));
  });
}

function renderPortfolioCard(item) {
  const fragment = portfolioItemTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".portfolio-card");
  const type = fragment.querySelector(".portfolio-card__type");
  const dates = fragment.querySelector(".portfolio-card__dates");
  const cert = fragment.querySelector(".portfolio-card__cert");
  const title = fragment.querySelector(".portfolio-card__title");
  const meta = fragment.querySelector(".portfolio-card__meta");
  const achievement = fragment.querySelector(".portfolio-card__achievement");
  const viewButton = fragment.querySelector(".portfolio-card__view");

  card.dataset.id = item.id;
  card.draggable = true;
  card.classList.add(`portfolio-card--${item.type}`);
  type.textContent = portfolioTypeLabel(item.type);
  dates.textContent = portfolioDateRange(item);
  cert.hidden = !item.cert;
  title.textContent = item.title || "Untitled";
  meta.hidden = true;
  achievement.textContent = item.achievement ? `Achievement: ${item.achievement}` : "";
  achievement.hidden = !item.achievement;

  card.addEventListener("click", (event) => {
    if (event.target.closest("button") || event.target.closest("a")) {
      return;
    }
    openPortfolioDetail(item.id);
  });

  card.addEventListener("dragstart", (event) => {
    dragPortfolioItemId = item.id;
    card.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.id);
    }
  });

  card.addEventListener("dragend", () => {
    dragPortfolioItemId = "";
    card.classList.remove("is-dragging");
    document.querySelectorAll(".portfolio-section").forEach((section) => section.classList.remove("is-drop-target"));
  });

  viewButton.addEventListener("click", () => openPortfolioDetail(item.id));

  return fragment;
}

function portfolioDateRange(item) {
  const start = item.startDate ? SHORT_DATE_FORMATTER.format(new Date(`${item.startDate}T00:00:00`)) : "";
  const end = item.endDate ? SHORT_DATE_FORMATTER.format(new Date(`${item.endDate}T00:00:00`)) : "";
  if (start && end) {
    return `${start} - ${end}`;
  }
  return start || end || "No dates";
}

function currentPortfolioDetailItem() {
  return state.portfolioDetailItemId
    ? state.portfolioItems.find((item) => item.id === state.portfolioDetailItemId) || null
    : null;
}

function openPortfolioDetail(itemId) {
  const item = state.portfolioItems.find((entry) => entry.id === itemId);
  if (!item) {
    return;
  }
  state.portfolioDetailItemId = item.id;
  renderPortfolioDetail();
}

function closePortfolioDetail() {
  state.portfolioDetailItemId = "";
  renderPortfolioDetail();
}

function renderPortfolioDetail() {
  const item = currentPortfolioDetailItem();
  const isOpen = Boolean(item);
  portfolioDetailOverlay.classList.toggle("task-detail-overlay--hidden", !isOpen);
  portfolioDetailOverlay.setAttribute("aria-hidden", String(!isOpen));
  portfolioDetailPanel.classList.toggle("task-detail--hidden", !isOpen);
  portfolioDetailPanel.setAttribute("aria-hidden", String(!isOpen));
  if (!item) {
    return;
  }

  portfolioDetailType.textContent = portfolioTypeLabel(item.type);
  portfolioDetailTitle.textContent = item.title || "Portfolio item";
  portfolioDetailMeta.textContent = item.organization || "Portfolio record";
  const effectiveStatus = portfolioEffectiveStatus(item);
  portfolioDetailStatus.textContent = item.statusMode === "auto"
    ? `${portfolioStatusLabel(effectiveStatus)} (Auto)`
    : portfolioStatusLabel(item.status);
  portfolioDetailDates.textContent = portfolioDateRange(item);
  portfolioDetailRole.textContent = item.role || "-";
  portfolioDetailTeammates.textContent = item.teammates || "-";
  portfolioDetailCert.textContent = item.cert ? "Yes" : "No";

  portfolioDetailAchievement.textContent = item.achievement || "";
  portfolioDetailAchievementBlock.hidden = !item.achievement;
  renderPortfolioLinks(portfolioDetailLinks, item.links);
  portfolioDetailLinksBlock.hidden = !String(item.links || "").trim();
  portfolioDetailNotes.textContent = item.notes || "";
  portfolioDetailNotesBlock.hidden = !item.notes;
}

function renderPortfolioLinks(target, rawLinks) {
  target.innerHTML = "";
  const links = String(rawLinks || "")
    .split(/[\n,]+/)
    .map((link) => link.trim())
    .filter(Boolean)
    .slice(0, 4);
  links.forEach((link, index) => {
    const anchor = document.createElement("a");
    anchor.href = link.startsWith("http://") || link.startsWith("https://") ? link : `https://${link}`;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.textContent = index === 0 ? "Link" : `Link ${index + 1}`;
    target.appendChild(anchor);
  });
}

function portfolioStatusLabel(status) {
  return {
    planned: "Planned",
    active: "Active",
    completed: "Completed",
  }[status] || "Active";
}

function inferPortfolioStatus(startDate, endDate, today = todayIso()) {
  if (startDate && startDate > today) {
    return "planned";
  }
  if (endDate && endDate < today) {
    return "completed";
  }
  if (startDate || endDate) {
    return "active";
  }
  return "planned";
}

function portfolioEffectiveStatus(item) {
  if (item && item.statusMode === "auto") {
    return inferPortfolioStatus(item.startDate, item.endDate);
  }
  return ["planned", "active", "completed"].includes(item && item.status) ? item.status : "active";
}

function withPortfolioEffectiveStatus(item) {
  if (!item) {
    return item;
  }
  const status = portfolioEffectiveStatus(item);
  return status === item.status ? item : { ...item, status };
}

function portfolioTypeLabel(type) {
  return {
    competition: "Competition",
    course: "Course",
    project: "Project",
  }[type] || "Project";
}

function renderPlans() {
  const plans = plansForDate(state.selectedDate);
  planList.innerHTML = "";
  if (!plans.length) {
    const empty = document.createElement("li");
    empty.className = "lane-empty";
    empty.textContent = "No plans for this day yet.";
    planList.appendChild(empty);
    return;
  }

  plans.forEach((plan) => {
    const fragment = planItemTemplate.content.cloneNode(true);
    fragment.querySelector(".plan-item__time").textContent = plan.timeLabel || "Any time";
    fragment.querySelector(".plan-item__title").textContent = plan.title;
    fragment.querySelector(".plan-item__details").textContent = plan.details || "";
    fragment.querySelector(".plan-item__edit").addEventListener("click", () => {
      openPlanEditor(plan);
    });
    fragment.querySelector(".plan-item__delete").addEventListener("click", () => {
      queuePlanDeleteUndo(plan.id);
    });
    planList.appendChild(fragment);
  });
}

function renderTodoCard(todo) {
  const fragment = todoCardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".task-card");
  const checkbox = fragment.querySelector(".task-card__toggle");
  const bodyButton = fragment.querySelector(".task-card__body-button");
  const title = fragment.querySelector(".task-card__title");
  const details = fragment.querySelector(".task-card__details");
  const due = fragment.querySelector(".task-card__due");
  const priority = fragment.querySelector(".task-card__priority");
  const subtaskMeta = fragment.querySelector(".task-card__subtasks");
  const streak = fragment.querySelector(".task-card__streak");
  let longPressTimerId = 0;
  let longPressTriggered = false;
  let longPressStart = null;

  card.dataset.id = todo.id;
  card.dataset.lane = normalizeLane(todo);
  card.classList.toggle("is-selected", todo.id === state.detailTaskId);
  card.classList.toggle("is-done", todo.done);
  card.classList.toggle("is-daily", Boolean(todo.daily));
  card.classList.toggle("is-draggable", canDragTodo(todo));
  card.draggable = canDragTodo(todo);
  checkbox.checked = todo.daily ? false : todo.done;
  title.textContent = todo.title;
  details.textContent = todo.details || "";
  due.textContent = todo.daily ? "Daily" : todo.dueDate ? SHORT_DATE_FORMATTER.format(new Date(`${todo.dueDate}T00:00:00`)) : "";
  const subtaskCount = (todo.subtasks || []).length;
  const doneSubtasks = (todo.subtasks || []).filter((item) => item.done).length;
  subtaskMeta.textContent = subtaskCount ? `${doneSubtasks}/${subtaskCount} steps` : "";
  streak.textContent = todo.daily ? `Streak ${Number(todo.streak || 0)}` : "";
  priority.textContent = todo.priority || "";
  priority.className = "task-card__priority";
  if (todo.priority) {
    priority.classList.add(`priority-${todo.priority}`);
  }

  card.addEventListener("dragstart", (event) => {
    if (!canDragTodo(todo)) {
      event.preventDefault();
      return;
    }
    dragTodoId = todo.id;
    card.style.opacity = "0.56";
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", todo.id);
    }
  });

  card.addEventListener("dragend", () => {
    dragTodoId = "";
    dragCardPosition = "after";
    card.style.opacity = "";
    document.querySelectorAll(".column").forEach((column) => column.classList.remove("is-drop-target"));
    document.querySelectorAll(".task-card").forEach((entry) => entry.classList.remove("is-drag-before", "is-drag-after"));
  });

  card.addEventListener("dragover", (event) => {
    if (!dragTodoId || dragTodoId === todo.id) {
        return;
    }
    const dragged = state.todos.find((entry) => entry.id === dragTodoId);
    if (!dragged) {
      return;
    }
    if (!canManualReorder() || dragged.done || todo.done) {
      return;
    }
    event.preventDefault();
    const bounds = card.getBoundingClientRect();
    dragCardPosition = event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    card.classList.toggle("is-drag-before", dragCardPosition === "before");
    card.classList.toggle("is-drag-after", dragCardPosition === "after");
  });

  card.addEventListener("dragleave", () => {
    card.classList.remove("is-drag-before", "is-drag-after");
  });

  card.addEventListener("drop", async (event) => {
    if (!dragTodoId || dragTodoId === todo.id) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    card.classList.remove("is-drag-before", "is-drag-after");
    const dragged = state.todos.find((entry) => entry.id === dragTodoId);
    if (!dragged) {
      dragTodoId = "";
      dragCardPosition = "after";
      return;
    }
    if (groupingLane(todo) !== "done" && !dragged.done && !todo.done && canManualReorder()) {
      await reorderTodo(dragTodoId, normalizeLane(todo), todo.id, dragCardPosition);
    } else if (groupingLane(dragged) !== groupingLane(todo) || dragged.done !== todo.done) {
      await moveTodoToLane(dragTodoId, groupingLane(todo));
    }
    dragTodoId = "";
    dragCardPosition = "after";
  });

  checkbox.addEventListener("change", async () => {
    const success = await toggleTodoDone(todo.id, todo.daily ? true : checkbox.checked);
    if (!success) {
      checkbox.checked = !checkbox.checked;
    }
  });

  bodyButton.addEventListener("click", () => {
    if (longPressTriggered) {
      longPressTriggered = false;
      return;
    }
    openTaskDetail(todo.id);
  });

  bodyButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTaskDetail(todo.id);
    }
  });

  bodyButton.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    openTaskActionSheet(todo.id);
  });

  bodyButton.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") {
      return;
    }
    longPressTriggered = false;
    longPressStart = { x: event.clientX, y: event.clientY };
    longPressTimerId = window.setTimeout(() => {
      longPressTriggered = true;
      openTaskActionSheet(todo.id);
    }, 420);
  });

  bodyButton.addEventListener("pointermove", (event) => {
    if (!longPressTimerId || !longPressStart) {
      return;
    }
    const movedX = Math.abs(event.clientX - longPressStart.x);
    const movedY = Math.abs(event.clientY - longPressStart.y);
    if (movedX > 10 || movedY > 10) {
      window.clearTimeout(longPressTimerId);
      longPressTimerId = 0;
      longPressStart = null;
    }
  });

  const cancelLongPress = () => {
    if (longPressTimerId) {
      window.clearTimeout(longPressTimerId);
      longPressTimerId = 0;
    }
    longPressStart = null;
  };

  bodyButton.addEventListener("pointerup", cancelLongPress);
  bodyButton.addEventListener("pointercancel", cancelLongPress);
  bodyButton.addEventListener("pointerleave", cancelLongPress);

  return fragment;
}

async function moveTodoToLane(todoId, targetLane) {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) {
    return;
  }

  const previous = cloneTodoDraft(todo);
  const nextTodo = {
    ...todo,
    lane: targetLane === "done" ? todo.lane : targetLane,
    sortOrder: targetLane === "done" ? todo.sortOrder : nextLocalSortOrder(targetLane, todo.id),
    done: targetLane === "done",
  };
  if (targetLane === "today" && !nextTodo.dueDate) {
    nextTodo.dueDate = state.selectedDate;
  }

  try {
    setStatus("Updating task...");
    updateTodo(nextTodo);
    if (state.detailTaskId === todo.id) {
      state.detailDraft = cloneTodoDraft(nextTodo);
    }
    render();
    const payload = await api(`/todos/${todo.id}`, {
      method: "PUT",
      body: serializeTodoForApi(nextTodo),
    });
    const hydrated = hydrateTodoFromServer(payload.todo);
    updateTodo(hydrated);
    if (state.detailTaskId === todo.id) {
      state.detailDraft = cloneTodoDraft(hydrated);
      state.detailDirty = false;
    }
    state.lastSyncedAt = Date.now();
    render();
    setStatus("Task moved.");
  } catch (error) {
    updateTodo(previous);
    if (state.detailTaskId === todo.id) {
      state.detailDraft = previous;
    }
    render();
    setStatus(error.message, true);
  }
}

async function reorderTodo(todoId, targetLane, targetTodoId = "", position = "after") {
  const dragged = state.todos.find((entry) => entry.id === todoId);
  if (!dragged || !canManualReorder() || dragged.done || targetLane === "done") {
    return;
  }

  const sourceLane = normalizeLane(dragged);
  const previousTodos = state.todos.map(cloneTodoDraft);
  const sourceItems = manualLaneTodos(sourceLane, todoId);
  const targetItems = sourceLane === targetLane ? sourceItems : manualLaneTodos(targetLane);
  const moved = { ...dragged, lane: targetLane, done: false };

  let nextTarget = [...targetItems];
  const insertIndex = targetTodoId
    ? Math.max(0, nextTarget.findIndex((entry) => entry.id === targetTodoId) + (position === "after" ? 1 : 0))
    : nextTarget.length;
  nextTarget.splice(insertIndex, 0, moved);

  const laneSnapshots = { [targetLane]: nextTarget };
  if (sourceLane !== targetLane) {
    laneSnapshots[sourceLane] = sourceItems;
  }

  const updates = [];
  Object.entries(laneSnapshots).forEach(([lane, todos]) => {
    todos.forEach((todo, index) => {
      updates.push({
        id: todo.id,
        lane,
        sortOrder: (index + 1) * 1024,
        done: false,
      });
    });
  });

  state.todos = state.todos.map((todo) => {
    const update = updates.find((entry) => entry.id === todo.id);
    return update ? { ...todo, lane: update.lane, sortOrder: update.sortOrder, done: false } : todo;
  });
  if (state.detailTaskId === todoId) {
    const updatedDetail = state.todos.find((entry) => entry.id === todoId);
    if (updatedDetail) {
      state.detailDraft = cloneTodoDraft(updatedDetail);
      state.detailDirty = false;
    }
  }
  render();

  try {
    const payload = await api("/todos/reorder", {
      method: "POST",
      body: { updates },
    });
    state.todos = (payload.todos || []).map(hydrateTodoFromServer);
    state.lastSyncedAt = Date.now();
    if (state.detailTaskId) {
      const detailTodo = state.todos.find((entry) => entry.id === state.detailTaskId);
      if (detailTodo) {
        state.detailDraft = cloneTodoDraft(detailTodo);
      }
    }
    render();
  } catch (error) {
    state.todos = previousTodos;
    if (state.detailTaskId) {
      const detailTodo = state.todos.find((entry) => entry.id === state.detailTaskId);
      state.detailDraft = detailTodo ? cloneTodoDraft(detailTodo) : null;
    }
    render();
    setStatus(error.message, true);
  }
}

function manualLaneTodos(lane, excludeId = "") {
  return [...state.todos]
    .filter((todo) => !todo.done && normalizeLane(todo) === lane && todo.id !== excludeId)
    .sort((left, right) => compareManualOrder(left, right) || compareCreatedDesc(left, right))
    .map(cloneTodoDraft);
}

function nextLocalSortOrder(lane, excludeId = "") {
  const laneTodos = manualLaneTodos(lane, excludeId);
  if (!laneTodos.length) {
    return 1024;
  }
  return Number(laneTodos[laneTodos.length - 1].sortOrder || 0) + 1024;
}

function filteredTodos() {
  const today = todayIso();
  return state.todos.filter((todo) => {
    if (isDailyCompletedToday(todo)) {
      return false;
    }
    if (state.filterMode === "today") {
      return !todo.done && (groupingLane(todo) === "today" || todo.dueDate === today);
    }
    if (state.filterMode === "overdue") {
      return Boolean(todo.dueDate) && todo.dueDate < today && !todo.done;
    }
    if (state.filterMode === "high") {
      return todo.priority === "high" && !todo.done;
    }
    return true;
  });
}

function sortTodos(todos) {
  const copy = [...todos];
  if (state.sortMode === "due") {
    return copy.sort((left, right) => compareDueDate(left, right) || compareCreatedDesc(left, right));
  }
  if (state.sortMode === "priority") {
    return copy.sort((left, right) => comparePriority(left, right) || compareDueDate(left, right) || compareCreatedDesc(left, right));
  }
  if (state.sortMode === "newest") {
    return copy.sort(compareCreatedDesc);
  }
  return copy.sort((left, right) => compareManualOrder(left, right) || compareCreatedDesc(left, right));
}

function groupingLane(todo) {
  if (todo.daily) {
    return "today";
  }
  if (todo.done) {
    return "done";
  }
  return normalizeLane(todo);
}

function normalizeLane(todo) {
  if (todo.daily) {
    return "today";
  }
  if (LANES.includes(todo.lane)) {
    return todo.lane === "done" ? "today" : todo.lane;
  }
  return inferLegacyLane(todo);
}

function hydrateTodoFromServer(todo) {
  const parsed = parseTodoDetails(todo.details || "");
  return {
    ...todo,
    details: parsed.details,
    subtasks: Array.isArray(todo.subtasks)
      ? todo.subtasks
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          id: String(item.id || `sub-${Math.random().toString(36).slice(2, 8)}`),
          text: String(item.text || "").trim(),
          done: Boolean(item.done),
        }))
        .filter((item) => item.text)
      : [],
    lane: todo.lane && LANES.includes(todo.lane) ? todo.lane : parsed.lane || inferLegacyLane(todo),
    sortOrder: Number.isFinite(Number(todo.sortOrder)) ? Number(todo.sortOrder) : 0,
    daily: Boolean(todo.daily),
    dailyCompletedOn: todo.dailyCompletedOn || null,
    streak: Number.isFinite(Number(todo.streak)) ? Number(todo.streak) : 0,
  };
}

function parseTodoDetails(rawDetails) {
  const match = rawDetails.match(LANE_PREFIX);
  if (!match) {
    return { lane: "", details: rawDetails.trim() };
  }
  return {
    lane: match[1].toLowerCase(),
    details: rawDetails.replace(LANE_PREFIX, "").trim(),
  };
}

function serializeTodoForApi(todo) {
  return {
    title: todo.title,
    details: String(todo.details || "").replace(LANE_PREFIX, "").trim(),
    subtasks: (todo.subtasks || []).map((item) => ({
      id: item.id,
      text: String(item.text || "").trim(),
      done: Boolean(item.done),
    })).filter((item) => item.text),
    dueDate: todo.dueDate || null,
    lane: normalizeLane(todo),
    sortOrder: Number.isFinite(Number(todo.sortOrder)) ? Number(todo.sortOrder) : 0,
    priority: todo.priority || "medium",
    done: Boolean(todo.daily) ? false : Boolean(todo.done),
    daily: Boolean(todo.daily),
    dailyCompletedOn: todo.dailyCompletedOn || null,
    streak: Number.isFinite(Number(todo.streak)) ? Number(todo.streak) : 0,
  };
}

function resetMissedDailyStreak(todo) {
  if (PLANBOARD_DOMAIN.resetMissedDailyStreak) {
    return PLANBOARD_DOMAIN.resetMissedDailyStreak(todo);
  }
  if (!todo || !todo.daily || Number(todo.streak || 0) <= 0) {
    return todo;
  }
  const today = todayIso();
  const yesterday = previousIsoDate(today);
  if (todo.dailyCompletedOn === today || todo.dailyCompletedOn === yesterday) {
    return todo;
  }
  return {
    ...todo,
    done: false,
    lane: "today",
    streak: 0,
  };
}

async function persistMissedDailyStreaks(todos) {
  if (!state.token || !Array.isArray(todos) || !todos.length) {
    return;
  }
  const pending = todos.filter((todo) => todo && todo.id && !dailyStreakResetIds.has(todo.id));
  if (!pending.length) {
    return;
  }
  pending.forEach((todo) => dailyStreakResetIds.add(todo.id));
  try {
    const results = await Promise.allSettled(
      pending.map((todo) =>
        api(`/todos/${todo.id}`, {
          method: "PUT",
          body: serializeTodoForApi(todo),
        })
      )
    );
    if (results.every((result) => result.status === "fulfilled")) {
      state.lastSyncedAt = Date.now();
      renderSyncMeta();
    }
  } finally {
    pending.forEach((todo) => dailyStreakResetIds.delete(todo.id));
  }
}

function inferLegacyLane(todo) {
  if (todo.done) {
    return "done";
  }
  if (!todo.dueDate) {
    return "ideas";
  }
  if (todo.dueDate === state.selectedDate) {
    return "today";
  }
  if (isSameWeek(todo.dueDate, state.selectedDate)) {
    return "week";
  }
  if (todo.dueDate.slice(0, 7) === state.selectedDate.slice(0, 7)) {
    return "month";
  }
  return "ideas";
}

function emptyTextForLane(lane) {
  return {
    ideas: "No tasks in this lane yet.",
    month: "Nothing planned for this month.",
    week: "Nothing planned for this week.",
    today: "Nothing planned for today.",
    done: "No completed tasks yet.",
  }[lane];
}

function plansForDate(iso) {
  return state.plans
    .filter((plan) => plan.planDate === iso)
    .sort((left, right) => (left.timeLabel || "99:99").localeCompare(right.timeLabel || "99:99"));
}

function deadlineTodosByDate() {
  if (PLANBOARD_DOMAIN.deadlineTodosByDate) {
    return PLANBOARD_DOMAIN.deadlineTodosByDate(state.todos);
  }
  const map = new Map();
  state.todos
    .filter((todo) => todo.dueDate && !todo.daily)
    .forEach((todo) => {
      const list = map.get(todo.dueDate) || [];
      list.push(todo);
      map.set(todo.dueDate, list);
    });
  return map;
}

function sortDeadlineTodos(todos) {
  return [...todos].sort((left, right) =>
    comparePriority(left, right) ||
    String(left.title || "").localeCompare(String(right.title || ""))
  );
}

function calendarMonthDates(year, month) {
  const first = new Date(year, month, 1);
  const start = weekStart(first);
  const dates = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    dates.push(date);
  }
  return dates;
}

function shiftCalendarYear(direction) {
  const current = new Date(`${state.selectedDate}T00:00:00`);
  current.setFullYear(current.getFullYear() + direction);
  current.setDate(1);
  state.selectedDate = dateToLocalIso(current);
  saveUiState();
  render();
}

function todosForDate(iso) {
  return state.todos.filter((todo) => {
    if (isDailyCompletedToday(todo)) {
      return false;
    }
    if (todo.dueDate === iso) {
      return true;
    }
    return iso === todayIso() && groupingLane(todo) === "today" && !todo.done;
  });
}

function updateTodo(nextTodo) {
  if (!nextTodo || !nextTodo.id) {
    return;
  }
  const exists = state.todos.some((todo) => todo.id === nextTodo.id);
  state.todos = exists
    ? state.todos.map((todo) => (todo.id === nextTodo.id ? nextTodo : todo))
    : [nextTodo, ...state.todos];
}

function upsertPlan(nextPlan) {
  if (!nextPlan || !nextPlan.id) {
    return;
  }
  const exists = state.plans.some((plan) => plan.id === nextPlan.id);
  state.plans = exists
    ? state.plans.map((plan) => (plan.id === nextPlan.id ? nextPlan : plan))
    : [...state.plans, nextPlan];
}

function upsertPortfolioItem(nextItem) {
  const hydrated = hydratePortfolioItemFromServer(nextItem);
  if (!hydrated || !hydrated.id) {
    return;
  }
  const exists = state.portfolioItems.some((item) => item.id === hydrated.id);
  state.portfolioItems = sortPortfolioItems(
    exists
      ? state.portfolioItems.map((item) => (item.id === hydrated.id ? hydrated : item))
      : [...state.portfolioItems, hydrated]
  );
}

function hydratePortfolioItemFromServer(item) {
  if (!item) {
    return null;
  }
  return {
    id: String(item.id || ""),
    type: ["project", "competition", "course"].includes(item.type) ? item.type : "project",
    title: String(item.title || ""),
    organization: String(item.organization || ""),
    role: String(item.role || ""),
    teammates: String(item.teammates || ""),
    startDate: item.startDate || null,
    endDate: item.endDate || null,
    status: ["planned", "active", "completed"].includes(item.status) ? item.status : "active",
    statusMode: ["auto", "manual"].includes(item.statusMode) ? item.statusMode : "manual",
    cert: Boolean(item.cert),
    achievement: String(item.achievement || ""),
    links: String(item.links || ""),
    notes: String(item.notes || ""),
    createdAt: String(item.createdAt || ""),
    updatedAt: String(item.updatedAt || ""),
  };
}

function sortPortfolioItems(items) {
  const normalized = [...(items || [])].filter(Boolean).map(withPortfolioEffectiveStatus);
  if (PORTFOLIO_UTILS.sortItems) {
    return PORTFOLIO_UTILS.sortItems(normalized);
  }
  const rank = { planned: 0, active: 1, completed: 2 };
  return normalized.sort((left, right) =>
    (rank[left.status] ?? 9) - (rank[right.status] ?? 9) ||
    String(right.startDate || "0000-00-00").localeCompare(String(left.startDate || "0000-00-00")) ||
    compareCreatedDesc(left, right)
  );
}

function filterPortfolioItems(items) {
  if (PORTFOLIO_UTILS.filterItems) {
    return sortPortfolioItems(PORTFOLIO_UTILS.filterItems(items, {
      type: state.portfolioFilter,
      year: state.portfolioYear,
      cert: state.portfolioCert,
      search: state.portfolioSearch,
    }));
  }
  const search = String(state.portfolioSearch || "").toLowerCase();
  return sortPortfolioItems(items).filter((item) =>
    (state.portfolioFilter === "all" || item.type === state.portfolioFilter) &&
    (state.portfolioYear === "all" || String(item.endDate || item.startDate || item.createdAt || "").startsWith(state.portfolioYear)) &&
    (state.portfolioCert === "all" || (state.portfolioCert === "cert" ? Boolean(item.cert) : !item.cert)) &&
    (!search || [item.title, item.organization, item.role, item.teammates, item.cert ? "cert certificate" : "", item.achievement, item.links, item.notes]
      .some((value) => String(value || "").toLowerCase().includes(search)))
  );
}

function groupPortfolioItems(items) {
  const normalized = [...(items || [])].filter(Boolean).map(withPortfolioEffectiveStatus);
  if (PORTFOLIO_UTILS.groupByStatus) {
    return PORTFOLIO_UTILS.groupByStatus(normalized);
  }
  return {
    active: normalized.filter((item) => item.status === "active"),
    planned: normalized.filter((item) => item.status === "planned"),
    completed: normalized.filter((item) => item.status === "completed"),
  };
}

function portfolioYearsForItems(items) {
  if (PORTFOLIO_UTILS.yearsForItems) {
    return PORTFOLIO_UTILS.yearsForItems(items);
  }
  return [...new Set((items || [])
    .map((item) => String(item.endDate || item.startDate || item.createdAt || "").slice(0, 4))
    .filter(Boolean))]
    .sort((left, right) => right.localeCompare(left));
}

function currentTaskDone(id) {
  return Boolean(state.todos.find((todo) => todo.id === id)?.done);
}

function currentTaskDailyMeta(id) {
  const todo = state.todos.find((entry) => entry.id === id);
  return {
    dailyCompletedOn: todo?.dailyCompletedOn || null,
    streak: Number(todo?.streak || 0),
  };
}

function currentTaskSubtasks(id) {
  if (!id) {
    return [];
  }
  return cloneTodoDraft(state.todos.find((todo) => todo.id === id) || { subtasks: [] }).subtasks || [];
}

function currentDetailTodo() {
  return state.detailTaskId ? state.todos.find((todo) => todo.id === state.detailTaskId) || null : null;
}

function openTaskDetail(todoId, options = {}) {
  if (!options.focusTitle && state.detailTaskId === todoId) {
    closeTaskDetail();
    return;
  }
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) {
    return;
  }
  state.detailTaskId = todo.id;
  state.detailDraft = cloneTodoDraft(todo);
  state.detailDirty = false;
  state.detailSaving = false;
  state.detailCompletedCollapsed = true;
  renderTaskDetail();
  renderBoard();
  if (options.focusTitle) {
    window.setTimeout(() => {
      detailTitleInput.focus();
      detailTitleInput.select();
    }, 0);
  }
}

function closeTaskDetail() {
  if (detailSaveTimerId) {
    window.clearTimeout(detailSaveTimerId);
    detailSaveTimerId = 0;
  }
  state.detailTaskId = "";
  state.detailDraft = null;
  state.detailDirty = false;
  state.detailSaving = false;
  state.detailCompletedCollapsed = true;
  renderTaskDetail();
  renderBoard();
}

function openTaskActionSheet(todoId) {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) {
    return;
  }
  state.taskActionTaskId = todo.id;
  renderTaskActionSheet();
}

function closeTaskActionSheet() {
  if (document.activeElement instanceof HTMLElement && taskActionOverlay.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  state.taskActionTaskId = "";
  renderTaskActionSheet();
}

function cloneTodoDraft(todo) {
  return {
    ...todo,
    subtasks: (todo.subtasks || []).map((item) => ({ ...item })),
  };
}

function updateDetailDraft(patch) {
  if (!state.detailDraft) {
    return;
  }
  state.detailDraft = {
    ...state.detailDraft,
    ...patch,
  };
  state.detailDirty = true;
  syncTaskDetailChrome(state.detailDraft);
  scheduleDetailSave();
}

function scheduleDetailSave() {
  if (detailSaveTimerId) {
    window.clearTimeout(detailSaveTimerId);
  }
  detailSaveTimerId = window.setTimeout(() => {
    flushDetailSave();
  }, 360);
}

async function flushDetailSave() {
  detailSaveTimerId = 0;
  if (!state.detailTaskId || !state.detailDraft || state.detailSaving || !state.detailDirty) {
    return;
  }
  const previous = currentDetailTodo();
  if (!previous) {
    return;
  }
  if (String(state.detailDraft.title || "").trim().length < 2) {
    detailSaveState.textContent = "Title must be at least 2 characters.";
    return;
  }
  const optimistic = hydrateTodoFromServer({
    ...previous,
    ...state.detailDraft,
    lane: normalizeLane(state.detailDraft),
  });

  state.detailSaving = true;
  if (optimistic) {
    updateTodo(optimistic);
    renderBoard();
  }
  renderTaskDetail();

  try {
    const payload = await api(`/todos/${state.detailTaskId}`, {
      method: "PUT",
      body: serializeTodoForApi(state.detailDraft),
    });
    const hydrated = hydrateTodoFromServer(payload.todo);
    updateTodo(hydrated);
    state.detailDraft = cloneTodoDraft(hydrated);
    state.detailDirty = false;
    state.detailSaving = false;
    state.lastSyncedAt = Date.now();
    render();
  } catch (error) {
    state.detailSaving = false;
    if (previous) {
      updateTodo(previous);
    }
    render();
    setStatus(error.message, true);
  }
}

function updateDetailSubtask(id, patch) {
  if (!state.detailDraft) {
    return;
  }
  state.detailDraft = {
    ...state.detailDraft,
    subtasks: (state.detailDraft.subtasks || []).map((item) => item.id === id ? { ...item, ...patch } : item),
  };
  state.detailDirty = true;
  renderTaskDetail();
  scheduleDetailSave();
}

function removeDetailSubtask(id) {
  if (!state.detailDraft) {
    return;
  }
  state.detailDraft = {
    ...state.detailDraft,
    subtasks: (state.detailDraft.subtasks || []).filter((item) => item.id !== id),
  };
  state.detailDirty = true;
  renderTaskDetail();
  scheduleDetailSave();
}

function addDetailSubtask() {
  if (!state.detailDraft) {
    return;
  }
  const text = detailSubtaskInput.value.trim();
  if (!text) {
    return;
  }
  state.detailDraft = {
    ...state.detailDraft,
    subtasks: [
      ...(state.detailDraft.subtasks || []),
      { id: crypto.randomUUID ? crypto.randomUUID() : `sub-${Date.now()}`, text, done: false },
    ],
  };
  detailSubtaskInput.value = "";
  state.detailDirty = true;
  renderTaskDetail();
  scheduleDetailSave();
}

async function handleQuickAdd(event) {
  event.preventDefault();
  if (!quickAddInput || !quickAddLaneInput) {
    return;
  }
  const title = quickAddInput.value.trim();
  if (title.length < 2) {
    setStatus("Task title is too short.", true);
    return;
  }
  const lane = quickAddLaneInput.value || "ideas";
  try {
    setStatus("Adding task...");
    const payload = await api("/todos", {
      method: "POST",
      body: {
        title,
        details: "",
        subtasks: [],
        dueDate: lane === "today" ? state.selectedDate : null,
        lane,
        sortOrder: nextLocalSortOrder(lane),
        priority: "medium",
        done: false,
      },
    });
    updateTodo(hydrateTodoFromServer(payload.todo));
    state.lastSyncedAt = Date.now();
    quickAddInput.value = "";
    render();
    setStatus("Task added.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

function finalizeUndoAction() {
  if (!state.undoAction) {
    return;
  }
  const action = state.undoAction;
  if (undoTimerId) {
    window.clearTimeout(undoTimerId);
    undoTimerId = 0;
  }
  state.undoAction = null;
  renderUndoToast();
  action.commit().catch((error) => {
    setStatus(error.message || "Could not finish the action.", true);
  });
}

function setUndoAction(action) {
  finalizePendingUndo(false);
  state.undoAction = action;
  renderUndoToast();
  undoTimerId = window.setTimeout(() => {
    finalizePendingUndo(false);
  }, 5000);
}

function finalizePendingUndo(rollback) {
  if (!state.undoAction) {
    return;
  }
  const action = state.undoAction;
  if (undoTimerId) {
    window.clearTimeout(undoTimerId);
    undoTimerId = 0;
  }
  state.undoAction = null;
  renderUndoToast();
  if (rollback) {
    Promise.resolve(action.rollback()).catch((error) => {
      setStatus(error.message || "Could not undo the action.", true);
    });
    return;
  }
  action.commit().catch((error) => {
    setStatus(error.message || "Could not finish the action.", true);
  });
}

function undoLastAction() {
  finalizePendingUndo(true);
}

function queueClearCompletedUndo(completed) {
  const previousTodos = state.todos.map(cloneTodoDraft);
  state.todos = state.todos.filter((todo) => !todo.done);
  render();
  setUndoAction({
    label: `${completed.length} completed task${completed.length === 1 ? "" : "s"} cleared`,
    rollback: () => {
      state.todos = previousTodos;
      render();
      setStatus("Clear undone.");
    },
    commit: async () => {
      await api("/todos/clear-completed", { method: "POST" });
      state.lastSyncedAt = Date.now();
      render();
      setStatus("Completed tasks cleared.");
    },
  });
}

function queuePlanDeleteUndo(planId) {
  const plan = state.plans.find((entry) => entry.id === planId);
  if (!plan) {
    return;
  }
  const previousPlans = state.plans.map((entry) => ({ ...entry }));
  state.plans = state.plans.filter((entry) => entry.id !== planId);
  render();
  setUndoAction({
    label: "Plan deleted",
    rollback: () => {
      state.plans = previousPlans;
      render();
      setStatus("Delete undone.");
    },
    commit: async () => {
      await api(`/plans/${planId}`, { method: "DELETE" });
      state.lastSyncedAt = Date.now();
      render();
      setStatus("Plan deleted.");
    },
  });
}

function queuePortfolioDeleteUndo(itemId) {
  const item = state.portfolioItems.find((entry) => entry.id === itemId);
  if (!item) {
    return;
  }
  const previousItems = state.portfolioItems.map((entry) => ({ ...entry }));
  state.portfolioItems = state.portfolioItems.filter((entry) => entry.id !== itemId);
  if (state.portfolioDetailItemId === itemId) {
    state.portfolioDetailItemId = "";
  }
  render();
  setUndoAction({
    label: "Portfolio item deleted",
    rollback: () => {
      state.portfolioItems = previousItems;
      render();
      setStatus("Delete undone.");
    },
    commit: async () => {
      await api(`/portfolio/${itemId}`, { method: "DELETE" });
      state.lastSyncedAt = Date.now();
      render();
      setStatus("Portfolio item deleted.");
    },
  });
}

async function toggleTodoDone(todoId, nextDone) {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) {
    return false;
  }
  const previous = cloneTodoDraft(todo);
  const optimistic = todo.daily && nextDone ? completeDailyTodo(todo) : { ...todo, done: nextDone };
  updateTodo(optimistic);
  if (state.detailTaskId === todo.id) {
    state.detailDraft = cloneTodoDraft(optimistic);
    state.detailDirty = false;
  }
  render();

  try {
    const payload = await api(`/todos/${todo.id}`, {
      method: "PUT",
      body: serializeTodoForApi(optimistic),
    });
    const hydrated = hydrateTodoFromServer(payload.todo);
    updateTodo(hydrated);
    if (hydrated.daily && isDailyCompletedToday(hydrated) && state.detailTaskId === todo.id) {
      closeTaskDetail();
    } else if (state.detailTaskId === todo.id) {
      state.detailDraft = cloneTodoDraft(hydrated);
    }
    state.lastSyncedAt = Date.now();
    render();
    setUndoAction({
      label: nextDone ? "Task marked done" : "Task marked active",
      rollback: async () => {
        const revertPayload = await api(`/todos/${todo.id}`, {
          method: "PUT",
          body: serializeTodoForApi(previous),
        });
        const reverted = hydrateTodoFromServer(revertPayload.todo);
        updateTodo(reverted);
        if (state.detailTaskId === todo.id) {
          state.detailDraft = cloneTodoDraft(reverted);
        }
        state.lastSyncedAt = Date.now();
        render();
        setStatus("Change undone.");
      },
      commit: async () => Promise.resolve(),
    });
    return true;
  } catch (error) {
    updateTodo(previous);
    if (state.detailTaskId === todo.id) {
      state.detailDraft = previous;
    }
    render();
    setStatus(error.message, true);
    return false;
  }
}

async function deleteTodo(todoId) {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) {
    return;
  }
  try {
    const previousTodos = state.todos.map(cloneTodoDraft);
    state.todos = state.todos.filter((entry) => entry.id !== todoId);
    if (state.detailTaskId === todoId) {
      closeTaskDetail();
    }
    render();
    setUndoAction({
      label: "Task deleted",
      rollback: () => {
        state.todos = previousTodos;
        render();
        setStatus("Delete undone.");
      },
      commit: async () => {
        await api(`/todos/${todoId}`, { method: "DELETE" });
        state.lastSyncedAt = Date.now();
        render();
        setStatus("Task deleted.");
      },
    });
  } catch (error) {
    setStatus(error.message, true);
  }
}

function openTaskEditor(todo) {
  composerOverlay.dataset.locked = "true";
  composerOverlay.dataset.lockedTab = "task";
  taskEditorId.value = todo.id;
  setComposerTab("task");
  todoTitleInput.value = todo.title;
  document.querySelector("#todoDetailsInput").value = todo.details || "";
  todoLaneInput.value = normalizeLane(todo);
  todoPriorityInput.value = todo.priority || "medium";
  todoDueDateInput.value = todo.dueDate || "";
  todoDailyInput.checked = Boolean(todo.daily);
  taskSubmitButton.textContent = "Save Task";
  composerEyebrow.textContent = "Edit";
  composerTitle.textContent = "Edit Task";
  composerHint.textContent = "Update this task without changing the current view.";
  composerOverlay.classList.remove("composer-overlay--hidden");
  focusComposerField("task");
}

function syncTaskDateByLane() {
  const lane = todoLaneInput.value;
  if (taskEditorId.value) {
    return;
  }
  if (lane === "today" && !todoDueDateInput.value) {
    todoDueDateInput.value = state.selectedDate;
  }
}

function inferStartingLane(requestedLane, dueDate, isDaily = false) {
  if (PLANBOARD_DOMAIN.inferStartingLane) {
    return PLANBOARD_DOMAIN.inferStartingLane(requestedLane, dueDate, isDaily, todayIso());
  }
  return isDaily ? "today" : requestedLane || (dueDate ? "month" : "ideas");
}

function syncComposerNote() {
  if (state.activeComposerTab !== "note" || composerOverlay.classList.contains("composer-overlay--hidden")) {
    return;
  }
  const note = state.notesByDate[state.selectedDate] || "";
  dailyNoteInput.value = note;
  notePreviewText.textContent = note ? summarize(note, 160) : "No note for this day yet.";
}

function openPlanEditor(plan) {
  composerOverlay.dataset.locked = "true";
  composerOverlay.dataset.lockedTab = "plan";
  planEditorId.value = plan.id;
  setComposerTab("plan");
  planDateInput.value = plan.planDate;
  state.selectedDate = plan.planDate;
  syncDateInputs();
  document.querySelector("#planTimeInput").value = plan.timeLabel || "";
  planTitleInput.value = plan.title;
  planDetailsInput.value = plan.details || "";
  planSubmitButton.textContent = "Save Plan";
  composerEyebrow.textContent = "Edit";
  composerTitle.textContent = "Edit Plan";
  composerHint.textContent = "Update this scheduled item for the selected day.";
  composerOverlay.classList.remove("composer-overlay--hidden");
  focusComposerField("plan");
}

function openPortfolioEditor(item) {
  composerOverlay.dataset.locked = "true";
  composerOverlay.dataset.lockedTab = "portfolio";
  portfolioEditorId.value = item.id;
  setComposerTab("portfolio");
  portfolioTypeInput.value = item.type || "project";
  portfolioStatusInput.value = item.statusMode === "auto" ? "auto" : item.status || "active";
  portfolioTitleInput.value = item.title || "";
  portfolioOrganizationInput.value = item.organization || "";
  portfolioRoleInput.value = item.role || "";
  portfolioStartDateInput.value = item.startDate || "";
  portfolioEndDateInput.value = item.endDate || "";
  portfolioTeammatesInput.value = item.teammates || "";
  portfolioCertInput.checked = Boolean(item.cert);
  portfolioAchievementInput.value = item.achievement || "";
  portfolioLinksInput.value = item.links || "";
  portfolioNotesInput.value = item.notes || "";
  portfolioMoreDetails.open = Boolean(item.organization || item.role || item.teammates || item.links || item.notes);
  portfolioSubmitButton.textContent = "Save Portfolio Item";
  composerEyebrow.textContent = "Edit";
  composerTitle.textContent = "Edit Portfolio";
  composerHint.textContent = "Update this portfolio record.";
  composerOverlay.classList.remove("composer-overlay--hidden");
  focusComposerField("portfolio");
}

async function movePortfolioItemToStatus(itemId, targetStatus) {
  if (!["planned", "active", "completed"].includes(targetStatus)) {
    return;
  }
  const item = state.portfolioItems.find((entry) => entry.id === itemId);
  if (!item || portfolioEffectiveStatus(item) === targetStatus) {
    return;
  }
  const previous = { ...item };
  const nextItem = { ...item, status: targetStatus, statusMode: "manual" };
  try {
    setStatus("Updating portfolio item...");
    upsertPortfolioItem(nextItem);
    renderPortfolio();
    const payload = await api(`/portfolio/${itemId}`, {
      method: "PUT",
      body: serializePortfolioItemForApi(nextItem),
    });
    upsertPortfolioItem(payload.portfolioItem);
    state.lastSyncedAt = Date.now();
    render();
    setStatus("Portfolio item moved.");
  } catch (error) {
    upsertPortfolioItem(previous);
    render();
    setStatus(error.message, true);
  }
}

function serializePortfolioItemForApi(item) {
  return {
    type: ["project", "competition", "course"].includes(item.type) ? item.type : "project",
    title: item.title || "",
    organization: item.organization || "",
    role: item.role || "",
    teammates: item.teammates || "",
    startDate: item.startDate || null,
    endDate: item.endDate || null,
    status: item.status || "active",
    statusMode: item.statusMode === "auto" ? "auto" : "manual",
    cert: Boolean(item.cert),
    achievement: item.achievement || "",
    links: item.links || "",
    notes: item.notes || "",
  };
}

function updateFilterButtons() {
  Object.entries(filterButtons).forEach(([mode, button]) => {
    button.classList.toggle("is-active", state.filterMode === mode);
  });
}

function focusComposerField(tab) {
  window.setTimeout(() => {
    if (tab === "task") {
      todoTitleInput.focus();
      return;
    }
    if (tab === "note") {
      dailyNoteInput.focus();
      return;
    }
    if (tab === "portfolio") {
      portfolioTitleInput.focus();
      return;
    }
    planTitleInput.focus();
  }, 0);
}

function syncDateInputs() {
  selectedDateInput.value = state.selectedDate;
  planDateInput.value = state.selectedDate;
}

async function refreshFromServer(silent) {
  if (!state.token || state.syncing || (silent && state.undoAction)) {
    return;
  }
  state.syncing = true;
  renderBoard();
  if (!silent) {
    setStatus("Refreshing...");
  }

  try {
    const payload = await api("/bootstrap");
    applyBootstrap(payload);
    render();
    if (!silent) {
    setStatus("Updated.");
    }
  } catch (error) {
    if (error.status === 401) {
      clearSession(true);
      setAuthMessage("Session expired. Please sign in again.", true);
      return;
    }
    if (!silent) {
      setStatus(error.message, true);
    }
  } finally {
    state.syncing = false;
    renderSyncMeta();
    renderBoard();
  }
}

function startAutoSync() {
  stopAutoSync();
  if (USE_FIREBASE && FIREBASE_ADAPTER && FIREBASE_ADAPTER.subscribeBootstrap) {
    const generation = ++liveSyncGeneration;
    FIREBASE_ADAPTER.subscribeBootstrap(
      (payload) => {
        applyBootstrap(payload);
        state.lastSyncedAt = Date.now();
        render();
      },
      (error) => {
        setStatus(error.message, true);
      }
    ).then((unsubscribe) => {
      if (generation !== liveSyncGeneration) {
        unsubscribe();
        return;
      }
      liveSyncUnsubscribe = unsubscribe;
    }).catch((error) => {
      setStatus(error.message, true);
    });
    syncLabelTimerId = window.setInterval(() => {
      renderSyncMeta();
    }, 30000);
    return;
  }
  syncIntervalId = window.setInterval(() => {
    refreshFromServer(true);
  }, AUTO_SYNC_MS);
  syncLabelTimerId = window.setInterval(() => {
    renderSyncMeta();
  }, 30000);
}

function stopAutoSync() {
  liveSyncGeneration += 1;
  if (liveSyncUnsubscribe) {
    liveSyncUnsubscribe();
    liveSyncUnsubscribe = null;
  }
  if (syncIntervalId) {
    window.clearInterval(syncIntervalId);
    syncIntervalId = 0;
  }
  if (syncLabelTimerId) {
    window.clearInterval(syncLabelTimerId);
    syncLabelTimerId = 0;
  }
}

function setAuthMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.classList.toggle("is-error", Boolean(isError));
}

function setStatus(message, isError = false) {
  if (statusTimerId) {
    window.clearTimeout(statusTimerId);
    statusTimerId = 0;
  }
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", Boolean(isError));
  if (!message || isError) {
    return;
  }
  if (message === "Ready." || /(saved|updated|deleted|cleared|enabled|moved)\.$/i.test(message)) {
    statusTimerId = window.setTimeout(() => {
      statusMessage.textContent = "";
      statusMessage.classList.remove("is-error");
      statusTimerId = 0;
    }, 2200);
  }
}

async function api(path, options = {}) {
  if (!API_CLIENT) {
    const error = new Error("API client failed to load.");
    error.status = 500;
    throw error;
  }
  return API_CLIENT.request(path, { ...options, token: state.token });
}

function summarize(text, limit) {
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}...` : text;
}

function relativeTime(timestamp) {
  const diffSeconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (diffSeconds < 10) {
    return "just now";
  }
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function todayIso() {
  return vietnamTodayIso();
}

function vietnamTodayIso() {
  return PLANBOARD_DOMAIN.vietnamTodayIso
    ? PLANBOARD_DOMAIN.vietnamTodayIso()
    : new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function previousIsoDate(iso) {
  return PLANBOARD_DOMAIN.previousIsoDate
    ? PLANBOARD_DOMAIN.previousIsoDate(iso)
    : (() => {
      const date = new Date(`${iso}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() - 1);
      return date.toISOString().slice(0, 10);
    })();
}

function isDailyCompletedToday(todo) {
  return PLANBOARD_DOMAIN.isDailyCompletedToday
    ? PLANBOARD_DOMAIN.isDailyCompletedToday(todo)
    : Boolean(todo && todo.daily && todo.dailyCompletedOn === vietnamTodayIso());
}

function completeDailyTodo(todo) {
  return PLANBOARD_DOMAIN.completeDailyTodo
    ? PLANBOARD_DOMAIN.completeDailyTodo(todo)
    : {
      ...todo,
      done: false,
      lane: "today",
      daily: true,
      dailyCompletedOn: vietnamTodayIso(),
      streak: todo.dailyCompletedOn === previousIsoDate(vietnamTodayIso()) ? Number(todo.streak || 0) + 1 : 1,
    };
}

function normalizeIsoDateInput(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }
  const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const iso = `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
    const parsed = new Date(`${iso}T00:00:00`);
    if (!Number.isNaN(parsed.getTime()) && dateToLocalIso(parsed) === iso) {
      return iso;
    }
  }
  return raw;
}

function dateToLocalIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameWeek(leftIso, rightIso) {
  const left = new Date(`${leftIso}T00:00:00`);
  const right = new Date(`${rightIso}T00:00:00`);
  const leftWeekStart = weekStart(left);
  const rightWeekStart = weekStart(right);
  return leftWeekStart.getTime() === rightWeekStart.getTime();
}

function weekStart(date) {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  try {
    await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
  } catch {}
}

function laneLabel(lane) {
  return {
    ideas: "Ideas",
    month: "This Month",
    week: "This Week",
    today: "Today",
    done: "Completed",
  }[lane] || lane;
}

function comparePriority(left, right) {
  const rank = { high: 0, medium: 1, low: 2 };
  return (rank[left.priority] ?? 9) - (rank[right.priority] ?? 9);
}

function compareDueDate(left, right) {
  const l = left.dueDate || "9999-12-31";
  const r = right.dueDate || "9999-12-31";
  return l.localeCompare(r);
}

function compareManualOrder(left, right) {
  return Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
}

function compareCreatedDesc(left, right) {
  return String(right.createdAt || "").localeCompare(String(left.createdAt || ""));
}

function canDragTodo(todo) {
  return Boolean(todo && todo.id && !todo.daily);
}

function canManualReorder() {
  return state.sortMode === "manual";
}

function initialsForName(name) {
  if (!name || name === "-") {
    return "PB";
  }
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "PB";
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    setStatus("This browser does not support notifications.", true);
    return;
  }
  if (Notification.permission === "granted") {
    setStatus("In-app alerts are already enabled.");
    render();
    scanNotifications();
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    setStatus("In-app alerts enabled.");
    render();
    scanNotifications();
    return;
  }
  setStatus("In-app alert permission was not granted.", true);
  render();
}

function updateNotificationButton() {
  if (!("Notification" in window)) {
    notificationButton.textContent = "Notifications Unsupported";
    notificationButton.disabled = true;
    return;
  }
  notificationButton.disabled = false;
  notificationButton.textContent = Notification.permission === "granted" ? "In-app Alerts On" : "Enable In-app Alerts";
}

function scanNotifications() {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  const today = todayIso();
  const now = new Date();

  state.todos
    .filter((todo) => !todo.done && todo.dueDate && todo.dueDate <= today)
    .forEach((todo) => {
      const key = `todo:${todo.id}:${todo.dueDate}`;
      if (state.notified.includes(key)) {
        return;
      }
      const title = todo.dueDate < today ? "Overdue task" : "Task due today";
      new Notification(title, { body: todo.title });
      state.notified.push(key);
    });

  state.plans
    .filter((plan) => plan.planDate === today && plan.timeLabel)
    .forEach((plan) => {
      const key = `plan:${plan.id}:${plan.timeLabel}`;
      if (state.notified.includes(key)) {
        return;
      }
      const [hour, minute] = plan.timeLabel.split(":").map(Number);
      const scheduled = new Date(now);
      scheduled.setHours(hour || 0, minute || 0, 0, 0);
      const diffMinutes = Math.round((scheduled.getTime() - now.getTime()) / 60000);
      if (diffMinutes < 0 || diffMinutes > 15) {
        return;
      }
      new Notification("Upcoming plan", { body: `${plan.timeLabel} · ${plan.title}` });
      state.notified.push(key);
    });

  saveNotifiedState();
}
