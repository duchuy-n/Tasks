(function () {
  const config = window.__PLANBOARD_CONFIG__ || {};
  const FIREBASE_SDK_VERSION = config.FIREBASE_SDK_VERSION || "12.4.0";
  const LANE_SET = new Set(["ideas", "month", "week", "today", "done"]);
  const PRIORITY_SET = new Set(["low", "medium", "high"]);
  const PORTFOLIO_TYPE_SET = new Set(["project", "competition", "course"]);
  const PORTFOLIO_STATUS_SET = new Set(["planned", "active", "completed"]);
  const PORTFOLIO_STATUS_MODE_SET = new Set(["auto", "manual"]);

  let clientPromise = null;
  let authReadyPromise = null;

  function isEnabled() {
    return (config.DATA_SOURCE || "rest") === "firebase";
  }

  function requireFirebaseConfig() {
    const requiredKeys = [
      "FIREBASE_API_KEY",
      "FIREBASE_AUTH_DOMAIN",
      "FIREBASE_PROJECT_ID",
      "FIREBASE_APP_ID",
    ];
    const missing = requiredKeys.filter((key) => !String(config[key] || "").trim());
    if (missing.length) {
      throw createError(`Firebase config is incomplete: ${missing.join(", ")}.`, 500);
    }
  }

  async function getClient() {
    if (!isEnabled()) {
      return null;
    }
    if (!clientPromise) {
      clientPromise = (async () => {
        requireFirebaseConfig();
        const baseUrl = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
        const [{ initializeApp }, authMod, firestoreMod] = await Promise.all([
          import(`${baseUrl}/firebase-app.js`),
          import(`${baseUrl}/firebase-auth.js`),
          import(`${baseUrl}/firebase-firestore.js`),
        ]);

        const app = initializeApp({
          apiKey: config.FIREBASE_API_KEY,
          authDomain: config.FIREBASE_AUTH_DOMAIN,
          projectId: config.FIREBASE_PROJECT_ID,
          storageBucket: config.FIREBASE_STORAGE_BUCKET || undefined,
          messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID || undefined,
          appId: config.FIREBASE_APP_ID,
        });

        const auth = authMod.getAuth(app);
        const db = firestoreMod.getFirestore(app);
        authReadyPromise = new Promise((resolve) => {
          const unsubscribe = authMod.onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user || null);
          });
        });

        return { app, auth, db, authMod, firestoreMod };
      })();
    }
    return clientPromise;
  }

  async function waitForAuthUser() {
    const client = await getClient();
    if (!client) {
      return null;
    }
    if (authReadyPromise) {
      await authReadyPromise;
    }
    return client.auth.currentUser || null;
  }

  function userRef(client, uid) {
    return client.firestoreMod.doc(client.db, "users", uid);
  }

  function notesRef(client, uid) {
    return client.firestoreMod.collection(client.db, "users", uid, "notes");
  }

  function plansRef(client, uid) {
    return client.firestoreMod.collection(client.db, "users", uid, "plans");
  }

  function portfolioRef(client, uid) {
    return client.firestoreMod.collection(client.db, "users", uid, "portfolio");
  }

  function todosRef(client, uid) {
    return client.firestoreMod.collection(client.db, "users", uid, "todos");
  }

  function noteDocRef(client, uid, noteDate) {
    return client.firestoreMod.doc(client.db, "users", uid, "notes", noteDate);
  }

  function planDocRef(client, uid, planId) {
    return client.firestoreMod.doc(client.db, "users", uid, "plans", planId);
  }

  function portfolioDocRef(client, uid, itemId) {
    return client.firestoreMod.doc(client.db, "users", uid, "portfolio", itemId);
  }

  function todoDocRef(client, uid, todoId) {
    return client.firestoreMod.doc(client.db, "users", uid, "todos", todoId);
  }

  function createError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function vietnamTodayIso(now = new Date()) {
    return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  function inferPortfolioStatus(startDate, endDate, today = vietnamTodayIso()) {
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

  function emailNormalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeDateInput(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }
    const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashMatch) {
      return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
    }
    return raw;
  }

  function isValidDate(value) {
    const normalized = normalizeDateInput(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return false;
    }
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return false;
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    );
  }

  function isValidTime(value) {
    if (value === "") {
      return true;
    }
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) {
      return false;
    }
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
  }

  function normalizeSubtasks(value) {
    if (value == null) {
      return [];
    }
    if (!Array.isArray(value)) {
      throw createError("Subtasks must be a list.", 400);
    }
    return value.slice(0, 32).map((item) => {
      if (!item || typeof item !== "object") {
        throw createError("Each subtask must be an object.", 400);
      }
      const text = String(item.text || "").trim();
      if (!text) {
        return null;
      }
      return {
        id: String(item.id || crypto.randomUUID()),
        text: text.slice(0, 120),
        done: Boolean(item.done),
      };
    }).filter(Boolean);
  }

  function normalizeSortOrder(value, fallback = 0) {
    if (value == null || value === "") {
      return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < -1_000_000_000 || parsed > 1_000_000_000) {
      throw createError("Sort order is invalid.", 400);
    }
    return parsed;
  }

  function normalizePortfolioPayload(body = {}, existing = {}) {
    const type = String(body.type || "project").trim().toLowerCase() || "project";
    const title = String(body.title || "").trim();
    const organization = String(body.organization || "").trim();
    const role = String(body.role || "").trim();
    const teammates = String(body.teammates || "").trim();
    const startDate = body.startDate == null ? null : normalizeDateInput(body.startDate) || null;
    const endDate = body.endDate == null ? null : normalizeDateInput(body.endDate) || null;
    const requestedStatus = String(body.status || "active").trim().toLowerCase() || "active";
    const statusMode = String(body.statusMode || (body.status === "auto" ? "auto" : "manual")).trim().toLowerCase() || "manual";
    if (body.cert != null && typeof body.cert !== "boolean") {
      throw createError("Certificate flag is invalid.", 400);
    }
    const cert = body.cert === true;
    const achievement = String(body.achievement || "").trim();
    const links = String(body.links || "").trim();
    const notes = String(body.notes || "").trim();
    if (!PORTFOLIO_TYPE_SET.has(type)) {
      throw createError("Portfolio type is invalid.", 400);
    }
    if (!PORTFOLIO_STATUS_MODE_SET.has(statusMode)) {
      throw createError("Portfolio status mode is invalid.", 400);
    }
    const status = statusMode === "auto"
      ? inferPortfolioStatus(startDate, endDate)
      : requestedStatus;
    if (!PORTFOLIO_STATUS_SET.has(status)) {
      throw createError("Portfolio status is invalid.", 400);
    }
    if (title.length < 2) {
      throw createError("Portfolio title is too short.", 400);
    }
    if (title.length > 160) {
      throw createError("Portfolio title is too long.", 400);
    }
    if (organization.length > 160) {
      throw createError("Organization is too long.", 400);
    }
    if (role.length > 160) {
      throw createError("Role is too long.", 400);
    }
    if (teammates.length > 1000) {
      throw createError("Teammates field is too long.", 400);
    }
    if (startDate && !isValidDate(startDate)) {
      throw createError("Start date is invalid.", 400);
    }
    if (endDate && !isValidDate(endDate)) {
      throw createError("End date is invalid.", 400);
    }
    if (startDate && endDate && endDate < startDate) {
      throw createError("End date cannot be before start date.", 400);
    }
    if (achievement.length > 1000) {
      throw createError("Achievement is too long.", 400);
    }
    if (links.length > 2000) {
      throw createError("Links field is too long.", 400);
    }
    if (notes.length > 5000) {
      throw createError("Portfolio notes are too long.", 400);
    }
    return {
      type,
      title,
      organization,
      role,
      teammates,
      startDate,
      endDate,
      status,
      statusMode,
      cert,
      achievement,
      links,
      notes,
      createdAt: String(existing.createdAt || nowIso()),
      updatedAt: nowIso(),
    };
  }

  function compareCreatedDesc(left, right) {
    return String(right.createdAt || "").localeCompare(String(left.createdAt || ""));
  }

  function serializeUserDoc(uid, user, userData) {
    const email = String((userData && userData.email) || user.email || "").trim();
    const fallbackName = email.includes("@") ? email.split("@")[0] : "Workspace";
    return {
      id: uid,
      name: String((userData && userData.name) || user.displayName || fallbackName).trim(),
      email,
    };
  }

  function serializeNoteDoc(snapshot) {
    const data = snapshot.data() || {};
    return {
      id: snapshot.id,
      noteDate: String(data.noteDate || snapshot.id),
      content: String(data.content || ""),
      updatedAt: String(data.updatedAt || ""),
    };
  }

  function serializePlanDoc(snapshot) {
    const data = snapshot.data() || {};
    return {
      id: snapshot.id,
      planDate: String(data.planDate || ""),
      timeLabel: String(data.timeLabel || ""),
      title: String(data.title || ""),
      details: String(data.details || ""),
      createdAt: String(data.createdAt || ""),
      updatedAt: String(data.updatedAt || ""),
    };
  }

  function serializePortfolioDoc(snapshot) {
    const data = snapshot.data() || {};
    return {
      id: snapshot.id,
      type: String(data.type || "project"),
      title: String(data.title || ""),
      organization: String(data.organization || ""),
      role: String(data.role || ""),
      teammates: String(data.teammates || ""),
      startDate: data.startDate ? String(data.startDate) : null,
      endDate: data.endDate ? String(data.endDate) : null,
      status: String(data.status || "active"),
      statusMode: data.statusMode === "auto" ? "auto" : "manual",
      cert: Boolean(data.cert),
      achievement: String(data.achievement || ""),
      links: String(data.links || ""),
      notes: String(data.notes || ""),
      createdAt: String(data.createdAt || ""),
      updatedAt: String(data.updatedAt || ""),
    };
  }

  function serializeTodoDoc(snapshot) {
    const data = snapshot.data() || {};
    return {
      id: snapshot.id,
      title: String(data.title || ""),
      details: String(data.details || ""),
      subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
      dueDate: data.dueDate ? String(data.dueDate) : null,
      lane: String(data.lane || "ideas"),
      sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0,
      priority: String(data.priority || "medium"),
      done: Boolean(data.done),
      daily: Boolean(data.daily),
      dailyCompletedOn: data.dailyCompletedOn ? String(data.dailyCompletedOn) : null,
      streak: Number.isFinite(Number(data.streak)) ? Number(data.streak) : 0,
      createdAt: String(data.createdAt || ""),
      updatedAt: String(data.updatedAt || ""),
    };
  }

  function timestampTextOrNow(value) {
    const text = String(value || "");
    return text.length >= 10 && text.length <= 40 ? text : nowIso();
  }

  function normalizeExistingTodoData(todoId, data = {}, overrides = {}) {
    const dueDate = data.dueDate ? normalizeDateInput(data.dueDate) : null;
    const dailyCompletedOn = data.dailyCompletedOn ? normalizeDateInput(data.dailyCompletedOn) : null;
    let subtasks = [];
    try {
      subtasks = normalizeSubtasks(data.subtasks);
    } catch {
      subtasks = [];
    }
    const lane = LANE_SET.has(String(data.lane || "")) ? String(data.lane) : "ideas";
    const priority = PRIORITY_SET.has(String(data.priority || "")) ? String(data.priority) : "medium";
    const streak = Number(data.streak || 0);
    const title = String(data.title || "").trim().slice(0, 160);
    const normalized = {
      id: todoId,
      title: title.length >= 2 ? title : "Untitled task",
      details: String(data.details || "").trim().slice(0, 5000),
      subtasks,
      dueDate: dueDate && isValidDate(dueDate) ? dueDate : null,
      lane,
      sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0,
      priority,
      done: Boolean(data.done),
      daily: Boolean(data.daily),
      dailyCompletedOn: dailyCompletedOn && isValidDate(dailyCompletedOn) ? dailyCompletedOn : null,
      streak: Number.isInteger(streak) && streak >= 0 && streak <= 100000 ? streak : 0,
      createdAt: timestampTextOrNow(data.createdAt),
      updatedAt: timestampTextOrNow(data.updatedAt),
    };
    return { ...normalized, ...overrides };
  }

  async function ensureUserProfile(client, user, preferredName = "") {
    const ref = userRef(client, user.uid);
    const snapshot = await client.firestoreMod.getDoc(ref);
    const name = String(preferredName || user.displayName || (user.email || "").split("@")[0] || "Workspace").trim();
    const payload = {
      email: emailNormalize(user.email || ""),
      name,
      updatedAt: nowIso(),
    };
    if (!snapshot.exists()) {
      payload.createdAt = payload.updatedAt;
    }
    await client.firestoreMod.setDoc(ref, payload, { merge: true });
    const merged = snapshot.exists() ? { ...snapshot.data(), ...payload } : payload;
    return serializeUserDoc(user.uid, user, merged);
  }

  function comparePortfolioItems(left, right) {
    const statusRank = { planned: 0, active: 1, completed: 2 };
    return (
      (statusRank[left.status] ?? 9) - (statusRank[right.status] ?? 9) ||
      String(right.startDate || "0000-00-00").localeCompare(String(left.startDate || "0000-00-00")) ||
      compareCreatedDesc(left, right)
    );
  }

  async function getBootstrapPayload(client, user) {
    const [userSnapshot, noteSnapshots, planSnapshots, portfolioSnapshots, todoSnapshots] = await Promise.all([
      client.firestoreMod.getDoc(userRef(client, user.uid)),
      client.firestoreMod.getDocs(notesRef(client, user.uid)),
      client.firestoreMod.getDocs(plansRef(client, user.uid)),
      client.firestoreMod.getDocs(portfolioRef(client, user.uid)),
      client.firestoreMod.getDocs(todosRef(client, user.uid)),
    ]);

    const serializedUser = userSnapshot.exists()
      ? serializeUserDoc(user.uid, user, userSnapshot.data())
      : await ensureUserProfile(client, user);

    const notes = noteSnapshots.docs
      .map(serializeNoteDoc)
      .sort((left, right) => left.noteDate.localeCompare(right.noteDate));

    const plans = planSnapshots.docs
      .map(serializePlanDoc)
      .sort((left, right) =>
        left.planDate.localeCompare(right.planDate) ||
        (left.timeLabel || "99:99").localeCompare(right.timeLabel || "99:99") ||
        String(left.createdAt || "").localeCompare(String(right.createdAt || ""))
      );

    const portfolioItems = portfolioSnapshots.docs
      .map(serializePortfolioDoc)
      .sort(comparePortfolioItems);

    const todos = todoSnapshots.docs
      .map(serializeTodoDoc)
      .sort((left, right) =>
        String(left.lane || "").localeCompare(String(right.lane || "")) ||
        Number(left.sortOrder || 0) - Number(right.sortOrder || 0) ||
        compareCreatedDesc(left, right)
      );

    return {
      user: serializedUser,
      notes,
      plans,
      portfolioItems,
      todos,
    };
  }

  function serializeBootstrapSnapshots(user, snapshots) {
    const serializedUser = snapshots.user && snapshots.user.exists()
      ? serializeUserDoc(user.uid, user, snapshots.user.data())
      : serializeUserDoc(user.uid, user, null);

    const notes = snapshots.notes.docs
      .map(serializeNoteDoc)
      .sort((left, right) => left.noteDate.localeCompare(right.noteDate));

    const plans = snapshots.plans.docs
      .map(serializePlanDoc)
      .sort((left, right) =>
        left.planDate.localeCompare(right.planDate) ||
        (left.timeLabel || "99:99").localeCompare(right.timeLabel || "99:99") ||
        String(left.createdAt || "").localeCompare(String(right.createdAt || ""))
      );

    const portfolioItems = snapshots.portfolio.docs
      .map(serializePortfolioDoc)
      .sort(comparePortfolioItems);

    const todos = snapshots.todos.docs
      .map(serializeTodoDoc)
      .sort((left, right) =>
        String(left.lane || "").localeCompare(String(right.lane || "")) ||
        Number(left.sortOrder || 0) - Number(right.sortOrder || 0) ||
        compareCreatedDesc(left, right)
      );

    return {
      user: serializedUser,
      notes,
      plans,
      portfolioItems,
      todos,
    };
  }

  async function requireUser(client) {
    const user = await waitForAuthUser();
    if (!user) {
      throw createError("Session expired. Please sign in again.", 401);
    }
    return user;
  }

  async function getAllTodos(client, uid) {
    const snapshots = await client.firestoreMod.getDocs(todosRef(client, uid));
    return snapshots.docs.map(serializeTodoDoc);
  }

  async function nextSortOrder(client, uid, lane) {
    const todos = await getAllTodos(client, uid);
    const maxSortOrder = todos
      .filter((todo) => todo.lane === lane)
      .reduce((max, todo) => Math.max(max, Number(todo.sortOrder || 0)), 0);
    return maxSortOrder + 1024;
  }

  async function currentOrNextSortOrder(client, uid, todoId, lane) {
    const snapshot = await client.firestoreMod.getDoc(todoDocRef(client, uid, todoId));
    if (snapshot.exists()) {
      const data = snapshot.data() || {};
      if (String(data.lane || "") === lane && data.sortOrder != null) {
        return Number(data.sortOrder);
      }
    }
    return nextSortOrder(client, uid, lane);
  }

  function mapFirebaseError(error) {
    const code = String(error && error.code || "");
    if (code === "auth/email-already-in-use") {
      return createError("Email is already registered.", 409);
    }
    if (code === "auth/invalid-email") {
      return createError("Email is invalid.", 400);
    }
    if (code === "auth/weak-password") {
      return createError("Password must be at least 8 characters.", 400);
    }
    if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
      return createError("Email or password is incorrect.", 401);
    }
    if (code === "permission-denied") {
      return createError("You do not have permission to access this data.", 403);
    }
    if (code === "unavailable" || code === "auth/network-request-failed") {
      return createError("Cannot reach Firebase right now.", 0);
    }
    return createError(error && error.message ? error.message : "Request failed.", error && error.status ? error.status : 500);
  }

  function requireBody(options) {
    return options && typeof options.body === "object" && options.body ? options.body : {};
  }

  async function handleRegister(client, options) {
    const body = requireBody(options);
    const name = String(body.name || "").trim();
    const email = emailNormalize(body.email || "");
    const password = String(body.password || "");
    if (name.length < 2) {
      throw createError("Name is too short.", 400);
    }
    if (!email) {
      throw createError("Email is invalid.", 400);
    }
    if (password.length < 8) {
      throw createError("Password must be at least 8 characters.", 400);
    }

    const credential = await client.authMod.createUserWithEmailAndPassword(client.auth, email, password);
    if (name) {
      await client.authMod.updateProfile(credential.user, { displayName: name });
    }
    await ensureUserProfile(client, credential.user, name);
    const payload = await getBootstrapPayload(client, credential.user);
    payload.token = credential.user.uid;
    return payload;
  }

  async function handleLogin(client, options) {
    const body = requireBody(options);
    const email = emailNormalize(body.email || "");
    const password = String(body.password || "");
    const credential = await client.authMod.signInWithEmailAndPassword(client.auth, email, password);
    await ensureUserProfile(client, credential.user);
    const payload = await getBootstrapPayload(client, credential.user);
    payload.token = credential.user.uid;
    return payload;
  }

  async function handleLogout(client) {
    await client.authMod.signOut(client.auth);
    return { ok: true };
  }

  async function handleBootstrap(client) {
    const user = await requireUser(client);
    return getBootstrapPayload(client, user);
  }

  async function handleMe(client) {
    const user = await requireUser(client);
    const snapshot = await client.firestoreMod.getDoc(userRef(client, user.uid));
    return { user: serializeUserDoc(user.uid, user, snapshot.exists() ? snapshot.data() : null) };
  }

  async function handleUpsertNote(client, noteDate, options) {
    const body = requireBody(options);
    noteDate = normalizeDateInput(noteDate);
    if (!isValidDate(noteDate)) {
      throw createError("Date is invalid.", 400);
    }
    const user = await requireUser(client);
    const content = String(body.content || "").trim();
    if (content) {
      await client.firestoreMod.setDoc(noteDocRef(client, user.uid, noteDate), {
        noteDate,
        content,
        updatedAt: nowIso(),
      }, { merge: true });
    } else {
      await client.firestoreMod.deleteDoc(noteDocRef(client, user.uid, noteDate));
    }
    return { ok: true };
  }

  async function handleCreatePlan(client, options) {
    const body = requireBody(options);
    const planDate = normalizeDateInput(body.planDate);
    const timeLabel = String(body.timeLabel || "").trim();
    const title = String(body.title || "").trim();
    const details = String(body.details || "").trim();
    if (!isValidDate(planDate)) {
      throw createError("Plan date is invalid.", 400);
    }
    if (!isValidTime(timeLabel)) {
      throw createError("Time must use HH:MM format.", 400);
    }
    if (title.length < 2) {
      throw createError("Plan title is too short.", 400);
    }
    const user = await requireUser(client);
    const ref = client.firestoreMod.doc(plansRef(client, user.uid));
    const timestamp = nowIso();
    const plan = {
      id: ref.id,
      planDate,
      timeLabel,
      title,
      details,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await client.firestoreMod.setDoc(ref, plan);
    return { plan };
  }

  async function handleUpdatePlan(client, planId, options) {
    const body = requireBody(options);
    const planDate = normalizeDateInput(body.planDate);
    const timeLabel = String(body.timeLabel || "").trim();
    const title = String(body.title || "").trim();
    const details = String(body.details || "").trim();
    if (!isValidDate(planDate)) {
      throw createError("Plan date is invalid.", 400);
    }
    if (!isValidTime(timeLabel)) {
      throw createError("Time must use HH:MM format.", 400);
    }
    if (title.length < 2) {
      throw createError("Plan title is too short.", 400);
    }
    const user = await requireUser(client);
    const ref = planDocRef(client, user.uid, planId);
    const snapshot = await client.firestoreMod.getDoc(ref);
    if (!snapshot.exists()) {
      throw createError("Plan not found.", 404);
    }
    const previous = snapshot.data() || {};
    const plan = {
      id: planId,
      planDate,
      timeLabel,
      title,
      details,
      createdAt: String(previous.createdAt || nowIso()),
      updatedAt: nowIso(),
    };
    await client.firestoreMod.setDoc(ref, plan);
    return { plan };
  }

  async function handleDeletePlan(client, planId) {
    const user = await requireUser(client);
    await client.firestoreMod.deleteDoc(planDocRef(client, user.uid, planId));
    return { ok: true };
  }

  async function handleCreatePortfolioItem(client, options) {
    const body = requireBody(options);
    const user = await requireUser(client);
    const ref = client.firestoreMod.doc(portfolioRef(client, user.uid));
    const item = {
      id: ref.id,
      ...normalizePortfolioPayload(body),
    };
    await client.firestoreMod.setDoc(ref, item);
    return { portfolioItem: item };
  }

  async function handleUpdatePortfolioItem(client, itemId, options) {
    const body = requireBody(options);
    const user = await requireUser(client);
    const ref = portfolioDocRef(client, user.uid, itemId);
    const snapshot = await client.firestoreMod.getDoc(ref);
    if (!snapshot.exists()) {
      throw createError("Portfolio item not found.", 404);
    }
    const item = {
      id: itemId,
      ...normalizePortfolioPayload(body, snapshot.data() || {}),
    };
    await client.firestoreMod.setDoc(ref, item);
    return { portfolioItem: item };
  }

  async function handleDeletePortfolioItem(client, itemId) {
    const user = await requireUser(client);
    await client.firestoreMod.deleteDoc(portfolioDocRef(client, user.uid, itemId));
    return { ok: true };
  }

  async function handleCreateTodo(client, options) {
    const body = requireBody(options);
    const title = String(body.title || "").trim();
    const details = String(body.details || "").trim();
    const dueDate = body.dueDate == null ? null : normalizeDateInput(body.dueDate) || null;
    const lane = String(body.lane || "ideas").trim().toLowerCase() || "ideas";
    const priority = String(body.priority || "medium").trim().toLowerCase();
    const daily = Boolean(body.daily);
    const dailyCompletedOn = body.dailyCompletedOn == null ? null : normalizeDateInput(body.dailyCompletedOn) || null;
    const streak = Number(body.streak || 0);
    const finalLane = daily ? "today" : lane;
    const done = daily ? false : Boolean(body.done);
    const subtasks = normalizeSubtasks(body.subtasks);
    const sortOrder = normalizeSortOrder(body.sortOrder, 0);
    if (title.length < 2) {
      throw createError("Task title is too short.", 400);
    }
    if (dueDate && !isValidDate(dueDate)) {
      throw createError("Due date is invalid.", 400);
    }
    if (dailyCompletedOn && !isValidDate(dailyCompletedOn)) {
      throw createError("Daily completion date is invalid.", 400);
    }
    if (!Number.isInteger(streak) || streak < 0 || streak > 100000) {
      throw createError("Streak is invalid.", 400);
    }
    if (!PRIORITY_SET.has(priority)) {
      throw createError("Priority is invalid.", 400);
    }
    if (!LANE_SET.has(lane)) {
      throw createError("Lane is invalid.", 400);
    }

    const user = await requireUser(client);
    const ref = client.firestoreMod.doc(todosRef(client, user.uid));
    const timestamp = nowIso();
    const todo = {
      id: ref.id,
      title,
      details,
      subtasks,
      dueDate,
      lane: finalLane,
      sortOrder: sortOrder || await nextSortOrder(client, user.uid, finalLane),
      priority,
      done,
      daily,
      dailyCompletedOn,
      streak,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await client.firestoreMod.setDoc(ref, todo);
    return { todo };
  }

  async function handleUpdateTodo(client, todoId, options) {
    const body = requireBody(options);
    const title = String(body.title || "").trim();
    const details = String(body.details || "").trim();
    const dueDate = body.dueDate == null ? null : normalizeDateInput(body.dueDate) || null;
    const lane = String(body.lane || "ideas").trim().toLowerCase() || "ideas";
    const priority = String(body.priority || "medium").trim().toLowerCase();
    const daily = Boolean(body.daily);
    const dailyCompletedOn = body.dailyCompletedOn == null ? null : normalizeDateInput(body.dailyCompletedOn) || null;
    const streak = Number(body.streak || 0);
    const finalLane = daily ? "today" : lane;
    const done = daily ? false : Boolean(body.done);
    const subtasks = normalizeSubtasks(body.subtasks);
    const sortOrder = normalizeSortOrder(body.sortOrder, 0);
    if (title.length < 2) {
      throw createError("Task title is too short.", 400);
    }
    if (dueDate && !isValidDate(dueDate)) {
      throw createError("Due date is invalid.", 400);
    }
    if (dailyCompletedOn && !isValidDate(dailyCompletedOn)) {
      throw createError("Daily completion date is invalid.", 400);
    }
    if (!Number.isInteger(streak) || streak < 0 || streak > 100000) {
      throw createError("Streak is invalid.", 400);
    }
    if (!PRIORITY_SET.has(priority)) {
      throw createError("Priority is invalid.", 400);
    }
    if (!LANE_SET.has(lane)) {
      throw createError("Lane is invalid.", 400);
    }

    const user = await requireUser(client);
    const ref = todoDocRef(client, user.uid, todoId);
    const snapshot = await client.firestoreMod.getDoc(ref);
    if (!snapshot.exists()) {
      throw createError("Task not found.", 404);
    }
    const previous = snapshot.data() || {};
    const todo = {
      id: todoId,
      title,
      details,
      subtasks,
      dueDate,
      lane: finalLane,
      sortOrder: sortOrder || await currentOrNextSortOrder(client, user.uid, todoId, finalLane),
      priority,
      done,
      daily,
      dailyCompletedOn,
      streak,
      createdAt: String(previous.createdAt || nowIso()),
      updatedAt: nowIso(),
    };
    await client.firestoreMod.setDoc(ref, todo);
    return { todo };
  }

  async function handleUpdateTodoLane(client, todoId, lane) {
    const user = await requireUser(client);
    const ref = todoDocRef(client, user.uid, todoId);
    const snapshot = await client.firestoreMod.getDoc(ref);
    if (!snapshot.exists()) {
      throw createError("Task not found.", 404);
    }
    const previous = normalizeExistingTodoData(todoId, snapshot.data() || {});
    if (previous.daily) {
      throw createError("Daily tasks cannot be moved by lane.", 400);
    }
    const todo = {
      ...previous,
      lane: lane === "done" ? previous.lane : lane,
      sortOrder: lane === "done" ? Number(previous.sortOrder || 0) : await nextSortOrder(client, user.uid, lane),
      done: lane === "done",
      updatedAt: nowIso(),
    };
    await client.firestoreMod.setDoc(ref, todo);
    return { todo };
  }

  async function handleReorderTodos(client, options) {
    const body = requireBody(options);
    const updates = body.updates;
    if (!Array.isArray(updates) || !updates.length) {
      throw createError("Updates are required.", 400);
    }
    if (updates.length > 200) {
      throw createError("Too many updates.", 400);
    }
    const user = await requireUser(client);
    const normalizedUpdates = updates.map((item) => {
      if (!item || typeof item !== "object") {
        throw createError("Each update must be an object.", 400);
      }
      const todoId = String(item.id || "").trim();
      const lane = String(item.lane || "ideas").trim().toLowerCase() || "ideas";
      const sortOrder = normalizeSortOrder(item.sortOrder, 0);
      const done = Boolean(item.done);
      if (!todoId) {
        throw createError("Todo id is required.", 400);
      }
      if (!LANE_SET.has(lane)) {
        throw createError("Lane is invalid.", 400);
      }
      return {
        todoId,
        lane,
        sortOrder,
        done,
      };
    });
    const snapshots = await Promise.all(
      normalizedUpdates.map((update) => client.firestoreMod.getDoc(todoDocRef(client, user.uid, update.todoId)))
    );
    const batch = client.firestoreMod.writeBatch(client.db);
    normalizedUpdates.forEach((update, index) => {
      const snapshot = snapshots[index];
      if (!snapshot.exists()) {
        throw createError("Task not found.", 404);
      }
      const previous = normalizeExistingTodoData(update.todoId, snapshot.data() || {});
      if (previous.daily) {
        throw createError("Daily tasks cannot be reordered.", 400);
      }
      batch.set(
        todoDocRef(client, user.uid, update.todoId),
        {
          ...previous,
          lane: update.lane,
          sortOrder: update.sortOrder,
          done: update.done,
          updatedAt: nowIso(),
        }
      );
    });
    await batch.commit();
    const todos = await getAllTodos(client, user.uid);
    todos.sort((left, right) =>
      String(left.lane || "").localeCompare(String(right.lane || "")) ||
      Number(left.sortOrder || 0) - Number(right.sortOrder || 0) ||
      compareCreatedDesc(left, right)
    );
    return { todos };
  }

  async function handleClearCompleted(client) {
    const user = await requireUser(client);
    const todos = await getAllTodos(client, user.uid);
    const completed = todos.filter((todo) => todo.done);
    if (!completed.length) {
      return { ok: true };
    }
    const batch = client.firestoreMod.writeBatch(client.db);
    completed.forEach((todo) => {
      batch.delete(todoDocRef(client, user.uid, todo.id));
    });
    await batch.commit();
    return { ok: true };
  }

  async function handleDeleteTodo(client, todoId) {
    const user = await requireUser(client);
    await client.firestoreMod.deleteDoc(todoDocRef(client, user.uid, todoId));
    return { ok: true };
  }

  async function api(path, options = {}) {
    try {
      const client = await getClient();
      if (!client) {
        throw createError("Firebase adapter is disabled.", 500);
      }

      if (path === "/auth/register" && (options.method || "GET") === "POST") {
        return handleRegister(client, options);
      }
      if (path === "/auth/login" && (options.method || "GET") === "POST") {
        return handleLogin(client, options);
      }
      if (path === "/auth/logout" && (options.method || "GET") === "POST") {
        return handleLogout(client);
      }
      if (path === "/bootstrap" && (options.method || "GET") === "GET") {
        return handleBootstrap(client);
      }
      if (path === "/auth/me" && (options.method || "GET") === "GET") {
        return handleMe(client);
      }
      if (path === "/plans" && (options.method || "GET") === "POST") {
        return handleCreatePlan(client, options);
      }
      if (path === "/portfolio" && (options.method || "GET") === "POST") {
        return handleCreatePortfolioItem(client, options);
      }
      if (path === "/todos" && (options.method || "GET") === "POST") {
        return handleCreateTodo(client, options);
      }
      if (path === "/todos/reorder" && (options.method || "GET") === "POST") {
        return handleReorderTodos(client, options);
      }
      if (path === "/todos/clear-completed" && (options.method || "GET") === "POST") {
        return handleClearCompleted(client);
      }

      const noteMatch = /^\/notes\/(\d{4}-\d{2}-\d{2})$/.exec(path);
      const planMatch = /^\/plans\/([A-Za-z0-9_-]+)$/.exec(path);
      const portfolioMatch = /^\/portfolio\/([A-Za-z0-9_-]+)$/.exec(path);
      const todoLaneMatch = /^\/todos\/([A-Za-z0-9_-]+)\/lane\/(ideas|month|week|today|done)$/.exec(path);
      const todoMatch = /^\/todos\/([A-Za-z0-9_-]+)$/.exec(path);

      if (noteMatch && (options.method || "GET") === "PUT") {
        return handleUpsertNote(client, noteMatch[1], options);
      }
      if (planMatch && (options.method || "GET") === "PUT") {
        return handleUpdatePlan(client, planMatch[1], options);
      }
      if (planMatch && (options.method || "GET") === "DELETE") {
        return handleDeletePlan(client, planMatch[1]);
      }
      if (portfolioMatch && (options.method || "GET") === "PUT") {
        return handleUpdatePortfolioItem(client, portfolioMatch[1], options);
      }
      if (portfolioMatch && (options.method || "GET") === "DELETE") {
        return handleDeletePortfolioItem(client, portfolioMatch[1]);
      }
      if (todoLaneMatch && (options.method || "GET") === "PUT") {
        return handleUpdateTodoLane(client, todoLaneMatch[1], todoLaneMatch[2]);
      }
      if (todoMatch && (options.method || "GET") === "PUT") {
        return handleUpdateTodo(client, todoMatch[1], options);
      }
      if (todoMatch && (options.method || "GET") === "DELETE") {
        return handleDeleteTodo(client, todoMatch[1]);
      }

      throw createError("Not found", 404);
    } catch (error) {
      throw mapFirebaseError(error);
    }
  }

  async function subscribeBootstrap(onPayload, onError) {
    const client = await getClient();
    if (!client) {
      throw createError("Firebase adapter is disabled.", 500);
    }
    const user = await requireUser(client);
    await ensureUserProfile(client, user);

    const snapshots = {
      user: null,
      notes: null,
      plans: null,
      portfolio: null,
      todos: null,
    };
    const unsubscriptions = [];
    const emitIfReady = () => {
      if (snapshots.user && snapshots.notes && snapshots.plans && snapshots.portfolio && snapshots.todos) {
        onPayload(serializeBootstrapSnapshots(user, snapshots));
      }
    };
    const handleError = (error) => {
      if (typeof onError === "function") {
        onError(mapFirebaseError(error));
      }
    };

    unsubscriptions.push(
      client.firestoreMod.onSnapshot(userRef(client, user.uid), (snapshot) => {
        snapshots.user = snapshot;
        emitIfReady();
      }, handleError)
    );
    unsubscriptions.push(
      client.firestoreMod.onSnapshot(notesRef(client, user.uid), (snapshot) => {
        snapshots.notes = snapshot;
        emitIfReady();
      }, handleError)
    );
    unsubscriptions.push(
      client.firestoreMod.onSnapshot(plansRef(client, user.uid), (snapshot) => {
        snapshots.plans = snapshot;
        emitIfReady();
      }, handleError)
    );
    unsubscriptions.push(
      client.firestoreMod.onSnapshot(portfolioRef(client, user.uid), (snapshot) => {
        snapshots.portfolio = snapshot;
        emitIfReady();
      }, handleError)
    );
    unsubscriptions.push(
      client.firestoreMod.onSnapshot(todosRef(client, user.uid), (snapshot) => {
        snapshots.todos = snapshot;
        emitIfReady();
      }, handleError)
    );

    return () => {
      unsubscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }

  window.PlanboardFirebaseAdapter = {
    isEnabled,
    getClient,
    waitForAuthUser,
    api,
    subscribeBootstrap,
  };
})();
