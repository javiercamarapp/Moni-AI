# MONI AI - Database Structure Documentation

Complete database schema documentation with detailed diagrams for all subsystems.

---

## 1. Social & Friendships System

```mermaid
erDiagram
    profiles ||--o{ friendships : "user_id"
    profiles ||--o{ friendships : "friend_id"
    profiles ||--o{ friend_activity : "user_id"
    profiles ||--o{ friend_activity_reactions : "from_user_id"
    profiles ||--o{ friend_activity_reactions : "to_user_id"
    friend_activity ||--o{ friend_activity_reactions : "activity_id"
    profiles ||--o{ friend_challenges : "challenger_id"
    profiles ||--o{ friend_challenges : "challenged_id"

    friendships {
        uuid id PK
        uuid user_id FK
        uuid friend_id FK
        text status
        timestamp created_at
        timestamp updated_at
    }

    friend_activity {
        uuid id PK
        uuid user_id FK
        text activity_type
        text description
        integer xp_earned
        timestamp created_at
    }

    friend_activity_reactions {
        uuid id PK
        uuid activity_id FK
        uuid from_user_id FK
        uuid to_user_id FK
        text emoji
        timestamp created_at
    }

    friend_challenges {
        uuid id PK
        uuid challenger_id FK
        uuid challenged_id FK
        text challenge_type
        numeric target_amount
        date start_date
        date end_date
        text status
        uuid winner_id
        integer xp_reward
        timestamp created_at
        timestamp updated_at
    }
```

---

## 2. Circles & Community System

```mermaid
erDiagram
    profiles ||--o{ circles : "user_id"
    circles ||--o{ circle_members : "circle_id"
    profiles ||--o{ circle_members : "user_id"
    circles ||--o{ circle_goals : "circle_id"
    circle_goals ||--o{ circle_goal_members : "goal_id"
    profiles ||--o{ circle_goal_members : "user_id"
    circles ||--o{ circle_challenges : "circle_id"
    profiles ||--o{ circle_challenges : "created_by"
    circles ||--o{ circle_news : "circle_id"
    profiles ||--o{ circle_news : "user_id"

    circles {
        uuid id PK
        uuid user_id FK
        text name
        text description
        text category
        integer member_count
        timestamp created_at
        timestamp updated_at
    }

    circle_members {
        uuid id PK
        uuid circle_id FK
        uuid user_id FK
        integer xp
        text role
        timestamp joined_at
    }

    circle_goals {
        uuid id PK
        uuid circle_id FK
        text title
        text description
        text category
        text icon
        numeric target_amount
        date deadline
        date predicted_completion_date
        numeric required_weekly_saving
        numeric ai_confidence
        boolean is_public
        date start_date
        integer completed_members
        timestamp created_at
    }

    circle_goal_members {
        uuid id PK
        uuid goal_id FK
        uuid user_id FK
        numeric current_amount
        boolean completed
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }

    circle_challenges {
        uuid id PK
        uuid circle_id FK
        uuid created_by FK
        text title
        text description
        integer xp_reward
        boolean is_active
        timestamp created_at
    }

    circle_news {
        uuid id PK
        uuid circle_id FK
        uuid user_id FK
        text title
        text description
        text url
        text image_url
        timestamp published_at
        timestamp created_at
        timestamp updated_at
    }
```

---

## 3. Gamification System

