require(['./common'], function (common) {
    require(['c4/APIconnector', 'up/profileManager', 'util'], function (APIconnector, profileManager, util) {
//        APIconnector.init({base_url:'http://eexcess-dev.joanneum.at/eexcess-privacy-proxy-1.0-SNAPSHOT/api/v1/'});
//        APIconnector.init({base_url:'http://eexcess-dev.joanneum.at/eexcess-federated-recommender-web-service-1.0-SNAPSHOT/recommender/'});
//        APIconnector.init({base_url:'http://eexcess-demo.know-center.tugraz.at/eexcess-federated-recommender-web-service-1.0-SNAPSHOT/recommender/'});

        var msgAllTabs = function (msg) {
            chrome.tabs.query({}, function (tabs) {
                for (var i = 0, len = tabs.length; i < len; i++) {
                    chrome.tabs.sendMessage(tabs[i].id, msg);
                }
            });
        };

        var selectedSources = [
            {
                systemId: 'Mendeley',
                favIconURI: 'https://d3fildg3jlcvty.cloudfront.net/4f8209ead635af1611d51e4f3159812cc355e1ce/graphics/favicon.ico'
            },
            {
                systemId: 'ZBW',
                favIconURI: 'http://www.zbw.eu/favicon.ico'
            }
        ];
        var qcHistory = localStorage.getItem('qcHistory');
        if (typeof qcHistory !== 'undefined') {
            qcHistory = JSON.parse(qcHistory);
        }

        chrome.storage.sync.get(['numResults', 'uuid'], function (result) {
            var uuid;
            if (result.uuid) {
                uuid = result.uuid;
            } else {
                uuid = util.randomUUID();
                chrome.storage.sync.set({uuid: uuid});
            }
            var manifest = chrome.runtime.getManifest();
            var settings = {
                origin: {
                    userID: uuid,
                    clientType: manifest.name + "/chrome-extension",
                    clientVersion: manifest.version
                }
            };
            if (result.numResults) {
                settings.numResults = result.numResults;
            }
            APIconnector.init(settings);

            chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
                if (typeof msg.method !== 'undefined') {
                    switch (msg.method) {
                        case 'triggerQuery':
                            var profile = msg.data;
                            // selected sources
                            profile.partnerList = selectedSources;
                            // Adaptation of the profile according to the policies
                            profile = profileManager.adaptProfile(profile);
                            var obfuscationLevel = profileManager.getObfuscationLevel();
                            if (obfuscationLevel == 0) {
                                APIconnector.query(profile, sendResponse);
                            } else {
                                var k = obfuscationLevel * 2;
                                APIconnector.queryPeas(profile, k, sendResponse);
                            }

                            return true;
                            break;
                        //search for images on wikipedia commons
                        case 'triggerQueryCommons':
                            queryCommons(msg.data, sendResponse);
                            return true;
                            break;

                        case 'optionsUpdate':
                            chrome.storage.sync.get(['numResults'], function (result) {
                                if (result.numResults) {
                                    APIconnector.setNumResults(result.numResults);
                                }
                            });
                            break;
                        case 'updateQueryCrumbs':
                            msgAllTabs(msg);
                            break;
                        case 'qcGetHistory':
                            sendResponse(qcHistory);
                            return true;
                            break;
                        case 'qcSetHistory':
                            qcHistory = msg.data;
                            localStorage.setItem('qcHistory', JSON.stringify(qcHistory));
                            break;
                        default:
                            console.log('unknown method: ' + msg.method);
                            break;
                    }
                } else {
                    console.log('method not specified');
                }
            });
        });

        /*
                chrome.storage.sync.get(['numResults', 'selectedSources', 'uuid'], function (result) {
                    if (result.selectedSources) {
                        result.selectedSources.forEach(function (val) {
                            selectedSources.push({systemId: val.systemId});
                        });
                    }
                    var uuid;
                    if (result.uuid) {
                        uuid = result.uuid;
                    } else {
                        uuid = util.randomUUID();
                        chrome.storage.sync.set({uuid: uuid});
                    }
                    var manifest = chrome.runtime.getManifest();
                    var settings = {
                        origin: {
                            userID: uuid,
                            clientType: manifest.name + "/chrome-extension",
                            clientVersion: manifest.version
                        }
                    };
                    if (result.numResults) {
                        settings.numResults = result.numResults;
                    }
                    APIconnector.init(settings);

                    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
                        if (typeof msg.method !== 'undefined') {
                            switch (msg.method) {
                                case 'triggerQuery':
                                    var profile = msg.data;
                                    // selected sources
                                    if (selectedSources && selectedSources.length > 0 && !profile.partnerList) {
                                        profile.partnerList = selectedSources;
                                    }
                                    // Adaptation of the profile according to the policies
                                    profile = profileManager.adaptProfile(profile);
                                    var obfuscationLevel = profileManager.getObfuscationLevel();
                                    if (obfuscationLevel == 0) {
                                        APIconnector.query(profile, sendResponse);
                                    } else {
                                        var k = obfuscationLevel * 2;
                                        APIconnector.queryPeas(profile, k, sendResponse);
                                    }

                                    return true;
                                    break;
                                //search for images on wikipedia commons
                                case 'triggerQueryCommons':
                                    queryCommons(msg.data, sendResponse);
                                    return true;
                                    break;

                                case 'optionsUpdate':
                                    chrome.storage.sync.get(['numResults', 'selectedSources'], function (result) {
                                        if (result.numResults) {
                                            APIconnector.setNumResults(result.numResults);
                                        }
                                        if (result.selectedSources) {
                                            selectedSources = [];
                                            result.selectedSources.forEach(function (val) {
                                                selectedSources.push({systemId: val.systemId});
                                            });
                                        }
                                    });
                                    break;
                                case 'updateQueryCrumbs':
                                    msgAllTabs(msg);
                                    break;
                                case 'qcGetHistory':
                                    sendResponse(qcHistory);
                                    return true;
                                    break;
                                case 'qcSetHistory':
                                    qcHistory = msg.data;
                                    localStorage.setItem('qcHistory', JSON.stringify(qcHistory));
                                    break;
                                default:
                                    console.log('unknown method: ' + msg.method);
                                    break;
                            }
                        } else {
                            console.log('method not specified');
                        }
                    });
                });
        */
    });
});

