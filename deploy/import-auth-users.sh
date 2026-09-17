#!/usr/bin/env bash
# Recreate auth users in self-hosted GoTrue from an export that has NO password hashes
# (the Supabase dashboard/API export omits encrypted_password).
#
#   bash deploy/import-auth-users.sh /root/makeatale-import/auth_users.json
#
# Input: JSON array of {id, email, email_confirm, user_metadata, app_metadata}.
# Each user is created with their ORIGINAL id (so profiles/api_keys/user_credits FKs line up) and a
# random unguessable password. Nobody can log in with an old password: users set a new one via the
# site's "forgot password" flow (needs SMTP on GoTrue) or an admin-generated recovery link:
#   curl -s -X POST http://127.0.0.1:8000/auth/v1/admin/generate_link \
#        -H "Authorization: Bearer $SERVICE_ROLE" -H "Content-Type: application/json" \
#        -d '{"type":"recovery","email":"user@example.com"}'
# The on_auth_user_created trigger creates a profiles row; run import.sql AFTER this to overwrite
# those stub profiles with the exported ones.
set -euo pipefail
IN="${1:?auth_users.json}"
GW="${GW:-http://127.0.0.1:8000}"
SR="$(python3 -c 'import json;print(json.load(open("/opt/supabase/keys.json"))["service_role"])')"

python3 - "$IN" <<'EOF' | while IFS= read -r line; do
import json, sys, secrets
for u in json.load(open(sys.argv[1])):
    u["password"] = secrets.token_urlsafe(32)
    u.setdefault("email_confirm", True)
    print(json.dumps(u))
EOF
  email="$(printf '%s' "$line" | python3 -c 'import json,sys;print(json.load(sys.stdin)["email"])')"
  code="$(curl -s -o /tmp/mat_user_resp.json -w '%{http_code}' -X POST "$GW/auth/v1/admin/users" \
    -H "Authorization: Bearer $SR" -H "apikey: $SR" -H "Content-Type: application/json" -d "$line")"
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo "created $email -> $(python3 -c 'import json;print(json.load(open("/tmp/mat_user_resp.json"))["id"])')"
  else
    echo "FAILED $email http=$code $(python3 -c 'import json;d=json.load(open("/tmp/mat_user_resp.json"));print(d.get("msg") or d.get("message") or d.get("error_description") or d)' 2>/dev/null)"
  fi
done
rm -f /tmp/mat_user_resp.json
unset SR
