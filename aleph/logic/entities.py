from __future__ import absolute_import

import logging

from aleph.core import db, celery, USER_QUEUE, USER_ROUTING_KEY
from aleph.model import Entity, EntityIdentity, Alert
from aleph.model.common import merge_data
from aleph.index import index_entity, flush_index, delete_entity_leads
from aleph.index import delete_entity as index_delete
from aleph.index.entities import finalize_index
from aleph.search import load_entity
from aleph.logic.leads import generate_leads

log = logging.getLogger(__name__)


def fetch_entity(entity_id):
    """Load entities from both the ES index and the database."""
    entity = load_entity(entity_id)
    obj = Entity.by_id(entity_id)
    if obj is not None:
        if entity is not None:
            entity.update(obj.to_dict())
        else:
            entity = obj.to_index()
            entity = finalize_index(entity, obj.schema)
        entity['ids'] = EntityIdentity.entity_ids(entity_id)
    elif entity is not None:
        entity['ids'] = [entity.get('id')]
    return entity, obj


def combined_entity(entity):
    """Use EntityIdentity mappings to construct a combined model of the
    entity with all data applied."""
    if 'id' not in entity:
        return entity
    if 'ids' not in entity:
        entity['ids'] = EntityIdentity.entity_ids(entity['id'])
    combined = dict(entity)
    for mapped_id in entity['ids']:
        if mapped_id == entity['id']:
            continue
        mapped = load_entity(mapped_id)
        if mapped is None:
            continue
        combined = merge_data(combined, mapped)
    return combined


def update_entity(entity):
    reindex_entity(entity)
    update_entity_full.apply_async([entity.id], queue=USER_QUEUE,
                                   routing_key=USER_ROUTING_KEY)
    # needed to make the call to view() work:
    flush_index()


def delete_entity(entity, deleted_at=None):
    entity.delete(deleted_at=deleted_at)
    delete_entity_leads(entity.id)
    update_entity_full(entity.id)


@celery.task()
def update_entity_full(entity_id):
    """Perform update operations on entities."""
    query = db.session.query(Entity).filter(Entity.id == entity_id)
    entity = query.first()
    generate_leads(entity.id)
    reindex_entity(entity)
    Alert.dedupe(entity.id)


def reindex_entity(entity):
    log.info('Index [%s]: %s', entity.id, entity.name)
    if entity.state != Entity.STATE_ACTIVE:
        index_delete(entity.id)
    else:
        index_entity(entity)


@celery.task()
def reindex_entities():
    query = db.session.query(Entity)
    for entity in query.yield_per(5000):
        reindex_entity(entity)
