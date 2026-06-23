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

test("daily completion uses Vietnam day and increments consecutive streaks", () => {
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

test("daily completion resets streak after a skipped day", () => {
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
  assert.equal(completed.streak, 1);
});

test("missed daily task resets visible streak after the next reset day", () => {
  const missed = domain.resetMissedDailyStreak(
    {
      id: "daily-3",
      done: false,
      lane: "today",
      daily: true,
      dailyCompletedOn: "2026-05-18",
      streak: 5,
    },
    new Date("2026-05-20T02:00:00Z")
  );

  assert.equal(missed.streak, 0);
  assert.equal(missed.dailyCompletedOn, "2026-05-18");
  assert.equal(missed.done, false);
  assert.equal(missed.lane, "today");
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
    { id: "e", dueDate: "2026-05-02", daily: false, projectTitle: "Weekly Project" },
    { id: "f", dueDate: "2026-05-02", daily: false, projectId: "weekly-1" },
  ]);

  assert.deepEqual([...map.keys()], ["2026-05-02", "2026-05-03"]);
  assert.deepEqual(map.get("2026-05-02").map((todo) => todo.id), ["a"]);
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

test("weekly scheduling excludes tasks assigned only to another week", () => {
  const futureOnly = {
    projectTitle: "Exam prep",
    weeklyDays: ["2026-06-30"],
    subtasks: [{ id: "future", text: "Future work", days: ["2026-06-30"], done: false }],
  };

  assert.equal(domain.todoScheduledForWeek(futureOnly, "2026-06-22", "2026-06-28"), false);
  assert.equal(domain.todoScheduledForWeek(futureOnly, "2026-06-29", "2026-07-05"), true);
});

test("weekly scheduling keeps genuinely unassigned project work visible", () => {
  const unassigned = {
    projectTitle: "Exam prep",
    weeklyDays: [],
    subtasks: [{ id: "open", text: "Choose a day", days: [], done: false }],
  };
  const emptyTask = { projectTitle: "Exam prep", weeklyDays: [], subtasks: [] };

  assert.equal(domain.todoScheduledForWeek(unassigned, "2026-06-22", "2026-06-28"), true);
  assert.equal(domain.todoScheduledForWeek(emptyTask, "2026-06-22", "2026-06-28"), true);
});

test("completed project work cleared from weekly planning stays off weekly", () => {
  const completed = {
    projectTitle: "Exam prep",
    weeklyDays: [],
    subtasks: [],
    done: true,
  };

  assert.equal(domain.todoScheduledForWeek(completed, "2026-06-29", "2026-07-05"), false);
});

test("all subtasks complete marks the parent task complete", () => {
  assert.equal(domain.todoSubtasksComplete({ subtasks: [] }), false);
  assert.equal(domain.todoSubtasksComplete({ subtasks: [{ done: true }, { done: true }] }), true);
  assert.equal(domain.todoSubtasksComplete({ subtasks: [{ done: true }, { done: false }] }), false);
});
