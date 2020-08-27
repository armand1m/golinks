# golinks

This application is deployed at https://go.armand1m.dev

This is my personal version of Go Links built with [Next.js](https://nextjs.org/) and [GraphQL](http://graphql.org/).

<div style="max-width: 700px">
  <img src="./.github/redirect.gif?raw=true">
</div>

## Related

 - [golinks.ncsu.edu](https://golinks.ncsu.edu/)
 - [go.middlebury.edu](http://go.middlebury.edu/)
 - [brown.edu/go](https://ithelp.brown.edu/kb/articles/create-a-go-link-shortened-brown-url)
 - [github.com/kellegous/go](https://github.com/kellegous/go)
 - [The quick and simple guide to go links](https://www.trot.to/go-links)
 - [Google's go link culture](https://yiou.me/blog/posts/google-go-link)

## Feature Checklist

- [x] Create Links
- [x] Delete Links
- [ ] Edit Links
- [x] Redirect Links
- [x] Link Usage Count
- [x] Auth
- [x] Security
- [ ] Link Description
- [ ] Link Suggestion on 404
- [ ] Link Usage Time Series Metrics
- [ ] Link Ownership

## Deploying

A Docker Image is available at Docker Hub: https://hub.docker.com/r/armand1m/golinks

## Deploying to Kubernetes (GKE + Cloud SQL)

> Make sure to change the manifests accordingly to your environment.

Check the `./kubernetes` folder for k8s manifests content.
These manifests deploy the application together with a `cloud_sql_proxy` sidecar to allow networking with Google Cloud SQL.

Create a secret to keep the connection string:

```sh
kubectl create secret generic golinks-database \
  --from-literal=connectionstring='postgres://<user>:<pass>@<host>:5432/golinks'
```

Create a secret to keep the Cloud SQL service account:

```sh
kubectl create secret generic cloudsql-service-account \
  --from-file=service-account.json=./service-account.json
```

Create a deployment and service:

```sh
kubectl apply -f ./kubernetes/deployment.yaml
kubectl apply -f ./kubernetes/service.yaml
```

### Istio

> Make sure to change the manifests accordingly to your environment.

Create the virtual service and destination rules:

```sh
kubectl apply -f ./kubernetes/istio/virtual-service.yaml
kubectl apply -f ./kubernetes/istio/destination-rule.yaml
```

## Developing

armand1m/golinks is a Next.js app using GraphQL.

The database must be a [PostgreSQL 12.x](http://postgresql.org/) database as the GraphQL API is generated using [Postgraphile](https://www.graphile.org/postgraphile/). 

PostGraphile is then used as a NPM module and served through Next.js routes itself, so you don't have to worry about CORS, and the api is initialized together with the Next.js application.

GraphQL Type definitions are generated on application startup during development, so make sure your database executed the initialization scripts during startup as PostGraphile will infer them to the generate the `type-defs.graphqls` file. 

`graphql-let` then is used to generate type definitions in Typescript for development use.

### Local Database with watch mode:

Start the database:

```sh
docker-compose up -d db
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

### Cleaning Local Database

```sh
./clean-local-database.sh
```

### Building docker image

```sh
docker build . -t armand1m/golinks
```

## Stargazers

[![Stargazers over time](https://starchart.cc/armand1m/golinks.svg)](https://starchart.cc/armand1m/golinks)

## License

MIT © [Armando Magalhaes](https://github.com/armand1m)
