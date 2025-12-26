import * as http from 'http';

interface HealthCheckOptions {
  hostname: string;
  port: number;
  path: string;
  method: string;
  timeout: number;
}

const options: HealthCheckOptions = {
  hostname: 'localhost',
  port: parseInt(process.env.PORT || '3000', 10),
  path: '/health',
  method: 'GET',
  timeout: 2000,
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => {
  process.exit(1);
});

request.on('timeout', () => {
  request.destroy();
  process.exit(1);
});

request.end();
