import {authToken} from '../lib/authentication.js';
import {getOrThrow, config} from '../lib/config.js';
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
  const entity = entities.find(e => e.name == entityName);
  if (entity == null) {
    throw new Error(`No entity found with name "${entityName}"`);
  }
  config.set('lastUsedEntityId', entity.id);
  return entity.id;
};
