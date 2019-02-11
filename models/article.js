/**
 * news-scraper
 *
 * The Coding Boot Camp at UNC Charlotte.
 * (c) 2019 Richard Cyrus <hello@rcyrus.com>
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleSchema = new Schema({
    headline: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    caption: {
        type: String,
    },
    saved: {
        type: Boolean,
        default: false,
    },
    notes: [{ type: Schema.Types.ObjectId, ref: 'Note' }],
});

module.exports = mongoose.model('Article', articleSchema);
