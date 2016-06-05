/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: PanelsState.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.controller;

import javax.faces.event.ActionEvent;

/**
 * Managed bean keeping panels "pin" / "unpin" states.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class PanelsState
{
    private boolean pinned = true;

    public boolean isPinned() {
        return pinned;
    }

    public void setPinned(boolean pinned) {
        this.pinned = pinned;
    }

    public void tooglePinUnpin(ActionEvent e) {
        this.pinned = !pinned;
    }
}
