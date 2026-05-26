output "auth0_domain" {
  value       = var.auth0_domain
  description = "Auth0 tenant domain"
}

output "auth0_audience" {
  value       = auth0_resource_server.golinks_api.identifier
  description = "API identifier / audience"
}

output "auth0_client_id" {
  value       = auth0_client.golinks.client_id
  description = "Application Client ID"
}

output "auth0_client_secret" {
  value       = auth0_client.golinks.client_secret
  sensitive   = true
  description = "Application Client Secret"
}

output "auth0_callback_url" {
  value       = "${var.app_base_url}/api/callback"
  description = "Configured callback URL"
}

output "cookie_domain" {
  value       = var.cookie_domain
  description = "Cookie domain for session cookies"
}
