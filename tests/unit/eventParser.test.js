import { assert } from 'chai';
import { suite, test } from 'mocha';
import {
    EventParser,
    EventDefinition,
    EventDependencyParser,
    EventNode,
} from '../../src/eventParser.js';

suite('EventParser', function () {
    suite('buildEventFromDefinition', function () {
        test('should return an EventConfiguration object', function () {
            const eventDefinition = new EventDefinition('event1', 'event1', {
                module: 'module',
                function: 'function',
            });
            const event = EventParser.buildEventFromDefinition(eventDefinition);
            assert.strictEqual(event.name, 'event1');
            assert.strictEqual(event.definition, eventDefinition);
            assert.lengthOf(event.children, []);
        });
    });
});

suite('EventDependencyParser', function () {
    suite('buildEventDependencyGraph', function () {
        test('should build event dependency graph', function () {
            const eventDependencies = {
                'event-1': {
                    children: ['event-2', 'event-3'],
                },
            };
            const graph =
                EventDependencyParser.buildEventDependencyGraph(
                    eventDependencies,
                );
            assert.lengthOf(graph, 3);
            const event1 = graph.get('event-1');
            const event2 = graph.get('event-2');
            const event3 = graph.get('event-3');
            assert.strictEqual(event1.id, 'event-1');
            assert.deepStrictEqual(event1.children, [event2, event3]);
        });
    });

    suite('findEventDependenciesRoot', function () {
        test('should find event dependencies root', function () {
            const event1 = new EventNode('event-1', []);
            const event2 = new EventNode('event-2', []);
            const event3 = new EventNode('event-3', []);
            event1.children = [event2, event3];
            const eventNodes = new Map();
            eventNodes.set('event-1', event1);
            eventNodes.set('event-2', event2);
            eventNodes.set('event-3', event3);
            const root =
                EventDependencyParser.findEventDependenciesRoot(eventNodes);
            assert.strictEqual(root, event1);
        });
    });

    suite('validateEventDependencies', function () {
        test('should validate event dependencies', function () {
            const event1 = new EventNode('event-1', []);
            const event2 = new EventNode('event-2', []);
            const event3 = new EventNode('event-3', []);
            event1.children = [event2];
            event2.children = [event3];
            event3.children = [event2];
            const eventNodes = new Map();
            eventNodes.set('event-1', event1);
            eventNodes.set('event-2', event2);
            eventNodes.set('event-3', event3);
            assert.throws(() =>
                EventDependencyParser.validateEventDependencies(
                    event1,
                    eventNodes,
                ),
            );
        });
    });

    suite('validateEventExistences', function () {
        test('should validate event existences', function () {
            const event1 = new EventNode('event-1', []);
            const event2 = new EventNode('event-2', []);
            const event3 = new EventNode('event-3', []);
            event1.children = [event2];
            event2.children = [event3];
            const eventNodes = new Map();
            eventNodes.set('event-1', event1);
            eventNodes.set('event-2', event2);
            eventNodes.set('event-3', event3);

            const event1Definition = new EventDefinition('event1', 'event-1', {
                module: 'module',
                function: 'function',
            });
            const event2Definition = new EventDefinition('event2', 'event-2', {
                module: 'module',
                function: 'function',
            });
            const events = [
                new Event('event1', event1Definition, []),
                new Event('event2', event2Definition, []),
            ];
            assert.throws(() =>
                EventDependencyParser.validateEventExistences(
                    events,
                    eventNodes,
                ),
            );
        });
    });
});
