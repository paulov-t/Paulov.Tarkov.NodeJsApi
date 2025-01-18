// swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Paulov WebServer NodeJs Api (Open Api)',
      version: '1.0.0',
      description: 'Swagger documentation of NodeJs Api',
    },
  },
  apis: ['./routes/**/*.js','./controllers/**/*.js'], // Path to your API routes
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
};