import React from "react";
import { Container, Card, Button, Form, FloatingLabel, Row, Col } from "react-bootstrap";
import { FaTicketAlt } from "react-icons/fa";

const Support = () => {
  return (
    <Container fluid className="support-page">
      <h2 className="page-title mb-4">Technical Support</h2>
      <Row>
        <Col md={8} lg={6}>
          {/* Limit form width */}
          <Card className="shadow-sm">
            <Card.Header>
              <FaTicketAlt className="me-2" /> Create a New Support Ticket
            </Card.Header>
            <Card.Body>
              <Form>
                <FloatingLabel
                  controlId="supportSubject"
                  label="Subject"
                  className="mb-3"
                >
                  <Form.Control
                    type="text"
                    placeholder="Enter ticket subject"
                    required
                  />
                </FloatingLabel>
                <FloatingLabel
                  controlId="supportMessage"
                  label="Describe your issue"
                  className="mb-3"
                >
                  <Form.Control
                    as="textarea"
                    placeholder="Please provide details..."
                    style={{ height: "150px" }}
                    required
                  />
                </FloatingLabel>
                <Button variant="primary" type="submit">
                  Submit Ticket
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        {/* Optional: Add a section to view existing tickets later */}
        {/* <Col md={4} lg={6}> ... View Tickets ... </Col> */}
      </Row>
    </Container>
  );
};

export default Support;
