const APP_CONFIG = window.__PLANBOARD_CONFIG__ || {};
const DATA_SOURCE = APP_CONFIG.DATA_SOURCE || "rest";
const PLANBOARD_DOMAIN = window.PlanboardDomain || {};
const PLANNER_UTILS = window.PlannerUtils || {};
const PORTFOLIO_UTILS = window.PlanboardPortfolioUtils || {};
const FIREBASE_ADAPTER = window.PlanboardFirebaseAdapter || null;
const API_CLIENT = window.PlanboardApiClient
  ? window.PlanboardApiClient.create({ config: APP_CONFIG, firebaseAdapter: FIREBASE_ADAPTER })
  : null;
const USE_FIREBASE = API_CLIENT ? API_CLIENT.useFirebase : DATA_SOURCE === "firebase";
const {
  compareCreatedDesc,
  compareDueDate,
  compareManualOrder,
  comparePriority,
  dateToLocalIso,
  escapeHtml,
  isSameWeek,
  laneLabel,
  normalizeIsoDateInput,
  previousIsoDate,
  todayIso,
  vietnamTodayIso,
  weekStart,
} = PLANNER_UTILS;
const AUTO_SYNC_MS = 15000;
const TOKEN_KEY = "planboard-token";
const UI_KEY = "planboard-ui";
const NOTIFICATION_KEY = "planboard-notified";
const WEEKLY_ARCHIVE_KEY = "planboard-weekly-archives";
const WEEKLY_PROJECTS_KEY = "planner-weekly-projects";
const DEFAULT_THEME_KEY = "planboard-default-theme";
const DEFAULT_THEME = "aurora";
const THEMES = [DEFAULT_THEME];
const LANES = PLANBOARD_DOMAIN.LANES || ["ideas", "month", "week", "today", "done"];
const BOARD_LANES = ["ideas", "month", "daily", "done"];
const LANE_PREFIX = PLANBOARD_DOMAIN.LANE_PREFIX || /^\[\[lane:(ideas|month|week|today|done)\]\]\s*/i;
const PROJECT_ID_PREFIX = /^\[\[project-id:([^\]]+)\]\]\s*/i;
const PROJECT_PREFIX = /^\[\[project:([^\]]+)\]\]\s*/i;
const MISSED_PREFIX = /^\[\[missed:1\]\]\s*/i;
const WEEKLY_DAYS_PREFIX = /^\[\[weekly-days:([^\]]*)\]\]\s*/i;

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

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
const allTaskCountHeader = document.querySelector("#allTaskCountHeader");
const weeklyViewButton = document.querySelector("#weeklyViewButton");
const boardViewButton = document.querySelector("#boardViewButton");
const calendarViewButton = document.querySelector("#calendarViewButton");
const portfolioViewButton = document.querySelector("#portfolioViewButton");
const weeklyView = document.querySelector("#weeklyView");
const boardView = document.querySelector("#boardView");
const calendarView = document.querySelector("#calendarView");
const portfolioView = document.querySelector("#portfolioView");
const weeklyRangeLabel = document.querySelector("#weeklyRangeLabel");
const weeklyPlanningLabel = document.querySelector("#weeklyPlanningLabel");
const weeklyFocusLabel = document.querySelector("#weeklyFocusLabel");
const weeklyProgressLabel = document.querySelector("#weeklyProgressLabel");
const weeklyProgressBar = document.querySelector("#weeklyProgressBar");
const weeklyPlannerPage = document.querySelector("#weeklyPlannerPage");
const weeklyDays = document.querySelector("#weeklyDays");
const weeklyProgress = document.querySelector("#weeklyProgress");
const weeklyBacklog = document.querySelector("#weeklyBacklog");
const weeklyBacklogList = document.querySelector("#weeklyBacklogList");
const weeklyBacklogCount = document.querySelector("#weeklyBacklogCount");
const weeklyPreviousButton = document.querySelector("#weeklyPreviousButton");
const weeklyTodayButton = document.querySelector("#weeklyTodayButton");
const weeklyNextButton = document.querySelector("#weeklyNextButton");
const weeklyShowAllButton = document.querySelector("#weeklyShowAllButton");
const weeklyPlannerButton = document.querySelector("#weeklyPlannerButton");
const weeklyArchiveButton = document.querySelector("#weeklyArchiveButton");
const weeklyStatsButton = document.querySelector("#weeklyStatsButton");
const weeklyEndButton = document.querySelector("#weeklyEndButton");
const weeklyAddProjectButton = document.querySelector("#weeklyAddProjectButton");
const weeklyProjectList = document.querySelector("#weeklyProjectList");
const weeklyArchivePanel = document.querySelector("#weeklyArchivePanel");
const weeklyClearArchiveButton = document.querySelector("#weeklyClearArchiveButton");
const weeklyArchiveList = document.querySelector("#weeklyArchiveList");
const weeklyStatsPanel = document.querySelector("#weeklyStatsPanel");
const weeklyStatsGrid = document.querySelector("#weeklyStatsGrid");
const weeklyWeekdayStats = document.querySelector("#weeklyWeekdayStats");
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
const sidebarToggleButton = document.querySelector("#sidebarToggleButton");
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
const todoProjectInput = document.querySelector("#todoProjectInput");
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
const filterStateLabel = document.querySelector("#filterStateLabel");
const filterButtons = {
  all: document.querySelector("#filterAllButton"),
  today: document.querySelector("#filterTodayButton"),
  overdue: document.querySelector("#filterOverdueButton"),
  high: document.querySelector("#filterHighButton"),
};
const sortSelect = document.querySelector("#sortSelect");
const resetAllButton = document.querySelector("#resetAllButton");
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
  daily: document.querySelector("#lane-daily"),
  done: document.querySelector("#lane-done"),
};

