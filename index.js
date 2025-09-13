const express = require("express");
const fs  = require("fs");
const jwt =  require("jsonwebtoken");
const cors = require ("cors");
const bodyParser =  require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const USERS_FILE = "./users.json";
const JWT_SECRET = "super-secret-key"; // ❌ don’t hardcode in real apps

// Load users from file
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

// Save users to file
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Register
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  let users = loadUsers();

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "User already exists" });
  }

  users.push({ username, password }); // ❌ Plaintext passwords only for demo!
  saveUsers(users);

  res.json({ message: "User registered" });
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  let users = loadUsers();

  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "15m" });
  res.json({ token });
});

// Protected route
app.get("/profile", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid token" });
    res.json({ message: `Welcome ${decoded.username}` });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
