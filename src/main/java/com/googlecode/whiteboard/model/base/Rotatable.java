/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: Rotatable.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model.base;

/**
 * Base class of all rotatable elements.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public abstract class Rotatable extends AbstractElement
{
    private int rotationDegree;

    public int getRotationDegree() {
        return rotationDegree;
    }

    public void setRotationDegree(int rotationDegree) {
        this.rotationDegree = rotationDegree;
    }
}
