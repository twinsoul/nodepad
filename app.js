
/**
 * Module dependencies.
 */

var express = require('express')
  , app = module.exports = express.createServer() 
  , routes = require('./routes')
  , mongoose = require('mongoose')
  , mongoStore = require('connect-mongodb')
  , db
  , User
  , Document;

function mongoStoreConnctionArgs() {
  return { dbname: db.connections[0].name,
           host: db.connections[0].db.serverConfig.host,
           port: db.connections[0].db.serverConfig.port,
           username: db.connections[0].user,
           password: db.connections[0].pass
  };
}

app.configure('development', function(){
//  app.use(express.logger());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
//  db = mongoose.connect('mongodb://localhost/nodepad-development')   
  app.set('db-uri', 'mongodb://localhost/nodepad-development');
});

app.configure('production', function(){
//  app.use(express.logger());
  app.use(express.errorHandler());
//  db = mongoose.connect('mongodb://localhost/nodepad-production')   
  app.set('db-uri', 'mongodb://localhost/nodepad-production');
});

app.configure('test', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
//  db = mongoose.connect('mongodb://localhost/nodepad-test')   
  app.set('db-uri', 'mongodb://localhost/nodepad-test');
});

db = mongoose.connect(app.set('db-uri'));

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
     secret: 'secret', 
     store: mongoStore(mongoStoreConnctionArgs())
  }));
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }))
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.Document = Document = require('./models.js').Document(db);
app.User = User = require('./models.js').User(db);

function loadUser(req, res, next) {
  console.log(req.session);
  if(req.session.user_id) {
    User.findById(req.session.user_id, function(err, user) {
      if(err) {
        console.log(err);
      } else {
        if(user) {
          req.currentUser = user;
          next();
        } else {
          res.redirect('/sessions/new');
        }
      }
    });
  } else {
    res.redirect('/sessions/new');
  }
};

// Routes
app.get('/', loadUser, function(req, res) {
  res.redirect('/documents');
});

// List (Document)
app.get('/documents.:format?', loadUser, function(req, res) {
  Document.find({}, [], {}, function(err, docs) {
    switch (req.params.format) {
      case 'json': 
        console.log('List <get> : /documents.:format? (json)');

        res.send(docs.map(function(d) {
          return d.__doc;
        }));
        break;
      default:
        console.log('List <get> : /documents.:format? (default)');
//      console.log('req.currentUser: ' + req.currentUser);

        res.render('documents/index.jade', {          
          locals: { documents: docs, currentUser: req.currentUser }
        });
    }
  });
});

// New (Document)
app.get('/documents/new', loadUser, function(req, res) {
  console.log('New <get> : /documents/new');

  res.render('documents/new.jade', {
    locals: { d: new Document(), currentUser: req.currentUser }
  });
});

// Edit (Document)
app.get('/documents/:id.:format?/edit', loadUser, function(req, res) {
  console.log('Edit <get> : /documents/:id.:format?/edit');

  Document.findById(req.params.id, function(err, doc) {
    res.render('documents/edit.jade', {
      locals: { d: doc, currentUser: req.currentUser}
    });
  });
});

// Create (Document)
app.post('/documents.:format?', loadUser, function(req, res) {
  var d = new Document(req.body.document);

  d.save(function(err) {
    if(err) {
      console.log(err);
    } else {
       switch (req.params.format) {
         case 'json':
           console.log('Create <post> : /documents.:format? (json)');

           res.send(d.__doc);
           break;

         default:
           console.log('Create <post> : /documents.:format? (default)');

           res.redirect('/documents');
       }
    }
  });
});

// Read (Document)
app.get('/documents/:id.:format?', loadUser, function(req, res) {
  Document.findById(req.params.id, function(err, doc) {
    console.log(doc);

    switch (req.params.format) {
      case 'json':
        console.log('Read <get> : /documents/:id.:format? (json)');         

        res.send(doc.__doc);
        break;

      default:
        console.log('Read <get> : /documents/:id.:format? (default)');

        res.render('documents/show.jade', {          
          locals : { d: doc, currentUser: req.currentUser }
        });
    }
  });
});

// Update (Document)
app.put('/documents/:id.:format?', loadUser, function(req, res) {
  Document.findById(req.body.document.id, function(err, doc) {  
    doc.title = req.body.document.title;
    doc.data = req.body.document.data;
    doc.save(function() {
      switch (req.params.format) {
        case 'json':
          console.log('Update <put> : /documents/:id.:format? (json)');
          
          res.send(d.__doc);
          break;
        default:
          res.redirect('/documents');
      }
    });
  });
});

// Delete (Document)
app.del('/documents/:id.:format?', loadUser, function(req, res) {
  Document.findById(req.params.id, function(err, doc) {
    doc.remove(function() {
      switch (req.params.format) {
        case 'json':
          console.log('Delete <del> : /documents/:id.:format? (json)');

          res.send('true');
          break;
        default:
          res.redirect('/documents');
      }
    });
  });
});

// New (Users)
app.get('/users/new', function(req, res) {
  console.log('New <get> : /users/new');

  res.render('users/new.jade', {
    locals: {user: new User()}
  });
});

// Create (Users)
app.post('/users.:format?', function(req, res) {
  var user = new User(req.body.user);

  function userSaved() {
    switch (req.params.format) {
      case 'json' :
        res.send(user.__doc);
        break;
      default :
        req.session.user_id = user.id;
        res.redirect('/documents');
    }
  }

  function userSaveFailed() {
    res.render('users/new.jade', { locals: { user: user } });
  }

  user.save(userSaved, userSaveFailed);
});


// New (Sessions)
app.get('/sessions/new', function(req, res) {
  console.log('New <get> : /sessions/new');

  res.render('sessions/new.jade', {
    locals: { user: new User() }
  });
}); 

// Create (Sessions)
app.post('/sessions', function(req, res) {
  console.log('Create <post> : /sessions');

  User.findOne({ email: req.body.user.email }, function(err, user) {
    if(user && user.authenticate(req.body.user.password)) {
      req.session.user_id = user.id;
      res.redirect('/documents');
    } else {
      res.redirect('/sessions/new');
    }
  });
});


// Delete (Sessions)
app.del('/sessions', loadUser, function(req, res) {
  if(req.session) {
    req.session.destroy(function() {});
  } 

  res.redirect('/sessions/new');
});

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// console.log(mongoStoreConnctionArgs());
