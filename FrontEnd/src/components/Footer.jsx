import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import dev1 from "../assets/me.jpg";
import dev2 from "../assets/meghana.jpg";

export default function Footer() {
  const [visitors, setVisitors] = useState(0);

  useEffect(() => {
    // Get the visitor count saved in localStorage
    const savedCount = localStorage.getItem("visitorCount");

    // Initialize the count if it doesn't exist
    const currentCount = savedCount === null
      ? 0
      : parseInt(savedCount, 10);

    // Increment the visitor count
    const newCount = currentCount + 1;

    // Save the updated count
    localStorage.setItem("visitorCount", newCount.toString());

    // Update the displayed count
    setVisitors(newCount);
  }, []);

  const avatar = {
    width: 44,
    height: 44,
    objectFit: "cover",
    border: "2px solid #e0b84f",
  };

  return (
    <footer className="bg-dark text-light pt-4 pb-3 mt-5">
      <Container>
        {/* Footer Navigation Links */}
        <div className="d-flex flex-wrap justify-content-center gap-4 mb-3">
          <Link to="/privacy" className="text-light">
            Privacy Policy
          </Link>

          <Link to="/terms" className="text-light">
            Terms &amp; Conditions
          </Link>

          <Link to="/disclaimer" className="text-light">
            Disclaimer
          </Link>
        </div>

        {/* Visitor Counter */}
        <p className="text-center mb-3">
          Visitor Count:{" "}
          <strong className="text-warning">{visitors}</strong>
        </p>

        <hr className="border-secondary" />

        {/* Copyright and Developers */}
        <Row className="align-items-center text-center text-md-start gy-2">
          <Col md={6}>
            <small>
              © {new Date().getFullYear()} All Rights Reserved.
            </small>
          </Col>

          <Col
            md={6}
            className="d-flex align-items-center justify-content-center justify-content-md-end gap-2"
          >
            <small>Designed &amp; Developed by</small>

            <img
              src={dev1}
              alt="Developer 1"
              className="rounded-circle"
              style={avatar}
            />

            <img
              src={dev2}
              alt="Developer 2"
              className="rounded-circle"
              style={avatar}
            />
          </Col>
        </Row>
      </Container>
    </footer>
  );
}