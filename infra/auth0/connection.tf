resource "auth0_connection" "google_oauth2" {
  name     = "google-oauth2"
  strategy = "google-oauth2"

  options {
    client_id                = var.google_client_id
    client_secret            = var.google_client_secret
    scopes                   = ["email", "profile"]
    set_user_root_attributes = "on_each_login"
  }
}

resource "auth0_connection_clients" "google_oauth2_clients" {
  connection_id   = auth0_connection.google_oauth2.id
  enabled_clients = [auth0_client.golinks.id]
}
