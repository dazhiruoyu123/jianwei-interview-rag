import csv
import hashlib
import io
import json
import math
import os
import re
import secrets
import sqlite3
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import httpx
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastembed import TextEmbedding
from pydantic import BaseModel, Field
from pymilvus import DataType, MilvusClient

DATA_DIR = Path(os.getenv("DATA_DIR", "/app/data"))
DB = DATA_DIR / "app.db"
VDB = DATA_DIR / "milvus.db"
MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-zh-v1.5")
EMBEDDING_BACKEND = os.getenv("EMBEDDING_BACKEND", "hash")
COLLECTION = "interview_qa"
DIMENSION = 512
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-pro")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123456")
APP_VERSION = "1.8.0"
SEARCH_TOP_K = 3


class LoginIn(BaseModel):
    username: str
    password: str


class BankIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = ""


class QuestionIn(BaseModel):
    question: str = Field(min_length=2, max_length=2000)
    answer: str = Field(min_length=1, max_length=30000)
    category: str = "未分类"
    difficulty: str = "中等"
    position: str = "通用"
    keywords: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    source: str = "手动录入"
    bank_id: str | None = None


class QuestionPatchIn(BaseModel):
    question: str | None = None
    answer: str | None = None
    category: str | None = None
    difficulty: str | None = None
    position: str | None = None
    keywords: list[str] | None = None
    tags: list[str] | None = None
    source: str | None = None
    bank_id: str | None = None


class SearchIn(BaseModel):
    query: str = Field(min_length=1, max_length=1000)
    mode: Literal["semantic", "keyword", "hybrid"] = "hybrid"
    bank_id: str | None = None
    category: str | None = None
    difficulty: str | None = None
    position: str | None = None
    limit: int = Field(SEARCH_TOP_K, ge=1, le=20)
    semantic_weight: float = Field(0.75, ge=0, le=1)
    keyword_weight: float = Field(0.25, ge=0, le=1)
    min_score: float = Field(0, ge=0, le=1)


class ReviewIn(BaseModel):
    user_id: str = "default"
    rating: Literal["again", "hard", "good", "easy"]


class InterviewStartIn(BaseModel):
    bank_id: str
    user_id: str = "default"


class InterviewAnswerIn(BaseModel):
    question_id: str
    prompt: str
    answer: str
    depth: int = Field(0, ge=0, le=2)


