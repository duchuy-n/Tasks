(function (root) {
  function renderUndoToast({ state, dom }) {
    if (!dom || !dom.undoToast) return;
    const isOpen = Boolean(state && state.undoAction);
    dom.undoToast.classList.toggle("undo-toast--hidden", !isOpen);
    if (!isOpen) {
      if (dom.undoToastLabel) dom.undoToastLabel.textContent = "";
      if (dom.undoToastProgress) dom.undoToastProgress.classList.remove("is-running");
      return;
    }
    if (dom.undoToastLabel) dom.undoToastLabel.textContent = state.undoAction.label;
    if (dom.undoToastProgress) {
      dom.undoToastProgress.style.setProperty("--undo-duration", `${Number(state.undoAction.durationMs || 5000)}ms`);
      dom.undoToastProgress.classList.remove("is-running");
      void dom.undoToastProgress.offsetWidth;
      dom.undoToastProgress.classList.add("is-running");
    }
  }

  function syncTaskDetailChrome({ draft, state, dom }) {
    if (!dom) return;
    if (!draft) {
      if (dom.detailHeading) dom.detailHeading.textContent = "Task details";
      if (dom.detailSaveState) dom.detailSaveState.textContent = "Pick a task to inspect and edit.";
      return;
    }
    if (dom.detailHeading) dom.detailHeading.textContent = draft.title || "Task details";
    if (dom.toggleTaskDoneButton) {
      dom.toggleTaskDoneButton.textContent = draft.daily ? "Complete Today" : draft.done ? "Mark Active" : "Mark Done";
      const subtasks = Array.isArray(draft.subtasks) ? draft.subtasks : [];
      const completionBlocked = subtasks.length > 0 && !subtasks.every((subtask) => Boolean(subtask.done));
      dom.toggleTaskDoneButton.disabled = completionBlocked && !draft.done;
      dom.toggleTaskDoneButton.title = completionBlocked ? "Complete every subtask first" : "";
    }
    if (dom.detailSaveState) {
      dom.detailSaveState.textContent = (state && state.detailSaving)
        ? "Saving changes..."
        : (state && state.detailDirty)
          ? "Unsaved changes..."
          : "Saved";
    }
  }

  function renderDetailSubtasks({ subtasks, state, dom, onUpdateSubtask, onRemoveSubtask }) {
    if (!dom || !dom.detailSubtaskList) return;
    const items = subtasks || [];
    dom.detailSubtaskList.innerHTML = "";
    const completed = items.filter((item) => item.done).length;
    if (dom.detailSubtaskMeta) {
      dom.detailSubtaskMeta.textContent = `${completed}/${items.length} done`;
    }
    if (dom.toggleCompletedSubtasksButton) {
      dom.toggleCompletedSubtasksButton.hidden = completed === 0;
      dom.toggleCompletedSubtasksButton.textContent = (state && state.detailCompletedCollapsed)
        ? `Show completed (${completed})`
        : `Hide completed (${completed})`;
    }

    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "lane-empty";
      empty.textContent = "No subtasks yet.";
      dom.detailSubtaskList.appendChild(empty);
      return;
    }

    const isCollapsed = Boolean(state && state.detailCompletedCollapsed);
    const pending = items.filter((subtask) => !subtask.done);
    const completedItems = items.filter((subtask) => subtask.done);
    const visibleCompleted = isCollapsed ? [] : completedItems;

    [...pending, ...visibleCompleted].forEach((subtask) => {
      const item = document.createElement("li");
      item.className = "subtask-item";
      item.classList.toggle("is-done", Boolean(subtask.done));

      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.checked = Boolean(subtask.done);
      toggle.addEventListener("change", () => {
        if (typeof onUpdateSubtask === "function") {
          onUpdateSubtask(subtask.id, { done: toggle.checked });
        }
      });

      const text = document.createElement("input");
      text.type = "text";
      text.className = "subtask-item__text";
      text.value = subtask.text;
      text.maxLength = 120;
      text.addEventListener("input", () => {
        if (typeof onUpdateSubtask === "function") {
          onUpdateSubtask(subtask.id, { text: text.value });
        }
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "subtask-item__remove";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        if (typeof onRemoveSubtask === "function") {
          onRemoveSubtask(subtask.id);
        }
      });

      item.append(toggle, text, remove);
      dom.detailSubtaskList.appendChild(item);
    });

    if (completedItems.length && isCollapsed) {
      const collapsed = document.createElement("li");
      collapsed.className = "subtask-list__collapsed";
      collapsed.textContent = `${completedItems.length} completed subtask${completedItems.length === 1 ? "" : "s"} hidden`;
      dom.detailSubtaskList.appendChild(collapsed);
    }
  }

  function renderTaskActionSheet({ state, dom, utils, onMoveLane, onClose }) {
    if (!dom || !dom.taskActionOverlay) return;
    const todo = state.taskActionTaskId ? (state.todos || []).find((entry) => entry.id === state.taskActionTaskId) : null;
    const isOpen = Boolean(todo);
    dom.taskActionOverlay.classList.toggle("task-action-overlay--hidden", !isOpen);
    dom.taskActionOverlay.setAttribute("aria-hidden", String(!isOpen));

    if (!todo) {
      if (dom.taskActionTitle) dom.taskActionTitle.textContent = "Selected task";
      if (dom.taskActionMoveList) dom.taskActionMoveList.innerHTML = "";
      return;
    }

    if (dom.taskActionTitle) dom.taskActionTitle.textContent = todo.title;
    if (!dom.taskActionMoveList) return;
    dom.taskActionMoveList.innerHTML = "";

    const lanes = (utils && utils.BOARD_LANES) || ["ideas", "month", "daily", "done"];
    const currentLane = utils && typeof utils.boardLane === "function" ? utils.boardLane(todo) : todo.lane;
    const laneLabel = (utils && utils.laneLabel) || ((l) => l);
    const completionBlocked = Boolean(
      utils && typeof utils.todoCompletionBlocked === "function" && utils.todoCompletionBlocked(todo)
    );

    lanes.forEach((lane) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `task-action-move-list__button${currentLane === lane ? " is-active" : ""}`;
      button.textContent = laneLabel(lane);
      button.disabled = currentLane === lane || (lane === "daily" && !todo.daily) || (lane === "done" && completionBlocked);
      if (lane === "done" && completionBlocked) {
        button.title = "Complete every subtask first";
      }
      button.addEventListener("click", () => {
        if (typeof onClose === "function") onClose();
        if (currentLane !== lane && !(lane === "daily" && !todo.daily)) {
          if (typeof onMoveLane === "function") onMoveLane(todo.id, lane);
        }
      });
      dom.taskActionMoveList.appendChild(button);
    });
  }

  function closeComposer(dom) {
    if (!dom) return;
    if (dom.taskEditorId) dom.taskEditorId.value = "";
    if (dom.planEditorId) dom.planEditorId.value = "";
    if (dom.portfolioEditorId) dom.portfolioEditorId.value = "";
    if (dom.taskSubmitButton) dom.taskSubmitButton.textContent = "Add Task";
    if (dom.planSubmitButton) dom.planSubmitButton.textContent = "Add Plan";
    if (dom.portfolioSubmitButton) dom.portfolioSubmitButton.textContent = "Add Portfolio Item";
    if (dom.composerEyebrow) dom.composerEyebrow.textContent = "Quick Add";
    if (dom.composerOverlay) {
      dom.composerOverlay.dataset.locked = "false";
      dom.composerOverlay.dataset.lockedTab = "";
      dom.composerOverlay.classList.add("composer-overlay--hidden");
    }
  }

  function setComposerTab(tab, { dom, state, activeViewTabFn }) {
    if (!dom) return;
    let targetTab = tab;
    if (dom.composerOverlay && dom.composerOverlay.dataset.locked === "true") {
      targetTab = dom.composerOverlay.dataset.lockedTab || (typeof activeViewTabFn === "function" ? activeViewTabFn() : "task");
    }
    if (state) state.activeComposerTab = targetTab;

    const taskForm = document.querySelector("#taskComposerForm");
    const noteForm = document.querySelector("#noteComposerForm");
    const planForm = document.querySelector("#planComposerForm");
    const portfolioForm = document.querySelector("#portfolioComposerForm");
    if (taskForm) taskForm.classList.toggle("composer-form--hidden", targetTab !== "task");
    if (noteForm) noteForm.classList.toggle("composer-form--hidden", targetTab !== "note");
    if (planForm) planForm.classList.toggle("composer-form--hidden", targetTab !== "plan");
    if (portfolioForm) portfolioForm.classList.toggle("composer-form--hidden", targetTab !== "portfolio");

    const tabTask = document.querySelector("#tabTaskButton");
    const tabNote = document.querySelector("#tabNoteButton");
    const tabPlan = document.querySelector("#tabPlanButton");
    const tabPortfolio = document.querySelector("#tabPortfolioButton");
    if (tabTask) tabTask.classList.toggle("is-active", targetTab === "task");
    if (tabNote) tabNote.classList.toggle("is-active", targetTab === "note");
    if (tabPlan) tabPlan.classList.toggle("is-active", targetTab === "plan");
    if (tabPortfolio) tabPortfolio.classList.toggle("is-active", targetTab === "portfolio");

    const composerMoreDetails = document.querySelector("#composerMoreDetails");
    if (composerMoreDetails) {
      composerMoreDetails.classList.toggle("is-active", targetTab === "note" || targetTab === "plan" || targetTab === "portfolio");
    }
  }

  root.PlanboardComposer = {
    renderUndoToast,
    syncTaskDetailChrome,
    renderDetailSubtasks,
    renderTaskActionSheet,
    closeComposer,
    setComposerTab,
  };
})(typeof window !== "undefined" ? window : globalThis);
