-- ============================================
-- 009: Proctors can read exam_sessions linked to their test center
-- (Results tab + reporting). Depends on 008 adding test_center_session_id.
-- ============================================

DROP POLICY IF EXISTS "Test center admins can view linked exam sessions" ON exam_sessions;

CREATE POLICY "Test center admins can view linked exam sessions"
    ON exam_sessions
    FOR SELECT
    TO authenticated
    USING (
        test_center_session_id IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM test_center_sessions tcs
            WHERE tcs.id = exam_sessions.test_center_session_id
              AND tcs.admin_user_id = auth.uid()
        )
    );
