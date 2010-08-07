function dm3_files() {



    /**************************************************************************************************/
    /**************************************** Overriding Hooks ****************************************/
    /**************************************************************************************************/



    this.file_dropped = function(file) {
        alert("Dropped file:\n" + inspect(file))
        var properties = {
            "de/deepamehta/core/property/Filename": file.name,
            "de/deepamehta/core/property/Path":     file.path,
            "de/deepamehta/core/property/MimeType": file.type,
            "de/deepamehta/core/property/Size":     file.size
        }
        //
        if (file.type == "text/plain") {
            var content = "<pre>" + file.content + "</pre>"
        } else if (file.type.match(/^image\//)) {
            var content = "<img src=\"" + local_resource_uri(file.path, file.type, file.size) + "\">"
        } else if (file.type == "application/pdf") {
            var content = "<embed src=\"" + local_resource_uri(file.path, file.type, file.size) +
                "\" width=\"100%\" height=\"100%\">"
        } else if (file.type.match(/^audio\//)) {
            var content = "<embed src=\"" + local_resource_uri(file.path, file.type, file.size) +
                "\" width=\"100%\" height=\"100\">"
        } else {
            // TODO: handle by plugins
        }
        if (content) {
            properties["de/deepamehta/core/property/Content"] = content
        }
        //
        var file_topic = create_topic("de/deepamehta/core/topictype/File", properties)
        add_topic_to_canvas(file_topic)
    }



    /************************************************************************************************/
    /**************************************** Custom Methods ****************************************/
    /************************************************************************************************/



    function local_resource_uri(path, type, size) {
        return "/resource/file:" + encodeURIComponent(path) + "?type=" + type + "&size=" + size
    }
}