const laneCountTargets = {
  ideas: document.querySelector("#count-ideas"),
  month: document.querySelector("#count-month"),
  daily: document.querySelector("#count-daily"),
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
  sidebarCollapsed: loadUiState().sidebarCollapsed,
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
  weeklyFocusDate: "",
  weeklyPanel: "planner",
  weeklyAddingProject: false,
  weeklyAssignTaskId: "",
  weeklyArchives: [],
  weeklyProjects: [],
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
    activeView: "weekly",
    portfolioFilter: "all",
    portfolioYear: "all",
    portfolioCert: "all",
    portfolioSearch: "",
    filterMode: "all",
    mobileView: "daily",
    sortMode: "manual",
    theme: localStorage.getItem(DEFAULT_THEME_KEY) || DEFAULT_THEME,
    sidebarCollapsed: false,
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(UI_KEY) || "null");
    const activeView = "weekly";
    const portfolioFilter = parsed && ["all", "project", "competition", "course"].includes(parsed.portfolioFilter)
      ? parsed.portfolioFilter
      : "all";
    const portfolioCert = parsed && ["all", "cert", "no-cert"].includes(parsed.portfolioCert)
      ? parsed.portfolioCert
      : "all";
    const mobileView = parsed && ["daily", "ideas", "month", "done", "boardtools", "filtered"].includes(parsed.mobileView)
      ? parsed.mobileView
      : "daily";
    return {
      ...defaults,
      ...(parsed || {}),
      activeView,
      portfolioFilter,
      portfolioYear: String((parsed && parsed.portfolioYear) || "all"),
      portfolioCert,
      portfolioSearch: String((parsed && parsed.portfolioSearch) || ""),
      mobileView,
      sidebarCollapsed: Boolean(parsed && parsed.sidebarCollapsed),
      selectedDate: normalizeIsoDateInput(parsed && parsed.selectedDate) || defaults.selectedDate,
      theme: THEMES.includes(defaults.theme) ? defaults.theme : DEFAULT_THEME,
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
      sidebarCollapsed: state.sidebarCollapsed,
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

function weeklyArchiveStorageKey(userId = state?.user?.id || "") {
  return userId ? `${WEEKLY_ARCHIVE_KEY}:${userId}` : WEEKLY_ARCHIVE_KEY;
}

function weeklyProjectsStorageKey(userId = state?.user?.id || "") {
  return userId ? `${WEEKLY_PROJECTS_KEY}:${userId}` : WEEKLY_PROJECTS_KEY;
}

function loadWeeklyArchives(userId = "") {
  try {
    const value = JSON.parse(localStorage.getItem(weeklyArchiveStorageKey(userId)) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function loadWeeklyProjects(userId = "") {
  try {
    const value = JSON.parse(localStorage.getItem(weeklyProjectsStorageKey(userId)) || "[]");
    return Array.isArray(value)
      ? value
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          id: String(item.id || `weekly-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`),
          title: String(item.title || "").trim(),
          createdAt: item.createdAt || new Date().toISOString(),
        }))
        .filter((item) => item.title)
      : [];
  } catch {
    return [];
  }
}

function saveWeeklyArchives() {
  localStorage.setItem(weeklyArchiveStorageKey(), JSON.stringify(state.weeklyArchives.slice(0, 52)));
}

function saveWeeklyProjects() {
  localStorage.setItem(weeklyProjectsStorageKey(), JSON.stringify(state.weeklyProjects));
}

function hydrateWeeklyProjectFromServer(project) {
  return {
    id: String(project?.id || ""),
    title: String(project?.title || "").trim(),
    createdAt: project?.createdAt || new Date().toISOString(),
    updatedAt: project?.updatedAt || project?.createdAt || new Date().toISOString(),
  };
}

async function migrateLocalWeeklyProjects() {
  const localProjects = loadWeeklyProjects(state.user?.id || "");
  if (!localProjects.length) return;
  const existingTitles = new Set(state.weeklyProjects.map((project) => project.title.trim().toLowerCase()));
  const migrated = [];
  for (const project of localProjects) {
    const title = String(project.title || "").trim();
    if (!title || existingTitles.has(title.toLowerCase())) continue;
    try {
      const payload = await api("/weekly-projects", { method: "POST", body: { title } });
      migrated.push(hydrateWeeklyProjectFromServer(payload.weeklyProject));
      existingTitles.add(title.toLowerCase());
    } catch {}
  }
  if (migrated.length) {
    state.weeklyProjects = [...state.weeklyProjects, ...migrated];
    render();
  }
  localStorage.removeItem(weeklyProjectsStorageKey());
}

function clearLocalWorkspaceCaches() {
  state.weeklyArchives = [];
  state.weeklyProjects = [];
  localStorage.removeItem(weeklyArchiveStorageKey());
  localStorage.removeItem(weeklyProjectsStorageKey());
  state.notified = [];
  saveNotifiedState();
}

async function resetAllData() {
  if (!state.user) {
    setStatus("Sign in before resetting data.", true);
    return;
  }
  const confirmed = await showResetAllModal();
  if (!confirmed) return;
  try {
    setStatus("Resetting workspace...");
    await api("/reset", { method: "POST" });
    finalizePendingUndo(false);
    state.notesByDate = {};
    state.plans = [];
    state.portfolioItems = [];
    state.todos = [];
    state.detailTaskId = "";
    state.detailDraft = null;
    state.detailDirty = false;
    state.detailSaving = false;
    state.taskActionTaskId = "";
    state.portfolioDetailItemId = "";
    state.weeklyAssignTaskId = "";
    state.weeklyAddingProject = false;
    state.weeklyPanel = "planner";
    state.weeklyFocusDate = "";
    clearLocalWorkspaceCaches();
    closeTaskDetail();
    closePortfolioDetail();
    closeComposer();
    await refreshFromServer(false);
    setStatus("Workspace reset.");
  } catch (error) {
    setStatus(error.message || "Could not reset workspace.", true);
  }
}

function bindEvents() {
  document.querySelector("#showLoginButton").addEventListener("click", () => setAuthMode("login"));
  document.querySelector("#showRegisterButton").addEventListener("click", () => setAuthMode("register"));
  document.querySelector("#closeComposerButton").addEventListener("click", closeComposer);
  sidebarToggleButton.addEventListener("click", () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    saveUiState();
    renderSidebarState();
  });

  weeklyViewButton.addEventListener("click", () => setActiveView("weekly"));
  boardViewButton.addEventListener("click", () => setActiveView("board"));
  calendarViewButton.addEventListener("click", () => setActiveView("calendar"));
  portfolioViewButton.addEventListener("click", () => setActiveView("portfolio"));
  weeklyPreviousButton.addEventListener("click", () => shiftWeeklyView(-7));
  weeklyTodayButton.addEventListener("click", () => {
    state.selectedDate = todayIso();
    state.weeklyFocusDate = "";
    saveUiState();
    render();
  });
  weeklyNextButton.addEventListener("click", () => shiftWeeklyView(7));
  weeklyShowAllButton.addEventListener("click", () => {
    state.weeklyFocusDate = "__all__";
    renderWeekly();
  });
  weeklyPlannerButton.addEventListener("click", () => setWeeklyPage("planner"));
  weeklyArchiveButton.addEventListener("click", () => setWeeklyPage("archive"));
  weeklyStatsButton.addEventListener("click", () => setWeeklyPage("stats"));
  weeklyEndButton.addEventListener("click", endCurrentWeek);
  weeklyAddProjectButton.addEventListener("click", addWeeklyProject);
  weeklyClearArchiveButton.addEventListener("click", () => {
    if (!state.weeklyArchives.length || !window.confirm("Clear the weekly archive?")) return;
    state.weeklyArchives = [];
    saveWeeklyArchives();
    renderWeekly();
  });
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
  todoLaneInput.addEventListener("change", () => {
    if (todoLaneInput.value === "daily") {
      todoDailyInput.checked = true;
    }
    syncTaskDateByLane();
  });
  todoDailyInput.addEventListener("change", () => {
    if (todoDailyInput.checked) {
      todoLaneInput.value = "daily";
    } else if (todoLaneInput.value === "daily") {
      todoLaneInput.value = "";
    }
  });

  Object.entries(filterButtons).forEach(([mode, button]) => {
    button.addEventListener("click", () => {
      state.filterMode = mode;
      state.mobileView = mode === "today" ? "daily" : "filtered";
      saveUiState();
      renderBoard();
      renderSidebar();
      renderMobileView();
    });
  });

  mobileTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.mobileView = button.dataset.mobileView || "daily";
      saveUiState();
      renderMobileView();
    });
  });

  sortSelect.addEventListener("change", () => {
    state.sortMode = sortSelect.value;
    saveUiState();
    renderBoard();
  });

  resetAllButton?.addEventListener("click", resetAllData);

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
    if (state.weeklyAssignTaskId) {
      closeWeeklyAssignModal();
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
    const completed = state.todos.filter((todo) => isTodoEffectivelyDone(todo));
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
      const isDaily = formData.get("daily") === "on" || formData.get("lane") === "daily";
      const dueDate = normalizeIsoDateInput(String(formData.get("dueDate") || "").trim()) || null;
      const requestedLane = inferStartingLane(String(formData.get("lane") || ""), dueDate, isDaily);
      const payload = await api(editingId ? `/todos/${editingId}` : "/todos", {
        method: editingId ? "PUT" : "POST",
        body: serializeTodoForApi({
          title: String(formData.get("title") || "").trim(),
          details: String(formData.get("details") || "").trim(),
          projectTitle: String(formData.get("project") || "").trim(),
          missed: editingId ? Boolean(state.todos.find((todo) => todo.id === editingId)?.missed) : false,
          subtasks: currentTaskSubtasks(editingId),
          dueDate,
          lane: requestedLane,
          priority: String(formData.get("priority") || "medium"),
          done: editingId ? currentTaskDone(editingId) : false,
          daily: isDaily,
          dailyCompletedOn: editingId ? currentTaskDailyMeta(editingId).dailyCompletedOn : null,
          streak: editingId ? currentTaskDailyMeta(editingId).streak : 0,
        }),
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
      todoProjectInput.value = "";
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
      if (!dragTodoId || !lane || lane === "daily") {
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
      if (lane === "daily") {
        setStatus("Daily tasks must be created directly.", true);
        dragTodoId = "";
        dragCardPosition = "after";
        return;
      }
      const dragged = state.todos.find((entry) => entry.id === dragTodoId);
      if (!dragged) {
        dragTodoId = "";
        dragCardPosition = "after";
        return;
      }
      if (dragged.daily) {
        await moveTodoToBoardLane(dragTodoId, lane);
      } else if (lane !== "done" && !dragged.done && canManualReorder()) {
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
    renderTaskProjectOptions();
    const shouldPrefillDate = !options.noDate && ["weekly", "calendar"].includes(state.activeView) && state.selectedDate;
    todoDueDateInput.value = options.dueDate || (shouldPrefillDate ? state.selectedDate : "");
    todoLaneInput.value = options.lane || "";
    todoDailyInput.checked = false;
    if (options.projectTitle) {
      renderTaskProjectOptions(options.projectTitle);
      todoProjectInput.value = options.projectTitle;
    }
    if (!shouldPrefillDate && !options.dueDate && !options.noDate) {
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
  state.weeklyArchives = [];
  state.weeklyProjects = [];
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
  state.activeView = ["weekly", "calendar", "portfolio"].includes(view) ? view : "board";
  saveUiState();
  render();
}

function applyBootstrap(payload) {
  state.user = payload.user || null;
  state.weeklyArchives = loadWeeklyArchives(state.user?.id || "");
  state.weeklyProjects = (payload.weeklyProjects || []).map(hydrateWeeklyProjectFromServer).filter((project) => project.id && project.title);
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
  migrateLocalWeeklyProjects().catch(() => {});
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
  renderWeekly();
  renderWeeklyAssignModal();
  renderCalendar();
  renderPortfolio();
  renderTaskDetail();
  renderPortfolioDetail();
  renderUndoToast();
  renderTaskActionSheet();
  renderMobileView();
  renderViewMode();
  renderSidebarState();
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
  workspaceNameLabel.textContent = state.user ? `${displayName}'s workspace` : "planner.";
  userNameLabel.textContent = state.user ? `${displayName} (${email})` : "-";
  avatarBadge.textContent = initialsForName(displayName);
  const today = todayIso();
  selectedDateLabel.textContent = DAY_FORMATTER.format(new Date(`${today}T00:00:00`));
  const todayPlans = plansForDate(today);
  const todayTasks = todosForDate(today);
  const selectedPlans = plansForDate(state.selectedDate);
  selectedDateMeta.textContent = `${todayPlans.length} plan${todayPlans.length === 1 ? "" : "s"} / ${todayTasks.length} task${todayTasks.length === 1 ? "" : "s"}`;
  openTaskCount.textContent = String(state.todos.filter((todo) => !isTodoEffectivelyDone(todo)).length);
  noteCount.textContent = state.notesByDate[state.selectedDate] ? "1" : "0";
  planCount.textContent = String(selectedPlans.length);
  const completedCount = state.todos.filter((todo) => isTodoEffectivelyDone(todo)).length;
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
  const detailDates = weeklyDates(state.detailDraft?.dueDate || state.selectedDate).map(dateToLocalIso);

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

    const days = document.createElement("div");
    days.className = "subtask-days";
    detailDates.forEach((iso, index) => {
      const day = document.createElement("button");
      day.type = "button";
      day.className = "subtask-day-chip";
      day.classList.toggle("is-selected", (subtask.days || []).includes(iso));
      day.textContent = WEEKDAY_LABELS[index];
      day.addEventListener("click", () => toggleSubtaskDay(subtask.id, iso));
      days.appendChild(day);
    });

    item.append(toggle, text, remove, days);
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
  BOARD_LANES.forEach((lane) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `task-action-move-list__button${boardLane(todo) === lane ? " is-active" : ""}`;
    button.textContent = laneLabel(lane);
    button.disabled = boardLane(todo) === lane || (lane === "daily" && !todo.daily);
    button.addEventListener("click", async () => {
      closeTaskActionSheet();
      if (boardLane(todo) !== lane && !(lane === "daily" && !todo.daily)) {
        await moveTodoToBoardLane(todo.id, lane);
      }
    });
    taskActionMoveList.appendChild(button);
  });
}

function renderMobileView() {
  appShell.dataset.mobileView = state.mobileView || "daily";
  mobileTabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mobileView === appShell.dataset.mobileView);
  });
}

function renderViewMode() {
  const isWeekly = state.activeView === "weekly";
  const isCalendar = state.activeView === "calendar";
  const isPortfolio = state.activeView === "portfolio";
  appShell.dataset.activeView = isWeekly ? "weekly" : isCalendar ? "calendar" : isPortfolio ? "portfolio" : "board";
  boardTitle.textContent = "planner.";
  openComposerButton.textContent = isPortfolio ? "+ Add Portfolio" : isCalendar ? "+ Add Plan" : "+ Add Task";
  weeklyViewButton.classList.toggle("is-active", isWeekly);
  boardViewButton.classList.toggle("is-active", !isWeekly && !isCalendar && !isPortfolio);
  calendarViewButton.classList.toggle("is-active", isCalendar);
  portfolioViewButton.classList.toggle("is-active", isPortfolio);
  weeklyView.classList.toggle("board-view--hidden", !isWeekly);
  boardView.classList.toggle("board-view--hidden", isWeekly || isCalendar || isPortfolio);
  calendarView.classList.toggle("board-view--hidden", !isCalendar);
  portfolioView.classList.toggle("board-view--hidden", !isPortfolio);
  clearCompletedButton.hidden = isWeekly || isPortfolio || isCalendar || state.todos.filter((todo) => isTodoEffectivelyDone(todo)).length === 0;
}

function renderSidebarState() {
  appShell.classList.toggle("sidebar-collapsed", Boolean(state.sidebarCollapsed));
  sidebarToggleButton.setAttribute("aria-label", state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar");
  sidebarToggleButton.setAttribute("title", state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar");
}

function applyTheme() {
  const theme = DEFAULT_THEME;
  state.theme = DEFAULT_THEME;
  localStorage.setItem(DEFAULT_THEME_KEY, DEFAULT_THEME);
  document.documentElement.dataset.theme = theme;
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", "#111727");
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
    daily: [],
    done: [],
  };

  visibleTodos.forEach((todo) => {
    if (!todo.projectTitle) {
      const lane = boardLane(todo);
      if (lane) grouped[lane].push({ type: "todo", todo });
      return;
    }
    const key = todoProjectKey(todo);
    if (!key) {
      const lane = boardLane(todo);
      if (lane) grouped[lane].push({ type: "todo", todo });
      return;
    }
    let groupLane = BOARD_LANES.find((lane) => grouped[lane].some((entry) => entry.type === "project" && entry.key === key));
    let group = groupLane
      ? grouped[groupLane].find((entry) => entry.type === "project" && entry.key === key)
      : null;
    if (!group) {
      group = {
        type: "project",
        key,
        projectId: todo.projectId || "",
        title: todo.projectTitle,
        todos: [],
      };
      groupLane = boardProjectLane(group);
      grouped[groupLane].push(group);
    }
    group.todos.push(todo);
    const nextLane = boardProjectLane(group);
    if (groupLane !== nextLane) {
      grouped[groupLane] = grouped[groupLane].filter((entry) => entry !== group);
      grouped[nextLane].push(group);
    }
  });
  const boardVisibleCount = Object.values(grouped).reduce((total, entries) => total + entries.length, 0);
  if (state.activeView === "board") {
    allTaskCountHeader.textContent = String(boardVisibleCount);
  }

  BOARD_LANES.forEach((lane) => {
    const target = laneTargets[lane];
    target.innerHTML = "";
    laneCountTargets[lane].textContent = String(grouped[lane].length);
    if (!grouped[lane].length) {
      const empty = renderLaneEmpty(lane);
      target.appendChild(empty);
      return;
    }
    sortBoardEntries(grouped[lane]).forEach((entry) => {
      target.appendChild(entry.type === "project" ? renderBoardProjectCard(entry) : renderTodoCard(entry.todo));
    });
  });
  updateFilterButtons();
  renderFilterState(boardVisibleCount);
}

function boardProjectLane(group) {
  const todos = group.todos || [];
  if (weeklyCompletionForTodos(todos).complete) {
    return "done";
  }
  return todos.some(weeklyTaskHasAssignments) ? "month" : "ideas";
}

function weeklyCompletionForTodos(todos, weekIsoDays = weeklyDates().map(dateToLocalIso)) {
  const items = Array.isArray(todos) ? todos : [];
  const units = items.flatMap((todo) => weeklyUnitsForTodo(todo, weekIsoDays));
  const total = units.length || items.length;
  const done = units.length
    ? units.filter((unit) => unit.done).length
    : items.filter((todo) => todo.done).length;
  return {
    total,
    done,
    complete: total > 0 && done === total,
  };
}

function weeklyTodoComplete(todo, weekIsoDays = weeklyDates().map(dateToLocalIso)) {
  return weeklyCompletionForTodos(todo ? [todo] : [], weekIsoDays).complete;
}

function isTodoEffectivelyDone(todo, weekIsoDays = weeklyDates().map(dateToLocalIso)) {
  if (!todo) return false;
  if (todo.done) return true;
  if (todo.daily) return isDailyCompletedToday(todo);
  return Boolean(todo.projectTitle && weeklyTodoComplete(todo, weekIsoDays));
}

function boardEntryTodo(entry) {
  if (entry.type === "todo") return entry.todo;
  return (entry.todos || [])[0] || {};
}

function sortBoardEntries(entries) {
  const copy = [...entries];
  const compare = (left, right) => {
    const a = boardEntryTodo(left);
    const b = boardEntryTodo(right);
    if (state.sortMode === "due") {
      return compareDueDate(a, b) || compareCreatedDesc(a, b);
    }
    if (state.sortMode === "priority") {
      return comparePriority(a, b) || compareDueDate(a, b) || compareCreatedDesc(a, b);
    }
    if (state.sortMode === "newest") {
      return compareCreatedDesc(a, b);
    }
    return compareManualOrder(a, b) || compareCreatedDesc(a, b);
  };
  return copy.sort(compare);
}

function boardLane(todo) {
  if (isTodoEffectivelyDone(todo)) {
    return "done";
  }
  if (todo.daily) {
    return "daily";
  }
  if (todo.projectTitle) {
    if (weeklyTodoComplete(todo)) {
      return "done";
    }
    return weeklyTaskHasAssignments(todo) ? "month" : "ideas";
  }
  if (normalizeLane(todo) === "month") {
    return "month";
  }
  if (todo.dueDate || ["week", "today"].includes(normalizeLane(todo))) {
    return "";
  }
  return "ideas";
}

function boardTaskTitle(todo) {
  return todo.projectTitle || todo.title;
}

function boardTaskDetails(todo) {
  if (todo.projectTitle) {
    return [todo.title, todo.details].filter(Boolean).join(" · ");
  }
  return todo.details || "";
}

function shiftWeeklyView(dayDelta) {
  const current = new Date(`${state.selectedDate}T00:00:00`);
  current.setDate(current.getDate() + dayDelta);
  state.selectedDate = dateToLocalIso(current);
  state.weeklyFocusDate = "";
  saveUiState();
  render();
}

function weeklyDates(anchorIso = state.selectedDate) {
  const start = weekStart(new Date(`${anchorIso}T00:00:00`));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function todoWeeklyDays(todo) {
  return Array.isArray(todo.weeklyDays)
    ? todo.weeklyDays.map((day) => normalizeIsoDateInput(day)).filter(Boolean)
    : [];
}

function weeklySlotsForTodo(todo, weekIsoDays = weeklyDates().map(dateToLocalIso)) {
  if (todo.daily) return [];
  const allowed = new Set(weekIsoDays);
  const slots = [];
  (todo.subtasks || []).forEach((subtask) => {
    (subtask.days || []).forEach((day) => {
      const normalized = normalizeIsoDateInput(day);
      if (!normalized || (allowed.size && !allowed.has(normalized))) return;
      slots.push({
        id: subtask.id,
        todoId: todo.id,
        day: normalized,
        title: todo.title,
        desc: subtask.text || "",
        done: Boolean(todo.done || subtask.done),
        projectId: todo.projectId || "",
        projectTitle: todo.projectTitle || "",
      });
    });
  });
  if (!slots.length && !todo.projectTitle) {
    todoWeeklyDays(todo).forEach((day) => {
      if (!day || (allowed.size && !allowed.has(day))) return;
      slots.push({
        id: "",
        todoId: todo.id,
        day,
        title: todo.title,
        desc: "",
        done: Boolean(todo.done),
        projectId: todo.projectId || "",
        projectTitle: todo.projectTitle || "",
      });
    });
  }
  return slots.sort((left, right) => left.day.localeCompare(right.day) || left.title.localeCompare(right.title));
}

function unassignedWeeklySubtaskUnits(todo) {
  if (!todo?.projectTitle) return [];
  return (todo.subtasks || [])
    .filter((subtask) => !(subtask.days || []).some((day) => Boolean(normalizeIsoDateInput(day))))
    .map((subtask) => ({
      id: subtask.id || "",
      todoId: todo.id,
      day: "",
      title: todo.title,
      desc: subtask.text || "",
      done: Boolean(todo.done || subtask.done),
      projectId: todo.projectId || "",
      projectTitle: todo.projectTitle || "",
    }));
}

function weeklyProgressUnitsForTodo(todo, weekIsoDays = weeklyDates().map(dateToLocalIso)) {
  if (todo.daily) return [];
  return weeklyUnitsForTodo(todo, weekIsoDays);
}

function weeklyUnitsForTodo(todo, weekIsoDays = weeklyDates().map(dateToLocalIso)) {
  if (todo.daily) {
    return [{ todoId: todo.id, day: todayIso(), title: todo.title, desc: "", done: isDailyCompletedToday(todo), projectTitle: "" }];
  }
  const slots = weeklySlotsForTodo(todo, weekIsoDays);
  const unassignedUnits = unassignedWeeklySubtaskUnits(todo);
  if (slots.length || unassignedUnits.length) return [...slots, ...unassignedUnits];
  if (todo.projectTitle) {
    return [{
      id: "",
      todoId: todo.id,
      day: "",
      title: todo.title,
      desc: "",
      done: Boolean(todo.done),
      projectId: todo.projectId || "",
      projectTitle: todo.projectTitle || "",
    }];
  }
  return [];
}

function weeklySlotsForDay(todos, iso) {
  return todos.flatMap((todo) => weeklySlotsForTodo(todo, [iso])).filter((slot) => slot.day === iso);
}

function todoScheduledForWeek(todo, firstIso, lastIso) {
  if (todo.daily) return false;
  if (todoWeeklyDays(todo).some((day) => day >= firstIso && day <= lastIso)) return true;
  if (weeklySlotsForTodo(todo, weeklyDates(firstIso).map(dateToLocalIso)).length) return true;
  return Boolean(todo.projectTitle);
}

function renderWeekly() {
  const allDates = weeklyDates();
  const firstIso = dateToLocalIso(allDates[0]);
  const lastIso = dateToLocalIso(allDates[6]);
  const today = todayIso();
  const defaultFocusIso = today >= firstIso && today <= lastIso ? today : firstIso;
  const showAllDays = state.weeklyFocusDate === "__all__";
  const focusedIso = !showAllDays && normalizeIsoDateInput(state.weeklyFocusDate)
    ? state.weeklyFocusDate
    : defaultFocusIso;
  const dates = showAllDays
    ? allDates
    : allDates.filter((date) => dateToLocalIso(date) === focusedIso);
  const scheduled = state.todos.filter((todo) => todoScheduledForWeek(todo, firstIso, lastIso));
  const weeklyTasks = scheduled;
  const weekIsoDays = allDates.map(dateToLocalIso);
  const weeklyUnits = weeklyTasks.flatMap((todo) => weeklyProgressUnitsForTodo(todo, weekIsoDays));
  const completed = weeklyUnits.filter((unit) => unit.done).length;
  const progress = weeklyUnits.length ? Math.round((completed / weeklyUnits.length) * 100) : 0;
  const weeklyPageMeta = {
    planner: {
      title: `${SHORT_DATE_FORMATTER.format(allDates[0])} - ${SHORT_DATE_FORMATTER.format(allDates[6])}`,
      meta: `${completed} of ${weeklyUnits.length} tasks complete`,
    },
    archive: {
      title: "Archive",
      meta: `${state.weeklyArchives.length} saved week${state.weeklyArchives.length === 1 ? "" : "s"}`,
    },
    stats: {
      title: "Stats",
      meta: "Completion history and weekday patterns.",
    },
  };
  const pageMeta = weeklyPageMeta[state.weeklyPanel || "planner"] || weeklyPageMeta.planner;

  weeklyRangeLabel.textContent = pageMeta.title;
  weeklyProgressLabel.textContent = pageMeta.meta;
  if (weeklyPlanningLabel) {
    weeklyPlanningLabel.textContent = state.weeklyPanel === "planner" ? "Planning for" : "";
  }
  if (weeklyFocusLabel) {
    const focusDate = allDates.find((date) => dateToLocalIso(date) === focusedIso) || allDates[0];
    const focusDay = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(focusDate);
    const isToday = focusedIso === today;
    weeklyFocusLabel.innerHTML = showAllDays
      ? "Showing all days"
      : `Focusing <strong>${focusDay}</strong>${isToday ? " (today)" : ""}`;
  }
  weeklyProgressBar.className = `progress-fill ${percentClass(progress)}`;
  weeklyDays.innerHTML = "";

  const dayTabs = document.createElement("div");
  dayTabs.className = "weekly-day-tabs";
  allDates.forEach((date) => {
    const iso = dateToLocalIso(date);
    const daySlots = weeklySlotsForDay(weeklyTasks, iso);
    const doneCount = daySlots.filter((slot) => slot.done).length;
    const hasOpenTasks = doneCount < daySlots.length;
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "weekly-day-tab";
    tab.classList.toggle("is-active", !showAllDays && iso === focusedIso);
    tab.classList.toggle("is-today", iso === today);
    tab.classList.toggle("has-open-tasks", hasOpenTasks);
    tab.setAttribute("aria-label", `${new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date)}${hasOpenTasks ? ", has unfinished tasks" : ""}`);
    tab.innerHTML = `
      <span>${new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)}</span>
      <small>${daySlots.length ? `${doneCount}/${daySlots.length}` : "0"}</small>
    `;
    tab.addEventListener("click", () => {
      state.selectedDate = iso;
      state.weeklyFocusDate = iso;
      saveUiState();
      render();
    });
    dayTabs.appendChild(tab);
  });
  weeklyDays.appendChild(dayTabs);

  dates.forEach((date) => {
    const iso = dateToLocalIso(date);
    const daySlots = weeklySlotsForDay(weeklyTasks, iso);
    const doneCount = daySlots.filter((slot) => slot.done).length;
    const column = document.createElement("article");
    column.className = "weekly-day";
    column.classList.toggle("is-today", iso === today);
    column.dataset.date = iso;

    const heading = document.createElement("div");
    heading.className = "weekly-day__heading";
    const headingCopy = document.createElement("button");
    headingCopy.type = "button";
    headingCopy.className = "weekly-day__title";
    headingCopy.innerHTML = `<span>${new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)}</span><strong>${date.getDate()}</strong>`;
    headingCopy.addEventListener("click", () => {
      state.selectedDate = iso;
      state.weeklyFocusDate = iso;
      saveUiState();
      render();
    });
    const count = document.createElement("span");
    count.className = "weekly-day__count";
    count.textContent = daySlots.length ? `${doneCount}/${daySlots.length}` : "0";
    heading.append(headingCopy, count);

    const list = document.createElement("div");
    list.className = "weekly-day__list";
    if (!daySlots.length) {
      const empty = document.createElement("p");
      empty.className = "weekly-day__empty";
      empty.textContent = "—";
      list.appendChild(empty);
    } else {
      daySlots.forEach((slot) => list.appendChild(renderWeeklySlot(slot)));
    }

    const add = document.createElement("button");
    add.type = "button";
    add.className = "weekly-day__add";
    add.textContent = "+ Add task";
    add.addEventListener("click", () => {
      state.selectedDate = iso;
      saveUiState();
      openComposer("task", { locked: true });
    });

    const activateDrop = (event) => {
      if (!dragTodoId) {
        return;
      }
      event.preventDefault();
      column.classList.add("is-drop-target");
    };
    column.addEventListener("dragover", activateDrop);
    list.addEventListener("dragover", activateDrop);
    column.addEventListener("dragleave", (event) => {
      if (!event.relatedTarget || !column.contains(event.relatedTarget)) {
        column.classList.remove("is-drop-target");
      }
    });
    column.addEventListener("drop", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      column.classList.remove("is-drop-target");
      const todoId = dragTodoId;
      dragTodoId = "";
      if (todoId) {
        await moveTodoToDate(todoId, iso);
      }
    });

    column.append(heading, list, add);
    weeklyDays.appendChild(column);
  });

  const backlog = state.todos.filter((todo) => !isTodoEffectivelyDone(todo) && !todo.daily && !todo.dueDate);
  weeklyBacklogCount.textContent = String(backlog.length);
  weeklyBacklogList.innerHTML = "";
  if (!backlog.length) {
    const empty = document.createElement("p");
    empty.className = "weekly-backlog__empty";
    empty.textContent = "Everything has a date. Nice.";
    weeklyBacklogList.appendChild(empty);
  } else {
    sortTodos(backlog).forEach((todo) => weeklyBacklogList.appendChild(renderWeeklyTask(todo)));
  }
  weeklyBacklogList.ondragover = (event) => {
    if (dragTodoId) {
      event.preventDefault();
      weeklyBacklogList.classList.add("is-drop-target");
    }
  };
  weeklyBacklogList.ondragleave = () => weeklyBacklogList.classList.remove("is-drop-target");
  weeklyBacklogList.ondrop = async (event) => {
    event.preventDefault();
    weeklyBacklogList.classList.remove("is-drop-target");
    const todoId = dragTodoId;
    dragTodoId = "";
    if (todoId) {
      await moveTodoToDate(todoId, null);
    }
  };

  if (state.activeView === "weekly") {
    allTaskCountHeader.textContent = String(weeklyUnits.length);
    completedMeta.textContent = `${progress}% complete this week`;
  }
  weeklyShowAllButton.hidden = showAllDays;
  renderWeeklyProjects(weeklyTasks);
  renderWeeklyInsights();
}

function renderWeeklySlot(slot) {
  const card = document.createElement("article");
  card.className = "weekly-task weekly-task--slot";
  card.classList.toggle("is-done", Boolean(slot.done));

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = Boolean(slot.done);
  checkbox.setAttribute("aria-label", `Complete ${slot.title}`);
  checkbox.addEventListener("change", async () => {
    if (slot.id) {
      await updateSubtaskFromWeekly(slot.todoId, slot.id, { done: checkbox.checked });
      return;
    }
    const success = await toggleTodoDone(slot.todoId, checkbox.checked);
    if (!success) checkbox.checked = !checkbox.checked;
  });

  const body = document.createElement("button");
  body.type = "button";
  body.className = "weekly-task__body";
  const project = document.createElement("span");
  project.className = "weekly-task__project";
  project.textContent = slot.projectTitle || "";
  const title = document.createElement("strong");
  title.textContent = slot.title;
  const meta = document.createElement("span");
  meta.textContent = slot.desc || "";
  body.append(project, title, meta);
  body.addEventListener("click", () => openWeeklyAssignModal(slot.todoId));

  card.append(checkbox, body);
  return card;
}

function renderWeeklyTask(todo, contextDate = "") {
  const card = document.createElement("article");
  const taskDone = isTodoEffectivelyDone(todo);
  card.className = "weekly-task";
  card.classList.add(`priority-${todo.priority || "medium"}`);
  card.classList.toggle("is-done", taskDone);
  card.classList.toggle("is-missed", Boolean(todo.missed));
  card.draggable = canDragTodo(todo) && !todo.daily;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = taskDone;
  checkbox.setAttribute("aria-label", `Complete ${todo.title}`);
  checkbox.addEventListener("change", async () => {
    const success = await toggleTodoDone(todo.id, todo.daily ? true : checkbox.checked);
    if (!success) {
      checkbox.checked = !checkbox.checked;
    }
  });

  const body = document.createElement("button");
  body.type = "button";
  body.className = "weekly-task__body";
  const title = document.createElement("strong");
  title.textContent = todo.title;
  const meta = document.createElement("span");
  const subtaskCount = (todo.subtasks || []).length;
  const doneSubtasks = (todo.subtasks || []).filter((item) => item.done).length;
  meta.textContent = todo.daily
    ? `Daily · streak ${Number(todo.streak || 0)}`
    : [todo.projectTitle, subtaskCount ? `${doneSubtasks}/${subtaskCount} subtasks` : todo.details || ""].filter(Boolean).join(" · ")
      || laneLabel(normalizeLane(todo));
  body.append(title, meta);
  let weeklySubtaskList = null;
  const daySubtasks = contextDate
    ? (todo.subtasks || []).filter((item) => Array.isArray(item.days) && item.days.includes(contextDate))
    : [];
  if (daySubtasks.length) {
    weeklySubtaskList = document.createElement("div");
    weeklySubtaskList.className = "weekly-task__subtasks";
    daySubtasks.forEach((subtask) => {
      const row = document.createElement("label");
      row.className = "weekly-task__subtask";
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = Boolean(subtask.done);
      box.addEventListener("change", () => updateSubtaskFromWeekly(todo.id, subtask.id, { done: box.checked }));
      const label = document.createElement("span");
      label.textContent = subtask.text;
      row.append(box, label);
      weeklySubtaskList.appendChild(row);
    });
  }
  body.addEventListener("click", () => openTaskDetail(todo.id));

  card.addEventListener("dragstart", (event) => {
    if (!card.draggable) {
      event.preventDefault();
      return;
    }
    dragTodoId = todo.id;
    card.classList.add("is-dragging");
    event.dataTransfer?.setData("text/plain", todo.id);
  });
  card.addEventListener("dragend", () => {
    dragTodoId = "";
    card.classList.remove("is-dragging");
    document.querySelectorAll(".weekly-day, .weekly-backlog__list").forEach((entry) => entry.classList.remove("is-drop-target"));
  });
  if (!todo.daily && !taskDone) {
    const missed = document.createElement("button");
    missed.type = "button";
    missed.className = "weekly-task__missed";
    missed.textContent = todo.missed ? "Missed" : "!";
    missed.title = todo.missed ? "Clear missed status" : "Mark as missed";
    missed.addEventListener("click", () => toggleTodoMissed(todo.id));
    card.append(checkbox, body, missed);
  } else {
    card.append(checkbox, body);
  }
  if (weeklySubtaskList) {
    card.appendChild(weeklySubtaskList);
  }
  return card;
}

async function updateSubtaskFromWeekly(todoId, subtaskId, patch) {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) return;
  const previous = cloneTodoDraft(todo);
  const nextTodo = {
    ...todo,
    subtasks: (todo.subtasks || []).map((item) => item.id === subtaskId ? { ...item, ...patch } : item),
  };
  try {
    updateTodo(nextTodo);
    render();
    const payload = await api(`/todos/${todo.id}`, { method: "PUT", body: serializeTodoForApi(nextTodo) });
    updateTodo(hydrateTodoFromServer(payload.todo));
    state.lastSyncedAt = Date.now();
    render();
  } catch (error) {
    updateTodo(previous);
    render();
    setStatus(error.message, true);
  }
}

function weeklyProjectItems() {
  const projects = new Map();
  (state.weeklyProjects || []).forEach((project) => {
    const key = projectKey(project);
    if (key) projects.set(key, project);
  });
  state.todos.forEach((todo) => {
    if (!todo.projectTitle) return;
    const project = {
      id: todo.projectId || `derived-${todo.projectTitle.trim().toLowerCase()}`,
      title: todo.projectTitle,
      derived: true,
      createdAt: todo.createdAt || "",
    };
    const key = projectKey(project);
    if (key && !projects.has(key)) projects.set(key, project);
  });
  return [...projects.values()].sort((left, right) =>
    String(left.createdAt || "").localeCompare(String(right.createdAt || ""))
    || String(left.title || "").localeCompare(String(right.title || ""))
  );
}

function todoProjectKey(todo) {
  if (!todo || !todo.projectTitle) return "";
  return todo.projectId ? `id:${todo.projectId}` : `title:${todo.projectTitle.trim().toLowerCase()}`;
}

function projectKey(project) {
  if (!project || !project.title) return "";
  return project.id ? `id:${project.id}` : `title:${String(project.title).trim().toLowerCase()}`;
}

function todoProjectMatches(todo, project) {
  if (!todo || !project || !todo.projectTitle) return false;
  if (todo.projectId && project.id) return todo.projectId === project.id;
  return String(todo.projectTitle || "").trim().toLowerCase() === String(project.title || "").trim().toLowerCase();
}

function renderTaskProjectOptions(selected = todoProjectInput.value) {
  todoProjectInput.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "No project";
  todoProjectInput.appendChild(empty);
  weeklyProjectItems().forEach((project) => {
    const option = document.createElement("option");
    option.value = project.title;
    option.textContent = project.title;
    todoProjectInput.appendChild(option);
  });
  todoProjectInput.value = selected || "";
}

async function addWeeklyProject() {
  state.weeklyAddingProject = true;
  renderWeekly();
  requestAnimationFrame(() => document.querySelector(".weekly-project-add-form input")?.focus());
}

async function createWeeklyProject(title) {
  title = String(title || "").trim();
  if (!title) return;
  const duplicate = weeklyProjectItems().some((project) => String(project.title || "").trim().toLowerCase() === title.toLowerCase());
  if (duplicate) {
    setStatus("Project name already exists. Pick a unique name for weekly planning.", true);
    return;
  }
  try {
    const payload = await api("/weekly-projects", { method: "POST", body: { title } });
    state.weeklyProjects = [...state.weeklyProjects, hydrateWeeklyProjectFromServer(payload.weeklyProject)];
    state.weeklyAddingProject = false;
    state.lastSyncedAt = Date.now();
    render();
    setStatus("Weekly project added.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

function renderWeeklyProjects(weeklyTasks) {
  const projects = weeklyProjectItems();
  const allDates = weeklyDates();
  const firstIso = dateToLocalIso(allDates[0]);
  const lastIso = dateToLocalIso(allDates[6]);
  const today = todayIso();
  weeklyProjectList.innerHTML = "";
  if (state.weeklyAddingProject) {
    weeklyProjectList.appendChild(renderWeeklyProjectAddForm());
  }
  if (!projects.length) {
    const empty = document.createElement("p");
    empty.className = "weekly-backlog__empty";
    empty.textContent = "Create a project, then assign tasks to it.";
    weeklyProjectList.appendChild(empty);
    return;
  }
  projects.forEach((project) => {
    const tasks = weeklyTasks.filter((todo) => todoProjectMatches(todo, project));
    const units = tasks.flatMap((todo) => weeklyUnitsForTodo(todo, allDates.map(dateToLocalIso)));
    const done = units.filter((unit) => unit.done).length;
    const progress = units.length ? Math.round((done / units.length) * 100) : 0;
    const card = document.createElement("article");
    card.className = "weekly-project-card";
    const header = document.createElement("div");
    header.className = "weekly-project-card__header";
    const title = document.createElement("button");
    title.type = "button";
    title.className = "weekly-project-card__title";
    title.textContent = project.title;
    title.addEventListener("click", () => {
      setStatus("Weekly projects are separate from Portfolio.");
    });
    const progressWrap = document.createElement("div");
    progressWrap.className = "weekly-project-card__progress";
    const progressBar = document.createElement("span");
    progressBar.className = percentClass(progress);
    progressWrap.appendChild(progressBar);
    const count = document.createElement("small");
    count.textContent = `${done}/${units.length}`;
    header.append(title, progressWrap, count);

    const list = document.createElement("div");
    list.className = "weekly-project-card__tasks";
    if (!tasks.length) {
      const empty = document.createElement("p");
      empty.className = "weekly-project-card__empty";
      empty.textContent = "No tasks this week.";
      list.appendChild(empty);
    } else {
      sortTodos(tasks).forEach((todo) => list.appendChild(renderWeeklyProjectTask(todo, allDates)));
    }

    const add = document.createElement("form");
    add.className = "weekly-project-card__add-form";
    add.innerHTML = `
      <span>+</span>
      <input name="title" type="text" placeholder="add task" autocomplete="off">
    `;
    add.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = add.querySelector("input");
      const title = String(input.value || "").trim();
      if (!title) return;
      await createWeeklyProjectTask(project, title);
      input.value = "";
    });
    card.append(header, list, add);
    weeklyProjectList.appendChild(card);
  });
}

function renderWeeklyProjectAddForm() {
  const form = document.createElement("form");
  form.className = "weekly-project-add-form";
  form.innerHTML = `
    <input name="title" type="text" placeholder="Project name..." autocomplete="off">
    <button type="submit">Add</button>
    <button type="button" class="weekly-project-add-form__cancel">Cancel</button>
  `;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = form.querySelector("input");
    await createWeeklyProject(input.value);
  });
  form.querySelector(".weekly-project-add-form__cancel").addEventListener("click", () => {
    state.weeklyAddingProject = false;
    renderWeekly();
  });
  return form;
}

