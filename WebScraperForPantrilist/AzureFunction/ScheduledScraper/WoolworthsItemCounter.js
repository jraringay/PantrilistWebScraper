// Load mongoose library
const mongoose = require("mongoose");

// Design database schema
let schema = new mongoose.Schema(
    {
        From: Number,
        To: Number
    }
);

// Create model and add the schema to it.
let WoolworthsItemCounter = mongoose.model("WoolworthsItemCounter", schema);

module.exports = WoolworthsItemCounter;