from __future__ import annotations

import json
import mimetypes
import os
import re
import secrets
import sqlite3
from contextlib import closing
from datetime import UTC, date, datetime, timedelta
from hashlib import pbkdf2_hmac
from http import HTTPStatus
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
from uuid import uuid4


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "planboard.db"
SESSION_DAYS = 30
MAX_NAME_LENGTH = 80
MAX_TITLE_LENGTH = 160
MAX_DETAILS_LENGTH = 5000
MAX_NOTE_LENGTH = 10000
DEFAULT_ALLOWED_ORIGINS = os.getenv(
    "PLANBOARD_ALLOWED_ORIGINS",
    "http://127.0.0.1:4173,http://localhost:4173",
)
PUBLIC_FILES = {
    "index.html",
    "styles.css",
    "planboard-domain.js",
    "planner-utils.js",
    "portfolio-utils.js",
    "planboard-api-client.js",
    "app.js",
    "firebase-adapter.js",
    "config.js",
    "sw.js",
    "manifest.webmanifest",
}
PUBLIC_ICON_SUFFIXES = {".svg", ".png", ".ico", ".webp"}
DETAIL_METADATA_PATTERNS = {
    "weekly_days": re.compile(r"^\[\[weekly-days:([^\]]*)\]\]\s*", re.IGNORECASE),
    "lane": re.compile(r"^\[\[lane:(ideas|month|week|today|done)\]\]\s*", re.IGNORECASE),
    "project_id": re.compile(r"^\[\[project-id:([^\]]+)\]\]\s*", re.IGNORECASE),
    "project_title": re.compile(r"^\[\[project:([^\]]+)\]\]\s*", re.IGNORECASE),
    "missed": re.compile(r"^\[\[missed:1\]\]\s*", re.IGNORECASE),
}

mimetypes.add_type("application/manifest+json", ".webmanifest")


def now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    with closing(get_connection()) as connection:
        with connection:
            connection.executescript(
                """
                PRAGMA journal_mode=WAL;

            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS daily_notes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                note_date TEXT NOT NULL,
                content TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(user_id, note_date),
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS plans (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                plan_date TEXT NOT NULL,
                time_label TEXT,
                title TEXT NOT NULL,
                details TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS todos (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                details TEXT NOT NULL,
                subtasks TEXT NOT NULL DEFAULT '[]',
                due_date TEXT,
                lane TEXT NOT NULL DEFAULT 'ideas',
                sort_order REAL NOT NULL DEFAULT 0,
                priority TEXT NOT NULL,
                done INTEGER NOT NULL DEFAULT 0,
                daily INTEGER NOT NULL DEFAULT 0,
                daily_completed_on TEXT,
                streak INTEGER NOT NULL DEFAULT 0,
                project_id TEXT NOT NULL DEFAULT '',
                project_title TEXT NOT NULL DEFAULT '',
                weekly_days TEXT NOT NULL DEFAULT '[]',
                missed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS portfolio_items (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                organization TEXT NOT NULL,
                role TEXT NOT NULL,
                teammates TEXT NOT NULL,
                start_date TEXT,
                end_date TEXT,
                status TEXT NOT NULL,
                status_mode TEXT NOT NULL DEFAULT 'manual',
                cert INTEGER NOT NULL DEFAULT 0,
                achievement TEXT NOT NULL,
                links TEXT NOT NULL,
                notes TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS weekly_projects (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
                """
            )
            todo_columns = {
                row["name"] for row in connection.execute("PRAGMA table_info(todos)").fetchall()
            }
            if "lane" not in todo_columns:
                connection.execute(
                    "ALTER TABLE todos ADD COLUMN lane TEXT NOT NULL DEFAULT 'ideas'"
                )
            if "subtasks" not in todo_columns:
                connection.execute(
                    "ALTER TABLE todos ADD COLUMN subtasks TEXT NOT NULL DEFAULT '[]'"
                )
            if "sort_order" not in todo_columns:
                connection.execute(
                    "ALTER TABLE todos ADD COLUMN sort_order REAL NOT NULL DEFAULT 0"
                )
                connection.execute(
                    """
                    WITH ranked AS (
                        SELECT id, ROW_NUMBER() OVER (
                            PARTITION BY user_id, COALESCE(NULLIF(lane, ''), 'ideas')
                            ORDER BY COALESCE(due_date, '9999-12-31'), created_at DESC
                        ) AS position
                        FROM todos
                    )
                    UPDATE todos
                    SET sort_order = (
                        SELECT position
                        FROM ranked
                        WHERE ranked.id = todos.id
                    )
                    """
                )
            if "daily" not in todo_columns:
                connection.execute(
                    "ALTER TABLE todos ADD COLUMN daily INTEGER NOT NULL DEFAULT 0"
                )
            if "daily_completed_on" not in todo_columns:
                connection.execute(
                    "ALTER TABLE todos ADD COLUMN daily_completed_on TEXT"
                )
            if "streak" not in todo_columns:
                connection.execute(
                    "ALTER TABLE todos ADD COLUMN streak INTEGER NOT NULL DEFAULT 0"
                )
            if "project_id" not in todo_columns:
                connection.execute(
                    "ALTER TABLE todos ADD COLUMN project_id TEXT NOT NULL DEFAULT ''"
                )
            if "project_title" not in todo_columns:
                connection.execute(
                    "ALTER TABLE todos ADD COLUMN project_title TEXT NOT NULL DEFAULT ''"
                )
            if "weekly_days" not in todo_columns:
                connection.execute(
                    "ALTER TABLE todos ADD COLUMN weekly_days TEXT NOT NULL DEFAULT '[]'"
                )
            if "missed" not in todo_columns:
                connection.execute(
                    "ALTER TABLE todos ADD COLUMN missed INTEGER NOT NULL DEFAULT 0"
                )
            migrate_todo_metadata(connection)
            portfolio_columns = {
                row["name"] for row in connection.execute("PRAGMA table_info(portfolio_items)").fetchall()
            }
            if "cert" not in portfolio_columns:
                connection.execute(
                    "ALTER TABLE portfolio_items ADD COLUMN cert INTEGER NOT NULL DEFAULT 0"
                )
            if "status_mode" not in portfolio_columns:
                connection.execute(
                    "ALTER TABLE portfolio_items ADD COLUMN status_mode TEXT NOT NULL DEFAULT 'manual'"
                )


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 240000)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    salt_hex, digest_hex = encoded.split(":")
    comparison = hash_password(password, bytes.fromhex(salt_hex))
    return secrets.compare_digest(comparison, encoded)


