/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: DefaultExceptionHandlerFactory.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.errorhandler;

import javax.faces.context.ExceptionHandler;
import javax.faces.context.ExceptionHandlerFactory;

/**
 * Factory class to create JSF exception handler {@link DefaultExceptionHandler}.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class DefaultExceptionHandlerFactory extends ExceptionHandlerFactory
{
    private ExceptionHandlerFactory parent;

    public DefaultExceptionHandlerFactory(ExceptionHandlerFactory parent) {
        this.parent = parent;
    }

    /**
     * Creates {@link DefaultExceptionHandler}.
     *
     * @return ExceptionHandler
     */
    public ExceptionHandler getExceptionHandler() {
        ExceptionHandler eh = parent.getExceptionHandler();
        eh = new DefaultExceptionHandler(eh);

        return eh;
    }
}
