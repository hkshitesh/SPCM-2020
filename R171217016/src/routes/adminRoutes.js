var express = require('express');
var adminRouter = express.Router();
var mongodb = require('mongodb').MongoClient;
var books = [{
			title: 'War and Peace', 
			author: 'Leo Tolstoy'
		},
		{
			title: 'The Catcher in the Rye',
			author: 'JD Salinger'
		},
		{
			title: '256 Shades of Grey',
			author: 'Marc White'
		},
		{
			title: 'The Giver',
			author: 'Lois Lowry'
		},
		{
			title: 'The Hunger Games',
			author: 'Suzanne Collins'
		}];


var router = function(nav){

	adminRouter.route('/addBooks')
		.get(function(req, res){
			var url = 'mondodb://27017/libraryApp';
			mongodb.connect(url, function(err, db){
				var collection = db.collection('books');
				collection.insertMany(books, function(err, results){
					res.send(results);
					db.close();
				});
			});
			// res.send('inserting books');
		});

	return adminRouter;
};

module.exports = router;