import { useState } from "react";



import "./App.css";







function App() {



  const [studentId, setStudentId] = useState("S001");







  const [student, setStudent] = useState(null);



  const [companies, setCompanies] = useState([]);







  const [loading, setLoading] = useState(false);



  const [companyLoading, setCompanyLoading] = useState(false);



  const [aiLoading, setAiLoading] = useState(false);



  const [aiAnalysis, setAiAnalysis] = useState(null);



  const [roleMatches, setRoleMatches] = useState([]);



  const [roleLoading, setRoleLoading] = useState(false);



  const [readiness, setReadiness] = useState(null);



  const [skillProgress, setSkillProgress] = useState({});

  const [practiceQuestions, setPracticeQuestions] = useState([]);

  const [practiceLoading, setPracticeLoading] = useState(false);





  const [error, setError] = useState("");



  const [showAllCompanies, setShowAllCompanies] = useState(false);

   const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");







  // ==========================================



  // GET STUDENT PROFILE



  // ==========================================







  const analyzeStudent = async () => {



    if (!studentId.trim()) {



      setError("Please enter a Student ID.");



      return;



    }







    const normalizedStudentId = studentId.trim().toUpperCase();







    setStudentId(normalizedStudentId);



    setLoading(true);



    setError("");







    // Clear previous results



    setStudent(null);



    setCompanies([]);



    setAiAnalysis(null);



    setRoleMatches([]);



    setReadiness(null);

    setSkillProgress({});

    setPracticeQuestions([]);



    setShowAllCompanies(false);







    try {



      const controller = new AbortController();

const timeoutId = setTimeout(() => controller.abort(), 90000);



let response;



try {

  response = await fetch(

    `${API_BASE_URL}/placement/student/${encodeURIComponent(normalizedStudentId)}`,

    { signal: controller.signal }

  );

} catch (err) {

  if (err.name === "AbortError") {

    throw new Error("Request timed out. Check the backend and Gemini API.");

  }

  throw err;

} finally {

  clearTimeout(timeoutId);

}







      if (!response.ok) {
        let message = `Request failed (${response.status}).`;
        try {
          const errorData = await response.json();
          if (typeof errorData.detail === "string") message = errorData.detail;
        } catch {
          // Keep the status-based message if the response isn't JSON.
        }
        throw new Error(message);
      }







      const data = await response.json();







      setStudent(data);







    } catch (err) {



      setError(err.message);



    } finally {



      setLoading(false);



    }



  };











  // ==========================================



  // ANALYZE COMPANIES



  // ==========================================







  const analyzeCompanies = async () => {



    if (!student) {



      return;



    }







    setCompanyLoading(true);



    setError("");







    try {



      const response = await fetch(



        `${API_BASE_URL}/placement/analyze/${encodeURIComponent(student.student_id)}`



      );







      if (!response.ok) {



        throw new Error("Unable to analyze companies.");



      }







      const data = await response.json();







      console.log("Company analysis response:", data);







      // IMPORTANT:



      // Backend returns the companies inside top_companies



      const companyResults = data.top_companies || [];



      setCompanies(companyResults);







      // Calculate a deterministic placement-readiness snapshot



      // from the scores already returned by the backend.



      if (companyResults.length > 0) {



        const average = (key) =>



          companyResults.reduce(



            (sum, item) => sum + Number(item[key] || 0),



            0



          ) / companyResults.length;







        const academic = average("academic_score");



        const technical = average("technical_assessment_score");



        const aptitude = average("aptitude_score");



        const softSkills = average("soft_skill_score");



        const experience = average("experience_score");



        const averageFit = average("fit_score");







        const score = Math.round(



          academic * 0.20 +



          technical * 0.20 +



          aptitude * 0.15 +



          softSkills * 0.15 +



          experience * 0.15 +



          averageFit * 0.15



        );







        const technicalGaps = [



          ...new Set(



            companyResults.flatMap((item) =>



              Array.isArray(item.missing_technical_skills)



                ? item.missing_technical_skills



                : []



            )



          )



        ];







        const softGaps = [



          ...new Set(



            companyResults.flatMap((item) =>



              Array.isArray(item.missing_soft_skills)



                ? item.missing_soft_skills



                : []



            )



          )



        ];







        let label = "Needs Improvement";



        if (score >= 80) label = "Placement Ready";



        else if (score >= 65) label = "Almost Ready";



        else if (score >= 50) label = "Developing";







        setReadiness({



          score: Math.min(100, Math.max(0, score)),



          label,



          academic: Math.round(academic),



          technical: Math.round(technical),



          aptitude: Math.round(aptitude),



          softSkills: Math.round(softSkills),



          experience: Math.round(experience),



          averageFit: Math.round(averageFit),



          eligibleCompanies: companyResults.filter((item) => item.eligible).length,



          totalCompanies: companyResults.length,



          technicalGaps: technicalGaps.slice(0, 8),



          softGaps: softGaps.slice(0, 6),



        });



      }







    } catch (err) {



      console.error(err);



      setError(err.message);



    } finally {



      setCompanyLoading(false);



    }



  };











  // ==========================================



  // CAREER ROLE MATCH



  // ==========================================







  const analyzeRoleMatches = async () => {



    if (!student) {



      return;



    }







    setRoleLoading(true);



    setError("");







    try {



      const response = await fetch(



        `${API_BASE_URL}/placement/role-match/${encodeURIComponent(student.student_id)}`



      );







      if (!response.ok) {



        throw new Error("Unable to analyze career roles.");



      }







      const data = await response.json();







      console.log("Role match response:", data);







      setRoleMatches(data.roles || []);







    } catch (err) {



      console.error(err);



      setError(err.message);



    } finally {



      setRoleLoading(false);



    }



  };











  // ==========================================



  // AI PLACEMENT ANALYSIS



  // ==========================================







  const analyzeWithAI = async () => {



    if (!student) {



      return;



    }







    setAiLoading(true);



    setError("");







    try {



      const response = await fetch(



        `${API_BASE_URL}/placement/ai-analyze/${encodeURIComponent(student.student_id)}`



      );







      if (!response.ok) {



        throw new Error("Unable to generate AI placement analysis.");



      }







      const data = await response.json();







      console.log("AI analysis response:", data);







      setAiAnalysis(data.ai_analysis || null);







    } catch (err) {



      console.error(err);



      setError(err.message);



    } finally {



      setAiLoading(false);



    }



  };











  // ==========================================



  // ==========================================

  // PREPARATION TRACKER

  // ==========================================



  const getPreparationSkills = () => {

    const skills = new Set();



    companies.forEach((company) => {

      (company.missing_technical_skills || []).forEach((skill) => skills.add(skill));

      (company.missing_soft_skills || []).forEach((skill) => skills.add(skill));

    });



    roleMatches.slice(0, 2).forEach((role) => {

      (role.missing_technical_skills || []).slice(0, 4).forEach((skill) => skills.add(skill));

      (role.missing_soft_skills || []).slice(0, 2).forEach((skill) => skills.add(skill));

    });



    return Array.from(skills).slice(0, 10);

  };



  const trackerSkills = getPreparationSkills();

  const trackerStatuses = ["Not Started", "Learning", "Practicing", "Ready"];



  const updateSkillStatus = (skill, status) => {

    setSkillProgress((prev) => ({ ...prev, [skill]: status }));

  };



  const trackerReadyCount = trackerSkills.filter(

    (skill) => skillProgress[skill] === "Ready"

  ).length;



  const trackerProgress = trackerSkills.length

    ? Math.round(

        trackerSkills.reduce((sum, skill) => {

          const index = trackerStatuses.indexOf(skillProgress[skill] || "Not Started");

          return sum + Math.max(index, 0) * 33.33;

        }, 0) / trackerSkills.length

      )

    : 0;



  // ==========================================

  // INTERVIEW PREPARATION

  // ==========================================





const generatePracticeQuestions = async () => {

  if (!student?.student_id) {

    setError("Please load a student profile first.");

    return;

  }



  setPracticeLoading(true);

  setError("");



  try {

    const response = await fetch(

      `${API_BASE_URL}/placement/interview-prep/${encodeURIComponent(

        student.student_id

      )}`

    );



    if (!response.ok) {

      throw new Error(

        "Unable to generate interview questions. Please try again."

      );

    }



    const data = await response.json();



    if (!Array.isArray(data.questions)) {

      throw new Error("The backend returned an invalid question list.");

    }



    setPracticeQuestions(data.questions);

  } catch (err) {

    console.error("Interview preparation error:", err);

    setError(err.message);

  } finally {

    setPracticeLoading(false);

  }

};





  // UI



  // ==========================================







  return (



    <div className="app">







      {/* ======================================



          HEADER



      ====================================== */}







      <header className="header">







        <div>







          <div className="logo">



            🎓 Placement Intelligence



          </div>







          <p>



            AI-powered university placement assistant



          </p>







        </div>







        <div className="status">







          <span></span>







          System Online







        </div>







      </header>











      <main className="container">











        {/* ======================================



            HERO



        ====================================== */}







        <section className="hero">







          <div className="hero-text">







            <span className="badge">



              ✨ AI POWERED



            </span>







            <h1>



              Understand your



              <span> placement potential.</span>



            </h1>







            <p>



              Enter your Student ID to analyze your profile,



              skills and career opportunities.



            </p>







          </div>











          {/* SEARCH CARD */}







          <div className="search-card">







            <label>



              Student ID



            </label>







            <div className="search-row">







              <input



                type="text"



                placeholder="Example: S001"



                value={studentId}



                onChange={(e) => {



                  setStudentId(e.target.value);



                  if (error) setError("");



                }}



                onKeyDown={(e) => {







                  if (e.key === "Enter") {



                    analyzeStudent();



                  }







                }}



              />







              <button



                onClick={analyzeStudent}



                disabled={loading}



              >







                {loading



                  ? "Loading..."



                  : "Analyze →"}







              </button>







            </div>











            {error && (







              <div className="error">



                ⚠️ {error}



              </div>







            )}







          </div>







        </section>











        {/* ======================================



            STUDENT PROFILE



        ====================================== */}







        {student && (







          <section className="results">











            <div className="section-title">







              <span>



                YOUR PROFILE



              </span>







              <h2>



                Student Overview



              </h2>







            </div>











            {/* PROFILE CARDS */}







            <div className="profile-grid">











              {/* STUDENT */}







              <div className="profile-card main-profile">







                <div className="avatar">







                  {student.name?.charAt(0)}







                </div>







                <div>







                  <h2>



                    {student.name}



                  </h2>







                  <p>



                    {student.department}



                  </p>







                  <small>



                    Student ID: {student.student_id}



                  </small>







                </div>







              </div>











              {/* CGPA */}







              <div className="stat-card">







                <span>



                  CGPA



                </span>







                <strong>



                  {student.cgpa}



                </strong>







                <small>



                  Academic Score



                </small>







              </div>











              {/* TARGET ROLE */}







              <div className="stat-card">







                <span>



                  Target Role



                </span>







                <strong className="role">



                  {student.target_role}



                </strong>







                <small>



                  Career Goal



                </small>







              </div>







            </div>











            {/* ==================================



                SKILLS



            ================================== */}







            <div className="info-grid">











              {/* TECHNICAL SKILLS */}







              <div className="info-card">







                <h3>



                  💻 Technical Skills



                </h3>







                <div className="tags">







                  {student.skills



                    ?.split(",")



                    .map((skill, index) => (







                      <span key={index}>



                        {skill.trim()}



                      </span>







                    ))}







                </div>







              </div>











              {/* SOFT SKILLS */}







              <div className="info-card">







                <h3>



                  🤝 Soft Skills



                </h3>







                <div className="tags">







                  {student.soft_skills



                    ?.split(",")



                    .map((skill, index) => (







                      <span key={index}>



                        {skill.trim()}



                      </span>







                    ))}







                </div>







              </div>







            </div>











            {/* ==================================



                PLACEMENT READINESS



            ================================== */}







            {readiness && (



              <section className="readiness-section">



                <div className="section-title">



                  <span>PLACEMENT READINESS</span>



                  <h2>How ready are you for placements?</h2>



                </div>







                <div className="readiness-grid">



                  <div className="readiness-score-card">



                    <div className="readiness-ring">



                      <strong>{readiness.score}</strong>



                      <span>/100</span>



                    </div>



                    <div>



                      <span className="readiness-label">{readiness.label}</span>



                      <h3>Your current readiness snapshot</h3>



                      <p>Based on the academic, assessment, skills, experience and company-fit scores available in the system.</p>



                    </div>



                  </div>







                  <div className="readiness-metrics">



                    {[



                      ["Academic", readiness.academic],



                      ["Technical", readiness.technical],



                      ["Aptitude", readiness.aptitude],



                      ["Soft Skills", readiness.softSkills],



                      ["Experience", readiness.experience],



                      ["Average Fit", readiness.averageFit],



                    ].map(([label, value]) => (



                      <div className="readiness-metric" key={label}>



                        <div><span>{label}</span><strong>{value}%</strong></div>



                        <div className="readiness-bar"><div style={{width: `${value}%`}}></div></div>



                      </div>



                    ))}



                  </div>



                </div>







                <div className="readiness-bottom-grid">



                  <div className="readiness-mini-card">



                    <span>✅ Eligibility Snapshot</span>



                    <strong>{readiness.eligibleCompanies} / {readiness.totalCompanies}</strong>



                    <small>companies currently meet the eligibility rules</small>



                  </div>



                  <div className="readiness-mini-card">



                    <span>🔧 Priority Technical Gaps</span>



                    <div className="readiness-tags">



                      {readiness.technicalGaps.length > 0



                        ? readiness.technicalGaps.map((skill, index) => <em key={index}>{skill}</em>)



                        : <small>No major technical gaps found.</small>}



                    </div>



                  </div>



                  <div className="readiness-mini-card">



                    <span>🤝 Soft-Skill Gaps</span>



                    <div className="readiness-tags">



                      {readiness.softGaps.length > 0



                        ? readiness.softGaps.map((skill, index) => <em key={index}>{skill}</em>)



                        : <small>No major soft-skill gaps found.</small>}



                    </div>



                  </div>



                </div>







                <div className="readiness-disclaimer">



                  Readiness is a project-defined profile indicator. It is not a probability of getting placed and does not guarantee selection.



                </div>



              </section>



            )}











            {/* ==================================



                ANALYZE COMPANIES



            ================================== */}







            <div className="next-card">







              <div>







                <span>



                  🚀 NEXT STEP



                </span>







                <h2>



                  Ready for your placement analysis?



                </h2>







                <p>



                  Compare your profile against companies



                  and identify your strongest opportunities.



                </p>







              </div>











              <button



                onClick={analyzeCompanies}



                disabled={companyLoading}



              >







                {companyLoading



                  ? "Analyzing..."



                  : "Analyze Companies →"}







              </button>







            </div>











            {/* ==================================



                COMPANY RESULTS



            ================================== */}







            {companies.length > 0 && (







              <section className="company-results">











                <div className="section-title">







                  <span>



                    COMPANY MATCHES



                  </span>







                  <h2>



                    Companies matching your profile



                  </h2>







                </div>











                {/* COMPANY GRID */}



                <div className="company-summary">







  <div className="summary-card">



    <span>🏢</span>



    <div>



      <strong>{companies.length}</strong>



      <small>Companies Analyzed</small>



    </div>



  </div>







  <div className="summary-card">



    <span>✅</span>



    <div>



      <strong>



        {companies.filter(



          (company) => company.eligible



        ).length}



      </strong>



      <small>Eligible Companies</small>



    </div>



  </div>







  <div className="summary-card">



    <span>📊</span>



    <div>



      <strong>



        {companies.length > 0



          ? Math.round(



              companies.reduce(



                (sum, company) =>



                  sum + Number(company.fit_score || 0),



                0



              ) / companies.length



            )



          : 0}



        %



      </strong>



      <small>Average Fit</small>



    </div>



  </div>







  <div className="summary-card highlight">



    <span>⭐</span>



    <div>



      <strong>



        {companies.length > 0



          ? Math.round(companies[0].fit_score)



          : 0}



        %



      </strong>



      <small>Top Match</small>



    </div>



  </div>







</div>







                <div className="company-grid">







                  {(showAllCompanies



  ? companies



  : companies.slice(0, 3)



).map((company, index) => (







                    <div



                      className="company-card"



                      key={`${company.company}-${company.role}-${index}`}



                    >











                      {/* COMPANY HEADER */}







                      <div className="company-top">







                        <div>







                          <h3>



                            {company.company}



                          </h3>







                          <p>



                            {company.industry}



                          </p>







                        </div>











                        {/* FIT SCORE */}







                        <div className="fit-score-box">



  <div className="fit-score">



    {Math.round(company.fit_score)}



    <small>Fit</small>



  </div>







  <div className="fit-bar">



    <div



      className="fit-bar-fill"



      style={{



        width: `${Math.min(



          Math.max(company.fit_score, 0),



          100



        )}%`



      }}



    ></div>



  </div>



</div>







                      </div>











                      {/* ROLE */}







                      <div className="company-role">







                        <span>



                          Role



                        </span>







                        <strong>



                          {company.role}



                        </strong>







                      </div>











                      {/* DETAILS */}







                      <div className="company-details">











                        <div>







                          <span>



                            Package



                          </span>







                          <strong>



                            ₹{company.package} LPA



                          </strong>







                        </div>











                        <div>







                          <span>



                            Eligibility



                          </span>







                          <div



  className={



    company.eligible



      ? "eligibility-badge eligible"



      : "eligibility-badge not-eligible"



  }



>



  <span>



    {company.eligible ? "✓" : "×"}



  </span>







  {company.eligible



    ? "Eligible"



    : "Not Eligible"}



</div>







                        </div>







                      </div>











                      {/* TECHNICAL SKILL GAPS */}







                      {company.missing_technical_skills?.length > 0 && (







                        <div className="missing-skills">







                          <span>



                            🔧 Skill Gaps



                          </span>







                          <div className="skill-gap-list">



                            {company.missing_technical_skills



                              .slice(0, 4)



                              .map((skill, skillIndex) => (



                                <span key={skillIndex}>



                                  {skill}



                                </span>



                              ))}



                          </div>







                        </div>







                      )}











                      {/* SOFT SKILL GAPS */}







                      {company.missing_soft_skills?.length > 0 && (







                        <div className="missing-skills">







                          <span>



                            🤝 Soft Skill Gaps



                          </span>







                          <div className="skill-gap-list">



                            {company.missing_soft_skills



                              .slice(0, 3)



                              .map((skill, skillIndex) => (



                                <span key={skillIndex}>



                                  {skill}



                                </span>



                              ))}



                          </div>







                        </div>







                      )}







                    </div>







                  ))}







                </div>











                {/* VIEW ALL / TOP MATCHES */}







                {companies.length > 3 && (



                  <div className="company-toggle">



                    <button



                      className="view-all-button"



                      onClick={() =>



                        setShowAllCompanies(!showAllCompanies)



                      }



                    >



                      {showAllCompanies



                        ? "↑ Show Top 3"



                        : `View All ${companies.length} Companies →`}



                    </button>



                  </div>



                )}







                {/* RESULTS COUNT */}







                <div className="results-count">



                  Showing{" "}



                  <strong>



                    {showAllCompanies



                      ? companies.length



                      : Math.min(3, companies.length)}



                  </strong>{" "}



                  of <strong>{companies.length}</strong> company matches



                </div>







              </section>







            )}











            {/* ==================================



                CAREER ROLE MATCH



            ================================== */}







            {companies.length > 0 && (



              <section className="role-match-section">







                <div className="role-match-header">



                  <div>



                    <span className="role-match-label">💼 CAREER ROLE MATCH</span>



                    <h2>Which career path fits you best?</h2>



                    <p>



                      Compare your current profile with the five career paths



                      supported by the placement system.



                    </p>



                  </div>







                  {!roleMatches.length && (



                    <button



                      className="role-match-button"



                      onClick={analyzeRoleMatches}



                      disabled={roleLoading}



                    >



                      {roleLoading ? "Analyzing..." : "Analyze Career Roles →"}



                    </button>



                  )}



                </div>







                {roleLoading && (



                  <div className="role-loading-card">



                    <div className="role-spinner"></div>



                    <div>



                      <strong>Analyzing your career fit...</strong>



                      <p>Comparing your skills, projects and assessments.</p>



                    </div>



                  </div>



                )}







                {roleMatches.length > 0 && (



                  <>



                    <div className="role-match-grid">



                      {roleMatches.map((role, index) => {



                        const isTarget =



                          role.role?.toLowerCase() ===



                          student.target_role?.toLowerCase();







                        return (



                          <div



                            className={`role-match-card ${index === 0 ? "top-role" : ""}`}



                            key={role.role}



                          >



                            <div className="role-card-top">



                              <div>



                                <span className="role-rank">#{index + 1}</span>



                                <h3>{role.role}</h3>



                                {isTarget && (



                                  <span className="target-role-badge">YOUR TARGET</span>



                                )}



                              </div>







                              <div className="role-match-score">



                                <strong>{Math.round(role.match_score)}%</strong>



                                <span>Match</span>



                              </div>



                            </div>







                            <div className="role-progress">



                              <div



                                style={{



                                  width: `${Math.min(



                                    Math.max(Number(role.match_score || 0), 0),



                                    100



                                  )}%`



                                }}



                              ></div>



                            </div>







                            <div className="role-metrics">



                              <div>



                                <span>Technical</span>



                                <strong>{Math.round(role.technical_match)}%</strong>



                              </div>



                              <div>



                                <span>Soft Skills</span>



                                <strong>{Math.round(role.soft_skill_match)}%</strong>



                              </div>



                              <div>



                                <span>Projects</span>



                                <strong>{Math.round(role.project_match)}%</strong>



                              </div>



                            </div>







                            {role.matched_technical_skills?.length > 0 && (



                              <div className="role-skill-block">



                                <span>✓ Your strengths</span>



                                <div>



                                  {role.matched_technical_skills.slice(0, 5).map((skill, i) => (



                                    <em key={i}>{skill}</em>



                                  ))}



                                </div>



                              </div>



                            )}







                            {role.missing_technical_skills?.length > 0 && (



                              <div className="role-skill-block missing">



                                <span>⚠ Improve</span>



                                <div>



                                  {role.missing_technical_skills.slice(0, 5).map((skill, i) => (



                                    <em key={i}>{skill}</em>



                                  ))}



                                </div>



                              </div>



                            )}







                            {role.missing_soft_skills?.length > 0 && (



                              <div className="role-skill-block missing">



                                <span>🤝 Soft-skill gaps</span>



                                <div>



                                  {role.missing_soft_skills.slice(0, 4).map((skill, i) => (



                                    <em key={i}>{skill}</em>



                                  ))}



                                </div>



                              </div>



                            )}



                          </div>



                        );



                      })}



                    </div>







                    <div className="role-match-disclaimer">



                      Career-role match is a profile-fit indicator based on the



                      requirements defined in this system. It is not a hiring



                      probability or guarantee of placement.



                    </div>



                  </>



                )}



              </section>



            )}











            {/* ==================================



                AI PLACEMENT INTELLIGENCE



            ================================== */}







            {companies.length > 0 && (



              <section className="ai-section">







                <div className="ai-header-card">



                  <div>



                    <span className="ai-label">🤖 AI PLACEMENT INTELLIGENCE</span>



                    <h2>Turn your placement data into a career plan.</h2>



                    <p>



                      Gemini analyzes your profile, company matches and skill gaps



                      to generate practical recommendations.



                    </p>



                  </div>







                  {!aiAnalysis && (



                    <button



                      className="ai-button"



                      onClick={analyzeWithAI}



                      disabled={aiLoading}



                    >



                      {aiLoading



                        ? "Generating..."



                        : "Generate AI Insights →"}



                    </button>



                  )}



                </div>







                {aiLoading && (



                  <div className="ai-loading-card">



                    <div className="ai-spinner"></div>



                    <div>



                      <strong>Analyzing your placement profile...</strong>



                      <p>Gemini is preparing your personalized recommendations.</p>



                    </div>



                  </div>



                )}







                {aiAnalysis && (



                  <div className="ai-content">







                    {aiAnalysis.summary && (



                      <div className="ai-summary-card">



                        <span>✨ OVERALL ASSESSMENT</span>



                        <p>{aiAnalysis.summary}</p>



                      </div>



                    )}







                    <div className="ai-two-column">







                      {aiAnalysis.strengths?.length > 0 && (



                        <div className="ai-card">



                          <div className="ai-card-title">



                            <span>💪</span>



                            <div>



                              <small>WHAT YOU ALREADY HAVE</small>



                              <h3>Strengths</h3>



                            </div>



                          </div>







                          <ul className="ai-list">



                            {aiAnalysis.strengths.map((strength, index) => (



                              <li key={index}>{strength}</li>



                            ))}



                          </ul>



                        </div>



                      )}







                      {aiAnalysis.learning_priorities?.length > 0 && (



                        <div className="ai-card">



                          <div className="ai-card-title">



                            <span>📚</span>



                            <div>



                              <small>FOCUS NEXT</small>



                              <h3>Learning Priorities</h3>



                            </div>



                          </div>







                          <div className="priority-list">



                            {aiAnalysis.learning_priorities.map((item, index) => (



                              <div className="priority-item" key={index}>



                                <strong>{item.skill}</strong>



                                <p>{item.reason}</p>



                              </div>



                            ))}



                          </div>



                        </div>



                      )}







                    </div>







                    {aiAnalysis.company_analysis?.length > 0 && (



                      <div className="ai-card">



                        <div className="ai-card-title">



                          <span>🏢</span>



                          <div>



                            <small>AI INTERPRETATION</small>



                            <h3>Company Insights</h3>



                          </div>



                        </div>







                        <div className="ai-company-list">



                          {aiAnalysis.company_analysis.map((company, index) => (



                            <div className="ai-company-item" key={index}>



                              <div className="ai-company-top">



                                <div>



                                  <strong>{company.company}</strong>



                                  <span>{company.role}</span>



                                </div>







                                <div className="ai-fit">



                                  {Math.round(Number(company.fit_score || 0))}%



                                </div>



                              </div>







                              {company.why_it_matches && (



                                <p>{company.why_it_matches}</p>



                              )}







                              {company.missing_skills?.length > 0 && (



                                <div className="ai-missing">



                                  <span>Missing skills</span>



                                  <div>



                                    {company.missing_skills.map((skill, skillIndex) => (



                                      <em key={skillIndex}>{skill}</em>



                                    ))}



                                  </div>



                                </div>



                              )}



                            </div>



                          ))}



                        </div>



                      </div>



                    )}







                    {aiAnalysis.improvement_plan?.length > 0 && (



                      <div className="ai-card improvement-plan-card">



                        <div className="ai-card-title">



                          <span>🎯</span>



                          <div>



                            <small>WHAT TO IMPROVE</small>



                            <h3>Personalized Improvement Plan</h3>



                          </div>



                        </div>







                        <div className="improvement-plan-list">



                          {aiAnalysis.improvement_plan.map((item, index) => (



                            <div className="improvement-item" key={index}>



                              <div className="improvement-top">



                                <span className="improvement-number">{item.priority || index + 1}</span>



                                <div>



                                  <div className="improvement-title-row">



                                    <h4>{item.skill}</h4>



                                    {item.importance && <span className={`importance-badge ${String(item.importance).toLowerCase()}`}>{item.importance}</span>}



                                  </div>



                                  {item.why && <p className="improvement-why">{item.why}</p>}



                                </div>



                              </div>



                              <div className="improvement-columns">



                                {item.learn?.length > 0 && <div className="improvement-block"><strong>📚 Learn</strong><ul>{item.learn.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}



                                {item.practice?.length > 0 && <div className="improvement-block"><strong>🧪 Practice</strong><ul>{item.practice.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}



                              </div>



                              {item.build && <div className="improvement-build"><strong>🛠 Build:</strong> {item.build}</div>}



                            </div>



                          ))}



                        </div>



                      </div>



                    )}







                    {aiAnalysis.thirty_day_plan?.length > 0 && (



                      <div className="ai-card thirty-day-card">



                        <div className="ai-card-title">



                          <span>📅</span>



                          <div>



                            <small>EXECUTION PLAN</small>



                            <h3>30-Day Action Plan</h3>



                          </div>



                        </div>







                        <div className="thirty-day-grid">



                          {aiAnalysis.thirty_day_plan.map((week, index) => (



                            <div className="week-card" key={index}>



                              <span className="week-number">{index + 1}</span>



                              <div className="week-content">



                                <small>{week.week}</small>



                                <h4>{week.focus}</h4>



                                {week.actions?.length > 0 && <ul>{week.actions.map((action, i) => <li key={i}>{action}</li>)}</ul>}



                              </div>



                            </div>



                          ))}



                        </div>



                      </div>



                    )}







                    {aiAnalysis.career_roadmap?.length > 0 && (



                      <div className="ai-card roadmap-card">



                        <div className="ai-card-title">



                          <span>🚀</span>



                          <div>



                            <small>YOUR NEXT MOVES</small>



                            <h3>Career Roadmap</h3>



                          </div>



                        </div>







                        <div className="roadmap-list">



                          {aiAnalysis.career_roadmap.map((phase, index) => (



                            <div className="roadmap-item" key={index}>



                              <div className="roadmap-number">



                                {index + 1}



                              </div>







                              <div>



                                <span>{phase.phase}</span>



                                <h4>{phase.focus}</h4>







                                {phase.actions?.length > 0 && (



                                  <ul>



                                    {phase.actions.map((action, actionIndex) => (



                                      <li key={actionIndex}>{action}</li>



                                    ))}



                                  </ul>



                                )}



                              </div>



                            </div>



                          ))}



                        </div>



                      </div>



                    )}







                    <div className="ai-disclaimer">



                      AI recommendations are based on the student profile and



                      placement data provided to the system. Fit score is a



                      profile-fit indicator, not a selection probability.



                    </div>







                  </div>



                )}







              </section>



            )}











                        {/* ==================================

                PREPARATION TRACKER

            ================================== */}



            {companies.length > 0 && (

              <section className="prep-section">

                <div className="prep-header">

                  <div>

                    <span className="prep-label">📚 PREPARATION TRACKER</span>

                    <h2>Turn your skill gaps into progress.</h2>

                    <p>Move each priority skill from learning to interview-ready.</p>

                  </div>

                  <div className="prep-progress-box">

                    <strong>{trackerProgress}%</strong>

                    <span>{trackerReadyCount}/{trackerSkills.length} ready</span>

                  </div>

                </div>



                {trackerSkills.length > 0 ? (

                  <div className="prep-skill-grid">

                    {trackerSkills.map((skill) => (

                      <div className="prep-skill-card" key={skill}>

                        <div className="prep-skill-top">

                          <strong>{skill}</strong>

                          <span>{skillProgress[skill] || "Not Started"}</span>

                        </div>

                        <div className="prep-status-row">

                          {trackerStatuses.map((status) => (

                            <button

                              key={status}

                              className={(skillProgress[skill] || "Not Started") === status ? "prep-status active" : "prep-status"}

                              onClick={() => updateSkillStatus(skill, status)}

                            >

                              {status}

                            </button>

                          ))}

                        </div>

                      </div>

                    ))}

                  </div>

                ) : (

                  <div className="prep-empty">Run company and career analysis to identify preparation priorities.</div>

                )}

              </section>

            )}



            {/* ==================================

                INTERVIEW PREPARATION

            ================================== */}



            {companies.length > 0 && (

              <section className="interview-section">

                <div className="interview-header">

                  <div>

                    <span className="interview-label">🎤 INTERVIEW PREPARATION</span>

                    <h2>Practice questions based on your gaps.</h2>

                    <p>Questions are personalized from your detected technical, soft-skill and role gaps.</p>

                  </div>

<button

  className="interview-button"

  onClick={generatePracticeQuestions}

  disabled={practiceLoading}

>

  {practiceLoading

    ? "Generating Questions..."

    : practiceQuestions.length

      ? "Regenerate Questions →"

      : "Generate Practice Questions →"}

</button>



                </div>



                {practiceQuestions.length > 0 && (

                  <div className="question-grid">

                    {practiceQuestions.map((item, index) => (

                      <div className="question-card" key={`${item.skill}-${index}`}>

                        <div className="question-top">

                          <span>Q{index + 1}</span>

                          <small>{item.type}</small>

                        </div>

                        <strong>{item.skill}</strong>

                        <p>{item.question}</p>

                      </div>

                    ))}

                  </div>

                )}

              </section>

            )}



            {/* ==================================

                STUDENT ACTION CENTER

            ================================== */}



            {companies.length > 0 && (

              <section className="action-center-section">

                <div className="action-center-header">

                  <span className="action-label">🎯 STUDENT ACTION CENTER</span>

                  <h2>What should you do next?</h2>

                  <p>A focused action list based on your current placement analysis.</p>

                </div>



                <div className="action-grid">

                  <div className="action-card high">

                    <span>01 · HIGH PRIORITY</span>

                    <h3>{trackerSkills[0] || readiness?.technicalGaps?.[0] || "Close your biggest skill gap"}</h3>

                    <p>Start with this skill and move it from Not Started to Learning, then Practicing.</p>

                  </div>



                  <div className="action-card medium">

                    <span>02 · INTERVIEW</span>

                    <h3>Practice {student?.target_role || "role-specific"} questions</h3>

                    <p>Generate the practice set above and answer each question aloud.</p>

                  </div>



                  <div className="action-card medium">

                    <span>03 · PROJECT</span>

                    <h3>Build one proof-of-skill project</h3>

                    <p>Choose a project that demonstrates your highest-priority missing skill.</p>

                  </div>



                  <div className="action-card ready">

                    <span>04 · COMPANIES TO TARGET</span>

                    <h3>{companies.slice(0, 3).map((company) => company.company).filter(Boolean).join(" • ") || "Top company matches"}</h3>

                    <p>Prioritize the strongest company matches while closing the gaps shown above.</p>

                  </div>

                </div>



                <div className="action-progress">

                  <div>

                    <span>Placement readiness progress</span>

                    <strong>{readiness?.score ?? 0}%</strong>

                  </div>

                  <div className="action-progress-bar">

                    <div style={{ width: `${readiness?.score ?? 0}%` }} />

                  </div>

                  <small>Next action: focus on your highest-priority skill before adding another target.</small>

                </div>

              </section>

            )}

            {/* ==================================

                NO COMPANY RESULTS

            ================================== */}







            {!companyLoading &&



              companies.length === 0 && (







                <div className="empty-results">







                  <div>



                    🏢



                  </div>







                  <h3>



                    Company analysis not started



                  </h3>







                  <p>



                    Click "Analyze Companies" to compare



                    your profile with available companies.



                  </p>







                </div>







              )}







          </section>







        )}







      </main>







    </div>



  );



}







export default App;


