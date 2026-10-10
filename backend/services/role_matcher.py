import re
import pandas as pd

ROLE_REQUIREMENTS = {
    "Data Analyst": {
        "technical_skills": ["python", "sql", "excel", "power bi", "tableau", "statistics"],
        "soft_skills": ["communication", "analytical thinking", "problem solving"],
        "project_keywords": ["data analysis", "analytics", "dashboard", "data", "statistics"],
    },
    "ML Engineer": {
        "technical_skills": ["python", "machine learning", "pandas", "numpy", "scikit-learn", "statistics"],
        "soft_skills": ["problem solving", "analytical thinking", "communication"],
        "project_keywords": ["machine learning", "ml", "prediction", "classification", "regression", "ai"],
    },
    "Cloud Engineer": {
        "technical_skills": ["python", "aws", "azure", "gcp", "linux", "docker", "cloud"],
        "soft_skills": ["problem solving", "communication", "teamwork"],
        "project_keywords": ["cloud", "aws", "azure", "gcp", "deployment", "devops"],
    },
    "SDE": {
        "technical_skills": ["python", "java", "c++", "javascript", "data structures", "algorithms", "git", "sql"],
        "soft_skills": ["problem solving", "communication", "teamwork"],
        "project_keywords": ["software", "web", "application", "app", "development", "full stack"],
    },
    "Business Analyst": {
        "technical_skills": ["excel", "sql", "python", "power bi", "tableau", "statistics"],
        "soft_skills": ["communication", "analytical thinking", "problem solving", "leadership"],
        "project_keywords": ["business analysis", "analytics", "dashboard", "market research", "business"],
    },
}


def _text(value):
    if pd.isna(value):
        return ""
    return str(value).lower()


def _tokens(value):
    text = _text(value)
    return {
        re.sub(r"[^a-z0-9+#. ]", " ", item).strip()
        for item in re.split(r"[,;|]", text)
        if item.strip()
    }


def _contains_skill(profile_text, skill):
    text = _text(profile_text)
    return skill.lower() in text


def calculate_role_match(student):
    student_skills = _text(student.get("skills", ""))
    student_soft = _text(student.get("soft_skills", ""))
    project_text = " ".join([
        _text(student.get("projects", "")),
        _text(student.get("project_name", "")),
        _text(student.get("project_type", "")),
    ])

    cgpa = float(student.get("cgpa", 0) or 0)
    technical_score = float(student.get("technical_score", 0) or 0)
    aptitude_score = float(student.get("aptitude_score", 0) or 0)

    results = []

    for role, requirements in ROLE_REQUIREMENTS.items():
        technical = requirements["technical_skills"]
        soft = requirements["soft_skills"]
        projects = requirements["project_keywords"]

        matched_technical = [
            skill for skill in technical
            if _contains_skill(student_skills, skill)
        ]
        missing_technical = [
            skill for skill in technical
            if skill not in matched_technical
        ]

        matched_soft = [
            skill for skill in soft
            if _contains_skill(student_soft, skill)
        ]
        missing_soft = [
            skill for skill in soft
            if skill not in matched_soft
        ]

        matched_projects = [
            keyword for keyword in projects
            if keyword in project_text
        ]

        technical_match = (
            len(matched_technical) / len(technical) * 100
            if technical else 0
        )
        soft_match = (
            len(matched_soft) / len(soft) * 100
            if soft else 0
        )
        project_match = (
            min(len(matched_projects) / 2, 1) * 100
            if projects else 0
        )

        academic_score = min(max((cgpa / 10) * 100, 0), 100)
        technical_assessment = min(max(technical_score, 0), 100)
        aptitude = min(max(aptitude_score, 0), 100)

        match_score = round(
            technical_match * 0.35
            + soft_match * 0.15
            + project_match * 0.15
            + academic_score * 0.10
            + technical_assessment * 0.15
            + aptitude * 0.10
        )

        results.append({
            "role": role,
            "match_score": int(match_score),
            "technical_match": round(technical_match, 1),
            "soft_skill_match": round(soft_match, 1),
            "project_match": round(project_match, 1),
            "academic_score": round(academic_score, 1),
            "technical_assessment": round(technical_assessment, 1),
            "aptitude_score": round(aptitude, 1),
            "matched_technical_skills": matched_technical,
            "missing_technical_skills": missing_technical,
            "matched_soft_skills": matched_soft,
            "missing_soft_skills": missing_soft,
            "matched_project_keywords": matched_projects,
            "target_role": _text(student.get("target_role", "")),
        })

    return sorted(
        results,
        key=lambda item: item["match_score"],
        reverse=True
    )