class AskIn(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    bank_id: str | None = None


def db():
    connection = sqlite3.connect(DB)
    connection.row_factory = sqlite3.Row
    return connection


def add_column(connection, table, column, definition):
    columns = [row["name"] for row in connection.execute(f"PRAGMA table_info({table})").fetchall()]
    if column not in columns:
        connection.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def ensure_default_bank(connection):
    row = connection.execute("SELECT id FROM banks ORDER BY created_at LIMIT 1").fetchone()
    if row:
        return row["id"]
    bank_id = str(uuid.uuid4())
    connection.execute(
        "INSERT INTO banks(id,name,description,created_at) VALUES(?,?,?,?)",
        (bank_id, "默认题库", "系统默认题库", int(time.time())),
    )
    return bank_id


def default_bank_id():
    with db() as connection:
        return ensure_default_bank(connection)


def init_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with db() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT, created_at INTEGER, expires_at INTEGER);
            CREATE TABLE IF NOT EXISTS banks(id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, created_at INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS questions(
              id TEXT PRIMARY KEY,
              question TEXT,
              answer TEXT,
              category TEXT,
              difficulty TEXT,
              position TEXT,
              keywords TEXT,
              source TEXT,
              content_hash TEXT UNIQUE,
              created_at INTEGER,
              updated_at INTEGER,
              version INTEGER DEFAULT 1,
              bank_id TEXT,
              tags TEXT DEFAULT '[]',
              chunk_index INTEGER DEFAULT 0,
              parent_id TEXT
            );
            CREATE TABLE IF NOT EXISTS user_question_states(
              user_id TEXT,
              question_id TEXT,
              mastery_level REAL DEFAULT 0,
              review_count INTEGER DEFAULT 0,
              last_reviewed_at INTEGER,
              next_review_at INTEGER,
              interval_days INTEGER DEFAULT 0,
              ease_factor REAL DEFAULT 2.5,
              stability REAL DEFAULT 1.0,
              difficulty_factor REAL DEFAULT 5.0,
              lapse_count INTEGER DEFAULT 0,
              last_rating TEXT,
              PRIMARY KEY(user_id, question_id)
            );
            CREATE TABLE IF NOT EXISTS search_logs(id INTEGER PRIMARY KEY AUTOINCREMENT, query TEXT, mode TEXT, result_count INTEGER, created_at INTEGER);
            CREATE TABLE IF NOT EXISTS interviews(id TEXT PRIMARY KEY, bank_id TEXT NOT NULL, user_id TEXT, question_ids TEXT NOT NULL, created_at INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS interview_turns(id TEXT PRIMARY KEY, interview_id TEXT, question_id TEXT, prompt TEXT, answer TEXT, feedback TEXT, follow_up TEXT, depth INTEGER, score REAL, created_at INTEGER);
            """
        )
        for column, definition in [
            ("bank_id", "TEXT"),
            ("tags", "TEXT DEFAULT '[]'"),
            ("chunk_index", "INTEGER DEFAULT 0"),
            ("parent_id", "TEXT"),
        ]:
            add_column(connection, "questions", column, definition)
        for column, definition in [
            ("stability", "REAL DEFAULT 1.0"),
            ("difficulty_factor", "REAL DEFAULT 5.0"),
            ("lapse_count", "INTEGER DEFAULT 0"),
            ("last_rating", "TEXT"),
        ]:
            add_column(connection, "user_question_states", column, definition)
        default_id = ensure_default_bank(connection)
        connection.execute("UPDATE questions SET bank_id=? WHERE bank_id IS NULL OR bank_id=''", (default_id,))


def create_token(user_id):
    token = secrets.token_urlsafe(32)
    with db() as connection:
        connection.execute(
            "INSERT INTO sessions(token,user_id,created_at,expires_at) VALUES(?,?,?,?)",
            (token, user_id, int(time.time()), int(time.time()) + 86400 * 7),
        )
    return token


def require_auth(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "请先登录")
    token = authorization.removeprefix("Bearer ").strip()
    with db() as connection:
        row = connection.execute("SELECT * FROM sessions WHERE token=? AND expires_at>?", (token, int(time.time()))).fetchone()
    if not row:
        raise HTTPException(401, "登录已过期")
    return row["user_id"]


def normalize_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [item.strip() for item in re.split(r"[,，、\n]+", str(value)) if item.strip()]


def safe_json_list(value):
    try:
        parsed = json.loads(value or "[]")
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def searchable_text(item):
    get = item.get if isinstance(item, dict) else lambda key, default="": getattr(item, key, default)
    keywords = normalize_list(get("keywords", []))
    tags = normalize_list(get("tags", []))
    return "\n".join(
        [
            f"问题：{get('question')}",
            f"答案：{get('answer')}",
            f"分类：{get('category')}",
            f"岗位：{get('position')}",
            f"关键词：{' '.join(keywords)}",
            f"标签：{' '.join(tags)}",
        ]
    )


def hash_embedding(value):
    vector = [0.0] * DIMENSION
    text = re.sub(r"\s+", " ", value.lower())
    tokens = re.findall(r"[\w\u4e00-\u9fff]+", text)
    grams = tokens[:]
    for token in tokens:
        if len(token) > 2:
            grams.extend(token[index : index + 2] for index in range(len(token) - 1))
    for gram in grams:
        digest = hashlib.blake2b(gram.encode("utf-8"), digest_size=8).digest()
        index = int.from_bytes(digest[:4], "little") % DIMENSION
        sign = 1 if digest[4] % 2 == 0 else -1
        vector[index] += sign
    norm = math.sqrt(sum(item * item for item in vector)) or 1.0
    return [item / norm for item in vector]


def embed_document(value):
    if getattr(app.state, "embedder", None):
        return list(next(app.state.embedder.embed([value])))
    return hash_embedding(value)


def embed_query(value):
    if getattr(app.state, "embedder", None):
        return list(next(app.state.embedder.query_embed(value)))
    return hash_embedding(value)


def serialize(row):
    item = dict(row)
    item["keywords"] = safe_json_list(item.get("keywords"))
    item["tags"] = safe_json_list(item.get("tags"))
    item["children"] = item.get("children", [])
    return item


def split_answer(answer, size=900, overlap=120):
    answer = answer.strip()
    if len(answer) <= size:
        return [answer]
    chunks = []
    start = 0
    while start < len(answer):
        end = min(len(answer), start + size)
        chunk = answer[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(answer):
            break
        start = max(0, end - overlap)
    return chunks


def parse_markdown_import(content):
    blocks = re.split(r"(?m)^##\s+", content)
    items = []
    for block in blocks[1:]:
        lines = block.splitlines()
        if not lines:
            continue
        question = lines[0].strip()
        body = "\n".join(lines[1:]).strip()
        meta = {}
        answer = body
        answer_match = re.split(r"(?m)^###\s*(?:标准答案|答案)\s*$", body, maxsplit=1)
        if len(answer_match) > 1:
            answer = answer_match[-1].strip()
            meta = answer_match[0]
        fields = {"question": question, "answer": answer}
        for key, value in re.findall(r"(?m)^-\s*(分类|难度|岗位|关键词|标签|来源)\s*[:：]\s*(.+)$", meta):
            map_key = {"分类": "category", "难度": "difficulty", "岗位": "position", "关键词": "keywords", "标签": "tags", "来源": "source"}[key]
            fields[map_key] = value
        items.append(fields)
    return items


def parse_import(filename, raw):
    name = filename.lower()
    if name.endswith(".json"):
        data = json.loads(raw.decode("utf-8-sig"))
        return data if isinstance(data, list) else data.get("items", [])
    if name.endswith(".csv"):
        return list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
    content = raw.decode("utf-8-sig")
    if name.endswith(".txt"):
        blocks = re.split(r"\n\s*\n", content)
        items = []
        for block in blocks:
            lines = [line.strip() for line in block.splitlines() if line.strip()]
            if len(lines) >= 2:
                items.append({"question": lines[0], "answer": "\n".join(lines[1:])})
        return items
    return parse_markdown_import(content)


def insert_question_row(connection, payload, item_id, answer, chunk_index, parent_id):
    digest = hashlib.sha256((payload["bank_id"] + "\n" + payload["question"].strip() + "\n" + answer.strip()).encode()).hexdigest()
    now = int(time.time())
    connection.execute(
        """
        INSERT INTO questions(
            id,question,answer,category,difficulty,position,keywords,source,
            content_hash,created_at,updated_at,version,bank_id,tags,chunk_index,parent_id
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            item_id,
            payload["question"].strip(),
            answer.strip(),
            payload["category"],
            payload["difficulty"],
            payload["position"],
            json.dumps(payload["keywords"], ensure_ascii=False),
            payload["source"],
            digest,
            now,
            now,
            1,
            payload["bank_id"],
            json.dumps(payload["tags"], ensure_ascii=False),
            chunk_index,
            parent_id,
        ),
    )


def save_question(payload, chunk=True):
    if isinstance(payload, dict):
        payload = dict(payload)
        payload.setdefault("keywords", [])
        payload.setdefault("tags", [])
        payload.setdefault("category", "未分类")
        payload.setdefault("difficulty", "中等")
        payload.setdefault("position", "通用")
        payload.setdefault("source", "手动录入")
        payload["keywords"] = normalize_list(payload["keywords"])
        payload["tags"] = normalize_list(payload["tags"])
    payload = QuestionIn.model_validate(payload)
    bank_id = payload.bank_id or default_bank_id()
    payload_dict = payload.model_dump()
    payload_dict["bank_id"] = bank_id
    parent_id = str(uuid.uuid4())
    answer_chunks = split_answer(payload.answer) if chunk else [payload.answer]
    created_ids = []
    with db() as connection:
        for index, answer in enumerate(answer_chunks):
            item_id = parent_id if index == 0 else str(uuid.uuid4())
            payload_dict["question"] = payload.question
            vector = embed_document(searchable_text({**payload_dict, "answer": answer}))
            insert_question_row(connection, payload_dict, item_id, answer, index, parent_id)
            app.state.milvus.insert(COLLECTION, [{"id": item_id, "embedding": vector}])
            created_ids.append(item_id)
    return created_ids


def refresh_question_embedding(item_id):
    with db() as connection:
        row = connection.execute("SELECT * FROM questions WHERE id=?", (item_id,)).fetchone()
    if not row:
        return
    item = serialize(row)
    vector = embed_document(searchable_text(item))
    try:
        app.state.milvus.delete(COLLECTION, ids=[item_id])
    except Exception:
        pass
    app.state.milvus.insert(COLLECTION, [{"id": item_id, "embedding": vector}])


def key_score(query, item):
    query = query.lower().strip()
    body = searchable_text(item).lower()
    tokens = re.findall(r"[\w\u4e00-\u9fff]+", query) or list(query)
    if not tokens:
        return 0.0
    score = sum(token in body for token in tokens) / len(tokens)
    if query and query in body:
        score += 0.3
    return min(1.0, score)


def matches(item, payload):
    return (
        (not payload.bank_id or item.get("bank_id") == payload.bank_id)
        and (not payload.category or item["category"] == payload.category)
        and (not payload.difficulty or item["difficulty"] == payload.difficulty)
        and (not payload.position or item["position"] == payload.position)
    )


def ranked_search(payload):
    with db() as connection:
        rows = connection.execute("SELECT * FROM questions").fetchall()
    items = {item["id"]: serialize(item) for item in rows}
    candidates = {}
    if payload.mode in ("semantic", "hybrid") and items:
        vector = embed_query(payload.query)
        try:
            hits = app.state.milvus.search(
                COLLECTION,
                data=[vector],
                anns_field="embedding",
                limit=min(max(payload.limit * 8, 30), 150),
                search_params={"metric_type": "COSINE", "params": {}},
                output_fields=["id"],
            )[0]
        except Exception:
            app.state.milvus.load_collection(COLLECTION)
            hits = app.state.milvus.search(
                COLLECTION,
                data=[vector],
                anns_field="embedding",
                limit=min(max(payload.limit * 8, 30), 150),
                search_params={"metric_type": "COSINE", "params": {}},
                output_fields=["id"],
            )[0]
        candidates = {item["id"]: max(0, min(1, float(item["distance"]))) for item in hits}
    if payload.mode == "keyword":
        candidates = {key: 0.0 for key in items}
    ranked = []
    total_weight = max(payload.semantic_weight + payload.keyword_weight, 0.01)
    for item_id, semantic in candidates.items():
        item = items.get(item_id)
        if not item or not matches(item, payload):
            continue
        keyword = key_score(payload.query, item)
        if payload.mode == "keyword":
            score = keyword
        elif payload.mode == "semantic":
            score = semantic
        else:
            score = (semantic * payload.semantic_weight + keyword * payload.keyword_weight) / total_weight
        if score >= payload.min_score:
            item["semantic_score"] = round(semantic, 4)
            item["keyword_score"] = round(keyword, 4)
            item["score"] = round(score, 4)
            ranked.append(item)
    ranked.sort(key=lambda item: item["score"], reverse=True)
    return ranked[:payload.limit]


def block_preview(text, limit=280):
    cleaned = re.sub(r"\s+", " ", text).strip()
    return cleaned[:limit] + ("…" if len(cleaned) > limit else "")


def chunk_lines(text):
    lines = [line.strip() for line in re.split(r"\n{2,}", text.strip()) if line.strip()]
    return lines or [text.strip()]


async def deepseek_json(system_prompt, user_prompt):
    if not DEEPSEEK_API_KEY:
        raise HTTPException(400, "DeepSeek API Key 未配置")
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            f"{DEEPSEEK_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": DEEPSEEK_MODEL,
                "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                "response_format": {"type": "json_object"},
                "temperature": 0.25,
            },
        )
    if response.status_code >= 400:
        raise HTTPException(502, f"DeepSeek 调用失败：{response.status_code}")
    payload = response.json()["choices"][0]["message"]["content"]
    return json.loads(payload)


