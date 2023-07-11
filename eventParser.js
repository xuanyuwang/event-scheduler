import * as fs from 'node:fs/promises';

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


class EventNode {
    constructor(name, children) {
        this.name = name;
        this.children = children;
    }
}

function buildEventNodes(dependencies) {
    /*
     * validate event dependencies
     */
    const eventNodes = new Map();
    for(const [eventKey, eventAttributes] of Object.entries(dependencies)) {
        if(eventNodes.has(eventKey)){
            throw new Error(`Event ${eventKey} is defined more than once`);
        }else{
            eventNodes[key] = new EventNode(eventKey, eventAttributes.children);
        }
    }
    return eventNodes;
}

function findEventDependenciesRoot(eventNodes) {
    const inDegree = new Map();
    for (const [eventKey, eventNode] of eventNodes) {
        for (const child of eventNode.children) {
            if (!inDegree.has(child)) {
                inDegree.set(child, 0);
            }
            inDegree.set(child, inDegree.get(child) + 1);
        }
    }
    const zeroIndegree = [];
    for(const [eventKey, inDegree] of inDegree){
        if(inDegree === 0){
            zeroIndegree.push(eventKey);
        }
    }
    if(zeroIndegree.length === 0){
        throw new Error(`No root event found. Please check dependencies.json`);
    }else if(zeroIndegree.length > 1){
        throw new Error(`More than one root event found. Please check dependencies.json`);
    }else{
        return zeroIndegree[0];
    };
}

function validateEventDependencies(root, eventNodes) {
    /*
    * validate event dependencies
    */
    const visited = new Set();
    let queue = [root];
    while (queue.length > 0) {
        let newQueue = [];
        for (const eventKey of queue) {
            if (visited.has(eventKey)) {
                throw new Error(`Event ${eventKey} is defined more than once`);
            }
            visited.add(eventKey);
            const eventNode = eventNodes[eventKey];
            for (const child of eventNode.children) {
                newQueue.push(child);
            }
        }
        queue = newQueue;
    }
}

function validateEventsInDependencies(events, eventNodes) {
    const validEventKeys = new Set();
    events.forEach((event) => validEventKeys.add(event.name));
    for(const eventKey of eventNodes.keys()){
        if(!events.has(eventKey)){
            throw new Error(`Event ${eventKey} is defined in dependencies.json but not in events folder`);
        }
    }
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
