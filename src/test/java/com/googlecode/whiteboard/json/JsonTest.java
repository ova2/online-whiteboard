/*
* @author  Oleg Varaksin (ovaraksin@googlemail.com)
* $$Id: JsonTest.java 56 2011-08-28 22:12:03Z ovaraksin@googlemail.com $$
*/

package com.googlecode.whiteboard.json;

import com.google.gson.Gson;
import com.googlecode.whiteboard.model.element.Circle;
import org.apache.commons.beanutils.PropertyUtils;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;

import javax.script.Invocable;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import java.io.FileNotFoundException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class JsonTest
{
    private static Gson gson;
    private static ScriptEngine engine;
    private static JsonProvider jsonProvider;

    @BeforeClass
    public static void runBeforeClass() {
        // create Gson
        gson = JsonConverter.getGson();

        // create a script engine manager
        ScriptEngineManager factory = new ScriptEngineManager();
        // create JavaScript engine
        engine = factory.getEngineByName("JavaScript");

        try {
            // evaluate JavaScript code from the json2 library and the test file
            engine.eval(new java.io.FileReader("src/main/webapp/resources/js/json2-min.js"));
            engine.eval(new java.io.FileReader("src/test/resources/js/jsonTest.js"));

            // get an implementation instance of the interface JsonProvider from the JavaScript engine,
            // all interface's methods are implemented by script methods of JavaScript object jsonProvider
            Invocable inv = (Invocable) engine;
            jsonProvider = inv.getInterface(engine.get("jsonProvider"), JsonProvider.class);
        } catch (ScriptException e) {
            e.printStackTrace();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }
    }

    @AfterClass
    public static void runAfterClass() {
        gson = null;
        jsonProvider = null;
    }

    @Test
    public void JavaScript2Java() {
        // get JavaScript object
        Object circle1 = engine.get("circle");

        // client-side: make JSON text from JavaScript object
        String json = jsonProvider.toJson(circle1);

        // server-side: convert JSON text to Java object
        Circle circle2 = gson.fromJson(json, Circle.class);

        // compare two objects
        testEquivalence(circle2, circle1);
    }

    @Test
    public void Java2JavaScript() {
        // create Java object
        Circle circle1 = new Circle();
        circle1.setUuid(UUID.randomUUID().toString());
        circle1.setX(100);
        circle1.setY(100);
        circle1.setRotationDegree(0);
        circle1.setRadius(250);
        circle1.setBackgroundColor("#FFFFFF");
        circle1.setBorderColor("#000000");
        circle1.setBorderWidth(3);
        circle1.setBorderStyle(".");
        circle1.setBackgroundOpacity(0.2);
        circle1.setBorderOpacity(0.8);

        // server-side: convert Java object to JSON text
        String json = gson.toJson(circle1);

        // client-side: make JavaScript object from JSON text
        Object circle2 = jsonProvider.fromJson(json);

        // compare two objects
        testEquivalence(circle1, circle2);
    }

    @SuppressWarnings("unchecked")
    private void testEquivalence(Object obj1, Object obj2) {
        try {
            Map<String, Object> map = PropertyUtils.describe(obj1);
            Set<String> fields = map.keySet();
            Invocable inv = (Invocable) engine;

            for (String key : fields) {
                Object value1 = map.get(key);
                if (!key.equals("class")) {
                    Object value2 = inv.invokeMethod(obj2, "getValue", key);
                    if (value1 instanceof Number && !(value1 instanceof Double)) {
                        // JS number is always converted to Java double ==> only doubles can be compared,
                        // see http://www.mozilla.org/js/liveconnect/lc3_method_overloading.html
                        value1 = new Double(value1.toString());
                    }

                    Assert.assertEquals("Value of property '" + key + "' was wrong converted", value2, value1);
                }
            }
        } catch (Exception e) {
            throw new IllegalStateException("Equivalence test of two objects failed!", e);
        }
    }
}
