package de.deepamehta.plugins.files.resources;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Response;

import java.io.InputStream;
import java.net.URL;

import java.util.logging.Logger;



@Path("/")
public class ResourceResource {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private Logger logger = Logger.getLogger(getClass().getName());

    // -------------------------------------------------------------------------------------------------- Public Methods

    @GET
    @Path("/{uri}")
    public Response getResource(@PathParam("uri") String uri, @QueryParam("type") String type,
                                                              @QueryParam("size") long size) throws Exception {
        logger.info("Getting resource " + uri + " (type=\"" + type + "\", size=" + size + ")");
        InputStream in = new URL(uri).openStream();
        return Response.ok(in, type).header("Content-Length", size).build();
    }
}
