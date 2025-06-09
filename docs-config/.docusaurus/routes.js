import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/',
    component: ComponentCreator('/', 'b83'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '587'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', 'ad5'),
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
                component: ComponentCreator('/', 'bea'),
                exact: true
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
