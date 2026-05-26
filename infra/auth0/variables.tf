variable "auth0_domain" {
  type        = string
  description = "Auth0 tenant domain (e.g. armand1m.eu.auth0.com)"
}

variable "auth0_client_id" {
  type        = string
  sensitive   = true
  description = "Client ID of the Machine-to-Machine application for Terraform"
}

variable "auth0_client_secret" {
  type        = string
  sensitive   = true
  description = "Client secret of the Machine-to-Machine application for Terraform"
}

variable "app_name" {
  type        = string
  default     = "golinks"
  description = "Display name for the application"
}

variable "app_base_url" {
  type        = string
  description = "Public base URL of the application (e.g. https://go.d1m.dev)"
}

variable "api_identifier" {
  type        = string
  description = "API identifier / audience (e.g. https://go.armand1m.dev/)"
}

variable "api_name" {
  type        = string
  default     = "GoLinks API"
  description = "Display name for the API"
}

variable "cookie_domain" {
  type        = string
  description = "Domain for session cookies (e.g. go.d1m.dev)"
}

variable "google_client_id" {
  type        = string
  sensitive   = true
  description = "Google OAuth2 client ID"
}

variable "google_client_secret" {
  type        = string
  sensitive   = true
  description = "Google OAuth2 client secret"
}
