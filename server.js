// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// MODULES INCLUDED IN NODE.JS:
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const fs = require('fs');
const express = require('express');
const https = require('https');
const util = require("util");

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// APPLICATIONS:
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const app = express();
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// VARIABLES:
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 1) App variables
const port = process.env.PORT || 8080;
// 2) URL Parameters
// const fsym = 'BTC';
const tsym = 'USD';
// const aggregate = 3; // true
const e = 'CCCAGG';
const apiKey = '864b9e5f0059d3f4dc5625c32190fe70f76bc06b522dcbfa0f296702c87b4947';
// 3) Data variables
const dirData = 'database/data/d_';
const dirPrices = 'database/prices/p_';
const dirTimeline = 'database/timeline/t_';
const dirIndividual = 'database/individual/i_';
const paramData = 'Data';
const paramPrice = 'close';
const paramTime = 'time';
const usersData = JSON.parse(fs.readFileSync('database/usersData.json'));
const object = getUniqueAssetsAndIds(usersData);
const assets = object['assets'];
const ids = object['ids'];

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// COMMENDS:
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
console.log('Server started..');
// ONE TIME FUNCTION TO GET DATA FROM CRYPTOCOMPARE.COM
// getData();
// getIndex();
// TIMEOUT FUNCTION
setInterval(updateData, 3600000);
setInterval(getIndex, 3660000);

app.listen(port, listening);
app.use(express.static('public'));

// SYNC FUNCTIONS
function listening() {
    console.log('Listening..');
}

function getData() {
    const limit = 400;

    assets.forEach(asset => {
        const options = {
            "method": "GET",
            "hostname": "min-api.cryptocompare.com",
            "path": `/data/histoday?fsym=${asset}&tsym=${tsym}&limit=${limit}&e=${e}`,
            "authorization": `Apikey ${apiKey}`
        };

        const req = https.request(options, (res) => {
            // console.log('statusCode:', res.statusCode);
            // console.log('headers:', res.headers);

            let chunks = '';
            res.on('data', (chunk) => {
                chunks += chunk;
            });

            res.on('end', () => {
                // process.stdout.write(chunks);
                
                const parsedChunks = JSON.parse(chunks);
                const data = parsedChunks[paramData];

                writeFile(`${dirData}${asset}.json`, JSON.stringify(data))
                    .then(() => {
                        console.log(`extractData(${asset}) will begin..`);
                        extractData(asset);
                    })
                    .catch(e => console.error(e));
            });
        });

        req.on('error', (e) => {
            console.error(e);
        });

        req.end();
    });  
}

function extractData(asset) {
    readFile(`${dirData}${asset}.json`)
        .then((response) => {
            const data = JSON.parse(response);
            
            let prices = [];
            let timeline = [];

            data.forEach(el => {
                prices.push(el[paramPrice]);
                timeline.push(new Date(el[paramTime] * 1000));
            });

            writeFile(`${dirPrices}${asset}.json`, JSON.stringify(prices))
                .then(() => {
                    console.log(`Done with prices for ${asset}`);
                })
                .catch(e => console.error(e));

            writeFile(`${dirTimeline}${asset}.json`, JSON.stringify(timeline))
                .then(() => {
                    console.log(`Done with timeline for ${asset}`);
                })
              .catch(e => console.error(e));
        })
        .catch(e => console.error(e));
}

function updateData() {
    const limit = 1;

    assets.forEach(asset => {
        const options = {
            "method": "GET",
            "hostname": "min-api.cryptocompare.com",
            "path": `/data/histoday?fsym=${asset}&tsym=${tsym}&limit=${limit}&e=${e}`,
            "authorization": `Apikey ${apiKey}`
        };

        const req = https.request(options, (res) => {

            let chunks = '';
            res.on('data', (chunk) => {
                chunks += chunk;
            });
    
            res.on('end', () => {
                const parsedChunks = JSON.parse(chunks);
                const newData = parsedChunks[paramData][1];

                updateFile(asset, dirData, newData);
                updateFile(asset, dirPrices, newData[paramPrice]);
                updateFile(asset, dirTimeline, new Date(newData[paramTime] * 1000));
            });
        });
    
        req.on('error', (e) => {
            console.error(e);
        });
    
        req.end();
    });
}

