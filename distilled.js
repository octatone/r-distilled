function display(data) {
    var content, $listing = $('#listing');

    $listing.empty().hide();

    for (x in data) {
        content = '<div class="thing">' + '<a href="' + data[x].data.url + '" class="thumbnail" target="_blank"><img src="' + data[x].data.thumbnail + '" width="70"/></a>' + '<div class="entry">' + '<p class="title">' + '<a href="' + data[x].data.url + '" class="title" target="_blank">' + data[x].data.title + '</a>' + ' <span class="domain">(' + data[x].data.domain + ')</span>' + '</p>' + '<p class="tagline">' + '<span class="score">' + data[x].data.score + '</span> (<span class="ups">' + data[x].data.ups + '</span>|<span class="downs">' + data[x].data.downs + '</span>) ' + 'submitted ' + longAgo(data[x].data.created_utc) + ' hours ago by ' + '<a href="http://reddit.com/user/' + data[x].data.author + '" class="author" target="_blank">' + data[x].data.author + '</a> to ' + '<a href="http://reddit.com/r/' + data[x].data.subreddit + '" class="subreddit" target="_blank">' + data[x].data.subreddit + '</a>' + '</p>' + '<ul class="flat-list">' + '<li><a href="http://reddit.com' + data[x].data.permalink + '" class="comments" target="_blank">' + data[x].data.num_comments + ' comments</a></li>' + '</ul>' + '</div></div>' + '<div class="clearleft"></div>';

        $listing.append(content);
    }
    $listing.hide().fadeIn('slow');
}

function filterDupes(arr) {
    var i, out = [],
        obj = {},
        original_length = arr.length;

        //remove dupes
        for (i = arr.length - 1; i >= 0; i--) {
            if (typeof obj[arr[i].data.subreddit] != 'undefined') {
                delete obj[arr[i].data.subreddit];
            }
            obj[arr[i].data.subreddit] = arr[i];
        }
        for (i in obj) {
            out.push(obj[i]);
        }

        return out.reverse();
}

function loadPosts(option) {
    var sub = '',
        $listing = $('#listing');

    $listing.fadeOut(function() {
            $listing.empty().show(function() {
                    $listing.append('<div id="loading">Loading ...</div>');
                });
        });

    if (option == 'all') {
        sub = 'r/all/';
    }

    var cur_chan_req = $.ajax({
            url: "http://reddit.com/" + sub + ".json?limit=100",
            dataType: "jsonp",
            jsonp: "jsonp",
            success: function(data) {
                display(filterDupes(data.data.children));
            },
            error: function(jXHR, textStatus, errorThrown) {
                if (textStatus !== 'abort') {
                    $listing.empty().append('<div id="error">Could not load feed. Is reddit down?</div>');
                }
            }
        });
}

function longAgo(time) {
    time = time * 1000;
    var date = new Date();
    var now = date.getTime();
    var offset = date.getTimezoneOffset() * 1000;
    var hours_ago = Math.round((now - time - offset) / 1000 / 60 / 60);
    return hours_ago;
}

function loadFront() {
    $('#front').off();
    $('#all').off().on('click', loadAll);
    loadPosts();
}

function loadAll() {
    $('#all').off();
    $('#front').off().on('click', loadFront);
    loadPosts('all');
}

$(function() {
        loadFront();
});