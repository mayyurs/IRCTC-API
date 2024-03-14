// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
  
    try {
      const decoded = jwt.verify(token.split(' ')[1], process.env.SECRET_KEY); 
      req.user_id = decoded.user_id;
      next();
    } catch (err) {
      console.error('Error verifying token', err);
      res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
  }
  
export default verifyToken;
  