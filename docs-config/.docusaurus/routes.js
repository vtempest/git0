import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/Footer',
    component: ComponentCreator('/Footer', '86a'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '320'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '87c'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '1d6'),
            routes: [
              {
                path: '/functions/',
                component: ComponentCreator('/functions/', '5b3'),
                exact: true,
                sidebar: "default"
              },
              {
                path: '/functions/git0',
                component: ComponentCreator('/functions/git0', '8bf'),
                exact: true,
                sidebar: "default"
              },
              {
                path: '/functions/github-api',
                component: ComponentCreator('/functions/github-api', 'da5'),
                exact: true,
                sidebar: "default"
              },
              {
                path: '/functions/modules',
                component: ComponentCreator('/functions/modules', 'f7f'),
                exact: true,
                sidebar: "default"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
