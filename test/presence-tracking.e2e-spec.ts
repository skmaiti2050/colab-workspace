import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { User } from '../src/entities/user.entity';
import { UserService } from '../src/modules/user/user.service';

describe('Presence Tracking (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let userService: UserService;
  let client1: Socket;
  let client2: Socket;
  let testUser1: User;
  let testUser2: User;
  let token1: string;
  let token2: string;
  const testWorkspaceId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    authService = moduleFixture.get<AuthService>(AuthService);
    userService = moduleFixture.get<UserService>(UserService);

    await app.init();
    await app.listen(0); // Use random available port

    // Create unique test users for this test run
    const timestamp = Date.now();
    const testEmail1 = `testuser1-${timestamp}@example.com`;
    const testEmail2 = `testuser2-${timestamp}@example.com`;
    const testPassword = 'Password123!';

    // Create test users
    testUser1 = await userService.create({
      email: testEmail1,
      name: 'Test User 1',
      password: testPassword,
    });

    testUser2 = await userService.create({
      email: testEmail2,
      name: 'Test User 2',
      password: testPassword,
    });

    // Generate JWT tokens for test users using login
    const authResponse1 = await authService.login({
      email: testUser1.email,
      password: testPassword,
    });
    const authResponse2 = await authService.login({
      email: testUser2.email,
      password: testPassword,
    });

    token1 = authResponse1.accessToken;
    token2 = authResponse2.accessToken;
  });

  afterAll(async () => {
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();

    await app.close();
  });

  beforeEach((done) => {
    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? 3000 : address?.port || 3000;

    client1 = io(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: {
        token: token1,
      },
    });

    client2 = io(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: {
        token: token2,
      },
    });

    let connectedCount = 0;
    const checkConnections = () => {
      connectedCount++;
      if (connectedCount === 2) {
        done();
      }
    };

    client1.on('connect', checkConnections);
    client2.on('connect', checkConnections);

    // Add error handlers to debug connection issues
    client1.on('connect_error', (error) => {
      console.error('Client1 connection error:', error);
    });

    client2.on('connect_error', (error) => {
      console.error('Client2 connection error:', error);
    });
  });

  afterEach(() => {
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();
  });

  it('should track user presence when joining workspace', (done) => {
    let eventsReceived = 0;
    let testCompleted = false;
    const expectedEvents = 2; // user-joined and presence-updated

    const checkCompletion = () => {
      eventsReceived++;
      if (eventsReceived >= expectedEvents && !testCompleted) {
        testCompleted = true;
        done();
      }
    };

    // Client2 listens for user join events
    client2.on('user-joined', (data) => {
      expect(data).toHaveProperty('workspaceId', testWorkspaceId);
      expect(data).toHaveProperty('userId', testUser1.id);
      expect(data).toHaveProperty('username', testUser1.email);
      expect(data).toHaveProperty('timestamp');
      checkCompletion();
    });

    // Client2 listens for presence updates
    client2.on('presence-updated', (data) => {
      expect(data).toHaveProperty('workspaceId', testWorkspaceId);
      expect(data).toHaveProperty('activeUsers');
      expect(data).toHaveProperty('totalUsers');
      expect(data).toHaveProperty('timestamp');
      expect(Array.isArray(data.activeUsers)).toBe(true);
      expect(typeof data.totalUsers).toBe('number');
      checkCompletion();
    });

    // Client2 joins workspace first
    client2.emit('join-workspace', { workspaceId: testWorkspaceId });

    // Wait a bit, then client1 joins
    setTimeout(() => {
      client1.emit('join-workspace', { workspaceId: testWorkspaceId });
    }, 100);
  }, 10000); // Increase timeout to 10 seconds

  it.skip('should handle user leave events and update presence (requires Redis)', (done) => {
    // This test requires Redis to be available for session storage
    // In test environment without Redis, the PresenceService doesn't store sessions
    // so the handleDisconnect method doesn't have session data to broadcast leave events

    let testCompleted = false;

    // Client2 listens for user leave events
    client2.on('user-left', (data) => {
      console.log('Received user-left event:', data);
      if (!testCompleted) {
        expect(data).toHaveProperty('workspaceId', testWorkspaceId);
        expect(data).toHaveProperty('userId', testUser1.id);
        expect(data).toHaveProperty('username', testUser1.email);
        expect(data).toHaveProperty('timestamp');
        testCompleted = true;
        console.log('User leave test completed successfully');
        done();
      }
    });

    // Listen for disconnect events on client1
    client1.on('disconnect', () => {
      console.log('Client1 disconnected');
    });

    // Both clients join workspace
    let joinedCount = 0;
    const handleJoin = () => {
      joinedCount++;
      console.log(`Client joined workspace, count: ${joinedCount}`);
      if (joinedCount === 2) {
        // Both joined, wait a bit then disconnect client1
        console.log('Both clients joined, waiting then disconnecting client1...');
        setTimeout(() => {
          console.log('Disconnecting client1 now...');
          client1.disconnect();
        }, 500);
      }
    };

    client1.on('workspace-joined', () => {
      console.log('Client1 joined workspace');
      handleJoin();
    });

    client2.on('workspace-joined', () => {
      console.log('Client2 joined workspace');
      handleJoin();
    });

    // Start the test
    console.log('Emitting join-workspace events...');
    client1.emit('join-workspace', { workspaceId: testWorkspaceId });
    client2.emit('join-workspace', { workspaceId: testWorkspaceId });
  }, 30000);

  it('should respond to presence requests', (done) => {
    client1.on('workspace-presence', (data) => {
      expect(data).toHaveProperty('workspaceId', testWorkspaceId);
      expect(data).toHaveProperty('activeUsers');
      expect(data).toHaveProperty('totalUsers');
      expect(data).toHaveProperty('timestamp');
      expect(Array.isArray(data.activeUsers)).toBe(true);
      done();
    });

    // Join workspace first
    client1.on('workspace-joined', () => {
      // Request presence information
      client1.emit('get-workspace-presence');
    });

    client1.emit('join-workspace', { workspaceId: testWorkspaceId });
  }, 10000); // Increase timeout to 10 seconds

  it('should handle ping/pong for activity tracking', (done) => {
    client1.on('pong', (data) => {
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.timestamp).toBe('string'); // Timestamps are serialized as strings over WebSocket
      done();
    });

    // Join workspace first
    client1.on('workspace-joined', () => {
      // Send ping to update activity
      client1.emit('ping');
    });

    client1.emit('join-workspace', { workspaceId: testWorkspaceId });
  }, 10000); // Increase timeout to 10 seconds

  it('should update activity on file changes', (done) => {
    const fileChangeData = {
      workspaceId: testWorkspaceId,
      projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
      filePath: '/src/test.ts',
      changes: {
        operation: 'insert',
        position: { line: 1, column: 0 },
        content: 'console.log("test");',
        length: 19,
      },
    };

    client2.on('file-changed', (data) => {
      expect(data).toHaveProperty('workspaceId', testWorkspaceId);
      expect(data).toHaveProperty('projectId');
      expect(data).toHaveProperty('filePath');
      expect(data).toHaveProperty('changes');
      expect(data).toHaveProperty('userId', testUser1.id);
      expect(data).toHaveProperty('timestamp');
      done();
    });

    // Both clients join workspace
    let joinedCount = 0;
    const handleJoin = () => {
      joinedCount++;
      if (joinedCount === 2) {
        // Send file change from client1
        client1.emit('file-change', fileChangeData);
      }
    };

    client1.on('workspace-joined', handleJoin);
    client2.on('workspace-joined', handleJoin);

    client1.emit('join-workspace', { workspaceId: testWorkspaceId });
    client2.emit('join-workspace', { workspaceId: testWorkspaceId });
  }, 10000); // Increase timeout to 10 seconds
});