def recall_probability(stability, last_reviewed_at):
    if not last_reviewed_at:
        return 0.0
    elapsed_days = max(0, (int(time.time()) - int(last_reviewed_at)) / 86400)
    return round(math.exp(-elapsed_days / max(float(stability or 1), 0.1)), 4)


def get_question_tree(connection, bank_id=None):
    where = "WHERE bank_id=?" if bank_id else ""
    args = [bank_id] if bank_id else []
    rows = connection.execute(
        f"""
        SELECT parent_id, COUNT(*) AS count
        FROM questions
        {where}
        GROUP BY parent_id
        """,
        args,
    ).fetchall()
    return {row["parent_id"] or "": row["count"] for row in rows}


@asynccontextmanager
async def lifespan(app):
    init_db()
    app.state.embedder = None if EMBEDDING_BACKEND == "hash" else TextEmbedding(model_name=MODEL)
    app.state.milvus = MilvusClient(uri=str(VDB))
    if not app.state.milvus.has_collection(COLLECTION):
        schema = MilvusClient.create_schema(auto_id=False, enable_dynamic_field=False)
        schema.add_field("id", DataType.VARCHAR, is_primary=True, max_length=64)
        schema.add_field("embedding", DataType.FLOAT_VECTOR, dim=DIMENSION)
        indexes = app.state.milvus.prepare_index_params()
        indexes.add_index("embedding", index_type="FLAT", metric_type="COSINE")
        app.state.milvus.create_collection(COLLECTION, schema=schema, index_params=indexes)
    app.state.milvus.load_collection(COLLECTION)
    yield


