var console = console || {
    log: function () {
        return false;
    },
    trace: function () {
        return false;
    },
    debug: function () {
        return false;
    },
    info: function () {
        return false;
    },
    warn: function () {
        return false;
    },
    error: function () {
        return false;
    }
};
(function (window, $) {
    var $application = function (context) {
        if ($.onApplicationStart && $.isFunction($.onApplicationStart)) {
            $.onApplicationStart();
        }
        for (var i in event.before) {
            $.isFunction(event.before[i]) && event.before[i].call($nojs, context);
        }
        for (var name in $application) {
            var app = $application[name];
            if ($.isFunction(app.enable) ? app.enable() : app.enable === true) {
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
    $nojs.before = function (func) {
        event.before.push(func);
    };
    $nojs.ready = function (func) {
        event.ready.push(func);
    };

    $application.statistical = {
        enable: function () {
            return !!$.fn.statistic;
        },
        selector: ".statistical",
        init: function (context) {
            $(this.selector, context).statistic();
        }
    };
    $nojs.fileupload = {
        enable: function () {
            return !!$.fn.fileupload;
        },
        selector: ".fileupload:file:not([multiple])",
        progress: {
            $progress: null,
            $progressBar: null,
            $progressText: null,
            setValue: function (value) {
                this.$progressBar.css("width", value + "%");
                this.$progressText.text(value + "%");
            }
        },
        init: function (context) {
            var module = this;
            $(this.selector, context).each(function (i, fileInput) {
                var $progress = $('<div class="progress progress-striped"><div class="progress-bar" style="width:0%"><span class="sr-only">0%</span></div></div>');
                var $label = $('<p class="label"></p>');
                var $fileInput = $(fileInput);
                $fileInput.attr("name", "upfile");
                $fileInput.after($progress);
                $fileInput.after($label);
                $progress.hide();
                var progress = {
                    $progress: $progress,
                    $progressBar: $progress.children(),
                    $progressText: $progress.children().children()
                };
                $fileInput.data("nojs.fileupload.progress", $.extend({}, module.progress, progress));
                $fileInput.data("nojs.fileupload.$statusBar", $label);

                var $form = $fileInput.parents("form");
                var $displayValue = $("[name=" + _replaceMetacharator($fileInput.data("displayValue")) + "]", $form);
                var $displayId = $("[name=" + _replaceMetacharator($fileInput.data("displayId")) + "]", $form);
                $fileInput.data("nojs.fileupload.display.$name", $("[name=" + _replaceMetacharator($fileInput.data("displayName")) + "]", $form));
                $fileInput.data("nojs.fileupload.display.$value", $displayValue);
                $fileInput.data("nojs.fileupload.display.$size", $("[name=" + _replaceMetacharator($fileInput.data("displaySize")) + "]", $form));
                $fileInput.data("nojs.fileupload.display.$id", $displayId);

                var needPreview = $fileInput.data("preview");
                if (needPreview === true) {
                    var $preview = $('<img class="preview"/>');
                    $fileInput.after($preview);
                    $fileInput.data("nojs.fileupload.$preview", $preview);
                    if ($displayId.val()) {
                        $preview.attr("src", ctx + "/ajax/upfile/" + $displayId.val());//TODO attachement
                    } else if ($displayValue.val()) {
                        $preview.attr("data-src", $displayValue.val());
                        $preview.trigger("change");
                    } else {
                        $preview.hide();
                    }
                }

                $fileInput.fileupload({
                    url: $fileInput.data("url") || (ctx + "/ajax/upfile"),
                    replaceFileInput: false,
                    dataType: 'json',
                    formData: null,
                    progressall: function (e, data) {
                        var progress = parseInt(data.loaded / data.total * 100, 10);
                        $(this).data("nojs.fileupload.progress").setValue(progress);
                    },
                    add: function (e, data) {
                        data.fileInput.data("nojs.fileupload.$statusBar").text('Uploading...');
                        data.fileInput.data("nojs.fileupload.progress").setValue(0);
                        data.fileInput.data("nojs.fileupload.progress").$progress.show();
                        var validator = data.fileInput.parents("form").data("validator");
                        if (validator) {
                            if (!validator.element(data.fileInput[0])) {
                                return false;
                            }
                        }
                        data.submit();
                    },
                    done: function (e, data) {
                        var result = data.result;
                        if (result.code < 0) {
                            if (result.message) {
                                window.alert("文件上传失败！" + result.message);
                            } else {
                                window.alert("文件上传出错了！");
                            }
                            return;
                        }
                        data.fileInput.trigger("uploadSuccess", result);
                        var $preview = data.fileInput.data("nojs.fileupload.$preview");
                        if ($preview) {
                            $preview.show();
                            $preview.attr("data-src", result.value);
                            $preview.trigger("change");
                        }

                        var $displayName = data.fileInput.data("nojs.fileupload.display.$name");
                        var $displayValue = data.fileInput.data("nojs.fileupload.display.$value");
                        var $displaySize = data.fileInput.data("nojs.fileupload.display.$size");
                        var $displayId = data.fileInput.data("nojs.fileupload.display.$id");
                        $displayName.val(data.originalFiles[0].name);
                        $displayValue.val(result.value);
                        $displaySize.val(result.size);
                        $displayId.val(result.id);
                        var validator = $displayValue.parents("form").data("validator");
                        if (validator) {
                        	if($displayValue[0]){
                        		validator.element($displayValue[0]);
                        }
                        	if($displayId[0]){
                        		validator.element($displayId[0]);
                        	}
                        }

                        data.fileInput.data("nojs.fileupload.$statusBar").hide();
                        data.fileInput.data("nojs.fileupload.progress").$progress.hide();
                    }
                });
            });
        }
    };
    $nojs.fileuploadMultiple = {
        enable: function () {
            return !!$.fn.fileupload;
        },
        selector: ".fileupload:file[multiple]",
        options: {
            showProgress: true,
            showLabel: true,
            showPreview: true,
            schema: "string"
        },
        event: ["addfile.$nojs-fileupload", "removefile.$nojs-fileupload"],
        $template: {
            $progress: $('<div class="progress progress-striped"><div class="progress-bar" style="width:0%"><span class="sr-only">0%</span></div></div>'),
            $label: $('<p class="label"></p>'),
            $preview: $('<div class="clearfix preview"></div>'),
            $previewItem: $('<div class="clearfix preview-item"><button type="button" class="close">&times;</button><img class="img-responsive"/></div>')
        },
        progress: function ($progress) {
            this.$progress = $progress;
            this.setValue = function (value) {
                this.$progress.show();
                var $progressBar = this.$progress.find(".progress-bar");
                $progressBar.css("width", value + "%");
                $progressBar.children().text(value + "%");
            };
            this.show = function () {
                this.setValue(0);
                this.$progress.show();
            };
            this.hide = function () {
                this.$progress.hide();
            };
        },
        label: function ($label) {
            this.$label = $label;
            this.setText = function (txt) {
                this.$label.text(txt);
                this.$label.show();
            };
            this.show = function () {
                this.$label.show();
            };
            this.hide = function () {
                this.$label.hide();
            };
        },
        preview: function ($preview, options) {
            this.options = options;
            this.$preview = $preview;
            this.addImage = function (id) {
                var preview = this;
                var $previewItem = $nojs.fileuploadMultiple.$template.$previewItem.clone();
                $previewItem.data("value", id);
                $previewItem.attr("id", id);
                var $img = $previewItem.find("img");
                $img.attr("src", this.getPreviewUrl(id));
                $img.attr("title", "attachment-" + id);
                if (preview.options.previewWidth) {
                    $img.css("width", preview.options.width);
                }
                if (preview.options.previewHeight) {
                    $img.css("height", preview.options.height);
                }
                $previewItem.find("button.close").click(function () {
                    preview.options.$element.trigger("removefile", id);
                });
                this.$preview.append($previewItem);
                return $previewItem;
            };
            this.removeImage = function (id) {
                this.$preview.find("#" + id).remove();
            };

            this.getPreviewUrl = function (id) {
                return ctx + "/ajax/upfile/" + id;//TODO attachment
            };
        },
        schema: {
            string: {
                init: function ($value, preview) {
                    var originValue = $value.val();
                    if (originValue) {
                        var values = originValue.split(",");
                        for (var i = 0; i < values.length; i++) {
                            preview.addImage(values[i]);
                        }
                    }
                },
                addValue: function ($value, value, preview) {
                    var originValue = $value.val();
                    if (originValue) {
                        $value.val(originValue + "," + value);
                    } else {
                        $value.val(value);
                    }
                    if ($value.parents("form").data("validator")) {
                        $value.parents("form").validate().element($value[0]);
                    }
                    preview.addImage(value);
                },
                removeValue: function ($value, value, preview) {
                    var originValue = $value.val();
                    if (originValue) {
                        var pieces = originValue.split(",");
                        var newValue = "";
                        for (var i = 0; i < pieces.length; i++) {
                            var cur = pieces[i];
                            var valueStr = value + "";

                            if (cur === valueStr) {
                                continue;
                            }
                                newValue += (pieces[i] + ",");
                            }
                        if (newValue.length) {
                            newValue = newValue.substr(0, newValue.length - 1);
                        }
                        $value.val(newValue);
                    }
                    preview.removeImage(value);
                }
            }
        },
        init: function (context) {
            var module = this;
            $(this.selector, context).each(function (i, fileInput) {
                var $fileInput = $(fileInput);
                $fileInput.attr("name", "upfile");

                var opt = $.extend({}, module.options, $fileInput.data());
                opt.$element = $fileInput;
                var progress = {
                    setValue: function () {
                    }, show: function () {
                    }, hide: function () {
                    }};
                if (opt.showProgress) {
                    var $progress = module.$template.$progress.clone();
                    $fileInput.after($progress);
                    $progress.hide();
                    progress = new module.progress($progress);
                }
                $fileInput.data("nojs.fileupload.progress", progress);

                var label = {setText: function () {
                    }, show: function () {
                    }, hide: function () {
                    }};
                if (opt.showLabel) {
                    var $label = module.$template.$label.clone();
                    $fileInput.after($label);
                    $label.hide();
                    label = new module.label($label);
                }
                $fileInput.data("nojs.fileupload.label", label);

                var preview = {addImage: function () {
                    }, removeImage: function () {
                    }};
                if (opt.showPreview) {
                    var $preview = module.$template.$preview.clone();
                    $fileInput.after($preview);
                    preview = new module.preview($preview, opt);
                }
                $fileInput.data("nojs.fileupload.preview", preview);

                var $form = $fileInput.parents("form");
                var $displayId = $("[name=" + _replaceMetacharator($fileInput.data("displayId")) + "]", $form);

                var schema = module.schema[opt.schema];
                if (!schema) {
                    console.warn("nojs.fileupload dosn't recognize the schema:" + opt.schema);
                    return;
                }
                schema.init($displayId, preview);
                $fileInput.on("addfile", function (event, value) {
                    schema.addValue($("[name=" + _replaceMetacharator($fileInput.data("displayId")) + "]", $form), value, preview);
                });
                $fileInput.on("removefile", function (event, value) {
                    schema.removeValue($("[name=" + _replaceMetacharator($fileInput.data("displayId")) + "]", $form), value, preview);
                });

                $fileInput.fileupload({
                    url: $fileInput.data("url") || (ctx + "/ajax/upfile"),
                    replaceFileInput: false,
                    dataType: 'json',
                    sequentialUploads: true,
                    formData: null,
                    progressall: function (e, data) {
                        var progressValue = parseInt(data.loaded / data.total * 100, 10);
                        progress.setValue(progressValue);
                    },
                    add: function (e, data) {
                        var validator = data.fileInput.parents("form").data("validator");
                        if (validator) {
                            if (!validator.element(data.fileInput[0])) {
                                return false;
                            }
                        }
                        label.setText('Uploading...');
                        progress.show();
                        data.submit();
                    },
                    done: function (e, data) {
                        var result = data.result;
                        if (result.code < 0) {
                            if (result.message) {
                                window.alert("文件上传失败！" + result.message);
                            } else {
                                window.alert("文件上传出错了！");
                            }
                            return;
                        }
                        data.fileInput.trigger("addfile", result.id);

                        label.hide();
                        progress.hide();
                    }
                });
            });
        }
    };
    $nojs.pagination = {
        enable: function () {
            return !!$.fn.pager;
        },
        selector: ".pager-list",
        init: function (context) {
            $(this.selector, context).pager();
        }
    };
    $nojs.wysiwygEditor = {
        enable: function () {
            return !!$.fn.ace_wysiwyg;
        },
        selector: ".wysiwyg-editor",
        options: {
            toolbar: [
                {name: 'font', title: "字体"},
                null,
                {name: 'fontSize', title: "字号"},
                null,
                {name: 'bold', className: 'btn-info', title: "粗体"},
                {name: 'italic', className: 'btn-info', title: "斜体"},
                {name: 'strikethrough', className: 'btn-info', title: "删除线"},
                {name: 'underline', className: 'btn-info', title: "下划线"},
                null,
                {name: 'insertunorderedlist', className: 'btn-success', title: "无序列表"},
                {name: 'insertorderedlist', className: 'btn-success', title: "有序列表"},
                {name: 'outdent', className: 'btn-purple', title: "增加缩进"},
                {name: 'indent', className: 'btn-purple', title: "减少缩进"},
                null,
                {name: 'justifyleft', className: 'btn-primary', title: "左对齐"},
                {name: 'justifycenter', className: 'btn-primary', title: "居中"},
                {name: 'justifyright', className: 'btn-primary', title: "右对齐"},
                {name: 'justifyfull', className: 'btn-inverse', title: "两端对齐"},
                null,
                {name: 'createLink', className: 'btn-pink', title: "加入超链接"},
                {name: 'unlink', className: 'btn-pink', title: "移除超链接"},
                null,
                {name: 'insertImage', className: 'btn-success', title: "插入图片"},
                null,
                {name: 'foreColor', title: "颜色"},
                null,
                {name: 'undo', className: 'btn-grey', title: "撤销"},
                {name: 'redo', className: 'btn-grey', title: "重做"}
            ]
        },
        init: function (context) {
            var module = this;
            $(module.selector, context).each(function () {
                var $editor = $(this);
                var opt = $.extend({}, module.options, $editor.data());
                $editor.ace_wysiwyg(opt);

                var $form = $editor.closest("form");
                var $input = $("[name=" + opt.bindInput + "]", $form);
                $form.submit(function () {
                    $input.val($editor.cleanHtml());
                });
            });
        }
    };


    $nojs.WdatePicker = {
        enable: function () {
            return !!window.WdatePicker;         //jquery.ui
        },
        selector: "input.Wdate",
        init: function (context) {
            $(this.selector, context).each(function (i, dt) {
                var $input = $(dt);
                var option = $input.data();
                $input.click(function () {
                    WdatePicker.call(dt, option);
                });
            });
        }
    };

    $nojs.datetimepicker = {
        enable: function () {
            return !!$.fn.datetimepicker;
        },
        options: {
            autoclose: true,
            language: "zh-CN"
        },
        selector: "input[type=datetime]",
        init: function (context) {
            var module = this;
            $(this.selector, context).each(function (i, dt) {
                var $input = $(dt);
                var option = $.extend({}, module.options, $input.data());
                $input.datetimepicker(option);

                $input.next("[class*=icon-]").click(function () {
                    $input.focus();
            });
            });
        }
    };
    $nojs.timepicker = $.extend(true, {}, $nojs.datetimepicker, {
        options: {
            format: "HH:ii",
            startView: 1,
            maxView: 1
        },
        selector: "input[type=time]"
    });
    $nojs.nailing = {
        enable: function () {
            return !!$.fn.nails;
        },
        selector: ".nailing",
        init: function (context) {
            $(this.selector, context).each(function () {
                var $nailing = $(this);
                $nailing.nails($nailing.data());
            });
        }
    };
    $nojs.alternate = {//隔行变色
        enable: true,
        selector: "table.alternate",
        option: {
            alterClass: "hilight",
            row: "tr:even"
        },
        init: function (context) {
            var module = this;
            $(this.selector, context).each(function () {
                var $table = $(this);
                var opt = $.extend({}, module.option, $table.data());
                $(opt.row, $table).addClass(opt.alterClass);
            });
        }
    };
    $nojs.hoverable = {//hover变色
        enable: true,
        selector: ".hoverable,.tab1 tr",
        defaultHoverClass: "over",
        init: function (context) {
            var module = this;
            $(this.selector, context).mouseenter(function () {
                $(this).addClass($(this).data("hoverClass") || module.defaultHoverClass);
            }).mouseleave(function () {
                $(this).removeClass($(this).data("hoverClass") || module.defaultHoverClass);
            });
        }
    };
    $nojs.activable = {//按下变色
        enable: true,
        selector: ".activable",
        defaultActiveClass: "activated",
        init: function (context) {
            var module = this;
            $(this.selector, context).mousedown(function () {
                var $this = $(this);
                var activeClass = $this.data("activeClass") || module.defaultActiveClass;
                $this.addClass(activeClass);
            }).mouseup(function () {
                var $this = $(this);
                var activeClass = $this.data("activeClass") || module.defaultActiveClass;
                $this.removeClass(activeClass);
            });
        }
    };
    $nojs.collapsible = {//折叠还示
        enable: true,
        context: null,
        selector: {
            context: ".collapsible",
            controller: "[for]"
        },
        collapsedClass: "collapsed", //+折叠
        event: ["$nojs-collapsible-beforeExpand", "$nojs-collapsible-afterExpand", "$nojs-collapsible-beforeCollapses", "$nojs-collapsible-afterCollapses"],
        init: function (context) {
            this.context = context;
            var module = this;
            $(module.selector.context, context).each(function (i, thisContext) {
                $(module.selector.controller, thisContext).click(function () {
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
    $nojs.sortable = {//排序模块
        enable: function () {
            return !!$.fn.sortable;
        },
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
        init: function (context) {
            var module = this;
            $(module.selector.main, context).each(function () {
                var $sortable = $(this);
                var opt = $.extend(module.option, $sortable.data());
                $sortable.sortable(opt);

                $(module.selector.up, $sortable).click(function () {
                    var $row = $(this).parents(module.selector.item);
                    var $prev = $row.prev();
                    $prev.before($row);
                });
                $(module.selector.down, $sortable).click(function () {
                    var $row = $(this).parents(module.selector.item);
                    var $next = $row.next();
                    $next.after($row);
                });
                $(module.selector.top, $sortable).click(function () {
                    var $row = $(this).parents(module.selector.item);
                    $sortable.prepend($row);
                });
                $(module.selector.bottom, $sortable).click(function () {
                    var $row = $(this).parents(module.selector.item);
                    $sortable.append($row);
                });
            });
        }
    };
    $nojs.imgsource = {//更换img源
        enable: function () {
            return !!window.srx;
        },
        selector: "img[data-src]",
        handler:function(){
                var $img = $(this);
                var src = $img.attr("data-src");
                if (src) {
                if (/^(http|https|ftp):\/\/.*/.test(src)) {
                    $img.attr("src", src);
                } else {
                    $img.attr("src", window.srx + src);
                }
            }
        },
        init: function (context) {
        	$(document).on("change","img[data-src]",function(){
        		module.handler.call($(this));
            });
            var module = this;
            $(module.selector, context).each(function () {
                $(this).trigger("change");
            });
        }
    };
    $nojs.attachment = {//更换img源
        enable: function () {
            return !!window.srx;
        },
        selector: "img[data-attachment]",
        init: function (context) {
            var module = this;
            $(module.selector, context).each(function () {
                var $img = $(this);
                var src = $img.attr("data-attachment");
                if (src) {
                    if (/^(http|https|ftp):\/\/.*/.test(src)) {
                        $img.attr("src", src);
                    } else if (src === "0") {
                    } else {
                        $img.attr("src", ctx + "/ajax/upfile/" + src);
                    }
                }
            });
        }
    };
    $nojs.ahref = {//更换img源
        enable: function () {
            return !!window.srx;
        },
        selector: "a[data-href]",
        init: function (context) {
            var module = this;
            $(module.selector, context).each(function () {
                var $img = $(this);
                var src = $img.attr("data-href");
                if (src) {
                    if (/^(http|https|ftp):\/\/.*/.test(src)) {
                        $img.attr("href", src);
                    } else {
                        $img.attr("href", window.srx + src);
                    }
                }
            });
        }
    };
    $nojs.slider = {//滑块
        enable: function () {
            return !!$.fn.slider;
        },
        selector: ".slider",
        option: {
            slide: function (event, ui) {
                var $slider = $(this);
                var display = $slider.data("nojs.slider.display");
                if ($.isArray(display)) {
                    display[0].text(ui.values[0]);
                    display[1].text(ui.values[1]);
                } else if (display) {
                    display.text(ui.value);
                }

                var val = $slider.data("nojs.slider.val");
                if ($.isArray(val)) {
                    val[0].val(ui.values[0]);
                    val[1].val(ui.values[1]);
                } else if (val) {
                    val.val(ui.value);
                }
            }
        },
        init: function (context) {
            var module = this;
            $(module.selector, context).each(function () {
                var $slider = $(this);
                var opt = $.extend({}, module.option, $slider.data());
                if (opt.range) {
                    var displayMinSelector = $slider.data("displayMin");
                    var displayMaxSelector = $slider.data("displayMax");
                    var display = [$(displayMinSelector, context), $(displayMaxSelector, context)];
                    $slider.data("nojs.slider.display", display);

                    var valueMinSelector = $slider.data("valMin");
                    var valueMaxSelector = $slider.data("valMax");
                    var val = [$(valueMinSelector, context), $(valueMaxSelector, context)];
                    $slider.data("nojs.slider.val", val);

                    opt.values = [
                        val[0].val() || opt.min,
                        val[1].val() || opt.max
                    ];
                } else {
                    var displaySelector = $slider.data("display");
                    var display = $(displaySelector, context);
                    $slider.data("nojs.slider.display", display);

                    var valueSelector = $slider.data("val");
                    var val = $(valueSelector, context);
                    $slider.data("nojs.slider.val", val);

                    opt.value = val;
                }
                $slider.slider(opt);

                var display = $slider.data("nojs.slider.display");
                if ($.isArray(display)) {
                    display[0].text(opt.values[0]);
                    display[1].text(opt.values[1]);
                } else if (display) {
                    display.text(opt.value);
                }
            });
        }
    };
    $nojs.selectable = {//选择效果
        enable: function () {
            return !!$.fn.selectable;
        },
        selector: ".selectable",
        option: {},
        init: function (context) {
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
        init: function (context) {
            var opt = this.option;
            $(this.selector, context).click(function () {
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
        init: function (context) {
            var $pks = $(this.pks, context);
            var $chkAll = $(this.chkAll, context);
            var $render = $(this.render, context);
            $pks.click(function () {
                $chkAll.prop("checked", $pks.length === $pks.filter(":checked").length);
                $render.prop("disabled", $pks.filter(":checked").length === 0);
            });
            $chkAll.click(function () {
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
        $member: function ($leader, context) {
            var memberName = $leader.data("member");
            return $("input:checkbox[name=" + memberName + "]:not(:disabled)", context);
        },
        render: function ($leader, $member, context) {
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
        init: function (context) {
            var module = this;
            $(module.selector, context).each(function () {
                var $leader = $(this);
                var $member = module.$member($leader, context);
                $leader.change(function () {
                    $member.prop("checked", $leader.prop("checked"));
                    module.render($leader, $member, context);
                });
                $member.change(function () {
                    $leader.prop("checked", $member.length === $member.filter(":checked").length);
                    module.render($leader, $member, context);
                });
                module.render($leader, $member, context);
            });
        }
    };
    $nojs.validation = {
        enable: function () {
            return !!$.fn.validate;
        },
        selector: "form.validate",
        init: function (context) {
            var $form = $(this.selector, context);
            var option = {
                ignore: "[data-novalidate]",
                highlight: function (element) {
                    $(element).closest('.form-group').addClass('has-error');
                },
                unhighlight: function (element) {
                    $(element).closest('.form-group').removeClass('has-error');
                },
                errorElement: 'label',
                errorClass: 'help-inline',
                errorPlacement: function (error, element) {
                    $(element).closest('.form-group').append(error);
                }
            };
            $form.each(function () {
                var $form = $(this);
                var validation = $form.validate($.extend(option, $form.data()));
            });
        }
    };
    $nojs.readonly = {
        enable: true,
        selector: ".readonly",
        init: function (context) {
            var $readonlyContext = $(this.selector, context);
            $readonlyContext.find(":input").prop("readonly", true);
            $readonlyContext.find("textarea").each(function () {
                var $textarea = $(this);
                if ($textarea.hasClass("editor")) {
                    var text = $textarea.text();
                    $textarea.after(text);
                    $textarea.hide();
                } else {
                    $textarea.prop("readonly", true);
                }
            });
            $readonlyContext.find(":radio,:checkbox,select").prop("disabled", true);
            $readonlyContext.find(":button:not(.cancel)").hide();
        }
    };
    $nojs.arrayDictionary = {
        enable: function () {
            return !!window.dictionaryData;
        },
        selector: ".dictionary",
        event: "$nojs-dictionary-initialize",
        regex: {
            key: /([a-zA-Z0-9]+)\(([a-zA-Z0-9.]+)\->([a-zA-Z0-9.]+)\)/,
            parent: /(^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*)))\->([a-zA-Z0-9.]+)+/
        },
        $template: $("<option></option>"),
        _resolveRelation: function (obj, path) {
            if (!obj) {
                return null;
            }
            var first = path.shift();
            var value = obj[first];
            if (path.length === 0) {
                return value;
            } else {
                return this._resolveRelation(value, path);
            }
        },
        init: function (context) {
            var module = this;
            $(this.selector, context).on(this.event, function (event) {
                var $dictionary = $(this);
                var key = $dictionary.data("dictKey");
                var value = $dictionary.data("value");

                var arr = module.regex.key.exec(key);
                if (!arr || arr.length !== 4) {
                    return;
                }
                var dictKey = arr[1];
                var dictName = arr[2];
                var dictValue = arr[3];
                var dictionaryList = dictionaryData[dictKey];

                if (!dictKey || !dictionaryList) {
                    return;
                }

                if ($dictionary.is(":not(select)")) {
                    var val = value || $dictionary.text();
                    $.each(dictionaryList, function (i, obj) {
                        if (obj[dictName] == val) {
                            if ($dictionary.is("input")) {
                                $dictionary.val(obj[dictValue]);
                            } else {
                                $dictionary.text(obj[dictValue]);
                            }
                            return false;
                        }
                    });
                    return;
                }

                var $select = $dictionary;
                var parent = $dictionary.data("dictParent");
                if (parent) {
                    var parr = module.regex.parent.exec(parent);
                    if (!parr || parr.length !== 5) {
                        return;
                    }
                    var parentSelector = parr[1];
                    var dictionaryExpression = parr[4];
                    var dictionaryPath = dictionaryExpression.split(/\./);

                    var $parentSelect = $(parentSelector);
                    $parentSelect.change(function (event) {
                        var $trigger = $(this);
                        var parentValue = $trigger.val();

                        $select.empty();
                        var defaultOptionText = $select.data("default");
                        if (defaultOptionText) {
                            module.$template.clone()
                                    .text(defaultOptionText)
                                    .attr("value", "")
                                    .appendTo($select);
                        }
//			if(!parentValue){// 0==""==false
//			    return;
//			}
                        $.each(dictionaryList, function (i, obj) {
                            var relation = module._resolveRelation(obj, dictionaryPath.slice(0));
                            if (relation == parentValue) {
                                var $option = module.$template.clone();
                                $option.text(obj[dictValue]);
                                $option.attr("value", obj[dictName]);
                                $select.append($option);
                            }
                        });
                        $select.trigger("$nojs-select-initialize", event);
                    });

                } else {
                    $select.empty();
                    var defaultOptionText = $select.data("default");
                    if (defaultOptionText) {
                        module.$template.clone()
                                .text(defaultOptionText)
                                .attr("value", "")
                                .appendTo($select);
                    }
                    $.each(dictionaryList, function (i, obj) {
                        var $option = module.$template.clone();
                        $option.text(obj[dictValue]);
                        $option.attr("value", obj[dictName]);
                        $select.append($option);
                    });
                }

                $nojs.ready(function () {
                    $dictionary.change();
                });
            }).trigger(this.event);
        }
    };
    $nojs.selectValueInitialization = {//select值绑定
        enable: true,
        selector: "select",
        event: "$nojs-select-initialize",
        init: function (context) {
            $(this.selector, context).on(this.event, function (event) {
                var $select = $(this);
                var value = $select.data("value");
                if (value !== undefined) {
                    $select.children("option:selected").prop("selected", false);
                    $select.children("option[value=" + value + "]").prop("selected", true);
                }
                var autofire = $select.data("autofire");
                if (autofire) {
                    $nojs.ready(function () {
                        $select.change();
                    });
                }
            }).trigger(this.event);
        }
    };
    $nojs.radioGroupValueInitialization = {////radio值绑定
        enable: true,
        selector: ".radio-group",
        event: "$nojs-radio-initialize",
        init: function (context) {
            $(this.selector, context).on(this.event, function (event) {
                var $group = $(this);
                var value = $group.data("value");
                if (value !== undefined) {
                    $group.children(":radio:checked").prop("checked", false);
                    $group.children(":radio[value=" + value + "]").prop("checked", true);
                }
                var autofire = $group.data("autofire");
                if (autofire) {
                    $group.change();
                }
            }).trigger(this.event);
        }
    };
    $nojs.dropdownValueBind = {
        enable: function () {
            return !!$.fn.dropdown;
        },
        selector: "[data-toggle=dropdown][data-value]",
        event: "change.$nojs-dropdown",
        init: function (context) {
            var module = this;
            $(module.selector, context).each(function () {
                var $trigger = $(this);
                var value = $trigger.attr("data-value");
                if (value) {
                    var $value = $trigger.next().find("[data-value='" + value + "']");
                    if ($value.length) {
                        module.setText($trigger, $value.text());
                    }
                    module.setValue($trigger, value);
                }

                $trigger.next().find("[data-value]").click(function () {
                    var $this = $(this);
                    module.setText($trigger, $this.text());
                    module.setValue($trigger, $this.attr("data-value"));
                });
            });
        },
        setText: function ($trigger, text) {
            $(":text", $trigger).val(text);
            $(".display", $trigger).text(text);
        },
        setValue: function ($trigger, value) {
            var $value = $("input:hidden", $trigger);

            var oldValue = $value.val();
            $("input:hidden", $trigger).val(value || "");
            $trigger.attr("data-value", value);
            $trigger.trigger("change", oldValue);
        }
    };
    $nojs.trimText = {
        enable: true,
        selector: ":text:not([data-skip-trim])",
        init: function (context) {
            $(this.selector, context).change(function () {
                this.value = $.trim(this.value);
            });
        }
    };
    $nojs.resetLookup = {//重置表单
        enable: true,
        selector: {
            reset: ".reset",
            control: ":input",
            form: "form.lookup"
        },
        init: function (context) {
            var $lookupForm = $(this.selector.form, context);
            var controlSelector = this.selector.control;
            $(this.selector.reset, $lookupForm).click(function () {
                $(controlSelector, $lookupForm).val("");
                $lookupForm.submit();
            });
        }
    };
    $nojs.action = {//模拟表单提交和标签
        enable: true,
        init: function (context) {
            for (var name in this) {
                var module = this[name];
                if (module && module.init) {
                    module.init(context);
                }
            }
        },
        addModule: function (name, module) {
            if (module && module.init) {
                this[name] = module;
            }
        },
        removeModule: function (name) {
            this[name] = undefined;
        },
        get: {
            selector: ".action-get",
            init: function (context) {
                $(this.selector, context).click(function (e) {
                    if (e.isDefaultPrevented()) {
                        return false;
                    }
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
                        } else {
                            confirm += "\n\n   您确定要执行此项操作吗？";
                        }
                        if (!window.confirm(confirm)) {
                            return;
                        }
                    }
                    var href = $button.data("href") || $button.data("get");
                    if (!/^\//.test(href)) {

                        var index = window.location.href.indexOf("?");
                        var location = window.location.href.substring(0, index);
                        href = location + href;
                    }

                    var $params = $(".action-param", $button);
                    if ($params.length) {
                        href = href + "?1=1";
                        $params.each(function (i, paramSpan) {
                            var $param = $(paramSpan);
                            href += "&" + $param.data("key") + "=" + encodeURIComponent($param.data("value"));
                });
                    } else {
                        var paramData = $button.data();
                        href += "?" + $.param(paramData, true);
            }

                    var formSelector = $button.data("form");
                    if (!formSelector) {
                        window.location = href;
                    } else {
                        var $form;
                        if ($.type(formSelector) === "string") {
                            $form = $(formSelector, context);
                        } else {
                            $form = $button.parents("form");
                        }
                        if (!$form.length) {
                            console.error("找不到绑定的表单");
                            return;
                        }
                        $form.attr("method", "get");
                        $form.attr("action", href);
                        $form.submit();
                    }
                });
            }
        },
        post: {
            selector: ".action-post",
            init: function (context) {
                $(this.selector, context).click(function (e) {
                    if (e.isDefaultPrevented()) {
                        return false;
                    }
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
                        } else {
                            confirm += "\n\n   您确定要执行此项操作吗？";
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
                    $.each(data, function (key, value) {
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
        back: {
            selector: ".action-back",
            init: function (context) {
                $(this.selector, context).click(function (e) {
                    if (e.isDefaultPrevented()) {
                            return false;
                        }
                    window.history.back();
                    });
            }
        }
    };
    $nojs.dialog = {//依赖artdialog-5.x
        enable: function () {
            return !!$.dialog;
        },
        selector: ".dialog",
        event: {
            remoteContentReady: "application.dialog.remote.ready"
        },
        ok: function () {
            var $form = $("form", this.dom.content);
            $form.find("button[type=submit]").click();
            return false;
        },
        cancel: function () {
            return true;
        },
        ready: function () {
            if ($.bootstrapIE6) {
                $.bootstrapIE6(this.dom.content);
            }
            $application(this.dom.content);
        },
        init: function (context) {
            var thisModule = this;
            $(thisModule.selector, context).click(function (e) {
                if (e.isDefaultPrevented()) {
                    return false;
                }
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
                }).done(function (data, textStatus, jqXHR) {
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
    $nojs.closeable = {
        enable: true,
        init: function (context) {
            $(document).on("click", "button.close", function (e) {
                if (e.isDefaultPrevented()) {
                    return false;
                }
                $(this).closest("[data-closeable]").remove();
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
        define("$nojs", [], function () {
            return $nojs;
        });
    }
})(window, jQuery);

$(document).ready(function () {

    $.fn.extend({
        pushData: function (name, value) {
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