resource "auth0_resource_server" "golinks_api" {
  name       = var.api_name
  identifier = var.api_identifier
  signing_alg = "RS256"

  allow_offline_access                            = false
  token_lifetime                                  = 86400
  skip_consent_for_verifiable_first_party_clients = true
  enforce_policies                                = true
  token_dialect                                   = "access_token_authz"
}

resource "auth0_resource_server_scopes" "golinks_scopes" {
  resource_server_identifier = auth0_resource_server.golinks_api.identifier

  scopes {
    name        = "create:golinks"
    description = "Create new golinks"
  }
  scopes {
    name        = "read:golinks"
    description = "Read golinks"
  }
  scopes {
    name        = "update:golinks"
    description = "Update existing golinks"
  }
  scopes {
    name        = "delete:golinks"
    description = "Delete golinks"
  }
}
