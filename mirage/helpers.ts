import { faker, ModelAttrs, ModelInstance, ModelRegistry, Server } from 'ember-cli-mirage';

import DraftRegistration from 'ember-osf-web/models/draft-registration';
import Node from 'ember-osf-web/models/node';
import Registration from 'ember-osf-web/models/registration';
import RegistrationSchema from 'ember-osf-web/models/registration-schema';

import { DraftRegistrationTraits } from './factories/draft-registration';
import { NodeTraits } from './factories/node';

export function registerNode(
    server: Server,
    node: ModelInstance<Node>,
    props: Partial<ModelAttrs<Registration>> = {},
    ...traits: string[] // tslint:disable-line trailing-comma
) {
    const registration = server.create('registration', {
        registeredFrom: node,
        category: node.category,
        title: node.title,
        description: node.description,
        registrationSchema: faker.random.arrayElement(
            server.schema.registrationSchemas.all<RegistrationSchema>().models,
        ),
        ...props,
    }, ...traits);
    node.contributors.models.forEach((contributor: any) =>
        server.create('contributor', { node: registration, users: contributor.users }));
    return registration;
}

export function registerNodeMultiple(
    server: Server,
    node: ModelInstance<Node>,
    count: number,
    props: Partial<ModelAttrs<Registration>> = {},
    ...traits: string[] // tslint:disable-line trailing-comma
) {
    const registrations = [];
    for (let i = 0; i < count; i++) {
        registrations.push(registerNode(server, node, props, ...traits));
    }
    return registrations;
}

export function draftRegisterNode(
    server: Server,
    node: ModelInstance<Node>,
    props: Partial<ModelAttrs<DraftRegistration>> = {},
    ...traits: Array<keyof DraftRegistrationTraits> // tslint:disable-line trailing-comma
) {
    return server.create('draft-registration', {
        branchedFrom: node,
        initiator: node.contributors.models.length ? node.contributors.models[0].users : null,
        registrationSchema: faker.random.arrayElement(
            server.schema.registrationSchemas.all<RegistrationSchema>().models,
        ),
        ...props,
    }, ...traits);
}

export function draftRegisterNodeMultiple(
    server: Server,
    node: ModelInstance<Node>,
    count: number,
    props: Partial<ModelAttrs<DraftRegistration>> = {},
    ...traits: Array<keyof DraftRegistrationTraits> // tslint:disable-line trailing-comma
) {
    const draftRegistrations = [];
    for (let i = 0; i < count; i++) {
        draftRegistrations.push(draftRegisterNode(server, node, props, ...traits));
    }
    return draftRegistrations;
}

export function forkNode(
    server: Server,
    node: ModelInstance<Node>,
    props: Partial<ModelAttrs<ModelRegistry['node']>> = {},
    ...traits: Array<keyof NodeTraits> // tslint:disable-line trailing-comma
) {
    const nodeFork = server.create('node', {
        forkedFrom: node,
        category: node.category,
        fork: true,
        title: `Fork of ${node.title}`,
        description: node.description,
        ...props,
    }, ...traits);
    node.contributors.models.forEach((contributor: any) =>
        server.create('contributor', { node: nodeFork, users: contributor.users }));
    return nodeFork;
}
