const assert = require("node:assert/strict");
const domain = require("../planboard-domain.js");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("vietnamTodayIso resets at UTC+7 midnight", () => {
  assert.equal(domain.vietnamTodayIso(new Date("2026-05-01T16:59:59Z")), "2026-05-01");
  assert.equal(domain.vietnamTodayIso(new Date("2026-05-01T17:00:00Z")), "2026-05-02");
});

test("daily completion uses Vietnam day and increments momentum within reset window", () => {
  const completed = domain.completeDailyTodo(
    {
      id: "daily-1",
      title: "Read",
      done: false,
      lane: "today",
      daily: true,
      dailyCompletedOn: "2026-05-01",
      streak: 4,
    },
    new Date("2026-05-02T02:00:00Z")
  );

  assert.equal(completed.dailyCompletedOn, "2026-05-02");
  assert.equal(completed.streak, 5);
  assert.equal(completed.done, false);
  assert.equal(completed.lane, "today");
  assert.equal(domain.isDailyCompletedToday(completed, new Date("2026-05-02T15:00:00Z")), true);
});

test("daily completion keeps momentum after skipped days within reset window", () => {
  const completed = domain.completeDailyTodo(
    {
      id: "daily-2",
      daily: true,
      dailyCompletedOn: "2026-04-30",
      streak: 8,
    },
    new Date("2026-05-02T02:00:00Z")
  );

  assert.equal(completed.dailyCompletedOn, "2026-05-02");
  assert.equal(completed.streak, 9);
});

test("daily completion starts over after task reset window expires", () => {
  const completed = domain.completeDailyTodo(
    {
      id: "daily-reset",
      daily: true,
      dailyCompletedOn: "2026-04-24",
      streak: 8,
      dailyResetAfterDays: 7,
    },
    new Date("2026-05-02T02:00:00Z")
  );

  assert.equal(completed.dailyCompletedOn, "2026-05-02");
  assert.equal(completed.streak, 1);
});

test("daily completion honors per-task reset interval", () => {
  const completed = domain.completeDailyTodo(
    {
      id: "daily-short-reset",
      daily: true,
      dailyCompletedOn: "2026-04-28",
      streak: 8,
      dailyResetAfterDays: 3,
    },
    new Date("2026-05-02T02:00:00Z")
  );

  assert.equal(completed.streak, 1);
});

test("missed daily task resets visible streak after the configured reset window", () => {
  const missed = domain.resetMissedDailyStreak(
    {
      id: "daily-3",
      done: false,
      lane: "today",
      daily: true,
      dailyCompletedOn: "2026-05-18",
      streak: 5,
    },
    new Date("2026-05-27T02:00:00Z")
  );

  assert.equal(missed.streak, 0);
  assert.equal(missed.dailyCompletedOn, "2026-05-18");
  assert.equal(missed.done, false);
  assert.equal(missed.lane, "today");
});

test("daily reset countdown explains when momentum will reset", () => {
  assert.equal(
    domain.dailyMomentumLabel(
      {
        id: "daily-countdown",
        daily: true,
        dailyCompletedOn: "2026-05-01",
        streak: 5,
        dailyResetAfterDays: 7,
      },
      new Date("2026-05-03T02:00:00Z")
    ),
    "Momentum 5 - 5d left"
  );
  assert.equal(
    domain.dailyResetCountdownText(
      {
        id: "daily-last-day",
        daily: true,
        dailyCompletedOn: "2026-05-01",
        streak: 5,
        dailyResetAfterDays: 3,
      },
      new Date("2026-05-04T02:00:00Z")
    ),
    "last day"
  );
  assert.equal(
    domain.dailyResetCountdownText(
      {
        id: "daily-pending",
        daily: true,
        dailyCompletedOn: "2026-05-01",
        streak: 5,
        dailyResetAfterDays: 3,
      },
      new Date("2026-05-05T02:00:00Z")
    ),
    "reset pending"
  );
  assert.equal(
    domain.dailyResetCountdownText(
      {
        id: "daily-never",
        daily: true,
        dailyCompletedOn: "2026-05-01",
        streak: 5,
        dailyResetAfterDays: 0,
      },
      new Date("2026-06-01T02:00:00Z")
    ),
    "never resets"
  );
});

