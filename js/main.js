var senators = [];
var senatorNames = [];
var namesToIds = {}
var statesToReps = {};
var showMap = true;
$(function() {
	init();
});

function init() {
	// get list of senate members
	getSenators();
	$("#show_map").click(function(){
		if ($("#show_map").text() == "Show Map"){
			// Show the map change the text
			showTheMap();	
		}
		else {
			// Hide the map change the text
			hideTheMap();
		}
	});
	$("#show_all").click(function(){
		populateList('sen');
	});
	$("area").live('click', function(e) {
		e.preventDefault();
		state = $(this).attr("href");
		populateList('state', state);
	});
	$("span.senator").live('click', function(e) {
		id = $(this).attr("id");
		name = ""
		for(i in senators) {
			senator = senators[i];
			if(id==senator.id) {
				name = senator.first_name + senator.last_name
			}
		}
		getVotes(id);
		getMoney(name);
		getUserTweets(name);
		$("span.senator").attr("class", "senator");
		$(this).addClass("selected");
	});

	$('#search_form').submit(function(){
		// Get the id
		id = namesToIds[$('#search_input').val()];
		name = $('#search_input').val().replace(/\s/,'');
		if (!id){
			// alert no match
		}
		else{
			hideTheMap();
			getVotes(id);
			getMoney(name);
			getUserTweets(name);
		}
		// Clear the textbox
		$('#search_input').text('');
		return false;
	});
}

function hideTheMap(){
	$("#search_map").hide();
	$("#show_map").text('Show Map');
	$("#main2").show();
	$("#main3").show();
}

function showTheMap(){
	$("#main2").hide();
	$("#main3").hide();
	$("#search_map").show();
	$("#show_map").text('Hide Map');
}

function populateList(mode, arg){
	var membersToAppend = [];
	$('#senators').html('');
	if (mode == 'state'){
		// Populate the list with representatives from the state and return
		for (person in statesToReps[arg]){
			membersToAppend.push(statesToReps[arg][person]);
		}
	}
	else if (mode == 'sen'){
		// Populate the list with all senators	
	//	$("#senators").append($("<h3></h3>").text("Senators"));
		membersToAppend = senators;
	}
	else if (mode == 'cong'){
		// Populate the list with all congressmen
	}
	
	for (i in membersToAppend) {
		value = membersToAppend[i];
		html = "<span class='senator' id='" + value.id + "'>" + value.first_name + " " + value.last_name + "\t(" + value.state + ")</span>";
		if(value.party=="D") {
			html = "<span class='dem'></span>" + html;
		}
		else if(value.party=="R") {
			html = "<span class='rep'></span>" + html;
		}
		else {
			html = "<span class='ind'></span>" + html;
		}
		li = $("<li></li>").html(html);
		$("#senators").append(li);
	}
}

function sortOnState(a,b){
	if (a.state == b.state){
		return 0;
	}
	else if (a.state > b.state){
		// State is closer to beggining of alphabet, sort it to higher index
		return 1;
	}
	else{
		return -1;
	}
}

function getSenators() {
	$.getJSON("senators", function(rsp) {
		$.each(rsp.results[0].members, function(key, value) {
			senators.push(value);
			senatorNames.push(value.first_name + ' ' + value.last_name);
			namesToIds[value.first_name + ' ' + value.last_name] = value.id;
			// statesToReps is a dictionary of state -> list of reps
			if (!statesToReps[value.state]){
				statesToReps[value.state] = [];
			}
			statesToReps[value.state].push(value);
			states = [];
			for (state in statesToReps){
				states.push(state);
			}
		});
		// Sort by state
		senators = senators.sort(sortOnState);
		// Bind list of states to autocomplete for now
		$( "#search_input" ).autocomplete({
			source: senatorNames
		});
		populateList('sen');
	});
}

