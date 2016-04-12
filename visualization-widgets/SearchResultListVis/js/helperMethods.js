var language;
var executed = false;

window.addEventListener('message', function (msg) {
    if (msg.data.event == 'eexcess.detectLang.response') {
        language = msg.data.language;
    }

    window.removeEventListener('message', this);
});

window.top.postMessage({event: 'eexcess.detectLang.request'}, '*');


//----- Assemble the searchResultGrid -----//

function addIsotopeGrid(msgWiki, msgEEXCESS) {
    $('.eexcess_error').hide();
    $('.eexcess_error_timeout').hide();
    $('#eexcess-loading').hide();

    var $items;

    //nothing to show
    if (msgWiki.query === undefined && msgEEXCESS.data.totalResults === 0) {
        showEmptyResult("both");
        return;

        //show only the eexcess results
    } else if (msgWiki.query === undefined && msgEEXCESS.data.totalResults !== 0) {
        showEmptyResult("wiki");
        $items = $(addGridEEXCESSResultItems(msgEEXCESS));

        //show only the wiki results
    } else if (msgEEXCESS.data.totalResults === 0) {
        showEmptyResult("eecxess");
        $items = $(addGridWikiResultItems(msgWiki));

    } else {
        $('.eexcess_empty_result').hide();
        var itemsEEXCESS = $(addGridEEXCESSResultItems(msgEEXCESS));
        var itemsWiki = $(addGridWikiResultItems(msgWiki));

        // merge result grid objects in a zipping fashion, ignore undefined values which occur when result sets are of
        // different length
        var itemsLonger = itemsEEXCESS;
        var itemsShorter = itemsWiki;
        if (itemsEEXCESS.length < itemsWiki.length) {
            itemsLonger = itemsWiki;
            itemsShorter = itemsEEXCESS;
        }
        $items = itemsLonger.map(function (v, i) {
            if (itemsShorter[v] !== undefined) {
                return [i, itemsShorter[v]];
            }
            else return i;
        });
    }

    //init isotope
    $('.eexcess-isotope-grid').isotope({
        itemSelector: '.eexcess-isotope-grid-item',
        layoutMode: 'masonry',
        masonry: {
            columnWidth: 60
        }
        //getSortData: {
        //    itemTitle: '.itemTitle',
        //    date: '[itemDate]'
        //}
    });

    //check if all items are loaded to avoid overlap, then add items to container TODO has to be deactivated because
    // of wikis image sizes
    //$items.imagesLoaded(function () {

    $('.eexcess-isotope-grid').isotope('insert', $items);
    $(manageInterface);
    //});

    //------Filtering------//
    // bind filter button click
    $('#eexcess-isotope-filters').on('click', 'button', function () {
        var filterValue = $(this).attr('data-filter');
        // use filterFn if matches value
        $('.eexcess-isotope-grid').isotope({filter: filterValue});
    });

    //------Sorting------//
    // bind sort button click
    $('#eexcess-isotope-sorts').on('click', 'button', function () {
        var sortValue = $(this).attr('data-sort-value');
        $('.eexcess-isotope-grid').isotope({sortBy: sortValue});
    });
}


