import { combineReducers } from "redux";
import userReducer from "./userReducer";
import productReducer from "./productReducer";
import notificationReducer from "./notificationReducer";
import walletReducer from "./walletReducer";
import adminUserReducer from "./adminUserReducer";
import transactionReducer from "./transactionReducer";
// import orderReducer from "./orderReducer";
// import cartReducer from "./cartReducer";

const rootReducer = combineReducers({
    userReducer,
    productReducer,
    notificationReducer,
    walletReducer,
    adminUserReducer,
    transactionReducer,
    // orderReducer,
    // cartReducer,
});

export default rootReducer