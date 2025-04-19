// src/redux/reducers/notificationReducer.js
import {
    GET_NOTIFICATIONS_REQUEST, GET_NOTIFICATIONS_SUCCESS, GET_NOTIFICATIONS_FAIL,
    MARK_READ_REQUEST, MARK_READ_SUCCESS, MARK_READ_FAIL, CLEAR_NOTIFICATIONS // <-- مضاف
} from '../actionTypes/notificationActionType';

const initialState = { notifications: [], unreadCount: 0, loading: false, error: null, loadingMarkRead: false };

const notificationReducer = (state = initialState, action) => {
    const { type, payload } = action;
    switch (type) {
        case GET_NOTIFICATIONS_REQUEST: return { ...state, loading: true, error: null };
        case GET_NOTIFICATIONS_SUCCESS: return { ...state, loading: false, notifications: Array.isArray(payload?.notifications) ? payload.notifications : state.notifications, unreadCount: typeof payload?.unreadCount === 'number' ? payload.unreadCount : state.unreadCount, error: null };
        case GET_NOTIFICATIONS_FAIL: return { ...state, loading: false, error: payload };
        case MARK_READ_REQUEST: return { ...state, loadingMarkRead: true };
        case MARK_READ_SUCCESS: const readIds = payload || []; const newNotifications = state.notifications.map(notif => readIds.includes(notif._id) ? { ...notif, isRead: true } : notif); const newUnreadCount = newNotifications.filter(n => !n.isRead).length; return { ...state, loadingMarkRead: false, notifications: newNotifications, unreadCount: newUnreadCount }; // حساب unreadCount بدقة
        case MARK_READ_FAIL: return { ...state, loadingMarkRead: false, error: payload };
        case CLEAR_NOTIFICATIONS: return { ...initialState }; // <-- مضاف لإعادة التعيين عند الخروج
        default: return state;
    }
};
export default notificationReducer;