let gl;

let g_matrixStack = []; // Stack for storing a matrix
let modelViewMatrix = mat4();	// model-view matrix
let projectionMatrix;		// Projection matrix
let modelViewMatrixLoc, projectionMatrixLoc;
let outlineMode;
let numVertices = 24; //(6 faces)(4 vertices for triangle-fan comprising each fan)

let points = [];		// Coordinates geneated for all cubie faces
let colors = [];		// Associated colors

let myCube = new Rubik3x3();	// Rubik cube "object" with operations as documented in
// rubik-helper.js

// Starting coordinates (that is, before transformations) for each
// cubie
let vertices = [
	vec4(-0.5, -0.5, 0.5, 1.0),  // vertex 0
	vec4(-0.5, 0.5, 0.5, 1.0),  // 1
	vec4(0.5, 0.5, 0.5, 1.0),  // 2
	vec4(0.5, -0.5, 0.5, 1.0),  // 3
	vec4(-0.5, -0.5, -0.5, 1.0),  // 4
	vec4(-0.5, 0.5, -0.5, 1.0),  // 5
	vec4(0.5, 0.5, -0.5, 1.0),  // 6
	vec4(0.5, -0.5, -0.5, 1.0)   // 7
];

// RGBA colors for cubies
let vertexColors = [
	vec4(0.5, 0.5, 0.5, 1.0),   // 0  hidden (gray)                     
	vec4(1.0, 0.0, 0.0, 1.0),   // 1  red           RIGHT face  (x+)  
	vec4(1.0, 0.35, 0.0, 1.0),  // 2  orange        LEFT face   (x-)
	vec4(0.0, 0.0, 1.0, 1.0),   // 3  blue          UP face     (y+)
	vec4(0.0, 1.0, 0.0, 1.0),   // 4  green         DOWN face   (y-)
	vec4(1.0, 1.0, 1.0, 1.0),   // 5  white         FRONT face  (z+)
	vec4(1.0, 1.0, 0.0, 1.0)    // 6  yellow        BACK face   (z-)  
];

let trans = [ 			// Translation from origin for each cubie
	[-1.0, 1.0, 1.0],
	[0.0, 1.0, 1.0],
	[1.0, 1.0, 1.0],
	[-1.0, 0.0, 1.0],
	[0.0, 0.0, 1.0],
	[1.0, 0.0, 1.0],
	[-1.0, -1.0, 1.0],
	[0.0, -1.0, 1.0],
	[1.0, -1.0, 1.0],

	[-1.0, 1.0, 0.0],
	[0.0, 1.0, 0.0],
	[1.0, 1.0, 0.0],
	[-1.0, 0.0, 0.0],
	[1.0, 0.0, 0.0],
	[-1.0, -1.0, 0.0],
	[0.0, -1.0, 0.0],
	[1.0, -1.0, 0.0],

	[-1.0, 1.0, -1.0],
	[0.0, 1.0, -1.0],
	[1.0, 1.0, -1.0],
	[-1.0, 0.0, -1.0],
	[0.0, 0.0, -1.0],
	[1.0, 0.0, -1.0],
	[-1.0, -1.0, -1.0],
	[0.0, -1.0, -1.0],
	[1.0, -1.0, -1.0]
];

let accum_rotation = [
	mat4(), mat4(), mat4(), mat4(), mat4(), mat4(), mat4(), mat4(),
	mat4(), mat4(), mat4(), mat4(), mat4(), mat4(), mat4(), mat4(),
	mat4(), mat4(), mat4(), mat4(), mat4(), mat4(), mat4(), mat4(),
	mat4(), mat4(),
];

let viewer = [7.0, 3.0, 7.0]; // initial viewer location 

function init() {
	//Get graphics context
	let canvas = document.getElementById("gl-canvas");
	let options = {  // no need for alpha channel or depth buffer in this program
		alpha: false,
		depth: true
	};

	gl = canvas.getContext("webgl2", options);
	if (!gl) { alert("WebGL 2.0 isn't available"); }

	//Load shaders
	let program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	generateVertsAndColors();

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	// Enable depth testing 
	gl.enable(gl.DEPTH_TEST);

	// Polygon offset avoids "z-fighting" between triangles and line
	// loops, ensuring lines will be in front of filled triangles
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.POLYGON_OFFSET_FILL);
	gl.polygonOffset(1.0, 2.0);

	// Load the data into the GPU and associate our shader letiables
	// with our data buffer

	let bufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STREAM_DRAW);
	let vPosition = gl.getAttribLocation(program, "a_coords");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	let cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STREAM_DRAW);

	let vColor = gl.getAttribLocation(program, "a_color");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
	modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	outlineMode = gl.getUniformLocation(program, "outline_mode");

	document.onkeydown = function(ev) { keydown(ev); };

	document.getElementById("xButton").onclick = () => rotateCube('x');
	document.getElementById("yButton").onclick = () => rotateCube('y');
	document.getElementById("zButton").onclick = () => rotateCube('z');
	document.getElementById("ResetButton").onclick = () => resetCube();
	document.getElementById("RButton").onclick = () => input('R');
	document.getElementById("rButton").onclick = () => input('r');
	document.getElementById("LButton").onclick = () => input('L');
	document.getElementById("lButton").onclick = () => input('l');
	document.getElementById("UButton").onclick = () => input('U');
	document.getElementById("uButton").onclick = () => input('u');
	document.getElementById("DButton").onclick = () => input('D');
	document.getElementById("dButton").onclick = () => input('d');
	document.getElementById("FButton").onclick = () => input('F');
	document.getElementById("fButton").onclick = () => input('f');
	document.getElementById("BButton").onclick = () => input('B');
	document.getElementById("bButton").onclick = () => input('b');
	document.getElementById("RandomButton").onclick = () => input(myCube.getRandomAction());
	document.getElementById("ScrambleButton").onclick = () => Scramble(15);

	render();
}

