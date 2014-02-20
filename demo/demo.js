$(function() {
	var output = $('#articles');

	var urls = [
		'https://peerj.com/articles/1.json',
		'https://peerj.com/articles/2.json',
		'https://peerj.com/articles/3.json'
	];

	urls.forEach(function(url) {
		var request = $.ajaxQueue({ url: url }, { queue: 'articles' });

		request.done(function(data) {
			output.text(output.text() + '\n' + data.title);
		});
	});
});

$(function() {
	var output = $('#preprints');

	var urls = [
		'https://peerj.com/preprints/1.json',
		'https://peerj.com/preprints/2.json',
		'https://peerj.com/preprints/3.json'
	];

	urls.forEach(function(url) {
		var request = $.ajaxQueue({ url: url }, { queue: 'preprints' });

		request.done(function(data) {
			output.text(output.text() + '\n' + data.title);
		});
	});
});