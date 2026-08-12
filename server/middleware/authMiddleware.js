import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedData; // Attach user info to the request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};