let queue = []; // holds all rotations, ready state is when queue is empty
let cubeRotation = mat4(); // controls the orientation of the entire cube

// creates a new rotation if ready
function input(action) {
	if (queue.length == 0)// check for ready state
		newRotation(action, 0.2);
}

// Rotates cube when keys x, y and z are pressed
function keydown(event) {
	switch (event.key) {
		case 'x': rotateCube('x'); break;
		case 'y': rotateCube('y'); break;
		case 'z': rotateCube('z'); break;
	}
}

// updates cubeRotation matrix
function rotateCube(action) {
	let amount = 15;
	if (queue.length == 0)// check for ready state
		switch (action) {
			case 'x': cubeRotation = mult(cubeRotation, rotateX(amount)); break;
			case 'y': cubeRotation = mult(cubeRotation, rotateY(amount)); break;
			case 'z': cubeRotation = mult(cubeRotation, rotateZ(amount)); break;
		}
}

// sets cubeRotation to an identity matrix
function resetCube() {
	if (queue.length == 0)// check for ready state
		cubeRotation = mat4();
};

// creates random and quick rotations
function Scramble(amount) {
	if (queue.length == 0)// check for ready state
		for (let i = 0; i < amount; i++) {
			newRotation(myCube.getRandomAction(), 0.1);
		}
}

// Creates a rotation ands adds it to the queue
function newRotation(action, speed) {
	let faceIds = [];
	myCube.performAction(action).forEach((pos) =>     // update myCube
		faceIds.push(myCube.cubie_at_position[pos]));//  convert face positions to face ids
	queue.push({
		steps: -speed * 90,
		step() {// updates the animation of this rotation
			if (this.steps < 0) {
				rotateFace(faceIds, speed, action);
				this.steps++;
			} else { queue.shift(); }// remove from the front when finished
		},
	})
}

// rotates all the cubies with ids listed in the face array
function rotateFace(face, speed, action) {
	face.forEach((id) => {
		switch (action) {
			case 'L': case 'r': rotateCubie(id, speed, vec4(1, 0, 0, 0)); break;
			case 'D': case 'u': rotateCubie(id, speed, vec4(0, 1, 0, 0)); break;
			case 'B': case 'f': rotateCubie(id, speed, vec4(0, 0, 1, 0)); break;
			case 'R': case 'l': rotateCubie(id, speed, vec4(-1, 0, 0, 0)); break;
			case 'U': case 'd': rotateCubie(id, speed, vec4(0, -1, 0, 0)); break;
			case 'F': case 'b': rotateCubie(id, speed, vec4(0, 0, -1, 0)); break;
		}
	});
}

// Rotates a cubie around a given axis
function rotateCubie(id, speed, axis) {
	let localAxis = mult(inverse4(accum_rotation[id]), axis);// convert axis
	accum_rotation[id] = mult(accum_rotation[id], rotate(90 / (speed * 90), localAxis));
}

// Points and colors for one face of a cubie
function cubie_side(a, b, c, d, col) {
	points.push(vertices[a], vertices[b], vertices[c], vertices[d]);
	colors.push(vertexColors[col], vertexColors[col],
		vertexColors[col], vertexColors[col]);
};

// Generate vertices for cubie i
function cubie(i) {
	cubie_side(0, 3, 2, 1, myCube.getCubieColor(myCube.cubie_at_position[i])[4]);
	cubie_side(2, 3, 7, 6, myCube.getCubieColor(myCube.cubie_at_position[i])[0]);
	cubie_side(0, 4, 7, 3, myCube.getCubieColor(myCube.cubie_at_position[i])[3]);
	cubie_side(1, 2, 6, 5, myCube.getCubieColor(myCube.cubie_at_position[i])[2]);
	cubie_side(4, 5, 6, 7, myCube.getCubieColor(myCube.cubie_at_position[i])[5]);
	cubie_side(0, 1, 5, 4, myCube.getCubieColor(myCube.cubie_at_position[i])[1]);
}

// Generate all vertex data for entire Rubik's cube
function generateVertsAndColors() {
	for (let i = 0; i < myCube.TOTAL_CUBIES; i++) {
		cubie(i);
	}
}

//Incorporate face rotations and the entire cube rotations
function render() {

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	projectionMatrix = perspective(45.0, gl.canvas.width / gl.canvas.height, 2.0, 20.0);
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
	modelViewMatrix = lookAtNormal(vec3(viewer[0], viewer[1], viewer[2]),
		vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));

	modelViewMatrix = mult(modelViewMatrix, cubeRotation);

	// update current rotation animation if there is one 
	if (queue.length > 0)
		queue[0].step();

	// For each cubie, draw it in its correct rotated, translated position
	// Use a stack to correctly manage the modelview matrices for each cubie
	for (let i = 0; i < points.length; i = i + numVertices) {
		g_matrixStack.push(modelViewMatrix);

		modelViewMatrix = mult(modelViewMatrix, accum_rotation[i / numVertices]);

		modelViewMatrix = mult(modelViewMatrix, translate(trans[i / numVertices][0],
			trans[i / numVertices][1],
			trans[i / numVertices][2]));

		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
		for (let j = i; j < i + numVertices; j = j + 4) {
			//Use two modes to tell vertex shader to draw colored cube or outline
			gl.uniform1i(outlineMode, 0);
			gl.drawArrays(gl.TRIANGLE_FAN, j, 4);

			gl.uniform1i(outlineMode, 1);
			gl.drawArrays(gl.LINE_LOOP, j, 4);
		}
		modelViewMatrix = g_matrixStack.pop();
	};

	requestAnimationFrame(render);
}

