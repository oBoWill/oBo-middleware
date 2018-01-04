import * as sorRecords from '../../sor/records.js';
import expectLib from 'expect';

import {
  schemas,
  getSchemasWithRoles,
  initialData,
  expandEndpoints,
  getSchema,
  init,
  initAll,
  addCustomFieldToLayout
} from '../schemas';

let getSORSchemaError = false;
beforeAll(() => {
  expectLib.spyOn(sorRecords, 'getSORSchema').andCall((req, sorRecordType, cb) => {

  });
});

afterAll(() => {
  expectLib.restoreSpies();
});

describe('schemas', () => {
  describe('getSchemasWithRoles', () => {
    const schemas = {
      'test/branch1': {
        schema: {},
        layout: { test: 'layout1' },
        listLayout: { test: 'listLayout1'}
      },
      'test/branch2': {
        schema: {},
        layout: { test: 'layout2' },
        listLayout: { test: 'listLayout2'}
      },
    };

    it('should return new schemas object', () => {
      const result = getSchemasWithRoles(schemas);
      expect(result).not.toBe(schemas);
      expect(result).toEqual(schemas);
    });

    it('should update scheemas depending on user roles', () => {
      const roles = [{ uniqueName: 'test' }, { uniqueName: 'user3' }, { uniqueName: 'user4' }];
      const mutations = {
        test: {
          'test/branch1': {
            layout: { test: 'test_updated' }
          },
          'test/branch2': {
            schema: { test: 'test' }
          }
        },
        user4: {
          'test/branch2': {
            listLayout: { test: 'user4_updated' }
          }
        }
      };
      const result = getSchemasWithRoles(schemas, roles, mutations);
      expect(result['test/branch1'].layout.test).toBe('test_updated');
      expect(result['test/branch2'].schema.test).toBe('test');
      expect(result['test/branch2'].listLayout.test).toBe('user4_updated');
    });
  });

  describe('initialData', () => {
    it('should handle title', () => {
      const schema = {
        title: 'test'
      };
      const result = initialData(schema);
      expect(schema).toEqual(result);
      expect(schema).not.toBe(result);
    });

    it('should handle label', () => {
      const schema = {
        label: 'test'
      };
      const result = initialData(schema);
      expect(schema).toEqual(result);
    });

    it('should handle properties', () => {
      const schema = {
        properties: {
          prop1: { type: 'string', value: 'test' },
          prop2: { type: 'array', test: 'value' },
          prop3: { type: 'integer', value: 'test' },
          prop4: { type: 'number', test: 'value' },
          prop5: { type: 'date', value: 'test' },
          prop6: { type: 'test', test: 'value' },
        }
      };
      const expected = {
        prop1: '',
        prop2: [],
        prop3: null,
        prop4: null,
        prop5: null,
        prop6: null,
      };
      expect(initialData(schema)).toEqual(expected);
    });

    it('should strip all other props', () => {
      const schema = {
        test: 'test',
        some: 'data'
      };
      expect(initialData(schema)).toEqual({});
    });
  });

  describe('expandEndpoints', () => {
    it('should expand the schema with options', () => {
      const schema = {
        test: { test: {} },
        properties: {
          prop1: { type: 'date', endpoint: 'prop1_endpoint_mock' },
          prop2: { type: 'string', endpoint: 'prop2_endpoint_mock' },
          prop3: { type: 'string' },
          prop4: { type: 'string' },
        }
      };
      const enumMap = {
        'prop1_endpoint_mock': 'mapped_prop1_endpoint',
        'prop2_endpoint_mock': 'mapped_prop2_endpoint'
      };
      const result = expandEndpoints(schema, enumMap);
      expect(result).not.toBe(schema);
      expect(result.properties.prop1.options).toBe('mapped_prop1_endpoint');
      expect(result.properties.prop2.options).toBe('mapped_prop2_endpoint');
      expect(result.properties.prop3.options).toBe(undefined);
    });
  });

  describe('getSchema', () => {
    it('should respond with schema with initial data of passed type ', () => {
      const schemasNames = Object.keys(schemas);
      const req = {
        params: {
          type: schemasNames[Math.floor(schemasNames.length / 2)],
          tenant: {}
        }
      };
      const res = jest.fn();
      getSchema(req, res);
      expect(res).toHaveBeenCalledWith(initialData(schemas[req.params.type]));
    });
  });

  describe('init', () => {
    it('it should respond with schema of passed type', () => {
      const schemasNames = Object.keys(schemas);
      const res = jest.fn(v => v);
      const req = {
        params: {
          type: schemasNames[Math.floor(schemasNames.length / 2)]
        }
      };
      expect(init(req, res)).toBe(schemas[req.params.type]);
      expect(res).toHaveBeenCalledWith(schemas[req.params.type]);
    });
  });

  describe('initAll', () => {
    it('it should respond with all schemas', () => {
      const res = jest.fn(v => v);
      const req = {};
      expect(initAll(req, res)).toBe(schemas);
      expect(res).toHaveBeenCalledWith(schemas);
    });
  });

  describe('addCustomFieldToLayout', () => {
    it('should return undefined if schema doesn\'t contain customFields or it\'s empty', () => {
      expect(addCustomFieldToLayout({}, {})).toBe(undefined);
      expect(addCustomFieldToLayout({ customFields: [] }, {})).toBe(undefined);
    });

    it('should add custom fields to "Additional Info" section', () => {
      const schema = {
        customFields: [
          'test_binding_1',
          'test_binding_2'
        ]
      };
      const layout = {
        sections: [
          { title: 'test', bindings: [] },
          { title: 'test2', bindings: [] },
          { title: 'Additional Info', bindings: [] },
        ]
      };
      addCustomFieldToLayout(schema, layout);
      expect(layout.sections[0].bindings).toEqual([]);
      expect(layout.sections[1].bindings).toEqual([]);
      expect(layout.sections[2].bindings).toEqual(schema.customFields);
    });
  });
});