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
        var item = new Item(params);

        $.extend(item, options);

        if (item.priority) {
            queue.items.unshift(item);
        } else {
            queue.items.push(item);
        }

        queue.next();

        return item.deferred.promise();
    };

    var Item = function(params) {
        this.tries = 1;
        this.params = params;
        this.priority = false;
        this.deferred = $.Deferred();
    };

    var queue = {
        items: [],
        current: null,
        stopped: false,

        stop: function() {
            this.stopped = true;
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
                        queue.stop();

                        window.setTimeout(function() {
                            queue.start();
                        }, 10000);

                        queue.items.unshift(item); // add this item back to the queue
                        item.deferred.notify('rate limited, retrying in 10 seconds…');
                        break;

                    case 500: // server error
                    case 503: // unknown error
                        queue.stop();

                        window.setTimeout(function() {
                            queue.start();
                        }, 5000);

                        if (--item.tries) {
                            queue.items.unshift(item); // add this item back to the queue
                            item.deferred.notify('server error, retrying in 5 seconds…');
                        } else {
                            item.deferred.reject('error');
                        }
                        break;

                    default:
                        item.deferred.reject('error');
                        queue.next();
                        break;
                }
            });
        }
    };
})(jQuery);