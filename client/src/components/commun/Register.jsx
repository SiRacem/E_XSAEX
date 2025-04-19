// src/components/commun/Register.jsx
// *** نسخة مصححة لتحذيرات useSelector ***

import React, { useState, useEffect } from "react";
import { Alert, Button, Form, Spinner, Container, Row, Col, Card } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, clearUserErrors, clearRegistrationStatus } from "../../redux/actions/userAction";
import { toast } from 'react-toastify';

const Register = () => {
    // حالات الحقول (تبقى كما هي)
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [userRole, setUserRole] = useState("User");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState(""); // خطأ تطابق كلمة المرور المحلي

    const dispatch = useDispatch();
    const navigate = useNavigate();

    // --- [!] Selectors محسّنة ومفصولة ---
    const loading = useSelector(state => state.userReducer?.loading ?? false);
    const errors = useSelector(state => state.userReducer?.errors ?? null); // خطأ من Redux
    // تأكد من اسم الحالة الصحيح في Reducer (افترض أنه registrationStatus)
    const registrationStatus = useSelector(state => state.userReducer?.registrationStatus ?? null); // 'success', 'fail', or null
    // ------------------------------------

    // التأثير الجانبي لعرض إشعارات Toast (يبقى كما هو تقريبًا)
    useEffect(() => {
        if (registrationStatus === 'success') { // تحقق من القيمة 'success'
            toast.success("Account created successfully! Please login.", {
                theme: "colored",
                onClose: () => {
                    dispatch(clearRegistrationStatus());
                    navigate('/login');
                }
            });
        }
        // نستخدم errors (خطأ Redux) وليس passwordError (خطأ محلي) هنا
        if (errors && !loading) {
            toast.error(errors, {
                theme: "colored",
                 onClose: () => {
                     dispatch(clearUserErrors());
                 }
            });
        }
        // اعتماديات Effect: أزل registrationSuccess واستخدم registrationStatus
    }, [registrationStatus, errors, loading, dispatch, navigate]);


    const handleSubmit = (e) => {
        e.preventDefault();
        setPasswordError(""); // مسح خطأ التطابق المحلي

        if (password !== confirmPassword) {
            setPasswordError("Passwords do not match!"); // تعيين خطأ التطابق المحلي
            toast.warn("Passwords do not match!", { theme: "colored" });
            return;
        }
        // مسح خطأ Redux السابق قبل إرسال طلب جديد
        dispatch(clearUserErrors());
        const newUser = { fullName, email, phone, address, userRole, password };
        dispatch(registerUser(newUser));
    };


    return (
        <Container fluid className="d-flex align-items-center justify-content-center register-container py-4" style={{ minHeight: 'calc(100vh - 56px)' }}>
            <Row className="justify-content-center w-100">
                <Col xs={11} sm={10} md={8} lg={7} xl={5}>
                     <Card className="p-4 p-md-5 shadow-lg register-card">
                         <Card.Body>
                            <h2 className="text-center mb-4 fw-bold text-primary">Create Your Account</h2>

                            {/* عرض خطأ تطابق كلمة المرور المحلي فقط */}
                            {passwordError && <Alert variant="warning" onClose={() => setPasswordError("")} dismissible>{passwordError}</Alert>}

                            <Form onSubmit={handleSubmit} noValidate>
                                 <Row>
                                     {/* حقول الإدخال (تبقى كما هي) */}
                                    <Col md={6}> <Form.Group className="mb-3" controlId="formBasicFullName"> <Form.Label>Full Name</Form.Label> <Form.Control type="text" placeholder="Enter full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required /> </Form.Group> </Col>
                                    <Col md={6}> <Form.Group className="mb-3" controlId="formBasicEmail"> <Form.Label>Email address</Form.Label> <Form.Control type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required /> </Form.Group> </Col>
                                     <Col md={6}> <Form.Group className="mb-3" controlId="formBasicPhone"> <Form.Label>Phone</Form.Label> <Form.Control type="tel" placeholder="Enter phone number" value={phone} onChange={(e) => setPhone(e.target.value)} /> </Form.Group> </Col>
                                     <Col md={6}> <Form.Group className="mb-3" controlId="formBasicAddress"> <Form.Label>Address</Form.Label> <Form.Control type="text" placeholder="Enter your address" value={address} onChange={(e) => setAddress(e.target.value)} /> </Form.Group> </Col>
                                     <Col md={12}> <Form.Group className="mb-3" controlId="formBasicRole"> <Form.Label>Register as</Form.Label> <Form.Select aria-label="Select user role" value={userRole} onChange={(e) => setUserRole(e.target.value)}> <option value="User">User</option> <option value="Vendor">Vendor</option> </Form.Select> </Form.Group> </Col>
                                     <Col md={6}> <Form.Group className="mb-3" controlId="formBasicPassword"> <Form.Label>Password</Form.Label> <Form.Control type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} isInvalid={!!passwordError} /> </Form.Group> </Col>
                                     <Col md={6}> <Form.Group className="mb-4" controlId="formBasicConfirmPassword"> <Form.Label>Confirm Password</Form.Label> <Form.Control type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required isInvalid={!!passwordError} /> <Form.Control.Feedback type="invalid">{passwordError}</Form.Control.Feedback> </Form.Group> </Col>
                                </Row>
                                <Button variant="primary" type="submit" className="w-100 mb-3" disabled={loading}>
                                    {loading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Registering...</> : 'Register'}
                                </Button>
                                <div className="text-center mt-3 auth-switch-link">
                                    <span>Already have an account? </span>
                                    <Link to="/login" className="fw-bold">Login here</Link>
                                </div>
                            </Form>
                         </Card.Body>
                     </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;