/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: WhiteboardsManager.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.controller;

import com.googlecode.whiteboard.model.Whiteboard;
import org.apache.commons.configuration.ConfigurationException;

import java.util.HashMap;
import java.util.Map;

/**
 * Managed bean for whiteboard management.
 * This bean is application scoped because whiteboards are session wide.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class WhiteboardsManager
{
    private Map<String, Whiteboard> whiteboards = new HashMap<String, Whiteboard>();
    //private int expiredTime;

    public WhiteboardsManager() throws ConfigurationException {
        //Configuration config = new PropertiesConfiguration("wb-configuration.properties");
        //expiredTime = config.getInt("whiteboard.expiredTime", 30);
    }

    public synchronized void addWhiteboard(Whiteboard whiteboard) {
        whiteboards.put(whiteboard.getUuid(), whiteboard);
    }

    public synchronized Whiteboard updateWhiteboard(Whiteboard whiteboard) {
        return whiteboards.put(whiteboard.getUuid(), whiteboard);
    }

    public synchronized void removeWhiteboard(Whiteboard whiteboard) {
        whiteboards.remove(whiteboard.getUuid());
    }

    public Whiteboard getWhiteboard(String uuid) {
        return whiteboards.get(uuid);
    }
}
