import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Container, Nav, Navbar as BsNavbar } from "react-bootstrap";

export default function Navbar() {
  const [expanded, setExpanded] = useState(false); // is the mobile menu open?

  return (
    <BsNavbar
      expand="md"
      sticky="top"
      bg="white"
      className="shadow-sm"
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Container>
        <BsNavbar.Brand as={NavLink} to="/" className="fw-bold fs-4 text-success">
          Career<span className="text-warning">Suggestion</span><span className="text-success">For Students</span>
        </BsNavbar.Brand>
      
        <BsNavbar.Toggle aria-controls="main-nav" />

        <BsNavbar.Collapse id="main-nav">
          <Nav className="ms-auto gap-md-2 " onClick={() => setExpanded(false)}>
            <Nav.Link as={NavLink} to="/" end className="text-dark">Home</Nav.Link>
            <Nav.Link as={NavLink} to="/login" className="text-dark">Login</Nav.Link>
            <Nav.Link as={NavLink} to="/about"className="text-dark">About us</Nav.Link>
            <Nav.Link as={NavLink} to="/contact" className="text-dark">Contact us</Nav.Link>
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}