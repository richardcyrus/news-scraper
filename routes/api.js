/**
 * news-scraper
 *
 * The Coding Boot Camp at UNC Charlotte.
 * (c) 2019 Richard Cyrus <hello@rcyrus.com>
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../models');
const appConfig = require('../config/app-config');
const debug = require('debug')('news-scraper:api-route');

/* GET /api/headlines */
router.get('/headlines', (req, res) => {
    const saved = req.query.saved;

    db.Article.find(
        { saved: saved },
        '_id headline url caption',
        { lean: true },
        (error, articles) => {
            if (error) {
                return res.status(500).json({
                    message: 'Error listing Headlines.',
                    error: error,
                });
            }

            if (!articles) {
                return res
                    .status(404)
                    .json({ message: 'There are no Headlines.' });
            }

            res.json(articles);
        }
    );
});

/* GET /api/fetch Scrape New Articles. */
router.get('/fetch', async (req, res) => {
    try {
        const response = await axios.get(appConfig.site.url);
        const $ = cheerio.load(response.data);
        const stories = [];

        // For the NYT Sections, capture the highlights.
        $('article h2').each((i, element) => {
            const story = {};
            const headline = $(element)
                .children('a')
                .text();

            /**
             * If the headline is empty, then we have captured items
             * we do not care to store or show.
             */
            if (headline !== '') {
                story.headline = headline;
                story.url = $(element)
                    .children('a')
                    .attr('href');
                // If the link URL does not start with the URL base, add it.
                if (!story.url.startsWith(appConfig.site.base)) {
                    story.url = appConfig.site.base + story.url;
                }
                story.caption = $(element)
                    .next('p')
                    .text();

                if (story.caption.length > 0) {
                    stories.push(story);
                }
            }
        });

        // For the NYT Sections, capture the 'Latest' stories.
        $('#stream-panel a').each((index, element) => {
            const story = {};
            const headline = $(element)
                .children('h2')
                .text();

            /**
             * If the headline is empty, then we have captured items
             * we do not care to store or show.
             */
            if (headline !== '') {
                story.headline = headline;
                story.url = $(element).attr('href');
                // If the link URL does not start with the URL base, add it.
                if (!story.url.startsWith(appConfig.site.base)) {
                    story.url = appConfig.site.base + story.url;
                }
                story.caption = $(element)
                    .children('p')
                    .text();

                if (story.caption.length > 0) {
                    stories.push(story);
                }
            }
        });

        // Once all stories have been captured, save them to the database.
        stories.forEach((story) => {
            db.Article.findOneAndUpdate(
                { headline: story.headline },
                { $set: story },
                {
                    new: true,
                    upsert: true, // Create if it does not exist.
                    runValidators: true, // Run update validators.
                    setDefaultsOnInsert: true, // Apply defaults if new record.
                    multipleCastError: true, // Aggregate all errors.
                },
                (error, doc) => {
                    if (error) {
                        return res.status(500).json({
                            message: 'Error saving fetched articles.',
                            errors: error,
                        });
                    }

                    debug('Inserted: %O', doc);
                }
            );
        });

        // Successfully scraped and saved/updated the articles.
        res.status(200).end();
    } catch (error) {
        return res.status(500).json({
            message: 'Error fetching articles.',
            error: error,
        });
    }
});

/* GET /api/clear Remove all articles. */
router.get('/clear', (req, res) => {
    db.Article.deleteMany({}, (error) => {
        if (error) {
            return res.status(500).json({
                message: 'Error removing all articles.',
                error: error,
            });
        }

        res.end();
    });
});

/* Patch /api/headlines/:id Flag the article as saved */
router.patch('/headlines/:id', (req, res) => {
    const id = req.params.id;

    db.Article.updateOne(
        { _id: id },
        { $set: { saved: true } },
        (error, raw) => {
            if (error) {
                return res.status(500).json({
                    saved: false,
                    message: 'Error marking headline as saved.',
                    error: error,
                });
            }

            debug('Patch::MarkArticleSaved:: %O', raw);

            res.json({ saved: true });
        }
    );
});

module.exports = router;
