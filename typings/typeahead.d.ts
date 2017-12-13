/// <reference path="../jquery/jquery.d.ts" />

/**Options available to control the typeahead control*/
interface TypeaheadOptions {

    /**The property that will be used as display text. Default: name*/
    nameProperty?: string;

    /**The property that will be used as the value. Default: value*/
    valueProperty?: string;

    /**Can be either an Array or an URL. In case of an URL, Ajax is used to gather the data.*/
    dataSource?: string;

    valueField?: string | JQuery;

    searchOn?: string;

    appendToBody?: boolean;

    getMethod?: Function;
}

interface Typeahead {
    (): JQuery;
    (options: TypeaheadOptions): JQuery;
}

interface JQuery {
    typeahead: Typeahead;
}