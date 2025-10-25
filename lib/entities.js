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

function selectEntity(args) {
  withSpinner('Selecting entity...', async () => {
    const entityId = await fetchEntityId(args.entity);
    return entityId;
  }).then(entityId => {
    console.log(`Selected entity with ID: ${chalk.green(entityId)}`);
  }).catch(error => {
    console.log(chalk.red('ERROR'), error);
  });
}

function showSelectedEntity() {
  withSpinner('Fetching selected entity...', async () => {
    const entityId = config.get('lastUsedEntityId');
    if (entityId == null) {
      return null;
    }
    const entities = await fetchEntities();
    return entities.find(e => e.id === entityId);
  }).then(entity => {
    if (entity == null) {
      console.log('No entity currently selected');
    } else {
      console.log(`Currently selected entity: ${chalk.green(entity['entity/name'])} (ID: ${entity.id})`);
    }
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
  yargs.command(
    'entity-select <entity>',
    'Select an entity as the current working entity',
    {},
    selectEntity
  );
  yargs.command(
    'entity-show',
    'Show the currently selected entity',
    {},
    showSelectedEntity
  );
};
