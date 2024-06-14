//middleware/auth.js

const jwt = require('jsonwebtoken');

const authenticationMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: "Unauthorized. Please add valid token" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, name, email } = decoded; // Extract email from the token
    req.user = { id, name, email }; // Attach email to req.user
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Unauthorized. Please add valid token" });
  }
};

module.exports = authenticationMiddleware;