def serialize_user(row: sqlite3.Row) -> dict:
    return {"id": row["id"], "name": row["name"], "email": row["email"]}


def serialize_note(row: sqlite3.Row) -> dict:
    return {"id": row["id"], "noteDate": row["note_date"], "content": row["content"], "updatedAt": row["updated_at"]}


def serialize_plan(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "planDate": row["plan_date"],
        "timeLabel": row["time_label"] or "",
        "title": row["title"],
        "details": row["details"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def serialize_weekly_project(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def row_value(row: sqlite3.Row, key: str, fallback=None):
    return row[key] if key in row.keys() else fallback


def serialize_todo(row: sqlite3.Row) -> dict:
    try:
        subtasks = json.loads(row["subtasks"] or "[]")
    except (TypeError, json.JSONDecodeError):
        subtasks = []
    parsed = parse_todo_details_metadata(row["details"])
    try:
        weekly_days = json.loads(row_value(row, "weekly_days", "[]") or "[]")
    except (TypeError, json.JSONDecodeError):
        weekly_days = []
    weekly_days = normalize_weekly_days(weekly_days or parsed["weekly_days"])
    project_id = str(row_value(row, "project_id", "") or parsed["project_id"]).strip()
    project_title = str(row_value(row, "project_title", "") or parsed["project_title"]).strip()
    return {
        "id": row["id"],
        "title": row["title"],
        "details": parsed["details"],
        "subtasks": subtasks if isinstance(subtasks, list) else [],
        "dueDate": row["due_date"],
        "lane": row["lane"] or "ideas",
        "sortOrder": row["sort_order"] if row["sort_order"] is not None else 0,
        "priority": row["priority"],
        "done": bool(row["done"]),
        "daily": bool(row["daily"]),
        "dailyCompletedOn": row["daily_completed_on"],
        "streak": row["streak"] if row["streak"] is not None else 0,
        "projectId": project_id,
        "projectTitle": project_title,
        "weeklyDays": weekly_days,
        "missed": bool(row_value(row, "missed", 0)) or parsed["missed"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def serialize_portfolio_item(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "type": row["type"],
        "title": row["title"],
        "organization": row["organization"],
        "role": row["role"],
        "teammates": row["teammates"],
        "startDate": row["start_date"],
        "endDate": row["end_date"],
        "status": row["status"],
        "statusMode": row["status_mode"] or "manual",
        "cert": bool(row["cert"]),
        "achievement": row["achievement"],
        "links": row["links"],
        "notes": row["notes"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def email_normalize(email: str) -> str:
    return email.strip().lower()


def is_valid_date(value: str) -> bool:
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return False
    try:
        return date.fromisoformat(value).isoformat() == value
    except ValueError:
        return False


def is_valid_time(value: str) -> bool:
    if value == "":
        return True
    match = re.fullmatch(r"(\d{2}):(\d{2})", value)
    if not match:
        return False
    hour = int(match.group(1))
    minute = int(match.group(2))
    return 0 <= hour <= 23 and 0 <= minute <= 59


def normalize_subtasks(value: object) -> list[dict]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValueError("Subtasks must be a list.")

    normalized = []
    for item in value[:32]:
        if not isinstance(item, dict):
            raise ValueError("Each subtask must be an object.")
        text = str(item.get("text", "")).strip()
        days = [
            str(day)
            for day in (item.get("days") if isinstance(item.get("days"), list) else [])
            if isinstance(day, str) and is_valid_date(day)
        ][:7]
        if not text and not days:
            continue
        normalized.append(
            {
                "id": str(item.get("id") or uuid4()),
                "text": text[:120],
                "done": bool(item.get("done")),
                "days": days,
            }
        )
    return normalized


def normalize_weekly_days(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    days = []
    for item in value:
        day = str(item or "").strip()
        if is_valid_date(day) and day not in days:
            days.append(day)
        if len(days) >= 21:
            break
    return days


def parse_todo_details_metadata(raw_details: object) -> dict:
    details = str(raw_details or "").strip()
    metadata = {
        "details": details,
        "project_id": "",
        "project_title": "",
        "weekly_days": [],
        "missed": False,
        "lane": "",
    }
    changed = True
    while changed:
        changed = False
        for key, pattern in DETAIL_METADATA_PATTERNS.items():
            match = pattern.match(details)
            if not match:
                continue
            changed = True
            if key == "weekly_days":
                metadata["weekly_days"] = normalize_weekly_days([
                    item.strip() for item in match.group(1).split(",")
                ])
            elif key == "missed":
                metadata["missed"] = True
            elif key == "lane":
                metadata["lane"] = match.group(1).lower()
            elif key == "project_id":
                metadata["project_id"] = match.group(1).strip()[:MAX_TITLE_LENGTH]
            elif key == "project_title":
                metadata["project_title"] = match.group(1).strip()[:MAX_TITLE_LENGTH]
            details = details[match.end():].strip()
            break
    metadata["details"] = details
    return metadata


def normalize_todo_weekly_metadata(payload: dict, details: str) -> tuple[str, str, list[str], bool, str]:
    parsed = parse_todo_details_metadata(details)
    clean_details = parsed["details"]
    project_id = str(payload.get("projectId", parsed["project_id"]) or "").strip()[:MAX_TITLE_LENGTH]
    project_title = str(payload.get("projectTitle", parsed["project_title"]) or "").strip()[:MAX_TITLE_LENGTH]
    weekly_days = normalize_weekly_days(payload.get("weeklyDays", parsed["weekly_days"]))
    missed = bool(payload.get("missed", parsed["missed"]))
    return project_id, project_title, weekly_days, missed, clean_details


def migrate_todo_metadata(connection: sqlite3.Connection) -> None:
    rows = connection.execute(
        "SELECT id, details, project_id, project_title, weekly_days, missed FROM todos"
    ).fetchall()
    for row in rows:
        parsed = parse_todo_details_metadata(row["details"])
        if parsed["details"] == row["details"] and not parsed["project_id"] and not parsed["project_title"] and not parsed["weekly_days"] and not parsed["missed"]:
            continue
        project_id = row["project_id"] or parsed["project_id"]
        project_title = row["project_title"] or parsed["project_title"]
        try:
            existing_days = json.loads(row["weekly_days"] or "[]")
        except (TypeError, json.JSONDecodeError):
            existing_days = []
        weekly_days = normalize_weekly_days(existing_days or parsed["weekly_days"])
        missed = bool(row["missed"]) or parsed["missed"]
        connection.execute(
            """
            UPDATE todos
            SET details = ?, project_id = ?, project_title = ?, weekly_days = ?, missed = ?
            WHERE id = ?
            """,
            (parsed["details"], project_id, project_title, json.dumps(weekly_days), 1 if missed else 0, row["id"]),
        )


def normalize_sort_order(value: object, fallback: float) -> float:
    if value in {None, ""}:
        return fallback
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        raise ValueError("Sort order is invalid.")
    if not (-1_000_000_000 <= parsed <= 1_000_000_000):
        raise ValueError("Sort order is invalid.")
    return parsed


def normalize_optional_date(value: object) -> str | None:
    normalized = str(value or "").strip()
    if not normalized:
        return None
    if not is_valid_date(normalized):
        raise ValueError("Date is invalid.")
    return normalized


def vietnam_today_iso(now: datetime | None = None) -> str:
    current = now or datetime.now(UTC)
    return (current + timedelta(hours=7)).date().isoformat()


def infer_portfolio_status(start_date: str | None, end_date: str | None, today: str | None = None) -> str:
    current_date = today or vietnam_today_iso()
    if start_date and start_date > current_date:
        return "planned"
    if end_date and end_date < current_date:
        return "completed"
    if start_date or end_date:
        return "active"
    return "planned"


def normalize_portfolio_payload(payload: dict, existing_created_at: str | None = None) -> dict:
    item_type = str(payload.get("type", "project")).strip().lower() or "project"
    title = str(payload.get("title", "")).strip()
    organization = str(payload.get("organization", "")).strip()
    role = str(payload.get("role", "")).strip()
    teammates = str(payload.get("teammates", "")).strip()
    requested_status = str(payload.get("status", "active")).strip().lower() or "active"
    status_mode = str(
        payload.get("statusMode", "auto" if payload.get("status") == "auto" else "manual")
    ).strip().lower() or "manual"
    raw_cert = payload.get("cert", False)
    if not isinstance(raw_cert, bool):
        raise ValueError("Certificate flag is invalid.")
    cert = raw_cert
    achievement = str(payload.get("achievement", "")).strip()
    links = str(payload.get("links", "")).strip()
    notes = str(payload.get("notes", "")).strip()
    start_date = normalize_optional_date(payload.get("startDate"))
    end_date = normalize_optional_date(payload.get("endDate"))

    if item_type not in {"project", "competition", "course"}:
        raise ValueError("Portfolio type is invalid.")
    if status_mode not in {"auto", "manual"}:
        raise ValueError("Portfolio status mode is invalid.")
    status = infer_portfolio_status(start_date, end_date) if status_mode == "auto" else requested_status
    if status not in {"planned", "active", "completed"}:
        raise ValueError("Portfolio status is invalid.")
    if len(title) < 2:
        raise ValueError("Portfolio title is too short.")
    if len(title) > MAX_TITLE_LENGTH:
        raise ValueError("Portfolio title is too long.")
    if len(organization) > MAX_TITLE_LENGTH:
        raise ValueError("Organization is too long.")
    if len(role) > MAX_TITLE_LENGTH:
        raise ValueError("Role is too long.")
    if len(teammates) > 1000:
        raise ValueError("Teammates field is too long.")
    if len(achievement) > 1000:
        raise ValueError("Achievement is too long.")
    if len(links) > 2000:
        raise ValueError("Links field is too long.")
    if len(notes) > MAX_DETAILS_LENGTH:
        raise ValueError("Portfolio notes are too long.")
    if start_date and end_date and end_date < start_date:
        raise ValueError("End date cannot be before start date.")

    timestamp = now_iso()
    return {
        "type": item_type,
        "title": title,
        "organization": organization,
        "role": role,
        "teammates": teammates,
        "start_date": start_date,
        "end_date": end_date,
        "status": status,
        "status_mode": status_mode,
        "cert": cert,
        "achievement": achievement,
        "links": links,
        "notes": notes,
        "created_at": existing_created_at or timestamp,
        "updated_at": timestamp,
    }


def create_session(connection: sqlite3.Connection, user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    created = now_iso()
    expires = (datetime.now(UTC) + timedelta(days=SESSION_DAYS)).isoformat(timespec="seconds")
    connection.execute(
        "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
        (token, user_id, expires, created),
    )
    return token


def get_user_by_token(connection: sqlite3.Connection, token: str) -> sqlite3.Row | None:
    row = connection.execute(
        """
        SELECT users.*
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = ? AND sessions.expires_at > ?
        """,
        (token, now_iso()),
    ).fetchone()
    if not row:
        return None
    return row


def bootstrap_payload(connection: sqlite3.Connection, user_id: str, user_row: sqlite3.Row) -> dict:
    notes = connection.execute(
        "SELECT * FROM daily_notes WHERE user_id = ? ORDER BY note_date",
        (user_id,),
    ).fetchall()
    plans = connection.execute(
        "SELECT * FROM plans WHERE user_id = ? ORDER BY plan_date, COALESCE(time_label, '99:99'), created_at",
        (user_id,),
    ).fetchall()
    todos = connection.execute(
        "SELECT * FROM todos WHERE user_id = ? ORDER BY lane, sort_order ASC, created_at DESC",
        (user_id,),
    ).fetchall()
    portfolio_items = connection.execute(
        """
        SELECT * FROM portfolio_items
        WHERE user_id = ?
        ORDER BY
            CASE status WHEN 'planned' THEN 0 WHEN 'active' THEN 1 ELSE 2 END,
            COALESCE(start_date, '9999-12-31') DESC,
            created_at DESC
        """,
        (user_id,),
    ).fetchall()
    weekly_projects = connection.execute(
        """
        SELECT * FROM weekly_projects
        WHERE user_id = ?
        ORDER BY created_at ASC, title ASC
        """,
        (user_id,),
    ).fetchall()
    return {
        "user": serialize_user(user_row),
        "notes": [serialize_note(row) for row in notes],
        "plans": [serialize_plan(row) for row in plans],
        "weeklyProjects": [serialize_weekly_project(row) for row in weekly_projects],
        "todos": [serialize_todo(row) for row in todos],
        "portfolioItems": [serialize_portfolio_item(row) for row in portfolio_items],
    }


class PlanboardHandler(BaseHTTPRequestHandler):
    server_version = "PlanboardSync/2.0"

    def next_sort_order(self, connection: sqlite3.Connection, user_id: str, lane: str) -> float:
        row = connection.execute(
            "SELECT MAX(sort_order) AS max_sort_order FROM todos WHERE user_id = ? AND lane = ?",
            (user_id, lane),
        ).fetchone()
        current_max = row["max_sort_order"] if row and row["max_sort_order"] is not None else 0
        return float(current_max) + 1024

    def current_or_next_sort_order(self, connection: sqlite3.Connection, user_id: str, todo_id: str, lane: str) -> float:
        row = connection.execute(
            "SELECT sort_order, lane FROM todos WHERE id = ? AND user_id = ?",
            (todo_id, user_id),
        ).fetchone()
        if row and row["sort_order"] is not None and row["lane"] == lane:
            return float(row["sort_order"])
        return self.next_sort_order(connection, user_id, lane)

    def route_path(self) -> str:
        return urlsplit(self.path).path.rstrip("/") or "/"

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_cors_headers()
        self.send_security_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self) -> None:
        route = self.route_path()
        if route == "/api/bootstrap":
            self.handle_bootstrap()
            return
        if route == "/api/auth/me":
            self.handle_me()
            return
        self.serve_static()

    def do_POST(self) -> None:
        route = self.route_path()
        if route == "/api/auth/register":
            self.handle_register()
            return
        if route == "/api/auth/login":
            self.handle_login()
            return
        if route == "/api/auth/logout":
            self.handle_logout()
            return
        if route == "/api/reset":
            self.handle_reset_workspace()
            return
        if route == "/api/todos/clear-completed":
            self.handle_clear_completed_todos()
            return
        if route == "/api/todos/reorder":
            self.handle_reorder_todos()
            return
        if route == "/api/plans":
            self.handle_create_plan()
            return
        if route == "/api/weekly-projects":
            self.handle_create_weekly_project()
            return
        if route == "/api/portfolio":
            self.handle_create_portfolio_item()
            return
        if route == "/api/todos":
            self.handle_create_todo()
            return
        self.respond_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def do_PUT(self) -> None:
        route = self.route_path()
        note_match = re.fullmatch(r"/api/notes/(\d{4}-\d{2}-\d{2})", route)
        plan_match = re.fullmatch(r"/api/plans/([a-f0-9-]+)", route)
        weekly_project_match = re.fullmatch(r"/api/weekly-projects/([a-f0-9-]+)", route)
        portfolio_match = re.fullmatch(r"/api/portfolio/([a-f0-9-]+)", route)
        todo_lane_match = re.fullmatch(r"/api/todos/([a-f0-9-]+)/lane/(ideas|month|week|today|done)", route)
        todo_match = re.fullmatch(r"/api/todos/([a-f0-9-]+)", route)
        if note_match:
            self.handle_upsert_note(note_match.group(1))
            return
        if plan_match:
            self.handle_update_plan(plan_match.group(1))
            return
        if weekly_project_match:
            self.handle_update_weekly_project(weekly_project_match.group(1))
            return
        if portfolio_match:
            self.handle_update_portfolio_item(portfolio_match.group(1))
            return
        if todo_lane_match:
            self.handle_update_todo_lane(todo_lane_match.group(1), todo_lane_match.group(2))
            return
        if todo_match:
            self.handle_update_todo(todo_match.group(1))
            return
        self.respond_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def do_DELETE(self) -> None:
        route = self.route_path()
        plan_match = re.fullmatch(r"/api/plans/([a-f0-9-]+)", route)
        weekly_project_match = re.fullmatch(r"/api/weekly-projects/([a-f0-9-]+)", route)
        portfolio_match = re.fullmatch(r"/api/portfolio/([a-f0-9-]+)", route)
        todo_match = re.fullmatch(r"/api/todos/([a-f0-9-]+)", route)
        if plan_match:
            self.handle_delete_plan(plan_match.group(1))
            return
        if weekly_project_match:
            self.handle_delete_weekly_project(weekly_project_match.group(1))
            return
        if portfolio_match:
            self.handle_delete_portfolio_item(portfolio_match.group(1))
            return
        if todo_match:
            self.handle_delete_todo(todo_match.group(1))
            return
        self.respond_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def serve_static(self) -> None:
        requested = self.route_path()
        if requested == "/":
            requested = "/index.html"
        file_path = (BASE_DIR / requested.lstrip("/")).resolve()
        try:
            relative_path = file_path.relative_to(BASE_DIR)
        except ValueError:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        relative_parts = relative_path.parts
        is_public_file = len(relative_parts) == 1 and relative_parts[0] in PUBLIC_FILES
        is_public_icon = (
            len(relative_parts) == 2
            and relative_parts[0] == "icons"
            and file_path.suffix.lower() in PUBLIC_ICON_SUFFIXES
        )
        if not is_public_file and not is_public_icon:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        if not file_path.exists() or file_path.is_dir():
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        mime, _ = mimetypes.guess_type(file_path.name)
        content = file_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_cors_headers()
        self.send_security_headers()
        self.send_header("Content-Type", mime or "application/octet-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def send_cors_headers(self) -> None:
        origin = self.headers.get("Origin", "")
        allowed = {item.strip() for item in DEFAULT_ALLOWED_ORIGINS.split(",") if item.strip()}
        allow_origin = ""
        if "*" in allowed:
            allow_origin = "*"
        elif origin and origin in allowed:
            allow_origin = origin
        if allow_origin:
            self.send_header("Access-Control-Allow-Origin", allow_origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

    def send_security_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=()",
        )
        self.send_header("X-Frame-Options", "DENY")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; "
            "script-src 'self' https://www.gstatic.com/firebasejs/; "
            "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com "
            "https://identitytoolkit.googleapis.com https://securetoken.googleapis.com "
            "https://firestore.googleapis.com; "
            "style-src 'self' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data:; "
            "manifest-src 'self'; "
            "base-uri 'self'; "
            "frame-ancestors 'none'",
        )

    def parse_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            return json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self.respond_json({"error": "Invalid JSON body."}, HTTPStatus.BAD_REQUEST)
            raise ValueError("invalid json")

    def auth_user(self) -> tuple[sqlite3.Connection, sqlite3.Row]:
        header = self.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            self.respond_json({"error": "Authentication required."}, HTTPStatus.UNAUTHORIZED)
            raise PermissionError("missing token")

        token = header.removeprefix("Bearer ").strip()
        connection = get_connection()
        user = get_user_by_token(connection, token)
        if not user:
            connection.close()
            self.respond_json({"error": "Invalid session."}, HTTPStatus.UNAUTHORIZED)
            raise PermissionError("invalid token")
        return connection, user

    def handle_register(self) -> None:
        try:
            payload = self.parse_json()
        except ValueError:
            return

        name = str(payload.get("name", "")).strip()
        email = email_normalize(str(payload.get("email", "")))
        password = str(payload.get("password", ""))
        if len(name) < 2:
            self.respond_json({"error": "Display name is too short."}, HTTPStatus.BAD_REQUEST)
            return
        if len(name) > MAX_NAME_LENGTH:
            self.respond_json({"error": "Display name is too long."}, HTTPStatus.BAD_REQUEST)
            return
        if "@" not in email:
            self.respond_json({"error": "Email is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        if len(password) < 8:
            self.respond_json({"error": "Password must be at least 8 characters."}, HTTPStatus.BAD_REQUEST)
            return

        with closing(get_connection()) as connection, connection:
            existing = connection.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
            if existing:
                self.respond_json({"error": "Email is already registered."}, HTTPStatus.CONFLICT)
                return

            user_id = str(uuid4())
            created = now_iso()
            connection.execute(
                "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, name, email, hash_password(password), created),
            )
            user = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            token = create_session(connection, user_id)
            payload = bootstrap_payload(connection, user_id, user)
            payload["token"] = token
            self.respond_json(payload, HTTPStatus.CREATED)

    def handle_login(self) -> None:
        try:
            payload = self.parse_json()
        except ValueError:
            return

        email = email_normalize(str(payload.get("email", "")))
        password = str(payload.get("password", ""))
        with closing(get_connection()) as connection, connection:
            user = connection.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            if not user or not verify_password(password, user["password_hash"]):
                self.respond_json({"error": "Email or password is incorrect."}, HTTPStatus.UNAUTHORIZED)
                return

            token = create_session(connection, user["id"])
            response = bootstrap_payload(connection, user["id"], user)
            response["token"] = token
            self.respond_json(response)

    def handle_logout(self) -> None:
        header = self.headers.get("Authorization", "")
        token = header.removeprefix("Bearer ").strip() if header.startswith("Bearer ") else ""
        with closing(get_connection()) as connection, connection:
            if token:
                connection.execute("DELETE FROM sessions WHERE token = ?", (token,))
        self.respond_json({"ok": True})

    def handle_bootstrap(self) -> None:
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return
        with connection:
            self.respond_json(bootstrap_payload(connection, user["id"], user))
        connection.close()

    def handle_me(self) -> None:
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return
        self.respond_json({"user": serialize_user(user)})
        connection.close()

    def handle_reset_workspace(self) -> None:
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return
        with connection:
            for table in ("daily_notes", "plans", "weekly_projects", "portfolio_items", "todos"):
                connection.execute(f"DELETE FROM {table} WHERE user_id = ?", (user["id"],))
        connection.close()
        self.respond_json({"ok": True})

    def handle_upsert_note(self, note_date: str) -> None:
        try:
            payload = self.parse_json()
        except ValueError:
            return
        if not is_valid_date(note_date):
            self.respond_json({"error": "Date is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return
        content = str(payload.get("content", "")).strip()
        if len(content) > MAX_NOTE_LENGTH:
            self.respond_json({"error": "Note is too long."}, HTTPStatus.BAD_REQUEST)
            connection.close()
            return
        with connection:
            if content:
                note_id = str(uuid4())
                connection.execute(
                    """
                    INSERT INTO daily_notes (id, user_id, note_date, content, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(user_id, note_date)
                    DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at
                    """,
                    (note_id, user["id"], note_date, content, now_iso()),
                )
            else:
                connection.execute(
                    "DELETE FROM daily_notes WHERE user_id = ? AND note_date = ?",
                    (user["id"], note_date),
                )
        connection.close()
        self.respond_json({"ok": True})

    def handle_create_plan(self) -> None:
        try:
            payload = self.parse_json()
        except ValueError:
            return

        plan_date = str(payload.get("planDate", "")).strip()
        time_label = str(payload.get("timeLabel", "")).strip()
        title = str(payload.get("title", "")).strip()
        details = str(payload.get("details", "")).strip()
        if not is_valid_date(plan_date):
            self.respond_json({"error": "Plan date is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        if not is_valid_time(time_label):
            self.respond_json({"error": "Time must use HH:MM format."}, HTTPStatus.BAD_REQUEST)
            return
        if len(title) < 2:
            self.respond_json({"error": "Plan title is too short."}, HTTPStatus.BAD_REQUEST)
            return
        if len(title) > MAX_TITLE_LENGTH:
            self.respond_json({"error": "Plan title is too long."}, HTTPStatus.BAD_REQUEST)
            return
        if len(details) > MAX_DETAILS_LENGTH:
            self.respond_json({"error": "Plan details are too long."}, HTTPStatus.BAD_REQUEST)
            return
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return

        plan_id = str(uuid4())
        timestamp = now_iso()
        with connection:
            connection.execute(
                """
                INSERT INTO plans (id, user_id, plan_date, time_label, title, details, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (plan_id, user["id"], plan_date, time_label, title, details, timestamp, timestamp),
            )
            plan = connection.execute("SELECT * FROM plans WHERE id = ?", (plan_id,)).fetchone()
        connection.close()
        self.respond_json({"plan": serialize_plan(plan)}, HTTPStatus.CREATED)

    def handle_delete_plan(self, plan_id: str) -> None:
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return
        with connection:
            connection.execute("DELETE FROM plans WHERE id = ? AND user_id = ?", (plan_id, user["id"]))
        connection.close()
        self.respond_json({"ok": True})

    def handle_update_plan(self, plan_id: str) -> None:
        try:
            payload = self.parse_json()
        except ValueError:
            return

        plan_date = str(payload.get("planDate", "")).strip()
        time_label = str(payload.get("timeLabel", "")).strip()
        title = str(payload.get("title", "")).strip()
        details = str(payload.get("details", "")).strip()
        if not is_valid_date(plan_date):
            self.respond_json({"error": "Plan date is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        if not is_valid_time(time_label):
            self.respond_json({"error": "Time must use HH:MM format."}, HTTPStatus.BAD_REQUEST)
            return
        if len(title) < 2:
            self.respond_json({"error": "Plan title is too short."}, HTTPStatus.BAD_REQUEST)
            return
        if len(title) > MAX_TITLE_LENGTH:
            self.respond_json({"error": "Plan title is too long."}, HTTPStatus.BAD_REQUEST)
            return
        if len(details) > MAX_DETAILS_LENGTH:
            self.respond_json({"error": "Plan details are too long."}, HTTPStatus.BAD_REQUEST)
            return
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return

        with connection:
            connection.execute(
                """
                UPDATE plans
                SET plan_date = ?, time_label = ?, title = ?, details = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (plan_date, time_label, title, details, now_iso(), plan_id, user["id"]),
            )
            plan = connection.execute(
                "SELECT * FROM plans WHERE id = ? AND user_id = ?",
                (plan_id, user["id"]),
            ).fetchone()
        connection.close()
        if not plan:
            self.respond_json({"error": "Plan not found."}, HTTPStatus.NOT_FOUND)
            return
        self.respond_json({"plan": serialize_plan(plan)})

    def handle_create_weekly_project(self) -> None:
        try:
            payload = self.parse_json()
        except ValueError:
            return

        title = str(payload.get("title", "")).strip()
        if len(title) < 1:
            self.respond_json({"error": "Weekly project title is required."}, HTTPStatus.BAD_REQUEST)
            return
        if len(title) > MAX_TITLE_LENGTH:
            self.respond_json({"error": "Weekly project title is too long."}, HTTPStatus.BAD_REQUEST)
            return
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return

        existing = connection.execute(
            "SELECT id FROM weekly_projects WHERE user_id = ? AND lower(title) = lower(?)",
            (user["id"], title),
        ).fetchone()
        if existing:
            connection.close()
            self.respond_json({"error": "Weekly project already exists."}, HTTPStatus.CONFLICT)
            return

        project_id = str(uuid4())
        timestamp = now_iso()
        with connection:
            connection.execute(
                """
                INSERT INTO weekly_projects (id, user_id, title, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (project_id, user["id"], title, timestamp, timestamp),
            )
            project = connection.execute(
                "SELECT * FROM weekly_projects WHERE id = ? AND user_id = ?",
                (project_id, user["id"]),
            ).fetchone()
        connection.close()
        self.respond_json({"weeklyProject": serialize_weekly_project(project)}, HTTPStatus.CREATED)

    def handle_update_weekly_project(self, project_id: str) -> None:
        try:
            payload = self.parse_json()
        except ValueError:
            return

        title = str(payload.get("title", "")).strip()
        if len(title) < 1:
            self.respond_json({"error": "Weekly project title is required."}, HTTPStatus.BAD_REQUEST)
            return
        if len(title) > MAX_TITLE_LENGTH:
            self.respond_json({"error": "Weekly project title is too long."}, HTTPStatus.BAD_REQUEST)
            return
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return

        duplicate = connection.execute(
            "SELECT id FROM weekly_projects WHERE user_id = ? AND id != ? AND lower(title) = lower(?)",
            (user["id"], project_id, title),
        ).fetchone()
        if duplicate:
            connection.close()
            self.respond_json({"error": "Weekly project already exists."}, HTTPStatus.CONFLICT)
            return

        with connection:
            connection.execute(
                """
                UPDATE weekly_projects
                SET title = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (title, now_iso(), project_id, user["id"]),
            )
            project = connection.execute(
                "SELECT * FROM weekly_projects WHERE id = ? AND user_id = ?",
                (project_id, user["id"]),
            ).fetchone()
        connection.close()
        if not project:
            self.respond_json({"error": "Weekly project not found."}, HTTPStatus.NOT_FOUND)
            return
        self.respond_json({"weeklyProject": serialize_weekly_project(project)})

    def handle_delete_weekly_project(self, project_id: str) -> None:
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return
        with connection:
            connection.execute(
                "DELETE FROM weekly_projects WHERE id = ? AND user_id = ?",
                (project_id, user["id"]),
            )
        connection.close()
        self.respond_json({"ok": True})

    def handle_create_portfolio_item(self) -> None:
        try:
            payload = self.parse_json()
            item_data = normalize_portfolio_payload(payload)
        except ValueError as error:
            self.respond_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
            return

        try:
            connection, user = self.auth_user()
        except PermissionError:
            return

        item_id = str(uuid4())
        with connection:
            connection.execute(
                """
                INSERT INTO portfolio_items (
                    id, user_id, type, title, organization, role, teammates,
                    start_date, end_date, status, status_mode, cert, achievement, links, notes,
                    created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item_id,
                    user["id"],
                    item_data["type"],
                    item_data["title"],
                    item_data["organization"],
                    item_data["role"],
                    item_data["teammates"],
                    item_data["start_date"],
                    item_data["end_date"],
                    item_data["status"],
                    item_data["status_mode"],
                    int(item_data["cert"]),
                    item_data["achievement"],
                    item_data["links"],
                    item_data["notes"],
                    item_data["created_at"],
                    item_data["updated_at"],
                ),
            )
            item = connection.execute(
                "SELECT * FROM portfolio_items WHERE id = ? AND user_id = ?",
                (item_id, user["id"]),
            ).fetchone()
        connection.close()
        self.respond_json({"portfolioItem": serialize_portfolio_item(item)}, HTTPStatus.CREATED)

    def handle_update_portfolio_item(self, item_id: str) -> None:
        try:
            payload = self.parse_json()
        except ValueError:
            return

        try:
            connection, user = self.auth_user()
        except PermissionError:
            return

        existing = connection.execute(
            "SELECT * FROM portfolio_items WHERE id = ? AND user_id = ?",
            (item_id, user["id"]),
        ).fetchone()
        if not existing:
            connection.close()
            self.respond_json({"error": "Portfolio item not found."}, HTTPStatus.NOT_FOUND)
            return

        try:
            item_data = normalize_portfolio_payload(payload, existing["created_at"])
        except ValueError as error:
            connection.close()
            self.respond_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
            return

        with connection:
            connection.execute(
                """
                UPDATE portfolio_items
                SET type = ?, title = ?, organization = ?, role = ?, teammates = ?,
                    start_date = ?, end_date = ?, status = ?, status_mode = ?, cert = ?, achievement = ?,
                    links = ?, notes = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    item_data["type"],
                    item_data["title"],
                    item_data["organization"],
                    item_data["role"],
                    item_data["teammates"],
                    item_data["start_date"],
                    item_data["end_date"],
                    item_data["status"],
                    item_data["status_mode"],
                    int(item_data["cert"]),
                    item_data["achievement"],
                    item_data["links"],
                    item_data["notes"],
                    item_data["updated_at"],
                    item_id,
                    user["id"],
                ),
            )
            item = connection.execute(
                "SELECT * FROM portfolio_items WHERE id = ? AND user_id = ?",
                (item_id, user["id"]),
            ).fetchone()
        connection.close()
        self.respond_json({"portfolioItem": serialize_portfolio_item(item)})

    def handle_delete_portfolio_item(self, item_id: str) -> None:
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return
        with connection:
            connection.execute(
                "DELETE FROM portfolio_items WHERE id = ? AND user_id = ?",
                (item_id, user["id"]),
            )
        connection.close()
        self.respond_json({"ok": True})

    def handle_create_todo(self) -> None:
        try:
            payload = self.parse_json()
        except ValueError:
            return

        title = str(payload.get("title", "")).strip()
        details = str(payload.get("details", "")).strip()
        project_id, project_title, weekly_days, missed, details = normalize_todo_weekly_metadata(payload, details)
        raw_due_date = payload.get("dueDate")
        due_date = str(raw_due_date).strip() if raw_due_date is not None else ""
        due_date = due_date or None
        lane = str(payload.get("lane", "ideas")).strip().lower() or "ideas"
        priority = str(payload.get("priority", "medium")).strip().lower()
        daily = 1 if bool(payload.get("daily")) else 0
        daily_completed_on = str(payload.get("dailyCompletedOn") or "").strip() or None
        try:
            subtasks = normalize_subtasks(payload.get("subtasks"))
            sort_order = normalize_sort_order(payload.get("sortOrder"), 0)
            streak = int(payload.get("streak") or 0)
        except ValueError as error:
            self.respond_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
            return
        if daily:
            lane = "today"
        if daily_completed_on and not is_valid_date(daily_completed_on):
            self.respond_json({"error": "Daily completion date is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        if streak < 0 or streak > 100000:
            self.respond_json({"error": "Streak is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        if len(title) < 2:
            self.respond_json({"error": "Task title is too short."}, HTTPStatus.BAD_REQUEST)
            return
        if len(title) > MAX_TITLE_LENGTH:
            self.respond_json({"error": "Task title is too long."}, HTTPStatus.BAD_REQUEST)
            return
        if len(details) > MAX_DETAILS_LENGTH:
            self.respond_json({"error": "Task details are too long."}, HTTPStatus.BAD_REQUEST)
            return
        if due_date and not is_valid_date(due_date):
            self.respond_json({"error": "Due date is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        if priority not in {"low", "medium", "high"}:
            self.respond_json({"error": "Priority is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        if lane not in {"ideas", "month", "week", "today", "done"}:
            self.respond_json({"error": "Lane is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return

        todo_id = str(uuid4())
        timestamp = now_iso()
        with connection:
            final_sort_order = sort_order if sort_order else self.next_sort_order(connection, user["id"], lane)
            connection.execute(
                """
                INSERT INTO todos (id, user_id, title, details, subtasks, due_date, lane, sort_order, priority, done, daily, daily_completed_on, streak, project_id, project_title, weekly_days, missed, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    todo_id,
                    user["id"],
                    title,
                    details,
                    json.dumps(subtasks),
                    due_date,
                    lane,
                    final_sort_order,
                    priority,
                    daily,
                    daily_completed_on,
                    streak,
                    project_id,
                    project_title,
                    json.dumps(weekly_days),
                    1 if missed else 0,
                    timestamp,
                    timestamp,
                ),
            )
            todo = connection.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
        connection.close()
        self.respond_json({"todo": serialize_todo(todo)}, HTTPStatus.CREATED)

    def handle_update_todo(self, todo_id: str) -> None:
        try:
            payload = self.parse_json()
        except ValueError:
            return

        title = str(payload.get("title", "")).strip()
        details = str(payload.get("details", "")).strip()
        project_id, project_title, weekly_days, missed, details = normalize_todo_weekly_metadata(payload, details)
        raw_due_date = payload.get("dueDate")
        due_date = str(raw_due_date).strip() if raw_due_date is not None else ""
        due_date = due_date or None
        lane = str(payload.get("lane", "ideas")).strip().lower() or "ideas"
        priority = str(payload.get("priority", "medium")).strip().lower()
        done = 1 if bool(payload.get("done")) else 0
        daily = 1 if bool(payload.get("daily")) else 0
        daily_completed_on = str(payload.get("dailyCompletedOn") or "").strip() or None
        try:
            subtasks = normalize_subtasks(payload.get("subtasks"))
            sort_order = normalize_sort_order(payload.get("sortOrder"), 0)
            streak = int(payload.get("streak") or 0)
        except ValueError as error:
            self.respond_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
            return
        if daily:
            lane = "today"
            done = 0
        if daily_completed_on and not is_valid_date(daily_completed_on):
            self.respond_json({"error": "Daily completion date is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        if streak < 0 or streak > 100000:
            self.respond_json({"error": "Streak is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        if len(title) < 2:
            self.respond_json({"error": "Task title is too short."}, HTTPStatus.BAD_REQUEST)
            return
        if len(title) > MAX_TITLE_LENGTH:
            self.respond_json({"error": "Task title is too long."}, HTTPStatus.BAD_REQUEST)
            return
        if len(details) > MAX_DETAILS_LENGTH:
            self.respond_json({"error": "Task details are too long."}, HTTPStatus.BAD_REQUEST)
            return
        if due_date and not is_valid_date(due_date):
            self.respond_json({"error": "Due date is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        if priority not in {"low", "medium", "high"}:
            self.respond_json({"error": "Priority is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        if lane not in {"ideas", "month", "week", "today", "done"}:
            self.respond_json({"error": "Lane is invalid."}, HTTPStatus.BAD_REQUEST)
            return
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return

        with connection:
            connection.execute(
                """
                UPDATE todos
                SET title = ?, details = ?, subtasks = ?, due_date = ?, lane = ?, sort_order = ?, priority = ?, done = ?, daily = ?, daily_completed_on = ?, streak = ?, project_id = ?, project_title = ?, weekly_days = ?, missed = ?, updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (
                    title,
                    details,
                    json.dumps(subtasks),
                    due_date,
                    lane,
                    sort_order if sort_order else self.current_or_next_sort_order(connection, user["id"], todo_id, lane),
                    priority,
                    done,
                    daily,
                    daily_completed_on,
                    streak,
                    project_id,
                    project_title,
                    json.dumps(weekly_days),
                    1 if missed else 0,
                    now_iso(),
                    todo_id,
                    user["id"],
                ),
            )
            todo = connection.execute("SELECT * FROM todos WHERE id = ? AND user_id = ?", (todo_id, user["id"])).fetchone()
        connection.close()
        if not todo:
            self.respond_json({"error": "Task not found."}, HTTPStatus.NOT_FOUND)
            return
        self.respond_json({"todo": serialize_todo(todo)})

    def handle_update_todo_lane(self, todo_id: str, lane: str) -> None:
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return
        existing = connection.execute(
            "SELECT daily FROM todos WHERE id = ? AND user_id = ?",
            (todo_id, user["id"]),
        ).fetchone()
        if not existing:
            connection.close()
            self.respond_json({"error": "Task not found."}, HTTPStatus.NOT_FOUND)
            return
        if existing["daily"]:
            connection.close()
            self.respond_json({"error": "Daily tasks cannot be moved by lane."}, HTTPStatus.BAD_REQUEST)
            return
        done = 1 if lane == "done" else 0
        with connection:
            connection.execute(
                """
                UPDATE todos
                SET lane = CASE WHEN ? = 'done' THEN lane ELSE ? END,
                    sort_order = CASE WHEN ? = 'done' THEN sort_order ELSE ? END,
                    done = ?,
                    updated_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (lane, lane, lane, self.next_sort_order(connection, user["id"], lane), done, now_iso(), todo_id, user["id"]),
            )
            todo = connection.execute(
                "SELECT * FROM todos WHERE id = ? AND user_id = ?",
                (todo_id, user["id"]),
            ).fetchone()
        connection.close()
        if not todo:
            self.respond_json({"error": "Task not found."}, HTTPStatus.NOT_FOUND)
            return
        self.respond_json({"todo": serialize_todo(todo)})

    def handle_reorder_todos(self) -> None:
        try:
            payload = self.parse_json()
        except ValueError:
            return
        updates = payload.get("updates")
        if not isinstance(updates, list) or not updates:
            self.respond_json({"error": "Updates are required."}, HTTPStatus.BAD_REQUEST)
            return
        if len(updates) > 200:
            self.respond_json({"error": "Too many updates."}, HTTPStatus.BAD_REQUEST)
            return
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return
        try:
            normalized_updates = []
            for item in updates:
                if not isinstance(item, dict):
                    raise ValueError("Each update must be an object.")
                todo_id = str(item.get("id", "")).strip()
                lane = str(item.get("lane", "ideas")).strip().lower() or "ideas"
                if not todo_id:
                    raise ValueError("Todo id is required.")
                if lane not in {"ideas", "month", "week", "today", "done"}:
                    raise ValueError("Lane is invalid.")
                normalized_updates.append(
                    (
                        todo_id,
                        lane,
                        normalize_sort_order(item.get("sortOrder"), 0),
                        1 if bool(item.get("done")) else 0,
                    )
                )
        except ValueError as error:
            connection.close()
            self.respond_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)
            return

        for todo_id, _, _, _ in normalized_updates:
            existing = connection.execute(
                "SELECT daily FROM todos WHERE id = ? AND user_id = ?",
                (todo_id, user["id"]),
            ).fetchone()
            if not existing:
                connection.close()
                self.respond_json({"error": "Task not found."}, HTTPStatus.NOT_FOUND)
                return
            if existing["daily"]:
                connection.close()
                self.respond_json({"error": "Daily tasks cannot be reordered."}, HTTPStatus.BAD_REQUEST)
                return

        with connection:
            for todo_id, lane, sort_order, done in normalized_updates:
                connection.execute(
                    """
                    UPDATE todos
                    SET lane = ?, sort_order = ?, done = ?, updated_at = ?
                    WHERE id = ? AND user_id = ?
                    """,
                    (lane, sort_order, done, now_iso(), todo_id, user["id"]),
                )
            todos = connection.execute(
                "SELECT * FROM todos WHERE user_id = ? ORDER BY lane, sort_order ASC, created_at DESC",
                (user["id"],),
            ).fetchall()
        connection.close()
        self.respond_json({"todos": [serialize_todo(row) for row in todos]})

    def handle_clear_completed_todos(self) -> None:
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return
        with connection:
            connection.execute(
                "DELETE FROM todos WHERE user_id = ? AND done = 1",
                (user["id"],),
            )
        connection.close()
        self.respond_json({"ok": True})

    def handle_delete_todo(self, todo_id: str) -> None:
        try:
            connection, user = self.auth_user()
        except PermissionError:
            return
        with connection:
            connection.execute("DELETE FROM todos WHERE id = ? AND user_id = ?", (todo_id, user["id"]))
        connection.close()
        self.respond_json({"ok": True})

    def respond_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        content = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_cors_headers()
        self.send_security_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


def run() -> None:
    init_db()
    host = os.getenv("PLANBOARD_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "4173"))
    server = ThreadingHTTPServer((host, port), PlanboardHandler)
    print(f"planner. running at http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
