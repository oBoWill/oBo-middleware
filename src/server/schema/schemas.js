import session_schema from './session/session_schema.json';
import idea_import_schema from './sor/idea_import_schema.json';
import idea_layout from './sor/idea_layout.json';
import idea_list_layout from './sor/idea_list_layout.json';
import product_import_schema from './sor/product_import_schema.json';
import product_layout from './sor/product_layout.json';
import product_list_layout from './sor/product_list_layout.json';
import feature_import_schema from './sor/feature_import_schema.json';
import feature_list_layout from './sor/feature_list_layout.json';
import feature_layout from './sor/feature_layout.json';
import user_story_list_layout from './sor/user_story_list_layout.json'
import user_story_layout from './sor/user_story_layout.json';
import survey_schema from './survey/schema/survey_schema.json';
import survey_layout from './survey/layout/survey_layout.json';
import send_layout from './survey/layout/send_layout.json';
import surveyList_layout from './survey/layout/list_layout.json';
import surveyParticipant_schema from './survey/schema/participant_schema.json';
import surveyParticipant_layout from './survey/layout/participant_layout.json';
import panel_layout from './panel/panel_layout.json';
import panel_list_layout from './panel/panel_list_layout.json';
import panel_schema from './panel/panel_schema.json';
import person_list_layout from './panel/person_list_layout.json';
import person_schema from './survey/schema/person_schema.json';
import response_schema from './survey/schema/response_schema.json';
import response_layout from './survey/layout/response_layout.json';
import response_list_layout from './survey/layout/response_list_layout.json';
import internal_list_layout from './survey/layout/internal_participant_layout.json';
import design_schema from './survey/schema/design_schema.json';
import section_schema from './survey/schema/section_schema.json';
import question_schema from './survey/schema/question_schema.json';
import options from './enum_mock.json';
import customfield_schema from './admin/customfield_schema.json';
import profile_schema from './session/profile_schema.json';
import profile_layout from './session/profile_layout.json'
import profile_admin_layout from './session/profile_admin_layout.json'

import profile_list_layout from './session/profile_list_layout.json';
import import_schema from './admin/dataImportLog_schema.json';
import base_record_schema from './admin/baseRecord_schema.json';
import import_list_layout from './admin/import_list_layout.json';
import custom_field_layout from './admin/customField_layout.json';

import product_line_layout from './sor/product_line_layout.json';
import product_line_list_layout from './sor/product_line_list_layout.json';
import product_line_import_schema from './sor/product_line_import_schema.json';

import initiative_layout from './sor/initiative_layout.json';
import initiative_list_layout from './sor/initiative_list_layout.json';
import initiative_import_schema from './sor/initiative_import_schema.json';

import theme_layout from './sor/theme_layout.json';
import theme_list_layout from './sor/theme_list_layout.json';
import theme_import_schema from './sor/theme_import_schema.json';

import release_layout from './sor/release_layout.json';
import release_list_layout from './sor/release_list_layout.json';
import release_import_schema from './sor/release_import_schema.json';

// import { enumService } from '../enums/enumsHandler.js';
import { cloneDeep } from 'lodash';

import definitions from './definitions.json';

export const schemas = {
  session: { schema: session_schema, layout: {} },
  idea: { schema: {}, layout: idea_layout, listLayout: idea_list_layout },
  feature: { schema: {}, layout: feature_layout, listLayout: feature_list_layout },
  'feature/userStory': { schema: {}, layout: user_story_layout, listLayout: user_story_list_layout },
  product: { schema: {}, layout: product_layout, listLayout: product_list_layout },
  productLine: { schema: {}, layout: product_line_layout, listLayout: product_line_list_layout },
  release: { schema: {}, layout: release_layout, listLayout: release_list_layout },
  theme: { schema: {}, layout: theme_layout, listLayout: theme_list_layout },
  initiative: { schema: {}, layout: initiative_layout, listLayout: initiative_list_layout },
  // rename on client
  surveys: { schema: survey_schema, layout: surveyList_layout },
  survey: { schema: survey_schema, layout: survey_layout, listLayout: surveyList_layout, sendLayout: send_layout },
  // rename usage on client
  'survey/participant': { schema: surveyParticipant_schema, panelSchema: panel_schema, layout: surveyParticipant_layout },
  'survey/response': { schema: person_schema, list_layout: response_list_layout, responseSchema: response_schema, responseLayout: response_layout },
  panel: {
    schema: panel_schema,
    personSchema: person_schema,
    layout: panel_layout,
    listLayout: panel_list_layout
  },
  'panel/participant': {
    schema: person_schema,
    listLayout: person_list_layout,
    internalLayout: internal_list_layout
  },
  'survey/design': { schema: {}, layout: {} },
  'profile': { schema: customfield_schema, listLayout: custom_field_layout },
  'profile/users': { schema: profile_schema, layout: profile_layout, listLayout: profile_list_layout },
  'profile/import': {
    schema: import_schema,
    listLayout: import_list_layout,
    mappingSchemas: {
      'base': base_record_schema,
      'product': product_import_schema,
      'idea': idea_import_schema,
      'feature': feature_import_schema,
      'productLine': product_line_import_schema,
      'initiative': initiative_import_schema,
      'release': release_import_schema,
      'theme': theme_import_schema,
    },
  },
  schema: { definitions }
};

