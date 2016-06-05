/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: TruncatedElement.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model.transfer;

import com.googlecode.whiteboard.model.base.AbstractElement;

/**
 * Base container for all truncated informations.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class TruncatedElement extends AbstractElement
{
    private String className;

    public TruncatedElement(String uuid, String className) {
        super(uuid);
        this.className = className;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }
}
