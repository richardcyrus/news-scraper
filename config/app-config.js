/**
 * news-scraper
 *
 * The Coding Boot Camp at UNC Charlotte.
 * (c) 2019 Richard Cyrus <hello@rcyrus.com>
 */

module.exports = {
    session: {
        secret: process.env.SESSION_SECRET,
    },
    mongodb: {
        uri: process.env.MONGODB_URI,
    },
    site: {
        url: 'https://www.nytimes.com/section/technology',
        base: 'https://www.nytimes.com',
    },
};
