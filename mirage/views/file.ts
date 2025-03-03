import { HandlerContext, ModelInstance, Response, Schema } from 'ember-cli-mirage';
import { MirageNode } from 'ember-osf-web/mirage/factories/node';
import DraftNode from 'ember-osf-web/models/draft-node';
import faker from 'faker';

import { guid } from '../factories/utils';
import { process } from './utils';

export function uploadToFolder(this: HandlerContext, schema: Schema) {
    const uploadAttrs = this.request.requestBody;
    const { id: folderId } = this.request.params;
    const { name } = this.request.queryParams;
    const folder = schema.files.find(folderId);

    const randomNum = faker.random.number();
    const fileGuid = guid('file');
    const id = fileGuid(randomNum);
    schema.guids.create({
        id,
        referentType: 'file',
    });

    const uploadedFile = schema.files.create({
        guid: id,
        id,
        size: uploadAttrs.size,
        dateModified: uploadAttrs.lastModified,
        lastTouched: uploadAttrs.lastModifiedDate,
        target: folder.target,
        name,
        provider: 'osfstorage',
    });

    folder.files.models.pushObject(uploadedFile);
    folder.save();

    return uploadedFile;
}

export function uploadToRoot(this: HandlerContext, schema: Schema) {
    const uploadAttrs = this.request.requestBody;
    const { parentID, fileProviderId } = this.request.params;
    const { name } = this.request.queryParams;
    let node;
    if (this.request.url.includes('draft_nodes')) {
        node = schema.draftNodes.find(parentID);
    } else {
        node = schema.nodes.find(parentID);
        if (node.storage && node.storage.isOverStorageCap) {
            return new Response(507, {}, {
                errors: [{ status: '507', detail: 'Unable to upload file. Node has exceeded its storage limit' }],
            });
        }
    }
    const fileProvider = schema.fileProviders.findBy({ providerId: `${node.id}:${fileProviderId}` });
    const { rootFolder } = fileProvider;
    const randomNum = faker.random.number();
    const fileGuid = guid('file');
    const id = fileGuid(randomNum);

    schema.guids.create({
        id,
        referentType: 'file',
    });

    const uploadedFile = schema.files.create({
        guid: id,
        id,
        size: uploadAttrs.size,
        dateModified: uploadAttrs.lastModified,
        lastTouched: uploadAttrs.lastModifiedDate,
        target: node,
        name,
        provider: 'osfstorage',
    });

    rootFolder.files.models.pushObject(uploadedFile);
    rootFolder.save();

    return uploadedFile;
}

export function folderFilesList(this: HandlerContext, schema: Schema) {
    const { folderId } = this.request.params;
    const folder = schema.files.find(folderId);
    return process(schema, this.request, this, folder.files.models.map(file => this.serialize(file).data));
}

export function nodeFilesListForProvider(this: HandlerContext, schema: Schema) {
    const { parentID, fileProviderId } = this.request.params;
    let node;
    if (this.request.url.includes('draft_nodes')) {
        node = schema.draftNodes.find(parentID);
    } else if (this.request.url.includes('registrations')) {
        node = schema.registrations.find(parentID);
    } else {
        node = schema.nodes.find(parentID);
    }
    const fileProvider = schema.fileProviders.findBy({ providerId: `${node.id}:${fileProviderId}` });
    const { rootFolder } = fileProvider;
    return process(schema, this.request, this, rootFolder.files.models.map(file => this.serialize(file).data));
}

export function nodeFileProviderList(this: HandlerContext, schema: Schema) {
    const { parentID } = this.request.params;
    let node: ModelInstance<DraftNode> | ModelInstance<MirageNode>;
    if (this.request.url.includes('draft_nodes')) {
        node = schema.draftNodes.find(parentID);
    } else if (this.request.url.includes('registrations')) {
        node = schema.registrations.find(parentID);
    } else {
        node = schema.nodes.find(parentID);
    }

    const fileProviders = schema.fileProviders.all().models;
    const nodeFileProviders = fileProviders.filter(fp => fp.targetId.id === node.id);

    return process(
        schema,
        this.request,
        this,
        nodeFileProviders
            .map(fp => this.serialize(fp).data), { defaultSortKey: 'last_modified' },
    );
}
