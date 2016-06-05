/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: StrokeStyle.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model.attribute;

/**
 * Enum for font line styles.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public enum StrokeStyle
{
    No(""), Dash("-"), Dot("."), DashDot("-."), DashDotDot("-.."), DotBlank(". "), DashBlank("- "),
    DashDash("--"), DashBlankDot("- ."), DashDashDot("--."), DashDashDotDot("--..");

    private String style;

    StrokeStyle(String style) {
        this.style = style;
    }

    public String getStyle() {
        return style;
    }

    public static StrokeStyle getEnum(String style) {
        for (StrokeStyle ss : StrokeStyle.values()) {
            if (ss.style.equals(style)) {
                return ss;
            }
        }

        return null;
    }
}