function renderWeeklyProjectTask(todo, dates) {
  const weekIsoDays = dates.map(dateToLocalIso);
  const units = weeklyUnitsForTodo(todo, weekIsoDays);
  const done = units.filter((unit) => unit.done).length;
  const row = document.createElement("article");
  row.className = "weekly-project-task";
  row.classList.toggle("is-done", units.length > 0 && done === units.length);

  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = Boolean(todo.done);
  check.setAttribute("aria-label", `Complete ${todo.title}`);
  check.addEventListener("change", async () => {
    const success = await toggleTodoDone(todo.id, check.checked);
    if (!success) check.checked = !check.checked;
  });

  const body = document.createElement("button");
  body.type = "button";
  body.className = "weekly-project-task__title";
  body.innerHTML = `<span>${escapeHtml(todo.title)}</span><small>${done}/${units.length || 1}</small>`;
  body.addEventListener("click", () => openTaskDetail(todo.id));

  const dayPicker = document.createElement("div");
  dayPicker.className = "weekly-project-task__days";
  const selected = new Set(weeklyTaskAssignedDays(todo, weekIsoDays));
  if (selected.size) {
    dates.forEach((date, index) => {
      const iso = dateToLocalIso(date);
      if (!selected.has(iso)) return;
      const day = document.createElement("span");
      day.className = "weekly-project-task__day-chip";
      day.textContent = WEEKDAY_LABELS[index][0];
      day.title = WEEKDAY_LABELS[index];
      dayPicker.appendChild(day);
    });
  }
  const assign = document.createElement("button");
  assign.type = "button";
  assign.className = "weekly-project-task__assign";
  assign.classList.toggle("assign-cta", !selected.size);
  assign.textContent = selected.size ? "Assign days" : "Assign days";
  assign.addEventListener("click", () => openWeeklyAssignModal(todo.id));
  dayPicker.appendChild(assign);

  row.append(check, body, dayPicker);
  return row;
}