function updateFile(asset, location, data) {
    const lastEntry = getLastEntry(asset);
    const now = unixNow();
    
    readFile(`${location}${asset}.json`)
        .then((response) => {
            console.log(`File opened: ${location}${asset}.json! Time: ${new Date().toDateString()}`);
            const parsedResponse = JSON.parse(response);

            if(now === lastEntry) {
                parsedResponse.pop();
                parsedResponse.push(data);
                console.log(`Current day was updated!`);
            } else {
                parsedResponse.push(data);
                console.log(`Database was updated!`);
            }

            writeFile(`${location}${asset}.json`, JSON.stringify(parsedResponse))
            .then(() => {
                console.log(`File saved: ${location}${asset}.json! Time: ${new Date().toDateString()}`);
            })
            .catch(e => console.error(e));
        })
        .catch(e => console.error(e));
}

function getLastEntry(asset) {
    const data = fs.readFileSync(`${dirData}${asset}.json`);
    const parsedData = JSON.parse(data);
    const lastEntry = parsedData[parsedData.length - 1][paramTime];
    return lastEntry;
}

function unixNow() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    let day;
    if (now.getUTCDate() < 10) {
        day = `0${now.getUTCDate()}`;
    } else {
        day = now.getUTCDate();
    }
    const unixNow = new Date(`${year}-${month}-${day}T00:00:00+00:00`).getTime() / 1000;
    return unixNow;
}

function getUniqueAssetsAndIds(data) {
    const allIds = [];
    const allAssets = [];

    data.forEach(el => {
        allIds.push(el['id']);
        allAssets.push(...el['assets']);
    })

    const uniqueAssets = [...new Set(allAssets)];
    return { assets: uniqueAssets, ids: allIds };
}

function getIndex() {
    usersData.forEach(data => {
        const id = data['id'];
        const user = data['user'];
        const [a1, a2, a3, a4, a5] = data['assets'];
        const [p1, p2, p3, p4, p5] = data['percentages'];
        const indexArray = [7, 30, 90, data['index']];
        const timeline = JSON.parse(fs.readFileSync(`${dirTimeline}${a1}.json`));
        const prices = [
            JSON.parse(fs.readFileSync(`${dirPrices}${a1}.json`)),
            JSON.parse(fs.readFileSync(`${dirPrices}${a2}.json`)),
            JSON.parse(fs.readFileSync(`${dirPrices}${a3}.json`)),
            JSON.parse(fs.readFileSync(`${dirPrices}${a4}.json`)),
            JSON.parse(fs.readFileSync(`${dirPrices}${a5}.json`))
        ];
        const length = timeline.length;
    
        const indexPrices = [];
        const indexTimeline = [];
        indexArray.forEach(el => {
            let pricesArray = [100];
            for(let i = (length - (el - 1)); i < length; i++) {
                pricesArray.push(parseFloat((100 * p1 / prices[0][length - el] * prices[0][i] +
                                             100 * p2 / prices[1][length - el] * prices[1][i] +
                                             100 * p3 / prices[2][length - el] * prices[2][i] +
                                             100 * p4 / prices[3][length - el] * prices[3][i] +
                                             100 * p5 / prices[4][length - el] * prices[4][i]).toFixed(2)));
            }
            indexPrices.push(pricesArray);
    
            let timelineArray = [];
            for(let i = (length - el); i < length; i++) {
                timelineArray.push(new Date(timeline[i]));
            }
            indexTimeline.push(timelineArray);
        });

        const index = [];
        indexPrices.forEach(el => {
            const indexArray = [];
            for(let i = 0; i < el.length; i++) {
                let ind = indexPrices.indexOf(el);
                indexArray.push({
                    date: indexTimeline[ind][i],
                    value: indexPrices[ind][i]
                });
            }
            index.push(indexArray);

        });
        
        writeFile(`${dirIndividual}${id}_${user}.json`, JSON.stringify(index))
            .then(() => {
                console.log(`File saved: ${dirIndividual}${id}_${user}.json!`);
            })
            .catch(e => console.error(e));
    });
}

// APIs
app.get('/getindexdata/:user/', getIndexData);
app.get('/seelikes/:user/', seeLikes);
app.get('/givelikes/:user/', giveLikes);

function getIndexData(request, response) {
    const user = request.params.user;
    const index = usersData.findIndex(users => users.user === user);

    const data = JSON.parse(fs.readFileSync(`${dirIndividual}${index}_${user}.json`));

    response.send(data);
}

function seeLikes(request, response) {
    const user = request.params.user;
    const index = usersData.findIndex(users => users.user === user);
    const likes = usersData[index].likes;
    response.send(`${likes}`);
}

function giveLikes(request, response) {
    const user = request.params.user;
    const index = usersData.findIndex(users => users.user === user);

    usersData[index].likes += 1;

    const updatedData = JSON.stringify(usersData, null, 2);

    fs.writeFile('usersData.json', updatedData, (err) => {
        if (err) throw err;
        console.log(`The number of likes for ${user} has been updated!`);
    });

    response.send('Liked!');
}