//add visibility toggle to browser action

var visible = false;

chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.browserAction.getBadgeText({tabId: tab.id}, function (badgeText) {
        //if widget is off/hidden
        if (badgeText === '') {
            visible = true;
            chrome.browserAction.setBadgeText({text: 'on', tabId: tab.id});
            notifyVisibilityChange(tab.id, tab.url)
        }
        //if widget is visible, hide it
        else {
            visible = false;
            chrome.browserAction.setBadgeText({text: '', tabId: tab.id});
            notifyVisibilityChange(tab.id, tab.url)
        }
    })
});

//send new visibility state to content.js
function notifyVisibilityChange(tabID, url) {
    chrome.tabs.sendMessage(tabID, {method: "visibility", data: visible}, function (response) {
    });
}


//call to wiki commons TODO add to APIconnector?
/**
 * Function to query the wikipedia commons database.
 * @param {APIconnector~onResponse} callback Callback function called on success or error.
 */
function queryCommons(data, callback) {
    var wikiUrl = "https://commons.wikimedia.org/w/api.php?";

    $.ajax({
        url: wikiUrl,
        //jsonp: "false", -> removed to fix security policy issue (jsonp not allowed in chrome-extension)
        //dataType: 'jsonp',
        data: {
            action: "query",
            generator: "search",
            gsrnamespace: "6",
            gsrsearch: data.query,
            gsrlimit: "20",
            gsroffset: "20",
            prop: "imageinfo",
            iiprop: "url",
            format: "json",
            iiurlwidth: "120"

        },

        xhrFields: {withCredentials: true},
        success: function (response) {
            if (typeof callback !== 'undefined') {
                callback({status: 'success', data: response});
            }
        }

    });
}




