# jQuery Ajax Queue

[Demonstration](http://git.macropus.org/jquery-ajax-queue/demo/)

## Usage

### Make a request

    $.ajaxQueue(params, options);

`params`: parameters object, passed through to [jQuery.ajax](http://api.jquery.com/jquery.ajax/)

`options`: options object, for the queued item

* `queue: string`: queue name (default = 'default')
* `priority: boolean`: true = insert at the front of the queue (default = false)
* `tries: integer`: retry the request n times if it fails due to server error (default = 3)
* `limit: integer`: delay, in milliseconds, after this request (default = 0)

### Set the number of concurrent requests

    $.ajaxQueue.concurrent(n);

`n`: how many requests to run concurrently (will cause responses to return out of sequence)
