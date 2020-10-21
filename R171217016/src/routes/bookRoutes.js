var express = require('express');

var bookRouter = express.Router();

var router = function(nav){
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
bookRouter.route('/')
	.get(function(req, res){
		res.render('booksList', {
    	title: 'Books', 
    	nav: nav,
    	books: books
    	});
	});
bookRouter.route('/:id')
	.get(function(req, res){
		var id = req.params.id;
		res.render('bookView', {
    	title: 'Books', 
    	nav: nav,
    	book: books[id]
    	});
	});
	return bookRouter;
};



module.exports = router;