/**
 * Books main page route
 */ 
 const express = require('express');
 const router = express.Router();
 const Book = require("../models").Book;
 const { Op } = require("sequelize");
 /**
 * Handler function to wrap each route.
 * So that each router below are not written with try catch
 * over and over again.
 */
function asyncHandler(cb){
  return async(req, res, next) => {
      try {
          await cb(req, res, next)
      } catch(error){
              res.status(500).send(error);
          }
      }
  }
/* GET books list. */
router.get('/', paginatedResults(Book), asyncHandler(async (req, res) => {
  // res.json(res.paginatedResults );
  console.log(res.paginatedResults );
    // Renders the page with a tab title.
  res.render("books/index", { 
    booksProp: res.paginatedResults.results, 
    title: " I love books! ❤️ " ,
  });
}));
/* '/' redirects to '/books' */
/* GET create a new book form. */
router.get('/new', (req, res) => {
  res.render("books/new-book", { book: {}, title: "New Book" });
});
/* POST create book. */
router.post('/new', asyncHandler(async (req, res) => {
  /**
   * Creates rows.
   * create() requires an object with properties that map to the model attributes
   * defines in the Book.init().
   * The req.body property returns an object containing the key value pairs of data
   * submitted in the request. In other words, the form data or form inputs.
   * And then redirect to the book.id as a path.
   */  
  let book; // I can't use const due to SyntaxError. The variable could change values in try and in catch.
  try { 
    book = await Book.create(req.body); 
    res.redirect("/books/" + book.id);  
  } catch (error) {
    /**
     * If the error caught by catch is a SequelizeValidationError,
     * re-render the books/new view ("New Book" form)
     */
    if(error.name === "SequelizeValidationError") { 
      /**
       * Soft saves or returns a non-persistent model instance.
       * Data will get saved by create() method
       * once the user submits the form with a valid title.
       */ 
      book = await Book.build(req.body);
      res.render("books/new-book", { book, errorsProp: error.errors, title: "New Book" })
    } else {
        throw error; // error caught in the asyncHandler's catch block
      }     
    }
}));
/* GET individual book. */
router.get("/:id", asyncHandler(async (req, res) => {
  /**
   * Find book by id.
   * In Express Routes, route parameters are used to capture values specified in the URL path.
   * req.params returns parameters in the matched route.
   * The book variable, returned by findByPk, holds all the data for the book entry, like title, author, and body.
   */
  const book = await Book.findByPk(req.params.id);
  // Handles errors
  if(book) {
    res.render("books/show-book", { book, title: book.title });
  } else {
        res.status(404).render('./page-not-found');
      }  
}));
/* POST update a book. */
router.post('/:id', asyncHandler(async (req, res) => {
  /**
   * Steps cont... from edit book form.
   * 5. Retrieves the updated book by id.
   * 6. Awaits then shows the update book pages.
   */
  let book;
  try { 
      const book = await Book.findByPk(req.params.id);
      // Handles errors
      if(book) {
          await book.update(req.body);
          res.redirect("/books/" + book.id);
      } else {
            res.status(404).render('./page-not-found');
          }
  } catch(error) {
      if(error.name === "SequelizeValidationError") {
          book = await Book.build(req.body);
          // This ensures that the correct book is updated.
          book.id = req.params.id;
          res.render("books/update-book", { book, errorsProp: error.errors, title: "Update Book" })
      } else {
          throw error;
        }
    }
}));
/* GET edit book form. */
router.get("/:id/update-book", asyncHandler(async(req, res) => {
  /**
   * Steps:
   * 1. Find a book by id.
   * 2. Renders the individual book.
   * 3. Users edits the book and submits the change.
   * 4. Routes to Update a book.
   */
  const book = await Book.findByPk(req.params.id);
  // Handles errors
  if(book) {
    res.render("books/update-book", { book, title: "Update Book"});
  } else {
      res.status(404).render('./page-not-found');
    }
}));
/* GET delete book form. */
router.get("/:id/delete", asyncHandler(async (req, res) => {
  /**
   * Steps
   * 1. Retrieves book to delete by id.
   * 2. Renders the individual book.
   * 3. Routes to Delete individual book.
   */
  const book = await Book.findByPk(req.params.id);
  // Handles errors
  if(book) {
    res.render("books/delete-book", { book, title: "Delete Book" });
  } else {
      res.status(404).render('./page-not-found');
    }
}));
/* POST delete individual book. */
router.post('/:id/delete', asyncHandler(async (req ,res) => {
  /**
   * Steps cont... from delete book form.
   * 4. Retrieves book to destroy by id.
   * 5. Onces book to delete is destroyed,
   * 6. The page routs to the books page.
   */
  const book = await Book.findByPk(req.params.id);
  // Handles errors
  if(book) {
    await book.destroy();
    res.redirect("/books");
  } else {
      res.status(404).render('./page-not-found');
    }
}));
/**
 * Pagination sample functions from:
 * https://www.youtube.com/watch?v=ZX3qt0UWifc
 * and https://www.youtube.com/watch?v=QoI_F_Fj8Lo
 * I combined search.
 */ 
 function paginatedResults(model) {
  return async(req, res, next) => {

    let page = parseInt(req.query.page);
    const limit = 5;
    if (!page) {
      page = 1;
    }
  
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const search = req.query.search || "";
    // console.log(search);
    
    const { count, rows } = await model.findAndCountAll(
      {
        limit: limit,
        offset: startIndex,
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${ search }%`, }, },
            { author: { [Op.like]: `%${ search }%`, }, },
            { genre: { [Op.like]: `%${ search }%`, }, },
            { year: { [Op.like]: `%${ search }%`, }, },
          ],
        },
        order: [
          [ "id", "ASC" ]
        ]
      }
    );
  
    const numberOfPages = Math.ceil(count / limit);
    const results = {};
    let nextPage;
    let previousPage;
  
    if(endIndex < count) {
      nextPage = {
        page: page + 1,
      };
    }
  
    if(startIndex > 0) {
      previousPage = {
        page: page - 1,
      };
    }
  
    results.results = { count, rows, numberOfPages, page, nextPage, previousPage, search};
    res.paginatedResults = results;
    next();
  }
}

module.exports = router;
