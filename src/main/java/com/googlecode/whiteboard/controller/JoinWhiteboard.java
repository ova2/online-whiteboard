/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: JoinWhiteboard.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.controller;

import com.googlecode.whiteboard.errorhandler.DefaultExceptionHandler;
import com.googlecode.whiteboard.model.UserData;
import com.googlecode.whiteboard.model.Whiteboard;
import com.googlecode.whiteboard.utils.FacesAccessor;

import javax.annotation.PostConstruct;
import javax.faces.context.FacesContext;
import java.io.Serializable;
import java.util.UUID;

/**
 * Managed bean for the join whiteboard dialog if a new user joins the whiteboard.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class JoinWhiteboard implements Serializable
{
    private static final long serialVersionUID = 20110506L;

    private String user = "";
    private Whiteboard whiteboard;
    private WhiteboardsManager whiteboardsManager;

    @PostConstruct
    /**
     * Finds the existing whiteboard. This method is called automatically by JSF facility.
     */    
    protected void initialize() {
        String uuid = FacesAccessor.getRequestParameter("whiteboardId");

        if (uuid != null) {
            whiteboard = whiteboardsManager.getWhiteboard(uuid);
        } else {
            DefaultExceptionHandler.doRedirect(FacesContext.getCurrentInstance(), "/views/error.jsf?statusCode=601");
            return;
        }

        if (whiteboard == null) {
            DefaultExceptionHandler.doRedirect(FacesContext.getCurrentInstance(), "/views/error.jsf?statusCode=602");
        }
    }

    public String getTitle() {
        if (whiteboard == null) {
            return "";
        }

        return whiteboard.getTitle();
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public void setWhiteboardsManager(WhiteboardsManager whiteboardsManager) {
        this.whiteboardsManager = whiteboardsManager;
    }

    /**
     * Joins the existing whiteboard
     *
     * @return string outcome for navigation
     */    
    public String join() {
        String senderId = UUID.randomUUID().toString();

        whiteboard.addUserData(new UserData(senderId, getUser()));
        whiteboardsManager.updateWhiteboard(whiteboard);

        WhiteboardIdentifiers wi = ((WhiteboardIdentifiers) FacesAccessor.getManagedBean("whiteboardIdentifiers"));
        wi.setSenderId(senderId);
        wi.setWhiteboardId(whiteboard.getUuid());

        return "pretty:wbWorkplace";
    }
}
