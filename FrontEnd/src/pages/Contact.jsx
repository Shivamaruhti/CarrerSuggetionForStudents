import {
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaWhatsapp,
} from "react-icons/fa";
import shivaImage from "../assets/me.jpg";
import meghanaImage from "../assets/meghana.jpg";
import varunImage from "../assets/varun.jpg";
import "./Contact.css";

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    Icon: FaFacebookF,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    Icon: FaInstagram,
  },
  {
    label: "WhatsApp",
    href: "https://www.whatsapp.com/",
    Icon: FaWhatsapp,
  },
];

const contacts = [
  {
    name: "S. Shiva Maruthi",
    id: "20C41A0513",
    image: shivaImage,
  },
  {
    name: "K. Meghana Reddy",
    id: "20C41A0558",
    image: meghanaImage,
  },
  {
    name: "K. Varun Kumar",
    id: "20C41A0529",
    image: varunImage,
  },
];

export default function Contact() {
  return (
    <div className="contact-page">
      <section className="contact-hero text-white">
        <div className="container">
          <span className="contact-eyebrow">WE&apos;RE HERE TO HELP</span>
          <h1>Contact our team</h1>
          <p>
            Get in touch with the people behind Career Suggestion for Students.
          </p>
        </div>
      </section>

      <main className="container contact-content">
        <section className="institute-card" aria-labelledby="institute-heading">
          <div className="institute-icon" aria-hidden="true">
            <FaMapMarkerAlt />
          </div>
          <div>
            <span className="contact-section-kicker">OUR INSTITUTION</span>
            <h2 id="institute-heading">
              Jayamukhi Institute of Technological Sciences
            </h2>
            <p>
              UGC Autonomous, Narsampet, Warangal - 506533
            </p>
          </div>
        </section>

        <section className="contact-team" aria-labelledby="contact-team-heading">
          <div className="contact-section-heading">
            <span className="contact-section-kicker">THE PROJECT TEAM</span>
            <h2 id="contact-team-heading">Connect with our team</h2>
            <p>
              Follow the links below to visit each social platform. Profile
              links can be added when available.
            </p>
          </div>

          <div className="row g-4">
            {contacts.map((person) => (
              <div className="col-12 col-md-6 col-lg-4" key={person.id}>
                <article className="contact-person-card h-100">
                  <img
                    className="contact-person-image"
                    src={person.image}
                    alt={person.name}
                  />
                  <h3>{person.name}</h3>
                  <p className="contact-person-id">{person.id}</p>
                  <div className="contact-social-links">
                    {socialLinks.map(({ label, href, Icon }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${label} website`}
                        title={`Visit ${label}`}
                      >
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                      </a>
                    ))}
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
