/* 
   Simple String Metrics
   code adapted from:
   http://stackoverflow.com/questions/653157/
*/
var string_metrics = {
    /* remove chance of duplicate hits by removing duplicate pairs in each string */
    remove_dupes: function(arr) {
	var i,
	len=arr.length,
	out=[],
	obj={};

	for (i=0;i<len;i++) {
	    obj[arr[i]]=0;
	}
	for (i in obj) {
	    out.push(i);
	}
	return out;
    },

    get_pairs: function(string) {
	// Takes a string and returns a list of letter pairs
	var s = string.toLowerCase();
	// Improvement by Raymond May Jr. for english strings - ignore punctuation and non-word chars
	s = s.replace(/[^a-z 0-9]+/g,'');
	if(s.length > 2){
	    var v = new Array(s.length-1);
	    for (i = 0; i< v.length; i++){
		v[i] =s.slice(i,i+2);
	    }
	    // Improvement by RM remove dupes
	    return this.remove_dupes(v);
	}
	return [];
    },

    similarity: function(str1, str2) {
	/*
	  Perform pair comparison between two strings
	  and return a percentage match in decimal form
	*/
	var pairs1 = this.get_pairs(str1);
	var pairs2 = this.get_pairs(str2);
	var union = pairs1.length + pairs2.length;
	var hit_count = 0;
	for (x in pairs1){
	    for (y in pairs2){
		if (pairs1[x] == pairs2[y]){
		    hit_count++;
		}
	    }
	}
	return ((2.0 * hit_count) / union);
    }
}