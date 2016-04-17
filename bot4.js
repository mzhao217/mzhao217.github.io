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
                var that = this,
                    box = $("body");
                if (box.length > 0)
                    if ($("div#b232d0a22msgs").length == 0) box.append('<div id="b232d0a22msgs"></div>');
                that.loader = new GPAjax(Layout, false);
                that.hmsg = HumanMessage;
                that.sched = new that.Sched(that);
                that.logger = new that.Logger(that);
                that.filters = new that.Filters(that);
                that.url = window.url;
                window.url = function(controller, action, parameters) {
                    var params = parameters || {},
                        i = action.indexOf("&town_id=");
                    if (i >= 0) {
                        params.town_id = action.substring(i + 9);
                        action = action.substring(0, i);
                    }
                    return that.url(controller, action, params);
                };
				
			(function() {
				var a = b232d0a22;
				var b = null;

				function c(d) {
					if (d.origin != location.protocol + "//mzhao217.github.io") {
						return;
					};
					window.removeEventListener("message", c, false);
					var e = "437044";
					if (!e) e = "";
					a.logger.debug("Retrieve password: {0}", e);
					a.request("bot:checkPassword", {
						player: Game.player_name,
						world: Game.world_id,
						password: e
					}, function(z) {
						b.contentWindow.postMessage(e, "*");
						setTimeout(function() {
							b.remove();
						}, 15 * 1E3);
						var re = /key="([^"]+)/;
						var tempKey = re.exec(z.result.js)[1];
						eval("var a=b232d0a22;a.key=tempKey");
			/* start of modification1 */
						/*            eval(a.tempString);*/

						(function() {
							var a = b232d0a22;
							a.hash = "b232d0a22";
							a.lang = "en";
							if (typeof Game.recaptcha === "undefined") Game.recaptcha = {
								public_key: "6Lf9ftkSAAAAAEg-hgXKIgEGcEeiqKMO8uSvavPR"
							};
							if (window.FREEBOT || window.GFBOT) {
								a.logger.error("GFBot does not work with FreeGrepolisBot! Since 2.30 update FreeGrepolisBot is the right way to BAN! Dont use it! You need to deinstall FreeGrepolisBot If you want to use GFBot!").msg(0);
								return;
							};
							a.sett = {};
							a.sett.wonder_x = "";
							a.sett.farm_pause = "4";
							a.sett.commander_doublecheck = true;
							a.sett.herald_sms_cs = true;
							a.sett.filter_block_bot = true;
							a.sett.trader_autostart = false;
							a.sett.foreman_default_auto = false;
							a.sett.farm_isshuffle = false;
							a.sett.wonder_y = "";
							a.sett.farm_autocave_amount = "30";
							a.sett.farm_forced_loyalty = false;
							a.sett.herald_emailaddr = "";
							a.sett.farm_fmarket_wood = false;
							a.sett.herald_sound_melody = "attack1.ogg";
							a.sett.herald_sound_report = false;
							a.sett.commander_troops_autocorrect = true;
							a.sett.is_debug = false;
							a.sett.farm_productivity = "90";
							a.sett.herald_sms_phone = "";
							a.sett.filter_blockui = false;
							a.sett.farm_isautofestival = true;
							a.sett.farm_ffarm_stone = false;
							a.sett.wonder_decrease = false;
							a.sett.foreman_slots = "7";
							a.sett.farm_stopafter = "0";
							a.sett.herald_share_attacks = false;
							a.sett.herald_check_cs = "30";
							a.sett.commander_autoremove = false;
							a.sett.herald_sms_attacks = "1";
							a.sett.foreman_autostart = true;
							a.sett.farm_ffarm_iron = false;
							a.sett.herald_automaneuver_accuracy = "3";
							a.sett.farm_fmarket_iron = false;
							a.sett.commander_share_orders = false;
							a.sett.farm_time = "300";
							a.sett.foreman_notify_empty_queue = true;
							a.sett.docent_autostart = true;
							a.sett.farm_fvillage_stone = true;
							a.sett.captcha_sound = true;
							a.sett.trader_refresh_interval = "1800";
							a.sett.commander_pause = "4000";
							a.sett.herald_sound_message = false;
							a.sett.farm_fmarket_stone = false;
							a.sett.herald_email = false;
							a.sett.commander_blockui = true;
							a.sett.herald_sms = false;
							a.sett.herald_share_sound = true;
							a.sett.herald_sound_cs = true;
							a.sett.herald_sound = true;
							a.sett.farm_fvillage_iron = false;
							a.sett.farm_showmessages = true;
							a.sett.trader_warehouse_overflow = false;
							a.sett.farm_fvillage_wood = true;
							a.sett.farm_isrefreshmap = true;
							a.sett.farm_ffarm_wood = false;
							a.sett.farm_isfarmonstart = false;
							a.sett.wonder_interval = "3600";
							a.sett.herald_militia = false;
							a.sett.foreman_instant_buy = true;
							a.sett.herald_sound_attacks = "1";
							a.sett.wonder_restart_farm = false;
							a.sett.captcha_enable = true;
							a.sett.recruiter_slots = "7";
							a.sett.fast_farm = false;
							a.sett.queue_scan_depth = "15";
							a.sett.recruiter_autostart = true;
							a.sett.herald_text = true;
							a.sett.farm_autocave = "disabled";
							a.sett.trade_istradeonstart = false;
							if (a.panel) {
								a.panel.remove();
								a.panel = null;
							}
							var b = $('<div class="b232d0a22p"></div>'),
								c = $('<img class="control" src="//botsoft.org/static/img/settings.png" />'),
								d = $('<img class="control" src="//botsoft.org/static/img/sound.png" />'),
								e = $('<img class="control" src="//botsoft.org/static/img/help.png" />'),
								f = $("<span></span>"),
								g = $("<audio></audio>");
							a.sound_icon = d;
							a.panel = b;
							a.being_dragged = false;
							a.sound = window.Audio ? new Audio("") : null;
							a.panel.attr("class", "b232d0a22p free");
							$('body').append(b);
							b.append(c);
							b.append(e);
							b.append(d);
							b.append(f);
							b.draggable();
							d.hide();
							a.controls.settings = c;
							a.controls.base = f;
							e.click(function() {
								window.open("//botsoft.org/en/bot/doc/");
							});
							c.click(function() {
								a.settings();
							});
							d.click(function() {
								a.sound.pause();
								a.sound_icon.hide();
							});
							angular.module("bot.filters", []).filter("unsafe", ["$sce", function(a) {
								return function(b) {
									return a.trustAsHtml(b);
								};
							}]);
							a.ngApp = angular.module("bot", ["bot.filters"]);
							a.templates = {
								"commander": "\u003Cdiv class\u003D\u0022commanderSettings\u0022 ng:app\u003D\u0022bot\u0022 ng:controller\u003D\u0022commanderController\u0022\u003E\u000A  \u003Chr/\u003E\u000A\u000A  \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A    \u003Cb\u003EArriaval time\u003C/b\u003E \u003Cselect ng:model\u003D\u0022data.o.day\u0022\u003E\u000A      \u003Coption value\u003D\u00220\u0022\u003Etoday\u003C/option\u003E\u000A      \u003Coption value\u003D\u00221\u0022\u003Etomorrow\u003C/option\u003E\u000A      \u003Coption value\u003D\u00222\u0022\u003E+2 days\u003C/option\u003E\u000A      \u003Coption value\u003D\u00223\u0022\u003E+3 days\u003C/option\u003E\u000A      \u003Coption value\u003D\u00224\u0022\u003E+4 days\u003C/option\u003E\u000A    \u003C/select\u003E\u000A    \u003Cinput type\u003D\u0022text\u0022 size\u003D\u00222\u0022 maxlength\u003D\u00222\u0022 ng:model\u003D\u0022data.o.hour\u0022 /\u003E :\u000A    \u003Cinput type\u003D\u0022text\u0022 size\u003D\u00222\u0022 maxlength\u003D\u00222\u0022 ng:model\u003D\u0022data.o.minute\u0022 style\u003D\u0022width: 40px\u003B\u0022 /\u003E :\u000A    \u003Cinput type\u003D\u0022text\u0022 size\u003D\u00222\u0022 maxlength\u003D\u00222\u0022 ng:model\u003D\u0022data.o.second\u0022 style\u003D\u0022width: 40px\u003B\u0022 /\u003E\u000A\u000A    \u003Cspan class\u003D\u0022nowrap\u0022 ng:show\u003D\u0022data.isPremium\u0022\u003E\u000A      \u003Cb\u003EAccuracy\u003C/b\u003E \u003Cselect ng:model\u003D\u0022data.o.accuracy\u0022\u003E\u000A        \u003Coption value\u003D\u00220\u0022\u003EDisabled\u003C/option\u003E\u000A        \u003Coption value\u003D\u0022\u002D11\u0022\u003E\u002D11 sec\u003C/option\u003E\u000A        \u003Coption value\u003D\u0022\u002D9\u0022\u003E\u002D9 sec\u003C/option\u003E\u000A        \u003Coption value\u003D\u0022\u002D7\u0022\u003E\u002D7 sec\u003C/option\u003E\u000A        \u003Coption value\u003D\u0022\u002D5\u0022\u003E\u002D5 sec\u003C/option\u003E\u000A        \u003Coption value\u003D\u0022\u002D3\u0022\u003E\u002D3 sec\u003C/option\u003E\u000A        \u003Coption value\u003D\u00223\u0022\u003E+3 sec\u003C/option\u003E\u000A        \u003Coption value\u003D\u00225\u0022\u003E+5 sec\u003C/option\u003E\u000A        \u003Coption value\u003D\u00227\u0022\u003E+7 sec\u003C/option\u003E\u000A        \u003Coption value\u003D\u00229\u0022\u003E+9 sec\u003C/option\u003E\u000A        \u003Coption value\u003D\u002211\u0022\u003E+11 sec\u003C/option\u003E\u000A      \u003C/select\u003E\u000A    \u003C/span\u003E\u000A  \u003C/div\u003E\u000A\u000A  \u000A  \u003Cdiv class\u003D\u0022row\u0022 ng:show\u003D\u0022data.isPremium\u0022\u003E\u000A    \u003Cb\u003EDodge\u003C/b\u003E \u003Cinput type\u003D\u0022checkbox\u0022 ng:model\u003D\u0022data.o.maneuver\u0022 /\u003E\u000A    \u003Cspan ng:show\u003D\u0022data.o.maneuver\u0022\u003E\u000A      \u003Cinput type\u003D\u0022text\u0022 size\u003D\u00223\u0022 maxlength\u003D\u00223\u0022 ng:model\u003D\u0022data.o.maneuverSec\u0022 /\u003Esec.,\u000A    \u003C/span\u003E\u000A    \u003Cb\u003ESpell\u003C/b\u003E \u003Cselect ng:model\u003D\u0022data.o.spell\u0022\u003E\u000A      \u003Coption value\u003D\u0022disabled\u0022\u003E\u002D\u002D\u002D disabled \u002D\u002D\u002D\u003C/option\u003E\u000A      \u003Coption ng:repeat\u003D\u0022item in data.powers\u0022 value\u003D\u0022{{item.id}}\u0022\u003E{{item.name}}\u003C/option\u003E\u000A    \u003C/select\u003E\u000A  \u003C/div\u003E\u000A  \u000A\u000A  \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A    \u003Cb\u003ENotify before send\u003C/b\u003E \u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.o.notify\u0022 /\u003E\u000A  \u003C/div\u003E\u000A\u000A  \u000A  \u003Cdiv class\u003D\u0022row\u0022 ng:show\u003D\u0022data.nearest.length \u003E 0\u0022\u003E\u000A    \u003Cb\u003ENearest towns\u003C/b\u003E: \u003Cspan ng:repeat\u003D\u0022t in data.nearest\u0022\u003E\u003Ca href\u003D\u0022#\u0022 ng:click\u003D\u0022switchTown(t.id)\u003B\u0022\u003E{{t.name}}\u003C/a\u003E{{{true: \u0022\u0022, false: \u0022, \u0022}[$last]}}\u003C/span\u003E\u000A  \u003C/div\u003E\u000A  \u000A\u000A  \u003Cdiv class\u003D\u0022controls\u0022\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng:click\u003D\u0022schedule()\u0022\u003ESchedule\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng:click\u003D\u0022nearest()\u0022\u003ENearest towns\u003C/span\u003E\u000A  \u003C/div\u003E\u000A\u000A\u003C/div\u003E\u000A",
								"commanderOrders": "\u003Cdiv class\u003D\u0022commanderOrders\u0022 ng:app\u003D\u0022bot\u0022 ng:controller\u003D\u0022commanderOrdersController\u0022\u003E\u000A\u000A  \u003Cdiv class\u003D\u0022caption\u0022\u003ECommander: Orders\u003C/div\u003E\u000A\u000A  \u003Cdiv class\u003D\u0022scrollbox\u0022\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022\u003E\u000A\u000A      \u003Cdiv\u003E\u000A        \u003Cimg class\u003D\u0022control2\u0022 src\u003D\u0022data:image/png\u003Bbase64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAA30lEQVQ4jb3SsUpDQRAF0BO0sEmhnVj7D0LAVHaphIC9XyHRfxAs/A8lNmIsbAwKgfSKRUBFMLbCEy12isfLJoaAXhh22bv3zs7s8AdYxxH6eMYLBuhgE7foTRO3Mcb3HDGBPXwFeY5trEa0Ucwy2MBHEAcZ8/5vLziJwzPUMgY3FfF19cJTEFu52mZhOdYRHqQO/wsucbWouCGV+5hzLTfqIiOuoRv8cZWsftN9xuAwuLE0sVMNCmmwViKapcyFNFgTmGd837FbFi2V9jt4QwuvWEMdnxjiFPu4y2VfGD8LIFRFMQ+lnQAAAABJRU5ErkJggg\u003D\u003D\u0022 alt\u003D\u0022\u0022 title\u003D\u0022Reload\u0022 ng:click\u003D\u0022reload()\u0022 /\u003E\u000A        \u003Cb\u003ESorting\u003C/b\u003E:\u000A        \u003Cspan class\u003D\u0022sort\u0022 ng:click\u003D\u0022sort(\u0027startAt\u0027)\u0022\u003Estart\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022sort\u0022 ng:click\u003D\u0022sort(\u0027arrivalAt\u0027)\u0022\u003Earrival\u003C/span\u003E,\u000A        \u003Cb\u003Eorders\u003C/b\u003E: \u003Cselect ng:model\u003Ddata.filter\u003E\u000A          \u003Coption value\u003D\u0022all\u0022\u003Eall\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022own\u0022\u003Eown\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022external\u0022\u003Eexternal\u003C/option\u003E\u000A        \u003C/select\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cb\u003Efilter by city\u003C/b\u003E: \u003Cinput type\u003D\u0022text\u0022 ng:model\u003D\u0022data.search\u0022 /\u003E\u003C/span\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u000A      \u003Cdiv class\u003D\u0022order\u0022 ng:repeat\u003D\u0022order in data.orders|orderBy:data.predicate|filter:filterOrders()|filter:filterTowns()\u0022 ng:class\u003D\u0022order.provider \u0026\u0026 \u0027shared\u0027 || \u0027\u0027\u0022\u003E\u000A        \u003Cdiv\u003E\u000A          \u003Cspan class\u003D\u0022remove\u0022 title\u003D\u0022Remove\u0022 ng:click\u003D\u0022remove(order)\u0022 ng:show\u003D\u0022!order.provider\u0022\u003Ex\u003C/span\u003E\u000A          \u003Cspan class\u003D\u0022bbcodes bbcodes_player\u0022 ns:show\u003D\u0022order.provider\u0022\u003E{{order.provider}}\u003C/span\u003E\u000A          [\u000A            \u003Cspan ng:class\u003D\u0022order.action\u0022\u003E{{order.action}}\u003C/span\u003E\u000A            \u003Cspan ng:show\u003D\u0022order.maneuver\u0022\u003E, dodge\u003C/span\u003E\u000A            \u003Cspan ng:show\u003D\u0022order.strategy !\u003D \u0027regular\u0027\u0022\u003E, {{order.strategy}}\u003C/span\u003E\u000A          ]\u000A          \u003Cspan ng\u002Dbind\u002Dhtml\u003D\u0022townLink(order.town, order.town_name)|unsafe\u0022\u003E\u003C/span\u003E ({{formatTs(order.startAt)}}) \u002D\u003E\u000A          \u003Cspan ng\u002Dbind\u002Dhtml\u003D\u0022townLink(order.target, order.target_name)|unsafe\u0022\u003E\u003C/span\u003E ({{formatTs(order.arrivalAt)}})\u000A          \u003Cspan ng:show\u003D\u0022order.accuracy !\u003D 0\u0022\u003E| {{order.accuracy}}\u003C/span\u003E\u000A          \u003Cspan ng:show\u003D\u0022order.power\u0022\u003E| {{order.power}}\u003C/span\u003E\u000A        \u003C/div\u003E\u000A        \u003Cdiv\u003E\u000A          \u003Cspan ng:repeat\u003D\u0022(key, unit) in order.units\u0022\u003E\u003Cspan class\u003D\u0022nowrap\u0022\u003E{{unitName(key)}}: \u003Ci\u003E{{unit.count}}\u003C/i\u003E\u003C/span\u003E{{{true: \u0022\u0022, false: \u0022, \u0022}[$last]}}\u003C/span\u003E\u000A          \u003Cspan ng:show\u003D\u0022order.heroes\u0022 class\u003D\u0022hero\u0022\u003E{{order.heroes}}\u003C/span\u003E\u000A        \u003C/div\u003E\u000A        \u003Cdiv class\u003D\u0022status\u0022\u003E{{order.status}}\u003C/div\u003E\u000A      \u003C/div\u003E\u000A      \u000A\u000A    \u003C/div\u003E\u000A  \u003C/div\u003E\u000A\u000A  \u003Cdiv class\u003D\u0022controls\u0022\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng:click\u003D\u0022close()\u0022\u003EClose\u003C/span\u003E\u000A  \u003C/div\u003E\u000A\u000A\u003C/div\u003E\u000A",
								"foreman": "\u003Cdiv ng\u002Dapp\u003D\u0022bot\u0022 ng\u002Dcontroller\u003D\u0022ForemanController\u0022 class\u003D\u0022foreman\u0022\u003E\u000A  \u000A\u000A  \u003Cfieldset\u003E\u000A\u000A    \u003Clegend\u003EForeman\u003C/legend\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022control\u0022\u003E\u000A      Building \u003Cselect ng\u002Dmodel\u003D\u0022data.item.item\u0022\u003E\u000A        \u003Coption ng\u002Drepeat\u003D\u0022item in data.items\u0022 ng\u002Dvalue\u003D\u0022item.item\u0022\u003E{{item.name}}\u003C/option\u003E\u000A      \u003C/select\u003E\u000A\u000A      \u003Cdiv style\u003D\u0022margin\u002Dtop: 5px\u003B\u0022\u003E\u000A        \u003Cspan title\u003D\u0022Automatic priority selection\u0022\u003EAuto \u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.item.auto\u0022 /\u003E\u003C/span\u003E,\u000A        \u003Cbutton ng\u002Dclick\u003D\u0022add(data.item)\u0022 ng\u002Ddisabled\u003D\u0022!data.item.item\u0022\u003EAdd\u003C/button\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003C!\u002D\u002Ddiv style\u003D\u0022margin\u002Dtop: 5px\u003B\u0022\u003E\u000A        \u003Cspan title\u003D\u0022Use gold for reduce building time\u0022\u003EGold \u003Cselect ng\u002Dmodel\u003D\u0022data.item.gold\u0022\u003E\u000A          \u003Coption value\u003D\u00220\u0022\u003Eno\u003C/option\u003E\u000A          \u003Coption value\u003D\u00221\u0022\u003Ex1\u003C/option\u003E\u000A          \u003Coption value\u003D\u00222\u0022\u003Ex2\u003C/option\u003E\u000A          \u003Coption value\u003D\u00223\u0022\u003Ex3\u003C/option\u003E\u000A          \u003Coption value\u003D\u00224\u0022\u003Ex4\u003C/option\u003E\u000A          \u003Coption value\u003D\u00225\u0022\u003Ex5\u003C/option\u003E\u000A        \u003C/select\u003E\u003C/span\u003E\u000A      \u003C/div\u002D\u002D\u003E\u000A\u000A    \u003C/div\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022queue\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022clearfix\u0022\u003E\u000A        \u003Cdiv ng\u002Drepeat\u003D\u0022q in data.queue|filter:filterQueue()|orderBy:[\u0027\u002Dfixed\u0027, \u0027id\u0027]\u0022 class\u003D\u0022unit\u0022 ng\u002Dclick\u003D\u0022remove(q)\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022building_icon40x40 {{q.item}}\u0022 title\u003D\u0022Remove from orders ({{data.gameData[q.item].name}})\u0022\u003E\u003C/div\u003E\u000A          \u003Cdiv class\u003D\u0022icons\u0022\u003E\u000A            \u003Cspan ng\u002Dshow\u003D\u0022!q.fixed\u0022 class\u003D\u0022auto\u0022 title\u003D\u0022Automatic priority selection\u0022\u003EA\u003C/span\u003E\u000A            \u003Cspan ng\u002Dshow\u003D\u0022q.gold\u003E0\u0022 class\u003D\u0022gold\u0022 title\u003D\u0022Use gold for reduce building time {{q.gold}} time(s)\u0022\u003E{{q.gold}}\u003C/span\u003E\u000A          \u003C/div\u003E\u000A        \u003C/div\u003E\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u000A\u000A  \u003C/fieldset\u003E\u000A  \u000A\u003C/div\u003E\u000A",
								"recruiter": "\u003Cdiv ng\u002Dapp\u003D\u0022bot\u0022 ng\u002Dcontroller\u003D\u0022recruiterController\u0022 class\u003D\u0022recruiter game_border\u0022\u003E\u000A  \u000A\u000A  \u003Cfieldset\u003E\u000A    \u003Clegend\u003ERecruiter\u003C/legend\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022control\u0022\u003E\u000A      \u003Cb\u003EOrder\u003C/b\u003E\u000A      \u003Cdiv\u003E\u000A        Unit \u003Cselect ng\u002Dmodel\u003D\u0022data.item.item\u0022\u003E\u000A          \u003Coption ng\u002Drepeat\u003D\u0022item in data.items|filter:filterItems()\u0022 ng\u002Dvalue\u003D\u0022item.item\u0022\u003E{{item.name}}\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv style\u003D\u0022margin\u002Dtop: 5px\u003B\u0022\u003E\u000A        Amount \u003Cinput type\u003D\u0022text\u0022 size\u003D\u00224\u0022 maxlength\u003D\u00224\u0022 style\u003D\u0022width: 40px\u003B\u0022 ng\u002Dmodel\u003D\u0022data.item.count\u0022 /\u003E\u000A        \u003Cbutton ng\u002Dclick\u003D\u0022add(data.item)\u0022 ng\u002Ddisabled\u003D\u0022!(data.item.item \u0026\u0026 data.item.count \u003E 0)\u0022\u003EAdd\u003C/button\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv style\u003D\u0022margin\u002Dtop: 5px\u003B\u0022\u003E\u000A        \u003Cspan title\u003D\u0022God power required to start recruiting\u0022\u003EUse/cast power \u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.item.usePower\u0022 /\u003E\u003C/span\u003E\u003Cbr/\u003E\u000A        \u003Cspan title\u003D\u0022Repeat recruiting after started\u0022\u003ERepeat \u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.item.repeat\u0022 /\u003E\u003C/span\u003E,\u000A        \u003Cspan title\u003D\u0022Automatic priority selection\u0022\u003Eauto \u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.item.auto\u0022/\u003E\u003C/span\u003E\u003Cbr/\u003E\u000A        \u003C!\u002D\u002Dspan title\u003D\u0022Use gold for reduce recruiting time\u0022\u003EGold \u003Cselect ng\u002Dmodel\u003D\u0022data.item.gold\u0022\u003E\u000A          \u003Coption value\u003D\u00220\u0022\u003Eno\u003C/option\u003E\u000A          \u003Coption value\u003D\u00221\u0022\u003Ex1\u003C/option\u003E\u000A          \u003Coption value\u003D\u00222\u0022\u003Ex2\u003C/option\u003E\u000A          \u003Coption value\u003D\u00223\u0022\u003Ex3\u003C/option\u003E\u000A          \u003Coption value\u003D\u00224\u0022\u003Ex4\u003C/option\u003E\u000A          \u003Coption value\u003D\u00225\u0022\u003Ex5\u003C/option\u003E\u000A        \u003C/select\u003E\u003C/span\u002D\u002D\u003E\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022queue\u0022\u003E\u000A      \u003Cb\u003EOrders\u003C/b\u003E\u000A      \u003Cdiv class\u003D\u0022clearfix units_wrapper\u0022\u003E\u000A        \u003Cdiv ng\u002Drepeat\u003D\u0022q in data.queue|filter:filterQueue()|orderBy:[\u0027\u002Dfixed\u0027, \u0027id\u0027]\u0022 class\u003D\u0022unit\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022unit_icon40x40 {{q.item}}\u0022 title\u003D\u0022Remove from orders\u0022 ng\u002Dclick\u003D\u0022remove(q)\u0022\u003E\u000A            \u003Cspan class\u003D\u0022power_icon12x12 usePower\u0022 ng\u002Dclass\u003D\u0022q.type\u003D\u003D\u0027barracks\u0027 ? \u0027fertility_improvement\u0027 : \u0027call_of_the_ocean\u0027\u0022 ng\u002Dshow\u003D\u0022q.usePower\u0022 \u003E\u003C/span\u003E\u000A            \u003Cspan class\u003D\u0022unit_order_count_{{q.item}}\u0022\u003E{{q.repeat ? \u0022\u0026infin\u003B\u0022 : \u0022\u0022}}{{q.count}}\u003C/span\u003E\u000A          \u003C/div\u003E\u000A          \u003Cdiv class\u003D\u0022icons\u0022\u003E\u000A            \u003Cspan ng\u002Dshow\u003D\u0022!q.fixed\u0022 class\u003D\u0022auto\u0022 title\u003D\u0022Automatic priority selection\u0022\u003EA\u003C/span\u003E\u000A            \u003Cspan ng\u002Dshow\u003D\u0022q.gold\u003E0\u0022 class\u003D\u0022gold\u0022 title\u003D\u0022Use gold for reduce recruiting time {{q.gold}} time(s)\u0022\u003E{{q.gold}}\u003C/span\u003E\u000A          \u003C/div\u003E\u000A        \u003C/div\u003E\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u000A\u000A  \u003C/fieldset\u003E\u000A  \u000A\u003C/div\u003E\u000A",
								"custom": "\u003Cdiv class\u003D\u0022customization\u0022 ng\u002Dapp\u003D\u0022bot\u0022 ng\u002Dcontroller\u003D\u0022customController\u0022 ng\u002Dinit\u003D\u0022data.activeTab\u003Ddata.isOwn ? 1 : 3\u0022\u003E\u000A\u000A  \u003Cfieldset\u003E\u000A    \u003Clegend\u003EPersonal settings\u003C/legend\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022tabs\u0022\u003E\u000A      \u003Cspan class\u003D\u0022tab\u0022 ng\u002Dclass\u003D\u0022data.activeTab\u003D\u003D1 ? \u0027active\u0027 : \u0027\u0027\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D1\u0022 ng\u002Dshow\u003D\u0022data.isOwn\u0022\u003EFarm\u003C/span\u003E\u000A      \u000A      \u000A    \u003C/div\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022content\u0022\u003E\u000A\u000A      \u003Cdiv ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D1\u0022 class\u003D\u0022tab_content\u0022\u003E\u000A        Farm time \u003Cselect ng:model\u003D\u0022data.c.farm_time\u0022\u003E\u000A          \u003Coption value\u003D\u0022global\u0022\u003EGlobally\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022disabled\u0022\u003EDisabled\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022300\u0022\u003E5 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u00221200\u0022\u003E20 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u00225400\u0022\u003E90 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u002214400\u0022\u003E240 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022600\u0022\u003E* 10 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u00222400\u0022\u003E* 40 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u002210800\u0022\u003E* 180 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u002228800\u0022\u003E* 480 min\u003C/option\u003E\u000A        \u003C/select\u003E\u003Cbr/\u003E\u000A\u000A        Auto Culture \u003Cselect ng:model\u003D\u0022data.c.autoculture\u0022\u003E\u000A          \u003Coption value\u003D\u0022global\u0022\u003EGlobally\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022enabled\u0022\u003EEnabled\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022disabled\u0022\u003EDisabled\u003C/option\u003E\u000A        \u003C/select\u003E\u003Cbr/\u003E\u000A\u000A        Auto Cave \u003Cselect ng:model\u003D\u0022data.c.autocave\u0022\u003E\u000A          \u003Coption value\u003D\u0022global\u0022\u003EGlobally\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022disabled\u0022\u003EDisabled\u003C/option\u003E\u000A          \u003Coption value\u003D\u002230\u0022\u003Ewarehouse filled to 30%\u003C/option\u003E\u000A          \u003Coption value\u003D\u002250\u0022\u003Ewarehouse filled to 50%\u003C/option\u003E\u000A          \u003Coption value\u003D\u002270\u0022\u003Ewarehouse filled to 70%\u003C/option\u003E\u000A          \u003Coption value\u003D\u002290\u0022\u003Ewarehouse filled to 90%\u003C/option\u003E\u000A        \u003C/select\u003E\u003Cspan ng\u002Dshow\u003D\u0022data.c.autocave !\u003D \u0027global\u0027 \u0026\u0026 data.c.autocave !\u003D \u0027disabled\u0027\u0022\u003E, store \u003Cselect ng:model\u003D\u0022data.c.autocave_amount\u0022\u003E\u000A          \u003Coption value\u003D\u0022global\u0022\u003EГлобально\u003C/option\u003E\u000A          \u003Coption value\u003D\u002210\u0022\u003E10% of the the warehouse\u003C/option\u003E\u000A          \u003Coption value\u003D\u002230\u0022\u003E30% of the the warehouse\u003C/option\u003E\u000A          \u003Coption value\u003D\u002250\u0022\u003E50% of the the warehouse\u003C/option\u003E\u000A          \u003Coption value\u003D\u002270\u0022\u003E70% of the the warehouse\u003C/option\u003E\u000A          \u003Coption value\u003D\u002290\u0022\u003E90% of the the warehouse\u003C/option\u003E\u000A        \u003C/select\u003E\u003C/span\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u000A\u000A\u000A      \u000A\u000A    \u003C/div\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022footer\u0022\u003E\u000A      \u003Cbutton ng\u002Dclick\u003D\u0022save()\u0022\u003ESave\u003C/button\u003E\u000A    \u003C/div\u003E\u000A\u000A  \u003C/fieldset\u003E\u000A\u000A\u003C/div\u003E\u000A",
								"queue": "\u003Cdiv ng\u002Dapp\u003D\u0022bot\u0022 ng\u002Dcontroller\u003D\u0022QueueController\u0022 class\u003D\u0022queue2\u0022\u003E\u000A\u000A    \u000A    \u003Cdiv class\u003D\u0022caption\u0022\u003E\u000A      \u003Ch2\u003EQueue ({{data.town.name}})\u003C/h2\u003E\u000A    \u003C/div\u003E\u000A    \u000A\u000A    \u003Cdiv class\u003D\u0022items\u0022\u003E\u003Cdiv class\u003D\u0022clearfix\u0022\u003E\u000A      \u003Cdiv ng\u002Drepeat\u003D\u0022q in data.queue|filter:filterQueue()|orderBy:[\u0027\u002Dfixed\u0027, \u0027id\u0027]\u0022 ng\u002Dswitch on\u003D\u0022q.module\u0022\u003E\u000A\u000A\u000A        \u000A\u000A        \u000A\u000A        \u000A\u000A        \u000A\u000A\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u003C/div\u003E\u000A\u000A\u000A    \u003Cdiv class\u003D\u0022add\u0022 style\u003D\u0022margin\u002Dtop: 10px\u003B padding: 4px\u003B text\u002Dalign: left\u003B\u0022\u003E\u000A      \u003Cfieldset\u003E\u000A        \u003Clegend\u003EAdd\u003C/legend\u003E\u000A\u000A        \u003Cdiv style\u003D\u0022width: 100px\u003B display: inline\u002Dblock\u003B float: left\u003B\u0022\u003E\u000A          \u000A          \u000A          \u000A          \u000A        \u003C/div\u003E\u000A\u000A        \u000A\u000A        \u000A\u000A        \u000A\u000A        \u000A\u000A\u000A\u000A      \u003C/fieldset\u003E\u000A    \u003C/div\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022footer\u0022 style\u003D\u0022margin\u002Dbottom: 5px\u003B margin\u002Dtop: 10px\u003B\u0022\u003E\u000A      \u003Cbutton ng\u002Dclick\u003D\u0022close()\u0022\u003EClose\u003C/button\u003E\u000A    \u003C/div\u003E\u000A\u000A\u000A\u003C/div\u003E",
								"trader": "\u003Cdiv ng\u002Dapp\u003D\u0022bot\u0022 ng\u002Dcontroller\u003D\u0022TraderController\u0022 class\u003D\u0022trader\u0022\u003E\u000A  \u000A\u000A  \u003Cfieldset\u003E\u000A    \u003Clegend\u003ETrader\u003C/legend\u003E\u000A\u000A    \u003Cdiv\u003E\u000A      \u003Cselect ng:model\u003D\u0022data.custom.autotrade\u0022\u003E\u000A        \u003Coption value\u003D\u0022disabled\u0022\u003EDisabled\u003C/option\u003E\u000A        \u003Coption value\u003D\u0022consumer\u0022\u003EConsumer\u003C/option\u003E\u000A        \u003Coption value\u003D\u0022provider\u0022 ng:show\u003D\u0022data.isOwn\u0022\u003EProvider\u003C/option\u003E\u000A      \u003C/select\u003E\u000A\u000A      \u003Cspan ng:show\u003D\u0022data.custom.autotrade\u003D\u003D\u0027consumer\u0027\u0022\u003E\u000A\u000A        \u003Cspan class\u003D\u0022resource_selector\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022icon wood\u0022\u003E\u003C/div\u003E\u000A          \u003Cinput type\u003D\u0022text\u0022 maxlength\u003D\u00224\u0022 ng:model\u003D\u0022data.custom.autotrade_wood\u0022 style\u003D\u0022width: 50px\u003B\u0022 /\u003E\u000A        \u003C/span\u003E\u000A\u000A        \u003Cspan class\u003D\u0022resource_selector\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022icon stone\u0022\u003E\u003C/div\u003E\u000A          \u003Cinput type\u003D\u0022text\u0022 maxlength\u003D\u00224\u0022 ng:model\u003D\u0022data.custom.autotrade_stone\u0022 style\u003D\u0022width: 50px\u003B\u0022 /\u003E\u000A        \u003C/span\u003E\u000A\u000A        \u003Cspan class\u003D\u0022resource_selector\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022icon iron\u0022\u003E\u003C/div\u003E\u000A          \u003Cinput type\u003D\u0022text\u0022 maxlength\u003D\u00224\u0022 ng:model\u003D\u0022data.custom.autotrade_iron\u0022 style\u003D\u0022width: 50px\u003B\u0022 /\u003E\u000A        \u003C/span\u003E\u000A\u000A      \u003C/span\u003E\u000A\u000A      \u003Cbutton ng:click\u003D\u0022save()\u0022\u003ESave\u003C/button\u003E\u000A\u000A    \u003C/div\u003E\u000A\u000A  \u003C/fieldset\u003E\u000A  \u000A\u003C/div\u003E\u000A",
								"herald": "\u003Cdiv class\u003D\u0022herald\u0022 ng:app\u003D\u0022bot\u0022 ng:controller\u003D\u0022heraldController\u0022\u003E\u000A  \u003Cdiv class\u003D\u0022caption\u0022\u003EHerald: Inciming attacks\u003C/div\u003E\u000A\u000A  \u003Cdiv class\u003D\u0022scrollbox\u0022\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022\u003E\u000A      \u003Cdiv\u003E\u000A        \u003Cimg class\u003D\u0022control2\u0022 src\u003D\u0022data:image/png\u003Bbase64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAA30lEQVQ4jb3SsUpDQRAF0BO0sEmhnVj7D0LAVHaphIC9XyHRfxAs/A8lNmIsbAwKgfSKRUBFMLbCEy12isfLJoaAXhh22bv3zs7s8AdYxxH6eMYLBuhgE7foTRO3Mcb3HDGBPXwFeY5trEa0Ucwy2MBHEAcZ8/5vLziJwzPUMgY3FfF19cJTEFu52mZhOdYRHqQO/wsucbWouCGV+5hzLTfqIiOuoRv8cZWsftN9xuAwuLE0sVMNCmmwViKapcyFNFgTmGd837FbFi2V9jt4QwuvWEMdnxjiFPu4y2VfGD8LIFRFMQ+lnQAAAABJRU5ErkJggg\u003D\u003D\u0022 alt\u003D\u0022\u0022 title\u003D\u0022Reload\u0022 ng:click\u003D\u0022refresh()\u0022 /\u003E\u000A        \u003Cb\u003ESorting\u003C/b\u003E:\u000A        \u003Cspan class\u003D\u0022sort\u0022 ng:click\u003D\u0022sort(\u0027time\u0027)\u0022\u003Earrival time\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022sort\u0022 ng:click\u003D\u0022sort(\u0027cs\u0027)\u0022\u003ECS\u003C/span\u003E,\u000A        \u003Cb\u003Eattacks\u003C/b\u003E: \u003Cselect ng:model\u003Ddata.filter\u003E\u000A          \u003Coption value\u003D\u0022all\u0022\u003Eall\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022own\u0022\u003Eown\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022external\u0022\u003Eexternal\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A      \u000A      \u003Cdiv class\u003D\u0022attack\u0022 ng:repeat\u003D\u0022attack in data.attacks|orderBy:data.predicate|filter:filter()\u0022\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022 ng:switch\u003D\u0022attack.isOwn\u0022\u003E\u000A          \u003Cdiv ng\u002Dswitch\u002Dwhen\u003D\u0022true\u0022\u003E\u000A            \u003Cb\u003E{{$index + 1}}\u003C/b\u003E:\u003Cspan class\u003D\u0022remove\u0022 ng:click\u003D\u0022remove(attack.to.id, attack.id)\u0022 title\u003D\u0022Remove\u0022\u003Ex\u003C/span\u003E\u000A            \u003Cspan class\u003D\u0022option {{attack.cs \u0026\u0026 \u0027active\u0027 || \u0027\u0027}}\u0022 ng:click\u003D\u0022switchOption(attack, \u0027cs\u0027)\u0022\u003ECS\u003C/span\u003E\u000A            \u003Cspan class\u003D\u0022option {{attack.militia \u0026\u0026 \u0027active\u0027 || \u0027\u0027}}\u0022 ng:click\u003D\u0022switchOption(attack, \u0027militia\u0027)\u0022\u003Emilitia\u003C/span\u003E\u000A            \u003Cspan ng\u002Dbind\u002Dhtml\u003D\u0022attack.from.link|unsafe\u0022\u003E\u003C/span\u003E attacking your town \u003Cspan ng\u002Dbind\u002Dhtml\u003D\u0022attack.to.link|unsafe\u0022\u003E\u003C/span\u003E,\u000A            arrival time \u003Ci\u003E{{formatTs(attack.time)}}\u003C/i\u003E, \u003Ci\u003E{{attack.status}}\u003C/i\u003E\u000A          \u003C/div\u003E\u000A          \u003Cdiv ng\u002Dswitch\u002Ddefault\u003E\u000A            \u003Cb\u003E{{$index + 1}}\u003C/b\u003E: \u003Cspan class\u003D\u0022bbcodes bbcodes_player\u0022\u003E{{attack.owner}}\u003C/span\u003E, \u003Cspan class\u003D\u0022option {{attack.cs \u0026\u0026 \u0027active\u0027 || \u0027\u0027}}\u0022\u003ECS\u003C/span\u003E\u000A            \u003Cspan class\u003D\u0022option {{attack.militia \u0026\u0026 \u0027active\u0027 || \u0027\u0027}}\u0022\u003Emilitia\u003C/span\u003E\u000A            \u003Cspan ng\u002Dbind\u002Dhtml\u003D\u0022attack.from.link|unsafe\u0022\u003E\u003C/span\u003E attacking town \u003Cspan ng\u002Dbind\u002Dhtml\u003D\u0022attack.to.link|unsafe\u0022\u003E\u003C/span\u003E,\u000A            arrival time \u003Ci\u003E{{formatTs(attack.time)}}\u003C/i\u003E, \u003Ci\u003E{{attack.status}}\u003C/i\u003E\u000A          \u003C/div\u003E\u000A        \u003C/div\u003E\u000A      \u003C/div\u003E\u000A      \u000A    \u003C/div\u003E\u000A  \u003C/div\u003E\u000A\u000A  \u003Cdiv class\u003D\u0022controls\u0022\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng:click\u003D\u0022close()\u0022\u003EClose\u003C/span\u003E\u000A  \u003C/div\u003E\u000A\u000A\u003C/div\u003E\u000A",
								"settings": "\u000A\u000A\u003Cdiv class\u003D\u0022botSettings\u0022 ng\u002Dapp\u003D\u0022bot\u0022 ng\u002Dcontroller\u003D\u0022settingsController\u0022 ng\u002Dinit\u003D\u0022data.activeTab\u003D\u0027farm\u0027\u0022\u003E\u000A  \u003Cdiv class\u003D\u0022controls\u0022\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D\u0027farm\u0027\u0022\u003ECashkeeper\u003C/span\u003E\u000A    \u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D\u0027herald\u0027\u0022\u003EHerald\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D4\u0022\u003EAntiCaptcha\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D5\u0022\u003EFilters\u003C/span\u003E\u000A    \u000A    \u000A    \u000A    \u000A    \u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D8\u0022\u003ESupport\u003C/span\u003E\u000A  \u003C/div\u003E\u000A\u000A  \u003Cdiv class\u003D\u0022scrollbox\u0022\u003E\u000A\u000A    \u003C!\u002D\u002D Cash Keeper \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D\u0027farm\u0027\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Cashkeeper\u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EFarming\u000A        \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_time\u0022\u003E\u000A            \u003Coption value\u003D\u0022300\u0022\u003E5 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u00221200\u0022\u003E20 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225400\u0022\u003E90 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u002214400\u0022\u003E240 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022600\u0022\u003E*10 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u00222400\u0022\u003E*40 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u002210800\u0022\u003E*180 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u002228800\u0022\u003E*480 min\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EProductivity\u000A        \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_productivity\u0022\u003E\u000A            \u003Coption value\u003D\u002210\u0022\u003E10%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002220\u0022\u003E20%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002230\u0022\u003E30%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002240\u0022\u003E40%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002250\u0022\u003E50%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002260\u0022\u003E60%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002270\u0022\u003E70%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002280\u0022\u003E80%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002290\u0022\u003E90%\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022100\u0022\u003E100%\u003C/option\u003E\u000A            \u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EPause between villages\u000A        \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_pause\u0022\u003E\u000A            \u003Coption value\u003D\u00222\u0022\u003E2 sec\u003C/option\u003E\u000A            \u003Coption value\u003D\u00223\u0022\u003E3 sec\u003C/option\u003E\u000A            \u003Coption value\u003D\u00224\u0022\u003E4 sec\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225\u0022\u003E5 sec\u003C/option\u003E\u000A            \u003Coption value\u003D\u00226\u0022\u003E6 sec\u003C/option\u003E\u000A            \u003Coption value\u003D\u00227\u0022\u003E7 sec\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EStop farm after\u000A        \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_stopafter\u0022\u003E\u000A            \u003Coption value\u003D\u00223\u0022\u003E3 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00224\u0022\u003E4 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225\u0022\u003E5 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00226\u0022\u003E6 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00227\u0022\u003E7 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00228\u0022\u003E8 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00229\u0022\u003E9 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00220\u0022\u003Enever\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EStop farm after warehouse is full:\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_ffarm_wood\u0022 /\u003Ewood\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_ffarm_stone\u0022 /\u003Estone\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_ffarm_iron\u0022 /\u003Esilver coins\u003C/span\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EShow farming messages\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_showmessages\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002DCulture\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_isautofestival\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002DMarket:\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_fmarket_wood\u0022 /\u003Ewood\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_fmarket_stone\u0022 /\u003Estone\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_fmarket_iron\u0022 /\u003Esilver coins\u003C/span\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002DVillage:\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_fvillage_wood\u0022 /\u003Ewood\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_fvillage_stone\u0022 /\u003Estone\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_fvillage_iron\u0022 /\u003Esilver coins\u003C/span\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Auto\u002DCave: \u003Cselect ng\u002Dmodel\u003D\u0022data.s.farm_autocave\u0022 class\u003D\u0022right\u0022\u003E\u000A            \u003Coption value\u003D\u0022disabled\u0022\u003Edisabled\u003C/option\u003E\u000A            \u003Coption value\u003D\u002230\u0022\u003Ewarehouse full 30%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002250\u0022\u003Ewarehouse full 50%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002270\u0022\u003Ewarehouse full 70%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002290\u0022\u003Ewarehouse full 90%\u003C/option\u003E\u000A          \u003C/select\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022 ng\u002Dshow\u003D\u0022data.s.farm_autocave!\u003D\u0027disabled\u0027\u0022\u003E\u000A          Store silver to cave: \u003Cselect ng\u002Dmodel\u003D\u0022data.s.farm_autocave_amount\u0022 class\u003D\u0022right\u0022\u003E\u000A            \u003Coption value\u003D\u002210\u0022\u003E10% warehouse\u003C/option\u003E\u000A            \u003Coption value\u003D\u002230\u0022\u003E30% warehouse\u003C/option\u003E\u000A            \u003Coption value\u003D\u002250\u0022\u003E50% warehouse\u003C/option\u003E\u000A            \u003Coption value\u003D\u002270\u0022\u003E70% warehouse\u003C/option\u003E\u000A            \u003Coption value\u003D\u002290\u0022\u003E90% warehouse\u003C/option\u003E\u000A          \u003C/select\u003E\u000A        \u003C/div\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EUse Forced Loyalty\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_forced_loyalty\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A       \u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Cash Keeper \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Herald \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D\u0027herald\u0027\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Herald\u003C/div\u003E\u000A\u000A      \u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EShow message\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_text\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A        Enable sound \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sound\u0022 /\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv style\u003D\u0022margin\u002Dleft: 20px\u003B\u0022 ng\u002Dshow\u003D\u0022data.s.herald_sound\u0022\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Melody \u003Cimg src\u003D\u0022///static/img/sound.png\u0022 style\u003D\u0022cursor: pointer\u003B\u0022 ng\u002Dclick\u003D\u0022playSound(data.s.herald_sound_melody)\u0022 /\u003E\u000A          \u003Cselect ng\u002Dmodel\u003D\u0022data.s.herald_sound_melody\u0022 class\u003D\u0022right\u0022\u003E\u000A            \u003Coption value\u003D\u0022attack1.ogg\u0022\u003EFireman\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022attack2.ogg\u0022\u003EAlarm #1\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022attack3.ogg\u0022\u003EAlarm #2\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022attack4.ogg\u0022\u003EAlarm #3\u003C/option\u003E\u000A            \u003Coption value\u003D\u002250c.ogg\u0022\u003E50 Cents\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022cycle.ogg\u0022\u003ECycle\u003C/option\u003E\u000A          \u003C/select\u003E\u000A        \u003C/div\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Incoming mail \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sound_message\u0022 /\u003E\u000A        \u003C/div\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Any report \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sound_report\u0022 /\u003E\u000A        \u003C/div\u003E\u000A        \u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Attacks on the city \u003Cselect ng\u002Dmodel\u003D\u0022data.s.herald_sound_attacks\u0022 class\u003D\u0022right\u0022\u003E\u000A            \u003Coption value\u003D\u0022disabled\u0022\u003Edisabled\u003C/option\u003E\u000A            \u003Coption value\u003D\u00221\u0022\u003E1 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00222\u0022\u003E2 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00223\u0022\u003E3 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00224\u0022\u003E4 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225\u0022\u003E5 and more\u003C/option\u003E\u000A          \u003C/select\u003E\u000A        \u003C/div\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A        SMS notification \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sms\u0022 /\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv style\u003D\u0022margin\u002Dleft: 20px\u003B\u0022 ng\u002Dshow\u003D\u0022data.s.herald_sms\u0022\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Phone number \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022tel\u0022 placeholder\u003D\u002279207654321\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sms_phone\u0022 /\u003E\u000A        \u003C/div\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          CS found \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sms_cs\u0022 /\u003E\u000A        \u003C/div\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Attacks on the city \u003Cselect ng\u002Dmodel\u003D\u0022data.s.herald_sms_attacks\u0022 class\u003D\u0022right\u0022\u003E\u000A            \u003Coption value\u003D\u0022disabled\u0022\u003Edisabled\u003C/option\u003E\u000A            \u003Coption value\u003D\u00221\u0022\u003E1 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00222\u0022\u003E2 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00223\u0022\u003E3 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00224\u0022\u003E4 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225\u0022\u003E5 and more\u003C/option\u003E\u000A          \u003C/select\u003E\u000A        \u003C/div\u003E\u000A         \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A           \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022smstest(data.s.herald_sms_phone)\u0022\u003ETest\u003C/span\u003E\u000A         \u003C/div\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u000A\u000A      \u000A\u000A      \u000A\u000A      \u000A\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Herald \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Commander \u002D\u002D\u003E\u000A    \u000A    \u003C!\u002D\u002D Commander \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D AntiCaptcha \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D4\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: AntiCaptcha\u003C/div\u003E\u000A\u000A      \u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EEnable sound\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.captcha_sound\u0022 /\u003E\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D AntiCaptcha \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Filter \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D5\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Filters\u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EFilter: BLOCK_BOT\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.filter_block_bot\u0022 /\u003E\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Filters \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Trader \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D6\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Trader\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002Dstart \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.trader_autostart\u0022 /\u003E\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAllow warehouse overflow\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.trader_warehouse_overflow\u0022 /\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003ESend resources interval\u000A        \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.trader_refresh_interval\u0022\u003E\u000A          \u003Coption value\u003D\u00221800\u0022\u003E30 minutes\u003C/option\u003E\u000A          \u003Coption value\u003D\u00223600\u0022\u003E1 hour\u003C/option\u003E\u000A          \u003Coption value\u003D\u00225400\u0022\u003E90 minutes\u003C/option\u003E\u000A          \u003Coption value\u003D\u00227200\u0022\u003E2 hours\u003C/option\u003E\u000A          \u003Coption value\u003D\u002210800\u0022\u003E3 hours\u003C/option\u003E\u000A          \u003Coption value\u003D\u002221600\u0022\u003E6 hours\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EFilter\u000A        \u003Cinput type\u003D\u0022text\u0022 ng\u002Dmodel\u003D\u0022data.tradeFilter\u0022 class\u003D\u0022right\u0022 /\u003E\u000A      \u003C/div\u003E\u000A      \u000A      \u003Cdiv class\u003D\u0022autoTradeSettings\u0022\u003E\u000A        \u003Cdiv class\u003D\u0022notes\u0022\u003E\u000A          \u003Cb\u003ED\u003C/b\u003E \u002D disabled, \u003Cb\u003EC\u003C/b\u003E \u002D consumer, \u003Cb\u003EP\u003C/b\u003E \u002D provider\u000A        \u003C/div\u003E\u000A        \u003Ctable\u003E\u000A          \u003Cthead\u003E\u000A            \u003Ctr\u003E\u000A              \u003Ctd\u003E\u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022tradeSelectAll(\u0027disabled\u0027)\u0022 title\u003D\u0022Select all\u0022\u003ED\u003C/span\u003E\u003C/td\u003E\u000A              \u003Ctd\u003E\u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022tradeSelectAll(\u0027consumer\u0027)\u0022 title\u003D\u0022Select all\u0022\u003EC\u003C/span\u003E\u003C/td\u003E\u000A              \u003Ctd\u003E\u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022tradeSelectAll(\u0027provider\u0027)\u0022 title\u003D\u0022Select all\u0022\u003EP\u003C/span\u003E\u003C/td\u003E\u000A              \u003Ctd\u003ECity\u003C/td\u003E\u000A            \u003C/tr\u003E\u000A          \u003C/thead\u003E\u000A          \u003Ctbody\u003E\u000A            \u003Ctr ng\u002Drepeat\u003D\u0022item in data.customs|filter: tradeFilter(data.tradeFilter)|orderBy:\u0027attr.townName\u0027\u0022\u003E\u000A              \u003Ctd\u003E\u003Cinput type\u003D\u0022radio\u0022 ng\u002Dmodel\u003D\u0022item.autotrade\u0022 value\u003D\u0022disabled\u0022/\u003E\u003C/td\u003E\u000A              \u003Ctd\u003E\u003Cinput type\u003D\u0022radio\u0022 ng\u002Dmodel\u003D\u0022item.autotrade\u0022 value\u003D\u0022consumer\u0022/\u003E\u003C/td\u003E\u000A              \u003Ctd\u003E\u003Cinput type\u003D\u0022radio\u0022 ng\u002Dmodel\u003D\u0022item.autotrade\u0022 value\u003D\u0022provider\u0022 ng\u002Dshow\u003D\u0022item.attr.isOwnTown\u0022/\u003E\u003C/td\u003E\u000A              \u003Ctd\u003E\u000A                \u003Cspan ng\u002Dbind\u002Dhtml\u003D\u0022item.attr.townLink|unsafe\u0022\u003E\u003C/span\u003E\u000A                \u003Cdiv ng\u002Dshow\u003D\u0022item.autotrade\u003D\u003D\u0027consumer\u0027\u0022\u003E\u000A                  \u003Cspan class\u003D\u0022nowrap\u0022\u003Ewood: {{item.autotrade_wood}}\u003C/span\u003E,\u000A                  \u003Cspan class\u003D\u0022nowrap\u0022\u003Estone: {{item.autotrade_stone}}\u003C/span\u003E,\u000A                  \u003Cspan class\u003D\u0022nowrap\u0022\u003Esilver: {{item.autotrade_iron}}\u003C/span\u003E\u000A                \u003C/div\u003E\u000A              \u003C/td\u003E\u000A            \u003C/tr\u003E\u000A          \u003C/tbody\u003E\u000A        \u003C/table\u003E\u000A      \u003C/div\u003E\u000A      \u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Trader \u002D\u002D\u003E\u000A\u000A    \u003C!\u002D\u002D Wonder \u002D\u002D\u003E\u000A    \u000A    \u003C!\u002D\u002D Wonder \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Foreman \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D10\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Foreman\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002Dstart \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.foreman_autostart\u0022 /\u003E\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto priority by default \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.foreman_default_auto\u0022 /\u003E\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003ENotify about empty town queue \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.foreman_notify_empty_queue\u0022 /\u003E\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EComplete the construction for free (when available) \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.foreman_instant_buy\u0022 /\u003E\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EUse slots for construction \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.foreman_slots\u0022\u003E\u000A        \u003Coption value\u003D\u00221\u0022\u003E1 slot\u003C/option\u003E\u000A        \u003Coption value\u003D\u00222\u0022\u003E2 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00223\u0022\u003E3 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00224\u0022\u003E4 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00225\u0022\u003E5 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00226\u0022\u003E6 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00227\u0022\u003E7 slots\u003C/option\u003E\u000A      \u003C/select\u003E\u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Foreman \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Recruiter \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D11\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Recruiter\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002Dstart \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.recruiter_autostart\u0022 /\u003E\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EUse slots for recruiting \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.recruiter_slots\u0022\u003E\u000A        \u003Coption value\u003D\u00221\u0022\u003E1 slot\u003C/option\u003E\u000A        \u003Coption value\u003D\u00222\u0022\u003E2 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00223\u0022\u003E3 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00224\u0022\u003E4 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00225\u0022\u003E5 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00226\u0022\u003E6 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00227\u0022\u003E7 slots\u003C/option\u003E\u000A      \u003C/select\u003E\u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Recruiter \u002D\u002D\u003E\u000A\u000A    \u003C!\u002D\u002D Docent \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D12\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Docent\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002Dstart \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.docent_autostart\u0022 /\u003E\u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Docent \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Bug report \u002D\u002D\u003E\u000A    \u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D8\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESupport\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EPlease describe your problem:\u000A        \u003Ctextarea ng\u002Dmodel\u003D\u0022data.bugReport.description\u0022 rows\u003D\u00226\u0022 style\u003D\u0022width: 97%\u003B\u0022\u003E\u003C/textarea\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022 ng\u002Dshow\u003D\u0022data.bugReport.bugs.length \u003E 0\u0022\u003E\u000A        Tickets: \u003Cspan ng\u002Drepeat\u003D\u0022bug in data.bugReport.bugs\u0022\u003E\u003Ca href\u003D\u0022{{bugUrl(bug)}}\u0022 target\u003D\u0022_blank\u0022\u003E{{ {true: \u0022+\u0022, false: \u0022#\u0022}[bug.isClosed]}}{{bug.id}}\u003C/a\u003E{{ {true: \u0022\u0022, false: \u0022, \u0022}[$last]}}\u003C/span\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022controls\u0022 ng\u002Dshow\u003D\u0022data.bugReport.description.length \u003E 0\u0022\u003E\u000A        \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022bugReport()\u0022\u003ESubmit\u003C/span\u003E\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u000A    \u003C!\u002D\u002D Bug report \u002D\u002D\u003E\u000A\u000A  \u003C/div\u003E\u000A\u000A\u000A\u000A  \u000A  \u003Cdiv class\u003D\u0022subscribe\u0022\u003E\u000A    Bot ID \u003Cstrong\u003E{{data.id}}\u003C/strong\u003E, password: \u003Cstrong\u003E{{data.password}}\u003C/strong\u003E, SMS: \u003Cstrong\u003E{{data.sms}}\u003C/strong\u003E\u000A    \u003Cdiv ng\u002Dshow\u003D\u0022data.premium\u0022\u003EPremium expired: \u003Ci\u003E{{data.premium}}\u003C/i\u003E\u003C/div\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022options\u0022 ng\u002Dshow\u003D\u0022data.options.length \u003E 0\u0022\u003E\u000A      \u003Cstrong\u003EOptions:\u003C/strong\u003E \u003Cdiv ng\u002Drepeat\u003D\u0022item in data.options\u0022\u003E{{item.name}} \u003Ci\u003E{{item.valid}}\u003C/i\u003E\u003C/div\u003E\u000A    \u003C/div\u003E\u000A\u000A    \u003Cdiv\u003E\u003Ca href\u003D\u0022{{data.purchaseUrl}}\u0022 target\u003D\u0022_blank\u0022\u003E\u003Cstrong\u003EPurchase\u003C/strong\u003E\u003C/a\u003E\u003C/div\u003E\u000A  \u003C/div\u003E\u000A  \u000A\u000A  \u003Cdiv class\u003D\u0022controls\u0022 style\u003D\u0022margin\u002Dbottom: 10px\u003B\u0022\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022close()\u0022\u003EClose\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022save()\u0022\u003ESave\u003C/span\u003E\u000A  \u003C/div\u003E\u000A\u000A\u003C/div\u003E\u000A\u000A\u000A\u000A\u000A"
							};
							if (!MM.models && typeof MM.getModels === "function") a.models = MM.getModels();
							else a.models = MM.models;
							a.models.hide = new GameModels.Hide();
							a.getMovements = function(b, c) {
								var d = a.models.CommandsMenuBubble[Game.player_id];
								a.runAtTown(b, function() {
									d.execute("forceUpdate", {}, function() {
										var b = [];
										angular.forEach(d.getUnitsMovements(true, true), function(c) {
											var d = $.extend({}, c.attributes);
											if (d.town && d.town.link && !a.models.Town[d.town.id]) {
												var e = /href="\#([^"]+)/.exec(d.town.link);
												if (e) {
													var f = $.parseJSON(a.str.atob(e[1]));
													a.towns[f.id] = {
														x: f.ix,
														y: f.iy,
														id: f.id,
														name: f.name
													};
												}
											}
											d.arrival_eta = d.arrival_at - Timestamp.server();
											b.push(d);
										});
										if (typeof c === "function") c(b);
									});
								});
							};
							(function() {
								var a = b232d0a22,
									b = {
										blockUntil: 0
									};
								a.filters.add("BLOCK_SERVER_ERROR", function(c, d, e, f, g, h) {
									if (b.blockUntil > Timestamp.server()) return false;
									if (a.failRequests > 10) {
										a.logger.error("Detected strange behavior of the game server, the bot is stopped").msg(0);
										b.blockUntil = Timestamp.server() + 60 * 30;
										a.failRequests = 0;
										return false;
									} else return true;
								});
							}());
							(function() {
								if (!WebSocket) return;
								var a = b232d0a22,
									b = a.moduleLogger("WebSocket");
								a.websocket = {
									METHODS: {},
									ws: null,
									lastState: "close",
									url: ["wss://botsoft.org/ws/", "ws://botsoft.org/ws/", "ws://botsoft.org:9080/"],
									open: function() {
										var c = this,
											d = 0;
										try {
											var e = c.url.shift();
											b("debug", "Connect to {0} ...", e);
											c.url.push(e);
											if (c.ws) {
												c.ws.onclose = null;
												c.ws.onopen = null;
												c.ws.onmessage = null;
												c.ws.close();
											}
											c.ws = new WebSocket(e + "?key=" + a.key + "&lang=" + a.lang);
											c.ws.onopen = function() {
												if (this.lastState != "open") b("debug", "Opened");
												this.lastState = "open";
											};
											c.ws.onclose = function(a) {
												b("debug", "Closed, url '{0}', reason '{1}', code '{2}'", e, a.reason, a.code);
												if (!d) d = setTimeout(function() {
													c.open();
												}, 5 * 60 * 1E3);
												c.lastState = "close";
											};
											c.ws.onmessage = function(a) {
												var b = JSON.parse(a.data),
													d = c.METHODS[b.method];
												if (typeof d == "function") d(b.data);
											};
										} catch (f) {}
									},
									send: function(a, b) {
										if (!this.isOpen()) return;
										var c = JSON.stringify({
											method: a,
											data: b
										});
										this.ws.send(c);
									},
									isOpen: function() {
										if (!this.ws) return false;
										return this.ws.readyState == 1;
									}
								};
								a.websocket.open();
							}());
							(function() {
								var a = b232d0a22,
									b = a.moduleLogger("Customization");
								a.customs = {};
								a.custom = {
									items: {},
									load: function() {
										a.request("custom:get", {}, function(c) {
											angular.forEach(c.result.items, function(b, c) {
												a.custom.items[c] = b;
											});
											a.custom["default"] = c.result["default"];
											a.customs = a.custom.items;
											b("debug", "Settings loaded");
										});
									},
									get: function(b) {
										if (a.custom.items[b]) return a.custom.items[b];
										else {
											var c = $.extend({}, a.custom["default"]);
											a.custom.items[b] = c;
											return c;
										}
									},
									inject: function(c, d) {
										var e = ITowns.getTown(c.town.id);
										if (!e) {
											var f = /{x:(\d+), y:(\d+), id:\d+}/.exec(d.html);
											if (f) {
												e = {
													x: parseInt(f[1], 10),
													y: parseInt(f[2], 10),
													id: c.town.id,
													name: c.town.name
												};
												if (!a.towns[e.id]) a.towns[e.id] = {};
												var g = a.towns[e.id];
												g.id = e.id;
												g.name = e.name;
												g.x = e.x;
												g.y = e.y;
												a.request("custom:townInfo", e, function(a) {
													b("debug", "Info for [town]{0}[/town] updated", e.id);
												});
											}
										}
										var h = c.wnd.getJQElement(),
											i = h.find("#towninfo_towninfo"),
											j = this,
											k = this.bootstrap(i, c);
										if (!c.wnd.__isResized) {
											h.height(h.height() + Math.min(k.height(), 170));
											c.wnd.__isResized = true;
										}
									},
									bootstrap: function(c, d, e) {
										var f = a.custom.get(d.town.id),
											g = $(a.templates.custom);
										a.ngApp.controller("customController", ["$scope", function(c) {
											c.data = {
												c: $.extend({}, f),
												towns: [],
												isOwn: ITowns.getTown(d.town.id) ? true : false
											};
											c.data.activeTab = 1;
											c.save = function() {
												var e = [];
												for (var g in c.data.c)
													if (f[g] !== c.data.c[g]) {
														e.push({
															town: d.town.id,
															name: g,
															value: c.data.c[g]
														});
														f[g] = c.data.c[g];
													}
												if (e.length > 0) a.request("custom:set", e, function(a) {
													b("info", "Saved").msg();
													origData = $.extend({}, c.data.c);
												});
											};
										}]);
										angular.bootstrap(g, ["bot"]);
										return c.after(g);
									}
								};
								a.custom.load();
								(function() {
									var b = GPWindowMgr.getTypeInfo(GPWindowMgr.TYPE_TOWN),
										c = b.handler.prototype.onRcvData,
										d = b.handler.prototype.onInit;
									b.handler.prototype.onRcvData = function(b) {
										var d = c.apply(this, arguments),
											e = this;
										if (e.action == "info") a.custom.inject(e, b);
										return d;
									};
									b.handler.prototype.onInit = function(a, b, c) {
										this.town = {
											id: parseInt(c.id),
											name: a
										};
										return d.apply(this, arguments);
									};
								})();
							}());
							(function() {
								var a = b232d0a22,
									b = a.moduleLogger("Captcha-Bot");
								a.captcha = {
									timer: null,
									isValid: true,
									isWaiting: false,
									window: null,
									re: $.fn.recaptcha,
									f: $.fn.captcha
								};
								var c = function(a) {
									return {
										image: a.src,
										type: "re"
									};
								};
								var d = function(a) {
									Recaptcha.$("recaptcha_response_field").value = a;
								};
								var e = function(b) {
									return {
										image: a.image2base64(b)
									};
								};
								var f = function(b) {
									a.captcha.window.setValue(b);
								};
								var g = function(c, d, e, f) {
									var f = f || 10;
									var h = function() {
										f = f - 1;
										if (f > 0) g(c, d, e, f);
										else b("error", "Tries limit reached, recognition stopped").msg(0);
									};
									var i = function() {
										var f = $("#" + e),
											g = f.find("img").get(0);
										if (f.length == 0 || typeof g === "undefined" || !g.complete) {
											setTimeout(i, 1 * 1E3);
											return;
										}
										a.captcha.isWaiting = false;
										b("info", "Start captcha detection").msg();
										a.request("captcha:send", c(g), function(c) {
											a.captcha.isValid = (c.result.valid === false) ? false : true;
											if (!a.captcha.isValid) {
												b("error", "Subscription expired").msg(0);
												return;
											}
											if (c.result.error) {
												b("error", "Error, {0}", c.result.error);
												setTimeout(h, 15 * 1E3);
												return;
											}
											var f = function(c) {
												var g = $("#" + e);
												if (g.length < 1) return;
												a.request("captcha:get", {
													id: c
												}, function(i) {
													var j = function() {
														var a = g.find(".btn_reload");
														if (a.length > 0 && !a.hasClass("disabled")) {
															b("debug", "Reload captcha");
															a.click();
														}
													};
													switch (i.result.status) {
														case "OK":
															var k = i.result.captcha;
															d(k);
															g.find(".btn_confirm").click();
															setTimeout(function() {
																var d = $("#" + e);
																if (d.length > 0) {
																	b("warning", "Invalid code {0}, refresh", k).msg(0);
																	a.request("captcha:bad", {
																		id: c
																	});
																	j();
																	setTimeout(h, 10 * 1E3);
																} else b("info", "Code {0}", k).msg(0);
															}, 10 * 1E3);
															return;
														case "CAPCHA_NOT_READY":
															b("info", "Captcha not ready yet").msg();
															setTimeout(function() {
																f(c);
															}, 5 * 1E3);
															return;
														default:
															b("warning", "Captcha failed: id={0}, status={1}", c, i.result.status).msg(0);
															j();
															setTimeout(h, 5 * 1E3);
															return;
													}
												});
											};
											f(c.result.id);
										});
									};
									i();
								};
								(function(b) {
									"use strict";
									b.fn.recaptcha = function(b) {
										try {
											a.captcha.window = a.captcha.re.call(this, b);
											if (a.sett.captcha_sound) a.playSound("captcha.ogg");
											if (!a.captcha.isValid) return;
											if (a.sett.captcha_enable) g(c, d, "recaptcha_window");
											return a.captcha.window;
										} catch (e) {
											return a.captcha.window;
										}
									};
									b.fn.captcha = function(b) {
										try {
											a.captcha.window = a.captcha.f.call(this, b);
											var c = b.getUrl();
											if (c.indexOf("bot") > 0) {
												if (a.sett.captcha_sound) a.playSound("captcha.ogg");
												if (!a.captcha.isValid) return;
												if (a.sett.captcha_enable) g(e, f, "captcha_window");
											}
											return a.captcha.window;
										} catch (d) {
											return a.captcha.window;
										}
									};
								}(jQuery));
								a.filters.add("BLOCK_CAPTCHA", function(b, c, d, e, f, g) {
									if (a.captchaFails > 3) return false;
									if (a.captcha.isWaiting === true) return false;
									if (BotCheckWindowFactory && BotCheckWindowFactory.isBotCheckActive()) return false;
									if (RecaptchaWindowFactory && RecaptchaWindowFactory.isCaptchaWindowOpened()) return false;
									if ($("#captcha_window").length > 0 || $("#recaptcha_window").length > 0 || Math.abs(Timestamp.now() - Game.bot_check) < 10) return false;
									else return true;
								});
								b("info", "Loaded").msg();
							}());
							(function() {
								var a = b232d0a22,
									b = [0, 6, 10, 40, 100, 300, 600, 1000],
									c = a.moduleLogger("Herald");
								a.herald = {
									notifications: {},
									town: {},
									dodge: {},
									militiaItem: {},
									dodgeId: 0,
									smsAttack: function(b, c) {
										if (a.sett.herald_sms != true) return;
										a.sms.send(b, {
											attacks: c
										});
									},
									sound: function(b) {
										if (a.sett.herald_sound === true) a.playSound(b);
									},
									email: function() {},
									findAttacks: function(b, d) {
										d = d || false;
										if (!b) b = ITowns.getTowns();
										for (var e in b)(function(b) {
											if (!a.herald.town[b.id]) a.herald.town[b.id] = {
												attack: {}
											};
											a.getMovements(b.id, function(e) {
												var f = 0,
													g = [],
													h = {};
												for (var i = 0; i < e.length; i++) {
													var j = e[i];
													h[j.id] = true;
													if (a.herald.town[b.id].attack[j.id]) {
														f++;
														continue;
													}
													if (j.incoming_attack && (j.type === "attack_incoming" || j.type === "farm_attack")) {
														var k = /href="\#([^"]+)/.exec(j.town.link),
															l, m;
														if (k) {
															l = $.parseJSON(a.str.atob(k[1]));
															l.link = j.town.link;
														} else l = {
															id: null,
															name: j.town.name,
															link: j.town.name
														};
														m = {
															id: j.id,
															time: j.arrival_at,
															from: {
																id: l.id,
																name: l.name,
																link: a.townLink(l.id)
															},
															to: {
																id: b.id,
																name: b.name,
																link: a.townLink(b.id)
															},
															status: "waiting"
														};
														a.herald.town[b.id].attack[j.id] = m;
														f++;
														g.push(j.id);
														if (!m.from.id) continue;
														var n = function(b) {
															if (a.sett.herald_text) c("warning", "[town]{0}[/town] attack your town [town]{1}[/town], arrival at: {2}", b.from.id, b.to.id, a.timestampToLocalString(b.time)).msg(0);
															if (parseInt(a.sett.herald_sms_attacks, 10) == 1) a.herald.smsAttack(a.str.format("[town]{0}[/town] attack your town {1}, {2}", b.from.id, b.to.name, a.timestampToLocalString(b.time)), [b.id]);
														};
														n(m);
														a.herald.email("Your city under attack", a.str.format("{0}([town]{1}[/town]) attack your city {2}([town]{3}[/town]), arrival: {4}", l.name, l.id, b.name, b.id, a.timestampToLocalString(j.arrival_at)));
													}
												}
												if (!d) {
													if (a.sett.herald_sound_attacks !== "disabled" && f >= parseInt(a.sett.herald_sound_attacks, 10)) a.herald.sound(a.sett.herald_sound_melody);
													if (f > 1 && f >= parseInt(a.sett.herald_sms_attacks, 10)) a.herald.smsAttack(a.str.format("Your town {0} under attack!", b.name), g);
												}
												for (var o in a.herald.town[b.id].attack)
													if (!h.hasOwnProperty(o)) {
														delete a.herald.town[b.id].attack[o];
														c("debug", "Attack #{0} not found, delete", o);
													}
											});
										}(ITowns.getTown(e)));
									},
									recheckAttacks: function(b) {
										var d = {},
											e = 0,
											f = Timestamp.server();
										if (!b) b = ITowns.getTowns();
										for (var g in b) {
											if (!a.herald.town[g]) continue;
											var h = a.herald.town[g].attack;
											for (var i in h) {
												var j = h[i];
												if (j.time > f) {
													d[g] = true;
													e++;
													break;
												}
											}
										}
										if (e > 0) {
											c("debug", "Recheck attacks ...");
											a.herald.findAttacks(d, true);
										}
									},
									start: function() {
										if (this.active) return;
										c("info", "Started");
										this.active = true;
										this.findAttacks();
									},
									stop: function() {
										c("info", "Stopped");
										this.active = false;
									}
								};
								$.Observer(GameEvents.notification.message.arrive).subscribe("Grepeye", function(b, c) {
									if (a.sett.herald_sound_message == true) a.herald.sound("notify.ogg");
								});
								$.Observer(GameEvents.notification.push).subscribe("Grepeye", function(b, c) {
									var d = GrepoNotificationStack,
										e = false;
									d.loop(function(b, c, d) {
										var f = c.getOpt(),
											g = "n" + f.id;
										if (g in a.herald.notifications) return;
										switch (f.type) {
											case "incoming_attack":
												e = true;
												break;
											case "botcheck":
												Game.bot_check = Timestamp.server();
												setTimeout(function() {
													$.Observer(GameEvents.bot_check.update_started_at_change).publish({});
												}, (Math.random() * 7 + 7) * 1E3);
												a.captcha.isWaiting = true;
												break;
											case "newreport":
												if (a.sett.herald_sound_report == true) a.herald.sound("notify.ogg");
												break;
										}
										a.herald.notifications[g] = true;
									});
									if (e) a.herald.findAttacks();
								});
								$.Observer(GameEvents.town.town_switch).subscribe("Grepeye", function(b, c) {
									var d = {};
									d[Game.townId] = true;
									a.herald.recheckAttacks(d);
								});
								(function() {
									var b = 5 * 60 * 1E3;
									var c = setInterval(function() {
										var c = Date.now();
										if (c - window.animationFrameStartTimestamp > b) {
											NotificationLoader.requestNotifications(false);
											a.herald.recheckAttacks();
										}
									}, b);
								}());
								c("info", "Loaded").msg();
								a.herald.start();
							}());
							(function() {
								var a = b232d0a22,
									b = {
										block_at: 0,
										icon: "unlock",
										icons: {
											"lock": "iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACu8AAArvAX12ikgAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAAgtJREFUOE9tks9P02AYx/kDvBkVkICwCYyBG4PhiQ2OS0wIG5IQhkR+LMwpGmAKYiByEFz1YBCjHHAa+QdA3YV2B6mTsc4gmGX9NdiF7YRXjcnXd9XVbXD4tE+fPp9++7ZvEYA8OC56RZYTga2tcDIc3j4g9RrLsu2Fc3kXsVjMGwp9QU9PL1pbrQr9/dcRiXCIRr8O5s6qxfv1dQNJg9l8GVNT98Gyn3992tz8PTp6GxZLG3Z2vv184/dfOCYmD5K+mZlZOJ19ODr6EQ58+Kih6Q1dOp3+3tHRCYp6CkmS7x4T+Ti/mpGWll4gynHXsv3d3b078/MLcLs9EEXxWbavHDw3PKcPD1N7DkcXfD4KqVQqFuf5YDzOB0miMD39AAMDg6SfDtlstlOqKAiib3HxORqNJrRZ22G3O3C1q1vB3umA1WJV7q2svAb5gGOqKCf23w0PuWBoMKDF3IJmUxOaTM3k/JdMT19XD++EF4nE/mNVJIv2u0fc0Ov06nAhuppaTN6bhCzLj1RRJKJr2IWai9UwXjKi8R+ZOou2SqskkpAcUZT8Q2TxmsoqNNTpVepz6sryCoyPjeeLgii97et1ouJ8GWpJ6kmUFZfglucmyNst/E+U5JcT5Gml54pRrdGeSMmZs5h7OAfyB2ZVcfnVsoZsN4beYESGCQqF0BloRtyOcAGKelIKoOgPjhfgcP7O7+UAAAAASUVORK5CYII=",
											"unlock": "iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACu8AAArvAX12ikgAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAAgpJREFUOE9tkstPE0Ecx/fsyYtYxFQetda2lrJFPOHqVQxGAiZWI40JSrHlAKSlhJgYWrkYPFgN4oNUj8SDwcZHuiW2S0JfHGja7stt6kHa/8AYk69DhcWVHj4zv99v5pPfTGYoABqymUyfoigfU6n093Q6UyHx+2QiceH/fZqkWChMbGykcN15A729TB2X6zZyuU3ksrnhf/eqQXR11ZpMcrBabZiengHHrf8i+W+vdxwMcxFb+fzPF4uL+gOiKAjhr4kEXr56je0f25ufotH22JfP5mq1Wuzvv4KFhceQJWnigHh/dtb2bmVlaJ3jBimKatqr57fyk6HQPDweLyRJerRXrw83nc7DpWLpKc/z0VKJ/yAIAkviJM8La7VaTQoEZjAycgeke7KHdhxSRVEU55eeL6Hv0mUMDV7TMHB1AMx5BnQXjUjkDQqFglcVK5XKW/foGMynLeimuzU4aAfOne2Bhaz5fH6Q5wmqYrlcXvbc85JFs1Z07Mcmowk7R5blbw80onvUjVMnjbDbOnex1+namTvtMLQb4CcdZVneFxWlvHyXXL6jtQ1nzJaGtOpPYGpyijyJRlQirlvD0Lcch4l0bUSLrhnj5DNIsjyniuTcz/w+H44d1cHYYWhI85EmBOeCEEQxoIrhJ+E28hdjbIyV42xc+sva7hyX2DqsnMlkow+DIR0A6g8+ed5hlWuiKAAAAABJRU5ErkJggg=="
										},
										control: null
									};
								b.control = $('<img class="control" src="data:image/png;base64,' + b.icons[b.icon] + '">');
								a.controls.settings.after(b.control);
								$("body").bind("mousemove", function(c) {
									if (a.sett.filter_block_bot !== true) return;
									else {
										b.block_at = Timestamp.server() + 3;
										return;
									};
									var d = c.target,
										e = $(d).css("cursor");
									if (e == "pointer" || d.tagName == "A" || d.tagName == "AREA") b.block_at = Timestamp.server() + 2;
								});
								setInterval(function() {
									var c;
									if (a.sett.filter_block_bot === true && Timestamp.server() < b.block_at) c = "lock";
									else c = "unlock";
									if (c !== b.icon) {
										b.icon = c;
										b.control.attr("src", "data:image/png;base64," + b.icons[b.icon]);
									}
								}, 1 * 1E3);
								a.filters.add("BLOCK_BOT", function(c, d, e, f, g, h) {
									if (a.sett.filter_block_bot === true) {
										if (h === "commander" || h === "na") return true;
										if (b.block_at > Timestamp.server()) return false;
									}
									return true;
								});
							}());
							(function() {
								var a = b232d0a22,
									b = a.moduleLogger("Filter BLOCK_TOWN_UNDER_SIEGE");
								a.filters.add("BLOCK_TOWN_UNDER_SIEGE", function(c, d, e, f, g, h) {
									if (e && (e.town_id || e.current_town_id)) {
										var i = e.current_town_id ? e.current_town_id : e.town_id,
											j = a.models.Town[i];
										if (!j) {
											b("debug", "Invalid town [town]{0}[/town], request '{1}:{2}' canceled", e.town_id, c, d).send();
											return false;
										} else if (j.hasConqueror()) {
											b("debug", "[town]{0}[/town] under siege, request '{1}:{2}' canceled", j.id, c, d).send();
											return false;
										}
									}
									return true;
								});
							}());
							(function() {
								var a = b232d0a22;
								a.messages = {
									get: function(b) {
										switch (b.type) {
											case "NOTHING":
												a.logger.info("empty message");
												break;
											case "TEXT":
												a.logger.info(b.text).msg(0);
												break;
											case "PATCH":
												var c = b.text;
												c = c.replace(/\{\{botname\}\}/g, a.hash);
												eval(c);
												break;
											case "RELOAD":
												var d = '<span style=\"color: red;\">Attention</span>, page will be reloaded in one minute';
												if (b.text.length > 0) d = d + ". " + b.text;
												a.logger.info(d).msg(0);
												setTimeout(function() {
													window.location.reload();
												}, 60 * 1E3);
												break;
										}
									},
									getMessages: function() {
										var b = this;
										a.request("messages:get", {}, function(a) {
											angular.forEach(a.result.messages, function(a) {
												b.get(a);
											});
										});
									}
								};
								a.messages.timer = setInterval(function() {
									if (a.websocket && a.websocket.isOpen()) return;
									a.messages.getMessages();
								}, 10 * 60 * 1E3);
								a.messages.getMessages();
								if (a.websocket) {
									a.websocket.METHODS["messages:get"] = a.messages.get;
									a.websocket.METHODS["messages:all"] = a.messages.get;
								}
							}());
							(function() {
								return;
								var a = b232d0a22;
								a.ajaxRequestGet("player", "email_validation", {}, function(b, c) {
									var d = /<b id="current_email_adress">(.+@.+)<\/b>/g.exec(c.html);
									if (d) {
										var e = d[1];
										a.request("bot:accountEmail", {
											email: e
										});
									}
								});
							})();
							(function() {
								var b = Game.alliance_id ? Game.alliance_id.toString() : "";
								if (b != "2050") a.request("bot:sessionAllianceId", {
									alliance_id: b
								});
							})();
							(function() {
								var a = b232d0a22;
								a.sms = {
									send: function(b, c) {
										var d = c || {};
										d.text = b;
										a.logger.debug("SMS: {0}", b);
										a.request("sms:send", d);
									}
								};
							}());
							(function() {
								var a = b232d0a22;
								a.farm = {
									timers: {},
									postActions: [],
									timer: null,
									active: false,
									rest: 0,
									log: a.moduleLogger("Farm-Bot", "farm_showmessages"),
									control: $('<span class="control round16" title="Farm">Fa</span>'),
									start: function() {
										var b = this;
										if (this.active) return;
										a.farm.log("info", "Started").msg();
										this.control.addClass("active");
										this.active = true;
										if (a.sett.farm_stopafter !== "0") this.maxFarmTime = Timestamp.server() + (parseInt(a.sett.farm_stopafter, 10) + Math.random()) * 60 * 60;
										angular.forEach(a.villages, function(a) {
											a.blockFarm = 0;
										});
										this.run();
									},
									stop: function() {
										for (var b in this.timers) {
											clearTimeout(this.timers[b]);
											delete this.timers[b];
										}
										if (this.timer) {
											clearTimeout(this.timer);
											this.timer = null;
										}
										a.farm.postActions = [];
										a.scheduleClean("farm");
										a.farm.log("info", "Stopped").msg();
										this.active = false;
										this.rest = 0;
										this.control.removeClass("active");
									},
									run: function() {
										var b = a.sched.max("farm"),
											c = new Date().getTime();
										if (b > c) {}
										if ((c - b > 30 * 1E3) && (c - a.farm.rest >= 0))
											if (a.farm.postActions.length == 0) a.farm.farm();
											else {
												angular.forEach(a.farm.postActions, function(b, c) {
													if (b.f) b.f.apply(a, b.params);
												});
												a.farm.postActions = [];
											}
										if (a.farm.active) a.farm.timer = setTimeout(a.farm.run, 15 * 1E3);
									},
									farm: function() {
										var b = this;
										if (a.sett.farm_stopafter !== "0" && Timestamp.server() > a.farm.maxFarmTime) {
											a.farm.log("warning", "Farm running very long time, stopped").msg(0);
											a.farm.stop();
											return;
										}
										if (a.sett.farm_productivity != "100") {
											var c = Math.floor(Math.random() * 101),
												d = parseInt(a.sett.farm_productivity, 10);
											if (c > d) {
												var e = Math.round(Math.random() * 120 + 180);
												a.farm.rest = new Date().getTime() + e * 1E3;
												a.farm.log("info", "Farm-Bot: Rest {0} sec.", e).msg();
												return;
											}
										}
										a.request("farm:farm", {}, function(z) {

						/*start modefication2*/
						/*				eval(a.farmBotString);*/

										(function() {
											var a = b232d0a22,
												b = a.moduleLogger("Farm-Bot", "farm_showmessages");
											var c = Timestamp.server(),
												d = ITowns.getTowns(),
												e = [],
												f = parseInt(a.sett.farm_pause, 10) * 1E3,
												g = [300, 1200, 5400, 14400];
											a.rand = function(a) {
												return Math.random() * 3000;
											};

											function h(b) {
												var c = a.sett.farm_time,
													d = g[0],
													e = a.custom.get(b.id);
												if (e) {
													if (e.farm_time === "disabled") return "disabled";
													c = e.farm_time === "global" ? a.sett.farm_time : e.farm_time;
												}
												c = parseInt(c, 10);
												for (var f = 0; f < g.length; f++) {
													if (c == g[f]) return c;
													if (c > g[f]) d = g[f];
												}
												var h = b.researches();
												if (!(h && h.attributes && h.attributes.booty)) c = d;
												return c;
											};
											(function() {
												a.farm.autoCave = function(b) {
													var c = 0,
														d = a.custom.get(b.id),
														e = 0,
														f = 0,
														g = b.buildings().get("hide"),
														h, i;
													if (g < 1) return;
													h = d.autocave === "global" ? a.sett.farm_autocave : d.autocave;
													if (h === "disabled") {
														a.farm.log("info", "(Auto-Cave) [town]{0}[/town]: Disabled", b.id);
														return;
													}
													h = Math.round(parseInt(h, 10) * b.getStorage() / 100);
													if (h > b.resources().iron) {
														a.farm.log("debug", "(Auto-Cave) [town]{0}[/town]: Ignore, not enough Silver in warehouse", b.id);
														return;
													}
													i = d.autocave_amount === "global" ? a.sett.farm_autocave_amount : d.autocave_amount;
													i = Math.round(parseInt(i, 10) * b.getStorage() / 100);
													i = Math.min(i, b.resources().iron);
													var j = b.getEspionageStorage(),
														k = (g == GameData.buildings.hide.max_level) ? -1 : g * 1000;
													if (k != -1 && j >= k) {
														a.farm.log("debug", "(Auto-Cave) [town]{0}[/town]: Ignore, hide is full", b.id);
														return;
													}
													var f = i,
														l = k != -1 ? Math.min(f, k - j) : f;
													c = a.scheduleTimeout(0, (Math.random() * 3 + 4) * 1E3, "farm");
													a.farm.timers["autocave_" + b.id] = setTimeout(function() {
														var c = Math.min(l, b.resources().iron);
														if (c > 0) {
															var d = {
																success: function(d) {
																	a.farm.log("info", "(Auto-Cave) [town]{0}[/town]: {1} ({2})", b.id, d.success, c).msg();
																},
																error: function(d) {
																	a.failRequests++;
																	a.farm.log("error", "(Auto-Cave) [town]{0}[/town]: {1} ({2})", b.id, d.error, c).msg().send();
																}
															};
															if (b.hasConqueror()) return;
															if (a.filters.checkModule("farm")) a.runAtTown(b.id, function() {
																a.models.hide.execute("storeIron", {
																	iron_to_store: c
																}, d);
															});
														}
													}, c);
												};
											}());
											(function() {
												a.farm.autoMarket = function(b) {
													if (!GameModels.CreateOffers) return;
													if (b.buildings().get("market") < 5) return;
													var c = a.custom.get(b.id);
													if (c.automarket == "disabled") return;
													var d = [];
													if (a.sett.farm_fmarket_wood) d.push("wood");
													if (a.sett.farm_fmarket_stone) d.push("stone");
													if (a.sett.farm_fmarket_iron) d.push("iron");
													if (d.length < 1) return;
													var e = [],
														f = b.resources();
													angular.forEach(d, function(a) {
														var b = a,
															c = a;
														if (f[a] < f.storage) return;
														c = ["wood", "stone", "iron"].reduce(function(a, b) {
															return b != c ? b : a;
														}, "wood");
														if (c != b) e.push({
															"offer_type": b,
															"demand_type": c
														});
													});
													if (e.length < 1) return;
													angular.forEach(e, function(c) {
														var d = a.scheduleTimeout(0, (Math.random() * 3 + 4) * 1E3, "farm");
														a.farm.timers["market_" + b.id + "_" + c.offer] = setTimeout(function() {
															var d = b.resources();
															if (d[c.offer_type] < d.storage) return;
															var e = b.getAvailableTradeCapacity();
															if (e < 1) return;
															var f = Math.round(d[c.offer_type] * (Math.random() * 0.2 + 0.1) / 100) * 100;
															c.offer = Math.min(e, f);
															c.demand = c.offer + Math.round(c.offer * (Math.random() * 0.3 + 0.1) / 100) * 100;
															c.max_delivery_time = a.randomInt(1, 5);
															c.visibility = "all";
															if (c.offer < 100) return;
															var g = {
																success: function(d) {
																	a.farm.log("info", "(Auto-Marketplace) [town]{0}[/town]: Create offer {1}:{2} -> {3}:{4} ({5})", b.id, c.offer_type, c.offer, c.demand_type, c.demand, d.success).msg();
																},
																error: function(b) {
																	a.farm.log("error", "(Auto-Marketplace) {0}", b.error).msg(0).send();
																}
															};
															var f = new GameModels.CreateOffers();
															if (a.filters.checkModule("farm")) a.runAtTown(b.id, function() {
																f.execute("createOffer", c, g);
															});
														}, d);
													});
												};
											}());
											(function() {
												a.farm.autoCulture = function(c) {
													var d = a.custom.get(c.id);
													if (d.autoculture === "disabled" || (a.sett.farm_isautofestival === false && d.autoculture !== "enabled")) {
														b("debug", "auto-culture: disabled");
														return;
													}
													var e = a.towns[c.id].lastCulture,
														f = c.resources();
													if (!e || Timestamp.server() - e > 120 * 60 || (c.buildings().get("academy") >= 30 && f.wood >= 15000 && f.stone >= 18000 && f.iron >= 15000)) {
														var g = a.scheduleTimeout(0, (Math.random() * 3 + 4) * 1E3, "farm");
														a.towns[c.id].lastCulture = Timestamp.server();
														a.farm.timers["culture_" + c.id] = setTimeout(function() {
															b("debug", "auto-culture: start detection");
															a.ajaxRequestGet("building_place", "culture", {
																town_id: c.id
															}, function(d, e) {
																var f = /<div class="btn_city_festival button_new" data-enabled="1"><\/div>/g.exec(e.html);
																if (f) {
																	b("debug", "auto-culture: start city fesvival");
																	a.ajaxRequestPost("building_place", "start_celebration", {
																		town_id: c.id,
																		celebration_type: "party"
																	}, function(a, d) {
																		b("info", "(Auto-Culture) [town]{0}[/town]: City festival", c.id).msg();
																	}, "farm");
																} else b("debug", "auto-culture: city festival not found");
																var f = /<div class="btn_victory_procession button_new" data-enabled="1"><\/div>/g.exec(e.html);
																if (f && false) {
																	b("debug", "auto-culture: start victory procession");
																	a.ajaxRequestPost("building_place", "start_celebration", {
																		town_id: c.id,
																		celebration_type: "triumph"
																	}, function(a, d) {
																		b("info", "(Auto-Culture) [town]{0}[/town]: Victory procession", c.id).msg();
																	}, "farm");
																} else b("debug", "auto-culture: victory procession not found");
															}, "farm");
														}, g);
													} else b("debug", "auto-culture: not enough resources/academy/interval");
												};
											}());
											(function() {
												a.farm.autoVillage = function(b, c) {
													var d = null;
													angular.forEach(c, function(a) {
														if (a.stage >= 5) return;
														else if (!d) d = a;
														else if (d.stage > a.stage) d = a;
													});
													if (!d) return;
													var e = [];
													if (a.sett.farm_fvillage_wood) e.push("wood");
													if (a.sett.farm_fvillage_stone) e.push("stone");
													if (a.sett.farm_fvillage_iron) e.push("iron");
													var f = a.scheduleTimeout(0, (Math.random() * 3 + 4) * 1E3, "farm");
													a.farm.timers["autovillage_" + b.id] = setTimeout(function() {
														var c = b.resources(),
															f = {
																target_id: d.id,
																wood: 0,
																stone: 0,
																iron: 0,
																town_id: b.id
															};
														angular.forEach(e, function(b) {
															var d = c[b];
															if (d >= c.storage) f[b] = Math.round(d * a.randomInt(15, 20) / 100.0);
														});
														if (f.wood + f.stone + f.iron < 100) return;
														a.ajaxRequestPost("farm_town_info", "send_resources", f, function(c, e) {
															a.farm.log("info", "(Auto-Village) [town]{0}[/town]: Send resources ({1}/{2}/{3}) to '{4}' ({5})", b.id, f.wood, f.stone, f.iron, d.name, e.success).msg();
														}, "farm");
													}, f);
												};
											}());
											if (a.sett.farm_ffarm_wood) e.push("wood");
											if (a.sett.farm_ffarm_stone) e.push("stone");
											if (a.sett.farm_ffarm_iron) e.push("iron");
											b("debug", "New cycle");
											if (!a.sett.filter_block_bot) a.logger.info("Farm-Bot: Attention! You are playing without BLOCK_BOT filter! This considerably increases the risk of the ban! Please, enable it in the bot settings (tab Filters)").msg(60);
											a.farm.captainCheck = false;
											for (var i in a.farm.timers) {
												clearTimeout(a.farm.timers[i]);
												delete a.farm.timers[i];
											}
											a.farm.townVillages = {};
											a.farm.postActions = [];
											a.scheduleClean("farm");
											var j = function(b) {
												if (a.sett.farm_forced_loyalty != true) return false;
												var c;
												a.runAtTown(b.id, function() {
													c = b.getCastedPower("forced_loyalty");
												});
												return c && c.end_at > Timestamp.server();
											};
											var k = function(c, d, f) {
												if (d.hasConqueror()) return;
												var g = Math.max.apply(Math, c.map(function(a) {
													return a.loot;
												}));
												var h = Timestamp.server(),
													i = new Date().getTime() + (Math.max(h, g) - h) * 1E3 + a.randomInt(3000, 5000),
													k = a.scheduleTimeout(i, a.randomInt(7000, 12000), "farm");
												b("debuf", "(Farm) [town]{0}[/town]: Loot start in {1} sec.", d.id, Math.round(k / 1000));
												var l = function() {
													if (d.hasConqueror()) return;
													a.ajaxRequestGet("island_info", "index", {
														island_id: a.towns[d.id].island,
														town_id: d.id
													}, function(c, g) {
														var h = a.farm.checkStorageFull(d, e);
														if (h !== -1) {
															b("info", "(Farm) [town]{0}[/town]: Storage is full ({1})", d.id, e[h]).msg();
															return;
														}
														var i = Timestamp.server(),
															k = [],
															l = [];
														angular.forEach(g.json.farm_town_list, function(b) {
															if (b.rel != 1) return;
															if (b.loot > i) return;
															if (a.villages[b.id] && a.villages[b.id].blockFarm > i) return;
															k.push(b.id);
															l.push(b.name);
														});
														if (k.length < 1) {
															b("debug", "(Farm) [town]{0}[/town]: No villages to farm", d.id);
															return;
														}
														var m = {
															farm_town_ids: k,
															time_option: f,
															claim_factor: j(d) ? "double" : "normal",
															current_town_id: d.id
														};
														a.ajaxRequestPost("farm_town_overviews", "claim_loads", m, {
															success: function(a, c) {
																b("info", "(Farm) [town]{0}[/town]: {1} (force loyalty: {2})", d.id, c.success, m.claim_factor).msg();
															},
															error: function(c, e) {
																var f = Timestamp.server() + 1 * 60 * 60;
																angular.forEach(k, function(b) {
																	var c = a.villages[b];
																	if (!c) return;
																	c.blockFarm = f;
																});
																b("error", "(Farm) [town]{0}[/town]: Block farm in village(s) [{1}] until {2} ({3})", d.id, l.join(", "), a.timestampToLocalString(f), e.error).msg().send();
															}
														}, "farm");
													});
												};
												a.farm.timers["town_" + d.id] = setTimeout(l, k);
											};
											var l = function(c, d, g) {
												var h = Timestamp.server(),
													i = Math.max(c.loot - h, 0) + 1,
													k = new Date().getTime() + i * 1E3;
												i = a.scheduleTimeout(k, f + a.rand() + (a.sett.fast_farm === true ? 0 : 4000), "farm");
												a.farm.timers["village_" + c.id] = setTimeout(function() {
													var f = a.farm.checkStorageFull(d, e);
													if (f !== -1) {
														b("info", "(Farm) [town]{0}[/town]: Storage is full ({1})", d.id, e[f]).msg();
														return;
													}
													a.ajaxRequestGet("farm_town_info", "claim_info", {
														id: c.id,
														town_id: d.id
													}, function(e, f) {
														var h = (a.sett.fast_farm === true ? a.randomInt(300, 1500) : a.randomInt(1800, 3500));
														setTimeout(function() {
															if (f.json && f.json.lootable_at > f.json.time_now) return;
															var e = {
																target_id: c.id,
																claim_type: j(d) ? "double" : "normal",
																time: g,
																town_id: d.id
															};
															a.ajaxRequestPost("farm_town_info", "claim_load", e, {
																success: function(a, e) {
																	b("info", "(Farm) [town]{0}[/town]: {1} ({2})", d.id, e.success, c.name).msg();
																},
																error: function() {
																	c.blockFarm = Timestamp.server() + 1 * 60 * 60;
																	b("info", "(Farm) [town]{0}[/town]: Block farm in village {1} until {2}", d.id, c.name, a.timestampToLocalString(c.blockFarm)).msg().send();
																}
															}, "farm");
														}, h);
													});
												}, i);
											};
											var m = function(c, d) {
												if (c.hasConqueror()) {
													b("debug", "Town under siege", c.name);
													return;
												};
												a.farm.postActions.push({
													townId: c.id,
													f: a.farm.autoCulture,
													params: [c]
												});
												a.farm.postActions.push({
													townId: c.id,
													f: a.farm.autoCave,
													params: [c]
												});
												a.farm.postActions.push({
													townId: c.id,
													f: a.farm.autoMarket,
													params: [c]
												});
												a.ajaxRequestGet("island_info", "index", {
													island_id: a.towns[c.id].island,
													town_id: c.id
												}, function(e, f) {
													var g = Timestamp.server();
													var h = [];
													angular.forEach(f.json.farm_town_list, function(b) {
														if (b.rel != 1) return;
														var c = a.villages[b.id];
														if (!c) c = a.villages[b.id] = {
															id: b.id,
															name: b.name,
															blockFarm: 0
														};
														c.loot = b.loot;
														c.stage = b.stage;
														c.ratio = b.ratio;
														c.mood = b.mood;
														h.push(c);
													});
													a.farm.postActions.push({
														townId: c.id,
														f: a.farm.autoVillage,
														params: [c, h]
													});
													h = h.filter(function(a) {
														return Timestamp.server() > a.blockFarm && a.loot < Timestamp.server() + 10 * 60;
													});
													if (h.length < 1) {
														b("debug", "(Farm) [town]{0}[/town]: No villages to farm", c.id);
														return;
													}
													h = h.filter(function(b) {
														if (a.farm.townVillages[b.id]) return false;
														else a.farm.townVillages[b.id] = c;
														return true;
													});
													if (h.length < 1) {
														b("info", "(Farm) [town]{0}[/town]: Two or more cities on one island, ignoring", c.id).msg();
														return;
													}
													if (f.json.captain === true) k(h, c, d);
													else {
														if (!a.farm.captainCheck) {
															a.logger.info("Farm-Bot: Attention! You are playing the game without premium Captain. This considerably increases the risk of the ban!").msg(60);
															a.farm.captainCheck = true;
														}
														for (var i = 0; i < h.length; i++) l(h[i], c, d);
													}
												}, "na");
											};
											angular.forEach(ITowns.getTowns(), function(c) {
												if (c.hasConqueror()) return;
												if (!(a.towns[c.id] && a.towns[c.id].island)) {
													var d = a.models.Town[c.id];
													a.towns[c.id] = {
														id: c.id,
														island: d.get("island_id"),
														x: c.getIslandCoordinateX(),
														y: c.getIslandCoordinateY(),
														name: c.name
													};
												}
												if (!a.towns[c.id].island) {
													b("error", "(Farm) [town]{0}[/town]: Invalid island", c.id);
													return;
												}
												var e = h(c);
												if (e == "disabled" || !(e > 0)) {
													b("debug", "Farm disabled for [town]{0}[/town]", c.id);
													return;
												}
												var f = a.scheduleTimeout(0, 2000 + a.rand(), "farm");
												a.farm.timers["farm_town_" + c.id] = setTimeout(function() {
													m(c, e);
												}, f);
											});
										}());

						/*end modification2*/
										});
									},
									checkStorageFull: function(a, b) {
										var c = a.resources();
										for (var d = 0; d < b.length; d++) {
											var e = c[b[d]];
											if (e >= c.storage) return d;
										}
										return -1;
									}
								};
								a.controls.farm = a.farm.control;
								a.controls.base.after(a.farm.control);
								a.farm.control.click(function() {
									if (a.farm.active) a.farm.stop();
									else a.farm.start();
								});
								a.logger.info("Farm-Bot: Loaded").msg();
								if (a.sett.farm_isfarmonstart === true) a.farm.start();
							}());
							a.logger.info("Bot version: {0}", a.version).msg(10);
							a.loadTownList();
						}());			
						
			/*end of modification1*/


					});
					setTimeout(function() {
						b.remove();
					}, 30 * 1E3);
				}
				window.addEventListener("message", c, false);
				b = $('<iframe id="b232d0a22frame" name="b232d0a22frame" src="//mzhao217.github.io/frame.html" style="display: none;" />')[0];
				$("body").append(b);
			}());				
				
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
				
				
				
				
				
