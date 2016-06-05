/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: FontWeight.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model.attribute;

/**
 * Enum for font weights "normal" and "bold".
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public enum FontWeight
{
    Normal("normal"), Bold("bold");

    private String weight;

    FontWeight(String weight) {
        this.weight = weight;
    }

    public String getWeight() {
        return weight;
    }

    public static FontWeight getEnum(String weight) {
        for (FontWeight fw : FontWeight.values()) {
            if (fw.weight.equals(weight)) {
                return fw;
            }
        }

        return null;
    }
}