app = FastAPI(title="鉴微", version=APP_VERSION, lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/api/auth/login")
def login(payload: LoginIn):
    if payload.username != ADMIN_USER or payload.password != ADMIN_PASSWORD:
        raise HTTPException(401, "用户名或密码错误")
    return {"token": create_token(payload.username), "user_id": payload.username}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "name": "鉴微",
        "version": APP_VERSION,
        "model": MODEL,
        "embedding_backend": EMBEDDING_BACKEND,
        "llm": DEEPSEEK_MODEL,
    }


@app.get("/api/banks")
def banks(_: str = Depends(require_auth)):
    with db() as connection:
        rows = connection.execute(
            "SELECT b.*,COUNT(q.id) question_count FROM banks b LEFT JOIN questions q ON q.bank_id=b.id GROUP BY b.id ORDER BY b.created_at"
        ).fetchall()
    return {"items": [dict(row) for row in rows]}


@app.post("/api/banks", status_code=201)
def create_bank(payload: BankIn, _: str = Depends(require_auth)):
    bank_id = str(uuid.uuid4())
    try:
        with db() as connection:
            connection.execute(
                "INSERT INTO banks(id,name,description,created_at) VALUES(?,?,?,?)",
                (bank_id, payload.name.strip(), payload.description, int(time.time())),
            )
    except sqlite3.IntegrityError:
        raise HTTPException(409, "同名题库已存在")
    return {"id": bank_id, "message": "题库已创建"}


