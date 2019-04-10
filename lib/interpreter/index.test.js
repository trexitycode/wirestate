"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var config = {
    name: 'Root',
    states: [
        {
            name: 'MyApp',
            initial: true,
            // parallel: true,
            transitions: [
                { event: 'done.state.MyApp', target: 'Contact' }
            ],
            states: [
                {
                    name: 'Home',
                    transitions: [
                        { event: 'about', target: 'About Contact' }
                    ]
                },
                {
                    name: 'About'
                },
                {
                    name: 'Contact'
                }
            ]
        }
    ]
};
var state = index_1.State.create(config);
var s = new index_1.Interpreter(state);
s.onTransition(function (matches) {
    console.log('TRANSITION');
    console.log('Home:', matches('*.Home'));
    console.log('Contact:', matches('*.Contact'));
    console.log('About:', matches('*.About'));
});
s.onEntry(function (state) {
    console.log('ENTRY');
    console.log(state.id);
});
s.onExit(function (state) {
    console.log('EXIT');
    console.log(state.id);
});
s.onEvent(function (event) {
    console.log('event sent:', event);
});
s.start();
s.send('about');
