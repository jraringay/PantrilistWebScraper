// Load mongoose module
const mongoose = require("mongoose");

/**
* Set to Node.js native promises
* Per https://mongoosejs.com/docs/promises.html
*/
mongoose.Promise = global.Promise;

// Load fs module
const fs = require("fs");

// Environment to be used in connecting to Azure Cosmos DB
const env = {
  accountName: 'xper',
  databaseName: 'xper', 
  key: 'f3WFfN8eww92nYI42SUDopbOyZsH8WXK3EroBKSzIEaRWqm5IlwwkYTSL9IWw6gSIh6SytcbCxweVIqa2Ni81A%3D%3D',
  port: 10255
};

// Load WoolworthsProduct Model
const WoolworthsProduct = require("./WoolworthsProduct");
// const WoolworthsCounter = require("./WoolworthsCounter");

// URI string for MongoDB address (MongoDB Atlas)
// const uri = "mongodb+srv://admin:StrongPassword1@wooliesdb01-4zom6.azure.mongodb.net/test?retryWrites=true&w=majority";
// const uri = "mongodb://admin:cxzaqwe123@172.18.0.2/test?authSource=admin";

// URI string for MongoDB address (Cosmos DB)
const uri = `mongodb://${env.accountName}:${env.key}@${env.accountName}.documents.azure.com:${env.port}/${env.databaseName}?ssl=true`;

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

async function updateFields() {
  let products = await WoolworthsProduct.find();

  products.forEach(async (product) => {
    if(typeof product.AllergenContains === 'string') {
      if(product.AllergenContains.indexOf(',') > -1) {
        product.AllergenContains = product.AllergenContains.split(',').map(item => {
          return item.trim();
        });
      }
      else if (product.AllergenContains.indexOf('|') > -1) {
        product.AllergenContains = product.AllergenContains.split('|').map(item => {
          return item.trim();
        });
      } else {
        product.AllergenContains = [product.AllergenContains];
      }
    } else {
      product.AllergenContains = [];
    }

    if(typeof product.AllergenMayBePresent === 'string') {
      if(product.AllergenMayBePresent.indexOf(',') > -1) {
        product.AllergenMayBePresent = product.AllergenMayBePresent.split(',').map(item => {
          return item.trim();
        });
      }
      else if (product.AllergenMayBePresent.indexOf('|') > -1) {
        product.AllergenMayBePresent = product.AllergenMayBePresent.split('|').map(item => {
          return item.trim();
        });
      } else {
        product.AllergenMayBePresent = [product.AllergenMayBePresent];
      }
    } else {
      product.AllergenMayBePresent = [];
    }

    await product.save();
  });
}

async function main() {
  await connectToDB();
  await updateFields();

  console.log('Done Update');
  process.exit(1);
}

main();