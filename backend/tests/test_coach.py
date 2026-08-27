import asyncio
import json
import sys
import tempfile
import time
import types
import unittest
import uuid
from pathlib import Path

# These workflow tests do not initialize the vector model. Keeping the stub
# local avoids loading platform-specific ONNX binaries during unit tests.
fastembed_stub = types.ModuleType("fastembed")
fastembed_stub.TextEmbedding = object
sys.modules.setdefault("fastembed", fastembed_stub)

from app import main


class CoachWorkflowTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        main.DATA_DIR = Path(self.temp_dir.name)
        main.DB = main.DATA_DIR / "app.db"
        main.VDB = main.DATA_DIR / "milvus.db"
        main.ADMIN_USER = "coach-test"
        main.ADMIN_PASSWORD = "coach-test-password"
        main.DEEPSEEK_API_KEY = ""
        main.init_db()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_profile_creates_plan_and_dashboard(self):
        payload = main.CoachProfileIn(
            target_position="Java 后端工程师",
            experience_level="1-3 年",
            daily_minutes=30,
            jd_text="熟悉 Java、MySQL 和 Redis。",
            resume_summary="两年后端开发经验。",
            project_summary="负责订单系统性能优化，接口延迟降低 40%。",
            focus_areas=["JVM", "MySQL"],
        )

        saved = main.save_coach_profile(payload, main.ADMIN_USER)
        dashboard = main.coach_dashboard(main.ADMIN_USER)

        self.assertEqual(saved["profile"]["target_position"], "Java 后端工程师")
        self.assertTrue(dashboard["profile"]["configured"])
        self.assertEqual(len(dashboard["tasks"]), 2)
        with main.db() as connection:
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM training_tasks").fetchone()[0], 8)

    def test_interview_answer_enters_review_and_completes_task(self):
        main.save_coach_profile(
            main.CoachProfileIn(target_position="后端工程师", focus_areas=["数据库"]),
            main.ADMIN_USER,
        )
        bank_id = main.default_bank_id(main.ADMIN_USER)
        question_id = str(uuid.uuid4())
        interview_id = str(uuid.uuid4())
        now = int(time.time())
        with main.db() as connection:
            connection.execute(
                """
                INSERT INTO questions(
                  id,question,answer,category,difficulty,position,keywords,source,content_hash,
                  created_at,updated_at,version,bank_id,tags,chunk_index,parent_id,owner_user_id
                ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """,
                (
                    question_id,
                    "事务隔离级别有哪些？",
                    "读未提交、读已提交、可重复读和串行化。",
                    "数据库",
                    "中等",
                    "后端",
                    json.dumps(["事务"], ensure_ascii=False),
                    "测试",
                    str(uuid.uuid4()),
                    now,
                    now,
                    1,
                    bank_id,
                    "[]",
                    0,
                    None,
                    main.ADMIN_USER,
                ),
            )
            connection.execute(
                "INSERT INTO interviews(id,bank_id,user_id,question_ids,created_at,mode) VALUES(?,?,?,?,?,?)",
                (interview_id, bank_id, main.ADMIN_USER, json.dumps([question_id]), now, "general"),
            )

        result = asyncio.run(
            main.interview_answer(
                interview_id,
                main.InterviewAnswerIn(
                    question_id=question_id,
                    prompt="事务隔离级别有哪些？",
                    answer="我知道有四种隔离级别。",
                    depth=0,
                ),
                main.ADMIN_USER,
            )
        )
        report = main.interview_report(interview_id, main.ADMIN_USER)

        self.assertEqual(result["evaluation"]["score"], 60)
        self.assertEqual(report["score"], 60)
        with main.db() as connection:
            state = connection.execute(
                "SELECT * FROM user_question_states WHERE user_id=? AND question_id=?",
                (main.ADMIN_USER, question_id),
            ).fetchone()
            completed = connection.execute(
                "SELECT COUNT(*) FROM training_tasks WHERE user_id=? AND status='completed'",
                (main.ADMIN_USER,),
            ).fetchone()[0]
        self.assertIsNotNone(state)
        self.assertLessEqual(state["next_review_at"], int(time.time()))
        self.assertEqual(completed, 1)


if __name__ == "__main__":
    unittest.main()
