var jsonProvider = new Object();

// produces an JavaScript object or array from an JSON text.
jsonProvider.fromJson = function(json) {
    var obj = JSON.parse(json);
    return makeTestable(obj);
};

// produces an JSON text from an JavaScript object or array
jsonProvider.toJson = function(object) {
    var obj = makeTestable(object);
    return JSON.stringify(obj);
};

function makeTestable(obj) {
    obj.getValue = function(property) {
        return this[property];
    };

    return obj;
}

// Test object
var circle = {
    uuid: "567e6162-3b6f-4ae2-a171-2470b63dff00",
    x: 10,
    y: 20,
    rotationDegree: 90,
    radius: 50,
    backgroundColor: "#FF0000",
    borderColor: "#DDDDDD",
    borderWidth: 1,
    borderStyle: "-",
    backgroundOpacity: 1.0,
    borderOpacity: 0.5,
    scaleFactor: 1.2
};
