/*jshint laxcomma:true */

/**
 * Module dependencies.
 */
var auth = require('./auth')
    , express = require('express')
    , mongoose = require('mongoose')
    , mongoose_auth = require('mongoose-auth')
    , mongoStore = require('connect-mongo')(express)
    , routes = require('./routes')
    , middleware = require('./middleware')

    , poimap = require('./poimap')
    , request = require('request');
    ;

var HOUR_IN_MILLISECONDS = 3600000;
var session_store;

var init = exports.init = function (config) {
  
  var db_uri = process.env.MONGOLAB_URI || process.env.MONGODB_URI || config.default_db_uri;

  mongoose.connect(db_uri);
  session_store = new mongoStore({url: db_uri});

  var app = express.createServer();

  app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { pretty: true });

    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(express.session({secret: 'top secret', store: session_store,
      cookie: {maxAge: HOUR_IN_MILLISECONDS}}));
    app.use(mongoose_auth.middleware());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);

  });

  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: false}));
  });
  
  // POI Dough Mark 2
  app.get('/editor', function(req,res) {
    poimap.POIMap.findOne({}, function(err, myEditMap){
      if(!err){
        res.render('poieditor', { poimap: myEditMap });
      }
    });
  });
  
  app.get('/savemap', function(req,res) {
    if(req.query["id"] != ""){
      poimap.POIMap.findById(params["id"], function(err, myEditMap){
        if(!err){
          res.render('poieditor', { poimap: myEditMap });
          myEditMap.updated = new Date();
          myEditMap.save(function (err) {
            if (!err){
              console.log('Success!');
            }
            else{
              console.log('Fail! ' + err);
            }
          });
        }
      });
    }
    else{
      myNewMap = new poimap.POIMap({
        buildings : params["bld"].split(","),
        parks : params["prk"].split(","),
        basemap : "http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png",
        createdby : "POI Dough Test",
        attribution : "Data &copy; 2012 OpenStreetMap, Tiles by MapQuest",
        updated : new Date()
      })
      myNewMap.save(function (err) {
        if (!err){
          console.log('Success!');
          res.redirect('/openmap/' + saved.ObjectId);
        }
        else{
          console.log('Fail! ' + err);
          res.send('Did not save');
        }
      });
    }
  });
  
  app.get('/osmbbox', function(req,res) {
    var bbox = req.query["bbox"];
    var osmurl = 'http://poidough.herokuapp.com/osmbbox/' + bbox;
    var requestOptions = {
      'uri': osmurl,
      'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'
    };
    request(requestOptions, function (err, response, body) {
      //res.send(body);
      res.send(body);
    });
/*

	while readex < gotdata.length
		line = gotdata[readex]
		if (line.index('<node') != nil) and (line.index('/>') == nil)
			# this node has tags! share it with all OSM services
			myid = line.slice( line.index('id=')+4 .. line.length )
			myid = myid.slice( 0 .. myid.index('"')-1 )
			mylat = line.slice( line.index('lat=')+5 .. line.length )
			mylat = mylat.slice( 0 .. mylat.index('"')-1 )
			mylon = line.slice( line.index('lon=')+5 .. line.length )
			mylon = mylon.slice( 0 .. mylon.index('"')-1 )
			myusr = line.slice( line.index('user=')+6 .. line.length )
			myusr = myusr.slice( 0 .. myusr.index('"')-1 )

			nodes[myid] = [ mylat, mylon ]

			# skip the preceding comma on the first node
			if isfirst == 0
				printout += ','
			else
				isfirst = 0
			end
			
			# write the basic node properties
			# possible issues with UTF-8? Try it on accented placenames
			printout += '{id:"' + myid + '",lat:'+mylat+',lon:'+mylon+',user:"'+myusr+'"'
			readex = readex + 1
			line = gotdata[readex]
			
			# import and write additional node keys and values
			while line.index('node>') == nil
				myk = line.slice( line.index('k="')+3 .. line.length )
				myk = myk.slice( 0 .. myk.index('"')-1 )
				myv = line.slice( line.index('v="')+3 .. line.length )
				myv = myv.slice( 0 .. myv.index('"')-1 )
				printout += ',"' + myk + '":"' + myv + '"'
				readex = readex + 1
				line = gotdata[readex]
			end
			printout += '}'

		elsif (line.index('<node') != nil) and (line.index('/>') != nil)
			# node without special properties, likely part of a way
			# store it in case called later
			myid = line.slice( line.index('id=')+4 .. line.length )
			myid = myid.slice( 0 .. myid.index('"')-1 )
			mylat = line.slice( line.index('lat=')+5 .. line.length )
			mylat = mylat.slice( 0 .. mylat.index('"')-1 )
			mylon = line.slice( line.index('lon=')+5 .. line.length )
			mylon = mylon.slice( 0 .. mylon.index('"')-1 )
			nodes[myid] = [ mylat, mylon ]

		elsif line.index('<way') != nil
			# store basic properties of a way
			wayid = line.slice( line.index('id=')+4 .. line.length )
			wayid = wayid.slice( 0 .. wayid.index('"')-1 )
			wayusr = line.slice( line.index('user=')+6 .. line.length )
			wayusr = wayusr.slice( 0 .. wayusr.index('"')-1 )
			wroteway = 0
			wrotenodes = 0
			readex = readex + 1
			line = gotdata[readex]
			while line.index('way>') == nil
				# if special=lines, print all of the known nodes making up the way
				if line.index('<nd ref="') != nil
					myid = line.slice( line.index('ref="')+5 .. line.length )
					myid = myid.slice( 0 .. myid.index('"')-1 )
					if nodes.has_key?(myid)
						if wroteway == 0
							wroteway = 1
							if isfirst == 0
								printout += ','
							else
								isfirst = 0
							end
							printout += '{wayid:"' + wayid + '",user:"'+myusr+'"'
						end
						if wrotenodes == 0
							printout += ',"line":['
							printout += '[' + nodes[myid].join(',') + ']'
							wrotenodes = 1
						else
							printout += ',[' + nodes[myid].join(',') + ']'
						end
					end
	
				# print keys and values for ways with this information
				elsif line.index('k="') != nil
					if wrotenodes == 1
						printout += ']'
						wrotenodes = 2
					elsif wroteway == 0
						wroteway = 1
						if isfirst == 0
							printout += ','
						else
							isfirst = 0
						end
						printout += '{wayid:"' + wayid + '",user:"'+wayusr+'"'
					end
					myk = line.slice( line.index('k="')+3 .. line.length )
					myk = myk.slice( 0 .. myk.index('"')-1 )
					myv = line.slice( line.index('v="')+3 .. line.length )
					myv = myv.slice( 0 .. myv.index('"')-1 )
					printout += ',"' + myk + '":"' + myv + '"'
				end
				readex = readex + 1
				line = gotdata[readex]
			end
			if wroteway == 1
				printout += '}'
			end
		end
		readex = readex + 1
	end
	printout += '])'
	printout
*/

  });
  
/* Sample Document Creation Script
  app.get('/rand', function(req,res) {
    try{
      var randmap = new poimap.POIMap();
      randmap.body = "sample";
      randmap.date = new Date();
      randmap.save(function (err) {
        if (!err){
          console.log('Success!');
        }
        else{
          console.log('Fail! ' + err);
        }
      });
      res.render('poieditor', { poimap: randmap });
    }
    catch(e){
    	return "Error " + e;
    }
    
  }); */

  app.get('/', function(req,res) {
    res.render('poihome', { title: "My Title", app_name: "Test App", comments: [ ] });
  });
  
  // Poang Routes

  app.get('/poang', middleware.require_auth_browser, routes.index);
  app.post('/poang/add_comment',middleware.require_auth_browser, routes.add_comment);
  
  // redirect all non-existent URLs to doesnotexist
  app.get('*', function onNonexistentURL(req,res) {
    res.render('doesnotexist',404);
  });

  mongoose_auth.helpExpress(app);

  return app;
};

// Don't run if require()'d
if (!module.parent) {
  var config = require('./config');
  var app = init(config);
  app.listen(process.env.PORT || 3000);
  console.info("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}