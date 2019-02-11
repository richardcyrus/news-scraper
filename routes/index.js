/**
 * news-scraper
 *
 * The Coding Boot Camp at UNC Charlotte.
 * (c) 2019 Richard Cyrus <hello@rcyrus.com>
 */

const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
    res.render('index', { csrfMeta: req.csrfToken(), title: 'News Scraper' });
});

module.exports = router;
