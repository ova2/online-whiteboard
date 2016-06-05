/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: WhiteboardIdentifiers.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.controller;

/**
 * Managed bean keeping identifiers: whiteboard id and sender id.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class WhiteboardIdentifiers
{
    private String whiteboardId;
    private String senderId;

    public String getWhiteboardId() {
        return whiteboardId;
    }

    public void setWhiteboardId(String whiteboardId) {
        this.whiteboardId = whiteboardId;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }
}
