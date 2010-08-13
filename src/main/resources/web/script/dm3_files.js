function dm3_files() {



    /**************************************************************************************************/
    /**************************************** Overriding Hooks ****************************************/
    /**************************************************************************************************/



    this.init = function() {
        extend_rest_client()
    }

    this.process_drop = function(data_transfer) {
        if (contains(data_transfer.types, "Files")) {
            if (typeof netscape != "undefined") {
                process_file_drop_firefox(data_transfer)
            } else {
                process_file_drop_safari(data_transfer)
            }
        } else if (contains(data_transfer.types, "text/plain")) {
            alert("WARNING: Dropped item is not processed.\n\nType: text/plain (not yet implemented)\n\n" +
                "Text: " + data_transfer.getData("text/plain"))
        } else {
            alert("WARNING: Dropped item is not processed.\n\nUnexpected type (not yet implemented)\n\n" +
                inspect(data_transfer))
        }
        return false;

        function process_file_drop_firefox(data_transfer) {
            try {
                // Firefox note: a DOM File's "mozFullPath" attribute contains the file's path.
                // Requires the UniversalFileRead privilege to read.
                netscape.security.PrivilegeManager.enablePrivilege("UniversalFileRead")
                for (var i = 0, file; file = data_transfer.files[i]; i++) {
                    if (is_directory(file)) {
                        var dropped_dir = dmc.get_resource("file:" + file.mozFullPath)
                        trigger_hook("directory_dropped", dropped_dir)
                        continue
                    }
                    var dropped_file = new File(file.name, file.mozFullPath, file.type, file.size)
                    if (file.type == "text/plain") {
                        read_text_file(dropped_file)
                    }
                    trigger_hook("file_dropped", dropped_file)
                }
            } catch (e) {
                alert("Local file \"" + file.name + "\" can't be accessed.\n\n" + e)
            }

            function is_directory(file) {
                // Firefox note 1: The path of a File object which represents a directory doesn't end with "/".
                // So we can't detect directories safely.
                // Firefox note 2: The size of a File object which represents a directory is 0.
                // We exploit this fact to detect a directory heuristically.
                // Obviously a wrong result is returned by zero-byte files.
                return file.size == 0
            }
        }

        function process_file_drop_safari(data_transfer) {
            // Note: Safari provides a "text/uri-list" data flavor which holds the URIs of the files dropped
            var uri_list = data_transfer.getData("text/uri-list").split("\n")
            for (var i = 0, file; file = data_transfer.files[i]; i++) {
                var path = uri_to_path(uri_list[i])
                if (is_directory(path)) {
                    var dropped_dir = dmc.get_resource("file:" + path)
                    trigger_hook("directory_dropped", dropped_dir)
                    continue
                }
                var dropped_file = new File(file.name, path, file.type, file.size)
                if (file.type == "text/plain") {
                    read_text_file(dropped_file)
                }
                trigger_hook("file_dropped", dropped_file)
            }

            function uri_to_path(uri) {
                // Note: local file URIs provided by Safari begin with "file://localhost" which must be cut off
                if (uri.match(/^file:\/\/localhost(.*)/)) {
                    uri = RegExp.$1
                }
                // Note: local file URIs provided by Safari are encoded
                return decodeURIComponent(uri)
            }

            function is_directory(path) {
                // Safari note: The URI of a File object which represents a directory end with "/".
                return path.match(/.$/)[0] == "/"
            }
        }
    }

    this.file_dropped = function(file) {
        var properties = {
            "de/deepamehta/core/property/Filename":  file.name,
            "de/deepamehta/core/property/Path":      file.path,
            "de/deepamehta/core/property/MediaType": file.type,
            "de/deepamehta/core/property/Size":      file.size
        }
        // Note: for unknown file types file.type is undefined
        if (file.type == "text/plain") {
            var content = "<pre>" + file.content + "</pre>"
        } else if (file.type && file.type.match(/^image\//)) {
            var content = "<img src=\"" + local_resource_uri(file.path, file.type, file.size) + "\"></img>"
        } else if (file.type == "application/pdf") {
            var content = "<embed src=\"" + local_resource_uri(file.path, file.type, file.size) +
                "\" width=\"100%\" height=\"100%\"></embed>"
        } else if (file.type && file.type.match(/^audio\//)) {
            var content = "<embed src=\"" + local_resource_uri(file.path, file.type, file.size) +
                "\" width=\"95%\" height=\"80\"></embed>"
            // var content = "<audio controls=\"\" src=\"" + local_resource_uri(file.path, file.type, file.size) +
            // "\"></audio>"
        } else if (file.type && file.type.match(/^video\//)) {
            var content = "<embed src=\"" + local_resource_uri(file.path, file.type, file.size) + "\"></embed>"
            // var content = "<video controls=\"\" src=\"" + local_resource_uri(file.path, file.type, file.size) +
            // "\"></video>"
        } else {
            // TODO: handle by plugins
        }
        if (content) {
            properties["de/deepamehta/core/property/Content"] = content
        }
        //
        var file_topic = create_topic("de/deepamehta/core/topictype/File", properties)
        add_topic_to_canvas(file_topic, "show")
    }

    this.directory_dropped = function(dir) {
        for (var i = 0, item; item = dir.items[i]; i++) {
            if (item.kind == "file") {
                if (item.type == "text/plain") {
                    read_text_file(item)
                }
                trigger_hook("file_dropped", item)
            }
        }
    }



    /************************************************************************************************/
    /**************************************** Custom Methods ****************************************/
    /************************************************************************************************/



    function extend_rest_client() {
        /**
         * @param   uri     Must not be URI-encoded!
         */
        dmc.get_resource = function(uri, type, size) {
            var params = this.createRequestParameter({type: type, size: size})
            return this.request("GET", "/resource/" + encodeURIComponent(uri) + params.to_query_string())
        }
    }

    function local_resource_uri(path, type, size) {
        return "/resource/file:" + encodeURIComponent(path) + "?type=" + type + "&size=" + size
    }

    // ---

    function read_text_file(file) {
        file.content = dmc.get_resource("file:" + file.path)
    }

    /*** Custom Classes ***/

    function File(name, path, type, size, content) {
        this.kind = "file"
        this.name = name
        this.path = path
        this.type = type
        this.size = size
        this.content = content
    }

    function Directory(name, path, items) {
        this.kind = "directory"
        this.name = name
        this.path = path
        this.items = items  // array of File and Directory objects
    }
}
