import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import career1 from "../assets/4.jpg";
import career2 from "../assets/2.jpg";
import career3 from "../assets/3.jpg";
import "./Home.css";

const cards = [
  { img: career1, title: "Find Direction", text: "Explore guidance and advice to point you toward the right career." },
  { img: career2, title: "Get Coaching", text: "Learn new skills and build confidence with mentoring and training." },
  { img: career3, title: "Make Your Way", text: "Choose your own path and take the first step towards your goals." },
];

export default function Home() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="hero text-white text-center">
        <Container>
          <h1 className="display-4 fw-bold">
            Choose your own <span className="hero-highlight text-danger">Career Path</span>
          </h1>
          <p className="lead mx-auto my-4" style={{ maxWidth: 600 }}>
            Discover careers that match your interests and skills, and get
            personalised suggestions to plan your future.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Button as={Link} to="/login" variant="warning" size="lg" className="rounded-pill px-4 fw-semibold">
              Get Started
            </Button>
            <Button as={Link} to="/about" variant="outline-light" size="lg" className="rounded-pill px-4">
              Learn More
            </Button>
          </div>
        </Container>
      </section>

      {/* CARDS SECTION */}
      <Container className="cards-wrapper">
        <Row className="g-4">
          {cards.map((c) => (
            <Col key={c.title} xs={12} md={6} lg={4}>
              <Card className="card-hover h-100 border-0 shadow">
                <Card.Img variant="top" src={c.img} alt={c.title} className="card-image" />
                <Card.Body>
                  <Card.Title className="text-success fw-bold">{c.title}</Card.Title>
                  <Card.Text className="text-muted">{c.text}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}