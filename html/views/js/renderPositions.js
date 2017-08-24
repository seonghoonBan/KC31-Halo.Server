var scene, camera, controls, renderer, stats;
var geometry, material, mesh;
var raycaster, mousePosition, projector;

var scaleFactor = 1.0;
var forEach = Array.prototype.forEach;
var jsonEditor = null;

var heliostatPositions = [];

var cursor = {
	mesh: null,
	hoverHeliostatPosition: null
}

var selection = {
	mesh: null,
	heliostatPosition: null
}

var renderSize = {
	width: 100,
	height: 100
};

init();
animate();

function notice(text, alertType='info') {
	$("#alertConsole").prepend('<div class="alert alert-'+alertType+' alert-dismissable"><a href="#" class="close" data-dismiss="alert" aria-label="close">×</a>' + text + '</div>')
}

function arrayToVector(output, input) {
	output.x = input[0] * scaleFactor;
	output.y = input[1] * scaleFactor;
	output.z = input[2] * scaleFactor;
}

class Annotation {
	constructor(text, objectWithPosition) {
		this.text = text;
		this.posScreen = new THREE.Vector2();
		this.objectWithPosition = objectWithPosition;
		this.visible = true;

		this.domElementID = 'annotation-' + Annotation.getNextIndex();
		$("#annotations").append('<div class="annotation" id="' + this.domElementID + '">' + text + '</div>');
		this.domElement = $("#" + this.domElementID);
		this.domElement.css({position : 'absolute'});
	}

	destroy() {
		this.domElement.remove();
	}

	update() {
		var posP = this.objectWithPosition.position.clone().project(camera);
		this.posScreen.x = (posP.x + 1.0) / 2.0 * renderSize.width;
		this.posScreen.y = (1.0 - posP.y) / 2.0 * renderSize.height;
		var visible = this.visible && posP.z < 1 && Math.abs(posP.x) < 1 && Math.abs(posP.y) < 1;

		this.domElement.innerHTML = this.text;
		this.domElement.css({
			left : this.posScreen.x,
			top : this.posScreen.y,
			overflow : 'hidden',
			visibility : visible ? 'visible' : 'hidden'
		});
	}
}
Annotation.getNextIndex = function() {
	return Annotation.nextIndex++;
}
Annotation.nextIndex = 0;

class Annotations {
	constructor() {
		this.annotations = [];
	}

	push(annotation) {
		this.annotations.push(annotation);
	}

	update() {
		this.annotations.forEach(function(annotation) {
			annotation.update();
		});
	}
}
var annotations = new Annotations();

class HeliostatPosition {
	constructor(doc, scene) {
		this.mesh = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
		arrayToVector(this.mesh.position, doc.position);

		this.doc = doc;
		scene.add(this.mesh);

		this.annotation = new Annotation(this.doc.csvIndex, this.mesh);
		annotations.push(this.annotation);
	}

	select() {
		selection.heliostatPosition = cursor.hoverHeliostatPosition;
		selection.mesh.position.copy(cursor.mesh.position);
		selection.mesh.visible = selection.heliostatPosition != null;

		jsonEditor.set(selection.heliostatPosition.doc);
		jsonEditor.setName('heliostatPosition');

		document.getElementById("heliostatPositionRefresh").style.visibility = 'visible';
		document.getElementById("heliostatPositionCommit").style.visibility = 'hidden';
	}

	refresh() {
		$.ajax({
			url: "/getHeliostatPosition/" + selection.heliostatPosition.doc._id.$oid
		}).then($.proxy(function (dataString) {
			this.doc = JSON.parse(dataString)[0];
			arrayToVector(this.mesh.position, this.doc.position);
			jsonEditor.set(this.doc);
		}, this));
		console.log("Refresh");
	}

	commit(newDoc) {
		$.ajax({
			type: "POST",
			url: "/updateHeliostatPosition",
			data: JSON.stringify(newDoc),
			contentType: "application/json; charset=utf-8",
			crossDomain: true,
			dataType: "json",
			success: $.proxy(function (data, status, jqXHR) {
				this.doc = newDoc;
				document.getElementById("heliostatPositionCommit").style.visibility = 'hidden';
			}, this),

			error: function (jqXHR, status) {
				// error handler
				console.log(jqXHR);
				notice('fail' + status.code, 'danger');
			}
		 });
	}
}

