class HTTP {
    async get(url) {
        const response = await fetch(url);
        const resData = await response.json();
        return resData;
    }

    async update(url) {
        const response = await fetch(url);
        return response;
    }
}

//---------------------------------------------
// CHART VARIABLES
//---------------------------------------------
const valueFontSize = '1.5rem'
      textFontSize = '.8rem',
      signFontSize = '1.5rem',
      signpadding = '.5rem',
      colorValues = '##FAFAFA',
      colorXAxisDiv = '##FAFAFA',
      xAxisTickFontSize = '0px',
      yAxisTickFontSize = '0px',
      xAxisTickFontFill = 'black',
      yAxisTickFontFill = 'black',
      xAxisTickLineStroke = 'transparent',
      yAxisTickLineStroke = 'transparent',
      xAxisTickDensity = 80,
      yAxisTickDensity = 80,
      xAxisDomainLineStroke = '#7A7890',
      yAxisDomainLineStroke = 'transparent',
      tooltipFontSize = '12px';

const bisectDate = d3.bisector(function(d) { return d.date; }).left,
      formatTime = d3.timeFormat('%b %d, %y');

//---------------------------------------------
// API CALLS
//---------------------------------------------
function fetchData() {
    http.get(`http://${path}/getindexdata/${user}/`)
    .then(response => {
        const database = parseData(response);
        persistData(database);
        render(database[inputIndex]);
        computeChange(database[inputIndex]);    
    })
    .catch(err => console.log(err));
}

function seeLikes() {
    http.get(`http://${path}/seelikes/${user}/`)
    .then(data => likes.innerHTML = data)
    .catch(err => console.log(err));
};

function giveLikes() {
    let num = Number(likes.textContent);
    num += 1;
    likes.innerHTML = num;

    http.update(`http://${path}/givelikes/${user}/`)
    .then(console.log(`+1 Like`))
    .catch(err => console.log(err));
};

