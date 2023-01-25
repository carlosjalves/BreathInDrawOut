// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js
=== */
p5.disableFriendlyErrors = true; // disables FES

let video;
let poseNet;
let poses = [];
let pose;
let prevX = [];
let prevY = [];
let prevX2 = [];
let prevY2 = [];

let t_pincel3;

// Follow the point variables

let curx1, cury1;
let curx2, cury2;
let vec, vec2, v, v2;
let speed = 20; //follow speed of brush, higher number is slower

let points = [];
let points2 = [];
let select1x, select1y;
let select2x, select2y;


// Initialize the Image Classifier method with DoodleNet.
let classifier;

// A variable to hold the canvas image we want to classify
let canvas;

// Two variable to hold the label and confidence of the result
let label;
let confidence;

// new P5.Speech object
let Voz = new p5.Speech();
let vozes;

let avalia = "";

let pg, img;

let xoff = -10000, yoff = 10000;

//-------------------- Sound -----------------

let sound;
let playbackRate;

//-------------------- others -----------------
let full = false;
let pinsel0 = false;
let pinsel1 = false;
let pinsel2 = false;
let rand0, rand1, rand2;


function preload() {
    // Load the DoodleNet Image Classification model
    classifier = ml5.imageClassifier('DoodleNet');

    soundFormats('mp3', 'ogg');
    sound = loadSound('data/Lung.mp3');
    sound.loop();
}

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    background(0);
    video = createCapture(VIDEO);
    video.size(windowWidth, windowHeight);
    strokeWeight(2);
    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video, {minConfidence: 0.5, flipHorizontal: true}, modelReady);
    // This sets up an event that fills the global variable "poses"
    // with an array every time new poses are detected
    poseNet.on("pose", function (results) {
        poses = results;
    });
    poseNet.on("pose", gotPoses);

    curx1 = 0;
    cury1 = 0;
    curx2 = 0;
    cury2 = 0;


    // Create 'label' and 'confidence' div to hold results
    label = createDiv('Label: ...');
    confidence = createDiv('Confidence: ...');

    label.style('color', 'white');
    confidence.style('color', 'white');
    label.position(50, 50);
    confidence.position(50, 70);

    pg = createGraphics(280, 280);
    select1x = width / 2;
    select1y = height / 2;
    select2x = 0;
    select2y = 0;

    //-------------------- Sound -----------------
    //sound.loop();
}

function mousePressed() {
    if (sound.isPlaying()) {
        sound.pause();
    } else sound.play();
}

function keyPressed() {
    full = !full;
    if (!fullscreen() && full) {
        fullscreen();
    } else !fullscreen();
}

function gotPoses(poses) {
    //console.log(poses);
    if (poses.length > 0) {
        for (let i = 0; i < poses.length; i += 1) {
            pose = poses[i].pose;
        }
    }
}

function modelReady() {
    select("#status").html("Model Loaded");
}

function draw() {
    fullscreen(full);
    push();
    translate(width, 0)
    scale(-1, 1);
    image(video, 0, 0, width, height);
    //filter(GRAY);
    pop();
    noStroke();
    fill(0, 240);
    rect(0, 0, width, height);
    drawLines2();
    if (frameCount % 250 === 0) {
        drawLinesPG();
        classifyCanvas();
    }
    push();
    tint(255, 185);
    image(pg, width - 280, 0, 280, 280);
    pop();

    //--------------------- Sound -------------
    if (points.length > 2) {
        if (points2.length > 2 && poses.length > 1 && poses[1].pose.score > 0.2) {
            let playbackRate = map((points[points.length - 1].y + points2[points2.length - 1].y) / 2, 0, height, 2, 0);
            playbackRate = constrain(playbackRate, 0.5, 3);
            sound.rate(playbackRate);
        } else {
            let playbackRate = map(points[points.length - 1].y, 0, height, 2, 0);
            playbackRate = constrain(playbackRate, 0.5, 3);
            sound.rate(playbackRate);
        }
    }
}