test("daily task keeps streak during the day after completion", () => {
  const current = {
    id: "daily-4",
    done: false,
    lane: "today",
    daily: true,
    dailyCompletedOn: "2026-05-01",
    streak: 4,
  };

  assert.equal(domain.resetMissedDailyStreak(current, new Date("2026-05-02T02:00:00Z")), current);
});

test("daily subtasks reset after the Vietnam calendar day changes", () => {
  const previousDay = {
    id: "daily-subtasks-reset",
    daily: true,
    dailyCompletedOn: "2026-05-01",
    updatedAt: "2026-05-01T12:00:00Z",
    subtasks: [
      { id: "one", text: "First", done: true, completedOn: "2026-05-01" },
      { id: "two", text: "Second", done: true, completedOn: "2026-05-01" },
    ],
  };
  const reset = domain.resetDailySubtasksForToday(previousDay, new Date("2026-05-02T02:00:00Z"));
  assert.deepEqual(reset.subtasks.map((subtask) => subtask.done), [false, false]);
  assert.deepEqual(reset.subtasks.map((subtask) => subtask.completedOn), [null, null]);
  assert.equal(reset.dailyCompletedOn, "2026-05-01");
});

test("legacy daily subtasks without completion dates migrate safely", () => {
  const nextDay = domain.resetDailySubtasksForToday(
    {
      id: "legacy-daily-reset",
      daily: true,
      dailyCompletedOn: "2026-05-01",
      updatedAt: "2026-05-01T12:00:00Z",
      subtasks: [
        { id: "one", text: "First", done: true },
        { id: "two", text: "Second", done: true },
      ],
    },
    new Date("2026-05-02T02:00:00Z")
  );
  assert.deepEqual(nextDay.subtasks.map((subtask) => subtask.done), [false, false]);

  const sameDay = domain.resetDailySubtasksForToday(
    {
      id: "legacy-daily-current",
      daily: true,
      dailyCompletedOn: "2026-05-02",
      updatedAt: "2026-05-02T02:00:00Z",
      subtasks: [{ id: "one", text: "First", done: true }],
    },
    new Date("2026-05-02T03:00:00Z")
  );
  assert.equal(sameDay.subtasks[0].done, true);
  assert.equal(sameDay.subtasks[0].completedOn, "2026-05-02");

  const partialToday = domain.resetDailySubtasksForToday(
    {
      id: "legacy-daily-partial",
      daily: true,
      dailyCompletedOn: "2026-05-01",
      updatedAt: "2026-05-02T02:00:00Z",
      subtasks: [
        { id: "one", text: "First", done: true },
        { id: "two", text: "Second", done: false },
      ],
    },
    new Date("2026-05-02T03:00:00Z")
  );
  assert.equal(partialToday.subtasks[0].done, true);
  assert.equal(partialToday.subtasks[0].completedOn, "2026-05-02");
  assert.equal(partialToday.subtasks[1].done, false);
});

test("daily subtask progress survives refreshes within the same day", () => {
  const current = {
    id: "daily-subtasks-current",
    daily: true,
    dailyCompletedOn: "2026-05-01",
    subtasks: [
      { id: "one", text: "First", done: true, completedOn: "2026-05-02" },
      { id: "two", text: "Second", done: false, completedOn: null },
    ],
  };
  const normalized = domain.resetDailySubtasksForToday(current, new Date("2026-05-02T02:00:00Z"));
  assert.equal(normalized, current);
});

test("completing a daily task stamps completed subtasks with today's date", () => {
  const completed = domain.completeDailyTodo(
    {
      id: "daily-subtask-stamp",
      daily: true,
      dailyCompletedOn: "2026-05-01",
      subtasks: [{ id: "one", text: "First", done: true }],
    },
    new Date("2026-05-02T02:00:00Z")
  );
  assert.equal(completed.subtasks[0].completedOn, "2026-05-02");
});