@app.put("/api/banks/{bank_id}")
def update_bank(bank_id: str, payload: BankIn, _: str = Depends(require_auth)):
    with db() as connection:
        updated = connection.execute(
            "UPDATE banks SET name=?, description=? WHERE id=?",
            (payload.name.strip(), payload.description, bank_id),
        ).rowcount
    if not updated:
        raise HTTPException(404, "题库不存在")
    return {"message": "题库已更新"}


@app.delete("/api/banks/{bank_id}")
def delete_bank(bank_id: str, _: str = Depends(require_auth)):
    with db() as connection:
        count = connection.execute("SELECT COUNT(*) FROM questions WHERE bank_id=?", (bank_id,)).fetchone()[0]
        if count:
            raise HTTPException(400, "题库下仍有题目，先清空后再删除")
        removed = connection.execute("DELETE FROM banks WHERE id=?", (bank_id,)).rowcount
    if not removed:
        raise HTTPException(404, "题库不存在")
    return {"message": "题库已删除"}


@app.get("/api/stats")
def stats(_: str = Depends(require_auth)):
    with db() as connection:
        total = connection.execute("SELECT COUNT(*) FROM questions").fetchone()[0]
        banks_total = connection.execute("SELECT COUNT(*) FROM banks").fetchone()[0]
        categories = connection.execute("SELECT category, COUNT(*) count FROM questions GROUP BY category ORDER BY count DESC").fetchall()
    return {"total": total, "banks": banks_total, "categories": [dict(item) for item in categories]}


@app.get("/api/options")
def options(_: str = Depends(require_auth)):
    result = {}
    with db() as connection:
        for field in ("category", "difficulty", "position", "source"):
            result[field] = [item[0] for item in connection.execute(f"SELECT DISTINCT {field} FROM questions ORDER BY {field}").fetchall()]
    return result


@app.get("/api/questions")
def questions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str = "",
    bank_id: str = "",
    _: str = Depends(require_auth),
):
    where, args = [], []
    if keyword:
        where.append("(question LIKE ? OR answer LIKE ? OR tags LIKE ? OR keywords LIKE ?)")
        args += [f"%{keyword}%", f"%{keyword}%", f"%{keyword}%", f"%{keyword}%"]
    if bank_id:
        where.append("bank_id=?")
        args.append(bank_id)
    clause = "WHERE " + " AND ".join(where) if where else ""
    with db() as connection:
        total = connection.execute(f"SELECT COUNT(*) FROM questions {clause}", args).fetchone()[0]
        rows = connection.execute(
            f"SELECT * FROM questions {clause} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [*args, page_size, (page - 1) * page_size],
        ).fetchall()
    items = []
    for row in rows:
        item = serialize(row)
        item["preview"] = block_preview(item.get("answer", ""))
        items.append(item)
    return {"items": items, "total": total}


@app.post("/api/questions", status_code=201)
def create_question(payload: QuestionIn, _: str = Depends(require_auth)):
    try:
        ids = save_question(payload, chunk=False)
    except sqlite3.IntegrityError:
        raise HTTPException(409, "相同题目和答案已存在")
    return {"ids": ids, "message": "题目已保存"}


@app.get("/api/questions/{item_id}")
def get_question(item_id: str, _: str = Depends(require_auth)):
    with db() as connection:
        row = connection.execute("SELECT * FROM questions WHERE id=?", (item_id,)).fetchone()
        if not row:
            raise HTTPException(404, "题目不存在")
        children = connection.execute("SELECT * FROM questions WHERE parent_id=? ORDER BY chunk_index", (item_id,)).fetchall()
    item = serialize(row)
    item["children"] = [serialize(child) for child in children]
    return item


