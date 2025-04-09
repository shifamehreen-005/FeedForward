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
            // After user is inserted into `users` table, also create a default profile
            const profileSql = "INSERT INTO user_profiles (email) VALUES (?)";
            db.query(profileSql, [email], (profileErr, profileResult) => {
                if (profileErr) {
                    console.error("Failed to initialize profile:", profileErr);
                    return res.status(500).json({ message: "User created, but profile initialization failed" });
                }
                res.status(201).json({ message: "User and profile created successfully" });
            });

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

app.post("/save-profile", (req, res) => {
    const {
        name, email, phone, location, transport, dietary_restrictions,
        culture, kitchen_access, distribution, services, bio
    } = req.body;

    const sql = `
        INSERT INTO user_profiles 
        (name, email, phone, location, transport, dietary_restrictions, 
         culture, kitchen_access, distribution, services, bio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            phone = VALUES(phone),
            location = VALUES(location),
            transport = VALUES(transport),
            dietary_restrictions = VALUES(dietary_restrictions),
            culture = VALUES(culture),
            kitchen_access = VALUES(kitchen_access),
            distribution = VALUES(distribution),
            services = VALUES(services),
            bio = VALUES(bio)
    `;

    db.query(sql, [
        name, email, phone, location, transport, dietary_restrictions,
        culture, kitchen_access, distribution, services, bio
    ], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to save profile" });
        }
        res.status(200).json({ message: "Profile saved or updated successfully" });
    });
});

app.get("/get-profile", (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const sql = "SELECT * FROM user_profiles WHERE email = ?";
    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ message: "Server error" });

        if (results.length === 0) {
            return res.status(404).json({ message: "Profile not found" });
        }

        res.status(200).json(results[0]);
    });
});




app.get('/', (req, res) => {
    res.send('Hello World');
});

// Start Server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
