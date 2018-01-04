/**
 * Created by rj on 11/03/17.
 */
import { fromJS } from 'immutable';

export const hasProperty = (prop, schema) => {
  // validate args
  if(!schema || !prop) return false;
  const name = (prop.get && prop.get('field')) || prop.field || prop;
  // if has properties return propers[prop] else assume immutable
  return schema.properties ? schema.properties[name] : !!schema.getIn(['properties', name]);
};

export const getFieldSpec = (prop, schema) => {
  const noField = { label: 'no such field' };
  // validate args
  if(!schema || !prop) return noField;
  const name = (prop.get && prop.get('field')) || prop.field || prop;
  // if has properties return propers[prop] else assume immutable
  let ret = schema.properties ? schema.properties[name] : schema.getIn(['properties', name]).toJS();
  return ret || noField;
};
