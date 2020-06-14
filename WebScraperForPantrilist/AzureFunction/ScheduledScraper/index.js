// Load request/request-promise module to perform http requests
const request = require("request-promise");

// Load mongoose module
const mongoose = require("mongoose");

/**
* Set to Node.js native promises
* Per https://mongoosejs.com/docs/promises.html
*/
mongoose.Promise = global.Promise;

// Load fs module
const fs = require("fs"); 

// Load WoolworthsProduct Model
const NewWoolworthsProduct = require("./NewWoolworthsProduct");

// Load WoolworthsItemCounter Model
const WoolworthsItemCounter = require("./WoolworthsItemCounter");

/* STRICTLY FOR MONGODB ATLAS TESTING

// URI string for MongoDB address (MongoDB Atlas)
const uri = "mongodb+srv://admin:StrongPassword1@wooliesdb01-4zom6.azure.mongodb.net/test?retryWrites=true&w=majority";

// Connect to MongoDB function (Mongoose)
async function connectToDB() {
    await mongoose.connect(uri, { useNewUrlParser: true, 
        useUnifiedTopology: true }, 
        function (err, db) {
            if (err) {
                console.log("An error occurred while connecting to DB.");
                return console.log(err);
            } 
        }
    );
    console.log("Connected to WoolworthsProduct Database!");
}

*/

// Load environment file (for Cosmos DB connection)
const env = require("./environment");

// URI string for MongoDB address (Cosmos DB)
const uri = `mongodb://${env.accountName}:${env.key}@${env.accountName}.documents.azure.com:${env.port}/${env.databaseName}?ssl=true`;

// Connect to MongoDB function
async function connectToDB() {
    await mongoose.connect(uri, { useNewUrlParser: true, 
        useUnifiedTopology: true }, 
        function (err) {
            if (err) {
                console.log("An error occurred while connecting to DB.");
                return console.log(err);
            } else {
                console.log("Connected to WoolworthsProduct Database!");
            } 
        }
    );
}

// Function to close DB. This is used for testing and doesn't work when run as an Azure Function.
var closeDB = function() { 
    mongoose.connection.close(function () {
      console.log('Mongoose default connection with DB is disconnected through app termination');
      process.exit(0);
    });
}

// A function that logs the scraped item into the ItemLog text file. 
// This doesn't work when being run as an Azure function
function logItem(item) {
    
    // Establishes a createWriteStream and creates a txt file
    // called ItemLog.txt if it doesn't exist and appends to the
    // file if it already exists.
    let stream = fs.createWriteStream("ItemLog.txt", {flags:'a'});
    
    // Creates a new line each time an item is stored.
    // A date variable is included for logging purposes.
    let date = new Date().toISOString();
    stream.write(date + " " + item + "\r\n");
}



