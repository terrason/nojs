var console = console || {
    log: function() {
        return false;
    },
    trace: function() {
        return false;
    },
    debug: function() {
        return false;
    },
    info: function() {
        return false;
    },
    warn: function() {
        return false;
    },
    error: function() {
        return false;
    }
};
(function(window, $) {
    var $application = function(context) {
        if ($.onApplicationStart && $.isFunction($.onApplicationStart)) {
            $.onApplicationStart();
        }
        for (var i in event.before) {
            $.isFunction(event.before[i]) && event.before[i].call($nojs, context);
        }
        for (var name in $application) {
            var app = $application[name];
            if (app.enable) {
                app.init(context);
            }
        }
        for (var i in event.ready) {
            $.isFunction(event.ready[i]) && event.ready[i].call($nojs, context);
        }
    };
    var $nojs = $application;
    $nojs.EVENT_POPUP_OPEN = "$nojs.popup.open";
    $nojs.EVENT_POPUP_CLOSE = "$nojs.popup.close";
    $nojs.EVENT_AUTHENTICATION_NAMESPACE = "$nojs.authentication";
    $nojs.EVENT_AUTHENTICATION_START = "$nojs.authentication.start";
    $nojs.EVENT_AUTHENTICATION_TERMINATE = "$nojs.authentication.terminate";
    $nojs.EVENT_AUTHENTICATION_CANCEL = "$nojs.authentication.cancel";
    $nojs.EVENT_AUTHENTICATION_DONE = "$nojs.authentication.done";
    $nojs.EVENT_AUTHENTICATION_FAIL = "$nojs.authentication.fail";

    var event = {
        before: [],
        ready: []
    };
    $nojs.before = function(func) {
        event.before.push(func);
    };
    $nojs.ready = function(func) {
        event.ready.push(func);
    };

    $application.statistical = {
        enable: $.fn.statistic,
        selector: ".statistical",
        init: function(context) {
            $(this.selector, context).statistic();
        }
    };
    $nojs.fileupload = {
        enable: $.fn.fileupload,
        selector: ".fileupload:file",
        init: function(context) {
            $(this.selector, context).each(function(i, fileInput) {
                var $progress = $('<div class="progress progress-striped active"><div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%"><span class="sr-only">0% Complete</span></div></div>');
                var $label = $('<p class="label"></p>');
                var $fileInput = $(fileInput);
                $fileInput.after($progress);
                $fileInput.after($label);
                $progress.hide();
            }).fileupload({
                url: ctx + "/upfile",
                dataType: 'json',
                replaceFileInput: false,
                formData: null,
                progress: function(e, data) {
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    var $progress = $(this).nextAll(".progress");
                    $progress.show();
                    $(".progress-bar", $progress).css('width', progress + '%').attr("aria-valuenow", progress);
                },
                add: function(e, data) {
                    data.context = $(this).nextAll(".label").text('Uploading...');
                    data.submit();
                },
                done: function(e, data) {
                    var result = data.result;
                    if (result.code < 0) {
                        window.alert("文件上传出错了！");
                        return;
                    }
                    var $fileInput = $(this);
                    $fileInput.nextAll("img.preview").attr("src", ctx + result.url);
                    var $form = $fileInput.parents("form");
                    $("[name=" + _replaceMetacharator($fileInput.data("bindName")) + "]", $form).val(result.filename);
                    $("[name=" + _replaceMetacharator($fileInput.data("bindValue")) + "]", $form).val(result.url);

                    data.context.text(result.filename);
                    $(this).nextAll(".progress").hide();
                }
            });
        }
    };
    $nojs.pagination = {
        enable: $.fn.pager,
        selector: ".pager-list",
        init: function(context) {
            $(this.selector, context).pager();
        }
    };
    $nojs.datetimepicker = {
        enable: $.fn.datetimepicker,
        selector: "input[type=datetime]",
        init: function(context) {
            $(this.selector, context).each(function(i, dt) {
                var $input = $(dt);
                var option = $input.data();
                $input.datetimepicker(option);
            });
        }
    };
    $nojs.nailing = {
        enable: $.fn.nails,
        selector: ".nailing",
        init: function(context) {
            $(this.selector, context).each(function() {
                var $nailing = $(this);
                $nailing.nails($nailing.data());
            });
        }
    };
    $nojs.alternate = {
        enable: true,
        selector: "table.alternate",
        option: {
            alterClass: "hilight",
            row: "tr:even"
        },
        init: function(context) {
            var module = this;
            $(this.selector, context).each(function() {
                var $table = $(this);
                var opt = $.extend({}, module.option, $table.data());
                $(opt.row, $table).addClass(opt.alterClass);
            });
        }
    };
    $nojs.hoverable = {
        enable: true,
        selector: ".hoverable,.tab1 tr",
        defaultHoverClass: "over",
        init: function(context) {
            var module = this;
            $(this.selector, context).mouseenter(function() {
                $(this).addClass($(this).data("hoverClass") || module.defaultHoverClass);
            }).mouseleave(function() {
                $(this).removeClass($(this).data("hoverClass") || module.defaultHoverClass);
            });
        }
    };
    $nojs.activable = {
        enable: true,
        selector: ".activable",
        defaultActiveClass: "activated",
        init: function(context) {
            var module = this;
            $(this.selector, context).mousedown(function() {
                var $this = $(this);
                var activeClass = $this.data("activeClass") || module.defaultActiveClass;
                $this.addClass(activeClass);
            }).mouseup(function() {
                var $this = $(this);
                var activeClass = $this.data("activeClass") || module.defaultActiveClass;
                $this.removeClass(activeClass);
            });
        }
    };
    $nojs.collapsible = {
        enable: true,
        context: null,
        selector: {
            context: ".collapsible",
            controller: "[for]"
        },
        collapsedClass: "collapsed",
        event: ["$nojs-collapsible-beforeExpand", "$nojs-collapsible-afterExpand", "$nojs-collapsible-beforeCollapses", "$nojs-collapsible-afterCollapses"],
        init: function(context) {
            this.context = context;
            var module = this;
            $(module.selector.context, context).each(function(i, thisContext) {
                $(module.selector.controller, thisContext).click(function() {
                    var $controller = $(this);
                    var $content = $("#" + $controller.attr("for"), thisContext);
                    var $thisContext = $(thisContext);
                    var collapsed = $thisContext.hasClass(module.collapsedClass);
                    if (collapsed) {//expand
                        $thisContext.trigger(module.event[0], module);
                        $thisContext.removeClass(module.collapsedClass);
                        $content.show();
                        $thisContext.trigger(module.event[1], module);
                    } else {//collapses
                        $thisContext.trigger(module.event[2], module);
                        $content.hide();
                        $thisContext.addClass(module.collapsedClass);
                        $thisContext.trigger(module.event[3], module);
                    }
                });
            });
        }
    };
    $nojs.sortable = {
        enable: $.fn.sortable,
        selector: {
            main: ".sortable",
            item: ".sortable-item",
            up: ".sortable-up",
            down: ".sortable-down",
            top: ".sortable-top",
            bottom: ".sortable-bottom"
        },
        option: {
            cursor: "move",
            placeholder: "list-group-item ui-state-highlight"
        },
        init: function(context) {
            var module = this;
            $(module.selector.main, context).each(function() {
                var $sortable = $(this);
                var opt = $.extend(module.option, $sortable.data());
                $sortable.sortable(opt);

                $(module.selector.up, $sortable).click(function() {
                    var $row = $(this).parents(module.selector.item);
                    var $prev = $row.prev();
                    $prev.before($row);
                });
                $(module.selector.down, $sortable).click(function() {
                    var $row = $(this).parents(module.selector.item);
                    var $next = $row.next();
                    $next.after($row);
                });
                $(module.selector.top, $sortable).click(function() {
                    var $row = $(this).parents(module.selector.item);
                    $sortable.prepend($row);
                });
                $(module.selector.bottom, $sortable).click(function() {
                    var $row = $(this).parents(module.selector.item);
                    $sortable.append($row);
                });
            });
        }
    };
    $nojs.selectable = {
        enable: $.fn.selectable,
        selector: ".selectable",
        option: {},
        init: function(context) {
            $(this.selector, context).selectable();
        }
    };
    $nojs.moveable = {
        enable: false,
        selector: ".moveable",
        option: {
            target: "tr",
            move: "top"
        },
        init: function(context) {
            var opt = this.option;
            $(this.selector, context).click(function() {
                var $this = $(this);
                var option = $.extend({}, opt, $this.data());
                var $target = $this.parents(option.target);
                var $container = $target.parent();
                switch (option.move) {
                    case "top" :
                        $container.prepend($target);
                        break;
                    case "bottom":
                        $container.append($target);
                        break;
                }
            });
        }
    };
    $nojs.checkboxBonds = {
        enable: true,
        chkAll: "#chkAll",
        pks: "[name=pks]:checkbox:not(:disabled)",
        //pks: "[name=pks]:checkbox",
        render: ":button[data-confirm-require=pks]",
        init: function(context) {
            var $pks = $(this.pks, context);
            var $chkAll = $(this.chkAll, context);
            var $render = $(this.render, context);
            $pks.click(function() {
                $chkAll.prop("checked", $pks.length === $pks.filter(":checked").length);
                $render.prop("disabled", $pks.filter(":checked").length === 0);
            });
            $chkAll.click(function() {
                $pks.prop("checked", $(this).prop("checked"));
                $render.prop("disabled", $pks.filter(":checked").length === 0);
                $pks.change();
            });
            $render.prop("disabled", $pks.filter(":checked").length === 0);
        }
    };
    $nojs.checkboxTogether = {
        enable: true,
        selector: "input:checkbox[data-member]",
        $member: function($leader, context) {
            var memberName = $leader.data("member");
            return $("input:checkbox[name=" + memberName + "]:not(:disabled)", context);
        },
        render: function($leader, $member, context) {
            var $render = $leader.data("$render");
            if ($render === false) {
                return;
            }
            if (!$render) {
                var memberName = $leader.data("member");
                $render = $(":button[data-checkbox-require=" + memberName + "]");
                if ($render.length === 0) {
                    $leader.data("$render", false);
                    return;
                } else {
                    $leader.data("$render", $render);
                }
            }
            $render.prop("disabled", $member.filter(":checked").length === 0);
        },
        init: function(context) {
            var module = this;
            $(module.selector, context).each(function() {
                var $leader = $(this);
                var $member = module.$member($leader, context);
                $leader.change(function() {
                    $member.prop("checked", $leader.prop("checked"));
                    module.render($leader, $member, context);
                });
                $member.change(function() {
                    $leader.prop("checked", $member.length === $member.filter(":checked").length);
                    module.render($leader, $member, context);
                });
                module.render($leader, $member, context);
            });
        }
    };
    $nojs.validation = {
        enable: $.fn.validate,
        selector: "form.validate",
        init: function(context) {
            var $form = $(this.selector, context);
            var option = {
                highlight: false,
                unhighlight: false,
                errorElement: 'div',
                errorClass: 'tip error',
                errorPlacement: function(error, element) {
                    $(element).parent().before(error);
                }
            };
            $form.each(function() {
                var $form = $(this);
                var validation = $form.validate($.extend(option, $form.data()));
            });
        }
    };
    $nojs.selectValueInitialization = {
        enable: true,
        selector: "select",
        event: "$nojs-select-initialize",
        init: function(context) {
            $(this.selector, context).on(this.event, function(event) {
                var $select = $(this);
                var value = $select.data("value");
                if (value !== undefined) {
                    $select.children("option:selected").prop("selected", false);
                    $select.children("option[value=" + value + "]").prop("selected", true);
                }
                var autofire = $select.data("autofire");
                if (autofire) {
                    $select.change();
                }
            }).trigger(this.event);
        }
    };
    $nojs.dropdownValueBind = {
        enable: $.fn.dropdown,
        selector: "[data-toggle=dropdown][data-value]",
        event: "change.$nojs-dropdown",
        init: function(context) {
            var module = this;
            $(module.selector, context).each(function() {
                var $trigger = $(this);
                var value = $trigger.data("value");
                if (value) {
                    var $value = $trigger.next().find("[data-value=" + value + "]");
                    if ($value.length) {
                        module.setText($trigger, $value.text());
                    }
                    module.setValue($trigger,value);
                }

                $trigger.next().find("[data-value]").click(function() {
                    var $this = $(this);
                    module.setText($trigger, $this.text());
                    module.setValue($trigger, $this.data("value"));
                });
            });
        },
        setText: function($trigger, text) {
            $(":text", $trigger).val(text);
        },
        setValue: function($trigger, value) {
            var $value = $("input:hidden", $trigger);

            var oldValue = $value.val();
            $("input:hidden", $trigger).val(value||"");
            $trigger.trigger("change", oldValue);
        }
    };
    $nojs.trimText = {
        enable: true,
        selector: ":text:not([data-skip-trim])",
        init: function(context) {
            $(this.selector, context).change(function() {
                this.value = $.trim(this.value);
            });
        }
    };
    $nojs.resetLookup = {
        enable: true,
        selector: {
            reset: ".reset",
            control: ":input",
            form: "form.lookup"
        },
        init: function(context) {
            var $lookupForm = $(this.selector.form, context);
            var controlSelector = this.selector.control;
            $(this.selector.reset, $lookupForm).click(function() {
                $(controlSelector, $lookupForm).val("");
                $lookupForm.submit();
            });
        }
    };
    $nojs.action = {
        enable: true,
        init: function(context) {
            for (var name in this) {
                var module = this[name];
                if (module && module.init) {
                    module.init(context);
                }
            }
        },
        addModule: function(name, module) {
            if (module && module.init) {
                this[name] = module;
            }
        },
        removeModule: function(name) {
            this[name] = undefined;
        },
        get: {
            selector: ".action-get",
            init: function(context) {
                $(this.selector, context).click(function() {
                    var $button = $(this);
                    var confirmRequire = $button.data("confirmRequire");
                    if (confirmRequire) {
                        var $requiremence = $(confirmRequire, context);
                        if ($requiremence.length === 0) {
                            window.alert($button.data("confirmRequireMessage") || "未满足操作条件");
                            return;
                        }
                    }
                    var confirm = $button.data("confirm");
                    if (confirm) {
                        if (typeof (confirm) === "boolean") {
                            confirm = "您确定要执行此项操作吗？";
                        }
                        if (!window.confirm(confirm)) {
                            return;
                        }
                    }
                    window.location = ($button.data("href") || $button.data("get")) + "?" + $.param($button.data());
                });
            }
        },
        post: {
            selector: ".action-post",
            init: function(context) {
                $(this.selector, context).click(function() {
                    var $this = $(this);
                    var confirmRequire = $this.data("confirmRequire");
                    if (confirmRequire) {
                        var $requiremence = $(confirmRequire, context);
                        if ($requiremence.length === 0) {
                            window.alert($this.data("confirmRequireMessage") || "未满足操作条件");
                            return;
                        }
                    }
                    var confirm = $this.data("confirm");
                    if (confirm) {
                        if (typeof (confirm) === "boolean") {
                            confirm = "您确定要执行此项操作吗？";
                        }
                        if (!window.confirm(confirm)) {
                            return;
                        }
                    }

                    var $form = $this.parents("form");
                    var formSelector = $this.data("form");
                    if (formSelector) {
                        $form = $(formSelector, context);
                    }
                    if (!$form.length) {
                        $form = $('<form method="post"></form>');
                        $this.parent().append($form);
                    }
                    var post = $this.data("post") || $this.data("href");
                    if (post) {
                        $form.attr("action", post);
                    }
                    $form.attr("method", "post");
                    var data = $this.data();
                    $.each(data, function(key, value) {
                        if (value) {
                            var $input = $("<input type=\"hidden\" class=\"help\"/>");
                            $form.append($input);
                            $input.attr("name", key);
                            $input.val(value);
                        }
                    });
                    $form.submit();
                    $(".help:hidden", $form).remove();
                });
            }
        },
        /**
         * @deprecated Use $nojs.dialog instead.
         */
        dialog: {
            selector: ".action-dialog",
            init: function(context) {
                $(this.selector, context).click(function() {
                    var $actionButton = $(this);
                    var data = $actionButton.data();
                    var option = $.extend({
                        lock: true,
                        okValue: "保存",
                        ok: function() {
                            var $form = $("form", this.dom.content);
                            $form.find("button[type=submit]").click();
                            return false;
                        },
                        cancelValue: "取消",
                        cancel: function() {
                            return true;
                        }
                    }, data);
                    if (data.readonly) {
                        option.ok = undefined;
                    }
                    var dialog = $.dialog(option);
                    $.ajax({
                        url: data.url,
                        dataType: "html",
                        cache: false,
                        data: data
                    }).done(function(data, textStatus, jqXHR) {
                        var $dialog = $(data);
                        dialog.content($dialog[0]);
                        var $form = $dialog.is("form") ? $dialog : $("form", $dialog);
                        $form.attr("action", option.dialogUrl || option.url);
                        $nojs(dialog.dom.content);
                    });
                });
            }
        }
    };
    $application.dialog = {
        enable: $.dialog,
        selector: ".dialog",
        event: {
            remoteContentReady: "application.dialog.remote.ready"
        },
        ok: function() {
            var $form = $("form", this.dom.content);
            $form.find("button[type=submit]").click();
            return false;
        },
        cancel: function() {
            return true;
        },
        ready: function() {
            $application(this.dom.content);
        },
        init: function(context) {
            var thisModule = this;
            $(thisModule.selector, context).click(function() {
                var $actionButton = $(this);
                var data = $actionButton.data();
                var option = $.extend({
                    lock: true,
                    okValue: "保存",
                    ok: thisModule.ok,
                    cancelValue: "取消",
                    cancel: thisModule.cancel
                }, data);
                if (data.readonly) {
                    option.ok = undefined;
                }
                var dialog = $.dialog(option);
                $.ajax({
                    url: option.url,
                    dataType: "html",
                    cache: false,
                    data: data
                }).done(function(data, textStatus, jqXHR) {
                    var $dialog = $(data);
                    dialog.content($dialog[0]);
                    var $form = $dialog.is("form") ? $dialog : $("form", $dialog);
                    var action = $form.attr("action");
                    if (!action || action === "")
                        $form.attr("action", option.dialogUrl || option.url);
                    thisModule.ready.call(dialog);
                    $actionButton.trigger(thisModule.event.remoteContentReady, {module: thisModule, dialog: dialog, $content: $dialog, $form: $form});
                });
            });
        }
    };

    function _replaceMetacharator(metastring) {
        if (metastring && metastring.length)
            return metastring.replace(/[.]/, "\\.");
        else {
            return "";
        }
    }
    //Copy from jQuery.
    window.$application = window.$nojs = $application;
    if (typeof define === "function" && define.amd && define.amd.$nojs) {
        define("$nojs", [], function() {
            return $nojs;
        });
    }
})(window, jQuery);

$(document).ready(function() {

    $.fn.extend({
        pushData: function(name, value) {
            var data = this.data(name);
            if (!data) {
                data = new Array();
                this.data(name, data);
            }
            $.isArray(data) && (value || value === false) && data.push(value);
        }
    });

    window.$nojs(document);
});