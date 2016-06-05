/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: WhiteboardPubSub.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.pubsub;

import com.googlecode.whiteboard.utils.WhiteboardUtils;
import org.atmosphere.annotation.Broadcast;
import org.atmosphere.cpr.AtmosphereResource;
import org.atmosphere.cpr.Broadcaster;
import org.atmosphere.jersey.SuspendResponse;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

/**
 * Class to handle subscribe() and publish() requests from clients. It uses Jersey annotations.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
@Path("/pubsub/{topic}/{sender}")
@Produces("text/html;charset=ISO-8859-1")
public class WhiteboardPubSub
{
    private
    @PathParam("topic")
    Broadcaster topic;

    @GET
    public SuspendResponse<String> subscribe() {
        return new SuspendResponse.SuspendResponseBuilder<String>().broadcaster(topic).outputComments(true).build();
    }

    @POST
    @Broadcast
    public String publish(@FormParam("message") String message, @PathParam("sender") String sender, @Context AtmosphereResource resource) {
        // find current sender in all suspended resources and remove it from the notification
        Collection<AtmosphereResource<?, ?>> ars = topic.getAtmosphereResources();
        if (ars == null) {
            return "";
        }

        Set<AtmosphereResource<?, ?>> arsSubset = new HashSet<AtmosphereResource<?, ?>>();
        HttpServletRequest curReq = null;
        for (AtmosphereResource ar : ars) {
            Object req = ar.getRequest();
            if (req instanceof HttpServletRequest) {
                String pathInfo = ((HttpServletRequest) req).getPathInfo();
                if (pathInfo == null) {
                    arsSubset.add(ar);
                    continue;
                }

                String resSender = pathInfo.substring(pathInfo.lastIndexOf('/') + 1);
                if (!sender.equals(resSender)) {
                    arsSubset.add(ar);
                } else {
                    curReq = (HttpServletRequest) req;
                }
            }
        }

        if (curReq == null) {
            curReq = (HttpServletRequest) resource.getRequest();
        }

        // process current message (JSON) and create a new one (JSON) for subscribed client
        String newMessage = WhiteboardUtils.updateWhiteboardFromJson(curReq, message);

        // broadcast subscribed clients except sender
        topic.broadcast(newMessage, arsSubset);

        return "";
    }
}