function weeklyTaskAssignedDays(todo, weekIsoDays = weeklyDates().map(dateToLocalIso)) {
  const allowed = new Set(weekIsoDays);
  const days = new Set();
  todoWeeklyDays(todo).forEach((day) => {
    if (!allowed.size || allowed.has(day)) days.add(day);
  });
  (todo.subtasks || []).forEach((subtask) => {
    (subtask.days || []).forEach((day) => {
      const normalized = normalizeIsoDateInput(day);
      if (normalized && (!allowed.size || allowed.has(normalized))) days.add(normalized);
    });
  });
  return [...days].sort();
}

function weeklyTaskHasAssignments(todo) {
  if (todoWeeklyDays(todo).length) return true;
  return (todo.subtasks || []).some((subtask) =>
    (subtask.days || []).some((day) => Boolean(normalizeIsoDateInput(day)))
  );
}

function openWeeklyAssignModal(todoId) {
  state.weeklyAssignTaskId = todoId;
  renderWeeklyAssignModal(true);
}

function closeWeeklyAssignModal() {
  state.weeklyAssignTaskId = "";
  renderWeeklyAssignModal(true);
}

function weeklyAssignOverlay() {
  let overlay = document.querySelector("#weeklyAssignOverlay");
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.id = "weeklyAssignOverlay";
  overlay.className = "weekly-assign-overlay weekly-assign-overlay--hidden";
  overlay.setAttribute("aria-hidden", "true");
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeWeeklyAssignModal();
  });
  document.body.appendChild(overlay);
  return overlay;
}

