# jQuery Ajax Queue

[Demonstration](http://git.macropus.org/jquery-spotify/demo/)

## Usage

    $.ajaxQueue(params, options);
    
`params`: parameters object, passed through to [jQuery.ajax](http://api.jquery.com/jquery.ajax/)

`options`: options object, for the queued item

* `priority: true`: insert at the front of the queue
* `tries: 3`: retry the request 3 times if it fails due to server error
