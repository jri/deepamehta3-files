function dm3_files() {

    // ------------------------------------------------------------------------------------------------ Overriding Hooks

    this.init = function() {
        extend_rest_client()
    }

    this.process_drop = function(data_transfer) {
        if (contains(data_transfer.types, "Files")) {
            if (typeof netscape != "undefined") {
                var files = process_file_drop_firefox(data_transfer)
            } else {
                var files = process_file_drop_safari(data_transfer)
            }
            // Note: if an error occurred "files" is not initialized
            if (files) {
                trigger_hook("process_files_drop", files)
            }
        } else if (contains(data_transfer.types, "text/plain")) {
            alert("WARNING: Dropped item is not processed.\n\nType: text/plain (not yet implemented)\n\n" +
                "Text: " + data_transfer.getData("text/plain"))
        } else {
            alert("WARNING: Dropped item is not processed.\n\nUnexpected type (not yet implemented)\n\n" +
                inspect(data_transfer))
        }

        function process_file_drop_firefox(data_transfer) {
            try {
                var files = new FilesDataTransfer()
                for (var i = 0, file; file = data_transfer.files[i]; i++) {
                    // Firefox note: a DOM File's "mozFullPath" attribute contains the file's path.
                    // Requires the UniversalFileRead privilege to read.
                    netscape.security.PrivilegeManager.enablePrivilege("UniversalFileRead")
                    var path = file.mozFullPath
                    if (is_directory(file)) {
                        var dropped_dir = dmc.get_resource("file:" + path)
                        files.add_directory(dropped_dir)
                        continue
                    }
                    files.add_file(new File(file.name, path, file.type, file.size))
                }
                return files
            } catch (e) {
                alert("Local file/folder \"" + file.name + "\" can't be accessed.\n\n" + e)
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
            var files = new FilesDataTransfer()
            // Note: Safari provides a "text/uri-list" data flavor which holds the URIs of the files dropped
            var uri_list = data_transfer.getData("text/uri-list").split("\n")
            for (var i = 0, file; file = data_transfer.files[i]; i++) {
                var path = uri_to_path(uri_list[i])
                if (is_directory(path)) {
                    var dropped_dir = dmc.get_resource("file:" + path)
                    files.add_directory(dropped_dir)
                    continue
                }
                files.add_file(new File(file.name, path, file.type, file.size))
            }
            return files

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

    /**
     * @param   topic   a CanvasTopic object
     */
    this.topic_doubleclicked = function(topic) {
        if (topic.type == "de/deepamehta/core/topictype/File" ||
            topic.type == "de/deepamehta/core/topictype/Folder") {
            dmc.execute_command("deepamehta3-files.open-file", {topic_id: topic.id})
        }
    }

    // ------------------------------------------------------------------------------------------------------ Public API

    /**
     * Creates a File topic for the given file and shows the topic on the canvas.
     *
     * @param   file        A File object (with "name", "path", "type", and "size" attributes).
     * @param   do_select   Optional: if evaluates to true the File topic is selected on the canvas.
     */
    this.create_file_topic = function(file, do_select) {
        var properties = {
            "de/deepamehta/core/property/FileName":  file.name,
            "de/deepamehta/core/property/Path":      file.path,
            "de/deepamehta/core/property/MediaType": file.type,
            "de/deepamehta/core/property/Size":      file.size
        }
        // Note: for unknown file types file.type is undefined
        if (file.type == "text/plain") {
            var content = "<pre>" + read_text_file(file) + "</pre>"
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
        var action = do_select ? "show" : "none"
        add_topic_to_canvas(file_topic, action)

        function local_resource_uri(path, type, size) {
            return "/resource/file:" + encodeURIComponent(path) + "?type=" + type + "&size=" + size
        }

        function read_text_file(file) {
            return dmc.get_resource("file:" + file.path)
        }
    }

    /**
     * Creates a Folder topic for the given directory and shows the topic on the canvas.
     *
     * @param   dir         A Directory object (with "name", "path", and "items" attributes).
     * @param   do_select   Optional: if evaluates to true the Folder topic is selected on the canvas.
     */
    this.create_folder_topic = function(dir, do_select) {
        var properties = {
            "de/deepamehta/core/property/FolderName": dir.name,
            "de/deepamehta/core/property/Path":       dir.path
        }
        var folder_topic = create_topic("de/deepamehta/core/topictype/Folder", properties)
        var action = do_select ? "show" : "none"
        add_topic_to_canvas(folder_topic, action)
    }

    /**
     * Creates respective File and Folder topics for all items contained in the given directory
     * and shows the topics on the canvas.
     *
     * @param   dir                 A Directory object (with "name", "path", and "items" attributes).
     * @param   select_first_topic  Optional: if evaluates to true the first created topic is selected on the canvas.
     */
    this.create_file_topics = function(dir, select_first_topic) {
        for (var i = 0, item; item = dir.items[i]; i++) {
            var do_select = select_first_topic && i == 0
            if (item.kind == "file") {
                this.create_file_topic(item, do_select)
            } else if (item.kind == "directory") {
                this.create_folder_topic(item, do_select)
            } else {
                alert("WARNING (create_file_topics):\n\nItem \"" + item.name + "\" of directory \"" +
                    dir.name + "\" is of unexpected kind: \"" + item.kind + "\".")
            }
        }
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    function extend_rest_client() {

        /**
         * @param   uri     Must not be URI-encoded!
         */
        dmc.get_resource = function(uri, type, size) {
            var params = this.createRequestParameter({type: type, size: size})
            return this.request("GET", "/resource/" + encodeURIComponent(uri) + params.to_query_string())
        }
    }

    // ------------------------------------------------------------------------------------------------- Private Classes

    function FilesDataTransfer() {

        var files = []
        var directories = []

        // ---

        this.add_file = function(file) {
            files.push(file)
        }

        this.add_directory = function(directory) {
            directories.push(directory)
        }

        // ---

        this.get_file_count = function() {
            return files.length
        }

        this.get_directory_count = function() {
            return directories.length
        }

        // ---

        this.get_file = function(index) {
            return files[index]
        }

        this.get_directory = function(index) {
            return directories[index]
        }
    }

    function File(name, path, type, size) {
        this.kind = "file"
        this.name = name
        this.path = path
        this.type = type
        this.size = size
    }

    function Directory(name, path, items) {
        this.kind = "directory"
        this.name = name
        this.path = path
        this.items = items  // array of File and Directory objects
    }
}
