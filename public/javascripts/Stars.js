"use strict";

let  gl;  

let  attributeCoords;  
let  bufferCoords;    

let  uniformModelTransform;
let  modelTransform;
let colorLocation;

let stars = [];

const SPEED = 0.02;
const R_SPEED = 3;
const MIN_SIZE = 0.05;
const MAX_SIZE = 0.2;

let perClick = 1;
let pause = false;

//Initialize the program
function init() {

	//Get graphics context
    let canvas = document.getElementById( "gl-canvas" );
	let  options = {  
		alpha: false,
		depth: false
	};

	gl = canvas.getContext("webgl2", options);
    if ( !gl ) { alert( "WebGL 2.0 isn't available" ); }

	//Load shaders
	let program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );

    //setup locations
	attributeCoords = gl.getAttribLocation(program, "a_coords");
    uniformModelTransform = gl.getUniformLocation(program, "u_transform");
    colorLocation = gl.getUniformLocation(program, "color");

    // create coordinates of a star
    let  t;
    let starCoords = [];
    for(let i = 0; i <= 10; i++){
        t = (2 * Math.PI * i)/10;
        if (i%2)
            starCoords[i] = [Math.cos(t), Math.sin(t)];
        else 
            starCoords[i] = [Math.cos(t)/2, Math.sin(t)/2];
    }

    canvas.addEventListener("click", function(event){
        for (let t = 0; t < perClick; t++){
            // convert coordinates
            let rect = event.target.getBoundingClientRect();
            let x = -1+(2*(event.clientX-rect.left)/canvas.width);
            let y = -1+2*((canvas.height-(event.clientY-rect.top))/canvas.height);

            // create star and add to stars array
            let size = ((Math.random()*MAX_SIZE*100)+MIN_SIZE*100)/100;
            const star = {
                modelTransform: mult(translate(x,y,0.0), 
                            mult(scalem(size, size, 0),mat4())),
                color:     [Math.random(), Math.random(), Math.random()],
                coords:    starCoords,
                direction: Math.random()*2*Math.PI,
                centroid:  function() {return getCentroid(star.coords)}
            }
            stars.push(star); 
        } 
    });

    // set up buffer
    bufferCoords = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
    gl.vertexAttribPointer(attributeCoords, 2, gl.FLOAT, false, 0, 0); 
    gl.enableVertexAttribArray(attributeCoords); 

    //set up screen
    gl.viewport(0, 0, window.innerWidth, window.innerHeight); 
    gl.clearColor(0,0,0,1); 

    gl.canvas.width  = window.innerWidth;
    gl.canvas.height = window.innerHeight;

    draw();
}

// Draws the contents of the canvas
 function draw() {  

    for (let i = 0; i < stars.length; i++){
        gl.bufferData(gl.ARRAY_BUFFER, flatten(stars[i].coords), gl.STREAM_DRAW);
        gl.uniformMatrix4fv(uniformModelTransform,false,flatten(stars[i].modelTransform));
        gl.uniform3fv(colorLocation, stars[i].color);

        if (!pause){
            // Rotate around centroid
            let p = mult(stars[i].modelTransform,stars[i].centroid());
            stars[i].modelTransform = mult(translate(-p[0],-p[1],0.0,0.0),stars[i].modelTransform);
            stars[i].modelTransform = mult(rotateZ(R_SPEED),stars[i].modelTransform);
            stars[i].modelTransform = mult(translate(p[0],p[1],0.0,0.0),stars[i].modelTransform);

            // Change directions if off canvas
            if (p[0] > 1)  stars[i].direction = Math.random()*Math.PI + Math.PI/2;
            if (p[0] < -1) stars[i].direction = Math.random()*Math.PI - Math.PI/2;
            if (p[1] > 1)  stars[i].direction = Math.random()*Math.PI + Math.PI;
            if (p[1] < -1) stars[i].direction = Math.random()*Math.PI;

            // Translate
            stars[i].modelTransform = mult(translate(Math.cos(stars[i].direction)*SPEED,
                                                     Math.sin(stars[i].direction)*SPEED,0.0),
                                                     stars[i].modelTransform);
        }
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 11);
    }
    requestAnimationFrame(draw);
}

function getCentroid(coords){
    let start=0, numPoints=coords.length;
    let xCentroid = 0.0, yCentroid=0.0;
    for (let i=start; i<numPoints; i++){
        xCentroid += coords[i][0];
        yCentroid += coords[i][1]; 
    }
    return vec4(xCentroid/numPoints, yCentroid/numPoints, 0.0,1.0);
}

function pauseButton(){pause = !pause;};
function morePerClick(){perClick++;};    
