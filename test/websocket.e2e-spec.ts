import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import configuration from '../src/config/configuration';

describe('WebSocket Events (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let clientSocket: Socket;
  let serverUrl: string;

  // Test user data
  const testUser = {
    sub: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };

  const testWorkspaceId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';
  const testProjectId = 'fccbcd31-f0cb-433f-a308-71379cf865ac';

  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.REDIS_DB = '0';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    process.env.JWT_SECRET = 'test-jwt-secret-for-websocket-testing';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.listen(0); // Use random available port
    const server = app.getHttpServer();
    const address = server.address();
    const port = typeof address === 'string' ? address : address?.port;
    serverUrl = `http://localhost:${port}`;
  }, 30000);

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    await app.close();
  }, 30000);

  beforeEach(() => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
  });

  describe('Core WebSocket Functionality', () => {
    it('should connect and authenticate successfully', (done) => {
      const token = jwtService.sign(testUser);

      clientSocket = io(serverUrl, {
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should join workspace and broadcast file changes', (done) => {
      const token = jwtService.sign(testUser);

      clientSocket = io(serverUrl, {
        transports: ['websocket'],
        auth: { token },
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('join-workspace', { workspaceId: testWorkspaceId });
      });

      clientSocket.on('workspace-joined', (data) => {
        expect(data).toHaveProperty('workspaceId', testWorkspaceId);

        // Test file change after joining
        clientSocket.emit('file-change', {
          workspaceId: testWorkspaceId,
          projectId: testProjectId,
          filePath: '/src/main.ts',
          changes: { type: 'insert', line: 10, text: 'console.log("test");' },
        });
      });

      clientSocket.on('file-changed', (data) => {
        expect(data).toHaveProperty('workspaceId', testWorkspaceId);
        expect(data).toHaveProperty('userId', testUser.sub);
        done();
      });

      clientSocket.on('error', (error) => {
        done(error);
      });
    });

    it('should reject unauthorized access', (done) => {
      clientSocket = io(serverUrl, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('join-workspace', { workspaceId: testWorkspaceId });
      });

      clientSocket.on('error', (error) => {
        expect(error).toHaveProperty('message', 'Authentication required');
        done();
      });
    });
  });
});
