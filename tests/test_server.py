from __future__ import annotations

import json
import shutil
import tempfile
import threading
import unittest
from uuid import uuid4
from http import HTTPStatus
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import server


class PlanboardServerTest(unittest.TestCase):
    def setUp(self) -> None:
        temp_root = Path(tempfile.gettempdir()) / "planboard-test-data"
        temp_root.mkdir(parents=True, exist_ok=True)
        self.temp_path = temp_root / str(uuid4())
        self.temp_path.mkdir()
        self.previous_data_dir = server.DATA_DIR
        self.previous_db_path = server.DB_PATH
        server.DATA_DIR = self.temp_path
        server.DB_PATH = server.DATA_DIR / "planboard-test.db"
        server.init_db()

        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.PlanboardHandler)
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        self.base_url = f"http://127.0.0.1:{self.httpd.server_port}"

    def tearDown(self) -> None:
        self.httpd.shutdown()
        self.httpd.server_close()
        self.thread.join(timeout=2)
        server.DATA_DIR = self.previous_data_dir
        server.DB_PATH = self.previous_db_path
        shutil.rmtree(self.temp_path, ignore_errors=True)

    def request(self, method: str, path: str, body: dict | None = None, token: str = "", origin: str = ""):
        data = None if body is None else json.dumps(body).encode("utf-8")
        headers = {"Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = "application/json"
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if origin:
            headers["Origin"] = origin
        request = Request(f"{self.base_url}{path}", data=data, headers=headers, method=method)
        def parse_payload(raw: str):
            try:
                return json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return {}

        try:
            with urlopen(request, timeout=5) as response:
                payload = response.read().decode("utf-8")
                return response.status, dict(response.headers), parse_payload(payload)
        except HTTPError as error:
            payload = error.read().decode("utf-8")
            return error.code, dict(error.headers), parse_payload(payload)

    def test_auth_and_todo_flow(self) -> None:
        status, _, payload = self.request(
            "POST",
            "/api/auth/register",
            {"name": "Test User", "email": "test@example.com", "password": "password123"},
        )
        self.assertEqual(status, HTTPStatus.CREATED)
        token = payload["token"]

        status, _, payload = self.request(
            "POST",
            "/api/todos",
            {
                "title": "Write tests",
                "details": "Cover core API flow",
                "lane": "today",
                "priority": "high",
                "dueDate": "2026-05-01",
            },
            token=token,
        )
        self.assertEqual(status, HTTPStatus.CREATED)
        todo_id = payload["todo"]["id"]

        status, _, payload = self.request("GET", "/api/bootstrap", token=token)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(len(payload["todos"]), 1)
        self.assertEqual(payload["todos"][0]["id"], todo_id)

        status, _, payload = self.request(
            "PUT",
            f"/api/todos/{todo_id}",
            {
                "title": "Write more tests",
                "details": "",
                "lane": "today",
                "priority": "medium",
                "done": True,
                "subtasks": [],
            },
            token=token,
        )
        self.assertEqual(status, HTTPStatus.OK)
        self.assertTrue(payload["todo"]["done"])

    def test_validation_and_auth_failures(self) -> None:
        status, _, payload = self.request("GET", "/api/bootstrap")
        self.assertEqual(status, HTTPStatus.UNAUTHORIZED)
        self.assertEqual(payload["error"], "Authentication required.")

        status, _, payload = self.request(
            "POST",
            "/api/auth/register",
            {"name": "T", "email": "bad", "password": "short"},
        )
        self.assertEqual(status, HTTPStatus.BAD_REQUEST)

    def test_daily_todo_fields_are_persisted(self) -> None:
        status, _, payload = self.request(
            "POST",
            "/api/auth/register",
            {"name": "Daily User", "email": "daily@example.com", "password": "password123"},
        )
        self.assertEqual(status, HTTPStatus.CREATED)
        token = payload["token"]

        status, _, payload = self.request(
            "POST",
            "/api/todos",
            {
                "title": "Drink water",
                "details": "",
                "lane": "ideas",
                "priority": "medium",
                "daily": True,
                "dailyCompletedOn": "2026-05-01",
                "streak": 3,
            },
            token=token,
        )
        self.assertEqual(status, HTTPStatus.CREATED)
        self.assertTrue(payload["todo"]["daily"])
        self.assertFalse(payload["todo"]["done"])
        self.assertEqual(payload["todo"]["lane"], "today")
        self.assertEqual(payload["todo"]["dailyCompletedOn"], "2026-05-01")
        self.assertEqual(payload["todo"]["streak"], 3)
        todo_id = payload["todo"]["id"]

        status, _, payload = self.request("PUT", f"/api/todos/{todo_id}/lane/done", token=token)
        self.assertEqual(status, HTTPStatus.BAD_REQUEST)
        self.assertEqual(payload["error"], "Daily tasks cannot be moved by lane.")

        status, _, payload = self.request(
            "POST",
            "/api/todos/reorder",
            {"updates": [{"id": todo_id, "lane": "today", "sortOrder": 1024, "done": False}]},
            token=token,
        )
        self.assertEqual(status, HTTPStatus.BAD_REQUEST)
        self.assertEqual(payload["error"], "Daily tasks cannot be reordered.")

    def test_weekly_todo_metadata_uses_explicit_fields(self) -> None:
        status, _, payload = self.request(
            "POST",
            "/api/auth/register",
            {"name": "Weekly Todo User", "email": "weekly-todo@example.com", "password": "password123"},
        )
        self.assertEqual(status, HTTPStatus.CREATED)
        token = payload["token"]

        status, _, payload = self.request(
            "POST",
            "/api/todos",
            {
                "title": "Read chapter",
                "details": "Plain note",
                "lane": "ideas",
                "priority": "medium",
                "projectId": "project-1",
                "projectTitle": "Exam prep",
                "weeklyDays": ["2026-06-15", "2026-06-16"],
                "missed": True,
                "subtasks": [{"id": "sub-1", "text": "pages 1-10", "days": ["2026-06-15"], "done": False}],
            },
            token=token,
        )
        self.assertEqual(status, HTTPStatus.CREATED)
        todo = payload["todo"]
        self.assertEqual(todo["details"], "Plain note")
        self.assertEqual(todo["projectId"], "project-1")
        self.assertEqual(todo["projectTitle"], "Exam prep")
        self.assertEqual(todo["weeklyDays"], ["2026-06-15", "2026-06-16"])
        self.assertTrue(todo["missed"])

    def test_legacy_weekly_markers_are_migrated(self) -> None:
        status, _, payload = self.request(
            "POST",
            "/api/auth/register",
            {"name": "Legacy Weekly User", "email": "legacy-weekly@example.com", "password": "password123"},
        )
        self.assertEqual(status, HTTPStatus.CREATED)
        token = payload["token"]

        status, _, payload = self.request(
            "POST",
            "/api/todos",
            {
                "title": "Legacy task",
                "details": "[[weekly-days:2026-06-15]][[project-id:p1]][[project:Legacy Project]][[missed:1]] Actual note",
                "lane": "ideas",
                "priority": "medium",
            },
            token=token,
        )
        self.assertEqual(status, HTTPStatus.CREATED)
        todo = payload["todo"]
        self.assertEqual(todo["details"], "Actual note")
        self.assertEqual(todo["projectId"], "p1")
        self.assertEqual(todo["projectTitle"], "Legacy Project")
        self.assertEqual(todo["weeklyDays"], ["2026-06-15"])
        self.assertTrue(todo["missed"])

    def test_weekly_project_flow(self) -> None:
        status, _, payload = self.request(
            "POST",
            "/api/auth/register",
            {"name": "Weekly User", "email": "weekly@example.com", "password": "password123"},
        )
        self.assertEqual(status, HTTPStatus.CREATED)
        token = payload["token"]

        status, _, payload = self.request("POST", "/api/weekly-projects", {"title": "Contest prep"}, token=token)
        self.assertEqual(status, HTTPStatus.CREATED)
        project_id = payload["weeklyProject"]["id"]
        self.assertEqual(payload["weeklyProject"]["title"], "Contest prep")

        status, _, payload = self.request("GET", "/api/bootstrap", token=token)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(payload["weeklyProjects"][0]["id"], project_id)
        self.assertEqual(payload["portfolioItems"], [])

        status, _, payload = self.request("PUT", f"/api/weekly-projects/{project_id}", {"title": "Olympiad prep"}, token=token)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(payload["weeklyProject"]["title"], "Olympiad prep")

        status, _, _ = self.request("DELETE", f"/api/weekly-projects/{project_id}", token=token)
        self.assertEqual(status, HTTPStatus.OK)
        status, _, payload = self.request("GET", "/api/bootstrap", token=token)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(payload["weeklyProjects"], [])

    def test_weekly_archive_flow_and_reset(self) -> None:
        status, _, payload = self.request(
            "POST",
            "/api/auth/register",
            {"name": "Archive User", "email": "archive@example.com", "password": "password123"},
        )
        self.assertEqual(status, HTTPStatus.CREATED)
        token = payload["token"]
        archive = {
            "id": "2026-06-15-archive",
            "label": "Jun 15, 2026 - Jun 21, 2026",
            "completed": 3,
            "total": 5,
            "carried": 2,
            "missed": 1,
            "progress": 60,
            "days": [{"done": 1, "total": 1}, {"done": 2, "total": 4}],
            "tasks": [{"title": "Task one", "done": True, "projectId": "project-1", "projectTitle": "Exam prep"}],
            "createdAt": "2026-06-21T17:00:00+00:00",
        }
        status, _, payload = self.request("POST", "/api/weekly-archives", archive, token=token)
        self.assertEqual(status, HTTPStatus.CREATED)
        self.assertEqual(payload["weeklyArchive"]["id"], archive["id"])
        self.assertEqual(payload["weeklyArchive"]["days"][1]["done"], 2)

        status, _, payload = self.request("GET", "/api/bootstrap", token=token)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(len(payload["weeklyArchives"]), 1)
        self.assertEqual(payload["weeklyArchives"][0]["progress"], 60)

        status, _, payload = self.request("DELETE", f"/api/weekly-archives/{archive['id']}", token=token)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertTrue(payload["ok"])

        status, _, payload = self.request("POST", "/api/weekly-archives", archive, token=token)
        self.assertEqual(status, HTTPStatus.CREATED)
        status, _, payload = self.request("POST", "/api/reset", token=token)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertTrue(payload["ok"])
        status, _, payload = self.request("GET", "/api/bootstrap", token=token)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(payload["weeklyArchives"], [])

    def test_weekly_archive_ids_are_stable_across_users(self) -> None:
        tokens = []
        for index in range(2):
            status, _, payload = self.request(
                "POST",
                "/api/auth/register",
                {"name": f"Archive User {index}", "email": f"archive-{index}@example.com", "password": "password123"},
            )
            self.assertEqual(status, HTTPStatus.CREATED)
            tokens.append(payload["token"])

        archive = {
            "id": "2026-06-22-archive",
            "label": "Jun 22, 2026 - Jun 28, 2026",
            "completed": 1,
            "total": 2,
            "carried": 1,
            "missed": 0,
            "progress": 50,
            "days": [],
            "tasks": [],
            "createdAt": "2026-06-28T17:00:00+00:00",
        }
        archive_ids = []
        for token in tokens:
            status, _, payload = self.request("POST", "/api/weekly-archives", archive, token=token)
            self.assertEqual(status, HTTPStatus.CREATED)
            archive_ids.append(payload["weeklyArchive"]["id"])
            status, _, retry_payload = self.request("POST", "/api/weekly-archives", archive, token=token)
            self.assertEqual(status, HTTPStatus.CREATED)
            self.assertEqual(retry_payload["weeklyArchive"]["id"], archive_ids[-1])

        self.assertNotEqual(archive_ids[0], archive_ids[1])
        for token in tokens:
            status, _, payload = self.request("GET", "/api/bootstrap", token=token)
            self.assertEqual(status, HTTPStatus.OK)
            self.assertEqual(len(payload["weeklyArchives"]), 1)

    def test_portfolio_flow(self) -> None:
        status, _, payload = self.request(
            "POST",
            "/api/auth/register",
            {"name": "Portfolio User", "email": "portfolio@example.com", "password": "password123"},
        )
        self.assertEqual(status, HTTPStatus.CREATED)
        token = payload["token"]

        status, _, payload = self.request(
            "POST",
            "/api/portfolio",
            {
                "type": "course",
                "title": "Advanced AI Course",
                "organization": "City Lab",
                "role": "Team lead",
                "teammates": "An, Binh",
                "startDate": "2000-01-01",
                "endDate": "2000-01-02",
                "status": "active",
                "statusMode": "auto",
                "cert": True,
                "achievement": "First prize",
                "links": "https://example.com",
                "notes": "Built the prototype and pitch deck.",
            },
            token=token,
        )
        self.assertEqual(status, HTTPStatus.CREATED)
        item_id = payload["portfolioItem"]["id"]
        self.assertEqual(payload["portfolioItem"]["type"], "course")
        self.assertEqual(payload["portfolioItem"]["status"], "completed")
        self.assertEqual(payload["portfolioItem"]["statusMode"], "auto")
        self.assertTrue(payload["portfolioItem"]["cert"])
        self.assertEqual(payload["portfolioItem"]["achievement"], "First prize")

        status, _, payload = self.request("GET", "/api/bootstrap", token=token)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(len(payload["portfolioItems"]), 1)
        self.assertEqual(payload["portfolioItems"][0]["id"], item_id)

        status, _, payload = self.request(
            "PUT",
            f"/api/portfolio/{item_id}",
            {
                "type": "competition",
                "title": "AI Challenge",
                "organization": "City Lab",
                "role": "Presenter",
                "teammates": "An, Binh",
                "startDate": "2000-01-01",
                "endDate": "2000-01-02",
                "status": "active",
                "statusMode": "manual",
                "cert": False,
                "achievement": "First prize",
                "links": "https://example.com",
                "notes": "Final presentation owner.",
            },
            token=token,
        )
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(payload["portfolioItem"]["type"], "competition")
        self.assertEqual(payload["portfolioItem"]["status"], "active")
        self.assertEqual(payload["portfolioItem"]["statusMode"], "manual")
        self.assertEqual(payload["portfolioItem"]["role"], "Presenter")
        self.assertFalse(payload["portfolioItem"]["cert"])

        status, _, payload = self.request("DELETE", f"/api/portfolio/{item_id}", token=token)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertTrue(payload["ok"])

    def test_static_server_does_not_expose_project_files(self) -> None:
        status, _, _ = self.request("GET", "/package.json")
        self.assertEqual(status, HTTPStatus.NOT_FOUND)

        status, headers, _ = self.request("GET", "/api/bootstrap", origin="https://evil.example")
        self.assertEqual(status, HTTPStatus.UNAUTHORIZED)
        self.assertNotIn("Access-Control-Allow-Origin", headers)

        status, headers, _ = self.request("GET", "/api/bootstrap", origin="http://127.0.0.1:4173")
        self.assertEqual(status, HTTPStatus.UNAUTHORIZED)
        self.assertEqual(headers.get("Access-Control-Allow-Origin"), "http://127.0.0.1:4173")


if __name__ == "__main__":
    unittest.main()
