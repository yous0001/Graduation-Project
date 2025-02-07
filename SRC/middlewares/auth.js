import jwt from 'jsonwebtoken'
import User  from "../../DB/models/user.model.js"; 
import { systemRoles } from "../../SRC/utils/system-roles.js";


export const auth = (accessRoles = [systemRoles.USER, systemRoles.ADMIN, systemRoles.DELIVERY]) => {
    return async (req, res, next) => {
        try {
            
            const accessToken = req.headers.accesstoken;

            if (!accessToken) {
                return res.status(401).json({ message: "Please login first" });
            }

            if (!accessToken.startsWith(process.env.TOKEN_PREFIX)) {
                return res.status(400).json({ message: "Invalid token prefix" });
            }

            const token = accessToken.split(process.env.TOKEN_PREFIX)[1];
            
            let decodedData;
            try {
                decodedData = jwt.verify(token, process.env.JWT_SECRET_LOGIN);
            } catch (err) {
                if (err.name === "TokenExpiredError" || err.message === "jwt expired") {
                    return res.status(401).json({ message: "Token has expired. Please login again." });
                }
                if (err.name === "JsonWebTokenError") {
                    return res.status(400).json({ message: "Invalid token." });
                }
                return res.status(500).json({ message: "Authentication error", error: err.message });
            }
            
            if (!decodedData || !decodedData.id) {
                return res.status(400).json({ message: "Invalid token payload" });
            }

            const user = await User.findById(decodedData.id);

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (!accessRoles.includes(user.role)) {
                return res.status(403).json({ message: "Unauthorized access" });
            }

            req.user = user; 
            next(); 
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: "Error in auth middleware", error: err.message });
        }
    }
}