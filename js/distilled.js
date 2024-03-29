/* global namespace */
var globals = {
    /* filter defauls */
    'imgur': true,
    'memes': true,
    'images': false,
    'subreddits': true,
    'percent': 55, /* posts with a total up percentage below are filtered out */
    
    /* filter settings */
    'optional_filters': {'imgur': {'type': 'url', 'needles': ['imgur.com']},
			 'memes': {'type': 'url', 'needles': ['quickmeme.com','qkme.me',
							      'memegenerator.net', 'memecrunch.com',
							      'weknowmemes.com']},
			 'images': {'type': 'url', 'needles': ['jpg','png','gif','imgur.com',
							       'flickr.com','deviantart.com']},
			 'subreddits': {'type': 'subreddit', 'needles': ['circlejerk','funny']}
    },
    
    /* status tracking vars */
    'view': 'all',
    'posts': null,
    'cur_request': null,
    'display': true /* used to break the display loop */
}

/* this function is recursive for sequential item displaying */
function display(data, item) {
    var content, button, centage, thumbnail = '', embed = '', seft_text = '', $listing = $('#listing');
    var x = typeof(item) != 'undefined' ? item : 0;

    if(x == 0){
	$listing.stop(true,false).empty();
    }

    /* gather html */
    button = redditButton(data[x].data.name);
    centage = Math.round(data[x].data.ups / (data[x].data.ups + data[x].data.downs) * 100);
    if(data[x].data.thumbnail == 'default' || data[x].data.thumbnail == 'self' || data[x].data.thumbnail == 'nsfw'){
	//do nothing
    }else if(data[x].data.thumbnail !== ''){
	thumbnail = '<img src="' + data[x].data.thumbnail + '" width="70"/>';
    }
    //media & self
    if(typeof(data[x].data.media_embed.content) != 'undefined'){
	embed = '<div class="details">' + $("<div/>").html(data[x].data.media_embed.content).text() + '</div>';
    }else if(typeof(data[x].data.selftext_html) != null){
        embed = '<div class="details">' + $("<div/>").html(data[x].data.selftext_html).text() + '</div>';
    }

    /* this is ugly, but simpler and far fewer lines than creating each dom element objectively */
    content = '<div id="' + data[x].data.id + '" class="thing hidden"><div class="vote-button"></div><a href="' + data[x].data.url + '" class="thumbnail" target="_blank">' + thumbnail + '</a><div class="entry">' + '<p class="title">' + '<a href="' + data[x].data.url + '" class="title" target="_blank">' + data[x].data.title + '</a>' + ' <span class="domain">(' + data[x].data.domain + ')</span>' + '</p>' + '<p class="tagline">' + '<span class="score">' + data[x].data.score + '</span> (<span class="ups">' + data[x].data.ups + '</span>|<span class="downs">' + data[x].data.downs + '</span>) ' + centage +'% submitted ' + longAgo(data[x].data.created_utc) + ' hours ago by ' + '<a href="http://reddit.com/user/' + data[x].data.author + '" class="author" target="_blank">' + data[x].data.author + '</a> to ' + '<a href="http://reddit.com/r/' + data[x].data.subreddit + '" class="subreddit" target="_blank">' + data[x].data.subreddit + '</a>' + '</p>' + '<ul class="flat-list">' + '<li><a href="http://reddit.com' + data[x].data.permalink + '" class="comments" target="_blank">' + data[x].data.num_comments + ' comments</a></li>' + '</ul>' + embed + '</div></div>' + '<div class="clearleft"></div>';

    /* display html */
    $listing.append(content);
    $('#'+data[x].data.id).on('mouseenter',{id: data[x].data.id, button: button}, showButton);
    $('#'+data[x].data.id).fadeIn(100,function(){
	    if(x < data.length - 1 && globals.display){
		/* recurse */
		display(data, x+1);
	    }
	});
}

function showButton(event){
    consoleLog('mouseenter event');
    if(document.getElementById(event.data.id).getElementsByClassName('vote-button')[0].innerHTML == ''){
	document.getElementById(event.data.id).getElementsByClassName('vote-button')[0].innerHTML = event.data.button;
    }
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
		    needle = (needle === '' ? null : needle.toLowerCase());
		    found = arr[i].data[globals.optional_filters[opt].type].toLowerCase().indexOf(needle) == -1 ? found : true;
		}
		if(!found){
		    out.push(arr[i]);
		}else{
		    removed += 1;
		}
	    }

	    $('#status-' + opt).html(removed);
	    consoleLog('Removed ' + opt + ' (' + globals.optional_filters[opt].type + '): ' + removed);

	    //reset
	    arr = out.reverse();
	    out = [];
	}else{
	    $('#status-' + opt).html('0');
	}
    } 

    //remove below percentage
    removed = 0;
    for (i = arr.length - 1; i >= 0; i--) {
	centage = Math.round(arr[i].data.ups / (arr[i].data.ups + arr[i].data.downs) * 100);
	if(centage >= globals.percent){
	    out.push(arr[i]);
	}else{
	    removed += 1;
	}
    }
    $('#status-percent').html(removed);
    consoleLog('Removed by percentage: ' + removed);
    
    //reset
    arr = out.reverse();
    out = [];

    //remove by similar titles
    removed = 0;
    for (this_item = arr.length - 1; this_item >= 0; this_item--) {
	var hit = 0;
	for (that_item in arr){
	    if(this_item > that_item
               && Math.abs(arr[this_item].data.title.length - arr[that_item].data.title.length) < 10){
		var similar = string_metrics.similarity(arr[this_item].data.title, arr[that_item].data.title);
		if(similar > 0.7){
		    hit += 1;
		    consoleLog('hit similar: ' + arr[this_item].data.title + ', ' + arr[that_item].data.title);
		}
	    }
	}
	if(hit == 0){
	    out.push(arr[this_item]);
	}
    }
    consoleLog('Removed by similar titles: ' + (arr.length - out.length));

    //reset                                                                                                                       
    arr = out.reverse();
    out = [];

    //revmove dupes urls
    var dupes = ['url'];
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

    
    //limit count per sr
    var limit = 3;
    var counts = [];
    for(i = 0; i < arr.length; i++) {
	if(typeof(counts[arr[i].data.subreddit]) == 'undefined'){
	    counts[arr[i].data.subreddit] = 0;
	}
	counts[arr[i].data.subreddit] += 1;
	if(counts[arr[i].data.subreddit] <= limit){
	    out.push(arr[i]);
	}
    }
    consoleLog('Removed subreddit: ' + (arr.length - out.length));

    arr = out;
   
    consoleLog('Posts distilled: ' + arr.length);
    return arr;
}

