module.exports.respond = (b, statusCode) => {
    return {
      statusCode,
      body: JSON.stringify(b),
      headers: {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "POST,GET"
      }
    };
  };
  module.exports.respondpure = (b, statusCode) => {
    return {
      statusCode,
      body: b,
      headers: {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "POST,GET"
      }
    };
  };
 