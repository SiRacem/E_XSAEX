import React from "react";
import { Button, Container, Form, Nav, Navbar, Spinner } from "react-bootstrap"; // Import Spinner
import { Link, NavLink } from "react-router-dom"; // Use NavLink
import { logoutUser } from "../../redux/actions/userAction"; // تأكد من المسار
import { useDispatch, useSelector } from "react-redux";

const Entete = ({ search, setSearch }) => {
  const dispatch = useDispatch();
  const { user, isAuth, loading } = useSelector((state) => state.userReducer);

  if (loading && isAuth) {
    return (
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container fluid>
          <Navbar.Brand as={Link} to="/dashboard">
            Loading User...
            <Spinner
              animation="border"
              size="sm"
              role="status"
              className="ms-2"
            >
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </Navbar.Brand>
        </Container>
      </Navbar>
    );
  }

  // --- إذا كان المستخدم غير موجود بعد انتهاء التحميل والمصادقة (حالة نادرة) ---
  if (isAuth && !user) {
    console.error(
      "Entete: isAuth is true but user object is null/undefined after loading."
    );

    return (
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container fluid>
          <Navbar.Brand>Error loading user data</Navbar.Brand>
          <Button
            variant="outline-danger"
            onClick={() => dispatch(logoutUser())}
          >
            Logout
          </Button>
        </Container>
      </Navbar>
    );
  }

  return (
    <div>
      <Navbar expand="lg" className="bg-body-tertiary mb-3">
        {/* إضافة هامش سفلي */}
        <Container fluid>
          {/* Use NavLink for Brand if needed */}
          <Navbar.Brand as={Link} to="/dashboard">
            <img
              style={{ width: "70px", height: "auto", marginBottom: "10px" }}
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/640px-PNG_transparency_demonstration_1.png"
              alt="Logo"
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav className="me-auto my-2 my-lg-0" navbarScroll>
              {user.userRole === "Admin" && (
                <>
                  <Nav.Link as={NavLink} to="/dashboard" end>
                    Dashboard
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/dashboard/admin/products">
                    Products
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/dashboard/admin/users">
                    Users
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/dashboard/admin/orders">
                    Orders
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/dashboard/profile">
                    Profile
                  </Nav.Link>
                </>
              )}
              {user.userRole === "Vendor" && (
                <>
                  <Nav.Link as={NavLink} to="/dashboard" end>
                    Dashboard
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/dashboard/vendor/products">
                    My Products
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/dashboard/vendor/orders">
                    My Orders
                  </Nav.Link>
                  <Nav.Link as={NavLink} to="/dashboard/profile">
                    Profile
                  </Nav.Link>
                </>
              )}
              {user.userRole === "User" && ( // افترض وجود دور "User" عادي
                <>
                  <Nav.Link as={NavLink} to="/dashboard" end>
                    Dashboard
                  </Nav.Link>
                  {/* أضف روابط المستخدم العادي هنا */}
                  <Nav.Link as={NavLink} to="/dashboard/orders">
                    My Orders
                  </Nav.Link>
                  {/* مثال */}
                  <Nav.Link as={NavLink} to="/dashboard/profile">
                    Profile
                  </Nav.Link>
                </>
              )}
            </Nav>

            {/* --- عناصر الجانب الأيمن --- */}
            <div className="d-flex align-items-center ms-auto">
              <Form
                className="d-flex me-3"
                onSubmit={(e) => e.preventDefault()}
              >
                <Form.Control
                  type="search"
                  placeholder="Search..." // General search placeholder
                  className="me-2"
                  aria-label="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Form>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
};

export default Entete;