function showWeeklyEndModal(label) {
  return new Promise((resolve) => {
    let overlay = document.querySelector("#weeklyEndOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "weeklyEndOverlay";
      overlay.className = "weekly-assign-overlay weekly-assign-overlay--hidden";
      document.body.appendChild(overlay);
    }
    overlay.classList.remove("weekly-assign-overlay--hidden");
    overlay.setAttribute("aria-hidden", "false");
    overlay.innerHTML = `
      <section class="weekly-end-modal" role="dialog" aria-modal="true" aria-label="End week">
        <p class="eyebrow">End week</p>
        <h2>${escapeHtml(label)}</h2>
        <p>This snapshots the week into your archive. What should happen to tasks that aren't finished yet?</p>
        <div class="weekly-end-modal__actions">
          <button type="button" class="btn primary" data-action="carry">Carry unfinished forward</button>
          <button type="button" class="btn danger" data-action="clear">Clear everything</button>
          <button type="button" class="btn ghost" data-action="cancel">Cancel</button>
        </div>
      </section>
    `;
    const close = (value) => {
      overlay.classList.add("weekly-assign-overlay--hidden");
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = "";
      resolve(value);
    };
    overlay.onclick = (event) => {
      if (event.target === overlay) {
        close(null);
      }
    };
    overlay.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        close(action === "cancel" ? null : action);
      });
    });
  });
}

function showResetAllModal() {
  return new Promise((resolve) => {
    let overlay = document.querySelector("#resetAllOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "resetAllOverlay";
      overlay.className = "weekly-assign-overlay weekly-assign-overlay--hidden";
      document.body.appendChild(overlay);
    }
    overlay.classList.remove("weekly-assign-overlay--hidden");
    overlay.setAttribute("aria-hidden", "false");
    overlay.innerHTML = `
      <section class="weekly-end-modal reset-all-modal" role="dialog" aria-modal="true" aria-label="Reset all data">
        <p class="eyebrow">Danger zone</p>
        <h2>Reset all data?</h2>
        <p>This deletes tasks, weekly projects, calendar plans, notes, portfolio items, archives, and notifications for this account. This cannot be undone.</p>
        <div class="weekly-end-modal__actions">
          <button type="button" class="btn danger" data-action="reset">Reset all data</button>
          <button type="button" class="btn ghost" data-action="cancel">Cancel</button>
        </div>
      </section>
    `;
    const close = (value) => {
      overlay.classList.add("weekly-assign-overlay--hidden");
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = "";
      resolve(value);
    };
    overlay.onclick = (event) => {
      if (event.target === overlay) close(false);
    };
    overlay.querySelectorAll("button[data-action]").forEach((button) => {
      button.addEventListener("click", () => close(button.dataset.action === "reset"));
    });
  });
}

function renderWeeklyAssignModal(force = false) {
  const overlay = weeklyAssignOverlay();
  const todo = state.weeklyAssignTaskId ? state.todos.find((entry) => entry.id === state.weeklyAssignTaskId) : null;
  overlay.classList.toggle("weekly-assign-overlay--hidden", !todo);
  overlay.setAttribute("aria-hidden", String(!todo));
  if (!todo) {
    overlay.dataset.todoId = "";
    overlay.innerHTML = "";
    return;
  }
  if (!force && overlay.dataset.todoId === todo.id && !overlay.classList.contains("weekly-assign-overlay--hidden")) {
    return;
  }
  overlay.dataset.todoId = todo.id;

  const dates = weeklyDates();
  const weekIsoDays = dates.map(dateToLocalIso);
  const selected = new Set(weeklyTaskAssignedDays(todo, weekIsoDays));
  const unassignedKey = "__unassigned";
  const unassignedSubtasks = (todo.subtasks || []).filter((subtask) =>
    !(subtask.days || []).some((day) => Boolean(normalizeIsoDateInput(day)))
  );
  const currentWeekSubtasks = (todo.subtasks || []).filter((subtask) =>
    (subtask.days || []).some((day) => weekIsoDays.includes(normalizeIsoDateInput(day)))
  );

  overlay.innerHTML = "";
  const panel = document.createElement("form");
  panel.className = "weekly-assign-modal";
  panel.innerHTML = `
    <div class="weekly-assign-modal__head">
      <div>
        <p class="eyebrow">${escapeHtml(todo.projectTitle || "Task")}</p>
        <h2>${escapeHtml(todo.title)}</h2>
      </div>
      <button type="button" class="weekly-assign-modal__close" aria-label="Close">×</button>
    </div>
    <label class="weekly-assign-field">
      <span>Deadline</span>
      <div class="weekly-assign-deadline">
        <input class="weekly-assign-deadline-date" type="date" value="${escapeHtml(todo.dueDate || "")}">
        <input class="weekly-assign-deadline-time" type="time" disabled>
      </div>
      <small>${todo.dueDate ? `Due ${escapeHtml(todo.dueDate)}` : "No deadline set."}</small>
    </label>
    <div class="weekly-assign-subhead">
      <span>Subtasks · <strong class="weekly-assign-subcount">0</strong></span>
    </div>
    <div class="weekly-assign-days" role="group" aria-label="Days this task appears on"></div>
    <div class="weekly-assign-chunks"></div>
    <label class="weekly-assign-field">
      <span>Description (optional)</span>
      <textarea class="weekly-assign-description" rows="3" placeholder="overall note for the task (optional); per-subtask notes go on the rows above">${escapeHtml(todo.details || "")}</textarea>
    </label>
    <div class="weekly-assign-modal__foot">
      <button type="button" class="btn ghost weekly-assign-cancel">Cancel</button>
      <button type="submit" class="btn primary">Save assignment</button>
    </div>
  `;

  const daysWrap = panel.querySelector(".weekly-assign-days");
  const chunksWrap = panel.querySelector(".weekly-assign-chunks");
  const subcount = panel.querySelector(".weekly-assign-subcount");

  const readDraftChunks = () => {
    const drafts = new Map();
    panel.querySelectorAll(".weekly-assign-chunk").forEach((row) => {
      const day = normalizeIsoDateInput(row.dataset.day);
      const key = day || unassignedKey;
      const chunk = {
        id: row.dataset.subtaskId || "",
        text: String(row.querySelector(".weekly-assign-chunk__text")?.value || ""),
        done: row.dataset.done === "true",
        days: day ? [day] : [],
      };
      const list = drafts.get(key) || [];
      list.push(chunk);
      drafts.set(key, list);
    });
    return drafts;
  };

  const renderChunks = () => {
    const draftChunks = readDraftChunks();
    chunksWrap.innerHTML = "";
    const orderedDays = weekIsoDays.filter((iso) => selected.has(iso));
    const draftUnassigned = draftChunks.get(unassignedKey);
    const unassignedChunks = draftUnassigned || unassignedSubtasks;
    if (!orderedDays.length && !unassignedChunks.length) {
      const empty = document.createElement("p");
      empty.className = "weekly-assign-empty";
      empty.textContent = "No subtasks yet, so it won't show in the week.";
      chunksWrap.appendChild(empty);
      updateAssignSubcount(panel);
      return;
    }
    if (unassignedChunks.length) {
      const group = document.createElement("section");
      group.className = "weekly-assign-group weekly-assign-group--unassigned";
      group.dataset.day = "";
      const heading = document.createElement("div");
      heading.className = "weekly-assign-group__head";
      heading.innerHTML = "<strong>Unassigned</strong><small>Counts in the task total until you pick a day.</small>";
      const body = document.createElement("div");
      body.className = "weekly-assign-group__body";
      unassignedChunks.forEach((chunk) => body.appendChild(renderWeeklyAssignChunk(chunk, "")));
      const addChunk = document.createElement("button");
      addChunk.type = "button";
      addChunk.className = "weekly-assign-add-chunk";
      addChunk.textContent = "+ add subtask";
      addChunk.addEventListener("click", () => {
        body.insertBefore(renderWeeklyAssignChunk({ text: "", done: false, days: [] }, ""), addChunk);
        updateAssignSubcount(panel);
      });
      body.appendChild(addChunk);
      group.append(heading, body);
      chunksWrap.appendChild(group);
    }
    orderedDays.forEach((iso) => {
      const dayIndex = weekIsoDays.indexOf(iso);
      const group = document.createElement("section");
      group.className = "weekly-assign-group";
      group.dataset.day = iso;
      const heading = document.createElement("div");
      heading.className = "weekly-assign-group__head";
      heading.innerHTML = `<strong>${WEEKDAY_LABELS[dayIndex]}</strong>`;
      const body = document.createElement("div");
      body.className = "weekly-assign-group__body";
      const dayChunks = currentWeekSubtasks.filter((subtask) =>
        (subtask.days || []).map(normalizeIsoDateInput).includes(iso)
      );
      const chunks = draftChunks.get(iso) || (dayChunks.length ? dayChunks : [{ id: "", text: "", done: false, days: [iso] }]);
      chunks.forEach((chunk) => body.appendChild(renderWeeklyAssignChunk(chunk, iso)));
      const addChunk = document.createElement("button");
      addChunk.type = "button";
      addChunk.className = "weekly-assign-add-chunk";
      addChunk.textContent = "+ add subtask";
      addChunk.addEventListener("click", () => {
        body.insertBefore(renderWeeklyAssignChunk({ text: "", done: false }, iso), addChunk);
        updateAssignSubcount(panel);
      });
      body.appendChild(addChunk);
      group.append(heading, body);
      chunksWrap.appendChild(group);
    });
    updateAssignSubcount(panel);
  };

  dates.forEach((date, index) => {
    const iso = dateToLocalIso(date);
    const day = document.createElement("button");
    day.type = "button";
    day.className = "weekly-assign-day";
    day.dataset.day = iso;
    day.classList.toggle("is-selected", selected.has(iso));
    day.innerHTML = `<strong>${WEEKDAY_LABELS[index]}</strong><small>${date.getDate()}</small>`;
    day.addEventListener("click", () => {
      if (selected.has(iso)) selected.delete(iso);
      else selected.add(iso);
      day.classList.toggle("is-selected", selected.has(iso));
      renderChunks();
    });
    daysWrap.appendChild(day);
  });
  renderChunks();

  panel.querySelector(".weekly-assign-modal__close").addEventListener("click", closeWeeklyAssignModal);
  panel.querySelector(".weekly-assign-cancel").addEventListener("click", closeWeeklyAssignModal);
  panel.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveWeeklyAssignment(todo.id, panel, weekIsoDays);
  });
  overlay.appendChild(panel);
  const firstInput = panel.querySelector(".weekly-assign-chunk__text");
  if (firstInput) firstInput.focus();
}

function updateAssignSubcount(panel) {
  const target = panel.querySelector(".weekly-assign-subcount");
  if (target) {
    target.textContent = String(panel.querySelectorAll(".weekly-assign-chunk").length);
  }
}

