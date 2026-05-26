resource "auth0_role" "viewer" {
  name        = "viewer"
  description = "Can only read golinks"
}

resource "auth0_role_permissions" "viewer_permissions" {
  role_id = auth0_role.viewer.id

  permissions {
    name                       = "read:golinks"
    resource_server_identifier = auth0_resource_server.golinks_api.identifier
  }
}

resource "auth0_role" "editor" {
  name        = "editor"
  description = "Can create, read, update, and delete golinks"
}

resource "auth0_role_permissions" "editor_permissions" {
  role_id = auth0_role.editor.id

  permissions {
    name                       = "create:golinks"
    resource_server_identifier = auth0_resource_server.golinks_api.identifier
  }
  permissions {
    name                       = "read:golinks"
    resource_server_identifier = auth0_resource_server.golinks_api.identifier
  }
  permissions {
    name                       = "update:golinks"
    resource_server_identifier = auth0_resource_server.golinks_api.identifier
  }
  permissions {
    name                       = "delete:golinks"
    resource_server_identifier = auth0_resource_server.golinks_api.identifier
  }
}