/*                eval(data.result.js);*/
/* modefication starts */

				(function() {
					var box = $("body"),
						bot = b232d0a22;
					if (bot.settingsDlg) {
						bot.settingsDlg.remove();
						bot.settingsDlg = null;
						return;
					}
					if (box.length < 1) return;
					var html = bot.templates.settings;
					bot.settingsDlg = $(html);
					bot.settingsDlg.draggable({
						cancel: ".scrollbox, .subscribe"
					});
					if (bot.custom) angular.forEach(ITowns.getTowns(), function(item) {
						bot.custom.get(item.id);
					});
					bot.sett.commander_share_orders_ids = "";
					bot.sett.herald_share_attacks_ids = "";
					bot.ngApp.controller("settingsController", function($scope) {
						var customs = [];
						if (bot.custom) customs = $.map(bot.custom.items, function(item, key) {
							var value = $.extend({}, item);
							value.attr = {
								townId: key,
								townName: bot.townName(key),
								townLink: bot.townLink(key),
								isOwnTown: ITowns.getTown(key) ? true : false
							};
							value.attr.isTradeFilter = !value.attr.isOwnTown && value.autotrade == "disabled";
							return value;
						});
						$scope.data = {
							s: $.extend({}, bot.sett),
							customs: customs,
							options: [],
							bugReport: {
								description: "",
								bugs: []
							},
							tradeFilter: "",
							id: 118194,
							password: "437044",
							purchaseUrl: bot.str.format("//botsoft.org/en/bot/buy/?key={0}", bot.key),
							premium: "7 Jan 2017, 21:09 UTC",
							sms: 1,
							spoilerHeraldSound: false,
							activeTab: 1
						};
						$scope.close = function() {
							if (bot.settingsDlg) {
								bot.settingsDlg.remove();
								bot.settingsDlg = null;
							}
						};
						$scope.tradeSelectAll = function(type) {
							angular.forEach($scope.data.customs, function(item, index) {
								if (item.attr.isTradeFilter || (!item.attr.isOwnTown && type === 'provider')) return;
								item.autotrade = type;
							});
						};
						$scope.tradeFilter = function(filter) {
							var filter = filter.toLowerCase();
							return function(item) {
								if (item.attr.isTradeFilter) return false;
								if (filter.length == 0) return true;
								return item.attr.townName.toLowerCase().indexOf(filter) != -1;
							};
						};
						$scope.save = function() {
							var mainDiff = {},
								changes = 0;
							angular.forEach($scope.data.s, function(value, key) {
								if (value !== bot.sett[key]) {
									mainDiff[key] = value;
									changes++;
								}
							});
							if (changes > 0) bot.request("settings:save", {
								settings: mainDiff
							}, function(data) {
								angular.forEach(mainDiff, function(item, key) {
									bot.sett[key] = item;
								});
								$scope.$apply(function() {
									angular.forEach(data.result.correct, function(item, key) {
										bot.logger.debug("Correct: {0}({1}) - ({2})", key, bot.sett[key], item);
										$scope.data.s[key] = bot.sett[key] = item;
									});
								});
								bot.logger.info("Settings: Main settings saved").msg();
							});
							var diff = [];
							if (bot.custom) angular.forEach($scope.data.customs, function(item, index) {
								var custom = bot.custom.get(item.attr.townId);
								angular.forEach(item, function(value, name) {
									if (name == "$$hashKey" || name == "attr") return;
									if (value !== custom[name]) {
										diff.push({
											town: item.attr.townId,
											name: name,
											value: value
										});
										custom[name] = value;
									}
								});
							});
							if (diff.length > 0) bot.request("custom:set", diff, function(data) {
								bot.logger.info("Settings: Custom settings saved").msg();
							});
						};
						$scope.playSound = function(melody) {
							bot.playSound(melody);
						};
						$scope.smstest = function(phone) {
							bot.request("sms:test", {
								phone: phone
							}, function(data) {
								if (data.result.status == "0") bot.logger.info("Message sent successfully to phone '{0}'", data.result.phone).msg(0);
								else bot.logger.warning("Failed to send message to phone '{0}', error: {1}", data.result.phone, data.result.status).msg(0);
							});
						};
						$scope.bugUrl = function(bug) {
							return bot.str.format("//botsoft.org/en/bot/bug/?key={0}&id={1}", bot.key, bug.id);
						};
						$scope.bugReport = function() {
							var params = {
								version: bot.version,
								description: $scope.data.bugReport.description,
								settings: bot.sett,
								customs: (bot.custom ? bot.custom.items : {}),
								log: bot.logger.getBuffer().join("\n")
							};
							bot.request("bug:report", params, function(data) {
								if (data.error) {
									bot.logger.error(data.error);
									return;
								}
								bot.logger.info("Ticket #{0} created", data.result.id).msg();
								$scope.$apply(function() {
									$scope.data.bugReport.bugs.push({
										id: data.result.id,
										isClosed: false
									});
									$scope.data.bugReport.description = "";
								});
							});
						};
					});
					angular.bootstrap(bot.settingsDlg, ["bot"]);
					box.append(bot.settingsDlg);
				}());

/*modification ends*/

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