/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: FacesAccessor.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.utils;

import javax.el.ELContext;
import javax.faces.FacesException;
import javax.faces.context.FacesContext;

/**
 * Utility class for JSF environment.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class FacesAccessor
{
    /**
     * Gets any managed bean by name.
     *
     * @param beanName bean name
     * @return managed bean
     */
    public static Object getManagedBean(final String beanName) {
        FacesContext fc = FacesContext.getCurrentInstance();

        Object bean;
        try {
            ELContext elContext = fc.getELContext();
            bean = elContext.getELResolver().getValue(elContext, null, beanName);
        } catch (RuntimeException e) {
            throw new FacesException(e.getMessage(), e);
        }

        if (bean == null) {
            throw new FacesException("Managed bean with name '" + beanName + "' was not found. Check your faces-config.xml or @ManagedBean annotation.");
        }

        return bean;
    }

    public static String getRequestParameter(String name) {
        return FacesContext.getCurrentInstance().getExternalContext().getRequestParameterMap().get(name);
    }
}
