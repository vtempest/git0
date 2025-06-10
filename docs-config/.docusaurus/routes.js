import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/customize-home',
    component: ComponentCreator('/customize-home', '55b'),
    exact: true
  },
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
    component: ComponentCreator('/', 'f42'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '625'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', 'b12'),
            routes: [
              {
                path: '/functions/',
                component: ComponentCreator('/functions/', '5b3'),
                exact: true,
                sidebar: "default"
              },
              {
                path: '/functions/globals',
                component: ComponentCreator('/functions/globals', 'a2b'),
                exact: true,
                sidebar: "default"
              },
              {
                path: '/',
                component: ComponentCreator('/', '825'),
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
