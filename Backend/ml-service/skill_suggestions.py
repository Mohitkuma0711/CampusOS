import json
import re
import sqlite3
from pathlib import Path

from llm_client import generate


CACHE_PATH = Path(__file__).resolve().parent / "data" / "response_cache.sqlite3"


def normalize_title(title):
    return re.sub(r"\s+", " ", title.strip().lower())


def _connection():
    CACHE_PATH.parent.mkdir(exist_ok=True)
    connection = sqlite3.connect(CACHE_PATH)
    connection.execute(
        """CREATE TABLE IF NOT EXISTS title_skill_suggestions (
        normalized_title TEXT PRIMARY KEY,
        response_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )"""
    )
    return connection


def _clean_skills(value):
    if not isinstance(value, list):
        return []
    seen = set()
    skills = []
    for item in value:
        skill = str(item).strip()
        key = skill.lower()
        if skill and key not in seen:
            seen.add(key)
            skills.append(skill)
    return skills[:16]


def suggest_skills(job_title):
    normalized_title = normalize_title(job_title)
    if not normalized_title or len(normalized_title) > 100:
        raise ValueError("Provide a job title between 1 and 100 characters.")

    with _connection() as connection:
        cached = connection.execute(
            "SELECT response_json FROM title_skill_suggestions WHERE normalized_title = ?", (normalized_title,)
        ).fetchone()
        if cached:
            return {**json.loads(cached[0]), "cached": True}

    prompt = (
        f"List the most commonly expected technical and soft skills for a {job_title.strip()} role. "
        "Return JSON only with exactly two arrays: core (expected by nearly every posting) and "
        "nice_to_have (adds competitiveness but is not always required). Keep each list concise."
    )
    response = generate(prompt, response_format="json")
    result = {"core": _clean_skills(response.get("core")), "nice_to_have": _clean_skills(response.get("nice_to_have"))}

    with _connection() as connection:
        connection.execute(
            "INSERT OR REPLACE INTO title_skill_suggestions (normalized_title, response_json) VALUES (?, ?)",
            (normalized_title, json.dumps(result)),
        )
    return {**result, "cached": False}