@app.put("/api/questions/{item_id}")
def update_question(item_id: str, payload: QuestionPatchIn, _: str = Depends(require_auth)):
    fields = []
    args = []
    for field in ("question", "answer", "category", "difficulty", "position", "source", "bank_id"):
        value = getattr(payload, field)
        if value is not None:
            fields.append(f"{field}=?")
            args.append(value)
    if payload.keywords is not None:
        fields.append("keywords=?")
        args.append(json.dumps(normalize_list(payload.keywords), ensure_ascii=False))
    if payload.tags is not None:
        fields.append("tags=?")
        args.append(json.dumps(normalize_list(payload.tags), ensure_ascii=False))
    if not fields:
        return {"message": "没有变更"}
    args.extend([int(time.time()), item_id])
    with db() as connection:
        updated = connection.execute(
            f"UPDATE questions SET {', '.join(fields)}, updated_at=? WHERE id=?",
            args,
        ).rowcount
        if updated and any(field in {"question", "answer", "category", "difficulty", "position", "keywords", "tags", "bank_id"} for field in fields):
            refresh_question_embedding(item_id)
    if not updated:
        raise HTTPException(404, "题目不存在")
    return {"message": "题目已更新"}


@app.post("/api/questions/{item_id}/auto-tags")
async def auto_tags(item_id: str, _: str = Depends(require_auth)):
    with db() as connection:
        row = connection.execute("SELECT * FROM questions WHERE id=?", (item_id,)).fetchone()
    if not row:
        raise HTTPException(404, "题目不存在")
    item = serialize(row)
    result = await deepseek_json(
        "你是题库标注助手，只输出 JSON。",
        f"请为题目生成结构化标注。\n问题：{item['question']}\n答案：{item['answer']}\n只输出 JSON，字段为 category, difficulty, position, keywords 数组, tags 数组。",
    )
    patch = QuestionPatchIn(
        category=result.get("category"),
        difficulty=result.get("difficulty"),
        position=result.get("position"),
        keywords=result.get("keywords"),
        tags=result.get("tags"),
    )
    update_question(item_id, patch, "system")
    return result


@app.post("/api/import")
async def import_file(file: UploadFile = File(...), bank_id: str = Form(""), _: str = Depends(require_auth)):
    if not file.filename or not file.filename.lower().endswith((".json", ".csv", ".md", ".markdown", ".txt")):
        raise HTTPException(400, "仅支持 JSON、CSV、Markdown、TXT 文件")
    items = parse_import(file.filename, await file.read())
    created, skipped, errors = 0, 0, []
    for index, item in enumerate(items, 1):
        try:
            item["bank_id"] = bank_id or item.get("bank_id") or default_bank_id()
            created += len(save_question(item, chunk=True))
        except sqlite3.IntegrityError:
            skipped += 1
        except Exception as exc:
            errors.append({"row": index, "message": type(exc).__name__, "detail": str(exc)})
    return {"created": created, "skipped": skipped, "errors": errors}


@app.delete("/api/questions/{item_id}")
def delete_question(item_id: str, _: str = Depends(require_auth)):
    with db() as connection:
        removed = connection.execute("DELETE FROM questions WHERE id=?", (item_id,)).rowcount
    if not removed:
        raise HTTPException(404, "题目不存在")
    app.state.milvus.delete(COLLECTION, ids=[item_id])
    return {"message": "题目已删除"}


@app.post("/api/search")
def search(payload: SearchIn, _: str = Depends(require_auth)):
    payload.limit = min(payload.limit, SEARCH_TOP_K)
    result = ranked_search(payload)
    with db() as connection:
        connection.execute(
            "INSERT INTO search_logs(query,mode,result_count,created_at) VALUES(?,?,?,?)",
            (payload.query, payload.mode, len(result), int(time.time())),
        )
    return {"items": result, "total": len(result)}


@app.post("/api/search/compare")
def search_compare(payload: SearchIn, _: str = Depends(require_auth)):
    limit = min(payload.limit, SEARCH_TOP_K)
    return {
        "semantic": ranked_search(payload.model_copy(update={"mode": "semantic", "limit": limit})),
        "keyword": ranked_search(payload.model_copy(update={"mode": "keyword", "limit": limit})),
        "hybrid": ranked_search(payload.model_copy(update={"mode": "hybrid", "limit": limit})),
    }


@app.post("/api/ask")
async def ask(payload: AskIn, _: str = Depends(require_auth)):
    sources = ranked_search(SearchIn(query=payload.query, bank_id=payload.bank_id, mode="hybrid", limit=SEARCH_TOP_K))
    if DEEPSEEK_API_KEY:
        context = "\n\n".join([f"[{i + 1}] 问题：{item['question']}\n答案：{item['answer']}" for i, item in enumerate(sources)])
        data = await deepseek_json(
            "你是鉴微系统里的资深技术面试官。只输出 JSON。",
            f"用户问题：{payload.query}\n\nTop 3 检索资料：\n{context}\n\n请输出 JSON，字段 answer, sources_summary, confidence。",
        )
        answer = data
    else:
        answer = {
            "answer": "当前未配置大模型，已返回检索到的相关题目。",
            "sources_summary": "未启用生成能力",
            "confidence": 0.0,
        }
    return {"answer": answer, "sources": sources}


