const { sign, verify } = require("jsonwebtoken");

var name = "";

const createTokens = (user) => {
  const accessToken = sign(
    { username: user.username, id: user.id },
    "jwtsecretplschange"
  );

  return accessToken;
};

const validateToken = (req, res, next) => {
  
  const accessToken = req.cookies["access-token"];

  if (!accessToken){
    res.redirect("/login")
    //return res.status(400).json({ error: "User not Authenticated!" });
  }
    

  try {
    const validToken = verify(accessToken, "jwtsecretplschange");
    if (validToken) {
      req.authenticated = true;
      var userName = validToken.username;
      name = validToken.username;
      res.locals.user = userName;
      return next();
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }
};

const getName =() =>{
  return name;
}

module.exports = { createTokens, validateToken, getName };