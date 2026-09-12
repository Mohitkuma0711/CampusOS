from flask import Blueprint, jsonify, request

from llm_client import generate
from skill_suggestions import suggest_skills

llm_routes = Blueprint("llm_routes", __name__, url_prefix="/api/llm")


def _prompt_for(field_name, payload):
    return f"CareerOS {field_name} task. Return concise, useful results for this input:\n{payload}"


@llm_routes.post("/resume-feedback")
def resume_feedback():
    result = generate(
        _prompt_for("resume feedback", request.get_json(silent=True) or {}),
        response_format="json",
        provider="gemini",
    )
    return jsonify(result)


@llm_routes.post("/title-skill-suggestions")
def title_skill_suggestions():
    payload = request.get_json(silent=True) or {}
    try:
        return jsonify(suggest_skills(str(payload.get("jobTitle", ""))))
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


@llm_routes.post("/ats-check")
def ats_check():
    result = generate(_prompt_for("ATS keyword checking", request.get_json(silent=True) or {}), response_format="json")
    return jsonify(result)


@llm_routes.post("/test-generator")
def test_generator():
    result = generate(_prompt_for("test question generation", request.get_json(silent=True) or {}), response_format="json")
    return jsonify(result)


@llm_routes.post("/mock-interview-feedback")
def mock_interview_feedback():
    result = generate(
        _prompt_for("mock interview feedback", request.get_json(silent=True) or {}),
        provider="api",
    )
    return jsonify({"feedback": result})
