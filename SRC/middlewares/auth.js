import jwt from 'jsonwebtoken';
import User from "../../DB/models/user.model.js"; 
import { systemRoles } from "../../SRC/utils/system-roles.js";

export const auth = (accessRoles = [systemRoles.USER, systemRoles.ADMIN, systemRoles.DELIVERY], isOptional = false) => {
    return async (req, res, next) => {
        try {
            const rawHeader = req.headers.authorization || req.headers.accesstoken;

            if (!rawHeader) {
                if (isOptional) {
                    req.user = null;
                    return next();
                }   
                return res.status(401).json({ success: false, message: "Please login first" });
            }

            const prefix = process.env.TOKEN_PREFIX || "accessToken_";
            let token = "";

            if (rawHeader.startsWith("Bearer ")) {
                token = rawHeader.slice(7).trim();
            } else if (rawHeader.startsWith(prefix)) {
                token = rawHeader.slice(prefix.length).trim();
            } else {
                token = rawHeader.trim();
            }

            // Guard against literal "undefined", "null", or empty tokens
            if (!token || token === "undefined" || token === "null") {
                if (isOptional) {
                    req.user = null;
                    return next();
                }
                return res.status(401).json({ success: false, message: "Please login first" });
            }

            let decodedData;
            try {
                const secret = process.env.JWT_SECRET_LOGIN || "default_jwt_secret_reciplore_2026";
                decodedData = jwt.verify(token, secret);
            } catch (err) {
                if (isOptional) {
                    req.user = null;
                    return next();
                }
                if (err.name === "TokenExpiredError" || err.message === "jwt expired") {
                    return res.status(401).json({ success: false, message: "Token has expired. Please login again." });
                }
                if (err.name === "JsonWebTokenError") {
                    return res.status(401).json({ success: false, message: "Invalid token." });
                }
                return res.status(401).json({ success: false, message: "Authentication error", error: err.message });
            }
            
            if (!decodedData || !decodedData.id) {
                if (isOptional) {
                    req.user = null;
                    return next();
                }
                return res.status(400).json({ success: false, message: "Invalid token payload" });
            }

            const user = await User.findById(decodedData.id).populate("addresses").select("-password");

            if (!user) {
                if (isOptional) {
                    req.user = null;
                    return next();
                }
                return res.status(404).json({ success: false, message: "User not found" });
            }

            if (!accessRoles.includes(user.role)) {
                return res.status(403).json({ success: false, message: "Unauthorized access" });
            }

            req.user = user; 
            next(); 
        } catch (err) {
            console.error("Auth middleware error:", err);
            return res.status(500).json({ success: false, message: "Error in auth middleware", error: err.message });
        }
    };
};