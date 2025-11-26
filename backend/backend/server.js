  const express = require("express");
  const dotenv = require("dotenv");
  const cors = require("cors");
  const sql = require("mssql");
  const multer = require("multer");
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  console.log("pdfParse type:", typeof pdfParse); // MUST print "function"
  dotenv.config();
  console.log("Loaded key:", process.env.GEMINI_API_KEY);

  const { GoogleGenerativeAI } = require("@google/generative-ai");

  // Gemini API Setup
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
 const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


  // Multer – store PDF in memory buffer (NOT in disk)
  const upload = multer({ storage: multer.memoryStorage() });

  console.log("pdfParse type:", typeof pdfParse);


  const app = express();
  app.use(cors());
  app.use(express.json());

  // ✅ Azure SQL Database Configuration
  const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
      encrypt: process.env.DB_ENCRYPT === "true", // required by Azure
      trustServerCertificate: false
    }
  };

  // ✅ Create Connection Pool
  const pool = new sql.ConnectionPool(dbConfig);
  const poolConnect = pool.connect();

  pool.on("error", (err) => {
    console.error("SQL Connection Pool Error:", err);
  });

  poolConnect
    .then(() => console.log("✅ Connected to Azure SQL Database"))
    .catch((err) => console.error("❌ Database Connection Failed:", err));

  // ======================= ROUTES =======================

  // 🔑 LOGIN
  app.post("/api/login", async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "All fields are required!" });
    }
    

    const table = role === "admin" ? "dbo.admins" : "dbo.students";
    const idField = role === "admin" ? "arno" : "srno";
    const passField = role === "admin" ? "apword" : "spword";
    console.log(`Attempting login for ${role}:`, username);

    try {
      await poolConnect;
      const result = await pool.request()
        .input("username", sql.NVarChar, username)
        .input("password", sql.NVarChar, password)
        .query(`SELECT * FROM ${table} WHERE ${idField} = @username AND ${passField} = @password`);

      if (result.recordset.length > 0) {
        res.json({ success: true, message: "Login successful", role });
      } else {
        console.log("Value invalid");   
        res.status(401).json({ message: "Invalid credentials!" });
      }
    } catch (err) {
      console.error("Login DB error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // 🏢 Fetch Companies
  app.get("/api/companies", async (req, res) => {
    try {
      await poolConnect;
      const result = await pool.request().query("SELECT * FROM dbo.companies");
      res.json(result.recordset);
    } catch (err) {
      console.error("Error fetching companies:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 📝 Save Student Progress
  app.post("/saveStudentProgress", async (req, res) => {
    const { name, regNumber, branch, company, roundsCleared, placementBlog } = req.body;

    if (!name || !regNumber || !branch || !company || !placementBlog) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    try {
      await poolConnect;
      await pool.request()
        .input("stname", sql.NVarChar, name)
        .input("srno", sql.NVarChar, regNumber)
        .input("branch", sql.NVarChar, branch)
        .input("cname", sql.NVarChar, company)
        .input("rounds_cleared", sql.Int, roundsCleared)
        .input("content", sql.NVarChar, placementBlog)
        .query("INSERT INTO dbo.student_progress (stname, srno, branch, cname, rounds_cleared, content) VALUES (@stname, @srno, @branch, @cname, @rounds_cleared, @content)");
      
      res.status(201).json({ message: "Student progress saved successfully!" });
    } catch (err) {
      console.error("Error saving student progress:", err);
      res.status(500).json({ message: "Database error while saving data" });
    }
  });

  // 📦 Off-Campus Companies
  app.get("/api/ofcompanies", async (req, res) => {
    try {
      await poolConnect;
      const result = await pool.request().query("SELECT * FROM dbo.ofcompanies");
      res.json(result.recordset);
    } catch (err) {
      console.error("Error fetching off-campus companies:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 📚 Get Blog (Off-Campus)
  app.get("/api/ofblogs/:modalTitle", async (req, res) => {
    const { modalTitle } = req.params;
    try {
      await poolConnect;
      const result = await pool.request()
        .input("modalTitle", sql.NVarChar, modalTitle)
        .query("SELECT ocontent FROM dbo.ofstudent_progress WHERE ocname = @modalTitle");

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: "Blog not found" });
      }
      res.json(result.recordset[0]);
    } catch (err) {
      console.error("Error fetching off-campus blog:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 📚 Get Blog (On-Campus)
  app.get("/api/blogs/:modalTitle", async (req, res) => {
    const { modalTitle } = req.params;

    if (!modalTitle) {
      return res.status(400).json({ error: "Blog title is required" });
    }

    try {
      await poolConnect;
      const result = await pool.request()
        .input("modalTitle", sql.NVarChar, modalTitle)
        .query("SELECT content FROM dbo.student_progress WHERE cname = @modalTitle");

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: "Blog not found" });
      }
      res.json(result.recordset[0]);
    } catch (err) {
      console.error("Error fetching blog:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 🧾 Save Off-Campus Student Progress
  app.post("/saveOffStudentProgress", async (req, res) => {
    const { name, regNumber, branch, company, roundsCleared, placementBlog } = req.body;

    if (!name || !regNumber || !branch || !company || !placementBlog) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    try {
      await poolConnect;
      await pool.request()
        .input("ostname", sql.NVarChar, name)
        .input("osrno", sql.NVarChar, regNumber)
        .input("obranch", sql.NVarChar, branch)
        .input("ocname", sql.NVarChar, company)
        .input("orounds_cleared", sql.Int, roundsCleared)
        .input("ocontent", sql.NVarChar, placementBlog)
        .query("INSERT INTO dbo.ofstudent_progress (ostname, osrno, obranch, ocname, orounds_cleared, ocontent) VALUES (@ostname, @osrno, @obranch, @ocname, @orounds_cleared, @ocontent)");
      
      res.status(201).json({ message: "Off-campus student progress saved successfully!" });
    } catch (err) {
      console.error("Error saving off-campus progress:", err);
      res.status(500).json({ message: "Database error while saving data" });
    }
  });

  // 🧮 Passed Students (On-Campus)
  app.get("/api/passedStudents/:company", async (req, res) => {
    const { company } = req.params;
    try {
      await poolConnect;
      const result = await pool.request()
        .input("company", sql.NVarChar, company)
        .query(`
          SELECT stname, srno, branch 
          FROM dbo.student_progress 
          WHERE cname = @company 
          AND rounds_cleared = (
              SELECT trounds FROM dbo.companies WHERE cname = @company
          )
        `);
      res.json(result.recordset);
    } catch (err) {
      console.error("Error fetching passed students:", err);
      res.status(500).json({ error: "DB error" });
    }
  });

  // 🧮 Branch Passed Count (On-Campus)
  app.get("/api/branchPassedCount", async (req, res) => {
    const { branch, company } = req.query;
    try {
      await poolConnect;
      const result = await pool.request()
        .input("branch", sql.NVarChar, branch)
        .input("company", sql.NVarChar, company)
        .query(`
          SELECT COUNT(*) AS count 
          FROM dbo.student_progress 
          WHERE cname = @company AND branch = @branch 
          AND rounds_cleared = (SELECT dbo.trounds FROM companies WHERE cname = @company)
        `);
      res.json({ count: result.recordset[0].count });
    } catch (err) {
      res.status(500).json({ error: "DB error" });
    }
  });

  // 🏢 Add Company
  app.post("/api/addCompany", async (req, res) => {
    const { cname, trounds } = req.body;
    if (!cname || !trounds) {
      return res.status(400).json({ message: "All fields are required" });
    }
    try {
      await poolConnect;
      await pool.request()
        .input("cname", sql.NVarChar, cname)
        .input("trounds", sql.Int, trounds)
        .query("INSERT INTO dbo.companies (cname, trounds) VALUES (@cname, @trounds)");
      res.status(201).json({ success: true, message: "Company added successfully" });
    } catch (err) {
      res.status(500).json({ message: "Database error" });
    }
  });

  // 🗑️ Delete Company
  // 🗑️ Delete Company
  app.delete("/api/deleteCompany/:cname", async (req, res) => {
    const { cname } = req.params;
    try {
      await poolConnect;
      await pool.request()
        .input("cname", sql.NVarChar, cname)
        .query("DELETE FROM dbo.companies WHERE cname = @cname");

      res.status(200).json({ success: true, message: "Company deleted successfully" });
    } catch (err) {
      console.error("❌ Delete company error:", err);  // <--- Add this line
      res.status(500).json({ message: err.message });  // <--- Replace this line
    }
  });


  // 🌐 Off-Campus Admin Routes
  app.get("/api/ofpassedStudents/:company", async (req, res) => {
    const { company } = req.params;
    try {
      await poolConnect;
      const result = await pool.request()
        .input("company", sql.NVarChar, company)
        .query(`
          SELECT ostname, osrno, obranch 
          FROM dbo.ofstudent_progress 
          WHERE ocname = @company 
          AND orounds_cleared = (
              SELECT dbo.otrounds FROM ofcompanies WHERE ocname = @company
          )
        `);
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: "DB error" });
    }
  });

  app.get("/api/ofbranchPassedCount", async (req, res) => {
    const { branch, company } = req.query;
    try {
      await poolConnect;
      const result = await pool.request()
        .input("branch", sql.NVarChar, branch)
        .input("company", sql.NVarChar, company)
        .query(`
          SELECT COUNT(*) AS count 
          FROM dbo.ofstudent_progress 
          WHERE ocname = @company 
          AND LOWER(obranch) = LOWER(@branch)
          AND orounds_cleared = (
              SELECT dbo.otrounds FROM ofcompanies WHERE ocname = @company
          )
        `);
      res.json({ count: result.recordset[0].count });
    } catch (err) {
      res.status(500).json({ error: "DB error" });
    }
  });

  // ➕ Add Off-Campus Company
  app.post("/api/ofaddCompany", async (req, res) => {
    const { ocname, otrounds } = req.body;
    if (!ocname || !otrounds) {
      return res.status(400).json({ message: "All fields are required" });
    }
    try {
      await poolConnect;
      await pool.request()
        .input("ocname", sql.NVarChar, ocname)
        .input("otrounds", sql.Int, otrounds)
        .query("INSERT INTO dbo.ofcompanies (ocname, otrounds) VALUES (@ocname, @otrounds)");
      res.status(201).json({ success: true, message: "Company added successfully" });
    } catch (err) {
      res.status(500).json({ message: "Database error" });
    }
  });

  // 🗑️ Delete Off-Campus Company
  app.delete("/api/ofdeleteCompany/:ocname", async (req, res) => {
    const { ocname } = req.params;
    try {
      await poolConnect;
      await pool.request()
        .input("ocname", sql.NVarChar, ocname)
        .query("DELETE FROM dbo.ofcompanies WHERE ocname = @ocname");
      res.status(200).json({ success: true, message: "Company deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Database error" });
    }
  });
  app.post("/api/resume/upload/:srno", upload.single("resume"), async (req, res) => {
    try {
      const { srno } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "Resume PDF is required" });
      }

      // Extract text from in-memory PDF
      const pdfData = await pdfParse(req.file.buffer);
      const extractedText = pdfData.text;

      // Generate summary using Gemini
      const prompt = `Summarize the following resume in 10-12 lines, covering skills, experience, education, and projects:\n\n${extractedText}`;
      const result = await model.generateContent(prompt);
      const summary = result.response.text();

      await poolConnect;

      // Insert new student resume summary
      await pool.request()
        .input("srno", sql.NVarChar, srno)
        .input("resume_url", sql.NVarChar, "") // keeping empty as requested
        .input("summary", sql.NVarChar, summary)
        .query(`
          INSERT INTO dbo.student_resumes (srno, resume_url, summary)
          VALUES (@srno, @resume_url, @summary)
        `);

      res.json({
        success: true,
        message: "Resume uploaded & summarized successfully",
        summary
      });
    } catch (err) {
      console.error("Upload Error:", err);
      res.status(500).json({ message: "Server Error" });
    }
  });

  app.put("/api/resume/reupload/:srno", upload.single("resume"), async (req, res) => {
    try {
      const { srno } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "Resume PDF is required" });
      }

      // Extract PDF → Text
      const pdfData = await pdfParse(req.file.buffer);
      const extractedText = pdfData.text;

      // AI summary
      const prompt = `Re-summarize this updated resume in 10-12 lines:\n\n${extractedText}`;
      const result = await model.generateContent(prompt);
      const summary = result.response.text();

      await poolConnect;

      // Update summary
      await pool.request()
        .input("srno", sql.NVarChar, srno)
        .input("summary", sql.NVarChar, summary)
        .query(`
          UPDATE dbo.student_resumes
          SET summary = @summary
          WHERE srno = @srno
        `);

      res.json({
        success: true,
        message: "Resume reuploaded & summarized successfully",
        summary
      });
    } catch (err) {
      console.error("Reupload Error:", err);
      res.status(500).json({ message: "Server Error" });
    }
  });

  app.get("/api/resume/:srno", async (req, res) => {
    try {
      const { srno } = req.params;

      await poolConnect;

      const result = await pool.request()
        .input("srno", sql.NVarChar, srno)
        .query("SELECT summary FROM dbo.student_resumes WHERE srno = @srno");

      if (result.recordset.length === 0) {
        return res.status(404).json({ message: "No summary found for this student" });
      }

      res.json({
        srno,
        summary: result.recordset[0].summary
      });
    } catch (err) {
      console.error("Fetch Summary Error:", err);
      res.status(500).json({ message: "Server Error" });
    }
  });

  // ✅ Root route
  app.get("/", (req, res) => {
    res.send("🚀 Azure SQL Server is running!");
  });

  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
