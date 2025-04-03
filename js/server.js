require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// MySQL Connection
const db = mysql.createConnection({
    host: "authdb.c2rk4k2g8hpl.us-east-1.rds.amazonaws.com",
    user: "authuser",
    password: "your-password",
    database: "authdb"
});

db.connect(err => {
    if (err) throw err;
    console.log("MySQL Connected...");
});

// **User Registration (Signup)**
app.post("/signup", async (req, res) => {
    
    const { email, password, user_type } = req.body;
    if (!email || !password || !user_type) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Hash password
    try {
        // Hash the password
        const hash = await bcrypt.hash(password, 10);
        
        // Insert the user into the database
        const sql = "INSERT INTO users (email, password, user_type) VALUES (?, ?, ?)";
        console.log(email, hash, user_type);
        db.query(sql, [email, hash, user_type], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error inserting user" });
            }
            res.status(201).json({ message: "User registered successfully" });
        });
    } catch (err) {
        return res.status(500).json({ message: "Error hashing password" });
    }
});

// **User Login**
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ message: "Server error" });

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare passwords
        bcrypt.compare(password, results[0].password, (err, match) => {
            if (!match) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            // Generate JWT token
            const token = jwt.sign({ id: results[0].id, user_type: results[0].user_type }, "secretkey", { expiresIn: "1h" });
            res.json({ message: "Login successful", token });
        });
    });
});

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Start Server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
