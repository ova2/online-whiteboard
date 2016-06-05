/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: Rectangle.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model.element;

import com.googlecode.whiteboard.model.base.Positionable;

import java.io.Serializable;

/**
 * Model class for rectangle element.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class Rectangle extends Positionable implements Serializable
{
    private static final long serialVersionUID = 20110506L;

    private int width;
    private int height;
    private int cornerRadius;
    private String backgroundColor;
    private String borderColor;
    private int borderWidth;
    private String borderStyle;
    private double backgroundOpacity;
    private double borderOpacity;

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int getCornerRadius() {
        return cornerRadius;
    }

    public void setCornerRadius(int cornerRadius) {
        this.cornerRadius = cornerRadius;
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
