CREATE TABLE consent_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consent_challenges_user_id ON consent_challenges(user_id);
CREATE INDEX idx_consent_challenges_expires_at ON consent_challenges(expires_at);

CREATE TABLE consent_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  challenge TEXT NOT NULL,
  action TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consent_log_user_id ON consent_log(user_id);
