import 'reflect-metadata';
import { Container } from 'typedi';
import express from 'express';
import { useContainer as routingControllersUseContainer, useExpressServer } from 'routing-controllers';
import bodyParser from 'body-parser';
import cors from 'cors';
import { TrainerController } from "./api/controllers/TrainerController";
import { VectorController } from './api/controllers/VectorController';
import { CodeExecController } from './api/controllers/CodeExecController';
import { ExternalController } from './api/controllers/ExternalController';
import { ImageVectorController } from './api/controllers/ImageVectorController';
import { SERVER_PORT } from '../config';
import * as dotenv from 'dotenv';
dotenv.config();
export class App {
  private port: Number = SERVER_PORT;
  private app: express.Application = express();
  private server: any = null;

  public constructor() {
    this.bootstrap();
  }

  public async bootstrap() {
    this.useContainers();
    this.serveStaticFiles();
    this.setupMiddlewares();
    this.registerRoutingControllers();
  }

  private useContainers() {
    routingControllersUseContainer(Container);
  }

  private serveStaticFiles() {
    this.app.use('/public', express.static('public'));
  }

  private setupMiddlewares() {
    this.app.use(cors());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json({ limit: '2500mb' }));
  }

  private registerRoutingControllers() {
    useExpressServer(this.app, {
      validation: { stopAtFirstError: true },
      classTransformer: true,
      defaultErrorHandler: false,
      routePrefix: "/api",
      controllers: [TrainerController, VectorController, CodeExecController, ExternalController, ImageVectorController]
    });

    // add health check
    this.app.get('/health', (req, res) => res.send('OK'));

    this.server = require('http').Server(this.app);
    this.server.listen(this.port, () => console.log(`🚀 Server started at http://localhost:${this.port}`));
  }

  public close() {
    if (this.server) {
      this.server.close((err) => {
        if (err) {
          console.error('Error shutting down server:', err);
          process.exit(1);
        }
        console.log('Express server shut down');
        process.exit(0);
      });
    } else {
      console.log('Server not running');
    }
  }
}

const app = new App();

process.on('uncaughtException', (err) => {
  console.log('uncaughtException', err);
  app.close();
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.log('unhandledRejection', err);
  app.close();
  process.exit(1);
});

process.on('SIGINT', () => {
  app.close();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM');
  app.close();
  process.exit(1);
});

process.on('SIGQUIT', () => {
  console.log('SIGQUIT');
  app.close();
  process.exit(1);
});