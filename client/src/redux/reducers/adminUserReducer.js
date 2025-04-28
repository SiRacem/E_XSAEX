// src/redux/reducers/adminUserReducer.js
import {
    GET_ALL_USERS_REQUEST, GET_ALL_USERS_SUCCESS, GET_ALL_USERS_FAIL,
    UPDATE_USER_STATUS_REQUEST, UPDATE_USER_STATUS_SUCCESS, UPDATE_USER_STATUS_FAIL,
    ADMIN_UPDATE_USER_DATA_REQUEST, ADMIN_UPDATE_USER_DATA_SUCCESS, ADMIN_UPDATE_USER_DATA_FAIL,
    CLEAR_ADMIN_USER_ERRORS
} from '../actionTypes/adminUserActionType';

const initialState = { users: [], loading: false, error: null, loadingStatusChange: {}, loadingDataChange: {} };

const adminUserReducer = (state = initialState, action) => {
    const { type, payload } = action;
    switch (type) {
        case GET_ALL_USERS_REQUEST: return { ...state, loading: true, error: null };
        case GET_ALL_USERS_SUCCESS: return { ...state, loading: false, users: Array.isArray(payload) ? payload : [], error: null };
        case GET_ALL_USERS_FAIL: return { ...state, loading: false, error: payload, users: [] };
        case UPDATE_USER_STATUS_REQUEST: return { ...state, loadingStatusChange: { ...state.loadingStatusChange, [payload.userId]: true }, error: null };
        case UPDATE_USER_STATUS_SUCCESS: return { ...state, loadingStatusChange: { ...state.loadingStatusChange, [payload._id]: false }, users: state.users.map(user => user._id === payload._id ? payload : user), error: null };
        case UPDATE_USER_STATUS_FAIL: return { ...state, loadingStatusChange: { ...state.loadingStatusChange, [payload.userId]: false }, error: payload.error };
        case ADMIN_UPDATE_USER_DATA_REQUEST: return { ...state, loadingDataChange: { ...state.loadingDataChange, [payload.userId]: true }, error: null };
        case ADMIN_UPDATE_USER_DATA_SUCCESS: return { ...state, loadingDataChange: { ...state.loadingDataChange, [payload._id]: false }, users: state.users.map(user => user._id === payload._id ? payload : user), error: null };
        case ADMIN_UPDATE_USER_DATA_FAIL: return { ...state, loadingDataChange: { ...state.loadingDataChange, [payload.userId]: false }, error: payload.error };
        case CLEAR_ADMIN_USER_ERRORS: return { ...state, error: null };
        default: return state;
    }
};
export default adminUserReducer;