function drawLines() {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        const pose = poses[i].pose;
        if (pose.score > 0.20) {
            if (pose.nose.confidence >= 0.7) {

                if (curx1 === 0 && cury1 === 0) {
                    curx1 = pose.nose.x;
                    cury1 = pose.nose.y;
                }
                if (curx2 === 0 && cury2 === 0) {
                    curx2 = pose.nose.x;
                    cury2 = pose.nose.y;
                }

                if (poses.length === 1 || poses[1].pose.score < 0.2) {

                    vec = createVectorDirection(pose.nose.x, pose.nose.y, curx1, cury1);

                    // move the brush in the direction of the nose and apply a speed variable
                    moveCurrent1(curx1, cury1, pose.nose.x, pose.nose.y, vec, speed);
                    v = createVector(curx1, cury1);
                    points.push(v);
                    select1x = pose.nose.x;
                    select1y = pose.nose.y;
                } else {
                    if (dist(select1x, select1y, pose.nose.x, pose.nose.y) <
                        dist(select2x, select2y, pose.nose.x, pose.nose.y)) {
                        //find the vector between the nose and current brush position
                        vec = createVectorDirection(pose.nose.x, pose.nose.y, curx1, cury1);

                        // move the brush in the direction of the nose and apply a speed variable
                        moveCurrent1(curx1, cury1, pose.nose.x, pose.nose.y, vec, speed);
                        v = createVector(curx1, cury1);
                        points.push(v);
                        select1x = pose.nose.x;
                        select1y = pose.nose.y;
                    } else {
                        //find the vector between the right wrist and current brush position
                        vec2 = createVectorDirection(pose.nose.x, pose.nose.y, curx2, cury2);

                        // move the brush in the direction of the right wrist and apply a speed variable
                        moveCurrent2(curx2, cury2, pose.nose.x, pose.nose.y, vec2, speed);
                        v2 = createVector(curx2, cury2);
                        points2.push(v2);
                        select2x = pose.nose.x;
                        select2y = pose.nose.y;
                    }
                }
            }
        }
    }


// If no pose is detected
    if (poses.length === 0 && curx1 !== 0) {

        xoff = xoff + 0.02;
        yoff = yoff + 0.02;
        let randx = noise(xoff) * width;
        let randy = noise(yoff) * height;

        //find the vector between the right wrist and current brush position
        vec = createVectorDirection(randx, randy, curx1, cury1);

        // move the brush in the direction of the right wrist and apply a speed variable
        moveCurrent1(curx1, cury1, randx, randy, vec, speed);

        v = createVector(curx1, cury1);
        points.push(v);
    }

    for (let t = 0; t < points.length; t++) {

        line(points[t].x, points[t].y, prevX[t], prevY[t]);
        stroke('rgba(255,255,255,0.4)');
        line(points[t].x - 6, points[t].y + 4, prevX[t] - 6, prevY[t] + 4);
        line(points[t].x - 6, points[t].y - 4, prevX[t] - 6, prevY[t] - 4);
        stroke('rgba(255,255,255,0.2)');
        line(points[t].x - 4, points[t].y + 2, prevX[t] - 4, prevY[t] + 2);
        line(points[t].x - 4, points[t].y - 2, prevX[t] - 4, prevY[t] - 2);
        stroke('rgba(255,255,255,0.8)');
        line(points[t].x, points[t].y + 8, prevX[t], prevY[t] + 8);
        line(points[t].x, points[t].y - 8, prevX[t], prevY[t] - 8);
        stroke('rgba(255,255,255,0.4)');
        line(points[t].x - 2, points[t].y + 6, prevX[t] - 2, prevY[t] + 6);
        line(points[t].x - 2, points[t].y - 6, prevX[t] - 2, prevY[t] - 6);
        stroke('rgba(255,255,255,0.6)');
        line(points[t].x - 8, points[t].y + 10, prevX[t] - 8, prevY[t] + 10);
        line(points[t].x - 8, points[t].y - 10, prevX[t] - 8, prevY[t] - 10);

        if (t > 0) {
            prevX[t] = points[t - 1].x;
            prevY[t] = points[t - 1].y;
        } else {
            prevX[t] = points[t].x;
            prevY[t] = points[t].y;
        }

        if (points.length > 500) {
            points.splice(0, 1);
        }
    }


    for (let t = 0; t < points2.length; t++) {

        line(points2[t].x, points2[t].y, prevX2[t], prevY2[t]);
        stroke('rgba(255,255,255,0.4)');
        line(points2[t].x - 6, points2[t].y + 4, prevX2[t] - 6, prevY2[t] + 4);
        line(points2[t].x - 6, points2[t].y - 4, prevX2[t] - 6, prevY2[t] - 4);
        stroke('rgba(255,255,255,0.2)');
        line(points2[t].x - 4, points2[t].y + 2, prevX2[t] - 4, prevY2[t] + 2);
        line(points2[t].x - 4, points2[t].y - 2, prevX2[t] - 4, prevY2[t] - 2);
        stroke('rgba(255,255,255,0.8)');
        line(points2[t].x, points2[t].y + 8, prevX2[t], prevY2[t] + 8);
        line(points2[t].x, points2[t].y - 8, prevX2[t], prevY2[t] - 8);
        stroke('rgba(255,255,255,0.4)');
        line(points2[t].x - 2, points2[t].y + 6, prevX2[t] - 2, prevY2[t] + 6);
        line(points2[t].x - 2, points2[t].y - 6, prevX2[t] - 2, prevY2[t] - 6);
        stroke('rgba(255,255,255,0.6)');
        line(points2[t].x - 8, points2[t].y + 10, prevX2[t] - 8, prevY2[t] + 10);
        line(points2[t].x - 8, points2[t].y - 10, prevX2[t] - 8, prevY2[t] - 10);

        if (t > 0) {
            prevX2[t] = points2[t - 1].x;
            prevY2[t] = points2[t - 1].y;
        } else {
            prevX2[t] = points2[t].x;
            prevY2[t] = points2[t].y;
        }

        if (points2.length > 500) {
            points2.splice(0, 1);
        }
    }
    if (poses.length <= 1) {
        points2.splice(0, 1);
    }
}