//---------------------------------------------
// FUNCTIONS: CHART
//---------------------------------------------
function render(data) {
    let outerWidth = setChartOuterWidth();
    let outerHeight = 291;

    const margin = { left: 1, top: 0, right: 0, bottom: 1 },
          innerWidth = outerWidth - margin.left - margin.right,
          innerHeight = outerHeight - margin.top - margin.bottom;

    const pastDate = formatTime(data[0]['date']),
          presentDate = formatTime(data[data.length - 1]['date']),
          presentValue = data[data.length - 1]['value'];

    let divContainer = d3.select('#values').selectAll('div').data([null]);
    divContainer = divContainer
        .enter().append('div')
            .attr('class', 'values')
            .style('color', colorValues)
        .merge(divContainer);

    let divPast = divContainer.selectAll('.past').data([null]);
    divPast = divPast
        .enter().append('div')
            .attr('class', 'past')
        .merge(divPast);

    let textPast = divPast.selectAll('text').data([null]);
    textPast = textPast
        .enter().append('text')
            .style('font-size', valueFontSize)
        .merge(textPast)
            .text('$100.00');

    let datePast = divPast.selectAll('span').data([null]);
    datePast = datePast
        .enter().append('span')
            .style('font-size', textFontSize)
        .merge(datePast)
            .text(`on ${pastDate}`);

    let textSign = divContainer.selectAll('.sign').data([null]);
    textSign = textSign
        .enter().append('text')
            .attr('class', 'sign')
            .style('font-size', signFontSize)
            .style('padding', signpadding)
        .merge(textSign)
            .text('=');

    let divPresent = divContainer.selectAll('.present').data([null]);
    divPresent = divPresent
        .enter().append('div')
            .attr('class', 'present')
        .merge(divPresent);

    let textPresent = divPresent.selectAll('text').data([null]);
    textPresent = textPresent
        .enter().append('text')
            .style('font-size', valueFontSize)
        .merge(textPresent)
            .text(`$${presentValue}`);

    let datePresent = divPresent.selectAll('span').data([null]);
    datePresent = datePresent
        .enter().append('span')
            .style('font-size', textFontSize)
        .merge(datePresent)
            .text(`on ${presentDate}`);

    let svg = d3.select('#chart').selectAll('svg').data([null]);
    svg = svg
        .enter().append('svg')
        .merge(svg)
            .attr('width', outerWidth)
            .attr('height', outerHeight);

    let g = svg.selectAll('g').data([null]);
    g = g
        .enter().append('g')
            .attr('class', 'group')
        .merge(g)
          .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scale
    let x = d3.scaleTime().range([0, innerWidth]);
    let y = d3.scaleLinear().range([innerHeight, 0]);
    // Domain
    let minValue = d3.min(data, function(d) { return d.value });
    let maxValue = d3.max(data, function(d) { return d.value });

    x.domain(d3.extent(data, function(d) { return d.date }));
    // y.domain([0, parseInt(maxValue + maxValue * 0.05)]);
    y.domain([parseInt(minValue - minValue * 0.15), parseInt(maxValue + maxValue * 0.15)]);
    // x.domain(d3.extent(data, function(d) { return d.date }));
    // y.domain(d3.extent(data, function(d) { return d.value }));

    // Line
    let line = d3.line()
    .x(function(d) { return x(d.date)})
    .y(function(d) { return y(d.value)})
    .curve(d3.curveCardinal);
    
    let path = g.selectAll('path').data([null]);
    path = path
        .enter().append('path')
            .attr('class', 'line-chart')
        .merge(path)
            .attr('d', line(data));

    let element = document.querySelector('.line-chart');
    let length = element.getTotalLength();
        
    path
        .attr('stroke-dasharray', length + ' ' + length)
        .attr('stroke-dashoffset', length)
        .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', 0);

    // Axis
    let xAxis = d3.axisBottom(x)
        .ticks(2)
        .tickFormat(d3.timeFormat('%b %d'));
        // .ticks(xRange);
        // .ticks(innerWidth / xAxisTickDensity);
    let xAxisG = g.selectAll('.x-axis').data([null]); 
    xAxisG = xAxisG
        .enter().append('g')
            .attr('class', 'x-axis')
        .merge(xAxisG)
            .attr('transform', `translate(0,${innerHeight})`);
    xAxisG.call(xAxis);

    xAxisG
        .selectAll('.tick text')
            .style('font-size', xAxisTickFontSize)
            .attr('fill', xAxisTickFontFill);
    xAxisG
        .selectAll('.tick line')
            .attr('stroke', xAxisTickLineStroke);
    xAxisG
        .select('.domain')
            .attr('stroke', xAxisDomainLineStroke);

    let yAxis = d3.axisLeft(y)
        .ticks(innerHeight / yAxisTickDensity);
    let yAxisG = g.selectAll('.y-axis').data([null]); 
    yAxisG = yAxisG
        .enter().append('g')
            .attr('class', 'y-axis')
        .merge(yAxisG);
    yAxisG.call(yAxis);

    yAxisG
    .selectAll('.tick text')
        .style('font-size', yAxisTickFontSize)
        .attr('fill', yAxisTickFontFill);
    yAxisG
        .selectAll('.tick line')
            .attr('stroke', yAxisTickLineStroke);
    yAxisG
        .select('.domain')
            .attr('stroke', yAxisDomainLineStroke);


    // Tooltip
    let focus = g.selectAll('.focus').data([null]);
    focus = focus
        .enter().append('g')
            .attr('class', 'focus')
        .merge(focus)
            .style('display', 'none');
    
    focus.append('line')
        .attr('class', 'x-hover-line hover-line')
        // .attr('y1', 0)
        .attr('y1', -300)
        .attr('y2', innerHeight);
    
    focus.append('circle')
        .attr('r', 5);

    focus.append('text')
        .attr('class', 'tooltip')
        .attr('x', 10)
        .attr('y', 3)
        // .attr('dy', '5px')
        .style('font-size', textFontSize);

    // Rect for mouse movements
    let rect = svg.selectAll('rect').data([null]);
    rect = rect
        .enter().append('rect')
            .attr('class', 'overlay')
        .merge(rect)
            .attr('width', innerWidth)
            .attr('height', innerHeight)
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
            .on('mouseover', function() { focus.style('display', null); })
            .on('mouseout', function() { focus.style('display', 'none'); })
            .on('mousemove', mousemove);

    let xAxisDiv = d3.select('#xAxis').selectAll('div').data([null]);
    xAxisDiv = xAxisDiv
        .enter().append('div')
            .attr('class', 'xAxis-div')
        .merge(xAxisDiv);

    let begin = xAxisDiv.selectAll('.begin').data([null]);
    begin = begin
        .enter().append('text')
            .attr('class', 'begin')
            .style('font-size', textFontSize)
            .style('fill', colorXAxisDiv)
        .merge(begin)
            .text(`${pastDate}`);

    let end = xAxisDiv.selectAll('.end').data([null]);
    end = end
        .enter().append('text')
            .attr('class', 'end')
            .style('font-size', textFontSize)
            .style('fill', 'red')
        .merge(end)
            .text(`${presentDate}`);

    function mousemove() {
        let x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        focus.attr('transform',  `translate(${x(d.date)}, ${y(d.value)})`);
        focus.select('text').text(function() { return formatTime(d.date); });
        focus.select('.x-hover-line').attr('y2', innerHeight - y(d.value));

        divPresent.select('text').text(function() { return `$${d.value}`; });
        divPresent.select('span').text(function() { return `on ${formatTime(d.date)}`; });
    }
}

