# Collaborative Online-Whiteboard with Server-Push Technologies

Port from https://code.google.com/archive/p/online-whiteboard/

## Description

Online-Whiteboard is a framework and academic web application built on top of the Raphaël / jQuery JavaScript libraries, Atmosphere framework and HTML5 WebSockets. Raphaël simplifies the work with vector graphics on the web. Chosen Server-Push frameworks exemplify real-time collaborations on basis different approaches and bidirectional protocols. The web front-end leverages JavaServer Faces and uses PrimeFaces as JSF component library. The application is cross-browser compatible and runs in any modern browsers.

By means of the collaborative Whiteboard you are able to draw shapes like rectangle, circle, ellipse, draw free, straight lines, input any text and paste images or predefined icons. Whiteboard's elements have editable properties like coordinates, color, width, height, scale factor, etc. They can be rearranged per drag-&-drop. Changes on the Whiteboard are propagated to all participants in real-time. Tracking of activities is possible via an event monitoring as well. You can also invite people to participate in existing Whiteboard's collaborations.

Online-Whiteboard is an open source project licensed under Apache License V2. You can use it completely free in open source or commercial projects following the terms of the license.

## Download and Setup

The last stable WAR files can be downloaded from the http://code.google.com/p/online-whiteboard/downloads/list They are executable. That means you can open your preferred console / terminal, go to the file location and type e.g.

```sh
java -jar whiteboard-long-polling.war
```

A small Java GUI will be started where you can push "Start" button to run corresponding web application. That's all. The web application will be opened in your default browser, but you can copy URL location and call it in any other browser.

## Install

The web application is provided with `jetty-maven-plugin`. If you have Maven installed, you can run the application with Jetty. Open your preferred console / terminal in the project root directory and type

```sh
mvn install
mvn jetty:run
```

This starts Jetty server and the project is available under the following URL in a web browser: http://localhost:8080/whiteboard-showcase

Jetty will continue to run until you stop it with a in the console / terminal window where it is running.