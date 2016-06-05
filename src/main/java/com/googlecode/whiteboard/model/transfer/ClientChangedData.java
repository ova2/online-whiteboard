/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: ClientChangedData.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model.transfer;

import com.googlecode.whiteboard.model.base.AbstractElement;

import java.util.HashMap;
import java.util.Map;

/**
 * Container for changed data from publisher.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class ClientChangedData
{
    private ClientAction action;
    private String whiteboardId;
    private AbstractElement element;
    private String user;
    private long timestamp;
    private Map<String, String> parameters = new HashMap<String, String>();

    public ClientAction getAction() {
        return action;
    }

    public void setAction(ClientAction action) {
        this.action = action;
    }

    public String getWhiteboardId() {
        return whiteboardId;
    }

    public void setWhiteboardId(String whiteboardId) {
        this.whiteboardId = whiteboardId;
    }

    public AbstractElement getElement() {
        return element;
    }

    public void setElement(AbstractElement element) {
        this.element = element;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, String> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, String> parameters) {
        this.parameters = parameters;
    }
}
