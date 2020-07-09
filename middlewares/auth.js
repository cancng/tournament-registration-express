const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMw = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token)
    return res
      .status(401)
      .json({ msg: 'No token provided, authorization denied' });

  // Verify token
  try {
    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) {
        return res.status(401).json({ msg: 'Token is not valid' });
      } else {
        req.user = decoded.user;
        next();
      }
    });
  } catch (err) {
    console.error('something wrong with userauth middleware');
    res.status(500).json({ msg: 'Server Error' });
  }
};

const isAdmin = async (req, res, next) => {
  const { id } = req.user;
  if (!id)
    return res
      .status(401)
      .json({ msg: 'No token provided, authorization denied' });

  // Verify is admin?
  try {
    const user = await User.findById(id);
    if (user.isAdmin === '1')
      // console.log(user);
      next();
    else return res.status(401).json({ msg: 'Authorization denied' });
  } catch (err) {
    console.error('something wrong with isAdmin middleware');
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = {
  authMw,
  isAdmin,
};
