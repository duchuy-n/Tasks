(function (root) {
  const LANES = ["ideas", "month", "week", "today", "done"];
  const LANE_PREFIX = /^\[\[lane:(ideas|month|week|today|done)\]\]\s*/i;
  const PRIORITIES = ["low", "medium", "high"];
  const PRIORITY_COUNTS = { high: 0, medium: 0, low: 0 };

  function vietnamTodayIso(now = new Date()) {
    const date = now instanceof Date ? now : new Date(now);
    return new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  function previousIsoDate(iso) {
    const date = new Date(`${iso}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  function isDailyCompletedToday(todo, now = new Date()) {
    return Boolean(todo && todo.daily && todo.dailyCompletedOn === vietnamTodayIso(now));
  }

  function completeDailyTodo(todo, now = new Date()) {
    const completedOn = vietnamTodayIso(now);
    const yesterday = previousIsoDate(completedOn);
    const previousStreak = Number(todo.streak || 0);
    return {
      ...todo,
      done: false,
      lane: "today",
      daily: true,
      dailyCompletedOn: completedOn,
      streak: todo.dailyCompletedOn === yesterday ? previousStreak + 1 : 1,
    };
  }

  function shouldResetDailyStreak(todo, now = new Date()) {
    if (!todo || !todo.daily || Number(todo.streak || 0) <= 0) {
      return false;
    }
    const today = vietnamTodayIso(now);
    const yesterday = previousIsoDate(today);
    return todo.dailyCompletedOn !== today && todo.dailyCompletedOn !== yesterday;
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
      .filter((todo) => todo.dueDate && !todo.daily && !todo.projectTitle && !todo.projectId)
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

  function weeklyTaskHasAssignments(todo) {
    if (!todo) return false;
    if ((todo.weeklyDays || []).some((day) => Boolean(validIsoDay(day)))) return true;
    return (todo.subtasks || []).some((subtask) =>
      (subtask.days || []).some((day) => Boolean(validIsoDay(day)))
    );
  }

  function todoHasUnassignedWeeklyWork(todo) {
    if (!todo || !todo.projectTitle) return false;
    const subtasks = Array.isArray(todo.subtasks) ? todo.subtasks : [];
    if (subtasks.some((subtask) => !(subtask.days || []).some((day) => Boolean(validIsoDay(day))))) {
      return true;
    }
    return subtasks.length === 0 && !weeklyTaskHasAssignments(todo);
  }

  function todoScheduledForWeek(todo, firstIso, lastIso) {
    if (!todo || todo.daily) return false;
    const assignedDays = [
      ...(todo.weeklyDays || []),
      ...(todo.subtasks || []).flatMap((subtask) => subtask.days || []),
    ].map(validIsoDay).filter(Boolean);
    if (assignedDays.some((day) => day >= firstIso && day <= lastIso)) return true;
    return todoHasUnassignedWeeklyWork(todo);
  }

  function todoSubtasksComplete(todo) {
    const subtasks = Array.isArray(todo?.subtasks) ? todo.subtasks : [];
    return subtasks.length > 0 && subtasks.every((subtask) => Boolean(subtask.done));
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
    isSameWeek,
    inferStartingLane,
    deadlineTodosByDate,
    calendarPriorityCounts,
    weeklyTaskHasAssignments,
    todoHasUnassignedWeeklyWork,
    todoScheduledForWeek,
    todoSubtasksComplete,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
    return;
  }

  root.PlanboardDomain = api;
})(typeof window !== "undefined" ? window : globalThis);