// describes what needs to be changed in schemas per user role
const roleMutations = {
  admin: {
    'profile/users': { layout: profile_admin_layout }
  }
};

// changes the schemas depending on user roles
export function getSchemasWithRoles(originalSchemas, roles = [], mutations = roleMutations) {
  const updatedSchemas = cloneDeep(originalSchemas);
  roles.forEach((role) => {
    const roleName = role.uniqueName;
    Object.keys(mutations[roleName] || {}).forEach((branch) => {
      updatedSchemas[branch] = { ...(updatedSchemas[branch] || {}), ...mutations[roleName][branch] };
    });
  });
  return updatedSchemas;
}

import axios from 'axios';
const { SERVICE_PROTOCOL, SOR_SERVICE_BASE } = process.env;
const ENUM_SERVICE_BASE_URL = `${SOR_SERVICE_BASE}/tenants`;
const sorClient = axios.create({
  // URL endpoint default base.
  baseURL: ENUM_SERVICE_BASE_URL,
  // Fails if request takes longer than 7 seconds.
  timeout: process.env.DEFAULT_CONNECTION_TIMEOUT,
});

const sorObjects = ['idea', 'product', 'feature'];

/**
 * DEPRECATED
 * Get Expanded Schemas (including options for enums) for tenant.
 * @param tenant -- tenant uniqueName
 * @returns a promise which resolves to the expanded schema.
 */

/*export const expandedSchemas = (tenant) => {
  // build a list of all enums to request from the backend.
  let enums = {};
  for (let branch in schemas) {
    for (let fn in schemas[branch].schema.properties) {
      const f = schemas[branch].schema.properties[fn];
      if(f.endpoint && f.endpoint.indexOf('/enums/') === 0)
        enums[f.endpoint] = sorObjects.filter(o => f.endpoint.indexOf(o) > 0).length > 0;
    }
  }

  // aggregate a map of enums and then apply them to the schemas
  return Promise.all(
    Object.keys(enums).map((e) => {
      const sorEnum = enums[e];
      console.log('enum:', e, sorEnum);
      const service = sorEnum ? sorClient : enumService;
      return service({
        method: 'GET',
        url: `${tenant}${e}`
      }).then(res => ({ [e]: res.data.content }));
    }), res => console.log('error getting enums:', res))
    .then((r) => {
      const enumMap = r.reduce((m, i) => ({ ...m, ...i }), {});

      let expSchemas = {};
      for (let branch in schemas)
        expSchemas[branch] = {
          ...schemas[branch],
          schema: expandEndpoints(schemas[branch].schema, enumMap)
        };
      return expSchemas;
    });
};*/

// build initial state based on schema
export function initialData(schema) {
  let state = {};
  for (let key in schema) {
    switch(key) {
      case'title': {
        state.title = schema.title;
        break;
      }
      case'label': {
        state.label = schema.label;
        break;
      }
      case'properties': {
        let properties = schema.properties;
        for (let prop in properties) {
          switch(properties[prop].type) {
            case'string': {
              state[prop] = '';
              break;
            }
            case'array': {
              state[prop] = [];
              break;
            }
            case'integer':
            case'number':
            case'date':
            default: {
              state[prop] = null;
              break;
            }
          }
        }
        break;
      }
      default:
        break;
    }
  }
  return state;
}

// expand the schema with options
export function expandEndpoints(schema, enumMap) {
  let expSchema = { ...schema };
  for (let prop in schema.properties) {
    if(schema.properties[prop].endpoint
      && enumMap[schema.properties[prop].endpoint]) {
      expSchema.properties[prop].options = enumMap[schema.properties[prop].endpoint];
    }
  }
  return expSchema;
}

export function getSchema(req, res) {
  let { tenant, type } = req.params;
  return res(initialData(schemas[type]));
}

export function init(req, res) {
  let { type } = req.params;
  let schema = schemas[type];
  return res(schema);
}

export function initAll(req, res) {
  return res(schemas);
}

export function addCustomFieldToLayout(schema, layout) {
  if(!schema.customFields || schema.customFields.length === 0)
    return;

  // find the section "Additional Info"
  for(let i = 0; i < layout.sections.length; i++) {
    let section = layout.sections[i];
    if(section.title === 'Additional Info') {
      for(let j = 0; j < schema.customFields.length; j++) {
        let fieldName = schema.customFields[j];
        section.bindings.push(fieldName);
      }
    }
  }
}