function setChartOuterWidth() {
    let outerWidth;
    if(document.body.clientWidth < 1150) {
        outerWidth = indexDetails.clientWidth;
    } else {
        outerWidth = 465;
    }
    return outerWidth;
}

//---------------------------------------------
// FUNCTIONS: HTML
//---------------------------------------------
function getInputIndex(input) {
    if(input === '1w') {
        inputIndex = 0;
    } else if(input === '1m') {
        inputIndex = 1;
    } else if(input === '3m') {
        inputIndex = 2;
    } else if(input === 'ind') {
        inputIndex = 3;
    }
    return inputIndex;
}

function computeChange(data) {
    let changeValue;
    changeValue = parseFloat((data[data.length - 1].value / 100 - 1) * 100).toFixed(1);

    if(changeValue >= 0) {
        change.style.color = "#009900";
        
    } else {
        change.style.color = "#b30000";
    }
    change.innerHTML = `${changeValue}%`;
}

function updateInput(e) {
    for(let i = 0; i < buttonsArray.length; i++) {
        buttonsArray[i].classList.remove('current');
    }

    if(e.target.classList.contains('button')) {
        e.target.classList.add('current');
    }

    current = document.querySelector('.current');
    input = current.value;
    inputIndex = getInputIndex(input);
    readData();
}

//---------------------------------------------
// FUNCTIONS: APPLICATIONS
//---------------------------------------------
function storageAvailable(type) {
    try {
        const storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}

function persistData(data) {
    if (storageAvailable('sessionStorage')) {
        sessionStorage.setItem('database', JSON.stringify(data));
    } else {
        alert('Session storage is not available..');
    }
}

function parseData(data) {
    const database = [];
    data.forEach(el => {
        const array = [];
        for(let i = 0; i < el.length; i++) {
            array.push({
                date: new Date(el[i]['date']),
                value: Number(el[i]['value'])
            });
        }
        database.push(array);
    });
    return database;
}

function readData() {
    if(sessionStorage.getItem('database')){
        const data = JSON.parse(sessionStorage.getItem('database'));
        const database = parseData(data);

        render(database[inputIndex]);
        computeChange(database[inputIndex]);
    } else {
        fetchData();
    }
}

function refreshData() {
    if(sessionStorage.getItem('database')){
        sessionStorage.removeItem('database');
        fetchData();
        console.log('refresh!');
    } else {
        fetchData();
        console.log('refresh!');
    }
}

//---------------------------------------------
// FUNCTIONS: MEDIA
//---------------------------------------------
function popUp(url, title, w, h) {
    let dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    let dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
 
    let width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    let height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
 
    let left = ((width / 2) - (w / 2)) + dualScreenLeft;
    let top = ((height / 2) - (h / 2)) + dualScreenTop;
    let newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
 
    if (window.focus) {
        newWindow.focus();
    }
}

function getURL() {
    return `https://twitter.com/intent/tweet?text?=${document.title}&url=${document.location};`
}

function share() {
    const url = getURL();
    popUp(url, 'Share to twitter', '590', '253');
}

//---------------------------------------------
// FUNCTIONS: INIT
//---------------------------------------------
function load() {
    console.log('load event detected!');
    // fetchData();
    seeLikes();
    readData();
}