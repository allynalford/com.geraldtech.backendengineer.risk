'use strict';
const Boom = require('@hapi/boom');
const dateFormat = require('dateformat');
const log = require('lambda-log');
const Response = require('./models/Response');
const responses = require('./common/responses.js');

// {
//   "age": 35,
//   "dependents": 2,
//   "house": {"ownership_status": "owned"},
//   "income": 0,
//   "marital_status": "married",
//   "risk_questions": [0, 1, 0],
//   "vehicle": {"year": 2018}
// }

module.exports.risk = async event => {
  let req, dt;
  //Risk object
  let risk = {
    life: 0,
    disability: 0,
    home: 0,
    auto: 0,
  };

  //POST inputs
  let age, dependents, house, income, marital_status, risk_questions, vehicle;

  //Validation
  try {
    //Setup logging
    log.options.meta.event = event;
    // add additional tags to all logs
    log.options.tags.push(event.env);

    //Set a time stamp for responses
    dt = dateFormat(new Date(), "isoUtcDateTime");

    //Grab the POST body
    req = JSON.parse(event.body);

    //Grab the values for validation from the request
    age = req.age;
    dependents = req.dependents;
    house = req.house;
    income = req.income;
    marital_status = req.marital_status;
    risk_questions = req.risk_questions;
    vehicle = req.vehicle;

    if (typeof age === "undefined")
      throw new Error("Critical Error: age is undefined");
    //Age (an integer equal or greater than 0)
    if (!Number.isInteger(age) | (parseInt(age) < 0))
      throw new Error(
        "Critical Error: age must be an integer equal or greater than 0"
      );

    if (typeof dependents === "undefined")
      throw new Error("Critical Error: dependents is undefined");
    //The number of dependents (an integer equal or greater than 0)
    if (!Number.isInteger(dependents) | (parseInt(dependents) < 0))
      throw new Error(
        "Critical Error: dependents must be an integer equal or greater than 0"
      );

    if (typeof income === "undefined")
      throw new Error("Critical Error: income is undefined");
    //Income (an integer equal or greater than 0)
    if (!Number.isInteger(income) | (parseInt(income) < 0))
      throw new Error(
        "Critical Error: income must be an integer equal or greater than 0"
      );

    if (typeof marital_status === "undefined")
      throw new Error("Critical Error: marital_status is undefined");
    //marital_status: Marital status ("single" or "married")
    if (!(marital_status === "single" || marital_status === "married"))
      throw new Error(
        "Critical Error: Marital status must have a value of 'single' or 'married'"
      );

    if (typeof risk_questions === "undefined")
      throw new Error("Critical Error: risk_questions is undefined");
    //risk_questions must be an array
    if (!Array.isArray(risk_questions))
      throw new Error("Critical Error: risk_questions must be an array");
    //risk_questions must be an array with 3 values
    if (risk_questions.length !== 3)
      throw new Error("Critical Error: risk_questions must have 3 values");
    //risk_questions must have 3 boolean values
    if (risk_questions.every((val) => typeof val !== "boolean"))
      throw new Error(
        "Critical Error: risk_questions must have 3 boolean values"
      );

    //A user can have 0 or 1 house. When they do, it has just one
    //attribute: ownership_status, which can be "owned" or "mortgaged".
    if (typeof house !== "undefined") {
      if (
        !(
          house.ownership_status === "owned" ||
          house.ownership_status === "mortgaged"
        )
      ) {
        throw new Error(
          "Critical Error: House.ownership_status must have a value of 'owned' or 'mortgaged'"
        );
      }
    }

    //A user can have 0 or 1 vehicle. When they do, it has just one
    //attribute: a positive integer corresponding to the year it was manufactured.
    if (typeof vehicle !== "undefined") {
      if (!Number.isInteger(vehicle.year)) {
        throw new Error("Critical Error: invalid vehicle.");
      } else if (vehicle.year < 0) {
        throw new Error(
          "Critical Error: vehicle has an invalid manufacture year."
        );
      }
    }

  } catch (e) {
    log.error(e);
    const boom = Boom.badData(e.message);
    return responses.respond(new Response(false, dt, undefined, boom), boom.output.statusCode);
  }


  //process the data
  try {

    // Calculate the base score by summing the risk questions answers
    const baseScore = risk_questions.reduce((acc, cur) => acc + cur, 0);


    // Check eligibility for disability, auto, and home insurance
    if (income === 0) {
      risk.disability = -1;
    };
    if (!house || house.ownership_status !== "owned") {
      risk.house = -1;
    };
    if (!vehicle || vehicle.year < new Date().getFullYear() - 5) {
      risk.auto = -1;
    };

    // Check age eligibility for disability and life insurance
    if (age > 60) {
      risk.disability = -1;
      risk.life = -1;
    };

    // Deduct risk points based on age
    if (age < 30) {
      risk.life -= 2;
      risk.disability -= 2;
      risk.home -= 2;
      risk.auto -= 2;
    } else if (age < 40) {
      risk.life -= 1;
      risk.disability -= 1;
      risk.home -= 1;
      risk.auto -= 1;
    };

    // Deduct risk points based on income
    if (income > 200000) {
      risk.life -= 1;
      risk.disability -= 1;
      risk.home -= 1;
      risk.auto -= 1;
    };

    // Add risk points based on house ownership status and dependents
    if (house && house.ownership_status === "mortgaged") {
      risk.home += 1;
      risk.disability += 1;
    };
    if (dependents > 0) {
      risk.life += 1;
      risk.disability += 1;
    };

    // Add or remove risk points based on marital status
    if (marital_status === "married") {
      risk.life += 1;
      risk.disability -= 1;
    };

    // Add risk points based on vehicle year
    if (vehicle && vehicle.year >= new Date().getFullYear() - 5) {
      risk.auto += 1;
    };

    // Map the final scores to insurance risk levels based on there score
    const mapRiskLevel = (score) => {
      if (score <= 0) {
        return "economic";
      } else if (score <= 2) {
        return "regular";
      } else {
        return "responsible";
      }
    };

    //Calculate the response for each plan
    let insurance = {
      life: age > 60  ? "ineligible" : mapRiskLevel(baseScore + risk.life),
      disability: typeof income === "undefined" || income === 0 || age > 60 ? "ineligible" : mapRiskLevel(baseScore + risk.disability),
      home: typeof house === "undefined" ? "ineligible" : mapRiskLevel(baseScore + risk.home),
      auto: typeof vehicle === "undefined" ? "ineligible" : mapRiskLevel(baseScore + risk.auto),
    };


    //Respond to the request
    return responses.respond(new Response(true, dt, insurance), 200);
  } catch (err) {
    log.log(err);
    const boom = new Boom.Boom(err.errors[0].detail, {
      statusCode: err.statusCode,
      data: err.errors,
    });
    return responses.respond(new Response(false, dt, undefined, boom), boom.output.statusCode);
  }
};