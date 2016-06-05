/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: DefaultExceptionHandler.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.errorhandler;

import javax.faces.FacesException;
import javax.faces.application.ViewExpiredException;
import javax.faces.context.ExceptionHandler;
import javax.faces.context.ExceptionHandlerWrapper;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.faces.event.ExceptionQueuedEvent;
import javax.faces.event.ExceptionQueuedEventContext;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.Iterator;

/**
 * JSF exception handler.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class DefaultExceptionHandler extends ExceptionHandlerWrapper
{
    public static final String MESSAGE_DETAIL_KEY = "com.googlecode.whiteboard.messageDetail";

    private ExceptionHandler wrapped;

    public DefaultExceptionHandler(ExceptionHandler wrapped) {
        this.wrapped = wrapped;
    }

    public ExceptionHandler getWrapped() {
        return this.wrapped;
    }

    /**
     * Handles all unchecked ang unexpected exceptions.
     *
     * @throws FacesException
     */
    public void handle() throws FacesException {
        for (Iterator<ExceptionQueuedEvent> i = getUnhandledExceptionQueuedEvents().iterator(); i.hasNext(); ) {
            ExceptionQueuedEvent event = i.next();
            ExceptionQueuedEventContext context = (ExceptionQueuedEventContext) event.getSource();

            String redirectPage = null;
            FacesContext fc = FacesContext.getCurrentInstance();
            Throwable t = context.getException();

            try {
                if (fc == null) {
                    // if 403, 404, 500, .. ==> nothing to do
                    return;
                } else if (t instanceof ViewExpiredException) {
                    HttpSession session = (HttpSession) fc.getExternalContext().getSession(false);
                    if (session != null) {
                        // should not happen
                        session.invalidate();
                    }

                    redirectPage = "/views/error.jsf?statusCode=600";
                    if (!fc.getExternalContext().isResponseCommitted()) {
                        fc.getExternalContext().getSessionMap().put(DefaultExceptionHandler.MESSAGE_DETAIL_KEY, ((ViewExpiredException) t).getViewId());
                    }
                } else {
                    redirectPage = "/views/error.jsf?statusCode=699";
                    if (!fc.getExternalContext().isResponseCommitted()) {
                        fc.getExternalContext().getSessionMap().put(DefaultExceptionHandler.MESSAGE_DETAIL_KEY, t.getLocalizedMessage());
                    }
                }
            } finally {
                i.remove();
            }

            doRedirect(fc, redirectPage);

            break;
        }
    }

    public static void doRedirect(FacesContext fc, String redirectPage) throws FacesException {
        ExternalContext ec = fc.getExternalContext();

        try {
            if (ec.isResponseCommitted()) {
                // redirect is not possible
                return;
            }

            ec.redirect(ec.getRequestContextPath() + (redirectPage != null ? redirectPage : ""));
        } catch (IOException e) {
            throw new FacesException(e);
        }
    }
}
