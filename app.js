const APP_CONFIG = window.__PLANBOARD_CONFIG__ || {};
const DATA_SOURCE = APP_CONFIG.DATA_SOURCE || "rest";
const PLANBOARD_DOMAIN = window.PlanboardDomain || {};
const PLANNER_UTILS = window.PlannerUtils || {};
const PORTFOLIO_UTILS = window.PlanboardPortfolioUtils || {};
const PLANBOARD_STATE = window.PlanboardState || {};
const PLANBOARD_BOARD = window.PlanboardBoard || {};
const PLANBOARD_CALENDAR = window.PlanboardCalendar || {};
const PLANBOARD_PORTFOLIO = window.PlanboardPortfolio || {};
const PLANBOARD_COMPOSER = window.PlanboardComposer || {};
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
const TOKEN_KEY = PLANBOARD_STATE.TOKEN_KEY || "planboard-token";
const UI_KEY = PLANBOARD_STATE.UI_KEY || "planboard-ui";
const NOTIFICATION_KEY = PLANBOARD_STATE.NOTIFICATION_KEY || "planboard-notified";
const DEFAULT_THEME_KEY = PLANBOARD_STATE.DEFAULT_THEME_KEY || "planboard-default-theme";
const DEFAULT_THEME = PLANBOARD_STATE.DEFAULT_THEME || "aurora";
const THEMES = PLANBOARD_STATE.THEMES || [DEFAULT_THEME, "light"];
const UI_SCALE_KEY = PLANBOARD_STATE.UI_SCALE_KEY || "planboard-ui-scale";
const DEFAULT_UI_SCALE = PLANBOARD_STATE.DEFAULT_UI_SCALE || 1.0;
const ZOOM_LEVELS = [0.85, 0.9, 1.0, 1.1, 1.2];
const DEFAULT_DAILY_RESET_AFTER_DAYS = PLANBOARD_DOMAIN.DEFAULT_DAILY_RESET_AFTER_DAYS || 7;
const DAILY_RESET_OPTIONS = PLANBOARD_DOMAIN.DAILY_RESET_OPTIONS || [1, 3, 7, 14, 30, 0];
const MAX_SUBTASKS = 32;
const LANES = PLANBOARD_DOMAIN.LANES || ["ideas", "month", "week", "today", "done"];
const BOARD_LANES = PLANBOARD_BOARD.BOARD_LANES || ["ideas", "month", "daily", "done"];
const LANE_PREFIX = PLANBOARD_DOMAIN.LANE_PREFIX || /^\[\[lane:(ideas|month|week|today|done)\]\]\s*/i;
const PROJECT_ID_PREFIX = /^\[\[project-id:([^\]]+)\]\]\s*/i;
const PROJECT_PREFIX = /^\[\[project:([^\]]+)\]\]\s*/i;
const MISSED_PREFIX = /^\[\[missed:1\]\]\s*/i;
const LEGACY_WEEK_DAYS_PREFIX = /^\[\[weekly-days:([^\]]*)\]\]\s*/i;

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
const todoDailyResetField = document.querySelector("#todoDailyResetField");
const todoDailyResetInput = document.querySelector("#todoDailyResetInput");
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
const themeToggleButton = document.querySelector("#themeToggleButton");
const sidebarThemeToggle = document.querySelector("#sidebarThemeToggle");
const zoomOutButton = document.querySelector("#zoomOutButton");
const zoomResetButton = document.querySelector("#zoomResetButton");
const zoomInButton = document.querySelector("#zoomInButton");
const sidebarZoomOutButton = document.querySelector("#sidebarZoomOutButton");
const sidebarZoomResetButton = document.querySelector("#sidebarZoomResetButton");
const sidebarZoomInButton = document.querySelector("#sidebarZoomInButton");
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
const detailDailyResetField = document.querySelector("#detailDailyResetField");
const detailDailyResetInput = document.querySelector("#detailDailyResetInput");
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
const undoToastDismiss = document.querySelector("#undoToastDismiss");
const undoToastProgress = document.querySelector("#undoToastProgress");
const commandPaletteButton = document.querySelector("#commandPaletteButton");
const commandPaletteModal = document.querySelector("#commandPaletteModal");
const commandPaletteInput = document.querySelector("#commandPaletteInput");
const commandPaletteResults = document.querySelector("#commandPaletteResults");
const commandPaletteCloseKbd = document.querySelector("#commandPaletteCloseKbd");
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
let detailDraftRevision = 0;
let syncLabelTimerId = 0;
let undoTimerId = 0;
const dailyMaintenanceIds = new Set();
const expandedBoardSubtasks = new Set();
const todoMutationQueues = new Map();

const state = PLANBOARD_STATE.createState
  ? PLANBOARD_STATE.createState()
  : {
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
      lastSyncedAt: 0,
      undoAction: null,
    };

bindEvents();
applyTheme();
applyUiScale();
hydrateSession();
registerServiceWorker();

function loadUiState() {
  if (PLANBOARD_STATE.loadUiState) {
    return PLANBOARD_STATE.loadUiState();
  }
  const defaults = {
    selectedDate: todayIso(),
    activeView: "board",
    portfolioFilter: "all",
    portfolioYear: "all",
    portfolioCert: "all",
    portfolioSearch: "",
    filterMode: "all",
    mobileView: "daily",
    sortMode: "manual",
    theme: localStorage.getItem(DEFAULT_THEME_KEY) || DEFAULT_THEME,
    uiScale: parseFloat(localStorage.getItem(UI_SCALE_KEY)) || DEFAULT_UI_SCALE,
    sidebarCollapsed: false,
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(UI_KEY) || "null");
    const activeView = parsed && ["board", "calendar", "portfolio"].includes(parsed.activeView) ? parsed.activeView : "board";
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
      uiScale: Number.isFinite(parsed && parsed.uiScale) ? parsed.uiScale : defaults.uiScale,
    };
  } catch {
    return defaults;
  }
}

function saveUiState() {
  if (PLANBOARD_STATE.saveUiState) {
    PLANBOARD_STATE.saveUiState(state);
    return;
  }
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
      uiScale: state.uiScale,
      sidebarCollapsed: state.sidebarCollapsed,
    })
  );
}

function loadNotifiedState() {
  if (PLANBOARD_STATE.loadNotifiedState) {
    return PLANBOARD_STATE.loadNotifiedState();
  }
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATION_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveNotifiedState() {
  if (PLANBOARD_STATE.saveNotifiedState) {
    PLANBOARD_STATE.saveNotifiedState(state.notified);
    return;
  }
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(state.notified.slice(-200)));
}

function clearLocalWorkspaceCaches() {
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

function enqueueTodoMutation(todoId, operation) {
  const previous = todoMutationQueues.get(todoId) || Promise.resolve();
  const next = previous.catch(() => undefined).then(operation);
  todoMutationQueues.set(todoId, next);
  next.finally(() => {
    if (todoMutationQueues.get(todoId) === next) {
      todoMutationQueues.delete(todoId);
    }
  });
  return next;
}

function saveTodoPatch(todoId, patch, statusMsg = "") {
  return enqueueTodoMutation(todoId, () => saveTodoPatchNow(todoId, patch, statusMsg));
}

async function saveTodoPatchNow(todoId, patch, statusMsg = "") {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) return false;
  const previous = cloneTodoDraft(todo);
  const nextTodo = { ...todo, ...patch };
  try {
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
    if (statusMsg) setStatus(statusMsg);
    return true;
  } catch (error) {
    updateTodo(previous);
    if (state.detailTaskId === todo.id) {
      state.detailDraft = cloneTodoDraft(previous);
    }
    render();
    setStatus(error.message, true);
    return false;
  }
}

let commandPaletteItems = [];
let commandPaletteSelectedIndex = 0;

function openCommandPalette() {
  if (!commandPaletteModal) return;
  commandPaletteModal.classList.remove("is-hidden");
  if (commandPaletteInput) {
    commandPaletteInput.value = "";
    commandPaletteInput.focus();
  }
  commandPaletteSelectedIndex = 0;
  renderCommandPaletteResults("");
}

function closeCommandPalette() {
  if (!commandPaletteModal) return;
  commandPaletteModal.classList.add("is-hidden");
}

function toggleCommandPalette() {
  if (!commandPaletteModal) return;
  if (commandPaletteModal.classList.contains("is-hidden")) {
    openCommandPalette();
  } else {
    closeCommandPalette();
  }
}

