# Mongo-Scraper-WSJ
The user can scrape news from Wall Street Journal by click on the Scrape button. They can save the articles of interest and add notes to them.

### Folder Structure
```
.
├── models
│   ├── Article.js
│   ├── index.js
│   └── Node.js
│
├── node_modules
│
├── package.json
│
├── public
│   ├── app.js
│   └── saved.js
│
├── routes
│   └── api-routes.js
│
├── server.js
│
└── views
    ├── index.handlebars
    ├── saved.handlebars
    └── layouts
        └── main.handlebars
```

### Required Node API/Packages
  * axios
  * body-parser
  * cheerio
  * express
  * express-handlebars
  * moment
  * mongojs
  * mongoose
  * morgan
  * request
