(function (root) {
  const LANES = ["ideas", "month", "week", "today", "done"];
  const LANE_PREFIX = /^\[\[lane:(ideas|month|week|today|done)\]\]\s*/i;
  const PRIORITIES = ["low", "medium", "high"];
  const PRIORITY_COUNTS = { high: 0, medium: 0, low: 0 };
  const DEFAULT_DAILY_RESET_AFTER_DAYS = 7;
  const DAILY_RESET_OPTIONS = [1, 3, 7, 14, 30, 0];

  function normalizeDailyResetAfterDays(value) {
    const days = Number.parseInt(value, 10);
    return DAILY_RESET_OPTIONS.includes(days) ? days : DEFAULT_DAILY_RESET_AFTER_DAYS;
  }

  function vietnamTodayIso(now = new Date()) {
    const date = now instanceof Date ? now : new Date(now);
    return new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  function previousIsoDate(iso) {
    const date = new Date(`${iso}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  function daysBetweenIso(leftIso, rightIso) {
    const left = new Date(`${leftIso}T00:00:00Z`);
    const right = new Date(`${rightIso}T00:00:00Z`);
    if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) return Number.POSITIVE_INFINITY;
    return Math.floor((right.getTime() - left.getTime()) / 86400000);
  }

  function isDailyCompletedToday(todo, now = new Date()) {
    return Boolean(todo && todo.daily && todo.dailyCompletedOn === vietnamTodayIso(now));
  }

  function completeDailyTodo(todo, now = new Date()) {
    const completedOn = vietnamTodayIso(now);
    const resetAfterDays = normalizeDailyResetAfterDays(todo?.dailyResetAfterDays);
    const previousStreak = Number(todo.streak || 0);
    const gap = todo.dailyCompletedOn ? daysBetweenIso(todo.dailyCompletedOn, completedOn) : Number.POSITIVE_INFINITY;
    const keepMomentum = resetAfterDays === 0 || (gap > 0 && gap <= resetAfterDays);
    return {
      ...todo,
      done: false,
      lane: "today",
      daily: true,
      dailyCompletedOn: completedOn,
      dailyResetAfterDays: resetAfterDays,
      streak: todo.dailyCompletedOn === completedOn ? previousStreak : keepMomentum ? previousStreak + 1 : 1,
    };
  }

  function shouldResetDailyStreak(todo, now = new Date()) {
    if (!todo || !todo.daily || Number(todo.streak || 0) <= 0) {
      return false;
    }
    const resetAfterDays = normalizeDailyResetAfterDays(todo.dailyResetAfterDays);
    if (resetAfterDays === 0) return false;
    const today = vietnamTodayIso(now);
    return daysBetweenIso(todo.dailyCompletedOn, today) > resetAfterDays;
  }

  function dailyResetCountdownText(todo, now = new Date()) {
    if (!todo || !todo.daily) return "";
    const resetAfterDays = normalizeDailyResetAfterDays(todo.dailyResetAfterDays);
    if (resetAfterDays === 0) return "never resets";
    if (Number(todo.streak || 0) <= 0 || !todo.dailyCompletedOn) return "not started";
    const elapsed = daysBetweenIso(todo.dailyCompletedOn, vietnamTodayIso(now));
    if (!Number.isFinite(elapsed) || elapsed < 0) return `${resetAfterDays}d window`;
    const daysLeft = resetAfterDays - elapsed;
    if (daysLeft < 0) return "reset pending";
    if (daysLeft === 0) return "last day";
    return `${daysLeft}d left`;
  }

  function dailyMomentumLabel(todo, now = new Date()) {
    const momentum = Number(todo?.streak || 0);
    const countdown = dailyResetCountdownText(todo, now);
    return countdown ? `Momentum ${momentum} - ${countdown}` : `Momentum ${momentum}`;
  }

  function resetMissedDailyStreak(todo, now = new Date()) {
    if (!shouldResetDailyStreak(todo, now)) {
      return todo;
    }
    return {
      ...todo,
      done: false,
      lane: "today",
      streak: 0,
    };
  }

  function weekStart(date) {
    const next = new Date(date);
    const day = next.getDay() || 7;
    next.setDate(next.getDate() - day + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  function isSameWeek(leftIso, rightIso) {
    const left = new Date(`${leftIso}T00:00:00`);
    const right = new Date(`${rightIso}T00:00:00`);
    return weekStart(left).getTime() === weekStart(right).getTime();
  }

  function inferStartingLane(requestedLane, dueDate, isDaily = false, todayIso = vietnamTodayIso()) {
    if (isDaily) {
      return "today";
    }
    if (requestedLane && LANES.includes(requestedLane)) {
      return requestedLane;
    }
    if (!dueDate) {
      return "ideas";
    }
    if (dueDate === todayIso) {
      return "today";
    }
    if (isSameWeek(dueDate, todayIso)) {
      return "week";
    }
    return "month";
  }

  function deadlineTodosByDate(todos) {
    const map = new Map();
    (todos || [])
      .filter((todo) => todo.dueDate && !todo.daily)
      .forEach((todo) => {
        const list = map.get(todo.dueDate) || [];
        list.push(todo);
        map.set(todo.dueDate, list);
      });
    return map;
  }

  function calendarPriorityCounts(todos) {
    return (todos || []).reduce((counts, todo) => {
      const priority = PRIORITIES.includes(todo.priority) ? todo.priority : "medium";
      counts[priority] += 1;
      return counts;
    }, { ...PRIORITY_COUNTS });
  }

  function validIsoDay(value) {
    const text = String(value || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
    const parsed = new Date(`${text}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === text ? text : "";
  }

  function todoSubtasksComplete(todo) {
    const subtasks = Array.isArray(todo?.subtasks) ? todo.subtasks : [];
    return subtasks.length > 0 && subtasks.every((subtask) => Boolean(subtask.done));
  }

  function todoCompletionBlocked(todo) {
    const subtasks = Array.isArray(todo?.subtasks) ? todo.subtasks : [];
    return subtasks.length > 0 && !subtasks.every((subtask) => Boolean(subtask.done));
  }

  function reconcileTodoDoneWithSubtasks(todo) {
    if (!todo || !todoCompletionBlocked(todo)) {
      return todo;
    }
    if (todo.daily) {
      return { ...todo, dailyCompletedOn: null };
    }
    return { ...todo, done: false };
  }

  const api = {
    LANES,
    LANE_PREFIX,
    PRIORITIES,
    vietnamTodayIso,
    previousIsoDate,
    isDailyCompletedToday,
    completeDailyTodo,
    shouldResetDailyStreak,
    resetMissedDailyStreak,
    dailyResetCountdownText,
    dailyMomentumLabel,
    isSameWeek,
    inferStartingLane,
    deadlineTodosByDate,
    calendarPriorityCounts,
    DAILY_RESET_OPTIONS,
    DEFAULT_DAILY_RESET_AFTER_DAYS,
    normalizeDailyResetAfterDays,
    todoSubtasksComplete,
    todoCompletionBlocked,
    reconcileTodoDoneWithSubtasks,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
    return;
  }

  root.PlanboardDomain = api;
})(typeof window !== "undefined" ? window : globalThis);
