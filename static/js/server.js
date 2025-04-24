require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(express.json());
app.use(cors());

const TRANSIT_API_KEY = process.env.TRANSIT_API_KEY || "d2075a8b39fe7d775cf2a672682dfa41ed554d531095786cfe030853c50e8675";
const EXTERNAL_TRANSIT_URL = "https://external.transitapp.com/v3/otp/plan";

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

// **Feedbacks
app.post('/feedback', (req, res) => {
    const {
      name,
      visitReason,
      exceeded,
      improvement,
      shoutout,
      featureUsed,
      featureExperience
    } = req.body;
  
    const sql = `
      INSERT INTO feedback (
        name, visit_reason, exceeded, improvement,
        shoutout, feature_used, feature_experience, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
  
    const values = [
      name,
      visitReason,
      exceeded || null,
      improvement || null,
      shoutout || null,
      featureUsed || null,
      featureExperience || null
    ];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('❌ Error inserting feedback:', err);
        return res.status(500).send('Server error');
      }
      console.log('✅ Feedback inserted:', result.insertId);
      res.status(200).send('Feedback received!');
    });
  });
  
// **User Login**
app.post("/login", (req, res) => {
    const { email, password, user_type } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const sql = "SELECT * FROM users WHERE email = ? AND user_type = ?";
    db.query(sql, [email, user_type], (err, results) => {
        if (err) return res.status(500).json({ message: "Server error" });

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user_type === 'staff') {
            if (password !== results[0].password) {
                return res.status(401).json({ message: "Invalid email or password" });
            }
            const token = jwt.sign({ id: results[0].id, user_type: results[0].user_type }, "secretkey", { expiresIn: "1h" });
            return res.json({ message: "Login successful", token });
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

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

app.get("/transitPlan", async (req, res) => {
  console.log("Received request to /transitPlan with query:", req.query);
  
  // Check if we have the minimum required parameters
  if (!req.query.fromPlace || !req.query.toPlace) {
    return res.status(400).json({
      error: "Missing required parameters. You must provide at least 'fromPlace' and 'toPlace'."
    });
  }
  
  try {
    const queryString = new URLSearchParams(req.query).toString();
    const finalUrl = `${EXTERNAL_TRANSIT_URL}?${queryString}`;
    console.log("Making request to:", finalUrl);

    const response = await fetch(finalUrl, {
      headers: {
        apiKey: TRANSIT_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream request failed with status ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error proxying request:", error);
    res.status(500).json({ error: error.message });
  }
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


// Find food banks based on preferences
function buildFoodBankQuery(formData) {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // "HH:MM:SS"
    const allWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
    function getWeekOccurrence(date) {
      const day = date.getDate();
      const weekday = date.getDay();
      let count = 0;
      for (let i = 1; i <= day; i++) {
        const d = new Date(date.getFullYear(), date.getMonth(), i);
        if (d.getDay() === weekday) count++;
      }
      return count;
    }
  
    // --- Resolve day type to actual weekday strings ---
    let targetDays = [];
  
    if (formData.day_type === "Today") {
      targetDays.push(now.toLocaleString("en-US", { weekday: "long", timeZone: "America/New_York" }));
    } else if (formData.day_type === "Tomorrow") {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      targetDays.push(tomorrow.toLocaleString("en-US", { weekday: "long", timeZone: "America/New_York" }));
    } else if (formData.day_type === "Another day" && formData.days?.length) {
      if (formData.days.includes("Tomorrow")) {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        targetDays.push(tomorrow.toLocaleString("en-US", { weekday: "long", timeZone: "America/New_York" }));
      }
      formData.days.forEach(selectedDay => {
        if (selectedDay !== "Tomorrow" && allWeekdays.includes(selectedDay)) {
          targetDays.push(selectedDay);
        }
      });
    }
  
    if (targetDays.length === 0) {
      targetDays.push(now.toLocaleString("en-US", { weekday: "long", timeZone: "America/New_York" }));
    }
  
    console.log("🗓 Target Days:", targetDays);
  
    const weekOccurrences = targetDays.map(day => {
      const dayIndex = allWeekdays.indexOf(day);
      const targetDate = new Date(now);
      const offset = (dayIndex - now.getDay() + 7) % 7;
      targetDate.setDate(now.getDate() + offset);
      const occurrence = getWeekOccurrence(targetDate);
      return { day, occurrence };
    });
  
    console.log("📆 Week Occurrences:", weekOccurrences);
  
    let query = 
      `SELECT fa.agency_id, fa.agency_name, fa.food_format, fa.cultural_populations_served,
      a.day_of_week, a.frequency, a.starting_time, a.ending_time,
             l.latitude, l.longitude, l.agency_region, l.county_ward
      FROM food_agencies AS fa
      JOIN availability AS a ON fa.agency_id = a.agency_id
      JOIN location AS l ON fa.agency_id = l.agency_id
      WHERE 1=1 `;

    
  
    const params = [];
  
    // --- Delivery logic ---
    if (formData.can_travel === "No" && formData.someone_else === "No") {
      query +=  `AND LOWER(fa.distribution_models) LIKE ?`;
      params.push('%home delivery%');
    }

    if (formData.delivery_day?.length) {
        formData.delivery_day.forEach(selectedDay => {
          if (allWeekdays.includes(selectedDay)) {
            targetDays.push(selectedDay);
          }
        });
      }
      
  
    // --- Food format filter ---
    if (formData.food_format?.length && !formData.food_format.includes("Any")) {
      const formatConditions = [];
      formData.food_format.forEach(format => {
        formatConditions.push('LOWER(fa.food_format) LIKE ?');
        params.push(`%${format.toLowerCase().trim()}%`);
      });
      query +=  `AND (${formatConditions.join(' OR ')})`;
    }
  
    console.log("🥫 Food format filters:", formData.food_format);
  
    // --- Dietary preferences filter ---
    if (formData.dietary_pref?.length && !formData.dietary_pref.includes("None")) {
      const dietConditions = [];
      formData.dietary_pref.forEach(diet => {
        dietConditions.push('LOWER(fa.cultural_populations_served) LIKE ?');
        params.push(`%${diet.toLowerCase().trim()}%`);
      });
      query +=  `AND (${dietConditions.join(' OR ')})`;
    }
  
    console.log("🍽️ Dietary preference filters:", formData.dietary_pref);
  
    // --- Day of week filter ---
    if (targetDays.length) {
      query +=  `AND (${targetDays.map(() => 'a.day_of_week = ?').join(' OR ')})`;
      params.push(...targetDays);
    }
  
    // --- Frequency filter ---
    const frequencyLabels = ["1st", "2nd", "3rd", "4th", "5th"];
    const frequencyConditions = ['LOWER(a.frequency) LIKE LOWER(?)', 'LOWER(a.frequency) LIKE LOWER(?)'];
    const frequencyParams = ['%every week%', '%as needed%'];
  
    weekOccurrences.forEach(dayInfo => {
      const matchedFreqLabel = frequencyLabels[dayInfo.occurrence - 1] || "1st";
      frequencyConditions.push('LOWER(a.frequency) LIKE LOWER(?)');
      frequencyParams.push(`%${matchedFreqLabel}%`);
    });
  
    query +=  `AND (${frequencyConditions.join(' OR ')})`;
    params.push(...frequencyParams);
  
    console.log("⏳ Frequency Params:", frequencyParams);
  
    // --- Combined Time filter (preferred + delivery) ---
    const timeRanges = [];
    const combinedTimes = [...(formData.preferred_time || []), ...(formData.delivery_time || [])];
  
    if (combinedTimes.length) {
      combinedTimes.forEach(slot => {
        if (slot.includes("Morning")) timeRanges.push({ start: "09:00:00", end: "12:00:00" });
        if (slot.includes("Afternoon")) timeRanges.push({ start: "12:00:00", end: "16:00:00" });
        if (slot.includes("Evening")) timeRanges.push({ start: "16:00:00", end: "19:00:00" });
        if (slot.includes("Night")) timeRanges.push({ start: "19:00:00", end: "23:00:00" });
      });
    }
  
    if (timeRanges.length === 0) {
      timeRanges.push({ start: currentTime, end: currentTime });
    }
  
    console.log("⏰ Time Ranges:", timeRanges);
  
    const timeConditions = [];
    const timeParams = [];
  
    timeRanges.forEach(range => {
      timeConditions.push(`(
        (a.starting_time <= ? AND a.ending_time >= ?) OR
        LOWER(a.starting_time) = 'as needed' OR
        LOWER(a.ending_time) = 'until food runs out'
      )`);
      timeParams.push(range.end, range.start);
    });
  
    query +=  `AND (${timeConditions.join(' OR ')})`;
    params.push(...timeParams);
  
    console.log("🕐 Time Params:", timeParams);
    console.log("📄 Final SQL Query:\n", query);
    console.log("📦 Final SQL Params:\n", params);
  
    return { query, params };
  }  
  


// POST /search route
app.post('/search', (req, res) => {
  const formData = req.body;
  console.log("📥 Form Data Received:", formData);
  const { query, params } = buildFoodBankQuery(formData);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ SQL error:', err);
      return res.status(500).json({ error: 'Query failed' });
    }
    res.json(results);
  });
});
  
  

// Start Server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
