/*
 * jQuery Ajax Queue v0.1
 * https://github.com/hubgit/jquery-ajax-queue
 *
 * Copyright 2014 Alf Eaton
 * Released under the MIT license
 * http://git.macropus.org/mit-license/
 *
 * Date: 2014-01-19
 */
(function($) {
    $.ajaxQueue = function(params, options) {
        var item = {
            params: params,
            tries: 1,
            priority: false,
            delay: { rate: 10000, server: 5000 },
            deferred: $.Deferred()
        };

        $.extend(item, options);

        if (item.priority) {
            queue.items.unshift(item);
        } else {
            queue.items.push(item);
        }

        queue.next();

        return item.deferred.promise();
    };

    var queue = {
        items: [],
        current: null,
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
            this.currentItem = null;
        },

        next: function() {
            if (this.stopped || this.currentItem || !this.items.length) {
                return;
            }

            var item = this.currentItem = this.items.shift();

            var request = $.ajax(item.params);

            request.done(function(data, textStatus, jqXHR) {
                queue.currentItem = null;
                item.deferred.resolve(data, textStatus, jqXHR);
                queue.next();
            });

            request.fail(function(jqXHR, textStatus, errorThrown) {
                queue.currentItem = null;

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
        }
    };
})(jQuery);
