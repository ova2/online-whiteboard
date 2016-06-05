/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: Whiteboard.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model;

import com.googlecode.whiteboard.model.base.AbstractElement;

import java.io.Serializable;
import java.util.*;

/**
 * Whiteboard model.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class Whiteboard implements Serializable
{
    private static final long serialVersionUID = 20110506L;

    private String uuid;
    private String title;
    private String creator;
    private String pubSubTransport;  // websocket, streaming, long-polling
    private int width = 800;
    private int height = 500;
    private Date creationDate = new Date();
    private Map<String, UserData> userData = new HashMap<String, UserData>();
    private Map<String, AbstractElement> elements = new LinkedHashMap<String, AbstractElement>();

    public Whiteboard() {
        uuid = UUID.randomUUID().toString();
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCreator() {
        return creator;
    }

    public void setCreator(String creator) {
        this.creator = creator;
    }

    public String getPubSubTransport() {
        return pubSubTransport;
    }

    public void setPubSubTransport(String pubSubTransport) {
        this.pubSubTransport = pubSubTransport;
    }

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

    public Date getCreationDate() {
        return creationDate;
    }

    public void setCreationDate(Date creationDate) {
        this.creationDate = creationDate;
    }

    public void addUserData(UserData userData) {
        this.userData.put(userData.getSenderId(), userData);
    }

    public Collection<UserData> getUserData() {
        return userData.values();
    }

    public UserData getUserData(String senderId) {
        return userData.get(senderId);
    }

    public Map<String, AbstractElement> getElements() {
        return elements;
    }

    public void setElements(Map<String, AbstractElement> elements) {
        this.elements = elements;
    }

    public synchronized void addElement(AbstractElement element) {
        elements.put(element.getUuid(), element);
    }

    public synchronized AbstractElement updateElement(AbstractElement element) {
        return elements.put(element.getUuid(), element);
    }

    public synchronized AbstractElement removeElement(AbstractElement element) {
        return elements.remove(element.getUuid());
    }

    public synchronized void clearElements() {
        elements.clear();
    }

    public AbstractElement getElement(String uuid) {
        return elements.get(uuid);
    }

    public int getCount() {
        return elements.size();
    }
}