function renderWeeklyAssignChunk(chunk, iso) {
  const row = document.createElement("div");
  row.className = "weekly-assign-chunk";
  row.dataset.day = iso || "";
  row.dataset.subtaskId = chunk.id || "";
  row.dataset.done = chunk.done ? "true" : "false";
  row.innerHTML = `
    <textarea class="weekly-assign-chunk__text" rows="1" maxlength="160" placeholder="note (optional)">${escapeHtml(chunk.text || "")}</textarea>
    <button type="button" class="weekly-assign-chunk__remove" aria-label="Remove chunk">×</button>
  `;
  const textarea = row.querySelector("textarea");
  const resize = () => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };
  textarea.addEventListener("input", resize);
  row.querySelector(".weekly-assign-chunk__remove").addEventListener("click", () => {
    const panel = row.closest(".weekly-assign-modal");
    row.remove();
    if (panel) updateAssignSubcount(panel);
  });
  requestAnimationFrame(resize);
  return row;
}

async function saveWeeklyAssignment(todoId, panel, weekIsoDays) {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) return;
  const previous = cloneTodoDraft(todo);
  const selectedDays = [...panel.querySelectorAll(".weekly-assign-day.is-selected")]
    .map((button) => normalizeIsoDateInput(button.dataset.day))
    .filter(Boolean);
  const selectedSet = new Set(selectedDays);
  const keepSubtasks = (todo.subtasks || []).filter((subtask) =>
    (subtask.days || []).some((day) => {
      const normalized = normalizeIsoDateInput(day);
      return normalized && !weekIsoDays.includes(normalized);
    })
  );
  const chunks = [...panel.querySelectorAll(".weekly-assign-chunk")]
    .map((row) => {
      const text = String(row.querySelector(".weekly-assign-chunk__text")?.value || "").trim();
      const day = normalizeIsoDateInput(row.dataset.day);
      if (day && !selectedSet.has(day)) return null;
      return {
        id: row.dataset.subtaskId || `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        text,
        done: row.dataset.done === "true",
        days: day ? [day] : [],
      };
    })
    .filter(Boolean);
  const chunkDays = new Set(chunks.map((chunk) => chunk.days[0]).filter(Boolean));
  selectedDays.forEach((day) => {
    if (chunkDays.has(day)) return;
    chunks.push({
      id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      text: "",
      done: false,
      days: [day],
    });
  });
  const dueDate = normalizeIsoDateInput(panel.querySelector(".weekly-assign-deadline-date")?.value || "");
  const details = String(panel.querySelector(".weekly-assign-description")?.value || "").trim();
  const nextTodo = {
    ...todo,
    weeklyDays: selectedDays,
    subtasks: [...keepSubtasks, ...chunks],
    dueDate: dueDate || null,
    details,
    lane: selectedDays.length ? "month" : "ideas",
  };
  try {
    setStatus("Saving weekly assignment...");
    updateTodo(nextTodo);
    closeWeeklyAssignModal();
    render();
    const payload = await api(`/todos/${todo.id}`, { method: "PUT", body: serializeTodoForApi(nextTodo) });
    updateTodo(hydrateTodoFromServer(payload.todo));
    state.lastSyncedAt = Date.now();
    render();
    setStatus("Weekly assignment saved.");
  } catch (error) {
    updateTodo(previous);
    render();
    setStatus(error.message, true);
  }
}

async function createWeeklyProjectTask(project, title) {
  const projectTitle = String(project?.title || "").trim();
  if (!projectTitle) return;
  try {
    setStatus("Adding weekly task...");
    const payload = await api("/todos", {
      method: "POST",
      body: serializeTodoForApi({
        title,
        details: "",
        projectId: project?.id || "",
        projectTitle,
        weeklyDays: [],
        missed: false,
        subtasks: [],
        dueDate: null,
        lane: "ideas",
        priority: "medium",
        done: false,
        daily: false,
        dailyCompletedOn: null,
        streak: 0,
      }),
    });
    updateTodo(hydrateTodoFromServer(payload.todo));
    state.lastSyncedAt = Date.now();
    render();
    setStatus("Weekly task added. Assign days when ready.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function toggleTodoMissed(todoId) {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) return;
  const previous = cloneTodoDraft(todo);
  const nextTodo = { ...todo, missed: !todo.missed };
  try {
    updateTodo(nextTodo);
    render();
    const payload = await api(`/todos/${todo.id}`, { method: "PUT", body: serializeTodoForApi(nextTodo) });
    updateTodo(hydrateTodoFromServer(payload.todo));
    state.lastSyncedAt = Date.now();
    render();
  } catch (error) {
    updateTodo(previous);
    render();
    setStatus(error.message, true);
  }
}

function setWeeklyPage(panel) {
  state.weeklyPanel = ["planner", "archive", "stats"].includes(panel) ? panel : "planner";
  renderWeekly();
}

function renderWeeklyInsights() {
  const page = state.weeklyPanel || "planner";
  const isPlanner = page === "planner";
  appShell.dataset.weeklyPanel = page;
  weeklyProgress.hidden = !isPlanner;
  weeklyPlannerPage.hidden = !isPlanner;
  weeklyArchivePanel.hidden = page !== "archive";
  weeklyStatsPanel.hidden = page !== "stats";
  weeklyPlannerButton.classList.toggle("is-active", isPlanner);
  weeklyArchiveButton.classList.toggle("is-active", state.weeklyPanel === "archive");
  weeklyStatsButton.classList.toggle("is-active", state.weeklyPanel === "stats");
  weeklyEndButton.hidden = !isPlanner;
  weeklyEndButton.classList.toggle("is-suggested", isPlanner && !state.weeklyArchives.length);
  weeklyPreviousButton.hidden = !isPlanner;
  weeklyTodayButton.hidden = !isPlanner;
  weeklyNextButton.hidden = !isPlanner;
  weeklyShowAllButton.hidden = !isPlanner || state.weeklyFocusDate === "__all__";
  weeklyBacklog.hidden = !isPlanner;
  renderWeeklyArchive();
  renderWeeklyStats();
}

function renderWeeklyArchive() {
  weeklyArchiveList.innerHTML = "";
  if (!state.weeklyArchives.length) {
    weeklyArchiveList.innerHTML = `
      <div class="weekly-archive-empty">
        <strong>No archived weeks yet.</strong>
        <span>Use <b>End week</b> on the Planner page to save a snapshot of your current week here.</span>
      </div>
    `;
    return;
  }
  state.weeklyArchives.forEach((week) => {
    const item = document.createElement("article");
    item.className = "weekly-archive-item";
    const title = document.createElement("div");
    title.className = "weekly-archive-item__title";
    const label = document.createElement("strong");
    label.textContent = week.label;
    const meta = document.createElement("small");
    meta.textContent = `${week.completed}/${week.total} done`;
    title.append(label, meta);

    const days = document.createElement("div");
    days.className = "weekly-archive-days";
    (week.days || []).forEach((day, index) => {
      const pill = document.createElement("i");
      const done = Number(day.done || 0);
      const total = Number(day.total || 0);
      pill.className = `weekly-archive-day intensity-${contributionIntensity(done, total)}`;
      pill.title = `${WEEKDAY_LABELS[index]}: ${done}/${total} done`;
      const bar = document.createElement("strong");
      bar.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent = WEEKDAY_LABELS[index][0];
      pill.append(bar, label);
      days.appendChild(pill);
    });
    const score = document.createElement("strong");
    score.className = "weekly-archive-item__score";
    score.textContent = `${week.progress}%`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "weekly-archive-item__remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove archived week ${week.label}`);
    remove.addEventListener("click", () => {
      state.weeklyArchives = state.weeklyArchives.filter((entry) => entry.id !== week.id);
      saveWeeklyArchives();
      renderWeekly();
    });
    item.append(title, days, score, remove);
    weeklyArchiveList.appendChild(item);
  });
}

function renderWeeklyStats() {
  const weeks = state.weeklyArchives;
  const average = weeks.length ? Math.round(weeks.reduce((sum, week) => sum + week.progress, 0) / weeks.length) : 0;
  const best = weeks.length ? Math.max(...weeks.map((week) => week.progress)) : 0;
  let streak = 0;
  for (const week of weeks) {
    if (week.progress < 50) break;
    streak += 1;
  }
  const totalDone = weeks.reduce((sum, week) => sum + Number(week.completed || 0), 0);
  const bestWeek = weeks.find((week) => Number(week.progress || 0) === best);
  weeklyStatsGrid.innerHTML = [
    ["Avg completion", `${average}%`, weeks.length ? `${totalDone} tasks done` : "No archived weeks yet"],
    ["Best week", `${best}%`, bestWeek ? bestWeek.label : "-"],
    ["Week streak", String(streak), "in a row at 50%+"],
    ["Weeks tracked", String(weeks.length), "all-time"],
  ].map(([label, value, hint]) => `<article class="weekly-stat-card"><strong>${value}</strong><span>${label}</span><small>${hint}</small></article>`).join("");

  const totals = Array.from({ length: 7 }, () => ({ done: 0, total: 0 }));
  weeks.forEach((week) => (week.days || []).forEach((day, index) => {
    totals[index].done += day.done;
    totals[index].total += day.total;
  }));
  weeklyWeekdayStats.innerHTML = "";
  const activity = document.createElement("section");
  activity.className = "weekly-activity-card";
  activity.innerHTML = `
    <div class="weekly-insight-heading">
      <div>
        <p class="eyebrow">Activity</p>
        <h3>${totalDone} tasks completed in the last year.</h3>
      </div>
      <span>Less <i></i><i></i><i></i><i></i> More</span>
    </div>
  `;
  const matrix = document.createElement("div");
  matrix.className = "weekly-activity-matrix";
  const monthLabels = document.createElement("div");
  monthLabels.className = "weekly-activity-months";
  const weekdayLabels = document.createElement("div");
  weekdayLabels.className = "weekly-activity-weekdays";
  const heatmap = document.createElement("div");
  heatmap.className = "weekly-activity-grid";
  const archiveByStart = new Map(
    weeks
      .map((week) => [weeklyArchiveStartIso(week), week])
      .filter(([iso]) => iso)
  );
  const todayDate = new Date(`${todayIso()}T00:00:00`);
  const rangeStart = weekStart(new Date(todayDate.getFullYear(), 5, 1));
  const rangeEnd = weekStart(new Date(todayDate.getFullYear() + 1, 5, 30));
  const activityWeekCount = Math.max(1, Math.round((rangeEnd - rangeStart) / (7 * 24 * 60 * 60 * 1000)) + 1);
  const activityWeeks = Array.from({ length: activityWeekCount }, (_, index) => {
    const start = new Date(rangeStart);
    start.setDate(rangeStart.getDate() + index * 7);
    const iso = dateToLocalIso(start);
    const archived = archiveByStart.get(iso);
    return {
      iso,
      start,
      days: Array.isArray(archived?.days) ? archived.days : Array.from({ length: 7 }, () => ({ done: 0, total: 0 })),
    };
  });
  activityWeeks.forEach((week, index) => {
    const label = document.createElement("span");
    const previous = activityWeeks[index - 1];
    const isNewMonth = !previous || previous.start.getMonth() !== week.start.getMonth();
    label.textContent = isNewMonth ? `Tháng ${week.start.getMonth() + 1}` : "";
    label.classList.toggle("is-month-start", isNewMonth && index > 0);
    monthLabels.appendChild(label);
  });
  WEEKDAY_LABELS.forEach((label, index) => {
    const item = document.createElement("span");
    item.textContent = index % 2 === 0 ? label.slice(0, 3) : "";
    weekdayLabels.appendChild(item);
  });
  activityWeeks.forEach((week, weekIndex) => {
    const previous = activityWeeks[weekIndex - 1];
    const isNewMonth = previous && previous.start.getMonth() !== week.start.getMonth();
    const weekColumn = document.createElement("div");
    weekColumn.className = "weekly-activity-week";
    weekColumn.classList.toggle("is-month-start", Boolean(isNewMonth));
    const days = Array.isArray(week.days) ? week.days : [];
    Array.from({ length: 7 }, (_, index) => days[index] || { done: 0, total: 0 }).forEach((day, index) => {
      const cell = document.createElement("i");
      const done = Number(day.done || 0);
      const total = Number(day.total || 0);
      cell.className = `weekly-activity-cell intensity-${contributionIntensity(done, total)}`;
      cell.title = `${WEEKDAY_LABELS[index]}: ${done}/${total || 0} done`;
      weekColumn.appendChild(cell);
    });
    heatmap.appendChild(weekColumn);
  });
  matrix.append(monthLabels, weekdayLabels, heatmap);
  activity.appendChild(matrix);
  weeklyWeekdayStats.appendChild(activity);

  const weekday = document.createElement("section");
  weekday.className = "weekly-weekday-card";
  const bestDays = totals
    .map((day, index) => ({ label: WEEKDAY_LABELS[index], value: day.total ? Math.round((day.done / day.total) * 100) : 0 }))
    .filter((day) => day.value)
    .sort((left, right) => right.value - left.value)
    .slice(0, 3)
    .map((day) => day.label)
    .join(", ");
  weekday.innerHTML = `
    <div class="weekly-insight-heading">
      <div>
        <p class="eyebrow">By weekday</p>
        <h3>${bestDays ? `${bestDays} are running strongest.` : "Archive a week to see weekday rhythm."}</h3>
      </div>
    </div>
  `;
  const bars = document.createElement("div");
  bars.className = "weekly-weekday-bars";
  totals.forEach((day, index) => {
    const value = day.total ? Math.round((day.done / day.total) * 100) : 0;
    const label = WEEKDAY_LABELS[index];
    const row = document.createElement("div");
    row.className = "weekly-weekday-bar";
    const bar = document.createElement("span");
    const fill = document.createElement("i");
    fill.className = percentClass(value);
    bar.appendChild(fill);
    const valueEl = document.createElement("strong");
    valueEl.textContent = value ? `${value}%` : "-";
    const labelEl = document.createElement("small");
    labelEl.textContent = label;
    row.append(bar, valueEl, labelEl);
    bars.appendChild(row);
  });
  weekday.appendChild(bars);
  weeklyWeekdayStats.appendChild(weekday);
}

