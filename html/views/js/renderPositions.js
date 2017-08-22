var scene, camera, controls, renderer, stats;
var geometry, material, mesh;

var mirrorGeometry;
var mirrorMaterial;

var scaleFactor = 1.0;
var forEach = Array.prototype.forEach;

init();
animate();

function arrayToVector(output, input) {
	output.x = input[0] * scaleFactor;
	output.y = input[1] * scaleFactor;
	output.z = input[2] * scaleFactor;
}

function addPosition(document) {
	mesh = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
	arrayToVector(mesh.position, document.position);
	scene.add(mesh);
}


function init() {
	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01 * scaleFactor, 1000 * scaleFactor);
	camera.position.z = scaleFactor * 1.0;

	controls = new THREE.TrackballControls( camera );
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;
	controls.keys = [ 65, 83, 68 ];
	controls.addEventListener( 'change', render );

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize(window.innerWidth, window.innerHeight);

	mirrorGeometry = new THREE.CylinderGeometry(0.15 * scaleFactor, 0.15 * scaleFactor, 0.003 * scaleFactor, 8);
	mirrorMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });

	container = document.getElementById( 'container' );
	container.appendChild( renderer.domElement );
	stats = new Stats();
	container.appendChild( stats.dom );
	
	render();
	
	$.ajax({
		url: "/getHeliostatPositions"
	}).then(function (dataString) {
		var data = JSON.parse(dataString)
		forEach.call(data, addPosition)
		console.log("Added heliostat positions");
	});
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	controls.handleResize();
	render();
}

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	render();
}

function render() {
	renderer.render(scene, camera);
	stats.update();
}