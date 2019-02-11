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
    res.render('index', {
        csrfMeta: req.csrfToken(),
        title: 'News Scraper',
        subtitle: "All the News that's Fit to Scrape",
        indexRoute: true,
    });
});

router.get('/saved', (req, res) => {
    res.render('index', {
        csrfMeta: req.csrfToken(),
        title: 'News Scraper',
        subtitle: 'Your Saved Articles',
        savedRoute: true,
    });
});

module.exports = router;
