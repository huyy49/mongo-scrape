// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var moment = require("moment");

// Scraping tools
var axios = require('axios');
var cheerio = require("cheerio");
var request = require("request");

// Require all models
var db = require("./models");

// Initialize Express
var PORT = process.env.PORT || 8000;

var app = express();

// Configure middleware
// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes
app.get('/', function (req, res) {
  db.Article.find({ isSaved: false }, function (err, data) {
    res.render('index', { articles: data });
  })
});

// A GET route for scraping Washington Post.
app.get("/scrape", function (req, res) {
  axios.get("https://www.washingtonpost.com/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    const $ = cheerio.load(response.data);
    // Grab every h2 within an article tag, and do the following:
    $("h2").each(function (i, element) {
      var title = $(element).find("a").text().trim();
      var link = $(element).find("a").attr("href");
      var snippet = $(element).siblings(".blurb").text().trim();
      var articleCreated = moment().format("YYYY MM DD hh:mm:ss");
      var result = {
        title: title,
        link: link,
        snippet: snippet,
        articleCreated: articleCreated,
        isSaved: false
      }
      console.log(result);

      if (result.headline !== '' && result.summary !== ''){
        db.Article.findOne({title: title}, function(err, data) {
          if(err){
            console.log(err)
          } else {
            if (data === null) {
            db.Article.create(result)
             .then(function(dbArticle) {
               console.log(dbArticle)
            })
            .catch(function(err) {
            // If an error occurred, send it to the client
            console.log(err)
            });
          }
          console.log(data)
          }
        });
        }
    });
  });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  db.Article
    .find({})
    .sort({ articleCreated: -1 })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  db.Article
    .findOne({ _id: req.params.id })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  db.Note
    .create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for saving/updating article to be saved
app.put("/saved/:id", function (req, res) {
  db.Article
    .findByIdAndUpdate({ _id: req.params.id }, { $set: { isSaved: true } })
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for getting saved article
app.get("/saved", function (req, res) {
  db.Article.find({ isSaved: true }, function (err, data) {
    res.render('saved', { articles: data });
  })
});

// Route for deleting/updating saved article
// app.put("/delete/:id", function (req, res) {
//   db.Article
//     .findByIdAndUpdate({ _id: req.params.id }, { $set: { isSaved: false } })
//     .then(function (dbArticle) {
//       res.json(dbArticle);
//     })
//     .catch(function (err) {
//       res.json(err);
//     });
// });

// delete article from database
app.delete("/articles/:id", function(req, res){
  // console.log('reqbody:' + JSON.stringify(req.params.id))
  db.Article.deleteOne({_id: req.params.id}, function(err, result){
    if (err) {
      console.log(err)
    } else {
      return res.send(true)
    }
  });
});

// clear all articles from database
app.get("/api/clear", function(req, res){
  console.log(req.body)
  db.Article.deleteMany({}, function(err, result){
    if (err) {
      console.log(err)
    } else {
      console.log(result)
      res.send(true)
    }
  })
});

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
