(function (root) {
  const STATUS_RANK = { planned: 0, active: 1, completed: 2 };
  const VALID_FILTERS = ["all", "project", "competition", "course"];

  function compareCreatedDesc(left, right) {
    return String(right.createdAt || "").localeCompare(String(left.createdAt || ""));
  }

  function sortItems(items) {
    return [...(items || [])].filter(Boolean).sort((left, right) =>
      (STATUS_RANK[left.status] ?? 9) - (STATUS_RANK[right.status] ?? 9) ||
      String(right.startDate || "0000-00-00").localeCompare(String(left.startDate || "0000-00-00")) ||
      compareCreatedDesc(left, right)
    );
  }

  function yearForItem(item) {
    const source = item.endDate || item.startDate || item.createdAt || "";
    const match = String(source).match(/^(\d{4})/);
    return match ? match[1] : "";
  }

  function yearsForItems(items) {
    return [...new Set((items || []).map(yearForItem).filter(Boolean))].sort((left, right) => right.localeCompare(left));
  }

  function matchesSearch(item, query) {
    const needle = String(query || "").trim().toLowerCase();
    if (!needle) {
      return true;
    }
    return [
      item.title,
      item.organization,
      item.role,
      item.teammates,
      item.cert ? "cert certificate" : "",
      item.achievement,
      item.links,
      item.notes,
    ].some((value) => String(value || "").toLowerCase().includes(needle));
  }

  function filterItems(items, options = {}) {
    const type = VALID_FILTERS.includes(options.type) ? options.type : "all";
    const year = String(options.year || "all");
    const cert = ["all", "cert", "no-cert"].includes(options.cert) ? options.cert : "all";
    return sortItems(items).filter((item) =>
      (type === "all" || item.type === type) &&
      (year === "all" || yearForItem(item) === year) &&
      (cert === "all" || (cert === "cert" ? Boolean(item.cert) : !item.cert)) &&
      matchesSearch(item, options.search)
    );
  }

  function groupByStatus(items) {
    return {
      active: (items || []).filter((item) => item.status === "active"),
      planned: (items || []).filter((item) => item.status === "planned"),
      completed: (items || []).filter((item) => item.status === "completed"),
    };
  }

  root.PlanboardPortfolioUtils = {
    filterItems,
    groupByStatus,
    sortItems,
    yearForItem,
    yearsForItems,
  };
})(typeof window !== "undefined" ? window : globalThis);
