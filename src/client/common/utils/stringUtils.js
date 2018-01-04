/**
 * Created by rj on 10/02/17.
 */
import moment from 'moment';
import { formatLocale } from 'd3-format';

import { fromJS } from 'immutable';

/**
 * Simple string replacement utility allowing for named parameters to be replaced in
 * a format string.
 *
 * # Usage
 * `formatMessage("Hello ${name}.  Welcome to ${place}.", {name: "John Snow", place: "California"})
 *
 * results: "Hello John Snow. Welcome to California."
 *
 * @param message - The format string.
 * @param args - an object which maps the replacement keys in the format string to their values.
 * @returns The formatted string.
 */
export const formatMessage = (message, args) => {
  // if there are no arguments or message just return message
  if(!args || !message) return message;

  // iteratively replace keys with their value
  return Object.keys(args).reduce((acc, key) => {
    // Create replacement token and escape special characters
    let esc = (`\${${key}}`).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // globally replace token with corresponding value
    return acc.replace(new RegExp(esc, 'g'), args[key]);
  }, message);
};

export const formatUrl = (url, params) => {
  // if there are no params or url just return url
  if(!url || !params) return url;

  // iteratively replace keys with their value
  return Object.keys(params).reduce((acc, key) => {
    // Create replacement token and escape special characters
    let esc = (`:${key}`).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // globally replace token with corresponding value
    return acc.replace(new RegExp(esc, 'g'), params[key]);
  }, url);
};

/**
 * Sets the default locale
 *
 * @param locale
 */
export const setDefaultLocale = (locale) => {
  if(locale && !locale.name) {
    _locale = localeFor(locale);
  } else {
    _locale = locale;
    if(!_locale.number)
      _locale.number = getD3Locale(_locale.name);

  }
};

/**
 * Builds default locale details for a given `name`
 * @param name
 * @returns {{name: *, number: {decimal, thousands, grouping, currency}}}
 */
const localeFor = name => ({ name, number: getD3Locale(name) });

/**
 * Gets the default locale (Delegates to momentjs Locale detection.
 *
 * @returns {{name: *, number: {decimal, thousands, grouping, currency}}}
 */
export const defaultLocale = () => localeFor(moment.locale());

/**
 * Returns the default AgilePM number format for a given `fieldSpec`
 * @param fieldSpec - a field Schema definition.
 * @param loc - locale for locale specific default formats
 * @returns The d3Format spec for the type/
 */
const getNumberFormat = (fieldSpec, loc) => {
  switch(fieldSpec.format || fieldSpec.type) {
    case'percent':
      return '.0%';
    case'currency':
      return (loc && loc.currencyFormat) ? loc.currencyFormat : '$,.2f';
    default:
      return ',';
  }
};

export const getPrimaryType = (type) => {
  if(Array.isArray(type)) {
    if(type.includes('number')) return 'number';
    if(type.includes('integer')) return 'number';
    if(type.includes('boolean')) return 'boolean';
    if(type.includes('array')) return 'array';
    if(type.includes('object')) return 'object';
    return 'string';
  }
  return type;
};

const getFieldType = (jSpec) => {
  let type = (jSpec && jSpec.type) || '';
  type = getPrimaryType(type);
  return (type === 'number' && jSpec.format) ? jSpec.format : type;
};

/**
 * Format the given `data` in a Locale specific way.  The formatting behavior is
 * determined by the `fieldSpec` and `layoutSpec` parameters.
 * @param data - the data to be formatted.
 * @param fieldSpec - a Field schema, formatting is type dependent.  If no fieldSpec is specified the type defaults to string.
 * @param layoutSpec - optional additional formatting may come from the `layoutSpec` to override things such as number or date formats.
 * @param locale - optional locale which can be a locale name or a locale spec that will override the default behavior for number and date formatting/
 * @returns the formatted string.
 */
export const formatField = (data, fieldSpec, layoutSpec, locale) => {
  const loc = (locale) ? (locale.name ? locale : localeFor(locale)) : _locale;
  let jSpec = (fieldSpec && fieldSpec.toJS) ? fieldSpec.toJS() : fieldSpec;
  if(data === null || data === undefined) return data;
  const fType = getFieldType(jSpec);
  switch(fType) {
    case'string':
      return data;
    case'date':
      const dfmt = (layoutSpec && layoutSpec.dateFormat) ? layoutSpec.dateFormat : 'l';
      return moment(data).locale(loc.name).format(dfmt);
    case'dateTime':
      const dtfmt = (layoutSpec && layoutSpec.dateFormat) ? layoutSpec.dateFormat : 'l LTS';
      return moment(data).locale(loc.name).format(dtfmt);
    case'array':
      return (data.toJS ? data.toJS() : data)
        .map(x => formatField(x, jSpec.items, layoutSpec, locale)).join(', ');
    case'object':
      return fromJS(data).get('displayName') || fromJS(data).get('name') || `${fromJS(data).get('fname')} ${fromJS(data).get('lname')}`;
    case'number':
    case'currency':
    case'percent':
      const nfmt = (layoutSpec && layoutSpec.numberFormat) ? layoutSpec.numberFormat : getNumberFormat(fieldSpec, loc);
      return isNaN(data) ? 'N/A' : formatLocale(loc.number).format(nfmt)(data);
    case'timeTo':
      if (layoutSpec && layoutSpec.timeTo) {
        return isNaN(data) ? 'N/A' : formatMessage(layoutSpec.timeTo, { timeTo: formatLocale(loc.number).format('.1f')(data) });
      }
    case 'boolean':
      return data ? 'Yes' : 'No';
    default:
      const jData = (data && data.toJS && data.toJS()) || data;
      return (typeof data === 'object') ? (jData.displayName || jData.name || `${jData.firstName} ${jData.lastName}`) : data;
  }
};

/**
 * A select number of locale formats from d3Format, this list can be expanded later.  Defaults to en_US
 * @param loc - the Locale name
 * @returns D3 number format
 */
const getD3Locale = (loc) => {
  switch(loc) {
    case'en_US':
      return {
        decimal: '.',
        thousands: ',',
        grouping: [3],
        currency: ['$', '']
      };
    case'en_GB':
      return {
        decimal: '.',
        thousands: ',',
        grouping: [3],
        currency: ['£', '']
      };
    case'fr_FR':
      return {
        decimal: ',',
        thousands: '.',
        grouping: [3],
        currency: ['', '\u00a0€']
      };
    case'ru_RU':
      return {
        decimal: ',',
        thousands: '\u00a0',
        grouping: [3],
        currency: ['', '\u00a0руб.']
      };
    default:
      return {
        decimal: '.',
        thousands: ',',
        grouping: [3],
        currency: ['$', '']
      };
  }
};

/**
 * global default Locale.
 * @type {{name: *, number: {decimal, thousands, grouping, currency}}}
 * @private
 */
let _locale = defaultLocale();
