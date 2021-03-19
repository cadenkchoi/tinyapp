const express = require("express");
const app = express();
const PORT = 8080;
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
app.set("view engine", "ejs");


app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({extended: true}));
const { getUserByEmail, generateRandomString } = require("./helpers.js");

const urlsForUser = function(userCookie) {
  let urlResult = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key]["userID"] === userCookie) {
      urlResult[key] = urlDatabase[key];
    }
  }
  return urlResult;
};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let currentUser = req.session.user_id;
  let newUser = urlsForUser(currentUser);
  const templateVars = { urls: newUser, user_id: users[currentUser] };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase, users, user_id: req.session.user_id };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString(5);
  const email = req.body.email;
  const password = req.body.password;
  if (email === '' || password === '') {
    return res.status(400).send("Error");
  }
  for (let keys in users) {
    if (users[keys].email === req.body.email) {
      return res.status(400).send("Email already exists");
    }
  };
  users[id] = {
    id: id,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };
  req.session.user_id = id;
  res.redirect("/urls/");
});

app.get("/login/", (req, res) => {
  const templateVars = { urls: urlDatabase, users, user_id: req.session.user_id };
  const userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

app.post("/login/", (req, res) => {
  let userID = getUserByEmail(req.body.email, users);
  if (!userID) {
    return res.status(403).send(`An account associated with ${req.body.email} does not exist`);
  } else if (bcrypt.compareSync(req.body.password, users[userID].password)) {
    req.session.user_id = userID;
    res.redirect("/urls");
    return;
  } else {
    return res.status(403).send("The username or password you entered is incorrect!");
  }
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  const newURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL: newURL, userID: req.session.user_id };
  res.redirect("/urls/" + shortURL);
});

// if we can't find a cookie to see if logged in, redirect to login page
app.get("/urls/new", (req, res) => {
  let key = req.session.user_id;
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }
  const templateVars = { urls: urlDatabase, user_id: users[key] };
  res.render("urls_new", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const nURL = req.body.longURL;
  const id = req.session.user_id;
  if (id === urlDatabase[req.params.id]["userID"]) {
    urlDatabase[req.params.id] = { longURL: nURL, userID: id };
    res.redirect("/urls/");
  } else {
    res.status(403).send("Donatello says no");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  if (userID && userID === urlDatabase[req.params.shortURL].userID) {
    let shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("Permission Denied!");
  }
});

// page that displays short/long URLs
app.get("/urls/:shortURL", (req, res) => {
  let key = urlDatabase[req.params.shortURL]["userID"];
  let user = req.session.user_id;
  if (user !== key) {
    res.status(403).send("Permission Denied, please log in");
  } else {
    const templateVars = { urls: urlDatabase, users, user_id: users[key], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  if (longURL) {
    console.log(req.params.short);
    res.redirect(longURL.longURL);
  } else {
    res.send("The URL does not exist");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls/");
});

