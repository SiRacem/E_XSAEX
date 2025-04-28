// src/redux/reducers/userReducer.js (مثال افتراضي)
import {
  REGISTER_REQUEST, REGISTER_SUCCESS, REGISTER_FAIL, CLEAR_REGISTRATION_STATUS,
  LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAIL,
  GET_PROFILE_REQUEST, GET_PROFILE_SUCCESS, GET_PROFILE_FAIL,
  LOGOUT, CLEAR_USER_ERRORS
} from "../actionTypes/userActionType";

const initialState = {
  loading: false,
  user: null,
  token: localStorage.getItem("token") || null, // تحميل التوكن الأولي
  isAuth: !!localStorage.getItem("token"), // تحديد المصادقة الأولية
  errors: null,
  registrationStatus: null, // success or fail
  authChecked: false,
};

const userReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    // --- Login Cases ---
    case LOGIN_REQUEST:
      return { ...state, loading: true, errors: null, loginSuccessMessage: null }; // مسح الرسالة عند بدء الطلب
    case LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuth: true,
        user: payload.user,
        token: payload.token,
        errors: null,
      };
    case LOGIN_FAIL:
      return { ...state, loading: false, errors: payload, isAuth: false, user: null, token: null };

    // --- Register Cases ---
    case REGISTER_REQUEST:
      return { ...state, loading: true, errors: null, registrationStatus: null };
    case REGISTER_SUCCESS:
      return { ...state, loading: false, registrationStatus: 'success', errors: null };
    case REGISTER_FAIL:
      return { ...state, loading: false, registrationStatus: 'fail', errors: payload };
    case CLEAR_REGISTRATION_STATUS:
      return { ...state, registrationStatus: null };

    // --- Get Profile Cases ---
    case GET_PROFILE_REQUEST:
            // لا تغير authChecked هنا، فقط loading
            return { ...state, loading: true };
        case GET_PROFILE_SUCCESS:
            // عند النجاح: اكتمل التحقق، تحديث المستخدم والمصادقة
            return {
                 ...state,
                 loading: false,
                 isAuth: true,
                 user: payload,
                 errors: null,
                 authChecked: true // <-- [!] مهم جداً: تعيينها true هنا
            };
        case GET_PROFILE_FAIL:
            // عند الفشل: اكتمل التحقق أيضاً، مسح المصادقة
            // (لا تمسح التوكن من هنا، دع logout يفعل ذلك إذا لزم الأمر)
            return {
                 ...state,
                 loading: false,
                 // isAuth: false, // لا تغير isAuth هنا بالضرورة، قد يكون فشل مؤقت
                 // user: null,
                 errors: payload,
                 authChecked: true // <-- [!] مهم جداً: تعيينها true هنا أيضاً
            };

        // --- Logout Case ---
        case LOGOUT:
            // عند تسجيل الخروج، إعادة تعيين كل شيء بما في ذلك authChecked
            return {
                ...initialState,
                token: null,
                isAuth: false,
                authChecked: true // <-- اكتمل التحقق (لا يوجد مستخدم)
            };

        // --- حالة خاصة للتحقق عند عدم وجود توكن ---
        case 'AUTH_CHECK_COMPLETE': // النوع الذي أضفته في App.js
             return { ...state, authChecked: true }; // فقط تعيين authChecked

    // --- Clear Errors Case ---
    case CLEAR_USER_ERRORS:
      return { ...state, errors: null };

    default:
      return state;
  }
};

export default userReducer;