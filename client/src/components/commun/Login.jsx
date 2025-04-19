// src/components/commun/Login.jsx
// *** نسخة مصححة لتحذيرات useSelector ***

import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser, clearUserErrors } from "../../redux/actions/userAction"; // تأكد من المسار
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // --- [!] Selectors محسّنة ومفصولة ---
  const loading = useSelector((state) => state.userReducer?.loading ?? false);
  const errors = useSelector((state) => state.userReducer?.errors ?? null);
  // لا نحتاج isAuth و user هنا مباشرة لأن App.js يعالج التوجيه
  // const isAuth = useSelector(state => state.userReducer?.isAuth ?? false);
  // const user = useSelector(state => state.userReducer?.user);
  // ----------------------------------

  // useEffect لعرض الأخطاء فقط
  useEffect(() => {
    if (errors && !loading) {
      // عرض الخطأ فقط إذا لم يكن هناك تحميل جاري
      toast.error(errors, {
        theme: "colored",
        autoClose: 4000,
        toastId: "login-error",
        onClose: () => dispatch(clearUserErrors()), // مسح الخطأ بعد إغلاق التوست
      });
      // لا نمسح الخطأ فوراً هنا، بل عند إغلاق التوست
      // dispatch(clearUserErrors());
    }
  }, [errors, loading, dispatch]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const loggedUser = { email, password };
      dispatch(loginUser(loggedUser));
    },
    [dispatch, email, password]
  );

  return (
    <Container
      fluid
      className="d-flex align-items-center justify-content-center login-container py-4"
      style={{ minHeight: "calc(100vh - 56px)" }}
    >
      <Row className="justify-content-center w-100">
        <Col xs={11} sm={10} md={8} lg={6} xl={4}>
          <Card className="p-4 p-md-5 shadow-lg login-card">
            <Card.Body>
              <h2 className="text-center mb-4 fw-bold text-primary">
                Welcome Back!
              </h2>
              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    // لا نستخدم isInvalid هنا لأننا نعرض الخطأ في toast
                    // isInvalid={!!errors}
                  />
                  {/* <Form.Control.Feedback type="invalid">{errors}</Form.Control.Feedback> */}
                </Form.Group>
                <Form.Group className="mb-4" controlId="formBasicPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    // isInvalid={!!errors}
                  />
                  {/* <Form.Control.Feedback type="invalid">{errors}</Form.Control.Feedback> */}
                </Form.Group>
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" /> Logging
                      in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
                <div className="text-center mt-3 auth-switch-link">
                  <span>Don't have an account? </span>
                  <Link to="/register" className="fw-bold">
                    Sign Up
                  </Link>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
