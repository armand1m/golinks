# golinks

This is my personal version of golinks built with Next.js and GraphQL.

The database is a PostgreSQL database, and the GraphQL API is generated using Postgraphile.

PostGraphile is then used as a module and served through Next.js routes itself, hence making CORS unnecessary.

## Developing

### Local Database with watch mode:

Start the database:

```sh
docker-compose up db -d
```

Prepare the project and run in development mode:

```sh
yarn
yarn dev
```

Access http://localhost:3000 and you should have a live
development environment running.

### Locally, with docker and local db:

```sh
docker-compose up
```

Access http://localhost:3000

### Locally, with docker and cloud sql db:

Create a file `run-cloud.sh` with the following template, modify and use it.

Don't forget to `chmod +x run-cloud.sh`.

```sh
#!/bin/bash

export GCP_KEY_PATH="~/cloud-sql-service-account.json"
export CLOUDSQL_INSTANCE="<gcp-project>:<gcp-region>:<cloud-sql-instance-name>=tcp:0.0.0.0:5432"
export DATABASE_USER="postgres"
export DATABASE_PASS="<some-password>"
export DATABASE_NAME="golinks"
export DATABASE_SCHEMA="public"

docker-compose -f ./docker-compose-cloud-sql.yml up
```

### Building docker image

```sh
docker build . -t armand1m/golinks
```

### Deploying to Kubernetes

> Make sure to change the manifests accordingly to your environment.

Check the `./kubernetes` folder for k8s manifests content.
These manifests deploy the application together with a `cloud_sql_proxy` sidecar to allow networking with Google Cloud SQL.

Create a deployment and service manifests:

```sh
kubectl apply -f ./kubernetes/deployment.yaml
kubectl apply -f ./kubernetes/service.yaml
```

#### Istio

> Make sure to change the manifests accordingly to your environment.

Create the virtual service and destination rules:

```sh
kubectl apply -f ./kubernetes/istio/virtual-service.yaml
kubectl apply -f ./kubernetes/istio/destination-rule.yaml
```
