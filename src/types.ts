export interface Config {
  authURL: string
  clientID: string
  codiceFiscale: string
  hashAlgorithm: string
  keyID: string
  keyLocation: string
  LoA: string
  purposeID: string
  serviceAudience: string
  serviceURL: string
  signatureAudience: string
  tokenValidityInMinutes: number
  userID: string
  userLocation: string
  verbose: boolean
}

export interface AuthResponseBody {
  access_token: string
  expires_in: number
  token_type: string
}

export interface EivRequestBody {
  idOperazioneClient: string
  criteriRicerca: {
    codiceFiscale: string
  }
  datiRichiesta: {
    dataRiferimentoRichiesta: string
    casoUso: string
    motivoRichiesta: string
  }
}

export interface EivResponseBody {
  listaSoggetti: {
    datiSoggetto: Array<{
      generalita: {
        codiceFiscale: {
          codFiscale: string
          validitaCF: string
        }
        cognome: string
        dataNascita: string
        idSchedaSoggettoANPR: string
        luogoNascita: {
          comune: {
            codiceIstat: string
            nomeComune: string
            siglaProvinciaIstat: string
          }
        }
        nome: string
        sesso: string
      }
      identificativi: {
        idANPR: string
      }
      infoSoggettoEnte: Array<{
        chiave: string
        id: string
        valore: string
      }>
    }>
  }
  idOperazioneANPR: string
}
