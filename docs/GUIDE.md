# WireState Guide

## Get Started

### Installation

```
npm install launchfort/wirestate --save
```

### Compiling

Given a statechart like:

```
# App.wirestate
@machine App
  home -> Home
  about -> About
  contact -> Contact

  Home*
  About
  Contact
```

We can compile it to a `json` format using the following CLI:

```
wirestate App.wirestate --generator json > App.wirestate.json
```

The JSON output looks like:

```
{
  "App.wirestate": {
    "type": "scope",
    "wireStateFile": "App.wirestate",
    "imports": [],
    "machines": [
      {
        "type": "machine",
        "id": "App",
        "states": [
          {
            "type": "state",
            "id": "Home",
            "states": [],
            "transitions": [],
            "stateType": "atomic",
            "initial": true,
            "parallel": false,
            "final": false,
            "useDirective": null
          },
          {
            "type": "state",
            "id": "About",
            "states": [],
            "transitions": [],
            "stateType": "atomic",
            "initial": false,
            "parallel": false,
            "final": false,
            "useDirective": null
          },
          {
            "type": "state",
            "id": "Contact",
            "states": [],
            "transitions": [],
            "stateType": "atomic",
            "initial": false,
            "parallel": false,
            "final": false,
            "useDirective": null
          }
        ],
        "transitions": [
          {
            "type": "transition",
            "event": "home",
            "target": "Home",
            "isForbidden": false
          },
          {
            "type": "transition",
            "event": "about",
            "target": "About",
            "isForbidden": false
          },
          {
            "type": "transition",
            "event": "contact",
            "target": "Contact",
            "isForbidden": false
          }
        ]
      }
    ]
  }
}
```
