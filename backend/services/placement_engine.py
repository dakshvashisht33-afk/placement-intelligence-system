import pandas as pd
import numpy as np
from pathlib import Path


# ============================================================
# FILE LOCATIONS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"

STUDENTS_FILE = DATA_DIR / "students.csv"
COMPANIES_FILE = DATA_DIR / "companies.csv"


# ============================================================
# LOAD DATA
# ============================================================

students_df = pd.read_csv(STUDENTS_FILE)
companies_df = pd.read_csv(COMPANIES_FILE)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def convert_to_set(value):
    if pd.isna(value):
        return set()

    return {
        item.strip().lower()
        for item in str(value).split(",")
        if item.strip()
    }


def calculate_match(student_value, company_value):
    student_set = convert_to_set(student_value)
    company_set = convert_to_set(company_value)

    if not company_set:
        return 0.0

    return round(
        len(student_set.intersection(company_set))
        / len(company_set) * 100,
        2
    )


def get_missing_items(student_value, company_value):
    student_set = convert_to_set(student_value)
    company_set = convert_to_set(company_value)

    return sorted(company_set - student_set)


def safe_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def safe_int(value, default=0):
    try:
        return int(value)
    except Exception:
        return default


def calculate_numeric_score(value):
    return float(np.clip(float(value), 0, 100))


# ============================================================
# ELIGIBILITY
# ============================================================

def check_academic_eligibility(student, company):

    reasons = []

    if safe_float(student["cgpa"]) < safe_float(company["min_cgpa"]):
        reasons.append(
            f"CGPA below required {company['min_cgpa']}"
        )

    if safe_int(student["backlogs"]) > safe_int(company["max_backlogs"]):
        reasons.append(
            f"Backlogs exceed allowed maximum of {company['max_backlogs']}"
        )

    return len(reasons) == 0, reasons


# ============================================================
# PLACEMENT ANALYSIS
# ============================================================

def analyze_student_company(student, company):

    eligible, reasons = check_academic_eligibility(
        student,
        company
    )

    # Technical skill matching
    skill_match = calculate_match(
        student["skills"],
        company["required_skills"]
    )

    # Soft skill matching
    soft_score = calculate_match(
        student["soft_skills"],
        company["required_soft_skills"]
    )

    # Assessment scores
    aptitude_score = calculate_numeric_score(
        student["aptitude_score"]
    )

    technical_assessment = calculate_numeric_score(
        student["technical_score"]
    )

    # Role matching
    student_role = str(
        student.get("target_role", "")
    ).strip().lower()

    company_role = str(
        company["role"]
    ).strip().lower()

    role_score = 100 if student_role == company_role else 0

    # Academic score
    min_cgpa = safe_float(company["min_cgpa"])
    student_cgpa = safe_float(student["cgpa"])

    academic_score = (
        min(student_cgpa / min_cgpa * 100, 100)
        if min_cgpa > 0
        else 100
    )

    # ========================================================
    # EXPERIENCE
    # ========================================================

    internships = safe_int(
        student.get("internships", 0)
    )

    projects = safe_int(
        student.get("projects", 0)
    )

    project_type = str(
        student.get("project_type", "")
    ).lower()

    internship_type = str(
        student.get("internship_type", "")
    ).lower()

    company_role_key = str(
        company["role"]
    ).lower()

    role_terms = {

        "data analyst": [
            "data",
            "analytics",
            "business intelligence",
            "financial",
            "customer"
        ],

        "ml engineer": [
            "machine learning",
            "deep learning",
            "nlp",
            "predictive",
            "risk"
        ],

        "cloud engineer": [
            "cloud",
            "devops",
            "infrastructure",
            "security",
            "reliability"
        ],

        "sde": [
            "software",
            "backend",
            "full stack",
            "web",
            "mobile"
        ],

        "business analyst": [
            "business",
            "product",
            "market",
            "operations",
            "fintech"
        ]
    }

    terms = role_terms.get(
        company_role_key,
        []
    )

    project_specialization = (
        100
        if any(t in project_type for t in terms)
        else 45
    )

    internship_specialization = (
        100
        if any(t in internship_type for t in terms)
        else (
            35
            if internships == 0
            else 55
        )
    )

    experience_score = min(

        0.30 * min(
            projects / 3 * 100,
            100
        )

        +

        0.25 * min(
            internships / 2 * 100,
            100
        )

        +

        0.25 * project_specialization

        +

        0.20 * internship_specialization,

        100
    )

    # ========================================================
    # FINAL FIT SCORE
    # ========================================================

    fit_score = (

        academic_score * 0.15

        +

        skill_match * 0.15

        +

        technical_assessment * 0.18

        +

        aptitude_score * 0.12

        +

        soft_score * 0.12

        +

        role_score * 0.10

        +

        experience_score * 0.18
    )

    # Penalize candidates who are not eligible
    if not eligible:
        fit_score *= 0.55

    # ========================================================
    # MISSING SKILLS
    # ========================================================

    missing_technical = get_missing_items(
        student["skills"],
        company["required_skills"]
    )

    missing_soft = get_missing_items(
        student["soft_skills"],
        company["required_soft_skills"]
    )

    # ========================================================
    # RESULT
    # ========================================================

    return {

        "company": company["company"],

        "industry": company["industry"],

        "role": company["role"],

        "package": int(
            company.get("package", 0)
        ),

        "eligible": bool(eligible),

        "academic_score": round(
            academic_score,
            2
        ),

        "technical_skill_score": round(
            skill_match,
            2
        ),

        "technical_assessment_score": round(
            technical_assessment,
            2
        ),

        "aptitude_score": round(
            aptitude_score,
            2
        ),

        "soft_skill_score": round(
            soft_score,
            2
        ),

        "role_score": role_score,

        "experience_score": round(
            experience_score,
            2
        ),

        "project_specialization_score": round(
            project_specialization,
            2
        ),

        "internship_specialization_score": round(
            internship_specialization,
            2
        ),

        "fit_score": round(
            fit_score,
            2
        ),

        "missing_technical_skills":
            missing_technical,

        "missing_soft_skills":
            missing_soft,

        "eligibility_reasons":
            reasons
    }


# ============================================================
# ANALYZE ONE STUDENT AGAINST ALL COMPANIES
# ============================================================

def compute_all_company_results(student):

    results = []

    for _, company in companies_df.iterrows():

        result = analyze_student_company(
            student,
            company
        )

        results.append(result)

    results_df = pd.DataFrame(results)

    return results_df.sort_values(
        "fit_score",
        ascending=False
    ).reset_index(drop=True)