```mermaid
erDiagram
    profiles ||--o{ user_badges : "user_id"
    badges ||--o{ user_badges : "badge_id"
    profiles ||--o{ user_daily_challenges : "user_id"
    daily_challenges ||--o{ user_daily_challenges : "challenge_id"
    profiles ||--o{ user_challenge_progress : "user_id"
    monthly_challenges ||--o{ user_challenge_progress : "challenge_id"
    profiles ||--o{ progress_feedback : "user_id"
    profiles ||--o{ user_levels : "user_id"

    badges {
        uuid id PK
        text name
        text description
        text icon
        text rarity
        text requirement_type
        text requirement_category
        integer requirement_value
        integer xp_reward
        timestamp created_at
    }

    user_badges {
        uuid id PK
        uuid user_id FK
        uuid badge_id FK
        timestamp earned_at
        timestamp created_at
    }

    daily_challenges {
        uuid id PK
        text title
        text description
        text challenge_type
        text category
        numeric target_amount
        integer xp_reward
        text difficulty
        text period
        numeric estimated_savings
        boolean is_personalized
        timestamp created_at
    }

    user_daily_challenges {
        uuid id PK
        uuid user_id FK
        uuid challenge_id FK
        boolean completed
        numeric progress
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }

    monthly_challenges {
        uuid id PK
        text title
        text description
        text category
        integer month
        integer year
        integer points
        timestamp created_at
        timestamp updated_at
    }

    user_challenge_progress {
        uuid id PK
        uuid user_id FK
        uuid challenge_id FK
        boolean completed
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }

    progress_feedback {
        uuid id PK
        uuid user_id FK
        text feedback_type
        text message
        jsonb data
        timestamp created_at
    }

    user_levels {
        uuid id PK
        uuid user_id FK
        integer current_level
        integer total_xp
        integer xp_to_next_level
        text level_title
        timestamp created_at
        timestamp updated_at
    }
```

---

## 4. Goals & Celebrations System

```mermaid
erDiagram
    profiles ||--o{ goals : "user_id"
    goals ||--o{ goal_activities : "goal_id"
    profiles ||--o{ goal_activities : "user_id"
    goals ||--o{ goal_comments : "goal_id"
    profiles ||--o{ goal_comments : "user_id"
    goal_comments ||--o{ goal_comment_mentions : "comment_id"
    profiles ||--o{ goal_comment_mentions : "mentioned_user_id"
    goal_comments ||--o{ goal_comment_reactions : "comment_id"
    profiles ||--o{ goal_comment_reactions : "user_id"
    goals ||--o{ goal_reactions : "goal_id"
    profiles ||--o{ goal_reactions : "user_id"
    goals ||--o{ goal_celebrations : "goal_id"
    profiles ||--o{ goal_celebrations : "user_id"
    goals ||--o{ goal_adjustments : "goal_id"
    profiles ||--o{ goal_adjustments : "user_id"
    circle_goals ||--o{ goal_group_adjustments : "goal_id"

    goals {
        uuid id PK
        uuid user_id FK
        text title
        text type
        text color
        text description
        text category
        text icon
        numeric target
        numeric current
        date deadline
        integer members
        date predicted_completion_date
        numeric required_daily_saving
        numeric required_weekly_saving
        numeric ai_confidence
        boolean is_public
        date start_date
        date last_contribution_date
        timestamp created_at
        timestamp updated_at
    }

    goal_activities {
        uuid id PK
        uuid goal_id FK
        uuid user_id FK
        text activity_type
        text message
        numeric amount
        timestamp created_at
    }

    goal_comments {
        uuid id PK
        uuid goal_id FK
        uuid user_id FK
        text comment
        text attachment_url
        text attachment_type
        uuid reply_to_id
        boolean is_pinned
        timestamp deleted_at
        timestamp created_at
    }

    goal_comment_mentions {
        uuid id PK
        uuid comment_id FK
        uuid mentioned_user_id FK
        timestamp created_at
    }

    goal_comment_reactions {
        uuid id PK
        uuid comment_id FK
        uuid user_id FK
        text emoji
        timestamp created_at
    }

    goal_reactions {
        uuid id PK
        uuid goal_id FK
        uuid user_id FK
        text reaction_type
        timestamp created_at
    }

    goal_celebrations {
        uuid id PK
        uuid goal_id FK
        uuid user_id FK
        text celebration_type
        text message
        jsonb metadata
        timestamp created_at
    }

    goal_adjustments {
        uuid id PK
        uuid goal_id FK
        uuid user_id FK
        numeric old_target
        numeric new_target
        date old_deadline
        date new_deadline
        text adjustment_reason
        timestamp created_at
    }

    goal_group_adjustments {
        uuid id PK
        uuid goal_id FK
        uuid user_id FK
        numeric old_weekly_amount
        numeric new_weekly_amount
        date old_predicted_date
        date new_predicted_date
        integer members_affected
        text adjustment_type
        text reason
        timestamp created_at
    }
```

