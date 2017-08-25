function arrayToVector(output, input) {
	output.x = input[0] * scaleFactor;
	output.y = input[1] * scaleFactor;
	output.z = input[2] * scaleFactor;
}

class HeliostatPosition {
	constructor(doc, scene) {
        this.doc = doc;
        this.jsonEditor = null;

        this.mesh = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
		arrayToVector(this.mesh.position, doc.position);
		scene.add(this.mesh);

		this.annotation = new Annotation(this.doc.csvIndex, this.mesh);
		annotations.push(this.annotation);
    }
    
    intersects(rayCaster) {
        return raycaster.intersectObject(this.mesh).length > 0;
    }

    update() {

    }

    getBoundingBox() {
        var bounds = new THREE.Box3();
        bounds.setFromCenterAndSize(this.mesh.position, new THREE.Vector3(0.3, 0.1, 0.3));
        return bounds;
    }

    inspect(inspector) {
        {
            var container = $('<div/>',
            {
                style: 'width: 100%'
            });
            inspector.append(container[0]);

            this.jsonEditor = new JSONEditor(container[0]
                , { modes : ['view', 'tree', 'code']
                , onChange : this.onChangeHeliostatPositionJSON});
            this.jsonEditor.set(this.doc);
            this.jsonEditor.setName('heliostatPostion');
        }
        
        {
            var commitButton = $('<a/>',
            {
                id: 'commitHeliostatPositionJson',
                text: 'Commit',
                class: 'btn btn-default btn-block success disabled',
                style: '',
                href: '#'
            }).on('click', $.proxy(this.commit, this));
            inspector.append(commitButton[0]);
        }
    }
    
    onChangeHeliostatPositionJSON() {
        var commitButton = document.getElementById("commitHeliostatPositionJson");
        commitButton.classList.remove("disabled");
    }

	refresh() {
		$.ajax({
			url: "/getHeliostatPosition/" + selection.heliostatPosition.doc._id.$oid
		}).then($.proxy(function (dataString) {
			this.doc = JSON.parse(dataString)[0];
			arrayToVector(this.mesh.position, this.doc.position);
			jsonEditor.set(this.doc);
		}, this));
	}

	commit() {
        newData = this.jsonEditor.get();
		$.ajax({
			type: "POST",
			url: "/updateHeliostatPosition",
			data: JSON.stringify(newData),
			contentType: "application/json; charset=utf-8",
			crossDomain: true,
			dataType: "json",
			success: $.proxy(function (data, status, jqXHR) {
                this.newData = this.jsonEditor.get();

                var commitButton = document.getElementById("commitHeliostatPositionJson");
                commitButton.classList.push("disabled");

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