const axios = require("axios");
const cheerio = require("cheerio");

exports.handler = async function (event, context) {
  const { startRegNo, count } = event.queryStringParameters;

  // Check if both parameters are provided
  if (!startRegNo || !count) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid parameters" }),
    };
  }

  const results = [];

  // Function to fetch the result of a student by registration number
  async function fetchResult(regNo) {
    const url = `http://result.nu.ac.bd/results_latest/result_show.php?reg_no=${regNo}&exm_code=Bachelor%20Degree%20(Honours)%203rd%20Year&sub_code=1&exm_year=2022`;

    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const resultTable = $("#customers");

      const studentResult = {
        regNO: regNo,
        subjects: {},
      };

      resultTable.find("tr").each((index, element) => {
        if (index > 0) {
          const courseCode = $(element).find("td").eq(0).text().trim();
          const grade = $(element).find("td").eq(1).text().trim();

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
    for (let i = 0; i < count; i++) {
      const regNo = parseInt(startRegNo) + i;
      const result = await fetchResult(regNo);

      if (result) {
        results.push(result);
      }

      // Delay to avoid overwhelming the server (optional)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Fetch results for the specified range
  await fetchResults(startRegNo, count);

  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
};
