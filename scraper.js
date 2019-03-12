const async   = require("async");
const request = require("request");
const fs      = require('fs');
var wstream   = fs.createWriteStream('output.txt');

let crawl = function (options = {
    seed                    : new Set(["https://medium.com/"]),
    visited                 : new Set(),
    seedForNext             : new Set(),
    iteration               : 1,
    depthLimit              : 5,
    cocurentConnectionLimit : 5
}, cb = () => { }) {
    let { 
        seed, 
        visited, 
        seedForNext, 
        iteration, 
        depthLimit, 
        cocurentConnectionLimit 
    } = options;
    console.log("iteration #" + iteration);
    async.parallelLimit(Array.from(seed).map((url, i) => {
        return cb => {
            visited.add(url);
            console.log(`Fetching ${i + 1} of ${seed.size}: ${url}`);
            request({
                method: "GET",
                uri: url,
                followRedirect: false
            }, (error, response, body) => {
                if (error){
                    console.log(new Error(error));
                }
                else if (response.statusCode == 200) {
                    wstream.write(url + "\n");
                    seedForNext = union(seedForNext, filterUrls(fetchUrlsfromHTML(body), url, visited));
                }
                else {
                    console.log("statusCode", response.statusCode, url);
                    if (response.headers.location)
                        seedForNext = union(seedForNext, filterUrls([response.headers.location], url, visited));
                }
                cb();
            });
        };
    }),
        cocurentConnectionLimit,
        (error, result) => {
            if (error) {
                cb(error);
            }
            else {
                seed = seedForNext;
                seedForNext = new Set();
                iteration++;
                if (seed.size && iteration <= depthLimit) {
                    crawl({ seed, visited, seedForNext, iteration, depthLimit, cocurentConnectionLimit }, cb);
                }
                else if (iteration > depthLimit) {
                    console.log("max Depth reached");
                    cb(null, visited);
                }
                else {
                    console.log("no more urls found");
                    cb(null, visited);
                }
            }
        });
};

function fetchUrlsfromHTML(body) {
    let m;
    const regex = /<a[^>]*href="([^"]*)"/gmi;
    let urls = [];
    while ((m = regex.exec(body)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        let url;
        try {
            url = new URL(m[1]);
            urls.push(url.href);
        }
        catch (ex) { }
    }
    return urls;
}

function filterUrls(list, href, visited) {
    let urlObj = new URL(href);
    let finalList = list
        .map(url => new URL(url, href))
        //Should be internal url
        .filter(url => url.origin === urlObj.origin)
        .map(url => url.origin + url.pathname)
        //Should not be in visited urls list
        .filter(url => !visited.has(url))
        ;
    return new Set(finalList);
}
function union(setA, setB) {
    for (var elem of setB) {
        setA.add(elem);
    }
    return setA;
}

module.exports = { crawl };