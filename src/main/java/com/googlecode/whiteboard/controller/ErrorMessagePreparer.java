/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: ErrorMessagePreparer.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.controller;

import com.googlecode.whiteboard.errorhandler.DefaultExceptionHandler;
import com.googlecode.whiteboard.utils.MessageUtils;

import javax.faces.application.FacesMessage;
import javax.faces.context.FacesContext;
import javax.faces.event.ComponentSystemEvent;

/**
 * Managed bean for preparing error messages.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class ErrorMessagePreparer
{
    public void prepareErrorMessage(ComponentSystemEvent event) {
        FacesContext fc = FacesContext.getCurrentInstance();

        String message;
        String detail = null;
        String messageKey = fc.getExternalContext().getRequestParameterMap().get("statusCode");

        if ("403".equals(messageKey)) {
            message = "403 Forbidden: The request was a legal request, but the server is refusing to respond to it.";
        } else if ("404".equals(messageKey)) {
            message = "404 Not Found: The requested resource could not be found.";
        } else if ("500".equals(messageKey)) {
            message = "500 Internal Server Error: Server has encountered an error.";
        } else if ("600".equals(messageKey)) {
            String view = (String) fc.getExternalContext().getSessionMap().get(DefaultExceptionHandler.MESSAGE_DETAIL_KEY);
            if (view != null) {
                message = "View '" + detail + "' is expired (probably session timeout). Try again please.";
            } else {
                message = "View is expired (probably session timeout). Try again please.";
            }
        } else if ("601".equals(messageKey)) {
            message = "Whiteboard object could not be retrieved from request parameter!";
        } else if ("602".equals(messageKey)) {
            message = "Whiteboard object could not be found (UUID is probably invalid)!";
        } else if ("603".equals(messageKey)) {
            message = "Sender Id could not be retrieved from request parameter!";
        } else if ("699".equals(messageKey)) {
            message = "An unexpected error occurred. Try again please.";
            detail = (String) fc.getExternalContext().getSessionMap().get(DefaultExceptionHandler.MESSAGE_DETAIL_KEY);
        } else {
            message = "An unexpected error occurred. Try again please.";
        }

        if (detail == null) {
            MessageUtils.addFacesMessage(fc, null, FacesMessage.SEVERITY_ERROR, message);
        } else {
            MessageUtils.addFacesMessage(fc, null, FacesMessage.SEVERITY_ERROR, message, detail);
        }

        fc.getExternalContext().getSessionMap().remove(DefaultExceptionHandler.MESSAGE_DETAIL_KEY);
    }
}
