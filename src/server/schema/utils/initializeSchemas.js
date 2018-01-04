import { schemas, getSchemasWithRoles, addCustomFieldToLayout } from '../schemas';


import async from 'async/lib/async.js';
import { getSORSchema } from '../../sor/records.js';

export default function initializeSchemas(req, roles, callback) {
  let resolvedSchemas = getSchemasWithRoles(schemas, roles);

  // we fetch the schemas and replace schema objects with proper values
  let sorObjs = ['idea', 'product', 'feature', 'userStory', 'productLine', 'release', 'theme', 'initiative']; // TODO: will fix use story etc
  async.map(sorObjs, (item, cb) => {
    let sorRecordType = (item === 'userStory') ? 'userStories' : `${item}s`;
    getSORSchema(req, sorRecordType, (err, resp) => {
      if(!err) {
        // no errors
        console.log(`schema for record type ${item}: ${JSON.stringify(resp.data)}`);
        let currSchema = null;
        let currLayout = null;
        let schemaEntry = null;
        if(item === 'userStory') {
          schemaEntry = resolvedSchemas['feature/userStory'];
          schemaEntry.schema = resp.data;
          currSchema = schemaEntry.schema;
          currLayout = schemaEntry.layout;
        } else {
          schemaEntry = resolvedSchemas[item];
          schemaEntry.schema = resp.data;
          currSchema = schemaEntry.schema;
          currLayout = schemaEntry.layout;
        }
        // initialize the layout schema
        if(currSchema.customFields && currSchema.customFields.length > 0)
          addCustomFieldToLayout(currSchema, currLayout);

        cb(null, null);// must call the callback otherwise map won't end
      } else {
        cb(err, null);
      }
    });
  },
  (err, results) => {
    callback(err, resolvedSchemas);
  });
}
