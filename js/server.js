require("dotenv").config();
const fs = require("fs");
const path = require("path");
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
        db.query(sql, [email, hash, user_type], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error inserting user" });
            }
            // After user is inserted into `users` table, also create a default profile
            const profileSql = user_type === "volunteers"
            ? "INSERT INTO volunteer_profiles (email) VALUES (?);"
            : "INSERT INTO user_profiles (email) VALUES (?);";

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

app.post("/save-profile-volunteer", (req, res) => {
    const {
        name, email, phone, location, availability, transport,
        volunteer_interests, skills, experience, background_check, bio
    } = req.body;
    
    const sql = `
        INSERT INTO volunteer_profiles 
        (name, email, phone, location, availability, transport,
         volunteer_interests, skills, experience, background_check, bio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            phone = VALUES(phone),
            location = VALUES(location),
            availability = VALUES(availability),
            transport = VALUES(transport),
            volunteer_interests = VALUES(volunteer_interests),
            skills = VALUES(skills),
            experience = VALUES(experience),
            background_check = VALUES(background_check),
            bio = VALUES(bio)
    `;
    
    db.query(sql, [
        name, email, phone, location, availability, transport,
        volunteer_interests, skills, experience, background_check, bio
    ], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to save volunteer profile" });
        }
        res.status(200).json({ message: "Volunteer profile saved or updated successfully" });
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

app.get("/get-profile-volunteer", (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const sql = "SELECT * FROM volunteer_profiles WHERE email = ?";
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


app.post("/upload-json-data", (req, res) => {
    try {
        // ======= LOCATION (Array) =======
        const locationPath = path.join(__dirname, "..", "data", "location.json");
        const locationData = JSON.parse(fs.readFileSync(locationPath, "utf8").replace(/\bNaN\b/g, 'null'));

        const locationInsert = `
            INSERT INTO location (
                agency_id, agency_name, agency_region, county_ward, latitude, longitude
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                agency_name = VALUES(agency_name),
                agency_region = VALUES(agency_region),
                county_ward = VALUES(county_ward),
                latitude = VALUES(latitude),
                longitude = VALUES(longitude)
        `;

        locationData.forEach(loc => {
            db.query(locationInsert, [
                loc["Agency ID"],
                loc["Agency Name"],
                loc["Agency Region"],
                loc["County/Ward"],
                loc["Latitude"],
                loc["Longitude"]
            ], err => {
                if (err) console.error("Location insert error:", err);
            });
        });

        // ======= INFORMATION (Array) =======
        const infoPath = path.join(__dirname, "..", "data", "information.json");
        const infoData = JSON.parse(fs.readFileSync(infoPath, "utf8").replace(/\bNaN\b/g, 'null'));

        const clean = (val) => (val && val.toLowerCase() !== "nan" ? val : null);

        const infoInsert = `
            INSERT INTO information (
                agency_id, agency_name, food_pantry_requirements, food_format,
                distribution_models, cultural_populations_served
            ) VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                agency_name = VALUES(agency_name),
                food_pantry_requirements = VALUES(food_pantry_requirements),
                food_format = VALUES(food_format),
                distribution_models = VALUES(distribution_models),
                cultural_populations_served = VALUES(cultural_populations_served)
        `;

        infoData.forEach(info => {
            db.query(infoInsert, [
                info["Agency ID"],
                info["Agency Name"],
                clean(info["Food Pantry Requirements"]),
                info["Food Format"],
                info["Distribution Models"],
                clean(info["Cultural Populations Served"])
            ], err => {
                if (err) console.error("Information insert error:", err);
            });
        });

        // ======= AVAILABILITY (Array) =======
        const availabilityPath = path.join(__dirname, "..", "data", "availability.json");
        const availabilityData = JSON.parse(fs.readFileSync(availabilityPath, "utf8").replace(/\bNaN\b/g, 'null'));

        const availabilityInsert = `
            INSERT INTO availability (
                agency_id, agency_name, day_of_week, frequency,
                starting_time, ending_time, by_appointment_only
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                agency_name = VALUES(agency_name),
                frequency = VALUES(frequency),
                starting_time = VALUES(starting_time),
                ending_time = VALUES(ending_time),
                by_appointment_only = VALUES(by_appointment_only)
        `;

        availabilityData.forEach(avail => {
            db.query(availabilityInsert, [
                avail["Agency ID"],
                avail["Agency Name"],
                avail["Day of Week"],
                avail["Frequency"],
                avail["Starting Time"],
                avail["Ending Time"],
                avail["By Appointment Only"]
            ], err => {
                if (err) console.error("Availability insert error:", err);
            });
        });

        // Final response (sent immediately after firing all inserts)
        res.status(200).json({ message: "All data inserted (location, information, availability)" });

    } catch (err) {
        console.error("Unexpected error:", err);
        res.status(500).json({ message: "Unexpected error occurred" });
    }
});


app.get("/api/agencies", (req, res) => {
    const sql = "SELECT agency_id, agency_name, latitude, longitude FROM location WHERE latitude IS NOT NULL AND longitude IS NOT NULL";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Failed to fetch agency locations:", err);
            return res.status(500).json({ message: "Database error" });
        }

        // dummy weight for food insecurity
        const enriched = results.map(r => ({
            ...r,
            weight: Math.random().toFixed(2) //value between 0.00 and 1.00
        }));

        
        res.status(200).json(results);
    });
});



// Start Server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
