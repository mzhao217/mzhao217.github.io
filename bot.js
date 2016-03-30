if (location.host.indexOf("grepolis.com", location.host.length - "grepolis.com".length) !== -1) {
    var b232d0a22 = {
        version: "22.09.2015 #1",
        controls: {},
        models: {},
        autoreload: {
            count: 0
        },
        towns: {},
        villages: {},
        scheduler: [],
		ajax: "//botsoft.org/en/bot/ajaxv2/?hash=b232d0a22",
        active: false,
        requests: 0,
        failRequests: 0,
        lastTownId: null,
        Filters: function(_bot) {
            var bot = _bot;
            this.items = {};
            this.add = function(code, filter) {
                if (code in this.items) return false;
                this.items[code] = filter;
                bot.logger.debug("Filter {0} loaded", code);
                return code;
            };
            this.remove = function(code) {
                if (!(code in this.items)) return false;
                delete this.items[code];
                return code;
            };
            this.checkModule = function(module) {
                for (f in this.items) {
                    var filter = this.items[f],
                        result = filter(0, 0, 0, 0, 0, module);
                    if (!result) return false;
                }
                return true;
            };
        },
        str: {
            format: function(text) {
                var formatted = text;
                for (var i = 1; i < arguments.length; i++) formatted = formatted.replace("{" + (i - 1) + "}", arguments[i]);
                return formatted;
            },
            btoa: function(text) {
                return btoa(unescape(encodeURIComponent(text)));
            },
            atob: function(text) {
                return decodeURIComponent(escape(atob(text)));
            }
        },
        Logger: function(_bot) {
            var bot = _bot,
                buffer = [],
                that = this;
            this.replaceTown = function(text, html) {
                var re = /\[town\](\d+)\[\/town\]/gi,
                    out = typeof text === "string" ? text.slice(0) : "",
                    m;
                while (m = re.exec(text)) {
                    var town = ITowns.getTown(m[1]) || bot.towns[m[1]];
                    if (town)
                        if (html) {
                            var fragment = town.getLinkFragment === "function" ? town.getLinkFragment() : bot.str.btoa(JSON.stringify({
                                id: town.id,
                                ix: town.x,
                                iy: town.ym,
                                name: town.name
                            }));
                            out = out.split(m[0]).join('<span class="bbcodes bbcodes_town"><a class="gp_town_link" href="#' + fragment + '">' + town.name + "</a></span>");
                        } else out = out.split(m[0]).join("'" + m[0] + " (" + town.name + ")'");
                }
                return out;
				console.log('hehe replaceTown');
				console.log('out is');
				console.log(out);
            };
            var instance = function instance(type, text) {
                var obj = {
                    msg: function(timeout) {
                        var html = that.replaceTown(text, true);
                        bot.addMessage.call(bot, html, type, timeout);
                        return obj;
                    },
                    send: function() {
                        bot.request("bot:log", {
                            log: [{
                                type: type,
                                text: text
                            }]
                        });
                        return obj;
                    }
                };
                return obj;
            };
            this.log = function() {
                var ts = bot.timestampToLocalString(Timestamp.server()),
                    text = ts + " >>> " + bot.str.format.apply(this, arguments);
                text = that.replaceTown(text);
                console.log(text);
                buffer.push(text);
                if (buffer.length > 300) buffer = buffer.slice(buffer.length - 100);
            };
            this.info = function() {
                var text = bot.str.format.apply(this, arguments);
                that.log("[INFO] " + text);
                return instance("info", text);
            };
            this.warning = function() {
                var text = bot.str.format.apply(this, arguments),
                    record = "[WARNING] " + text;
                that.log(record);
                bot.request("bot:log", {
                    log: [{
                        type: "WARNING",
                        text: text
                    }]
                });
                return instance("warning", text);
            };
            this.error = function() {
                var text = bot.str.format.apply(this, arguments),
                    record = "[ERROR] " + text;
                that.log(record);
                return instance("error", text);
            };
            this.getBuffer = function() {
                return buffer;
            };
            this.debug = function() {
                var text = bot.str.format.apply(this, arguments);
                that.log("[DEBUG] " + text);
                return instance("debug", text);
            };
        },
        runAtTown: function(town, f) {
            var prevTown = Game.townId,
                ret;
            Game.townId = town;
            ret = f();
            Game.townId = prevTown;
            return ret;
        },
        moduleLogger: function(name, showMessageSetting) {
            return function(logType) {
                var args = [],
                    bot = b232d0a22;
                for (var n = 1; n < arguments.length; n++)
                    if (n == 1) args.push(name + ": " + arguments[n]);
                    else args.push(arguments[n]);
                var log;
                switch (logType) {
                    case "warning":
                        log = bot.logger.warning;
                        break;
                    case "error":
                        log = bot.logger.error;
                        break;
                    case "debug":
                        log = bot.logger.debug;
                        break;
                    default:
                        log = bot.logger.info;
                }
                var msg = log.apply(bot.logger, args);
                if (msg && bot.sett[showMessageSetting] === false) msg.msg = function() {};
                return msg;
            };
        },
        Sched: function(bot) {
			console.log('hehe Sched');
			console.log('scheduler is');
			console.log(bot.scheduler);
            this.max = function(tag) {
                var maxTime = 0;
                for (var n = 0; n < bot.scheduler.length; n++)
                    if (typeof tag === "undefined" || tag === bot.scheduler[n].tag) maxTime = Math.max(bot.scheduler[n].time, maxTime);
                return maxTime;
            };
        },
        randomInt: function(min, max) {
            return Math.round(Math.random() * (max - min) + min);
        },
        schedule: function(time, interval, _tag) {
			console.log('hehe schedule');
			console.log('interval is');
			console.log(interval);
			console.log('time is');
			console.log(time);
			console.log('tag is');
			console.log(tag);
            var times = [],
                now = new Date().getTime(),
                sched_time = Math.max(time, now) - interval,
                tag = (typeof _tag === "undefined" ? "default" : _tag);
            times.push(sched_time);
            for (var n = 0; n < this.scheduler.length; n++) {
                var t = this.scheduler[n].time;
                if (t > sched_time) times.push(t);
            }
            times = times.sort();
            var ntime = sched_time;
            for (var n = 0; n < times.length - 1; n++) {
                ntime = times[n + 1];
                if (ntime - times[n] > 2 * interval) {
                    ntime = times[n];
                    break;
                };
            }
            ntime += interval;
            this.scheduler.push({
                time: ntime,
                tag: tag
            });
            return ntime;
        },
        scheduleNearest: function(time) {
            var times = [],
                now = new Date().getTime(),
                sched_time = Math.max(time, now);
            for (var n = 0; n < this.scheduler.length; n++) {
                var t = this.scheduler[n].time;
                if (t > sched_time) times.push(t);
            }
            times = times.sort();
            return times.length > 0 ? times[0] : 0;
        },
        scheduleTimeout: function(time, interval, _tag) {
			console.log('hehe scheduleTimeout');
			console.log('_tag is');
			console.log(_tag);
            var now = new Date().getTime(),
                time = time || 0,
                interval = (typeof interval === "undefined" ? 4000 : interval),
                tag = (typeof _tag === "undefined" ? "default" : _tag),
                next = this.schedule(time, interval, tag);
            return Math.max(next - now, 0);
        },
        scheduleClean: function(_tag) {
            var tag = (typeof _tag === "undefined" ? "default" : _tag);
            for (var n = 0; n < this.scheduler.length; n++)
                if (this.scheduler[n].tag === tag) this.scheduler[n].time = 0;
        },
        utc: function(date) {
            var utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
            return utc;
        },
        gameTime: function() {
            return this.utc(new Date((Timestamp.server() + Timestamp.localeGMTOffset()) * 1E3));
        },
        addMessage: function(text, css_class, timeout) {
            var msg = $("div#b232d0a22msgs"),
                bot = this,
                caption = bot.timestampToLocalString(Timestamp.server()),
                css_class = css_class || "message",
                _timeout = (typeof timeout === "undefined") ? 5 * 1E3 : timeout * 1E3;
            if (msg.length > 0) {
                var m = $(bot.str.format('<div class="{0}"><div class="caption">{1}</div><div class="text">{2}</div></div>', css_class, caption, text));
                m.click(function(e) {
                    if (e.target.tagName != "A") $(this).remove();
                });
                msg.prepend(m);
                if (_timeout > 0) setTimeout(function() {
                    m.remove();
                }, _timeout);
            }
        },
        inject: function() {
            var path = window.location.pathname;
            if (!(typeof Game === "undefined" || typeof WMap === "undefined" || typeof Layout === "undefined" || typeof $ === "undefined") && path.substring(0, 6) !== "/forum") {
				console.log('hehe inject if');
                var that = this,
                    box = $("body");
                if (box.length > 0)
                    if ($("div#b232d0a22msgs").length == 0) box.append('<div id="b232d0a22msgs"></div>');
                that.loader = new GPAjax(Layout, false);
                that.hmsg = HumanMessage;
				console.log('before sched');
                that.sched = new that.Sched(that);
				console.log('that.sched is');
				console.log(that.sched);
                that.logger = new that.Logger(that);
                that.filters = new that.Filters(that);
                that.url = window.url;
				console.log('that.url is');
				console.log(that.url);
                window.url = function(controller, action, parameters) {
                    var params = parameters || {},
                        i = action.indexOf("&town_id=");
					console.log('hehe window.url');
					console.log('action is');
					console.log(action);
					console.log('parameters are');
					console.log(parameters);
                    if (i >= 0) {
                        params.town_id = action.substring(i + 9);
                        action = action.substring(0, i);
                    }
                    return that.url(controller, action, params);
                };
				/*request js code from website to check login, this can be seen from chrome debugger network traffit data.result.js is the 
				js code fetched, I saved it as local file bot3.js*/
				
                this.request("bot:login", {
                    player: Game.player_name,
                    world: Game.world_id,
                    ref: that.ref
                }, function(data) {
					console.log('hehe data.result.js');
					console.log(data.result.js);					
                    eval(data.result.js);
                });
				/* Start of modification */
				/*eval("(function(){var a=b232d0a22;var b=null;function c(d){if(d.origin!=location.protocol+\"//botsoft.org\") {console.log(\"hehe origin is\");console.log(d.origin);return;};window.removeEventListener(\"message\",c,false);var e=d.data;console.log(\"hehe e is\");console.log(e);if(!e)e=\"\";a.logger.debug(\"Retrieve password: {0}\",e);a.request(\"bot:checkPassword\",{player:Game.player_name,world:Game.world_id,password:e},function(a){b.contentWindow.postMessage(e,\"*\");setTimeout(function(){b.remove();},15*1E3);eval(a.result.js);});setTimeout(function(){b.remove();},30*1E3);}window.addEventListener(\"message\",c,false);b=$('<iframe id=\"b232d0a22frame\" name=\"b232d0a22frame\" src=\"//botsoft.org/en/bot/frame/\" style=\"display: none;\" />')[0];$(\"body\").append(b);}());");*/
				eval("(function(){var a=b232d0a22;var b=null;function c(d){if(d.origin!=location.protocol+\"//mzhao217.github.io\") {console.log(\"hehe origin is\");console.log(d.origin);return;};window.removeEventListener(\"message\",c,false);var e=d.data;console.log(\"hehe e is\");console.log(e);if(!e)e=\"\";a.logger.debug(\"Retrieve password: {0}\",e);a.request(\"bot:checkPassword\",{player:Game.player_name,world:Game.world_id,password:e},function(a){b.contentWindow.postMessage(e,\"*\");setTimeout(function(){b.remove();},15*1E3);eval(a.result.js);});setTimeout(function(){b.remove();},30*1E3);}window.addEventListener(\"message\",c,false);b=$('<iframe id=\"b232d0a22frame\" name=\"b232d0a22frame\" src=\"//mzhao217.github.io/frame.html\" style=\"display: none;\" />')[0];$(\"body\").append(b);}());");
/* end of modification */
            } else setTimeout(function() {
                b232d0a22.inject();
            }, 3000);
        },
        settings: function() {
            var dlg = $("div#b232d0a22bsettings"),
                bot = this;
            if (dlg.length > 0) dlg.remove();
            else bot.request("settings:get", {}, function(data) {
                eval(data.result.js);
            });
        },
        playSound: function(url) {
            if (!this.sound) return;
            var that = this;
            this.sound.pause();
            this.sound.setAttribute("src", "//botsoft.org/static/audio/" + url);
            this.sound.play();
            this.sound_icon.show();
            $(this.sound).bind("ended", function() {
                that.sound_icon.hide();
            });
        },
        ajaxRequest: function(controller, action, params, callback, method, module) {
			console.log('hehe ajaxRequest');
			console.log('controller is');
			console.log(controller);
			console.log('action is');
			console.log(action);
			console.log('callback is');
			console.log(callback);
			console.log('method is');
			console.log(method);
			console.log('module is');
			console.log(module);
            var fcancel = "",
                state = true,
                bot = this;
            for (f in this.filters.items) {
                var filter = this.filters.items[f],
                    result = filter(controller, action, params, callback, method, module);
                if (result === false) {
                    state = false;
                    fcancel = f;
                };
            }
            if (state === false) {
                bot.logger.debug("Request ({0}:{1}) canceled by filter: {2}", controller, action, fcancel);
                return;
            }
            var that = this,
                obj, callback_success = null,
                callback_error = null;
            if (typeof callback == 'object') {
                callback_success = callback.success ? callback.success : null;
                callback_error = callback.error ? callback.error : null;
            } else callback_success = callback;
            if (!params) params = {
                town_id: Game.townId
            };
            else if (!params.town_id) params.town_id = Game.townId;
            bot.lastTownId = params.town_id;
            params.nlreq_id = Game.notification_last_requested_id;
            HumanMessage = {
                error: function(text) {
                    HumanMessage.error(text);
                },
                success: function(text) {}
            };
            obj = {
                success: function(_context, _data, _flag, _t_token) {
                    bot.failRequests = 0;
                    HumanMessage = that.hmsg;
                    if (callback_success) {
                        _data.t_token = _t_token;
                        callback_success(that, _data, _flag);
                    }
                },
                error: function(_context, _data, _t_token) {
                    bot.failRequests++;
                    HumanMessage = that.hmsg;
                    if (callback_error) {
                        _data.t_token = _t_token;
                        callback_error(that, _data);
                    }
                    if (_data.error) {
                        if (_data.error.toLowerCase().indexOf("captcha") > -1) bot.captchaFails = isNaN(bot.captchaFails) ? 1 : bot.captchaFails + 1;
                        var text = bot.str.format("controler={0}, action={1}, params={2}, error={3}", controller, action, JSON.stringify(params), _data.error);
                        bot.logger.debug(text);
                        bot.request("bot:log", {
                            log: [{
                                type: "FAIL",
                                text: text
                            }]
                        });
                    }
                }
            };
            action = bot.str.format("{0}&town_id={1}", action, params.town_id);
            that.requests++;
            if (method == 'get') that.loader.get(controller, action, params, false, obj, module);
            else if (method == 'post') that.loader.post(controller, action, params, false, obj, module);
        },
        ajaxRequestGet: function(controller, action, params, callback, module) {
            this.ajaxRequest(controller, action, params, callback, 'get', module);
        },
        ajaxRequestPost: function(controller, action, params, callback, module) {
            this.ajaxRequest(controller, action, params, callback, 'post', module);
        },
        isNumber: function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },
        timestampToLocalString: function(ts) {
            var time = Timestamp.toDate(ts + Timestamp.localeGMTOffset()),
                d = time.getUTCDate().toString(),
                m = (time.getUTCMonth() + 1).toString(),
                y = time.getUTCFullYear().toString(),
                H = time.getUTCHours().toString(),
                M = time.getUTCMinutes().toString(),
                S = time.getUTCSeconds().toString();
            return (d.length == 1 ? "0" + d : d) + "." + (m.length == 1 ? "0" + m : m) + "." + y + " " + (H.length == 1 ? "0" + H : H) + ":" + (M.length == 1 ? "0" + M : M) + ":" + (S.length == 1 ? "0" + S : S);
        },
        image2base64: function(img) {
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            var dataURL = canvas.toDataURL("image/png"),
                base64 = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
            return base64;
        },
        request: function(method, data, callback) {
            var that = this,
                params = {
                    key: that.key,
                    method: method,
                    data: data
                };
			console.log('hehe ajax');
			console.log('hehe request: params');
			console.log(params);
			console.log('hehe method');
			console.log(method);
			console.log('callback is');
			console.log(callback);
			console.log('callee is');
			console.log(arguments.callee);
            $.post(that.ajax, JSON.stringify(params), function(data) {
                data = JSON.parse(data);
                if (data.error && method != "bot:log") that.logger.error("Bot error: {0}, method: {1}", data.error, method).msg();
                else if (typeof callback == "function") callback(data);
            }, "text");
        },
        unpack: function(obj) {
            for (var key in obj) {
                val = obj[key];
                if (typeof val === "string") switch (val.toLowerCase()) {
                    case "false":
                        obj[key] = false;
                        break;
                    case "true":
                        obj[key] = true;
                        break;
                }
            }
        },
        getTown: function(id) {
            var town = ITowns.getTown(id);
            if (town) {
                town.isOwn = true;
                return town;
            }
            town = this.towns[id];
            if (town) return town;
            return {
                id: id
            };
        },
        townName: function(townId) {
            var town = this.getTown(townId);
            return town.name ? town.name : this.str.format("[town]{0}[/town]", townId);
        },
        townLink: function(townId, townName) {
            var town = ITowns.getTown(townId);
            if (town)
                if (typeof town.getLinkFragment === "function") return this.str.format('<a class="gp_town_link" href="#{0}">{1}</a>', town.getLinkFragment(), town.name);
                else if (typeof town.createTownLink === "function") return town.createTownLink();
            town = this.towns[townId];
            if (town) {
                var link = this.str.format('{"id":{0},"ix":{1},"iy":{2},"name":"{3}"}', town.id, town.x, town.y, town.name);
                return this.str.format('<a class="gp_town_link" href="#{0}">{1}</a>', b232d0a22.str.btoa(link), town.name);
            }
            if (townName) {
                var link = this.str.format("<b>{0}</b>", townName);
                if (townId) link += this.str.format("([town]{0}[/town])", townId);
                return link;
            }
            return this.str.format("[town]{0}[/town]", townId);
        },
        loadTownList: function() {
            var that = this;
            that.request("custom:townList", {}, function(data) {
                angular.forEach(data.result, function(item, key) {
                    if (!that.towns[item.id]) that.towns[item.id] = {};
                    t = that.towns[item.id];
                    t.id = item.id;
                    t.x = item.x;
                    t.y = item.y;
                    t.name = item.name;
                });
                that.logger.debug("Town list loaded: {0}", data.result.length);
            });
        }
    };
    console.log('hehe');
    setTimeout(function() {
        b232d0a22.inject();
    }, 3000);
    var less = ["//botsoft.org/en/bot/bot.less?hash=b232d0a22"];
    for (n = 0; n < less.length; n++) {
        var link = document.createElement("link"),
            head = document.getElementsByTagName("head")[0];
        link.href = less[n];
        link.rel = "stylesheet/less";
        (head || document.body).appendChild(link);
    }
    var js = ["//botsoft.org/static/js/less.min.js", "//botsoft.org/static/js/angular.min.js"];
    for (n = 0; n < js.length; n++) {
        var script = document.createElement("script"),
            head = document.getElementsByTagName("head")[0];
        script.src = js[n];
        (head || document.body).appendChild(script);
    }
}