function addGridEEXCESSResultItems(msg) {
    var items = '';

    $.each(msg.data.result, function (idx, val) {

            var mediaType = val.mediaType;
            var itemTitle = val.title;
            var itemDate = ' itemDate = "' + val.date + '" ';
            var previewImage = val.previewImage;

            var itemDescription = val.description;
            var generatingQuery = ' generatingQuery = "' + val.generatingQuery + '"';

            var itemID = val.documentBadge.id;

            //cleaning up ids as fancybox is using them for referencing, which doesn't handle spaces and slashes very well
            var cleanID = itemID.replace(/\//g, '').replace(/ /g, '');
            var itemHrefAttr = ' href="#' + cleanID + '" ';
            var itemCleanIdAttr = ' id = "' + cleanID + '" ';


            //links result page
            var itemLink = '<a title="open" class="fa fa-external-link " target="_blank" href="' + val.documentBadge.uri + '" />';
            var itemLinkLightbox = '<a class="fa fa-external-link eexcess-result-link-lightbox" target="_blank"' +
                ' href="' + val.documentBadge.uri + '"/>';

            //citation
            var insertLink = '<a title="insert reference" class="fa fa-arrow-right eexcess-cite-text"></a>' +
                '<div style="display:none" class="eexcess-document-information">' + JSON.stringify(val) + '</div>';

            var resultLinks = '<ul class="eexcess-result-links"><li>' + itemLink + '</li><li>' + insertLink + '</li></ul>';

            //assemble documentBadge for logging
            var documentBadge = 'itemId = "' + val.documentBadge.id + '" itemURI = "' + val.documentBadge.uri + '" provider =' +
                ' "' + val.documentBadge.provider + '"';


            // add "isotoped" items
            /*if (mediaType == "IMAGE" || mediaType == "image") {
             if (previewImage == undefined) {

             //previewImage = "http://eexcess-dev.joanneum.at/eexcess-federated-recommender-web-service-1.0-SNAPSHOT/recommender/getPreviewImage?type=image";
             item = '<div class ="eexcess-isotope-grid-item eexcess-image eexcess-other-without-preview"'
             + documentBadge + itemDate + generatingQuery + ' data-category="eexcess-image">' +
             ' <div class="eexcess-title eexcess-image itemTitle"><div class="eexcess-title-content">' +
             itemTitle + '</div></div>' + resultLinks + '</div>';
             } else {

             item = '<div class ="eexcess-isotope-grid-item eexcess-image eexcess-other-with-preview"'
             + documentBadge + itemDate + generatingQuery + ' data-category="eexcess-image">'
             + ' <div class="eexcess-title-other-with-preview-area eexcess-image itemTitle"> ' +
             '<div class="eexcess-title-other-with-preview-content itemTitle" ><div class="eexcess-title-content">' +
             itemTitle + '</div></div></div><img src="' + previewImage + '" />' + resultLinks + '</div>';
             }
             items += item;
             }
             else */
            if (mediaType.toLowerCase() == "text") {

                //text results without description
                if (itemDescription == undefined) {

                    //text results without description and without preview
                    if (previewImage == undefined) {
                        //previewImage = 'http://eexcess-dev.joanneum.at/eexcess-federated-recommender-web-service-1.0-SNAPSHOT/recommender/getPreviewImage?type=text';

                        item = '<div class = "eexcess-isotope-grid-item eexcess-text eexcess-text-without-preview"'
                            + documentBadge + itemDate + generatingQuery + ' data-category="eexcess-text">' +
                            ' <div class="eexcess-title eexcess-text itemTitle"><div class="eexcess-title-content">' +
                            itemTitle + '</div></div>' + resultLinks + '</div>';

                    }
                    //text results without description and with preview
                    else {
                        item = '<div class = "eexcess-isotope-grid-item eexcess-text eexcess-other-with-preview "'
                            + documentBadge + itemDate + generatingQuery + ' data-category="eexcess-text">' +
                            '<div class="eexcess-title-other-with-preview-area eexcess-text itemTitle">' +
                            '<div class="eexcess-title-other-with-preview-content itemTitle" ><div class="eexcess-title-content">' +
                            itemTitle + '</div></div></div><img src="' + previewImage + '" />' + resultLinks + '</div>';

                    }
                }


                //text results with description
                else {
                    //text results with description and without preview
                    if (previewImage == undefined) {

                        item = '<div class = "eexcess-isotope-grid-item eexcess-text eexcess-text-without-preview eexcess-text-without-preview-with-description eexcess-with-preview-hover"'
                            + documentBadge + itemDate + generatingQuery + ' data-category="eexcess-text">' +
                            ' <div class="eexcess-title-with-description-text eexcess-text itemTitle">' +
                            itemTitle + '</div>' + ' <div class=" eexcess-description-text eexcess-text-with-preview-hover ">' + itemDescription + '</div>' +
                            resultLinks + '</div>';

                    }
                    //text results with description and with preview
                    else {
                        item = '<div class = "eexcess-isotope-grid-item eexcess-text eexcess-text-with-preview eexcess-with-preview-hover"'
                            + documentBadge + itemDate + generatingQuery + ' data-category="eexcess-text">' +
                            ' <div class="eexcess-title-with-description-text eexcess-text itemTitle"><b></b>' +
                            itemTitle + "<b></div>" + ' <div class="eexcess-description-text">' + itemDescription + "</div>" +
                            '<img src="' + previewImage + '" />' + resultLinks + '</div>';
                    }
                }
                items += item;
                //items.push(item);
            }
        }
    );
    return items;
}

function addGridWikiResultItems(msg) {

    var items = '';

    $.each(msg.query.pages, function (idx, val) {

        var itemTitle = val.title.split(/[:.]+/)[1];

        var itemDescription = val.description;

        var pageID = val.pageid;
        var itemImageUrl = val.imageinfo.url;

        var thumbnailUrl = val.imageinfo[0].thumburl;

        //result link
        var itemLink = '<a title="open" class="fa fa-external-link " target="_blank" href="https://' + language + '.wikipedia.org/wiki/' + val.title.replace(/ /g, "_") + '" />';

        //image insertion link
        var insertLink = '<a title="insert image" class="fa fa-arrow-right eexcess-cite-image" data-title="' + val.title + '"></a>';

        var resultLinks = '<ul class="eexcess-result-links"><li>' + itemLink + '</li><li>' + insertLink + '</li></ul>';

        item = '<div class = "eexcess-isotope-grid-item eexcess-image eexcess-other-with-preview "'
            + ' data-category="eexcess-image">' +
            '<div class="eexcess-title-other-with-preview-area eexcess-image itemTitle">' +
            '<div class="eexcess-title-other-with-preview-content itemTitle" ><div class="eexcess-title-content">' +
            itemTitle + '</div></div></div><img src="' + thumbnailUrl + '" />' + resultLinks + '</div>';

        items += item;
    });

    return items;
}

// adding cite links
function addCitationInserting() {
    $(".eexcess-cite-text").unbind('click').click(function () {
        var eventData = {
            documentInformation: JSON.parse($(this).parent().find(".eexcess-document-information").text())
        };
        window.top.postMessage({event: 'eexcess.insertMarkup.text', data: eventData}, '*');
    });

    $(".eexcess-cite-image").unbind('click').click(function () {
        var title = $(this).attr('data-title');

        var eventData = {
            documentInformation: {
                mediaType: "image",
                title: title
            }
        };
        window.top.postMessage({event: 'eexcess.insertMarkup.image', data: eventData}, '*');
    });
}

//-----Interface, shorten Titles, assemble Buttons, Filters, LoadingBar, Errors etc.-----//
function manageInterface() {
    $(addFilterCounter);
    $(bindDescriptionHover);
    $(addCitationInserting);

    $('.eexcess-title-other-with-preview-content').dotdotdot();
    $('.eexcess-title-with-description-text').dotdotdot();
    $('.eexcess-description-text').dotdotdot();
    $('.eexcess-title-text-with-preview').dotdotdot();
    $('.eexcess-title-content').dotdotdot();
}


//----- -----//
function bindDescriptionHover() {
    $(".eexcess-with-preview-hover").hover(function () {
        $(this).find('.eexcess-text-with-preview-hover').css({'opacity': '1'}, 100)
    }, function () {
        $(this).find('.eexcess-text-with-preview-hover').css({'opacity': '0.3'}, 100)
    })
}

function showLoadingBar() {
    $('.eexcess_empty_result').hide();
    $('#eexcess-isotope-filtering-and-sorting').hide();
    $('#eexcess-isotope-filters').each(function (i, buttonGroup) {
        var $buttonGroup = $(buttonGroup);
        var currentFilter = $buttonGroup.find('.is-checked').attr("class");
        chrome.storage.sync.set({'currentFilter': currentFilter}, function () {
        });
    });

    executed = false;
    $("#eexcess-isotope-filters").empty();
    $('.eexcess_error').hide();
    $('.eexcess_error_timeout').hide();
    $("div").remove(".eexcess-isotope-grid-item");
    $('#eexcess-loading').show();
}


function showEmptyResult(s) {
    var emptyResult = $('.eexcess_empty_result');
    switch (s) {
        case "wiki" :
            emptyResult.text("Sorry, there are no results from Wikipedia Commons.");
            break;
        case "eexcess":
            $('.eexcess_empty_result').text("Sorry, there are no results from EEXCESS.");
            break;
        case "both":
            $('.eexcess_empty_result').text("Sorry, there are no results.");
            break;
    }
    emptyResult.show();

}

function showError(errorData) {
    $('#eexcess-loading').hide();
    $('.eexcess_empty_result').hide();
    if (errorData === 'timeout') {
        $('.eexcess_error_timeout').show();
    }
    else {
        $('.eexcess_error').show();
    }
}

$(document).ready(function () {
//-----Filter-Buttons-----//
// change is-checked class on buttons
    $('#eexcess-isotope-filters').each(function (i, buttonGroup) {
        var $buttonGroup = $(buttonGroup);
        $buttonGroup.on('click', 'button', function () {
            $buttonGroup.find('.is-checked').removeClass('is-checked');
            $(this).addClass('is-checked');
        });
    });
    $('#eexcess-isotope-sorts').each(function (i, buttonGroup) {
        var $buttonGroup = $(buttonGroup);
        $buttonGroup.on('click', 'button', function () {
            $buttonGroup.find('.is-checked').removeClass('is-checked');
            $(this).addClass('is-checked');
        });
    });


});
//TODO called twice, why? and adjust "var executed" accordingly
function addFilterCounter() {

    if (!executed) {
        var buttonGroup = $("#eexcess-isotope-filters");
        buttonGroup.empty();
        var current;
        chrome.storage.sync.get(['currentFilter'], function (result) {
            if (result.currentFilter) {
                current = result.currentFilter;
            }

            //if no filter was selected "show all" will be selected
            if (current == undefined || current.indexOf("show-all") > -1) {
                buttonGroup.append(' <button class="eexcess-isotope-button show-all is-checked" data-filter="*">all' +
                    ' </button>');
            } else {
                buttonGroup.append(' <button class="eexcess-isotope-button show-all " data-filter="*">all </button>');
            }


            var numberOfImages = $('.eexcess-isotope-grid-item.eexcess-image').size();
            var numberOfTexts = $('.eexcess-isotope-grid-item.eexcess-text').size();

            if (numberOfImages > 0) {
                var imageFilterButton = '<button class="eexcess-isotope-button eexcess-image"' +
                    ' data-filter=".eexcess-image">images (' + numberOfImages + ')</button>';
                buttonGroup.append(imageFilterButton);
                if (current != undefined && current.indexOf("eexcess-image") > -1) {
                    $('.eexcess-isotope-button.eexcess-image').addClass('is-checked');
                    $('.eexcess-isotope-grid').isotope({filter: '.eexcess-image'});
                }
            }

            if (numberOfTexts > 0) {
                var textFilterButton = '<button class="eexcess-isotope-button eexcess-text"' +
                    ' data-filter=".eexcess-text">texts (' + numberOfTexts + ')</button>';
                buttonGroup.append(textFilterButton);
                if (current != undefined && current.indexOf("eexcess-text") > -1) {
                    $('.eexcess-isotope-button.eexcess-text').addClass('is-checked');
                    $('.eexcess-isotope-grid').isotope({filter: '.eexcess-text'});
                }
            }

            // if previous selected filter doesn't have any new results select "show-all"
            if (current != undefined) {
                if ((numberOfImages == 0 && current.indexOf("eexcess-image") > -1)
                    || (numberOfTexts == 0 && current.indexOf("eexcess-text") > -1)) {
                    $(".show-all").addClass("is-checked");
                    $('.eexcess-isotope-grid').isotope({filter: '*'});
                }
            }

        });
        executed = true;
        $('#eexcess-isotope-filtering-and-sorting').show();
    }
}


//-----LOGGING-----//
function logResultItemClicks(msg) {
    var origin = {
        module: 'Search Result List Visualization'
    };
    $('.eexcess-isotope-grid').on('click', '.eexcess-isotope-grid-item', function () {
        var item = $('.eexcess-isotope-grid-item');


        var documentBadge =
        {
            id: item.attr('itemid'),
            uri: item.attr('itemuri'),
            provider: item.attr('provider')
        };
        LOGGING.itemOpened(origin, documentBadge, msg.data.dataEEXCESS.data.queryID);
    });
}

