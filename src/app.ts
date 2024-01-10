import * as crypto from 'crypto'
import * as jwt from 'jsonwebtoken'
import fetch from 'node-fetch'
import * as fs from 'fs'
import { type Config, type EivRequestBody, type AuthResponseBody, type EivResponseBody } from './types'
import * as Utils from './utils'

async function main(): Promise<void> {
  if (!fs.existsSync('./config.json')) {
    console.log('Please provide a valid configuration file (config.json). Exiting...')
    return
  }
  const config: Config = JSON.parse(fs.readFileSync('./config.json', 'utf8'))

  if (!fs.existsSync(config.keyLocation)) {
    console.log('No private key found at the location specified in the configuration file. Exiting...')
    return
  }

  const privateKey: string = fs.readFileSync(config.keyLocation, 'utf8')

  const eivRequestBody: EivRequestBody = {
    idOperazioneClient: Date.now().toString(),
    criteriRicerca: {
      codiceFiscale: config.codiceFiscale
    },
    datiRichiesta: {
      dataRiferimentoRichiesta: new Date().toISOString().split('T')[0],
      casoUso: 'C019',
      motivoRichiesta: 'Verifica esistenza in Vita'
    }
  }

  // These are the same for each JWT token to be signed
  const jwtOptions: jwt.SignOptions = {
    algorithm: 'RS256',
    header: {
      alg: 'RS256',
      typ: 'JWT',
      kid: config.keyID
    }
  }

  const auditJwtPayload: jwt.JwtPayload = Utils.buildAuditJwtPayload(config)
  Utils.logVerbose('AUDIT JWT (Agid-JWT-TrackingEvidence) PAYLOAD', auditJwtPayload, config)

  const auditJwt: string = jwt.sign(auditJwtPayload, privateKey, jwtOptions)

  const encodedAuditJwt: string | Buffer = crypto
    .createHash(config.hashAlgorithm)
    .setEncoding('utf8')
    .update(auditJwt)
    .digest('hex')

  const clientAssertionJwtPayload: jwt.JwtPayload = Utils.buildClientAssertionJwtPayload(encodedAuditJwt, config)
  Utils.logVerbose('CLIENT ASSERTION JWT PAYLOAD', clientAssertionJwtPayload, config)

  const clientAssertionJwt: string = jwt.sign(clientAssertionJwtPayload, privateKey, jwtOptions)

  const authRequestBody = {
    client_id: config.clientID,
    client_assertion: clientAssertionJwt,
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    grant_type: 'client_credentials'
  }

  const authRequestOptions = {
    method: 'POST',
    body: new URLSearchParams(authRequestBody),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  let voucher = ''

  await fetch(config.authURL, authRequestOptions)
    .then(async (res) => await res.json())
    .then((res: AuthResponseBody) => {
      Utils.logVerbose(`Response from ${config.authURL} (VOUCHER)`, res, config)
      voucher = res.access_token
    })
    .catch((err: string) => {
      console.error('error:' + err)
    })

  const encodedRequestBody: string | Buffer = crypto
    .createHash(config.hashAlgorithm)
    .setEncoding('utf8')
    .update(JSON.stringify(eivRequestBody))
    .digest('base64')

  const digest = `SHA-256=${encodedRequestBody}`
  const integrityJwtPayload: jwt.JwtPayload = Utils.buildIntegrityJwtPayload(digest, config)
  Utils.logVerbose('INTEGRITY JWT (Agid-JWT-Signature) PAYLOAD', integrityJwtPayload, config)

  const integrityJwt: string = jwt.sign(integrityJwtPayload, privateKey, jwtOptions)

  const eivRequestOptions = {
    method: 'POST',
    body: JSON.stringify(eivRequestBody),
    headers: {
      Authorization: `Bearer ${voucher}`,
      Accept: 'application/json',
      'Agid-JWT-Signature': integrityJwt,
      'Agid-JWT-TrackingEvidence': auditJwt,
      Digest: digest,
      'Content-Type': 'application/json'
    }
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  await fetch(config.serviceURL, eivRequestOptions)
    .then(async (res) => await res.json())
    .then((res: EivResponseBody) => {
      Utils.logVerbose(`Response from ${config.serviceURL} (ANPR - Esistenza In Vita)`, res, config)
      console.log(
        `Esito della verifica Esistenza In Vita (EIV): ${
          res.listaSoggetti.datiSoggetto.some((x) => x.infoSoggettoEnte.some((x) => x.valore === 'S'))
            ? 'POSITIVO'
            : 'NON POSITIVO'
        }`
      )
    })
    .catch((err: string) => {
      console.error('error:' + err)
    })
}

void main()
