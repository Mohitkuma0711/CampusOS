from flask import Blueprint, jsonify, request

from llm_client import generate
from skill_suggestions import suggest_skills

llm_routes = Blueprint("llm_routes", __name__, url_prefix="/api/llm")


def _prompt_for(field_name, payload):
    return f"CareerOS {field_name} task. Return concise, useful results for this input:\n{payload}"


IMPROVE_RESUME_PROMPT = """You are a senior career coach and resume strategist. Review the following resume against real hiring criteria and identify every issue that would reduce its effectiveness.

RESUME DATA:
{resume_data}

REVIEW CRITERIA (check ALL that apply):

1. WEAK/PASSIVE BULLETS — "responsible for," "worked on," "helped with," "assisted in" → rewrite starting with a strong action verb (Led, Built, Designed, Implemented, Optimized, Delivered, Launched, Automated, etc.)
2. MISSING METRICS — bullets with no quantified impact. If a real number IS inferable from context, provide it. If NOT inferable, set needs_user_input: true with a prompt asking the user for the real number.
3. VAGUE/GENERIC SKILLS — "hardworking," "team player," "good communicator," "fast learner," "detail-oriented" → remove or replace with something concrete drawn from the resume's own content.
4. INCONSISTENT FORMATTING — mixed date formats (Jan 2024 vs 01/2024), inconsistent tense across bullets in the same section, inconsistent heading capitalization.
5. LENGTH/SECTION BALANCE — thin sections next to detailed ones, or total length exceeding norms for the user's experienceLevel (fresher resumes should fit on ~1 page).
6. GRAMMAR/CLARITY — actual errors, run-ons, unclear phrasing, typos.

RESPONSE FORMAT (strict JSON — do NOT include anything outside this JSON object):
{{
  "issues": [
    {{
      "field": "experience[0].description",
      "category": "weak_bullet",
      "original": "Responsible for managing the database",
      "suggested": "Managed and optimized a PostgreSQL database supporting 10k+ daily queries",
      "reason": "Passive phrasing with no measurable impact",
      "needs_user_input": false,
      "user_input_prompt": ""
    }}
  ],
  "overall_score": 74,
  "summary": "Strong project section; experience bullets need stronger verbs and quantified impact."
}}

RULES:
- field must be a valid dot/bracket path into the resume JSON (e.g. "basics.summary", "education[0].degree", "skills.skills", "projects[1].description")
- For skills and certifications (comma-separated strings), use the path "skills.skills" or "skills.certifications" and set suggested to the improved comma-separated string
- For basics fields (name, targetRole, email, phone, location, summary), use "basics.fieldName"
- For array items, use "section[index].field"
- Set needs_user_input: true ONLY when a metric or specific number is needed but NOT inferable from context
- Set user_input_prompt to a clear question when needs_user_input is true
- NEVER invent numbers — only use metrics that are explicitly stated or clearly inferable
- Return 0 issues if the resume is already strong — do not force issues
- overall_score is 0-100 (100 = publication-ready)
- Cap at 15 most impactful issues
- Return ONLY the JSON object, no extra text"""


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


@llm_routes.post("/improve-resume")
def improve_resume():
    payload = request.get_json(silent=True) or {}
    resume = payload.get("resume")
    if not resume or not isinstance(resume, dict):
        return jsonify({"error": "Missing or invalid 'resume' in request body"}), 400

    prompt = IMPROVE_RESUME_PROMPT.format(resume_data=json.dumps(resume, indent=2))
    result = generate(prompt, response_format="json")

    # Guardrail: validate output structure
    if not isinstance(result, dict) or "issues" not in result:
        return jsonify({"error": "LLM returned invalid structure", "raw": result}), 500

    issues = result.get("issues", [])
    if not isinstance(issues, list):
        result["issues"] = []

    # Validate each issue has required fields
    validated = []
    for issue in result["issues"]:
        if isinstance(issue, dict) and "field" in issue and "suggested" in issue:
            issue.setdefault("category", "other")
            issue.setdefault("original", "")
            issue.setdefault("reason", "")
            issue.setdefault("needs_user_input", False)
            issue.setdefault("user_input_prompt", "")
            validated.append(issue)
    result["issues"] = validated

    # Guardrail: verify all original fields are still present
    original_keys = set(resume.keys())
    result["_original_keys"] = sorted(original_keys)

    result.setdefault("overall_score", 0)
    result.setdefault("summary", "")

    return jsonify(result)
