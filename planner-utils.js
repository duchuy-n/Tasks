(function (root) {
  const domain = root.PlanboardDomain || {};

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function vietnamTodayIso() {
    return domain.vietnamTodayIso
      ? domain.vietnamTodayIso()
      : new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  function todayIso() {
    return vietnamTodayIso();
  }

  function previousIsoDate(iso) {
    return domain.previousIsoDate
      ? domain.previousIsoDate(iso)
      : (() => {
        const date = new Date(`${iso}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() - 1);
        return date.toISOString().slice(0, 10);
      })();
  }

  function dateToLocalIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function normalizeIsoDateInput(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
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

  function laneLabel(lane) {
    return {
      ideas: "Ideas",
      month: "This Month",
      daily: "Daily",
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

  root.PlannerUtils = {
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
  };
})(typeof window !== "undefined" ? window : globalThis);
