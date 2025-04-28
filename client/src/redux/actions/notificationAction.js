import axios from 'axios';
import {
    GET_NOTIFICATIONS_REQUEST, GET_NOTIFICATIONS_SUCCESS, GET_NOTIFICATIONS_FAIL,
    MARK_READ_REQUEST, MARK_READ_SUCCESS, MARK_READ_FAIL, CLEAR_NOTIFICATIONS
} from '../actionTypes/notificationActionType';
// Helper (يمكن نقله لملف مشترك utils/auth)
const getTokenConfig = (isJson = true) => {
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') return null;
    const headers = { 'Authorization': `Bearer ${token}` };
    if (isJson) headers['Content-Type'] = 'application/json';
    return { headers };
};

// Get user notifications
export const getNotifications = () => async (dispatch) => {
    dispatch({ type: GET_NOTIFICATIONS_REQUEST });
    const config = getTokenConfig(false); // لا نحتاج Content-Type لـ GET
    if (!config) return dispatch({ type: GET_NOTIFICATIONS_FAIL, payload: 'Token required.' });

    try {
        const { data } = await axios.get('/notifications', config);
        console.log("[getNotifications Action] Received:", data); // Log
        dispatch({ type: GET_NOTIFICATIONS_SUCCESS, payload: data });
    } catch (error) {
        const message = error.response?.data?.msg || error.message || 'Failed to fetch notifications';
        console.error("[getNotifications Action] Error:", message, error.response); // Log error
        dispatch({ type: GET_NOTIFICATIONS_FAIL, payload: message });
    }
};

// Mark notifications as read
export const markNotificationsRead = (notificationIds) => async (dispatch) => {
    dispatch({ type: MARK_READ_REQUEST });
    const config = getTokenConfig(); // يحتاج Content-Type لـ PUT مع body
    if (!config) return dispatch({ type: MARK_READ_FAIL, payload: 'Token required.' });
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return dispatch({ type: MARK_READ_FAIL, payload: 'Notification IDs array needed.' });
    }

    try {
        await axios.put('/notifications/read', { notificationIds }, config);
        console.log("[markNotificationsRead Action] Marked as read:", notificationIds); // Log
        dispatch({ type: MARK_READ_SUCCESS, payload: notificationIds }); // إرسال IDs للـ reducer
    } catch (error) {
        const message = error.response?.data?.msg || error.message || 'Failed to mark notifications';
        console.error("[markNotificationsRead Action] Error:", message, error.response); // Log error
        dispatch({ type: MARK_READ_FAIL, payload: message });
    }
};

export const clearNotifications = () => ({ type: CLEAR_NOTIFICATIONS });