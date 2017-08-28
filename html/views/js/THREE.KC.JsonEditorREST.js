class JsonEditorREST {
    constructor(inspector) {
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
            }).on('click', this.commit);
            inspector.append(commitButton[0]);
        }
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
