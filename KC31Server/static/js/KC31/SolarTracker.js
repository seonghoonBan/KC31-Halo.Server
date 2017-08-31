class SolarTracker {
    constructor(siteSettings) {
        this.siteSettings = siteSettings;
        
        var radius = 2.0;
        var circleResolution = 64;

        //lightTarget
        {
            this.lightTarget = new THREE.Object3D();
            this.lightTarget.position.set(0, 0, 0);
            scene.add(this.lightTarget);
        }

        //light
        {
            this.light = new THREE.DirectionalLight();
            this.light.target = this.lightTarget;
            this.light.position.set(0, 1, 0);
            scene.add(this.light);
        }

        //line
        {
            var geometry = new THREE.Geometry();
            geometry.vertices.push(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 0)
            );

            var material = new THREE.LineBasicMaterial({
                color: 0xaaaa00
            });

            this.line = new THREE.Line(geometry, material);
            scene.add(this.line);
        }

        //circle
        {
            var geometry = new THREE.CircleGeometry(radius, circleResolution);
            geometry.vertices.forEach(function(vertex){
                vertex.z = vertex.y;
                vertex.y = 0;
            });
            geometry.verticesNeedUpdate = true;
            geometry.computeBoundingBox();
            
            var material = new THREE.MeshBasicMaterial({color:0xffffff});
            this.circle = new THREE.Mesh(geometry, material);
            scene.add(this.circle);
        }

        //circleLine
        {
            var curve = new THREE.EllipseCurve(
                0, 0,
                radius, radius,
                0, 2 * Math.PI,
                false,
                0);

            var path = new THREE.Path(curve.getPoints(circleResolution));
            var geometry = path.createPointsGeometry(circleResolution);
            var material = new THREE.LineBasicMaterial({ color: 0x333333});

            geometry.vertices.forEach(function(vertex){
                vertex.z = vertex.y;
                vertex.y = 0;
            });
            geometry.verticesNeedUpdate = true;

            this.circleLine = new THREE.Line(geometry, material);
            scene.add(this.circleLine);
        }

        //polarGridHelper
        {
            this.polarGridHelper = new THREE.PolarGridHelper(radius, 12, 3, circleResolution);
            scene.add(this.polarGridHelper);
        }

        this.altitude = 90;
        this.azimuth = 0;
        this.azimuthFromNorth = 180;
        this.azimuthFromXAxis = 0;

        this.refresh();
    }

    intersects(rayCaster) {
        return raycaster.intersectObject(this.circle).length > 0;
    }

    getBoundingBox() {
        return this.circle.geometry.boundingBox.clone();
    }

    inspect(inspector) {
        
    }

    refresh() {
        $.ajax({
            url: "/getSolarTracking"
        }).then($.proxy(function (data) {
            this.doc = data;        
            
            this.altitude = this.doc.sun.altitude;
            
            this.azimuth = this.doc.sun.azimuth;
            this.azimuthFromNorth = this.azimuth + 180;
            this.azimuthFromXAxis = this.azimuthFromNorth + this.doc.siteSettings.location.northFromXAxis;
        }, this));
    }

    update() {
        var x = Math.cos(this.azimuthFromXAxis * Math.PI / 180);
        var y = Math.sin(this.altitude * Math.PI / 180);
        var z = - Math.sin(this.azimuthFromXAxis * Math.PI / 180);
        
        this.light.position.set(x, y, z);
        this.line.geometry.vertices[1].set(x, y, z);
        this.line.geometry.vertices[2].set(x, 0, z);
        this.line.geometry.verticesNeedUpdate = true;
    }
}