test("starting lane inference honors daily, explicit lane, and due dates", () => {
  assert.equal(domain.inferStartingLane("", null, true, "2026-05-02"), "today");
  assert.equal(domain.inferStartingLane("week", "2026-06-20", false, "2026-05-02"), "week");
  assert.equal(domain.inferStartingLane("", null, false, "2026-05-02"), "ideas");
  assert.equal(domain.inferStartingLane("", "2026-05-02", false, "2026-05-02"), "today");
  assert.equal(domain.inferStartingLane("", "2026-05-03", false, "2026-05-02"), "week");
  assert.equal(domain.inferStartingLane("", "2026-06-10", false, "2026-05-02"), "month");
});

test("calendar deadline grouping excludes daily tasks and empty dates", () => {
  const map = domain.deadlineTodosByDate([
    { id: "a", dueDate: "2026-05-02", daily: false },
    { id: "b", dueDate: "2026-05-02", daily: true },
    { id: "c", dueDate: "", daily: false },
    { id: "d", dueDate: "2026-05-03", daily: false },
    { id: "e", dueDate: "2026-05-02", daily: false, projectTitle: "Board Project" },
    { id: "f", dueDate: "2026-05-02", daily: false, projectId: "board-1" },
  ]);

  assert.deepEqual([...map.keys()], ["2026-05-02", "2026-05-03"]);
  assert.deepEqual(map.get("2026-05-02").map((todo) => todo.id), ["a", "e", "f"]);
});

test("calendar priority counts only show actual task priorities", () => {
  assert.deepEqual(
    domain.calendarPriorityCounts([
      { priority: "high" },
      { priority: "low" },
      { priority: "low" },
      { priority: "unknown" },
    ]),
    { high: 1, medium: 1, low: 2 }
  );
});

test("subtask completion helper only reports whether every subtask is done", () => {
  assert.equal(domain.todoSubtasksComplete({ subtasks: [] }), false);
  assert.equal(domain.todoSubtasksComplete({ subtasks: [{ done: true }, { done: true }] }), true);
  assert.equal(domain.todoSubtasksComplete({ subtasks: [{ done: true }, { done: false }] }), false);
});

test("pending subtasks block parent completion", () => {
  assert.equal(domain.todoCompletionBlocked({ subtasks: [] }), false);
  assert.equal(domain.todoCompletionBlocked({ subtasks: [{ done: true }, { done: true }] }), false);
  assert.equal(domain.todoCompletionBlocked({ subtasks: [{ done: true }, { done: false }] }), true);
});

test("finishing subtasks unlocks but does not auto-complete the parent task", () => {
  const ready = domain.reconcileTodoDoneWithSubtasks({
    done: false,
    subtasks: [{ done: true }, { done: true }],
  });
  assert.equal(ready.done, false);
  const invalidDone = domain.reconcileTodoDoneWithSubtasks({
    done: true,
    subtasks: [{ done: true }, { done: false }],
  });
  assert.equal(invalidDone.done, false);
});

test("reopening a daily subtask clears that day's parent completion", () => {
  const reconciled = domain.reconcileTodoDoneWithSubtasks({
    daily: true,
    done: false,
    dailyCompletedOn: "2026-09-18",
    subtasks: [{ done: true }, { done: false }],
  }, new Date("2026-09-18T02:00:00Z"));
  assert.equal(reconciled.done, false);
  assert.equal(reconciled.dailyCompletedOn, null);
});

test("starting today's daily subtasks keeps the previous completion marker", () => {
  const previous = {
    daily: true,
    done: false,
    dailyCompletedOn: "2026-09-18",
    streak: 6,
    subtasks: [{ done: true }, { done: false }],
  };
  const reconciled = domain.reconcileTodoDoneWithSubtasks(previous, new Date("2026-09-19T02:00:00Z"));
  assert.equal(reconciled, previous);
  assert.equal(reconciled.dailyCompletedOn, "2026-09-18");
  assert.equal(reconciled.streak, 6);
});

require("../app-state.js");
require("../app-calendar.js");
require("../app-portfolio.js");

