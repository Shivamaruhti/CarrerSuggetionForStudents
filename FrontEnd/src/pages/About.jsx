import { Link } from "react-router-dom";
import "./About.css";

import raoSir from "../assets/raosir.png";
import vega from "../assets/vega.png";
import shiva from "../assets/me.jpg";
import meghana from "../assets/meghana.jpg";

const teamMembers = [
  {
    name: "Dr. PULLURI SRINIVAS RAO",
    role: "Vice Principal and HOD of CSE",
    image: raoSir,
    description:
      "Jayamukhi Institute of Technological Sciences (UGC Autonomous), Narsampet, Warangal - 506533",
  },
  {
    name: "Mr. Sandeep",
    role: "Project Trainer",
    image: vega,
    description:
      "Vega Technologies Ground, 1st Floor, Shaarvani Degree College Building, Opp. Police Parade, Kishanpura, Hanamkonda, Telangana - 506001",
  },
  {
    name: "S. SHIVA MARUTHI",
    role: "20C41A0513 | Full Stack Developer",
    image: shiva,
    description:
      "Jayamukhi Institute of Technological Sciences (UGC Autonomous), Narsampet, Warangal - 506533",
  },
  {
    name: "K. MEGHANA REDDY",
    role: "20C41A0558 | Front-End Developer",
    image: meghana,
    description:
      "Jayamukhi Institute of Technological Sciences (UGC Autonomous), Narsampet, Warangal - 506533",
  },
];

function About() {
  return (
    <div className="about-page">
      <section className="about-hero text-white">
        <div className="container about-hero-content">
          <span className="about-eyebrow">ABOUT CAREERPATH</span>
          <h1>Helping students find their <span>way forward.</span></h1>
          <p>
            We help students understand their options, recognize their
            strengths, and take confident steps toward a meaningful career.
          </p>
          <Link to="/login" className="btn about-cta">
            Start your journey
          </Link>
        </div>
      </section>

      <main className="container about-content">
        <section className="about-content-card">
          <div className="about-section-heading">
            <span>OUR PURPOSE</span>
            <h2>Empowering your choices</h2>
          </div>
          <p>
            Choosing the right path after the 10th standard is a crucial
            decision that shapes a student&apos;s future. Our mission is to
            guide students through this pivotal phase with career guidance and
            resources that open doors to a world of possibilities.
          </p>
          <p>
            Students stand at the crossroads of their academic journey. We
            provide information to help them explore options, compare
            opportunities, and make choices that fit their interests and goals.
          </p>

          <div className="about-options">
            <article>
              <span className="about-option-number">01</span>
              <h3>Diploma courses</h3>
              <p>
                Specialized programs that provide practical skills in fields
                such as Digital Marketing and Business Administration.
              </p>
            </article>
            <article>
              <span className="about-option-number">02</span>
              <h3>Vocational training</h3>
              <p>
                Hands-on technical and trade training through ITIs and
                polytechnic institutions.
              </p>
            </article>
            <article>
              <span className="about-option-number">03</span>
              <h3>Certifications</h3>
              <p>
                Short-term courses that strengthen specific skills and improve
                employability.
              </p>
            </article>
            <article>
              <span className="about-option-number">04</span>
              <h3>Higher education</h3>
              <p>
                Explore degree and professional courses, entrance exams, and
                skill-development opportunities after intermediate education.
              </p>
            </article>
          </div>
        </section>

        <section className="about-commitment">
          <div>
            <span className="about-section-kicker">OUR COMMITMENT</span>
            <h2>Guidance for every next step.</h2>
          </div>
          <p>
            We share useful information about education and career trends so
            students can identify their interests and strengths, discover
            opportunities, and choose a path that matches their abilities and
            ambitions.
          </p>
        </section>

        <section className="about-team">
          <div className="about-section-heading text-center">
            <span>THE PEOPLE BEHIND THE PROJECT</span>
            <h2>Meet our team</h2>
            <p>
              Educators, mentors, and developers working together to support
              students.
            </p>
          </div>

          <div className="row g-4">
            {teamMembers.map((member) => (
              <div className="col-12 col-md-6" key={member.name}>
                <article className="team-card h-100">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="team-image"
                  />
                  <div className="team-details">
                    <h3 className="team-name">{member.name}</h3>
                    <p className="team-role">{member.role}</p>
                    <p className="team-description">{member.description}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default About;