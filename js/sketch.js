// canvas size
const SIZE = 0.80; // size of the canvas in relation to the screen (0 to 1)

const LONDON_LAT = "51.5073219";
const LONDON_LNG = "-0.1276474";
const LISBON_LAT = "38.736946";
const LISBON_LNG = "-9.142685";
const dates = ["2022-08-06", "2022-09-06", "2022-10-06", "2022-11-06", "2022-12-06", "2023-01-06", "2023-02-06"];

let londonColor;
let lisbonColor;

let londonData = [];
let lisbonData = [];

let failedLoads = [];
let loaded = 0;

let maxTime, minTime;
let colWidthm, chartHeight, chartHeightStart;

function setup() {
  updateCanvas();

  londonColor = color("#973AA8");
  lisbonColor = color("#ee9b00");

  let londonURLs = getURLs(LONDON_LAT, LONDON_LNG);
  let lisbonURLs = getURLs(LISBON_LAT, LISBON_LNG);

  fetchData(londonURLs, 0, londonData);
  fetchData(lisbonURLs, 0, lisbonData);
}


function fetchData(urls, index, array)
{
  if(index < urls.length)
  {
    let path = urls[index]; 

    fetch(path).then(function(response) {
      
      return response.json();

    }).then(function(data) {

      array.push(data.results.sunset);
      fetchData(urls, index+1, array)

    }).catch(function(err) {
      console.log(`Something went wrong: ${err}`);
    
      let failed = urls.splice(index,1);
      console.log(`Something went wrong with: ${failed}`);
      failedLoads.push(failed);// keep track of what failed
      fetchData(urls, index, array); // we do not increase by 1 because we spliced the failed one out of our array
    });
  
  }
  else
  {
    loaded++;
    console.log(array);
  }
}

function getURLs(lat, lng)
{
  let url;
  let dataToFetch = [];
  for(date of dates){   
    url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${date}`
    dataToFetch.push(url);
  }
  return dataToFetch; 
}



function draw() {

  background(240)
  if(loaded === 2)
  {
    drawGraphBase()
    drawCityGraph(lisbonData, lisbonColor);
    drawCityGraph(londonData, londonColor);
  }
  else
  {
    // loading screen
    push();
    textAlign(CENTER);
    textSize(30);
    text("Loading...", width/2, height/2);
    pop();
  }
}

function drawCityGraph(data, color)
{ 
  let convertedTime = convertHoursToSeconds(data);

  push()
  //Map line to chart
  strokeWeight(2);
  stroke(color);
  noFill();

  //this is a shape so we need two loops for the temperature
  beginShape();
  // Display sunset time
  for (let i = 0; i < convertedTime.length; i++) {
    let convertedHour = convertedTime[i];
    
    let pX = map(i, 0, convertedTime.length, colWidth, width); //map range includes the space on either side
    let pY = map(convertedHour, maxTime, minTime, chartHeight, colWidth); //inverse mapping because our origin in p5 is in the top left

    
    vertex(pX, pY);
  }  
  endShape();
  pop();
  
  // display time on each point
  for (let i = 0; i < convertedTime.length; i++) {
    let convertedHour = convertedTime[i];
    let hour = data[i];

    let pX = map(i, 0, convertedTime.length, colWidth, width); //map range includes the space on either side
    let pY = map(convertedHour, maxTime, minTime, chartHeight, colWidth); //inverse mapping because our origin in p5 is in the top left

    if(i > 0 && width>490) 
      {
        push()
        textAlign(LEFT);
        rectMode(CORNER);
        textSize(8);
        noStroke();
        fill(90,220);
        rect(pX+5, pY-15, 55, 17);
        fill(230);
        text(hour, pX+12, pY-7); // not converted time
        pop()
      }  
  }  
}

function drawGraphBase() 
{
  push();
  textAlign(CENTER, BOTTOM);
  fill(0)
  textSize(16);
  text("Sunsets in London and Lisbon", width/2, height*0.05);
  pop();  
 
  // draw london subtitle
  push()
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  noStroke();
  fill(londonColor);
  rect(width/2-35, height*0.95, 20, 10)
  fill(0)
  textSize(10);
  text("London", width/2*1.025,height*0.95);

  // draw lisbon subtitle
  noStroke();
  fill(lisbonColor);
  rect(width/2-35, height*0.97, 20, 10)
  fill(0)
  textSize(10);
  text("Lisbon", width/2*1.025,height*0.97);
  pop();

  maxTime = 28800; // == 8:00:00 PM   
  minTime = 10800; //  == 3:00:00 PM

  colWidth = width/(dates.length+2); //add 2 so there is space either side of the chart
  chartHeight = height*0.8;
  chartHeightStart = (height-chartHeight)/2
  let timeStep = 3600; // 1 hour

  textAlign(CENTER, CENTER);
 
  // Display y axis labels
  for (let time = minTime; time <= maxTime; time += timeStep) 
  {
    push();
    let timeY = map(time, minTime, maxTime, chartHeightStart, chartHeight); 
    fill(0); 
    textSize(8);
    textAlign(RIGHT, BOTTOM); 
    translate(colWidth, timeY);
    line(0,0,10,0);
    text(convertSecondsToHour(time)+ " PM", -10, 2);
    pop();
  }  
  
  
  // Display date labels
  for (let i=0; i < dates.length; i++) {
    
    let dateX = map(i, 0, dates.length, colWidth, width); //map range includes the space on either side
    
    let date = new Date(dates[i]);
    let dateString = date.toDateString().split(" ");//splits on space
    dateString.shift(); //discards the day of the week
    dateString = dateString.join(" ");// uses javascript array join functionatlity
    push();
    textSize(8);
    fill(0); 
    textAlign(LEFT, TOP); 
    translate(dateX, chartHeight);
    line(0,0,0,-(chartHeight-chartHeightStart));
    rotate(45);
    text(dateString,10,0);
    pop();
  }

}

function convertHoursToSeconds(data)
{
  let convertedArray = [];
  for(time of data)
  {
    let onlyNumbers = time.split(" ")[0];
    let arrayOfTimes = onlyNumbers.split(":");
    let hours = int(arrayOfTimes[0]);
    let minutes = int(arrayOfTimes[1]);
    let seconds = int(arrayOfTimes[2]);
    convertedArray.push(hours*3600 + minutes*60 + seconds);
  }
  return convertedArray;
}

function convertSecondsToHour(number) { return number/3600; }

function updateCanvas() 
{
  cnv = createCanvas(windowWidth*SIZE, windowHeight*SIZE);
  cnv.parent("canvas-container");
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 5 * 2;
  cnv.position(x, y);

  p5Div = document.getElementById("canvas-container");
  p5Div.setAttribute("style",`width:${width}px; height:${height}px`)
}

function windowResized() { updateCanvas(); }