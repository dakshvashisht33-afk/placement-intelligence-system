
import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY was not found in the .env file.")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)

GEMINI_MODEL_CANDIDATES = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
]


def _extract_json(text):
    """Remove optional Markdown fences and parse Gemini's JSON response."""
    if not text:
        raise RuntimeError("Gemini returned an empty response.")

    text = text.strip()

    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    return json.loads(text.strip())


def generate_placement_analysis(student, placement_results):
    companies = placement_results[:15]

    prompt = f"""
You are an AI University Placement Intelligence Assistant.

Analyze the student's placement profile using ONLY the information provided.

IMPORTANT:
- Do not invent skills, companies, scores or requirements.
- Do not convert fit_score into a selection probability.
- Treat fit_score as a profile-fit indicator.
- Give practical, specific recommendations relevant to the target role.
- Prioritize the most important skill gaps.
- Make the improvement plan actionable for a university student.

STUDENT PROFILE:
{json.dumps(student, indent=2, default=str)}

PLACEMENT RESULTS:
{json.dumps(companies, indent=2, default=str)}

Return ONLY valid JSON in this structure:

{{
    "summary": "Short overall assessment",
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "learning_priorities": [
        {{"skill": "skill name", "reason": "why this skill matters"}}
    ],
    "company_analysis": [
        {{
            "company": "company name",
            "role": "role",
            "fit_score": 0,
            "eligible": true,
            "why_it_matches": "explanation",
            "missing_skills": []
        }}
    ],
    "improvement_plan": [
        {{
            "priority": 1,
            "skill": "skill to improve",
            "importance": "High",
            "why": "specific reason",
            "learn": ["topic 1", "topic 2"],
            "practice": ["task 1", "task 2"],
            "build": "small project or practical activity"
        }}
    ],
    "thirty_day_plan": [
        {{
            "week": "Week 1",
            "focus": "focus area",
            "actions": ["action 1", "action 2"]
        }}
    ],
    "career_roadmap": [
        {{
            "phase": "Phase 1",
            "focus": "what to learn",
            "actions": ["action 1", "action 2"]
        }}
    ]
}}
"""

    errors = []

    for model_name in GEMINI_MODEL_CANDIDATES:
        try:
            response = gemini_client.models.generate_content(
                model=model_name,
                contents=prompt
            )

            return _extract_json(response.text)

        except Exception as exc:
            errors.append(
                f"{model_name}: {type(exc).__name__}: {exc}"
            )

    raise RuntimeError(
        "Gemini analysis failed.\n" + "\n".join(errors)
    )


def generate_interview_questions(student, skills):
    """Generate interview questions tailored to the student's profile."""

    if not skills:
        skills = ["Problem Solving"]

    prompt = f"""
You are a university placement interview coach.

Generate exactly 8 interview questions tailored to this student.

STUDENT PROFILE:
{json.dumps(student, indent=2, default=str)}

SKILLS TO PRACTICE:
{json.dumps(skills, indent=2, default=str)}

Return ONLY a valid JSON array. Each item must contain:
- "type": Technical, Problem Solving, HR / Behavioral, or Aptitude
- "skill": relevant skill
- "question": clear, specific interview question

Requirements:
- Make questions relevant to the student's target role.
- Include practical and scenario-based questions.
- Do not invent details about the student's experience.
- Return exactly 8 questions.
"""

    errors = []

    for model_name in GEMINI_MODEL_CANDIDATES:
        try:
            response = gemini_client.models.generate_content(
                model=model_name,
                contents=prompt
            )

            questions = _extract_json(response.text)

            if not isinstance(questions, list) or len(questions) != 8:
                raise ValueError(
                    "Gemini must return exactly 8 questions."
                )

            required_fields = ("type", "skill", "question")

            for item in questions:
                if not isinstance(item, dict) or not all(
                    isinstance(item.get(field), str)
                    and item[field].strip()
                    for field in required_fields
                ):
                    raise ValueError(
                        "Each question must contain non-empty type, skill, and question fields."
                    )

            return questions

        except Exception as exc:
            errors.append(
                f"{model_name}: {type(exc).__name__}: {exc}"
            )

    raise RuntimeError(
        "Interview question generation failed.\n"
        + "\n".join(errors)
    )
