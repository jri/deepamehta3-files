package de.deepamehta.plugins.files.resources;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import javax.servlet.http.HttpServletRequest;

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
    public Response getResource(@PathParam("uri") String uri, @Context HttpServletRequest request,
                                                              @QueryParam("type") String type,
                                                              @QueryParam("size") long size) throws Exception {
        String localAddr = request.getLocalAddr();
        String remoteAddr = request.getRemoteAddr();
        boolean allowed = localAddr.equals(remoteAddr);
        logger.info("Requesting resource " + uri + " (type=\"" + type + "\", size=" + size + ")\n  local address: " +
            localAddr + ", remote address: " + remoteAddr + " => " + (allowed ? "ALLOWED" : "FORBIDDEN"));
        if (allowed) {
            InputStream in = new URL(uri).openStream();
            return Response.ok(in, type).header("Content-Length", size).build();
        } else {
            return Response.status(Status.FORBIDDEN).build();
        }
    }
}
