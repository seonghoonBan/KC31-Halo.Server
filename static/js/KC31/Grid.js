class Grid {
    constructor() {
        //minor
        {
            this.minor = new THREE.GridHelper(40.0, 400, 0xcccccc, 0xcccccc);
            scene.add(this.minor);
        }

        //major
        {
            this.major = new THREE.GridHelper(40.0, 40, 0x000000, 0x666666);
            scene.add(this.major);
        }

        //axes
        {
            this.axes = new THREE.AxisHelper(scaleFactor);
            scene.add(this.axes);
        }
    }

    update() {

    }

    intersects(rayCaster) {
        return false;
    }

    getBoundingBox() {
        return this.major.geometry.boundingBox();
    }

    inspect(inspector) {
        
    }
}