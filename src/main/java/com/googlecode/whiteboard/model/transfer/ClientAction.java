/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: ClientAction.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model.transfer;

/**
 * Enum for client actions.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public enum ClientAction
{
    Join("join"), Create("create"), Update("update"), Remove("remove"), Clone("clone"), Move("move"), BringToFront("toFront"), BringToBack("toBack"), Clear("clear"), Resize("resize");

    private String action;

    ClientAction(String action) {
        this.action = action;
    }

    public String getAction() {
        return action;
    }

    public static ClientAction getEnum(String action) {
        for (ClientAction ca : ClientAction.values()) {
            if (ca.action.equals(action)) {
                return ca;
            }
        }

        return null;
    }
}