function drawLines2() {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        const pose = poses[i].pose;
        if (pose.score > 0.20) {
            if (pose.nose.confidence >= 0.7) {

                if (curx1 === 0 && cury1 === 0) {
                    curx1 = pose.nose.x;
                    cury1 = pose.nose.y;
                }
                if (curx2 === 0 && cury2 === 0) {
                    curx2 = pose.nose.x;
                    cury2 = pose.nose.y;
                }

                if (poses.length === 1 || poses[1].pose.score < 0.2) {

                    vec = createVectorDirection(pose.nose.x, pose.nose.y, curx1, cury1);

                    // move the brush in the direction of the nose and apply a speed variable
                    moveCurrent1(curx1, cury1, pose.nose.x, pose.nose.y, vec, speed);
                    v = createVector(curx1, cury1);
                    points.push(v);
                    select1x = pose.nose.x;
                    select1y = pose.nose.y;
                } else {
                    if (dist(select1x, select1y, pose.nose.x, pose.nose.y) <
                        dist(select2x, select2y, pose.nose.x, pose.nose.y)) {
                        //find the vector between the nose and current brush position
                        vec = createVectorDirection(pose.nose.x, pose.nose.y, curx1, cury1);

                        // move the brush in the direction of the nose and apply a speed variable
                        moveCurrent1(curx1, cury1, pose.nose.x, pose.nose.y, vec, speed);
                        v = createVector(curx1, cury1);
                        points.push(v);
                        select1x = pose.nose.x;
                        select1y = pose.nose.y;
                    } else {
                        //find the vector between the right wrist and current brush position
                        vec2 = createVectorDirection(pose.nose.x, pose.nose.y, curx2, cury2);

                        // move the brush in the direction of the right wrist and apply a speed variable
                        moveCurrent2(curx2, cury2, pose.nose.x, pose.nose.y, vec2, speed);
                        v2 = createVector(curx2, cury2);
                        points2.push(v2);
                        select2x = pose.nose.x;
                        select2y = pose.nose.y;
                    }
                }
            }
        }
    }


    //------------------ calculo pincel random ------------
    if (poses.length === 0 && pinsel0 === false) {
        rand0 = getRandomInt(0, 4);
        pinsel0 = true;
        pinsel1 = false;
        pinsel2 = false;
    }

    if (poses.length === 1 && pinsel1 === false) {
        rand1 = getRandomInt(0, 4);
        pinsel1 = true;
        pinsel0 = false;

    }

    if (poses.length === 2 && pinsel2 === false) {
        rand2 = getRandomInt(0, 4);
        pinsel2 = true;
    }
    /*
    console.log(rand0);
    console.log(rand1);
    console.log(rand2);
*/
    // If no pose is detected
    if (poses.length === 0 && curx1 !== 0) {

        xoff = xoff + 0.02;
        yoff = yoff + 0.02;
        let randx = noise(xoff) * width;
        let randy = noise(yoff) * height;

        //find the vector between the right wrist and current brush position
        vec = createVectorDirection(randx, randy, curx1, cury1);

        // move the brush in the direction of the right wrist and apply a speed variable
        moveCurrent1(curx1, cury1, randx, randy, vec, speed);

        v = createVector(curx1, cury1);
        points.push(v);
    }

    for (let t = 0; t < points.length; t++) {

       /*stroke('rgba(255,255,255,0.4)');
        line(points[t].x, points[t].y, prevX[t], prevY[t]);*/

        if (pinsel0 && rand0 === 0 || pinsel1 && rand1 === 0 || pinsel2 && rand2 === 0) {

            stroke('rgba(255,255,255,0.4)');
            line(points[t].x - 6, points[t].y + 4, prevX[t] - 6, prevY[t] + 4);
            line(points[t].x - 6, points[t].y - 4, prevX[t] - 6, prevY[t] - 4);
            stroke('rgba(255,255,255,0.2)');
            line(points[t].x - 4, points[t].y + 2, prevX[t] - 4, prevY[t] + 2);
            line(points[t].x - 4, points[t].y - 2, prevX[t] - 4, prevY[t] - 2);
            stroke('rgba(255,255,255,0.8)');
            line(points[t].x, points[t].y + 8, prevX[t], prevY[t] + 8);
            line(points[t].x, points[t].y - 8, prevX[t], prevY[t] - 8);
            stroke('rgba(255,255,255,0.4)');
            line(points[t].x - 2, points[t].y + 6, prevX[t] - 2, prevY[t] + 6);
            line(points[t].x - 2, points[t].y - 6, prevX[t] - 2, prevY[t] - 6);
            stroke('rgba(255,255,255,0.6)');
            line(points[t].x - 8, points[t].y + 10, prevX[t] - 8, prevY[t] + 10);
            line(points[t].x - 8, points[t].y - 10, prevX[t] - 8, prevY[t] - 10);
        }
        if (pinsel0 && rand0 === 1 || pinsel1 && rand1 === 1 || pinsel2 && rand2 === 1) {

            for (let j = 0; j < 5; j++) {
                stroke('rgba(255,255,255,0.5)');
                line(points[t].x - 4 * j, points[t].y + 2 * j, prevX[t] - 4 * j, prevY[t] + 2 * j);
                line(points[t].x - 4 * j, points[t].y - 2 * j, prevX[t] - 4 * j, prevY[t] - 2 * j);
            }
        }
        if (pinsel0 && rand0 === 2 || pinsel1 && rand1 === 2 || pinsel2 && rand2 === 2) {

            let ang = 0;
            for (let j = 0; j < 5; j++) {
                stroke('rgba(255,255,255,0.5)');
                line(points[t].x - ang * j, points[t].y + ang * j, prevX[t] - ang * j, prevY[t] + ang * j);
                line(points[t].x + ang * j, points[t].y - ang * j, prevX[t] + ang * j, prevY[t] - ang * j);
                ang += 0.5;
            }
        }
        if (pinsel0 && rand0 === 3 || pinsel1 && rand1 === 3 || pinsel2 && rand2 === 3) {
            fill('rgba(255,255,255,0.4)');
            t_pincel3=map(t,0,points.length,50,15);
            ellipse(points[t].x, points[t].y, t_pincel3/2, t_pincel3/2);
        }

        if (t > 0) {
            prevX[t] = points[t - 1].x;
            prevY[t] = points[t - 1].y;
        } else {
            prevX[t] = points[t].x;
            prevY[t] = points[t].y;
        }

        if (points.length > 500) {
            points.splice(0, 1);
        }
    }


    for (let t = 0; t < points2.length; t++) {

        line(points2[t].x, points2[t].y, prevX2[t], prevY2[t]);
        if (pinsel0 && rand0 === 0 || pinsel1 && rand1 === 0 || pinsel2 && rand2 === 0) {
            stroke('rgba(255,255,255,0.4)');
            line(points2[t].x - 6, points2[t].y + 4, prevX2[t] - 6, prevY2[t] + 4);
            line(points2[t].x - 6, points2[t].y - 4, prevX2[t] - 6, prevY2[t] - 4);
            stroke('rgba(255,255,255,0.2)');
            line(points2[t].x - 4, points2[t].y + 2, prevX2[t] - 4, prevY2[t] + 2);
            line(points2[t].x - 4, points2[t].y - 2, prevX2[t] - 4, prevY2[t] - 2);
            stroke('rgba(255,255,255,0.8)');
            line(points2[t].x, points2[t].y + 8, prevX2[t], prevY2[t] + 8);
            line(points2[t].x, points2[t].y - 8, prevX2[t], prevY2[t] - 8);
            stroke('rgba(255,255,255,0.4)');
            line(points2[t].x - 2, points2[t].y + 6, prevX2[t] - 2, prevY2[t] + 6);
            line(points2[t].x - 2, points2[t].y - 6, prevX2[t] - 2, prevY2[t] - 6);
            stroke('rgba(255,255,255,0.6)');
            line(points2[t].x - 8, points2[t].y + 10, prevX2[t] - 8, prevY2[t] + 10);
            line(points2[t].x - 8, points2[t].y - 10, prevX2[t] - 8, prevY2[t] - 10);
        } else if (pinsel0 && rand0 === 1 || pinsel1 && rand1 === 1 || pinsel2 && rand2 === 1) {

            for (let j = 0; j < 5; j++) {
                stroke('rgba(255,255,255,0.5)');
                line(points2[t].x - 4 * j, points2[t].y + 2 * j, prevX2[t] - 4 * j, prevY2[t] + 2 * j);
                line(points2[t].x - 4 * j, points2[t].y - 2 * j, prevX2[t] - 4 * j, prevY2[t] - 2 * j);
            }
        } else if (pinsel0 && rand0 === 2 || pinsel1 && rand1 === 2 || pinsel2 && rand2 === 2) {

            let ang = 0;
            for (let j = 0; j < 5; j++) {
                stroke('rgba(255,255,255,0.5)');
                line(points2[t].x - ang * j, points2[t].y + ang * j, prevX2[t] - ang * j, prevY2[t] + ang * j);
                line(points2[t].x + ang * j, points2[t].y - ang * j, prevX2[t] + ang * j, prevY2[t] - ang * j);
                ang += 0.5;
            }
        } else if (pinsel0 && rand0 === 3 || pinsel1 && rand1 === 3 || pinsel2 && rand2 === 3) {
            fill('rgba(255,255,255,0.4)');
            t_pincel3=map(t,0,points2.length,50,15);
            ellipse(points2[t].x, points2[t].y, t_pincel3/2, t_pincel3/2);
        }


        if (t > 0) {
            prevX2[t] = points2[t - 1].x;
            prevY2[t] = points2[t - 1].y;
        } else {
            prevX2[t] = points2[t].x;
            prevY2[t] = points2[t].y;
        }

        if (points2.length > 500) {
            points2.splice(0, 1);
        }
    }
    if (poses.length <= 1) {
        points2.splice(0, 1);
    }
}

