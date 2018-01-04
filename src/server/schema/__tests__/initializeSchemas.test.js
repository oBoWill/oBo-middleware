import initializeSchemas from '../utils/initializeSchemas';
import { schemas, getSchemasWithRoles, addCustomFieldToLayout } from '../schemas';
import { getSORSchema } from '../../sor/records.js';

jest.mock('../schemas', () => ({
  schemas: {
    'feature/userStory': { test: 'data' },
    'idea': { layout: 'idea_layout' },
    'product': { layout: 'product_layout' },
    'feature': { layout: 'feature_layout' },
    'productLine': { layout: 'productLine_layout' },
    'release': { layout: 'release_layout' },
    'theme': { layout: 'theme_layout' },
    'initiative': { layout: 'initiative_layout' }
  },
  getSchemasWithRoles: jest.fn((schemas, roles) => {
    const { cloneDeep } = require('lodash');
    const schemasClone = cloneDeep(schemas);
    return {...schemasClone, roles };
  }),
  addCustomFieldToLayout: jest.fn((currSchema, currLayout) => {
    currSchema.binding = currLayout;
  })
}));

jest.mock('../../sor/records.js', () => ({
  getSORSchema: jest.fn((req, sorRecordType, cb) => {
    const data = req._mock && req._mock.data && req._mock.data[sorRecordType];
    const success = {
      data: data || `${sorRecordType}_schema_mock`
    };
    return req._mock.returnError === sorRecordType ? cb('getSORSchemaError') : cb(null, success);
  })
}))

afterAll(() => {
  jest.unmock('../schemas');
  jest.unmock('../../sor/records.js');
});

describe('initializeSchemas', () => {
  afterEach(() => {
    getSORSchema.mockClear();
    getSchemasWithRoles.mockClear();
    addCustomFieldToLayout.mockClear();
  });

  it('should use getSchemasWithRoles', (end) => {
    const req = {
      _mock: {}
    };
    const roles = [ 'test', 'roles' ];
    const cb = (err, res) => {
      expect(getSchemasWithRoles).toHaveBeenCalledWith(schemas, roles);
      expect(res.roles).toEqual(roles);
      end();
    };
    initializeSchemas(req, roles, cb);
  });

  it('should use getSORSchema to get data, and update schemas', (end) => {
    const req = {
      _mock: {}
    };
    const roles = [ 'test', 'roles' ];
    const cb = (err, res) => {
      expect(getSORSchema).toHaveBeenCalledTimes(8);
      expect(err).toBe(null);
      const expected = {
        'feature/userStory': { test: 'data', schema: 'userStories_schema_mock' },
        idea: { layout: 'idea_layout', schema: 'ideas_schema_mock' },
        product: { layout: 'product_layout', schema: 'products_schema_mock' },
        feature: { layout: 'feature_layout', schema: 'features_schema_mock' },
        productLine: { layout: 'productLine_layout', schema: 'productLines_schema_mock' },
        release: { layout: 'release_layout', schema: 'releases_schema_mock' },
        theme: { layout: 'theme_layout', schema: 'themes_schema_mock' },
        initiative: { layout: 'initiative_layout', schema: 'initiatives_schema_mock' },
        roles
      };
      expect(res).toEqual(expected);
      end();
    };
    initializeSchemas(req, roles, cb);
  });

  it('should use addCustomFieldToLayout if schema have customFilelds', (end) => {
    const req = {
      _mock: {
        data: {
          releases: { customFields: ['custom_fields'] }
        }
      }
    };
    const roles = [ 'test', 'roles' ];
    const cb = (err, res) => {
      expect(err).toBe(null);
      expect(addCustomFieldToLayout).toHaveBeenCalledTimes(1);
      const expected = {
        layout: 'release_layout',
        schema: {
          binding: 'release_layout',
          customFields: ['custom_fields']
        }
      };
      expect(res.release).toEqual(expected)
      end();
    };
    initializeSchemas(req, roles, cb);
  });

  it('should handle loading error', (end) => {
    const req = {
      _mock: {
        returnError: 'releases'
      }
    };
    const roles = [ 'test', 'roles' ];
    const cb = (err, res) => {
      expect(err).toBe('getSORSchemaError');
      expect(res.release).toEqual(schemas.release);
      end();
    };
    initializeSchemas(req, roles, cb);
  });
});