---

## 5. Core Financial System

```mermaid
erDiagram
    profiles ||--o{ transactions : "user_id"
    profiles ||--o{ categories : "user_id"
    transactions }o--|| categories : "category_id"
    profiles ||--o{ category_budgets : "user_id"
    categories ||--o{ category_budgets : "category_id"
    profiles ||--o{ assets : "user_id"
    profiles ||--o{ pasivos : "user_id"
    profiles ||--o{ activos : "user_id"
    profiles ||--o{ net_worth_snapshots : "user_id"
    profiles ||--o{ user_aspirations : "user_id"
    profiles ||--o{ custom_aspirations : "user_id"

    transactions {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        text description
        numeric amount
        text type
        date transaction_date
        text payment_method
        text account
        text frequency
        timestamp created_at
        timestamp updated_at
    }

    categories {
        uuid id PK
        uuid user_id FK
        text name
        text type
        text color
        timestamp created_at
        timestamp updated_at
    }

    category_budgets {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        numeric monthly_budget
        timestamp created_at
        timestamp updated_at
    }

    assets {
        uuid id PK
        uuid user_id FK
        text name
        text category
        numeric value
        timestamp created_at
        timestamp updated_at
    }

    pasivos {
        uuid id PK
        uuid user_id FK
        text nombre
        text categoria
        text subcategoria
        text descripcion
        numeric valor
        numeric tasa_interes
        date fecha_inicio
        date fecha_vencimiento
        boolean es_corto_plazo
        text moneda
        timestamp created_at
        timestamp updated_at
    }

    activos {
        uuid id PK
        uuid user_id FK
        text nombre
        text categoria
        text subcategoria
        text descripcion
        numeric valor
        numeric rendimiento_anual
        date fecha_adquisicion
        boolean es_liquido
        text moneda
        timestamp created_at
        timestamp updated_at
    }

    net_worth_snapshots {
        uuid id PK
        uuid user_id FK
        date snapshot_date
        numeric net_worth
        numeric total_assets
        numeric total_liabilities
        timestamp created_at
    }

    user_aspirations {
        uuid id PK
        uuid user_id FK
        integer question_id
        numeric value
        timestamp created_at
        timestamp updated_at
    }

    custom_aspirations {
        uuid id PK
        uuid user_id FK
        text name
        text description
        numeric amount
        timestamp created_at
        timestamp updated_at
    }
```

---

## 6. Security & Banking System

```mermaid
erDiagram
    profiles ||--o{ security_audit_log : "user_id"
    profiles ||--o{ bank_connections : "user_id"

    security_audit_log {
        uuid id PK
        uuid user_id FK
        text action
        text status
        jsonb metadata
        text ip_address
        text user_agent
        timestamp timestamp
    }

    bank_connections {
        uuid id PK
        uuid user_id FK
        text bank_name
        text account_id
        text access_token
        text plaid_item_id
        timestamp last_sync
        timestamp created_at
        timestamp updated_at
    }
```

---

## 7. Notifications & Communication System

