-- ============================================================
-- HUB CONTROLO — RLS Policies for Coach Access
-- Run this AFTER the messenger migration in sete-ecos-pwa
-- ============================================================

-- Coach function: checks if the current user's email is a coach email
CREATE OR REPLACE FUNCTION is_coach()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) IN ('viv.saraiva@gmail.com', 'vivnasc@gmail.com', 'vivianne.saraiva@outlook.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- MESSENGER: Coach can see ALL conversations and messages
-- ============================================================

-- Conversations: coach sees all
CREATE POLICY "Coach sees all conversations"
  ON messenger_conversations FOR SELECT
  USING (is_coach());

-- Conversations: coach can update any (mark as read, etc.)
CREATE POLICY "Coach updates conversations"
  ON messenger_conversations FOR UPDATE
  USING (is_coach());

-- Messages: coach sees all messages
CREATE POLICY "Coach sees all messages"
  ON messenger_messages FOR SELECT
  USING (is_coach());

-- Messages: coach can send messages in any conversation
CREATE POLICY "Coach sends messages"
  ON messenger_messages FOR INSERT
  WITH CHECK (is_coach() AND sender_type = 'coach');

-- Messages: coach can update messages (mark as read)
CREATE POLICY "Coach updates messages"
  ON messenger_messages FOR UPDATE
  USING (is_coach());

-- ============================================================
-- VITALIS: Coach can see all client data
-- ============================================================

-- Users: coach sees all
CREATE POLICY "Coach sees all users"
  ON users FOR SELECT
  USING (is_coach());

-- Vitalis clients: coach sees all
CREATE POLICY "Coach sees all vitalis_clients"
  ON vitalis_clients FOR SELECT
  USING (is_coach());

-- Vitalis intake: coach sees all
CREATE POLICY "Coach sees all vitalis_intake"
  ON vitalis_intake FOR SELECT
  USING (is_coach());

-- Vitalis alerts: coach sees all
CREATE POLICY "Coach sees all vitalis_alerts"
  ON vitalis_alerts FOR SELECT
  USING (is_coach());

-- Vitalis alerts: coach can update (mark as read/resolved)
CREATE POLICY "Coach updates vitalis_alerts"
  ON vitalis_alerts FOR UPDATE
  USING (is_coach());

-- Vitalis checkins: coach sees all
CREATE POLICY "Coach sees all vitalis_checkins"
  ON vitalis_checkins FOR SELECT
  USING (is_coach());

-- ============================================================
-- AUREA: Coach can see all client data (if table exists)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'aurea_clients') THEN
    EXECUTE 'CREATE POLICY "Coach sees all aurea_clients" ON aurea_clients FOR SELECT USING (is_coach())';
  END IF;
END $$;
