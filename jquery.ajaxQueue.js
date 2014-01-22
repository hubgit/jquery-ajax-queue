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
        var adding;
        var promises = [];

        if ($.isArray(params)) {
            adding = $.map(params, function() {
                var item = new QueueItem(params);
                promises.push(item.deferred.promise());

                return $.extend(item, options);
            });
        } else {
            var item = new QueueItem(params);
            promises.push(item.deferred.promise());

            adding = $.extend(item, options);
        }

        if (options.priority) {
            queue.items.unshift(adding);
        } else {
            queue.items.push(adding);
        }

        queue.next();

        return $(promises);
    };

    var QueueItem = function(params) {
        this.params = params;
        this.tries = 1;
        this.delay = { rate: 10000, server: 5000 };
        this.deferred = $.Deferred();
    };

    QueueItem.prototype.run = function() {
        var item = this;
        var request = $.ajax(item.params);

        request.done(function(data, textStatus, jqXHR) {
            queue.progress = null;
            item.deferred.resolve(data, textStatus, jqXHR);
            queue.next();
        });

        request.fail(function(jqXHR, textStatus, errorThrown) {
            queue.progress = null;

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
        chunks: 1,
        progress: 0,
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
            this.progress = null;
        },

        next: function() {
            if (this.stopped || this.progress || !this.items.length) {
                return;
            }

            var item = this.items.shift();

            if ($.isArray(item)) {
                this.progress = item.length;

                $.each(item, function() {
                    this.run();
                });
            } else {
               this.progress = 1;
               item.run();
            }
        }
    };
})(jQuery);
