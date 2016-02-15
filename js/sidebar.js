chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.method == "visibility") {


            /*listens to position changes of the editor's content and adjusts sidebar accordingly (relevant when there's
             some kind of announcement at the top of the wiki page
             the listener is registered only when browser action is active because inly then there's a sidebar to
             adjust and it can be guaranteed that only the current tab's sidebar is altered*/
            jQuery.fn.onPositionChanged = function (trigger, millis) {
                if (millis == null) millis = 100;
                var o = $(this[0]); // our jquery object
                if (o.length < 1) return o;

                var lastPos = null;
                var lastOff = null;
                setInterval(function () {
                    if (o == null || o.length < 1) return o; // abort if element is non existend eny more
                    if (lastPos == null) lastPos = o.position();
                    if (lastOff == null) lastOff = o.offset();
                    var newPos = o.position();
                    var newOff = o.offset();
                    if (lastPos.top != newPos.top || lastPos.left != newPos.left) {
                        $(this).trigger('onPositionChanged', {lastPos: lastPos, newPos: newPos});
                        if (typeof (trigger) == "function") trigger(lastPos, newPos);
                        lastPos = o.position();
                    }
                    if (lastOff.top != newOff.top || lastOff.left != newOff.left) {
                        $(this).trigger('onOffsetChanged', {lastOff: lastOff, newOff: newOff});
                        if (typeof (trigger) == "function") trigger(lastOff, newOff);
                        lastOff = o.offset();
                    }
                }, millis);

                return o;
            };

            $("#bodyContent").onPositionChanged(function () {
                $("#eexcess_sidebar").css({
                    "height": $(".wikiEditor-ui").height(),
                    "width": sidebarWidth,
                    "top": $("#editform").offset().top
                });
            });

            //adding the sidebar

            var editor = $("#editform");

            if (request.data == true) {
                //add sidebar
                var sidebarWidth = '18%';

                $(document).ready(function () {
                    var sidebarTop = editor.offset();
                    editor.css("width", "80%");
                    var iframeUrl = chrome.extension.getURL('visualization-widgets/SearchResultListVis/index.html');

                    $("<div id='eexcess_sidebar'><iframe src='" + iframeUrl + "' /></div>").insertAfter($("#bodyContent")).hide();
                    var sidebar = $("#eexcess_sidebar");

                    //adjust sidebar position and size according to the wiki editor
                    sidebar.css({
                        "height": $(".wikiEditor-ui").height(),
                        "width": sidebarWidth,
                        "top": sidebarTop.top
                    });

                    sidebar.css("top", sidebarTop.top);
                    //sidebar.show();
                    sidebar.slideToggle({direction: "left"});

                });

            }
            //remove sidebar
            if (request.data == false) {
                editor.css("width", "100%");
                $("#eexcess_sidebar").remove();
            }

        }
    });





