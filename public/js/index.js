/**
 * news-scraper front-end
 *
 * The Coding Boot Camp at UNC Charlotte.
 * (c) 2019 Richard Cyrus <hello@rcyrus.com>
 */

/* global jQuery */

(function($) {
    /* eslint-disable-next-line strict */
    'use strict';

    const articleContainer = $('.article-container');
    const scrapeButton = $('.scrape-new');
    const clearButton = $('.clear');

    // Register button click handlers/
    scrapeButton.on('click', askForArticles);
    articleContainer.on('click', '.scrape-new', askForArticles);
    articleContainer.on('click', '.save-article', saveArticle);
    clearButton.on('click', clearArticles);

    /**
     * Render an alert and a card with options, when there are no articles.
     */
    function renderEmpty() {
        const alertText = "Uh Oh. Looks like we don't have any articles.";
        const alertBox = $('<div/>')
            .addClass('alert alert-warning text-center')
            .append($('<h4/>').text(alertText));

        const cardHeaderText = 'What Would You Like To Do?';
        const cardHeader = $('<div/>')
            .addClass('card-header')
            .append(
                $('<h3/>')
                    .addClass('text-center')
                    .text(cardHeaderText)
            );

        const scrapeLink = $('<a/>')
            .addClass('scrape-new')
            .attr({ href: '#' })
            .text('Try Scraping New Articles');
        const savedLink = $('<a/>')
            .addClass('go-to-saved')
            .attr({ href: '/saved' })
            .text('Go to Saved Articles');

        const cardBody = $('<div/>')
            .addClass('card-body text-center')
            .append(
                $('<h4/>').append(scrapeLink),
                $('<h4/>').append(savedLink)
            );

        const card = $('<div/>')
            .addClass('card')
            .append(cardHeader, cardBody);

        articleContainer.append(alertBox, card);
    }

    /**
     * Ask for existing unsaved articles or render a message with options.
     */
    function initPage() {
        $.get('/api/headlines?saved=false').done((data) => {
            articleContainer.empty();
            if (data && data.length > 0) {
                renderArticles(data);
            } else {
                renderEmpty();
            }
        });
    }

    /**
     * Build a Bootstrap Card component for a single article.
     *
     * @param {Object} article The article for which to build the card.
     * @returns {*|jQuery|HTMLElement}
     */
    function createCard(article) {
        /* eslint-disable max-len */
        // prettier-ignore
        const card = $(`
            <div class="card">
                <div class="card-header">
                    <h3>
                        <a href="${article.url}" class="article-link" target="_blank" rel="noopener noreferrer">${article.headline}</a>
                    </h3>
                    <ul class="nav nav-pills card-header-pills">
                        <li class="nav-item">
                            <a class="btn btn-success save-article">Save Article</a>
                        </li>
                    </ul>
                </div>
                <div class="card-body">${article.caption}</div>
            </div>`.trim());

        // Add the record id to the card element. Used for saving an
        // article.
        card.data('id', article._id);

        /* eslint-enable */
        return card;
    }

    /**
     * Build the cards for each returned article and append the result
     * to the page.
     *
     * @param {Array} articles
     */
    function renderArticles(articles) {
        let i = 0;
        const cards = [];

        for (i; i < articles.length; i++) {
            cards.push(createCard(articles[i]));
        }

        articleContainer.append(cards);
    }

    /**
     * Send a request to collect articles, and then render them to the page.
     *
     * @param event
     */
    function askForArticles(event) {
        event.preventDefault();

        $.get('/api/fetch').done(() => {
            initPage();
        });
    }

    /**
     * Remove all articles from the application.
     *
     * @param event
     */
    function clearArticles(event) {
        event.preventDefault();

        $.get('/api/clear').done(() => {
            initPage();
        });
    }

    /**
     * Save the article when the user clicks the 'Save Article' button.
     *
     * @param event
     */
    function saveArticle(event) {
        event.preventDefault();

        // Get the article _id that was clicked. This comes from the
        // javascript object that was attached, using the .data() method,
        // when the card was created.
        const article = $(this)
            .parents('.card')
            .data();
        article.saved = true;
        // console.log(article);

        // Get the _csrf token needed to make changes to the record.
        const token = document
            .querySelector('meta[name="_csrf"]')
            .getAttribute('content');

        $.ajax({
            method: 'patch',
            url: `/api/headlines/${article.id}`,
            data: article,
            headers: { 'X-CSRF-Token': token },
        }).done((data) => {
            if (data.saved) {
                // If the record was successfully updated remove the
                // headline from the page.
                $(this)
                    .parents('.card')
                    .remove();
            }
        });
    }

    // TODO: Find a better way to call this.
    initPage();
})(jQuery);
