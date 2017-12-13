'use strict';

describe('Typeahead', function () {
    var $ = jQuery;

    jasmine.getFixtures().fixturesPath = 'base/test/fixtures/';

    const fireInputEvent = (element) => {
        fireEvent(element, 'input');    // fire the input event as if someone was typing
    };

    const fireBlurEvent = (element) => {
        fireEvent(element, 'blur');
    };

    const fireEvent = (element, eventName) => {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(eventName, false, true);
        element.dispatchEvent(evt);
    };

    const keyPress = (element, key) => {
        if (!element) {
            element = document;
        }
        var event = document.createEvent('Event');
        event.keyCode = key;
        event.initEvent('keydown');
        element.dispatchEvent(event);
    };

    const hiddenFieldSelector = '#test-hidden-field';
    const TEST_VALUE = 'X';
    const TEST_METHOD = jasmine.createSpy('getMethod spy').and.callFake((url, {value}) => {
        return new Promise(function (resolve) {
            var data = [];
            for (var i = 0; i < 15; i++) {
                data.push({name: value + i, value: i})
            }
            resolve(data);
        });
    });

    // inject the HTML fixture for the tests
    beforeEach(function () {
        loadFixtures('typeahead-fixture.html');
    });

    // remove the html fixture from the DOM
    afterEach(function () {
        $('#fixture').remove();
    });

    it('should create DOM elements', function () {
        $('.test-element').typeahead();

        var typeahead = $('.typeahead');
        expect(typeahead).toBeInDOM();
        expect($('ul.items.dropdown-menu')).toBeInDOM();
    });

    it('should call the url provided as data attribute on input', function () {
        const element = $('.test-element');
        const TEST_URL = 'TEST_URL';
        const spy = jasmine.createSpy("callback spy").and.callFake((url) => {
            return new Promise((resolve) => {
                expect(url).toBe(TEST_URL);
                resolve();
            });
        });

        element.attr('data-source', TEST_URL);
        element.typeahead({getMethod: spy});

        const typeahead = $('.typeahead');

        expect(spy).not.toHaveBeenCalled();
        typeahead.val(TEST_VALUE);
        fireInputEvent(typeahead[0]);
        expect(spy).toHaveBeenCalled();
    });

    it('should only open the dropdown-menu if it is not empty', function (done) {
        const element = $('.test-element');
        element.typeahead({getMethod: TEST_METHOD});

        const typeahead = $('.typeahead');
        let dropdown = $('.typeahead ~ ul.items.dropdown-menu');

        expect(dropdown).toBeHidden();

        typeahead.val(TEST_VALUE);
        fireInputEvent(typeahead[0]);

        setTimeout(() => {
            expect(dropdown).toBeVisible();
            done();
        }, 100);

    });

    it('should select dropdown item on click and hide the menu', function (done) {
        const element = $('.test-element');
        element.typeahead({getMethod: TEST_METHOD});

        const typeahead = $('.typeahead');
        let dropdown = $('.typeahead ~ ul.items.dropdown-menu');

        typeahead.val(TEST_VALUE);
        fireInputEvent(typeahead[0]);

        setTimeout(() => {
            expect(dropdown).toBeVisible();
            dropdown.find('li:eq(2)').click();
            expect(TEST_METHOD).toHaveBeenCalled();

            expect(typeahead[0].getAttribute('selected')).toBe('2');
            expect(typeahead).toHaveValue(TEST_VALUE + '2');
            expect(dropdown).toBeHidden();

            done();
        }, 200);
    });

    it('should set the value of the provided hidden field', function (done) {
        $('.test-element').typeahead({getMethod: TEST_METHOD, valueField: '#test-hidden-field'});

        let hiddenField = $('#test-hidden-field');
        expect(hiddenField).toHaveValue('');

        const typeahead = $('.typeahead');
        let dropdown = $('.typeahead ~ ul.items.dropdown-menu');

        typeahead.val(TEST_VALUE);
        fireInputEvent(typeahead[0]);

        setTimeout(() => {
            dropdown.find('li:eq(2)').click();
            expect(hiddenField).toHaveValue('2');
            done();
        }, 200);
    });

    it('should set the value of the field provided as data attribute', function (done) {
        $('.test-element').attr('data-value-field', hiddenFieldSelector);
        $('.test-element').typeahead({getMethod: TEST_METHOD});

        let hiddenField = $(hiddenFieldSelector);
        expect(hiddenField).toHaveValue('');

        const typeahead = $('.typeahead');
        let dropdown = $('.typeahead ~ ul.items.dropdown-menu');

        typeahead.val(TEST_VALUE);
        fireInputEvent(typeahead[0]);

        setTimeout(() => {
            dropdown.find('li:eq(4)').click();
            expect(hiddenField).toHaveValue('4');
            done();
        }, 200);
    });


    it('should clear the selected value from the attribute and the hidden field if selection is cleared', function (done) {
        const $input = $('.test-element');
        $input.typeahead({getMethod: TEST_METHOD, valueField: hiddenFieldSelector});

        const typeahead = $('.typeahead');
        const hiddenField = $('#test-hidden-field');

        typeahead.val(TEST_VALUE);
        fireInputEvent(typeahead[0]);

        setTimeout(() => {
            $('.typeahead ~ ul.items.dropdown-menu > li:eq(2)').click();

            // test if initial state of this test is correct
            expect(hiddenField).toHaveValue('2');
            expect(+$('.typeahead')[0].getAttribute('selected')).toBe(2);
            expect($input).toHaveValue(TEST_VALUE + '2');

            $input.val('');
            fireInputEvent($input[0]);  // fire the input event as if someone was typing

            setTimeout(() => {
                expect($('.typeahead')[0].getAttribute('selected')).toBe('');
                expect(hiddenField).toHaveValue('');
                done();
            }, 200);
        }, 100);
    });

    it('should select the next element if the down key is pressed', function (done) {
        const element = $('.test-element');
        element.typeahead({getMethod: TEST_METHOD});

        const typeahead = $('.typeahead');
        let dropdown = $('.typeahead ~ ul.items.dropdown-menu');

        typeahead.val(TEST_VALUE);
        fireInputEvent(typeahead[0]);

        typeahead.focus();

        setTimeout(() => {
            expect(dropdown).toBeVisible();
            expect($('.typeahead ~ ul.items.dropdown-menu > li:eq(1)')).not.toBeFocused();

            // test setup done. test starts here
            keyPress(typeahead[0], 40);   // down arrow
            expect($(document.activeElement)).toEqual('.typeahead ~ ul.items.dropdown-menu > li:eq(0)');
            expect($('.typeahead ~ ul.items.dropdown-menu > li:eq(0)')).toBeFocused();
            expect($(document.activeElement)).toContainText(TEST_VALUE + '0');

            keyPress(dropdown[0], 40);   // down arrow
            expect($(document.activeElement)).toEqual('.typeahead ~ ul.items.dropdown-menu > li:eq(1)');
            expect($('.typeahead ~ ul.items.dropdown-menu > li:eq(1)')).toBeFocused();
            expect($(document.activeElement)).toContainText(TEST_VALUE + '1');

            keyPress(dropdown[0], 38);   // up arrow
            expect($(document.activeElement)).toEqual('.typeahead ~ ul.items.dropdown-menu > li:eq(0)');
            expect($('.typeahead ~ ul.items.dropdown-menu > li:eq(0)')).toBeFocused();
            expect($(document.activeElement)).toContainText(TEST_VALUE + '0');

            done();
        }, 200);
    });

    it('should close the dropdown menu on ESC-key', function (done) {
        const element = $('.test-element');
        element.typeahead({getMethod: TEST_METHOD});

        const typeahead = $('.typeahead');
        let dropdown = $('.typeahead ~ ul.items.dropdown-menu');

        typeahead.val(TEST_VALUE);
        fireInputEvent(typeahead[0]);

        setTimeout(() => {
            expect(dropdown).toBeVisible();
            // test setup done. test starts here
            keyPress(document, 27);   // esc key
            expect(dropdown).toBeHidden();
            done();
        }, 100);
    });

    it('should clear the dropdown-items if the api returns an empty or invalid result', function (done) {
        const numberOfItems = 15;
        const EMPTY_RETURN_VALUE = 'RETURN_EMPTY';
        const INVALID_RETURN_VALUE = 'RETURN_INVALID';
        const spy = jasmine.createSpy('getMethod spy').and.callFake((url, {value}) => {
            return new Promise(function (resolve) {
                if (value === INVALID_RETURN_VALUE) {
                    resolve("asdfasdfasdf");
                }

                let data = [];
                if (value !== EMPTY_RETURN_VALUE) {
                    for (let i = 0; i < numberOfItems; i++) {
                        data.push({name: value + i, value: i})
                    }
                }
                resolve(data);
            });
        });

        const element = $('.test-element');
        element.typeahead({getMethod: spy});

        const typeahead = $('.typeahead');
        let dropdown = $('.typeahead ~ ul.items.dropdown-menu');

        typeahead.val(TEST_VALUE);
        fireInputEvent(typeahead[0]);

        setTimeout(() => {
            expect(spy).toHaveBeenCalledTimes(1);
            expect(dropdown).toBeVisible();
            expect(dropdown.children()).toHaveLength(numberOfItems);

            // test setup done. test starts here
            typeahead.val(EMPTY_RETURN_VALUE);
            fireInputEvent(typeahead[0]);

            setTimeout(() => {
                // Empty array returned. Should have no items in dropdown
                expect(spy).toHaveBeenCalledTimes(2);
                expect(dropdown).toBeVisible();
                expect(dropdown.children()).not.toHaveLength(numberOfItems);
                expect(dropdown.children()).toHaveLength(0);

                // Reset to valid searchstring. Should have 15 items in dropdown
                typeahead.val(TEST_VALUE);
                fireInputEvent(typeahead[0]);

                setTimeout(() => {
                    expect(spy).toHaveBeenCalledTimes(3);
                    expect(dropdown).toBeVisible();
                    expect(dropdown.children()).toHaveLength(numberOfItems);

                    // INvalid return value. Should not crash and have no items in dropdown
                    typeahead.val(INVALID_RETURN_VALUE);
                    fireInputEvent(typeahead[0]);

                    setTimeout(() => {
                        expect(spy).toHaveBeenCalledTimes(4);
                        expect(dropdown).toBeVisible();
                        expect(dropdown.children()).not.toHaveLength(numberOfItems);
                        expect(dropdown.children()).toHaveLength(0);

                        done();
                    }, 100);
                }, 100);
            }, 100);
        }, 100);
    });


    /*
     it('should only append the dropdown-menu items if the dropdown is open', function () {
     let options = {dataSource: test_dataSource};
     $('.test-element').autocomplete(options);

     let dropdown = $('.autocomplete > ul.items.dropdown-menu');

     expect(dropdown).toBeInDOM();
     expect(dropdown).toBeEmpty();

     let button = $('.autocomplete button.btn.btn-default');
     button.click();

     expect(dropdown).not.toBeEmpty();

     expect(dropdown.children().length).toBe(3);
     expect(dropdown.children().eq(1).text()).toBe(options.dataSource[1].name);
     expect(+dropdown.children().eq(2).attr('value')).toBe(options.dataSource[2].value);

     button.click();
     expect(dropdown).toBeEmpty();
     });

     it('should open the dropdown-menu on button click', function () {
     let options = {dataSource: test_dataSource};
     $('.test-element').autocomplete(options);

     let dropdown = $('.autocomplete > ul.items.dropdown-menu');

     expect(dropdown).toBeHidden();
     $('.autocomplete button.btn.btn-default').click();
     expect(dropdown).toBeVisible();
     });


     it('should initially select the corresponding value of the hidden field', function () {
     let options = {dataSource: test_dataSource, valueField: hiddenFieldSelector};
     let hiddenField = $('#test-hidden-field');
     hiddenField.val(test_dataSource[1].value);

     $('.test-element').autocomplete(options);

     let container = $('.autocomplete.input-group');

     expect(hiddenField).toHaveValue('' + test_dataSource[1].value);
     expect($('.test-element')[0].value).toBe('' + test_dataSource[1].name);
     expect($('.autocomplete')[0].getAttribute('selected')).toBe('' + test_dataSource[1].value);
     });


     it('should by default filter on the input event', function () {
     let $input = $('.test-element');
     let filterFunc = jasmine.createSpy("filter() spy");
     let options = {
     dataSource: test_dataSource,
     filter: filterFunc
     };

     $input.autocomplete(options);
     $input.val(test_dataSource[1].name);

     // fire the events
     fireBlurEvent($input[0]);
     expect(filterFunc).not.toHaveBeenCalled();

     fireInputEvent($input[0]);
     expect(filterFunc).toHaveBeenCalled();
     });*/
});