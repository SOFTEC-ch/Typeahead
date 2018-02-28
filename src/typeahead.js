'use strict';
class Typeahead {

    constructor(element, options) {
        this.options = options;
        if (this.options.filter) {
            this.options.filter = this.options.filter.bind(this);
        }

        this.$input = $(element);
        this.$input.addClass('typeahead');
        this.$input.attr('autocomplete', 'off');    // autocomplete="off" to prevent default browser menus

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
            let id = '' + (10000 * Math.random() * new Date().getTime() * window.outerHeight);
            this.$items.attr('id', id);
            this.$input.attr('dd-menu', id);
            this.$items.detach().appendTo('body');
        }

        // initialize event listeners
        let _this = this;
        this.$input[0].addEventListener(this.options.searchOn, function () {
            _this.search(this.value);
        });

        this.$input.click(() => {
            if (this.data && this.data.length) {
                this.open = true;
            }
        });

        // handle arrow keys
        this.$input.on('keydown', function (e) {
            if (e.keyCode === 40) {
                _this.$items.children().first().focus();
            }
        });

        this.$items.on('keydown', (e) => {
            if (e.keyCode === 40) {
                $(document.activeElement).next().focus();   // DOWN
            } else if (e.keyCode === 38) {
                $(document.activeElement).prev().focus();   // UP
            } else if (e.keyCode === 9) {
                e.preventDefault(); // TAB
            }
        });

        // close the dropdown menu if clicked outside or on esc keypress
        $('body').click(() => {
            const $active = $(document.activeElement);
            if (!$active.is(this.$input) && !$active.is(this.$items) && !this.$items.find($active).length) {
                this.open = false
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.keyCode === 27) {
                this.open = false;  // esc key
            }
        });

        this.open = false;
    }

    get open() {
        return !!this.$input.attr('open');
    }

    set open(val) {
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

    get selected() {
        return this.$input.data('selected');
    }

    set selected(value) {
        // reflect the value of the selected property as an HTML attribute
        if (!value) {
            value = {};
        }

        if (typeof value !== "object" && this.data) {
            if (!isNaN(+value)) {
                value = +value; // if value is a string we try to convert it to a number, otherwise we leave it as a string
            }
            let elem = this.data.filter(x => x[this.options.valueProperty] === value);
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

    search(input) {
        if (!input) {
            input = '';
        }
        this.selected = null;

        let results;
        this.options.getMethod(this.datasource, {value: input}).then((data) => {
            this.data = data;
            this.buildDropdownItems(results);
            this.open = true;
        });
    }

    buildDropdownItems(dataItems) {
        this.destroyDropdownItems();

        if (!dataItems || !dataItems.length)
            return;

        let _this = this;
        dataItems.forEach(x => {
            let li = document.createElement('li');
            li.setAttribute('value', x[_this.options.valueProperty]);
            li.setAttribute('tabindex', '-1');
            li.innerHTML = '<a href="#">' + x[_this.options.nameProperty] + '</a>';
            const selectItemHandler = (e) => {
                _this.$input.val(x[_this.options.nameProperty]);
                _this.selected = x;
                _this.open = false;
            };
            li.addEventListener('click', selectItemHandler);
            li.addEventListener('keydown', (e) => {
                if (e.keyCode === 13) {
                    // enter key
                    selectItemHandler(e);
                    _this.$input.focus();
                    e.preventDefault();
                }
            });

            _this.$items.append(li);
        });
    }

    destroyDropdownItems() {
        this.$items.children().remove();
    }

    toggleOpen() {
        this.open = !this.open;
    }

    setMenuDirection() {
        let inputOffset = this.$input.offset();
        let inputHeight = this.$input.outerHeight();
        let inputMarginTop = parseInt(this.$input.css('margin-top'));

        // let menuOffset = this.$items.offset();
        let menuHeight = this.$items.outerHeight();

        let vpHeight = $(window).height();

        let noSpaceBelow = inputOffset.top + inputHeight + menuHeight > vpHeight;
        let spaceAbove = inputOffset.top - $(window).scrollTop() - menuHeight > 0;

        if (noSpaceBelow && spaceAbove) {
            this.$items.offset({top: inputOffset.top - menuHeight - inputMarginTop, left: inputOffset.left})
        } else {
            this.$items.offset({top: inputOffset.top + inputHeight + inputMarginTop, left: inputOffset.left})
        }
    }
}

const defaultOptions = {
    nameProperty: 'name',
    valueProperty: 'value',
    valueField: null,
    dataSource: null,
    searchOn: 'input',
    appendToBody: false,
    getMethod: $.get,
    onSelected: null
};

$.fn.typeahead = function (option) {
    this.each(function () {
        let $this = $(this),
            data = $this.data('typeahead'),
            options = typeof option === 'object' && option;
        if (!data) {
            let opts = $.extend({}, defaultOptions, options);
            let typeahead = new Typeahead(this, opts);
            $this.data('typeahead', typeahead);
        }
    });
    return this;
};

$(() => {
    $('[data-provide="softec-typeahead"]').typeahead();
});