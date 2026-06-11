# Auth0 Infrastructure with Terraform

This directory contains Terraform configuration to bootstrap and manage all Auth0 resources for the golinks application.

## What Gets Created

| Resource | Description |
|---|---|
| **API (Resource Server)** | GoLinks API with RS256 signing, RBAC enabled, and 4 permission scopes |
| **Application (Client)** | Regular Web Application with callback/logout URLs configured |
| **Roles** | `viewer` (read-only) and `editor` (full CRUD) with permission assignments |
| **Action** | Post-login action that adds `https://user/roles` custom claim to access tokens |
| **Connection** | Google OAuth2 social identity provider |

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.5
- An [Auth0](https://auth0.com/) account
- A [Google Cloud](https://cloud.google.com/) project with OAuth 2.0 credentials

## Setup

### 1. Create a Machine-to-Machine Application for Terraform

In the [Auth0 Dashboard](https://manage.auth0.com/):

1. Go to **Applications > Applications > Create Application**
2. Select **Machine to Machine Application**
3. Authorize it for the **Auth0 Management API** with these scopes:
   - `read:clients`, `create:clients`, `update:clients`, `delete:clients`
   - `read:resource_servers`, `create:resource_servers`, `update:resource_servers`, `delete:resource_servers`
   - `read:roles`, `create:roles`, `update:roles`, `delete:roles`
   - `read:actions`, `create:actions`, `update:actions`, `delete:actions`
   - `read:connections`, `create:connections`, `update:connections`, `delete:connections`
4. Copy the **Client ID** and **Client Secret** for the next step

### 2. Create Google OAuth2 Credentials

In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Create an **OAuth 2.0 Client ID** (Application type: Web application)
2. Add `https://<your-auth0-domain>/login/callback` as an authorized redirect URI
3. Copy the **Client ID** and **Client Secret** for the next step

### 3. Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and fill in your values:

- `auth0_domain` -- your Auth0 tenant domain
- `auth0_client_id` / `auth0_client_secret` -- from step 1
- `app_base_url` -- your app's public URL
- `api_identifier` -- audience for the API
- `cookie_domain` -- domain for session cookies
- `google_client_id` / `google_client_secret` -- from step 2

### 4. Apply

```bash
terraform init
terraform plan
terraform apply
```

### 5. Configure the Application

Use the Terraform outputs to set environment variables:

```bash
# View outputs (non-sensitive)
terraform output

# View sensitive outputs
terraform output -json | jq
```

Generate a cookie secret:

```bash
openssl rand -hex 32
```

Set these environment variables on your deployment:

```
AUTH0_ENABLED=true
AUTH0_DOMAIN=<from terraform output auth0_domain>
AUTH0_AUDIENCE=<from terraform output auth0_audience>
AUTH0_CLIENT_ID=<from terraform output auth0_client_id>
AUTH0_CLIENT_SECRET=<from terraform output auth0_client_secret>
AUTH0_COOKIE_SECRET=<generated with openssl>
AUTH0_COOKIE_DOMAIN=<from terraform output cookie_domain>
AUTH0_REDIRECT_URL=<from terraform output auth0_callback_url>
AUTH0_POST_LOGOUT_REDIRECT_URL=<your app_base_url>
```

### 6. Assign Roles to Users

After running `terraform apply`, assign users to roles via the Auth0 Dashboard:

1. Go to **User Management > Users**
2. Select a user
3. Go to the **Roles** tab
4. Assign the `viewer` or `editor` role

## File Structure

```
infra/auth0/
  main.tf                  -- provider configuration
  variables.tf             -- input variables
  api.tf                   -- API resource server + permission scopes
  client.tf                -- web application client
  connection.tf            -- Google OAuth2 social connection
  roles.tf                 -- roles + permission assignments
  action.tf                -- post-login action for custom claims
  outputs.tf               -- output values
  terraform.tfvars.example -- example variable values
  backend.tf               -- remote backend template (commented out)
```
