(function (root) {
  const BOARD_LANES = ["ideas", "month", "daily", "done"];

  function emptyTextForLane(lane) {
    return {
      ideas: "No ideas captured yet. Add one from the sidebar composer.",
      month: "No tasks scheduled for this month yet.",
      daily: "No daily habits yet. Mark tasks as daily to build momentum.",
      done: "No completed tasks yet.",
    }[lane] || "No tasks in this lane.";
  }

  function renderLaneEmpty(lane) {
    const empty = document.createElement("div");
    empty.className = "lane-empty";
    const icon = document.createElement("span");
    icon.className = "lane-empty__icon";
    icon.textContent = "✦";
    const text = document.createElement("p");
    text.textContent = emptyTextForLane(lane);
    const hint = document.createElement("small");
    hint.className = "lane-empty__hint";
    hint.textContent = "Press C to add a task";
    empty.appendChild(icon);
    empty.appendChild(text);
    empty.appendChild(hint);
    return empty;
  }

  function renderFilterState(visibleCount, totalCount, filterMode, targetLabel) {
    if (!targetLabel) return;
    const parts = [];
    if (filterMode && filterMode !== "all") {
      parts.push(
        {
          today: "Today",
          overdue: "Overdue",
          high: "High Priority",
        }[filterMode] || filterMode
      );
    }
    targetLabel.textContent = parts.length
      ? `Showing ${visibleCount} of ${totalCount} tasks - ${parts.join(" - ")}`
      : `${visibleCount} task${visibleCount === 1 ? "" : "s"} visible`;
  }

  function boardLane(todo, isDoneFn, normLaneFn) {
    const isDone = typeof isDoneFn === "function" ? isDoneFn(todo) : Boolean(todo && todo.done);
    if (isDone) return "done";
    if (todo && todo.daily) return "daily";
    const norm = typeof normLaneFn === "function" ? normLaneFn(todo) : (todo && todo.lane);
    if ((todo && todo.dueDate) || ["month", "week", "today"].includes(norm)) {
      return "month";
    }
    return "ideas";
  }

  function boardProjectLane(group, isDoneFn, normLaneFn) {
    const todos = (group && group.todos) || [];
    const isDone = typeof isDoneFn === "function" ? isDoneFn : (t) => Boolean(t && t.done);
    if (todos.length && todos.every(isDone)) {
      return "done";
    }
    if (todos.length && todos.every((t) => t.daily)) {
      return "daily";
    }
    const norm = typeof normLaneFn === "function" ? normLaneFn : (t) => t && t.lane;
    if (todos.some((t) => t.dueDate || ["month", "week", "today"].includes(norm(t)))) {
      return "month";
    }
    return "ideas";
  }

  function taskCompletionUnits(todo, isDoneFn) {
    const subtasks = Array.isArray(todo && todo.subtasks) ? todo.subtasks : [];
    if (subtasks.length) {
      const done = todo.done ? subtasks.length : subtasks.filter((s) => Boolean(s.done)).length;
      return { total: subtasks.length, done };
    }
    const isDone = typeof isDoneFn === "function" ? isDoneFn(todo) : Boolean(todo && todo.done);
    return { total: 1, done: isDone ? 1 : 0 };
  }

  function projectCompletionForTodos(todos, isDoneFn) {
    const totals = (todos || []).reduce(
      (summary, todo) => {
        const units = taskCompletionUnits(todo, isDoneFn);
        summary.total += units.total;
        summary.done += units.done;
        return summary;
      },
      { total: 0, done: 0 }
    );
    const isDone = typeof isDoneFn === "function" ? isDoneFn : (todo) => Boolean(todo && todo.done);
    return {
      ...totals,
      complete: (todos || []).length > 0 && (todos || []).every(isDone),
    };
  }

  function boardTaskTitle(todo) {
    return (todo && (todo.projectTitle || todo.title)) || "";
  }

  function boardTaskDetails(todo) {
    if (!todo) return "";
    if (todo.projectTitle) {
      return [todo.title, todo.details].filter(Boolean).join(" - ");
    }
    return todo.details || "";
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

  function boardEntryTodo(entry) {
    if (!entry) return {};
    if (entry.type === "todo") return entry.todo || {};
    return (entry.todos || [])[0] || {};
  }

  function sortBoardEntries(entries, sortMode, utils = {}) {
    const copy = [...(entries || [])];
    const compare = (left, right) => {
      const a = boardEntryTodo(left);
      const b = boardEntryTodo(right);
      if (sortMode === "due" && utils.compareDueDate) {
        return utils.compareDueDate(a, b) || (utils.compareCreatedDesc ? utils.compareCreatedDesc(a, b) : 0);
      }
      if (sortMode === "priority" && utils.comparePriority) {
        return (
          utils.comparePriority(a, b) ||
          (utils.compareDueDate ? utils.compareDueDate(a, b) : 0) ||
          (utils.compareCreatedDesc ? utils.compareCreatedDesc(a, b) : 0)
        );
      }
      if (sortMode === "newest" && utils.compareCreatedDesc) {
        return utils.compareCreatedDesc(a, b);
      }
      if (utils.compareManualOrder) {
        return utils.compareManualOrder(a, b) || (utils.compareCreatedDesc ? utils.compareCreatedDesc(a, b) : 0);
      }
      return 0;
    };
    return copy.sort(compare);
  }

  function groupBoardTodos(visibleTodos, { isDoneFn, normLaneFn }) {
    const grouped = {
      ideas: [],
      month: [],
      daily: [],
      done: [],
    };

    (visibleTodos || []).forEach((todo) => {
      if (!todo.projectTitle) {
        const lane = boardLane(todo, isDoneFn, normLaneFn);
        if (lane && grouped[lane]) grouped[lane].push({ type: "todo", todo });
        return;
      }
      const key = todoProjectKey(todo);
      if (!key) {
        const lane = boardLane(todo, isDoneFn, normLaneFn);
        if (lane && grouped[lane]) grouped[lane].push({ type: "todo", todo });
        return;
      }
      let groupLane = BOARD_LANES.find((lane) =>
        grouped[lane].some((entry) => entry.type === "project" && entry.key === key)
      );
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
        groupLane = boardProjectLane(group, isDoneFn, normLaneFn);
        grouped[groupLane].push(group);
      }
      group.todos.push(todo);
      const nextLane = boardProjectLane(group, isDoneFn, normLaneFn);
      if (groupLane !== nextLane) {
        grouped[groupLane] = grouped[groupLane].filter((entry) => entry !== group);
        grouped[nextLane].push(group);
      }
    });

    return grouped;
  }

  function renderBoard(context) {
    const {
      state,
      dom,
      utils,
      onRenderTodoCard,
      onRenderProjectCard,
    } = context;

    const visibleTodos = typeof utils.filteredTodos === "function" ? utils.filteredTodos() : state.todos || [];
    const grouped = groupBoardTodos(visibleTodos, {
      isDoneFn: utils.isTodoEffectivelyDone,
      normLaneFn: utils.normalizeLane,
    });

    const boardVisibleCount = Object.values(grouped).reduce((total, entries) => total + entries.length, 0);
    if (state.activeView === "board" && dom.allTaskCountHeader) {
      dom.allTaskCountHeader.textContent = String(boardVisibleCount);
    }

    BOARD_LANES.forEach((lane) => {
      const target = dom.laneTargets && dom.laneTargets[lane];
      if (!target) return;
      target.innerHTML = "";
      if (dom.laneCountTargets && dom.laneCountTargets[lane]) {
        dom.laneCountTargets[lane].textContent = String(grouped[lane].length);
      }
      if (!grouped[lane].length) {
        target.appendChild(renderLaneEmpty(lane));
        return;
      }
      const sorted = sortBoardEntries(grouped[lane], state.sortMode, utils);
      sorted.forEach((entry) => {
        if (entry.type === "project") {
          target.appendChild(
            typeof onRenderProjectCard === "function" ? onRenderProjectCard(entry) : document.createElement("div")
          );
        } else {
          target.appendChild(
            typeof onRenderTodoCard === "function" ? onRenderTodoCard(entry.todo) : document.createElement("div")
          );
        }
      });
    });

    if (typeof utils.updateFilterButtons === "function") {
      utils.updateFilterButtons();
    }
    renderFilterState(boardVisibleCount, state.todos.length, state.filterMode, dom.filterStateLabel);
  }

  root.PlanboardBoard = {
    BOARD_LANES,
    emptyTextForLane,
    renderLaneEmpty,
    renderFilterState,
    boardLane,
    boardProjectLane,
    taskCompletionUnits,
    projectCompletionForTodos,
    boardTaskTitle,
    boardTaskDetails,
    todoProjectKey,
    projectKey,
    todoProjectMatches,
    sortBoardEntries,
    groupBoardTodos,
    renderBoard,
  };
})(typeof window !== "undefined" ? window : globalThis);
