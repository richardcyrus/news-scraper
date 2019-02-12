/**
 * news-scraper
 *
 * The Coding Boot Camp at UNC Charlotte.
 * (c) 2019 Richard Cyrus <hello@rcyrus.com>
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new Schema({
    body: {
        type: String,
        required: true,
    },
    article: { type: Schema.Types.ObjectId, ref: 'Article' },
});

module.exports = mongoose.model('Note', noteSchema);
