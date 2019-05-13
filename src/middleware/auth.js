const jwt = require("jsonwebtoken");
const User = require("../models/user");

// checks if header token has associated user in database
// set the 1) current user and 2) current token on req if user exists
const auth = async (req, res, next) => {
  try {
    // get token from header
    const token = req.header("Authorization").replace("Bearer ", "");
    // decode the token to gain access to user _id associated with it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // look for user with _id and associated token
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token
    });
    //
    if (!user) {
      throw new Error();
    }
    // console.log(req.token);
    // console.log(req.user);
    req.token = token;
    req.user = user;

    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = auth;