function renderCommandPaletteResults(rawQuery = "") {
  if (!commandPaletteResults) return;
  const query = String(rawQuery || "").trim().toLowerCase();
  commandPaletteItems = [];
  commandPaletteResults.innerHTML = "";

  const navCommands = [
    {
      type: "nav",
      icon: "⊞",
      title: "Chuyển sang Planner Board",
      subtitle: "Bảng Kanban ý tưởng, tháng, thói quen & hoàn thành",
      badge: "View",
      keywords: "board planner kanban tasks",
      action: () => setActiveView("board"),
    },
    {
      type: "nav",
      icon: "📅",
      title: "Chuyển sang Calendar View",
      subtitle: "Xem lịch theo tháng và tiến độ deadline từng ngày",
      badge: "View",
      keywords: "calendar month date lich ngay thang",
      action: () => setActiveView("calendar"),
    },
    {
      type: "nav",
      icon: "📂",
      title: "Chuyển sang Portfolio Projects",
      subtitle: "Hồ sơ dự án, cuộc thi và khóa học",
      badge: "View",
      keywords: "portfolio projects du an ho so",
      action: () => setActiveView("portfolio"),
    },
  ];

  const actionCommands = [
    {
      type: "action",
      icon: "+",
      title: "Tạo nhiệm vụ mới (New Task)",
      subtitle: "Thêm task vào Ideas, This Month hoặc Daily",
      badge: "Action",
      keywords: "new task create add tao moi nhiemvu",
      action: () => openComposer("task", { locked: true }),
    },
    {
      type: "action",
      icon: "+",
      title: "Tạo dự án mới (New Project)",
      subtitle: "Thêm dự án vào Portfolio",
      badge: "Action",
      keywords: "new project add portfolio tao duan",
      action: () => openComposer("portfolio", { locked: true }),
    },
    {
      type: "action",
      icon: "🌓",
      title: "Đổi giao diện Sáng / Tối (Toggle Theme)",
      subtitle: "Chuyển đổi tức thì Dark Mode và Light Mode",
      badge: "Theme",
      keywords: "theme dark light giao dien sang toi mau",
      action: () => toggleTheme(),
    },
    {
      type: "action",
      icon: "✓",
      title: "Dọn dẹp các nhiệm vụ đã hoàn thành (Clear Done)",
      subtitle: "Xóa sạch các task trong cột Done (có thể hoàn tác)",
      badge: "Action",
      keywords: "clear completed done dondep xoa hoanthanh",
      action: () => clearCompletedTasks(),
    },
    {
      type: "action",
      icon: "🔍",
      title: "Đặt lại mức zoom (Reset Zoom 100%)",
      subtitle: "Khôi phục tỷ lệ xem mặc định",
      badge: "Zoom",
      keywords: "zoom reset 100 default",
      action: () => resetZoom(),
    },
  ];

  const filteredNav = navCommands.filter((cmd) => {
    if (!query) return true;
    return cmd.title.toLowerCase().includes(query) || cmd.keywords.toLowerCase().includes(query);
  });

  const filteredActions = actionCommands.filter((cmd) => {
    if (!query) return true;
    return cmd.title.toLowerCase().includes(query) || cmd.keywords.toLowerCase().includes(query);
  });

  let filteredTasks = [];
  if (state.todos && state.todos.length) {
    filteredTasks = state.todos.filter((todo) => {
      if (!query) return false;
      const titleMatch = (todo.title || "").toLowerCase().includes(query);
      const detailsMatch = (todo.details || "").toLowerCase().includes(query);
      const projectMatch = (todo.projectTitle || "").toLowerCase().includes(query);
      const laneMatch = (todo.lane || "").toLowerCase().includes(query);
      return titleMatch || detailsMatch || projectMatch || laneMatch;
    }).slice(0, 15);
  }

  if (!query && state.todos && state.todos.length) {
    filteredTasks = state.todos
      .filter((t) => !isTodoEffectivelyDone(t))
      .slice(0, 6);
  }

  const fragment = document.createDocumentFragment();

  function appendGroup(title, items) {
    if (!items.length) return;
    const groupHeading = document.createElement("div");
    groupHeading.className = "command-palette-group-title";
    groupHeading.textContent = title;
    fragment.appendChild(groupHeading);

    items.forEach((item) => {
      const itemIndex = commandPaletteItems.length;
      commandPaletteItems.push(item);

      const el = document.createElement("div");
      el.className = "command-palette-item";
      el.dataset.index = itemIndex;
      if (itemIndex === commandPaletteSelectedIndex) {
        el.classList.add("is-active");
      }

      el.innerHTML = `
        <div class="command-palette-item__left">
          <span class="command-palette-item__icon">${item.icon}</span>
          <div class="command-palette-item__text">
            <div class="command-palette-item__title">${escapeHtml(item.title)}</div>
            ${item.subtitle ? `<div class="command-palette-item__subtitle">${escapeHtml(item.subtitle)}</div>` : ""}
          </div>
        </div>
        ${item.badge ? `<span class="command-palette-item__badge">${escapeHtml(item.badge)}</span>` : ""}
      `;

      el.addEventListener("mouseenter", () => {
        setCommandPaletteSelectedIndex(itemIndex);
      });

      el.addEventListener("click", () => {
        executeCommandPaletteSelection(itemIndex);
      });

      fragment.appendChild(el);
    });
  }

  if (filteredNav.length) {
    appendGroup("Điều hướng (Navigation)", filteredNav);
  }

  if (filteredActions.length) {
    appendGroup("Hành động (Quick Actions)", filteredActions);
  }

  if (filteredTasks.length) {
    const taskItems = filteredTasks.map((todo) => {
      const done = isTodoEffectivelyDone(todo);
      const isDaily = Boolean(todo.daily);
      const icon = isDaily ? "🔥" : done ? "✓" : "○";
      const laneName = todo.daily ? "Daily" : laneLabel(todo.lane);
      const metaParts = [];
      if (todo.dueDate) metaParts.push(`Hạn: ${todo.dueDate}`);
      if (todo.projectTitle) metaParts.push(todo.projectTitle);
      metaParts.push(laneName);

      return {
        type: "task",
        icon,
        title: todo.title,
        subtitle: metaParts.join(" • "),
        badge: todo.priority ? todo.priority.toUpperCase() : (done ? "DONE" : "TASK"),
        action: () => {
          if (state.activeView !== "board") {
            setActiveView("board");
          }
          openTaskDetail(todo.id);
          window.setTimeout(() => {
            const card = document.querySelector(`.task-card[data-id="${todo.id}"]`);
            if (card) {
              card.scrollIntoView({ behavior: "smooth", block: "center" });
              card.classList.add("is-spotlight");
              window.setTimeout(() => card.classList.remove("is-spotlight"), 2000);
            }
          }, 80);
        },
      };
    });
    appendGroup(query ? "Nhiệm vụ tìm thấy (Tasks)" : "Nhiệm vụ gần đây (Recent Tasks)", taskItems);
  }

  if (!commandPaletteItems.length) {
    const empty = document.createElement("div");
    empty.className = "command-palette-empty";
    empty.textContent = `Không tìm thấy kết quả cho "${rawQuery}".`;
    fragment.appendChild(empty);
  }

  commandPaletteResults.appendChild(fragment);

  if (commandPaletteSelectedIndex >= commandPaletteItems.length) {
    commandPaletteSelectedIndex = 0;
  }
  updateCommandPaletteItemHighlight();
}

function setCommandPaletteSelectedIndex(index) {
  commandPaletteSelectedIndex = Math.max(0, Math.min(index, commandPaletteItems.length - 1));
  updateCommandPaletteItemHighlight();
}

