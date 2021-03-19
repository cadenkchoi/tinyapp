function generateRandomString(n) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let newShort = '';
  for (let i = 0; i < n; i++) {
    const random = Math.floor(Math.random() * 62);
   newShort += chars[random];
  }
  return newShort;
};


const getUserByEmail = function(email, users) {
  for (const userID in users) {
    if (email === users[userID].email) {
      return userID;
    }
  }
  return undefined;
}

module.exports = { generateRandomString, getUserByEmail }