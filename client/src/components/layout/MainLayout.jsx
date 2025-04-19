import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Form } from "react-bootstrap";
import Sidebar from "./Sidebar";
import "./MainLayout.css";

const MainLayout = ({ children }) => {
  const [search, setSearch] = useState("");

  return (
    <div className="main-layout-container d-flex">
      <Sidebar />
      <div className="content-wrapper flex-grow-1">
        <header className="main-header bg-white shadow-sm sticky-top">
          <Container
            fluid
            className="d-flex justify-content-between align-items-center py-2"
          >
            <Link to="/dashboard" className="header-logo">
              <img
                style={{ width: "50px", height: "auto" }}
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/640px-PNG_transparency_demonstration_1.png"
                alt="Logo"
              />
            </Link>

            <Form
              className="d-flex header-search"
              onSubmit={(e) => e.preventDefault()}
            >
              <Form.Control
                type="search"
                placeholder="Search..."
                className="me-2 form-control-sm"
                aria-label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Form>
          </Container>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
