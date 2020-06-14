// Load mongoose library
const mongoose = require("mongoose");

// Design database schema
let schema = new mongoose.Schema(
    {
        StoreID: String,
        StockCode: Number,
        CupString: String,
        SmallImageFile: String,
        MediumImageFile: String,
        LargeImageFile: String,
        URLFriendlyName: String,
        Price: Number,
        Name: String,
        Description: String,
        Department: String,
        Category: String,
        Ingredients: String,
        NutritionalInformation: Array,
        /*
        NutritionalInformation: 
            [{
                Name: String, 
                AvgQtyPerServing: String,
                AvgQtyPer100g: String,
                ServingSize: String,
                ServingsPerPack: String
            }],
        */
        AllergenContains: Array,
        AllergenMayBePresent: Array,
        AllergyStatement: String
    }
);



// Create model and add the schema to it.
let WoolworthsProduct = mongoose.model("WoolworthsProduct", schema);

module.exports = WoolworthsProduct;