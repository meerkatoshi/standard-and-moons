//---------------------------------------------
// MAIN VARIABLES
//---------------------------------------------
const user = 'meerkatoshi';
const path = 'standardandmoons.com';
const http = new HTTP;

//---------------------------------------------
// DOM ELEMENTS
//---------------------------------------------
const progress = document.querySelector('.progress-wrapper');
const indexDetails = document.querySelector('.index-details');
const topChart = document.querySelector('.chart-top');
const box = document.querySelector('.buttons');
const buttons = document.getElementsByClassName('button');
let current = document.querySelector('.current');
const tweet = document.getElementById('tweet');
const like = document.getElementById('like');
const likes = document.getElementById('likes');
const change = document.getElementById('index-change');

const buttonsArray = Array.from(buttons);
let input = current.value;
let inputIndex;
inputIndex = getInputIndex(input);

// --------------------------------------------
// EVENT LISTENERS
// --------------------------------------------
box.addEventListener('click', updateInput);
tweet.addEventListener('click', share);
like.addEventListener('click', giveLikes);
window.addEventListener('resize', readData);
window.setInterval(refreshData, 3600000);
window.onload = load();
