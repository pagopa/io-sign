## English — Local testing with docker-compose

This guide explains how to run the whole workspace locally using `docker compose` and the scripts in the root `package.json`.

Prerequisites

- **Rancher Desktop** (recommended) or any Docker-compatible runtime (e.g. Docker Desktop, Colima, Podman). Make sure the container runtime can run `linux/amd64` images if required.
- **Node.js** and **pnpm** (you can enable `pnpm` via `corepack`).
- Enough disk space and CPU/RAM — the environment runs multiple services (Azurite, Cosmos emulator, EventHubs emulator, etc.).
- On macOS use a `zsh` terminal (commands in this file are for `zsh`).

Useful commands overview

- Generate env files for Docker: `pnpm run docker:generate:env`
- Build the Function images: `pnpm run docker:build`
- Start containers (detached): `pnpm run docker:start`
- Stop containers: `pnpm run docker:stop`
- Clean Docker resources to free space: `pnpm run docker:clean`

Detailed steps

1) Prepare per-function env files

  - Edit the `env-dev` files located under `docker/<function-name>/env-dev` (e.g. `docker/io-func-sign-user/env-dev`) to set local variables or test credentials.
  - If you need to change values common to all env files, update `docker/.env.common` before generating final envs.

2) Generate env files used by docker-compose

  - The script `docker:generate:env` merges the `env-dev` files with `docker/.env.common` and outputs final env files to `docker/generated`.
  - Run (from the repository root):

```zsh
pnpm run docker:generate:env
```

  - If you only want to initialize `docker/generated` without replacing values yet, run the pre-generate step:

```zsh
pnpm run docker:pregenerate:env
```

3) Build the Azure Functions Docker images

  - This builds the function images using the Dockerfile at `docker/function/Dockerfile`.

```zsh
pnpm run docker:build
```

4) Start the full environment

  - Start the services defined in `docker-compose.yml` in the background:

```zsh
pnpm run docker:start
```

  - Optionally follow container logs:

```zsh
docker compose --env-file docker/.env.common ps
docker compose --env-file docker/.env.common logs -f io-func-sign-user
```

5) Stop containers after finishing

```zsh
pnpm run docker:stop
```

6) Clean up to free space

```zsh
pnpm run docker:clean
```


Quick example (run from repository root):

```zsh
# Edit env-dev files if necessary
pnpm run docker:generate:env
pnpm run docker:build
pnpm run docker:start

# when done testing
pnpm run docker:stop
pnpm run docker:clean
```

---

# Italiano - Testare in locale con docker-compose

Questa guida descrive i passaggi per eseguire l'intero workspace in locale usando `docker compose` e gli script presenti nel `package.json` principale.

**Prerequisiti**

- **Rancher Desktop** (consigliato) o alternativa compatibile con container Docker (es. Docker Desktop, Colima, Podman). Assicurati che il runtime container sia configurato per supportare immagini `linux/amd64` se necessario.
- **Node.js** e **pnpm** (usa `corepack` per abilitare `pnpm` se necessario).
- Spazio su disco e risorse (più servizi vengono avviati: Azurite, Cosmos emulator, EventHubs emulator, ecc.).

**Panoramica dei comandi utili**

- Generare file env per Docker: `pnpm run docker:generate:env`
- Costruire le immagini per le Function: `pnpm run docker:build`
- Avviare i container (in background): `pnpm run docker:start`
- Fermare i container: `pnpm run docker:stop`
- Pulire Docker per liberare spazio: `pnpm run docker:clean`

Passaggi dettagliati

1) Preparare gli env di sviluppo per le singole function

	- Modifica i file `env-dev` presenti sotto `docker/<nome-function>/env-dev` (es. `docker/io-func-sign-user/env-dev`) per settare eventuali variabili locali o test credentials.
	- Se devi cambiare valori comuni a tutte le env, modifica `docker/.env.common` prima di generare gli env finali.

2) Generare gli env usati dal docker-compose

	- Lo script `docker:generate:env` usa i file `env-dev` e `docker/.env.common` per produrre gli env finali in `docker/generated`.
	- Esegui (nella root del repository):

```zsh
pnpm run docker:generate:env
```

	- Se vuoi solo inizializzare la cartella `docker/generated` senza sostituire ancora i valori, puoi lanciare lo step di pre-generazione:

```zsh
pnpm run docker:pregenerate:env
```

3) Costruire le immagini delle Azure Functions per il container

	- Costruisce le immagini Docker per le function usando il Dockerfile in `docker/function/Dockerfile`.

```zsh
pnpm run docker:build
```

4) Avviare l'ambiente completo

	- Avvia i servizi definiti in `docker-compose.yml` in background:

```zsh
pnpm run docker:start
```

	- Controlla i log dei container (opzionale):

```zsh
docker compose --env-file docker/.env.common ps
docker compose --env-file docker/.env.common logs -f io-func-sign-user
```

5) Fermare i container quando hai finito

```zsh
pnpm run docker:stop
```

6) Pulizia e liberare spazio

	- Dopo un lavoro di test, esegui la pulizia Docker per liberare spazio:

```zsh
pnpm run docker:clean
```


Esempio rapido (tutti i comandi da eseguire nella root del repository):

```zsh
# Modifica i file env-dev se necessario
pnpm run docker:generate:env
pnpm run docker:build
pnpm run docker:start

# al termine del test
pnpm run docker:stop
pnpm run docker:clean
```

