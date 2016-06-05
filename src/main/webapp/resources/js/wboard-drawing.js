/**
* @fileOverview
* @author <a href="mailto:ovaraksin@googlemail.com">Oleg Varaksin</a>
* @version 0.2
*/

/**
* Whiteboard designer class for element drawing.
* @class
* @param witeboardConfig whiteboard's configuration {@link WhiteboardConfig}
* @param whiteboardId whiteboard's id
* @param user user (user name) working with this whiteboard
* @param pubSubUrl URL for bidirectional communication
* @param pubSubTransport transport protocol "long-polling" | "streaming" | "websocket"
*/
WhiteboardDesigner = function(witeboardConfig, whiteboardId, user, pubSubUrl, pubSubTransport) {
    /**
     * Whiteboard's configuration {@link WhiteboardConfig}.
     * @public
     * @type WhiteboardConfig
     */
    this.config = witeboardConfig;
    /**
     * Whiteboard's id.
     * @public
     * @type uuid
     */    
    this.whiteboardId = whiteboardId;
    /**
     * User which works with this whiteboard.
     * @public
     * @type string
     */    
    this.user = user;
    /**
     * URL for bidirectional communication.
     * @public
     * @type string
     */    
    this.pubSubUrl = pubSubUrl;
    /**
     * Transport protocol "long-polling" | "streaming" | "websocket".
     * @public
     * @type string
     */    
    this.pubSubTransport = pubSubTransport;
    /**
     * Logging flag, true - logging is visible, false - otherwise.
     * @public
     * @type boolean
     */    
    this.logging = false;

    // create jQuery objects for whiteboard container and dialogs
    var whiteboard = jQuery("#" + this.config.ids.whiteboard);
    var dialogInputText = jQuery("#" + this.config.ids.dialogInputText);
    var dialogInputImage = jQuery("#" + this.config.ids.dialogInputImage);
    var dialogIcons = jQuery("#" + this.config.ids.dialogIcons);
    var dialogResize = jQuery("#" + this.config.ids.dialogResize);

    var offsetLeft = whiteboard.offset().left;
    var offsetTop = whiteboard.offset().top;

    var idSubviewProperties = "#pinnedSubview";
    var dragDropStart = false;
    var lastHoverObj = null;
    var selectedObj = null;
    var wbElements = {};
    var _self = this;

    jQuery.extend(whiteboard, {
        "lineEl": {"path": null, "pathArray": null},
        "imageEl": {"cx": 0, "cy": 0},
        "iconEl": {"cx": 0, "cy": 0},
        "textEl": {"cx": 0, "cy": 0}
    });

    /**
     * Action mode.
     * @private
     * @type object
     */
    var modeSwitcher = {
        "textMode": false,
        "freeLineMode": false,
        "straightLineMode": false,
        "rectangleMode": false,
        "circleMode": false,
        "ellipseMode": false,
        "imageMode": false,
        "iconMode": false,
        "selectMode": false,
        "moveMode": false,
        "bringFrontMode": false,
        "bringBackMode": false,
        "cloneMode": false,
        "removeMode": false,
        "clearMode": false,
        "resizeMode": false
    };

    /**
     * Raphael's canvas.
     * @private
     * @type Raphael's paper
     */    
    var paper = Raphael(this.config.ids.whiteboard, whiteboard.width(), whiteboard.height());

    // public access =======================

    /** Switches the mode if user selects any action (like "Input Text" or "Draw Circle").
    * @public
    * @param mode mode defined in the variable modeSwitcher.
    * @param cursor cursor type, e.g. "default", "move", "wait".
    */
    this.switchToMode = function(mode, cursor) {
        for (var name in modeSwitcher) {
            modeSwitcher[name] = false;
        }
        modeSwitcher[mode] = true;
        whiteboard.css("cursor", cursor);
    }

    /** Gets currently selected whiteboard element.
    * @public
    * @returns {Raphael's element} currently selected element
    */
    this.getSelectedObject = function() {
        return selectedObj;
    }

    /** Draws begin point of the free line and registers mouse handlers.
    * @public
    * @param x X-coordinate.
    * @param y Y-coordinate.
    */    
    this.drawFreeLineBegin = function(x, y) {
        whiteboard.lineEl.path = paper.path("M" + (x - offsetLeft) + "," + (y - offsetTop));
        setElementProperties(whiteboard.lineEl.path, this.config.properties.freeLine);
        whiteboard.bind("mousemove.mmu", mousemoveHandler);
        whiteboard.one("mouseup.mmu", mouseupHandler);
    }

    /** Draws begin point of the straight line and registers mouse handlers.
    * @public
    * @param x X-coordinate.
    * @param y Y-coordinate.
    */    
    this.drawStraightLineBegin = function(x, y) {
        whiteboard.lineEl.pathArray = [];
        whiteboard.lineEl.pathArray[0] = ["M", x - offsetLeft, y - offsetTop];
        whiteboard.lineEl.path = paper.path(whiteboard.lineEl.pathArray);
        setElementProperties(whiteboard.lineEl.path, this.config.properties.straightLine);
        whiteboard.bind("mousemove.mmu", mousemoveHandler);
        whiteboard.one("mouseup.mmu", mouseupHandler);
    }

    /** Draws text with default properties.
    * @public
    * @param x text message.
    */
    this.drawText = function(inputText) {
        if (inputText !== "") {
            var textElement = paper.text(whiteboard.textEl.cx, whiteboard.textEl.cy, inputText);
            var realTextProps = jQuery.extend({}, this.config.properties.text, {"text": inputText});
            setElementProperties(textElement, realTextProps);
            var hb = drawHelperBox(textElement, this.config.classTypes.text, this.config.properties.text.rotation, null, true, null);
            wbElements[hb.uuid] = hb;

            // send changes to server
            this.sendChanges({
                "action": "create",
                "element": {
                    "type": this.config.classTypes.text,
                    "properties": {
                        "uuid": hb.uuid,
                        "x": whiteboard.textEl.cx,
                        "y": whiteboard.textEl.cy,
                        "rotationDegree": this.config.properties.text.rotation,
                        "text": inputText,
                        "fontFamily": textElement.attr("font-family"),
                        "fontSize": textElement.attr("font-size"),
                        "fontWeight": textElement.attr("font-weight"),
                        "fontStyle": textElement.attr("font-style"),
                        "color": textElement.attr("fill")
                    }
                }
            });

            this.showProperties('editText');
            this.transferTextPropertiesToDialog(whiteboard.textEl.cx, whiteboard.textEl.cy, realTextProps);
        }
    }

    /** Draws image with default properties.
    * @public
    * @param inputUrl image URL.
    * @param width image width.
    * @param height image height.
    */    
    this.drawImage = function(inputUrl, width, height) {
        if (inputUrl !== "") {
            var imageElement = paper.image(inputUrl, whiteboard.imageEl.cx, whiteboard.imageEl.cy, width, height);
            var hb = drawHelperBox(imageElement, this.config.classTypes.image, this.config.properties.image.rotation, null, true, null);
            wbElements[hb.uuid] = hb;
            this.showProperties('editImage');

            // send changes to server
            this.sendChanges({
                "action": "create",
                "element": {
                    "type": this.config.classTypes.image,
                    "properties": {
                        "uuid": hb.uuid,
                        "x": whiteboard.imageEl.cx,
                        "y": whiteboard.imageEl.cy,
                        "rotationDegree": this.config.properties.image.rotation,
                        "url": inputUrl,
                        "width": width,
                        "height": height
                    }
                }
            });

            this.transferImagePropertiesToDialog(whiteboard.imageEl.cx, whiteboard.imageEl.cy, {
                "width": width,
                "height": height,
                "rotation": this.config.properties.image.rotation
            });
        }
    }

    /** Draws rectangle with default properties.
    * @public
    * @param x X-coordinate.
    * @param y Y-coordinate.
    */    
    this.drawRectangle = function(x, y) {
        var rectElement = paper.rect(x - offsetLeft, y - offsetTop, 160, 100, 0);
        rectElement.scale(1, 1);  // workaround for webkit based browsers
        setElementProperties(rectElement, this.config.properties.rectangle);
        var hb = drawHelperBox(rectElement, this.config.classTypes.rectangle, this.config.properties.rectangle.rotation, null, true, null);
        wbElements[hb.uuid] = hb;

        // send changes to server
        this.sendChanges({
            "action": "create",
            "element": {
                "type": this.config.classTypes.rectangle,
                "properties": {
                    "uuid": hb.uuid,
                    "x": x - offsetLeft,
                    "y": y - offsetTop,
                    "rotationDegree": this.config.properties.rectangle.rotation,
                    "width": rectElement.attr("width"),
                    "height": rectElement.attr("height"),
                    "cornerRadius": rectElement.attr("r"),
                    "backgroundColor": rectElement.attr("fill"),
                    "borderColor": rectElement.attr("stroke"),
                    "borderWidth": rectElement.attr("stroke-width"),
                    "borderStyle": getDasharrayValue(rectElement.attr("stroke-dasharray")),
                    "backgroundOpacity": rectElement.attr("fill-opacity"),
                    "borderOpacity": rectElement.attr("stroke-opacity")
                }
            }
        });

        this.showProperties('editRectangle');
        this.transferRectanglePropertiesToDialog(x - offsetLeft, y - offsetTop, this.config.properties.rectangle);
    }

    /** Draws circle with default properties.
    * @public
    * @param x X-coordinate.
    * @param y Y-coordinate.
    */      
    this.drawCircle = function(x, y) {
        var circleElement = paper.circle(x - offsetLeft, y - offsetTop, 70);
        circleElement.scale(1, 1);  // workaround for webkit based browsers
        setElementProperties(circleElement, this.config.properties.circle);
        var hb = drawHelperBox(circleElement, this.config.classTypes.circle, this.config.properties.circle.rotation, null, true, null);
        wbElements[hb.uuid] = hb;

        // send changes to server
        this.sendChanges({
            "action": "create",
            "element": {
                "type": this.config.classTypes.circle,
                "properties": {
                    "uuid": hb.uuid,
                    "x": x - offsetLeft,
                    "y": y - offsetTop,
                    "rotationDegree": this.config.properties.circle.rotation,
                    "radius": circleElement.attr("r"),
                    "backgroundColor": circleElement.attr("fill"),
                    "borderColor": circleElement.attr("stroke"),
                    "borderWidth": circleElement.attr("stroke-width"),
                    "borderStyle": getDasharrayValue(circleElement.attr("stroke-dasharray")),
                    "backgroundOpacity": circleElement.attr("fill-opacity"),
                    "borderOpacity": circleElement.attr("stroke-opacity")
                }
            }
        });

        this.showProperties('editCircle');
        this.transferCirclePropertiesToDialog(x - offsetLeft, y - offsetTop, this.config.properties.circle);
    }

    /** Draws ellipse with default properties.
    * @public
    * @param x X-coordinate.
    * @param y Y-coordinate.
    */      
    this.drawEllipse = function(x, y) {
        var ellipseElement = paper.ellipse(x - offsetLeft, y - offsetTop, 80, 50);
        ellipseElement.scale(1, 1);  // workaround for webkit based browsers
        setElementProperties(ellipseElement, this.config.properties.ellipse);
        var hb = drawHelperBox(ellipseElement, this.config.classTypes.ellipse, this.config.properties.ellipse.rotation, null, true, null);
        wbElements[hb.uuid] = hb;

        // send changes to server
        this.sendChanges({
            "action": "create",
            "element": {
                "type": this.config.classTypes.ellipse,
                "properties": {
                    "uuid": hb.uuid,
                    "x": x - offsetLeft,
                    "y": y - offsetTop,
                    "rotationDegree": this.config.properties.ellipse.rotation,
                    "hRadius": ellipseElement.attr("rx"),
                    "vRadius": ellipseElement.attr("ry"),
                    "backgroundColor": ellipseElement.attr("fill"),
                    "borderColor": ellipseElement.attr("stroke"),
                    "borderWidth": ellipseElement.attr("stroke-width"),
                    "borderStyle": getDasharrayValue(ellipseElement.attr("stroke-dasharray")),
                    "backgroundOpacity": ellipseElement.attr("fill-opacity"),
                    "borderOpacity": ellipseElement.attr("stroke-opacity")
                }
            }
        });

        this.showProperties('editEllipse');
        this.transferEllipsePropertiesToDialog(x - offsetLeft, y - offsetTop, this.config.properties.ellipse);
    }

    /** Selects an element if user clicks on it.
    * @public
    * @param helperBox helper rectangle around element to be selected.
    */      
    this.selectElement = function(helperBox) {
        helperBox.circleSet.attr(this.config.attributes.opacityVisible);
        if (selectedObj != null && selectedObj.uuid != helperBox.uuid) {
            // hide last selection
            selectedObj.attr(this.config.attributes.opacityHidden);
            selectedObj.circleSet.attr(this.config.attributes.opacityHidden);
        }
        selectedObj = helperBox;
        selectedObj.visibleSelect = true;
        this.showSelectedProperties(selectedObj);
    }

    /** Shows properties of the selected element in the panel "Edit Properties".
    * @public
    * @param selObj selected element.
    */    
    this.showSelectedProperties = function(selObj) {
        // show and fill properties
        this.showProperties('edit' + selObj.classType);
        this.transferPropertiesToDialog(selObj);
    }

    /** Transfer properties of the selected element to the panel "Edit Properties". Called from showSelectedProperties().
    * @public
    * @param selObj selected element.
    */    
    this.transferPropertiesToDialog = function(selObj) {
        var selectedProperties = getSelectedProperties(selObj.element, this.config.properties[selObj.classType.charAt(0).toLowerCase() + selObj.classType.slice(1)]);
        switch (selObj.classType) {
            case this.config.classTypes.text :
                this.transferTextPropertiesToDialog(selObj.element.attr("x"), selObj.element.attr("y"), selectedProperties);
                break;
            case this.config.classTypes.freeLine :
                this.transferFreeLinePropertiesToDialog(selectedProperties);
                break;
            case this.config.classTypes.straightLine :
                this.transferStraightLinePropertiesToDialog(selectedProperties);
                break;
            case this.config.classTypes.rectangle :
                this.transferRectanglePropertiesToDialog(selObj.element.attr("x"), selObj.element.attr("y"), selectedProperties);
                break;
            case this.config.classTypes.circle :
                this.transferCirclePropertiesToDialog(selObj.element.attr("cx"), selObj.element.attr("cy"), selectedProperties);
                break;
            case this.config.classTypes.ellipse :
                this.transferEllipsePropertiesToDialog(selObj.element.attr("cx"), selObj.element.attr("cy"), selectedProperties);
                break;
            case this.config.classTypes.image :
                this.transferImagePropertiesToDialog(selObj.element.attr("x"), selObj.element.attr("y"), selectedProperties);
                break;
            case this.config.classTypes.icon :
                selectedProperties["scale"] = parseFloat((selectedProperties["scale"] + '').split("\\s+")[0]);
                this.transferIconPropertiesToDialog(Math.round(selObj.attr("x") + 1), Math.round(selObj.attr("y") + 1), selectedProperties);
                break;
            default :
        }
    }

    /** Removes element.
    * @public
    * @param helperBox helper rectangle around element to be removed.
    */    
    this.removeElement = function(helperBox) {
        var eluuid = helperBox.uuid;
        var elclasstype = helperBox.classType;

        var removeSelected = false;
        if (selectedObj != null && selectedObj.uuid == eluuid) {
            removeSelected = true;
        }

        wbElements[eluuid] = null;
        delete wbElements[eluuid];
        helperBox.element.remove();
        helperBox.circleSet.remove();
        helperBox.remove();

        // send changes to server
        this.sendChanges({
            "action": "remove",
            "element": {
                "type": elclasstype,
                "properties": {
                    "uuid": eluuid
                }
            }
        });

        if (removeSelected) {
            // last selected object = this object ==> reset
            selectedObj = null;
            this.showProperties('editNoSelection');
        }
    }

    /** Brings element to front (over all other elements).
    * @public
    * @param helperBox helper rectangle around element.
    */     
    this.bringFrontElement = function(helperBox) {
        helperBox.element.toFront();
        helperBox.circleSet.toFront();
        helperBox.toFront();
        helperBox.attr(this.config.attributes.opacityHidden);

        // send changes to server
        this.sendChanges({
            "action": "toFront",
            "element": {
                "type": helperBox.classType,
                "properties": {
                    "uuid": helperBox.uuid
                }
            }
        });
    }

    /** Brings element to back (behind all other elements).
    * @public
    * @param helperBox helper rectangle around element.
    */     
    this.bringBackElement = function(helperBox) {
        helperBox.toBack();
        helperBox.circleSet.toBack();
        helperBox.element.toBack();
        helperBox.attr(this.config.attributes.opacityHidden);

        // send changes to server
        this.sendChanges({
            "action": "toBack",
            "element": {
                "type": helperBox.classType,
                "properties": {
                    "uuid": helperBox.uuid
                }
            }
        });
    }

    /** Clones element to back.
    * @public
    * @param helperBox helper rectangle around element to be cloned.
    */    
    this.cloneElement = function(helperBox) {
        var cloneEl, scaleFactor;
        if (helperBox.classType == this.config.classTypes.icon) {
            // workaround with scale factor
            scaleFactor = parseFloat((helperBox.element.attr("scale") + '').split("\\s+")[0]);
            helperBox.element.scale(1, 1);
            cloneEl = helperBox.element.clone();
            helperBox.element.scale(scaleFactor, scaleFactor);
            cloneEl.scale(scaleFactor, scaleFactor);
        } else {
            cloneEl = helperBox.element.clone();
        }

        // shift clone
        cloneEl.translate(15, 15);

        var hb = drawHelperBox(cloneEl, helperBox.classType, null, null, false, null);
        if (helperBox.classType == this.config.classTypes.icon) {
            hb.iconName = helperBox.iconName;
        }

        var rotationDegree = cloneEl.attr("rotation");
        if (rotationDegree != 0) {
            var bbox = cloneEl.getBBox();
            var bboxWidth = parseFloat(bbox.width);
            var bboxHeight = parseFloat(bbox.height);
            hb.circleSet.rotate(rotationDegree, bbox.x + bboxWidth / 2, bbox.y + bboxHeight / 2, true);
            hb.rotate(rotationDegree, bbox.x + bboxWidth / 2, bbox.y + bboxHeight / 2, true);
        }

        helperBox.attr(this.config.attributes.opacityHidden);
        wbElements[hb.uuid] = hb;

        var objChanges = {
            "action": "clone",
            "element": {
                "type": hb.classType,
                "properties": {
                    "uuid": hb.uuid,
                    "rotationDegree": rotationDegree
                }
            }
        };

        switch (hb.classType) {
            case this.config.classTypes.text :
                objChanges.element.properties.x = cloneEl.attr("x");
                objChanges.element.properties.y = cloneEl.attr("y");
                objChanges.element.properties.text = cloneEl.attr("text");
                objChanges.element.properties.fontFamily = cloneEl.attr("font-family");
                objChanges.element.properties.fontSize = cloneEl.attr("font-size");
                objChanges.element.properties.fontWeight = cloneEl.attr("font-weight");
                objChanges.element.properties.fontStyle = cloneEl.attr("font-style");
                objChanges.element.properties.color = cloneEl.attr("fill");

                break;
            case this.config.classTypes.freeLine :
            case this.config.classTypes.straightLine :
                objChanges.element.properties.path = cloneEl.attr("path") + '';
                objChanges.element.properties.color = cloneEl.attr("stroke");
                objChanges.element.properties.lineWidth = cloneEl.attr("stroke-width");
                objChanges.element.properties.lineStyle = getDasharrayValue(cloneEl.attr("stroke-dasharray"));
                objChanges.element.properties.opacity = cloneEl.attr("stroke-opacity");

                break;
            case this.config.classTypes.rectangle :
                objChanges.element.properties.x = cloneEl.attr("x");
                objChanges.element.properties.y = cloneEl.attr("y");
                objChanges.element.properties.width = cloneEl.attr("width");
                objChanges.element.properties.height = cloneEl.attr("height");
                objChanges.element.properties.cornerRadius = cloneEl.attr("r");
                objChanges.element.properties.backgroundColor = cloneEl.attr("fill");
                objChanges.element.properties.borderColor = cloneEl.attr("stroke");
                objChanges.element.properties.borderWidth = cloneEl.attr("stroke-width");
                objChanges.element.properties.borderStyle = getDasharrayValue(cloneEl.attr("stroke-dasharray"));
                objChanges.element.properties.backgroundOpacity = cloneEl.attr("fill-opacity");
                objChanges.element.properties.borderOpacity = cloneEl.attr("stroke-opacity");

                break;
            case this.config.classTypes.circle :
                objChanges.element.properties.x = cloneEl.attr("cx");
                objChanges.element.properties.y = cloneEl.attr("cy");
                objChanges.element.properties.radius = cloneEl.attr("r");
                objChanges.element.properties.backgroundColor = cloneEl.attr("fill");
                objChanges.element.properties.borderColor = cloneEl.attr("stroke");
                objChanges.element.properties.borderWidth = cloneEl.attr("stroke-width");
                objChanges.element.properties.borderStyle = getDasharrayValue(cloneEl.attr("stroke-dasharray"));
                objChanges.element.properties.backgroundOpacity = cloneEl.attr("fill-opacity");
                objChanges.element.properties.borderOpacity = cloneEl.attr("stroke-opacity");

                break;
            case this.config.classTypes.ellipse :
                objChanges.element.properties.x = cloneEl.attr("cx");
                objChanges.element.properties.y = cloneEl.attr("cy");
                objChanges.element.properties.hRadius = cloneEl.attr("rx");
                objChanges.element.properties.vRadius = cloneEl.attr("ry");
                objChanges.element.properties.backgroundColor = cloneEl.attr("fill");
                objChanges.element.properties.borderColor = cloneEl.attr("stroke");
                objChanges.element.properties.borderWidth = cloneEl.attr("stroke-width");
                objChanges.element.properties.borderStyle = getDasharrayValue(cloneEl.attr("stroke-dasharray"));
                objChanges.element.properties.backgroundOpacity = cloneEl.attr("fill-opacity");
                objChanges.element.properties.borderOpacity = cloneEl.attr("stroke-opacity");

                break;
            case this.config.classTypes.image :
                objChanges.element.properties.x = cloneEl.attr("x");
                objChanges.element.properties.y = cloneEl.attr("y");
                objChanges.element.properties.url = cloneEl.attr("src");
                objChanges.element.properties.width = cloneEl.attr("width");
                objChanges.element.properties.height = cloneEl.attr("height");

                break;
            case this.config.classTypes.icon :
                objChanges.element.properties.x = Math.round(hb.attr("x") + 1);
                objChanges.element.properties.y = Math.round(hb.attr("y") + 1);
                objChanges.element.properties.name = hb.iconName;
                objChanges.element.properties.scaleFactor = scaleFactor;

                break;
            default :
        }

        this.sendChanges(objChanges);
    }

    /** Resizes this whiteboard.
    * @public
    * @param width new whiteboard width.
    * @param height new whiteboard height. 
    */    
    this.resizeWhiteboard = function(width, height) {
        whiteboard.css({width: width + 'px', height: height + 'px'});
        paper.setSize(width, height);

        // send changes to server
        this.sendChanges({
            "action": "resize",
            "parameters": {
                "width": width,
                "height": height
            }
        });
    }

    /** Open dialog to input a text.
    * @public
    * @param x X-coordinate where the text has to be input.
    * @param y Y-coordinate where the text has to be input.
    */    
    this.openTextDialog = function(x, y) {
        whiteboard.textEl.cx = x - offsetLeft;
        whiteboard.textEl.cy = y - offsetTop;
        dialogInputText.dialog("open");
    }

    /** Open dialog to paste an image.
    * @public
    * @param x X-coordinate where the image has to be pasted.
    * @param y Y-coordinate where the image has to be pasted.
    */    
    this.openImageDialog = function(x, y) {
        whiteboard.imageEl.cx = x - offsetLeft;
        whiteboard.imageEl.cy = y - offsetTop;
        dialogInputImage.dialog("open");
    }

    /** Open dialog to paste an icon.
    * @public
    * @param x X-coordinate where the icon has to be pasted.
    * @param y Y-coordinate where the icon has to be pasted.
    */    
    this.openIconsDialog = function(x, y) {
        whiteboard.iconEl.cx = x - offsetLeft;
        whiteboard.iconEl.cy = y - offsetTop;
        dialogIcons.dialog("open");
    }

    /** Opens dialog to resize the whiteboard.
    * @public
    */     
    this.openResizeDialog = function() {
        dialogResize.dialog("open");
    }

    /** Clears the whiteboard.
    * @public
    */     
    this.clearWhiteboard = function() {
        paper.clear();
        this.showProperties('editNoSelection');
        for (eluuid in wbElements) {
            wbElements[eluuid] = null;
            delete wbElements[eluuid];
        }

        // send changes to server
        this.sendChanges({
            "action": "clear"
        });
    }

    /** Enables / disables properties in the panel "Edit Properties" depends on action.
    * @public
    * @param showClass CSS class of the property block to be enabled. 
    */    
    this.showProperties = function(showClass) {
        var propsDialog = jQuery(".propertiesPanel");
        propsDialog.find(".editPanel").hide();
        propsDialog.find("." + showClass).show();
    }

    /** Sets Id of the subview - where pinned or unpinned panels are placed.
    * @public
    * @param id subview Id. 
    */    
    this.setIdSubviewProperties = function(id) {
        idSubviewProperties = id;
    }

    /** Transfers given text properties to the panel "Edit properties".
    * @public
    * @param cx X-coordinate of the text.
    * @param cy Y-coordinate of the text.
    * @param props property JavaScript object as key, value. 
    */    
    this.transferTextPropertiesToDialog = function(cx, cy, props) {
        jQuery(idSubviewProperties + "_textCx").val(cx);
        jQuery(idSubviewProperties + "_textCy").val(cy);
        jQuery(idSubviewProperties + "_textArea").val(props["text"]);        
        jQuery(idSubviewProperties + "_fontFamily option[value='" + props["font-family"] + "']").attr('selected', true);
        jQuery(idSubviewProperties + "_fontSize").val(props["font-size"]);
        jQuery("input[name='" + idSubviewProperties.substring(1) + "_fontWeight'][value='" + props["font-weight"] + "']").attr('checked', 'checked');
        jQuery("input[name='" + idSubviewProperties.substring(1) + "_fontStyle'][value='" + props["font-style"] + "']").attr('checked', 'checked');
        jQuery(idSubviewProperties + "_textColor div").css('backgroundColor', props["fill"]);
        jQuery(idSubviewProperties + "_textRotation").val(props["rotation"]);
    }

    /** Transfers free line properties to the panel "Edit properties".
    * @public
    * @param props property JavaScript object as key, value. 
    */    
    this.transferFreeLinePropertiesToDialog = function(props) {
        jQuery(idSubviewProperties + "_freeLineColor div").css('backgroundColor', props["stroke"]);
        jQuery(idSubviewProperties + "_freeLineWidth").val(props["stroke-width"]);
        jQuery(idSubviewProperties + "_freeLineStyle option[value='" + props["stroke-dasharray"] + "']").attr('selected', true);
        jQuery(idSubviewProperties + "_freeLineOpacity").val(props["stroke-opacity"].toFixed(1));
        jQuery(idSubviewProperties + "_freeLineRotation").val(props["rotation"]);
    }

    /** Transfers straight line properties to the panel "Edit properties".
    * @public
    * @param props property JavaScript object as key, value. 
    */    
    this.transferStraightLinePropertiesToDialog = function(props) {
        jQuery(idSubviewProperties + "_straightLineColor div").css('backgroundColor', props["stroke"]);
        jQuery(idSubviewProperties + "_straightLineWidth").val(props["stroke-width"]);
        jQuery(idSubviewProperties + "_straightLineStyle option[value='" + props["stroke-dasharray"] + "']").attr('selected', true);
        jQuery(idSubviewProperties + "_straightLineOpacity").val(props["stroke-opacity"].toFixed(1));
        jQuery(idSubviewProperties + "_straightLineRotation").val(props["rotation"]);
    }

    /** Transfers rectangle properties to the panel "Edit properties".
    * @public
    * @param cx X-coordinate of the rectangle.
    * @param cy Y-coordinate of the rectangle.
    * @param props property JavaScript object as key, value. 
    */    
    this.transferRectanglePropertiesToDialog = function(cx, cy, props) {
        jQuery(idSubviewProperties + "_rectCx").val(cx);
        jQuery(idSubviewProperties + "_rectCy").val(cy);
        jQuery(idSubviewProperties + "_rectWidth").val(props["width"]);
        jQuery(idSubviewProperties + "_rectHeight").val(props["height"]);
        jQuery(idSubviewProperties + "_cornerRadius").val(props["r"]);
        jQuery(idSubviewProperties + "_rectBkgrColor div").css('backgroundColor', props["fill"]);
        jQuery(idSubviewProperties + "_rectBorderColor div").css('backgroundColor', props["stroke"]);
        jQuery(idSubviewProperties + "_rectBorderWidth").val(props["stroke-width"]);
        jQuery(idSubviewProperties + "_rectBorderStyle option[value='" + props["stroke-dasharray"] + "']").attr('selected', true);
        jQuery(idSubviewProperties + "_rectBkgrOpacity").val(props["fill-opacity"].toFixed(1));
        jQuery(idSubviewProperties + "_rectBorderOpacity").val(props["stroke-opacity"].toFixed(1));
        jQuery(idSubviewProperties + "_rectRotation").val(props["rotation"]);
    }

    /** Transfers circle properties to the panel "Edit properties".
    * @public
    * @param cx X-coordinate of the circle.
    * @param cy Y-coordinate of the circle.
    * @param props property JavaScript object as key, value. 
    */     
    this.transferCirclePropertiesToDialog = function(cx, cy, props) {
        jQuery(idSubviewProperties + "_circleCx").val(cx);
        jQuery(idSubviewProperties + "_circleCy").val(cy);
        jQuery(idSubviewProperties + "_radius").val(props["r"]);
        jQuery(idSubviewProperties + "_circleBkgrColor div").css('backgroundColor', props["fill"]);
        jQuery(idSubviewProperties + "_circleBorderColor div").css('backgroundColor', props["stroke"]);
        jQuery(idSubviewProperties + "_circleBorderWidth").val(props["stroke-width"]);
        jQuery(idSubviewProperties + "_circleBorderStyle option[value='" + props["stroke-dasharray"] + "']").attr('selected', true);
        jQuery(idSubviewProperties + "_circleBkgrOpacity").val(props["fill-opacity"].toFixed(1));
        jQuery(idSubviewProperties + "_circleBorderOpacity").val(props["stroke-opacity"].toFixed(1));
        jQuery(idSubviewProperties + "_circleRotation").val(props["rotation"]);
    }

    /** Transfers ellipse properties to the panel "Edit properties".
    * @public
    * @param cx X-coordinate of the ellipse.
    * @param cy Y-coordinate of the ellipse.
    * @param props property JavaScript object as key, value. 
    */    
    this.transferEllipsePropertiesToDialog = function(cx, cy, props) {
        jQuery(idSubviewProperties + "_ellipseCx").val(cx);
        jQuery(idSubviewProperties + "_ellipseCy").val(cy);
        jQuery(idSubviewProperties + "_hRadius").val(props["rx"]);
        jQuery(idSubviewProperties + "_vRadius").val(props["ry"]);
        jQuery(idSubviewProperties + "_ellipseBkgrColor div").css('backgroundColor', props["fill"]);
        jQuery(idSubviewProperties + "_ellipseBorderColor div").css('backgroundColor', props["stroke"]);
        jQuery(idSubviewProperties + "_ellipseBorderWidth").val(props["stroke-width"]);
        jQuery(idSubviewProperties + "_ellipseBorderStyle option[value='" + props["stroke-dasharray"] + "']").attr('selected', true);
        jQuery(idSubviewProperties + "_ellipseBkgrOpacity").val(props["fill-opacity"].toFixed(1));
        jQuery(idSubviewProperties + "_ellipseBorderOpacity").val(props["stroke-opacity"].toFixed(1));
        jQuery(idSubviewProperties + "_ellipseRotation").val(props["rotation"]);
    }

    /** Transfers image properties to the panel "Edit properties".
    * @public
    * @param cx X-coordinate of the image.
    * @param cy Y-coordinate of the image.
    * @param props property JavaScript object as key, value. 
    */    
    this.transferImagePropertiesToDialog = function(cx, cy, props) {
        jQuery(idSubviewProperties + "_imageCx").val(cx);
        jQuery(idSubviewProperties + "_imageCy").val(cy);
        jQuery(idSubviewProperties + "_imageWidth").val(props["width"]);
        jQuery(idSubviewProperties + "_imageHeight").val(props["height"]);
        jQuery(idSubviewProperties + "_imageRotation").val(props["rotation"]);
    }

    /** Transfers icon properties to the panel "Edit properties".
    * @public
    * @param cx X-coordinate of the icon.
    * @param cy Y-coordinate of the icon.
    * @param props property JavaScript object as key, value. 
    */    
    this.transferIconPropertiesToDialog = function(cx, cy, props) {
        jQuery(idSubviewProperties + "_iconCx").val(cx);
        jQuery(idSubviewProperties + "_iconCy").val(cy);
        jQuery(idSubviewProperties + "_iconRotation").val(props["rotation"]);
        jQuery(idSubviewProperties + "_iconScale").val(props["scale"].toFixed(1));
    }

    /** Makes given properties as default (user push the button "Make as default").
    * @public
    * @param properties property JavaScript object as key, value. 
    */    
    this.makeAsDefault = function(properties) {
        var classType = properties.charAt(0).toUpperCase() + properties.slice(1);
        this.propagateProperties(classType, this.config.properties[properties]);
    }

    /** Gets properties from the panel "Edit Properties".
    * @public
    * @param classType element type.
    * @param props empty property JavaScript object as key, value.
    * @returns {object} filled property JavaScript object as key, value.
    */    
    this.propagateProperties = function(classType, props) {
        switch (classType) {
            case this.config.classTypes.text :
                props["text"] = jQuery(idSubviewProperties + "_textArea").val();   
                props["font-family"] = jQuery(idSubviewProperties + "_fontFamily option:selected").val();
                props["font-size"] = parseInt(jQuery(idSubviewProperties + "_fontSize").val());
                props["font-weight"] = jQuery("input[name='" + idSubviewProperties.substring(1) + "_fontWeight']:checked").val();
                props["font-style"] = jQuery("input[name='" + idSubviewProperties.substring(1) + "_fontStyle']:checked").val();
                props["fill"] = jQuery(idSubviewProperties + "_textColor div").css('backgroundColor');
                props["rotation"] = parseInt(jQuery(idSubviewProperties + "_textRotation").val());
                break;
            case this.config.classTypes.freeLine :
                props["stroke"] = jQuery(idSubviewProperties + "_freeLineColor div").css('backgroundColor');
                props["stroke-width"] = parseInt(jQuery(idSubviewProperties + "_freeLineWidth").val());
                props["stroke-dasharray"] = jQuery(idSubviewProperties + "_freeLineStyle option:selected").val();
                props["stroke-opacity"] = parseFloat(jQuery(idSubviewProperties + "_freeLineOpacity").val());
                props["rotation"] = parseInt(jQuery(idSubviewProperties + "_freeLineRotation").val());
                break;
            case this.config.classTypes.straightLine :
                props["stroke"] = jQuery(idSubviewProperties + "_straightLineColor div").css('backgroundColor');
                props["stroke-width"] = parseInt(jQuery(idSubviewProperties + "_straightLineWidth").val());
                props["stroke-dasharray"] = jQuery(idSubviewProperties + "_straightLineStyle option:selected").val();
                props["stroke-opacity"] = parseFloat(jQuery(idSubviewProperties + "_straightLineOpacity").val());
                props["rotation"] = parseInt(jQuery(idSubviewProperties + "_straightLineRotation").val());
                break;
            case this.config.classTypes.rectangle :
                props["width"] = parseInt(jQuery(idSubviewProperties + "_rectWidth").val());
                props["height"] = parseInt(jQuery(idSubviewProperties + "_rectHeight").val());
                props["r"] = parseInt(jQuery(idSubviewProperties + "_cornerRadius").val());
                props["fill"] = jQuery(idSubviewProperties + "_rectBkgrColor div").css('backgroundColor');
                props["stroke"] = jQuery(idSubviewProperties + "_rectBorderColor div").css('backgroundColor');
                props["stroke-width"] = parseInt(jQuery(idSubviewProperties + "_rectBorderWidth").val());
                props["stroke-dasharray"] = jQuery(idSubviewProperties + "_rectBorderStyle option:selected").val();
                props["fill-opacity"] = parseFloat(jQuery(idSubviewProperties + "_rectBkgrOpacity").val());
                props["stroke-opacity"] = parseFloat(jQuery(idSubviewProperties + "_rectBorderOpacity").val());
                props["rotation"] = parseInt(jQuery(idSubviewProperties + "_rectRotation").val());
                break;
            case this.config.classTypes.circle :
                props["r"] = parseInt(jQuery(idSubviewProperties + "_radius").val());
                props["fill"] = jQuery(idSubviewProperties + "_circleBkgrColor div").css('backgroundColor');
                props["stroke"] = jQuery(idSubviewProperties + "_circleBorderColor div").css('backgroundColor');
                props["stroke-width"] = parseInt(jQuery(idSubviewProperties + "_circleBorderWidth").val());
                props["stroke-dasharray"] = jQuery(idSubviewProperties + "_circleBorderStyle option:selected").val();
                props["fill-opacity"] = parseFloat(jQuery(idSubviewProperties + "_circleBkgrOpacity").val());
                props["stroke-opacity"] = parseFloat(jQuery(idSubviewProperties + "_circleBorderOpacity").val());
                props["rotation"] = parseInt(jQuery(idSubviewProperties + "_circleRotation").val());
                break;
            case this.config.classTypes.ellipse :
                props["rx"] = parseInt(jQuery(idSubviewProperties + "_hRadius").val());
                props["ry"] = parseInt(jQuery(idSubviewProperties + "_vRadius").val());
                props["fill"] = jQuery(idSubviewProperties + "_ellipseBkgrColor div").css('backgroundColor');
                props["stroke"] = jQuery(idSubviewProperties + "_ellipseBorderColor div").css('backgroundColor');
                props["stroke-width"] = parseInt(jQuery(idSubviewProperties + "_ellipseBorderWidth").val());
                props["stroke-dasharray"] = jQuery(idSubviewProperties + "_ellipseBorderStyle option:selected").val();
                props["fill-opacity"] = parseFloat(jQuery(idSubviewProperties + "_ellipseBkgrOpacity").val());
                props["stroke-opacity"] = parseFloat(jQuery(idSubviewProperties + "_ellipseBorderOpacity").val());
                props["rotation"] = parseInt(jQuery(idSubviewProperties + "_ellipseRotation").val());
                break;
            case this.config.classTypes.image :
                props["width"] = parseInt(jQuery(idSubviewProperties + "_imageWidth").val());
                props["height"] = parseInt(jQuery(idSubviewProperties + "_imageHeight").val());
                props["rotation"] = parseInt(jQuery(idSubviewProperties + "_imageRotation").val());
                break;
            case this.config.classTypes.icon :
                props["rotation"] = parseInt(jQuery(idSubviewProperties + "_iconRotation").val());
                props["scale"] = parseFloat(jQuery(idSubviewProperties + "_iconScale").val());
                break;
            default :
        }

        return props;
    }

    /** Restores the whiteboard if user has joined this whiteboard. All elements and a proper message gets restored.
    * @public
    * @param jsWhiteboard whiteboard in JSON format from backend (server side).
    */     
    this.restoreWhiteboard = function(jsWhiteboard) {
        var arrElements = jsWhiteboard["elements"];
        for (var i = 0; i < arrElements.length; i++) {
            var objElement = arrElements[i];
            this.createElement(objElement.properties, objElement.type);
        }

        prependMessage(jsWhiteboard["message"]);
    }

    /** Creates element.
    * @public
    * @param props element properties as JavaScript object (key, value). 
    * @param classType element type.
    */    
    this.createElement = function(props, classType) {
        var hb;
        switch (classType) {
            case this.config.classTypes.text :
                var textElement = paper.text(props.x, props.y, props.text);
                setElementProperties(textElement, {
                    "font-family" : props.fontFamily,
                    "font-size" : props.fontSize,
                    "font-weight" : props.fontWeight,
                    "font-style" : props.fontStyle,
                    "fill" : props.color
                });
                hb = drawHelperBox(textElement, this.config.classTypes.text, props.rotationDegree, null, false, props.uuid);
                wbElements[hb.uuid] = hb;

                break;
            case this.config.classTypes.freeLine :
                var freeLine = paper.path(props.path);
                setElementProperties(freeLine, {
                    "stroke" : props.color,
                    "stroke-width" : props.lineWidth,
                    "stroke-dasharray" : props.lineStyle,
                    "stroke-opacity" : props.opacity
                });
                hb = drawHelperBox(freeLine, this.config.classTypes.freeLine, props.rotationDegree, null, false, props.uuid);
                wbElements[hb.uuid] = hb;

                break;
            case this.config.classTypes.straightLine :
                var straightLine = paper.path(props.path);
                setElementProperties(straightLine, {
                    "stroke" : props.color,
                    "stroke-width" : props.lineWidth,
                    "stroke-dasharray" : props.lineStyle,
                    "stroke-opacity" : props.opacity
                });
                hb = drawHelperBox(straightLine, this.config.classTypes.straightLine, props.rotationDegree, null, false, props.uuid);
                wbElements[hb.uuid] = hb;

                break;
            case this.config.classTypes.rectangle :
                var rectElement = paper.rect(props.x, props.y, props.width, props.height, props.cornerRadius);
                rectElement.scale(1, 1);  // workaround for webkit based browsers
                setElementProperties(rectElement, {
                    "fill" : props.backgroundColor,
                    "stroke" : props.borderColor,
                    "stroke-width" : props.borderWidth,
                    "stroke-dasharray" : props.borderStyle,
                    "fill-opacity" : props.backgroundOpacity,
                    "stroke-opacity" : props.borderOpacity
                });
                hb = drawHelperBox(rectElement, this.config.classTypes.rectangle, props.rotationDegree, null, false, props.uuid);
                wbElements[hb.uuid] = hb;

                break;
            case this.config.classTypes.circle :
                var circleElement = paper.circle(props.x, props.y, props.radius);
                circleElement.scale(1, 1);  // workaround for webkit based browsers
                setElementProperties(circleElement, {
                    "fill" : props.backgroundColor,
                    "stroke" : props.borderColor,
                    "stroke-width" : props.borderWidth,
                    "stroke-dasharray" : props.borderStyle,
                    "fill-opacity" : props.backgroundOpacity,
                    "stroke-opacity" : props.borderOpacity
                });
                hb = drawHelperBox(circleElement, this.config.classTypes.circle, props.rotationDegree, null, false, props.uuid);
                wbElements[hb.uuid] = hb;

                break;
            case this.config.classTypes.ellipse :
                var ellipseElement = paper.ellipse(props.x, props.y, props.hRadius, props.vRadius);
                ellipseElement.scale(1, 1);  // workaround for webkit based browsers
                setElementProperties(ellipseElement, {
                    "fill" : props.backgroundColor,
                    "stroke" : props.borderColor,
                    "stroke-width" : props.borderWidth,
                    "stroke-dasharray" : props.borderStyle,
                    "fill-opacity" : props.backgroundOpacity,
                    "stroke-opacity" : props.borderOpacity
                });
                hb = drawHelperBox(ellipseElement, this.config.classTypes.ellipse, props.rotationDegree, null, false, props.uuid);
                wbElements[hb.uuid] = hb;

                break;
            case this.config.classTypes.image :
                var imageElement = paper.image(props.url, props.x, props.y, props.width, props.height);
                hb = drawHelperBox(imageElement, this.config.classTypes.image, props.rotationDegree, null, false, props.uuid);
                wbElements[hb.uuid] = hb;

                break;
            case this.config.classTypes.icon :
                var iconElement = paper.path(this.config.svgIconSet[props.name]).attr({fill: "#000", stroke: "none"});
                iconElement.scale(props.scaleFactor, props.scaleFactor);
                var bbox = iconElement.getBBox();
                // at first bring to 0,0 position after scale
                iconElement.translate(0 - bbox.x, 0 - bbox.y);
                // at second move to given position
                iconElement.translate(props.x, props.y);
                // and remains
                hb = drawHelperBox(iconElement, this.config.classTypes.icon, props.rotationDegree, null, false, props.uuid);
                hb.iconName = props.name;
                wbElements[hb.uuid] = hb;

                break;
            default :
        }
    }

    /** Sends changed properties of the currently selected element to the server (use case: user changes properties in the panel "Edit Properties").
    * @public
    * @param type element type. 
    * @param resize boolean flag, true - resize element, false - otherwise.
    * @param resize boolean flag, true - rotate element, false - otherwise. 
    */    
    this.sendPropertiesChanges = function(type, resize, rotate) {
        if (selectedObj == null) {
            return;
        }

        var classType = type.charAt(0).toUpperCase() + type.slice(1);
        var props = this.propagateProperties(classType, {});
        var rotationDegree = props["rotation"];
        var sendProps = {};
        var oldDim = {};

        // update element
        setElementProperties(selectedObj.element, props);

        // resize helpers
        if (resize != null && resize) {
            var bbox = selectedObj.element.getBBox();
            var bboxWidth = parseFloat(bbox.width);
            var bboxHeight = parseFloat(bbox.height);
            selectedObj.attr("x", bbox.x - 1);
            selectedObj.attr("y", bbox.y - 1);
            selectedObj.attr("width", (bboxWidth !== 0 ? bboxWidth + 2 : 3));
            selectedObj.attr("height", (bboxHeight !== 0 ? bboxHeight + 2 : 3));

            // redraw circleSet
            selectedObj.circleSet.remove();
            selectedObj.circleSet = null;
            delete selectedObj.circleSet;
            var circleSet = drawCircleSet(bbox.x, bbox.y, bboxWidth, bboxHeight);
            circleSet.attr(this.config.attributes.circleSet);
            if (selectedObj.visibleSelect) {
                circleSet.attr(this.config.attributes.opacityVisible);
            }
            selectedObj.circleSet = circleSet;
            rotate = true;
        }

        // rotate
        if (rotate != null && rotate) {
            var bbox2 = selectedObj.element.getBBox();
            var bboxWidth2 = parseFloat(bbox2.width);
            var bboxHeight2 = parseFloat(bbox2.height);
            selectedObj.element.rotate(rotationDegree, bbox2.x + bboxWidth2 / 2, bbox2.y + bboxHeight2 / 2, true);
            selectedObj.rotate(rotationDegree, bbox2.x + bboxWidth2 / 2, bbox2.y + bboxHeight2 / 2, true);
            selectedObj.circleSet.rotate(rotationDegree, bbox2.x + bboxWidth2 / 2, bbox2.y + bboxHeight2 / 2, true);
            selectedObj.element.attr("rotation", rotationDegree);
        }

        // extend properties to coordinates
        switch (classType) {
            case this.config.classTypes.text :
                sendProps.text = props["text"];
                sendProps.fontFamily = props["font-family"];
                sendProps.fontSize = props["font-size"];
                sendProps.fontWeight = props["font-weight"];
                sendProps.fontStyle = props["font-style"];
                sendProps.color = props["fill"];

                sendProps.x = parseInt(jQuery(idSubviewProperties + "_textCx").val());
                sendProps.y = parseInt(jQuery(idSubviewProperties + "_textCy").val());
                oldDim.x = selectedObj.element.attr("x");
                oldDim.y = selectedObj.element.attr("y");

                break;
            case this.config.classTypes.freeLine :
            case this.config.classTypes.straightLine :
                sendProps.path = selectedObj.element.attr("path") + '';
                sendProps.color = props["stroke"];
                sendProps.lineWidth = props["stroke-width"];
                sendProps.lineStyle = props["stroke-dasharray"];
                sendProps.opacity = props["stroke-opacity"];

                break;
            case this.config.classTypes.rectangle :
                sendProps.width = props["width"];
                sendProps.height = props["height"];
                sendProps.cornerRadius = props["r"];
                sendProps.backgroundColor = props["fill"];
                sendProps.borderColor = props["stroke"];
                sendProps.borderWidth = props["stroke-width"];
                sendProps.borderStyle = props["stroke-dasharray"];
                sendProps.backgroundOpacity = props["fill-opacity"];
                sendProps.borderOpacity = props["stroke-opacity"];

                sendProps.x = parseInt(jQuery(idSubviewProperties + "_rectCx").val());
                sendProps.y = parseInt(jQuery(idSubviewProperties + "_rectCy").val());
                oldDim.x = selectedObj.element.attr("x");
                oldDim.y = selectedObj.element.attr("y");
                break;
            case this.config.classTypes.circle :
                sendProps.radius = props["r"];
                sendProps.backgroundColor = props["fill"];
                sendProps.borderColor = props["stroke"];
                sendProps.borderWidth = props["stroke-width"];
                sendProps.borderStyle = props["stroke-dasharray"];
                sendProps.backgroundOpacity = props["fill-opacity"];
                sendProps.borderOpacity = props["stroke-opacity"];

                sendProps.x = parseInt(jQuery(idSubviewProperties + "_circleCx").val());
                sendProps.y = parseInt(jQuery(idSubviewProperties + "_circleCy").val());
                oldDim.x = selectedObj.element.attr("cx");
                oldDim.y = selectedObj.element.attr("cy");
                break;
            case this.config.classTypes.ellipse :
                sendProps.hRadius = props["rx"];
                sendProps.vRadius = props["ry"];
                sendProps.backgroundColor = props["fill"];
                sendProps.borderColor = props["stroke"];
                sendProps.borderWidth = props["stroke-width"];
                sendProps.borderStyle = props["stroke-dasharray"];
                sendProps.backgroundOpacity = props["fill-opacity"];
                sendProps.borderOpacity = props["stroke-opacity"];

                sendProps.x = parseInt(jQuery(idSubviewProperties + "_ellipseCx").val());
                sendProps.y = parseInt(jQuery(idSubviewProperties + "_ellipseCy").val());
                oldDim.x = selectedObj.element.attr("cx");
                oldDim.y = selectedObj.element.attr("cy");
                break;
            case this.config.classTypes.image :
                sendProps.url = selectedObj.element.attr("src");
                sendProps.width = props["width"];
                sendProps.height = props["height"];

                sendProps.x = parseInt(jQuery(idSubviewProperties + "_imageCx").val());
                sendProps.y = parseInt(jQuery(idSubviewProperties + "_imageCy").val());
                oldDim.x = selectedObj.element.attr("x");
                oldDim.y = selectedObj.element.attr("y");
                break;
            case this.config.classTypes.icon :
                sendProps.name = selectedObj.iconName;
                sendProps.scaleFactor = props["scale"].toFixed(1);

                sendProps.x = parseInt(jQuery(idSubviewProperties + "_iconCx").val());
                sendProps.y = parseInt(jQuery(idSubviewProperties + "_iconCy").val());
                oldDim.x = Math.round(selectedObj.attr("x") + 1);
                oldDim.y = Math.round(selectedObj.attr("y") + 1);
                break;
            default :
        }

        // move element and helpers if needed
        if (typeof oldDim.x !== "undefined") {
            var diffX = sendProps.x - oldDim.x;
            var diffY = sendProps.y - oldDim.y;
            if (diffX != 0 || diffY != 0) {
                selectedObj.element.translate(diffX, diffY);
                selectedObj.translate(diffX, diffY);
                selectedObj.circleSet.translate(diffX, diffY);
            }
        }

        sendProps.uuid = selectedObj.uuid;
        sendProps.rotationDegree = rotationDegree;

        // send changes
        this.sendChanges({
            "action": "update",
            "element": {
                "type": classType,
                "properties": sendProps
            }
        });
    }

    /** Subscribes to bidirectional channel. This method will be called once the web-application is ready to use.
    * @public
    */     
    this.subscribePubSub = function() {
        jQuery.atmosphere.subscribe(this.pubSubUrl, this.pubSubCallback, jQuery.atmosphere.request = {
            transport: this.pubSubTransport,
            maxRequest: 100000000
        });
        this.connectedEndpoint = jQuery.atmosphere.response;
    }

    /** Callback method defined in subscribePubSub(). This method is always called when new data (updates) are available on server side. 
    * @public
    * @param response response object having state, status and sent data.
    */    
    this.pubSubCallback = function(response) {
        if (response.transport != 'polling' && response.state != 'connected' && response.state != 'closed' && response.status == 200) {
            var data = response.responseBody;
            if (data.length > 0) {
                if (_self.logging) {
                    logIncoming(data);
                }

                // convert to JavaScript object
                var jsData = JSON.parse(data);

                if (_self.logging) {
                    logProfile(jsData.timestamp);
                }

                var action = jsData.action;
                var sentProps = (jsData.element != null ? jsData.element.properties : null);

                switch (action) {
                    case "join" :
                        jQuery("#usersCount").html(jsData.parameters.usersCount);

                        break;
                    case "create" :
                    case "clone" :
                        _self.createElement(sentProps, jsData.element.type);

                        break;
                    case "update" :
                        // find element to be updated
                        var hbu = wbElements[sentProps.uuid];
                        if (hbu == null) {
                            // not found ==> nothing to do
                            if (_self.logging) {
                                logDebug("Element to be updated does not exist anymore in this Whiteboard");
                            }
                            break;
                        }

                        var props = {}, oldDimU = {}, newDimU = {};

                        switch (jsData.element.type) {
                            case _self.config.classTypes.text :
                                props["text"] = sentProps.text;
                                props["font-family"] = sentProps.fontFamily;
                                props["font-size"] = sentProps.fontSize;
                                props["font-weight"] = sentProps.fontWeight;
                                props["font-style"] = sentProps.fontStyle;
                                props["fill"] = sentProps.color;

                                newDimU.x = sentProps.x;
                                newDimU.y = sentProps.y;
                                oldDimU.x = hbu.element.attr("x");
                                oldDimU.y = hbu.element.attr("y");
                                break;
                            case _self.config.classTypes.freeLine :
                            case _self.config.classTypes.straightLine :
                                //props["path"] = sentProps.path;
                                props["stroke"] = sentProps.color;
                                props["stroke-width"] = sentProps.lineWidth;
                                props["stroke-dasharray"] = sentProps.lineStyle;
                                props["stroke-opacity"] = sentProps.opacity;
                                break;
                            case _self.config.classTypes.rectangle :
                                props["width"] = sentProps.width;
                                props["height"] = sentProps.height;
                                props["r"] = sentProps.cornerRadius;
                                props["fill"] = sentProps.backgroundColor;
                                props["stroke"] = sentProps.borderColor;
                                props["stroke-width"] = sentProps.borderWidth;
                                props["stroke-dasharray"] = sentProps.borderStyle;
                                props["fill-opacity"] = sentProps.backgroundOpacity;
                                props["stroke-opacity"] = sentProps.borderOpacity;

                                newDimU.x = sentProps.x;
                                newDimU.y = sentProps.y;
                                oldDimU.x = hbu.element.attr("x");
                                oldDimU.y = hbu.element.attr("y");
                                break;
                            case _self.config.classTypes.circle :
                                props["r"] = sentProps.radius;
                                props["fill"] = sentProps.backgroundColor;
                                props["stroke"] = sentProps.borderColor;
                                props["stroke-width"] = sentProps.borderWidth;
                                props["stroke-dasharray"] = sentProps.borderStyle;
                                props["fill-opacity"] = sentProps.backgroundOpacity;
                                props["stroke-opacity"] = sentProps.borderOpacity;

                                newDimU.x = sentProps.x;
                                newDimU.y = sentProps.y;
                                oldDimU.x = hbu.element.attr("cx");
                                oldDimU.y = hbu.element.attr("cy");
                                break;
                            case _self.config.classTypes.ellipse :
                                props["rx"] = sentProps.hRadius;
                                props["ry"] = sentProps.vRadius;
                                props["fill"] = sentProps.backgroundColor;
                                props["stroke"] = sentProps.borderColor;
                                props["stroke-width"] = sentProps.borderWidth;
                                props["stroke-dasharray"] = sentProps.borderStyle;
                                props["fill-opacity"] = sentProps.backgroundOpacity;
                                props["stroke-opacity"] = sentProps.borderOpacity;

                                newDimU.x = sentProps.x;
                                newDimU.y = sentProps.y;
                                oldDimU.x = hbu.element.attr("cx");
                                oldDimU.y = hbu.element.attr("cy");
                                break;
                            case _self.config.classTypes.image :
                                //props["src"] = sentProps.url;
                                props["width"] = sentProps.width;
                                props["height"] = sentProps.height;

                                newDimU.x = sentProps.x;
                                newDimU.y = sentProps.y;
                                oldDimU.x = hbu.element.attr("x");
                                oldDimU.y = hbu.element.attr("y");
                                break;
                            case _self.config.classTypes.icon :
                                props["scale"] = sentProps.scaleFactor.toFixed(1);
                                hbu.iconName = sentProps.name;

                                newDimU.x = sentProps.x;
                                newDimU.y = sentProps.y;
                                break;
                            default :
                        }

                        props["rotation"] = sentProps.rotationDegree;

                        // update element
                        setElementProperties(hbu.element, props);

                        // resize helpers
                        var bbox = hbu.element.getBBox();
                        var bboxWidth = parseFloat(bbox.width);
                        var bboxHeight = parseFloat(bbox.height);
                        hbu.attr("x", bbox.x - 1);
                        hbu.attr("y", bbox.y - 1);
                        hbu.attr("width", (bboxWidth !== 0 ? bboxWidth + 2 : 3));
                        hbu.attr("height", (bboxHeight !== 0 ? bboxHeight + 2 : 3));

                        if (jsData.element.type == _self.config.classTypes.icon) {
                            oldDimU.x = Math.round(hbu.attr("x") + 1);
                            oldDimU.y = Math.round(hbu.attr("y") + 1);
                        }

                        // redraw circleSet
                        hbu.circleSet.remove();
                        hbu.circleSet = null;
                        delete hbu.circleSet;
                        var circleSet = drawCircleSet(bbox.x, bbox.y, bboxWidth, bboxHeight);
                        circleSet.attr(_self.config.attributes.circleSet);
                        if (selectedObj != null && selectedObj.visibleSelect && selectedObj.uuid == hbu.uuid) {
                            circleSet.attr(_self.config.attributes.opacityVisible);
                        }
                        hbu.circleSet = circleSet;

                        // rotate
                        hbu.element.rotate(props["rotation"], bbox.x + bboxWidth / 2, bbox.y + bboxHeight / 2, true);
                        hbu.rotate(props["rotation"], bbox.x + bboxWidth / 2, bbox.y + bboxHeight / 2, true);
                        hbu.circleSet.rotate(props["rotation"], bbox.x + bboxWidth / 2, bbox.y + bboxHeight / 2, true);
                        hbu.element.attr("rotation", props["rotation"]);

                        // move element and helpers if needed
                        if (typeof oldDimU.x !== "undefined") {
                            var diffXU = newDimU.x - oldDimU.x;
                            var diffYU = newDimU.y - oldDimU.y;
                            if (diffXU != 0 || diffYU != 0) {
                                hbu.element.translate(diffXU, diffYU);
                                hbu.translate(diffXU, diffYU);
                                hbu.circleSet.translate(diffXU, diffYU);
                            }
                        }

                        if (selectedObj != null && selectedObj.uuid == hbu.uuid) {
                            // transfer changes to dialog
                            _self.transferPropertiesToDialog(selectedObj);
                        }
                        break;
                    case "remove" :
                        // find element to be removed
                        var hbr = wbElements[sentProps.uuid];
                        if (hbr == null) {
                            // not found ==> nothing to do
                            if (_self.logging) {
                                logDebug("Element to be removed does not exist anymore in this Whiteboard");
                            }
                            break;
                        }

                        var eluuid = hbr.uuid;
                        var removeSelected = false;
                        if (selectedObj != null && selectedObj.uuid == eluuid) {
                            removeSelected = true;
                        }

                        wbElements[eluuid] = null;
                        delete wbElements[eluuid];
                        hbr.element.remove();
                        hbr.circleSet.remove();
                        hbr.remove();

                        if (removeSelected) {
                            selectedObj = null;
                            _self.showProperties('editNoSelection');
                        }
                        break;
                    case "move" :
                        // find element to be updated
                        var hbm = wbElements[sentProps.uuid];
                        if (hbm == null) {
                            // not found ==> nothing to do
                            if (_self.logging) {
                                logDebug("Element to be moved does not exist anymore in this Whiteboard");
                            }
                            break;
                        }

                        var oldDimM = {}, newDimM = {}, linePath = null;

                        switch (jsData.element.type) {
                            case _self.config.classTypes.text :
                                newDimM.x = sentProps.x;
                                newDimM.y = sentProps.y;
                                oldDimM.x = hbm.element.attr("x");
                                oldDimM.y = hbm.element.attr("y");
                                break;
                            case _self.config.classTypes.freeLine :
                            case _self.config.classTypes.straightLine :
                                linePath = sentProps.path;
                                break;
                            case _self.config.classTypes.rectangle :
                                newDimM.x = sentProps.x;
                                newDimM.y = sentProps.y;
                                oldDimM.x = hbm.element.attr("x");
                                oldDimM.y = hbm.element.attr("y");
                                break;
                            case _self.config.classTypes.circle :
                                newDimM.x = sentProps.x;
                                newDimM.y = sentProps.y;
                                oldDimM.x = hbm.element.attr("cx");
                                oldDimM.y = hbm.element.attr("cy");
                                break;
                            case _self.config.classTypes.ellipse :
                                newDimM.x = sentProps.x;
                                newDimM.y = sentProps.y;
                                oldDimM.x = hbm.element.attr("cx");
                                oldDimM.y = hbm.element.attr("cy");
                                break;
                            case _self.config.classTypes.image :
                                newDimM.x = sentProps.x;
                                newDimM.y = sentProps.y;
                                oldDimM.x = hbm.element.attr("x");
                                oldDimM.y = hbm.element.attr("y");
                                break;
                            case _self.config.classTypes.icon :
                                newDimM.x = sentProps.x;
                                newDimM.y = sentProps.y;
                                oldDimM.x = Math.round(hbm.attr("x") + 1);
                                oldDimM.y = Math.round(hbm.attr("y") + 1);
                                break;
                            default :
                        }

                        // move element and helpers if needed
                        if (typeof oldDimM.x !== "undefined") {
                            var diffXM = newDimM.x - oldDimM.x;
                            var diffYM = newDimM.y - oldDimM.y;
                            if (diffXM != 0 || diffYM != 0) {
                                hbm.element.translate(diffXM, diffYM);
                                hbm.translate(diffXM, diffYM);
                                hbm.circleSet.translate(diffXM, diffYM);

                                if (selectedObj != null && selectedObj.uuid == hbm.uuid) {
                                    // transfer changes to dialog
                                    _self.transferPropertiesToDialog(selectedObj);
                                }
                            }
                        }

                        // redraw line and helpers if line was moved
                        if (linePath != null) {
                            hbm.element.attr("path", linePath);

                            var bboxM = hbm.element.getBBox();
                            var bboxWidthM = parseFloat(bboxM.width);
                            var bboxHeightM = parseFloat(bboxM.height);
                            hbm.attr("x", bboxM.x - 1);
                            hbm.attr("y", bboxM.y - 1);
                            hbm.attr("width", (bboxWidthM !== 0 ? bboxWidthM + 2 : 3));
                            hbm.attr("height", (bboxHeightM !== 0 ? bboxHeightM + 2 : 3));

                            // redraw circleSet
                            hbm.circleSet.remove();
                            hbm.circleSet = null;
                            delete hbm.circleSet;
                            var circleSetM = drawCircleSet(bboxM.x, bboxM.y, bboxWidthM, bboxHeightM);
                            circleSetM.attr(_self.config.attributes.circleSet);
                            if (selectedObj != null && selectedObj.visibleSelect && selectedObj.uuid == hbm.uuid) {
                                circleSetM.attr(_self.config.attributes.opacityVisible);
                            }
                            hbm.circleSet = circleSetM;

                            // rotate
                            var rotation = hbm.element.attr("rotation");
                            hbm.rotate(rotation, bboxM.x + bboxWidthM / 2, bboxM.y + bboxHeightM / 2, true);
                            hbm.circleSet.rotate(rotation, bboxM.x + bboxWidthM / 2, bboxM.y + bboxHeightM / 2, true);
                        }
                        break;
                    case "toFront" :
                        // find element to be brought to top
                        var hbf = wbElements[sentProps.uuid];
                        if (hbf == null) {
                            // not found ==> nothing to do
                            if (_self.logging) {
                                logDebug("Element to be brought to front does not exist anymore in this Whiteboard");
                            }
                            break;
                        }

                        hbf.element.toFront();
                        hbf.circleSet.toFront();
                        hbf.toFront();
                        hbf.attr(_self.config.attributes.opacityHidden);
                        break;
                    case "toBack" :
                        // find element to be brought to back
                        var hbb = wbElements[sentProps.uuid];
                        if (hbb == null) {
                            // not found ==> nothing to do
                            if (_self.logging) {
                                logDebug("Element to be brought to back does not exist anymore in this Whiteboard");
                            }
                            break;
                        }

                        hbb.toBack();
                        hbb.circleSet.toBack();
                        hbb.element.toBack();
                        hbb.attr(_self.config.attributes.opacityHidden);
                        break;
                    case "clear" :
                        paper.clear();
                        _self.showProperties('editNoSelection');
                        for (eluuid in wbElements) {
                            wbElements[eluuid] = null;
                            delete wbElements[eluuid];
                        }
                        break;
                    case "resize" :
                        var width = jsData.parameters.width;
                        var height = jsData.parameters.height;
                        whiteboard.css({width: width + 'px', height: height + 'px'});
                        paper.setSize(parseInt(width), parseInt(height));
                        break;
                    default:
                }

                // show new message in the event monitoring pane
                prependMessage(jsData.message);
            }
        }
    }

    /** Sends a message if user has been joined the whiteboard. 
    * @public
    * @param usersCount current user count.
    */     
    this.joinUser = function(usersCount) {
        // send changes to server
        this.sendChanges({
            "action": "join",
            "parameters": {
                "usersCount": usersCount
            }
        });
    }

    /** Sends any changes on client side to the server (see actions). 
    * @public
    * @param jsObject changes as JavaScript object.
    */    
    this.sendChanges = function(jsObject) {
        // set timestamp
        var curDate = new Date();
        jsObject.timestamp = curDate.getTime() + curDate.getTimezoneOffset() * 60000;

        // set user
        jsObject.user = this.user;

        // set whiteboard Id
        jsObject.whiteboardId = this.whiteboardId;

        var outgoingMessage = JSON.stringify(jsObject);
        if (_self.logging) {
            logOutgoing(outgoingMessage);
        }

        // send changes to all subscribed clients
        this.connectedEndpoint.push(this.pubSubUrl, null, jQuery.atmosphere.request = {data: 'message=' + outgoingMessage});

        // set data in hidden field
        //jQuery("#transferedJsonData").val(JSON.stringify(jsObject));
        // send ajax request
        //transferJsonData();
    }

    // private access =======================

    // register handlers for drag & drop on element
    var ddStartEl = function () {
        if (!modeSwitcher.moveMode) {
            return false;
        }

        this.odx = 0;
        this.ody = 0;

        this.attr("cursor", "move");
        _self.dragDropStart = true;
    }

    var ddMoveEl = function (dx, dy) {
        if (!modeSwitcher.moveMode) {
            return false;
        }

        this.element.translate(dx - this.odx, dy - this.ody);
        this.translate(dx - this.odx, dy - this.ody);
        this.circleSet.translate(dx - this.odx, dy - this.ody);
        this.odx = dx;
        this.ody = dy;
    }

    var ddStopEl = function () {
        if (!modeSwitcher.moveMode) {
            return false;
        }

        if (lastHoverObj != null) {
            // overlapping ==> handle current overlapped element (hide / show helpers)
            if (selectedObj != null && selectedObj.uuid == this.uuid && selectedObj.visibleSelect) {
                this.attr(_self.config.attributes.selectBoxVisible);
                this.circleSet.attr(_self.config.attributes.opacityVisible);
            } else {
                this.attr(_self.config.attributes.opacityHidden);
            }
            this.attr("cursor", "default");

            // handle new element which overlapps the current one - show "move helper"
            lastHoverObj.circleSet.attr(_self.config.attributes.opacityHidden);
            lastHoverObj.attr(_self.config.attributes.moveBoxVisible);
            lastHoverObj.attr("cursor", "move");
            lastHoverObj = null;
        }

        _self.dragDropStart = false;

        var updatePropsDialog = (selectedObj != null && selectedObj.uuid == this.uuid);
        var objChanges = {
            "action": "move",
            "element": {
                "type": this.classType,
                "properties": {
                    "uuid": this.uuid
                }
            }
        };

        // show current coordinates in the properties dialog (if needed) and send changes to server
        switch (this.classType) {
            case _self.config.classTypes.text :
                objChanges.element.properties.x = this.element.attr("x");
                objChanges.element.properties.y = this.element.attr("y");
                _self.sendChanges(objChanges);

                if (updatePropsDialog) {
                    jQuery(idSubviewProperties + "_textCx").val(objChanges.element.properties.x);
                    jQuery(idSubviewProperties + "_textCy").val(objChanges.element.properties.y);
                }
                break;
            case _self.config.classTypes.freeLine :
            case _self.config.classTypes.straightLine :
                objChanges.element.properties.path = this.element.attr("path") + '';
                _self.sendChanges(objChanges);

                break;
            case _self.config.classTypes.rectangle :
                objChanges.element.properties.x = this.element.attr("x");
                objChanges.element.properties.y = this.element.attr("y");
                _self.sendChanges(objChanges);

                if (updatePropsDialog) {
                    jQuery(idSubviewProperties + "_rectCx").val(objChanges.element.properties.x);
                    jQuery(idSubviewProperties + "_rectCy").val(objChanges.element.properties.y);
                }
                break;
            case _self.config.classTypes.circle :
                objChanges.element.properties.x = this.element.attr("cx");
                objChanges.element.properties.y = this.element.attr("cy");
                _self.sendChanges(objChanges);

                if (updatePropsDialog) {
                    jQuery(idSubviewProperties + "_circleCx").val(objChanges.element.properties.x);
                    jQuery(idSubviewProperties + "_circleCy").val(objChanges.element.properties.y);
                }
                break;
            case _self.config.classTypes.ellipse :
                objChanges.element.properties.x = this.element.attr("cx");
                objChanges.element.properties.y = this.element.attr("cy");
                _self.sendChanges(objChanges);

                if (updatePropsDialog) {
                    jQuery(idSubviewProperties + "_ellipseCx").val(objChanges.element.properties.x);
                    jQuery(idSubviewProperties + "_ellipseCy").val(objChanges.element.properties.y);
                }
                break;
            case _self.config.classTypes.image :
                objChanges.element.properties.x = this.element.attr("x");
                objChanges.element.properties.y = this.element.attr("y");
                _self.sendChanges(objChanges);

                if (updatePropsDialog) {
                    jQuery(idSubviewProperties + "_imageCx").val(objChanges.element.properties.x);
                    jQuery(idSubviewProperties + "_imageCy").val(objChanges.element.properties.y);
                }
                break;
            case _self.config.classTypes.icon :
                objChanges.element.properties.x = Math.round(this.attr("x") + 1);
                objChanges.element.properties.y = Math.round(this.attr("y") + 1);
                _self.sendChanges(objChanges);

                if (updatePropsDialog) {
                    jQuery(idSubviewProperties + "_iconCx").val(objChanges.element.properties.x);
                    jQuery(idSubviewProperties + "_iconCy").val(objChanges.element.properties.y);
                }
                break;

            default :
        }
    }

    // register hover on element
    var hoverOverEl = function (event) {
        if (_self.dragDropStart) {
            lastHoverObj = this;
            return false;
        }

        if (modeSwitcher.selectMode) {
            this.attr(_self.config.attributes.selectBoxVisible);
            this.attr("cursor", "default");
            return true;
        }

        if (modeSwitcher.moveMode) {
            if (selectedObj != null && selectedObj.uuid == this.uuid) {
                this.circleSet.attr(_self.config.attributes.opacityHidden);
            }
            this.attr(_self.config.attributes.moveBoxVisible);
            this.attr("cursor", "move");
            return true;
        }

        if (modeSwitcher.removeMode) {
            if (selectedObj != null && selectedObj.uuid == this.uuid) {
                this.circleSet.attr(_self.config.attributes.opacityHidden);
            }
            this.attr(_self.config.attributes.removeBoxVisible);
            this.attr("cursor", "crosshair");
            return true;
        }

        if (modeSwitcher.bringFrontMode) {
            if (selectedObj != null && selectedObj.uuid == this.uuid) {
                this.circleSet.attr(_self.config.attributes.opacityHidden);
            }
            this.attr(_self.config.attributes.bringFrontBackBoxVisible);
            this.attr("cursor", "default");
            return true;
        }

        if (modeSwitcher.bringBackMode) {
            if (selectedObj != null && selectedObj.uuid == this.uuid) {
                this.circleSet.attr(_self.config.attributes.opacityHidden);
            }
            this.attr(_self.config.attributes.bringFrontBackBoxVisible);
            this.attr("cursor", "default");
            return true;
        }

        if (modeSwitcher.cloneMode) {
            if (selectedObj != null && selectedObj.uuid == this.uuid) {
                this.circleSet.attr(_self.config.attributes.opacityHidden);
            }
            this.attr(_self.config.attributes.cloneBoxVisible);
            this.attr("cursor", "default");
            return true;
        }

        this.attr("cursor", whiteboard.css("cursor"));
    }

    var hoverOutEl = function (event) {
        if (_self.dragDropStart) {
            lastHoverObj = null;
            return false;
        }

        if (modeSwitcher.selectMode) {
            if (selectedObj == null || selectedObj.uuid != this.uuid || !selectedObj.visibleSelect) {
                this.attr(_self.config.attributes.opacityHidden);
            }
            return true;
        }

        with (modeSwitcher) {
            if (moveMode || removeMode || bringFrontMode || bringBackMode || cloneMode) {
                if (selectedObj != null && selectedObj.uuid == this.uuid && selectedObj.visibleSelect) {
                    this.attr(_self.config.attributes.selectBoxVisible);
                    this.circleSet.attr(_self.config.attributes.opacityVisible);
                } else {
                    this.attr(_self.config.attributes.opacityHidden);
                }
                this.attr("cursor", "default");
                return true;
            }
        }
    }

    // register handler for click on element
    var clickEl = function(event) {
        if (modeSwitcher.selectMode) {
            _self.selectElement(this);
            return true;
        }

        if (modeSwitcher.removeMode) {
            _self.removeElement(this);
            return true;
        }

        if (modeSwitcher.bringFrontMode) {
            _self.bringFrontElement(this);
            return true;
        }

        if (modeSwitcher.bringBackMode) {
            _self.bringBackElement(this);
            return true;
        }

        if (modeSwitcher.cloneMode) {
            _self.cloneElement(this);
            return true;
        }

        return false;
    }

    // mousedown, mousemove and mouseup handlers on whiteboard
    var mousedownHandler = function (event) {
        if (modeSwitcher.freeLineMode) {
            _self.drawFreeLineBegin(event.pageX, event.pageY);
            return false;
        }

        if (modeSwitcher.straightLineMode) {
            _self.drawStraightLineBegin(event.pageX, event.pageY);
            return false;
        }

        return false;
    }

    var mousemoveHandler = function (event) {
        if (modeSwitcher.freeLineMode) {
            whiteboard.lineEl.path.attr("path", whiteboard.lineEl.path.attr("path") + "L" + (event.pageX - offsetLeft) + "," + (event.pageY - offsetTop));
            return true;
        }

        if (modeSwitcher.straightLineMode) {
            whiteboard.lineEl.pathArray[1] = ["L", event.pageX - offsetLeft, event.pageY - offsetTop];
            whiteboard.lineEl.path.attr("path", whiteboard.lineEl.pathArray);
            return true;
        }
    }

    var mouseupHandler = function () {
        whiteboard.unbind(".mmu");
        if (whiteboard.lineEl.path) {
            var classType, defProperties, dialogType, transferMethod;
            if (modeSwitcher.freeLineMode) {
                classType = _self.config.classTypes.freeLine;
                defProperties = _self.config.properties.freeLine;
                dialogType = "editFreeLine";
                transferMethod = "transferFreeLinePropertiesToDialog";
            } else {
                classType = _self.config.classTypes.straightLine;
                defProperties = _self.config.properties.straightLine;
                dialogType = "editStraightLine";
                transferMethod = "transferStraightLinePropertiesToDialog";
            }

            var hb = drawHelperBox(whiteboard.lineEl.path, classType, defProperties.rotation, null, true, null);
            wbElements[hb.uuid] = hb;

            // send changes to server
            _self.sendChanges({
                "action": "create",
                "element": {
                    "type": classType,
                    "properties": {
                        "uuid": hb.uuid,
                        "rotationDegree": defProperties.rotation,
                        "path": whiteboard.lineEl.path.attr("path") + '',
                        "color": whiteboard.lineEl.path.attr("stroke"),
                        "lineWidth": whiteboard.lineEl.path.attr("stroke-width"),
                        "lineStyle": getDasharrayValue(whiteboard.lineEl.path.attr("stroke-dasharray")),
                        "opacity": whiteboard.lineEl.path.attr("stroke-opacity")
                    }
                }
            });

            _self.showProperties(dialogType);
            _self[transferMethod](defProperties);

            // reset
            whiteboard.lineEl.path = null;
            whiteboard.lineEl.pathArray = null;
        }
    }

    // click handler on whiteboard
    var clickHandler = function(event) {
        if (modeSwitcher.rectangleMode) {
            _self.drawRectangle(event.pageX, event.pageY);
            return true;
        }

        if (modeSwitcher.circleMode) {
            _self.drawCircle(event.pageX, event.pageY);
            return true;
        }

        if (modeSwitcher.ellipseMode) {
            _self.drawEllipse(event.pageX, event.pageY);
            return true;
        }

        if (modeSwitcher.imageMode) {
            _self.openImageDialog(event.pageX, event.pageY);
            return true;
        }

        if (modeSwitcher.iconMode) {
            _self.openIconsDialog(event.pageX, event.pageY);
            return true;
        }

        if (modeSwitcher.textMode) {
            _self.openTextDialog(event.pageX, event.pageY);
            return true;
        }

        return false;
    }

    // mouseleave handler on whiteboard
    var mouseleaveHandler = function(event) {
        if (modeSwitcher.freeLineMode || modeSwitcher.straightLineMode) {
            mouseupHandler();
        }

        return false;
    }

    // draw helper shapes around the element
    var drawHelperBox = function(el, classType, rotation, scale, select, id) {
        // scale
        if (scale && scale != 1.0) {
            el.scale(scale, scale);
        }

        var bbox = el.getBBox();
        var bboxWidth = parseFloat(bbox.width);
        var bboxHeight = parseFloat(bbox.height);
        var helperRect = paper.rect(bbox.x - 1, bbox.y - 1, (bboxWidth !== 0 ? bboxWidth + 2 : 3), (bboxHeight !== 0 ? bboxHeight + 2 : 3));
        helperRect.attr(_self.config.attributes.helperRect);
        helperRect.hover(hoverOverEl, hoverOutEl);
        helperRect.click(clickEl);
        helperRect.drag(ddMoveEl, ddStartEl, ddStopEl);

        // draw invisible circles for possible later selection
        var circleSet = drawCircleSet(bbox.x, bbox.y, bboxWidth, bboxHeight);
        circleSet.attr(_self.config.attributes.circleSet);

        // rotate
        if (rotation && rotation != 0) {
            el.rotate(rotation, bbox.x + bboxWidth / 2, bbox.y + bboxHeight / 2, true);
            el.attr("rotation", parseInt(rotation));
            circleSet.rotate(rotation, bbox.x + bboxWidth / 2, bbox.y + bboxHeight / 2, true);
            helperRect.rotate(rotation, bbox.x + bboxWidth / 2, bbox.y + bboxHeight / 2, true);
        }

        // set references
        helperRect.element = el;
        helperRect.circleSet = circleSet;
        helperRect.classType = classType;
        if (id == null) {
            helperRect.uuid = uuid();
        } else {
            helperRect.uuid = id;
        }

        if (select) {
            if (selectedObj != null) {
                // hide last selection
                selectedObj.attr(_self.config.attributes.opacityHidden);
                selectedObj.circleSet.attr(_self.config.attributes.opacityHidden);
            }

            // set drawn element as selected
            selectedObj = helperRect;
            selectedObj.visibleSelect = false;
        }

        return helperRect;
    }

    // draw icons in the "choose icon" dialog
    var drawIcons = function() {
        var x = 0, y = 0;
        var fillStroke = {fill: "#000", stroke: "none"};
        var fillNone = {fill: "#000", opacity: 0};
        var fillHover = {fill: "90-#0050af-#002c62", stroke: "#FF0000"};
        var iconPaper = Raphael("iconsArea", 600, 360);
        var wbIcons = _self.config.svgIconSet;

        for (var name in wbIcons) {
            var curIcon = iconPaper.path(wbIcons[name]).attr(fillStroke).translate(x, y);
            curIcon.offsetX = x + 20;
            curIcon.offsetY = y + 20;
            var overlayIcon = iconPaper.rect(x, y, 40, 40).attr(fillNone);
            overlayIcon.icon = curIcon;
            overlayIcon.iconName = name;
            overlayIcon.click(function (event) {
                dialogIcons.dialog("close");
                var iconElement = paper.path(this.icon.attr("path")).attr(fillStroke).translate(whiteboard.iconEl.cx - this.icon.offsetX, whiteboard.iconEl.cy - this.icon.offsetY);
                var hb = drawHelperBox(iconElement, _self.config.classTypes.icon, _self.config.properties.icon.rotation, _self.config.properties.icon.scale, true, null);
                hb.iconName = this.iconName;
                wbElements[hb.uuid] = hb;

                // send changes to server
                var xC = Math.round(hb.attr("x") + 1);
                var yC = Math.round(hb.attr("y") + 1);
                _self.sendChanges({
                    "action": "create",
                    "element": {
                        "type": _self.config.classTypes.icon,
                        "properties": {
                            "uuid": hb.uuid,
                            "x": xC,
                            "y": yC,
                            "rotationDegree": _self.config.properties.icon.rotation,
                            "name": this.iconName,
                            "scaleFactor": _self.config.properties.icon.scale
                        }
                    }
                });

                _self.showProperties('editIcon');
                _self.transferIconPropertiesToDialog(xC, yC, {
                    "scale": _self.config.properties.icon.scale,
                    "rotation": _self.config.properties.icon.rotation
                });
                event.stopPropagation();
                event.preventDefault();
            }).hover(function () {
                this.icon.attr(fillHover);
            }, function () {
                this.icon.attr(fillStroke);
            });
            x += 40;
            if (x > 560) {
                x = 0;
                y += 40;
            }
        }
    }

    var drawCircleSet = function(x, y, width, height) {
        var c1 = paper.circle(x, y, 3);
        var c2 = paper.circle(x + width, y, 3);
        var c3 = paper.circle(x, y + height, 3);
        var c4 = paper.circle(x + width, y + height, 3);

        // build a set
        var circleSet = paper.set();
        circleSet.push(c1, c2, c3, c4);

        return circleSet;
    }

    var setElementProperties = function(el, propsObj) {
        for (prop in propsObj) {
            if (prop != "rotation") {
                if (prop == "stroke-dasharray") {
                    el.attr(prop, _self.config.dasharrayMapping[propsObj[prop]]);
                } else {
                    el.attr(prop, propsObj[prop]);
                }
            }
        }
    }

    var getSelectedProperties = function(el, propsObj) {
        var selectedProps = {};
        for (prop in propsObj) {
            if (prop == "stroke-dasharray") {
                selectedProps[prop] = getDasharrayValue(el.attr(prop));
            } else {
                selectedProps[prop] = el.attr(prop);
            }
        }

        return selectedProps;
    }

    var getDasharrayValue = function(label) {
        for (value in _self.config.dasharrayMapping) {
            if (label == _self.config.dasharrayMapping[value]) {
                return value;
            }
        }

        return "No";
    }

    var prependMessage = function(msg) {
        jQuery("<p style='margin: 2px 0 2px 0'>" + msg + "</p>").prependTo(".monitoringGroup");
    }

    var logIncoming = function(data) {
        log.info("INCOMING: " + data);
    }

    var logOutgoing = function(data) {
        log.warn("OUTGOING: " + data);
    }

    var logProfile = function(timestamp) {
        var curDate = new Date();
        log.profile("TIME BETWEEN BROADCASTING AND RECEIVING: " + (curDate.getTime() + curDate.getTimezoneOffset() * 60000 - timestamp) + " ms");
    }

    var logDebug = function(msg) {
        log.debug(msg);
    }

    // initialize whiteboard
    // 1. register handlers on whiteboard
    whiteboard.bind("click", clickHandler);
    whiteboard.bind("mousedown", mousedownHandler);
    whiteboard.bind("mouseleave", mouseleaveHandler);
    // 2. draw icons
    drawIcons();
}
