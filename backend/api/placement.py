
from fastapi import APIRouter, HTTPException
import pandas as pd
from pathlib import Path

from services.placement_engine import compute_all_company_results
from services.gemini_service import (
    generate_placement_analysis,
    generate_interview_questions,
)
from services.role_matcher import calculate_role_match


router = APIRouter(prefix="/placement", tags=["Placement"])

PROJECT_ROOT = Path(__file__).resolve().parents[2]
students_df = pd.read_csv(PROJECT_ROOT / "data" / "students.csv")


def find_student(student_id: str):
    """Find a student by ID, ignoring letter case and surrounding spaces."""
    matches = students_df[
        students_df["student_id"].astype(str).str.strip().str.lower()
        == student_id.strip().lower()
    ]

    if matches.empty:
        raise HTTPException(
            status_code=404,
            detail="Student ID not found"
        )

    return matches.iloc[0]


def build_student_profile(student):
    """Build the student profile used by the API and Gemini."""
    return {
        "student_id": str(student["student_id"]),
        "name": str(student["name"]),
        "department": str(student["department"]),
        "cgpa": float(student["cgpa"]),
        "target_role": str(student["target_role"]),
        "skills": str(student["skills"]),
        "soft_skills": str(student["soft_skills"]),
    }


@router.get("/student/{student_id}")
def get_student(student_id: str):
    student = find_student(student_id)
    return build_student_profile(student)


@router.get("/analyze/{student_id}")
def analyze_student(student_id: str):
    student = find_student(student_id)

    results_df = compute_all_company_results(student)
    top_results = results_df.head(15)

    results = []

    for _, row in top_results.iterrows():
        results.append({
            "company": str(row["company"]),
            "industry": str(row["industry"]),
            "role": str(row["role"]),
            "package": float(row["package"]),
            "eligible": bool(row["eligible"]),
            "academic_score": float(row["academic_score"]),
            "technical_skill_score": float(row["technical_skill_score"]),
            "technical_assessment_score": float(row["technical_assessment_score"]),
            "aptitude_score": float(row["aptitude_score"]),
            "soft_skill_score": float(row["soft_skill_score"]),
            "role_score": float(row["role_score"]),
            "experience_score": float(row["experience_score"]),
            "fit_score": float(row["fit_score"]),
            "missing_technical_skills": row["missing_technical_skills"],
            "missing_soft_skills": row["missing_soft_skills"],
            "eligibility_reasons": row["eligibility_reasons"],
        })

    return {
        "student": {
            "student_id": str(student["student_id"]),
            "name": str(student["name"]),
            "department": str(student["department"]),
            "target_role": str(student["target_role"]),
            "cgpa": float(student["cgpa"]),
        },
        "companies_analyzed": len(results_df),
        "top_companies": results,
    }


@router.get("/ai-analyze/{student_id}")
def ai_analyze_student(student_id: str):
    student = find_student(student_id)

    results_df = compute_all_company_results(student)
    top_results = results_df.head(15).to_dict(orient="records")

    student_profile = build_student_profile(student)

    try:
        ai_analysis = generate_placement_analysis(
            student_profile,
            top_results
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="AI placement analysis failed. Check the backend terminal."
        )

    return {
        "student": student_profile,
        "placement_results": top_results,
        "ai_analysis": ai_analysis,
    }


@router.get("/role-match/{student_id}")
def role_match_student(student_id: str):
    student = find_student(student_id)

    role_results = calculate_role_match(student.to_dict())

    return {
        "student": {
            "student_id": str(student["student_id"]),
            "name": str(student["name"]),
            "department": str(student["department"]),
            "cgpa": float(student["cgpa"]),
            "target_role": str(student["target_role"]),
        },
        "roles_analyzed": len(role_results),
        "roles": role_results,
    }


@router.get("/interview-prep/{student_id}")
def interview_prep_student(student_id: str):
    student = find_student(student_id)
    student_profile = build_student_profile(student)

    skills = [
        skill.strip()
        for skill in str(student["skills"]).split(",")
        if skill.strip()
    ]

    try:
        questions = generate_interview_questions(
            student_profile,
            skills
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Interview question generation failed. Check the backend terminal."
        )

    return {
        "student": student_profile,
        "questions": questions,
        "total_questions": len(questions),
    }
