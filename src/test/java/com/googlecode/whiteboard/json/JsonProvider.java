/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: JsonProvider.java 37 2011-05-28 13:29:13Z ovaraksin@googlemail.com $$
*/

package com.googlecode.whiteboard.json;

public interface JsonProvider
{
    public Object fromJson(String json);

    public String toJson(Object object);
}
