'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function ($) {
    'use strict';

    var Typeahead = function () {
        function Typeahead(element, options) {
            var _this2 = this;

            _classCallCheck(this, Typeahead);

            this.options = options;
            if (this.options.filter) {
                this.options.filter = this.options.filter.bind(this);
            }

            this.$input = $(element);
            this.$input.addClass('typeahead');
            this.$input.attr('autocomplete', 'off'); // autocomplete="off" to prevent default browser menus

            if (this.$input.data('value-field')) {
                this.$valueField = $(this.$input.data('value-field'));
            } else if (typeof this.options.valueField === "string") {
                this.$valueField = $(this.options.valueField);
            } else if (this.options.valueField && this.options.valueField.length) {
                this.$valueField = this.options.valueField;
            }

            this.datasource = this.$input.data('source');
            if (!this.datasource) {
                this.datasource = this.options.dataSource;
            }
            this.data = null;

            this.$items = $('<ul class="items dropdown-menu typeahead-menu" style="display:none;" role="menu"></ul>');
            this.$items.insertAfter(this.$input);

            if (this.options.appendToBody) {
                var id = '' + 10000 * Math.random() * new Date().getTime() * window.outerHeight;
                this.$items.attr('id', id);
                this.$input.attr('dd-menu', id);
                this.$items.detach().appendTo('body');
            }

            // initialize event listeners
            var _this = this;
            this.$input[0].addEventListener(this.options.searchOn, function () {
                _this.search(this.value);
            });

            this.$input.click(function () {
                if (_this2.data && _this2.data.length) {
                    _this2.open = true;
                }
            });

            // handle arrow keys
            this.$input.on('keydown', function (e) {
                if (e.keyCode === 40) {
                    _this.$items.children().first().focus();
                }
            });

            this.$items.on('keydown', function (e) {
                if (e.keyCode === 40) {
                    $(document.activeElement).next().focus(); // DOWN
                } else if (e.keyCode === 38) {
                    $(document.activeElement).prev().focus(); // UP
                } else if (e.keyCode === 9) {
                    e.preventDefault(); // TAB
                }
            });

            // close the dropdown menu if clicked outside or on esc keypress
            $('body').click(function () {
                var $active = $(document.activeElement);
                if (!$active.is(_this2.$input) && !$active.is(_this2.$items) && !_this2.$items.find($active).length) {
                    _this2.open = false;
                }
            });
            document.addEventListener('keydown', function (e) {
                if (e.keyCode === 27) {
                    _this2.open = false; // esc key
                }
            });

            this.open = false;
        }

        _createClass(Typeahead, [{
            key: 'search',
            value: function search(input) {
                var _this3 = this;

                if (!input) {
                    input = '';
                }
                this.selected = null;

                var results = void 0;
                this.options.getMethod(this.datasource, { value: input }).then(function (data) {
                    _this3.data = data;
                    _this3.buildDropdownItems(results);
                    _this3.open = true;
                });
            }
        }, {
            key: 'buildDropdownItems',
            value: function buildDropdownItems(dataItems) {
                this.destroyDropdownItems();

                if (!dataItems || !dataItems.length) return;

                var _this = this;
                dataItems.forEach(function (x) {
                    var li = document.createElement('li');
                    li.setAttribute('value', x[_this.options.valueProperty]);
                    li.setAttribute('tabindex', '-1');
                    li.innerHTML = '<a href="#">' + x[_this.options.nameProperty] + '</a>';
                    var selectItemHandler = function selectItemHandler(e) {
                        _this.$input.val(x[_this.options.nameProperty]);
                        _this.selected = x;
                        _this.open = false;
                    };

                    if (x[_this.options.selectableProperty] === undefined || x[_this.options.selectableProperty] === null || !!x[_this.options.selectableProperty] === true) {
                        li.addEventListener('click', selectItemHandler);
                        li.addEventListener('keydown', function (e) {
                            if (e.keyCode === 13) {
                                // enter key
                                selectItemHandler(e);
                                _this.$input.focus();
                                e.preventDefault();
                            }
                        });
                    } else if (!!x[_this.options.selectableProperty] === false) {
                        li.addEventListener('click', function () {
                            return _this.open = true;
                        });
                        li.setAttribute('class', _this.options.notSelectableClass);
                    }
                    _this.$items.append(li);
                });
            }
        }, {
            key: 'destroyDropdownItems',
            value: function destroyDropdownItems() {
                this.$items.children().remove();
            }
        }, {
            key: 'toggleOpen',
            value: function toggleOpen() {
                this.open = !this.open;
            }
        }, {
            key: 'setMenuDirection',
            value: function setMenuDirection() {
                var inputOffset = this.$input.offset();
                var inputHeight = this.$input.outerHeight();
                var inputMarginTop = parseInt(this.$input.css('margin-top'));

                // let menuOffset = this.$items.offset();
                var menuHeight = this.$items.outerHeight();

                var vpHeight = $(window).height();

                var noSpaceBelow = inputOffset.top + inputHeight + menuHeight > vpHeight;
                var spaceAbove = inputOffset.top - $(window).scrollTop() - menuHeight > 0;

                if (noSpaceBelow && spaceAbove) {
                    this.$items.offset({ top: inputOffset.top - menuHeight - inputMarginTop, left: inputOffset.left });
                } else {
                    this.$items.offset({ top: inputOffset.top + inputHeight + inputMarginTop, left: inputOffset.left });
                }
            }
        }, {
            key: 'open',
            get: function get() {
                return !!this.$input.attr('open');
            },
            set: function set(val) {
                // reflect the value of the open property as an HTML attribute
                if (val) {
                    this.$input.attr('open', '');
                } else {
                    this.$input.removeAttr('open');
                }

                if (this.open) {
                    this.buildDropdownItems(this.data);
                    this.$items.show();
                    this.setMenuDirection();
                } else {
                    this.$items.hide();
                    this.destroyDropdownItems();
                }
            }
        }, {
            key: 'selected',
            get: function get() {
                return this.$input.data('selected');
            },
            set: function set(value) {
                var _this4 = this;

                // reflect the value of the selected property as an HTML attribute
                if (!value) {
                    value = {};
                }

                if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== "object" && this.data) {
                    if (!isNaN(+value)) {
                        value = +value; // if value is a string we try to convert it to a number, otherwise we leave it as a string
                    }
                    var elem = this.data.filter(function (x) {
                        return x[_this4.options.valueProperty] === value;
                    });
                    if (elem && elem.length && elem[0]) {
                        value = elem[0];
                    }
                }

                this.$input[0].setAttribute('selected', value[this.options.valueProperty] || '');
                this.$input.data('selected', value);

                if (this.$valueField) {
                    this.$valueField.val(value[this.options.valueProperty] || '');
                }

                if (this.options.onSelected) {
                    this.options.onSelected(this);
                }

                this.$input.trigger('change');
            }
        }]);

        return Typeahead;
    }();

    var defaultOptions = {
        nameProperty: 'name',
        valueProperty: 'value',
        selectableProperty: 'selectable',
        notSelectableClass: 'no-select',
        valueField: null,
        dataSource: null,
        searchOn: 'input',
        appendToBody: false,
        getMethod: $.get,
        onSelected: null
    };

    $.fn.typeahead = function (option) {
        this.each(function () {
            var $this = $(this),
                data = $this.data('typeahead'),
                options = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) === 'object' && option;
            if (!data) {
                var opts = $.extend({}, defaultOptions, options);
                var typeahead = new Typeahead(this, opts);
                $this.data('typeahead', typeahead);
            }
        });
        return this;
    };

    $(function () {
        $('[data-provide="softec-typeahead"]').typeahead();
    });
})(window.jQuery);