function drawLinesPG() {
    pg.background(255);
    pg.stroke(0);
    pg.strokeWeight(15);

    for (let i = 0; i < points.length; i++) {

        let x1 = map(points[i].x, 0, width, 0, 280);
        let y1 = map(points[i].y, 0, height, 0, 280);
        let x2 = map(prevX[i], 0, width, 0, 280);
        let y2 = map(prevY[i], 0, height, 0, 280);

        pg.line(x1, y1, x2, y2);

        if (i > 0) {
            prevX[i] = points[i - 1].x;
            prevY[i] = points[i - 1].y;
        } else {
            prevX[i] = points[i].x;
            prevY[i] = points[i].y;
        }
    }
    for (let i = 0; i < points2.length; i++) {

        let x1 = map(points2[i].x, 0, width, 0, 280);
        let y1 = map(points2[i].y, 0, height, 0, 280);
        let x2 = map(prevX2[i], 0, width, 0, 280);
        let y2 = map(prevY2[i], 0, height, 0, 280);

        pg.line(x1, y1, x2, y2);

        if (i > 0) {
            prevX2[i] = points2[i - 1].x;
            prevY2[i] = points2[i - 1].y;
        } else {
            prevX2[i] = points2[i].x;
            prevY2[i] = points2[i].y;
        }
    }
}

