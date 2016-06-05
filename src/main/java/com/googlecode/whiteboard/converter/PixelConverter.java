/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: PixelConverter.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.converter;

import org.apache.commons.lang.StringUtils;

import javax.faces.application.FacesMessage;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.convert.Converter;
import javax.faces.convert.ConverterException;

/**
 * Converter for pixel conversion in the login dialog.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class PixelConverter implements Converter
{
    public Object getAsObject(FacesContext context, UIComponent component, String value) {
        if (StringUtils.isEmpty(value)) {
            return null;
        }

        try {
            return Integer.parseInt(StringUtils.removeEnd(value, "px"));
        } catch (NumberFormatException e) {
            throw new ConverterException(new FacesMessage(FacesMessage.SEVERITY_ERROR, "Wrong value: '" + value + "'", e.getLocalizedMessage()));
        }
    }

    public String getAsString(FacesContext context, UIComponent component, Object value) {
        if (value == null) {
            return null;
        }

        return String.valueOf(value) + "px";
    }
}
