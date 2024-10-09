const axios = require("axios");
const cheerio = require("cheerio");

exports.handler = async function (event, context) {
  const { startRegNo, count } = event.queryStringParameters;
  if (!startRegNo || !count) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid parameters" }),
    };
  }

  const fetchResult = async (regNo) => {
    const url = `http://result.nu.ac.bd/results_latest/result_show.php?reg_no=${regNo}&exm_code=Bachelor%20Degree%20(Honours)%203rd%20Year&sub_code=1&exm_year=2022`;
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const resultTable = $("#customers");
      const studentResult = { regNO: regNo, subjects: {} };

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
      console.error(error);
      return null;
    }
  };

  const fetchResults = async (startRegNo, count) => {
    const results = [];
    for (let i = 0; i < count; i++) {
      const regNo = parseInt(startRegNo) + i;
      const result = await fetchResult(regNo);
      if (result) results.push(result);
    }
    return results;
  };

  try {
    const results = await fetchResults(startRegNo, parseInt(count));
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch results" }),
    };
  }
};
