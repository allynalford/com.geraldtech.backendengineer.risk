# com.geraldtech.backendengineer.risk
This is a serverless project that requires the installation of serverless

npm i - To install the serverless project

npm run test - To run the project

Test Endpoint: POST | http://localhost:3000/dev/user/risk


The main technical decisions i had to make was weather to split up each of the points deductions and additions based on the plan into separate modules or not. For the sake of this project i decided against it and only did so at a higher level which is for risk and insurance plan.

The endpoint itself is split into two sections:

1. The validation section which checks the input values.

2. The processing section which calculates the risk for each plan based on the input data.

I choose to call a function for each plan instead of passing the risk object into the function for the sake of simplicity of the endpoint and clarity. 