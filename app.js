const input                 = require("./input.json");
const scraper               = require("./scraper");
var seed                    = new Set(input.seed);
var visited                 = new Set();
var seedForNext             = new Set();
var iteration               = 0;
var depthLimit              = input.depthLimit;
var cocurentConnectionLimit = input.cocurentConnectionLimit;
scraper.crawl({ seed, visited, seedForNext, iteration, depthLimit, cocurentConnectionLimit }, (error, result) => {
    if (error)
        console.error(error);
    else {
        console.log(result);
        console.log("COMPLETED");
    }
});
