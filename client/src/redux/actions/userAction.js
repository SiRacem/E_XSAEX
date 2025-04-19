import axios from "axios";
import {
    REGISTER_REQUEST, REGISTER_SUCCESS, REGISTER_FAIL, CLEAR_REGISTRATION_STATUS,
    LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAIL, CLEAR_LOGIN_SUCCESS_MESSAGE,
    GET_PROFILE_REQUEST, GET_PROFILE_SUCCESS, GET_PROFILE_FAIL,
    LOGOUT, CLEAR_USER_ERRORS
} from "../actionTypes/userActionType";
import { toast } from 'react-toastify';

const getTokenConfig = () => {
    const token = localStorage.getItem("token");
    if (!token || token === 'null' || token === 'undefined') return null;
    return { headers: { 'Authorization': `Bearer ${token}` } };
};

export const registerUser = (newUser) => async (dispatch) => {
    dispatch({ type: REGISTER_REQUEST });
    try {
        await axios.post("/user/register", newUser);
        dispatch({ type: REGISTER_SUCCESS, payload: { msg: "Registration successful! Please login." } });
    } catch (error) {
        const message = error.response?.data?.errors?.[0]?.msg || error.response?.data?.msg || error.message || 'Registration failed';
        dispatch({ type: REGISTER_FAIL, payload: message });
    }
};

export const clearRegistrationStatus = () => ({ type: CLEAR_REGISTRATION_STATUS });
export const clearUserErrors = () => ({ type: CLEAR_USER_ERRORS });
export const clearLoginSuccessMessage = () => ({ type: CLEAR_LOGIN_SUCCESS_MESSAGE }); // <-- مضاف

export const loginUser = (loggedUser) => async (dispatch) => {
    dispatch({ type: LOGIN_REQUEST });
    dispatch(clearUserErrors());
    try {
        const { data } = await axios.post("/user/login", loggedUser);
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user._id);

        // إرسال بيانات المستخدم والتوكن إلى Reducer
        dispatch({
            type: LOGIN_SUCCESS,
            payload: data
        });

        // --- [!] تعديل منطق الـ Toast ---
        if (data.user.blocked) {
            // عرض رسالة خطأ/تحذير للحساب المحظور
            toast.error("Your account is currently blocked.", {
                theme: "colored",
                autoClose: 5000, // مدة أطول قليلاً
                toastId: "blocked-account-msg",
            });
        } else {
            // عرض رسالة الترحيب العادية
            const welcomeMessage = `Welcome back, ${data.user.fullName || 'User'}!`;
            toast.success(welcomeMessage, {
                theme: "colored",
                autoClose: 2500,
                toastId: "welcome-msg",
            });
        }
        // --- نهاية تعديل الـ Toast ---

    } catch (error) {
        // التعامل مع أخطاء API (مثل كلمة مرور خاطئة)
        const message = error.response?.data?.msg || error.message || 'Login failed. Please check credentials.';
        dispatch({ type: LOGIN_FAIL, payload: message });
        toast.error(message, { theme: "colored", autoClose: 4000, toastId: "login-error" });
    }
};

export const getProfile = () => async (dispatch) => {
    dispatch({ type: GET_PROFILE_REQUEST });
    const config = getTokenConfig();
    if (!config) {
        dispatch({ type: GET_PROFILE_FAIL, payload: "Token not found." });
        // لا تقم بتسجيل الخروج تلقائيًا هنا، دع App.js يعالج إعادة التوجيه
        return;
    }
    try {
        const { data } = await axios.get("/user/auth", config);
        dispatch({ type: GET_PROFILE_SUCCESS, payload: data });
    } catch (error) {
        const message = error.response?.data?.msg || error.message || 'Failed to fetch profile';
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error("Auth Error:", message);
            // عند فشل المصادقة، يجب تسجيل الخروج
            dispatch(logoutUser()); // <-- استدعاء logoutUser action
            // إرسال رسالة خطأ أوضح
            dispatch({ type: GET_PROFILE_FAIL, payload: "Session expired or invalid. Please login again." });
        } else {
            console.error("Get Profile Error:", message, error.response?.data);
            dispatch({ type: GET_PROFILE_FAIL, payload: message });
        }
    }
};

export const logoutUser = () => (dispatch) => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    dispatch({ type: LOGOUT });
    // يمكنك إضافة dispatch لمسح حالات أخرى هنا
    // dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    // dispatch({ type: 'CLEAR_PRODUCTS' });
};