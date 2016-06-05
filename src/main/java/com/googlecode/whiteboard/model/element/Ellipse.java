/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: Ellipse.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model.element;

import com.googlecode.whiteboard.model.base.Positionable;

import java.io.Serializable;

/**
 * Model class for ellipse element.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class Ellipse extends Positionable implements Serializable
{
    private static final long serialVersionUID = 20110506L;

    private int hRadius;
    private int vRadius;
    private String backgroundColor;
    private String borderColor;
    private int borderWidth;
    private String borderStyle;
    private double backgroundOpacity;
    private double borderOpacity;

    public int getHRadius() {
        return hRadius;
    }

    public void setHRadius(int hRadius) {
        this.hRadius = hRadius;
    }

    public int getVRadius() {
        return vRadius;
    }

    public void setVRadius(int vRadius) {
        this.vRadius = vRadius;
    }

    public String getBackgroundColor() {
        return backgroundColor;
    }

    public void setBackgroundColor(String backgroundColor) {
        this.backgroundColor = backgroundColor;
    }

    public String getBorderColor() {
        return borderColor;
    }

    public void setBorderColor(String borderColor) {
        this.borderColor = borderColor;
    }

    public int getBorderWidth() {
        return borderWidth;
    }

    public void setBorderWidth(int borderWidth) {
        this.borderWidth = borderWidth;
    }

    public String getBorderStyle() {
        return borderStyle;
    }

    public void setBorderStyle(String borderStyle) {
        this.borderStyle = borderStyle;
    }

    public double getBackgroundOpacity() {
        return backgroundOpacity;
    }

    public void setBackgroundOpacity(double backgroundOpacity) {
        this.backgroundOpacity = backgroundOpacity;
    }

    public double getBorderOpacity() {
        return borderOpacity;
    }

    public void setBorderOpacity(double borderOpacity) {
        this.borderOpacity = borderOpacity;
    }
}
