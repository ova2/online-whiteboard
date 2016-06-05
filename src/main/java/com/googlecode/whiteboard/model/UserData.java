/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: UserData.java 90 2011-09-27 15:24:29Z ovaraksin@gmail.com $$
*/

package com.googlecode.whiteboard.model;

import java.io.Serializable;

/**
 * Class keeping sender id and user name.
 *
 * @author ova / last modified by $Author: ovaraksin@gmail.com $
 * @version $Revision: 90 $
 */
public class UserData implements Serializable
{
    private static final long serialVersionUID = 20110506L;

    private String senderId;
    private String userName;

    public UserData(String senderId, String userName) {
        this.senderId = senderId;
        this.userName = userName.replace("'", "\\\'");
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }
}
