# About POI Mark 2

Show off Places of Interest (POI) by importing them from OpenStreetMap and styling them with HTML5 Canvas and CSS3.
Each Place will be connected to a record on MongoDB (through POI Dough) or CouchDB (through DataCouch).

Here are some visual effects available now:
<ul>
<li>Build on top of the best OpenStreetMap, Stamen, and MapBox map tiles</li>
<li>Explore and interact with the Leaflet.js maps API</li>
<li>Make buildings pop out of the map with a 3D effect</li>
<li>Choose textures for parks, farms, forests, and other areas.</li>
<li>Code new visualizations, such as <a href='http://poimark2.herokuapp.com/kansas?id=4fc578ff59e0840100000005'>crayon</a>, to apply to any building.</li>
</ul>

Different directions this could take:
<ul>
<li>Feeding geodata into MongoDB, with custom UI to query and visualize data</li>
<li>Visualizations based on OSM tags or other geodata</li>
<li>GitHub of procedural buildings, markers, etc</li>
<li>Realtime map layer using node: https://github.com/whichlight/nodejs-leaflet-eventstreams</li>
<li>Collaboration using node</li>
<li>Data check-out</li>
</ul>

3D Building with Roof, on MapQuest Open Tiles

<img src="http://i.imgur.com/Bb9Ed.png"/>

Generating the Crayon Visualization

<img src="http://i.imgur.com/GjFPU.png"/>

## Theory

### Old Model
The author uses the wealth of OpenStreetMap data as a background, then builds their own layer from scratch.
Participation by users is difficult to build into the system.

<img src="http://i.imgur.com/FOwFW.png"/>

### New Model
The author imports buildings, parks, and other places from OpenStreetMap to populate their map.
Users are invited to interact with the data available at each Place.
Authors can import a dataset from DataCouch to populate their map.

<img src="http://i.imgur.com/5aQ9p.png"/>

# About Poang Framework

## Poang - A sample node.js/MongoDB app for Heroku/MongoLab

Poang ([github](https://github.com/BeyondFog/Poang)) is a Node.js/MongoDB app built using the [Express](http://expressjs.com/) framework. Poang uses [Everyauth](http://everyauth.com/) for local authentication, [Mongoose-Auth](https://github.com/bnoguchi/mongoose-auth) to connect Everyauth to MongoDB (and [Mongoose](http://mongoosejs.com/) as the ODM) for account persistence, and [Connect-Mongo](https://github.com/kcbanner/connect-mongo) as a session store. Most of the code in app.js was generated by Express and all of the code in auth.js after the Comment schema is straight from the Mongoose-Auth docs.

For testing, Poang uses the [Mocha](http://visionmedia.github.com/mocha/) test framework, [should](https://github.com/visionmedia/should.js) for assertions, [Sinon.JS](http://sinonjs.org/) for mocks & stubs, and [Zombie.js](http://zombie.labnotes.org/) for lightweight integration testing.

For more details, please see Steve's [blog post](http://blog.beyondfog.com/?p=222) that walks through the various tests in Poang.

## Local Installation
 
1) Do a git clone:

    git clone git://git@github.com:mapmeld/POI-Mark2.git
    
2) cd into the project directory and then install the necessary node modules:

    npm install -d

3) start up MongoDB if it's not already running:
  
    mongod --noprealloc --nojournal
    
4) start the node process:

    node app.js

## Deploy to Heroku

After you have created a new app on Heroku and pushed the code via git, you will need to use the Heroku Toolbelt from your command line to add the free MongoLab starter addon:

    heroku addons:add mongolab:starter --app [your_app_name]
