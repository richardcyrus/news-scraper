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

    // Get the _csrf token needed for POST, PUT, PATCH, DELETE requests.
    const token = document
        .querySelector('meta[name="_csrf"]')
        .getAttribute('content');

    const articleContainer = $('.article-container');

    // Register button click handlers/
    articleContainer.on('click', '.remove-saved', removeSaved);
    articleContainer.on('click', '.article-notes', showNotes);
    $(document).on('click', '.btn.note-delete', deleteNote);

    /**
     * Render an alert and a card with options, when there are no saved
     * articles.
     */
    function renderEmpty() {
        const alertText = "Uh Oh. Looks like we don't have any saved articles.";
        const alertBox = $('<div/>')
            .addClass('shadow alert alert-warning text-center')
            .append($('<h4/>').text(alertText));

        const cardHeaderText = 'Would You Like to Browse Available Articles?';
        const cardHeader = $('<div/>')
            .addClass('card-header d-block')
            .append(
                $('<h3/>')
                    .addClass('text-center')
                    .text(cardHeaderText)
            );

        const browseLink = $('<a/>')
            .addClass('browse-articles')
            .attr({ href: '/' })
            .text('Browse Articles');
        const cardBody = $('<div/>')
            .addClass('card-body text-center')
            .append($('<h4/>').append(browseLink));
        const card = $('<div/>')
            .addClass('card')
            .append(cardHeader, cardBody);

        articleContainer.append(alertBox, card);
    }

    /**
     * Ask for existing saved articles or render a message with options.
     */
    function initPage() {
        $.get('/api/headlines?saved=true').done((data) => {
            articleContainer.empty();

            if (data && data.length > 0) {
                renderArticles(data);

                // Activate tooltips for the action buttons.
                $('[data-toggle="tooltip"]').tooltip();
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
                            <button class="btn btn-primary article-notes" data-toggle="tooltip" title="Article Notes"><span class="far fa-comments"></span></button>
                        </li>
                        <li class="nav-item">
                            <button class="btn btn-danger remove-saved" data-toggle="tooltip" title="Remove from Saved"><span class="fas fa-unlink"></span></button>
                        </li>
                    </ul>
                </div>
                <div class="card-body">${article.caption}</div>
            </div>`.trim());

        /* eslint-enable */
        // Add the record id to the card element. Used for saving an
        // article.
        card.data('id', article._id);
        // Truncate the Article Headline for use in the Notes box display.
        card.data('title', article.headline.substring(0, 47));

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
     * Change the saved property of an article when the user clicks the
     * 'Remove from Saved' button.
     *
     * @param event
     */
    function removeSaved(event) {
        event.preventDefault();

        // Hide the tooltip for this element so that they don't hang
        // around (Resolves display issues with tooltips for removed
        // articles).
        $(this).tooltip('hide');

        // Get the article _id that was clicked. This comes from the
        // javascript object that was attached, using the .data() method,
        // when the card was created.
        const article = $(this)
            .parents('.card')
            .data();

        // Set the state of the article.
        article.saved = false;

        // Here we set the content-type and convert the data to JSON
        // so that when it reaches express, the boolean values are
        // maintained.
        $.ajax({
            method: 'patch',
            url: `/api/headlines/${article.id}`,
            data: JSON.stringify(article),
            headers: { 'X-CSRF-Token': token },
            contentType: 'application/json',
        }).done((data) => {
            if (data.saved) {
                // If the record was successfully saved, refresh the
                // page content for the case of saved headlines === 0.
                initPage();
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
            /* eslint-disable max-len */
            const noNotes = $('<li>')
                .addClass('list-group-item d-block text-center pb-1')
                .html(
                    '<p class="mb-0">There are currently no notes for this article.</p>'
                );
            /* eslint-enable max-len */

            notesToRender.push(noNotes);
        } else {
            for (let i = 0; i < data.notes.length; i++) {
                const button = $('<button>')
                    .addClass('btn btn-danger btn-sm note-delete')
                    .html('<span class="fas fa-trash-alt"></span>');

                const note = $('<li>')
                    .addClass('list-group-item note')
                    .html(`<p class="mb-0 mr-3">${data.notes[i].body}</p>`)
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

        // Hide the tooltip for this element so that they don't hang
        // around (Resolves display issues with tooltips after showing
        // the notes modal).
        $(this).tooltip('hide');

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
            const newNoteBox = $('<textarea>')
                .addClass('form-control')
                .attr({
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
                title: `<strong>Notes:</strong><br>${article.title}...`,
                message: contentWrap,
                backdrop: true,
                buttons: {
                    save: {
                        /* eslint-disable max-len */
                        label:
                            '<span class="fa fa-pencil-alt"></span>&nbsp;&nbsp;Save Note',
                        /* eslint-enable max-len */
                        className: 'btn-primary save-note',
                        callback: saveNote,
                    },
                    close: {
                        /* eslint-disable max-len */
                        label:
                            '<span class="fas fa-times"></span>&nbsp;&nbsp;Close',
                        /* eslint-enable max-len */
                        className: 'btn-outline-warning',
                        callback: function() {
                            bootbox.hideAll();
                        },
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
                url: '/api/notes',
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
     * Delete a note from an article.
     *
     * @param event
     */
    function deleteNote(event) {
        event.preventDefault();
        const element = event.target;

        const note = $(this).data('id');

        $.ajax({
            method: 'delete',
            url: `/api/notes/${note}`,
            headers: { 'X-CSRF-Token': token },
        }).done(() => {
            $(element)
                .parents('.note')
                .remove();
        });
    }

    // Populate the page on page load. This eliminates duplicate code
    // on the backend, and allows for a simpler setup for the tool-tips
    // and other associated live elements on the page.
    initPage();
})(jQuery);
