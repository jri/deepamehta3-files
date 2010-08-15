package de.deepamehta.plugins.files;

import de.deepamehta.core.model.Topic;
import de.deepamehta.core.model.Relation;
import de.deepamehta.core.service.Plugin;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import java.awt.Desktop;
import java.io.File;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;



public class FilesPlugin extends Plugin {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private Logger logger = Logger.getLogger(getClass().getName());



    // ************************
    // *** Overriding Hooks ***
    // ************************



    @Override
    public JSONObject executeCommandHook(String command, Map params, Map<String, String> clientContext) {
        if (command.equals("deepamehta3-files.open-file")) {
            String path = null;
            try {
                long fileTopicId = (Integer) params.get("topic_id");
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
        return null;
    }
}
