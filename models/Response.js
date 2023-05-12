'use strict';
/**
 * constructor for Response Object
 *
 * @author Allyn j. Alford <Allyn@backpac.xyz>
 * @constructs Response
 * @class Response
 * @param {Boolean} success - true | false
 * @param {Date} dt  - 2022-10-26T05:13:17Z
 * @param {Object} data object thats represented by the endpoint path
 * @param {Boom} error Boom error object
 * @public
 * @description returns a response to a request
 * @version 1.0
 * @example <caption>Example usage of Response Object.</caption>
 * @return {Response} Response Instance Object
 */
function Response(success, dt, data, error) { 
    this.success  = success;
    this.dt  = dt;
    this.data = (typeof error !== "undefined" ? error.data : data);
    this.error = (typeof error !== "undefined" ? error.output : undefined);
};

/**
 * get the response id
 * @returns {Date}
 */
Response.prototype.getId = function() {
    return this.dt;
};
/**
 * check response against another
 * @return {Boolean}
 */
Response.prototype.equals = function(otherSolution) {
    return otherSolution.getId() == this.getId();
};
/**
 * fill the response with additional fields
 * @return {Void}
 */
Response.prototype.fill = function(newFields) {
    for (var field in newFields) {
        if (this.hasOwnProperty(field) && newFields.hasOwnProperty(field)) {
            if (this[field] !== 'undefined') {
                this[field] = newFields[field];
            }
        }
    }
};
module.exports = Response;