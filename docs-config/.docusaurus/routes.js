import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs/',
    component: ComponentCreator('/docs/', '305'),
    routes: [
      {
        path: '/docs/',
        component: ComponentCreator('/docs/', '29e'),
        routes: [
          {
            path: '/docs/',
            component: ComponentCreator('/docs/', 'b03'),
            routes: [
              {
                path: '/docs/functions/',
                component: ComponentCreator('/docs/functions/', '248'),
                exact: true,
                sidebar: "default"
              },
              {
                path: '/docs/functions/globals',
                component: ComponentCreator('/docs/functions/globals', 'e64'),
                exact: true,
                sidebar: "default"
              },
              {
                path: '/docs/',
                component: ComponentCreator('/docs/', '1ac'),
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