function contributionIntensity(done, total) {
  if (!done) return 0;
  if (!total) return Math.min(4, done);
  const ratio = done / total;
  if (ratio >= 1 || done >= 4) return 4;
  if (ratio >= 0.66 || done >= 3) return 3;
  if (ratio >= 0.34 || done >= 2) return 2;
  return 1;
}

function todoArchiveDaysForWeek(todo, firstIso, lastIso) {
  if (todo.daily) return [];
  const days = new Set();
  todoWeeklyDays(todo).forEach((day) => {
    if (day >= firstIso && day <= lastIso) {
      days.add(day);
    }
  });
  return [...days].sort();
}

function todoArchiveUnitsForWeek(todo, firstIso, lastIso) {
  if (todo.daily) return [];
  const units = [];
  const weeklySubtasks = (todo.subtasks || []).filter((subtask) =>
    (subtask.days || []).some((day) => {
      const normalized = normalizeIsoDateInput(day);
      return normalized && normalized >= firstIso && normalized <= lastIso;
    })
  );
  if (weeklySubtasks.length) {
    weeklySubtasks.forEach((subtask) => {
      [...new Set((subtask.days || []).map(normalizeIsoDateInput).filter((day) => day && day >= firstIso && day <= lastIso))]
        .forEach((day) => {
          units.push({
            day,
            done: Boolean(todo.done || subtask.done),
            title: subtask.text || todo.title,
            projectId: todo.projectId || "",
            projectTitle: todo.projectTitle || "",
          });
        });
    });
  }
  const unassignedUnits = unassignedWeeklySubtaskUnits(todo).map((unit) => ({
    day: "",
    done: unit.done,
    title: unit.desc || unit.title,
    projectId: unit.projectId || "",
    projectTitle: unit.projectTitle || "",
  }));
  if (units.length || unassignedUnits.length) return [...units, ...unassignedUnits];
  if (todo.projectTitle) {
    return [{
      day: "",
      done: Boolean(todo.done),
      title: todo.title,
      projectId: todo.projectId || "",
      projectTitle: todo.projectTitle || "",
    }];
  }
  return todoArchiveDaysForWeek(todo, firstIso, lastIso).map((day) => ({
    day,
    done: Boolean(todo.done),
    title: todo.title,
    projectId: todo.projectId || "",
    projectTitle: todo.projectTitle || "",
  }));
}

function weeklyArchiveStartIso(week) {
  const idStart = normalizeIsoDateInput(String(week?.id || "").slice(0, 10));
  if (idStart) return idStart;
  const labelStart = String(week?.label || "").split(" - ")[0];
  const parsed = Date.parse(labelStart);
  return Number.isNaN(parsed) ? "" : dateToLocalIso(new Date(parsed));
}

function percentClass(value) {
  const bucket = Math.max(0, Math.min(100, Math.round(Number(value || 0) / 5) * 5));
  return `pct-${bucket}`;
}

async function endCurrentWeek() {
  const dates = weeklyDates();
  const firstIso = dateToLocalIso(dates[0]);
  const lastIso = dateToLocalIso(dates[6]);
  const tasks = state.todos.filter((todo) => todoArchiveUnitsForWeek(todo, firstIso, lastIso).length);
  const archiveUnits = tasks.flatMap((todo) => todoArchiveUnitsForWeek(todo, firstIso, lastIso));
  if (!tasks.length) {
    setStatus("There are no scheduled tasks to archive.", true);
    return;
  }
  const action = await showWeeklyEndModal(`${SHORT_DATE_FORMATTER.format(dates[0])} - ${SHORT_DATE_FORMATTER.format(dates[6])}`);
  if (!action) return;
  const carry = action === "carry";
  const completed = archiveUnits.filter((unit) => unit.done).length;
  const unfinished = archiveUnits.filter((unit) => !unit.done).length;
  const missed = tasks.filter((todo) => todo.missed).length;
  state.weeklyArchives.unshift({
    id: `${firstIso}-${Date.now()}`,
    label: `${SHORT_DATE_FORMATTER.format(dates[0])} - ${SHORT_DATE_FORMATTER.format(dates[6])}`,
    completed,
    total: archiveUnits.length,
    carried: carry ? unfinished : 0,
    missed,
    progress: Math.round((completed / archiveUnits.length) * 100),
    days: dates.map((date) => {
      const iso = dateToLocalIso(date);
      const dayUnits = archiveUnits.filter((unit) => unit.day === iso);
      return { total: dayUnits.length, done: dayUnits.filter((unit) => unit.done).length };
    }),
    tasks: archiveUnits.map((unit) => ({ title: unit.title, done: unit.done, projectId: unit.projectId || "", projectTitle: unit.projectTitle || "" })),
    createdAt: new Date().toISOString(),
  });
  saveWeeklyArchives();
  try {
    if (!carry) {
      const projectIdsToClear = new Set(tasks.map((todo) => todo.projectId).filter(Boolean));
      const legacyProjectTitlesToClear = new Set(tasks.filter((todo) => !todo.projectId).map((todo) => todo.projectTitle).filter(Boolean));
      const weeklyProjectsToDelete = state.weeklyProjects.filter((project) =>
        projectIdsToClear.has(project.id) || legacyProjectTitlesToClear.has(project.title)
      );
      const todoIdsToDelete = new Set(
        state.todos
          .filter((todo) =>
            tasks.some((entry) => entry.id === todo.id)
            || (todo.projectId && projectIdsToClear.has(todo.projectId))
            || (!todo.projectId && legacyProjectTitlesToClear.has(todo.projectTitle))
          )
          .map((todo) => todo.id)
      );
      await Promise.all([
        ...[...todoIdsToDelete].map((todoId) => api(`/todos/${todoId}`, { method: "DELETE" })),
        ...weeklyProjectsToDelete.map((project) => api(`/weekly-projects/${project.id}`, { method: "DELETE" })),
      ]);
      state.selectedDate = addDaysIso(firstIso, 7);
      state.weeklyPanel = "planner";
      state.weeklyFocusDate = "";
      saveUiState();
      await refreshFromServer(false);
      setStatus("Week archived. Plan cleared.");
      return;
    }

    await Promise.all(tasks.map(async (todo) => {
      if (todo.done) {
        await api(`/todos/${todo.id}`, { method: "DELETE" });
        return;
      }
      const currentWeeklyDays = todoArchiveDaysForWeek(todo, firstIso, lastIso);
      const remainingWeeklyDays = todoWeeklyDays(todo).filter((day) => day < firstIso || day > lastIso);
      const hasWeeklySubtasks = (todo.subtasks || []).some((subtask) =>
        (subtask.days || []).some((day) => {
          const normalized = normalizeIsoDateInput(day);
          return normalized && normalized >= firstIso && normalized <= lastIso;
        })
      );
      const nextSubtasks = (todo.subtasks || [])
        .filter((subtask) => !subtask.done)
        .map((subtask) => {
          const nextDays = [];
          (subtask.days || []).forEach((day) => {
            const normalized = normalizeIsoDateInput(day);
            if (!normalized) return;
            if (normalized >= firstIso && normalized <= lastIso) {
              if (carry) nextDays.push(addDaysIso(normalized, 7));
            } else {
              nextDays.push(normalized);
            }
          });
          return { ...subtask, days: [...new Set(nextDays)].sort() };
        });
      const nextWeeklyDays = hasWeeklySubtasks
        ? [...remainingWeeklyDays, ...nextSubtasks.flatMap((subtask) => subtask.days || [])]
        : carry
          ? [...remainingWeeklyDays, ...currentWeeklyDays.map((day) => addDaysIso(day, 7))]
          : remainingWeeklyDays;
      const nextDate = todo.dueDate || null;
      const nextTodo = {
        ...todo,
        dueDate: nextDate,
        weeklyDays: [...new Set(nextWeeklyDays)].sort(),
        subtasks: nextSubtasks,
        lane: nextDate || nextWeeklyDays.length ? (todo.lane || "ideas") : "ideas",
        missed: false,
      };
      await api(`/todos/${todo.id}`, { method: "PUT", body: serializeTodoForApi(nextTodo) });
    }));
    state.selectedDate = addDaysIso(firstIso, 7);
    state.weeklyPanel = "planner";
    state.weeklyFocusDate = "";
    saveUiState();
    await refreshFromServer(false);
    setStatus("Week archived. Unfinished tasks moved forward.");
  } catch (error) {
    setStatus(`Archive saved, but tasks could not be moved: ${error.message}`, true);
    render();
  }
}

function addDaysIso(iso, days) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return dateToLocalIso(date);
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

