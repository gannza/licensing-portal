const users = require("./users");
const workflows = require("./workflows");
const documents = require("./documents");
const auth = require("./auth");
const applicationTypes = require("./applicationTypes");
const applications = require("./applications");
    
module.exports = {
    ...users,
    ...workflows,
    ...documents,
    ...auth,
    ...applicationTypes,
    ...applications,
}