function sinkImages(arr) {
    var needle, found,
	images = [], posts = [];

    for (i = 0; i < arr.length; i++) {
	found = false;
	for(needle in globals.optional_filters.images.needles){
	    needle = globals.optional_filters.images.needles[needle];
	    found = arr[i].data[globals.optional_filters.images.type].indexOf(needle) == -1 ? found : true;
	}
	if(found){
	    images.push(arr[i]);
	}else{
	    posts.push(arr[i]);
	}
    }

    arr = posts.concat(images);
    
    return arr;
}

function loadPosts(option) {
    var posts,
	sub = '',
        $listing = $('#listing');

    /* try and break display loop */
    globals.display = false;

    $listing.fadeOut(function() {
            $listing.empty().show(function() {
                    $listing.append('<div id="loading">Loading ...</div>');
                });
        });

    if (option === 'all') {
        sub = 'r/all/';
    }

    if(globals.posts !== null){
	globals.display = true;
	display(sinkImages(filterDupes(globals.posts)));
    }else{
	/* only want results from 24 hours or newer */
	var time_back = 12 * 60 * 60,
	    date = new Date(),
	    unixtime_ms = date.getTime(),
	    unixtime = parseInt(unixtime_ms / 1000);
	var timestamp = unixtime - time_back;

	if(globals.cur_request !== null){
	    globals.cur_request.abort();
	}
	globals.cur_request = $.ajax({
		url: "http://reddit.com/" + sub + "search/.json?q=timestamp%3A"+timestamp+"..&sort=top&restrict_sr=on&limit=100",
		dataType: "jsonp",
		jsonp: "jsonp",
		success: function(data) {
		    globals.posts = data.data.children;
		    /* do it again!!! */
		    setTimeout(function(){
			    globals.cur_request = $.ajax({
				    url: "http://reddit.com/" + sub + "search/.json?q=timestamp%3A"+timestamp+"..&sort=top&after=" + globals.posts[globals.posts.length -1].data.name+"&restrict_sr=on&limit=100",
				    dataType: "jsonp",
				    jsonp: "jsonp",
				    success: function(data) {
					globals.display = true;
					globals.posts = globals.posts.concat(data.data.children);
					display(sinkImages(filterDupes(globals.posts)));
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
    return false;
}

function loadAll() {
    if(globals.view != 'all'){
	globals.posts = null;
    }
    globals.view = 'all';
    $('#all').off().addClass('selected');
    $('#front').removeClass().off().on('click', loadFront);
    loadPosts('all');
    return false;
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

var UserData = {
    loadSettings: function(){
	/* subreddit filters */
	if(localStorage.getItem('subreddits') !== null){
	    var subreddits = JSON.parse(localStorage.getItem('subreddits'));
	    globals.optional_filters.subreddits.needles = subreddits;
	    /* show in doc */
	    $('#subreddits').val(subreddits.join(','));
	}else{
	    $('#subreddits').val(globals.optional_filters.subreddits.needles.join(','));
	}
    },

    storeSettings: function(){
	/* subreddit filters */
	localStorage.setItem('subreddits', JSON.stringify(globals.optional_filters.subreddits.needles));
    }
}

//start
$(function() {
	/* bind up check boxes */
	var boxes = ['imgur','memes','images'];
	for(x in boxes){
	    $('#'+boxes[x]).click({'box': boxes[x]},function(event) {
		    globals[event.data.box] = ($('#'+event.data.box).is(':checked')) ? true : false;
		    refresh();
		});
	}
	$('#percent').change(function(){
		globals.percent = $(this).val();
		refresh();
	    });
	$('#subreddits-apply').click(function(){
		var subreddits = $('#subreddits').val();
		if(subreddits != null){
		    subreddits = subreddits.split(',');
		    /* trim */
		    for(var i in subreddits){
			subreddits[i] = $.trim(subreddits[i]);
		    }
		    globals.optional_filters.subreddits.needles = subreddits;
		    $('#subreddits').val(subreddits.join(','));
		    UserData.storeSettings();
		    refresh();
		}
	    });
	/* prevent form submit */
	$('#filters>form').submit(function(){return false;});

	/* load user settings */
	UserData.loadSettings();

	//run
        refresh();
});