function updateCommandPaletteItemHighlight() {
  if (!commandPaletteResults) return;
  const itemEls = commandPaletteResults.querySelectorAll(".command-palette-item");
  itemEls.forEach((el, idx) => {
    const isSel = idx === commandPaletteSelectedIndex;
    el.classList.toggle("is-active", isSel);
    if (isSel) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
}

function navigateCommandPalette(direction) {
  if (!commandPaletteItems.length) return;
  commandPaletteSelectedIndex = (commandPaletteSelectedIndex + direction + commandPaletteItems.length) % commandPaletteItems.length;
  updateCommandPaletteItemHighlight();
}

function executeCommandPaletteSelection(targetIndex = -1) {
  const index = targetIndex >= 0 ? targetIndex : commandPaletteSelectedIndex;
  if (index >= 0 && index < commandPaletteItems.length) {
    const item = commandPaletteItems[index];
    closeCommandPalette();
    if (typeof item.action === "function") {
      item.action();
    }
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
  todoLaneInput.addEventListener("change", () => {
    if (todoLaneInput.value === "daily") {
      todoDailyInput.checked = true;
    }
    syncTaskDailyResetControls();
    syncTaskDateByLane();
  });
  todoDailyInput.addEventListener("change", () => {
    if (todoDailyInput.checked) {
      todoLaneInput.value = "daily";
    } else if (todoLaneInput.value === "daily") {
      todoLaneInput.value = "";
    }
    syncTaskDailyResetControls();
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
  themeToggleButton?.addEventListener("click", toggleTheme);
  sidebarThemeToggle?.addEventListener("click", toggleTheme);
  zoomOutButton?.addEventListener("click", zoomOut);
  zoomResetButton?.addEventListener("click", resetZoom);
  zoomInButton?.addEventListener("click", zoomIn);
  sidebarZoomOutButton?.addEventListener("click", zoomOut);
  sidebarZoomResetButton?.addEventListener("click", resetZoom);
  sidebarZoomInButton?.addEventListener("click", zoomIn);

  document.addEventListener("keydown", (event) => {
    const activeElement = document.activeElement;
    const activeTag = activeElement ? activeElement.tagName.toLowerCase() : "";
    const activeInputType = activeTag === "input" ? String(activeElement.type || "text").toLowerCase() : "";
    const isEditing = activeTag === "input" || activeTag === "textarea" || activeTag === "select" || (activeElement && activeElement.isContentEditable);
    const isTextEditing = activeTag === "textarea"
      || activeTag === "select"
      || Boolean(activeElement && activeElement.isContentEditable)
      || (activeTag === "input" && !["checkbox", "radio", "button", "submit", "reset"].includes(activeInputType));

    if ((event.ctrlKey || event.metaKey) && (event.key === "k" || event.key === "K") && !event.altKey) {
      event.preventDefault();
      toggleCommandPalette();
      return;
    }

    if (
      (event.ctrlKey || event.metaKey)
      && (event.key === "z" || event.key === "Z")
      && !event.altKey
      && !event.shiftKey
      && !isTextEditing
      && state.undoAction
    ) {
      event.preventDefault();
      undoLastAction();
      return;
    }

    if (commandPaletteModal && !commandPaletteModal.classList.contains("is-hidden")) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCommandPalette();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        navigateCommandPalette(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        navigateCommandPalette(-1);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        executeCommandPaletteSelection();
        return;
      }
    }

    if (event.key === "Escape") {
      if (commandPaletteModal && !commandPaletteModal.classList.contains("is-hidden")) {
        closeCommandPalette();
        return;
      }
      if (taskDetailOverlay && !taskDetailOverlay.classList.contains("task-detail-overlay--hidden")) {
        closeTaskDetail();
        return;
      }
      if (taskActionOverlay && !taskActionOverlay.classList.contains("task-action-overlay--hidden")) {
        closeTaskActionSheet();
        return;
      }
      if (composerOverlay && !composerOverlay.classList.contains("composer-overlay--hidden")) {
        closeComposer();
        return;
      }
    }

    if ((event.ctrlKey || event.metaKey) && !event.altKey) {
      if (event.key === "-" || event.key === "_" || event.key === "[") {
        event.preventDefault();
        zoomOut();
        return;
      }
      if (event.key === "=" || event.key === "+" || event.key === "]") {
        event.preventDefault();
        zoomIn();
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        resetZoom();
        return;
      }
    }

    if (event.shiftKey && (event.key === "T" || event.key === "t") && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (!isEditing) {
        event.preventDefault();
        toggleTheme();
        return;
      }
    }

    if (!isEditing && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        openComposer(composerTabForActiveView(), { locked: true });
        return;
      }
    }
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
    clearCompletedTasks();
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
      const editingTodo = editingId ? state.todos.find((todo) => todo.id === editingId) : null;
      setStatus(editingId ? "Updating task..." : "Adding task...");
      const isDaily = formData.get("daily") === "on" || formData.get("lane") === "daily";
      const dueDate = normalizeIsoDateInput(String(formData.get("dueDate") || "").trim()) || null;
      const requestedLane = inferStartingLane(String(formData.get("lane") || ""), dueDate, isDaily);
      const selectedProject = selectedTaskProject();
      const payload = await api(editingId ? `/todos/${editingId}` : "/todos", {
        method: editingId ? "PUT" : "POST",
        body: serializeTodoForApi({
          title: String(formData.get("title") || "").trim(),
          details: String(formData.get("details") || "").trim(),
          projectId: selectedProject.id,
          projectTitle: selectedProject.title,
          subtasks: currentTaskSubtasks(editingId),
          dueDate,
          lane: requestedLane,
          priority: String(formData.get("priority") || "medium"),
          done: editingId ? currentTaskDone(editingId) : false,
          daily: isDaily,
          dailyCompletedOn: editingId ? currentTaskDailyMeta(editingId).dailyCompletedOn : null,
          streak: editingId ? currentTaskDailyMeta(editingId).streak : 0,
          dailyResetAfterDays: isDaily ? normalizeDailyResetAfterDays(formData.get("dailyResetAfterDays")) : DEFAULT_DAILY_RESET_AFTER_DAYS,
          updatedAt: editingTodo?.updatedAt || "",
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
      todoDailyResetInput.value = String(DEFAULT_DAILY_RESET_AFTER_DAYS);
      syncTaskDailyResetControls();
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
      const editingPlan = editingId ? state.plans.find((plan) => plan.id === editingId) : null;
      setStatus(editingId ? "Updating plan..." : "Adding plan...");
      const payload = await api(editingId ? `/plans/${editingId}` : "/plans", {
        method: editingId ? "PUT" : "POST",
        body: {
          planDate: normalizeIsoDateInput(planDateInput.value || state.selectedDate) || state.selectedDate,
          timeLabel: String(formData.get("timeLabel") || "").trim(),
          title: String(formData.get("title") || "").trim(),
          details: String(formData.get("details") || "").trim(),
          expectedUpdatedAt: editingPlan?.updatedAt || null,
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
      const editingItem = editingId ? state.portfolioItems.find((item) => item.id === editingId) : null;
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
          expectedUpdatedAt: editingItem?.updatedAt || null,
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
      const dragged = state.todos.find((entry) => entry.id === dragTodoId);
      if (dragged?.daily && lane !== "done") {
        return;
      }
      if (lane === "done" && todoCompletionBlocked(dragged)) {
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
      if (dragged.daily && lane !== "done") {
        setStatus("Daily tasks can only be moved to Completed.", true);
        dragTodoId = "";
        dragCardPosition = "after";
        return;
      }
      if (lane === "done" && todoCompletionBlocked(dragged)) {
        setStatus("Complete every subtask before completing this task.", true);
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
      patch.dailyResetAfterDays = normalizeDailyResetAfterDays(detailDailyResetInput.value);
      detailLaneInput.value = "today";
    }
    syncDetailDailyResetControls(patch.daily ?? state.detailDraft?.daily);
    updateDetailDraft(patch);
  });
  detailDailyResetInput.addEventListener("change", () => {
    updateDetailDraft({ dailyResetAfterDays: normalizeDailyResetAfterDays(detailDailyResetInput.value) });
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
  if (undoToastDismiss) {
    undoToastDismiss.addEventListener("click", () => {
      finalizePendingUndo(false);
    });
  }
  if (commandPaletteButton) {
    commandPaletteButton.addEventListener("click", () => {
      openCommandPalette();
    });
  }
  if (commandPaletteCloseKbd) {
    commandPaletteCloseKbd.addEventListener("click", () => {
      closeCommandPalette();
    });
  }
  if (commandPaletteModal) {
    commandPaletteModal.addEventListener("click", (event) => {
      if (event.target === commandPaletteModal || event.target.classList.contains("command-palette-backdrop")) {
        closeCommandPalette();
      }
    });
  }
  if (commandPaletteInput) {
    commandPaletteInput.addEventListener("input", () => {
      renderCommandPaletteResults(commandPaletteInput.value.trim());
    });
  }
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
    const shouldPrefillDate = !options.noDate && state.activeView === "calendar" && state.selectedDate;
    todoDueDateInput.value = options.dueDate || (shouldPrefillDate ? state.selectedDate : "");
    todoLaneInput.value = options.lane || "";
    todoDailyInput.checked = false;
    todoDailyResetInput.value = String(DEFAULT_DAILY_RESET_AFTER_DAYS);
    syncTaskDailyResetControls();
    if (options.projectId || options.projectTitle) {
      renderTaskProjectOptions(options.projectId || options.projectTitle);
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
      setStatus("");
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
    setStatus("");
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
  dailyMaintenanceIds.clear();
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
  const maintainedTodos = hydratedTodos.map((todo) => {
    if (state.detailDirty && state.detailTaskId === todo.id) return todo;
    return resetMissedDailyStreak(resetDailySubtasksForToday(todo));
  });
  const dailyMaintenance = maintainedTodos.filter((todo, index) => todo !== hydratedTodos[index]);
  state.todos = maintainedTodos;
  persistDailyMaintenance(dailyMaintenance);
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
  const completedCount = state.todos.filter((todo) => !todo.daily && Boolean(todo.done)).length;
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
    detailDailyResetInput.value = String(DEFAULT_DAILY_RESET_AFTER_DAYS);
    syncDetailDailyResetControls(false);
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
  detailDailyResetInput.value = String(normalizeDailyResetAfterDays(draft.dailyResetAfterDays));
  syncDetailDailyResetControls(draft.daily);
  syncTaskDetailChrome(draft);
  renderDetailSubtasks(draft.subtasks || []);
}

function syncTaskDetailChrome(draft = state.detailDraft || currentDetailTodo()) {
  if (PLANBOARD_COMPOSER.syncTaskDetailChrome) {
    PLANBOARD_COMPOSER.syncTaskDetailChrome({
      draft,
      state,
      dom: {
        detailHeading,
        detailSaveState,
        toggleTaskDoneButton,
      },
    });
    const completionBlocked = todoCompletionBlocked(draft);
    toggleTaskDoneButton.disabled = completionBlocked && !draft.done;
    toggleTaskDoneButton.title = completionBlocked ? "Complete every subtask first" : "";
    return;
  }
  if (!draft) {
    detailHeading.textContent = "Task details";
    detailSaveState.textContent = "Pick a task to inspect and edit.";
    return;
  }
  detailHeading.textContent = draft.title || "Task details";
  toggleTaskDoneButton.textContent = draft.daily ? "Complete Today" : draft.done ? "Mark Active" : "Mark Done";
  const completionBlocked = todoCompletionBlocked(draft);
  toggleTaskDoneButton.disabled = completionBlocked && !draft.done;
  toggleTaskDoneButton.title = completionBlocked ? "Complete every subtask first" : "";
  detailSaveState.textContent = state.detailSaving
    ? "Saving changes..."
    : state.detailDirty
      ? "Unsaved changes..."
      : "Saved";
}

function renderDetailSubtasks(subtasks) {
  if (PLANBOARD_COMPOSER.renderDetailSubtasks) {
    PLANBOARD_COMPOSER.renderDetailSubtasks({
      subtasks,
      state,
      dom: {
        detailSubtaskList,
        detailSubtaskMeta,
        toggleCompletedSubtasksButton,
      },
      onUpdateSubtask: (subtaskId, updates) => updateDetailSubtask(subtaskId, updates),
      onRemoveSubtask: (subtaskId) => removeDetailSubtask(subtaskId),
    });
    return;
  }
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

    const toggleField = document.createElement("label");
    toggleField.className = "subtask-item__check";

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.className = "subtask-item__toggle";
    toggle.checked = Boolean(subtask.done);
    toggle.setAttribute("aria-label", `Mark subtask ${subtask.text} as ${subtask.done ? "active" : "complete"}`);
    toggle.addEventListener("change", () => {
      updateDetailSubtask(subtask.id, { done: toggle.checked });
    });

    const toggleVisual = document.createElement("span");
    toggleVisual.className = "subtask-item__box";
    toggleVisual.setAttribute("aria-hidden", "true");
    toggleField.append(toggle, toggleVisual);

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

    item.append(toggleField, text, remove);
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
  if (PLANBOARD_COMPOSER.renderUndoToast) {
    PLANBOARD_COMPOSER.renderUndoToast({ state, dom: { undoToast, undoToastLabel, undoToastProgress } });
    return;
  }
  const isOpen = Boolean(state.undoAction);
  undoToast.classList.toggle("undo-toast--hidden", !isOpen);
  if (!isOpen) {
    undoToastLabel.textContent = "";
    if (undoToastProgress) undoToastProgress.classList.remove("is-running");
    return;
  }
  undoToastLabel.textContent = state.undoAction.label;
  if (undoToastProgress) {
    undoToastProgress.style.setProperty("--undo-duration", `${Number(state.undoAction.durationMs || 5000)}ms`);
    undoToastProgress.classList.remove("is-running");
    void undoToastProgress.offsetWidth;
    undoToastProgress.classList.add("is-running");
  }
}

function renderTaskActionSheet() {
  if (PLANBOARD_COMPOSER.renderTaskActionSheet) {
    PLANBOARD_COMPOSER.renderTaskActionSheet({
      state,
      dom: { taskActionOverlay, taskActionTitle, taskActionMoveList },
      utils: { BOARD_LANES, boardLane, laneLabel, todoCompletionBlocked },
      onClose: () => closeTaskActionSheet(),
      onMoveLane: (todoId, lane) => moveTodoToBoardLane(todoId, lane),
    });
    return;
  }
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
    button.disabled = boardLane(todo) === lane || (lane === "daily" && !todo.daily) || (lane === "done" && todoCompletionBlocked(todo));
    if (lane === "done" && todoCompletionBlocked(todo)) {
      button.title = "Complete every subtask first";
    }
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
  const isCalendar = state.activeView === "calendar";
  const isPortfolio = state.activeView === "portfolio";
  appShell.dataset.activeView = isCalendar ? "calendar" : isPortfolio ? "portfolio" : "board";
  boardTitle.textContent = isPortfolio ? "Portfolio" : isCalendar ? "Calendar" : "Board";
  const composerLabel = isPortfolio ? "+ Add Portfolio" : isCalendar ? "+ Add Plan" : "+ Add Task";
  openComposerButton.innerHTML = `${composerLabel} <kbd class="kbd-badge" title="Hotkey: C">C</kbd>`;
  boardViewButton.classList.toggle("is-active", !isCalendar && !isPortfolio);
  calendarViewButton.classList.toggle("is-active", isCalendar);
  portfolioViewButton.classList.toggle("is-active", isPortfolio);
  boardView.classList.toggle("board-view--hidden", isCalendar || isPortfolio);
  calendarView.classList.toggle("board-view--hidden", !isCalendar);
  portfolioView.classList.toggle("board-view--hidden", !isPortfolio);
  clearCompletedButton.hidden = isPortfolio || isCalendar || !state.todos.some((todo) => !todo.daily && Boolean(todo.done));
}

function renderSidebarState() {
  appShell.classList.toggle("sidebar-collapsed", Boolean(state.sidebarCollapsed));
  sidebarToggleButton.setAttribute("aria-label", state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar");
  sidebarToggleButton.setAttribute("title", state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar");
}

function updateThemeToggleButtons(theme) {
  const isLight = theme === "light";
  if (themeToggleButton) {
    themeToggleButton.setAttribute("aria-label", isLight ? "Switch to Dark theme (Shift+T)" : "Switch to Light theme (Shift+T)");
    themeToggleButton.setAttribute("title", isLight ? "Switch to Dark theme (Shift+T)" : "Switch to Light theme (Shift+T)");
    const iconSpan = themeToggleButton.querySelector(".theme-toggle-icon");
    if (iconSpan) {
      iconSpan.textContent = isLight ? "🌙" : "☀️";
    }
  }
  if (sidebarThemeToggle) {
    sidebarThemeToggle.textContent = isLight ? "Switch to Dark Mode" : "Switch to Light Mode";
  }
}

function applyTheme(targetTheme) {
  const current = targetTheme || (state && state.theme) || localStorage.getItem(DEFAULT_THEME_KEY) || DEFAULT_THEME;
  const theme = THEMES.includes(current) ? current : DEFAULT_THEME;
  if (state) {
    state.theme = theme;
  }
  localStorage.setItem(DEFAULT_THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", theme === "light" ? "#f8fafc" : "#111727");
  }
  updateThemeToggleButtons(theme);
}

function toggleTheme() {
  const currentTheme = (state && state.theme) || document.documentElement.dataset.theme || "aurora";
  const nextTheme = currentTheme === "light" ? "aurora" : "light";
  applyTheme(nextTheme);
  saveUiState();
}

function updateZoomLabels(scale) {
  const percentText = `${Math.round(scale * 100)}%`;
  if (zoomResetButton) {
    zoomResetButton.textContent = percentText;
    zoomResetButton.setAttribute("aria-label", `Reset zoom to 100% (currently ${percentText})`);
    zoomResetButton.setAttribute("title", `Reset zoom to 100% (Ctrl + 0) — Current: ${percentText}`);
  }
  if (sidebarZoomResetButton) {
    sidebarZoomResetButton.textContent = percentText;
    sidebarZoomResetButton.setAttribute("aria-label", `Reset zoom to 100% (currently ${percentText})`);
  }
  const isMin = scale <= ZOOM_LEVELS[0] + 0.005;
  const isMax = scale >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1] - 0.005;
  if (zoomOutButton) {
    zoomOutButton.disabled = isMin;
  }
  if (sidebarZoomOutButton) {
    sidebarZoomOutButton.disabled = isMin;
  }
  if (zoomInButton) {
    zoomInButton.disabled = isMax;
  }
  if (sidebarZoomInButton) {
    sidebarZoomInButton.disabled = isMax;
  }
}

function applyUiScale(targetScale) {
  const current = Number.isFinite(targetScale)
    ? targetScale
    : (state && Number.isFinite(state.uiScale))
      ? state.uiScale
      : parseFloat(localStorage.getItem(UI_SCALE_KEY)) || DEFAULT_UI_SCALE;
  const clamped = Math.min(Math.max(current, ZOOM_LEVELS[0]), ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
  const scale = Math.round(clamped * 100) / 100;
  if (state) {
    state.uiScale = scale;
  }
  localStorage.setItem(UI_SCALE_KEY, String(scale));
  document.documentElement.style.setProperty("--ui-scale", String(scale));
  updateZoomLabels(scale);
}

function zoomIn() {
  const current = (state && Number.isFinite(state.uiScale)) ? state.uiScale : DEFAULT_UI_SCALE;
  const next = ZOOM_LEVELS.find((lvl) => lvl > current + 0.01);
  if (next !== undefined) {
    applyUiScale(next);
    saveUiState();
  }
}

function zoomOut() {
  const current = (state && Number.isFinite(state.uiScale)) ? state.uiScale : DEFAULT_UI_SCALE;
  const prev = [...ZOOM_LEVELS].reverse().find((lvl) => lvl < current - 0.01);
  if (prev !== undefined) {
    applyUiScale(prev);
    saveUiState();
  }
}

function resetZoom() {
  applyUiScale(DEFAULT_UI_SCALE);
  saveUiState();
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
  if (PLANBOARD_BOARD.renderFilterState) {
    PLANBOARD_BOARD.renderFilterState(visibleCount, state.todos.length, state.filterMode, filterStateLabel);
    return;
  }
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
    ? `Showing ${visibleCount} of ${totalCount} tasks - ${parts.join(" - ")}`
    : `${visibleCount} task${visibleCount === 1 ? "" : "s"} visible`;
}

function renderLaneEmpty(lane) {
  if (PLANBOARD_BOARD.renderLaneEmpty) {
    return PLANBOARD_BOARD.renderLaneEmpty(lane);
  }
  const empty = document.createElement("div");
  empty.className = "lane-empty";

  const text = document.createElement("p");
  text.textContent = emptyTextForLane(lane);
  empty.appendChild(text);
  return empty;
}

function renderBoard() {
  if (PLANBOARD_BOARD.renderBoard) {
    PLANBOARD_BOARD.renderBoard({
      state,
      dom: {
        laneTargets,
        laneCountTargets,
        allTaskCountHeader,
        filterStateLabel,
        filterButtons,
      },
      utils: {
        filteredTodos,
        isTodoEffectivelyDone,
        normalizeLane,
        updateFilterButtons,
        compareDueDate,
        comparePriority,
        compareCreatedDesc,
        compareManualOrder,
      },
      onRenderTodoCard: (todo) => renderTodoCard(todo),
      onRenderProjectCard: (group) => renderBoardProjectCard(group),
    });
    return;
  }
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
  if (todos.length && todos.every(isTodoEffectivelyDone)) {
    return "done";
  }
  if (todos.length && todos.every((todo) => todo.daily)) {
    return "daily";
  }
  if (todos.some((todo) => todo.dueDate || ["month", "week", "today"].includes(normalizeLane(todo)))) {
    return "month";
  }
  return "ideas";
}

function taskCompletionUnits(todo) {
  const subtasks = Array.isArray(todo?.subtasks) ? todo.subtasks : [];
  if (subtasks.length) {
    const done = todo.done ? subtasks.length : subtasks.filter((subtask) => Boolean(subtask.done)).length;
    return { total: subtasks.length, done };
  }
  return { total: 1, done: isTodoEffectivelyDone(todo) ? 1 : 0 };
}

function projectCompletionForTodos(todos) {
  const totals = (todos || []).reduce(
    (summary, todo) => {
      const units = taskCompletionUnits(todo);
      summary.total += units.total;
      summary.done += units.done;
      return summary;
    },
    { total: 0, done: 0 }
  );
  return {
    ...totals,
    complete: (todos || []).length > 0 && (todos || []).every(isTodoEffectivelyDone),
  };
}

function isTodoEffectivelyDone(todo) {
  if (!todo) return false;
  if (todo.daily) return isDailyCompletedToday(todo);
  return Boolean(todo.done);
}

function todoSubtasksComplete(todo) {
  const subtasks = Array.isArray(todo?.subtasks) ? todo.subtasks : [];
  return subtasks.length > 0 && subtasks.every((subtask) => Boolean(subtask.done));
}

function todoCompletionBlocked(todo) {
  if (PLANBOARD_DOMAIN.todoCompletionBlocked) {
    return PLANBOARD_DOMAIN.todoCompletionBlocked(todo);
  }
  const subtasks = Array.isArray(todo?.subtasks) ? todo.subtasks : [];
  return subtasks.length > 0 && !subtasks.every((subtask) => Boolean(subtask.done));
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
  if (todo.dueDate || ["month", "week", "today"].includes(normalizeLane(todo))) {
    return "month";
  }
  return "ideas";
}

function boardTaskTitle(todo) {
  return todo.projectTitle || todo.title;
}

function boardTaskDetails(todo) {
  if (todo.projectTitle) {
    return [todo.title, todo.details].filter(Boolean).join(" - ");
  }
  return todo.details || "";
}

function taskProjectItems() {
  const projects = new Map();
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

function selectedTaskProject() {
  const option = todoProjectInput.selectedOptions[0];
  if (!option || !option.value) {
    return { id: "", title: "" };
  }
  return {
    id: String(option.dataset.projectId || "").trim(),
    title: String(option.dataset.projectTitle || option.textContent || "").trim(),
  };
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
  taskProjectItems().forEach((project) => {
    const option = document.createElement("option");
    option.value = projectKey(project);
    option.dataset.projectId = project.id && !String(project.id).startsWith("derived-") ? project.id : "";
    option.dataset.projectTitle = project.title;
    option.textContent = project.title;
    todoProjectInput.appendChild(option);
  });
  const selectedText = String(selected || "").trim();
  const selectedOption = [...todoProjectInput.options].find((option) =>
    option.value === selectedText
    || option.dataset.projectId === selectedText
    || option.dataset.projectTitle === selectedText
  );
  todoProjectInput.value = selectedOption?.value || "";
}

function showResetAllModal() {
  return new Promise((resolve) => {
    let overlay = document.querySelector("#resetAllOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "resetAllOverlay";
      overlay.className = "modal-overlay modal-overlay--hidden";
      document.body.appendChild(overlay);
    }
    overlay.classList.remove("modal-overlay--hidden");
    overlay.setAttribute("aria-hidden", "false");
    overlay.innerHTML = `
      <section class="confirm-modal reset-all-modal" role="dialog" aria-modal="true" aria-label="Reset all data">
        <p class="eyebrow">Danger zone</p>
        <h2>Reset all data?</h2>
        <p>This deletes tasks, calendar plans, notes, portfolio items, and notifications for this account. This cannot be undone.</p>
        <div class="confirm-modal__actions">
          <button type="button" class="btn danger" data-action="reset">Reset all data</button>
          <button type="button" class="btn ghost" data-action="cancel">Cancel</button>
        </div>
      </section>
    `;
    const close = (value) => {
      overlay.classList.add("modal-overlay--hidden");
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

function renderCalendar() {
  if (PLANBOARD_CALENDAR.renderCalendar) {
    PLANBOARD_CALENDAR.renderCalendar({
      state,
      dom: {
        calendarMonthSelect,
        calendarYearLabel,
        calendarMonthHeading,
        calendarGrid,
        calendarSelectedDateLabel,
        calendarSelectedDateMeta,
        calendarTimelineList,
      },
      utils: {
        ...PLANNER_UTILS,
        ...PLANBOARD_DOMAIN,
        dayFormatter: DAY_FORMATTER,
        deadlineTodosByDate,
        sortDeadlineTodos,
        weekStart,
        dateToLocalIso,
        todayIso,
        groupingLane,
      },
      onSelectDate: (iso) => {
        state.selectedDate = iso;
        saveUiState();
        render();
      },
      onOpenTaskDetail: (todoId) => {
        openTaskDetail(todoId);
      },
    });
    return;
  }
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

function moveTodoToDate(todoId, targetDate) {
  return enqueueTodoMutation(todoId, () => moveTodoToDateNow(todoId, targetDate));
}

async function moveTodoToDateNow(todoId, targetDate) {
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
  if (PLANBOARD_CALENDAR.renderCalendarTimeline) {
    PLANBOARD_CALENDAR.renderCalendarTimeline({
      selectedDate: state.selectedDate,
      todos,
      dom: {
        calendarSelectedDateLabel,
        calendarSelectedDateMeta,
        calendarTimelineList,
      },
      utils: {
        dayFormatter: DAY_FORMATTER,
        sortDeadlineTodos,
        laneLabel,
        groupingLane,
      },
      onOpenTaskDetail: (todoId) => {
        openTaskDetail(todoId);
      },
    });
    return;
  }
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
  if (PLANBOARD_PORTFOLIO.renderPortfolio) {
    PLANBOARD_PORTFOLIO.renderPortfolio({
      state,
      dom: {
        portfolioYearFilter,
        portfolioSearchInput,
        portfolioCertFilter,
        portfolioFilterButtons,
        allTaskCountHeader,
        completedMeta,
        portfolioPlannedList,
        portfolioActiveList,
        portfolioCompletedList,
        portfolioItemTemplate,
      },
      utils: {
        ...PORTFOLIO_UTILS,
        shortDateFormatter: SHORT_DATE_FORMATTER,
        todayIso,
      },
      onOpenDetail: (itemId) => {
        openPortfolioDetail(itemId);
      },
      onDragStart: (itemId) => {
        dragPortfolioItemId = itemId;
      },
      onDragEnd: () => {
        dragPortfolioItemId = "";
      },
    });
    return;
  }
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
  if (PLANBOARD_PORTFOLIO.portfolioDateRange) {
    return PLANBOARD_PORTFOLIO.portfolioDateRange(item, SHORT_DATE_FORMATTER);
  }
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
  if (PLANBOARD_PORTFOLIO.renderPortfolioDetail) {
    PLANBOARD_PORTFOLIO.renderPortfolioDetail(item, {
      portfolioDetailOverlay,
      portfolioDetailPanel,
      portfolioDetailType,
      portfolioDetailTitle,
      portfolioDetailMeta,
      portfolioDetailStatus,
      portfolioDetailDates,
      portfolioDetailRole,
      portfolioDetailTeammates,
      portfolioDetailCert,
      portfolioDetailAchievement,
      portfolioDetailAchievementBlock,
      portfolioDetailLinks,
      portfolioDetailLinksBlock,
      portfolioDetailNotes,
      portfolioDetailNotesBlock,
    }, {
      shortDateFormatter: SHORT_DATE_FORMATTER,
      todayIso,
    });
    return;
  }
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
  if (PLANBOARD_PORTFOLIO.renderPortfolioLinks) {
    PLANBOARD_PORTFOLIO.renderPortfolioLinks(target, rawLinks);
    return;
  }
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
  if (PLANBOARD_PORTFOLIO.portfolioStatusLabel) {
    return PLANBOARD_PORTFOLIO.portfolioStatusLabel(status);
  }
  return {
    planned: "Planned",
    active: "Active",
    completed: "Completed",
  }[status] || "Active";
}

function inferPortfolioStatus(startDate, endDate, today = todayIso()) {
  if (PLANBOARD_PORTFOLIO.inferPortfolioStatus) {
    return PLANBOARD_PORTFOLIO.inferPortfolioStatus(startDate, endDate, today);
  }
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
  if (PLANBOARD_PORTFOLIO.portfolioEffectiveStatus) {
    return PLANBOARD_PORTFOLIO.portfolioEffectiveStatus(item, todayIso());
  }
  if (item && item.statusMode === "auto") {
    return inferPortfolioStatus(item.startDate, item.endDate);
  }
  return ["planned", "active", "completed"].includes(item && item.status) ? item.status : "active";
}

function withPortfolioEffectiveStatus(item) {
  if (PLANBOARD_PORTFOLIO.withPortfolioEffectiveStatus) {
    return PLANBOARD_PORTFOLIO.withPortfolioEffectiveStatus(item, todayIso());
  }
  if (!item) {
    return item;
  }
  const status = portfolioEffectiveStatus(item);
  return status === item.status ? item : { ...item, status };
}

function portfolioTypeLabel(type) {
  if (PLANBOARD_PORTFOLIO.portfolioTypeLabel) {
    return PLANBOARD_PORTFOLIO.portfolioTypeLabel(type);
  }
  return {
    competition: "Competition",
    course: "Course",
    project: "Project",
  }[type] || "Project";
}

function renderPlans() {
  const plans = plansForDate(state.selectedDate);
  if (PLANBOARD_CALENDAR.renderPlans) {
    PLANBOARD_CALENDAR.renderPlans({
      plans,
      dom: {
        planList,
        planItemTemplate,
      },
      onOpenPlanEditor: (plan) => {
        openPlanEditor(plan);
      },
      onDeletePlan: (planId) => {
        queuePlanDeleteUndo(planId);
      },
    });
    return;
  }
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
  const subtaskList = fragment.querySelector(".task-card__subtask-list");
  const subtaskListToggle = fragment.querySelector(".task-card__subtask-toggle-list");
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
  card.classList.toggle("is-overdue", Boolean(!todo.daily && !taskDone && todo.dueDate && todo.dueDate < todayIso()));
  card.classList.toggle("is-due-today", Boolean(!todo.daily && !taskDone && todo.dueDate === todayIso()));
  card.classList.toggle("is-draggable", canDragTodo(todo));
  card.draggable = canDragTodo(todo);
  checkbox.checked = taskDone;
  title.textContent = boardTaskTitle(todo);
  details.textContent = boardTaskDetails(todo);
  due.textContent = todo.daily ? "Daily" : todo.dueDate ? SHORT_DATE_FORMATTER.format(new Date(`${todo.dueDate}T00:00:00`)) : "";
  const subtaskCount = (todo.subtasks || []).length;
  const doneSubtasks = (todo.subtasks || []).filter((item) => item.done).length;
  const completionBlocked = todoCompletionBlocked(todo);
  const readyToComplete = subtaskCount > 0 && doneSubtasks === subtaskCount && !taskDone;
  subtaskMeta.textContent = subtaskCount
    ? `${doneSubtasks}/${subtaskCount} subtasks${readyToComplete ? " · Ready to complete" : ""}`
    : "";
  subtaskMeta.classList.toggle("is-ready", readyToComplete);
  checkbox.disabled = completionBlocked && !taskDone;
  checkbox.title = completionBlocked ? "Complete every subtask first" : "";
  card.classList.toggle("has-subtasks", subtaskCount > 0);
  card.classList.toggle("is-completion-locked", completionBlocked);
  renderTodoCardSubtasks(subtaskList, subtaskListToggle, todo, taskDone);
  const momentum = Number(todo.streak || 0);
  if (todo.daily && momentum > 0) {
    const countdown = dailyResetCountdownText(todo);
    streak.textContent = countdown && countdown !== "never resets" && countdown !== "not started"
      ? `🔥 ${momentum}d · ${countdown}`
      : `🔥 ${momentum}d streak`;
    streak.title = dailyMomentumLabel(todo);
  } else {
    streak.textContent = "";
    streak.title = todo.daily ? "Daily routine" : "";
  }
  priority.textContent = todo.priority || "";
  priority.className = "task-card__priority";
  if (todo.priority) {
    priority.classList.add(`priority-${todo.priority}`);
  }

  const quickTodayBtn = fragment.querySelector(".task-card__quick-btn--today");
  const quickEditBtn = fragment.querySelector(".task-card__quick-btn--edit");
  const quickDeleteBtn = fragment.querySelector(".task-card__quick-btn--delete");

  if (quickTodayBtn) {
    if (todo.daily) {
      quickTodayBtn.style.display = "none";
    } else {
      const isDueToday = todo.dueDate === todayIso();
      quickTodayBtn.title = isDueToday ? "Bỏ deadline hôm nay" : "Đặt deadline hôm nay";
      quickTodayBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        event.preventDefault();
        const nextDue = isDueToday ? "" : todayIso();
        await saveTodoPatch(
          todo.id,
          { dueDate: nextDue },
          nextDue ? `Đã đặt deadline: Hôm nay (${todo.title})` : `Đã bỏ deadline (${todo.title})`
        );
      });
    }
  }

  if (quickEditBtn) {
    quickEditBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      openTaskDetail(todo.id);
    });
  }

  if (quickDeleteBtn) {
    quickDeleteBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      event.preventDefault();
      await deleteTodo(todo.id);
    });
  }

  card.addEventListener("dragstart", (event) => {
    if (event.target instanceof Element && event.target.closest(".task-card__subtask-list")) {
      event.preventDefault();
      return;
    }
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
    if (dragged.daily && !targetDone) {
      return;
    }
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
    if (dragged.daily) {
      if (targetDone) {
        await moveTodoToBoardLane(dragTodoId, "done");
      } else {
        setStatus("Daily tasks can only be moved to Completed.", true);
      }
    } else if (groupingLane(todo) !== "done" && !draggedDone && !targetDone && canManualReorder()) {
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

function renderCardSubtasks(target, toggleButton, entries, expansionKey, taskDone) {
  if (!target) return;
  target.innerHTML = "";
  const allEntries = entries || [];
  const completedEntries = allEntries.filter((entry) => Boolean(entry.subtask.done));
  const pendingEntries = allEntries.filter((entry) => !entry.subtask.done);
  const expanded = expandedBoardSubtasks.has(expansionKey);
  const visibleEntries = expanded ? [...pendingEntries, ...completedEntries] : pendingEntries;
  target.hidden = taskDone || allEntries.length === 0;

  if (toggleButton) {
    toggleButton.hidden = target.hidden || completedEntries.length === 0;
    toggleButton.textContent = expanded
      ? "Hide completed subtasks"
      : `Show ${completedEntries.length} completed`;
    toggleButton.setAttribute("aria-expanded", String(expanded));
    toggleButton.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (expandedBoardSubtasks.has(expansionKey)) {
        expandedBoardSubtasks.delete(expansionKey);
      } else {
        expandedBoardSubtasks.add(expansionKey);
      }
      renderBoard();
    };
  }
  if (target.hidden) return;

  visibleEntries.forEach(({ todo, subtask, showParent }) => {
    const item = document.createElement("li");
    item.className = "task-card__subtask-item";
    item.classList.toggle("is-done", Boolean(subtask.done));

    const label = document.createElement("label");
    label.className = "task-card__subtask-label";

    const toggleControl = document.createElement("span");
    toggleControl.className = "task-card__subtask-control";

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.className = "task-card__subtask-toggle";
    toggle.checked = Boolean(subtask.done);
    toggle.setAttribute("aria-label", `Mark subtask ${subtask.text} as ${subtask.done ? "active" : "complete"}`);
    toggle.addEventListener("change", async (event) => {
      event.stopPropagation();
      await updateTodoCardSubtask(todo, subtask.id, toggle.checked);
    });

    const toggleVisual = document.createElement("span");
    toggleVisual.className = "task-card__subtask-box";
    toggleVisual.setAttribute("aria-hidden", "true");
    toggleControl.append(toggle, toggleVisual);

    const text = document.createElement("span");
    text.className = "task-card__subtask-text";
    if (showParent) {
      const parent = document.createElement("strong");
      parent.className = "task-card__subtask-parent";
      parent.textContent = todo.title;
      text.append(parent, document.createTextNode(subtask.text));
    } else {
      text.textContent = subtask.text;
    }

    label.append(toggleControl, text);
    item.appendChild(label);
    target.appendChild(item);
  });
}

function renderTodoCardSubtasks(target, toggleButton, todo, taskDone) {
  const subtasks = Array.isArray(todo?.subtasks) ? todo.subtasks : [];
  renderCardSubtasks(
    target,
    toggleButton,
    subtasks.map((subtask) => ({ todo, subtask, showParent: false })),
    `todo:${todo.id}`,
    taskDone
  );
}

async function updateTodoCardSubtask(todo, subtaskId, nextDone) {
  if (!todo?.id) return false;
  return enqueueTodoMutation(todo.id, async () => {
    const current = state.todos.find((entry) => entry.id === todo.id);
    if (!current) return false;
    const subtasks = Array.isArray(current.subtasks) ? current.subtasks : [];
    const previousSubtasks = subtasks.map((entry) => ({ ...entry }));
    const previousDone = Boolean(current.done);
    const previousDailyCompletedOn = current.dailyCompletedOn || null;
    const changedSubtask = subtasks.find((entry) => entry.id === subtaskId);
    if (!changedSubtask || Boolean(changedSubtask.done) === Boolean(nextDone)) return true;
    const nextSubtasks = subtasks.map((entry) => entry.id === subtaskId
      ? {
        ...entry,
        done: nextDone,
        ...(current.daily ? { completedOn: nextDone ? todayIso() : null } : {}),
      }
      : { ...entry });
    const nextTodo = syncDraftDoneFromSubtasks({ ...current, subtasks: nextSubtasks });
    const saved = await saveTodoPatchNow(
      current.id,
      {
        subtasks: nextSubtasks,
        done: Boolean(nextTodo.done),
        dailyCompletedOn: nextTodo.dailyCompletedOn || null,
      },
      nextDone ? "Subtask completed." : "Subtask reopened."
    );
    if (!saved) return false;
    setUndoAction({
      label: nextDone
        ? `Completed subtask "${changedSubtask.text || "Subtask"}"`
        : `Reopened subtask "${changedSubtask.text || "Subtask"}"`,
      durationMs: 10000,
      rollback: async () => {
        await saveTodoPatch(
          current.id,
          {
            subtasks: previousSubtasks,
            done: previousDone,
            dailyCompletedOn: previousDailyCompletedOn,
          },
          "Subtask change undone."
        );
      },
      commit: async () => Promise.resolve(),
    });
    return true;
  });
}

function renderBoardProjectSubtasks(target, toggleButton, todos, projectDone, projectKeyValue) {
  const taskEntries = (todos || []).filter((todo) => Array.isArray(todo.subtasks) && todo.subtasks.length > 0);
  const showTaskTitle = taskEntries.length > 1 || (todos || []).length > 1;
  const entries = taskEntries.flatMap((todo) =>
    todo.subtasks.map((subtask) => ({ todo, subtask, showParent: showTaskTitle }))
  );
  renderCardSubtasks(target, toggleButton, entries, `project:${projectKeyValue}`, projectDone);
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
  const subtaskList = fragment.querySelector(".task-card__subtask-list");
  const subtaskListToggle = fragment.querySelector(".task-card__subtask-toggle-list");
  const streak = fragment.querySelector(".task-card__streak");
  const todos = group.todos || [];
  const completion = projectCompletionForTodos(todos);
  const completionBlocked = todos.some((todo) => todoCompletionBlocked(todo));
  const childTitles = [...new Set(todos.map((todo) => todo.title).filter(Boolean))];

  card.dataset.projectId = group.projectId || "";
  card.dataset.projectKey = group.key;
  card.classList.add("task-card--project");
  card.classList.toggle("is-done", completion.complete);
  card.classList.remove("is-draggable");
  card.draggable = false;
  checkbox.checked = completion.complete;
  checkbox.disabled = completionBlocked && !completion.complete;
  checkbox.title = completionBlocked ? "Complete every subtask first" : "";
  title.textContent = group.title || "Untitled project";
  details.textContent = childTitles.length
    ? `${childTitles.slice(0, 3).join(" - ")}${childTitles.length > 3 ? ` - +${childTitles.length - 3} more` : ""}`
    : "No tasks yet.";
  due.textContent = boardProjectLane(group) === "month" ? "This Month" : "";
  const readyToComplete = completion.total > 0 && completion.done === completion.total && !completion.complete;
  subtaskMeta.textContent = completion.total
    ? `${completion.done}/${completion.total} items${readyToComplete ? " · Ready to complete" : ""}`
    : "";
  subtaskMeta.classList.toggle("is-ready", readyToComplete);
  renderBoardProjectSubtasks(subtaskList, subtaskListToggle, todos, completion.complete, group.key);
  streak.textContent = "";
  priority.textContent = "PROJECT";
  priority.className = "task-card__priority priority-medium";

  checkbox.addEventListener("change", async () => {
    const success = await setProjectCompletion(
      todos.map((todo) => todo.id),
      checkbox.checked,
      group.title || "Project"
    );
    if (!success) {
      checkbox.checked = !checkbox.checked;
    }
  });

  const openProject = () => {
    if (todos[0]?.id) {
      openTaskDetail(todos[0].id);
    }
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

function projectCompletionUpdate(todo, expectedUpdatedAt = todo.updatedAt) {
  return {
    id: todo.id,
    done: Boolean(todo.done),
    dailyCompletedOn: todo.dailyCompletedOn || null,
    streak: Number(todo.streak || 0),
    expectedUpdatedAt: String(expectedUpdatedAt || "").trim() || null,
  };
}

async function persistProjectCompletion(nextTodos, expectedById) {
  const payload = await api("/todos/batch-completion", {
    method: "POST",
    body: {
      updates: nextTodos.map((todo) =>
        projectCompletionUpdate(todo, expectedById.get(todo.id)?.updatedAt)
      ),
    },
  });
  (payload.todos || []).map(hydrateTodoFromServer).forEach(updateTodo);
  state.lastSyncedAt = Date.now();
  render();
}

async function setProjectCompletion(todoIds, nextDone, projectTitle) {
  await Promise.all(todoIds.map((todoId) => (todoMutationQueues.get(todoId) || Promise.resolve()).catch(() => undefined)));
  const todos = todoIds.map((todoId) => state.todos.find((todo) => todo.id === todoId)).filter(Boolean);
  if (!todos.length) return false;
  if (nextDone && todos.some((todo) => todoCompletionBlocked(todo))) {
    setStatus("Complete every subtask before completing this project.", true);
    return false;
  }

  const previous = todos.map(cloneTodoDraft);
  const expectedById = new Map(previous.map((todo) => [todo.id, todo]));
  const optimistic = todos.map((todo) => {
    if (todo.daily) {
      return nextDone
        ? completeDailyTodo(todo)
        : { ...todo, dailyCompletedOn: null };
    }
    return { ...todo, done: nextDone };
  });
  optimistic.forEach(updateTodo);
  render();

  try {
    await persistProjectCompletion(optimistic, expectedById);
    setStatus(nextDone ? "Project completed." : "Project reopened.");
    setUndoAction({
      label: nextDone ? `Completed project "${projectTitle}"` : `Reopened project "${projectTitle}"`,
      durationMs: 10000,
      rollback: async () => {
        const currentById = new Map(
          previous.map((snapshot) => [snapshot.id, state.todos.find((todo) => todo.id === snapshot.id)])
        );
        previous.forEach(updateTodo);
        render();
        await persistProjectCompletion(previous, currentById);
        setStatus("Project completion undone.");
      },
      commit: async () => Promise.resolve(),
    });
    return true;
  } catch (error) {
    previous.forEach(updateTodo);
    render();
    setStatus(error.message || "Could not update project.", true);
    return false;
  }
}

function moveTodoToLane(todoId, targetLane) {
  return enqueueTodoMutation(todoId, () => moveTodoToLaneNow(todoId, targetLane));
}

async function moveTodoToLaneNow(todoId, targetLane) {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) {
    return;
  }
  if (targetLane === "done" && todoCompletionBlocked(todo)) {
    setStatus("Complete every subtask before completing this task.", true);
    return;
  }

  const previous = cloneTodoDraft(todo);
  const nextTodo = {
    ...todo,
    lane: targetLane === "done" ? todo.lane : targetLane,
    sortOrder: targetLane === "done" ? todo.sortOrder : nextLocalSortOrder(targetLane, todo.id),
    dueDate: targetLane === "ideas" ? null : todo.dueDate,
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
    if (targetLane === "done") {
      queueTodoSnapshotUndo(previous, `Completed "${todo.title || "Task"}"`);
    }
  } catch (error) {
    updateTodo(previous);
    if (state.detailTaskId === todo.id) {
      state.detailDraft = previous;
    }
    render();
    setStatus(error.message, true);
  }
}

function moveTodoToBoardLane(todoId, targetLane) {
  return enqueueTodoMutation(todoId, () => moveTodoToBoardLaneNow(todoId, targetLane));
}

async function moveTodoToBoardLaneNow(todoId, targetLane) {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo || !BOARD_LANES.includes(targetLane)) {
    return;
  }
  if (targetLane === "done" && todoCompletionBlocked(todo)) {
    setStatus("Complete every subtask before completing this task.", true);
    return;
  }
  if (todo.daily) {
    if (targetLane === "done") {
      await toggleTodoDoneNow(todoId, true);
    } else if (targetLane !== "daily") {
      setStatus("Daily tasks can only be moved to Completed.", true);
    }
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
    if (targetLane === "done") {
      queueTodoSnapshotUndo(previous, `Completed "${todo.title || "Task"}"`);
    }
  } catch (error) {
    updateTodo(previous);
    render();
    setStatus(error.message, true);
  }
}

async function reorderTodo(todoId, targetLane, targetTodoId = "", position = "after") {
  await Promise.all([...todoMutationQueues.values()].map((pending) => pending.catch(() => undefined)));
  const dragged = state.todos.find((entry) => entry.id === todoId);
  if (!dragged || !canManualReorder() || dragged.done || targetLane === "done") {
    return;
  }
  if (targetLane === "ideas" && dragged.dueDate) {
    return moveTodoToBoardLane(todoId, "ideas");
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
        expectedUpdatedAt: String(todo.updatedAt || "").trim() || null,
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
  return {
    ...todo,
    details: parsed.details,
    projectId: String(todo.projectId || parsed.projectId || "").trim(),
    projectTitle: String(todo.projectTitle || parsed.projectTitle || "").trim(),
    subtasks: Array.isArray(todo.subtasks)
      ? todo.subtasks
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          id: String(item.id || `sub-${Math.random().toString(36).slice(2, 8)}`),
          text: String(item.text || "").trim(),
          done: Boolean(item.done),
          completedOn: normalizeIsoDateInput(item.completedOn) || null,
        }))
        .filter((item) => item.text)
      : [],
    lane: todo.lane && LANES.includes(todo.lane) ? todo.lane : parsed.lane || inferLegacyLane(todo),
    sortOrder: Number.isFinite(Number(todo.sortOrder)) ? Number(todo.sortOrder) : 0,
    daily: Boolean(todo.daily),
    dailyCompletedOn: todo.dailyCompletedOn || null,
    streak: Number.isFinite(Number(todo.streak)) ? Number(todo.streak) : 0,
    dailyResetAfterDays: normalizeDailyResetAfterDays(todo.dailyResetAfterDays),
  };
}

function parseTodoDetails(rawDetails) {
  let details = String(rawDetails || "").trim();
  details = details.replace(LEGACY_WEEK_DAYS_PREFIX, "").trim();
  const laneMatch = details.match(LANE_PREFIX);
  const lane = laneMatch ? laneMatch[1].toLowerCase() : "";
  details = details.replace(LANE_PREFIX, "").trim();
  const projectIdMatch = details.match(PROJECT_ID_PREFIX);
  const projectId = projectIdMatch ? projectIdMatch[1].trim() : "";
  details = details.replace(PROJECT_ID_PREFIX, "").trim();
  const projectMatch = details.match(PROJECT_PREFIX);
  const projectTitle = projectMatch ? projectMatch[1].trim() : "";
  details = details.replace(PROJECT_PREFIX, "").trim();
  details = details.replace(MISSED_PREFIX, "").trim();
  return {
    lane,
    projectId,
    projectTitle,
    details,
  };
}

function serializeTodoForApi(todo) {
  return {
    title: todo.title,
    details: String(todo.details || "")
      .replace(LEGACY_WEEK_DAYS_PREFIX, "")
      .replace(LANE_PREFIX, "")
      .replace(PROJECT_ID_PREFIX, "")
      .replace(PROJECT_PREFIX, "")
      .replace(MISSED_PREFIX, "")
      .trim(),
    subtasks: (todo.subtasks || []).map((item) => ({
      id: item.id,
      text: String(item.text || "").trim(),
      done: Boolean(item.done),
      completedOn: normalizeIsoDateInput(item.completedOn) || null,
    })).filter((item) => item.text),
    dueDate: todo.dueDate || null,
    lane: normalizeLane(todo),
    sortOrder: Number.isFinite(Number(todo.sortOrder)) ? Number(todo.sortOrder) : 0,
    priority: todo.priority || "medium",
    done: Boolean(todo.daily) ? false : Boolean(todo.done),
    daily: Boolean(todo.daily),
    dailyCompletedOn: todo.dailyCompletedOn || null,
    streak: Number.isFinite(Number(todo.streak)) ? Number(todo.streak) : 0,
    dailyResetAfterDays: normalizeDailyResetAfterDays(todo.dailyResetAfterDays),
    projectId: String(todo.projectId || "").replace(/[\[\]]/g, "").trim(),
    projectTitle: String(todo.projectTitle || "").replace(/[\[\]]/g, "").trim(),
    expectedUpdatedAt: String(todo.updatedAt || "").trim() || null,
  };
}

function resetMissedDailyStreak(todo) {
  if (PLANBOARD_DOMAIN.resetMissedDailyStreak) {
    return PLANBOARD_DOMAIN.resetMissedDailyStreak(todo);
  }
  if (!todo || !todo.daily || Number(todo.streak || 0) <= 0) {
    return todo;
  }
  const resetAfterDays = normalizeDailyResetAfterDays(todo.dailyResetAfterDays);
  if (resetAfterDays === 0) return todo;
  const today = todayIso();
  if (daysBetweenIso(todo.dailyCompletedOn, today) <= resetAfterDays) {
    return todo;
  }
  return {
    ...todo,
    done: false,
    lane: "today",
    streak: 0,
  };
}

function resetDailySubtasksForToday(todo) {
  if (PLANBOARD_DOMAIN.resetDailySubtasksForToday) {
    return PLANBOARD_DOMAIN.resetDailySubtasksForToday(todo);
  }
  if (!todo?.daily || !Array.isArray(todo.subtasks)) return todo;
  const today = todayIso();
  let changed = false;
  const subtasks = todo.subtasks.map((subtask) => {
    const completedOn = normalizeIsoDateInput(subtask.completedOn);
    const nextDone = completedOn === today;
    if (Boolean(subtask.done) === nextDone && (subtask.completedOn || null) === (nextDone ? today : null)) {
      return subtask;
    }
    changed = true;
    return { ...subtask, done: nextDone, completedOn: nextDone ? today : null };
  });
  return changed ? { ...todo, subtasks } : todo;
}

async function persistDailyMaintenance(todos) {
  if (!state.token || !Array.isArray(todos) || !todos.length) {
    return;
  }
  const pending = todos.filter((todo) => todo && todo.id && !dailyMaintenanceIds.has(todo.id));
  if (!pending.length) {
    return;
  }
  pending.forEach((todo) => dailyMaintenanceIds.add(todo.id));
  try {
    const results = await Promise.allSettled(
      pending.map((todo) =>
        enqueueTodoMutation(todo.id, async () => {
          const payload = await api(`/todos/${todo.id}`, {
            method: "PUT",
            body: serializeTodoForApi(todo),
          });
          if (payload.todo) {
            updateTodo(hydrateTodoFromServer(payload.todo));
          }
          return payload;
        })
      )
    );
    if (results.every((result) => result.status === "fulfilled")) {
      state.lastSyncedAt = Date.now();
      render();
    }
  } finally {
    pending.forEach((todo) => dailyMaintenanceIds.delete(todo.id));
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
  if (PLANBOARD_CALENDAR.calendarMonthDates) {
    return PLANBOARD_CALENDAR.calendarMonthDates(year, month, weekStart);
  }
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
    dailyResetAfterDays: normalizeDailyResetAfterDays(todo?.dailyResetAfterDays),
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

async function openTaskDetail(todoId, options = {}) {
  if (!options.focusTitle && state.detailTaskId === todoId) {
    await closeTaskDetail();
    return;
  }
  if (state.detailTaskId && state.detailTaskId !== todoId) {
    const closed = await closeTaskDetail();
    if (!closed) return;
  }
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) {
    return;
  }
  state.detailTaskId = todo.id;
  state.detailDraft = cloneTodoDraft(todo);
  detailDraftRevision += 1;
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

async function closeTaskDetail(options = {}) {
  if (detailSaveTimerId) {
    window.clearTimeout(detailSaveTimerId);
    detailSaveTimerId = 0;
  }
  const closingTaskId = state.detailTaskId;
  if (!options.discard && closingTaskId && state.detailDirty) {
    const saved = await flushDetailSave();
    if (!saved && state.detailTaskId === closingTaskId) {
      renderTaskDetail();
      return false;
    }
  }
  if (closingTaskId && state.detailTaskId && state.detailTaskId !== closingTaskId) {
    return false;
  }
  state.detailTaskId = "";
  state.detailDraft = null;
  detailDraftRevision += 1;
  state.detailDirty = false;
  state.detailSaving = false;
  state.detailCompletedCollapsed = true;
  renderTaskDetail();
  renderBoard();
  return true;
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
  if (PLANBOARD_DOMAIN.reconcileTodoDoneWithSubtasks) {
    return PLANBOARD_DOMAIN.reconcileTodoDoneWithSubtasks(draft);
  }
  if (!draft) {
    return draft;
  }
  const subtasks = Array.isArray(draft.subtasks) ? draft.subtasks : [];
  if (!subtasks.length || subtasks.every((item) => Boolean(item.done))) {
    return draft;
  }
  if (draft.daily) {
    return isDailyCompletedToday(draft)
      ? { ...draft, dailyCompletedOn: null }
      : draft;
  }
  return {
    ...draft,
    done: false,
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
  detailDraftRevision += 1;
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
  if (!state.detailTaskId || !state.detailDraft || !state.detailDirty) {
    return true;
  }
  if (state.detailSaving) {
    const savingTaskId = state.detailTaskId;
    const pending = todoMutationQueues.get(savingTaskId);
    if (pending) {
      await pending.catch(() => undefined);
    }
    if (state.detailTaskId !== savingTaskId) return true;
    if (!state.detailDirty) return true;
    if (state.detailSaving) return false;
    return flushDetailSave();
  }
  const previous = currentDetailTodo();
  if (!previous) {
    return false;
  }
  if (String(state.detailDraft.title || "").trim().length < 2) {
    detailSaveState.textContent = "Title must be at least 2 characters.";
    return false;
  }
  const savingTaskId = state.detailTaskId;
  const savingRevision = detailDraftRevision;
  const draftToSave = cloneTodoDraft(state.detailDraft);
  const optimistic = hydrateTodoFromServer({
    ...previous,
    ...draftToSave,
    lane: normalizeLane(draftToSave),
  });

  state.detailSaving = true;
  if (optimistic) {
    updateTodo(optimistic);
    renderBoard();
  }
  renderTaskDetail();

  try {
    const payload = await enqueueTodoMutation(savingTaskId, async () => {
      const latest = state.todos.find((todo) => todo.id === savingTaskId);
      if (!latest) {
        throw new Error("Task not found.");
      }
      const queuedDraft = {
        ...latest,
        ...draftToSave,
        updatedAt: latest.updatedAt,
      };
      return api(`/todos/${savingTaskId}`, {
        method: "PUT",
        body: serializeTodoForApi(queuedDraft),
      });
    });
    const hydrated = hydrateTodoFromServer(payload.todo);
    updateTodo(hydrated);
    state.detailSaving = false;
    if (state.detailTaskId === savingTaskId && detailDraftRevision === savingRevision) {
      state.detailDraft = cloneTodoDraft(hydrated);
      state.detailDirty = false;
    } else if (state.detailTaskId === savingTaskId && state.detailDraft) {
      state.detailDirty = true;
      scheduleDetailSave();
    }
    state.lastSyncedAt = Date.now();
    render();
    return !state.detailDirty;
  } catch (error) {
    state.detailSaving = false;
    if (previous) {
      updateTodo(previous);
    }
    render();
    setStatus(error.message, true);
    if (state.detailTaskId === savingTaskId && detailDraftRevision !== savingRevision) {
      state.detailDirty = true;
      scheduleDetailSave();
    }
    return false;
  }
}

function updateDetailSubtask(id, patch) {
  if (!state.detailDraft) {
    return;
  }
  const before = cloneTodoDraft(state.detailDraft);
  const changedSubtask = before.subtasks.find((item) => item.id === id);
  const nextPatch = state.detailDraft.daily && Object.prototype.hasOwnProperty.call(patch, "done")
    ? { ...patch, completedOn: patch.done ? todayIso() : null }
    : patch;
  state.detailDraft = {
    ...state.detailDraft,
    subtasks: (state.detailDraft.subtasks || []).map((item) => item.id === id ? { ...item, ...nextPatch } : item),
  };
  detailDraftRevision += 1;
  state.detailDraft = syncDraftDoneFromSubtasks(state.detailDraft);
  state.detailDirty = true;
  renderTaskDetail();
  scheduleDetailSave();
  if (Object.prototype.hasOwnProperty.call(patch, "done") && Boolean(changedSubtask?.done) !== Boolean(patch.done)) {
    const todoId = state.detailTaskId;
    setUndoAction({
      label: patch.done
        ? `Completed subtask "${changedSubtask?.text || "Subtask"}"`
        : `Reopened subtask "${changedSubtask?.text || "Subtask"}"`,
      durationMs: 10000,
      rollback: async () => {
        if (state.detailTaskId === todoId && state.detailDraft) {
          state.detailDraft = {
            ...state.detailDraft,
            subtasks: before.subtasks.map((item) => ({ ...item })),
            done: before.done,
            dailyCompletedOn: before.dailyCompletedOn || null,
          };
          detailDraftRevision += 1;
          state.detailDirty = true;
          renderTaskDetail();
          scheduleDetailSave();
          setStatus("Subtask change undone.");
          return;
        }
        await saveTodoPatch(
          todoId,
          {
            subtasks: before.subtasks.map((item) => ({ ...item })),
            done: before.done,
            dailyCompletedOn: before.dailyCompletedOn || null,
          },
          "Subtask change undone."
        );
      },
      commit: async () => Promise.resolve(),
    });
  }
}

function removeDetailSubtask(id) {
  if (!state.detailDraft) {
    return;
  }
  state.detailDraft = {
    ...state.detailDraft,
    subtasks: (state.detailDraft.subtasks || []).filter((item) => item.id !== id),
  };
  detailDraftRevision += 1;
  state.detailDraft = syncDraftDoneFromSubtasks(state.detailDraft);
  state.detailDirty = true;
  renderTaskDetail();
  scheduleDetailSave();
}

function addDetailSubtask() {
  if (!state.detailDraft) {
    return;
  }
  if ((state.detailDraft.subtasks || []).length >= MAX_SUBTASKS) {
    setStatus(`A task can have at most ${MAX_SUBTASKS} subtasks.`, true);
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
  detailDraftRevision += 1;
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
  }, Number(action.durationMs || 5000));
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

function queueTodoSnapshotUndo(previous, label) {
  if (!previous?.id) {
    return;
  }
  const snapshot = cloneTodoDraft(previous);
  setUndoAction({
    label,
    durationMs: 10000,
    rollback: async () => {
      const { updatedAt: _ignoredUpdatedAt, ...restoredFields } = snapshot;
      await saveTodoPatch(snapshot.id, restoredFields, "Task completion undone.");
    },
    commit: async () => Promise.resolve(),
  });
}

async function restoreDeletedTodo(snapshot) {
  const body = serializeTodoForApi(snapshot);
  delete body.expectedUpdatedAt;
  const payload = await api("/todos", { method: "POST", body });
  const restored = hydrateTodoFromServer(payload.todo);
  updateTodo(restored);
  state.lastSyncedAt = Date.now();
  render();
  return restored;
}

async function queueClearCompletedUndo(completed) {
  const completedIds = new Set(completed.map((todo) => todo.id));
  try {
    const payload = await api("/todos/clear-completed", {
      method: "POST",
      body: { ids: [...completedIds] },
    });
    const deletedIds = new Set(Array.isArray(payload.deletedIds) ? payload.deletedIds : [...completedIds]);
    const deleted = completed.filter((todo) => deletedIds.has(todo.id));
    state.todos = state.todos.filter((todo) => !deletedIds.has(todo.id));
    state.lastSyncedAt = Date.now();
    render();
    if (!deleted.length) {
      setStatus("Completed tasks changed elsewhere; nothing was cleared.");
      return;
    }
    setUndoAction({
      label: `${deleted.length} completed task${deleted.length === 1 ? "" : "s"} cleared`,
      rollback: async () => {
        await Promise.all(deleted.map((todo) => restoreDeletedTodo(todo)));
        setStatus("Clear undone.");
      },
      commit: async () => Promise.resolve(),
    });
    setStatus("Completed tasks cleared.");
  } catch (error) {
    setStatus(error.message || "Could not clear completed tasks.", true);
  }
}

async function clearCompletedTasks() {
  const completed = state.todos.filter((todo) => !todo.daily && Boolean(todo.done));
  if (!completed.length) {
    setStatus("No completed tasks to clear.");
    return;
  }
  setStatus("Clearing completed tasks...");
  await queueClearCompletedUndo(completed.map(cloneTodoDraft));
}

async function queuePlanDeleteUndo(planId) {
  const plan = state.plans.find((entry) => entry.id === planId);
  if (!plan) {
    return;
  }
  try {
    await api(`/plans/${planId}`, {
      method: "DELETE",
      body: { expectedUpdatedAt: plan.updatedAt || null },
    });
    state.plans = state.plans.filter((entry) => entry.id !== planId);
    state.lastSyncedAt = Date.now();
    render();
    setUndoAction({
      label: "Plan deleted",
      rollback: async () => {
        const payload = await api("/plans", {
          method: "POST",
          body: {
            planDate: plan.planDate,
            timeLabel: plan.timeLabel || "",
            title: plan.title,
            details: plan.details || "",
          },
        });
        upsertPlan(payload.plan);
        state.lastSyncedAt = Date.now();
        render();
        setStatus("Delete undone.");
      },
      commit: async () => Promise.resolve(),
    });
    setStatus("Plan deleted.");
  } catch (error) {
    setStatus(error.message || "Could not delete plan.", true);
  }
}

async function queuePortfolioDeleteUndo(itemId) {
  const item = state.portfolioItems.find((entry) => entry.id === itemId);
  if (!item) {
    return;
  }
  try {
    await api(`/portfolio/${itemId}`, {
      method: "DELETE",
      body: { expectedUpdatedAt: item.updatedAt || null },
    });
    state.portfolioItems = state.portfolioItems.filter((entry) => entry.id !== itemId);
    if (state.portfolioDetailItemId === itemId) {
      state.portfolioDetailItemId = "";
    }
    state.lastSyncedAt = Date.now();
    render();
    setUndoAction({
      label: "Portfolio item deleted",
      rollback: async () => {
        const payload = await api("/portfolio", {
          method: "POST",
          body: serializePortfolioItemForApi(item),
        });
        upsertPortfolioItem(payload.portfolioItem);
        state.lastSyncedAt = Date.now();
        render();
        setStatus("Delete undone.");
      },
      commit: async () => Promise.resolve(),
    });
    setStatus("Portfolio item deleted.");
  } catch (error) {
    setStatus(error.message || "Could not delete portfolio item.", true);
  }
}

function toggleTodoDone(todoId, nextDone) {
  return enqueueTodoMutation(todoId, () => toggleTodoDoneNow(todoId, nextDone));
}

async function toggleTodoDoneNow(todoId, nextDone) {
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) {
    return false;
  }
  if (nextDone && todoCompletionBlocked(todo)) {
    setStatus("Complete every subtask before completing this task.", true);
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
      label: nextDone ? `Đã hoàn thành "${todo.title || 'Task'}"` : `Đã mở lại "${todo.title || 'Task'}"`,
      durationMs: 10000,
      rollback: async () => {
        const { updatedAt: _ignoredUpdatedAt, ...restoredFields } = previous;
        await saveTodoPatch(todo.id, restoredFields, "Đã hoàn tác trạng thái task.");
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
  const pending = todoMutationQueues.get(todoId);
  if (pending) {
    await pending.catch(() => undefined);
  }
  const todo = state.todos.find((entry) => entry.id === todoId);
  if (!todo) {
    return;
  }
  const snapshot = cloneTodoDraft(todo);
  try {
    await api(`/todos/${todoId}`, {
      method: "DELETE",
      body: { expectedUpdatedAt: snapshot.updatedAt || null },
    });
    state.todos = state.todos.filter((entry) => entry.id !== todoId);
    if (state.detailTaskId === todoId) {
      await closeTaskDetail({ discard: true });
    }
    state.lastSyncedAt = Date.now();
    render();
    setUndoAction({
      label: `Đã xoá "${todo.title || 'Task'}"`,
      rollback: async () => {
        await restoreDeletedTodo(snapshot);
        setStatus("Đã hoàn tác xoá task.");
      },
      commit: async () => Promise.resolve(),
    });
    setStatus("Task deleted.");
  } catch (error) {
    setStatus(error.message || "Could not delete task.", true);
  }
}

function normalizeDailyResetAfterDays(value) {
  if (PLANBOARD_DOMAIN.normalizeDailyResetAfterDays) {
    return PLANBOARD_DOMAIN.normalizeDailyResetAfterDays(value);
  }
  const days = Number.parseInt(value, 10);
  return DAILY_RESET_OPTIONS.includes(days) ? days : DEFAULT_DAILY_RESET_AFTER_DAYS;
}

function daysBetweenIso(leftIso, rightIso) {
  const left = new Date(`${leftIso}T00:00:00Z`);
  const right = new Date(`${rightIso}T00:00:00Z`);
  if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((right.getTime() - left.getTime()) / 86400000);
}

function syncTaskDailyResetControls() {
  const enabled = Boolean(todoDailyInput.checked || todoLaneInput.value === "daily");
  todoDailyResetField.hidden = !enabled;
  todoDailyResetInput.disabled = !enabled;
  if (!todoDailyResetInput.value) todoDailyResetInput.value = String(DEFAULT_DAILY_RESET_AFTER_DAYS);
}

function syncDetailDailyResetControls(isDaily = state.detailDraft?.daily) {
  const enabled = Boolean(isDaily);
  detailDailyResetField.hidden = !enabled;
  detailDailyResetInput.disabled = !enabled;
  if (!detailDailyResetInput.value) detailDailyResetInput.value = String(DEFAULT_DAILY_RESET_AFTER_DAYS);
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
    expectedUpdatedAt: String(item.updatedAt || "").trim() || null,
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

function dailyResetCountdownText(todo) {
  if (PLANBOARD_DOMAIN.dailyResetCountdownText) {
    return PLANBOARD_DOMAIN.dailyResetCountdownText(todo);
  }
  if (!todo || !todo.daily) return "";
  const resetAfterDays = normalizeDailyResetAfterDays(todo.dailyResetAfterDays);
  if (resetAfterDays === 0) return "never resets";
  if (Number(todo.streak || 0) <= 0 || !todo.dailyCompletedOn) return "not started";
  const elapsed = daysBetweenIso(todo.dailyCompletedOn, todayIso());
  if (!Number.isFinite(elapsed) || elapsed < 0) return `${resetAfterDays}d window`;
  const daysLeft = resetAfterDays - elapsed;
  if (daysLeft < 0) return "reset pending";
  if (daysLeft === 0) return "last day";
  return `${daysLeft}d left`;
}

function dailyMomentumLabel(todo) {
  if (PLANBOARD_DOMAIN.dailyMomentumLabel) {
    return PLANBOARD_DOMAIN.dailyMomentumLabel(todo);
  }
  const countdown = dailyResetCountdownText(todo);
  return countdown ? `Momentum ${Number(todo?.streak || 0)} - ${countdown}` : `Momentum ${Number(todo?.streak || 0)}`;
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
      dailyResetAfterDays: normalizeDailyResetAfterDays(todo.dailyResetAfterDays),
      subtasks: Array.isArray(todo.subtasks)
        ? todo.subtasks.map((subtask) => Boolean(subtask.done)
          ? { ...subtask, completedOn: vietnamTodayIso() }
          : { ...subtask })
        : [],
      streak: (() => {
        const completedOn = vietnamTodayIso();
        const resetAfterDays = normalizeDailyResetAfterDays(todo.dailyResetAfterDays);
        const gap = todo.dailyCompletedOn ? daysBetweenIso(todo.dailyCompletedOn, completedOn) : Number.POSITIVE_INFINITY;
        const keepMomentum = resetAfterDays === 0 || (gap > 0 && gap <= resetAfterDays);
        return todo.dailyCompletedOn === completedOn ? Number(todo.streak || 0) : keepMomentum ? Number(todo.streak || 0) + 1 : 1;
      })(),
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
  return Boolean(todo && todo.id && !isTodoEffectivelyDone(todo));
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
      new Notification("Upcoming plan", { body: `${plan.timeLabel} - ${plan.title}` });
      state.notified.push(key);
    });

  saveNotifiedState();
}
