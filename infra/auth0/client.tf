resource "auth0_client" "golinks" {
  name            = "${var.app_name} - Web Application"
  description     = "Next.js URL shortener application"
  app_type        = "regular_web"
  is_first_party  = true
  oidc_conformant = true

  callbacks           = ["${var.app_base_url}/api/callback"]
  allowed_logout_urls = [var.app_base_url]
  allowed_origins      = [var.app_base_url]
  web_origins         = [var.app_base_url]

  grant_types = [
    "authorization_code",
    "refresh_token",
  ]

  jwt_configuration {
    lifetime_in_seconds = 300
    secret_encoded      = false
    alg                 = "RS256"
  }

  refresh_token {
    rotation_type   = "rotating"
    expiration_type = "expiring"
    token_lifetime  = 2592000
  }
}