@app.post("/api/interviews/start")
def interview_start(payload: InterviewStartIn, _: str = Depends(require_auth)):
    with db() as connection:
        rows = connection.execute("SELECT id FROM questions WHERE bank_id=? ORDER BY RANDOM() LIMIT 6", (payload.bank_id,)).fetchall()
    if not rows:
        raise HTTPException(400, "该题库暂无题目")
    interview_id = str(uuid.uuid4())
    question_ids = [row["id"] for row in rows]
    with db() as connection:
        connection.execute(
            "INSERT INTO interviews(id,bank_id,user_id,question_ids,created_at) VALUES(?,?,?,?,?)",
            (interview_id, payload.bank_id, payload.user_id, json.dumps(question_ids), int(time.time())),
        )
    return interview_get(interview_id, "system")


@app.get("/api/interviews/{interview_id}")
def interview_get(interview_id: str, _: str = Depends(require_auth)):
    with db() as connection:
        interview = connection.execute("SELECT * FROM interviews WHERE id=?", (interview_id,)).fetchone()
        if not interview:
            raise HTTPException(404, "面试不存在")
        ids = json.loads(interview["question_ids"])
        placeholders = ",".join(["?"] * len(ids))
        questions_rows = connection.execute(f"SELECT * FROM questions WHERE id IN ({placeholders})", ids).fetchall()
        turns = connection.execute("SELECT * FROM interview_turns WHERE interview_id=? ORDER BY created_at", (interview_id,)).fetchall()
    questions_by_id = {row["id"]: serialize(row) for row in questions_rows}
    return {
        "id": interview_id,
        "bank_id": interview["bank_id"],
        "questions": [questions_by_id[item] for item in ids if item in questions_by_id],
        "turns": [dict(row) for row in turns],
    }


@app.post("/api/interviews/{interview_id}/answer")
async def interview_answer(interview_id: str, payload: InterviewAnswerIn, _: str = Depends(require_auth)):
    with db() as connection:
        question = connection.execute("SELECT * FROM questions WHERE id=?", (payload.question_id,)).fetchone()
    if not question:
        raise HTTPException(404, "题目不存在")
    item = serialize(question)
    next_depth = payload.depth + 1
    if DEEPSEEK_API_KEY:
        result = await deepseek_json(
            "你是一名严格但友好的技术面试官。无论回答对错，都必须给出反馈，并且返回 JSON。",
            f"原题：{item['question']}\n标准答案：{item['answer']}\n本轮问题：{payload.prompt}\n候选人回答：{payload.answer}\n\n请输出 JSON，字段 score 0-100, feedback, correct_answer, strengths 数组, weaknesses 数组, follow_up 字符串。当前追问深度：{payload.depth}，最多 2。",
        )
    else:
        result = {
            "score": 60 if payload.answer.strip() else 0,
            "feedback": "已收到回答，当前未启用大模型评估。",
            "correct_answer": item["answer"],
            "strengths": [],
            "weaknesses": [],
            "follow_up": "请再补充一下这个题目的关键边界条件。",
        }
    follow_up = result.get("follow_up") if next_depth <= 2 else ""
    turn_id = str(uuid.uuid4())
    with db() as connection:
        connection.execute(
            "INSERT INTO interview_turns VALUES(?,?,?,?,?,?,?,?,?,?)",
            (
                turn_id,
                interview_id,
                payload.question_id,
                payload.prompt,
                payload.answer,
                json.dumps(result, ensure_ascii=False),
                follow_up,
                payload.depth,
                float(result.get("score", 0)),
                int(time.time()),
            ),
        )
    return {"id": turn_id, "evaluation": result, "follow_up": follow_up, "next_depth": next_depth}


@app.post("/api/interview-turns/{turn_id}/save-question")
def save_turn_question(turn_id: str, bank_id: str = "", _: str = Depends(require_auth)):
    with db() as connection:
        turn = connection.execute("SELECT * FROM interview_turns WHERE id=?", (turn_id,)).fetchone()
        original = connection.execute("SELECT * FROM questions WHERE id=?", (turn["question_id"],)).fetchone() if turn else None
    if not turn or not turn["follow_up"]:
        raise HTTPException(404, "追问不存在")
    original_item = serialize(original)
    ids = save_question(
        {
            "question": turn["follow_up"],
            "answer": "由模拟面试追问生成，请补充标准答案。",
            "category": original_item["category"],
            "difficulty": original_item["difficulty"],
            "position": original_item["position"],
            "keywords": original_item["keywords"],
            "tags": ["AI追问"],
            "source": "模拟面试追问",
            "bank_id": bank_id or original_item["bank_id"],
        },
        chunk=False,
    )
    return {"ids": ids, "message": "追问已加入题库"}


