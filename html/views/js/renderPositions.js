var scene, camera, controls, renderer, stats;
var geometry, material, mesh;
var raycaster, mousePosition, projector;

var siteSettings;
var solarTracker;
var sceneObjects;

var scaleFactor = 1.0;
var forEach = Array.prototype.forEach;

var annotations;

var renderSize = {
	width: 100,
	height: 100
};

init();
animate();

function init() {
	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

	scene = new THREE.Scene();
	sceneObjects = new SceneObjects(document.getElementById('inspectorContent'));

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01 * scaleFactor, 1000 * scaleFactor);
	camera.position.x = 0;
	camera.position.y = 5;
	camera.position.z = 5;
	camera.lookAt(new THREE.Vector3(0, 0,0));

	raycaster = new THREE.Raycaster();
	mousePosition = new THREE.Vector2();

	mirrorGeometry = new THREE.CylinderGeometry(0.15 * scaleFactor, 0.15 * scaleFactor, 0.003 * scaleFactor, 8);
	mirrorMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });

	container = document.getElementById( 'mainView' );

	renderer = new THREE.WebGLRenderer({'antialias' : true});
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize(container.clientWidth, container.clientHeight);
	renderer.setClearColor( 0xffffff, 1 );
	container.appendChild( renderer.domElement );
	
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.addEventListener( 'change', render );
	
	annotations = new Annotations();

	{
		grid = new Grid();
		this.sceneObjects.push(grid);
	}

	{
		siteSettings = new SiteSettings();
		this.sceneObjects.push(siteSettings);
	}
	
	{
		solarTracker = new SolarTracker(siteSettings);
		this.sceneObjects.push(solarTracker);
	}

	{
		stats = new Stats();
		container.appendChild( stats.dom );
	}
	
	$.ajax({
		url: "/getHeliostatPositions"
	}).then(function (dataString) {
		var data = JSON.parse(dataString)
		forEach.call(data, function(heliostatPositionJson) {
			heliostatPosition = new HeliostatPosition(heliostatPositionJson, scene);
			this.sceneObjects.push(heliostatPosition);
		})
		console.log("Added heliostat positions");
	});

	$(window).resize(function() {
		onWindowResize();
	})
	renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
	renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
	onWindowResize();
	render();
}


function onWindowResize() {
	renderSize.width = container.clientWidth;
	renderSize.height = window.innerHeight;

	camera.aspect = renderSize.width / renderSize.height;
	camera.updateProjectionMatrix();
	renderer.setSize( renderSize.width, renderSize.height );
	render();
}

function onDocumentMouseMove(event) {
	mousePosition.x = ( event.clientX / renderSize.width ) * 2 - 1;
	mousePosition.y = - ( event.clientY / renderSize.height ) * 2 + 1;
}

function onDocumentMouseDown(event) {
	sceneObjects.mouseDown(event);
}

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	annotations.update();	
	sceneObjects.update();

	raycast();
	render();
}

function render() {
	
	
	renderer.render(scene, camera);
	stats.update();
}

function raycast() {
	raycaster.setFromCamera(mousePosition, camera);
	sceneObjects.updateHover(raycaster);
}