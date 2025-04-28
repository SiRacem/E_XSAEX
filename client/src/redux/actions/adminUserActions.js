import axios from 'axios';
import {
    GET_ALL_USERS_REQUEST, GET_ALL_USERS_SUCCESS, GET_ALL_USERS_FAIL,
    UPDATE_USER_STATUS_REQUEST, UPDATE_USER_STATUS_SUCCESS, UPDATE_USER_STATUS_FAIL,
    ADMIN_UPDATE_USER_DATA_REQUEST, ADMIN_UPDATE_USER_DATA_SUCCESS, ADMIN_UPDATE_USER_DATA_FAIL
} from '../actionTypes/adminUserActionType';
import { getProfile } from './userAction';

// Helper للحصول على التوكن (تأكد من مساره الصحيح أو عرفه هنا)
// import { getTokenConfig } from '../utils/authUtils'; // مثال
const getTokenConfig = (contentType = 'application/json') => {
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') return null;
    return { headers: { 'Content-Type': contentType, 'Authorization': `Bearer ${token}` } };
};

// Action: جلب جميع المستخدمين (للأدمن)
export const adminGetAllUsers = () => async (dispatch) => {
    dispatch({ type: GET_ALL_USERS_REQUEST });
    const config = getTokenConfig();
    if (!config) {
        console.error("Admin Action: Token missing for adminGetAllUsers.");
        return dispatch({ type: GET_ALL_USERS_FAIL, payload: 'Admin token required.' });
    }

    try {
        // المسار لجلب جميع المستخدمين (تأكد من أنه محمي للأدمن في الخلفية)
        const { data } = await axios.get('/user/get_users', config); // أو /admin/users
        dispatch({ type: GET_ALL_USERS_SUCCESS, payload: data });
    } catch (error) {
        const message = error.response?.data?.msg || error.message || 'Failed to fetch users';
        console.error("Admin Get Users Action Error:", message, error.response?.data);
        dispatch({ type: GET_ALL_USERS_FAIL, payload: message });
    }
};

// Action: تحديث حالة حظر المستخدم (للأدمن)
export const adminUpdateUserStatus = (userId, newBlockedStatus) => async (dispatch) => {
    dispatch({ type: UPDATE_USER_STATUS_REQUEST, payload: { userId } });
    const config = getTokenConfig();
    if (!config) {
        console.error("Admin Action: Token missing for adminUpdateUserStatus.");
        return dispatch({ type: UPDATE_USER_STATUS_FAIL, payload: { userId, error: 'Admin token required.' } });
    }

    try {
        // المسار لتحديث المستخدم (تأكد أنه يسمح بتحديث blocked للأدمن)
        const { data } = await axios.put(`/user/update_users/${userId}`, { blocked: newBlockedStatus }, config);
        dispatch({ type: UPDATE_USER_STATUS_SUCCESS, payload: data }); // أرسل المستخدم المحدث
    } catch (error) {
        const message = error.response?.data?.msg || error.message || 'Failed to update user status';
        console.error(`Admin Update Status Action Error for user ${userId}:`, message, error.response?.data);
        dispatch({ type: UPDATE_USER_STATUS_FAIL, payload: { userId, error: message } });
        // لا نطرح الخطأ عادة هنا إلا إذا أردت إظهار فشل محدد للزر
    }
};

// Action: تحديث بيانات المستخدم بواسطة الأدمن (بما في ذلك الأرصدة)
export const adminUpdateUserData = (userId, updatedData) => async (dispatch, getState) => {
    dispatch({ type: ADMIN_UPDATE_USER_DATA_REQUEST, payload: { userId } });
    const config = getTokenConfig();
    if (!config) {
        console.error("Admin Action: Token missing for adminUpdateUserData.");
        return dispatch({ type: ADMIN_UPDATE_USER_DATA_FAIL, payload: { userId, error: 'Admin token required.' } });
    }

    try {
        // استخدام نفس المسار العام للتحديث (الواجهة الخلفية تتحقق من صلاحيات الأدمن)
        const { data } = await axios.put(`/user/update_users/${userId}`, updatedData, config);
        dispatch({ type: ADMIN_UPDATE_USER_DATA_SUCCESS, payload: data });

        // تحديث بيانات المستخدم الحالي إذا كان هو من تم تعديله
        const { user: currentUser } = getState().userReducer;
        if (currentUser?._id === userId) {
            console.log("Current user data updated by admin, dispatching getProfile.");
            dispatch(getProfile());
            // أو الطريقة الأسرع:
            // dispatch({ type: 'GET_PROFILE_SUCCESS', payload: data });
        }
        return data; // إرجاع البيانات للمودال

    } catch (error) {
        const message = error.response?.data?.msg || error.response?.data?.errors?.[0]?.msg || error.message || 'Failed to update user data';
        console.error(`Admin Update Data Action Error for user ${userId}:`, message, error.response?.data);
        dispatch({ type: ADMIN_UPDATE_USER_DATA_FAIL, payload: { userId, error: message } });
        throw error; // طرح الخطأ ليتم عرضه في مودال التعديل
    }
};