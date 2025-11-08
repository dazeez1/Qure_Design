import { verifyAuthToken } from "../utils/jwt.js";

export function authenticateToken(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.substring(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing Authorization token" });
    }

    const decoded = verifyAuthToken(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.userId, // Map userId to id for consistency
      role: decoded.role,
      firstName: decoded.firstName,
      hospitalName: decoded.hospitalName,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
