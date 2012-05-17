
/**
 * Module dependencies.
 */

var express = require('express')
  , app = module.exports = express.createServer() 
  , routes = require('./routes')
  , mongoose = require('mongoose')
  , db
  , Document;

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.logger());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  db = mongoose.connect('mongodb://localhost/nodepad-development')   
});

app.configure('production', function(){
  app.use(express.logger());
  app.use(express.errorHandler());
  db = mongoose.connect('mongodb://localhost/nodepad-production')   
});

app.configure('test', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  db = mongoose.connect('mongodb://localhost/nodepad-test')   
});

app.Document = Document = require('./models.js').Document(db);

               

// Routes

app.get('/', function(req, res) {
  res.redirect('/documents');
});


// List
app.get('/documents.:format?', function(req, res) {
  Document.find({}, [], {}, function(err, docs) {
    switch (req.params.format) {
      case 'json': 
        console.log('json ok');
        res.send(docs.map(function(d) {
          return d.__doc;
        }));
        break;
      default:
        console.log('default ok');
        res.render('documents/index.jade', {
          locals: { documents: docs }
        });
    }
  });
});

// New
app.get('/documents/new', function(req, res) {
  console.log('documents/new');

  res.render('documents/new.jade', {
    locals: { d: new Document() }
  });
});


// Edit
app.get('/documents/:id.:format?/edit', function(req, res) {
  console.log('/documents/:id.:format?/edit');

  Document.findById(req.params.id, function(err, doc) {
    res.render('documents/edit.jade', {
      locals: { d: doc}
    });
  });
});

// Create
app.post('/documents.:format?', function(req, res) {
  console.log('Create');
  
  var d = new Document(req.body.document);
  d.save(function() {
    switch (req.params.format) {
      case 'json':
        res.send(d.__doc);
        break;

      default:
        res.redirect('/documents');
    }
  });
});

// Read
app.get('/documents/:id.:format?', function(req, res) {
  console.log('Read');

  Document.findById(req.params.id, function(err, doc) {
    console.log(doc);
    switch (req.params.format) {
      case 'json':
        res.send(doc.__doc);
        break;

      default:
        res.render('documents/show.jade', {          
          locals : { d: doc }
        });
    }
  });
});

// Update
app.put('/documents/:id.:format?', function(req, res) {
  console.log('Update');

  Document.findById(req.body.document.id, function(err, doc) {  
    doc.title = req.body.document.title;
    doc.data = req.body.document.data;
    doc.save(function() {
      switch (req.params.format) {
        case 'json':
          res.send(d.__doc);
          break;
        default:
          res.redirect('/documents');
      }
    });
  });
});

// Delete
app.del('/documents/:id.:format?', function(req, res) {
  console.log('Delete');

  Document.findById(req.params.id, function(err, doc) {
    doc.remove(function() {
      switch (req.params.format) {
        case 'json':
          res.send('true');
          break;
        default:
          res.redirect('/documents');
      }
    });
  });
});




app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
