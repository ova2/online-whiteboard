/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: Line.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model.base;

/**
 * Base class for free line {@link com.googlecode.whiteboard.model.element.FreeLine} and straight line {@link com.googlecode.whiteboard.model.element.StraightLine}.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public abstract class Line extends Rotatable
{
    private String path;
    private String color;
    private int lineWidth;
    private String lineStyle;
    private double opacity;

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public int getLineWidth() {
        return lineWidth;
    }

    public void setLineWidth(int lineWidth) {
        this.lineWidth = lineWidth;
    }

    public String getLineStyle() {
        return lineStyle;
    }

    public void setLineStyle(String lineStyle) {
        this.lineStyle = lineStyle;
    }

    public double getOpacity() {
        return opacity;
    }

    public void setOpacity(double opacity) {
        this.opacity = opacity;
    }
}