```mermaid
erDiagram
    profiles ||--o{ notification_settings : "user_id"
    profiles ||--o{ notification_history : "user_id"
    profiles ||--o{ whatsapp_users : "user_id"
    profiles ||--o{ whatsapp_messages : "user_id"

    notification_settings {
        uuid id PK
        uuid user_id FK
        boolean daily_summary
        boolean weekly_analysis
        boolean spending_alerts
        boolean savings_tips
        boolean goal_reminders
        numeric daily_spending_limit
        numeric transaction_alert_threshold
        time preferred_notification_time
        time quiet_hours_start
        time quiet_hours_end
        timestamp created_at
        timestamp updated_at
    }

    notification_history {
        uuid id PK
        uuid user_id FK
        text notification_type
        text message
        text status
        jsonb metadata
        timestamp sent_at
    }

    whatsapp_users {
        uuid id PK
        uuid user_id FK
        text phone_number
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    whatsapp_messages {
        uuid id PK
        uuid user_id FK
        text phone_number
        text message_text
        boolean processed
        uuid transaction_id
        jsonb ai_interpretation
        timestamp created_at
    }
```

---

## 8. Subscriptions & Referrals System

```mermaid
erDiagram
    profiles ||--o{ subscriptions : "user_id"
    profiles ||--o{ app_invitations : "inviter_user_id"
    profiles ||--o{ app_referrals : "inviter_user_id"
    profiles ||--o{ app_referrals : "invited_user_id"
    app_invitations ||--o{ app_referrals : "invite_code"

    subscriptions {
        uuid id PK
        uuid user_id FK
        text status
        text plan
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    app_invitations {
        uuid id PK
        uuid inviter_user_id FK
        text invite_code
        integer max_uses
        integer current_uses
        timestamp expires_at
        timestamp created_at
    }

    app_referrals {
        uuid id PK
        uuid inviter_user_id FK
        uuid invited_user_id FK
        text invite_code
        boolean xp_awarded
        timestamp created_at
    }
```

---

## 9. Competition Groups System

```mermaid
erDiagram
    profiles ||--o{ competition_groups : "created_by"
    competition_groups ||--o{ competition_group_members : "group_id"
    profiles ||--o{ competition_group_members : "user_id"

    competition_groups {
        uuid id PK
        uuid created_by FK
        text name
        text description
        boolean is_private
        timestamp created_at
        timestamp updated_at
    }

    competition_group_members {
        uuid id PK
        uuid group_id FK
        uuid user_id FK
        timestamp joined_at
    }
```

---

## 10. Additional Tables

```mermaid
erDiagram
    profiles ||--o{ groups : "user_id"
    profiles ||--o{ user_achievements : "user_id"
    profiles ||--o{ monthly_rankings : "user_id"
    profiles ||--o{ user_scores : "user_id"
    goals ||--o{ goal_insights_cache : "goal_id"

    groups {
        uuid id PK
        uuid user_id FK
        text name
        text description
        text color
        integer member_count
        timestamp created_at
        timestamp updated_at
    }

    user_achievements {
        uuid id PK
        uuid user_id FK
        integer achievement_id
        text achievement_name
        boolean unlocked
        timestamp unlocked_at
    }

    monthly_rankings {
        uuid id PK
        uuid user_id FK
        integer month
        integer year
        integer total_points
        integer challenges_completed
        integer rank
        timestamp created_at
        timestamp updated_at
    }

    user_scores {
        uuid id PK
        uuid user_id FK
        integer score
        jsonb breakdown
        timestamp calculated_at
        timestamp created_at
    }

    goal_insights_cache {
        uuid id PK
        uuid goal_id FK
        jsonb insights
        timestamp expires_at
        timestamp created_at
    }
```

---

## Quick Reference: Core User Profile

```mermaid
erDiagram
    profiles {
        uuid id PK
        text email
        text full_name
        text avatar_url
        text username
        integer xp
        integer level
        integer total_xp
        integer score_moni
        boolean level_quiz_completed
        boolean budget_quiz_completed
        timestamp created_at
        timestamp updated_at
    }
```

---

## View: Net Worth Summary

```sql
CREATE VIEW resumen_patrimonio AS
SELECT 
    user_id,
    total_activos,
    total_pasivos,
    (total_activos - total_pasivos) as patrimonio_neto
FROM ...
```

---

*Last updated: 2025*
*Generated from MONI AI database schema*
