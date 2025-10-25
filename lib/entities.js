import {authToken} from '../lib/authentication.js';
import {getOrThrow, config} from '../lib/config.js';
import {withSpinner} from '../lib/util.js';
import chalk from 'chalk';
import http from 'axios';

export const fetchEntities = async () => {
  const opts = {
    url: `${getOrThrow('apiBaseUri')}/entities`,
    method: 'get',
    headers: {
      'Authorization': `Bearer ${authToken(true)}`
    }
  };

  const res = await http(opts);
  return res.data
};

export const fetchEntityId = async (entityName) => {
  if (entityName == null) {
    return getOrThrow('lastUsedEntityId')
  }
  const entities = await fetchEntities();
  const entity = entities.find(e => e['entity/name'] == entityName);
  if (entity == null) {
    throw new Error(`No entity found with name "${entityName}"`);
  }
  config.set('lastUsedEntityId', entity.id);
  return entity.id;
};

function listEntities() {
  withSpinner('Fetching entities...', async () => {
    return await fetchEntities();
  }).then(entities => {
    entities.forEach(e => {
      console.log(e['entity/name']);
    });
  }).catch(error => {
    console.log(chalk.red('ERROR'), error);
  });
}

export default (yargs) => {
  yargs.command(
    'entity-list',
    'List all entities',
    {},
    listEntities
  );
};
