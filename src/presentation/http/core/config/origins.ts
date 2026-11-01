import dotenv from 'dotenv';

dotenv.config();

const devOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4321',
  'http://localhost:5173',
  'http://192.168.1.42:3000',
  'http://mac.local:3000',
  'http://mac.local:3001',
  'http://192.168.1.250:3000',
  'https://devconnect.savaldev.com',

];

const prodOrigins = [
  'https://connect.kambocolombia.com',
  'https://www.connect.kambocolombia.com',
];

const test = [
  'https://connect-beta.savaldev.com',
];

let origins;

switch (process.env.ENV) {
  case 'development':
    origins = devOrigins;
    break;

  case 'production':
    origins = prodOrigins;
    break;

  case 'test':
    origins = test;
    break;

  default:
    origins = devOrigins;
    break;
}

export default origins as string[];
