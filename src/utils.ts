import * as crypto from 'crypto';
import { type Config } from './types';
import { type JwtPayload } from 'jsonwebtoken';

export function generateJti(): string {
  return crypto.randomUUID();
}

export function generateDnonce(): string {
  return crypto.randomUUID().replace('-', '');
}

export function computeEpochTime(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function computeJwtValidityInterval(deltaInMinutes: number): [number, number] {
  const issueTime = new Date();
  const expirationTime = new Date();
  expirationTime.setTime(issueTime.getTime() + deltaInMinutes * 60 * 1000);

  return [computeEpochTime(issueTime), computeEpochTime(expirationTime)];
}

export function buildAuditJwtPayload(config: Config): JwtPayload {
  const [issued, expires] = computeJwtValidityInterval(config.tokenValidityInMinutes);
  return {
    sub: config.clientID,
    jti: generateJti(),
    iat: issued,
    purposeId: config.purposeID,
    dnonce: generateDnonce(),
    userID: config.userID,
    userLocation: config.userLocation,
    LoA: config.LoA,
    nbf: issued,
    exp: expires,
    iss: config.clientID,
    aud: config.signatureAudience
  };
}

export function buildClientAssertionJwtPayload(
  encodedAuditJwtToken: string,
  config: Config
): JwtPayload {
  const [issued, expires] = computeJwtValidityInterval(config.tokenValidityInMinutes);
  return {
    sub: config.clientID,
    jti: generateJti(),
    iat: issued,
    purposeId: config.purposeID,
    digest: {
      alg: config.hashAlgorithm,
      value: encodedAuditJwtToken
    },
    nbf: issued,
    exp: expires,
    iss: config.clientID,
    aud: config.serviceAudience
  };
}

export function buildIntegrityJwtPayload(digest: string, config: Config): JwtPayload {
  const [issued, expires] = computeJwtValidityInterval(config.tokenValidityInMinutes);

  return {
    sub: config.clientID,
    jti: generateJti(),
    iat: issued,
    signed_headers: [
      { digest },
      { Accept: 'application/json' },
      { 'Content-Type': 'application/json' }
    ],
    nbf: issued,
    exp: expires,
    iss: config.clientID,
    aud: config.signatureAudience
  };
}

export function logVerbose(label: string, value: string | object, config: Config): void {
  if (config.verbose) {
    if (value instanceof String) {
      console.log(`${label}:\n\t${value}\n`);
    } else {
      console.log(`======= ${label} =======`);
      console.log(JSON.stringify(value, null, 4));
      console.log();
    }
  }
}
