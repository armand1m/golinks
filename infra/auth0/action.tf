resource "auth0_action" "add_custom_claims" {
  name = "Add Custom Claims to Access Token"

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }

  code = <<-EOT
    exports.onExecutePostLogin = async (event, api) => {
      const namespace = 'https://user';

      if (event.authorization) {
        api.accessToken.setCustomClaim(
          `${namespace}/roles`,
          event.authorization.roles
        );
      }
    };
  EOT

  deploy = true
}

resource "auth0_trigger_actions" "post_login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.add_custom_claims.id
    display_name = auth0_action.add_custom_claims.name
  }
}
