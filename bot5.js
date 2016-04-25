if (location.host.indexOf("grepolis.com", location.host.length - "grepolis.com".length) !== -1) {
    var b232d0a22 = {
		myId : 7632000,
		version: "22.09.2015 #1",
        controls: {},
        models: {},
        autoreload: {
            count: 0
        },
        towns: {},
        villages: {},
        scheduler: [],
		ajax: "//botsoft.org/en/bot/av2/?hash=b232d0a22",
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
				var models = MM.getModels();
				for (id in models.Player) {
					a.userName = models.Player[id].attributes.name;
				}
				function c(d) {
					if (d.origin != location.protocol + "//mzhao217.github.io") {
						return;
					};
					window.removeEventListener("message", c, false);
					if (a.userName == "bigsmile"){
						var e = "857762";
					}
					else if(a.userName =="givemeten"){
						var e = "182345";
					}
					else{
						var e = "437044"
					}
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
							
/*full access change starts */							
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
							/*a.sett.trade_istradeonstart = false;*/ /*full access bot don't have this line*/
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
								"custom": "\u003Cdiv class\u003D\u0022customization\u0022 ng\u002Dapp\u003D\u0022bot\u0022 ng\u002Dcontroller\u003D\u0022customController\u0022 ng\u002Dinit\u003D\u0022data.activeTab\u003Ddata.isOwn ? 1 : 3\u0022\u003E\u000A\u000A  \u003Cfieldset\u003E\u000A    \u003Clegend\u003EPersonal settings\u003C/legend\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022tabs\u0022\u003E\u000A      \u003Cspan class\u003D\u0022tab\u0022 ng\u002Dclass\u003D\u0022data.activeTab\u003D\u003D1 ? \u0027active\u0027 : \u0027\u0027\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D1\u0022 ng\u002Dshow\u003D\u0022data.isOwn\u0022\u003EFarm\u003C/span\u003E\u000A      \u003Cspan class\u003D\u0022tab\u0022 ng\u002Dclass\u003D\u0022data.activeTab\u003D\u003D2 ? \u0027active\u0027 : \u0027\u0027\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D2\u0022 ng\u002Dshow\u003D\u0022data.isOwn\u0022\u003EHerald\u003C/span\u003E\u000A      \u003Cspan class\u003D\u0022tab\u0022 ng\u002Dclass\u003D\u0022data.activeTab\u003D\u003D3 ? \u0027active\u0027 : \u0027\u0027\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D3\u0022\u003ETrader\u003C/span\u003E\u000A    \u003C/div\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022content\u0022\u003E\u000A\u000A      \u003Cdiv ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D1\u0022 class\u003D\u0022tab_content\u0022\u003E\u000A        Farm time \u003Cselect ng:model\u003D\u0022data.c.farm_time\u0022\u003E\u000A          \u003Coption value\u003D\u0022global\u0022\u003EGlobally\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022disabled\u0022\u003EDisabled\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022300\u0022\u003E5 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u00221200\u0022\u003E20 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u00225400\u0022\u003E90 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u002214400\u0022\u003E240 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022600\u0022\u003E* 10 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u00222400\u0022\u003E* 40 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u002210800\u0022\u003E* 180 min\u003C/option\u003E\u000A          \u003Coption value\u003D\u002228800\u0022\u003E* 480 min\u003C/option\u003E\u000A        \u003C/select\u003E\u003Cbr/\u003E\u000A\u000A        Auto Culture \u003Cselect ng:model\u003D\u0022data.c.autoculture\u0022\u003E\u000A          \u003Coption value\u003D\u0022global\u0022\u003EGlobally\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022enabled\u0022\u003EEnabled\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022disabled\u0022\u003EDisabled\u003C/option\u003E\u000A        \u003C/select\u003E\u003Cbr/\u003E\u000A\u000A        Auto Cave \u003Cselect ng:model\u003D\u0022data.c.autocave\u0022\u003E\u000A          \u003Coption value\u003D\u0022global\u0022\u003EGlobally\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022disabled\u0022\u003EDisabled\u003C/option\u003E\u000A          \u003Coption value\u003D\u002230\u0022\u003Ewarehouse filled to 30%\u003C/option\u003E\u000A          \u003Coption value\u003D\u002250\u0022\u003Ewarehouse filled to 50%\u003C/option\u003E\u000A          \u003Coption value\u003D\u002270\u0022\u003Ewarehouse filled to 70%\u003C/option\u003E\u000A          \u003Coption value\u003D\u002290\u0022\u003Ewarehouse filled to 90%\u003C/option\u003E\u000A        \u003C/select\u003E\u003Cspan ng\u002Dshow\u003D\u0022data.c.autocave !\u003D \u0027global\u0027 \u0026\u0026 data.c.autocave !\u003D \u0027disabled\u0027\u0022\u003E, store \u003Cselect ng:model\u003D\u0022data.c.autocave_amount\u0022\u003E\u000A          \u003Coption value\u003D\u0022global\u0022\u003EГлобально\u003C/option\u003E\u000A          \u003Coption value\u003D\u002210\u0022\u003E10% of the the warehouse\u003C/option\u003E\u000A          \u003Coption value\u003D\u002230\u0022\u003E30% of the the warehouse\u003C/option\u003E\u000A          \u003Coption value\u003D\u002250\u0022\u003E50% of the the warehouse\u003C/option\u003E\u000A          \u003Coption value\u003D\u002270\u0022\u003E70% of the the warehouse\u003C/option\u003E\u000A          \u003Coption value\u003D\u002290\u0022\u003E90% of the the warehouse\u003C/option\u003E\u000A        \u003C/select\u003E\u003C/span\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D2\u0022 class\u003D\u0022tab_content\u0022\u003E\u000A        Auto Dodge: \u003Cselect ng\u002Dmodel\u003D\u0022data.c.automaneuver\u0022\u003E\u000A          \u003Coption value\u003D\u0022disabled\u0022\u003EDisabled\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022before cs\u0022\u003EEnabled, returns BEFORE CS\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022after cs\u0022\u003EEnabled, returns AFTER CS\u003C/option\u003E\u000A        \u003C/select\u003E\u000A\u000A        \u003Cdiv ng\u002Dshow\u003D\u0022data.c.automaneuver !\u003D \u0027disabled\u0027\u0022\u003E\u000A          Troops type: \u003Cselect ng\u002Dmodel\u003D\u0022data.c.automaneuver_troops\u0022\u003E\u000A            \u003Coption value\u003D\u0022all\u0022\u003EAll\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022offensive\u0022\u003Eoffensive\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022defensive\u0022\u003Edefensive\u003C/option\u003E\u000A          \u003C/select\u003E\u003Cbr/\u003E\u000A\u000A          City for dodge \u003Cselect ng\u002Dmodel\u003D\u0022data.c.automaneuver_city\u0022 ng\u002Doptions\u003D\u0022t.id as t.name for t in data.towns\u0022\u003E\u003C/select\u003E\u000A        \u003C/div\u003E\u000A      \u003C/div\u003E\u000A\u000A\u000A      \u000A      \u003Cdiv ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D3\u0022 class\u003D\u0022tab_content\u0022\u003E\u000A        Mode \u003Cselect ng:model\u003D\u0022data.c.autotrade\u0022\u003E\u000A          \u003Coption value\u003D\u0022disabled\u0022\u003EDisabled\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022consumer\u0022\u003EConsumer\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022provider\u0022 ng:show\u003D\u0022data.isOwn\u0022\u003EProvider\u003C/option\u003E\u000A        \u003C/select\u003E\u000A\u000A        \u003Cspan ng:show\u003D\u0022data.c.autotrade\u003D\u003D\u0027consumer\u0027\u0022\u003E\u000A          \u003Cspan class\u003D\u0022resource_selector\u0022\u003E\u000A            \u003Cdiv class\u003D\u0022icon wood\u0022\u003E\u003C/div\u003E\u000A            \u003Cinput type\u003D\u0022text\u0022 maxlength\u003D\u00224\u0022 ng:model\u003D\u0022data.c.autotrade_wood\u0022 /\u003E\u000A          \u003C/span\u003E\u000A\u000A          \u003Cspan class\u003D\u0022resource_selector\u0022\u003E\u000A            \u003Cdiv class\u003D\u0022icon stone\u0022\u003E\u003C/div\u003E\u000A            \u003Cinput type\u003D\u0022text\u0022 maxlength\u003D\u00224\u0022 ng:model\u003D\u0022data.c.autotrade_stone\u0022 /\u003E\u000A          \u003C/span\u003E\u000A\u000A          \u003Cspan class\u003D\u0022resource_selector\u0022\u003E\u000A            \u003Cdiv class\u003D\u0022icon iron\u0022\u003E\u003C/div\u003E\u000A            \u003Cinput type\u003D\u0022text\u0022 maxlength\u003D\u00224\u0022 ng:model\u003D\u0022data.c.autotrade_iron\u0022 /\u003E\u000A          \u003C/span\u003E\u000A        \u003C/span\u003E\u000A      \u003C/div\u003E\u000A      \u000A\u000A    \u003C/div\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022footer\u0022\u003E\u000A      \u003Cbutton ng\u002Dclick\u003D\u0022save()\u0022\u003ESave\u003C/button\u003E\u000A    \u003C/div\u003E\u000A\u000A  \u003C/fieldset\u003E\u000A\u000A\u003C/div\u003E\u000A",
								"queue": "\u003Cdiv ng\u002Dapp\u003D\u0022bot\u0022 ng\u002Dcontroller\u003D\u0022QueueController\u0022 class\u003D\u0022queue2\u0022\u003E\u000A\u000A    \u000A    \u003Cdiv class\u003D\u0022caption\u0022\u003E\u000A      \u003Ch2\u003EQueue ({{data.town.name}})\u003C/h2\u003E\u000A    \u003C/div\u003E\u000A    \u000A\u000A    \u003Cdiv class\u003D\u0022items\u0022\u003E\u003Cdiv class\u003D\u0022clearfix\u0022\u003E\u000A      \u003Cdiv ng\u002Drepeat\u003D\u0022q in data.queue|filter:filterQueue()|orderBy:[\u0027\u002Dfixed\u0027, \u0027id\u0027]\u0022 ng\u002Dswitch on\u003D\u0022q.module\u0022\u003E\u000A\u000A\u000A        \u000A        \u003Cdiv ng\u002Dswitch\u002Dwhen\u003D\u0022recruiter\u0022 class\u003D\u0022qitem {{q.module}} unit\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022unit_icon40x40 {{q.item}} qicon\u0022 ng\u002Dclick\u003D\u0022remove(q)\u0022 title\u003D\u0022Remove from queue ({{unitName(q.item)}})\u0022\u003E\u000A            \u003Cdiv class\u003D\u0022power_icon12x12 usePower\u0022 ng\u002Dclass\u003D\u0022q.type\u003D\u003D\u0027barracks\u0027 ? \u0027fertility_improvement\u0027 : \u0027call_of_the_ocean\u0027\u0022 ng\u002Dshow\u003D\u0022q.usePower\u0022 \u003E\u003C/div\u003E\u000A            \u003Cspan class\u003D\u0022unit_order_count_{{q.item}}\u0022\u003E{{q.repeat ? \u0022\u0026infin\u003B\u0022 : \u0022\u0022}}{{q.count}}\u003C/span\u003E\u000A          \u003C/div\u003E\u000A          \u003Cdiv class\u003D\u0022icons\u0022\u003E\u000A            \u003Cspan ng\u002Dshow\u003D\u0022!q.fixed\u0022 class\u003D\u0022auto\u0022 title\u003D\u0022Automatic priority selection\u0022\u003EA\u003C/span\u003E\u000A            \u003Cspan ng\u002Dshow\u003D\u0022q.gold\u003E0\u0022 class\u003D\u0022gold\u0022 title\u003D\u0022Use gold for reduce recruiting time {{q.gold}} time(s)\u0022\u003E{{q.gold}}\u003C/span\u003E\u000A          \u003C/div\u003E\u000A        \u003C/div\u003E\u000A        \u000A\u000A        \u000A        \u003Cdiv ng\u002Dswitch\u002Dwhen\u003D\u0022foreman\u0022 class\u003D\u0022qitem {{q.module}} unit\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022building_icon40x40 {{q.item}} qicon\u0022 ng\u002Dclick\u003D\u0022remove(q)\u0022 title\u003D\u0022Remove from queue ({{data.buildings[q.item].name}})\u0022\u003E\u003C/div\u003E\u000A          \u003Cdiv class\u003D\u0022icons\u0022\u003E\u000A            \u003Cspan ng\u002Dshow\u003D\u0022!q.fixed\u0022 class\u003D\u0022auto\u0022 title\u003D\u0022Automatic priority selection\u0022\u003EA\u003C/span\u003E\u000A            \u003Cspan ng\u002Dshow\u003D\u0022q.gold\u003E0\u0022 class\u003D\u0022gold\u0022 title\u003D\u0022Use gold for reduce building time {{q.gold}} time(s)\u0022\u003E{{q.gold}}\u003C/span\u003E\u000A          \u003C/div\u003E\u000A        \u003C/div\u003E\u000A        \u000A\u000A        \u000A        \u003Cdiv ng\u002Dswitch\u002Dwhen\u003D\u0022trader\u0022 class\u003D\u0022qitem {{q.module}} unit\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022trader qicon\u0022 ng\u002Dclick\u003D\u0022remove(q)\u0022 title\u003D\u0022Remove from queue (to: [town]{{q.to}}[/town], wood: {{q.wood}}, stone: {{q.stone}}, iron: {{q.iron}})\u0022\u003E\u003C/div\u003E\u000A          \u003Cdiv class\u003D\u0022icons\u0022\u003E\u000A            \u003Cspan ng\u002Dshow\u003D\u0022!q.fixed\u0022 class\u003D\u0022auto\u0022 title\u003D\u0022Automatic priority selection\u0022\u003EA\u003C/span\u003E\u000A          \u003C/div\u003E\u000A        \u003C/div\u003E\u000A        \u000A\u000A        \u000A        \u003Cdiv ng\u002Dswitch\u002Dwhen\u003D\u0022docent\u0022 class\u003D\u0022qitem {{q.module}} unit\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022research_icon research40x40 {{q.item}}\u0022 ng\u002Dclick\u003D\u0022remove(q)\u0022 title\u003D\u0022Remove from queue ({{data.researches[q.item].name}})\u0022\u003E\u003C/div\u003E\u000A          \u003Cdiv class\u003D\u0022icons\u0022\u003E\u000A            \u003Cspan ng\u002Dshow\u003D\u0022!q.fixed\u0022 class\u003D\u0022auto\u0022 title\u003D\u0022Automatic priority selection\u0022\u003EA\u003C/span\u003E\u000A            \u003Cspan ng\u002Dshow\u003D\u0022q.gold\u003E0\u0022 class\u003D\u0022gold\u0022 title\u003D\u0022Use gold for reduce researching time {{q.gold}} time(s)\u0022\u003E{{q.gold}}\u003C/span\u003E\u000A          \u003C/div\u003E\u000A        \u003C/div\u003E\u000A        \u000A\u000A\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u003C/div\u003E\u000A\u000A\u000A    \u003Cdiv class\u003D\u0022add\u0022 style\u003D\u0022margin\u002Dtop: 10px\u003B padding: 4px\u003B text\u002Dalign: left\u003B\u0022\u003E\u000A      \u003Cfieldset\u003E\u000A        \u003Clegend\u003EAdd\u003C/legend\u003E\u000A\u000A        \u003Cdiv style\u003D\u0022width: 100px\u003B display: inline\u002Dblock\u003B float: left\u003B\u0022\u003E\u000A          \u003Cinput type\u003D\u0022radio\u0022 ng\u002Dmodel\u003D\u0022data.module\u0022 value\u003D\u0022recruiter\u0022 /\u003ERecruiter\u003Cbr/\u003E\u000A          \u003Cinput type\u003D\u0022radio\u0022 ng\u002Dmodel\u003D\u0022data.module\u0022 value\u003D\u0022foreman\u0022 /\u003EForeman\u003Cbr/\u003E\u000A          \u003Cinput type\u003D\u0022radio\u0022 ng\u002Dmodel\u003D\u0022data.module\u0022 value\u003D\u0022trader\u0022 /\u003ETrader\u003Cbr/\u003E\u000A          \u003Cinput type\u003D\u0022radio\u0022 ng\u002Dmodel\u003D\u0022data.module\u0022 value\u003D\u0022docent\u0022 /\u003EDocent\u003Cbr/\u003E\u000A        \u003C/div\u003E\u000A\u000A        \u000A        \u003Cdiv class\u003D\u0022module\u0022 ng\u002Dshow\u003D\u0022data.module\u003D\u003D\u0027foreman\u0027\u0022\u003E\u000A          \u003Cb\u003EForeman\u003C/b\u003E\u000A\u000A          \u003Cbr/\u003E\u003Cbr/\u003E\u003Cselect ng\u002Dmodel\u003D\u0022data.foreman.item\u0022\u003E\u000A            \u003Coption ng\u002Drepeat\u003D\u0022item in data.buildings\u0022 ng\u002Dvalue\u003D\u0022item.id\u0022\u003E{{item.name}}\u003C/option\u003E\u000A          \u003C/select\u003E\u000A\u000A          \u003Cbr/\u003E\u003Cspan title\u003D\u0022Automatic priority selection\u0022\u003EAuto \u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.foreman.auto\u0022 /\u003E\u003C/span\u003E,\u000A          \u003Cbutton ng\u002Dclick\u003D\u0022addForeman(data.foreman)\u0022 ng\u002Ddisabled\u003D\u0022!data.foreman.item\u0022\u003EAdd\u003C/button\u003E\u000A          \u003C!\u002D\u002Dspan title\u003D\u0022Use gold for reduce building time\u0022\u003EGold \u003Cselect ng\u002Dmodel\u003D\u0022data.foreman.gold\u0022\u003E\u000A            \u003Coption value\u003D\u00220\u0022\u003Eno\u003C/option\u003E\u000A            \u003Coption value\u003D\u00221\u0022\u003Ex1\u003C/option\u003E\u000A            \u003Coption value\u003D\u00222\u0022\u003Ex2\u003C/option\u003E\u000A            \u003Coption value\u003D\u00223\u0022\u003Ex3\u003C/option\u003E\u000A            \u003Coption value\u003D\u00224\u0022\u003Ex4\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225\u0022\u003Ex5\u003C/option\u003E\u000A          \u003C/select\u003E\u003C/span\u002D\u002D\u003E\u000A\u000A        \u003C/div\u003E\u000A        \u000A\u000A        \u000A        \u003Cdiv class\u003D\u0022module\u0022 ng\u002Dshow\u003D\u0022data.module\u003D\u003D\u0027recruiter\u0027\u0022 style\u003D\u0022margin\u002Dleft: 14px\u003B float: left\u003B\u0022\u003E\u000A          \u003Cb\u003ERecruiter\u003C/b\u003E\u000A\u000A          \u003Cbr/\u003E\u003Cbr/\u003E\u003Cinput type\u003D\u0022radio\u0022 ng\u002Dmodel\u003D\u0022data.recruiter.type\u0022 value\u003D\u0022barracks\u0022 ng\u002Dchange\u003D\u0022data.recruiter.item\u003Dnull\u0022\u003E Barracks\u000A          \u003Cinput type\u003D\u0022radio\u0022 ng\u002Dmodel\u003D\u0022data.recruiter.type\u0022 value\u003D\u0022docks\u0022 ng\u002Dchange\u003D\u0022data.recruiter.item\u003Dnull\u0022\u003E Docks\u000A\u000A          \u003Cbr/\u003EUnit \u003Cselect ng\u002Dmodel\u003D\u0022data.recruiter.item\u0022\u003E\u000A            \u003Coption ng\u002Drepeat\u003D\u0022item in data.units|filter:{type: data.recruiter.type}\u0022 ng\u002Dvalue\u003D\u0022item.id\u0022\u003E{{item.name}}\u003C/option\u003E\u000A          \u003C/select\u003E\u000A\u000A          \u003Cbr/\u003EAmount \u003Cinput type\u003D\u0022text\u0022 size\u003D\u00224\u0022 maxlength\u003D\u00224\u0022 style\u003D\u0022width: 40px\u003B\u0022 ng\u002Dmodel\u003D\u0022data.recruiter.count\u0022 /\u003E,\u000A          \u003C!\u002D\u002Dspan title\u003D\u0022Use gold for reduce recruiting time\u0022\u003EGold \u003Cselect ng\u002Dmodel\u003D\u0022data.recruiter.gold\u0022\u003E\u000A            \u003Coption value\u003D\u00220\u0022\u003Eno\u003C/option\u003E\u000A            \u003Coption value\u003D\u00221\u0022\u003Ex1\u003C/option\u003E\u000A            \u003Coption value\u003D\u00222\u0022\u003Ex2\u003C/option\u003E\u000A            \u003Coption value\u003D\u00223\u0022\u003Ex3\u003C/option\u003E\u000A            \u003Coption value\u003D\u00224\u0022\u003Ex4\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225\u0022\u003Ex5\u003C/option\u003E\u000A          \u003C/select\u003E\u003C/span\u002D\u002D\u003E\u000A\u000A          \u003Cbr/\u003E\u003Cspan title\u003D\u0022God power required to start recruiting\u0022\u003EUse/cast power \u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.recruiter.usePower\u0022 /\u003E\u003C/span\u003E,\u000A          \u003Cspan title\u003D\u0022Repeat recruiting after started\u0022\u003ERepeat \u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.recruiter.repeat\u0022 /\u003E\u003C/span\u003E,\u000A          \u003Cspan title\u003D\u0022Automatic priority selection\u0022\u003Eauto \u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.recruiter.auto\u0022/\u003E\u003C/span\u003E\u000A\u000A          \u003Cbr/\u003E\u003Cbutton ng\u002Dclick\u003D\u0022addRecruiter(data.recruiter)\u0022 ng\u002Ddisabled\u003D\u0022!(data.recruiter.item \u0026\u0026 data.recruiter.count \u003E 0 \u0026\u0026 data.recruiter.type)\u0022\u003EAdd\u003C/button\u003E\u000A        \u003C/div\u003E\u000A        \u000A\u000A        \u000A        \u003Cdiv class\u003D\u0022module\u0022 ng\u002Dshow\u003D\u0022data.module\u003D\u003D\u0027trader\u0027\u0022\u003E\u000A          \u003Cb\u003ETrader\u003C/b\u003E\u000A\u000A          \u003Cbr/\u003E\u003Cbr/\u003ETown \u003Cinput type\u003D\u0022text\u0022 ng\u002Dmodel\u003D\u0022data.trader.to\u0022 /\u003E\u000A\u000A          \u003Cbr/\u003Ewood \u003Cinput type\u003D\u0022text\u0022 maxlength\u003D\u00224\u0022 ng\u002Dmodel\u003D\u0022data.trader.wood\u0022 style\u003D\u0022width: 40px\u003B\u0022/\u003E,\u000A          stone \u003Cinput type\u003D\u0022text\u0022 maxlength\u003D\u00224\u0022 ng\u002Dmodel\u003D\u0022data.trader.stone\u0022 style\u003D\u0022width: 40px\u003B\u0022/\u003E,\u000A          silver \u003Cinput type\u003D\u0022text\u0022 maxlength\u003D\u00224\u0022 ng\u002Dmodel\u003D\u0022data.trader.iron\u0022 style\u003D\u0022width: 40px\u003B\u0022/\u003E\u000A\u000A          \u003Cbr/\u003E\u003Cspan title\u003D\u0022Automatic priority selection\u0022\u003EAuto \u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.trader.auto\u0022 /\u003E\u003C/span\u003E\u000A\u000A          \u003Cbr/\u003E\u003Cbutton ng\u002Dclick\u003D\u0022addTrader(data.trader)\u0022 ng\u002Ddisabled\u003D\u0022!(data.trader.to\u003E0)\u0022\u003EAdd\u003C/button\u003E\u000A\u000A        \u003C/div\u003E\u000A        \u000A\u000A        \u000A        \u003Cdiv class\u003D\u0022module\u0022 ng\u002Dshow\u003D\u0022data.module\u003D\u003D\u0027docent\u0027\u0022\u003E\u000A          \u003Cb\u003EDocent\u003C/b\u003E\u000A\u000A          \u003Cbr/\u003E\u003Cbr/\u003EResearch \u003Cselect ng\u002Dmodel\u003D\u0022data.docent.item\u0022\u003E\u000A            \u003Coption ng\u002Drepeat\u003D\u0022item in data.researches\u0022 ng\u002Dvalue\u003D\u0022item.id\u0022\u003E{{item.name}}\u003C/option\u003E\u000A          \u003C/select\u003E\u000A\u000A          \u003Cbr/\u003E\u003Cspan title\u003D\u0022Automatic priority selection\u0022\u003Eauto \u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.docent.auto\u0022/\u003E\u003C/span\u003E,\u000A          \u003C!\u002D\u002Dspan title\u003D\u0022Use gold for reduce recruiting time\u0022\u003Egold \u003Cselect ng\u002Dmodel\u003D\u0022data.docent.gold\u0022\u003E\u000A            \u003Coption value\u003D\u00220\u0022\u003Eno\u003C/option\u003E\u000A            \u003Coption value\u003D\u00221\u0022\u003Ex1\u003C/option\u003E\u000A            \u003Coption value\u003D\u00222\u0022\u003Ex2\u003C/option\u003E\u000A            \u003Coption value\u003D\u00223\u0022\u003Ex3\u003C/option\u003E\u000A            \u003Coption value\u003D\u00224\u0022\u003Ex4\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225\u0022\u003Ex5\u003C/option\u003E\u000A          \u003C/select\u003E\u003C/span\u002D\u002D\u003E\u000A\u000A          \u003Cbr/\u003E\u003Cbutton ng\u002Dclick\u003D\u0022addDocent(data.docent)\u0022 ng\u002Ddisabled\u003D\u0022!data.docent.item\u0022\u003EAdd\u003C/button\u003E\u000A\u000A        \u003C/div\u003E\u000A        \u000A\u000A\u000A\u000A      \u003C/fieldset\u003E\u000A    \u003C/div\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022footer\u0022 style\u003D\u0022margin\u002Dbottom: 5px\u003B margin\u002Dtop: 10px\u003B\u0022\u003E\u000A      \u003Cbutton ng\u002Dclick\u003D\u0022close()\u0022\u003EClose\u003C/button\u003E\u000A    \u003C/div\u003E\u000A\u000A\u000A\u003C/div\u003E",
								"trader": "\u003Cdiv ng\u002Dapp\u003D\u0022bot\u0022 ng\u002Dcontroller\u003D\u0022TraderController\u0022 class\u003D\u0022trader\u0022\u003E\u000A  \u000A\u000A  \u003Cfieldset\u003E\u000A    \u003Clegend\u003ETrader\u003C/legend\u003E\u000A\u000A    \u003Cdiv\u003E\u000A      \u003Cselect ng:model\u003D\u0022data.custom.autotrade\u0022\u003E\u000A        \u003Coption value\u003D\u0022disabled\u0022\u003EDisabled\u003C/option\u003E\u000A        \u003Coption value\u003D\u0022consumer\u0022\u003EConsumer\u003C/option\u003E\u000A        \u003Coption value\u003D\u0022provider\u0022 ng:show\u003D\u0022data.isOwn\u0022\u003EProvider\u003C/option\u003E\u000A      \u003C/select\u003E\u000A\u000A      \u003Cspan ng:show\u003D\u0022data.custom.autotrade\u003D\u003D\u0027consumer\u0027\u0022\u003E\u000A\u000A        \u003Cspan class\u003D\u0022resource_selector\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022icon wood\u0022\u003E\u003C/div\u003E\u000A          \u003Cinput type\u003D\u0022text\u0022 maxlength\u003D\u00224\u0022 ng:model\u003D\u0022data.custom.autotrade_wood\u0022 style\u003D\u0022width: 50px\u003B\u0022 /\u003E\u000A        \u003C/span\u003E\u000A\u000A        \u003Cspan class\u003D\u0022resource_selector\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022icon stone\u0022\u003E\u003C/div\u003E\u000A          \u003Cinput type\u003D\u0022text\u0022 maxlength\u003D\u00224\u0022 ng:model\u003D\u0022data.custom.autotrade_stone\u0022 style\u003D\u0022width: 50px\u003B\u0022 /\u003E\u000A        \u003C/span\u003E\u000A\u000A        \u003Cspan class\u003D\u0022resource_selector\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022icon iron\u0022\u003E\u003C/div\u003E\u000A          \u003Cinput type\u003D\u0022text\u0022 maxlength\u003D\u00224\u0022 ng:model\u003D\u0022data.custom.autotrade_iron\u0022 style\u003D\u0022width: 50px\u003B\u0022 /\u003E\u000A        \u003C/span\u003E\u000A\u000A      \u003C/span\u003E\u000A\u000A      \u003Cbutton ng:click\u003D\u0022save()\u0022\u003ESave\u003C/button\u003E\u000A\u000A    \u003C/div\u003E\u000A\u000A  \u003C/fieldset\u003E\u000A  \u000A\u003C/div\u003E\u000A",
								"herald": "\u003Cdiv class\u003D\u0022herald\u0022 ng:app\u003D\u0022bot\u0022 ng:controller\u003D\u0022heraldController\u0022\u003E\u000A  \u003Cdiv class\u003D\u0022caption\u0022\u003EHerald: Inciming attacks\u003C/div\u003E\u000A\u000A  \u003Cdiv class\u003D\u0022scrollbox\u0022\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022\u003E\u000A      \u003Cdiv\u003E\u000A        \u003Cimg class\u003D\u0022control2\u0022 src\u003D\u0022data:image/png\u003Bbase64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAA30lEQVQ4jb3SsUpDQRAF0BO0sEmhnVj7D0LAVHaphIC9XyHRfxAs/A8lNmIsbAwKgfSKRUBFMLbCEy12isfLJoaAXhh22bv3zs7s8AdYxxH6eMYLBuhgE7foTRO3Mcb3HDGBPXwFeY5trEa0Ucwy2MBHEAcZ8/5vLziJwzPUMgY3FfF19cJTEFu52mZhOdYRHqQO/wsucbWouCGV+5hzLTfqIiOuoRv8cZWsftN9xuAwuLE0sVMNCmmwViKapcyFNFgTmGd837FbFi2V9jt4QwuvWEMdnxjiFPu4y2VfGD8LIFRFMQ+lnQAAAABJRU5ErkJggg\u003D\u003D\u0022 alt\u003D\u0022\u0022 title\u003D\u0022Reload\u0022 ng:click\u003D\u0022refresh()\u0022 /\u003E\u000A        \u003Cb\u003ESorting\u003C/b\u003E:\u000A        \u003Cspan class\u003D\u0022sort\u0022 ng:click\u003D\u0022sort(\u0027time\u0027)\u0022\u003Earrival time\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022sort\u0022 ng:click\u003D\u0022sort(\u0027cs\u0027)\u0022\u003ECS\u003C/span\u003E,\u000A        \u003Cb\u003Eattacks\u003C/b\u003E: \u003Cselect ng:model\u003Ddata.filter\u003E\u000A          \u003Coption value\u003D\u0022all\u0022\u003Eall\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022own\u0022\u003Eown\u003C/option\u003E\u000A          \u003Coption value\u003D\u0022external\u0022\u003Eexternal\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A      \u000A      \u003Cdiv class\u003D\u0022attack\u0022 ng:repeat\u003D\u0022attack in data.attacks|orderBy:data.predicate|filter:filter()\u0022\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022 ng:switch\u003D\u0022attack.isOwn\u0022\u003E\u000A          \u003Cdiv ng\u002Dswitch\u002Dwhen\u003D\u0022true\u0022\u003E\u000A            \u003Cb\u003E{{$index + 1}}\u003C/b\u003E:\u003Cspan class\u003D\u0022remove\u0022 ng:click\u003D\u0022remove(attack.to.id, attack.id)\u0022 title\u003D\u0022Remove\u0022\u003Ex\u003C/span\u003E\u000A            \u003Cspan class\u003D\u0022option {{attack.cs \u0026\u0026 \u0027active\u0027 || \u0027\u0027}}\u0022 ng:click\u003D\u0022switchOption(attack, \u0027cs\u0027)\u0022\u003ECS\u003C/span\u003E\u000A            \u003Cspan class\u003D\u0022option {{attack.militia \u0026\u0026 \u0027active\u0027 || \u0027\u0027}}\u0022 ng:click\u003D\u0022switchOption(attack, \u0027militia\u0027)\u0022\u003Emilitia\u003C/span\u003E\u000A            \u003Cspan ng\u002Dbind\u002Dhtml\u003D\u0022attack.from.link|unsafe\u0022\u003E\u003C/span\u003E attacking your town \u003Cspan ng\u002Dbind\u002Dhtml\u003D\u0022attack.to.link|unsafe\u0022\u003E\u003C/span\u003E,\u000A            arrival time \u003Ci\u003E{{formatTs(attack.time)}}\u003C/i\u003E, \u003Ci\u003E{{attack.status}}\u003C/i\u003E\u000A          \u003C/div\u003E\u000A          \u003Cdiv ng\u002Dswitch\u002Ddefault\u003E\u000A            \u003Cb\u003E{{$index + 1}}\u003C/b\u003E: \u003Cspan class\u003D\u0022bbcodes bbcodes_player\u0022\u003E{{attack.owner}}\u003C/span\u003E, \u003Cspan class\u003D\u0022option {{attack.cs \u0026\u0026 \u0027active\u0027 || \u0027\u0027}}\u0022\u003ECS\u003C/span\u003E\u000A            \u003Cspan class\u003D\u0022option {{attack.militia \u0026\u0026 \u0027active\u0027 || \u0027\u0027}}\u0022\u003Emilitia\u003C/span\u003E\u000A            \u003Cspan ng\u002Dbind\u002Dhtml\u003D\u0022attack.from.link|unsafe\u0022\u003E\u003C/span\u003E attacking town \u003Cspan ng\u002Dbind\u002Dhtml\u003D\u0022attack.to.link|unsafe\u0022\u003E\u003C/span\u003E,\u000A            arrival time \u003Ci\u003E{{formatTs(attack.time)}}\u003C/i\u003E, \u003Ci\u003E{{attack.status}}\u003C/i\u003E\u000A          \u003C/div\u003E\u000A        \u003C/div\u003E\u000A      \u003C/div\u003E\u000A      \u000A    \u003C/div\u003E\u000A  \u003C/div\u003E\u000A\u000A  \u003Cdiv class\u003D\u0022controls\u0022\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng:click\u003D\u0022close()\u0022\u003EClose\u003C/span\u003E\u000A  \u003C/div\u003E\u000A\u000A\u003C/div\u003E\u000A",
								"settings": "\u000A\u000A\u003Cdiv class\u003D\u0022botSettings\u0022 ng\u002Dapp\u003D\u0022bot\u0022 ng\u002Dcontroller\u003D\u0022settingsController\u0022 ng\u002Dinit\u003D\u0022data.activeTab\u003D\u0027farm\u0027\u0022\u003E\u000A  \u003Cdiv class\u003D\u0022controls\u0022\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D\u0027farm\u0027\u0022\u003ECashkeeper\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D2\u0022\u003ECommander\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D\u0027herald\u0027\u0022\u003EHerald\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D4\u0022\u003EAntiCaptcha\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D5\u0022\u003EFilters\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D6\u0022\u003EMerchant\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D7\u0022\u003EWonder\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D10\u0022\u003EForeman\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D11\u0022\u003ERecruiter\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D12\u0022\u003EDocent\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022data.activeTab\u003D8\u0022\u003ESupport\u003C/span\u003E\u000A  \u003C/div\u003E\u000A\u000A  \u003Cdiv class\u003D\u0022scrollbox\u0022\u003E\u000A\u000A    \u003C!\u002D\u002D Cash Keeper \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D\u0027farm\u0027\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Cashkeeper\u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EFarming\u000A        \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_time\u0022\u003E\u000A            \u003Coption value\u003D\u0022300\u0022\u003E5 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u00221200\u0022\u003E20 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225400\u0022\u003E90 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u002214400\u0022\u003E240 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022600\u0022\u003E*10 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u00222400\u0022\u003E*40 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u002210800\u0022\u003E*180 min\u003C/option\u003E\u000A            \u003Coption value\u003D\u002228800\u0022\u003E*480 min\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EProductivity\u000A        \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_productivity\u0022\u003E\u000A            \u003Coption value\u003D\u002210\u0022\u003E10%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002220\u0022\u003E20%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002230\u0022\u003E30%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002240\u0022\u003E40%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002250\u0022\u003E50%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002260\u0022\u003E60%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002270\u0022\u003E70%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002280\u0022\u003E80%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002290\u0022\u003E90%\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022100\u0022\u003E100%\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EPause between villages\u000A        \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_pause\u0022\u003E\u000A            \u003Coption value\u003D\u00222\u0022\u003E2 sec\u003C/option\u003E\u000A            \u003Coption value\u003D\u00223\u0022\u003E3 sec\u003C/option\u003E\u000A            \u003Coption value\u003D\u00224\u0022\u003E4 sec\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225\u0022\u003E5 sec\u003C/option\u003E\u000A            \u003Coption value\u003D\u00226\u0022\u003E6 sec\u003C/option\u003E\u000A            \u003Coption value\u003D\u00227\u0022\u003E7 sec\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EStop farm after\u000A        \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_stopafter\u0022\u003E\u000A            \u003Coption value\u003D\u00223\u0022\u003E3 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00224\u0022\u003E4 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225\u0022\u003E5 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00226\u0022\u003E6 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00227\u0022\u003E7 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00228\u0022\u003E8 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00229\u0022\u003E9 hour\u003C/option\u003E\u000A            \u003Coption value\u003D\u00220\u0022\u003Enever\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EStop farm after warehouse is full:\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_ffarm_wood\u0022 /\u003Ewood\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_ffarm_stone\u0022 /\u003Estone\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_ffarm_iron\u0022 /\u003Esilver coins\u003C/span\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EShow farming messages\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_showmessages\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002DCulture\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_isautofestival\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002DMarket:\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_fmarket_wood\u0022 /\u003Ewood\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_fmarket_stone\u0022 /\u003Estone\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_fmarket_iron\u0022 /\u003Esilver coins\u003C/span\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002DVillage:\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_fvillage_wood\u0022 /\u003Ewood\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_fvillage_stone\u0022 /\u003Estone\u003C/span\u003E,\u000A        \u003Cspan class\u003D\u0022nowrap\u0022\u003E\u003Cinput type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_fvillage_iron\u0022 /\u003Esilver coins\u003C/span\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Auto\u002DCave: \u003Cselect ng\u002Dmodel\u003D\u0022data.s.farm_autocave\u0022 class\u003D\u0022right\u0022\u003E\u000A            \u003Coption value\u003D\u0022disabled\u0022\u003Edisabled\u003C/option\u003E\u000A            \u003Coption value\u003D\u002230\u0022\u003Ewarehouse full 30%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002250\u0022\u003Ewarehouse full 50%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002270\u0022\u003Ewarehouse full 70%\u003C/option\u003E\u000A            \u003Coption value\u003D\u002290\u0022\u003Ewarehouse full 90%\u003C/option\u003E\u000A          \u003C/select\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022 ng\u002Dshow\u003D\u0022data.s.farm_autocave!\u003D\u0027disabled\u0027\u0022\u003E\u000A          Store silver to cave: \u003Cselect ng\u002Dmodel\u003D\u0022data.s.farm_autocave_amount\u0022 class\u003D\u0022right\u0022\u003E\u000A            \u003Coption value\u003D\u002210\u0022\u003E10% warehouse\u003C/option\u003E\u000A            \u003Coption value\u003D\u002230\u0022\u003E30% warehouse\u003C/option\u003E\u000A            \u003Coption value\u003D\u002250\u0022\u003E50% warehouse\u003C/option\u003E\u000A            \u003Coption value\u003D\u002270\u0022\u003E70% warehouse\u003C/option\u003E\u000A            \u003Coption value\u003D\u002290\u0022\u003E90% warehouse\u003C/option\u003E\u000A          \u003C/select\u003E\u000A        \u003C/div\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EUse Forced Loyalty\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_forced_loyalty\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A       \u003Cdiv class\u003D\u0022row\u0022\u003ELaunch Auto\u002DFarm at statup\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.farm_isfarmonstart\u0022 /\u003E\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Cash Keeper \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Herald \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D\u0027herald\u0027\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Herald\u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EMilitia activation\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_militia\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EShow message\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_text\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EIdentifying CS (error included) \u003Cselect ng\u002Dmodel\u003D\u0022data.s.herald_check_cs\u0022 class\u003D\u0022right\u0022\u003E\u000A        \u003Coption value\u003D\u0022disabled\u0022\u003Edisabled\u003C/option\u003E\u000A        \u003Coption value\u003D\u002230\u0022\u003E30%\u003C/option\u003E\u000A        \u003Coption value\u003D\u002240\u0022\u003E40%\u003C/option\u003E\u000A        \u003Coption value\u003D\u002250\u0022\u003E50%\u003C/option\u003E\u000A        \u003Coption value\u003D\u002260\u0022\u003E60%\u003C/option\u003E\u000A        \u003Coption value\u003D\u002270\u0022\u003E70%\u003C/option\u003E\u000A      \u003C/select\u003E\u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A        Enable sound \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sound\u0022 /\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv style\u003D\u0022margin\u002Dleft: 20px\u003B\u0022 ng\u002Dshow\u003D\u0022data.s.herald_sound\u0022\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Melody \u003Cimg src\u003D\u0022///static/img/sound.png\u0022 style\u003D\u0022cursor: pointer\u003B\u0022 ng\u002Dclick\u003D\u0022playSound(data.s.herald_sound_melody)\u0022 /\u003E\u000A          \u003Cselect ng\u002Dmodel\u003D\u0022data.s.herald_sound_melody\u0022 class\u003D\u0022right\u0022\u003E\u000A            \u003Coption value\u003D\u0022attack1.ogg\u0022\u003EFireman\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022attack2.ogg\u0022\u003EAlarm #1\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022attack3.ogg\u0022\u003EAlarm #2\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022attack4.ogg\u0022\u003EAlarm #3\u003C/option\u003E\u000A            \u003Coption value\u003D\u002250c.ogg\u0022\u003E50 Cents\u003C/option\u003E\u000A            \u003Coption value\u003D\u0022cycle.ogg\u0022\u003ECycle\u003C/option\u003E\u000A          \u003C/select\u003E\u000A        \u003C/div\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Incoming mail \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sound_message\u0022 /\u003E\u000A        \u003C/div\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Any report \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sound_report\u0022 /\u003E\u000A        \u003C/div\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          CS found\u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sound_cs\u0022 /\u003E\u000A        \u003C/div\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Attacks on the city \u003Cselect ng\u002Dmodel\u003D\u0022data.s.herald_sound_attacks\u0022 class\u003D\u0022right\u0022\u003E\u000A            \u003Coption value\u003D\u0022disabled\u0022\u003Edisabled\u003C/option\u003E\u000A            \u003Coption value\u003D\u00221\u0022\u003E1 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00222\u0022\u003E2 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00223\u0022\u003E3 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00224\u0022\u003E4 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225\u0022\u003E5 and more\u003C/option\u003E\u000A          \u003C/select\u003E\u000A        \u003C/div\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A        SMS notification \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sms\u0022 /\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv style\u003D\u0022margin\u002Dleft: 20px\u003B\u0022 ng\u002Dshow\u003D\u0022data.s.herald_sms\u0022\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Phone number \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022tel\u0022 placeholder\u003D\u002279207654321\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sms_phone\u0022 /\u003E\u000A        \u003C/div\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          CS found \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_sms_cs\u0022 /\u003E\u000A        \u003C/div\u003E\u000A        \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A          Attacks on the city \u003Cselect ng\u002Dmodel\u003D\u0022data.s.herald_sms_attacks\u0022 class\u003D\u0022right\u0022\u003E\u000A            \u003Coption value\u003D\u0022disabled\u0022\u003Edisabled\u003C/option\u003E\u000A            \u003Coption value\u003D\u00221\u0022\u003E1 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00222\u0022\u003E2 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00223\u0022\u003E3 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00224\u0022\u003E4 and more\u003C/option\u003E\u000A            \u003Coption value\u003D\u00225\u0022\u003E5 and more\u003C/option\u003E\u000A          \u003C/select\u003E\u000A        \u003C/div\u003E\u000A         \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A           \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022smstest(data.s.herald_sms_phone)\u0022\u003ETest\u003C/span\u003E\u000A         \u003C/div\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003ESharing attacks\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_share_attacks\u0022 /\u003E\u000A        \u003Cdiv ng\u002Dshow\u003D\u0022data.s.herald_share_attacks\u0022 style\u003D\u0022margin\u002Dleft: 20px\u003B\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A            Sound notification \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_share_sound\u0022 /\u003E\u000A          \u003C/div\u003E\u000A          \u003Cdiv class\u003D\u0022row\u0022\u0022\u003EBot IDs\u000A            \u003Ctextarea class\u003D\u0022right\u0022 type\u003D\u0022text\u0022 style\u003D\u0022min\u002Dheight: 100px\u003B\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_share_attacks_ids\u0022 /\u003E\u000A          \u003C/div\u003E\u000A        \u003C/div\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003ENotify by Email\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_email\u0022 /\u003E\u000A        \u003Cdiv style\u003D\u0022margin\u002Dleft: 20px\u003B\u0022 ng\u002Dshow\u003D\u0022data.s.herald_email\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A            E\u002Dmail address \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022text\u0022 ng\u002Dmodel\u003D\u0022data.s.herald_emailaddr\u0022 /\u003E\u000A          \u003C/div\u003E\u000A        \u003C/div\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A        Auto\u002DDodge: Accuracy before CS \u003Cselect ng\u002Dmodel\u003D\u0022data.s.herald_automaneuver_accuracy\u0022 class\u003D\u0022right\u0022\u003E\u000A          \u003Coption value\u003D\u00222\u0022\u003E2 sec\u003C/option\u003E\u000A          \u003Coption value\u003D\u00223\u0022\u003E3 sec\u003C/option\u003E\u000A          \u003Coption value\u003D\u00225\u0022\u003E5 sec\u003C/option\u003E\u000A          \u003Coption value\u003D\u00227\u0022\u003E7 sec\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003E\u000A        \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022test()\u0022\u003EGenerate test attacks\u003C/span\u003E\u000A      \u003C/div\u003E\u000A\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Herald \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Commander \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D2\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Commander\u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EDouble checking attack\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.commander_doublecheck\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002Ddeletion of succesful orders\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.commander_autoremove\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EАuto correction before sending troops\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.commander_troops_autocorrect\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EBlock Interface\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.commander_blockui\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EShare orders\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.commander_share_orders\u0022 /\u003E\u000A        \u003Cdiv ng\u002Dshow\u003D\u0022data.s.commander_share_orders\u0022 style\u003D\u0022margin\u002Dleft: 10px\u003B\u0022\u003E\u000A          \u003Cdiv class\u003D\u0022row\u0022\u0022\u003EBot IDs\u000A            \u003Ctextarea class\u003D\u0022right\u0022 type\u003D\u0022text\u0022 style\u003D\u0022min\u002Dheight: 100px\u003B\u0022 ng\u002Dmodel\u003D\u0022data.s.commander_share_orders_ids\u0022 /\u003E\u000A          \u003C/div\u003E\u000A        \u003C/div\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EPause between sending attack\u000A        \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.commander_pause\u0022\u003E\u000A          \u003Coption value\u003D\u00222000\u0022\u003E2 sec\u003C/option\u003E\u000A          \u003Coption value\u003D\u00223000\u0022\u003E3 sec\u003C/option\u003E\u000A          \u003Coption value\u003D\u00224000\u0022\u003E4 sec\u003C/option\u003E\u000A          \u003Coption value\u003D\u00225000\u0022\u003E5 sec\u003C/option\u003E\u000A          \u003Coption value\u003D\u00226000\u0022\u003E6 sec\u003C/option\u003E\u000A      \u003C/select\u003E\u003C/div\u003E\u000A\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Commander \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D AntiCaptcha \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D4\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: AntiCaptcha\u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EEnable captcha recognition\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.captcha_enable\u0022 /\u003E\u000A      \u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EEnable sound\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.captcha_sound\u0022 /\u003E\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D AntiCaptcha \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Filter \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D5\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Filters\u003C/div\u003E\u000A\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EFilter: BLOCK_BOT\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.filter_block_bot\u0022 /\u003E\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Filters \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Trader \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D6\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Trader\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002Dstart \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.trader_autostart\u0022 /\u003E\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAllow warehouse overflow\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.trader_warehouse_overflow\u0022 /\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003ESend resources interval\u000A        \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.trader_refresh_interval\u0022\u003E\u000A          \u003Coption value\u003D\u00221800\u0022\u003E30 minutes\u003C/option\u003E\u000A          \u003Coption value\u003D\u00223600\u0022\u003E1 hour\u003C/option\u003E\u000A          \u003Coption value\u003D\u00225400\u0022\u003E90 minutes\u003C/option\u003E\u000A          \u003Coption value\u003D\u00227200\u0022\u003E2 hours\u003C/option\u003E\u000A          \u003Coption value\u003D\u002210800\u0022\u003E3 hours\u003C/option\u003E\u000A          \u003Coption value\u003D\u002221600\u0022\u003E6 hours\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EFilter\u000A        \u003Cinput type\u003D\u0022text\u0022 ng\u002Dmodel\u003D\u0022data.tradeFilter\u0022 class\u003D\u0022right\u0022 /\u003E\u000A      \u003C/div\u003E\u000A      \u000A      \u003Cdiv class\u003D\u0022autoTradeSettings\u0022\u003E\u000A        \u003Cdiv class\u003D\u0022notes\u0022\u003E\u000A          \u003Cb\u003ED\u003C/b\u003E \u002D disabled, \u003Cb\u003EC\u003C/b\u003E \u002D consumer, \u003Cb\u003EP\u003C/b\u003E \u002D provider\u000A        \u003C/div\u003E\u000A        \u003Ctable\u003E\u000A          \u003Cthead\u003E\u000A            \u003Ctr\u003E\u000A              \u003Ctd\u003E\u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022tradeSelectAll(\u0027disabled\u0027)\u0022 title\u003D\u0022Select all\u0022\u003ED\u003C/span\u003E\u003C/td\u003E\u000A              \u003Ctd\u003E\u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022tradeSelectAll(\u0027consumer\u0027)\u0022 title\u003D\u0022Select all\u0022\u003EC\u003C/span\u003E\u003C/td\u003E\u000A              \u003Ctd\u003E\u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022tradeSelectAll(\u0027provider\u0027)\u0022 title\u003D\u0022Select all\u0022\u003EP\u003C/span\u003E\u003C/td\u003E\u000A              \u003Ctd\u003ECity\u003C/td\u003E\u000A            \u003C/tr\u003E\u000A          \u003C/thead\u003E\u000A          \u003Ctbody\u003E\u000A            \u003Ctr ng\u002Drepeat\u003D\u0022item in data.customs|filter: tradeFilter(data.tradeFilter)|orderBy:\u0027attr.townName\u0027\u0022\u003E\u000A              \u003Ctd\u003E\u003Cinput type\u003D\u0022radio\u0022 ng\u002Dmodel\u003D\u0022item.autotrade\u0022 value\u003D\u0022disabled\u0022/\u003E\u003C/td\u003E\u000A              \u003Ctd\u003E\u003Cinput type\u003D\u0022radio\u0022 ng\u002Dmodel\u003D\u0022item.autotrade\u0022 value\u003D\u0022consumer\u0022/\u003E\u003C/td\u003E\u000A              \u003Ctd\u003E\u003Cinput type\u003D\u0022radio\u0022 ng\u002Dmodel\u003D\u0022item.autotrade\u0022 value\u003D\u0022provider\u0022 ng\u002Dshow\u003D\u0022item.attr.isOwnTown\u0022/\u003E\u003C/td\u003E\u000A              \u003Ctd\u003E\u000A                \u003Cspan ng\u002Dbind\u002Dhtml\u003D\u0022item.attr.townLink|unsafe\u0022\u003E\u003C/span\u003E\u000A                \u003Cdiv ng\u002Dshow\u003D\u0022item.autotrade\u003D\u003D\u0027consumer\u0027\u0022\u003E\u000A                  \u003Cspan class\u003D\u0022nowrap\u0022\u003Ewood: {{item.autotrade_wood}}\u003C/span\u003E,\u000A                  \u003Cspan class\u003D\u0022nowrap\u0022\u003Estone: {{item.autotrade_stone}}\u003C/span\u003E,\u000A                  \u003Cspan class\u003D\u0022nowrap\u0022\u003Esilver: {{item.autotrade_iron}}\u003C/span\u003E\u000A                \u003C/div\u003E\u000A              \u003C/td\u003E\u000A            \u003C/tr\u003E\u000A          \u003C/tbody\u003E\u000A        \u003C/table\u003E\u000A      \u003C/div\u003E\u000A      \u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Trader \u002D\u002D\u003E\u000A\u000A    \u003C!\u002D\u002D Wonder \u002D\u002D\u003E\u000A    \u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D7\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Wonder\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003ESend resources interval\u000A        \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.wonder_interval\u0022\u003E\u000A          \u003Coption value\u003D\u00221800\u0022\u003E30 minutes\u003C/option\u003E\u000A          \u003Coption value\u003D\u00223600\u0022\u003E1 hour\u003C/option\u003E\u000A          \u003Coption value\u003D\u00225400\u0022\u003E90 minutes\u003C/option\u003E\u000A          \u003Coption value\u003D\u00227200\u0022\u003E2 hours\u003C/option\u003E\u000A          \u003Coption value\u003D\u002210800\u0022\u003E3 hours\u003C/option\u003E\u000A        \u003C/select\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EStop farm before sending resources and start after\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.wonder_restart_farm\u0022 /\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EDecrease build time with favor\u000A        \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.wonder_decrease\u0022 /\u003E\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u000A    \u003C!\u002D\u002D Wonder \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Foreman \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D10\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Foreman\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002Dstart \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.foreman_autostart\u0022 /\u003E\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto priority by default \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.foreman_default_auto\u0022 /\u003E\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003ENotify about empty town queue \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.foreman_notify_empty_queue\u0022 /\u003E\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EComplete the construction for free (when available) \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.foreman_instant_buy\u0022 /\u003E\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EUse slots for construction \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.foreman_slots\u0022\u003E\u000A        \u003Coption value\u003D\u00221\u0022\u003E1 slot\u003C/option\u003E\u000A        \u003Coption value\u003D\u00222\u0022\u003E2 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00223\u0022\u003E3 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00224\u0022\u003E4 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00225\u0022\u003E5 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00226\u0022\u003E6 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00227\u0022\u003E7 slots\u003C/option\u003E\u000A      \u003C/select\u003E\u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Foreman \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Recruiter \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D11\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Recruiter\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002Dstart \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.recruiter_autostart\u0022 /\u003E\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EUse slots for recruiting \u003Cselect class\u003D\u0022right\u0022 ng\u002Dmodel\u003D\u0022data.s.recruiter_slots\u0022\u003E\u000A        \u003Coption value\u003D\u00221\u0022\u003E1 slot\u003C/option\u003E\u000A        \u003Coption value\u003D\u00222\u0022\u003E2 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00223\u0022\u003E3 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00224\u0022\u003E4 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00225\u0022\u003E5 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00226\u0022\u003E6 slots\u003C/option\u003E\u000A        \u003Coption value\u003D\u00227\u0022\u003E7 slots\u003C/option\u003E\u000A      \u003C/select\u003E\u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Recruiter \u002D\u002D\u003E\u000A\u000A    \u003C!\u002D\u002D Docent \u002D\u002D\u003E\u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D12\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESettings: Docent\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EAuto\u002Dstart \u003Cinput class\u003D\u0022right\u0022 type\u003D\u0022checkbox\u0022 ng\u002Dmodel\u003D\u0022data.s.docent_autostart\u0022 /\u003E\u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u003C!\u002D\u002D Docent \u002D\u002D\u003E\u000A\u000A\u000A    \u003C!\u002D\u002D Bug report \u002D\u002D\u003E\u000A    \u000A    \u003Cdiv class\u003D\u0022group\u0022 ng\u002Dshow\u003D\u0022data.activeTab\u003D\u003D8\u0022\u003E\u000A      \u003Cdiv class\u003D\u0022caption\u0022\u003ESupport\u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022\u003EPlease describe your problem:\u000A        \u003Ctextarea ng\u002Dmodel\u003D\u0022data.bugReport.description\u0022 rows\u003D\u00226\u0022 style\u003D\u0022width: 97%\u003B\u0022\u003E\u003C/textarea\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022row\u0022 ng\u002Dshow\u003D\u0022data.bugReport.bugs.length \u003E 0\u0022\u003E\u000A        Tickets: \u003Cspan ng\u002Drepeat\u003D\u0022bug in data.bugReport.bugs\u0022\u003E\u003Ca href\u003D\u0022{{bugUrl(bug)}}\u0022 target\u003D\u0022_blank\u0022\u003E{{ {true: \u0022+\u0022, false: \u0022#\u0022}[bug.isClosed]}}{{bug.id}}\u003C/a\u003E{{ {true: \u0022\u0022, false: \u0022, \u0022}[$last]}}\u003C/span\u003E\u000A      \u003C/div\u003E\u000A      \u003Cdiv class\u003D\u0022controls\u0022 ng\u002Dshow\u003D\u0022data.bugReport.description.length \u003E 0\u0022\u003E\u000A        \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022bugReport()\u0022\u003ESubmit\u003C/span\u003E\u000A      \u003C/div\u003E\u000A    \u003C/div\u003E\u000A    \u000A    \u003C!\u002D\u002D Bug report \u002D\u002D\u003E\u000A\u000A  \u003C/div\u003E\u000A\u000A\u000A\u000A  \u000A  \u003Cdiv class\u003D\u0022subscribe\u0022\u003E\u000A    Bot ID \u003Cstrong\u003E{{data.id}}\u003C/strong\u003E, password: \u003Cstrong\u003E{{data.password}}\u003C/strong\u003E, SMS: \u003Cstrong\u003E{{data.sms}}\u003C/strong\u003E\u000A    \u003Cdiv ng\u002Dshow\u003D\u0022data.premium\u0022\u003EPremium expired: \u003Ci\u003E{{data.premium}}\u003C/i\u003E\u003C/div\u003E\u000A\u000A    \u003Cdiv class\u003D\u0022options\u0022 ng\u002Dshow\u003D\u0022data.options.length \u003E 0\u0022\u003E\u000A      \u003Cstrong\u003EOptions:\u003C/strong\u003E \u003Cdiv ng\u002Drepeat\u003D\u0022item in data.options\u0022\u003E{{item.name}} \u003Ci\u003E{{item.valid}}\u003C/i\u003E\u003C/div\u003E\u000A    \u003C/div\u003E\u000A\u000A    \u003Cdiv\u003E\u003Ca href\u003D\u0022{{data.purchaseUrl}}\u0022 target\u003D\u0022_blank\u0022\u003E\u003Cstrong\u003EPurchase\u003C/strong\u003E\u003C/a\u003E\u003C/div\u003E\u000A  \u003C/div\u003E\u000A  \u000A\u000A  \u003Cdiv class\u003D\u0022controls\u0022 style\u003D\u0022margin\u002Dbottom: 10px\u003B\u0022\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022close()\u0022\u003EClose\u003C/span\u003E\u000A    \u003Cspan class\u003D\u0022control\u0022 ng\u002Dclick\u003D\u0022save()\u0022\u003ESave\u003C/span\u003E\u000A  \u003C/div\u003E\u000A\u000A\u003C/div\u003E\u000A\u000A\u000A\u000A\u000A"
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
                    if (c.data.isOwn) a.ajaxRequestGet("town_info", "info", {
                        id: d.town.id,
                        town_id: d.town.id
                    }, function(b, e) {
                        var f = /[\s\S]*"gp_island_link">[^\d]+(\d+)</.exec(e.html),
                            g = parseInt(f[1], 10);
                        a.ajaxRequestGet("island_info", "index", {
                            island_id: g,
                            town_id: d.town.id
                        }, function(a, b) {
                            var e = b.json.town_list;
                            c.$apply(function() {
                                c.data.towns = [{
                                    id: "random",
                                    name: "*** Random ***"
                                }];
                                for (var a = 0; a < e.length; a++)
                                    if (e[a].id.toString() !== d.town.id.toString()) c.data.towns.push({
                                        id: e[a].id.toString(),
                                        name: e[a].name
                                    });
                            });
                        }, "na");
                    }, "na");
                    c.data.activeTab = c.data.isOwn ? 1 : 3;
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
            maneuversTimer: null,
            controlTimer: null,
            exportTimer: null,
            importTimer: null,
            exportData: [],
            importData: [],
            smsAttack: function(b, c) {
                if (a.sett.herald_sms != true) return;
                a.sms.send(b, {
                    attacks: c
                });
            },
            sound: function(b) {
                if (a.sett.herald_sound === true) a.playSound(b);
            },
            militia: function(b, d) {
                var e = ITowns.getTown(b);
                if (d.militia === false) return;
                if (e.hasConqueror()) return;
                a.ajaxRequestGet("building_farm", "index", {
                    town_id: b
                }, function(d, f, g) {
                    var h = $(f.html),
                        i = h.find("#request_militia_button");
                    if (i.length == 0 || i.css("display") == "none") {
                        c("debug", "Militia alredy enlisted in [town]{0}[/town]", e.id);
                        return;
                    }
                    if (e.hasConqueror()) return;
                    a.ajaxRequestPost("building_farm", "request_militia", {
                        town_id: b
                    }, function(d, e, f) {
                        c("warning", "Enlist militia in [town]{0}[/town]", b).msg(0);
                        a.herald.town[b].lastMilitia = Timestamp.now();
                    }, "na");
                }, "na");
            },
            email: function(b, d) {
                if (a.sett.herald_email) {
                    c("debug", "Send email, subject: '{0}', text: '{1}'", b, d);
                    a.request("herald:email", {
                        subject: b,
                        text: d
                    });
                }
            },
            findAttacks: function(b, d) {
                d = d || false;
                if (!b) b = ITowns.getTowns();
                for (var e in b)(function(b) {
                    if (!a.herald.town[b.id]) a.herald.town[b.id] = {
                        attack: {},
                        maneuverEnd: 0
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
                                m.militia = a.sett.herald_militia;
                                if (!m.from.id) continue;
                                var n = function(b) {
                                    if (a.sett.herald_text) c("warning", "[town]{0}[/town] attack your town [town]{1}[/town], arrival at: {2}", b.from.id, b.to.id, a.timestampToLocalString(b.time)).msg(0);
                                    if (parseInt(a.sett.herald_sms_attacks, 10) == 1) a.herald.smsAttack(a.str.format("[town]{0}[/town] attack your town {1}, {2}", b.from.id, b.to.name, a.timestampToLocalString(b.time)), [b.id]);
                                };
                                if (a.sett.herald_check_cs !== "disabled")(function(d, e, f) {
                                    a.ajaxRequestGet("town_info", "support", {
                                        id: d.id,
                                        town_id: b.id
                                    }, function(d, g) {
                                        var h = g.json.units.colonize_ship.duration,
                                            i = parseInt(a.sett.herald_check_cs, 10) / 100,
                                            j = Math.abs(1.0 - 1.0 * h / e.arrival_eta);
                                        if (j < i) {
                                            a.herald.town[b.id].attack[e.id].cs = true;
                                            c("warning", "<span style='color: red;'>*** CS INCOMING ***</span>. {0} attack [town]{1}[/town], arrival at: {2}, deviation: {3}%", e.town.link, b.id, e.arrived_human, (j * 100).toFixed(2)).msg(0);
                                            a.herald.email("Your town under attack, CS!", a.str.format("*** CS INCOMING ***, {0}([town]{1}[/town]) attack your town {2}([town]{3}[/town]), arrival: {4}", f.from.name, f.from.id, f.to.name, f.to.id, a.timestampToLocalString(f.time)));
                                            if (a.sett.herald_sound_cs === true) a.herald.sound(a.sett.herald_sound_melody);
                                            if (a.sett.herald_sms_cs === true) a.herald.smsAttack(a.str.format("*CS*, [town]{0}[/town] attack you town {1}, {2}", f.from.id, f.to.name, a.timestampToLocalString(f.time), [e.id]));
                                        } else n(f);
                                    }, "commander");
                                }(l, j, m));
                                else n(m);
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
                this.maneuversTimer = setInterval(this.checkManeuvers, 1 * 60 * 1E3);
                this.controlTimer = setInterval(this.checkControl, 5 * 1E3);
            },
            stop: function() {
                if (this.controlTimer) {
                    clearInterval(this.controlTimer);
                    this.controlTimer = null;
                }
                if (this.maneuversTimer) {
                    clearInterval(this.maneuversTimer);
                    this.maneuversTimer = null;
                }
                c("info", "Stopped");
                this.active = false;
            },
            showAttacks: function() {
                var b = this;
                if (this.showAttacksEl) {
                    this.showAttacksEl.remove();
                    this.showAttacksEl = null;
                    return;
                }
                var c = a.templates.herald,
                    d = $(c);
                d.draggable({
                    cancel: ".scrollbox"
                });
                a.ngApp.controller("heraldController", ["$scope", function(c) {
                    c.data = {
                        predicate: "time",
                        filter: a.sett.herald_share_attacks ? "all" : "own"
                    };
                    c.close = function() {
                        b.showAttacks();
                    };
                    c.formatTs = function(b) {
                        return a.timestampToLocalString(b);
                    };
                    c.sort = function(a) {
                        var b = "-" + a,
                            d;
                        switch (c.data.predicate) {
                            case a:
                                d = b;
                                break;
                            case b:
                                d = a;
                                break;
                            default:
                                d = a;
                        };
                        c.data.predicate = d;
                    };
                    c.switchOption = function(a, b) {
                        a[b] = !a[b];
                    };
                    c.refresh = function() {
                        var d = [];
                        for (var e in b.town) {
                            var f = ITowns.getTown(e);
                            for (var g in b.town[e].attack) {
                                var h = b.town[e].attack[g];
                                h.isOwn = true;
                                d.push(h);
                            }
                        }
                        c.data.attacks = d;
                        a.herald.poll(null, function() {
                            c.$apply(function() {
                                angular.forEach(b.importData, function(a) {
                                    c.data.attacks.push(a);
                                });
                            });
                        });
                    };
                    c.remove = function(b, d) {
                        if (a.herald.town[b].attack[d]) {
                            a.herald.town[b].attack[d].militia = false;
                            delete a.herald.town[b].attack[d];
                        }
                        c.refresh();
                    };
                    c.filter = function() {
                        return function(a) {
                            switch (c.data.filter) {
                                case "own":
                                    return a.isOwn == true;
                                case "external":
                                    return a.isOwn == false;
                                default:
                                    return true;
                            }
                        };
                    };
                    c.refresh();
                }]);
                angular.bootstrap(d, ["bot"]);
                $("body").append(d);
                this.showAttacksEl = d;
            },
            checkControl: function() {
                var b = 0,
                    c = Timestamp.server();
                for (var d in a.herald.town)
                    if (a.herald.town.hasOwnProperty(d)) {
                        var e = a.herald.town[d].attack;
                        for (var f in e)
                            if (e.hasOwnProperty(f) && e[f].time > c) {
                                b++;
                                break;
                            }
                        if (b > 0) break;
                    }
                for (var g = 0; a.sett.herald_share_attacks === true && g < a.herald.importData.length && b == 0; g++)
                    if (a.herald.importData[g].time > c) b++;
                if (b > 0) a.herald.control.css("opacity", "1.0");
                else a.herald.control.css("opacity", "0.3");
            },
            checkManeuvers: function() {
                var b = 3;
                for (townId in a.herald.town) {
                    var d = [],
                        e = a.custom.get(townId),
                        f = ITowns.getTown(townId),
                        g = Timestamp.server();
                    if (e.automaneuver === "before cs") b = parseInt(a.sett.herald_automaneuver_accuracy, 10);
                    for (attackId in a.herald.town[townId].attack) {
                        var h = a.herald.town[townId].attack[attackId];
                        if (h.time < g) delete a.herald.town[townId].attack[attackId];
                        else if (h.time - g < 10 * 60 && h.status === "waiting") {
                            (function(b, c) {
                                if (!a.herald.militiaItem[c.id]) a.herald.militiaItem[c.id] = setTimeout(function() {
                                    a.herald.militia(b, c);
                                }, (c.time - Timestamp.server() - 5) * 1E3);
                            }(townId, h));
                            if (e && e.automaneuver !== "disabled") d.push(h);
                            else c("info", "Auto-dodge disabled for [town]{0}[/town]'", f.id).msg();
                        }
                    }
                    if (d.length > 0) {
                        d = d.sort(function(a, b) {
                            return a.time - b.time;
                        });
                        var i = Math.max(d[0].time, a.herald.town[townId].maneuverEnd),
                            j = i;
                        if (e.automaneuver === "before cs") {
                            var k = [],
                                l = 0,
                                m = false;
                            while (l < d.length && d[l].cs) {
                                d[l].status = "ignore";
                                i = d[l].time;
                                j = i;
                                m = true;
                                l++;
                            }
                            for (var n = l; n < d.length; n++) k.push(d[n]);
                            d = k;
                        }
                        if (d.length === 0) return;
                        g = Timestamp.server();
                        var o = [];
                        o.push(d[0]);
                        if (i - g < 2 * 60) {
                            for (var p = 1; p < d.length; p++)
                                if (d[p].time - i < 5 * 60) {
                                    j = d[p].time;
                                    o.push(d[p]);
                                    if (d[p].cs) break;
                                } else if (d[p].time - i < 7 * 60)
                                if (d[p].cs) {
                                    j = d[p].time;
                                    o.push(d[p]);
                                    break;
                                } else if (d[p].time - d[p - 1].time > 40) break;
                            else {
                                j = d[p].time;
                                o.push(d[p]);
                            } else break;
                            var q = Math.round(Math.random() * 10 + 25),
                                r = (m && e.automaneuver === "before cs") ? i + 1 : i - q,
                                s = j - r,
                                t = o[o.length - 1].cs ? true : false;
                            if (e.automaneuver === "before cs" && t) s -= b;
                            else s += b;
                            c("warning", "Maneuver for [town]{0}[/town], start: {1}, duration: {2}sec, attacks range: {3} - {4}", f.id, a.timestampToLocalString(r), s, a.timestampToLocalString(i), a.timestampToLocalString(j)).msg(0);
                            for (var p = 0; p < o.length; p++) a.herald.town[townId].attack[o[p].id].status = "scheduled";
                            a.herald.town[townId].maneuverEnd = r + s + q + b;
                            if (e.automaneuver === "before cs" && t) a.herald.town[townId].maneuverEnd += 5;
                            (function(b, c, d) {
                                setTimeout(function() {
                                    a.herald.maneuver(b, c, d);
                                }, (c - Timestamp.server()) * 1E3);
                            }(townId, r, s));
                            a.herald.dodge[a.herald.dodgeId] = {
                                start: i,
                                end: a.herald.town[townId].maneuverEnd
                            };
                            a.herald.dodgeId++;
                        }
                    }
                }
            },
            maneuver: function(d, e, f) {
                var g = ITowns.getTown(d),
                    h = a.custom.get(g.id),
                    i = null,
                    j = null;
                c("info", "Start auto-dodge for [town]{0}[/town]", g.id);
                if (g.hasConqueror()) {
                    c("debug", "Auto-dodge canceled, [town]{0}[/town] under siege", g.id);
                    return;
                }
                var k = ITowns.getTowns(),
                    l = null;
                for (var m in k)
                    if (k[m].id != g.id) {
                        var n = Math.pow(g.getIslandCoordinateX() - k[m].getIslandCoordinateX(), 2) + Math.pow(g.getIslandCoordinateY() - k[m].getIslandCoordinateY(), 2);
                        if (n < l || !l) {
                            l = n;
                            i = {
                                id: k[m].id,
                                name: k[m].name
                            };
                        }
                    }
                var o = function(b, d) {
                    if (!b) return;
                    var h = function(h) {
                        var i = {
                            data: {
                                units: h.json.units
                            },
                            type: d,
                            town: {
                                id: g.id,
                                name: g.name
                            },
                            target: {
                                id: b.id,
                                name: b.name
                            }
                        };
                        a.request("herald:plan", i, function(g) {
                            if (!g.result.order) return;
                            var h = g.result.order,
                                i = [],
                                j = 0;
                            h.time = Timestamp.server();
                            angular.forEach(h.units, function(a, b) {
                                i.push(GameData.units[b].name + ": " + a.count);
                                j += a.count;
                            });
                            if (j == 0) return;
                            i = i.join(", ");
                            var k = new a.commander.Command(h);
                            if (b.type == "village") k.targetType = "village";
                            var l = Timestamp.server(),
                                m = Math.round(Math.random() * 3 + 10);
                            k.time = Timestamp.server() + m;
                            k.maneuver = f - (l - e) - m;
                            setTimeout(function() {
                                a.commander.start(k);
                            }, m * 1E3);
                            c("info", "Auto-dodge ({0}), {1}, start at {2}, units: {3}", d, k.text(), a.timestampToLocalString(k.time), i).msg(0).send();
                        });
                    };
                    if (b.type === "village") a.ajaxRequestGet("farm_town_info", "attack", {
                        id: b.id,
                        town_id: g.id
                    }, function(a, b, c) {
                        h(b);
                    }, "commander");
                    else a.ajaxRequestGet("town_info", "support", {
                        id: b.id,
                        town_id: g.id
                    }, function(a, b, c) {
                        h(b);
                    }, "commander");
                };
                var p = function(a, b) {
                    o(b, "naval");
                    setTimeout(function() {
                        o(a, "land");
                    }, (Math.random() + 5) * 1E3);
                };
                a.ajaxRequestGet("town_info", "info", {
                    id: g.id,
                    town_id: g.id
                }, function(d, e, f) {
                    var j = /[\s\S]*"gp_island_link">[^\d]+(\d+)</.exec(e.html);
                    g.island = parseInt(j[1], 10);
                    a.ajaxRequestGet("island_info", "index", {
                        island_id: g.island,
                        town_id: g.id
                    }, function(a, d, e) {
                        var f = d.json.town_list,
                            j = null,
                            k = null,
                            l = 0,
                            m = 0,
                            n = null;
                        for (var o = 0; o < f.length; o++)
                            if (f[o].id == h.automaneuver_city) {
                                j = f[o];
                                break;
                            }
                        for (var o = 0; o < f.length && !j; o++)
                            if (f[o].id != g.id) {
                                j = f[o];
                                break;
                            }
                        for (var o = 0; o < d.json.farm_town_list.length; o++)
                            if (d.json.farm_town_list[o].rel !== 1) k = d.json.farm_town_list[o];
                            else l++;;
                        m = b[l];
                        n = k ? {
                            id: k.id,
                            name: k.name,
                            type: "village"
                        } : j;
                        n = j;
                        i = i ? i : j;
                        if (n && (n.type === "village" || true)) {
                            var q = GameData.units,
                                r = 0;
                            angular.forEach(g.units(), function(a, b) {
                                if (a > 0 && q[b] && q[b].population > 0) r += a * q[b].population;
                            });
                            angular.forEach(g.unitsOuter(), function(a, b) {
                                if (a > 0 && q[b] && q[b].population > 0) r += a * q[b].population;
                            });
                            angular.forEach(g.unitsSupport(), function(a, b) {
                                if (a > 0 && q[b] && q[b].population > 0) r += a * q[b].population;
                            });
                            if (r < m) {
                                c("debug", "Not enough units in [town]{0}[/town] to attack village ({1}/{2}). Fallback to town [town]{3}[/town]", g.id, r, m, j.id);
                                n = j;
                            }
                        }
                        p(n, i);
                    }, "na");
                }, "na");
            },
            share: function() {
                if (a.sett.herald_share_attacks != true) return;
                var b = [];
                angular.forEach(a.herald.town, function(a, c) {
                    angular.forEach(a.attack, function(a) {
                        b.push({
                            id: a.id,
                            time: a.time,
                            from: a.from,
                            to: a.to,
                            militia: a.militia ? true : false,
                            cs: a.cs ? true : false,
                            status: a.status
                        });
                    });
                });
                b = b.sort(function(a, b) {
                    return a.time - b.time;
                });
                var c = JSON.stringify(b);
                if (c != JSON.stringify(a.herald.exportData)) a.request("herald:share", c, function(c) {
                    a.herald.exportData = b;
                });
            },
            poll: function(b, d) {
                if (a.sett.herald_share_attacks != true) return;
                a.request("herald:poll", {}, function(b) {
                    var e = [],
                        f = Timestamp.server(),
                        g = false;
                    angular.forEach(b.result, function(b) {
                        var c = JSON.parse(b.attacks);
                        angular.forEach(c, function(c) {
                            if (c.time > f) {
                                c.owner = b.player;
                                c.isOwn = false;
                                e.push(c);
                                if (!g) {
                                    var d = false;
                                    for (var h = 0; !d && h < a.herald.importData.length; h++)
                                        if (c.id == a.herald.importData[h].id) d = true;
                                    g = !d;
                                }
                            }
                        });
                    });
                    a.herald.importData = e;
                    if (g > 0) {
                        c("warning", "Your friends under attack!").msg(0);
                        if (a.sett.herald_share_sound == true) a.herald.sound(a.sett.herald_sound_melody);
                    }
                    if (typeof d == "function") d();
                });
            },
            test: function(b) {
                var d = Timestamp.server(),
                    e = [],
                    b = b || Game.townId,
                    f = ITowns.getTown(b);
                if (!a.herald.town[b]) a.herald.town[b] = {
                    attack: {},
                    maneuverEnd: 0
                };
                c("debug", "Build test attacks for [town]{0}[/town]", b);
                for (var g = 0; g < 5; g++) {
                    a.herald.town[b].attack[g] = {
                        id: g,
                        time: d + 60 + Math.round(Math.random() * 60),
                        status: "waiting",
                        militia: a.sett.herald_militia,
                        from: {
                            id: f.id,
                            link: a.townLink(f.id)
                        },
                        to: {
                            id: f.id,
                            link: a.townLink(f.id)
                        }
                    };
                    e.push(a.herald.town[b].attack[g]);
                }
                a.herald.town[b].attack[1000] = {
                    id: 1000,
                    cs: true,
                    time: d + 125,
                    status: "waiting",
                    militia: a.sett.herald_militia,
                    from: {
                        id: f.id,
                        name: f.name,
                        link: a.townLink(f.id)
                    },
                    to: {
                        id: f.id,
                        name: f.name,
                        link: a.townLink(f.id)
                    }
                };
                e.push(a.herald.town[b].attack[1000]);
                e = e.sort(function(a, b) {
                    return a.time - b.time;
                });
                for (var g = 0; g < e.length; g++)
                    if (e[g].cs) c("debug", "Test attacks: {0} CS", a.timestampToLocalString(e[g].time));
                    else c("debug", "Test attack: {0}", a.timestampToLocalString(e[g].time));
                this.checkManeuvers();
            }
        };
        a.filters.add("BLOCK_ON_AUTODODGE", function(b, c, d, e, f, g) {
            if (g === "commander" || g === "na") return true;
            var h = Timestamp.server();
            for (var i in a.herald.dodge) {
                var j = a.herald.dodge[i].start - 60,
                    k = a.herald.dodge[i].end + 10;
                if (h >= j && h <= k) return false;
                else if (h > k) delete a.herald.dodge[i];
            }
            return true;
        });
        a.herald.control = $('<img src="//botsoft.org/static/img/swords.png" class="control" style="opacity: 0.3;"/>');
        a.controls.herald = a.herald.control;
        a.controls.base.before(a.herald.control);
        a.herald.control.click(function() {
            a.herald.showAttacks();
        });
        a.herald.exportTimer = setInterval(a.herald.share, 1 * 60 * 1E3);
        a.herald.importTimer = setInterval(function() {
            if (a.websocket && a.websocket.isOpen()) return;
            a.herald.poll();
        }, 10 * 60 * 1E3);
        if (a.websocket) a.websocket.METHODS["herald:poll"] = a.herald.poll;
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
        var a = b232d0a22;
        a.wonder = {
            control: $('<span class="control round16" title="Wonder">W</span>'),
            timers: {},
            timer: null,
            active: false,
            start: function() {
                var b = this;
                if (this.active) return;
                a.logger.info("Wonder-Bot: Started").msg();
                this.control.addClass("active");
                this.active = true;
                this.run();
            },
            stop: function() {
                for (var b in this.timers)
                    if (this.timers[b]) {
                        clearTimeout(this.timers[b].id);
                        delete this.timers[b];
                    }
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
                a.scheduleClean("wonder");
                a.logger.info("Wonder-Bot: Stopped").msg();
                this.active = false;
                this.control.removeClass("active");
            },
            run: function() {
                var b = ITowns.getTowns(),
                    c = a.wonder,
                    d = a.sett.wonder_x,
                    e = a.sett.wonder_y;
                if (!(d > 0 && e > 0)) {
                    a.logger.error("Wonder-Bot: Wonder not selected!").msg();
                    c.stop();
                    return;
                }
                if (a.sett.wonder_restart_farm === true) {
                    if (a.farm.active) {
                        a.farm.stop();
                        setTimeout(function() {
                            a.farm.start();
                        }, 10 * 1E3);
                    };
                }
                a.logger.debug("Wonder-Bot: New cycle");
                a.scheduleClean("wonder");
                for (var f in b)(function(f) {
                    var g = a.schedule(new Date().getTime(), Math.round(Math.random() * 3000) + 6000, "wonder"),
                        h = g - new Date().getTime();
                    var i = setTimeout(function() {
                        var c = {
                            town_id: f,
                            island_x: d,
                            island_y: e
                        };
                        a.ajaxRequestGet("wonders", "index", c, function(c, g, h) {
                            var g = g.data;
                            if (a.sett.wonder_decrease == true && g.stage_completed_at > Timestamp.server()) {
                                var i = ITowns.getTown(Game.townId).allGodsFavors(),
                                    j = true;
                                for (var k in i)
                                    if (i[k].current < 400) {
                                        j = false;
                                        break;
                                    }
                                if (j) {
                                    a.logger.info("Wonder-Bot: Decrease build time with favor").msg();
                                    a.ajaxRequestPost("wonders", "decrease_build_time_with_favor", {
                                        town_id: f,
                                        island_x: d,
                                        island_y: e
                                    }, function(a, b, c) {
                                        var d = ITowns.getTown(Game.townId).allGodsFavors();
                                        for (var e in d) d[e].current -= 400;
                                        ITowns.getTown(Game.townId).allGodsFavors(d);
                                    });
                                }
                            }
                            if (g.max_trade_capacity < 5000) return;
                            var l = {
                                    wood: Math.max(g.needed_resources.wood - g.sum_ressources_on_the_way.wood - g.wonder_res.wood, 0),
                                    stone: Math.max(g.needed_resources.stone - g.sum_ressources_on_the_way.stone - g.wonder_res.stone, 0),
                                    iron: Math.max(g.needed_resources.iron - g.sum_ressources_on_the_way.iron - g.wonder_res.iron, 0)
                                },
                                m = {
                                    wood: g.curr_town_resources.wood,
                                    stone: g.curr_town_resources.stone,
                                    iron: g.curr_town_resources.iron
                                },
                                n = g.free_trade_capacity,
                                o = l.wood + l.stone + l.iron,
                                p = {
                                    wood: Math.min(Math.floor(l.wood * n / o), m.wood),
                                    stone: Math.min(Math.floor(l.stone * n / o), m.stone),
                                    iron: Math.min(Math.floor(l.iron * n / o), m.iron)
                                };
                            if (o < 1 && g.stage_started_at == 0) var l = {
                                    wood: Math.max(4 * g.needed_resources.wood - g.wonder_res.wood, 0),
                                    stone: Math.max(4 * g.needed_resources.stone - g.wonder_res.stone, 0),
                                    iron: Math.max(4 * g.needed_resources.iron - g.wonder_res.iron, 0)
                                },
                                o = l.wood + l.stone + l.iron,
                                p = {
                                    wood: Math.min(Math.floor(l.wood * n / o), m.wood),
                                    stone: Math.min(Math.floor(l.stone * n / o), m.stone),
                                    iron: Math.min(Math.floor(l.iron * n / o), m.iron)
                                };
                            m = {
                                wood: m.wood - p.wood,
                                stone: m.stone - p.stone,
                                iron: m.iron - p.iron
                            };
                            n -= (p.wood + p.stone + p.iron);
                            var q = n;
                            while (n >= 100) {
                                if (m.wood >= 100 && n >= 100) {
                                    m.wood -= 100;
                                    p.wood += 100;
                                    n -= 100;
                                }
                                if (m.stone >= 100 && n >= 100) {
                                    m.stone -= 100;
                                    p.stone += 100;
                                    n -= 100;
                                }
                                if (m.iron >= 100 && n >= 100) {
                                    m.iron -= 100;
                                    p.iron += 100;
                                    n -= 100;
                                }
                                if (n === q) break;
                                q = n;
                            }
                            a.logger.debug("Wonder-Bot: try send from {0} to {1}x{2} (wood: {3}, stone: {4}, iron: {5}, {6})", b[f].name, d, e, p.wood, p.stone, p.iron, g.stage_completed_at);
                            if (p.wood + p.stone + p.iron >= 1000 && (g.stage_completed_at == null || g.stage_completed_at < g.stage_started_at)) {
                                var r = {
                                    wood: p.wood,
                                    stone: p.stone,
                                    iron: p.iron,
                                    island_x: d,
                                    island_y: e,
                                    town_id: f
                                };
                                a.ajaxRequestPost("wonders", "send_resources", r, function(c, g, h) {
                                    a.logger.info("Wonder-Bot: send resources from {5} to {0}x{1} (wood: {2}, stone: {3}, iron: {4})", d, e, p.wood, p.stone, p.iron, b[f].name).msg();
                                }, "wonder");
                            }
                        }, "wonder");
                    }, h);
                    c.timers[f] = {
                        id: i,
                        time: g
                    };
                }(f));
                var g = parseInt(a.sett.wonder_interval, 10),
                    h = Math.random() * g / 15;
                c.timer = setTimeout(c.run, (g + h) * 1E3);
            }
        };
        a.controls.wonder = a.wonder.control;
        a.panel.append(a.wonder.control);
        a.wonder.control.click(function() {
            if (a.wonder.active) a.wonder.stop();
            else a.wonder.start();
        });
        var b = GPWindowMgr.getTypeInfo(GPWindowMgr.TYPE_WONDERS).handler;
        if (!b.prototype.onRcvData_orig) {
            b.prototype.onRcvData_orig = b.prototype.onRcvData;
            b.prototype.onRcvData = function(b, c, d) {
                var e = this;
                this.onRcvData_orig(b, c, d);
                if (d == "index" && b.data.created_at) {
                    var f = this.wnd.getJQElement(),
                        g = $('\u003Chr/\u003E\u003Ccenter\u003E\u003Cdiv class\u003D\u0022button_new\u0022\u003E\u003Cdiv class\u003D\u0022left\u0022\u003E\u003C/div\u003E\u003Cdiv class\u003D\u0022right\u0022\u003E\u003C/div\u003E\u003Cdiv class\u003D\u0022caption js\u002Dcaption\u0022\u003ESelect\u003C/div\u003E\u003C/div\u003E\u003C/center\u003E');
                    f.find("div.wonder_header").append(g);
                    g.click(function() {
                        a.request("wonder:select", {
                            x: e.island_x,
                            y: e.island_y
                        }, function(b) {
                            a.sett.wonder_x = e.island_x;
                            a.sett.wonder_y = e.island_y;
                            a.logger.info("Wonder-Bot: Wonder selected (x={0}, y={1})", e.island_x, e.island_y).msg();
                        });
                    });
                }
            };
        }
        a.filters.add("BLOCK_ON_WONDER", function(b, c, d, e, f, g) {
            if (g === "wonder" || g === "commander") return true;
            var h = new Date().getTime() / 1000;
            for (t in a.wonder.timers) {
                if (a.sett.wonder_restart_farm === true) return true;
                var i = a.wonder.timers[t].time / 1000;
                var j = i - h;
                if (j < 15 && j > -120) return false;
            }
            return true;
        });
        a.logger.info("Wonder-Bot: Loaded").msg();
    }());
    (function() {
        var a = b232d0a22,
            b = a.moduleLogger("Commander");
        var c = function(b, c, d, e) {
            a.ajaxRequestPost(b, c, d, e, "commander");
        };
        var d = function(b, c, d, e) {
            a.ajaxRequestGet(b, c, d, e, "commander");
        };
        a.commander = {
            blockUITimer: null,
            commands: {},
            nearest: {},
            control: $('<span class="control round16" title="Commander: View orders">Ci</span>'),
            lastTime: {
                day: 0,
                hour: "",
                minute: "",
                second: "",
                accuracy: 0
            },
            Command: function(e) {
                if (typeof e === "object")
                    for (var f in e) this[f] = e[f];
                this.corrected = false;
                this.toString = function() {
                    var b = a.townLink(this.town);
                    b += " -" + this.action;
                    b += (this.strategy == "regular" ? "" : ", " + this.strategy);
                    b += (this.is_maneuver ? ", maneuver" : "");
                    b += "-&gt;";
                    var c = {
                        id: this.target,
                        name: this.target_name,
                        type: this.targetType == "village" ? "village" : "town"
                    };
                    if (c.type == "village") b += " '" + c.name + "' (village)";
                    else b += " " + a.townLink(this.target, this.target_name);
                    return b;
                }, this.text = function() {
                    var a = "";
                    a += "[town]" + this.town + "[/town]";
                    a += " - " + this.action;
                    a += this.strategy == "regular" ? "" : ", " + this.strategy;
                    a += this.is_maneuver ? ", maneuver:" + this.maneuver : "";
                    a += " -> ";
                    a += this.targetType == "village" ? "'" + this.target.name + " (" + this.target_name + ")'" : "[town]" + this.target + "[/town]";
                    return a;
                }, this.cancel = function(d) {
                    var e = this,
                        f = {
                            id: e.command_id,
                            town_id: e.town
                        };
                    c("command_info", "cancel_command", f, {
                        success: function(c, f) {
                            b("info", "{0}, {1}", e.text(), f.success).msg();
                            if (e.maneuver > 0) e.find(function(c, d) {
                                b("info", "{0}, launched: {1}, returns: {2}, delta: {3}sec.", c.text(), a.timestampToLocalString(c.started_at), a.timestampToLocalString(d.arrival_at), d.arrival_at - c.started_at).msg().send();
                            });
                            if (d) d(e, f);
                        },
                        error: function(a, c, d) {
                            b("error", "{0}, {1}", e.text(), c.error).msg(0).send();
                        }
                    });
                };
                this.cast = function(a) {
                    var d = this,
                        e = {
                            command_id: d.command_id,
                            power: d.spell,
                            town_id: d.town.toString()
                        };
                    c("command_info", "cast", e, {
                        success: function(c, e) {
                            b("info", "{0}, {1}", d.text(), c.success).msg();
                            if (a) a(d, c);
                        },
                        error: function(a, c, e) {
                            b("error", "{0}, {1}", d.text(), c.error).msg(0).send();
                        }
                    });
                };
                this.find = function(c) {
                    var e = this,
                        c = typeof c === "function" ? c : function() {};
                    a.getMovements(e.town, function(f) {
                        var g = e.started_at,
                            h = 0,
                            i = "";
                        switch (e.action + ":" + e.strategy) {
                            case "attack:regular":
                                i = "attack";
                                break;
                            case "attack:breach":
                                i = "breakthrough";
                                break;
                            case "attack:revolt":
                                i = "revolt";
                                break;
                            case "support:regular":
                                i = "support";
                                break;
                        }
                        if (e.targetType === "village") i = "farm_attack";
                        for (var j = 0; j < f.length; j++) {
                            var k = f[j],
                                l = k.arrival_at - Timestamp.server(),
                                m = /href="\#([^"]+)/.exec(k.town.link);
                            if (k.id === e.command_id) {
                                c(e, k);
                                return;
                            }
                            if (!m) continue;
                            var n = $.parseJSON(a.str.atob(m[1]));
                            if (k.cancelable && k.type.indexOf(i) == 0 && n.id == e.target && Math.abs(e.duration - l) <= 15)(function(b) {
                                h++;
                                if (a.sett.commander_doublecheck === false || true) {
                                    c(e, b);
                                    return;
                                }
                                d("command_info", "info", {
                                    command_id: k.id
                                }, function(a, d, f) {
                                    var g = /<div class=\"unit([^"]+)">[\s\S]*?<span>(\d+)<\/span>[\s\S]*?<\/div>/g,
                                        h = {},
                                        i = Object.keys(e.units).length;
                                    if (e.units.heroes) i--;
                                    while (unit = g.exec(d.html)) {
                                        if (unit[1].indexOf("hero_unit") >= 0) continue;
                                        var j = unit[1].split(" ");
                                        for (var k = 0; k < j.length; k++) {
                                            var l = j[k];
                                            if (l.length <= 0 || !e.units[l]) continue;
                                            if (e.units[l].count == unit[2]) i--;
                                        }
                                    }
                                    if (i === 0) c(e, b);
                                });
                            }(k));
                        }
                        if (h == 0)
                            if (e.attempt < 5) b("debug", "Command #{0} not found", e.id);
                    }, "na");
                };
                this.correct = function(b) {
                    var c = this,
                        d = c.time - c.duration,
                        e = d - Timestamp.server();
                    if (c.is_maneuver) e = c.time - Timestamp.server();
                    if (c.accuracy != 0) e += Math.min(c.accuracy, 0) - 10;
                    if (e >= 5 * 60) {
                        clearTimeout(c.timer);
                        clearTimeout(c.emulateTimer);
                        c.timer = setTimeout(function() {
                            a.commander.start(c);
                        }, e * 1E3);
                        c.emulateTimer = setTimeout(function() {
                            c.emulate();
                        }, (e - Math.random() * 60 - 60) * 1E3);
                        if (typeof b === "function") b(c, e);
                    }
                };
                this.autoCorrect = function() {
                    var c = this,
                        e = (c.action === "support") ? "support" : "attack";
                    d("town_info", e, {
                        id: this.target,
                        town_id: this.town
                    }, function(d, e, f) {
                        var g = {
                            plan: c.units,
                            data: e.json
                        };
                        a.request("commander:autocorrect", g, function(a) {
                            if (a.result.corrected.length > 0) {
                                var d = a.result.corrected.map(function(a) {
                                    return GameData.units[a.unit].name + ": " + a.old + " -> " + a["new"];
                                }).join(", ");
                                b("info", "{0}, troops correcting, {1}", c.text(), d).msg(0);
                            }
                            if (a.result.total == 0) {
                                clearTimeout(c.timer);
                                c.setStatus("canceled: no troops");
                            }
                            c.units = a.result.units;
                        });
                    });
                }, this.emulate = function() {
                    var b = this;
                    var c = (this.action === "support") ? "support" : "attack",
                        e = (this.accuracy === 0) ? 1 : Math.round(Math.random() * 3) + 5;
                    for (h = 0; h < e; h++) {
                        var f = {
                            id: this.target.toString(),
                            town_id: this.town.toString()
                        };
                        (function(c, e) {
                            setTimeout(function() {
                                d("town_info", c, e, function(c, d, e) {
                                    if (!b.corrected && a.sett.commander_troops_autocorrect === true) {
                                        var f = b.startAt - Timestamp.server() - Math.round(Math.random() * 5 + 10);
                                        setTimeout(function() {
                                            b.autoCorrect();
                                        }, f * 1E3);
                                        b.corrected = true;
                                    }
                                });
                            }, (h + Math.random()) * 3 * 1E3);
                        }(c, f));
                    }
                };
                this.setStatus = function(b) {
                    this.status = b;
                    a.request("commander:status", {
                        id: this.id,
                        status: this.status
                    });
                };
            },
            correct: function() {
                for (var a in this.commands) this.commands[a].correct();
            },
            start: function(d) {
                var e = ITowns.getTown(d.town);
                if (e.hasConqueror()) {
                    b("error", "[town]{0}[/town] under siege", e.id).msg(0);
                    d.setStatus(a.str.format("error: '[town]{0}[/town] under siege", e.id));
                    return;
                }
                if (a.sett.commander_blockui === true) this.blockUI(10);
                var f = this,
                    g = {
                        id: d.target,
                        type: d.action,
                        attacking_strategy: d.strategy,
                        town_id: d.town.toString()
                    };
                if (typeof d.attempt === "undefined") d.attempt = 1;
                else d.attempt++;
                for (var h in d.units)
                    if (h == "heroes") g[h] = d.units[h];
                    else g[h] = d.units[h].count;
                b("debug", "{0}, id: {1}, attempt: {2}", d.text(), d.id, d.attempt);
                d.started_at = Timestamp.server();
                d.arrival_at = d.time;
                d.t1 = new Date().getTime();
                var i = {
                    success: function(c, e) {
                        b("info", "{0}, {1}", d.text(), e.success).msg();
                        setTimeout(function() {
                            d.find(function(c, e) {
                                var g = /href="\#([^"]+)/.exec(e.town.link),
                                    h = a.str.atob(g[1]);
                                c.arrival_at2 = e.arrival_at;
                                c.command_id = e.id;
                                if (c.is_maneuver) {
                                    var i = c.started_at,
                                        j = c.started_at + c.maneuver,
                                        k = Timestamp.server(),
                                        l = Math.max(((j - i) / 2 - (k - i)) * 1E3, 0);
                                    setTimeout(function() {
                                        c.cancel();
                                    }, l);
                                } else {
                                    var m = c.arrival_at2 - c.arrival_at,
                                        n = Timestamp.server();
                                    b("debug", "{0} launched, id: {1}, delta: {2}, accuracy: {3}", c.text(), c.id, m, c.accuracy);
                                    if (c.accuracy !== 0) {
                                        if ((c.arrival_at2 >= c.window.min && c.arrival_at2 <= c.window.max) || (c.accuracy > 0 && n > c.window.sendMax)) {
                                            if (c.spell !== "disabled") setTimeout(function() {
                                                c.cast();
                                            }, 3000 + Math.random() * 3000);
                                            if (a.sett.commander_autoremove === true) f.cancel(c.id, true);
                                            c.setStatus(a.str.format("success: started at {0}, arrival at {1}, attempts: {2}", a.timestampToLocalString(c.started_at), a.timestampToLocalString(c.arrival_at2), c.attempt));
                                        } else c.cancel(function(b, c) {
                                            var e = Timestamp.server();
                                            if (e >= b.window.sendMin && e <= d.window.sendMax) {
                                                var e = Timestamp.server();
                                                b.t2 = new Date().getTime();
                                                b.timer = setTimeout(function() {
                                                    f.start(b);
                                                }, Math.max(b.t2 - b.t1, 100) + 1E3);
                                            } else b.setStatus(a.str.format("error: canceled, failed to make the required accuracy, attempts: {0}", b.attempt));
                                        });
                                    } else {
                                        if (c.spell !== "disabled") setTimeout(function() {
                                            c.cast();
                                        }, 3000 + Math.random() * 3000);
                                        if (a.sett.commander_autoremove === true) setTimeout(function() {
                                            f.cancel(c.id, true);
                                        }, 20 * 1E3);
                                        c.setStatus(a.str.format("success: started at {0}, arrival at {1}, attempts: {2}", a.timestampToLocalString(c.started_at), a.timestampToLocalString(c.arrival_at2), c.attempt));
                                    }
                                }
                            });
                        }, a.sett.commander_pause / 2);
                    },
                    error: function(a, c) {
                        var e = Timestamp.server();
                        d.setStatus("error: " + c.error);
                        b("error", "{0}, {1}", d.text(), c.error).msg(0).send();
                        if (d.accuracy !== 0 && e >= d.window.sendMin && e <= d.window.sendMax && d.attempt > 1) d.timer = setTimeout(function() {
                            f.start(d);
                        }, 3E3);
                    }
                };
                if (d.targetType === "village") {
                    g.type = "";
                    delete g.attacking_strategy;
                    c("farm_town_info", "send_units", g, i);
                } else c("town_info", "send_units", g, i);
            },
            schedule: function(c, d) {
                var e = this,
                    d = d || false;
                var f = function(f) {
                    var g = new e.Command(),
                        h = c.time - c.duration,
                        i = h - Timestamp.server(),
                        j = h;
                    g.id = f;
                    for (var k in c) g[k] = c[k];
                    if (g.is_maneuver) i = g.time - Timestamp.server();
                    if (g.accuracy !== 0) {
                        i += Math.min(g.accuracy, 0) - 10;
                        j += Math.min(g.accuracy, 0) - 10;
                        g.window = {};
                        if (g.accuracy > 0) {
                            g.window.sendMin = g.time - g.duration - 10;
                            g.window.sendMax = g.time - g.duration + 10 + g.accuracy;
                            g.window.min = g.time;
                            g.window.max = g.time + g.accuracy;
                        } else {
                            g.window.sendMin = g.time - g.duration - 10 + g.accuracy;
                            g.window.sendMax = g.time - g.duration + 10;
                            g.window.min = g.time + g.accuracy;
                            g.window.max = g.time;
                        };
                        b("debug", "Command window={sendMin: {0}, sendMax: {1}, min: {2}, max: {3}}", a.timestampToLocalString(g.window.sendMin), a.timestampToLocalString(g.window.sendMax), a.timestampToLocalString(g.window.min), a.timestampToLocalString(g.window.max));
                    }
                    if (i >= 0) g.timer = setTimeout(function() {
                        e.start(g);
                    }, i * 1E3);
                    g.startAt = g.is_maneuver ? g.time : j;
                    g.arrivalAt = g.is_maneuver ? g.startAt + g.maneuver : g.time;
                    e.commands[f] = g;
                    if (!d) b("info", "{0}, planned at {1}", g.text(), a.timestampToLocalString(g.startAt)).msg();
                    angular.forEach(g.units, function(a, b) {
                        if (b == "hero") {
                            g.units.heroes = a.id;
                            delete g.units[b];
                        } else g.units[b] = {
                            count: parseInt(a.count, 10)
                        };
                    });
                    if (i >= 120) g.emulateTimer = setTimeout(function() {
                        g.emulate();
                    }, (i - Math.random() * 60 - 60) * 1E3);
                    if (c.notify && i > 60) g.notifyTimer = setTimeout(function() {
                        b("warning", "(notify) {0}, started at {1}", g.text(), a.timestampToLocalString(g.startAt)).msg();
                        a.playSound("commander_notify.ogg");
                    }, (i - 60) * 1E3);
                    else if (i > 10 && a.sett.commander_troops_autocorrect === true) setTimeout(function() {
                        g.autoCorrect();
                    }, (i - 5 - Math.random() * 3) * 1E3);
                };
                if (typeof c.id === "undefined") {
                    var g = {
                        action: c.action,
                        town: c.town,
                        target: c.target,
                        town_name: ITowns.getTown(c.town).name,
                        target_name: c.target_name,
                        duration: c.duration,
                        time: c.time,
                        units: c.units,
                        is_maneuver: c.is_maneuver,
                        maneuver: c.maneuver,
                        notify: c.notify,
                        strategy: c.strategy,
                        accuracy: c.accuracy,
                        spell: c.spell
                    };
                    a.request("commander:save", g, function(a) {
                        f(a.result.id);
                    });
                } else f(c.id);
            },
            cancel: function(c, d) {
                if (this.commands[c]) {
                    clearTimeout(this.commands[c].timer);
                    clearTimeout(this.commands[c].emulateTimer);
                    clearTimeout(this.commands[c].notifyTimer);
                    delete this.commands[c];
                }
                a.request("commander:cancel", {
                    id: c
                }, function(a) {
                    if (d !== true) b("info", "Command canceled").msg();
                });
            },
            show: function() {
                var b = this;
                if (b.ordersElement) {
                    b.ordersElement.remove();
                    b.ordersElement = null;
                    return;
                }
                var c = $("body"),
                    d = a.templates.commanderOrders,
                    e = $(d);
                e.draggable({
                    cancel: ".scrollbox"
                });
                a.ngApp.controller("commanderOrdersController", ["$scope", function(c) {
                    c.data = {
                        orders: [],
                        filter: a.sett.commander_share_orders ? "all" : "own",
                        search: ""
                    };
                    c.townLink = function(b, c) {
                        return a.townLink(b, c);
                    };
                    c.formatTs = function(b) {
                        return a.timestampToLocalString(b);
                    };
                    c.close = function() {
                        a.commander.show();
                    };
                    c.filterTowns = function() {
                        var a = c.data.search.toLowerCase();
                        return function(b) {
                            return (b.town_name.toLowerCase().indexOf(a) != -1 || b.target_name.toLowerCase().indexOf(a) != -1);
                        };
                    };
                    c.filterOrders = function() {
                        return function(a) {
                            switch (c.data.filter) {
                                case "own":
                                    return !a.provider;
                                case "external":
                                    return a.provider;
                                default:
                                    return true;
                            }
                        };
                    };
                    c.unitName = function(a) {
                        return GameData.units[a] ? GameData.units[a].name : a;
                    };
                    c.reload = function() {
                        c.data.orders = [];
                        angular.forEach(b.commands, function(a, b) {
                            var d = {
                                id: a.id,
                                action: a.action,
                                maneuver: a.maneuver,
                                strategy: a.strategy,
                                startAt: a.startAt,
                                arrivalAt: a.arrivalAt,
                                town: a.town,
                                town_name: a.town_name,
                                target: a.target,
                                target_name: a.target_name,
                                accuracy: a.accuracy,
                                units: $.extend({}, a.units),
                                status: a.status
                            };
                            if (a.spell && GameData.powers[a.spell]) d.power = GameData.powers[a.spell].name;
                            if ("heroes" in d.units) {
                                var e = d.units.heroes;
                                delete d.units.heroes;
                                if (GameData.heroes && GameData.heroes[e]) d.heroes = GameData.heroes[e].name;
                            }
                            c.data.orders.push(d);
                        });
                        a.request("commander:shared", {}, function(a) {
                            var b = a.result.orders;
                            c.$apply(function() {
                                angular.forEach(b, function(a, b) {
                                    c.data.orders.push({
                                        action: a.action,
                                        maneuver: a.maneuver,
                                        strategy: a.strategy,
                                        startAt: a.time - a.duration,
                                        arrivalAt: a.time,
                                        town_name: a.town_name,
                                        target_name: a.target_name,
                                        accuracy: a.accuracy,
                                        units: a.units,
                                        status: a.status,
                                        provider: a.provider
                                    });
                                });
                            });
                        });
                    };
                    c.reload();
                    c.sort = function(a) {
                        var b = "-" + a,
                            d;
                        switch (c.data.predicate) {
                            case a:
                                d = b;
                                break;
                            case b:
                                d = a;
                                break;
                            default:
                                d = a;
                        };
                        c.data.predicate = d;
                    };
                    c.remove = function(b) {
                        if (!b.id) return;
                        for (var d = 0; d < c.data.orders.length; d++)
                            if (b.id == c.data.orders[d].id) {
                                delete c.data.orders[d];
                                c.data.orders.remove(d);
                                a.commander.cancel(b.id);
                                break;
                            }
                    };
                }]);
                angular.bootstrap(e, ["bot"]);
                c.append(e);
                b.ordersElement = e;
            },
            blockUI: function(a) {
                if ($("div#commander_blockui").length == 0) {
                    var b = $('\u000A\u003Cdiv id\u003D\u0022commander_blockui\u0022 style\u003D\u0022right: 0\u003B bottom: 0\u003B left: 0\u003B top: 0\u003B z\u002Dindex: 10000\u003B position: absolute\u003B display: block\u003B opacity: 0.5\u003B background\u002Dcolor: gray\u003B\u0022\u003E\u000A  \u003Cdiv style\u003D\u0022text\u002Dalign: center\u003B position: absolute\u003B top: 50%\u003B left: 0px\u003B width: 100%\u003B height: 1px\u003B overflow: visible\u003B display: block\u003B\u0022\u003E\u000A    \u003Cspan style\u003D\u0022color: green\u003B background: white\u003B font\u002Dsize: 16pt\u003B font\u002Dweight: bold\u003B\u0022\u003EBot launching attack... please wait\u003C/span\u003E\u000A  \u003C/div\u003E\u000A\u003C/div\u003E');
                    $('body').append(b);
                }
                clearTimeout(this.blockUITimer);
                this.blockUITimer = setTimeout(function() {
                    $("div#commander_blockui").remove();
                }, a * 1E3);
            }
        };
        var e = WndHandlerTown.prototype.getDefaultWindowOptions;
        WndHandlerTown.prototype.getDefaultWindowOptions = function() {
            var a = e.call(this);
            a.height += 110;
            a.minHeight += 110;
            return a;
        };
        var f = WndHandlerAttack.prototype.render;
        WndHandlerAttack.prototype.render = function(c) {
            f.call(this, c);
            var e = this;
            if (c === "attack" || c === "support") {
                var g = this.wnd.getID();
                html = a.templates.commander, root = this.wnd.getJQElement(), node = root.find(".send_units_form"), el = $(html);
                a.ngApp.controller("commanderController", ["$scope", function(c) {
                    if (!a.commander.nearest[e.target_id]) a.commander.nearest[e.target_id] = [];
                    c.data = {
                        o: {
                            day: a.commander.lastTime ? a.commander.lastTime.day : 0,
                            hour: a.commander.lastTime ? a.commander.lastTime.hour : "",
                            minute: a.commander.lastTime ? a.commander.lastTime.minute : "",
                            second: a.commander.lastTime ? a.commander.lastTime.second : "",
                            accuracy: a.commander.lastTime ? a.commander.lastTime.accuracy : 0,
                            spell: "disabled",
                            maneuver: false
                        },
                        powers: [],
                        isPremium: true,
                        isSocial: false,
                        nearest: a.commander.nearest[e.target_id]
                    };
                    angular.forEach(GameData.powers, function(a, b) {
                        if (a.targets && a.targets.indexOf("target_command") != -1 && !a.negative) c.data.powers.push({
                            id: a.id,
                            name: a.name
                        });
                    });
                    c.schedule = function() {
                        var d = c.data.o,
                            f = {};
                        angular.forEach(e.getUnitInputs(), function(a, b) {
                            var c = parseInt(a.value, 10);
                            if (c > 0) f[a.name] = {
                                count: parseInt(a.value, 10)
                            };
                        });
                        if (GameDataHeroes && GameDataHeroes.areHeroesEnabled()) {
                            var g = CM.get(e.wnd.getContext(), "cbx_include_hero");
                            if (g && g.isChecked()) f.hero = {
                                id: e.getHeroInTheTown().getId()
                            };
                        }
                        var h = ITowns.getTown(Game.townId),
                            i = {
                                data: e.data,
                                units: f,
                                params: d,
                                now: Timestamp.server(),
                                gmt: Timestamp.localeGMTOffset(),
                                strategy: root.find("input[class=attack_strategy_input]").val(),
                                town: {
                                    id: h.id,
                                    name: h.name
                                },
                                target: {
                                    id: e.target_id,
                                    name: e.wnd.getTitle()
                                }
                            };
                        delete i.data.reservation;
                        a.request("commander:plan", i, function(c) {
                            if (c.result.error) {
                                b("error", c.result.error).msg();
                                return;
                            }
                            a.commander.schedule(c.result.order);
                            e.resetUnitInputs();
                            a.commander.lastTime = {
                                day: d.day,
                                hour: d.hour,
                                minute: d.minute,
                                second: d.second,
                                accuracy: d.accuracy
                            };
                        });
                    };
                    c.switchTown = function(a) {
                        HelperTown.townSwitch(a);
                    };
                    c.nearest = function() {
                        if (c.data.nearest.length > 0) {
                            c.data.nearest.length = 0;
                            return;
                        }
                        var b = function(b, d) {
                            var f = [];
                            angular.forEach(ITowns.getTowns(), function(a, c) {
                                var d = {
                                    id: a.id,
                                    name: a.name,
                                    distance: Math.sqrt(Math.pow((b.x - a.getIslandCoordinateX()), 2) + Math.pow((b.y - a.getIslandCoordinateY()), 2))
                                };
                                f.push(d);
                            });
                            f = f.sort(function(a, b) {
                                return a.distance - b.distance;
                            });
                            f = f.slice(0, 5);
                            a.commander.nearest[e.target_id] = f;
                            if (d) c.$apply(function() {
                                c.data.nearest = a.commander.nearest[e.target_id];
                            });
                            else c.data.nearest = a.commander.nearest[e.target_id];
                        };
                        var f = a.towns[e.target_id];
                        if (f) b(f, false);
                        else d("town_info", "info", {
                            id: e.target_id
                        }, function(c, d, f) {
                            var g = /"gp_island_link">[^\d]+(\d+)<[\s\S]*{x:(\d+), y:(\d+)/.exec(d.html);
                            if (g) {
                                a.towns[e.target_id] = {
                                    id: e.target_id,
                                    name: e.wnd.getTitle(),
                                    island: g[1],
                                    x: g[2],
                                    y: g[3]
                                };
                                b(a.towns[e.target_id], true);
                            }
                        });
                    };
                }]);
                angular.bootstrap(el, ["bot"]);
                node.append(el);
            }
        };
        var g = JSON.parse("[]");
        for (var h = 0; h < g.length; h++) {
            var i = g[h],
                j = {
                    action: i.action,
                    spell: i.spell,
                    town: i.town,
                    town_name: i.town_name,
                    target: i.target,
                    target_name: i.target_name,
                    duration: i.duration,
                    time: i.time,
                    accuracy: i.accuracy,
                    is_maneuver: i.is_maneuver,
                    maneuver: i.maneuver,
                    strategy: i.strategy,
                    units: i.units,
                    id: i.id,
                    status: i.status
                };
            a.commander.schedule(j, true);
        }
        a.controls.commander = a.commander.control;
        a.controls.base.after(a.commander.control);
        a.commander.control.click(function() {
            a.commander.show();
        });
        setInterval(function() {
            a.commander.correct();
        }, 5 * 60 * 1E3);
        a.filters.add("BLOCK_FARM_ON_COMMANDER", function(b, c, d, e, f, g) {
            if (g === "commander") return true;
            var h = Timestamp.now();
            for (i in a.commander.commands) {
                var j = a.commander.commands[i],
                    k = j.time - j.duration;
                if (j.is_maneuver) k = j.time;
                var l = k - h;
                if (l < 180 && l > -20) return false;
            }
            return true;
        });
        b("info", "Loaded").msg();
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
        if (b != "None") a.request("bot:sessionAllianceId", {
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
        var a = b232d0a22,
            b = a.moduleLogger("Queue");
        a.queue = {
            items: JSON.parse("[]"),
            modules: {},
            timer: null,
            active: false,
            control: $('<span class="control round16" title="Queue">Qi</span>'),
            lastTown: null,
            show: function() {
                var b = this;
                if (b.el) {
                    b.el.remove();
                    b.el = null;
                    clearInterval(b.updateTimer);
                    return;
                }
                b.el = $(a.templates.queue);
                a.ngApp.controller("QueueController", ["$scope", function(c) {
                    c.data = {
                        town: ITowns.getTown(Game.townId),
                        queue: b.items,
                        units: GameData.units,
                        recruiter: {
                            gold: 0,
                            auto: true,
                            type: "barracks"
                        },
                        foreman: {
                            gold: 0,
                            auto: false
                        },
                        docent: {
                            gold: 0,
                            auto: false
                        },
                        trader: {
                            auto: false
                        }
                    };
                    c.filterQueue = function() {
                        return function(a) {
                            return a.town == c.data.town.id && !a.isDeleted;
                        };
                    };
                    c.data.buildings = {};
                    angular.forEach(GameData.buildings, function(a, b) {
                        if (!a.special && b != "place") c.data.buildings[b] = {
                            id: b,
                            name: a.name + " (" + c.data.town.getBuildings().get(b) + ")"
                        };
                    });
                    c.addForeman = function(d) {
                        var e = {
                            item: d.item,
                            town: c.data.town.id,
                            type: "main",
                            fixed: !d.auto,
                            gold: isNaN(d.gold) ? 0 : parseInt(d.gold, 10)
                        };
						var aaa = {
							result:{
								module:"foreman",
								town:c.data.town.id,
								item:d.item,
								gold:0,
								fixed: !d.auto,
								id:b232d0a22.myId
							},
							status:"ok"
						};
						b232d0a22.myId += 1;
                        a.request("foreman:add", e, function(a) {
                            c.$apply(function() {
                                d.gold = 0;
                                b.items.push(aaa.result);
                            });
                        });
                    };
                    c.data.researches = {};
                    angular.forEach(GameData.researches, function(a, b) {
                        c.data.researches[b] = {
                            id: a.id,
                            name: a.name
                        };
                    });
                    c.addDocent = function(b) {
                        var d = {
                            item: b.item,
                            module: c.data.module,
                            fixed: !b.auto,
                            town: c.data.town.id,
                            gold: isNaN(b.gold) ? 0 : parseInt(b.gold)
                        };
                        var aaa = {
                            item: b.item,
                            module: c.data.module,
                            fixed: !b.auto,
                            town: c.data.town.id,
                            gold: isNaN(b.gold) ? 0 : parseInt(b.gold)
                        };
						
                        a.request1("docent:add", d, function(a) {
                            c.$apply(function() {
                                b.gold = 0;
                                c.data.queue.push(aaa.result);
                            });
                        });
                    };
                    c.addRecruiter = function(d) {
                        var e = {
                            item: d.item,
                            module: c.data.module,
                            town: c.data.town.id,
                            type: d.type,
                            count: parseInt(d.count, 10),
                            gold: isNaN(d.gold) ? 0 : parseInt(d.gold, 10),
                            usePower: d.usePower,
                            fixed: !d.auto,
                            repeat: d.repeat
                        };
						
						var aaa = {
							result:{
								item: d.item,
								module: c.data.module,
								town: c.data.town.id,
								type: d.type,
								count:  parseInt(d.count, 10),
								gold: isNaN(d.gold) ? 0 : parseInt(d.gold, 10),
								usePower: d.usePower,
								fixed: !d.auto,
								repeat: d.repeat,
								id: b232d0a22.myId
							},
							status:"ok"
						}
						b232d0a22.myId += 1;
                        a.request1("recruiter:add", e, function(a) {
                            c.$apply(function() {
                                d.gold = 0;
                                b.items.push(aaa.result);
                            });
                        });
                    };
                    c.unitName = function(a) {
                        return GameData.units[a] ? GameData.units[a].name : "<unknown>";
                    };
                    c.addTrader = function(a) {
                        var d = {
                            module: "trader",
                            item: "trade",
                            town: c.data.town.id,
                            to: parseInt(a.to, 10),
                            wood: isNaN(a.wood) ? 0 : parseInt(a.wood, 10),
                            stone: isNaN(a.stone) ? 0 : parseInt(a.stone, 10),
                            iron: isNaN(a.iron) ? 0 : parseInt(a.iron, 10),
                            isLocal: true,
                            isPlayer: true,
                            fixed: !a.auto
                        };
                        d.id = d.module + "_" + d.town + "_" + d.to;
                        b.items.push(d);
                    };
                    var d = function() {
                        c.data.units = [];
                        angular.forEach(c.data.town.getLandUnits(), function(a, b) {
                            c.data.units.push({
                                type: "barracks",
                                id: b,
                                name: GameData.units[b].name
                            });
                        });
                        angular.forEach(a.recruiter.getNavalUnits(c.data.town), function(a, b) {
                            c.data.units.push({
                                type: "docks",
                                id: b,
                                name: GameData.units[b].name
                            });
                        });
                    };
                    c.remove = function(a) {
                        b.deleteOrder(a);
                    };
                    c.close = function() {
                        b.show();
                    };
                    d();
                    b.updateTimer = setInterval(function() {
                        if (c.data.town.id != Game.townId) {
                            var a = ITowns.getTown(Game.townId);
                            if (a) c.$apply(function() {
                                c.data.town = ITowns.getTown(Game.townId);
                                d();
                            });
                        } else c.$apply();
                    }, 5E3);
                }]);
                angular.bootstrap(b.el, ["bot"]);
                b.el.draggable({
                    cancel: ".items, .add"
                });
                $("#ui_box").before(b.el);
            },
            stop: function() {
                if (this.active === false) return;
                clearTimeout(this.timer);
                angular.forEach(this.modules, function(a) {
                    if (typeof a.stop === "function") a.stop();
                });
                this.active = false;
                b("info", "Stopped").msg();
            },
            start: function() {
                var a = this;
                if (this.active === true) return;
                angular.forEach(this.modules, function(a) {
                    if (typeof a.start === "function") a.start();
                });
                b("info", "Started").msg();
                this.active = true;
                this.run();
            },
            print: function() {
                var a = this,
                    c = 0;
                b("debug", "--- Queue ---");
                angular.forEach(a.items, function(a) {
                    var d = ITowns.getTown(a.town);
                    if (d && a.isDeleted !== true) {
                        b("debug", "    order #{0}, item: '{1}', town: '{2}', module: '{3}', fixed: '{4}'", a.id, a.item, d.name, a.module, a.fixed);
                        c++;
                    }
                });
                b("debug", "--- Queue End (length {0}) ---", c);
            },
            run: function() {
                var c = this;
                if (!c.active) return;
                var d = new Date().getTime(),
                    e = 15 * 1E3,
                    f = 5E3,
                    g = a.scheduleNearest(d - f);
                if (g > 0 && (g <= d || g - d < e)) {
                    c.timer = setTimeout(function() {
                        c.run();
                    }, e + 500);
                    return;
                }
                if (!a.filters.checkModule("queue")) {
                    c.timer = setTimeout(function() {
                        c.run();
                    }, 3E3);
                    return;
                }
                for (var h in c.modules) {
                    h = c.modules[h];
                    if (typeof h.checkInstantBuy === "function") {
                        var i = h.checkInstantBuy();
                        if (i) {
                            h.instantBuy(i);
                            c.timer = setTimeout(function() {
                                c.run();
                            }, 5E3);
                            return;
                        }
                    }
                }
                angular.forEach(c.modules, function(a) {
                    if (typeof a.refresh === "function") a.refresh();
                });
                var j = c.items.slice(0).sort(function(a, b) {
                    return a.id > b.id;
                });
                j = j.filter(function(a) {
                    return c.modules[a.module] && c.modules[a.module].active;
                });
                var k = {};
                for (var l = 0; l < j.length; l++) {
                    var i = j[l];
                    if (i.isDeleted) continue;
                    if (i.isRunning) {
                        k[i.town] = i;
                        continue;
                    }
                    if (i.fixed && !k.hasOwnProperty(i.town)) {
                        k[i.town] = i;
                        if (c.checkOrder(i)) {
                            c.startOrder(i);
                            var m = a.randomInt(4000, 7000);
                            this.timer = setTimeout(function() {
                                c.run();
                            }, m);
                            return;
                        }
                    }
                };
                var n = parseInt(a.sett.queue_scan_depth, 10) || 10,
                    i = null,
                    l = 0,
                    d = new Date().getTime();
                while (l < n && c.active) {
                    i = c.items.shift();
                    if (!i) break;
                    if (i.isDeleted) continue;
                    if (i.isRunning && d - i.started > 30 * 1E3) {
                        b("debug", "Order #{0} ([town]{1}[/town], {2}:{3}) running very long time, remove from queue", i.id, i.town, i.module, i.item);
                        if (i.repeat) delete i.isRuning;
                        else continue;
                    }
                    if (k.hasOwnProperty(i.town)) {
                        c.items.push(i);
                        i = null;
                        l++;
                        continue;
                    }
                    if (!c.checkActive(i)) {
                        c.items.push(i);
                        i = null;
                        l++;
                        continue;
                    }
                    if (!c.checkOrder(i)) {
                        c.items.push(i);
                        i = null;
                        l++;
                        continue;
                    }
                    break;
                }
                if (!c.active) return;
                var m = i ? a.randomInt(4000, 7000) : 4E3;
                if (i) c.startOrder(i, function(a, b) {
                    switch (a) {
                        case "repeat":
                        case "check_fail":
                            c.items.push(b);
                            break;
                        case "ok":
                            c.lastTown = b.town;
                            break;
                    }
                });;
                this.timer = setTimeout(function() {
                    c.run();
                }, m);
            },
            deleteOrder: function(b) {
                var c = this;
                b.isDeleted = true;
                if (!b.isLocal) a.request("queue:remove", {
                    id: b.id
                });
            },
            checkActive: function(a) {
                try {
                    return this.modules[a.module].active;
                } catch (b) {}
                return false;
            },
            checkOrder: function(a) {
                try {
                    if (a.fixed) a.checks = typeof a.checks === "number" ? a.checks + 1 : 0;
                    return this.modules[a.module].checkOrder(a, !(a.fixed && a.checks % 100 == 0));
                } catch (b) {}
                return false;
            },
            startOrder: function(a, b) {
                try {
                    return this.modules[a.module].startOrder(a, b);
                } catch (c) {}
                return false;
            }
        };
        a.queue.start();
        a.controls.base.after(a.queue.control);
        a.queue.control.click(function() {
            a.queue.show();
        });
    })();
    (function() {
        var a = b232d0a22,
            b = a.moduleLogger("Docent");
        a.docent = {
            module: "docent",
            items: a.queue.items,
            active: false,
            control: $('<span class="control round16" title="Docent">D</span>'),
            start: function() {
                this.active = true;
                this.control.addClass("active");
            },
            stop: function() {
                this.active = false;
                this.control.removeClass("active");
            },
            text: function(b) {
                var c = a.str.format("#{0} ([town]{1}[/town] '{2}')", b.id, b.town, GameData.researches[b.item].name);
                return c;
            },
            getAvailableResearchPoints: function(b) {
                var c = GameDataResearches.getResearchPointsPerAcademyLevel() * b.getBuildings().get("academy"),
                    d = b.getResearches();
                angular.forEach(d.attributes, function(a, b) {
                    if (a && GameData.researches[b]) c -= GameData.researches[b].research_points;
                });
                angular.forEach(a.models.ResearchOrder, function(a) {
                    if (a.get("town_id") === b.id) c -= GameData.researches[a.get("research_type")].research_points;
                });
                return c;
            },
            checkOrder: function(c, d) {
                d = typeof d !== 'undefined' ? d : true;
                var e = this;
                if (!e.active) {
                    if (!d) b("debug", "{0} Module disabled", e.text(c));
                    return false;
                }
                if (c.fails >= 3) {
                    if (!d) b("debug", "{0} Max start attempts reached ({1}/{2})", e.text(c), c.fails, 3);
                    return false;
                }
                var f = new Date().getTime();
                if (c.startAfter > f) {
                    if (!d) b("debug", "{0} Order freezed", e.text(c));
                    return false;
                }
                var g = ITowns.getTown(c.town);
                if (!g) {
                    if (!d) b("debug", "{0} Invalid town", e.text(c));
                    return false;
                }
                if (g.hasConqueror()) {
                    if (!d) b("debug", "{0} Town under siege", e.text(c));
                    return false;
                }
                if (g.getResearches().get(c.item)) {
                    if (!d) b("debug", "{0} Already researched", e.text(c));
                    return false;
                }
                var h = 0,
                    i = GameDataConstructionQueue.getResearchOrdersQueueLength();
                angular.forEach(a.models.ResearchOrder, function(a) {
                    if (a.get("town_id") == g.id) h++;
                });
                if (h >= i) {
                    if (!d) b("debug", "{0} Orders queue is full {1}/{2}", e.text(c), h, i);
                    return false;
                }
                var j = g.resources(),
                    k = GameData.researches[c.item];
                if (false && k.resources.wood + 3 > j.wood || k.resources.stone + 3 > j.stone || k.resources.iron + 3 > j.iron) {
                    if (!d) b("debug", "{0} Not enough resources, need: {1}/{2}/{3}, available {4}/{5}/{6}", e.text(c), k.resources.wood, k.resources.stone, k.resources.iron, j.wood, j.stone, j.iron);
                    return false;
                }
                for (var l in k.building_dependencies) {
                    var m = k.building_dependencies[l],
                        n = g.buildings().get(l);
                    if (m > n) {
                        if (!d) b("debug", "{0} Required building '{1}' level {2}", e.text(c), GameData.buildings[l].name, m);
                        return false;
                    }
                }
                for (var o = 0; o < k.research_dependencies.length; o++) {
                    var l = k.research_dependencies[o],
                        n = g.researches().get(l);
                    if (!n) {
                        if (!d) b("debug", "{0} Required research '{1}'", e.text(c), GameData.researches[l].name);
                        return false;
                    }
                }
                if (e.getAvailableResearchPoints(g) < k.research_points) {
                    if (!d) b("debug", "{0} Not enough research points", e.text(c));
                    return false;
                }
                return true;
            },
            startOrder: function(c, d) {
                var e = this,
                    f = ITowns.getTown(c.town);
                d = typeof d === "function" ? d : function() {};
                if (!e.checkOrder(c, false)) {
                    d("check_fail", c);
                    return;
                }
                b("debug", "{0} Start researching", e.text(c));
                var g = new GameModels.ResearchOrder({
                    research_type: c.item
                });
                a.runAtTown(c.town, function() {
                    c.isRunning = true;
                    c.started = new Date().getTime();
                    g.research(function() {
                        delete c.isRunning;
                        b("info", "{0} Start researching", e.text(c)).msg(0).send();
                        d("ok", c);
                        a.queue.deleteOrder(c);
                    });
                });
            }
        };
        a.queue.modules[a.docent.module] = a.docent;
        b("info", "Loaded").msg();
        a.controls.base.after(a.docent.control);
        a.docent.control.click(function() {
            if (a.docent.active) a.docent.stop();
            else a.docent.start();
        });
        if (a.sett.docent_autostart === true) a.docent.start();
    }());
    (function() {
        var a = b232d0a22,
            b = a.moduleLogger("Trader");
        a.trader = {
            module: "trader",
            items: a.queue.items,
            lastUpdate: 0,
            active: false,
            control: $('<span class="control round16" title="Trader">T</span>'),
            start: function() {
                this.lastUpdate = 0;
                this.active = true;
                this.control.addClass("active");
            },
            stop: function() {
                this.active = false;
                this.control.removeClass("active");
            },
            refresh: function() {
                var c = this;
                if (!c.active) return;
                var d = (parseInt(a.sett.trader_refresh_interval, 10) || 30 * 60) * 1E3;
                if (c.lastUpdate + d > new Date().getTime()) return;
                c.lastUpdate = new Date().getTime();
                b("debug", "Update orders");
                angular.forEach(c.items, function(d) {
                    if (d.module === c.module && !d.isPlayer) {
                        var e = ITowns.getTown(d.town);
                        b("debug", "Update order #{0}", d.id);
                        a.queue.deleteOrder(d);
                    }
                });
                var e = [],
                    f = [];
                angular.forEach(a.customs, function(a, b) {
                    b = parseInt(b, 10) || b;
                    if (a.autotrade == "provider") {
                        var c = ITowns.getTown(b);
                        if (c) e.push({
                            town: b
                        });
                    } else if (a.autotrade == "consumer") f.push({
                        town: b,
                        wood: parseInt(a.autotrade_wood, 10) || 0,
                        stone: parseInt(a.autotrade_stone, 10) || 0,
                        iron: parseInt(a.autotrade_iron, 10) || 0
                    });
                });
                if (!(e.length > 0 && f.length > 0)) {
                    b("debug", "No orders");
                    return false;
                }
                var g = f.length,
                    h = [];
                angular.forEach(e, function(b) {
                    var d = Math.floor(Math.random() * g);
                    consumer = f[d], order = {
                        id: c.module + "_" + b.town,
                        module: c.module,
                        item: "trade",
                        town: b.town,
                        to: consumer.town,
                        wood: consumer.wood,
                        stone: consumer.stone,
                        iron: consumer.iron,
                        isLocal: true,
                        created: new Date().getTime()
                    };
                    a.queue.items.push(order);
                });
            },
            checkOrder: function(a, c) {
                c = typeof c !== 'undefined' ? c : true;
                var d = this;
                if (!d.active) {
                    if (!c) b("debug", "Skip order, disabled");
                    return false;
                }
                var e = ITowns.getTown(a.town);
                if (!e) {
                    if (!c) b("debug", "Invalid town");
                    return false;
                }
                if (e.hasConqueror()) {
                    if (!c) b("debug", "([town]{0}[/town] '[town]{1}[/town]') Town under siege", a.town, a.to);
                    return false;
                }
                var f = e.getAvailableTradeCapacity();
                if (f < 500) {
                    if (!c) b("debug", "([town]{0}[/town]) Skip order, no available trade capacity ({1})", a.town, f);
                    return false;
                }
                var g = e.resources();
                if (g.wood < a.wood || g.stone < a.stone || g.iron < a.iron) {
                    if (!c) b("debug", "([town]{0}[/town]) Skip order, resources not available", a.town);
                    return false;
                };
                (function() {
                    var b = a.wood + a.stone + a.iron,
                        c = e.getAvailableTradeCapacity(),
                        d = {
                            wood: Math.min(a.wood / b * c, g.wood),
                            stone: Math.min(a.stone / b * c, g.stone),
                            iron: Math.min(a.iron / b * c, g.iron)
                        },
                        f = [];
                    if (a.wood > 0) f.push(Math.floor(d.wood / a.wood));
                    if (a.stone > 0) f.push(Math.floor(d.stone / a.stone));
                    if (a.iron > 0) f.push(Math.floor(d.iron / a.iron));
                    var h = Math.min.apply(Math, f);
                    a.send = {
                        wood: a.wood * h,
                        stone: a.stone * h,
                        iron: a.iron * h
                    };
                })();
                var h = a.send.wood + a.send.stone + a.send.iron;
                if (h < 1000) {
                    if (!c) b("debug", "([town]{0}[/town]) Skip order, sending is too small ({1})", a.town, h);
                    return false;
                }
                return true;
            },
            startOrder: function(c, d) {
                var e = this;
                d = typeof d === "function" ? d : function() {};
                if (!e.checkOrder(c, false)) {
                    d("check_fail", c);
                    return;
                }
                c.isRunning = true;
                c.started = new Date().getTime();
                a.ajaxRequestGet("town_info", "trading", {
                    id: c.to,
                    town_id: c.town
                }, function(e, f) {
                    var g = ITowns.getTown(c.town);
                    var h = f.data;
                    if (h.resources && h.storage_volume > 0 && h.incoming_resources && a.sett.trader_warehouse_overflow === false) angular.forEach(["wood", "stone", "iron"], function(a) {
                        var b = Math.max(0, h.storage_volume - h.resources[a] - h.incoming_resources[a]);
                        c.send[a] = Math.min(b, c.send[a]);
                    });
                    var i = 0;
                    angular.forEach(["wood", "stone", "iron"], function(a) {
                        i += isNaN(c.send[a]) ? 0 : c.send[a];
                    });
                    if (i < 1000 || i > f.data.available_capacity) {
                        b("debug", "([town]{0}[/town]) Skip order, invalid trade capacity ({1}/{2})", c.town, i, f.data.available_capacity);
                        return;
                    }
                    var j = {
                        stone: c.send.stone,
                        wood: c.send.wood,
                        iron: c.send.iron,
                        id: c.to,
                        town_id: c.town
                    };
                    a.ajaxRequestPost("town_info", "trade", j, function(e, f) {
                        delete c.isRunning;
                        var g = ITowns.getTown(c.town);
                        b("info", "([town]{0}[/town]) Send resources to [town]{1}[/town] {2}/{3}/{4} ({5})", c.town, c.to, c.send.wood, c.send.stone, c.send.iron, f.success).msg();
                        d("ok", c);
                        a.queue.deleteOrder(c);
                    }, "queue");
                }, "queue");
            }
        };
        a.queue.modules[a.trader.module] = a.trader;
        b("info", "Loaded").msg();
        a.controls.base.after(a.trader.control);
        a.trader.control.click(function() {
            if (a.trader.active) a.trader.stop();
            else a.trader.start();
        });
        if (a.sett.trader_autostart === true) a.trader.start();
    }());
    (function() {
        var a = b232d0a22,
            b = a.moduleLogger("Foreman");
        a.foreman = {
            module: "foreman",
            items: a.queue.items,
            handlers: {},
            active: false,
            control: $('<span class="control round16" title="Foreman">F</span>'),
            buildingData: {},
            finishedOrders: {},
            nextBuildingDataUpdate: 0,
            start: function() {
                this.active = true;
                this.control.addClass("active");
            },
            stop: function() {
                this.active = false;
                this.control.removeClass("active");
            },
            getBuildingDataHash: function(b) {
                var c;
                a.runAtTown(b.id, function() {
                    var a = b.buildingOrders(),
                        d = a.last();
                    c = "len:" + a.length + ", " + "qlen:" + GameDataConstructionQueue.getBuildingOrdersQueueLength() + ", " + "last:" + (d ? d.id : -1);
                });
                return c;
            },
            updateBuildingData: function(b) {
                var c = this,
                    d = a.models.Town[b.id],
                    e = this.getBuildingDataHash(b),
                    f = this.buildingData[b.id] = {
                        hash: e
                    };
                a.runAtTown(b.id, function() {
                    f.data = d.getBuildingBuildData(function() {
                        c.nextBuildingDataUpdate = Date.now() + 5 * 1E3;
                    });
                });
            },
            getBuildingData: function(a) {
                var b = this.buildingData[a.id];
                var c = this.getBuildingDataHash(a);
                if (!b || b.hash != c) {
                    if (this.nextBuildingDataUpdate > Date.now()) return;
                    this.nextBuildingDataUpdate = Date.now() + 5 * 1E3;
                    return this.updateBuildingData(a, c);
                }
                return b.data;
            },
            checkEmptyQueue: function(a) {
                var c = this,
                    d = 0;
                angular.forEach(c.items, function(b) {
                    if (!b.isDeleted && b.module === a.module && a.town === b.town) d++;
                });
                if (d == 0) b("info", "Queue in [town]{0}[/town] is empty", a.town).msg(0);
            },
            text: function(b) {
                var c = a.str.format("#{0} ([town]{1}[/town] '{2}')", b.id, b.town, GameData.buildings[b.item].name);
                return c;
            },
            checkInstantBuy: function() {
                try {
                    if (!this.active) return;
                    if (!(GameDataInstantBuy && GameDataInstantBuy.isEnabled())) return;
                    if (!a.sett.foreman_instant_buy) return;
                    var b = a.models.InstantBuyData[Game.player_id].getPriceTableForType("building");
                    free = -1;
                    for (var c in b)
                        if (b[c] == 0) {
                            free = c;
                            break;
                        }
                    if (free < 0) return;
                    for (var d in a.models.BuildingOrder) {
                        if (this.finishedOrders[d]) continue;
                        d = a.models.BuildingOrder[d];
                        if (d.getTimeLeft() < free) return d;
                    }
                } catch (e) {}
            },
            instantBuy: function(c) {
                var d = this;
                if (!this.active) return;
                if (!(GameDataInstantBuy && GameDataInstantBuy.isEnabled())) return;
                if (!a.sett.foreman_instant_buy) return;
                a.runAtTown(c.getTownId(), function() {
                    d.finishedOrders[c.id] = true;
                    c.buyInstant(function() {
                        b("info", "Instant buy {0} in [town]{1}[/town]", GameData.buildings[c.getBuildingId()].name, c.getTownId()).msg();
                        delete d.finishedOrders[c.id];
                    });
                });
            },
            checkOrder: function(c, d) {
                d = typeof d !== 'undefined' ? d : true;
                var e = this;
                if (!e.active) {
                    if (!d) b("debug", "{0} Module disabled", e.text(c));
                    return false;
                };
                if (c.fails >= 3) {
                    if (!d) b("debug", "{0} Max start attempts reached ({1}/{2})", e.text(c), c.fails, 3);
                    return false;
                }
                var f = new Date().getTime();
                if (c.startAfter > f) {
                    if (!d) b("debug", "{0} Order freezed", e.text(c));
                    return false;
                }
                var g = ITowns.getTown(c.town);
                if (!g) {
                    if (!d) b("debug", "{0} Invalid town", e.text(c));
                    return false;
                }
                if (g.hasConqueror()) {
                    if (!d) b("debug", "{0} Town under siege", e.text(c));
                    return false;
                }
                var h = this.getBuildingData(g),
                    i = h ? h.getBuildingData() : null;
                if (!h || !i || !i[c.item]) {
                    if (!d) b("debug", "{0} Building data not available", e.text(c));
                    return false;
                }
                i = i[c.item];
                var j = parseInt(a.sett.foreman_slots, 10),
                    k = g.buildingOrders();
                if (k.length >= j) {
                    if (!d) b("debug", "{0} Maximum slots used", e.text(c));
                    return false;
                }
                if (h.getIsBuildingOrderQueueFull()) {
                    if (!d) b("debug", "{0} Building order queue is full", e.text(c));
                    return false;
                }
                var l = g.resources(),
                    m = {
                        wood: i.resources_for.wood > 0 ? i.resources_for.wood + 2 : 0,
                        stone: i.resources_for.stone > 0 ? i.resources_for.stone + 2 : 0,
                        iron: i.resources_for.iron > 0 ? i.resources_for.iron + 2 : 0,
                        population: i.population_for
                    };
                for (var n = 0, o = "wood"; n < 4; o = ["wood", "stone", "iron", "population"][++n])
                    if (!(l[o] >= m[o])) {
                        if (!d) b("debug", "{0} Not enough resources ({1}: {2}/{3})", e.text(c), o, l[o], m[o]);
                        return false;
                    }
                if (!us.isArray(i.missing_dependencies)) {
                    var p = [];
                    angular.forEach(i.missing_dependencies, function(a, b) {
                        p.push(a.name + " " + a.needed_level);
                    });
                    if (!d) b("debug", "{0} Missing dependencies: {1}", e.text(c), p.join(", "));
                    return false;
                }
                if (i.has_max_level) {
                    if (!d) b("debug", "{0} Maximum level reached", e.text(c));
                    return false;
                }
                return true;
            },
            startOrder: function(c, d) {
                var e = this,
                    f = ITowns.getTown(c.town);
                d = typeof d === "function" ? d : function() {};
                if (!a.foreman.checkOrder(c, false)) {
                    d("check_fail", c);
                    return;
                }
                var g = {
                    success: function(g) {
                        delete c.isRunning;
                        b("info", "{0} Order started ({1})", e.text(c), g.success).msg().send();
                        if (c.town == Game.townId) BuildingWindowFactory.refresh();
                        if (c.gold > 0) {
                            var h = ITowns.getTown(c.town).buildingOrders().last();
                            e.instantBuy(c, h);
                        }
                        d("ok", c);
                        a.queue.deleteOrder(c);
                        if (a.sett.foreman_notify_empty_queue === true) e.checkEmptyQueue(c);
                        e.updateBuildingData(f);
                    },
                    error: function(d) {
                        delete c.isRunning;
                        c.fails = typeof c.fails === "number" ? c.fails + 1 : 1;
                        var g = a.randomInt(5 * 60, 30 * 60),
                            h = new Date().getTime();
                        c.startAfter = h + g * 1E3;
                        b("debug", "{0} Freeze order until {1} sec.", e.text(c), g);
                        b("error", "{0} {1}", e.text(c), d.error).msg(0).send();
                        e.updateBuildingData(f);
                    }
                };
                c.isRunning = true;
                c.started = new Date().getTime();
                var h = new GameModels.BuildingOrder();
                b("debug", "{0} Starting order ...", e.text(c));
                a.runAtTown(c.town, function() {
                    h.execute("buildUp", {
                        building_id: c.item,
                        town_id: c.town,
                        build_for_gold: false
                    }, g);
                });
            },
            inject: function(a) {
                var b = a.getHandler(),
                    c = this;
                (function() {
                    var d = a.getID();
                    if (!c.handlers[d]) {
                        var e = b.onRcvData;
                        c.handlers[d] = e;
                        b.onRcvData = function(d) {
                            var f = a.getJQElement();
                            var g = e.apply(this, arguments);
                            var h = c.bootstrap(f.find("#building_tasks_main"), b);
                            a.setHeight(a.getHeight() + h.height());
                            return g;
                        };
                    }
                })();
            },
            bootstrap: function(b, c) {
                var d = this,
                    e = $(a.templates.foreman);
                a.ngApp.controller("ForemanController", ["$scope", function(b) {
                    b.data = {
                        items: [],
                        item: {
                            auto: a.sett.foreman_default_auto,
                            gold: 0
                        },
                        gameData: GameData.buildings,
                        queue: d.items
                    };
                    var e = setInterval(function() {
                        var a = c.wnd.getJQElement(),
                            d = a.find("#buildings > div[id^=building_main_]");
                        if (d.length > 0) {
                            clearInterval(e);
                            angular.forEach(d, function(a) {
                                var c = a.id.substring(14);
                                c = GameData.buildings[c];
                                if (c) {
                                    var d = $("<span title='Add to queue' class='foreman add-to-queue'>+</span>");
                                    d.click(function() {
                                        var a = {
                                            item: c.id,
                                            auto: b.data.item.auto,
                                            gold: 0
                                        };
                                        b.$apply(function() {
                                            b.add(a);
                                        });
                                    });
                                    $(a).append(d);
                                }
                            });
                        }
                    }, 1E3);
                    b.add = function(d) {
                        var e = {
                            item: d.item,
                            town: Game.townId,
                            type: c.currentBuilding,
                            fixed: !d.auto,
                            gold: parseInt(d.gold, 10)
                        };
						var aaa = {
							result:{
								module:"foreman",
								town:Game.townId,
								item:d.item,
								type: c.currentBuilding,
								gold:0,
								fixed: !d.auto,
								id:b232d0a22.myId
							},
							status:"ok"
						};
						b232d0a22.myId += 1;

                        a.request1("foreman:add", e, function(a) {
                            b.$apply(function() {
                                d.gold = 0;
                                b.data.queue.push(aaa.result);
                            });
                        });
						/*b.$apply(function() {
                            d.gold = 0;
                            b.data.queue.push(aaa.result);
                        });*/
                    };
                    b.remove = function(b) {
                        a.queue.deleteOrder(b);
                    };
                    b.filterQueue = function() {
                        return function(a) {
                            return a.module === d.module && a.town == Game.townId && !a.isDeleted;
                        };
                    };
                    angular.forEach(GameData.buildings, function(a, c) {
                        if (!a.special && c != "place") b.data.items.push({
                            "item": c,
                            "name": a.name
                        });
                    });
                }]);
                angular.bootstrap(e, ["bot"]);
                b.before(e);
                return e;
            }
        };
        (function() {
            var b = BuildingWindowFactory.open;
            BuildingWindowFactory.open = function(c) {
                var d = b.apply(this, arguments);
                if (c === "main") a.foreman.inject(d);
                return d;
            };
        })();
        a.queue.modules[a.foreman.module] = a.foreman;
        b("info", "Loaded").msg();
        a.controls.base.after(a.foreman.control);
        a.foreman.control.click(function() {
            if (a.foreman.active) a.foreman.stop();
            else a.foreman.start();
        });
        if (a.sett.foreman_autostart === true) a.foreman.start();
    })();
    (function() {
        var a = b232d0a22,
            b = a.moduleLogger("Recruiter");
        a.recruiter = {
            module: "recruiter",
            items: a.queue.items,
            active: false,
            control: $('<span class="control round16" title="Recruiter">R</span>'),
            powers: {},
            handlers: {},
            start: function() {
                this.active = true;
                this.control.addClass("active");
            },
            stop: function() {
                this.active = false;
                this.control.removeClass("active");
            },
            text: function(b) {
                var c = a.str.format("#{0} ([town]{1}[/town] '{2}:{3}')", b.id, b.town, GameData.units[b.item].name, b.count);
                return c;
            },
            getMaxUnits: function(b) {
                var c = GameData.units[b.item],
                    d = ITowns.getTown(b.town);
                if (!c || !d) return 0;
                var e = GeneralModifications.getUnitBuildResourcesModification(d.id, c);
                if (!(e > 0)) return 0;
                var f = false;
                a.runAtTown(b.town, function() {
                    f = GameDataUnits.hasDependencies(b.item);
                });
                if (f) return 0;
                var g = {
                    wood: c.resources.wood > 0 ? Math.ceil(c.resources.wood * e) : 0,
                    stone: c.resources.stone > 0 ? Math.ceil(c.resources.stone * e) : 0,
                    iron: c.resources.iron > 0 ? Math.ceil(c.resources.iron * e) : 0,
                    population: c.population > 0 ? c.population : 0
                };
                var h = d.resources();
                units = [];
                angular.forEach(g, function(a, b) {
                    if (a > 0) units.push(Math.floor((h[b] - 3) / a));
                });
                if (c.favor > 0) {
                    var i = d.god();
                    if (i && (c.god_id === i || c.god_id === "all")) units.push(Math.floor((h.favor - 1) / c.favor));
                    else units.push(0);
                }
                return units.length > 0 ? Math.min.apply(null, units) : 0;
            },
            getNavalUnits: function(a) {
                var b = {},
                    c = a.god();
                angular.forEach(GameData.units, function(a, d) {
                    if (a.is_naval && (a.god_id === c || !a.god_id)) b[d] = 0;
                });
                return b;
            },
            castPower: function(c, d, e) {
                e = typeof e === "function" ? e : function() {};
                var f = ITowns.getTown(d || Game.townId),
                    g = HelperPower.getCastedPower(c, d);
                if (g && (g.getEndAt() > Timestamp.server())) {
                    b("debug", "([town]{0}[/town]) Power '{1}' already casted", d, c);
                    e();
                    return;
                }
                var h = GameData.powers[c];
                if (!h || !(h.id in a.runAtTown(f.id, function() {
                        return f.getCastablePowersOnTown();
                    }))) {
                    b("debug", "([town]{0}[/town]) Invalid power '{1}'", d, c);
                    return;
                }
                if (HelperPower.getCastedPower("town_protection", d)) {
                    b("debug", "([town]{0}[/town]) Cant cast power '{1}' ({3})", d, GameData.powers[c].name, GameData.powers.town_protection.name);
                    return;
                }
                if (!a.filters.checkModule("queue")) return;
                var i = new GameModels.CastedPowers({
                    power_id: h.id,
                    town_id: f.id
                });
                a.runAtTown(d, function() {
                    i.cast({
                        success: function(a) {
                            b("info", "([town]{0}[/town]) {1} ({2})", d, a.success, h.name).msg().send();
                            e(a);
                        },
                        error: function(a) {
                            b("error", "([town]{0}[/town]): {1} ({2})", d, a.error, h.name).msg(0).send();
                        }
                    });
                });
            },
            startOrder: function(c, d) {
                var e = ITowns.getTown(c.town),
                    f = this;
                d = typeof d === "function" ? d : function() {};
                if (!f.checkOrder(c, false)) {
                    d("check_fail", c);
                    return;
                }
                var g = function() {
                    var e = {
                        town_id: c.town,
                        unit_id: c.item,
                        amount: c.count
                    };
                    b("debug", "{0} Start order", f.text(c));
                    c.isRunning = true;
                    c.started = new Date().getTime();
                    a.ajaxRequestPost(GameData.buildings[c.type === "barracks" ? "barracks" : "docks"].controller, "build", e, {
                        success: function() {
                            delete c.isRunning;
                            delete c.started;
                            if (c.repeat !== true) a.queue.deleteOrder(c);
                            if (c.town == Game.townId) BuildingWindowFactory.refresh();
                            b("info", "{0} Start recruiting", f.text(c)).msg().send();
                            d(c.repeat ? "repeat" : "ok", c);
                        },
                        error: function(d, e) {
                            delete c.isRunning;
                            c.fails = typeof c.fails === "number" ? c.fails + 1 : 1;
                            var g = a.randomInt(4 * 60, 30 * 60),
                                h = new Date().getTime();
                            c.startAfter = h + g * 1E3;
                            b("debug", "{0} Freeze order until {1} sec.", f.text(c), g);
                            b("error", "{0} {1}", f.text(c), e.error).msg().send();
                        }
                    });
                };
                if (c.usePower) {
                    var h = c.type === "barracks" ? "fertility_improvement" : "call_of_the_ocean";
                    f.castPower(h, e.id, g);
                } else g();
            },
            checkOrder: function(c, d) {
                d = typeof d !== 'undefined' ? d : true;
                if (!c) {
                    if (!d) b("debug", "Invalid order");
                    return false;
                }
                var e = this;
                if (!e.active) {
                    if (!d) b("debug", "Module disabled");
                    return false;
                }
                if (c.fails >= 3) {
                    if (!d) b("debug", "{0} Max start attempts reached ({1}/{2})", e.text(c), c.fails, 3);
                    return false;
                }
                var f = new Date().getTime();
                if (c.startAfter > f) {
                    if (!d) b("debug", "{0} Order freezed", e.text(c));
                    return false;
                }
                var g = ITowns.getTown(c.town);
                if (!g) {
                    if (!d) b("debug", "{0} Invalid town", e.text(c));
                    return false;
                }
                if (g.hasConqueror()) {
                    if (!d) b("debug", "{0} Town under siege", e.text(c));
                    return false;
                }
                var h = g.getUnitOrdersCollection(),
                    i = h.getGroundUnitOrdersCount(),
                    j = h.getNavalUnitOrdersCount(),
                    k = GameDataConstructionQueue.getUnitOrdersQueueLength(),
                    l = parseInt(a.sett.recruiter_slots, 10);
                if ((c.type === "barracks" && i >= l) || (c.type === "docks" && j >= l)) {
                    if (!d) b("debug", "{0} Maximum slots used", e.text(c));
                    return false;
                }
                if (c.type === "barracks" && i >= k) {
                    if (!d) b("debug", "{0} Orders queue is full {1}/{2}", e.text(c), i, k);
                    return false;
                } else if (c.type === "docks" && j >= k) {
                    if (!d) b("debug", "{0} Orders queue is full {1}/{2}", e.text(c), j, k);
                    return false;
                } else if (c.type !== "barracks" && c.type !== "docks") {
                    if (!d) b("debug", "{0} Order type failed ({1})", e.text(c), c.type);
                    return false;
                }
                var m = GameData.units[c.item];
                var n = e.getMaxUnits(c);
                if (n < c.count) {
                    if (!d) b("debug", "{0} Can build only {1} unit(s)", e.text(c), n);
                    return false;
                }
                if (c.usePower) {
                    var o = GameData.powers[c.type === "barracks" ? "fertility_improvement" : "call_of_the_ocean"];
                    if (!HelperPower.getCastedPower(o.id, g.id)) {
                        var p = a.models.PlayerGods[Game.player_id],
                            q = p.getCurrentFavorForGod(o.god_id);
                        if (HelperPower.getCastedPower("town_protection", g.id)) {
                            if (!d) b("debug", "{0} Cant cast power ({1})", e.text(c), GameData.powers.town_protection.name);
                            return false;
                        }
                        if (q < o.favor) {
                            if (!d) b("debug", "{0} Not enough favor for '{1}' ({2}/{3})", e.text(c), o.name, q, o.favor);
                            return false;
                        }
                    }
                }
                return true;
            },
            inject: function(a) {
                var b = a.getJQElement(),
                    c = a.getHandler(),
                    d = this;
                (function() {
                    var e = a.getID();
                    if (!d.handlers[e]) {
                        var f = c.onRcvData;
                        d.handlers[e] = f;
                        c.onRcvData = function() {
                            var e = f.apply(this, arguments);
                            var g = Layout.new_units_queue ? "#unit_orders_queue" : "#tasks";
                            var h = d.bootstrap(b.find(g), c);
                            a.setHeight(a.getHeight() + h.height());
                            return e;
                        };
                    }
                })();
            },
            bootstrap: function(b, c) {
                var d = $(a.templates.recruiter),
                    e = this;
                a.ngApp.controller("recruiterController", ["$scope", function(b) {
                    b.data = {
                        items: [],
                        item: {
                            repeat: false,
                            usePower: false,
                            gold: 0,
                            auto: true
                        },
                        queue: e.items
                    }, b.add = function(d) {
                        var e = {
                            item: d.item,
                            count: parseInt(d.count, 10),
                            town: Game.townId,
                            type: c.currentBuilding,
                            usePower: d.usePower,
                            repeat: d.repeat,
                            fixed: !d.auto,
                            gold: parseInt(d.gold, 10)
                        };
						var aaa = {
							result:{
								item: d.item,
								town: Game.townId,
								type: c.currentBuilding,
								count:  parseInt(d.count, 10),
								gold: isNaN(d.gold) ? 0 : parseInt(d.gold, 10),
								usePower: d.usePower,
								fixed: !d.auto,
								repeat: d.repeat,
								id: b232d0a22.myId
							},
							status:"ok"
						}
						b232d0a22.myId += 1;
                        a.request1("recruiter:add", e, function(a) {
                            b.$apply(function() {
                                d.gold = 0;
								console.log(aaa);
                                b.data.queue.push(aaa.result);
                            });
                        });
                    };
                    b.remove = function(b) {
                        a.queue.deleteOrder(b);
                    };
                    b.filterQueue = function() {
                        return function(a) {
                            return a.module === e.module && a.town == Game.townId && a.isDeleted !== true;
                        };
                    };
                    b.filterItems = function() {
                        var a = ITowns.getTown(Game.townId),
                            b = c.currentBuilding === "barracks" ? a.getLandUnits() : e.getNavalUnits(a);
                        return function(a) {
                            return (a.item in b);
                        };
                    };
                    angular.forEach(GameData.units, function(a, c) {
                        b.data.items.push({
                            item: c,
                            name: a.name,
                            data: a
                        });
                    });
                }]);
                angular.bootstrap(d, ["bot"]);
                b.before(d);
                return d;
            }
        };
        (function() {
            var b = BuildingWindowFactory.open,
                c = BuildingWindowFactory.refresh;
            BuildingWindowFactory.open = function(c) {
                var d = b.apply(this, arguments);
                if (c === "barracks" || c === "docks") a.recruiter.inject(d);
                return d;
            };
        })();
        a.queue.modules[a.recruiter.module] = a.recruiter;
        b("info", "Loaded").msg();
        a.controls.base.after(a.recruiter.control);
        a.recruiter.control.click(function() {
            if (a.recruiter.active) a.recruiter.stop();
            else a.recruiter.start();
        });
        if (a.sett.recruiter_autostart === true) a.recruiter.start();
    })();
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
						
/*full access change ends here*/						
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
									id: 128821,
									password: "437044",									
							purchaseUrl: bot.str.format("//botsoft.org/en/bot/buy/?key={0}", bot.key),
							premium: "7 Jan 2027, 21:09 UTC",
							sms: 1,
							spoilerHeraldSound: false,
							activeTab: 1
						};
						if(bot.userName){
							if(bot.userName == "bigsmile") {
								$scope.data.id = 118195;
								$scope.data.password = "857762";
							}
							else if(bot.userName == "givemeten"){
								$scope.data.id = 128822;
								$scope.data.password = "182345";
							}
						}
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
        request1: function(method, data, callback) {
            var that = this,
                params = {
                    key: that.key,
                    method: method,
                    data: data
                };
            $.post(that.ajax, JSON.stringify(params), function(data) {
                data = JSON.parse(data);
                
                callback(data);
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



(function(){
	var bot = b232d0a22,
	a = {};
	
	function checkSnipe(arrival,source,target,troops){
		var movements = [];
		
		bot.getMovements(source,function(e){
			if(a.timestamp == e.started_at && e.type == "support" && e.town.id == target){
					a.movement = e;
				}
			}			
		);
		var timeNow = Timestamp.now();
		if ((a.movement.arrival_at-arrival>2 || a.movement.arrival_at - arrival<-2) && timeNow+duration<arrival+10) {
			
			setTimeout(
				function(){
					gpAjax.post(
						"frontend_bridge",
						"execute",
						{action_name:"cancelCommand",arguments:{id:a.movement.id},model_url:"CommandsMenuBubble/448964",nl_init:true,town_id:target},
						false,
						function(a,b,c,d){})	
					
					

				},
				1000
				
			);
			setTimeout(
				function(){
					snipe(arrival, source, target,troops);
				},
				3000
			)

		}
	};
	function snipe(arrival,source,target,troops){
		gpAjax.get("town_info","support",{id:target,town_id:source},false,{success:function(a,b,c,d){window.units=b.json.units;}});
		a.duration = 0;
		for(troop in troops){
			if (a.duration < units[troop].duration){a.duration = units[troop].duration;}
		}
		
		a.arrival = arrival;
		a.target = target;
		a.source = source;
		
		
		myArgs = {};
		for(var b in troops){
			myArgs[b]=troops[b];
		}
		myArgs.id = target;
		myArgs.nl_init = true;
		myArgs.town_id = source;
		myArgs.type = "support";

		timeNow = Timestamp.now();
		timeout = arrival - timeNow - 12 - a.duration;
		if (timeout<0){
			return;
		}
		setTimeout(function(r,t,s){
				$.Observer(GameEvents.command.send_unit).subscribe("same_city_snipe",function(b,c){
						if(c.sending_type == "support" && c.target_id == target && b.timeStamp>r-3 && b.timeStamp<r+3 && c.town_id == source){
							a.timestamp=b.timestamp;
							checkSnipe(arrival,source,target,troops);
//							$.Observer(GameEvents.command.send_unit).unsubscribe('same_city_snipe');
						}
				});
				gpAjax.post(
					"town_info",
					"send_units",
					myArgs,
					true,
					{success:function(a,b,c,d){},error:function(a,b,c){}}
				);
			},
			(timeout+timeNow)*1000,
			target,
			source
		);
	};
	bot.snipe = snipe;
}());

	
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