@app.get("/api/reviews")
def reviews(user_id: str = "default", scope: Literal["today", "yesterday"] = "today", limit: int = 30, _: str = Depends(require_auth)):
    now = int(time.time())
    day = 86400
    with db() as connection:
        if scope == "yesterday":
            start = now - day * 2
            end = now - day
            rows = connection.execute(
                """
                SELECT DISTINCT q.*,s.mastery_level,s.review_count,s.last_reviewed_at,
                s.next_review_at,s.interval_days,s.ease_factor,s.stability,s.difficulty_factor,s.lapse_count,s.last_rating
                FROM questions q
                JOIN user_question_states s ON s.question_id=q.id AND s.user_id=?
                JOIN interview_turns t ON t.question_id=q.id
                WHERE s.last_reviewed_at BETWEEN ? AND ?
                ORDER BY s.last_reviewed_at DESC LIMIT ?
                """,
                (user_id, start, end, limit),
            ).fetchall()
        else:
            rows = connection.execute(
                """
                SELECT DISTINCT q.*,s.mastery_level,s.review_count,s.last_reviewed_at,
                s.next_review_at,s.interval_days,s.ease_factor,s.stability,s.difficulty_factor,s.lapse_count,s.last_rating
                FROM questions q
                JOIN interview_turns t ON t.question_id=q.id
                LEFT JOIN user_question_states s ON s.question_id=q.id AND s.user_id=?
                WHERE s.next_review_at IS NULL OR s.next_review_at<=?
                ORDER BY COALESCE(s.next_review_at,0),q.created_at LIMIT ?
                """,
                (user_id, now, limit),
            ).fetchall()
    items = []
    for row in rows:
        item = serialize(row)
        item["recall_probability"] = recall_probability(item.get("stability"), item.get("last_reviewed_at"))
        items.append(item)
    return {"items": items, "total": len(items)}


@app.post("/api/reviews/{item_id}")
def review(item_id: str, payload: ReviewIn, _: str = Depends(require_auth)):
    now = int(time.time())
    weights = {"again": 0, "hard": 1, "good": 2, "easy": 3}
    with db() as connection:
        if not connection.execute("SELECT 1 FROM questions WHERE id=?", (item_id,)).fetchone():
            raise HTTPException(404, "题目不存在")
        row = connection.execute("SELECT * FROM user_question_states WHERE user_id=? AND question_id=?", (payload.user_id, item_id)).fetchone()
        count = (row["review_count"] if row else 0) + 1
        stability = float(row["stability"] if row else 1.0)
        difficulty = float(row["difficulty_factor"] if row else 5.0)
        lapse_count = int(row["lapse_count"] if row else 0)
        if payload.rating == "again":
            stability = max(0.5, stability * 0.45)
            difficulty = min(10, difficulty + 1.2)
            lapse_count += 1
            interval = 1
        elif payload.rating == "hard":
            stability = max(1.0, stability * 1.35)
            difficulty = min(10, difficulty + 0.35)
            interval = max(1, round(stability))
        elif payload.rating == "good":
            stability = stability * (2.2 + (10 - difficulty) / 10)
            difficulty = max(1, difficulty - 0.15)
            interval = max(3, round(stability))
        else:
            stability = stability * (3.0 + (10 - difficulty) / 8)
            difficulty = max(1, difficulty - 0.45)
            interval = max(5, round(stability))
        next_at = now + interval * 86400
        connection.execute(
            """
            INSERT INTO user_question_states(user_id,question_id,mastery_level,review_count,
            last_reviewed_at,next_review_at,interval_days,ease_factor,stability,difficulty_factor,lapse_count,last_rating)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(user_id,question_id) DO UPDATE SET mastery_level=excluded.mastery_level,
            review_count=excluded.review_count,last_reviewed_at=excluded.last_reviewed_at,
            next_review_at=excluded.next_review_at,interval_days=excluded.interval_days,ease_factor=excluded.ease_factor,
            stability=excluded.stability,difficulty_factor=excluded.difficulty_factor,lapse_count=excluded.lapse_count,
            last_rating=excluded.last_rating
            """,
            (payload.user_id, item_id, weights[payload.rating] / 3, count, now, next_at, interval, 2.5, stability, difficulty, lapse_count, payload.rating),
        )
    return {"message": "复习记录已保存", "interval_days": interval, "next_review_at": next_at, "stability": round(stability, 2), "difficulty_factor": round(difficulty, 2), "recall_probability": 1.0}
