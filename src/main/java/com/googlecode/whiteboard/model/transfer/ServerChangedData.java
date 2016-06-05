/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: ServerChangedData.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model.transfer;

import com.googlecode.whiteboard.model.base.AbstractElement;

import java.util.HashMap;
import java.util.Map;

/**
 * Container for changed data which are broadcasted to all subscribers.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class ServerChangedData
{
    private ClientAction action;
    private AbstractElement element;
    private String message;
    private long timestamp;
    private Map<String, String> parameters;

    public ClientAction getAction() {
        return action;
    }

    public void setAction(ClientAction action) {
        this.action = action;
    }

    public AbstractElement getElement() {
        return element;
    }

    public void setElement(AbstractElement element) {
        this.element = element;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    public void addParameter(String key, String value) {
        if (this.parameters == null) {
            this.parameters = new HashMap<String, String>();
        }

        this.parameters.put(key, value);
    }
}
