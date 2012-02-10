/* global namespace */
var globals = {'view': 'all',

	       /* filter defauls */
	       'imgur': true,
	       'quickmeme': true,
	       'images': false,
	       'percent': 55, /* posts with a total up percentage below are filtered out */

	       'cur_request': null,

	       'optional_filters': {'imgur': {'type': 'domain', 'needles': ['imgur.com','i.imgur.com']},
				    'quickmeme': {'type': 'domain', 'needles': ['quickmeme.com','qkme.me']},
				    'images': {'type': 'url', 'needles': ['jpg','png','gif','imgur.com']}
                                   },
	       'posts': null
}

/* this function is recursive for sequential item displaying */
function display(data, item) {
    var content, button, centage, thumbnail = '', $listing = $('#listing');
    var x = typeof(item) != 'undefined' ? item : 0;

    if(x == 0){
	$listing.stop(true,false).empty();
    }

    /* gather html */
    button = redditButton('t3_' + data[x].data.id);
    centage = Math.round(data[x].data.ups / (data[x].data.ups + data[x].data.downs) * 100);
    if(data[x].data.thumbnail == 'default' || data[x].data.thumbnail == 'self'){
	//do nothing
    }else{
	thumbnail = '<img src="' + data[x].data.thumbnail + '" width="70"/>';
    }
    content = '<div id="' + data[x].data.id + '" class="thing hidden"><div class="vote-button">' + button +'</div><a href="' + data[x].data.url + '" class="thumbnail" target="_blank">' + thumbnail + '</a><div class="entry">' + '<p class="title">' + '<a href="' + data[x].data.url + '" class="title" target="_blank">' + data[x].data.title + '</a>' + ' <span class="domain">(' + data[x].data.domain + ')</span>' + '</p>' + '<p class="tagline">' + '<span class="score">' + data[x].data.score + '</span> (<span class="ups">' + data[x].data.ups + '</span>|<span class="downs">' + data[x].data.downs + '</span>) ' + centage +'% submitted ' + longAgo(data[x].data.created_utc) + ' hours ago by ' + '<a href="http://reddit.com/user/' + data[x].data.author + '" class="author" target="_blank">' + data[x].data.author + '</a> to ' + '<a href="http://reddit.com/r/' + data[x].data.subreddit + '" class="subreddit" target="_blank">' + data[x].data.subreddit + '</a>' + '</p>' + '<ul class="flat-list">' + '<li><a href="http://reddit.com' + data[x].data.permalink + '" class="comments" target="_blank">' + data[x].data.num_comments + ' comments</a></li>' + '</ul>' + '</div></div>' + '<div class="clearleft"></div>';

    /* display html */
    $listing.append(content);
    $('#'+data[x].data.id).fadeIn(function(){
	    if(x < data.length - 1){
		/* recurse */
		display(data, x+1);
	    }
	});
}

function filterDupes(arr) {
    var i, centage, found, removed,
	out = [],
        obj = {},
        original_length = arr.length;

    // run optional filters first
    // consult globals namespace
    for(var opt in globals.optional_filters){
	if(globals[opt]){
	    removed = 0;
	    for (i = arr.length - 1; i >= 0; i--) {
		found = false;
		for(needle in globals.optional_filters[opt].needles){
		    needle = globals.optional_filters[opt].needles[needle];
		    found = arr[i].data[globals.optional_filters[opt].type].indexOf(needle) == -1 ? found : true;
		}			
		if(!found){
		    out.push(arr[i]);
		}else{
		    removed += 1;
		}
	    }
	    consoleLog('Removed ' + opt + ' (' + globals.optional_filters[opt].type + '): ' + removed);

	    //reset
	    arr = out.reverse();
	    out = [];
	}
    } 

    //remove below percentage
    removed = 0;
    for (i = arr.length - 1; i >= 0; i--) {
	centage = Math.round(arr[i].data.ups / (arr[i].data.ups + arr[i].data.downs) * 100);
	if(centage > globals.percent){
	    out.push(arr[i]);
	}else{
	    removed += 1;
	}
    }    
    consoleLog('Removed by percentage: ' + removed);
    
    //reset
    arr = out.reverse();
    out = [];

    //revmove dupes urls, subreddits
    var dupes = ['url','subreddit'];
    for (dupe in dupes){
	dupe = dupes[dupe];
	for (i = arr.length - 1; i >= 0; i--) {
	    /* if the url is previously stored, delete it */
	    /* working backwards so that last remaining dupe is the top rated one */
	    if (typeof obj[arr[i].data[dupe]] != 'undefined') {
		delete obj[arr[i].data[dupe]];
	    }
	    /* store current url */
	    obj[arr[i].data[dupe]] = arr[i];
	}
	for (i in obj) {
	    out.push(obj[i]);
	}
	
	consoleLog('Removed ' + dupe + ': ' + (arr.length - out.length));
	
	//reset
	arr = out.reverse();
	out = [];
	obj = {};
    }
    consoleLog('Posts distilled: ' + arr.length);
    return arr;
}

