/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: TruncatedLine.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model.transfer;

/**
 * Container keeping only line path.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class TruncatedLine extends TruncatedElement
{
    private String path;

    public TruncatedLine(String uuid, String className, String path) {
        super(uuid, className);
        this.path = path;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
}
