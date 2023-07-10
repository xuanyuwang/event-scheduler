import * as fs from 'node:fs/promises';
import { parse } from 'node:path';

async function parseEvent(eventFolder) {
    /*
     * read event definition from event.json
     */
    let eventDefinition = await fs
        .readFile(`${eventFolder}/definition.json`, 'utf-8')
        .then((data) => JSON.parse(data));

    const handlerModulePath = `${eventFolder}/${eventDefinition.start.module}`;

    const handlerModule = await import(handlerModulePath);
    const startHandler = handlerModule[eventDefinition.start.function];
    return {
        name: eventDefinition.name,
        start: startHandler,
    };
}

async function parseEventDependencies(dependenciesFilePath) {
    /*
     * read event dependencies from dependencies.json
     */
    let eventDependencies = await fs
        .readFile(dependenciesFilePath, 'utf-8')
        .then((data) => JSON.parse(data));
    return eventDependencies;
}

async function parseEvents(eventsPath) {
    /*
     * read events from defitinion.json under each folder under `events`
     */
    const eventFiles = await fs.readdir(eventsPath);
    const events = [];
    let dependencies;
    for (const file of eventFiles) {
        let stat;
        stat = await fs.stat(`${eventsPath}/${file}`);
        if (stat.isDirectory()) {
            const eventDefinition = await parseEvent(`${eventsPath}/${file}`);
            events.push(eventDefinition);
        } else if (stat.isFile() && file === 'dependencies.json') {
            dependencies = await parseEventDependencies(
                `${eventsPath}/${file}`,
            );
        }
    }
    return {
        events,
        dependencies,
    };
}

const { events, dependencies } = await parseEvents('./events');
