/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: MessageUtils.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.utils;

import org.apache.commons.lang.StringUtils;

import javax.faces.application.FacesMessage;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;

/**
 * Utility class for JSF messages.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class MessageUtils
{
    /**
     * Addes a message to faces context.
     *
     * @param facesContext faces context
     * @param component    component
     * @param severity     message severity
     * @param msg          message text
     */
    public static void addFacesMessage(final FacesContext facesContext, final UIComponent component, final FacesMessage.Severity severity, final String msg) {
        String clientId = null;
        if (component != null) {
            clientId = component.getClientId(facesContext);
        }

        facesContext.addMessage(clientId, new FacesMessage(severity, msg, StringUtils.EMPTY));
    }

    /**
     * Addes a message to faces context.
     *
     * @param facesContext faces context
     * @param component    component
     * @param severity     message severity
     * @param msg          message text
     * @param detail       message details
     */
    public static void addFacesMessage(final FacesContext facesContext, final UIComponent component, final FacesMessage.Severity severity, final String msg, final String detail) {
        String clientId = null;
        if (component != null) {
            clientId = component.getClientId(facesContext);
        }

        facesContext.addMessage(clientId, new FacesMessage(severity, msg, detail));
    }
}
