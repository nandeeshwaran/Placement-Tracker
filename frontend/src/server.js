const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mysql = require("mysql");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.log("Database Connection Failed!", err);
        return;
    }
    console.log("Connected to MySQL Database!");
});

// API to authenticate user login
app.post("/api/login", (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    let table = role === "admin" ? "admins" : "students";
    let idField = role === "admin" ? "arno" : "srno";
    let passField = role === "admin" ? "apword" : "spword";

    const query = `SELECT * FROM ${table} WHERE ${idField} = ? AND ${passField} = ?`;

    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (results.length > 0) {
            res.json({ success: true, message: "Login successful", role });
        } else {
            res.status(401).json({ message: "Invalid credentials!" });
        }
    });
});




app.get("/api/companies", (req, res) => {
  const query = "SELECT * FROM companies"; // Ensure the table name is correct

  db.query(query, (err, results) => {
      if (err) {
          console.error("Error fetching companies:", err);
          return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json(results);
  });
});


// ✅ Save Student Progress
app.post("/saveStudentProgress", (req, res) => {
    
    const { name, regNumber, branch, company, roundsCleared, placementBlog } = req.body;

    if (!name || !regNumber || !branch || !company || !placementBlog) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    const query = "INSERT INTO student_progress (stname, srno, branch, cname, rounds_cleared, content) VALUES (?, ?, ?, ?, ?, ?)";

    db.query(query, [name, regNumber, branch, company, roundsCleared, placementBlog], (err, result) => {
        if (err) {
            console.error("Error saving student progress:", err);
            return res.status(500).json({ message: "Database error while saving data" });
        }
        res.status(201).json({ message: "Student progress saved successfully!" });
    });
});

app.get("/api/ofcompanies", (req, res) => {
    const query = "SELECT * FROM ofcompanies"; // Adjust table name if needed

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching off-campus companies:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json(results);
    });
});


app.get("/api/ofblogs/:modalTitle", (req, res) => {
  const modalTitle = req.params.modalTitle;
//   console.log("Received request for:", modalTitle);

  const query = "SELECT ocontent FROM ofstudent_progress WHERE ocname = ?";
  db.query(query, [modalTitle], (err, results) => {
    if (err) {
      console.error("Error fetching blogs:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.json(results[0]);
  });
});
  
app.get("/api/blogs/:modalTitle", (req, res) => {
    const modalTitle = req.params.modalTitle;
    console.log("Received request for:", modalTitle); 
  
    if (!modalTitle) {
      return res.status(400).json({ error: "Blog title is required" });
    }
  
    const query = "SELECT content FROM student_progress WHERE cname = ?";
  
    db.query(query, [modalTitle], (err, results) => {
      if (err) {
        console.error("Error fetching blogs:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Blog not found" });
      }
      res.json(results[0]);
    });
  });
  // ✅ Save Student Progress
app.post("/saveOffStudentProgress", (req, res) => {
    const { name, regNumber, branch, company, roundsCleared, placementBlog } = req.body;

    if (!name || !regNumber || !branch || !company || !placementBlog) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    const query = "INSERT INTO ofstudent_progress (ostname, osrno, obranch, ocname, orounds_cleared, ocontent) VALUES (?, ?, ?, ?, ?, ?)";

    db.query(query, [name, regNumber, branch, company, roundsCleared, placementBlog], (err, result) => {
        if (err) {
            console.error("Error saving student progress:", err);
            return res.status(500).json({ message: "Database error while saving data" });
        }
        res.status(201).json({ message: "Student progress saved successfully!" });
    });
});


app.get("/api/passedStudents/:company", (req, res) => {
    const { company } = req.params;
    const query = `
        SELECT stname, srno, branch 
        FROM student_progress 
        WHERE cname = ? 
        AND rounds_cleared = (
            SELECT trounds FROM companies WHERE cname = ?
        )
    `;
    db.query(query, [company, company], (err, results) => {
        if (err) return res.status(500).json({ error: "DB error" });
        res.json(results);
    });
});



app.get("/api/branchPassedCount", (req, res) => {
    const { branch, company } = req.query;

    const query = `
      SELECT COUNT(*) as count 
      FROM student_progress 
      WHERE cname = ? AND branch = ? AND rounds_cleared = (
          SELECT trounds FROM companies WHERE cname = ?
      )
    `;

    db.query(query, [company, branch, company], (err, results) => {
        if (err) return res.status(500).json({ error: "DB error" });
        res.json({ count: results[0].count });
    });
});






app.get("/", (req, res) => {
    res.send("Server is running!");
});

const port = 5000 || process.env.DB_PORT;

app.listen(port, () => {
    console.log(`🚀 Server is running on port 5000`);
});


