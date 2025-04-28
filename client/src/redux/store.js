import { applyMiddleware, compose, createStore } from "redux";
import { thunk } from "redux-thunk";
import rootReducer from "./reducers/rootReducer";

const devtools = window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__();
const store = createStore(rootReducer, compose(applyMiddleware(thunk), devtools));

export default store;