function getVotes(id) {
	// Senator has been clicked
	// Hide map if it is on screen
	hideTheMap();
	$("#main2").hide()
	data = {
		id: id
	};
	$.get("votes", data, function(xml) {
		$("#votes").html("");
		$("#votes").append($("<h3></h3>").text("Votes"));
		$(xml).find("vote").each(function() {
			v = $(this);
			if(v.find("question").text() == "On Passage of the Bill") {
				vote = $("<li></li>").html("<span class ='vote_label'>&nbsp" + v.find("position").text() + "&nbsp - </span>&nbsp;<span class='bill'><a title='View Bill on THOMAS' target='_blank' href='" + "http://thomas.loc.gov/cgi-bin/query/z?c111:" + v.find("number").text() + ":'>" + v.find("title").text() + "</a></span>");
				if(v.find("position").text() == "Yes") {
					vote.addClass("yes");
					vote.prepend("<img src='../css/up.png'>");
				}
				else {
					vote.addClass("no");
					vote.prepend("<img src='../css/down.png'>");
				}
				$("#votes").append(vote);
			}
			$("#main2").show()
		});
		/*$.each(rsp.results[0].votes, function(key, value) {
			if (value.question == "On Passage of the Bill") {
				vote = $("<li></li>").html("<span class='bill'>" + value.bill.title + "</span>");
				if (value.position == "Yes"){
					vote.addClass("yes");
				}
				else{
					vote.addClass("no");
				}
				$("#votes").append(vote);
			}
		});*/
	});
}

// This function formats numbers by adding commas
// Source: http://www.netlobo.com/number_format_javascript.html
function numberFormat(nStr,prefix){
    var prefix = prefix || '';
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1))
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    return prefix + x1 + x2;
}

function getMoney(name) {
	data = {
		name: name
	};
	$.getJSON("money", data, function(rsp) {
		$("#money").html("");
		$("#money").append($("<h3></h3>").text("Monies"));
		$.each(rsp.response.industries.industry, function(key, value) {
			industry = value["@attributes"].industry_name;
			indivs = value["@attributes"].indivs;
			indivs = numberFormat(indivs,"$")
			pacs = value["@attributes"].pacs;
			pacs = numberFormat(pacs,"$")
			total = value["@attributes"].total;
			total = numberFormat(total,"$")
			rank = value["@attributes"].rank;
			html = "<div class='lobby'>Contributions from <b>" + industry + "</b><br/>From Individuals: " + indivs + "<br/>From PACs: " + pacs + "<br/>Total Contributions: <b>" + total + "</b></div>";
			row = "";
			if(key%2==0) {
				row = "even";
			}
			else {
				row = "odd";
			}
			li = $("<li class='" + row + "'></li>").html(html);
			$("#money").append(li); 
		});
	});
}

function getUserTweets(username) {
	var url_twitter = "http://twitter.com/";
	var url_twitter_search= "http://search.twitter.com/search.json?callback=?&count=10&q=";
	$('#main3').hide('fast');
	var query = url_twitter_search + username;
	$.getJSON(query, function(results) {
		$('#statuses').contents().remove();
		$.each(results.results, function(key, value) {
			var status = $('<li class="status"></li>');
			status.appendTo('#statuses');
			var profile = $('<span class="thumb"></span>');
			profile.appendTo(status);
			var profileLink = $('<a></a>').attr('href', url_twitter + value.from_user);
			profileLink.appendTo(profile);
			$('<img />').attr('src', value.profile_image_url).appendTo(profileLink);
			var statusBody = $('<span class="status-body"></span>');
			statusBody.appendTo(status);
			var statusContent = $('<span class="status-content"></span>');
			statusContent.appendTo(statusBody);
			var name = $('<span class="bold"></span>');
			name.appendTo(statusContent);
			//var profileLink2 = $('<a></a>').attr('href', url_twitter + value.screen_name).html(value.screen_name);
			//profileLink2.appendTo(name);
			$('<span class="entry-content"></span>').html(' ' + value.text).appendTo(statusBody);
			var meta = $('<span class="meta"></span>').text(value.created_at);
			meta.appendTo(statusBody);
		});
		$('#main3').show('fast');
	});
}