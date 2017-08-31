class SceneObjects {
    constructor(inspectorContainer) {
        this.sceneObjects = [];
        this.hover = null;
        this.selection = [];
        
        this.inspectorContainer = inspectorContainer;
        this.inspectorDirty = true;
        
        //selectionCursors
        {
            this.selectionCursors = [];
            this.selectionCursorsDirty = true;
            this.selectionCursorGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
            this.selectionCursorMaterial = new THREE.MeshBasicMaterial({color : 0x333333, wireframe: true});
        }
        
        //hoverCursor
        {
            var geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
            var material = new THREE.MeshBasicMaterial({color : 0xaaaaaa, wireframe : true});
            this.hoverCursor = new THREE.Mesh(geometry, material);
            this.hoverCursor.visible = false;
            this.hoverCursor.renderOrder = -1;
            scene.add(this.hoverCursor);
        }
    }

    update() {
        this.sceneObjects.forEach(function(sceneObject) {
            sceneObject.update();
        }, this);

        if(this.selectionCursorsDirty) {
            this.rebuildSelectionCursors();
        }

        if(this.inspectorDirty) {
            this.rebuildInspector();
        }
    }

    push(sceneObject) {        
        this.sceneObjects.push(sceneObject);
    }

    updateHover(rayCaster) {
        this.hover = null;
        this.sceneObjects.forEach(function(sceneObject) {
            if(sceneObject.intersects(rayCaster)) {
                this.hover = sceneObject;
            }
        }, this);

        if(this.hover == null) {
            this.hoverCursor.visible = false;
        }
        else {
            var bounds = this.hover.getBoundingBox().clone();
            /*
            var expandedBounds = new THREE.Box3();
            expandedBounds.setFromCenterAndSize(bounds.getCenter(), bounds.getSize().clone().addScalar(0.05));

            this.hoverCursor.scale.copy(expandedBounds.getSize());
            this.hoverCursor.position.copy(expandedBounds.getCenter());
            */
            this.hoverCursor.scale.copy(bounds.getSize());
            this.hoverCursor.position.copy(bounds.getCenter());

            this.hoverCursor.visible = true;
        }
    }

    mouseDown(eventArguments) {
        if(!eventArguments.shiftKey) {
            this.clearSelection();
        }
        if(this.hover != null) {
            if($.inArray(this.hover, this.selection) == -1) {
                this.selection.push(this.hover);
            }
        }

        this.selectionCursorsDirty = true;
        this.inspectorDirty = true;
    }

    clearSelection() {
        this.selection = [];
        this.inspectorDirty = true;
    }
    
    rebuildSelectionCursors() {
        this.selectionCursors.forEach(function(selectionCursor) {
            scene.remove(selectionCursor);
        });
        this.selectionCursors = [];

        this.selection.forEach($.proxy(function(selectionItem) {
            var bounds = selectionItem.getBoundingBox();
            var mesh = new THREE.Mesh(this.selectionCursorGeometry, this.selectionCursorMaterial);
            mesh.scale.copy(bounds.getSize());
            mesh.position.copy(bounds.getCenter());

            this.selectionCursors.push(mesh);
            scene.add(mesh);
        }, this));

        if(this.selection.length > 1) {
            var outerBounds = this.selection[0].getBoundingBox();
            for(var i=1; i<this.selection.length; i++) {
                var selectionItem = this.selection[i];
                var boundsOther = selectionItem.getBoundingBox();
                outerBounds.expandByPoint(boundsOther.min);
                outerBounds.expandByPoint(boundsOther.max);
            }

            outerBounds.expandByScalar(0.1);

            var mesh = new THREE.Mesh(this.selectionCursorGeometry, this.selectionCursorMaterial);
            mesh.scale.copy(outerBounds.getSize());
            mesh.position.copy(outerBounds.getCenter());
            mesh.selectionItem = selectionItem;

            this.selectionCursors.push(mesh);
            scene.add(mesh);
        }

        this.selectionCursorsDirty = false;
    }

    rebuildInspector() {
        this.inspectorContainer.innerHTML = "";
        if(this.selection.length == 1) {
            this.selection[0].inspect(this.inspectorContainer);
        }
        this.inspectorDirty = false;
    }
}