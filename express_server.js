const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser')

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


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

function generateRandomString(n) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let newShort = '';
  for (let i = 0; i < n; i++) {
    const random = Math.floor(Math.random() * 62);
   newShort += chars[random];
  }
  return newShort;
};

const urlsForUser = function(userCookie) {
  let urlResult = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key]["userID"] === userCookie){
      urlResult[key] = urlDatabase[key];
    }
  }
  return urlResult;
};

app.get("/", (req, res) => {
  res.send("Hello!")
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  // req.session.userid
  let currentUser = req.cookies["user_id"];
  let newUser = urlsForUser(currentUser);
  
  // logs to check if newUser is using url function properly as well as to see if the newly created shortURL is actually passing to the database
  // console.log("123", newUser);
  // console.log("345", urlDatabase);
  
  const templateVars = { urls: newUser, user_id: users[currentUser] };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase, users, user_id: req.cookies["user_id"] };
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
  }
 
  users[id] = { id, email, password };
  res.cookie("user_id", id)
  res.redirect("/urls/");
});

app.get("/login/", (req, res) => {
  const templateVars = { urls: urlDatabase, users, user_id: req.cookies["user_id"] };
  res.render("urls_login", templateVars)
});

app.post("/login/", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  for (let keys in users) {
    if (users[keys].email === email && users[keys].password === password) {
      res.cookie("user_id", users[keys].id);
      res.redirect("/urls/");
      }
    }
  res.status(403).send("Email or Password does not match, please try again.");
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  const newURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL: newURL, userID: req.cookies["user_id"] };
  res.redirect("/urls/" + shortURL);
});

// if we can't find a cookie to see if logged in, redirect to login page
app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
    return;
  }
  const templateVars = { urls: urlDatabase, users, user_id: req.cookies["user_id"] };
  res.render("urls_new", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const nURL = req.body.longURL;
  const id = req.params.id;
  urlDatabase[id] = { longURL: nURL, userID: id };
  res.redirect("/urls/")
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.cookies["user_id"];
  const newUser = urlsForUser(userID);
  const templateVars = { urls: newUser, user_id:userID };
  if (userID && userID === urlDatabase[req.params.shortURL].userID) {
    let shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("Permission Denied!")
  }
});

// page that displays short/long URLs
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { urls: urlDatabase, users, user_id: req.cookies["user_id"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls/");
});

app.get('*', (req, res) => {
  res.status(404);
  res.render('404');
});
