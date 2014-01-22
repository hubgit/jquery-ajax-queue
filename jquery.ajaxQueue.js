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

        if (item.priority) {
            queue.items.unshift(item);
        } else {
            queue.items.push(item);
        }

        queue.next();

        return item.deferred.promise();
    };

    $.ajaxQueue.concurrent = function(concurrent) {
        queue.concurrent = concurrent;
    };

    var QueueItem = function(params) {
        this.params = params;
        this.tries = 1;
        this.priority = false;
        this.delay = { rate: 10000, server: 5000 };
        this.deferred = $.Deferred();
    };

    QueueItem.prototype.run = function() {
        var item = this;
        var request = $.ajax(item.params);

        request.done(function(data, textStatus, jqXHR) {
            queue.currentCount--;
            item.deferred.resolve(data, textStatus, jqXHR);
            queue.next();
        });

        request.fail(function(jqXHR, textStatus, errorThrown) {
            queue.currentCount--;

            switch (jqXHR.status) {
                case 403: // rate-limited
                    queue.stop(item.delay.rate);
                    queue.items.unshift(item); // add this item back to the queue
                    item.deferred.notify(jqXHR, textStatus, item);
                    break;

                case 500: // server error
                case 503: // unknown error
                    queue.stop(item.delay.server);

                    if (--item.tries) {
                        queue.items.unshift(item); // add this item back to the queue
                        item.deferred.notify(jqXHR, textStatus, item);
                    } else {
                        item.deferred.reject(jqXHR, textStatus, errorThrown);
                    }
                    break;

                default:
                    item.deferred.reject(jqXHR, textStatus, errorThrown);
                    queue.next();
                    break;
            }
        });
    };

    var queue = {
        items: [],
        concurrent: 1,
        currentCount: 0,
        stopped: false,

        stop: function(delay) {
            this.stopped = true;

            if (delay) {
                window.setTimeout(function() {
                    queue.start();
                }, delay);
            }
        },

        start: function()  {
            this.stopped = false;
            this.next();
        },

        clear: function(){
            this.items = [];
            this.currentCount = 0;
        },

        next: function() {
            if (this.stopped) {
                return;
            }

            while (this.items.length && this.currentCount < this.concurrent) {
                this.currentCount++;
                this.items.shift().run();
            }
        }
    };
})(jQuery);
