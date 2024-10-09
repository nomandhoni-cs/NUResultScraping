const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

// Initialize express app
const app = express();
app.use(express.json());

// Function to fetch the result of a student by registration number
async function fetchResult(regNo) {
  const url = `http://result.nu.ac.bd/results_latest/result_show.php?reg_no=${regNo}&exm_code=Bachelor%20Degree%20(Honours)%203rd%20Year&sub_code=1&exm_year=2022`;

  try {
    // Fetch the HTML
    const { data } = await axios.get(url);

    // Load the HTML into cheerio
    const $ = cheerio.load(data);

    // Find the table containing the results
    const resultTable = $("#customers");

    // Initialize an object to store student data
    const studentResult = {
      regNO: regNo,
      subjects: {},
    };

    // Iterate over each row in the table (excluding the header row)
    resultTable.find("tr").each((index, element) => {
      if (index > 0) {
        // Skip the header row
        const courseCode = $(element).find("td").eq(0).text().trim();
        const grade = $(element).find("td").eq(1).text().trim();

        // Add course and grade to the student's subject list
        if (courseCode && grade) {
          studentResult.subjects[courseCode] = grade;
        }
      }
    });

    return studentResult;
  } catch (error) {
    console.error(`Error fetching result for Reg No: ${regNo}`, error);
  }
}

// Function to fetch results for a range of students
async function fetchResults(startRegNo, count) {
  const results = [];

  for (let i = 0; i < count; i++) {
    const regNo = startRegNo + i;
    const result = await fetchResult(regNo);

    if (result) {
      results.push(result);
    }

    // Delay to avoid overwhelming the server (optional)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

// Define API endpoint to fetch results
app.get("/results", async (req, res) => {
  const startRegNo = parseInt(req.query.startRegNo);
  const count = parseInt(req.query.count);

  if (!startRegNo || !count) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  try {
    const results = await fetchResults(startRegNo, count);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

// Start the server on Railway's default port or 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