// follow the point
function createVectorDirection(mx, my, cx, cy) {
    let v;

    if (cx >= mx && cy >= my) {
        v = createVector((cx - mx), (cy - my));
    } else if (cx >= mx && cy < my) {
        v = createVector((cx - mx), (my - cy));
    } else if (cx < mx && cy >= my) {
        v = createVector((mx - cx), (cy - my));
    } else if (cx < mx && cy < my) {
        v = createVector((mx - cx), (my - cy));
    }
    return v;
}

function moveCurrent1(cx, cy, mx, my, v, s) {
    if (cx >= mx && cy >= my) {
        curx1 = cx - (v.x * 1 / s);
        cury1 = cy - (v.y * 1 / s);
    } else if (cx >= mx && cy < my) {
        curx1 = cx - (v.x * 1 / s);
        cury1 = cy + (v.y * 1 / s);
    } else if (cx < mx && cy >= my) {
        curx1 = cx + (v.x * 1 / s);
        cury1 = cy - (v.y * 1 / s);
    } else if (cx < mx && cy < my) {
        curx1 = cx + (v.x * 1 / s);
        cury1 = cy + (v.y * 1 / s);
    }
}

function moveCurrent2(cx, cy, mx, my, v, s) {
    if (cx >= mx && cy >= my) {
        curx2 = cx - (v.x * 1 / s);
        cury2 = cy - (v.y * 1 / s);
    } else if (cx >= mx && cy < my) {
        curx2 = cx - (v.x * 1 / s);
        cury2 = cy + (v.y * 1 / s);
    } else if (cx < mx && cy >= my) {
        curx2 = cx + (v.x * 1 / s);
        cury2 = cy - (v.y * 1 / s);
    } else if (cx < mx && cy < my) {
        curx2 = cx + (v.x * 1 / s);
        cury2 = cy + (v.y * 1 / s);
    }
}


function classifyCanvas() {
    classifier.classify(pg, gotResult);
}

// A function to run when we get any errors and the results
function gotResult(error, results) {
    // Display error in the console
    if (error) {
        //console.error(error);
    }
    // The results are in an array ordered by confidence.
    //console.log(results);
    // Show the first label and confidence
    avalia = results[0].label;
    label.html('Label: ' + results[0].label);
    confidence.html('Confidence: ' + nf(results[0].confidence, 0, 2) * 100 + '%'); // Round the confidence to 0.01
    Speak(avalia, map(results[0].confidence, 0, 0.6, 0.6, 1));
}

//Voz
function Speak(h, c) {
    vozes = [1, 8, 11, 17, 26, 32, 33, 37, 40];
    Voz.setVoice(vozes[Math.floor(random(vozes.length))]);
    Voz.setPitch(Math.random() * (1.4 - 0.6) + 0.6);
    Voz.setRate(c);
    Voz.speak(h);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    video.size(windowWidth, windowHeight);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}