function loadPosts(option) {
    var posts,
	sub = '',
        $listing = $('#listing');

    $listing.fadeOut(function() {
            $listing.empty().show(function() {
                    $listing.append('<div id="loading">Loading ...</div>');
                });
        });

    if (option === 'all') {
        sub = 'r/all/';
    }

    if(globals.posts !== null){
	display(filterDupes(globals.posts));
    }else{

	if(globals.cur_request !== null){
	    globals.cur_request.abort();
	}
	globals.cur_request = $.ajax({
		url: "http://reddit.com/" + sub + ".json?limit=100",
		dataType: "jsonp",
		jsonp: "jsonp",
		success: function(data) {
		    consoleLog('outer xhr');
		    globals.posts = data.data.children;
		    /* do it again!!! */
		    setTimeout(function(){
			    globals.cur_request = $.ajax({
				    url: "http://reddit.com/" + sub + ".json?limit=100&after=" + globals.posts[globals.posts.length -1].data.name,
				    dataType: "jsonp",
				    jsonp: "jsonp",
				    success: function(data) {
					consoleLog('inner xhr')
					globals.posts = globals.posts.concat(data.data.children);
					display(filterDupes(globals.posts));
				    },
				    error: function(jXHR, textStatus, errorThrown) {
					if (textStatus !== 'abort') {
					    $listing.empty().append('<div id="error">Could not load feed. Is reddit down?</div>');
					}
				    }
				});
			}, 2000);
		},
		error: function(jXHR, textStatus, errorThrown) {
		    if (textStatus !== 'abort') {
			$listing.empty().append('<div id="error">Could not load feed. Is reddit down?</div>');
		    }
		}
	    });
    }
}

function redditButton(id){
    var reddit_string="<iframe src=\"http://www.reddit.com/static/button/button2.html?width=51";
    reddit_string += '&id=' + id;
    reddit_string += '&newwindow=' + encodeURIComponent('1');
    reddit_string += "\" height=\"69\" width=\"51\" scrolling='no' frameborder='0'></iframe>";
    return reddit_string;
}

function longAgo(time) {
    time = time * 1000;
    var date = new Date(),
	now = date.getTime(),
	offset = date.getTimezoneOffset() * 1000,
	hours_ago = Math.round((now - time - offset) / 1000 / 60 / 60);
    return hours_ago;
}

function loadFront() {
    if(globals.view != 'front'){
	globals.posts = null;
    }
    globals.view = 'front';
    $('#front').off().addClass('selected');
    $('#all').off().removeClass().on('click', loadAll);
    loadPosts();
}

function loadAll() {
    if(globals.view != 'all'){
	globals.posts = null;
    }
    globals.view = 'all';
    $('#all').off().addClass('selected');
    $('#front').removeClass().off().on('click', loadFront);
    loadPosts('all');
}

function refresh() {
    if(globals.view == 'all'){
	loadAll();
    }else{
	loadFront();
    }
}

//safe console log
function consoleLog(string){
    if(window.console) {
        console.log(string);
    }
}

//start
$(function() {
	/* bind up check boxes */
	var boxes = ['imgur','quickmeme','images'];
	for(x in boxes){
	    $('#'+boxes[x]).click({'box': boxes[x]},function(event) {
		    globals[event.data.box] = ($('#'+event.data.box).is(':checked')) ? true : false;
		    refresh();
		});
	}
	//run
        refresh();
});