class SiteSettings {
    constructor() {
        this.doc = {}
        
        //mesh
        {
            var geometry = new THREE.SphereGeometry(0.25, 20, 20);
            var material = new THREE.MeshNormalMaterial();
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(0, 0.5, -5.0);
            this.mesh.geometry.computeBoundingBox();
            scene.add(this.mesh);
        }
    }

    intersects(rayCaster) {
        return raycaster.intersectObject(this.mesh).length > 0;
    }

    getBoundingBox() {
        var bounds = this.mesh.geometry.boundingBox.clone();
        bounds.applyMatrix4(this.mesh.matrixWorld);
        return bounds;
    }

    inspect(inspector) {
        
    }

    refresh() {
        $.ajax({
            url: "/getSiteSettings"
        }).then($.proxy(function (dataString) {
            this.doc = JSON.parse(dataString)[0];        
        }, this));
    }

    update() {
        
    }
}