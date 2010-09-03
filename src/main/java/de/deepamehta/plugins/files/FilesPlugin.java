package de.deepamehta.plugins.files;

import de.deepamehta.core.model.Topic;
import de.deepamehta.core.model.Relation;
import de.deepamehta.core.service.Plugin;
import de.deepamehta.core.util.JavaUtils;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import java.awt.Desktop;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.UnsupportedEncodingException;

import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;
import java.util.logging.Logger;



public class FilesPlugin extends Plugin {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private Logger logger = Logger.getLogger(getClass().getName());

    // -------------------------------------------------------------------------------------------------- Public Methods



    // ************************
    // *** Overriding Hooks ***
    // ************************



    @Override
    public JSONObject executeCommandHook(String command, Map params, Map<String, String> clientContext) {
        if (command.equals("deepamehta3-files.open-file")) {
            long fileTopicId = (Integer) params.get("topic_id");
            return openFile(fileTopicId);
        } else if (command.equals("deepamehta3-files.create-file-topic")) {
            String path = (String) params.get("path");
            try {
                return createFileTopic(path).toJSON();
            } catch (Throwable e) {
                throw new RuntimeException("Error while creating file topic for \"" + path + "\"", e);
            }
        } else if (command.equals("deepamehta3-files.create-folder-topic")) {
            String path = (String) params.get("path");
            try {
                return createFolderTopic(path).toJSON();
            } catch (Throwable e) {
                throw new RuntimeException("Error while creating folder topic for \"" + path + "\"", e);
            }
        }
        return null;
    }



    // ***********************
    // *** Command Handler ***
    // ***********************



    public JSONObject openFile(long fileTopicId) {
        String path = null;
        try {
            path = (String) dms.getTopicProperty(fileTopicId, "de/deepamehta/core/property/Path");
            logger.info("### Opening file \"" + path + "\"");
            //
            Desktop.getDesktop().open(new File(path));
            //
            JSONObject result = new JSONObject();
            result.put("message", "OK");
            return result;
        } catch (Throwable e) {
            throw new RuntimeException("Error while opening file \"" + path + "\"", e);
        }
    }

    // ---

    public Topic createFileTopic(String path) throws Exception {
        File file = new File(path);
        String fileName = file.getName();
        String fileType = JavaUtils.getFileType(fileName);
        long fileSize = file.length();
        //
        Map properties = new HashMap();
        properties.put("de/deepamehta/core/property/FileName", fileName);
        properties.put("de/deepamehta/core/property/Path", path);
        properties.put("de/deepamehta/core/property/MediaType", fileType);
        properties.put("de/deepamehta/core/property/Size", fileSize);
        // Note: for unknown file types fileType is null
        String content = null;
        if (fileType != null) {
            if (fileType.equals("text/plain")) {
                content = "<pre>" + readTextFile(file) + "</pre>";
            } else if (fileType.startsWith("image/")) {
                content = "<img src=\"" + localResourceURI(path, fileType, fileSize) + "\"></img>";
            } else if (fileType.equals("application/pdf")) {
                content = "<embed src=\"" + localResourceURI(path, fileType, fileSize) +
                    "\" width=\"100%\" height=\"100%\"></embed>";
            } else if (fileType.startsWith("audio/")) {
                content = "<embed src=\"" + localResourceURI(path, fileType, fileSize) +
                    "\" width=\"95%\" height=\"80\"></embed>";
                // var content = "<audio controls=\"\" src=\"" + localResourceURI(path, fileType, fileSize) +
                // "\"></audio>"
            } else if (fileType.startsWith("video/")) {
                content = "<embed src=\"" + localResourceURI(path, fileType, fileSize) + "\"></embed>";
                // var content = "<video controls=\"\" src=\"" + localResourceURI(path, fileType, fileSize) +
                // "\"></video>"
            } else {
                // TODO: handle by plugins
            }
        }
        if (content != null) {
            properties.put("de/deepamehta/core/property/Content", content);
        }
        //
        return dms.createTopic("de/deepamehta/core/topictype/File", properties, null);
    }

    public Topic createFolderTopic(String path) {
        Map properties = new HashMap();
        properties.put("de/deepamehta/core/property/FolderName", new File(path).getName());
        properties.put("de/deepamehta/core/property/Path", path);
        //
        return dms.createTopic("de/deepamehta/core/topictype/Folder", properties, null);
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    private String localResourceURI(String path, String type, long size) throws UnsupportedEncodingException {
        return "/resource/file:" + JavaUtils.encodeURIComponent(path) + "?type=" + type + "&size=" + size;
    }

    private String readTextFile(File file) throws FileNotFoundException {
        StringBuilder text = new StringBuilder();
        Scanner scanner = new Scanner(file, "UTF-8");
        while (scanner.hasNextLine()) {
            text.append(scanner.nextLine() + "\n");
        }
        return text.toString();
    }
}