async function moveTodoToDate(todoId, targetDate) {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo || todo.daily) {
    return;
  }
  const previous = cloneTodoDraft(todo);
  const nextTodo = {
    ...todo,
    dueDate: targetDate || null,
    lane: targetDate ? (targetDate === todayIso() ? "today" : "week") : "ideas",
    done: false,
  };
  try {
    updateTodo(nextTodo);
    render();
    const payload = await api(`/todos/${todo.id}`, {
      method: "PUT",
      body: serializeTodoForApi(nextTodo),
    });
    updateTodo(hydrateTodoFromServer(payload.todo));
    state.lastSyncedAt = Date.now();
    render();
    setStatus(targetDate ? "Task scheduled." : "Task moved to unscheduled.");
  } catch (error) {
    updateTodo(previous);
    render();
    setStatus(error.message, true);
  }
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
  const taskDone = isTodoEffectivelyDone(todo);

  card.dataset.id = todo.id;
  card.dataset.lane = normalizeLane(todo);
  card.classList.toggle("is-selected", todo.id === state.detailTaskId);
  card.classList.toggle("is-done", taskDone);
  card.classList.toggle("is-daily", Boolean(todo.daily));
  card.classList.toggle("is-draggable", canDragTodo(todo));
  card.draggable = canDragTodo(todo);
  checkbox.checked = taskDone;
  title.textContent = boardTaskTitle(todo);
  details.textContent = boardTaskDetails(todo);
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
    card.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", todo.id);
    }
  });

  card.addEventListener("dragend", () => {
    dragTodoId = "";
    dragCardPosition = "after";
    card.classList.remove("is-dragging");
    document.querySelectorAll(".column").forEach((column) => column.classList.remove("is-drop-target"));
    document.querySelectorAll(".task-card").forEach((entry) => entry.classList.remove("is-drag-before", "is-drag-after"));
  });

  card.addEventListener("dragover", (event) => {
    if (!dragTodoId || dragTodoId === todo.id || todo.daily) {
        return;
    }
    const dragged = state.todos.find((entry) => entry.id === dragTodoId);
    if (!dragged) {
      return;
    }
    const draggedDone = isTodoEffectivelyDone(dragged);
    const targetDone = isTodoEffectivelyDone(todo);
    if (!canManualReorder() || draggedDone || targetDone) {
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
    if (!dragTodoId || dragTodoId === todo.id || todo.daily) {
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
    const draggedDone = isTodoEffectivelyDone(dragged);
    const targetDone = isTodoEffectivelyDone(todo);
    if (groupingLane(todo) !== "done" && !draggedDone && !targetDone && canManualReorder()) {
      await reorderTodo(dragTodoId, normalizeLane(todo), todo.id, dragCardPosition);
    } else if (groupingLane(dragged) !== groupingLane(todo) || draggedDone !== targetDone) {
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

function renderBoardProjectCard(group) {
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
  const todos = group.todos || [];
  const weekIsoDays = weeklyDates().map(dateToLocalIso);
  const completion = weeklyCompletionForTodos(todos, weekIsoDays);
  const { total, done } = completion;
  const childTitles = [...new Set(todos.map((todo) => todo.title).filter(Boolean))];
  const project = weeklyProjectItems().find((item) => projectKey(item) === group.key)
    || weeklyProjectItems().find((item) => String(item.title || "").trim().toLowerCase() === String(group.title || "").trim().toLowerCase());

  card.dataset.projectId = group.projectId || "";
  card.dataset.projectKey = group.key;
  card.classList.add("task-card--project");
  card.classList.toggle("is-done", completion.complete);
  card.classList.remove("is-draggable");
  card.draggable = false;
  checkbox.checked = completion.complete;
  title.textContent = group.title || "Untitled project";
  details.textContent = childTitles.length
    ? `${childTitles.slice(0, 3).join(" · ")}${childTitles.length > 3 ? ` · +${childTitles.length - 3} more` : ""}`
    : "No weekly tasks yet.";
  due.textContent = boardProjectLane(group) === "month" ? "This Month" : "";
  subtaskMeta.textContent = total ? `${done}/${total} tasks` : "";
  streak.textContent = "";
  priority.textContent = "PROJECT";
  priority.className = "task-card__priority priority-medium";

  checkbox.addEventListener("change", async () => {
    const nextDone = checkbox.checked;
    for (const todo of todos) {
      if (Boolean(todo.done) !== nextDone) {
        await toggleTodoDone(todo.id, nextDone);
      }
    }
  });

  const openProject = () => {
    if (todos[0]?.id) {
      openTaskDetail(todos[0].id);
      return;
    }
    if (project?.title) setStatus("Weekly projects are separate from Portfolio.");
  };
  bodyButton.addEventListener("click", openProject);
  bodyButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProject();
    }
  });

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

async function moveTodoToBoardLane(todoId, targetLane) {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo || !BOARD_LANES.includes(targetLane)) {
    return;
  }
  if (targetLane === "daily" && !todo.daily) {
    setStatus("Daily tasks must be created directly.", true);
    return;
  }
  const previous = cloneTodoDraft(todo);
  const nextTodo = {
    ...todo,
    daily: targetLane === "daily",
    dailyCompletedOn: targetLane === "daily" ? todo.dailyCompletedOn || null : null,
    streak: targetLane === "daily" ? Number(todo.streak || 0) : 0,
    dueDate: null,
    done: targetLane === "done",
    lane: targetLane === "daily" ? "today" : targetLane === "done" ? normalizeLane(todo) : targetLane,
  };
  try {
    updateTodo(nextTodo);
    render();
    const payload = await api(`/todos/${todo.id}`, {
      method: "PUT",
      body: serializeTodoForApi(nextTodo),
    });
    updateTodo(hydrateTodoFromServer(payload.todo));
    state.lastSyncedAt = Date.now();
    render();
    setStatus(`Task moved to ${laneLabel(targetLane)}.`);
  } catch (error) {
    updateTodo(previous);
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
    .filter((todo) => !isTodoEffectivelyDone(todo) && normalizeLane(todo) === lane && todo.id !== excludeId)
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
    const effectivelyDone = isTodoEffectivelyDone(todo);
    if (todo.daily && effectivelyDone) {
      return false;
    }
    if (state.filterMode === "today") {
      return !effectivelyDone && (groupingLane(todo) === "today" || todo.dueDate === today);
    }
    if (state.filterMode === "overdue") {
      return Boolean(todo.dueDate) && todo.dueDate < today && !effectivelyDone;
    }
    if (state.filterMode === "high") {
      return todo.priority === "high" && !effectivelyDone;
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
  if (isTodoEffectivelyDone(todo)) {
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
  const weeklyDays = Array.isArray(todo.weeklyDays)
    ? todo.weeklyDays.map((day) => normalizeIsoDateInput(day)).filter(Boolean).slice(0, 21)
    : parsed.weeklyDays;
  return {
    ...todo,
    details: parsed.details,
    projectId: String(todo.projectId || parsed.projectId || "").trim(),
    projectTitle: String(todo.projectTitle || parsed.projectTitle || "").trim(),
    missed: Boolean(todo.missed || parsed.missed),
    weeklyDays,
    subtasks: Array.isArray(todo.subtasks)
      ? todo.subtasks
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          id: String(item.id || `sub-${Math.random().toString(36).slice(2, 8)}`),
          text: String(item.text || "").trim(),
          done: Boolean(item.done),
          days: Array.isArray(item.days) ? item.days.filter((day) => normalizeIsoDateInput(day)).slice(0, 7) : [],
        }))
        .filter((item) => item.text || item.days.length)
      : [],
    lane: todo.lane && LANES.includes(todo.lane) ? todo.lane : parsed.lane || inferLegacyLane(todo),
    sortOrder: Number.isFinite(Number(todo.sortOrder)) ? Number(todo.sortOrder) : 0,
    daily: Boolean(todo.daily),
    dailyCompletedOn: todo.dailyCompletedOn || null,
    streak: Number.isFinite(Number(todo.streak)) ? Number(todo.streak) : 0,
  };
}

function parseTodoDetails(rawDetails) {
  let details = String(rawDetails || "").trim();
  const weeklyDaysMatch = details.match(WEEKLY_DAYS_PREFIX);
  const weeklyDays = weeklyDaysMatch
    ? weeklyDaysMatch[1].split(",").map((day) => normalizeIsoDateInput(day.trim())).filter(Boolean).slice(0, 21)
    : [];
  details = details.replace(WEEKLY_DAYS_PREFIX, "").trim();
  const laneMatch = details.match(LANE_PREFIX);
  const lane = laneMatch ? laneMatch[1].toLowerCase() : "";
  details = details.replace(LANE_PREFIX, "").trim();
  const projectIdMatch = details.match(PROJECT_ID_PREFIX);
  const projectId = projectIdMatch ? projectIdMatch[1].trim() : "";
  details = details.replace(PROJECT_ID_PREFIX, "").trim();
  const projectMatch = details.match(PROJECT_PREFIX);
  const projectTitle = projectMatch ? projectMatch[1].trim() : "";
  details = details.replace(PROJECT_PREFIX, "").trim();
  const missed = MISSED_PREFIX.test(details);
  details = details.replace(MISSED_PREFIX, "").trim();
  return {
    lane,
    projectId,
    projectTitle,
    missed,
    weeklyDays,
    details,
  };
}

function serializeTodoForApi(todo) {
  const weeklyDays = Array.isArray(todo.weeklyDays)
    ? todo.weeklyDays.map((day) => normalizeIsoDateInput(day)).filter(Boolean).slice(0, 21)
    : [];
  return {
    title: todo.title,
    details: String(todo.details || "")
      .replace(WEEKLY_DAYS_PREFIX, "")
      .replace(LANE_PREFIX, "")
      .replace(PROJECT_ID_PREFIX, "")
      .replace(PROJECT_PREFIX, "")
      .replace(MISSED_PREFIX, "")
      .trim(),
    subtasks: (todo.subtasks || []).map((item) => ({
      id: item.id,
      text: String(item.text || "").trim(),
      done: Boolean(item.done),
      days: Array.isArray(item.days) ? item.days.filter((day) => normalizeIsoDateInput(day)).slice(0, 7) : [],
    })).filter((item) => item.text || item.days.length),
    dueDate: todo.dueDate || null,
    lane: normalizeLane(todo),
    sortOrder: Number.isFinite(Number(todo.sortOrder)) ? Number(todo.sortOrder) : 0,
    priority: todo.priority || "medium",
    done: Boolean(todo.daily) ? false : Boolean(todo.done),
    daily: Boolean(todo.daily),
    dailyCompletedOn: todo.dailyCompletedOn || null,
    streak: Number.isFinite(Number(todo.streak)) ? Number(todo.streak) : 0,
    projectId: String(todo.projectId || "").replace(/[\[\]]/g, "").trim(),
    projectTitle: String(todo.projectTitle || "").replace(/[\[\]]/g, "").trim(),
    weeklyDays,
    missed: Boolean(todo.missed),
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
    daily: "No daily routines yet.",
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
    .filter((todo) => todo.dueDate && !todo.daily && !todo.projectTitle && !todo.projectId)
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
    if (todo.dueDate === iso && !todo.projectTitle && !todo.projectId) {
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

function syncDraftDoneFromSubtasks(draft) {
  if (!draft || draft.daily || draft.projectTitle) {
    return draft;
  }
  const subtasks = Array.isArray(draft.subtasks) ? draft.subtasks : [];
  if (!subtasks.length) {
    return draft;
  }
  return {
    ...draft,
    done: subtasks.every((item) => Boolean(item.done)),
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
  state.detailDraft = syncDraftDoneFromSubtasks(state.detailDraft);
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
  state.detailDraft = syncDraftDoneFromSubtasks(state.detailDraft);
  state.detailDirty = true;
  renderTaskDetail();
  scheduleDetailSave();
}

function toggleSubtaskDay(id, iso) {
  if (!state.detailDraft) {
    return;
  }
  const subtask = (state.detailDraft.subtasks || []).find((item) => item.id === id);
  if (!subtask) {
    return;
  }
  const days = new Set(subtask.days || []);
  if (days.has(iso)) {
    days.delete(iso);
  } else {
    days.add(iso);
  }
  updateDetailSubtask(id, { days: [...days].sort() });
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
      { id: crypto.randomUUID ? crypto.randomUUID() : `sub-${Date.now()}`, text, done: false, days: [] },
    ],
  };
  state.detailDraft = syncDraftDoneFromSubtasks(state.detailDraft);
  detailSubtaskInput.value = "";
  state.detailDirty = true;
  renderTaskDetail();
  scheduleDetailSave();
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
  const completedIds = new Set(completed.map((todo) => todo.id));
  state.todos = state.todos.filter((todo) => !completedIds.has(todo.id));
  render();
  setUndoAction({
    label: `${completed.length} completed task${completed.length === 1 ? "" : "s"} cleared`,
    rollback: () => {
      state.todos = previousTodos;
      render();
      setStatus("Clear undone.");
    },
    commit: async () => {
      await Promise.all(completed.map((todo) => api(`/todos/${todo.id}`, { method: "DELETE" })));
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

async function queuePortfolioDeleteUndo(itemId) {
  const item = state.portfolioItems.find((entry) => entry.id === itemId);
  if (!item) {
    return;
  }
  const previousItems = state.portfolioItems.map((entry) => ({ ...entry }));
  const previousTodos = state.todos.map(cloneTodoDraft);
  const isProject = item.type === "project";
  const projectTodoIds = isProject
    ? state.todos.filter((todo) => todoProjectMatches(todo, item)).map((todo) => todo.id)
    : [];
  state.portfolioItems = state.portfolioItems.filter((entry) => entry.id !== itemId);
  if (projectTodoIds.length) {
    const deletedIds = new Set(projectTodoIds);
    state.todos = state.todos.filter((todo) => !deletedIds.has(todo.id));
  }
  if (state.portfolioDetailItemId === itemId) {
    state.portfolioDetailItemId = "";
  }
  render();
  if (isProject) {
    try {
      setStatus(projectTodoIds.length ? "Deleting project and its tasks..." : "Deleting project...");
      await Promise.all(projectTodoIds.map((todoId) => api(`/todos/${todoId}`, { method: "DELETE" })));
      await api(`/portfolio/${itemId}`, { method: "DELETE" });
      state.lastSyncedAt = Date.now();
      await refreshFromServer(false);
      setStatus(projectTodoIds.length ? "Project and its tasks deleted." : "Project deleted.");
    } catch (error) {
      state.portfolioItems = previousItems;
      state.todos = previousTodos;
      render();
      setStatus(error.message || "Could not delete project.", true);
    }
    return;
  }
  setUndoAction({
    label: projectTodoIds.length
      ? `Project deleted with ${projectTodoIds.length} task${projectTodoIds.length === 1 ? "" : "s"}`
      : "Portfolio item deleted",
    rollback: () => {
      state.portfolioItems = previousItems;
      state.todos = previousTodos;
      render();
      setStatus("Delete undone.");
    },
    commit: async () => {
      await api(`/portfolio/${itemId}`, { method: "DELETE" });
      await Promise.all(projectTodoIds.map((todoId) => api(`/todos/${todoId}`, { method: "DELETE" })));
      state.lastSyncedAt = Date.now();
      render();
      setStatus(projectTodoIds.length ? "Project and its tasks deleted." : "Portfolio item deleted.");
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

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  try {
    await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
  } catch {}
}

function canDragTodo(todo) {
  return Boolean(todo && todo.id && !todo.daily && !isTodoEffectivelyDone(todo));
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