test("PlanboardPortfolio inferPortfolioStatus determines status from date range", () => {
  const p = globalThis.PlanboardPortfolio;
  assert.equal(p.inferPortfolioStatus("2026-06-01", "2026-06-30", "2026-05-01"), "planned");
  assert.equal(p.inferPortfolioStatus("2026-04-01", "2026-04-30", "2026-05-01"), "completed");
  assert.equal(p.inferPortfolioStatus("2026-04-01", "2026-05-30", "2026-05-01"), "active");
});

test("PlanboardPortfolio portfolioTypeLabel formats item types", () => {
  const p = globalThis.PlanboardPortfolio;
  assert.equal(p.portfolioTypeLabel("competition"), "Competition");
  assert.equal(p.portfolioTypeLabel("course"), "Course");
  assert.equal(p.portfolioTypeLabel("project"), "Project");
});

test("PlanboardCalendar calendarMonthDates generates exactly 42 days grid", () => {
  const c = globalThis.PlanboardCalendar;
  const dates = c.calendarMonthDates(2026, 4); // May 2026
  assert.equal(dates.length, 42);
  assert.equal(dates[0] instanceof Date, true);
});

test("PlanboardState createState initializes expected state structure", () => {
  // Polyfill minimal localStorage for testing in pure Node
  if (!globalThis.localStorage) {
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  const s = globalThis.PlanboardState;
  const state = s.createState();
  assert.equal(typeof state, "object");
  assert.equal(state.activeView, "board");
  assert.deepEqual(state.todos, []);
  assert.deepEqual(state.plans, []);
  assert.deepEqual(state.portfolioItems, []);
  assert.equal(state.uiScale, 1.0);
  assert.equal(s.UI_SCALE_KEY, "planboard-ui-scale");
  assert.equal(s.DEFAULT_UI_SCALE, 1.0);
});

require("../app-board.js");
require("../app-composer.js");

test("PlanboardBoard boardLane correctly categorizes tasks into lanes", () => {
  const b = globalThis.PlanboardBoard;
  assert.equal(b.boardLane({ done: true }), "done");
  assert.equal(b.boardLane({ daily: true, done: false }), "daily");
  assert.equal(b.boardLane({ dueDate: "2026-05-10", done: false }), "month");
  assert.equal(b.boardLane({ lane: "today", done: false }, null, (t) => t.lane), "month");
  assert.equal(b.boardLane({ done: false }), "ideas");
});

test("PlanboardBoard taskCompletionUnits calculates completion correctly", () => {
  const b = globalThis.PlanboardBoard;
  assert.deepEqual(b.taskCompletionUnits({ done: true }), { total: 1, done: 1 });
  assert.deepEqual(b.taskCompletionUnits({ done: false }), { total: 1, done: 0 });
  assert.deepEqual(
    b.taskCompletionUnits({
      subtasks: [{ done: true }, { done: false }, { done: true }],
      done: false,
    }),
    { total: 3, done: 2 }
  );
});

test("PlanboardBoard requires parent confirmation after all subtasks are done", () => {
  const b = globalThis.PlanboardBoard;
  const task = {
    done: false,
    subtasks: [{ done: true }, { done: true }],
  };
  assert.equal(b.boardLane(task, (todo) => todo.done, () => "ideas"), "ideas");
  assert.deepEqual(
    b.projectCompletionForTodos([task], (todo) => todo.done),
    { total: 2, done: 2, complete: false }
  );
  assert.equal(
    b.projectCompletionForTodos([{ ...task, done: true }], (todo) => todo.done).complete,
    true
  );
});

test("PlanboardComposer exports required UI management methods", () => {
  const c = globalThis.PlanboardComposer;
  assert.equal(typeof c.renderUndoToast, "function");
  assert.equal(typeof c.syncTaskDetailChrome, "function");
  assert.equal(typeof c.renderDetailSubtasks, "function");
  assert.equal(typeof c.renderTaskActionSheet, "function");
  assert.equal(typeof c.closeComposer, "function");
  assert.equal(typeof c.setComposerTab, "function");
});
