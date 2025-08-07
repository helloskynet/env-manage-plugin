export default {
  port: 3099,
  basePath: '/dev-manage-api',
  indexPage: '/Test',
  devServerList: [
    {
      name: 'dev1',
      target: 'http://localhost:5173',
    },
    {
      name: 'dev2025',
      target: 'http://localhost:5173',
    },
  ],
  envList: [
    {
      name: 'dev',
      port: 3000,
      target: 'http://localhost:3010',
      router: (req, env) => {
        return env.target
      },
    },
    {
      name: 'test',
      port: 3001,
      target: 'http://localhost:3011',
      indexPage: '/Test',
    },
    {
      name: 'prod',
      port: 3002,
      target: 'http://localhost:3012',
      indexPage: '/Test',
    },
    {
      name: 'prod3013',
      port: 3003,
      target: 'http://localhost:3013',
      indexPage: '/Test',
    },
    {
      name: 'prod20',
      port: 3004,
      target: 'http://localhost:3020',
      indexPage: '/Test',
    },
    {
      name: 'prod201',
      port: 3004,
      target: 'http://localhost:3013',
      indexPage: '/Test',
    },
  ],
}
