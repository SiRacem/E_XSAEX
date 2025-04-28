// middlewares/verifyAuth.js
const config = require("config");
const User = require("../models/User");
const jwt = require('jsonwebtoken');

// Attempt to get secret safely during initialization
let secret;
try {
    secret = config.get("secret");
    if (!secret) {
        // If secret is absolutely mandatory, throw error or exit
        console.error("CRITICAL ERROR: JWT Secret ('secret') not found in config files.");
        // process.exit(1); // Uncomment to force exit if secret is missing
    } else {
        console.log("JWT Secret loaded successfully."); // Confirm secret load
    }
} catch (e) {
    console.error("CRITICAL ERROR: Failed to read 'secret' from config.", e.message);
    // process.exit(1); // Uncomment to force exit
}

exports.verifyAuth = async (req, res, next) => {
    console.log("--- verifyAuth Middleware ---");
    const authHeader = req.headers.authorization;
    console.log("Authorization Header received:", authHeader);

    // 1. Check if Authorization header exists
    if (!authHeader) {
        console.log("Authorization header missing.");
        return res.status(401).json({ msg: "Unauthorized: No token provided" });
    }

    // 2. Check if secret was loaded
    if (!secret) {
        console.error("JWT Secret is not available. Cannot proceed with authentication.");
        // Send 500 because this is a server configuration issue
        return res.status(500).json({ msg: "Internal Server Error: JWT configuration problem." });
    }

    try {
        // 3. Extract token (handle "Bearer " prefix)
        let token;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7, authHeader.length).trim(); // Get token part
            console.log("Extracted Bearer token.");
        } else {
            // If not Bearer, maybe token is sent directly (less common but possible)
            token = authHeader.trim();
            console.log("Assuming token sent directly (no 'Bearer ' prefix).");
        }

        if (!token) {
            console.log("Token is empty after processing header.");
            return res.status(401).json({ msg: "Unauthorized: Malformed or empty token" });
        }

        // 4. Verify the token
        console.log("Verifying token...");
        const decoded = jwt.verify(token, secret);
        console.log("Token verified successfully. Decoded payload:", decoded);

        // 5. Check decoded payload structure
        if (!decoded || !decoded._id) {
            console.error("Token payload is invalid or missing user ID (_id).");
            return res.status(401).json({ msg: "Unauthorized: Invalid token payload" });
        }

        // 6. Find user in database based on token ID
        console.log(`Finding user with ID: ${decoded._id}`);
        // Exclude password field from the user object returned
        const user = await User.findById(decoded._id).select('-password');

        // 7. Check if user exists
        if (!user) {
            console.log(`User with ID ${decoded._id} not found in database.`);
            // Send 401 because the user associated with the valid token doesn't exist
            return res.status(401).json({ msg: "Unauthorized: User not found" });
        }
        
        // 8. Attach user object to the request for subsequent handlers
        req.user = user;
        console.log(`User ${user.email} authenticated successfully and attached to req.user.`);

        // 9. Proceed to the next middleware or route handler
        next();

    } catch (error) {
        // Handle JWT errors specifically
        console.error("Error during authentication:", error.name, "-", error.message);
        if (error.name === 'JsonWebTokenError') {
            // Example: Invalid signature, malformed token
            return res.status(401).json({ msg: "Unauthorized: Invalid token signature or format" });
        } else if (error.name === 'TokenExpiredError') {
            // Token has expired
            return res.status(401).json({ msg: "Unauthorized: Token has expired" });
        } else {
            // Handle other potential errors (e.g., database errors during User.findById)
            // Return a generic 500 for unexpected server errors
            return res.status(500).json({ msg: "Internal Server Error during authentication process", error: error.message });
        }
    }
};