// Perform scraping function
async function scrapeWoolworths() {

    // Checks the counter row from the WoolworthsItemCounter table/model
    // and retrieves its From and To values to be used in the for loop below
    let counter = await WoolworthsItemCounter.findOne();
    
    // A for-loop to contain possible item IDs based from range 1 to 999999 from Woolworths API
    // Note: Only scrape a reasonable amount of data in certain time periods so that
    // you won't lose access to the API.
    for (let i = counter.From; i <= counter.To; i++) {
        try {
            
            // The source url from Woolworths API to retrieve the data from
            sourceUrl = "https://www.woolworths.com.au/apis/ui/product/detail/" + i;

            // Retrieve raw JSON data from Woolies' API using request-promise module
            const jsonData = await request.get(sourceUrl);

            // Parse raw json data into a JSON object
            let jsonObj = JSON.parse(jsonData);

            // Declare the variables we will be storing the jsonObj values to
            let stockCode;
            let cupString;
            let smallImage;
            let mediumImage;
            let largeImage;
            let urlfriendly;
            let price;
            let name;
            let description;
            let department;
            let category;
            let ingredients;
            let nutritionalInformation = [];
            let allergenContains;
            let allergenMayBePresent;
            let allergyStatement;

            // Checks if 'Product' or 'Price' is null
            if (jsonObj.Product === null || jsonObj.Product.Price === null) {
                let notExist = "Item: " + i + " does not exist or does not have a Price.";
                console.log(notExist + " Moving to the next item.");
                logItem(notExist); // log the unexisting/no price item into txt file for the itemsList
            } else {
                // Store the following information into its designated variables
                stockCode = jsonObj.Product.Stockcode;
                cupString = jsonObj.Product.CupString;
                smallImage = jsonObj.Product.SmallImageFile;
                mediumImage = jsonObj.Product.MediumImageFile;
                largeImage = jsonObj.Product.LargeImageFile;
                urlfriendly = jsonObj.Product.UrlFriendlyName;
                price = jsonObj.Product.Price;
                name = jsonObj.Product.Description;
                description = jsonObj.Product.RichDescription;
                
                // Check if 'PrimaryCatrgory' is null and store null values into the variables below
                if(jsonObj.PrimaryCategory === null){
                    department = null;
                    category = null;    
                } else {
                    // Store the following information into its designated variables
                    department = jsonObj.PrimaryCategory.Department;
                    category = jsonObj.PrimaryCategory.Aisle;
                }

                // Check if 'AdditionalAttributes' is null and store null values into the variables below.
                if (jsonObj.AdditionalAttributes === null) {
                    ingredients = null;
                    allergenContains = null;
                    allergenMayBePresent = null;
                    allergyStatement = null;
                } else {
                    // Store the following information into its designated variables
                    ingredients = jsonObj.AdditionalAttributes.ingredients;
                    allergenContains = jsonObj.AdditionalAttributes.allergencontains;
                    allergenMayBePresent = jsonObj.AdditionalAttributes.allergenmaybepresent;
                    allergyStatement = jsonObj.AdditionalAttributes.allergystatement;

                    // Since the allergenContains field contains a string input,
                    // this process converts the string input into an array of strings.
                    if(typeof allergenContains === 'string') {
                        if(allergenContains.indexOf(',') > -1) {
                          allergenContains = allergenContains.split(',').map(item => {
                            return item.trim();
                          });
                        }
                        else if (allergenContains.indexOf('|') > -1) {
                          allergenContains = allergenContains.split('|').map(item => {
                            return item.trim();
                          });
                        } else {
                          allergenContains = [allergenContains];
                        }
                      } else {
                        allergenContains = [];
                      }
                  
                      // Since the allergenMayBePresent field contains a string input,
                      // this process converts the string input into an array of strings.
                      if(typeof allergenMayBePresent === 'string') {
                        if(allergenMayBePresent.indexOf(',') > -1) {
                          allergenMayBePresent = allergenMayBePresent.split(',').map(item => {
                            return item.trim();
                          });
                        }
                        else if (allergenMayBePresent.indexOf('|') > -1) {
                          allergenMayBePresent = allergenMayBePresent.split('|').map(item => {
                            return item.trim();
                          });
                        } else {
                          allergenMayBePresent = [allergenMayBePresent];
                        }
                      } else {
                        allergenMayBePresent = [];
                      }

                }

                if (jsonObj.NutritionalInformation !== null || Array.isArray(jsonObj.NutritionalInformation)) {
                    console.log(jsonObj);
                    // Store the following information into the array along with
                    // a for-each to traverse through its elements.
                    jsonObj.NutritionalInformation.forEach((item) => {
                        nutritionalInformation.push({
                            nName: item.Name,
                            avgQtyPerServing: item.Values["Avg Qty Per Serving"],
                            avgQtyPer100g: item.Values["Avg Qty Per 100g"],
                            servingSize: item.ServingSize,
                            servingsPerPack: item.ServingsPerPack
                        });
                    });
                }

                // Create product object to store the saved values.
                let product = new NewWoolworthsProduct({
                    StoreID: "W01",
                    StockCode: stockCode,
                    CupString: cupString,
                    SmallImageFile: smallImage,
                    MediumImageFile: mediumImage,
                    LargeImageFile: largeImage,
                    URLFriendlyName: urlfriendly,
                    Price: price,
                    Name: name,
                    Description: description,
                    Department: department,
                    Category: category,
                    Ingredients: ingredients,
                    NutritionalInformation: nutritionalInformation,
                    AllergenContains: allergenContains,
                    AllergenMayBePresent: allergenMayBePresent,
                    AllergyStatement: allergyStatement
                });
                await product.save(); // save product to database
                let itemString = "Item ID: " + stockCode + " - " + name;
                logItem(itemString); // log the scraped item into into text file for the itemsList
                console.log(itemString + " has been added to the database.");
            }
        } catch (err) {
            // Error handler
            console.error(err);
            let errorString = "Item: " + i + " is a faulty itemcode."
            logItem(errorString); // log unstorable item code into txt file for the itemsList
        }
    }
    counter.From = counter.From + 7000; // increments the From data for next iteration/execution
    counter.To = counter.To + 7000; // increments the To data for next iteration/execution
    await counter.save();
    console.log("Scraping Completed.. Process will now terminate.");
  }

// If being run manually, this main() function should be not commented
// If not, comment the entire function and uncomment the module.exports code snippet below
async function main() {
    await connectToDB();
    await scrapeWoolworths();
    // If the Node process ends, close the Mongoose connection
    // process.exit();
    process.on('SIGINT', closeDB).on('SIGTERM', closeDB);
}

main();

/**
 * If being run in the background in Azure, this function should be not commented
 * If not, comment the entire function and uncomment the main() function above
module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    
    if (myTimer.IsPastDue)
    {
        context.log('JavaScript is running late!');
    }
    await main();
    context.log('JavaScript timer trigger function ran!', timeStamp);   
    context.done();
};
*/