function init() {
	if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01 * scaleFactor, 1000 * scaleFactor);
	camera.position.x = 0;
	camera.position.y = 5;
	camera.position.z = 5;
	camera.lookAt(new THREE.Vector3(0, 0,0));

	raycaster = new THREE.Raycaster();
	mousePosition = new THREE.Vector2();

	mirrorGeometry = new THREE.CylinderGeometry(0.15 * scaleFactor, 0.15 * scaleFactor, 0.003 * scaleFactor, 8);
	mirrorMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });

	cursor.mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3)
		, new THREE.MeshBasicMaterial({ color: 0x333333, wireframe : true}));
	cursor.mesh.visible = false;
	scene.add(cursor.mesh);

	selection.mesh = new THREE.Mesh(cursor.mesh.geometry
		, new THREE.MeshBasicMaterial({ color: 0x000000, wireframe : true}))
	selection.mesh.visible = false;
	scene.add(selection.mesh);

	var axes = new THREE.AxisHelper(scaleFactor);
	scene.add(axes);

	//minor
	{
		var gridHelper = new THREE.GridHelper(40.0, 400, 0xcccccc, 0xcccccc);
		scene.add(gridHelper);
	}

	//major
	{
		var gridHelper = new THREE.GridHelper(40.0, 40, 0x000000, 0x666666);
		scene.add(gridHelper);
	}

	container = document.getElementById( 'mainView' );

	renderer = new THREE.WebGLRenderer({'antialias' : true});
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize(container.clientWidth, container.clientHeight);
	renderer.setClearColor( 0xffffff, 1 );
	container.appendChild( renderer.domElement );
	
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.addEventListener( 'change', render );
	
	stats = new Stats();
	//container.appendChild( stats.dom );
	
	$.ajax({
		url: "/getHeliostatPositions"
	}).then(function (dataString) {
		var data = JSON.parse(dataString)
		forEach.call(data, function(heliostatPositionJson) {
			heliostatPosition = new HeliostatPosition(heliostatPositionJson, scene);
			heliostatPositions.push(heliostatPosition);
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

	jsonEditorContainer = document.getElementById("heliostatPositionEditor");
	jsonEditor = new JSONEditor(jsonEditorContainer, { modes : ['view', 'tree', 'code'], onChange : onChangeHeliostatPositionJSON});

	$("#heliostatPositionRefresh").on('click', function(e) {
		refreshHeliostatPosition();
	});

	$("#heliostatPositionCommit").on('click', function(e) {
		commitHeliostatPosition();
	});
}

function onChangeHeliostatPositionJSON() {
	if(selection.heliostatPosition != null) {
		document.getElementById("heliostatPositionCommit").style.visibility = 'visible';
	}
}

function refreshHeliostatPosition() {
	if(selection.heliostatPosition != null) {
		selection.heliostatPosition.refresh();
	}
}

function commitHeliostatPosition() {
	if(selection.heliostatPosition != null) {
		selection.heliostatPosition.commit(jsonEditor.get());
	}
}

function onWindowResize() {
	renderSize.width = container.clientWidth;
	renderSize.height = window.innerHeight;

	camera.aspect = renderSize.width / renderSize.height;
	camera.updateProjectionMatrix();
	renderer.setSize( renderSize.width, renderSize.height );
	render();
}

function onDocumentMouseMove( event ) {
	mousePosition.x = ( event.clientX / renderSize.width ) * 2 - 1;
	mousePosition.y = - ( event.clientY / renderSize.height ) * 2 + 1;
}

function onDocumentMouseDown( event ) {
	if(cursor.hoverHeliostatPosition != null) {
		cursor.hoverHeliostatPosition.select();
	}
}

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	if(typeof annotations !== 'undefined') {
		annotations.update();	
	}
	
	render();
}

function render() {
	raycast();
	
	renderer.render(scene, camera);
	stats.update();
}

function raycast() {
	raycaster.setFromCamera(mousePosition, camera);
	cursor.hoverHeliostatPosition = null;

	//check if ray intersects any face of heliostatPosition
	heliostatPositions.forEach(function(heliostatPosition) {
		var intersects = raycaster.intersectObject(heliostatPosition.mesh);
		if(intersects.length > 0) {
			cursor.hoverHeliostatPosition = heliostatPosition;
		}
	}, this);

	if(cursor.hoverHeliostatPosition == null) {
		//nothing under cursor
		cursor.mesh.visible = false;
	}
	else {
		//something under cursor
		cursor.mesh.visible = true;
		cursor.mesh.position.copy(cursor.hoverHeliostatPosition.mesh.position);
	}
}