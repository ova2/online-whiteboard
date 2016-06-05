/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: TruncatedPositionable.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model.transfer;

/**
 * Container keeping only coordinates.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class TruncatedPositionable extends TruncatedElement
{
    private int x;
    private int y;

    public TruncatedPositionable(String uuid, String className, int x, int y) {
        super(uuid, className);
        this.x = x;
        this.y = y;
    }

    public int getX() {
        return x;
    }

    public void setX(int x) {
        this.x = x;
    }

    public int getY() {
        return y;
    }

    public void setY(int y) {
        this.y = y;
    }
}
