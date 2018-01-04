/**
 * Created by rj on 17/02/17.
 */
import validate from 'validate.js';

import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import ajvErrors from 'ajv-errors';
import beautify from 'js-beautify';

import definitions from '../../../server/schema/definitions.json';

/**
 * Internal method used to merge errors into a single Map.
 * @param acc - the accumlated list of errors
 * @param e - the new errors to add to the list
 * @returns {*}
 */
const mergeErrors = (acc, e) => {
  if(!e) return acc;
  let ret = { ...acc };
  Object.keys(e).forEach((x) => {
    ret[x] = ret[x] ? [...ret[x], ...e[x]] : e[x];
  });
  return ret;
};

/**
 * Adds when/then validation to validate.js.  If $when and $then are present,
 * if $when is valid return the results of the $then validation, otherwise return
 * `undefined`.
 *
 * @param obj - data to validate
 * @param validation - criteria to apply
 * @returns {*}
 */
const applyValidation = (obj, validation) => {
  const { $when, $then } = validation;
  // $when XOR $then is invalid -- throw an error
  if($when ? !$then : $then) throw Error('Illegal when/then expression.');
  // is there a when/then condition?
  if($when) {
    /* if the when is valid (returns undefined), return the validation of the then criteria,
     * otherwise undefined
     */
    return (!validate(obj, $when)) ? validate(obj, $then) : undefined;
  }
  return validate(obj, validation);
};

/**
 * # Object Validation
 * Validates `obj` against a list of validation.js criteria such as:
 *
 * 1. `datetime`: Date Time validation supports `earliest`, `latest`, and `dateOnly` parameters.
 * 2. `email`: Email validation.
 * 3. `equality`:  Validates whether or not two fields are equal.
 * 4. `exclusion`: Validates against a list of unacceptable values.
 * 5. `format`: Validates against a regular expression.
 * 6. `inclusion`: Validates against a list of acceptable values.
 * 7. `length`: String length validation, supports `is`, `minimum`, and `maximum`.
 * 8. `numericality`: number validation.  supports `onlyInteger`, `strict`, `greaterThan`,
 * `greaterThanOrEqualTo`, `equalTo`, `lessThanOrEqualTo`,`lessThan`, `divisibleBy`,
 * `odd` and `even`.
 * 9. `presence`: Validates that a field is not null undefined or empty.
 * 10. `url`: Validates that a field is a valid url, supports `scheme`, and `allowLocal` parameters.
 *
 * @param obj - data to validate
 * @param validations - array of validations to apply.
 */
export const validateObject = (obj, validations) =>
  validations.map(v => applyValidation(obj, v))
    .reduce((acc, errors) => mergeErrors(acc, errors), {});


const compose = (...fns) => (...args) => {
  let tmp = fns[0](...args);
  for(let i = 1; i < fns.length; i++) tmp = fns[i](tmp);
  return tmp;
};

const extendAjv = compose(ajvKeywords, ajvErrors);
// AJV 5+ returns errors for unknown formats all apm formats must be registered
export const apmFormats = {
  currency: '^\\-?[0-9]*\\.?[0-9]*$',
  date: '^[0-9]*\\.?[0-9]*$',
  dateTime: '^[0-9]*\\.?[0-9]*$',
  image: '.+',
  percent: '^\\-?[0-9]*\\.?[0-9]*$',
  password: '.+',
  number: '^\\-?[0-9]*\\.?[0-9]*$',
  phone: '^[\\+]?[0-9]?-?[(]?[0-9]{3}[)]?[\\-\\s\\.]?[0-9]{3}[-\\s\\.]?[0-9]{4,6}((\\+|[\\s\\-\\.]?ext[\\s\\-\\.]?)[0-9]{1,4})?$',
  text: '.*',

};

/**
 * For easier debugging we generate source code for AJV validations in Non-Production mode.
 */
// let ajvSourceCode;
// let ajvProcessCode;
// if(process.env.NODE_ENV !== 'production') {
//   ajvSourceCode = true;
//   ajvProcessCode = beautify;
//   console.log('Using non-production ajv settings');
// } else {
//   console.log('using production ajv settings');
// }

export const ajv = (ajvKeywords = {}, ajvFormats = apmFormats) => {

  let iAjv = new Ajv({
    validateSchema: false,
    passContext: true,
    allErrors: true,
    jsonPointers: true,
    $data: true,
    verbose: true,
    // sourceCode: ajvSourceCode,
    // processCode: ajvProcessCode,
  });

  iAjv = extendAjv(iAjv);

  Object.keys(ajvKeywords).forEach(
    keyword => iAjv.addKeyword(keyword, ajvKeywords[keyword])
  );
  Object.keys(ajvFormats).forEach(
    format => iAjv.addFormat(format, ajvFormats[format])
  );
  iAjv.addSchema(definitions, '/definitions.json');
  return iAjv;
};

const sAjv = ajv();

export const registerSchema = (schema) => {
  const test = sAjv.getSchema(schema.get('id'));
  if(!test) {
    console.log('registering schema', schema.get('id'));
    sAjv.addSchema(schema.toJS(), schema.get('id'));
  }
}

// iterate over a list of fields and validate each returns list of validation errors
export const validateObjectFields = (data, fields, schemaId) => {
  // default is no errors
  let invalidFields = {};
  // iterate over the fields
  fields.forEach((f) => {
    // field Accessor
    const fAccessor = f.split('.');
    const fName = fAccessor[fAccessor.length - 1];
    // get the field schema
    const fSchema = sAjv.getSchema(`${schemaId}#/properties/${fName}`);
    // get the field data
    let fData = data[fName];
    // ajv generated validation code checks === null so need convert undefined to null here
    if(typeof fData === 'undefined')
      fData = null;

    // validate the field
    const fValid = fSchema(fData);
    if(!fValid) {
      // an invalid field was found add errors to the list
      invalidFields[fAccessor] = fSchema.errors;
    }
  });
  return invalidFields;
}
