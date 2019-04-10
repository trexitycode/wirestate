export const config = {
  'name': 'App',
  'transitions': [
    {
      'event': 'home',
      'target': 'Home'
    },
    {
      'event': 'about',
      'target': 'About'
    },
    {
      'event': 'contact',
      'target': 'Contact'
    }
  ],
  'states': [
    {
      'name': 'Home',
      'initial': true
    },
    {
      'name': 'About'
    },
    {
      'name': 'Contact'
    }
  ]
}
