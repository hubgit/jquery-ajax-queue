/*
 * jQuery Ajax Queue v0.2
 * https://github.com/hubgit/jquery-ajax-queue
 *
 * Copyright 2014 Alf Eaton
 * Released under the MIT license
 * http://git.macropus.org/mit-license/
 *
 * Date: 2014-01-22
 */
(function($) {
    $.ajaxQueue = function(params, options) {
        var item = $.extend(new QueueItem(params), options);

        if (!queues[item.queue]) {
            queues[item.queue] = new Queue;
        }

        item.queue = queues[item.queue];

        if (item.priority) {
            item.queue.items.unshift(item);
        } else {
            item.queue.items.push(item);
        }

        item.queue.next();

        return item.deferred.promise();
    };

    $.ajaxQueue.concurrent = function(concurrent, queue) {
        queue = queue || 'default';
        queues[queue].concurrent = concurrent;
    };

    var QueueItem = function(params) {
        this.params = params;
        this.tries = 1;
        this.priority = false;
        this.limit = 0;
        this.delay = { rate: 10000, server: 5000 };
        this.deferred = $.Deferred();
        this.queue = 'default';
    };

    QueueItem.prototype.run = function() {
        var item = this;

        var request = $.ajax(item.params);

        item.deferred.notify(request, 'start', item);

        request.done(function(data, textStatus, jqXHR) {
            item.queue.currentCount--;
            item.deferred.resolve(data, textStatus, jqXHR);

            window.setTimeout(function() {
                item.queue.next();
            }, item.limit);
        });

        request.fail(function(jqXHR, textStatus, errorThrown) {
            item.queue.currentCount--;

            switch (jqXHR.status) {
                case 403: // rate-limited
                    item.queue.stop(item.delay.rate);
                    item.queue.items.unshift(item); // add this item back to the queue
                    item.deferred.notify(jqXHR, 'rate-limit', item);
                    break;

                case 500: // server error
                case 503: // unknown error
                    item.queue.stop(item.delay.server);

                    if (--item.tries) {
                        item.queue.items.unshift(item); // add this item back to the queue
                        item.deferred.notify(jqXHR, 'retry', item);
                    } else {
                        item.deferred.reject(jqXHR, textStatus, errorThrown);
                    }
                    break;

                default:
                    item.deferred.reject(jqXHR, textStatus, errorThrown);
                    item.queue.next();
                    break;
            }
        });
    };

    var Queue = function() {
        this.items = [];
        this.concurrent = 1;
        this.currentCount = 0;
        this.stopped = false;
    };

    Queue.prototype.stop = function(delay) {
        this.stopped = true;

        if (delay) {
            var queue = this;

            window.setTimeout(function() {
                queue.start();
            }, delay);
        }
    };

    Queue.prototype.start = function()  {
        this.stopped = false;
        this.next();
    };

    Queue.prototype.clear = function(){
        this.items = [];
        this.currentCount = 0;
    };

    Queue.prototype.next = function() {
        if (this.stopped) {
            return;
        }

        while (this.items.length && this.currentCount < this.concurrent) {
            this.currentCount++;
            this.items.shift().run();
        }
    };

    var queues = { default: new Queue };
})(jQuery);
