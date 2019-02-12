/**
 * news-scraper front-end::saved
 *
 * The Coding Boot Camp at UNC Charlotte.
 * (c) 2019 Richard Cyrus <hello@rcyrus.com>
 */

/* global jQuery, bootbox */

(function($) {
    /* eslint-disable-next-line strict */
    'use strict';

    const articleContainer = $('.article-container');
    const clearButton = $('.clear');

    // Register button click handlers/
    articleContainer.on('click', '.delete-article', deleteArticle);
    articleContainer.on('click', '.article-notes', showNotes);
    clearButton.on('click', clearArticles);
    $(document).on('click', '.btn.note-delete', deleteNote);

    /**
     * Render an alert and a card with options, when there are no saved
     * articles.
     */
    function renderEmpty() {
        const content = [
            '<div class="alert alert-warning text-center">',
            "<h4>Uh Oh. Looks like we don't have any saved articles.</h4>",
            '</div>',
            '<div class="card">',
            /* eslint-disable-next-line max-len */
            '<div class="card-header text-center"><h3>Would You Like to Browse Available Articles?</h3></div>',
            '<div class="card-body text-center">',
            /* eslint-disable-next-line max-len */
            '<h4><a href="/" class="browse-articles">Browse Articles</a></h4>',
            '</div>',
            '</div>',
        ].join('');

        articleContainer.append(content);
    }

    /**
     * Ask for existing saved articles or render a message with options.
     */
    function initPage() {
        $.get('/api/headlines?saved=true').done((data) => {
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
        const card = $('<div class="card">');
        /* eslint-disable max-len */
        card.append(
            [
                '<div class="card-header">',
                '<h3>',
                '<a class="article-link" target="_blank" rel="noopener noreferrer"',
                ` href="${article.url}">${article.headline}</a></h3>`,
                '<ul class="nav nav-pills card-header-pills">',
                '<li class="nav-item"><a class="btn btn-primary article-notes">Article Notes</a></li>',
                '<li class="nav-item"><a class="btn btn-danger delete-article">Delete Article</a></li>',
                '</ul></div>',
                `<div class="card-body">${article.caption}</div>`,
            ].join('')
        );

        // Add the record id to the card element. Used for saving an
        // article.
        // card.attr('data-id', article._id);
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
     * Delete the article when the user clicks the 'Delete Article'
     * button.
     *
     * @param event
     */
    function deleteArticle(event) {
        event.preventDefault();
        const element = event.target;

        // Get the article _id that was clicked. This comes from the
        // javascript object that was attached, using the .data() method,
        // when the card was created.
        const article = $(this)
            .parents('.card')
            .data();
        // console.log(article);

        // TODO: Refactor out to a higher level function.
        // Get the _csrf token needed to make changes to the record.
        const token = document
            .querySelector('meta[name="_csrf"]')
            .getAttribute('content');

        // TODO: Implement on Backend
        $.ajax({
            method: 'delete',
            url: `/api/headlines/${article.id}`,
            headers: { 'X-CSRF-Token': token },
        }).done((data) => {
            if (data.deleted) {
                // If the record was successfully deleted remove the
                // headline from the page.
                $(element)
                    .parents('.card')
                    .remove();
            }
        });
    }

    /**
     * Build and display the list of notes for an Article, or a message
     * that there are no notes.
     *
     * @param data
     */
    function createNoteList(data) {
        const notesToRender = [];

        if (!data.notes.length) {
            const noNotes = $('<li>')
                .addClass('list-group-item')
                .text('There are currently no notes for this article.');

            notesToRender.push(noNotes);
        } else {
            for (let i = 0; i < data.notes.length; i++) {
                const button = $('<button>')
                    .addClass('btn btn-danger note-delete')
                    .html('&times;');

                const note = $('<li>')
                    .addClass(['list-group-item', 'note'].join(' '))
                    .html(`<p class="mb-0">${data.notes[i].body}</p>`)
                    .append(button);

                // Add the note id reference for the delete call.
                note.children('button').data('id', data.notes[i]._id);

                notesToRender.push(note);
            }
        }

        $('.note-container').append(notesToRender);
    }

    /**
     * Handle the click event for the 'Article Notes' button.
     *
     * Get the article id, ask for notes from the backend, and display
     * the dialog with existing notes and the ability to add a note.
     *
     * @param event
     */
    function showNotes(event) {
        event.preventDefault();

        // Get the article id so we can find any existing notes.
        const article = $(this)
            .parents('.card')
            .data();

        // Ask for any existing notes from the backend.
        $.get(`/api/notes/${article.id}`).done((response) => {
            // Construct the interior of the modal.
            const contentWrap = $('<div>').addClass('container-fluid');
            const existingNotes = $('<ul>').addClass(
                'list-group note-container'
            );
            const contentBreak = $('<hr>').addClass('my-2');
            const newNoteBox = $('<textarea>').attr({
                placeholder: 'Write your notes here...',
                rows: 4,
                cols: 50,
            });

            contentWrap.append(existingNotes, contentBreak, newNoteBox);

            // Use bootbox.js to build and display the bootstrap modal.
            bootbox.dialog({
                closeButton: true,
                onEscape: true,
                show: true,
                title: `Notes for Article: ${article.id}`, // TODO: fix me
                message: contentWrap,
                backdrop: true,
                buttons: {
                    save: {
                        label: 'Save Note',
                        className: 'btn-success save-note',
                        callback: saveNote,
                    },
                },
            });

            const notes = {
                id: article.id,
                notes: response || [],
            };

            // Attach the existing notes and article id to the save button.
            $('.save-note').data('article', notes);

            // Populate the list of existing notes or the message that
            // none have been created yet.
            createNoteList(notes);
        });
    }

    /**
     * Save a new note from the modal dialog.
     *
     * @param event
     */
    function saveNote(event) {
        const element = event.target;

        // TODO: Refactor out to a higher level function.
        const token = document
            .querySelector('meta[name="_csrf"]')
            .getAttribute('content');

        let noteData;
        const newNote = $('.bootbox-body textarea')
            .val()
            .trim();

        if (newNote) {
            noteData = {
                article: $(element).data('article').id,
                body: newNote,
            };

            $.ajax({
                url: '/api/note',
                data: noteData,
                method: 'post',
                headers: { 'X-CSRF-Token': token },
            }).done(() => {
                // Close the modal dialog.
                bootbox.hideAll();
            });
        }
    }

    /**
     * Delete a note from a article.
     * TODO: Flesh this out. We are getting the note id on button press.
     *
     * @param event
     */
    function deleteNote(event) {
        event.preventDefault();
        // const element = event.target;

        // TODO: Refactor out to a higher level function.
        // const token = document
        //     .querySelector('meta[name="_csrf"]')
        //     .getAttribute('content');

        const note = $(this).data('id');
        console.log('Delete note id: ', note);

        // $.ajax({
        //     method: 'delete',
        //     url: `/api/notes/${note}`,
        //     headers: { 'X-CSRF-Token': token },
        // }).done((data) => {
        //     if (data.deleted) {
        //         $(this)
        //             .parents('.note')
        //             .remove();
        //     }
        // });
    }

    // TODO: Find a better way to call this.
    initPage();
})(jQuery);
